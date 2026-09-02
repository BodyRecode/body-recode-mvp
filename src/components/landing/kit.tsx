'use client'

// ============================================================================
// Landing template kit — the reusable, tenant-aware section library extracted
// from the challenge / blueprint / membership pages. Every landing page is a
// composition of these components fed its own content. Design system:
// Pure White / Graphite (#1A1A1A) / Signal Blue (var(--lt-accent)).
//
// Because the pages already read coach()/brand()/logoUrl() from tenant config,
// composing a page from this kit is automatically white-label per coach.
// ============================================================================

import { useState } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { ChevronDown, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const BLUE = 'var(--lt-accent)'
export const INK = '#1A1A1A'
const CONTAINER = 680

// ---- Page shell -----------------------------------------------------------
// `accent` themes the whole template. Defaults to Body Recode Signal Blue, so
// existing BR pages are unchanged; pass a coach's brand colour for white-label.
export function LandingRoot({ children, accent = '#1B6DFC' }: { children: ReactNode; accent?: string }) {
  const themeVars = {
    '--lt-accent': accent,
    '--lt-accent-ink': `color-mix(in srgb, ${accent} 82%, #000)`,
    '--lt-accent-light': `color-mix(in srgb, ${accent} 55%, #fff)`,
    minHeight: '100vh', background: '#FFFFFF', color: INK,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as CSSProperties
  return (
    <div style={themeVars}>
      {/* Phone-first responsive helpers (inline styles can't hold media queries) */}
      <style>{`@media (max-width: 560px){ .lt-3col{ grid-template-columns:1fr !important } .lt-2col{ grid-template-columns:1fr !important } }`}</style>
      {children}
    </div>
  )
}

export function Nav({ logo, brandName }: { logo: string; brandName: string }) {
  return (
    <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: CONTAINER, margin: '0 auto' }}>
        <img src={logo} width="160" alt={brandName} style={{ display: 'block' }} />
      </div>
    </div>
  )
}

// ---- Section wrapper ------------------------------------------------------
type Bg = 'white' | 'tint' | 'grey' | 'dark'
const BG_MAP: Record<Bg, CSSProperties> = {
  white: { background: '#FFFFFF' },
  tint: { background: 'color-mix(in srgb, var(--lt-accent) 5%, #fff)', borderTop: '1px solid color-mix(in srgb, var(--lt-accent) 20%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--lt-accent) 20%, transparent)' },
  grey: { background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' },
  dark: { background: INK, position: 'relative', overflow: 'hidden' },
}

export function Section({ bg = 'white', borderTop = false, pad = '88px 24px', glow = false, children }: { bg?: Bg; borderTop?: boolean; pad?: string; glow?: boolean; children: ReactNode }) {
  return (
    <div style={{ ...BG_MAP[bg], ...(borderTop && bg === 'white' ? { borderTop: '1px solid #E5E5E5' } : {}) }}>
      {(bg === 'dark' || glow) && (
        <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--lt-accent) 15%, transparent) 0%, transparent 65%)', pointerEvents: 'none' }} />
      )}
      <div style={{ maxWidth: CONTAINER, margin: '0 auto', padding: pad, position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

// ---- Text primitives ------------------------------------------------------
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>{children}</p>
}

export function Heading({ children, muted, dark }: { children: ReactNode; muted?: ReactNode; dark?: boolean }) {
  return (
    <>
      <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0, color: dark ? '#FFFFFF' : INK, textWrap: 'balance' } as CSSProperties}>{children}</h2>
      {muted && <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0, color: '#999999' }}>{muted}</h2>}
    </>
  )
}

export function Lead({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <p style={{ fontSize: '16px', color: dark ? '#999999' : '#4A4A4A', lineHeight: 1.75, margin: '16px 0 0' }}>{children}</p>
}

export function Callout({ children, tone = 'tint' }: { children: ReactNode; tone?: 'tint' | 'solid' }) {
  const s = tone === 'solid'
    ? { background: 'color-mix(in srgb, var(--lt-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--lt-accent) 25%, transparent)' }
    : { background: 'color-mix(in srgb, var(--lt-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--lt-accent) 20%, transparent)' }
  return (
    <div style={{ ...s, borderRadius: '12px', padding: '20px 22px', marginTop: '24px' }}>
      <p style={{ fontSize: '17px', color: INK, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>{children}</p>
    </div>
  )
}

// ---- Hero -----------------------------------------------------------------
export function Hero({ badge, coachName, coachPhoto = '/kade.jpg', credentials, headline, headlineAccent, videoSlot, leads, stats, proofStrip, form }: {
  badge: string
  coachName: string
  coachPhoto?: string
  credentials: string
  headline: ReactNode
  headlineAccent?: ReactNode
  videoSlot?: ReactNode
  leads: string[]
  stats: { value: string; label: string }[]
  proofStrip?: ReactNode
  form: ReactNode
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--lt-accent) 12%, transparent) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0', left: '-100px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--lt-accent) 7%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: CONTAINER, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'color-mix(in srgb, var(--lt-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--lt-accent) 25%, transparent)', borderRadius: '99px', padding: '7px 16px', marginBottom: '20px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: BLUE }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--lt-accent-ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{badge}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <img src={coachPhoto} alt={coachName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center', border: '1px solid #E5E5E5', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: INK, margin: 0, lineHeight: 1.3 }}>Built by {coachName}</p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>{credentials}</p>
          </div>
        </div>
        <h1 style={{ fontSize: 'clamp(44px, 8vw, 68px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05, color: INK, marginBottom: '24px' }}>
          {headline}{headlineAccent && <><br /><span style={{ color: BLUE }}>{headlineAccent}</span></>}
        </h1>
        <div style={{ width: '48px', height: '3px', background: BLUE, borderRadius: '2px', marginBottom: '32px' }} />
        {videoSlot}
        {leads.map((l, i) => (
          <p key={i} style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: i === leads.length - 1 ? '40px' : '14px' }}>{l}</p>
        ))}
        <StatTiles stats={stats} />
        <div>{form}</div>
        {proofStrip}
      </div>
    </div>
  )
}

export function StatTiles({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="lt-3col" style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '10px', marginBottom: '32px' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '22px', fontWeight: 900, color: BLUE, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.value}</p>
          <p style={{ fontSize: '11px', color: '#999999', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export function ProofStrip({ items }: { items: { icon: LucideIcon; label: string }[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', marginTop: '22px' }}>
      {items.map(({ icon: Icon, label }) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#6B6B6B', fontWeight: 600 }}>
          <Icon size={15} strokeWidth={2.5} color={BLUE} /> {label}
        </span>
      ))}
    </div>
  )
}

// Real explainer video in the branded hero frame.
export function LandingVideo({ src, poster }: { src: string; poster?: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#1A1A1A', borderRadius: '14px', marginBottom: '32px', overflow: 'hidden', border: '1px solid #2C2C2C', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <video src={src} poster={poster} controls autoPlay muted playsInline preload="auto" controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={e => e.preventDefault()} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
    </div>
  )
}

// Branded "coming soon" video frame (used until a real explainer is produced).
export function VideoComingSoon({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1A1A1A 0%, #0B1F3F 100%)', border: '1px solid color-mix(in srgb, var(--lt-accent) 35%, transparent)', borderRadius: '14px', aspectRatio: '16 / 9', marginBottom: '32px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px -8px color-mix(in srgb, var(--lt-accent) 35%, transparent)' }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--lt-accent) 25%, transparent) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', textAlign: 'center', padding: '24px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'color-mix(in srgb, var(--lt-accent) 18%, transparent)', border: '1.5px solid rgba(255,255,255,0.4)', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginLeft: '4px' }}><polygon points="6,4 22,12 6,20" /></svg>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--lt-accent-light)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>{eyebrow}</p>
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em', margin: '0 0 6px', lineHeight: 1.25 }}>{title}</p>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A8A8E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Coming soon</p>
      </div>
    </div>
  )
}

// ---- Feature list (icon + timing + desc, featured highlight) --------------
export type Feature = { icon: LucideIcon; title: string; timing: string; desc: string; featured?: boolean }
export function FeatureList({ items }: { items: Feature[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => {
        const Icon = item.icon
        return (
          <div key={item.title} style={{ background: '#FFFFFF', border: item.featured ? `1px solid ${BLUE}` : '1px solid #E5E5E5', borderLeft: item.featured ? `3px solid ${BLUE}` : '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 22px', display: 'flex', gap: '18px', alignItems: 'flex-start', boxShadow: item.featured ? '0 1px 3px color-mix(in srgb, var(--lt-accent) 6%, transparent)' : 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.featured ? BLUE : 'color-mix(in srgb, var(--lt-accent) 8%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} strokeWidth={2} color={item.featured ? '#FFFFFF' : BLUE} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: INK, margin: 0, letterSpacing: '-0.005em' }}>{item.title}</p>
                <span style={{ fontSize: '10px', fontWeight: 700, color: item.featured ? 'var(--lt-accent-ink)' : '#6B6B6B', background: item.featured ? 'color-mix(in srgb, var(--lt-accent) 10%, transparent)' : '#F5F5F5', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.timing}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Colour-coded cards (the four patterns) -------------------------------
export type ColorCard = { name: string; colour: string; tag: string; signal: string; body: string; bodyLabel?: string }
export function ColorCardList({ items }: { items: ColorCard[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map(p => (
        <div key={p.name} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderLeft: `4px solid ${p.colour}`, borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: INK }}>{p.name}</span>
            <span style={{ fontSize: '12px', color: '#999999' }}>· {p.tag}</span>
          </div>
          <p style={{ fontSize: '13px', color: '#3A3A3A', lineHeight: 1.6, margin: '0 0 8px', fontWeight: 600 }}>{p.signal}</p>
          {p.bodyLabel && <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lt-accent-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{p.bodyLabel}</p>}
          <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>{p.body}</p>
        </div>
      ))}
    </div>
  )
}

// ---- Step list (phases / blocks) ------------------------------------------
export type Step = { number?: string; label: string; weeks: string; desc: string; status?: 'complete' | 'active' | 'upcoming' }
export function StepList({ items }: { items: Step[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(s => {
        const accent = s.status === 'complete' ? '#999999' : s.status === 'upcoming' ? '#E5E5E5' : BLUE
        return (
          <div key={s.label} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderLeft: s.status ? `4px solid ${accent}` : '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 22px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
            {s.number && (
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'color-mix(in srgb, var(--lt-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--lt-accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 800, color: BLUE }}>{s.number}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: s.status === 'complete' ? '#999999' : INK }}>{s.label}</span>
                <span style={{ fontSize: '12px', color: '#999999', fontWeight: 600 }}>{s.weeks}</span>
                {s.status === 'complete' && <span style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', background: '#F7F7F7', padding: '2px 8px', borderRadius: '99px' }}>Complete</span>}
                {s.status === 'active' && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lt-accent-ink)', background: 'color-mix(in srgb, var(--lt-accent) 10%, transparent)', padding: '2px 8px', borderRadius: '99px' }}>Starts here</span>}
              </div>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Edge line (dark single-statement band) -------------------------------
export function EdgeLine({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <Section bg="dark">
      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>{eyebrow}</p>
      <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 38px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#FFFFFF', margin: 0 }}>{children}</h2>
    </Section>
  )
}

// ---- Contrast block (red "usual" vs blue "our way") -----------------------
export function ContrastBlock({ wrong, right }: { wrong: { label: string; body: string }; right: { label: string; body: string } }) {
  return (
    <div style={{ display: 'grid', gap: '14px', marginTop: '4px' }}>
      <div style={{ background: '#FFF5F5', border: '1px solid #F3D4D4', borderRadius: '14px', padding: '22px 24px' }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: '#8B2E22', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{wrong.label}</p>
        <p style={{ fontSize: '16px', color: '#5A3A36', lineHeight: 1.65, margin: 0 }}>{wrong.body}</p>
      </div>
      <div style={{ background: 'color-mix(in srgb, var(--lt-accent) 6%, #fff)', border: '1px solid color-mix(in srgb, var(--lt-accent) 25%, transparent)', borderRadius: '14px', padding: '22px 24px' }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--lt-accent-ink)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{right.label}</p>
        <p style={{ fontSize: '16px', color: '#3A3A3A', lineHeight: 1.65, margin: 0 }}>{right.body}</p>
      </div>
    </div>
  )
}

// ---- Proof voices (real, consented client quotes) -------------------------
export type Voice = { quote: string; name: string; meta: string; stateShift?: string }
export function ProofVoices({ intro, voices }: { intro?: string; voices: Voice[] }) {
  return (
    <>
      {intro && <p style={{ fontSize: '15px', color: '#B4BAC3', lineHeight: 1.7, margin: '0 0 16px' }}>{intro}</p>}
      <div style={{ display: 'grid', gap: '12px' }}>
        {voices.map(v => (
          <div key={v.name} style={{ background: 'color-mix(in srgb, var(--lt-accent) 8%, transparent)', border: '1px solid rgba(77,141,255,0.35)', borderRadius: '14px', padding: '22px 24px' }}>
            {v.stateShift && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(16,160,100,0.14)', border: '1px solid rgba(16,160,100,0.35)', borderRadius: '999px', padding: '5px 12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#4FD6A0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>State progress · {v.stateShift}</span>
              </div>
            )}
            <p style={{ fontSize: '16.5px', color: '#FFFFFF', lineHeight: 1.6, margin: '0 0 12px', fontWeight: 500, fontStyle: 'italic' }}>&ldquo;{v.quote}&rdquo;</p>
            <p style={{ fontSize: '13px', color: '#8A93A0', margin: 0, fontWeight: 600 }}>{v.name} · {v.meta}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ---- Founder block --------------------------------------------------------
export function FounderBlock({ eyebrow, heading, photo, name, credentials, paras, callout }: {
  eyebrow: string; heading: string; photo: string; name: string; credentials: string; paras: string[]; callout: string
}) {
  return (
    <Section>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{ marginBottom: '28px' }}><Heading>{heading}</Heading></div>
      <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 0 0 1px color-mix(in srgb, var(--lt-accent) 15%, transparent), 0 24px 48px rgba(0,0,0,0.12)' }}>
        <img src={photo} alt={name} style={{ width: '100%', display: 'block', aspectRatio: '4 / 5', objectFit: 'cover', objectPosition: 'top center', filter: 'grayscale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(12,10,9,0.88) 100%)' }} />
        <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px' }}>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 3px' }}>{name}</p>
          <p style={{ fontSize: '13px', color: BLUE, margin: 0, fontWeight: 600 }}>{credentials}</p>
        </div>
      </div>
      {paras.map((p, i) => <p key={i} style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: i === paras.length - 1 ? '28px' : '18px' }}>{p}</p>)}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderLeft: `3px solid ${BLUE}`, borderRadius: '14px', padding: '22px 24px' }}>
        <p style={{ fontSize: '16px', color: INK, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>{callout}</p>
      </div>
    </Section>
  )
}

// ---- State filter ("is this for you") -------------------------------------
export type FilterRow = { state: string; desc: string; cta: string; href: string }
export function StateFilter({ eyebrow, heading, intro, subhead, rows, closer }: {
  eyebrow: string; heading: string; intro: string; subhead: string; rows: FilterRow[]; closer: string
}) {
  return (
    <Section bg="grey">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{ marginBottom: '24px' }}><Heading>{heading}</Heading></div>
      <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '20px' }}>{intro}</p>
      <p style={{ fontSize: '15px', color: INK, lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>{subhead}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
        {rows.map(row => (
          <div key={row.state} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '18px 20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--lt-accent-ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.state}</p>
            <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '14px' }}>{row.desc}</p>
            <a href={row.href} style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: BLUE, textDecoration: 'none', borderBottom: `1px solid ${BLUE}`, paddingBottom: '2px' }}>{row.cta} →</a>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '17px', color: INK, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>{closer}</p>
    </Section>
  )
}

// ---- CTA band -------------------------------------------------------------
export function CTASection({ dark = true, eyebrow, heading, headingMuted, sub, riskReversal, form }: {
  dark?: boolean; eyebrow: string; heading: ReactNode; headingMuted?: ReactNode; sub?: string; riskReversal?: ReactNode; form: ReactNode
}) {
  if (dark) {
    return (
      <Section bg="dark">
        <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>{eyebrow}</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#FFFFFF' }}>{heading}</h2>
        {sub && <p style={{ fontSize: '16px', color: '#999999', marginBottom: '32px', lineHeight: 1.65 }}>{sub}</p>}
        {riskReversal}
        {form}
      </Section>
    )
  }
  // light footer-style final CTA
  return (
    <div style={{ maxWidth: CONTAINER, margin: '0 auto', padding: '80px 24px 100px' }}>
      <div style={{ width: '40px', height: '3px', background: BLUE, marginBottom: '28px', borderRadius: '2px' }} />
      <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '20px', color: INK }}>
        {heading}{headingMuted && <><br /><span style={{ color: '#999999' }}>{headingMuted}</span></>}
      </h2>
      {sub && <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: riskReversal ? '28px' : '36px' }}>{sub}</p>}
      {riskReversal}
      {form}
    </div>
  )
}

export function RiskReversalRow({ items, icon: Icon }: { items: string[]; icon: LucideIcon }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginBottom: '32px' }}>
      {items.map(r => (
        <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#4A4A4A', fontWeight: 600 }}>
          <Icon size={13} strokeWidth={2.5} color={BLUE} /> {r}
        </span>
      ))}
    </div>
  )
}

// ---- FAQ accordion --------------------------------------------------------
export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div style={{ borderTop: '1px solid #E5E5E5' }}>
      {items.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
    </div>
  )
}
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #E5E5E5' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: INK, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={18} strokeWidth={2.5} color={BLUE} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>{a}</p>}
    </div>
  )
}

// ---- Signals list (the "symptoms / what you have been feeling" section) ----
// Ported 1:1 from the challenge page so every page can carry the same
// recognition beat. Inner content — place inside a <Section borderTop>.
export function SignalsList({ eyebrow, headline, headlineMuted, items, closing, icon: Icon = Zap }: { eyebrow: string; headline: string; headlineMuted: string; items: string[]; closing?: string; icon?: LucideIcon }) {
  return (
    <>
      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>{eyebrow}</p>
      <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '6px', color: INK }}>{headline}</h2>
      <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#999999', marginBottom: '28px' }}>{headlineMuted}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderTop: '1px solid #E5E5E5' }}>
        {items.map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid #E5E5E5' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(27, 109, 252, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} strokeWidth={2.5} color={BLUE} />
            </div>
            <p style={{ fontSize: '16px', color: '#3A3A3A', margin: 0, lineHeight: 1.4 }}>{item}</p>
          </div>
        ))}
      </div>
      {closing && (
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginTop: '32px', marginBottom: 0 }}>{closing}</p>
      )}
    </>
  )
}

// ---- Mechanism (the "here is why / the real problem" science band) ---------
// Self-contained blue-tint band (ported from the challenge page). 3-step
// physiology chain + a takeaway callout. Stacks on mobile via .lt-3col.
export function Mechanism({ eyebrow, headline, body, steps, takeaway }: { eyebrow: string; headline: string; body: string; steps: { k: string; v: string }[]; takeaway: string }) {
  return (
    <div style={{ background: '#F3F7FF', borderTop: '1px solid rgba(27, 109, 252,0.2)', borderBottom: '1px solid rgba(27, 109, 252,0.2)' }}>
      <div style={{ maxWidth: CONTAINER, margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>{eyebrow}</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: INK }}>{headline}</h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>{body}</p>
        <div className="lt-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '24px 0 28px' }}>
          {steps.map(step => (
            <div key={step.k} style={{ background: '#ffffff', border: '1px solid rgba(27,109,252,0.2)', borderRadius: '12px', padding: '16px 14px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: BLUE, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{step.k}</p>
              <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.5 }}>{step.v}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)', borderRadius: '12px', padding: '20px 22px' }}>
          <p style={{ fontSize: '17px', color: INK, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>{takeaway}</p>
        </div>
      </div>
    </div>
  )
}

// ---- Footer ---------------------------------------------------------------
export function Footer({ brandName, supportEmail }: { brandName: string; supportEmail: string }) {
  return (
    <div style={{ borderTop: '1px solid #E5E5E5', padding: '28px 24px' }}>
      <div style={{ maxWidth: CONTAINER, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '13px', color: '#999999', margin: 0 }}>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/privacy" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Terms</a>
          <a href={`mailto:${supportEmail}`} style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Contact</a>
        </div>
      </div>
    </div>
  )
}
