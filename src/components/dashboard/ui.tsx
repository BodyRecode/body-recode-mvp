import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'

export const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type Accent = 'teal' | 'amber' | 'red' | 'neutral' | 'blue'

const ACCENT: Record<Accent, { bar: string; text: string; bg: string; ring: string }> = {
  teal:    { bar: '#14b8a6', text: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  ring: '#0d2d29' },
  amber:   { bar: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  ring: '#3a2410' },
  red:     { bar: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.10)',   ring: '#3a1414' },
  blue:    { bar: '#60a5fa', text: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  ring: '#16243a' },
  neutral: { bar: '#57534e', text: '#a8a29e', bg: 'rgba(168,162,158,0.06)', ring: '#1c1917' },
}

export function accentColour(a: Accent = 'teal') {
  return ACCENT[a]
}

/* ===========================================================
 * Page header — eyebrow + title + subtitle, optional CTA
 * Includes the dotted-grid + soft glow used on the home page.
 * =========================================================== */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accent = 'teal',
  cta,
  glow = true,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  accent?: Accent
  cta?: ReactNode
  glow?: boolean
}) {
  const a = ACCENT[accent]
  return (
    <div className="relative mb-10 pb-6">
      <div
        aria-hidden
        className="absolute inset-0 -mx-6 -mt-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1c1917 1px, transparent 0)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 60% 80% at 20% 0%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 20% 0%, black 0%, transparent 70%)',
        }}
      />
      {glow && (
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[420px] h-[420px] pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${a.bg} 0%, transparent 60%)`,
            filter: 'blur(40px)',
          }}
        />
      )}
      <div className="relative flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          {eyebrow && (
            <div
              className="inline-flex items-center gap-2 text-[10px] text-[#a8a29e] uppercase mb-5 px-2.5 py-1 rounded-full border border-[#1c1917] bg-[#111110]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: a.bar }} />
              {eyebrow}
            </div>
          )}
          <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-[1.1] mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[15px] text-[#a8a29e] max-w-xl">{subtitle}</p>
          )}
        </div>
        {cta && <div className="shrink-0">{cta}</div>}
      </div>
    </div>
  )
}

/* ===========================================================
 * Card — base surface
 * =========================================================== */
export function Card({
  children,
  className = '',
  padding = 'lg',
  hover = false,
}: {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}) {
  const pad =
    padding === 'none' ? '' :
    padding === 'sm' ? 'p-4' :
    padding === 'md' ? 'p-5' : 'p-6'
  return (
    <div
      className={`bg-[#111110] border border-[#1c1917] rounded-2xl ${pad} ${
        hover ? 'transition-colors hover:border-[#292524]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ===========================================================
 * Section label — small accent bar + mono uppercase label
 * =========================================================== */
export function SectionLabel({
  children,
  accent = 'teal',
  cta,
  meta,
}: {
  children: ReactNode
  accent?: Accent
  cta?: ReactNode
  meta?: ReactNode
}) {
  const a = ACCENT[accent]
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-[3px] rounded-full shrink-0" style={{ background: a.bar }} />
        <h2
          className="text-[11px] font-bold text-white uppercase truncate"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          {children}
        </h2>
        {meta && (
          <span
            className="text-[10px] text-[#57534e] ml-2"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
          >
            {meta}
          </span>
        )}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  )
}

/* ===========================================================
 * Pill — small mono uppercase chip
 * =========================================================== */
export function Pill({
  children,
  accent = 'neutral',
  variant = 'soft',
}: {
  children: ReactNode
  accent?: Accent
  variant?: 'soft' | 'outline'
}) {
  const a = ACCENT[accent]
  const styles =
    variant === 'outline'
      ? { background: '#0c0a09', color: a.text, borderColor: a.ring }
      : { background: a.bg, color: a.text, borderColor: a.ring }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em', ...styles }}
    >
      {children}
    </span>
  )
}

/* ===========================================================
 * Stat card — accent bar + label + tabular number + sublabel
 * =========================================================== */
export function StatCard({
  label,
  value,
  sub,
  accent = 'neutral',
  href,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: Accent
  href?: string
  icon?: ComponentType<{ size?: number; className?: string }>
}) {
  const a = ACCENT[accent]
  const Inner = (
    <div className="relative bg-[#111110] border border-[#1c1917] rounded-2xl p-5 overflow-hidden h-full transition-colors hover:border-[#292524]">
      <div
        className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
        style={{ background: a.bar }}
      />
      {Icon && (
        <Icon
          size={16}
          className="absolute top-5 right-5 text-[#57534e]"
        />
      )}
      <p
        className="text-[10px] text-[#78716c] uppercase mt-4 mb-3"
        style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
      >
        {label}
      </p>
      <p
        className="text-[40px] font-extrabold text-white tracking-tight leading-none mb-2.5"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#57534e] truncate">{sub}</p>}
    </div>
  )
  return href ? (
    <Link href={href} className="block">{Inner}</Link>
  ) : (
    <div>{Inner}</div>
  )
}

/* ===========================================================
 * Data row — link row used for lists inside cards
 * =========================================================== */
export function DataRow({
  href,
  primary,
  secondary,
  trailing,
}: {
  href?: string
  primary: ReactNode
  secondary?: ReactNode
  trailing?: ReactNode
}) {
  const inner = (
    <div className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-[#1c1917]/60 transition-colors group">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-white group-hover:text-[#14b8a6] transition-colors truncate">
          {primary}
        </p>
        {secondary && (
          <p className="text-[12px] text-[#57534e] truncate">{secondary}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>
}

/* ===========================================================
 * Empty state — for lists / cards with no data
 * =========================================================== */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      {Icon && (
        <div className="w-10 h-10 rounded-full border border-[#1c1917] bg-[#0c0a09] flex items-center justify-center mb-3">
          <Icon size={16} className="text-[#57534e]" />
        </div>
      )}
      <p className="text-[13px] text-[#a8a29e]">{title}</p>
      {hint && <p className="text-[12px] text-[#57534e] mt-1">{hint}</p>}
    </div>
  )
}

/* ===========================================================
 * Button — button-shaped link or button in locked palette
 * =========================================================== */
export function Btn({
  children,
  href,
  onClick,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'caution'
  size?: 'sm' | 'md'
  icon?: ComponentType<{ size?: number; className?: string }>
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const sizing = size === 'sm' ? 'text-[12px] px-3 py-1.5' : 'text-[13px] px-4 py-2'
  const palette =
    variant === 'primary'
      ? 'bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-transparent font-semibold'
      : variant === 'caution'
      ? 'bg-[#1a1108] text-[#f59e0b] border border-[#3a2410] hover:border-[#5a3818] hover:text-[#fbbf24]'
      : variant === 'ghost'
      ? 'bg-transparent text-[#a8a29e] hover:text-white hover:bg-[#1c1917] border border-transparent'
      : 'bg-[#0c0a09] text-[#d4cfc9] border border-[#1c1917] hover:border-[#292524] hover:text-white'
  const base = `inline-flex items-center gap-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${sizing} ${palette}`
  const content = (
    <>
      {Icon && <Icon size={size === 'sm' ? 13 : 14} />}
      {children}
    </>
  )
  if (href) {
    return <Link href={href} className={base}>{content}</Link>
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {content}
    </button>
  )
}
