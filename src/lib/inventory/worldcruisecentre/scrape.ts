// World Cruise Centre Playwright scraper.
//
// SELECTORS BELOW ARE PLACEHOLDERS. Run
// `npm run inspect-portal worldcruisecentre` to capture the real login
// form, search form, and results markup, then share the captured HTML
// so the selectors here can be filled in.

import { captureFailure, openBrowserSession } from "../scrape/browser"
import type { PortalCredentials } from "../scrape/credentials"
import type { CruiseOffer, CruiseSearchQuery } from "../types"

const LOGIN_URL = "https://www.worldcruisecentre.com.my/login"
const SEARCH_URL = "https://www.worldcruisecentre.com.my/cruise/search"

const SELECTORS = {
  // TODO replace with real selectors after portal inspection.
  loginUsername: 'input[name="username"]',
  loginPassword: 'input[name="password"]',
  loginSubmit: 'button[type="submit"]',
  loggedInIndicator: 'a[href*="logout"]',
  searchDepartFrom: 'input[name="depart_from"]',
  searchDepartTo: 'input[name="depart_to"]',
  searchSubmit: 'button[type="submit"]',
  resultRow: '.cruise-result',
} as const

export async function scrapeWorldCruiseCentre(
  query: CruiseSearchQuery,
  credentials: PortalCredentials,
): Promise<CruiseOffer[]> {
  const session = await openBrowserSession("worldcruisecentre")
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
        await captureFailure(page, "worldcruisecentre", "login-failed")
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
    await captureFailure(page, "worldcruisecentre", "search-page")
    void query
    return []
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown scrape error"
    logger.error("scrape failed", { message })
    await captureFailure(page, "worldcruisecentre", "exception")
    return []
  } finally {
    await close()
  }
}
