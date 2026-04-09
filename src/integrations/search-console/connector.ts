/**
 * Google Search Console connector — fetches daily query/page performance.
 *
 * Prerequisites:
 *   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   - SEARCH_CONSOLE_SITE_URL  (e.g. "https://arbatravel.com/")
 *   - OAuth token saved to platform_tokens via /api/integrations/google-ads/callback
 *     (reuses the same Google OAuth token as Google Ads)
 */

import { google } from 'googleapis';
import { getToken, saveToken, isTokenExpired } from '@/integrations/token-store';
import { sql } from '@/lib/db';
import type { SyncResult } from '@/integrations/base-connector';

const PLATFORM  = 'search_console';
const GADS_PLAT = 'google_ads'; // shares OAuth token with Google Ads

async function getOAuth2Client() {
  // Try search_console-specific token first; fall back to google_ads token
  let stored = await getToken(PLATFORM) ?? await getToken(GADS_PLAT);
  if (!stored) throw new Error('Search Console: no Google token found. Connect Google Ads first.');

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({
    access_token:  stored.accessToken,
    refresh_token: stored.refreshToken ?? undefined,
    expiry_date:   stored.expiresAt?.getTime(),
  });

  if (isTokenExpired(stored)) {
    const { credentials } = await oauth2.refreshAccessToken();
    await saveToken({
      ...stored,
      platform:    stored.platform,
      accessToken: credentials.access_token!,
      expiresAt:   credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    });
    oauth2.setCredentials(credentials);
  }

  return oauth2;
}

async function upsertSeoMetrics(rows: {
  date: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  country: string | null;
  device: string | null;
  rawData: Record<string, unknown>;
}[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    await sql`
      INSERT INTO seo_metrics (date, query, page, clicks, impressions, ctr, position, country, device, raw_data, synced_at, updated_at)
      VALUES (
        ${row.date}, ${row.query}, ${row.page},
        ${row.clicks}, ${row.impressions}, ${row.ctr}, ${row.position},
        ${row.country}, ${row.device},
        ${JSON.stringify(row.rawData)}, NOW(), NOW()
      )
      ON CONFLICT (date, query, page) DO UPDATE SET
        clicks      = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        ctr         = EXCLUDED.ctr,
        position    = EXCLUDED.position,
        raw_data    = EXCLUDED.raw_data,
        synced_at   = NOW(),
        updated_at  = NOW()
    `;
    count++;
  }
  return count;
}

export const searchConsoleConnector = {
  platform: PLATFORM,

  async sync(startDate: string, endDate: string): Promise<SyncResult> {
    const start    = Date.now();
    const errors:  string[] = [];
    const siteUrl  = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('Missing SEARCH_CONSOLE_SITE_URL');

    const auth = await getOAuth2Client();
    const sc   = google.searchconsole({ version: 'v1', auth });

    const resp = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions:       ['query', 'page', 'country', 'device'],
        rowLimit:         25000,
        dataState:        'all',
      },
    });

    const apiRows = resp.data.rows ?? [];
    const rows = apiRows.map((r) => ({
      date:        startDate, // GSC doesn't return date in row when using dimensions without 'date'
      query:       r.keys?.[0] ?? '',
      page:        r.keys?.[1] ?? '',
      country:     r.keys?.[2] ?? null,
      device:      r.keys?.[3] ?? null,
      clicks:      r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr:         r.ctr ?? 0,
      position:    r.position ?? 0,
      rawData:     r as Record<string, unknown>,
    }));

    const recordsOut = await upsertSeoMetrics(rows).catch((err) => {
      errors.push(String(err));
      return 0;
    });

    return { recordsIn: rows.length, recordsOut, errors, durationMs: Date.now() - start };
  },
};
