export interface KpiFilters {
  startDate?:   string;  // YYYY-MM-DD
  endDate?:     string;  // YYYY-MM-DD
  destinasi?:   string;
  productType?: string;
  channel?:     string;
  // tier intentionally omitted — no source yet
}

export interface LeadKpis {
  leads:         number;
  closedLeads:   number;
  closedPax:     number;
  cpl:           number | null;  // cost per lead (IDR)
  cpp:           number | null;  // cost per pax (IDR)
  crPct:         number | null;  // conversion rate %
  averagePax:    number | null;  // avg pax per closed lead
}

export interface AdSpendSummary {
  totalSpend:   number;  // IDR
  impressions:  number;
  clicks:       number;
  ctr:          number | null;
}

export interface DailyLeadPoint {
  date:        string;
  leads:       number;
  closedLeads: number;
}

export interface DailySpendPoint {
  date:    string;
  spend:   number;
  clicks:  number;
}

export interface ChannelBreakdown {
  channel:     string;
  leads:       number;
  closedLeads: number;
  spend:       number;
  cpl:         number | null;
  cpp:         number | null;
}
