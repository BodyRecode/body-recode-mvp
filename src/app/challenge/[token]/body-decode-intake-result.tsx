'use client'

import type { IntakeResult } from './body-decode-intake'

// State-routed result card shown after the Day 0 Body Decode Intake. Each
// state gets the same "Challenge will work for you" framing but the right
// state also surfaces the more state-appropriate next product as an option.
//
// Depleted        → continue Challenge (perfect fit, no ascension shown)
// Transitioning   → continue Challenge OR jump to Blueprint ($97)
// Ready           → continue Challenge OR jump to Membership ($49/wk)
//
// Doctrine: cold-paid + gym-floor enrollers signed up for the free Challenge.
// "Continue Challenge" stays the default action. Ascension is the OPTION,
// framed as recommendation, not redirect. Honours the free Challenge promise.

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* State hero card */}
      <div style={{
        background: stateBg, border: `1px solid ${stateBorder}`, borderLeft: `4px solid ${stateColor}`,
        borderRadius: '14px', padding: '28px 28px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: stateColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your Body Decode read
        </p>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.2 }}>
          {state}
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6B6B', fontWeight: 600, marginBottom: '16px' }}>
          Score: {result.score} / 15
        </p>
        {result.profile && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Fat Map zone{result.profile_confidence === 'low' ? ' · provisional' : ''}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em', marginBottom: '4px' }}>
              {result.profile}
            </p>
            {result.profile_driver && (
              <p style={{ fontSize: '13px', color: '#6B6B6B', fontWeight: 500, margin: 0 }}>
                {result.profile_driver}
              </p>
            )}
          </div>
        )}
        <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>
          {result.profile_descriptor}
        </p>
      </div>

      {/* Primary action: Continue Challenge (always the default) */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderLeft: '3px solid #1B6DFC',
        borderRadius: '12px', padding: '22px 24px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Your next 14 days
        </p>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          {state === 'Depleted State' ? 'The Challenge is your fit.' :
           state === 'Transitioning State' ? 'The Challenge will work for you.' :
           'The Challenge will reset your baseline.'}
        </h3>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '18px' }}>
          {state === 'Depleted State'
            ? 'Your body is in protection mode and needs a structured reset before more input. The next 14 days are designed exactly for that.'
            : state === 'Transitioning State'
            ? 'Your body has capacity but it&apos;s inconsistent. The 14-day reset will surface the specific bottleneck so the next move is clear.'
            : 'Your foundations are intact. The 14 days will confirm what&apos;s working and lock in the rhythm so the next layer compounds.'}
        </p>
        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '15px 18px', borderRadius: '10px', border: 'none',
            background: '#1B6DFC', color: '#FFFFFF',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Continue with the Challenge
        </button>
      </div>

      {/* Ascension option — Transitioning shows Blueprint, Ready shows Membership */}
      {state === 'Transitioning State' && (
        <div style={{
          background: '#FAFAFA', border: '1px solid #E5E5E5',
          borderRadius: '12px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Or skip ahead · recommendation
          </p>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em', marginBottom: '8px' }}>
            Your state suggests Blueprint
          </h3>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '18px' }}>
            Transitioning bodies have capacity — what they need is the specific bottleneck identified and the right prescription. The 6-week Body Decode Blueprint ($97) does exactly that. The Challenge will still work; Blueprint is the higher-fit move.
          </p>
          <a
            href="https://bodyrecode.au/blueprint?from=challenge_day_zero&state=transitioning"
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              padding: '14px 18px', borderRadius: '10px',
              background: '#FFFFFF', color: '#1B6DFC',
              border: '1.5px solid #1B6DFC',
              fontSize: '14px', fontWeight: 700, textAlign: 'center',
              textDecoration: 'none', transition: 'all 0.15s ease',
            }}
          >
            See the Blueprint instead
          </a>
        </div>
      )}

      {state === 'Ready State' && (
        <div style={{
          background: '#FAFAFA', border: '1px solid #E5E5E5',
          borderRadius: '12px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Or skip ahead · recommendation
          </p>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em', marginBottom: '8px' }}>
            Your state suggests Membership
          </h3>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '18px' }}>
            Ready bodies don&apos;t need a reset — they need a continuous optimisation rhythm. Membership ($49/wk) gives you the ongoing programming + check-in cycle that turns foundations into compounding results. The Challenge will still work; Membership is the higher-fit move.
          </p>
          <a
            href="https://bodyrecode.au/membership?from=challenge_day_zero&state=ready"
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              padding: '14px 18px', borderRadius: '10px',
              background: '#FFFFFF', color: '#1B6DFC',
              border: '1.5px solid #1B6DFC',
              fontSize: '14px', fontWeight: 700, textAlign: 'center',
              textDecoration: 'none', transition: 'all 0.15s ease',
            }}
          >
            See Membership instead
          </a>
        </div>
      )}

      {/* Honest source note */}
      <p style={{ fontSize: '11px', color: '#999999', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        This read is based on what you just told us. Your coach can refine it from here.
      </p>
    </div>
  )
}
