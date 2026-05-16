// Source 1 — TravelB2B Malaysia (https://www.travelb2b.my)
//
// Runtime mode (chosen automatically based on env vars):
//   * TRAVELB2B_API_URL + TRAVELB2B_API_KEY set → call real API (not yet
//     available; preferred long-term path).
//   * TRAVELB2B_USERNAME + TRAVELB2B_PASSWORD set → run the Playwright
//     scraper in ./scrape.ts using the agent portal login.
//   * Neither set → return mock fixtures so the rest of the app keeps
//     working without credentials.

import { readCredentials } from "../scrape/credentials"
import { filterOffers } from "../filter"
import type { CruiseAdapter, CruiseOffer, CruiseSearchQuery } from "../types"
import { scrapeTravelB2B } from "./scrape"

const SOURCE_ID = "travelb2b" as const
const DISPLAY_NAME = "TravelB2B Malaysia"

const MOCK_OFFERS: readonly Omit<CruiseOffer, "retrievedAt">[] = [
  {
    id: `${SOURCE_ID}:RCI-SPECTRUM-2026-08-15`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Royal Caribbean International",
    ship: "Spectrum of the Seas",
    departurePort: "Singapore",
    returnPort: "Singapore",
    portsOfCall: ["Penang", "Phuket", "Port Klang"],
    nights: 5,
    departureDate: "2026-08-15",
    returnDate: "2026-08-20",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Interior Stateroom", pricePerPerson: 2150, availability: "available" },
      { category: "oceanview", description: "Ocean View Stateroom", pricePerPerson: 2680, availability: "available" },
      { category: "balcony", description: "Balcony Stateroom", pricePerPerson: 3490, availability: "limited" },
    ],
    inclusions: ["Main dining meals", "Port charges", "Onboard entertainment"],
    bookingReference: "T2B-Q-RCI-SPC-001",
  },
  {
    id: `${SOURCE_ID}:DREAM-GENTING-2026-09-04`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Resorts World Cruises",
    ship: "Genting Dream",
    departurePort: "Singapore",
    returnPort: "Singapore",
    portsOfCall: ["Redang", "Tioman"],
    nights: 3,
    departureDate: "2026-09-04",
    returnDate: "2026-09-07",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Inside Cabin", pricePerPerson: 1290, availability: "available" },
      { category: "balcony", description: "Balcony Deluxe", pricePerPerson: 2190, availability: "available" },
      { category: "suite", description: "Palace Suite (butler service)", pricePerPerson: 5890, availability: "limited" },
    ],
    inclusions: ["Meals", "Port charges", "Service charge"],
    bookingReference: "T2B-Q-RWC-GD-014",
  },
  {
    id: `${SOURCE_ID}:MSC-BELLISSIMA-2026-11-22`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "MSC Cruises",
    ship: "MSC Bellissima",
    departurePort: "Singapore",
    returnPort: "Singapore",
    portsOfCall: ["Port Klang", "Phuket", "Langkawi"],
    nights: 5,
    departureDate: "2026-11-22",
    returnDate: "2026-11-27",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Bella Interior", pricePerPerson: 2090, availability: "available" },
      { category: "oceanview", description: "Fantastica Ocean View", pricePerPerson: 2750, availability: "available" },
      { category: "balcony", description: "Fantastica Balcony", pricePerPerson: 3420, availability: "available" },
    ],
    inclusions: ["Meals", "Port charges", "Kids sail free promo"],
    bookingReference: "T2B-Q-MSC-BEL-202",
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
  return scrapeTravelB2B(query, credentials)
}

function resolveStatus(): CruiseAdapter["status"] {
  return readCredentials(SOURCE_ID) ? "scraping" : "mock"
}

export const travelB2BAdapter: CruiseAdapter = {
  id: SOURCE_ID,
  displayName: DISPLAY_NAME,
  get status() {
    return resolveStatus()
  },
  search,
}
