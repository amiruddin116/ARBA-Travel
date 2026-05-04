-- Travel packages catalog. Designed for halal/Muslim-friendly tours
-- targeted at Malaysian travellers. Prices stored in MYR (sen-precision).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS travel_packages (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        TEXT NOT NULL UNIQUE,
  title                       TEXT NOT NULL,
  destination_countries       TEXT[] NOT NULL,
  duration_days               SMALLINT NOT NULL CHECK (duration_days > 0),
  duration_nights             SMALLINT NOT NULL CHECK (duration_nights >= 0),
  region                      TEXT NOT NULL,
  halal_tier                  TEXT NOT NULL
                              CHECK (halal_tier IN ('muslim_majority',
                                                    'halal_certified',
                                                    'muslim_friendly')),
  audiences                   TEXT[] NOT NULL,
  price_myr_cents             BIGINT NOT NULL CHECK (price_myr_cents > 0),
  competitor_low_myr_cents    BIGINT NOT NULL CHECK (competitor_low_myr_cents > 0),
  competitor_high_myr_cents   BIGINT NOT NULL CHECK (competitor_high_myr_cents >= competitor_low_myr_cents),
  inclusions                  TEXT[] NOT NULL,
  exclusions                  TEXT[] NOT NULL,
  highlights                  TEXT[] NOT NULL,
  itinerary_summary           TEXT[] NOT NULL,
  prayer_facilities           TEXT NOT NULL,
  halal_food_notes            TEXT NOT NULL,
  visa_notes                  TEXT NOT NULL,
  best_months                 TEXT[] NOT NULL,
  min_pax                     SMALLINT NOT NULL DEFAULT 2 CHECK (min_pax > 0),
  demand                      TEXT NOT NULL
                              CHECK (demand IN ('very_high','high','rising','niche')),
  rationale                   TEXT NOT NULL,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS travel_packages_region_idx
  ON travel_packages (region) WHERE is_active;

CREATE INDEX IF NOT EXISTS travel_packages_demand_idx
  ON travel_packages (demand) WHERE is_active;

CREATE INDEX IF NOT EXISTS travel_packages_price_idx
  ON travel_packages (price_myr_cents) WHERE is_active;

CREATE INDEX IF NOT EXISTS travel_packages_audiences_gin
  ON travel_packages USING GIN (audiences);

CREATE INDEX IF NOT EXISTS travel_packages_destinations_gin
  ON travel_packages USING GIN (destination_countries);
