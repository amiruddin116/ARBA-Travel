/**
 * Maps a raw row from MySQL attcrm.Fresh → a leads table row.
 *
 * IMPORTANT: Column names below are best-guess defaults.
 * Run `DESCRIBE attcrm.Fresh` on the CRM database and update the
 * field names in the RAW_FIELD_MAP below if they differ.
 *
 * Known fields to verify:
 *   - Phone column name (used for dedup_key)
 *   - Pax columns: adult, child, child_no_bed (infant is excluded from pax_count)
 *   - Status column name and the exact string values for closed statuses
 *   - Date columns: lead creation date, closed/updated date
 *   - ad_id column name
 */

import { mapAdIdToChannel } from '@/lib/channel-map';

// ─── CRM column names (update after DESCRIBE attcrm.Fresh) ────────────────────
const RAW_FIELD_MAP = {
  id:           'id',            // lead primary key
  status:       'Status',        // lead status string
  phone:        'NoHp',          // phone number — used for dedup_key
  adult:        'adult',         // adult pax count
  child:        'child',         // child pax count
  childNoBed:   'child_no_bed',  // child no bed pax count (infant excluded)
  destinasi:    'Destinasi',     // travel destination
  productType:  'Paket',         // package / product type
  adId:         'ad_id',         // attribution ad ID
  leadDate:     'created_at',    // lead creation date
  closedDate:   'updated_at',    // date of last status change (proxy for closed date)
} as const;

// Statuses that count as "closed" for KPI purposes
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
  tier:         null;            // no source yet
  channel:      string;
  adId:         string | null;
  isAttributed: boolean;
  dedupKey:     string;
  leadDate:     string;          // ISO date string YYYY-MM-DD
  closedDate:   string | null;   // ISO date string YYYY-MM-DD or null
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
  const status      = String(row[RAW_FIELD_MAP.status] ?? '');
  const isClosed    = CLOSED_STATUSES.has(status);
  const adult       = toInt(row[RAW_FIELD_MAP.adult]);
  const child       = toInt(row[RAW_FIELD_MAP.child]);
  const childNoBed  = toInt(row[RAW_FIELD_MAP.childNoBed]);
  const paxCount    = adult + child + childNoBed; // infant excluded
  const rawAdId     = row[RAW_FIELD_MAP.adId];
  const adId        = rawAdId ? String(rawAdId).trim() : null;
  const channel     = mapAdIdToChannel(adId);
  const isAttributed = channel !== 'unattributed';
  const phone       = String(row[RAW_FIELD_MAP.phone] ?? '');
  const dedupKey    = normalizePhone(phone);
  const leadDate    = toDateStr(row[RAW_FIELD_MAP.leadDate]) ?? new Date().toISOString().slice(0, 10);
  const closedDate  = isClosed ? toDateStr(row[RAW_FIELD_MAP.closedDate]) : null;

  return {
    externalId:   String(row[RAW_FIELD_MAP.id]),
    status,
    isClosed,
    paxCount,
    destinasi:    row[RAW_FIELD_MAP.destinasi] ? String(row[RAW_FIELD_MAP.destinasi]) : null,
    productType:  row[RAW_FIELD_MAP.productType] ? String(row[RAW_FIELD_MAP.productType]) : null,
    tier:         null,
    channel,
    adId,
    isAttributed,
    dedupKey,
    leadDate,
    closedDate,
    rawData:      row,
  };
}
