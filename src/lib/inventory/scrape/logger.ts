// All scraper logging goes through this module so credentials never
// leak into stdout, log aggregators, or stack traces.

const REDACT_KEYS = [
  "password",
  "pwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
]

function redactValue(input: unknown): unknown {
  if (typeof input === "string") {
    return input.replace(/(password|pwd|token|secret)=([^&\s"']+)/gi, "$1=[redacted]")
  }
  if (input === null || typeof input !== "object") return input
  if (Array.isArray(input)) return input.map(redactValue)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (REDACT_KEYS.some((needle) => k.toLowerCase().includes(needle))) {
      out[k] = "[redacted]"
    } else {
      out[k] = redactValue(v)
    }
  }
  return out
}

export type ScrapeLogger = {
  info: (message: string, context?: unknown) => void
  warn: (message: string, context?: unknown) => void
  error: (message: string, context?: unknown) => void
}

export function createLogger(source: string): ScrapeLogger {
  const emit = (level: "INFO" | "WARN" | "ERROR", message: string, context?: unknown) => {
    const prefix = `[scrape:${source}] ${level}`
    if (context === undefined) {
      console.log(`${prefix} ${message}`)
    } else {
      console.log(`${prefix} ${message}`, redactValue(context))
    }
  }
  return {
    info: (m, c) => emit("INFO", m, c),
    warn: (m, c) => emit("WARN", m, c),
    error: (m, c) => emit("ERROR", m, c),
  }
}
