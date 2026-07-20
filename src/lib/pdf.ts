import { cookies, headers } from 'next/headers'
import puppeteer, { type Browser } from 'puppeteer-core'

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

async function resolveExecutablePath(): Promise<string> {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    return await chromium.executablePath()
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  const fs = await import('node:fs/promises')
  for (const candidate of LOCAL_CHROME_PATHS) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next
    }
  }
  throw new Error(
    'Could not find a local Chrome executable. Set PUPPETEER_EXECUTABLE_PATH or install Google Chrome.'
  )
}

async function launchBrowser(): Promise<Browser> {
  const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production'
  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  return await puppeteer.launch({
    headless: true,
    executablePath: await resolveExecutablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

export interface RenderPdfOptions {
  /** Absolute path on the same host, e.g. /dashboard/clients/123/cffs-report */
  path: string
  /** Filename for the Content-Disposition header (without .pdf) */
  filename: string
}

/**
 * Renders an authenticated dashboard URL to PDF using the caller's session
 * cookies and returns a Response with the binary attachment.
 *
 * Wait strategy: `domcontentloaded` (fires as soon as HTML parsed) + explicit
 * `document.fonts.ready` + a soft `waitForNetworkIdle` (500ms idle window,
 * ignores failure). Previously used `networkidle0` which would time out at
 * 45s if any request kept the page busy (a slow marketing-site avatar image,
 * a hanging third-party script, etc.). The relaxed strategy is more robust
 * for pages that include external assets - if fonts/images take too long,
 * PDF still generates with what's loaded rather than 500-ing.
 *
 * Errors are surfaced with the underlying message in the response body so
 * calling routes can pass them through to the client for real diagnostics.
 */
export async function renderDashboardPdf(opts: RenderPdfOptions): Promise<Response> {
  const reqHeaders = await headers()
  const host = reqHeaders.get('host')
  if (!host) {
    return new Response('Missing host header', { status: 400 })
  }
  const protocol = reqHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`
  const url = `${origin}${opts.path}`

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  let browser: Browser | null = null
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Forward the user's session cookies to the headless browser so it can
    // load the protected dashboard route as the same user.
    if (allCookies.length > 0) {
      await page.setCookie(
        ...allCookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: host.split(':')[0],
          path: '/',
        }))
      )
    }

    await page.emulateMediaType('print')

    // Load the page (HTML parsed) then wait for fonts + a short network idle
    // window. If either soft-wait hangs it doesn't abort PDF generation.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.evaluate(() => document.fonts?.ready ?? Promise.resolve()).catch(() => {})
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 8_000 }).catch(() => {})

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    })

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${opts.filename}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[pdf] renderDashboardPdf failed:', { url, error: msg })
    return new Response(`PDF generation failed: ${msg}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
    })
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}
