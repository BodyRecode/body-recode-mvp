import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

/**
 * DEV-ONLY endpoint that opens a local file via the OS default handler.
 *
 * Why this exists: the Today dashboard's Runbook Context section links to
 * PDFs on Kade's Dropbox. Browsers block file:// links from http:// origins
 * for security, so the raw <a href="file://..."> is dead. This endpoint
 * runs on localhost, invokes `open <path>` on macOS, and returns.
 *
 * Safety guardrails:
 * - Only accepts POST (not GET — no accidental link click)
 * - Rejects if not running under localhost host (checks x-forwarded-host)
 * - Path must be under a whitelisted root (~/Dropbox/01_BODY_RECODE/ or /Users/kadedunstone/)
 * - File must exist
 * - Rejects when NODE_ENV=production
 */

const WHITELIST_PREFIXES = [
  '/Users/kadedunstone/Dropbox/01_BODY_RECODE/',
  '/Users/kadedunstone/Dropbox/03_BODY_RECODE_COLLECTIVE/',
]

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 })
  }

  const host = req.headers.get('host') ?? ''
  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return NextResponse.json({ error: 'localhost only' }, { status: 403 })
  }

  const { path } = (await req.json().catch(() => ({}))) as { path?: string }
  if (typeof path !== 'string' || !path) {
    return NextResponse.json({ error: 'path required' }, { status: 400 })
  }

  const abs = resolve(path)
  if (!WHITELIST_PREFIXES.some((prefix) => abs.startsWith(prefix))) {
    return NextResponse.json({ error: 'path not under whitelist' }, { status: 403 })
  }

  if (!existsSync(abs)) {
    return NextResponse.json({ error: 'file not found' }, { status: 404 })
  }

  const proc = spawn('open', [abs], { detached: true, stdio: 'ignore' })
  proc.unref()

  return NextResponse.json({ ok: true })
}
