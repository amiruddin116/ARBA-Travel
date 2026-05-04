import { halalTravelPackages } from "./halal-travel-packages";
import type { TravelPackage } from "@/types/travel-package";

interface PgClient {
  query: (text: string, values?: unknown[]) => Promise<{ rowCount: number | null }>;
}

const toCents = (myr: number): bigint => BigInt(Math.round(myr * 100));

const upsertSql = `
  INSERT INTO travel_packages (
    slug, title, destination_countries, duration_days, duration_nights,
    region, halal_tier, audiences, price_myr_cents,
    competitor_low_myr_cents, competitor_high_myr_cents,
    inclusions, exclusions, highlights, itinerary_summary,
    prayer_facilities, halal_food_notes, visa_notes, best_months,
    min_pax, demand, rationale
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    destination_countries = EXCLUDED.destination_countries,
    duration_days = EXCLUDED.duration_days,
    duration_nights = EXCLUDED.duration_nights,
    region = EXCLUDED.region,
    halal_tier = EXCLUDED.halal_tier,
    audiences = EXCLUDED.audiences,
    price_myr_cents = EXCLUDED.price_myr_cents,
    competitor_low_myr_cents = EXCLUDED.competitor_low_myr_cents,
    competitor_high_myr_cents = EXCLUDED.competitor_high_myr_cents,
    inclusions = EXCLUDED.inclusions,
    exclusions = EXCLUDED.exclusions,
    highlights = EXCLUDED.highlights,
    itinerary_summary = EXCLUDED.itinerary_summary,
    prayer_facilities = EXCLUDED.prayer_facilities,
    halal_food_notes = EXCLUDED.halal_food_notes,
    visa_notes = EXCLUDED.visa_notes,
    best_months = EXCLUDED.best_months,
    min_pax = EXCLUDED.min_pax,
    demand = EXCLUDED.demand,
    rationale = EXCLUDED.rationale,
    updated_at = now();
`;

const toRow = (pkg: TravelPackage): unknown[] => [
  pkg.slug,
  pkg.title,
  pkg.destinationCountries,
  pkg.durationDays,
  pkg.durationNights,
  pkg.region,
  pkg.halalTier,
  pkg.audiences,
  toCents(pkg.priceMyr).toString(),
  toCents(pkg.competitorPriceLowMyr).toString(),
  toCents(pkg.competitorPriceHighMyr).toString(),
  pkg.inclusions,
  pkg.exclusions,
  pkg.highlights,
  pkg.itinerarySummary,
  pkg.prayerFacilities,
  pkg.halalFoodNotes,
  pkg.visaNotes,
  pkg.bestMonths,
  pkg.minPax,
  pkg.demand,
  pkg.rationale,
];

export async function seedTravelPackages(client: PgClient): Promise<number> {
  let inserted = 0;
  for (const pkg of halalTravelPackages) {
    const result = await client.query(upsertSql, toRow(pkg));
    if (result.rowCount && result.rowCount > 0) inserted += result.rowCount;
  }
  return inserted;
}
