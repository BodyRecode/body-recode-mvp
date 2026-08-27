'use client'

import type { IntakeResult } from './body-decode-intake'
import { CHECKIN_PATTERNS } from '@/lib/checkin-patterns'
import { PATTERN_DEFINITION_NOTE } from '@/lib/fat-map-profile'

// State-routed result card shown after the Day 0 Body Decode Intake. Goes
// meaningfully deeper than just the state name + zone descriptor:
//
//  1. State hero — name, score, zone
//  2. Per-section read — what each of the 5 scores actually means + a
//     "your floor" callout on the lowest section (the dominant signal)
//  3. Fat Map zone deep dive — three blocks (whatItMeans / whereItShows /
//     whatItIsNot) pulled from the shared CHECKIN_PATTERNS catalogue that
//     already powers the Day 14 Body Decode Report email. Same voice +
//     content as the rich Day 14 pattern moment, surfaced at Day 0.
//  4. State-routed next 14 days — Continue Challenge (default action)
//  5. Optional ascension card — Blueprint (Transitioning) or Membership
//     (Ready). Honours the free Challenge promise; Continue is the default.

const SECTION_LABELS: Record<'01' | '02' | '03' | '04' | '05', string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress',
  '04': 'Training Response',
  '05': 'Fat Loss Response',
}

// One-line reads per (section × score). Voice: short, doctrinal, direct.
// Doesn't moralise; reads each score as a signal, not a verdict.
const SECTION_READS: Record<'01' | '02' | '03' | '04' | '05', Record<1 | 2 | 3, string>> = {
  '01': {
    1: 'Crashing. Your daily fuel signal is broken. Caffeine is doing the work your physiology should be doing.',
    2: 'Inconsistent. Some days the system holds, some it doesn\'t. Not a foundation to build on yet.',
    3: 'Steady. Your energy regulation is intact. The foundation everything else builds on.',
  },
  '02': {
    1: 'Poor. You\'re not recovering overnight. Every downstream system is paying the price.',
    2: 'Patchy. Recovery is happening but not reliably enough to consolidate.',
    3: 'Solid. Overnight rebuild is working. The upstream of every other read.',
  },
  '03': {
    1: 'High. Chronic stress is the root signal. Cortisol is driving the compensation patterns you\'re feeling.',
    2: 'Moderate. Manageable but not low. The system stays slightly tight.',
    3: 'Low to moderate. Stress isn\'t dominating your physiology right now.',
  },
  '04': {
    1: 'Flat. Your body isn\'t converting the load you\'re putting in into adaptation.',
    2: 'Mixed. Some progress, but momentum keeps slipping before it consolidates.',
    3: 'Responding. Your body is converting training into adaptation. The engine works.',
  },
  '05': {
    1: 'Stalled. Effort isn\'t moving the result. This is the downstream symptom of everything upstream.',
    2: 'Slow. Some movement but not matching what you\'re putting in.',
    3: 'Moving. Composition is shifting in the right direction.',
  },
}

// Floor priority (mirrors pickFloor() in fat-map-profile.ts):
// Stress > Sleep > Energy > Training > Fat Loss. When sections tie at the
// lowest score, the higher-priority section is the floor — stress drives
// compensation most often, so it leads.
const FLOOR_PRIORITY: ('01' | '02' | '03' | '04' | '05')[] = ['03', '02', '01', '04', '05']

function findFloor(scores: Partial<Record<'01' | '02' | '03' | '04' | '05', number>>): '01' | '02' | '03' | '04' | '05' | null {
  const present = FLOOR_PRIORITY.filter(k => scores[k] != null)
  if (present.length === 0) return null
  let lowest = Infinity
  for (const k of present) if (scores[k]! < lowest) lowest = scores[k]!
  for (const k of FLOOR_PRIORITY) if (scores[k] != null && scores[k] === lowest) return k
  return present[0]
}

// Fat Map profile names → CHECKIN_PATTERNS keys.
// Profile names are PascalCase; pattern keys are lowercase semantic.
const PROFILE_TO_PATTERN_KEY: Record<string, string> = {
  'Stress-Stored': 'stress-stored',
  'Insulin-Drift': 'metabolic-drift',
  'Estrogen-Shift': 'hormonal-shift',
  'Androgen-Decline': 'system-overload',
}

export default function BodyDecodeIntakeResult({ result, onContinue }: {
  result: IntakeResult
  onContinue: () => void
}) {
  const state = result.body_state
  const stateColor =
    state === 'Depleted State' ? '#DC2626' :
    state === 'Transitioning State' ? '#D97706' :
    '#1B6DFC'
  const stateBg =
    state === 'Depleted State' ? 'rgba(220,38,38,0.06)' :
    state === 'Transitioning State' ? 'rgba(217,119,6,0.06)' :
    'rgba(27,109,252,0.06)'
  const stateBorder =
    state === 'Depleted State' ? 'rgba(220,38,38,0.25)' :
    state === 'Transitioning State' ? 'rgba(217,119,6,0.25)' :
    'rgba(27,109,252,0.25)'

  const floor = findFloor(result.section_scores ?? {})
  const patternKey = result.profile ? PROFILE_TO_PATTERN_KEY[result.profile] : null
  const pattern = patternKey ? CHECKIN_PATTERNS[patternKey] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 1. STATE HERO */}
      <div style={{
        background: stateBg, border: `1px solid ${stateBorder}`, borderLeft: `4px solid ${stateColor}`,
        borderRadius: '14px', padding: '28px 28px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: stateColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your Body Decode read
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#141821', letterSpacing: '-0.025em', marginBottom: '8px', lineHeight: 1.15 }}>
          {state}
        </h2>
        <p style={{ fontSize: '14px', color: '#666D7A', fontWeight: 600, marginBottom: '16px' }}>
          Score: {result.score} / 15
        </p>
        {result.profile && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Fat Map zone{result.profile_confidence === 'low' ? ' · provisional' : ''}
            </p>
            <p style={{ fontSize: '20px', fontWeight: 900, color: '#141821', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {result.profile}
            </p>
            {result.profile_driver && (
              <p style={{ fontSize: '13px', color: '#666D7A', fontWeight: 500, margin: 0 }}>
                {result.profile_driver}
              </p>
            )}
          </div>
        )}
        <p style={{ fontSize: '15px', color: '#43474F', lineHeight: 1.7, margin: 0 }}>
          {result.profile_descriptor}
        </p>
        {result.profile && (
          <p style={{ fontSize: '12px', color: '#666D7A', lineHeight: 1.6, margin: '14px 0 0' }}>
            {PATTERN_DEFINITION_NOTE}
          </p>
        )}
      </div>

      {/* 2. PER-SECTION READ */}
      {result.section_scores && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8EAEE',
          borderRadius: '14px', padding: '24px 26px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Your read, section by section
          </p>
          <p style={{ fontSize: '13px', color: '#666D7A', lineHeight: 1.7, margin: '0 0 22px' }}>
            What each of your five answers actually says about your body right now.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(['01', '02', '03', '04', '05'] as const).map(key => {
              const score = result.section_scores?.[key]
              if (score == null) return null
              const read = SECTION_READS[key][score as 1 | 2 | 3]
              const isFloor = floor === key
              const scoreColor = score === 1 ? '#DC2626' : score === 2 ? '#B7791F' : '#1056D6'
              const accentRgba = score === 1 ? '239,68,68' : score === 2 ? '245,158,11' : '27,109,252'
              return (
                <div key={key} style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  background: isFloor ? `rgba(${accentRgba},0.06)` : 'transparent',
                  border: isFloor ? `1px solid rgba(${accentRgba},0.2)` : '1px solid transparent',
                  borderLeft: isFloor ? `3px solid ${scoreColor}` : '3px solid transparent',
                  borderRadius: '10px', padding: isFloor ? '14px 16px' : '0 16px 0 19px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: `rgba(${accentRgba},0.12)`,
                    border: `1.5px solid ${scoreColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 900, color: scoreColor,
                  }}>
                    {score}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: '#141821', letterSpacing: '-0.005em', margin: 0 }}>
                        {SECTION_LABELS[key]}
                      </p>
                      {isFloor && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, color: scoreColor,
                          background: `rgba(${accentRgba},0.14)`, border: `1px solid ${scoreColor}55`,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '99px',
                        }}>
                          Your floor
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#43474F', lineHeight: 1.65, margin: 0 }}>
                      {read}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {floor && (
            <p style={{ fontSize: '12px', color: '#666D7A', lineHeight: 1.65, margin: '20px 0 0', fontStyle: 'italic' }}>
              Your floor is the section telling us the most. Everything else compensates around it — so it&apos;s where the next 14 days do their highest-leverage work.
            </p>
          )}
        </div>
      )}

      {/* 3. FAT MAP ZONE DEEP DIVE — only when a named zone exists */}
      {pattern && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8EAEE',
          borderLeft: `3px solid ${pattern.color}`,
          borderRadius: '14px', padding: '24px 26px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Inside your zone · {pattern.label}
          </p>
          <p style={{ fontSize: '14px', color: '#43474F', lineHeight: 1.7, margin: '0 0 24px' }}>
            {pattern.desc}
          </p>

          {/* What this pattern means */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#141821', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            What this pattern means
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
            {pattern.whatItMeans.map((para, i) => (
              <p key={i} style={{ fontSize: '14px', color: '#43474F', lineHeight: 1.7, margin: 0 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Where this shows up */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#141821', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Where this shows up in your day
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pattern.whereItShows.map((bullet, i) => (
              <li key={i} style={{ fontSize: '14px', color: '#43474F', lineHeight: 1.65, paddingLeft: '20px', position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 0, top: '8px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: pattern.color,
                }} />
                {bullet}
              </li>
            ))}
          </ul>

          {/* What this is NOT */}
          <div style={{
            background: '#FAFAFA', border: '1px solid #E8EAEE',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#666D7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              What this is NOT
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pattern.whatItIsNot.map((bullet, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#43474F', lineHeight: 1.65, paddingLeft: '18px', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 0, top: 0,
                    fontSize: '13px', fontWeight: 800, color: '#666D7A',
                  }}>
                    ×
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 4. PRIMARY ACTION — Continue Challenge (always the default) */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8EAEE', borderLeft: '3px solid #1B6DFC',
        borderRadius: '14px', padding: '24px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Your next 14 days
        </p>
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#141821', letterSpacing: '-0.015em', marginBottom: '8px' }}>
          {state === 'Depleted State' ? 'The Challenge is your fit.' :
           state === 'Transitioning State' ? 'The Challenge will work for you.' :
           'The Challenge will reset your baseline.'}
        </h3>
        <p style={{ fontSize: '14px', color: '#666D7A', lineHeight: 1.7, marginBottom: '18px' }}>
          {state === 'Depleted State'
            ? 'Your body is in protection mode and needs a structured reset before more input. The next 14 days are designed exactly for that.'
            : state === 'Transitioning State'
            ? 'Your body has capacity but it\'s inconsistent. The 14-day reset will surface the specific bottleneck so the next move is clear.'
            : 'Your foundations are intact. The 14 days will confirm what\'s working and lock in the rhythm so the next layer compounds.'}
        </p>
        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '16px 18px', borderRadius: '10px', border: 'none',
            background: '#1B6DFC', color: '#FFFFFF',
            fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em',
            cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 8px 20px -6px rgba(27,109,252,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          Continue with the Challenge <span aria-hidden>→</span>
        </button>
      </div>

      {/* ASCENSION OPTION REMOVED 2026-08-14.
          A "skip ahead" card used to sit here: Transitioning was pointed at
          Blueprint ($97), Ready at Membership ($49/wk), both wrapped in "the
          Challenge will still work; X is the higher-fit move".

          It was shown to 13 of the 20 people who completed Day 0 - 65% - and
          produced ZERO attributed leads.

          Day 0 is the point of least earned credibility in the whole funnel.
          They have completed one form, seen no pattern, and have no reason yet
          to trust us with $97. It also fought the ladder: challenge -> Blueprint
          belongs at DAY 14, off the back of the pattern read that makes the
          Blueprint make sense. Offering it here means the Day 14 pitch lands on
          someone who has already declined it once.

          Same call as removing the 1:1 CTA from the Day 14 page: one door.
          The state-to-stage mapping still governs routing from the SCORECARD,
          before someone enrols. Once they are in the Challenge, the Challenge
          is the path. Do not reintroduce. */}

      {/* Honest source note */}
      <p style={{ fontSize: '11px', color: '#98A0AD', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        This read is based on what you just told us. Your coach can refine it from here.
      </p>
    </div>
  )
}
