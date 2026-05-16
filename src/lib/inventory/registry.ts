import { hwajingAdapter } from "./hwajing/adapter"
import { travelB2BAdapter } from "./travelb2b/adapter"
import { worldCruiseCentreAdapter } from "./worldcruisecentre/adapter"
import type {
  AggregatedSearchResult,
  CruiseAdapter,
  CruiseOffer,
  CruiseSearchQuery,
  SourceError,
  SourceResult,
} from "./types"

const ADAPTERS: readonly CruiseAdapter[] = [
  travelB2BAdapter,
  worldCruiseCentreAdapter,
  hwajingAdapter,
]

type AdapterRun = {
  adapter: CruiseAdapter
  offers: CruiseOffer[]
  durationMs: number
  error: string | null
}

export function getAdapters(): readonly CruiseAdapter[] {
  return ADAPTERS
}

export async function searchAllSources(
  query: CruiseSearchQuery,
): Promise<AggregatedSearchResult> {
  const runs: AdapterRun[] = await Promise.all(
    ADAPTERS.map(async (adapter): Promise<AdapterRun> => {
      const startedAt = Date.now()
      try {
        const offers = await adapter.search(query)
        return { adapter, offers, durationMs: Date.now() - startedAt, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown adapter error"
        return { adapter, offers: [], durationMs: Date.now() - startedAt, error: message }
      }
    }),
  )

  const offers: CruiseOffer[] = runs.flatMap((r) => r.offers)
  const sources: SourceResult[] = runs.map((r) => ({
    id: r.adapter.id,
    displayName: r.adapter.displayName,
    status: r.adapter.status,
    count: r.offers.length,
    durationMs: r.durationMs,
  }))
  const errors: SourceError[] = runs.reduce<SourceError[]>((acc, r) => {
    if (r.error !== null) acc.push({ id: r.adapter.id, message: r.error })
    return acc
  }, [])

  return { offers, sources, errors }
}
