// TravelB2B Playwright scraper.
//
// SELECTORS BELOW ARE PLACEHOLDERS. Run `npm run inspect-portal travelb2b`
// to capture the real login form, search form, and results markup, then
// share the captured HTML so the selectors here can be filled in.
//
// Until real selectors are in place, this scraper will return [] and log
// a warning rather than guess.

import { captureFailure, openBrowserSession } from "../scrape/browser"
import type { PortalCredentials } from "../scrape/credentials"
import type { CruiseOffer, CruiseSearchQuery } from "../types"

const LOGIN_URL = "https://www.travelb2b.my/users/sign_in"
const SEARCH_URL = "https://www.travelb2b.my/cruise"

const SELECTORS = {
  // TODO replace with real selectors after portal inspection.
  loginUsername: 'input[name="user[email]"]',
  loginPassword: 'input[name="user[password]"]',
  loginSubmit: 'button[type="submit"]',
  loggedInIndicator: '[data-testid="account-menu"], a[href*="sign_out"]',
  searchDepartFrom: 'input[name="depart_from"]',
  searchDepartTo: 'input[name="depart_to"]',
  searchPassengers: 'select[name="passengers"]',
  searchSubmit: 'button[type="submit"]',
  resultsContainer: '[data-testid="cruise-results"]',
  resultRow: '[data-testid="cruise-result-card"]',
} as const

export async function scrapeTravelB2B(
  query: CruiseSearchQuery,
  credentials: PortalCredentials,
): Promise<CruiseOffer[]> {
  const session = await openBrowserSession("travelb2b")
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
        await captureFailure(page, "travelb2b", "login-failed")
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
    await captureFailure(page, "travelb2b", "search-page")
    void query
    return []
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown scrape error"
    logger.error("scrape failed", { message })
    await captureFailure(page, "travelb2b", "exception")
    return []
  } finally {
    await close()
  }
}
