/**
 * CRM sync: pulls from MySQL attcrm.Fresh, upserts into PostgreSQL leads.
 *
 * Designed to run:
 *   - Locally via `npx tsx scripts/sync-crm.ts` (Phase 1)
 *   - On a VPS cron job (Phase 2)
 *
 * Does NOT import anything from Next.js — safe to run as a standalone script.
 */

import { crmDb } from '@/lib/crm-db';
import { sql }   from '@/lib/db';
import { transformFreshRow, type FreshRow, type LeadRow } from './transform';

export interface SyncResult {
  recordsIn:  number;
  recordsOut: number;
  errors:     string[];
  durationMs: number;
}

/** Fetch the timestamp of the last successful CRM sync from sync_logs */
async function getLastSyncTime(): Promise<Date | null> {
  const rows = await sql<{ started_at: Date }[]>`
    SELECT started_at
    FROM sync_logs
    WHERE source = 'arba_crm' AND status = 'success'
    ORDER BY started_at DESC
    LIMIT 1
  `;
  return rows[0]?.started_at ?? null;
}

/** Upsert a batch of lead rows into PostgreSQL */
async function upsertLeads(leads: LeadRow[]): Promise<number> {
  if (leads.length === 0) return 0;

  let count = 0;
  for (const lead of leads) {
    await sql`
      INSERT INTO leads (
        external_id, status, is_closed, pax_count,
        destinasi, product_type, tier,
        channel, ad_id, is_attributed,
        dedup_key, lead_date, closed_date,
        raw_data, synced_at, updated_at
      ) VALUES (
        ${lead.externalId}, ${lead.status}, ${lead.isClosed}, ${lead.paxCount},
        ${lead.destinasi}, ${lead.productType}, ${lead.tier},
        ${lead.channel}, ${lead.adId}, ${lead.isAttributed},
        ${lead.dedupKey}, ${lead.leadDate}, ${lead.closedDate},
        ${JSON.stringify(lead.rawData)}, NOW(), NOW()
      )
      ON CONFLICT (external_id) DO UPDATE SET
        status        = EXCLUDED.status,
        is_closed     = EXCLUDED.is_closed,
        pax_count     = EXCLUDED.pax_count,
        destinasi     = EXCLUDED.destinasi,
        product_type  = EXCLUDED.product_type,
        tier          = EXCLUDED.tier,
        channel       = EXCLUDED.channel,
        ad_id         = EXCLUDED.ad_id,
        is_attributed = EXCLUDED.is_attributed,
        dedup_key     = EXCLUDED.dedup_key,
        closed_date   = EXCLUDED.closed_date,
        raw_data      = EXCLUDED.raw_data,
        synced_at     = NOW(),
        updated_at    = NOW()
    `;
    count++;
  }
  return count;
}

/**
 * Deduplication rules (in priority order):
 *
 * 1. No phone (dedup_key = '')          → is_duplicate = TRUE (not a real lead)
 * 2. Status = 'Cancelled'               → is_duplicate = TRUE
 * 3. Per (phone + destinasi + product_type) group:
 *    - If any closed record exists → mark all open records in that group as duplicate
 *    - Within closed records → keep earliest by lead_date (external_id tiebreaker); rest = duplicate
 * 4. Per phone across remaining open records:
 *    - Keep earliest by lead_date; rest = duplicate
 *
 * After dedup:
 * 5. Update lead_date on all canonical records to the MIN lead_date for that phone
 *    (so lead_date = first ever inquiry, even if a later closed record is the canonical one)
 *
 * KPI implications:
 * - Unique leads (CPL denominator) = COUNT(DISTINCT dedup_key) WHERE NOT is_duplicate
 * - Closed leads / pax             = COUNT/SUM WHERE is_closed AND NOT is_duplicate
 *   (same person with 2 different trips = 2 closed lead rows, 1 unique lead person)
 */
async function markDuplicates(): Promise<void> {
  // 1. No phone
  await sql`
    UPDATE leads SET is_duplicate = TRUE, updated_at = NOW()
    WHERE (dedup_key = '' OR dedup_key IS NULL)
      AND is_duplicate = FALSE
  `;

  // 2. Cancelled status
  await sql`
    UPDATE leads SET is_duplicate = TRUE, updated_at = NOW()
    WHERE LOWER(status) = 'cancelled'
      AND is_duplicate = FALSE
  `;

  // 3a. Within each (phone + destinasi + product_type): if closed record exists,
  //     mark all open records in that group as duplicate
  await sql`
    UPDATE leads l
    SET is_duplicate = TRUE, updated_at = NOW()
    WHERE l.is_duplicate = FALSE
      AND NOT l.is_closed
      AND l.dedup_key != ''
      AND EXISTS (
        SELECT 1 FROM leads c
        WHERE c.dedup_key                       = l.dedup_key
          AND COALESCE(c.destinasi, '')          = COALESCE(l.destinasi, '')
          AND COALESCE(c.product_type, '')       = COALESCE(l.product_type, '')
          AND c.is_closed                        = TRUE
          AND c.dedup_key                       != ''
      )
  `;

  // 3b. Within closed records for same (phone + destinasi + product_type),
  //     keep the earliest; mark the rest as duplicate
  await sql`
    UPDATE leads l
    SET is_duplicate = TRUE, updated_at = NOW()
    WHERE l.is_duplicate = FALSE
      AND l.is_closed
      AND l.dedup_key != ''
      AND EXISTS (
        SELECT 1 FROM leads c
        WHERE c.dedup_key                       = l.dedup_key
          AND COALESCE(c.destinasi, '')          = COALESCE(l.destinasi, '')
          AND COALESCE(c.product_type, '')       = COALESCE(l.product_type, '')
          AND c.is_closed                        = TRUE
          AND c.is_duplicate                     = FALSE
          AND c.dedup_key                       != ''
          AND c.id                              != l.id
          AND (
            c.lead_date < l.lead_date
            OR (c.lead_date = l.lead_date AND c.external_id < l.external_id)
          )
      )
  `;

  // 4. Among remaining open records, keep earliest per phone; rest = duplicate
  await sql`
    UPDATE leads l
    SET is_duplicate = TRUE, updated_at = NOW()
    WHERE l.is_duplicate = FALSE
      AND NOT l.is_closed
      AND l.dedup_key != ''
      AND EXISTS (
        SELECT 1 FROM leads c
        WHERE c.dedup_key   = l.dedup_key
          AND NOT c.is_closed
          AND c.is_duplicate = FALSE
          AND c.dedup_key   != ''
          AND c.id          != l.id
          AND (
            c.lead_date < l.lead_date
            OR (c.lead_date = l.lead_date AND c.external_id < l.external_id)
          )
      )
  `;

  // 5. Update lead_date on all canonical records to the MIN lead_date for that phone.
  //    This ensures lead_date = first ever inquiry, even if a closed record is kept.
  await sql`
    UPDATE leads l
    SET lead_date  = sub.min_lead_date,
        updated_at = NOW()
    FROM (
      SELECT dedup_key, MIN(lead_date) AS min_lead_date
      FROM leads
      WHERE dedup_key != ''
      GROUP BY dedup_key
    ) sub
    WHERE l.dedup_key      = sub.dedup_key
      AND l.is_duplicate   = FALSE
      AND l.lead_date     != sub.min_lead_date
  `;

  // Reset: un-mark any records incorrectly flagged (safety pass for incremental syncs)
  await sql`
    UPDATE leads l
    SET is_duplicate = FALSE, updated_at = NOW()
    WHERE l.is_duplicate = TRUE
      AND l.dedup_key   != ''
      AND LOWER(l.status) != 'cancelled'
      AND NOT EXISTS (
        -- Should remain duplicate only if a better canonical exists
        SELECT 1 FROM leads c
        WHERE c.dedup_key                       = l.dedup_key
          AND COALESCE(c.destinasi, '')          = COALESCE(l.destinasi, '')
          AND COALESCE(c.product_type, '')       = COALESCE(l.product_type, '')
          AND c.is_duplicate                     = FALSE
          AND c.id                              != l.id
          AND LOWER(c.status)                   != 'cancelled'
      )
  `;
}

/** Write a sync_log entry */
async function writeSyncLog(
  result: Omit<SyncResult, 'durationMs'> & { status: string; startedAt: Date },
): Promise<void> {
  await sql`
    INSERT INTO sync_logs (source, status, records_in, records_out, error_msg, started_at, finished_at)
    VALUES (
      'arba_crm',
      ${result.status},
      ${result.recordsIn},
      ${result.recordsOut},
      ${result.errors.length > 0 ? result.errors.join('; ') : null},
      ${result.startedAt.toISOString()},
      NOW()
    )
  `;
}

export async function syncCrm(fullSync = false): Promise<SyncResult> {
  const startedAt = new Date();
  const errors: string[] = [];
  let recordsIn  = 0;
  let recordsOut = 0;

  const lastSync = fullSync ? null : await getLastSyncTime();

  // Fetch from MySQL — incremental (since last sync) or full
  // Use `timestamp` column (confirmed field name for lead creation date)
  const query = lastSync
    ? `SELECT * FROM attcrm.Fresh WHERE timestamp > ? ORDER BY timestamp ASC`
    : `SELECT * FROM attcrm.Fresh ORDER BY timestamp ASC`;

  const [rows] = lastSync
    ? await crmDb.execute(query, [lastSync])
    : await crmDb.execute(query);

  const freshRows = rows as FreshRow[];
  recordsIn = freshRows.length;

  const leads: LeadRow[] = [];
  for (const row of freshRows) {
    try {
      leads.push(transformFreshRow(row));
    } catch (err) {
      errors.push(`Transform error for id=${row['id']}: ${String(err)}`);
    }
  }

  recordsOut = await upsertLeads(leads);
  await markDuplicates();

  const status = errors.length === 0 ? 'success' : recordsOut > 0 ? 'partial' : 'error';
  await writeSyncLog({ status, recordsIn, recordsOut, errors, startedAt });

  return {
    recordsIn,
    recordsOut,
    errors,
    durationMs: Date.now() - startedAt.getTime(),
  };
}
