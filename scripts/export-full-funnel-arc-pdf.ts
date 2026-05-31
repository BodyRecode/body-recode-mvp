// Export /broll/full-funnel-arc to a PDF saved into the SaaS build folder.
// Uses puppeteer-core with the locally installed Google Chrome.
//
// Output: three landscape 1920x1080 pages (one per Zone of the canvas)
// matching the on-screen layout exactly. printBackground:true preserves
// the Signal Blue accents and grey Zone 2 backdrop.
//
// Dev server must be running on localhost:3000.
// Usage: cd ~/body-recode-mvp && npx tsx scripts/export-full-funnel-arc-pdf.ts

import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = 'http://localhost:3000/broll/full-funnel-arc'
const OUTPUT = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/Body_Recode_Full_Funnel_Arc.pdf'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  })

  const page = await browser.newPage()
  console.log(`Loading ${URL} ...`)
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60_000 })

  // Settle: ensure custom fonts have loaded
  await page.evaluateHandle('document.fonts.ready')

  console.log(`Rendering PDF -> ${OUTPUT}`)
  await page.pdf({
    path: OUTPUT,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: false,
  })

  await browser.close()
  console.log('Done.')
}

main().catch(err => {
  console.error('PDF export failed:', err)
  process.exit(1)
})
