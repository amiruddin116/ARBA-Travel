/**
 * Maps a raw CRM ad_id value to a normalized channel string.
 *
 * The ad_id column in attcrm.Fresh is the sole attribution source.
 * Actual patterns must be verified after the first sync by inspecting:
 *   SELECT DISTINCT ad_id FROM attcrm.Fresh ORDER BY ad_id;
 *
 * Update the patterns below once real data is available.
 */
export function mapAdIdToChannel(adId: string | null | undefined): string {
  if (!adId || adId.trim() === '') return 'unattributed';

  const id = adId.trim().toUpperCase();

  if (id.startsWith('GA-') || id.startsWith('GADS-') || id.startsWith('GOOGLE')) {
    return 'google_ads';
  }
  if (
    id.startsWith('FB-') ||
    id.startsWith('META-') ||
    id.startsWith('IG-') ||
    id.startsWith('FACEBOOK')
  ) {
    return 'meta';
  }
  if (id.startsWith('TT-') || id.startsWith('TIKTOK')) {
    return 'tiktok';
  }
  if (id.startsWith('ORG-') || id.startsWith('SEO') || id.startsWith('ORGANIC')) {
    return 'organic';
  }

  return 'unattributed';
}

export const CHANNELS = ['google_ads', 'meta', 'tiktok', 'organic', 'unattributed'] as const;
export type Channel = (typeof CHANNELS)[number];
