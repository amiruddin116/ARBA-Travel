/**
 * Google Ads connector — fetches daily campaign performance.
 *
 * Prerequisites:
 *   - GOOGLE_ADS_DEVELOPER_TOKEN
 *   - GOOGLE_ADS_MANAGER_CUSTOMER_ID
 *   - GOOGLE_ADS_CUSTOMER_ID  (the actual account, not manager)
 *   - OAuth token saved to platform_tokens via /api/integrations/google-ads/callback
 *
 * Google Ads API uses OAuth 2.0. The access token is stored in platform_tokens
 * and refreshed automatically when expired.
 */

import axios from 'axios';
import { google } from 'googleapis';
import { getToken, saveToken, isTokenExpired } from '@/integrations/token-store';
import { upsertAdMetrics } from '@/integrations/upsert-metrics';
import type { BaseConnector, DailyMetricsRow, SyncResult } from '@/integrations/base-connector';

const PLATFORM = 'google_ads';
const GAQL_ENDPOINT = 'https://googleads.googleapis.com/v17/customers';

async function getAccessToken(): Promise<string> {
  const stored = await getToken(PLATFORM);
  if (!stored) throw new Error('Google Ads: no token stored. Connect via /api/integrations/google-ads/connect');

  if (!isTokenExpired(stored)) return stored.accessToken;

  // Refresh
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: stored.refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();

  await saveToken({
    platform:     PLATFORM,
    accessToken:  credentials.access_token!,
    refreshToken: credentials.refresh_token ?? stored.refreshToken,
    expiresAt:    credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    scope:        stored.scope,
    metadata:     stored.metadata,
  });

  return credentials.access_token!;
}

async function fetchCampaignMetrics(startDate: string, endDate: string): Promise<DailyMetricsRow[]> {
  const accessToken  = await getAccessToken();
  const customerId   = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const devToken     = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const managerCid   = process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID;

  if (!customerId || !devToken) {
    throw new Error('Missing GOOGLE_ADS_CUSTOMER_ID or GOOGLE_ADS_DEVELOPER_TOKEN');
  }

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM ad_group
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY segments.date ASC
  `;

  const headers: Record<string, string> = {
    Authorization:          `Bearer ${accessToken}`,
    'developer-token':      devToken,
    'Content-Type':         'application/json',
  };
  if (managerCid) headers['login-customer-id'] = managerCid;

  const response = await axios.post(
    `${GAQL_ENDPOINT}/${customerId}/googleAds:searchStream`,
    { query },
    { headers },
  );

  const rows: DailyMetricsRow[] = [];
  for (const batch of response.data) {
    for (const result of (batch.results ?? [])) {
      const spendMicros = Number(result.metrics?.costMicros ?? 0);
      rows.push({
        date:         result.segments?.date ?? startDate,
        platform:     PLATFORM,
        campaignId:   String(result.campaign?.id ?? ''),
        campaignName: result.campaign?.name ?? null,
        adSetId:      String(result.adGroup?.id ?? ''),
        adSetName:    result.adGroup?.name ?? null,
        impressions:  Number(result.metrics?.impressions ?? 0),
        clicks:       Number(result.metrics?.clicks ?? 0),
        spend:        spendMicros / 1_000_000, // micros → currency units (USD → convert if needed)
        rawData:      result,
      });
    }
  }
  return rows;
}

export const googleAdsConnector: BaseConnector = {
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
