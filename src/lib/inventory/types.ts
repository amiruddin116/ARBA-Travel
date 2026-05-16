export type SourceId = "travelb2b" | "worldcruisecentre" | "hwajing"

export type AdapterStatus =
  | "live"
  | "awaiting-api-access"
  | "awaiting-credentials"
  | "mock"

export type CabinCategory = "inside" | "oceanview" | "balcony" | "suite"

export type CabinAvailability = "available" | "limited" | "waitlist"

export type CabinOption = {
  category: CabinCategory
  description: string
  pricePerPerson: number
  availability: CabinAvailability
}

export type CruiseOffer = {
  id: string
  source: SourceId
  sourceDisplayName: string
  cruiseLine: string
  ship: string
  departurePort: string
  returnPort: string
  portsOfCall: readonly string[]
  nights: number
  departureDate: string
  returnDate: string
  currency: string
  cabins: readonly CabinOption[]
  inclusions: readonly string[]
  bookingReference: string
  retrievedAt: string
}

export type CruiseSearchQuery = {
  departFrom: string
  departTo: string
  passengers: number
  departurePort?: string
  destination?: string
  nightsMin?: number
  nightsMax?: number
  currency?: string
}

export type SourceResult = {
  id: SourceId
  displayName: string
  status: AdapterStatus
  count: number
  durationMs: number
}

export type SourceError = {
  id: SourceId
  message: string
}

export type AggregatedSearchResult = {
  offers: readonly CruiseOffer[]
  sources: readonly SourceResult[]
  errors: readonly SourceError[]
}

export interface CruiseAdapter {
  readonly id: SourceId
  readonly displayName: string
  readonly status: AdapterStatus
  search(query: CruiseSearchQuery): Promise<CruiseOffer[]>
}
