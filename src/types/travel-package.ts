export type Region =
  | "southeast_asia"
  | "east_asia"
  | "south_asia"
  | "central_asia"
  | "middle_east"
  | "north_africa"
  | "europe"
  | "balkans"
  | "caucasus";

export type HalalTier =
  | "muslim_majority"
  | "halal_certified"
  | "muslim_friendly";

export type Audience =
  | "family"
  | "honeymoon"
  | "religious"
  | "adventure"
  | "shopping"
  | "heritage"
  | "senior";

export type DemandLevel = "very_high" | "high" | "rising" | "niche";

export type Currency = "MYR";

export interface TravelPackage {
  slug: string;
  title: string;
  destinationCountries: string[];
  durationDays: number;
  durationNights: number;
  region: Region;
  halalTier: HalalTier;
  audiences: Audience[];
  priceMyr: number;
  competitorPriceLowMyr: number;
  competitorPriceHighMyr: number;
  savingsVsMarketMyr: number;
  currency: Currency;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerarySummary: string[];
  prayerFacilities: string;
  halalFoodNotes: string;
  visaNotes: string;
  bestMonths: string[];
  minPax: number;
  demand: DemandLevel;
  rationale: string;
}
