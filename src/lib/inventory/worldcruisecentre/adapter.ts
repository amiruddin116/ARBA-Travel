// Source 2 — World Cruise Centre (https://www.worldcruisecentre.com.my)
//
// Runtime mode (chosen automatically based on env vars):
//   * WORLDCRUISECENTRE_API_URL + WORLDCRUISECENTRE_API_KEY set → real API.
//   * WORLDCRUISECENTRE_USERNAME + WORLDCRUISECENTRE_PASSWORD set →
//     Playwright scraper in ./scrape.ts using the agent portal login.
//   * Neither set → mock fixtures.

import { readCredentials } from "../scrape/credentials"
import { filterOffers } from "../filter"
import type { CruiseAdapter, CruiseOffer, CruiseSearchQuery } from "../types"
import { scrapeWorldCruiseCentre } from "./scrape"

const SOURCE_ID = "worldcruisecentre" as const
const DISPLAY_NAME = "World Cruise Centre"

const MOCK_OFFERS: readonly Omit<CruiseOffer, "retrievedAt">[] = [
  {
    id: `${SOURCE_ID}:PRINCESS-DIAMOND-2026-10-02`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Princess Cruises",
    ship: "Diamond Princess",
    departurePort: "Singapore",
    returnPort: "Hong Kong",
    portsOfCall: ["Ho Chi Minh City", "Hanoi (Halong Bay)", "Sanya"],
    nights: 9,
    departureDate: "2026-10-02",
    returnDate: "2026-10-11",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Interior Stateroom", pricePerPerson: 4490, availability: "available" },
      { category: "oceanview", description: "Ocean View Stateroom", pricePerPerson: 5290, availability: "available" },
      { category: "balcony", description: "Premium Balcony", pricePerPerson: 6890, availability: "limited" },
      { category: "suite", description: "Mini-Suite with Balcony", pricePerPerson: 9590, availability: "limited" },
    ],
    inclusions: ["All meals", "Port charges", "MedallionClass app", "Gratuities included (promo)"],
    bookingReference: "WCC-Q-PRN-DIA-2026-1002",
  },
  {
    id: `${SOURCE_ID}:HAL-WESTERDAM-2026-12-18`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Holland America Line",
    ship: "ms Westerdam",
    departurePort: "Singapore",
    returnPort: "Yokohama",
    portsOfCall: ["Phu My (Saigon)", "Hong Kong", "Taipei (Keelung)", "Kobe"],
    nights: 14,
    departureDate: "2026-12-18",
    returnDate: "2027-01-01",
    currency: "MYR",
    cabins: [
      { category: "oceanview", description: "Large Ocean-View Stateroom", pricePerPerson: 8290, availability: "available" },
      { category: "balcony", description: "Verandah Stateroom", pricePerPerson: 11490, availability: "available" },
      { category: "suite", description: "Neptune Suite (concierge)", pricePerPerson: 21890, availability: "waitlist" },
    ],
    inclusions: ["All meals", "Specialty dining credit", "Have It All beverage package", "Shore excursion credit"],
    bookingReference: "WCC-Q-HAL-WST-2026-1218",
  },
  {
    id: `${SOURCE_ID}:CUNARD-QV-2027-02-05`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Cunard Line",
    ship: "Queen Victoria",
    departurePort: "Singapore",
    returnPort: "Sydney",
    portsOfCall: ["Bali", "Darwin", "Cairns", "Brisbane"],
    nights: 16,
    departureDate: "2027-02-05",
    returnDate: "2027-02-21",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Britannia Inside", pricePerPerson: 9890, availability: "available" },
      { category: "balcony", description: "Britannia Balcony", pricePerPerson: 14290, availability: "limited" },
      { category: "suite", description: "Princess Grill Suite", pricePerPerson: 28490, availability: "limited" },
    ],
    inclusions: ["White Star service", "Afternoon tea daily", "Port charges"],
    bookingReference: "WCC-Q-CUN-QV-2027-0205",
  },
]

function mockSearch(query: CruiseSearchQuery): CruiseOffer[] {
  const now = new Date().toISOString()
  const offers = MOCK_OFFERS.map((o) => ({ ...o, retrievedAt: now }))
  return filterOffers(offers, query)
}

async function search(query: CruiseSearchQuery): Promise<CruiseOffer[]> {
  const credentials = readCredentials(SOURCE_ID)
  if (!credentials) return mockSearch(query)
  return scrapeWorldCruiseCentre(query, credentials)
}

function resolveStatus(): CruiseAdapter["status"] {
  return readCredentials(SOURCE_ID) ? "scraping" : "mock"
}

export const worldCruiseCentreAdapter: CruiseAdapter = {
  id: SOURCE_ID,
  displayName: DISPLAY_NAME,
  get status() {
    return resolveStatus()
  },
  search,
}
