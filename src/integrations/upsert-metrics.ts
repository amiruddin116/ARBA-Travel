/**
 * Shared upsert helper for ad_metrics rows.
 */

import { sql } from '@/lib/db';
import type { DailyMetricsRow } from './base-connector';

export async function upsertAdMetrics(rows: DailyMetricsRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    await sql`
      INSERT INTO ad_metrics (
        date, platform, campaign_id, campaign_name,
        ad_set_id, ad_set_name,
        impressions, clicks, spend, currency,
        raw_data, synced_at, updated_at
      ) VALUES (
        ${row.date}, ${row.platform}, ${row.campaignId}, ${row.campaignName},
        ${row.adSetId}, ${row.adSetName},
        ${row.impressions}, ${row.clicks}, ${row.spend}, 'IDR',
        ${JSON.stringify(row.rawData)}, NOW(), NOW()
      )
      ON CONFLICT (date, platform, campaign_id) DO UPDATE SET
        campaign_name = EXCLUDED.campaign_name,
        ad_set_id     = EXCLUDED.ad_set_id,
        ad_set_name   = EXCLUDED.ad_set_name,
        impressions   = EXCLUDED.impressions,
        clicks        = EXCLUDED.clicks,
        spend         = EXCLUDED.spend,
        raw_data      = EXCLUDED.raw_data,
        synced_at     = NOW(),
        updated_at    = NOW()
    `;
    count++;
  }
  return count;
}
