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
 * After upserting, mark all but the earliest record per dedup_key as duplicates.
 *
 * "Earliest" = lowest lead_date, then lowest external_id as tie-breaker.
 */
async function markDuplicates(): Promise<void> {
  await sql`
    UPDATE leads l
    SET is_duplicate = TRUE,
        updated_at   = NOW()
    WHERE is_duplicate = FALSE
      AND EXISTS (
        SELECT 1 FROM leads earlier
        WHERE earlier.dedup_key  = l.dedup_key
          AND earlier.dedup_key != ''
          AND (
            earlier.lead_date < l.lead_date
            OR (earlier.lead_date = l.lead_date AND earlier.external_id < l.external_id)
          )
          AND earlier.id != l.id
      )
  `;

  // Reset any records that were previously marked duplicate but are now the earliest
  await sql`
    UPDATE leads l
    SET is_duplicate = FALSE,
        updated_at   = NOW()
    WHERE is_duplicate = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM leads earlier
        WHERE earlier.dedup_key  = l.dedup_key
          AND earlier.dedup_key != ''
          AND (
            earlier.lead_date < l.lead_date
            OR (earlier.lead_date = l.lead_date AND earlier.external_id < l.external_id)
          )
          AND earlier.id != l.id
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
  const query = lastSync
    ? `SELECT * FROM attcrm.Fresh WHERE updated_at > ? ORDER BY updated_at ASC`
    : `SELECT * FROM attcrm.Fresh ORDER BY created_at ASC`;

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
