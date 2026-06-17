import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ─── sync_logs ────────────────────────────────────────────────────────────────
export const syncLogs = pgTable('sync_logs', {
  id:         uuid('id').primaryKey().defaultRandom(),
  source:     text('source').notNull(),
  status:     text('status').notNull(),
  recordsIn:  integer('records_in').notNull().default(0),
  recordsOut: integer('records_out').notNull().default(0),
  errorMsg:   text('error_msg'),
  startedAt:  timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── platform_tokens ──────────────────────────────────────────────────────────
export const platformTokens = pgTable('platform_tokens', {
  id:           uuid('id').primaryKey().defaultRandom(),
  platform:     text('platform').notNull().unique(),
  accessToken:  text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  scope:        text('scope'),
  metadata:     jsonb('metadata').notNull().default({}),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── ad_metrics ───────────────────────────────────────────────────────────────
export const adMetrics = pgTable(
  'ad_metrics',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    date:         date('date').notNull(),
    platform:     text('platform').notNull(),
    campaignId:   text('campaign_id').notNull(),
    campaignName: text('campaign_name'),
    adSetId:      text('ad_set_id'),
    adSetName:    text('ad_set_name'),
    impressions:  integer('impressions').notNull().default(0),
    clicks:       integer('clicks').notNull().default(0),
    spend:        numeric('spend', { precision: 12, scale: 2 }).notNull().default('0'),
    currency:     text('currency').notNull().default('IDR'),
    rawData:      jsonb('raw_data').notNull().default({}),
    syncedAt:     timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.date, t.platform, t.campaignId),
    index('idx_ad_metrics_date').on(t.date),
    index('idx_ad_metrics_platform').on(t.platform),
    index('idx_ad_metrics_campaign_id').on(t.campaignId),
  ],
);

// ─── seo_metrics ──────────────────────────────────────────────────────────────
export const seoMetrics = pgTable(
  'seo_metrics',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    date:        date('date').notNull(),
    query:       text('query').notNull(),
    page:        text('page').notNull(),
    clicks:      integer('clicks').notNull().default(0),
    impressions: integer('impressions').notNull().default(0),
    ctr:         numeric('ctr', { precision: 6, scale: 4 }),
    position:    numeric('position', { precision: 6, scale: 2 }),
    country:     text('country'),
    device:      text('device'),
    rawData:     jsonb('raw_data').notNull().default({}),
    syncedAt:    timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.date, t.query, t.page),
    index('idx_seo_metrics_date').on(t.date),
  ],
);

// ─── leads ────────────────────────────────────────────────────────────────────
export const leads = pgTable(
  'leads',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    externalId:   text('external_id').notNull().unique(),
    status:       text('status').notNull(),
    isClosed:     boolean('is_closed').notNull().default(false),
    // pax_count = adult + child + child_no_bed (infant excluded)
    paxCount:     integer('pax_count').notNull().default(0),

    destinasi:    text('destinasi'),
    productType:  text('product_type'),
    tier:         text('tier'),

    channel:      text('channel'),
    adId:         text('ad_id'),
    isAttributed: boolean('is_attributed').notNull().default(false),

    // Deduplication by normalized phone number
    dedupKey:     text('dedup_key').notNull(),
    isDuplicate:  boolean('is_duplicate').notNull().default(false),

    leadDate:     date('lead_date').notNull(),
    closedDate:   date('closed_date'),

    rawData:      jsonb('raw_data').notNull().default({}),
    syncedAt:     timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_leads_lead_date').on(t.leadDate),
    index('idx_leads_channel').on(t.channel),
    index('idx_leads_destinasi').on(t.destinasi),
    index('idx_leads_product_type').on(t.productType),
    index('idx_leads_tier').on(t.tier),
    index('idx_leads_status').on(t.status),
    index('idx_leads_is_attributed').on(t.isAttributed),
    index('idx_leads_is_duplicate').on(t.isDuplicate),
    index('idx_leads_dedup_key').on(t.dedupKey),
  ],
);

// ─── users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  name:         text('name'),
  passwordHash: text('password_hash').notNull(),
  role:         text('role').notNull().default('viewer'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    sessionToken: text('session_token').notNull().unique(),
    userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires:      timestamp('expires', { withTimezone: true }).notNull(),
    createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_sessions_user_id').on(t.userId)],
);
