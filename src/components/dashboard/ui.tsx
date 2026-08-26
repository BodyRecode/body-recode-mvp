import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'

export const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type Accent = 'teal' | 'amber' | 'red' | 'neutral' | 'blue' | 'sage' | 'ink' | 'terracotta'

const ACCENT: Record<Accent, { bar: string; text: string; bg: string; ring: string }> = {
  teal:       { bar: '#1B6DFC', text: '#1B6DFC', bg: 'rgba(27,109,252,0.08)',  ring: '#B5CFFC' },
  amber:      { bar: '#B7791F', text: '#A96A12', bg: 'rgba(183,121,31,0.08)',  ring: '#F1DEB8' },
  red:        { bar: '#DC2626', text: '#C82626', bg: 'rgba(220,38,38,0.08)',   ring: '#F5C9C9' },
  blue:       { bar: '#1B6DFC', text: '#1B6DFC', bg: 'rgba(27,109,252,0.08)',  ring: '#B5CFFC' },
  neutral:    { bar: '#98A0AD', text: '#666D7A', bg: 'rgba(153,153,153,0.06)', ring: '#E8EAEE' },
  sage:       { bar: '#7A8A6B', text: '#4D5A41', bg: 'rgba(122,138,107,0.10)', ring: '#C5CFBA' },
  ink:        { bar: '#141821', text: '#141821', bg: 'rgba(26,26,26,0.06)',    ring: '#D4D4D4' },
  terracotta: { bar: '#B06C47', text: '#8A5335', bg: 'rgba(176,108,71,0.09)',  ring: '#E4C4B4' },
}

/* Shared elevation. One light source from above: a hairline border, a 1px
 * white highlight along the top edge, and a short soft shadow. Deep shadows
 * and glows are deliberately absent - depth comes from stacking surfaces. */
const SH1 = '0 1px 2px rgba(16,24,40,0.05)'
const SH2 = '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05)'

export function accentColour(a: Accent = 'teal') {
  return ACCENT[a]
}

/* ===========================================================
 * Avatar - initials disc. Colour is derived from the name, so
 * the same person is the same colour on every surface. Faces
 * are what make a list of people read as people rather than
 * as rows of text.
 * =========================================================== */
const AVATAR_HUES = [212, 158, 28, 342, 268, 190, 14, 120, 238, 44]

function hueFor(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length]
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (parts.length === 0) return '?'
  return parts.map(p => p[0]).join('').toUpperCase()
}

export function Avatar({
  name,
  size = 32,
  ring = true,
}: {
  name: string
  size?: number
  /** White ring that lifts the disc off the row behind it. */
  ring?: boolean
}) {
  const h = hueFor(name || '?')
  return (
    <span
      aria-hidden
      title={name}
      className="inline-flex items-center justify-center rounded-full shrink-0 text-white font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.35),
        letterSpacing: '-0.01em',
        background: `linear-gradient(160deg, hsl(${h} 55% 54%), hsl(${h} 58% 41%))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(16,24,40,0.18)${ring ? ', 0 0 0 2px #FFFFFF' : ''}`,
      }}
    >
      {initialsFor(name || '?')}
    </span>
  )
}

/* ===========================================================
 * Page header - the panel toolbar. Breadcrumb, title, actions
 * on one line; no hero, no backdrop.
 * =========================================================== */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accent = 'teal',
  cta,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  accent?: Accent
  cta?: ReactNode
  /** Retained for call-site compatibility; the header no longer paints a glow. */
  glow?: boolean
}) {
  const a = ACCENT[accent]
  return (
    <div
      className="sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] flex items-start justify-between gap-5 flex-wrap print:static print:bg-transparent print:backdrop-blur-none"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px) saturate(1.5)' }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] mb-1.5" style={{ color: a.text }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-semibold text-[#141821] leading-[1.2] tracking-[-0.025em]">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[13.5px] text-[#666D7A] max-w-2xl leading-relaxed mt-1.5">
            {subtitle}
          </div>
        )}
      </div>
      {cta && <div className="shrink-0 flex items-center gap-2 flex-wrap">{cta}</div>}
    </div>
  )
}

/* ===========================================================
 * Card - base surface, raised a hair off the page
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
  const style: React.CSSProperties = {
    background: tint ? 'linear-gradient(180deg,#F6FAFF,#F1F6FE)' : 'linear-gradient(180deg,#FFFFFF,#FBFCFD)',
    boxShadow: `${SH2}, inset 0 1px 0 #FFFFFF`,
  }
  if (a) style.borderLeft = `3px solid ${a.bar}`
  return (
    <div
      style={style}
      className={`br-card ${pad} ${
        hover ? 'transition-shadow hover:shadow-[0_6px_16px_-6px_rgba(16,24,40,0.16),0_2px_4px_-2px_rgba(16,24,40,0.08)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ===========================================================
 * Section label - accent tile + heading
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
    <div className="flex items-center justify-between gap-4 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${a.bg}, ${a.bg})`,
            boxShadow: `inset 0 0 0 1px ${a.ring}`,
          }}
          aria-hidden
        >
          <span className="w-[7px] h-[7px] rounded-[2px]" style={{ background: a.bar }} />
        </span>
        <h2 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] truncate">
          {children}
        </h2>
        {meta && <span className="text-[11.5px] text-[#98A0AD] ml-1 shrink-0">{meta}</span>}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  )
}

/* ===========================================================
 * Pill - status chip with a leading dot
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
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-[3px] rounded-full border whitespace-nowrap"
      style={{ boxShadow: SH1, ...styles }}
    >
      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: 'currentColor' }} aria-hidden />
      {children}
    </span>
  )
}

/* ===========================================================
 * Stat card - label, tabular number, supporting note
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
    <div
      className="relative br-card p-4 overflow-hidden h-full transition-shadow"
      style={{
        background: 'linear-gradient(180deg,#FFFFFF,#FBFCFD)',
        boxShadow: `${SH2}, inset 0 1px 0 #FFFFFF`,
      }}
    >
      {Icon && (
        <span
          className="absolute top-4 right-4 w-[22px] h-[22px] rounded-md flex items-center justify-center"
          style={{ background: a.bg, boxShadow: `inset 0 0 0 1px ${a.ring}` }}
        >
          <Icon size={12} className="opacity-90" />
        </span>
      )}
      <p className="text-[11.5px] text-[#666D7A] mb-1.5 pr-7">{label}</p>
      <p
        className="text-[26px] font-semibold text-[#141821] tracking-[-0.035em] leading-none"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11.5px] text-[#98A0AD] truncate mt-1.5">{sub}</p>}
    </div>
  )
  return href ? (
    <Link href={href} className="block group [&>div]:hover:shadow-[0_6px_16px_-6px_rgba(16,24,40,0.16),0_2px_4px_-2px_rgba(16,24,40,0.08)]">{Inner}</Link>
  ) : (
    <div>{Inner}</div>
  )
}

/* ===========================================================
 * Ring - completion donut. One number, and the two counts it
 * is made of, so the percentage can always be checked against
 * what it actually divided.
 * =========================================================== */
export function Ring({
  value,
  size = 116,
  accent = 'teal',
  label,
  legend,
}: {
  /** 0-100. */
  value: number
  size?: number
  accent?: Accent
  /** Text inside the ring. Defaults to the rounded percentage. */
  label?: ReactNode
  /** Counts under the ring - always show what the percentage divided. */
  legend?: { label: string; count: number; accent?: Accent }[]
}) {
  const a = ACCENT[accent]
  const pct = Math.max(0, Math.min(100, value))
  const stroke = Math.round(size * 0.1)
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#EFF1F4" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={a.bar} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[20px] font-semibold text-[#141821] tracking-[-0.03em]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {label ?? `${Math.round(pct)}%`}
          </span>
        </div>
      </div>
      {legend && legend.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {legend.map((item, i) => {
            const la = ACCENT[item.accent ?? 'neutral']
            return (
              <span key={item.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-[#E8EAEE]" aria-hidden>|</span>}
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#666D7A]">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: la.bar }} aria-hidden />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }} className="font-medium text-[#141821]">
                    {item.count}
                  </span>
                  {item.label}
                </span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ===========================================================
 * RangeTabs - plain text tabs for switching a list's window.
 * Active is colour, not a pill: the tabs sit above data and
 * should not compete with it.
 * =========================================================== */
export function RangeTabs({
  options,
  active,
}: {
  options: { href: string; label: string; key: string }[]
  active: string
}) {
  return (
    <div className="flex items-center gap-5 border-b border-[#E8EAEE] mb-5">
      {options.map((o) => {
        const on = o.key === active
        return (
          <Link
            key={o.key}
            href={o.href}
            aria-current={on ? 'true' : undefined}
            className={`relative pb-2.5 text-[13.5px] transition-colors ${
              on ? 'text-[#1B6DFC] font-medium' : 'text-[#666D7A] hover:text-[#141821]'
            }`}
          >
            {o.label}
            {on && (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                style={{ background: '#1B6DFC' }}
              />
            )}
          </Link>
        )
      })}
    </div>
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
  avatar,
}: {
  href?: string
  primary: ReactNode
  secondary?: ReactNode
  trailing?: ReactNode
  /** Person's name - renders an initials disc at the head of the row. */
  avatar?: string
}) {
  const inner = (
    <div className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-[#F7F9FC] transition-colors group">
      {avatar && <Avatar name={avatar} size={31} />}
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-[#141821] tracking-[-0.012em] group-hover:text-[#1B6DFC] transition-colors truncate">
          {primary}
        </p>
        {secondary && (
          <p className="text-[12px] text-[#666D7A] truncate">{secondary}</p>
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
        <div
          className="w-10 h-10 rounded-full border border-[#E8EAEE] flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(180deg,#FFFFFF,#F7F9FB)', boxShadow: SH1 }}
        >
          <Icon size={16} className="text-[#98A0AD]" />
        </div>
      )}
      <p className="text-[13px] text-[#666D7A]">{title}</p>
      {hint && <p className="text-[12px] text-[#98A0AD] mt-1">{hint}</p>}
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
  const sizing = size === 'sm' ? 'text-[12px] px-3 py-1.5' : 'text-[12.5px] px-3.5 py-[7px]'
  const palette =
    variant === 'primary'
      ? 'text-white border border-[#1560E0] font-medium bg-[linear-gradient(180deg,#3B82F9,#1B6DFC)] hover:bg-[linear-gradient(180deg,#2E77F7,#1560E0)] shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.28)]'
      : variant === 'caution'
      ? 'text-[#A96A12] border border-[#F1DEB8] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] hover:border-[#D9B976] hover:text-[#8A5A14] shadow-[0_1px_2px_rgba(16,24,40,0.05)]'
      : variant === 'ghost'
      ? 'bg-transparent text-[#666D7A] hover:text-[#141821] hover:bg-[#F4F6F9] border border-transparent'
      : 'text-[#141821] border border-[#E8EAEE] bg-[linear-gradient(180deg,#FFFFFF,#FAFBFC)] hover:border-[#CFD4DC] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:shadow-[0_1px_3px_rgba(16,24,40,0.09),0_1px_2px_-1px_rgba(16,24,40,0.05)]'
  const base = `inline-flex items-center gap-2 rounded-lg font-medium transition-all active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${sizing} ${palette}`
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
