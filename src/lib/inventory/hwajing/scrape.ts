// Hwajing (Cruqo platform) Playwright scraper.
//
// SELECTORS BELOW ARE PLACEHOLDERS. Run `npm run inspect-portal hwajing`
// to capture the real login form, search form, and results markup, then
// share the captured HTML so the selectors here can be filled in.

import { captureFailure, openBrowserSession } from "../scrape/browser"
import type { PortalCredentials } from "../scrape/credentials"
import type { CruiseOffer, CruiseSearchQuery } from "../types"

const LOGIN_URL = "https://hwajing.cruqo.com/login"
const SEARCH_URL = "https://hwajing.cruqo.com/cruise"

const SELECTORS = {
  // TODO replace with real selectors after portal inspection.
  loginUsername: 'input[name="email"]',
  loginPassword: 'input[name="password"]',
  loginSubmit: 'button[type="submit"]',
  loggedInIndicator: 'a[href*="logout"], button:has-text("Logout")',
  searchSubmit: 'button[type="submit"]',
  resultRow: '.cruise-card',
} as const

export async function scrapeHwajing(
  query: CruiseSearchQuery,
  credentials: PortalCredentials,
): Promise<CruiseOffer[]> {
  const session = await openBrowserSession("hwajing")
  const { page, logger, saveState, close } = session

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" })
    const alreadyLoggedIn = await page.locator(SELECTORS.loggedInIndicator).first().isVisible().catch(() => false)

    if (!alreadyLoggedIn) {
      logger.info("logging in")
      await page.fill(SELECTORS.loginUsername, credentials.username)
      await page.fill(SELECTORS.loginPassword, credentials.password)
      await Promise.all([
        page.waitForLoadState("networkidle"),
        page.click(SELECTORS.loginSubmit),
      ])
      const success = await page.locator(SELECTORS.loggedInIndicator).first().isVisible().catch(() => false)
      if (!success) {
        await captureFailure(page, "hwajing", "login-failed")
        logger.error("login did not succeed — selectors likely wrong, see portal-inspection/")
        return []
      }
      await saveState()
    }

    logger.info("navigating to search")
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded" })

    // TODO once selectors confirmed, fill the search form and submit.
    // Then parse SELECTORS.resultRow into CruiseOffer objects.
    logger.warn("result parser not implemented — fill in selectors and parser after inspection")
    await captureFailure(page, "hwajing", "search-page")
    void query
    return []
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown scrape error"
    logger.error("scrape failed", { message })
    await captureFailure(page, "hwajing", "exception")
    return []
  } finally {
    await close()
  }
}
