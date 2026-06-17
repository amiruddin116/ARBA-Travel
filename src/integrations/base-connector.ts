/**
 * Base interface for all ad platform connectors.
 * Each connector fetches daily metrics and upserts into ad_metrics.
 */

export interface DailyMetricsRow {
  date:         string;     // YYYY-MM-DD
  platform:     string;
  campaignId:   string;
  campaignName: string | null;
  adSetId:      string | null;
  adSetName:    string | null;
  impressions:  number;
  clicks:       number;
  spend:        number;     // IDR
  rawData:      Record<string, unknown>;
}

export interface SyncResult {
  recordsIn:  number;
  recordsOut: number;
  errors:     string[];
  durationMs: number;
}

export interface BaseConnector {
  platform:   string;
  /** Fetch and upsert metrics for the given date range (inclusive) */
  sync(startDate: string, endDate: string): Promise<SyncResult>;
}
