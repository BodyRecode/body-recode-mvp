import type { ReactNode } from 'react'
import { MELISA_BRAND } from './brand'

/**
 * Melisa-branded UI primitives. Only used inside this preview subtree.
 * When the tenant is provisioned for real, the actual coach dashboard
 * uses its own primitives - this file is deleted.
 */

export function EyebrowH1({ eyebrow, title, subtitle }: { eyebrow: string; title: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-14">
      <div
        className="text-[10px] uppercase mb-4"
        style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.2em' }}
      >
        {eyebrow}
      </div>
      <h1
        className="text-[36px] font-normal leading-[1.15] mb-4"
        style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink, letterSpacing: '-0.005em' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-[14px] leading-relaxed max-w-[65ch]" style={{ color: MELISA_BRAND.inkMid }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function SectionH2({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2
        className="text-[20px] font-normal leading-tight"
        style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink }}
      >
        {title}
      </h2>
      {sub && (
        <div
          className="text-[10px] uppercase mt-1"
          style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

export function Card({ children, hover = false, tone = 'default' }: { children: ReactNode; hover?: boolean; tone?: 'default' | 'muted' }) {
  return (
    <div
      className={`rounded-xl border p-5 transition ${hover ? 'hover:shadow-sm' : ''}`}
      style={{
        backgroundColor: tone === 'muted' ? MELISA_BRAND.bgDeep : MELISA_BRAND.card,
        borderColor: MELISA_BRAND.border,
      }}
    >
      {children}
    </div>
  )
}

export function StatFigure({
  label,
  value,
  sub,
  accent = 'default',
}: {
  label: string
  value: string
  sub?: string
  accent?: 'default' | 'warm' | 'ok'
}) {
  const accentColor =
    accent === 'warm' ? MELISA_BRAND.warm :
    accent === 'ok'   ? MELISA_BRAND.ok   :
                        MELISA_BRAND.ink
  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: MELISA_BRAND.card, borderColor: MELISA_BRAND.border }}
    >
      <div
        className="text-[10px] uppercase mb-3"
        style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.16em' }}
      >
        {label}
      </div>
      <div
        className="text-[42px] font-normal leading-none mb-1"
        style={{ fontFamily: MELISA_BRAND.serif, color: accentColor, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-2" style={{ color: MELISA_BRAND.inkMid }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export function StateBadge({ state }: { state: 'settling' | 'building' | 'expression' | string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    settling:   { bg: MELISA_BRAND.warmSoft,   fg: MELISA_BRAND.warm,       label: 'Settling'   },
    building:   { bg: MELISA_BRAND.accentSoft, fg: MELISA_BRAND.accentText, label: 'Building'   },
    expression: { bg: 'rgba(45,36,24,0.06)',    fg: MELISA_BRAND.ink,        label: 'Expression' },
  }
  const s = map[state] || map.settling
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded uppercase"
      style={{ backgroundColor: s.bg, color: s.fg, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.12em', fontWeight: 600 }}
    >
      {s.label}
    </span>
  )
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: MELISA_BRAND.border }}>
      <div
        className="h-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: MELISA_BRAND.accent }}
      />
    </div>
  )
}

export function PowerLine() {
  return (
    <div className="mt-16 pt-6 border-t flex items-center justify-between" style={{ borderColor: MELISA_BRAND.border }}>
      <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
        Interpretation engine · doctrine · safety floors — powered by Body Recode
      </div>
      <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
        Voice · brand · practice — yours
      </div>
    </div>
  )
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase mb-1"
        style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}
      >
        {label}
      </div>
      <div className="text-[13px]" style={{ color: MELISA_BRAND.ink }}>{value}</div>
    </div>
  )
}
