// Export any /broll/<slug> canvas to a PDF saved into the SaaS build folder.
// Generalised version of export-full-funnel-arc-pdf.ts.
//
// Usage:
//   cd ~/body-recode-mvp
//   npx tsx scripts/export-broll-canvas-pdf.ts <slug> [output-name]
//
// Example:
//   npx tsx scripts/export-broll-canvas-pdf.ts funnel-b-product-arc
//     -> Body_Recode_Funnel_B_Product_Arc.pdf
//   npx tsx scripts/export-broll-canvas-pdf.ts full-funnel-arc Custom_Name.pdf
//     -> Custom_Name.pdf
//
// Output: landscape 1920x1080 pages (one per Zone) matching the on-screen
// layout exactly. printBackground:true preserves the Signal Blue accents
// and grey section backdrops.
//
// Dev server must be running on localhost:3000.

import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BUILD_DIR = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD'

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: npx tsx scripts/export-broll-canvas-pdf.ts <slug> [output-name]')
    process.exit(1)
  }

  const outputName = process.argv[3] ?? `Body_Recode_${slugToTitle(slug)}.pdf`
  const url = `http://localhost:3000/broll/${slug}`
  const output = `${BUILD_DIR}/${outputName}`

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  })

  const page = await browser.newPage()
  console.log(`Loading ${url} ...`)
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
  await page.evaluateHandle('document.fonts.ready')

  console.log(`Rendering PDF -> ${output}`)
  await page.pdf({
    path: output,
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
