#!/usr/bin/env tsx
// Usage: npm run inspect-portal -- <travelb2b|worldcruisecentre|hwajing>
//
// Opens the target portal in a visible browser window and waits for you
// to drive it manually (log in, run a cruise search, etc.). When you
// press <enter> in this terminal, it captures the current page's HTML
// + screenshot to portal-inspection/<source>/ for selector analysis.
//
// Run again with a different label argument to capture another page,
// e.g. `npm run inspect-portal -- travelb2b results`.
//
// Nothing is uploaded anywhere — captures live only on your machine.

import { promises as fs } from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

import { chromium } from "playwright"

import type { SourceId } from "../src/lib/inventory/types"

const PORTAL_URLS: Record<SourceId, string> = {
  travelb2b: "https://www.travelb2b.my/users/sign_in",
  worldcruisecentre: "https://www.worldcruisecentre.com.my",
  hwajing: "https://hwajing.cruqo.com",
}

function isSourceId(value: string): value is SourceId {
  return value in PORTAL_URLS
}

async function main(): Promise<void> {
  const sourceArg = process.argv[2]
  const labelArg = process.argv[3] ?? "page"
  if (!sourceArg || !isSourceId(sourceArg)) {
    console.error("Usage: npm run inspect-portal -- <travelb2b|worldcruisecentre|hwajing> [label]")
    process.exit(1)
  }

  const source: SourceId = sourceArg
  const url = PORTAL_URLS[source]
  const outDir = path.join("portal-inspection", source)
  await fs.mkdir(outDir, { recursive: true })

  console.log(`Opening ${url} in a visible browser.`)
  console.log("Log in and navigate to the page you want to inspect.")
  console.log("Then come back here and press <enter> to capture HTML + screenshot.")
  console.log("Capture as many pages as you like; type 'q' + enter to quit.\n")

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-MY",
    timezoneId: "Asia/Kuala_Lumpur",
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: "domcontentloaded" })

  const rl = readline.createInterface({ input, output })
  let captureIndex = 0
  try {
    for (;;) {
      const prompt = captureIndex === 0
        ? `Press <enter> to capture (label='${labelArg}'), or 'q' to quit: `
        : `Press <enter> to capture another (will add suffix -${captureIndex + 1}), or 'q' to quit: `
      const answer = await rl.question(prompt)
      if (answer.trim().toLowerCase() === "q") break
      const suffix = captureIndex === 0 ? "" : `-${captureIndex + 1}`
      const stem = path.join(outDir, `${labelArg}${suffix}`)
      const currentUrl = page.url()
      await page.screenshot({ path: `${stem}.png`, fullPage: true })
      const html = await page.content()
      await fs.writeFile(`${stem}.html`, html, "utf8")
      await fs.writeFile(`${stem}.url.txt`, currentUrl, "utf8")
      console.log(`saved ${stem}.png + ${stem}.html (url: ${currentUrl})`)
      captureIndex += 1
    }
  } finally {
    rl.close()
    await context.close().catch(() => undefined)
    await browser.close().catch(() => undefined)
  }
  console.log(`\nDone. Captured files live in ${outDir}/`)
  console.log("Share the relevant HTML snippet(s) so the selectors can be filled in.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
