-- ARBA Travel Marketing Dashboard — PostgreSQL Schema
-- Run against Neon (PostgreSQL 15+)
-- Convention: snake_case table names (plural), UUID PKs, timestamps on every table

-- ─── sync_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source       TEXT NOT NULL,               -- 'arba_crm' | 'google_ads' | 'meta' | 'tiktok' | 'search_console'
  status       TEXT NOT NULL,               -- 'success' | 'error' | 'partial'
  records_in   INTEGER NOT NULL DEFAULT 0,
  records_out  INTEGER NOT NULL DEFAULT 0,
  error_msg    TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── platform_tokens ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       TEXT NOT NULL UNIQUE,      -- 'google_ads' | 'meta' | 'tiktok' | 'search_console'
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,
  scope          TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ad_metrics ───────────────────────────────────────────────────────────────
-- Daily aggregated spend/impressions/clicks per platform + campaign
CREATE TABLE IF NOT EXISTS ad_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  platform        TEXT NOT NULL,            -- 'google_ads' | 'meta' | 'tiktok'
  campaign_id     TEXT NOT NULL,
  campaign_name   TEXT,
  ad_set_id       TEXT,
  ad_set_name     TEXT,
  impressions     INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  spend           NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- in IDR
  currency        TEXT NOT NULL DEFAULT 'IDR',
  raw_data        JSONB NOT NULL DEFAULT '{}',
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, platform, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_metrics_date        ON ad_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_platform    ON ad_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_campaign_id ON ad_metrics(campaign_id);

-- ─── seo_metrics ──────────────────────────────────────────────────────────────
-- Daily Google Search Console data
CREATE TABLE IF NOT EXISTS seo_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  query       TEXT NOT NULL,
  page        TEXT NOT NULL,
  clicks      INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr         NUMERIC(6, 4),               -- 0.0–1.0
  position    NUMERIC(6, 2),
  country     TEXT,
  device      TEXT,
  raw_data    JSONB NOT NULL DEFAULT '{}',
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, query, page)
);

CREATE INDEX IF NOT EXISTS idx_seo_metrics_date ON seo_metrics(date DESC);

-- ─── leads ────────────────────────────────────────────────────────────────────
-- Synced from MySQL attcrm.Fresh table at crm.arbatravel.com
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT NOT NULL UNIQUE,        -- CRM's own lead ID (Fresh.id or similar)
  status        TEXT NOT NULL,               -- raw status string from CRM
  is_closed     BOOLEAN NOT NULL DEFAULT FALSE,
  -- pax_count = adult + child + child_no_bed (infant excluded)
  pax_count     INTEGER NOT NULL DEFAULT 0,

  -- Dimensions for filtering
  destinasi     TEXT,                        -- travel destination
  product_type  TEXT,                        -- package / product type
  tier          TEXT,                        -- airline/service level from CRM 'level' column (e.g. Batik Air, Emirates)

  -- Attribution — ad_id from CRM is sole source of truth for channel
  channel       TEXT,                        -- mapped: 'google_ads' | 'meta' | 'tiktok' | 'organic' | 'unattributed'
  ad_id         TEXT,                        -- raw Fresh.ad_id value
  is_attributed BOOLEAN NOT NULL DEFAULT FALSE,  -- FALSE if ad_id is NULL or empty

  -- Deduplication — normalized phone number
  -- Root causes: (1) staff re-insert existing customers; (2) visitors submit form >1 time
  dedup_key     TEXT NOT NULL,               -- normalized phone: strip spaces/dashes, +62→0, 62→0
  is_duplicate  BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE if earlier record with same dedup_key exists

  -- Dates
  lead_date     DATE NOT NULL,               -- when lead was created in CRM
  closed_date   DATE,                        -- when status changed to closed (NULL if not closed)

  -- Audit
  raw_data      JSONB NOT NULL DEFAULT '{}', -- original CRM row snapshot
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_date      ON leads(lead_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_channel        ON leads(channel);
CREATE INDEX IF NOT EXISTS idx_leads_destinasi      ON leads(destinasi);
CREATE INDEX IF NOT EXISTS idx_leads_product_type   ON leads(product_type);
CREATE INDEX IF NOT EXISTS idx_leads_tier           ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_status         ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_is_attributed  ON leads(is_attributed);
CREATE INDEX IF NOT EXISTS idx_leads_is_duplicate   ON leads(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_leads_dedup_key      ON leads(dedup_key);

-- ─── users ────────────────────────────────────────────────────────────────────
-- NextAuth Credentials provider — internal team only
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer', -- 'admin' | 'viewer'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
