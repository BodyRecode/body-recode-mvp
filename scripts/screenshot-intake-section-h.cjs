// One-off: screenshot Section H of the intake form to verify the medications
// question renders correctly. Uses puppeteer-core already in the project.
//
//   node scripts/screenshot-intake-section-h.cjs <token> [section_index]
//
// section_index defaults to 8 (Section H, the Medications section).
// Takes both a full-page screenshot and a tight crop of just the question area.

const puppeteer = require('puppeteer-core');

const TOKEN = process.argv[2];
const SECTION = parseInt(process.argv[3] ?? '8', 10);

if (!TOKEN) {
  console.error('Usage: node scripts/screenshot-intake-section-h.cjs <token> [section_index]');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 2 });
    const url = `http://localhost:3000/intake/${TOKEN}?section=${SECTION}`;
    console.log('Loading', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));
    const title = await page.$eval('h1, h2', el => el.textContent).catch(() => null);
    console.log('On-page title:', title);
    // Tight viewport screenshot: just what fits in 900x1100 — header + section intro + first 1-2 questions
    const out = '/tmp/intake_section_h_tight.png';
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
