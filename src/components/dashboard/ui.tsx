import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'

export const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type Accent = 'teal' | 'amber' | 'red' | 'neutral' | 'blue' | 'sage'

const ACCENT: Record<Accent, { bar: string; text: string; bg: string; ring: string }> = {
  teal:    { bar: '#1B6DFC', text: '#1B6DFC', bg: 'rgba(27,109,252,0.08)',  ring: '#B5CFFC' },
  amber:   { bar: '#B7791F', text: '#B7791F', bg: 'rgba(183,121,31,0.08)',  ring: '#F0DCB4' },
  red:     { bar: '#DC2626', text: '#DC2626', bg: 'rgba(220,38,38,0.08)',   ring: '#F5C6C6' },
  blue:    { bar: '#1B6DFC', text: '#1B6DFC', bg: 'rgba(27,109,252,0.08)',  ring: '#B5CFFC' },
  neutral: { bar: '#999999', text: '#6B6B6B', bg: 'rgba(153,153,153,0.06)', ring: '#E5E5E5' },
  sage:    { bar: '#7A8A6B', text: '#4D5A41', bg: 'rgba(122,138,107,0.10)', ring: '#C5CFBA' },
}

export function accentColour(a: Accent = 'teal') {
  return ACCENT[a]
}

/* ===========================================================
 * Page header - eyebrow + title + subtitle, optional CTA
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
          backgroundImage: 'radial-gradient(circle at 1px 1px, #E5E5E5 1px, transparent 0)',
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
            <p
              className="text-[11px] font-bold uppercase mb-5"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.12em',
                color: a.text,
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className="text-[40px] font-extrabold text-[#1A1A1A] leading-[1.15] mb-5"
            style={{ letterSpacing: '-0.025em' }}
          >
            {title}
          </h1>
          <div
            className="w-12 h-[3px] rounded-full mb-5"
            style={{ background: a.bar }}
          />
          {subtitle && (
            <div className="text-[15px] text-[#4A4A4A] max-w-xl leading-relaxed">{subtitle}</div>
          )}
        </div>
        {cta && <div className="shrink-0">{cta}</div>}
      </div>
    </div>
  )
}

/* ===========================================================
 * Card - base surface
 * =========================================================== */
export function Card({
  children,
  className = '',
  padding = 'lg',
  hover = false,
  accent,
  tint = false,
}: {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  /** Adds a 3px Signal Blue (or accent-coloured) left stripe to flag a priority card. Mirrors emailFeaturedCard from the email design system. */
  accent?: Accent
  /** Soft blue-tinted background (#F3F7FF) for inset hierarchy surfaces. */
  tint?: boolean
}) {
  const pad =
    padding === 'none' ? '' :
    padding === 'sm' ? 'p-4' :
    padding === 'md' ? 'p-5' : 'p-6'
  const a = accent ? ACCENT[accent] : null
  const bg = tint ? '#F3F7FF' : '#FFFFFF'
  const style: React.CSSProperties = { background: bg }
  if (a) style.borderLeft = `3px solid ${a.bar}`
  return (
    <div
      style={style}
      className={`border border-[#E5E5E5] rounded-2xl ${pad} ${
        hover ? 'transition-colors hover:border-[#D4D4D4]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ===========================================================
 * Section label - small accent bar + mono uppercase label
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
          className="text-[11px] font-bold uppercase truncate"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em', color: a.text }}
        >
          {children}
        </h2>
        {meta && (
          <span
            className="text-[10px] text-[#999999] ml-2"
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
 * Pill - small mono uppercase chip
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
      ? { background: '#FFFFFF', color: a.text, borderColor: a.ring }
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
 * Stat card - accent bar + label + tabular number + sublabel
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
    <div className="relative bg-[#FAFBFD] border border-[#E5E5E5] rounded-2xl p-5 overflow-hidden h-full transition-colors hover:border-[#D4D4D4] hover:bg-[#F3F7FF]">
      <div
        className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
        style={{ background: a.bar }}
      />
      {Icon && (
        <Icon
          size={16}
          className="absolute top-5 right-5 text-[#999999]"
        />
      )}
      <p
        className="text-[10px] text-[#6B6B6B] uppercase mt-4 mb-3"
        style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
      >
        {label}
      </p>
      <p
        className="text-[40px] font-extrabold text-[#1A1A1A] tracking-tight leading-none mb-2.5"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#999999] truncate">{sub}</p>}
    </div>
  )
  return href ? (
    <Link href={href} className="block">{Inner}</Link>
  ) : (
    <div>{Inner}</div>
  )
}

/* ===========================================================
 * Data row - link row used for lists inside cards
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
    <div className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-[#F4F4F4] transition-colors group">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#1A1A1A] group-hover:text-[#1B6DFC] transition-colors truncate">
          {primary}
        </p>
        {secondary && (
          <p className="text-[12px] text-[#6B6B6B] truncate">{secondary}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>
}

/* ===========================================================
 * Empty state - for lists / cards with no data
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
        <div className="w-10 h-10 rounded-full border border-[#E5E5E5] bg-[#F8F8F8] flex items-center justify-center mb-3">
          <Icon size={16} className="text-[#999999]" />
        </div>
      )}
      <p className="text-[13px] text-[#6B6B6B]">{title}</p>
      {hint && <p className="text-[12px] text-[#999999] mt-1">{hint}</p>}
    </div>
  )
}

/* ===========================================================
 * Button - button-shaped link or button in locked palette
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
      ? 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1056D6] border border-transparent font-semibold'
      : variant === 'caution'
      ? 'bg-[#FEF6E7] text-[#B7791F] border border-[#F0DCB4] hover:border-[#D9B976] hover:text-[#8A5A14]'
      : variant === 'ghost'
      ? 'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F4] border border-transparent'
      : 'bg-[#FFFFFF] text-[#1A1A1A] border border-[#E5E5E5] hover:border-[#D4D4D4] hover:text-[#1B6DFC]'
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
