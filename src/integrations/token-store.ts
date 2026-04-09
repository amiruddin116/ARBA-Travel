/**
 * Persists and retrieves OAuth tokens for ad platforms in the platform_tokens table.
 */

import { sql } from '@/lib/db';

export interface TokenRecord {
  platform:     string;
  accessToken:  string;
  refreshToken: string | null;
  expiresAt:    Date | null;
  scope:        string | null;
  metadata:     Record<string, unknown>;
}

export async function getToken(platform: string): Promise<TokenRecord | null> {
  const rows = await sql<{
    platform: string;
    access_token: string;
    refresh_token: string | null;
    expires_at: Date | null;
    scope: string | null;
    metadata: Record<string, unknown>;
  }[]>`
    SELECT platform, access_token, refresh_token, expires_at, scope, metadata
    FROM platform_tokens
    WHERE platform = ${platform}
    LIMIT 1
  `;

  if (!rows[0]) return null;
  const r = rows[0];
  return {
    platform:     r.platform,
    accessToken:  r.access_token,
    refreshToken: r.refresh_token,
    expiresAt:    r.expires_at,
    scope:        r.scope,
    metadata:     r.metadata,
  };
}

export async function saveToken(token: TokenRecord): Promise<void> {
  await sql`
    INSERT INTO platform_tokens (platform, access_token, refresh_token, expires_at, scope, metadata, updated_at)
    VALUES (
      ${token.platform},
      ${token.accessToken},
      ${token.refreshToken},
      ${token.expiresAt?.toISOString() ?? null},
      ${token.scope},
      ${JSON.stringify(token.metadata)},
      NOW()
    )
    ON CONFLICT (platform) DO UPDATE SET
      access_token  = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at    = EXCLUDED.expires_at,
      scope         = EXCLUDED.scope,
      metadata      = EXCLUDED.metadata,
      updated_at    = NOW()
  `;
}

export function isTokenExpired(token: TokenRecord): boolean {
  if (!token.expiresAt) return false;
  // Consider expired if less than 5 minutes remain
  return token.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
}
