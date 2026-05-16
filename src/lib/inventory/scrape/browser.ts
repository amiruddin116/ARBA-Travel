import { promises as fs } from "node:fs"
import path from "node:path"

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright"

import { createLogger, type ScrapeLogger } from "./logger"

const DEFAULT_STATE_DIR = ".playwright-state"
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export type BrowserSession = {
  browser: Browser
  context: BrowserContext
  page: Page
  logger: ScrapeLogger
  saveState: () => Promise<void>
  close: () => Promise<void>
}

function stateDir(): string {
  return process.env.PLAYWRIGHT_STATE_DIR?.trim() || DEFAULT_STATE_DIR
}

function statePath(source: string): string {
  return path.join(stateDir(), `${source}.json`)
}

async function loadStorageState(source: string): Promise<string | undefined> {
  const file = statePath(source)
  try {
    await fs.access(file)
    return file
  } catch {
    return undefined
  }
}

export async function openBrowserSession(source: string): Promise<BrowserSession> {
  const logger = createLogger(source)
  const headless = (process.env.PLAYWRIGHT_HEADLESS ?? "true") !== "false"
  const storageStateFile = await loadStorageState(source)

  logger.info("launching browser", { headless, hasStoredSession: Boolean(storageStateFile) })

  const browser = await chromium.launch({ headless })
  const context = await browser.newContext({
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1440, height: 900 },
    locale: "en-MY",
    timezoneId: "Asia/Kuala_Lumpur",
    storageState: storageStateFile,
  })
  context.setDefaultTimeout(30_000)
  const page = await context.newPage()

  const saveState = async () => {
    await fs.mkdir(stateDir(), { recursive: true })
    await context.storageState({ path: statePath(source) })
    logger.info("session state saved")
  }

  const close = async () => {
    await context.close().catch(() => undefined)
    await browser.close().catch(() => undefined)
  }

  return { browser, context, page, logger, saveState, close }
}

export async function captureFailure(page: Page, source: string, label: string): Promise<void> {
  const dir = path.join("portal-inspection", source)
  await fs.mkdir(dir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const stem = path.join(dir, `${label}-${ts}`)
  await page.screenshot({ path: `${stem}.png`, fullPage: true }).catch(() => undefined)
  const html = await page.content().catch(() => "")
  await fs.writeFile(`${stem}.html`, html, "utf8").catch(() => undefined)
}
