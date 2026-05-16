import type { CruiseOffer, CruiseSearchQuery } from "./types"

export function filterOffers(
  offers: readonly CruiseOffer[],
  query: CruiseSearchQuery,
): CruiseOffer[] {
  const destination = query.destination?.toLowerCase()
  const port = query.departurePort?.toLowerCase()

  return offers.filter((offer) => {
    if (offer.departureDate < query.departFrom) return false
    if (offer.departureDate > query.departTo) return false
    if (query.nightsMin !== undefined && offer.nights < query.nightsMin) return false
    if (query.nightsMax !== undefined && offer.nights > query.nightsMax) return false
    if (port && !offer.departurePort.toLowerCase().includes(port)) return false
    if (destination) {
      const haystack = [offer.cruiseLine, offer.ship, ...offer.portsOfCall]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(destination)) return false
    }
    return true
  })
}
