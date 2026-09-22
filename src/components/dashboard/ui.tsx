import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import { BRAND } from '@/lib/brand-tokens'

export const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/**
 * THE ACCENT SYSTEM, AND WHY IT IS NOW MOSTLY GREY.
 *
 * 22 September 2026, the palette pass. These eight were named for FEELINGS:
 * teal, sage, terracotta, ink. A page picked one because it suited the page,
 * which is decoration, and decoration is the thing this brand does not do.
 * Colour appears where it means something, or it does not appear.
 *
 * The names are kept because 129 files pass them, and renaming those is a
 * separate change with its own risk. What they RESOLVE TO is what changed.
 *
 *   Decorative  teal, blue, ink, neutral  ->  graphite and grey
 *   Meaning     amber                     ->  Remediation
 *               red                       ->  Attention
 *               sage                      ->  Post-Optimisation
 *               terracotta                ->  Remediation (it was a warm amber)
 *
 * So a card that used 'red' for a failure still reads as a failure, a card
 * that used 'teal' because teal looked nice goes quiet, and the one amber on
 * a screen is now the only thing on it competing for a coach's eye.
 *
 * ANYTHING NEW SHOULD PASS A MEANING NAME OR NOTHING AT ALL.
 *
 * 22 September 2026, DARK. A tool is dark and a document is light: the coach
 * dashboard is a workspace somebody sits in all day. These components are the
 * frame every page is built from, so they move once and the pages follow,
 * which is the same reason the accent map above is the only place accents are
 * decided.
 */
type Accent = 'teal' | 'amber' | 'red' | 'neutral' | 'blue' | 'sage' | 'ink' | 'terracotta'

const NEUTRAL_ACCENT = { bar: BRAND.darkInkFaint, text: BRAND.darkInkSoft, bg: 'rgba(250,250,248,0.05)', ring: BRAND.darkLine }
const GRAPHITE_ACCENT = { bar: BRAND.darkInk, text: BRAND.darkInk, bg: 'rgba(250,250,248,0.07)', ring: BRAND.darkLine }

const ACCENT: Record<Accent, { bar: string; text: string; bg: string; ring: string }> = {
  // Decorative. These carried no information and now carry no colour.
  teal:       GRAPHITE_ACCENT,
  blue:       GRAPHITE_ACCENT,
  ink:        GRAPHITE_ACCENT,
  neutral:    NEUTRAL_ACCENT,
  // Meaning. These did carry information, so they keep it, in the four colours
  // Kade chose on 22 Sep. See lib/brand-tokens.
  amber:      { bar: BRAND.remediationOnDark, text: BRAND.remediationOnDark, bg: 'rgba(176,110,31,0.08)', ring: 'rgba(176,110,31,0.30)' },
  terracotta: { bar: BRAND.remediationOnDark, text: BRAND.remediationOnDark, bg: 'rgba(176,110,31,0.08)', ring: 'rgba(176,110,31,0.30)' },
  red:        { bar: BRAND.attentionOnDark,   text: BRAND.attentionOnDark,   bg: 'rgba(143,45,45,0.07)',  ring: 'rgba(143,45,45,0.28)' },
  sage:       { bar: BRAND.postOptimisationOnDark, text: BRAND.postOptimisationOnDark, bg: 'rgba(43,94,69,0.07)', ring: 'rgba(43,94,69,0.26)' },
}

/* Shared elevation. One light source from above: a hairline border, a 1px
 * white highlight along the top edge, and a short soft shadow. Deep shadows
 * and glows are deliberately absent - depth comes from stacking surfaces. */
const SH1 = '0 1px 2px rgba(0,0,0,0.45)'
const SH2 = '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px -1px rgba(0,0,0,0.4)'

export function accentColour(a: Accent = 'teal') {
  return ACCENT[a]
}

/* ===========================================================
 * Avatar - initials disc.
 *
 * 22 Sep 2026: THIS USED TO PICK ONE OF TEN HUES FROM A HASH OF THE NAME, so a
 * list of thirty clients was a rainbow. That colour carried no information,
 * and it sat in the same rows as the readiness dot, which carries all of it.
 * A coach scanning for the one amber was scanning past nine other colours.
 *
 * The anchoring argument for varying them was real, so the variation is kept
 * and moved to LIGHTNESS. Same person, same tone, every surface; no hue, so
 * nothing competes with a colour that means something.
 * =========================================================== */
const AVATAR_TONES = [16, 22, 28, 34, 40, 46, 52, 58, 64, 70]

function toneFor(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]
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
  const l = toneFor(name || '?')
  return (
    <span
      aria-hidden
      title={name}
      className="inline-flex items-center justify-center rounded-full shrink-0 text-[#0B0D10] font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.35),
        letterSpacing: '-0.01em',
        background: `linear-gradient(160deg, hsl(220 6% ${Math.min(74, l + 30)}%), hsl(220 7% ${Math.min(66, l + 22)}%))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.16)${ring ? `, 0 0 0 2px ${BRAND.darkSurface}` : ''}`,
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
  metric,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  accent?: Accent
  cta?: ReactNode
  /** A single number that belongs to the page, shown large on the right. */
  metric?: { value: ReactNode; label: string }
  /** Retained for call-site compatibility; the header no longer paints a glow. */
  glow?: boolean
}) {
  const a = ACCENT[accent]
  return (
    <div
      className="sticky top-0 z-20 mb-7 pt-6 pb-5 border-b flex items-end justify-between gap-8 flex-wrap print:static print:bg-transparent print:backdrop-blur-none"
      style={{ borderColor: BRAND.darkLineSoft, background: 'rgba(11,13,16,0.86)', backdropFilter: 'blur(10px) saturate(1.5)' }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase mb-2" style={{ letterSpacing: '0.18em', color: BRAND.darkInkFaint }}>
            {eyebrow}
          </p>
        )}
        <h1
          className="text-[46px] sm:text-[46px] font-extrabold leading-[0.98] tracking-[-0.038em]"
          style={{ color: BRAND.darkInk }}
        >
          {title}
        </h1>
        {subtitle && (
          <div className="text-[13.5px] max-w-2xl leading-relaxed mt-2.5" style={{ color: BRAND.darkInkSoft }}>
            {subtitle}
          </div>
        )}
      </div>
      {metric && (
        <div className="text-right shrink-0 ml-auto">
          <div
            className="text-[58px] font-extrabold leading-[0.85] tabular-nums"
            style={{ background: 'linear-gradient(180deg,#FFFFFF,#8A9099)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {metric.value}
          </div>
          <div className="text-[10px] font-bold uppercase mt-2" style={{ letterSpacing: '0.18em', color: BRAND.darkInkFaint }}>
            {metric.label}
          </div>
        </div>
      )}
      {cta && <div className="shrink-0 flex items-center gap-2 flex-wrap self-center">{cta}</div>}
    </div>
  )
}

/**
 * A section heading inside a page: a word, a count, and a rule running to the
 * edge. The one shape every list on every page uses, so a coach learns it once.
 */
export function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-0">
      <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.17em', color: BRAND.darkInk }}>{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] font-extrabold rounded-full px-2 py-px"
          style={{ background: BRAND.darkInkSoft, color: BRAND.darkWell }}>{count}</span>
      )}
      <span className="flex-1 h-px" style={{ background: BRAND.darkLineSoft }} />
    </div>
  )
}

/**
 * A row in a list of people. Divider, not a card: a card per row doubles the
 * visual weight of a list and adds no information. Name is the loudest thing
 * on it, because a coach thinks in people.
 */
export function PersonRow({
  href, name, meta, detail, dot, badge, trailing, quiet = false,
}: {
  href: string
  name: ReactNode
  /** Small line under the name. */
  meta?: ReactNode
  /** The sentence that says what is happening. */
  detail?: ReactNode
  dot?: ReactNode
  badge?: ReactNode
  trailing?: ReactNode
  quiet?: boolean
}) {
  return (
    <div
      className="grid gap-4 items-start py-4 border-b"
      style={{ gridTemplateColumns: '24px 1fr max-content', borderColor: BRAND.darkLineSoft, opacity: quiet ? 0.66 : 1 }}
    >
      <div className="pt-[7px]">{dot}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={href}
            className={`${quiet ? 'text-[16px] font-semibold' : 'text-[20px] font-bold'} tracking-[-0.028em] leading-tight hover:underline`}
            style={{ color: BRAND.darkInk }}
          >
            {name}
          </Link>
          {badge}
        </div>
        {meta && <div className="text-[11px] mt-1" style={{ color: BRAND.darkInkFaint }}>{meta}</div>}
        {detail && (
          <p className="text-[13.5px] leading-[1.55] mt-1.5 max-w-[620px]" style={{ color: BRAND.darkInkMuted }}>{detail}</p>
        )}
      </div>
      <div className="text-right shrink-0">{trailing}</div>
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
  /** Adds a 3px left stripe to flag a priority card. Graphite unless the accent carries meaning. */
  accent?: Accent
  /** Quiet paper-tinted background for inset hierarchy surfaces. Was blue. */
  tint?: boolean
}) {
  const pad =
    padding === 'none' ? '' :
    padding === 'sm' ? 'p-4' :
    padding === 'md' ? 'p-5' : 'p-6'
  const a = accent ? ACCENT[accent] : null
  const style: React.CSSProperties = {
    background: tint ? 'linear-gradient(180deg,#171B22,#14171D)' : 'linear-gradient(180deg,#14171D,#12151B)',
    boxShadow: `${SH2}, inset 0 1px 0 rgba(250,250,248,0.05)`,
  }
  if (a) style.borderLeft = `3px solid ${a.bar}`
  return (
    <div
      style={style}
      className={`br-card ${pad} ${
        hover ? 'transition-shadow hover:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.14),0_2px_4px_-2px_rgba(0,0,0,0.07)]' : ''
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
        <h2 className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] truncate">
          {children}
        </h2>
        {meta && <span className="text-[11px] text-[#676D76] ml-1 shrink-0">{meta}</span>}
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
      ? { background: '#0F1115', color: a.text, borderColor: a.ring }
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
        background: 'linear-gradient(180deg,#14171D,#12151B)',
        boxShadow: `${SH2}, inset 0 1px 0 rgba(250,250,248,0.05)`,
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
      <p className="text-[11px] text-[#8A9099] mb-1.5 pr-7">{label}</p>
      <p
        className="text-[34px] font-semibold text-[#FAFAF8] tracking-[-0.035em] leading-none"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#676D76] truncate mt-1.5">{sub}</p>}
    </div>
  )
  return href ? (
    <Link href={href} className="block group [&>div]:hover:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.14),0_2px_4px_-2px_rgba(0,0,0,0.07)]">{Inner}</Link>
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
            fill="none" stroke="#1A1E26" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={a.bar} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[20px] font-semibold text-[#FAFAF8] tracking-[-0.03em]"
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
                {i > 0 && <span className="text-[#2A2F39]" aria-hidden>|</span>}
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8A9099]">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: la.bar }} aria-hidden />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }} className="font-medium text-[#FAFAF8]">
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
    <div className="flex items-center gap-5 border-b border-[#2A2F39] mb-5">
      {options.map((o) => {
        const on = o.key === active
        return (
          <Link
            key={o.key}
            href={o.href}
            aria-current={on ? 'true' : undefined}
            className={`relative pb-2.5 text-[13.5px] transition-colors ${
              on ? 'text-[#FAFAF8] font-semibold' : 'text-[#8A9099] hover:text-[#FAFAF8]'
            }`}
          >
            {o.label}
            {on && (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                style={{ background: BRAND.ink }}
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
    <div className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-[#14171D] transition-colors group">
      {avatar && <Avatar name={avatar} size={31} />}
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-[#FAFAF8] tracking-[-0.012em] group-hover:text-[#FAFAF8] transition-colors truncate">
          {primary}
        </p>
        {secondary && (
          <p className="text-[12.5px] text-[#8A9099] truncate">{secondary}</p>
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
          className="w-10 h-10 rounded-full border border-[#2A2F39] flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(180deg,#0F1115,#14171D)', boxShadow: SH1 }}
        >
          <Icon size={16} className="text-[#676D76]" />
        </div>
      )}
      <p className="text-[13.5px] text-[#8A9099]">{title}</p>
      {hint && <p className="text-[12.5px] text-[#676D76] mt-1">{hint}</p>}
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
  const sizing = size === 'sm' ? 'text-[12.5px] px-3 py-1.5' : 'text-[12.5px] px-3.5 py-[7px]'
  const palette =
    variant === 'primary'
      ? 'text-[#0B0D10] border border-[#FFFFFF] font-semibold bg-[#FAFAF8] hover:bg-[#242932] active:bg-[#FFFFFF] shadow-[0_1px_2px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)]'
      : variant === 'caution'
      ? 'text-[#E0A254] border border-[rgba(176,110,31,0.30)] bg-[#1A1E26] hover:border-[rgba(176,110,31,0.55)] hover:text-[#E0A254] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
      : variant === 'ghost'
      ? 'bg-transparent text-[#8A9099] hover:text-[#FAFAF8] hover:bg-[#14171D] border border-transparent'
      : 'text-[#FAFAF8] border border-[#2A2F39] bg-[linear-gradient(180deg,#14171D,#12151B)] hover:border-[#2A2F39] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_-1px_rgba(0,0,0,0.05)]'
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
