/**
 * One-shot setup script:
 *  1. Creates all schema tables in Neon (IF NOT EXISTS — won't touch 'fresh')
 *  2. Transforms data from the existing 'fresh' table → 'leads'
 *     (avoids re-syncing from MySQL, which takes ~101 min)
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- tsx scripts/setup-db.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 3 });

async function createTables() {
  console.log('[setup] Creating schema tables...');
  const schema = readFileSync(join(process.cwd(), 'src/db/schema.sql'), 'utf8');
  await sql.unsafe(schema);
  console.log('[setup] Tables created.\n');
}

async function checkFreshExists(): Promise<boolean> {
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'fresh'
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

async function countLeads(): Promise<number> {
  const rows = await sql<{ count: string }[]>`SELECT COUNT(*) AS count FROM leads`;
  return Number(rows[0]?.count ?? 0);
}

async function migrateFromFresh() {
  console.log('[setup] Migrating data from fresh → leads...');

  // Batch insert from fresh into leads using SQL transformation
  // Column mapping based on confirmed attcrm.Fresh schema
  await sql`
    INSERT INTO leads (
      external_id, status, is_closed, pax_count,
      destinasi, product_type, tier,
      channel, ad_id, is_attributed,
      dedup_key, lead_date, closed_date,
      raw_data, synced_at, created_at, updated_at
    )
    SELECT
      id::text                                    AS external_id,
      COALESCE(status, '')                        AS status,
      status IN ('Closed', 'Modified', 'Payment') AS is_closed,

      -- pax = adult + child + childnb (infant excluded)
      COALESCE(NULLIF(adult, '')::int, 0) +
      COALESCE(NULLIF(child, '')::int, 0) +
      COALESCE(NULLIF(childnb, '')::int, 0)       AS pax_count,

      NULLIF(TRIM(destination), '')               AS destinasi,
      NULLIF(TRIM(type), '')                      AS product_type,
      NULLIF(TRIM(level), '')                     AS tier,

      -- channel from ad_id / utm_source
      CASE
        WHEN ad_id IS NOT NULL AND ad_id != '' AND (
          UPPER(ad_id) LIKE '%GOOGLE%' OR UPPER(ad_id) LIKE 'GA-%' OR UPPER(ad_id) LIKE 'GADS-%'
        ) THEN 'google_ads'
        WHEN ad_id IS NOT NULL AND ad_id != '' AND (
          UPPER(ad_id) LIKE '%FACEBOOK%' OR UPPER(ad_id) LIKE 'FB-%'
          OR UPPER(ad_id) LIKE '%META%' OR UPPER(ad_id) LIKE 'IG-%'
        ) THEN 'meta'
        WHEN ad_id IS NOT NULL AND ad_id != '' AND (
          UPPER(ad_id) LIKE '%TIKTOK%' OR UPPER(ad_id) LIKE 'TT-%'
        ) THEN 'tiktok'
        WHEN ad_id IS NOT NULL AND ad_id != '' THEN 'other_paid'
        WHEN LOWER(utm_source) LIKE '%google%' THEN 'google_ads'
        WHEN LOWER(utm_source) LIKE '%facebook%' OR LOWER(utm_source) LIKE '%meta%'
          OR LOWER(utm_source) LIKE '%instagram%' THEN 'meta'
        WHEN LOWER(utm_source) LIKE '%tiktok%' THEN 'tiktok'
        WHEN LOWER(utm_source) IN ('organic', 'seo') THEN 'organic'
        ELSE 'unattributed'
      END                                         AS channel,

      NULLIF(TRIM(ad_id), '')                     AS ad_id,
      (ad_id IS NOT NULL AND ad_id != '')         AS is_attributed,

      -- dedup_key: normalize phone
      REGEXP_REPLACE(
        CASE
          WHEN phone ~ '^62' THEN '0' || SUBSTR(phone, 3)
          ELSE phone
        END,
        '[^0-9]', '', 'g'
      )                                           AS dedup_key,

      -- lead_date from timestamp column
      DATE("timestamp")                           AS lead_date,

      -- closed_date: closed_time first, fall back to approve_closed_time
      CASE
        WHEN status IN ('Closed', 'Modified', 'Payment')
        THEN COALESCE(DATE(closed_time), DATE(approve_closed_time))
        ELSE NULL
      END                                         AS closed_date,

      row_to_json(f.*)                            AS raw_data,
      NOW()                                       AS synced_at,
      NOW()                                       AS created_at,
      NOW()                                       AS updated_at

    FROM fresh f
    WHERE id IS NOT NULL
    ON CONFLICT (external_id) DO NOTHING
  `;

  const total = await countLeads();
  console.log(`[setup] Migration done. ${total.toLocaleString()} rows in leads.\n`);
}

async function main() {
  try {
    await createTables();

    const freshExists = await checkFreshExists();
    if (!freshExists) {
      console.log('[setup] No fresh table found — skipping migration.');
      console.log('[setup] Run `npm run sync:crm:full` to populate leads from MySQL.\n');
    } else {
      const existingLeads = await countLeads();
      if (existingLeads > 0) {
        console.log(`[setup] leads table already has ${existingLeads.toLocaleString()} rows — skipping migration.`);
      } else {
        await migrateFromFresh();
      }
    }

    console.log('[setup] Done. Now run: npm run rededup');
  } finally {
    await sql.end();
  }
}

main().catch((err) => { console.error('[setup] Fatal:', err); process.exit(1); });
