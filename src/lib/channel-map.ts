/**
 * Maps CRM attribution fields → normalized channel string.
 *
 * Priority order:
 *   1. ad_id   — most specific (set when lead comes from a specific ad)
 *   2. utm_source / utm_medium — fallback when ad_id is absent
 *   3. 'unattributed' — nothing matched
 *
 * ad_id patterns must be verified against real data after first sync:
 *   SELECT DISTINCT ad_id FROM attcrm.Fresh WHERE ad_id IS NOT NULL AND ad_id != '' LIMIT 100;
 *
 * utm_source patterns to verify similarly:
 *   SELECT DISTINCT utm_source, utm_medium FROM attcrm.Fresh LIMIT 100;
 */

export function mapAdIdToChannel(
  adId:      string | null | undefined,
  utmSource: string | null | undefined,
  utmMedium: string | null | undefined,
): string {
  // ── 1. Try ad_id first ─────────────────────────────────────────────────────
  if (adId && adId.trim() !== '') {
    const id = adId.trim().toUpperCase();

    if (id.includes('GOOGLE') || id.startsWith('GA-') || id.startsWith('GADS-')) {
      return 'google_ads';
    }
    if (
      id.includes('FACEBOOK') || id.includes('FB-') ||
      id.includes('META') || id.includes('INSTAGRAM') || id.startsWith('IG-')
    ) {
      return 'meta';
    }
    if (id.includes('TIKTOK') || id.startsWith('TT-')) {
      return 'tiktok';
    }

    // ad_id present but pattern not recognised — still attributed, mark as 'other_paid'
    return 'other_paid';
  }

  // ── 2. Fallback to utm_source / utm_medium ─────────────────────────────────
  const src = (utmSource ?? '').trim().toLowerCase();
  const med = (utmMedium ?? '').trim().toLowerCase();

  if (src.includes('google') || src === 'adwords') {
    return med === 'organic' ? 'organic' : 'google_ads';
  }
  if (src.includes('facebook') || src.includes('fb') || src.includes('instagram') || src === 'meta') {
    return 'meta';
  }
  if (src.includes('tiktok')) {
    return 'tiktok';
  }
  if (src === 'organic' || med === 'organic' || src === 'seo') {
    return 'organic';
  }

  return 'unattributed';
}

export const CHANNELS = [
  'google_ads',
  'meta',
  'tiktok',
  'organic',
  'other_paid',
  'unattributed',
] as const;

export type Channel = (typeof CHANNELS)[number];
