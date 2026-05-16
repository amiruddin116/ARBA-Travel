// Source 3 — Hwajing on Cruqo (https://hwajing.cruqo.com/cruise)
//
// Integration status: awaiting API access.
// Hwajing operates on the Cruqo cruise reservation platform. To go live:
//   1. Contact Hwajing (or the Cruqo platform operator) and request a
//      partner API key for inventory search and booking.
//   2. Once granted, replace the `search` body below with a real
//      fetch() to process.env.HWAJING_API_URL using
//      process.env.HWAJING_API_KEY (see .env.example).
//   3. Map the supplier response into the CruiseOffer shape and
//      flip `status` below to "live".

import { filterOffers } from "../filter"
import type { CruiseAdapter, CruiseOffer, CruiseSearchQuery } from "../types"

const SOURCE_ID = "hwajing" as const
const DISPLAY_NAME = "Hwajing (Cruqo)"

const MOCK_OFFERS: readonly Omit<CruiseOffer, "retrievedAt">[] = [
  {
    id: `${SOURCE_ID}:RWC-RESORTS-WORLD-ONE-2026-07-11`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Resorts World Cruises",
    ship: "Resorts World One",
    departurePort: "Penang",
    returnPort: "Penang",
    portsOfCall: ["Phuket", "Krabi", "Langkawi"],
    nights: 4,
    departureDate: "2026-07-11",
    returnDate: "2026-07-15",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Studio Inside", pricePerPerson: 1180, availability: "available" },
      { category: "oceanview", description: "Deluxe Oceanview", pricePerPerson: 1690, availability: "available" },
      { category: "balcony", description: "Deluxe Balcony", pricePerPerson: 2390, availability: "limited" },
    ],
    inclusions: ["Meals", "Port charges", "Live entertainment", "Kids club"],
    bookingReference: "HWJ-Q-RWC-RW1-0711",
  },
  {
    id: `${SOURCE_ID}:STAR-VIRGO-2026-08-29`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Star Cruises",
    ship: "SuperStar Virgo",
    departurePort: "Port Klang",
    returnPort: "Port Klang",
    portsOfCall: ["Phuket", "Langkawi"],
    nights: 3,
    departureDate: "2026-08-29",
    returnDate: "2026-09-01",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Interior Stateroom", pricePerPerson: 990, availability: "available" },
      { category: "oceanview", description: "Superior Oceanview", pricePerPerson: 1390, availability: "available" },
      { category: "suite", description: "Executive Suite", pricePerPerson: 4290, availability: "waitlist" },
    ],
    inclusions: ["Meals", "Port charges"],
    bookingReference: "HWJ-Q-STR-VRG-0829",
  },
  {
    id: `${SOURCE_ID}:COSTA-SERENA-2026-10-19`,
    source: SOURCE_ID,
    sourceDisplayName: DISPLAY_NAME,
    cruiseLine: "Costa Cruises",
    ship: "Costa Serena",
    departurePort: "Singapore",
    returnPort: "Singapore",
    portsOfCall: ["Penang", "Phuket", "Port Klang"],
    nights: 5,
    departureDate: "2026-10-19",
    returnDate: "2026-10-24",
    currency: "MYR",
    cabins: [
      { category: "inside", description: "Classic Interior", pricePerPerson: 1890, availability: "available" },
      { category: "oceanview", description: "Classic Oceanview", pricePerPerson: 2390, availability: "available" },
      { category: "balcony", description: "Premium Balcony", pricePerPerson: 3190, availability: "available" },
    ],
    inclusions: ["Meals", "Port charges", "Italian-style entertainment"],
    bookingReference: "HWJ-Q-COS-SER-1019",
  },
]

async function search(query: CruiseSearchQuery): Promise<CruiseOffer[]> {
  const now = new Date().toISOString()
  const offers = MOCK_OFFERS.map((o) => ({ ...o, retrievedAt: now }))
  return filterOffers(offers, query)
}

export const hwajingAdapter: CruiseAdapter = {
  id: SOURCE_ID,
  displayName: DISPLAY_NAME,
  status: "awaiting-api-access",
  search,
}
