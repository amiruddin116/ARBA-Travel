import { NextResponse } from "next/server"

import { searchAllSources } from "@/lib/inventory"
import type { CruiseSearchQuery } from "@/lib/inventory"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

type ParseResult =
  | { ok: true; query: CruiseSearchQuery }
  | { ok: false; error: string }

function parseQuery(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object" }
  }
  const b = body as Record<string, unknown>

  if (typeof b.departFrom !== "string" || !ISO_DATE.test(b.departFrom)) {
    return { ok: false, error: "departFrom is required and must be YYYY-MM-DD" }
  }
  if (typeof b.departTo !== "string" || !ISO_DATE.test(b.departTo)) {
    return { ok: false, error: "departTo is required and must be YYYY-MM-DD" }
  }
  if (typeof b.passengers !== "number" || !Number.isInteger(b.passengers) || b.passengers < 1) {
    return { ok: false, error: "passengers is required and must be a positive integer" }
  }
  if (b.departFrom > b.departTo) {
    return { ok: false, error: "departFrom must be on or before departTo" }
  }

  const query: CruiseSearchQuery = {
    departFrom: b.departFrom,
    departTo: b.departTo,
    passengers: b.passengers,
    departurePort: typeof b.departurePort === "string" ? b.departurePort : undefined,
    destination: typeof b.destination === "string" ? b.destination : undefined,
    nightsMin: typeof b.nightsMin === "number" ? b.nightsMin : undefined,
    nightsMax: typeof b.nightsMax === "number" ? b.nightsMax : undefined,
    currency: typeof b.currency === "string" ? b.currency : undefined,
  }
  return { ok: true, query }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = parseQuery(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const result = await searchAllSources(parsed.query)
  return NextResponse.json(result)
}
