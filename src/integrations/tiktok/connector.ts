/**
 * TikTok Ads connector — fetches daily campaign performance.
 *
 * Prerequisites:
 *   - TIKTOK_APP_ID, TIKTOK_APP_SECRET
 *   - TIKTOK_ADVERTISER_ID
 *   - OAuth token saved to platform_tokens via /api/integrations/tiktok/callback
 *
 * TikTok Marketing API v1.3
 */

import axios from 'axios';
import { getToken, saveToken, isTokenExpired } from '@/integrations/token-store';
import { upsertAdMetrics } from '@/integrations/upsert-metrics';
import type { BaseConnector, DailyMetricsRow, SyncResult } from '@/integrations/base-connector';

const PLATFORM = 'tiktok';
const API_URL  = 'https://business-api.tiktok.com/open_api/v1.3';

async function getAccessToken(): Promise<string> {
  const stored = await getToken(PLATFORM);
  if (!stored) throw new Error('TikTok: no token stored. Connect via /api/integrations/tiktok/connect');
  if (!isTokenExpired(stored)) return stored.accessToken;

  // TikTok tokens are long-lived (up to 1 year); no standard refresh endpoint
  // Re-authorization is required when expired
  throw new Error('TikTok access token expired — re-connect via /api/integrations/tiktok/connect');
}

async function fetchCampaignMetrics(startDate: string, endDate: string): Promise<DailyMetricsRow[]> {
  const accessToken  = await getAccessToken();
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
  if (!advertiserId) throw new Error('Missing TIKTOK_ADVERTISER_ID');

  const resp = await axios.get(`${API_URL}/report/integrated/get/`, {
    headers: {
      'Access-Token': accessToken,
    },
    params: {
      advertiser_id:   advertiserId,
      report_type:     'BASIC',
      dimensions:      JSON.stringify(['campaign_id', 'adgroup_id', 'stat_time_day']),
      metrics:         JSON.stringify(['campaign_name', 'adgroup_name', 'impressions', 'clicks', 'spend']),
      start_date:      startDate,
      end_date:        endDate,
      page_size:       1000,
    },
  });

  const rows: DailyMetricsRow[] = [];
  for (const item of (resp.data?.data?.list ?? [])) {
    const dims    = item.dimensions ?? {};
    const metrics = item.metrics ?? {};
    rows.push({
      date:         dims.stat_time_day?.slice(0, 10) ?? startDate,
      platform:     PLATFORM,
      campaignId:   String(dims.campaign_id ?? ''),
      campaignName: metrics.campaign_name ?? null,
      adSetId:      String(dims.adgroup_id ?? ''),
      adSetName:    metrics.adgroup_name ?? null,
      impressions:  Number(metrics.impressions ?? 0),
      clicks:       Number(metrics.clicks ?? 0),
      spend:        parseFloat(metrics.spend ?? '0'),
      rawData:      item,
    });
  }
  return rows;
}

export const tiktokConnector: BaseConnector = {
  platform: PLATFORM,

  async sync(startDate, endDate): Promise<SyncResult> {
    const start = Date.now();
    const errors: string[] = [];

    const rows = await fetchCampaignMetrics(startDate, endDate).catch((err) => {
      errors.push(String(err));
      return [] as DailyMetricsRow[];
    });

    const recordsOut = await upsertAdMetrics(rows);
    return { recordsIn: rows.length, recordsOut, errors, durationMs: Date.now() - start };
  },
};
