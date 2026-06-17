/**
 * Maps a raw row from MySQL attcrm.Fresh → a leads table row.
 *
 * Schema confirmed via DESCRIBE attcrm.Fresh (81 columns total).
 */

import { mapAdIdToChannel } from '@/lib/channel-map';

// ─── CRM column names (all confirmed) ────────────────────────────────────────
const RAW_FIELD_MAP = {
  id:                'id',                 // int(11), auto_increment, PRI
  leadId:            'leadID',             // varchar(50) — human-readable lead ref
  status:            'status',             // 'Closed' | 'Modified' | 'Payment' | ...
  phone:             'phone',              // varchar(60) — used for dedup_key
  email:             'email',              // varchar(200)
  name:              'name',              // varchar(100)
  adult:             'adult',             // varchar — cast to int
  child:             'child',             // varchar — cast to int
  childNoBed:        'childnb',           // varchar — cast to int (NOT child_no_bed)
  // infant excluded from pax_count per business rule
  destination:       'destination',       // varchar (e.g. "HCM", "BKK", "BCN")
  productType:       'type',              // varchar (JT, PT, ST, CT, BT, UH-PT, UH-GT, IT)
  tier:              'level',             // varchar (Batik Air, Emirates, Malaysia Airlines, etc.)
  adId:              'ad_id',             // varchar(300) — primary attribution source
  utmSource:         'utm_source',        // varchar — fallback attribution
  utmMedium:         'utm_medium',        // varchar — fallback attribution
  leadDate:          'timestamp',         // timestamp(3) — lead creation date
  closedTime:        'closed_time',       // datetime — primary closed timestamp
  approveClosedTime: 'approve_closed_time', // datetime — fallback when closed_time is NULL
} as const;

// Statuses that count as "closed" for CPP and CR% calculations
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
  tier:         string | null;
  channel:      string;
  adId:         string | null;
  isAttributed: boolean;
  dedupKey:     string;
  leadDate:     string;         // YYYY-MM-DD
  closedDate:   string | null;  // YYYY-MM-DD or null
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

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;
  return String(val).trim() || null;
}

export function transformFreshRow(row: FreshRow): LeadRow {
  const status   = String(row[RAW_FIELD_MAP.status] ?? '');
  const isClosed = CLOSED_STATUSES.has(status);

  // pax_count = adult + child + childnb (infant excluded per business rule)
  const paxCount =
    toInt(row[RAW_FIELD_MAP.adult]) +
    toInt(row[RAW_FIELD_MAP.child]) +
    toInt(row[RAW_FIELD_MAP.childNoBed]);

  // Attribution: ad_id first, then utm_source/utm_medium as fallback
  const adId      = str(row[RAW_FIELD_MAP.adId]);
  const utmSource = str(row[RAW_FIELD_MAP.utmSource]);
  const utmMedium = str(row[RAW_FIELD_MAP.utmMedium]);
  const channel   = mapAdIdToChannel(adId, utmSource, utmMedium);
  const isAttributed = channel !== 'unattributed';

  // dedup_key from normalized phone
  const dedupKey = normalizePhone(str(row[RAW_FIELD_MAP.phone]));

  // Lead creation date from `timestamp` column
  const leadDate = toDateStr(row[RAW_FIELD_MAP.leadDate]) ?? new Date().toISOString().slice(0, 10);

  // Closed date: closed_time first, fall back to approve_closed_time
  const closedDate = isClosed
    ? (toDateStr(row[RAW_FIELD_MAP.closedTime]) ?? toDateStr(row[RAW_FIELD_MAP.approveClosedTime]))
    : null;

  return {
    externalId:  String(row[RAW_FIELD_MAP.id]),
    status,
    isClosed,
    paxCount,
    destinasi:   str(row[RAW_FIELD_MAP.destination]),
    productType: str(row[RAW_FIELD_MAP.productType]),
    tier:        str(row[RAW_FIELD_MAP.tier]),
    channel,
    adId,
    isAttributed,
    dedupKey,
    leadDate,
    closedDate,
    rawData:     row,
  };
}
