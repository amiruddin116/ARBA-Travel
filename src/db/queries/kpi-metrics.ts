/**
 * KPI query functions — CPL, CPP, CR%, Average Pax.
 *
 * All lead counts exclude duplicates (WHERE NOT is_duplicate).
 * "Closed" = is_closed = TRUE (mapped from Status IN ('Modified', 'Payment', 'Closed')).
 * pax_count = adult + child + child_no_bed (infant excluded — handled at transform time).
 *
 * CPL  = total ad spend / total leads
 * CPP  = total ad spend / total closed pax
 * CR%  = closed leads / leads × 100
 * Avg Pax = closed pax / closed leads
 */

import { sql } from '@/lib/db';
import type { KpiFilters, LeadKpis, DailyLeadPoint, DailySpendPoint, ChannelBreakdown } from '@/types/metrics';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function leadWhere(f: KpiFilters) {
  const conditions: string[] = ['NOT is_duplicate'];
  if (f.startDate)   conditions.push(`lead_date >= '${f.startDate}'`);
  if (f.endDate)     conditions.push(`lead_date <= '${f.endDate}'`);
  if (f.destinasi)   conditions.push(`destinasi = '${f.destinasi.replace(/'/g, "''")}'`);
  if (f.productType) conditions.push(`product_type = '${f.productType.replace(/'/g, "''")}'`);
  if (f.channel)     conditions.push(`channel = '${f.channel.replace(/'/g, "''")}'`);
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function spendWhere(f: KpiFilters) {
  const conditions: string[] = [];
  if (f.startDate) conditions.push(`date >= '${f.startDate}'`);
  if (f.endDate)   conditions.push(`date <= '${f.endDate}'`);
  if (f.channel) {
    // Map channel → platform name in ad_metrics
    const platformMap: Record<string, string> = {
      google_ads: 'google_ads',
      meta:       'meta',
      tiktok:     'tiktok',
    };
    const platform = platformMap[f.channel];
    if (platform) conditions.push(`platform = '${platform}'`);
    else return null; // organic/unattributed has no ad spend
  }
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

// ─── Main KPI function ────────────────────────────────────────────────────────

export async function getLeadKpis(filters: KpiFilters = {}): Promise<LeadKpis> {
  const lw = leadWhere(filters);
  const sw = spendWhere(filters);

  const [leadRows, spendRows] = await Promise.all([
    sql<{ leads: string; closed_leads: string; closed_pax: string }[]>`
      SELECT
        COUNT(*)                              AS leads,
        COUNT(*) FILTER (WHERE is_closed)     AS closed_leads,
        COALESCE(SUM(pax_count) FILTER (WHERE is_closed), 0) AS closed_pax
      FROM leads
      ${sql.unsafe(lw)}
    `,
    sw !== null
      ? sql<{ total_spend: string }[]>`
          SELECT COALESCE(SUM(spend), 0) AS total_spend
          FROM ad_metrics
          ${sql.unsafe(sw ?? '')}
        `
      : Promise.resolve([{ total_spend: '0' }]),
  ]);

  const leads       = Number(leadRows[0]?.leads       ?? 0);
  const closedLeads = Number(leadRows[0]?.closed_leads ?? 0);
  const closedPax   = Number(leadRows[0]?.closed_pax   ?? 0);
  const totalSpend  = Number(spendRows[0]?.total_spend  ?? 0);

  return {
    leads,
    closedLeads,
    closedPax,
    cpl:        leads > 0 && totalSpend > 0         ? totalSpend / leads       : null,
    cpp:        closedPax > 0 && totalSpend > 0      ? totalSpend / closedPax   : null,
    crPct:      leads > 0                            ? (closedLeads / leads) * 100 : null,
    averagePax: closedLeads > 0                      ? closedPax / closedLeads  : null,
  };
}

// ─── Time-series ──────────────────────────────────────────────────────────────

export async function getDailyLeads(filters: KpiFilters = {}): Promise<DailyLeadPoint[]> {
  const lw = leadWhere(filters);
  const rows = await sql<{ date: string; leads: string; closed_leads: string }[]>`
    SELECT
      lead_date                                      AS date,
      COUNT(*)                                       AS leads,
      COUNT(*) FILTER (WHERE is_closed)              AS closed_leads
    FROM leads
    ${sql.unsafe(lw)}
    GROUP BY lead_date
    ORDER BY lead_date ASC
  `;
  return rows.map((r) => ({
    date:        r.date,
    leads:       Number(r.leads),
    closedLeads: Number(r.closed_leads),
  }));
}

export async function getDailySpend(filters: KpiFilters = {}): Promise<DailySpendPoint[]> {
  const sw = spendWhere(filters);
  if (sw === null) return [];
  const rows = await sql<{ date: string; spend: string; clicks: string }[]>`
    SELECT
      date,
      COALESCE(SUM(spend),  0) AS spend,
      COALESCE(SUM(clicks), 0) AS clicks
    FROM ad_metrics
    ${sql.unsafe(sw ?? '')}
    GROUP BY date
    ORDER BY date ASC
  `;
  return rows.map((r) => ({
    date:   r.date,
    spend:  Number(r.spend),
    clicks: Number(r.clicks),
  }));
}

// ─── Channel breakdown ────────────────────────────────────────────────────────

export async function getChannelBreakdown(filters: KpiFilters = {}): Promise<ChannelBreakdown[]> {
  // Base filters without channel (we group BY channel)
  const baseFilters = { ...filters };
  delete baseFilters.channel;
  const lw = leadWhere(baseFilters);
  const sw = spendWhere(baseFilters);

  const [leadRows, spendRows] = await Promise.all([
    sql<{ channel: string; leads: string; closed_leads: string; closed_pax: string }[]>`
      SELECT
        COALESCE(channel, 'unattributed')             AS channel,
        COUNT(*)                                       AS leads,
        COUNT(*) FILTER (WHERE is_closed)              AS closed_leads,
        COALESCE(SUM(pax_count) FILTER (WHERE is_closed), 0) AS closed_pax
      FROM leads
      ${sql.unsafe(lw)}
      GROUP BY channel
      ORDER BY leads DESC
    `,
    sw !== null
      ? sql<{ platform: string; total_spend: string }[]>`
          SELECT platform, COALESCE(SUM(spend), 0) AS total_spend
          FROM ad_metrics
          ${sql.unsafe(sw ?? '')}
          GROUP BY platform
        `
      : Promise.resolve([]),
  ]);

  const spendByChannel: Record<string, number> = {};
  for (const s of spendRows) {
    spendByChannel[s.platform] = Number(s.total_spend);
  }

  return leadRows.map((r) => {
    const leads       = Number(r.leads);
    const closedLeads = Number(r.closed_leads);
    const closedPax   = Number(r.closed_pax);
    const spend       = spendByChannel[r.channel] ?? 0;
    return {
      channel:     r.channel,
      leads,
      closedLeads,
      spend,
      cpl: leads > 0 && spend > 0      ? spend / leads      : null,
      cpp: closedPax > 0 && spend > 0  ? spend / closedPax  : null,
    };
  });
}

// ─── Filter dimension values ──────────────────────────────────────────────────

export async function getDistinctDestinasi(): Promise<string[]> {
  const rows = await sql<{ destinasi: string }[]>`
    SELECT DISTINCT destinasi FROM leads WHERE destinasi IS NOT NULL ORDER BY destinasi
  `;
  return rows.map((r) => r.destinasi);
}

export async function getDistinctProductTypes(): Promise<string[]> {
  const rows = await sql<{ product_type: string }[]>`
    SELECT DISTINCT product_type FROM leads WHERE product_type IS NOT NULL ORDER BY product_type
  `;
  return rows.map((r) => r.product_type);
}
