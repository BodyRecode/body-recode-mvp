// Export any /broll/<slug> canvas to a full-bleed 9:16 PNG (1080x1920).
//
// For the vertical reel B-roll cuts: the /v portrait canvases are static, so a
// PNG drops straight into the reel edit full-bleed — no screen recording, no
// side crop. Saves into Amanda's production working folder by default.
//
// Usage:
//   cd ~/body-recode-mvp
//   npx tsx scripts/export-broll-vertical-png.ts <slug> [output-name]
//
// Examples:
//   npx tsx scripts/export-broll-vertical-png.ts one-vs-many-variables/v
//     -> BR_Broll_9x16_One_Vs_Many_Variables.png
//   npx tsx scripts/export-broll-vertical-png.ts order-of-operations/v
//     -> BR_Broll_9x16_Order_Of_Operations.png
//
// Dev server must be running on localhost:3000.

import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_DIR = '/Users/kadedunstone/Library/CloudStorage/Dropbox/02_AMANDA_PRODUCTION/AMANDA_WORKING_FILE/broll_9x16'

function slugToTitle(slug: string): string {
  return slug
    .replace(/\/v$/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_')
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: npx tsx scripts/export-broll-vertical-png.ts <slug> [output-name]')
    process.exit(1)
  }

  const outputName = process.argv[3] ?? `BR_Broll_9x16_${slugToTitle(slug)}.png`
  const url = `http://localhost:3000/broll/${slug}`
  const output = `${OUT_DIR}/${outputName}`

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 2 },
  })

  const page = await browser.newPage()
  console.log(`Loading ${url} ...`)
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
  await page.evaluateHandle('document.fonts.ready')

  // Hide the Next.js dev indicator so it doesn't leak into the b-roll frame.
  await page.addStyleTag({
    content: 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
  })

  console.log(`Rendering PNG -> ${output}`)
  await page.screenshot({
    path: output,
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
    type: 'png',
  })

  await browser.close()
  console.log('Done.')
}

main().catch(err => {
  console.error('PNG export failed:', err)
  process.exit(1)
})
