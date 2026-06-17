/**
 * Meta (Facebook/Instagram) Ads connector — fetches daily campaign performance.
 *
 * Prerequisites:
 *   - META_APP_ID, META_APP_SECRET
 *   - META_AD_ACCOUNT_ID  (e.g. "act_123456789")
 *   - OAuth token saved to platform_tokens via /api/integrations/meta/callback
 */

import axios from 'axios';
import { getToken, saveToken, isTokenExpired } from '@/integrations/token-store';
import { upsertAdMetrics } from '@/integrations/upsert-metrics';
import type { BaseConnector, DailyMetricsRow, SyncResult } from '@/integrations/base-connector';

const PLATFORM    = 'meta';
const GRAPH_URL   = 'https://graph.facebook.com/v19.0';

async function getAccessToken(): Promise<string> {
  const stored = await getToken(PLATFORM);
  if (!stored) throw new Error('Meta: no token stored. Connect via /api/integrations/meta/connect');
  if (!isTokenExpired(stored)) return stored.accessToken;

  // Exchange for long-lived token
  const resp = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
    params: {
      grant_type:        'fb_exchange_token',
      client_id:         process.env.META_APP_ID,
      client_secret:     process.env.META_APP_SECRET,
      fb_exchange_token: stored.accessToken,
    },
  });

  const newToken = resp.data.access_token as string;
  const expiresIn: number = resp.data.expires_in ?? 5183944;

  await saveToken({
    ...stored,
    accessToken: newToken,
    expiresAt:   new Date(Date.now() + expiresIn * 1000),
  });

  return newToken;
}

async function fetchCampaignMetrics(startDate: string, endDate: string): Promise<DailyMetricsRow[]> {
  const accessToken = await getAccessToken();
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  if (!adAccountId) throw new Error('Missing META_AD_ACCOUNT_ID');

  const resp = await axios.get(`${GRAPH_URL}/${adAccountId}/insights`, {
    params: {
      access_token:  accessToken,
      level:         'adset',
      fields:        'campaign_id,campaign_name,adset_id,adset_name,impressions,clicks,spend',
      time_range:    JSON.stringify({ since: startDate, until: endDate }),
      time_increment: 1,  // daily breakdowns
      limit:         500,
    },
  });

  const rows: DailyMetricsRow[] = [];
  for (const item of (resp.data?.data ?? [])) {
    rows.push({
      date:         item.date_start ?? startDate,
      platform:     PLATFORM,
      campaignId:   String(item.campaign_id ?? ''),
      campaignName: item.campaign_name ?? null,
      adSetId:      String(item.adset_id ?? ''),
      adSetName:    item.adset_name ?? null,
      impressions:  Number(item.impressions ?? 0),
      clicks:       Number(item.clicks ?? 0),
      spend:        parseFloat(item.spend ?? '0'),
      rawData:      item,
    });
  }
  return rows;
}

export const metaConnector: BaseConnector = {
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
