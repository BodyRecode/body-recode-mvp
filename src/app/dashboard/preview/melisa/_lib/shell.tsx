'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MELISA_BRAND, MELISA_NAV } from './brand'

const BASE = '/dashboard/preview/melisa'

export function MelisaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: MELISA_BRAND.bg, fontFamily: MELISA_BRAND.sans }}>
      {/* PREVIEW BANNER — thin strip so Kade never forgets this is a mock */}
      <div
        className="fixed top-0 left-0 right-0 z-50 text-center py-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ backgroundColor: '#2c2418', color: '#faf6ef', letterSpacing: '0.14em' }}
      >
        Preview mockup · not a live tenant · <Link href="/dashboard/preview" className="underline">back to previews</Link>
      </div>

      <Sidebar pathname={pathname} />

      <main className="flex-1 pt-8 pl-64">
        <div className="max-w-[1100px] mx-auto px-10 py-10">
          <Topbar />
          {children}
        </div>
      </main>
    </div>
  )
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      className="fixed left-0 top-8 bottom-0 w-64 border-r flex flex-col"
      style={{ backgroundColor: MELISA_BRAND.bgDeep, borderColor: MELISA_BRAND.border }}
    >
      {/* Brand block */}
      <div className="px-6 pt-7 pb-8 border-b" style={{ borderColor: MELISA_BRAND.border }}>
        <Link href={BASE} className="block">
          <div
            className="text-[26px] font-normal leading-none tracking-[0.16em] uppercase"
            style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink, letterSpacing: '0.14em' }}
          >
            {MELISA_BRAND.name}
          </div>
          <div
            className="text-[9px] uppercase mt-2"
            style={{ fontFamily: MELISA_BRAND.mono, color: MELISA_BRAND.inkLight, letterSpacing: '0.18em' }}
          >
            {MELISA_BRAND.sub}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6">
        {MELISA_NAV.map((item) => {
          const href = item.slug ? `${BASE}/${item.slug}` : BASE
          const active = item.slug
            ? pathname.startsWith(`${BASE}/${item.slug}`)
            : pathname === BASE
          return (
            <Link
              key={item.slug || 'home'}
              href={href}
              className="block px-3 py-2 text-[13px] rounded-md mb-0.5 transition"
              style={{
                color: active ? MELISA_BRAND.ink : MELISA_BRAND.inkMid,
                backgroundColor: active ? MELISA_BRAND.card : 'transparent',
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="inline-block w-4 mr-2 text-center" style={{ color: active ? MELISA_BRAND.accent : MELISA_BRAND.inkLight }}>
                {active ? '●' : '○'}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer plate */}
      <div className="px-6 py-5 border-t" style={{ borderColor: MELISA_BRAND.border }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: MELISA_BRAND.accent }}
          >
            {MELISA_BRAND.monogram}
          </div>
          <div className="text-[12px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{MELISA_BRAND.founder}</div>
        </div>
        <div className="text-[10px]" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}>
          FOUNDING STUDIO · {MELISA_BRAND.location.toUpperCase()}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 text-[10px] inline-flex items-center gap-1 opacity-70 hover:opacity-100"
          style={{ color: MELISA_BRAND.inkMid, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}
        >
          <ArrowLeft className="w-3 h-3" /> BACK TO BR DASH
        </Link>
      </div>
    </aside>
  )
}

function Topbar() {
  const now = new Date()
  const day = now.toLocaleDateString('en-AU', { weekday: 'long' })
  const date = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })

  return (
    <div className="flex items-center justify-between mb-10 pb-5 border-b" style={{ borderColor: MELISA_BRAND.border }}>
      <div>
        <div className="text-[11px] uppercase mb-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.18em' }}>
          {day} · {date}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="px-3 py-1 rounded-full text-[10px] uppercase"
          style={{
            backgroundColor: MELISA_BRAND.accentSoft,
            color: MELISA_BRAND.accentText,
            fontFamily: MELISA_BRAND.mono,
            letterSpacing: '0.14em',
            fontWeight: 600,
          }}
        >
          Powered by Body Recode
        </div>
      </div>
    </div>
  )
}
