'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { H } from './tokens'

/**
 * Harmony website chrome - sticky editorial header + footer with the
 * Powered by Body Recode mark. Wraps every page under
 * /dashboard/preview/harmony/*.
 *
 * Deliberately different from the coach dashboard chrome (in
 * ../../melisa/_lib/shell.tsx) - this is a PUBLIC-FACING marketing
 * site, not an app.
 */
const BASE = '/dashboard/preview/harmony'

const NAV = [
  { href: `${BASE}/method`,     label: 'The Method' },
  { href: `${BASE}/scorecard`,  label: 'The Assessment' },
  { href: `${BASE}#programmes`, label: 'Programmes' },
  { href: `${BASE}#about`,      label: 'About' },
]

export function HarmonySite({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div style={{ backgroundColor: H.cream, color: H.ink, fontFamily: H.sans }}>
      {/* Preview strip - dark thin line at very top */}
      <div
        className="text-center py-1 text-[10px] font-bold uppercase tracking-widest sticky top-0 z-[60]"
        style={{ backgroundColor: H.ink, color: H.cream, letterSpacing: '0.14em' }}
      >
        Preview mockup · not a live site · <Link href="/dashboard/preview" className="underline">back to previews</Link>
      </div>

      <SiteHeader pathname={pathname} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}

function SiteHeader({ pathname }: { pathname: string }) {
  return (
    <header
      className="sticky z-50 border-b backdrop-blur-md"
      style={{ top: '22px', backgroundColor: 'rgba(250,246,239,0.85)', borderColor: H.border }}
    >
      <div className="max-w-[1240px] mx-auto px-8 h-20 flex items-center justify-between gap-6">
        <Link href={BASE} className="flex items-center gap-3 shrink-0">
          <span
            className="inline-flex items-center justify-center w-11 h-11 rounded-full overflow-hidden bg-white border"
            style={{ borderColor: H.ink }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={H.logoUrl} alt="" className="w-full h-full object-cover" />
          </span>
          <div>
            <div
              className="text-[22px] leading-none tracking-[0.12em] uppercase"
              style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500, letterSpacing: '0.12em' }}
            >
              {H.name}
            </div>
            <div
              className="text-[9px] uppercase mt-1"
              style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.24em' }}
            >
              {H.sub}
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => {
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className="text-[13px] transition-colors"
                style={{
                  color: active ? H.ink : H.inkSoft,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href={`${BASE}/scorecard`}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold uppercase transition-transform hover:scale-[1.02]"
          style={{
            background: H.terracotta,
            color: H.cream,
            fontFamily: H.mono,
            letterSpacing: '0.14em',
          }}
        >
          Begin the Assessment
        </Link>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="pt-16 pb-10 border-t" style={{ borderColor: H.border, backgroundColor: H.creamDeep }}>
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-white border" style={{ borderColor: H.ink }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={H.logoUrl} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="text-[20px] uppercase tracking-[0.12em]" style={{ fontFamily: H.serif, color: H.ink, letterSpacing: '0.12em' }}>{H.name}</div>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: H.inkSoft }}>
              A studio for practitioners who want their yoga to actually work with their body over time - not against it.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}>Practice</div>
            <ul className="space-y-2 text-[13px]" style={{ color: H.inkSoft }}>
              <li><Link href={`${BASE}/scorecard`}>The Assessment</Link></li>
              <li><Link href={`${BASE}/method`}>The Method</Link></li>
              <li><Link href={`${BASE}#programmes`}>Programmes</Link></li>
              <li><Link href={`${BASE}#about`}>About Melisa</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}>Studio</div>
            <ul className="space-y-2 text-[13px]" style={{ color: H.inkSoft }}>
              <li>{H.location}</li>
              <li>studio@harmony.com.au</li>
              <li>@harmony.practice</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}>Fine print</div>
            <ul className="space-y-2 text-[13px]" style={{ color: H.inkSoft }}>
              <li>Terms of practice</li>
              <li>Privacy</li>
              <li>Refund policy</li>
            </ul>
          </div>
        </div>

        {/* Powered by BR bar */}
        <div
          className="pt-6 border-t flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: H.border }}
        >
          <div className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.18em' }}>
            © 2026 {H.name} Practice Pty Ltd
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}>Powered by</span>
            <span
              className="inline-flex items-center justify-center px-2 py-1 rounded"
              style={{
                background: '#1B6DFC',
                color: '#FFFFFF',
                fontFamily: H.mono,
                fontSize: '11px',
                letterSpacing: '0.1em',
                fontWeight: 700,
              }}
            >
              BODY RECODE
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
