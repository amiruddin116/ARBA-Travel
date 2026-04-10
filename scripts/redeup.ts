#!/usr/bin/env npx tsx
/**
 * Re-runs deduplication on all existing leads in Neon WITHOUT re-pulling from MySQL.
 * Use this after changing dedup logic, without waiting for a full CRM sync.
 *
 * Usage:
 *   npx tsx scripts/redeup.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set in .env.local');

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 3 });

async function main() {
  const start = Date.now();
  console.log('[redeup] Starting dedup pass...\n');

  // 0. Reset all is_duplicate flags first (clean slate)
  const { count: reset } = await sql`
    UPDATE leads SET is_duplicate = FALSE, updated_at = NOW()
    WHERE is_duplicate = TRUE
  `.then((r) => ({ count: r.count }));
  console.log(`  Reset ${reset} previously-flagged duplicates`);

  // 1. No phone
  const { count: noPhone } = await sql`
    UPDATE leads SET is_duplicate = TRUE, updated_at = NOW()
    WHERE (dedup_key = '' OR dedup_key IS NULL)
      AND is_duplicate = FALSE
  `.then((r) => ({ count: r.count }));
  console.log(`  No phone:   ${noPhone} rows flagged`);

  // 2. Cancelled
  const { count: cancelled } = await sql`
    UPDATE leads SET is_duplicate = TRUE, updated_at = NOW()
    WHERE LOWER(status) = 'cancelled'
      AND is_duplicate = FALSE
  `.then((r) => ({ count: r.count }));
  console.log(`  Cancelled:  ${cancelled} rows flagged`);

  // 3a. Open records superseded by a closed record for same (phone + dest + type)
  const { count: openSuperseded } = await sql`
    UPDATE leads l
    SET is_duplicate = TRUE, updated_at = NOW()
    WHERE l.is_duplicate = FALSE
      AND NOT l.is_closed
      AND l.dedup_key != ''
      AND EXISTS (
        SELECT 1 FROM leads c
        WHERE c.dedup_key                 = l.dedup_key
          AND COALESCE(c.destinasi, '')   = COALESCE(l.destinasi, '')
          AND COALESCE(c.product_type,'') = COALESCE(l.product_type,'')
          AND c.is_closed                 = TRUE
          AND c.dedup_key                != ''
      )
  `.then((r) => ({ count: r.count }));
  console.log(`  Open superseded by closed: ${openSuperseded} rows flagged`);

  // 3b. Within closed records for same (phone + dest + type), keep earliest
  const { count: closedDups } = await sql`
    UPDATE leads l
    SET is_duplicate = TRUE, updated_at = NOW()
    WHERE l.is_duplicate = FALSE
      AND l.is_closed
      AND l.dedup_key != ''
      AND EXISTS (
        SELECT 1 FROM leads c
        WHERE c.dedup_key                 = l.dedup_key
          AND COALESCE(c.destinasi, '')   = COALESCE(l.destinasi, '')
          AND COALESCE(c.product_type,'') = COALESCE(l.product_type,'')
          AND c.is_closed                 = TRUE
          AND c.is_duplicate              = FALSE
          AND c.dedup_key                != ''
          AND c.id                       != l.id
          AND (
            c.lead_date < l.lead_date
            OR (c.lead_date = l.lead_date AND c.external_id < l.external_id)
          )
      )
  `.then((r) => ({ count: r.count }));
  console.log(`  Closed duplicates (same trip): ${closedDups} rows flagged`);

  // 4. Remaining open records per phone — keep earliest
  const { count: openDups } = await sql`
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
  `.then((r) => ({ count: r.count }));
  console.log(`  Open duplicates (same phone): ${openDups} rows flagged`);

  // 5. Update lead_date to MIN(lead_date) per phone on canonical records
  const { count: datesFixed } = await sql`
    UPDATE leads l
    SET lead_date  = sub.min_lead_date,
        updated_at = NOW()
    FROM (
      SELECT dedup_key, MIN(lead_date) AS min_lead_date
      FROM leads
      WHERE dedup_key != ''
      GROUP BY dedup_key
    ) sub
    WHERE l.dedup_key    = sub.dedup_key
      AND l.is_duplicate = FALSE
      AND l.lead_date   != sub.min_lead_date
  `.then((r) => ({ count: r.count }));
  console.log(`  lead_date corrected: ${datesFixed} canonical records updated`);

  // Summary
  const [summary] = await sql<{ total: string; dupes: string; unique_leads: string; closed: string }[]>`
    SELECT
      COUNT(*)                              AS total,
      COUNT(*) FILTER (WHERE is_duplicate)  AS dupes,
      COUNT(DISTINCT dedup_key)
        FILTER (WHERE NOT is_duplicate)     AS unique_leads,
      COUNT(*) FILTER (WHERE is_closed AND NOT is_duplicate) AS closed
    FROM leads
  `;

  console.log(`\n  ── Summary ──────────────────────────`);
  console.log(`  Total rows:    ${Number(summary.total).toLocaleString()}`);
  console.log(`  Duplicates:    ${Number(summary.dupes).toLocaleString()}`);
  console.log(`  Unique leads:  ${Number(summary.unique_leads).toLocaleString()}`);
  console.log(`  Closed leads:  ${Number(summary.closed).toLocaleString()}`);
  console.log(`  Duration:      ${((Date.now() - start) / 1000).toFixed(1)}s`);

  await sql.end();
}

main().catch((err) => { console.error('[redeup] Fatal:', err); process.exit(1); });
