'use client'

import Link from 'next/link'
import { brand } from '@/config/tenant'
import { CHECKIN_PATTERNS } from '@/lib/checkin-patterns'
import { DECODE_DAYS, isDayUnlocked } from '@/lib/decode-days'

const SECTION_LABELS: Record<'01' | '02' | '03' | '04' | '05', string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress load',
  '04': 'Training response',
  '05': 'Fat loss response',
}

// Floor priority mirrors pickFloor() in fat-map-profile.ts: stress beats sleep
// beats energy beats training beats fat loss. On a tie at the lowest score the
// higher-priority section wins, because stress drives the others.
const FLOOR_PRIORITY = ['03', '02', '01', '04', '05'] as const

function twoLowest(scores: Record<string, number> | null): ('01' | '02' | '03' | '04' | '05')[] {
  if (!scores) return []
  return [...FLOOR_PRIORITY]
    .filter(k => typeof scores[k] === 'number')
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, 2)
}

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

export default function DecodePortalClient({
  token,
  firstName,
  hasRead,
  bodyState,
  sectionScores,
  profile,
  patternKey,
  currentDay,
}: {
  token: string
  firstName: string
  hasRead: boolean
  bodyState: string | null
  sectionScores: Record<string, number> | null
  profile: string | null
  patternKey: string | null
  currentDay: number
}) {
  const pattern = patternKey ? CHECKIN_PATTERNS[patternKey] : null
  const lowest = twoLowest(sectionScores)

  // No scorecard on file means there is no read to explain. Send her to take it
  // rather than showing five locked cards about a result she does not have.
  if (!hasRead) {
    return (
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '64px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          The Body Decode
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 14px' }}>
          One thing first, {firstName}.
        </h1>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 28px' }}>
          The five days explain your read, so we need the read before they make any sense. It is about two minutes of questions and there is nothing to pay.
        </p>
        <a
          href={`${brand().performanceDomain}/scorecard?source=decode_portal`}
          style={{
            display: 'block', padding: '18px', borderRadius: '12px', background: BLUE,
            color: '#FFFFFF', fontSize: '17px', fontWeight: 800, textAlign: 'center', textDecoration: 'none',
          }}
        >
          Get my read
        </a>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 72px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        The Body Decode · Day {Math.min(currentDay, DECODE_DAYS.length)} of {DECODE_DAYS.length}
      </p>
      <h1 style={{ fontSize: '30px', fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 28px' }}>
        Your read, {firstName}.
      </h1>

      {/* Her result at a glance. A summary of the full read below, never a
          substitute for it - the whole document is one tap away and always
          has been. */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '22px 24px', marginBottom: '14px' }}>
        {bodyState && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Your readiness
            </p>
            <p style={{ fontSize: '19px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 18px' }}>
              {bodyState}
            </p>
          </>
        )}

        {lowest.length === 2 && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Your two lowest
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {lowest.map(k => (
                <span key={k} style={{
                  fontSize: '13px', fontWeight: 700, color: INK,
                  background: 'rgba(27,109,252,0.07)', border: '1px solid rgba(27,109,252,0.22)',
                  padding: '7px 12px', borderRadius: '8px',
                }}>
                  {SECTION_LABELS[k]} · {sectionScores?.[k]}/3
                </span>
              ))}
            </div>
          </>
        )}

        <p style={{ fontSize: '10px', fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Your pattern
        </p>
        {pattern ? (
          <p style={{ fontSize: '19px', fontWeight: 800, color: pattern.color, letterSpacing: '-0.015em', margin: 0 }}>
            {pattern.label}
          </p>
        ) : (
          // Indeterminate is a real outcome, not an error. Say so plainly rather
          // than leaving a blank where a name should be.
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
            Your answers do not point cleanly at one of the four. That is a real result, not a missing one. Your five scores still stand and the five days still run.
          </p>
        )}
      </div>

      {/* Option B, chosen 24 Aug 2026: the read is complete and open from minute
          ten and the five days are a guided walk through it, not a release of
          it. So this CTA sits ABOVE the day cards - the whole document is the
          first thing offered, and the lessons are the help. */}
      <Link
        href={`/decode/${token}/read`}
        style={{
          display: 'block', padding: '17px', borderRadius: '12px', background: BLUE,
          color: '#FFFFFF', fontSize: '16px', fontWeight: 800, textAlign: 'center',
          textDecoration: 'none', marginBottom: '14px',
        }}
      >
        Read the whole thing
      </Link>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, margin: '0 0 28px' }}>
        It is all there now, nothing unlocks later. Over the next five days I will walk you through it a part at a time, because it is a lot to take in at once.
      </p>

      {/* The five days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {DECODE_DAYS.map(d => {
          const unlocked = isDayUnlocked(d.day, currentDay)
          const isToday = d.day === Math.min(currentDay, DECODE_DAYS.length)

          const inner = (
            <div style={{
              background: unlocked ? '#FFFFFF' : '#FAFAFA',
              border: isToday ? `1.5px solid ${BLUE}` : '1px solid #E5E5E5',
              borderRadius: '12px', padding: '18px 20px',
              opacity: unlocked ? 1 : 0.62,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: unlocked ? BLUE : MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {d.eyebrow}
                </span>
                {isToday && (
                  <span style={{
                    fontSize: '9px', fontWeight: 800, color: '#FFFFFF', background: BLUE,
                    letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '99px',
                  }}>
                    Today
                  </span>
                )}
                {!unlocked && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: MUTED }}>
                    Day {d.day}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '17px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 5px' }}>
                {d.title}
              </p>
              {/* The premise shows on locked cards too. A locked card that says
                  nothing gives her no reason to come back tomorrow. */}
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.6, margin: 0 }}>
                {d.premise}
              </p>
            </div>
          )

          return unlocked ? (
            <Link key={d.day} href={`/decode/${token}/day/${d.day}`} style={{ textDecoration: 'none', display: 'block' }}>
              {inner}
            </Link>
          ) : (
            <div key={d.day}>{inner}</div>
          )
        })}
      </div>
    </main>
  )
}
