import type { SourceId } from "../types"

const ENV_PREFIX: Record<SourceId, string> = {
  travelb2b: "TRAVELB2B",
  worldcruisecentre: "WORLDCRUISECENTRE",
  hwajing: "HWAJING",
}

export type PortalCredentials = {
  username: string
  password: string
}

export function readCredentials(source: SourceId): PortalCredentials | null {
  const prefix = ENV_PREFIX[source]
  const username = process.env[`${prefix}_USERNAME`]?.trim()
  const password = process.env[`${prefix}_PASSWORD`]?.trim()
  if (!username || !password) return null
  return { username, password }
}
