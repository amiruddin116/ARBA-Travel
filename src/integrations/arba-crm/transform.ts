/**
 * Maps a raw row from MySQL attcrm.Fresh → a leads table row.
 *
 * Column names confirmed from existing scripts (sync_mf_sales.py, mf_revenue_pulse.py, update_overview.py).
 *
 * Still needs confirmation from DESCRIBE attcrm.Fresh:
 *   - Primary key column name (assumed 'id')
 *   - Phone column name for dedup_key (assumed 'phone' — UPDATE IF WRONG)
 *   - ad_id column for marketing attribution (assumed 'ad_id' — UPDATE IF WRONG)
 *   - Lead creation date column (assumed 'created_at' — UPDATE IF WRONG)
 */

import { mapAdIdToChannel } from '@/lib/channel-map';

// ─── CRM column names ─────────────────────────────────────────────────────────
const RAW_FIELD_MAP = {
  id:          'id',           // lead primary key — CONFIRM COLUMN NAME
  status:      'status',       // confirmed: 'Closed' | 'Modified' | 'Payment'
  phone:       'phone',        // phone number for dedup_key — CONFIRM COLUMN NAME
  adult:       'adult',        // confirmed: stored as string
  child:       'child',        // confirmed: stored as string
  childNoBed:  'childnb',      // confirmed: 'childnb' (NOT child_no_bed)
  // infant intentionally excluded from pax_count per business rule
  destination: 'destination',  // confirmed: 'destination' (e.g. "HCM", "BKK", "BCN")
  productType: 'type',         // confirmed: 'type' (JT, PT, ST, CT, BT, UH-PT, UH-GT, IT)
  tier:        'level',        // confirmed: 'level' (airline/service: Batik Air, Emirates, etc.)
  adId:        'ad_id',        // marketing attribution — CONFIRM COLUMN NAME
  leadDate:    'created_at',   // lead creation date — CONFIRM COLUMN NAME
  closedTime:  'closed_time',  // confirmed: primary closed timestamp
  approveClosedTime: 'approve_closed_time', // confirmed: fallback when closed_time is NULL
} as const;

// Statuses that count as "closed" for KPI purposes (confirmed from existing scripts)
export const CLOSED_STATUSES = new Set(['Modified', 'Payment', 'Closed']);

// ─── Phone normalization ───────────────────────────────────────────────────────
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let phone = raw.replace(/[\s\-().+]/g, '');  // strip spaces, dashes, parens, dots, plus
  if (phone.startsWith('62')) phone = '0' + phone.slice(2);
  return phone;
}

// ─── Row type from MySQL ───────────────────────────────────────────────────────
export interface FreshRow {
  [key: string]: unknown;
}

// ─── Transformed row for PostgreSQL leads table ────────────────────────────────
export interface LeadRow {
  externalId:   string;
  status:       string;
  isClosed:     boolean;
  paxCount:     number;
  destinasi:    string | null;
  productType:  string | null;
  tier:         string | null;  // airline/service level from 'level' column
  channel:      string;
  adId:         string | null;
  isAttributed: boolean;
  dedupKey:     string;
  leadDate:     string;         // ISO date string YYYY-MM-DD
  closedDate:   string | null;  // ISO date string YYYY-MM-DD or null
  rawData:      FreshRow;
}

function toDateStr(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toInt(val: unknown): number {
  const n = parseInt(String(val ?? 0), 10);
  return isNaN(n) ? 0 : n;
}

export function transformFreshRow(row: FreshRow): LeadRow {
  const status     = String(row[RAW_FIELD_MAP.status] ?? '');
  const isClosed   = CLOSED_STATUSES.has(status);

  // pax_count = adult + child + childnb (infant excluded per business rule)
  const adult      = toInt(row[RAW_FIELD_MAP.adult]);
  const child      = toInt(row[RAW_FIELD_MAP.child]);
  const childNoBed = toInt(row[RAW_FIELD_MAP.childNoBed]);
  const paxCount   = adult + child + childNoBed;

  const rawAdId    = row[RAW_FIELD_MAP.adId];
  const adId       = rawAdId ? String(rawAdId).trim() : null;
  const channel    = mapAdIdToChannel(adId);
  const isAttributed = channel !== 'unattributed';

  const phone    = String(row[RAW_FIELD_MAP.phone] ?? '');
  const dedupKey = normalizePhone(phone);

  const leadDate = toDateStr(row[RAW_FIELD_MAP.leadDate]) ?? new Date().toISOString().slice(0, 10);

  // closed_time is primary; fall back to approve_closed_time if NULL
  const closedDate = isClosed
    ? (toDateStr(row[RAW_FIELD_MAP.closedTime]) ?? toDateStr(row[RAW_FIELD_MAP.approveClosedTime]))
    : null;

  const tier = row[RAW_FIELD_MAP.tier] ? String(row[RAW_FIELD_MAP.tier]) : null;

  return {
    externalId:  String(row[RAW_FIELD_MAP.id]),
    status,
    isClosed,
    paxCount,
    destinasi:   row[RAW_FIELD_MAP.destination] ? String(row[RAW_FIELD_MAP.destination]) : null,
    productType: row[RAW_FIELD_MAP.productType]  ? String(row[RAW_FIELD_MAP.productType])  : null,
    tier,
    channel,
    adId,
    isAttributed,
    dedupKey,
    leadDate,
    closedDate,
    rawData:     row,
  };
}
