'use client'

import { useEffect } from 'react'
import { coach, brand } from '@/config/tenant'

const SECTIONS = ['Energy', 'Sleep', 'Stress Load', 'Training Response', 'Fat Loss Response']
const SECTION_KEYS = ['01', '02', '03', '04', '05']

const STATE_CONTENT: Record<string, {
  color: string
  bg: string
  border: string
  headline: string
  biology: string
  whatIsHappening: string
  primaryFocus: string
  stopDoing: string[]
  startDoing: string[]
}> = {
  'Depleted State': {
    color: '#DC2626',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    headline: 'Your body is in protection mode.',
    biology: 'When cortisol stays chronically elevated from stress, poor sleep, high training load, or low food intake, your body shifts into a conservation state. Metabolism slows. Fat storage increases, particularly around the midsection. Output down-regulates and recovery between sessions becomes incomplete. Your body is not broken. It is doing exactly what it is designed to do when it perceives threat. The problem is that most of the interventions people apply in this state (more training, less food, stricter protocols) accelerate the problem rather than solving it.',
    whatIsHappening: 'In a depleted state, fat loss and performance adaptation are biologically downregulated. Your body is prioritising survival functions over body composition change. This is not a willpower issue. No amount of discipline overrides physiology when the system is in threat mode. The path out is not harder, it is smarter.',
    primaryFocus: 'Restore before you push. The first priority is reducing the biological stress load: sleep quality, recovery between sessions, and removing the inputs that are keeping the body under stress. Fat loss and performance follow. They do not lead.',
    stopDoing: [
      'Training at high intensity when recovery is incomplete',
      'Cutting calories below maintenance. This deepens the depletion.',
      'Using stimulants to push through energy crashes',
      'Treating symptoms (low energy, stalled fat loss) without addressing the cause',
    ],
    startDoing: [
      'Prioritise 7–9 hours of sleep above all other interventions',
      'Reduce training intensity and volume temporarily, not permanently',
      'Eat at or above maintenance for 2–4 weeks to restore metabolic function',
      'Identify and reduce the primary chronic stress source',
    ],
  },
  'Transitioning State': {
    color: '#B7791F',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    headline: 'Your body has capacity but something is limiting it.',
    biology: 'A transitioning state means your biology is not in crisis, but it is not running cleanly either. There is usually one or two limiting factors creating inconsistency: a sleep pattern that is not quite restoring you fully, a stress load that fluctuates, or a training and nutrition approach that is close but not calibrated to your current state. The body has the capacity to respond. The response is just being throttled.',
    whatIsHappening: 'You are getting results sometimes, but not consistently. The effort you put in does not always translate. That inconsistency is a signal. Something in the inputs is mismatched with what your body needs right now. The good news is that a transitioning state responds quickly to accurate adjustments. You do not need to overhaul everything. You need to identify the specific bottleneck and remove it.',
    primaryFocus: 'Identify the limiting factor. Your lowest-scoring sections are your bottlenecks. Fix the constraint, not the symptom. If your sleep score is low, better nutrition will not unlock the result. If your stress load is high, more training will not solve the plateau.',
    stopDoing: [
      'Adding more inputs (more sessions, more tracking, more supplements) before fixing the basics',
      'Switching programs when the issue is recovery, not programming',
      'Ignoring the inconsistency and hoping it resolves on its own',
    ],
    startDoing: [
      'Audit your lowest-scoring area and address it specifically',
      'Establish a consistent sleep and recovery baseline before intensifying training',
      'Align your training load with your actual recovery capacity, not your ideal capacity',
    ],
  },
  'Ready State': {
    color: '#1B6DFC',
    bg: 'rgba(27, 109, 252,0.06)',
    border: 'rgba(27, 109, 252,0.2)',
    headline: 'Your biology is in a position to respond.',
    biology: 'A ready state means your core biological systems (energy, sleep, stress, and recovery) are functioning well enough that your body can actually respond to the inputs you give it. The system is not stuck in a stress response. Recovery between sessions is happening. Your metabolism is not suppressed. This is the state where training and nutrition changes produce visible, consistent results.',
    whatIsHappening: 'If you are in a ready state but fat loss or performance is still not moving, the issue is in the prescription, not the biology. Your training, nutrition, or both need to be adjusted to actually drive adaptation. You have the foundation. The question now is whether the programme is precise enough to produce the outcome you are after.',
    primaryFocus: 'Optimise the prescription. Your body is ready to respond, make sure what you are giving it is accurate enough to produce results. Vague protocols do not produce precise outcomes. At this state, specificity is everything.',
    stopDoing: [
      'Running generic programmes that are not calibrated to your specific goals',
      'Maintaining the same approach because it used to work, adapt as you progress',
      'Underestimating recovery, even in a ready state, overreaching will erode it',
    ],
    startDoing: [
      'Dial in your training stimulus, progressive overload, frequency, and specificity',
      'Audit your nutrition: total intake, protein target, and meal timing relative to training',
      'Track your response over 4–6 week blocks and adjust based on data',
    ],
  },
}

const SECTION_INTERPRETATIONS: Record<string, Record<number, string>> = {
  Energy: {
    1: 'Your energy is unreliable. Caffeine dependency and afternoon crashes are signs your body is running on stress rather than steady energy. That is the pattern of a system stuck in a stress response, and it resists fat loss and blunts training adaptation.',
    2: 'Your energy is inconsistent. Some days feel fine, others do not. This variability usually points to fluctuating blood sugar, incomplete recovery, or a stress load that spikes and dips. Consistent energy is a sign of a regulated system. Inconsistency is a signal that something is interfering.',
    3: 'Your energy is stable and reliable. This is a strong sign your body is running on steady energy rather than stress, and your metabolism is not suppressed. Stable energy without caffeine dependency is one of the clearest signs your body is in a position to respond to training and nutrition inputs.',
  },
  Sleep: {
    1: 'Your sleep is not restoring you. Poor sleep quality and broken sleep are among the most powerful suppressors of fat loss and performance. Deep sleep is when the body does most of its repair and clears the day\'s stress load. Without it, recovery is incomplete, hunger signals are disrupted, and the system stays under stress.',
    2: 'Your sleep is inconsistent. Most nights are okay but not reliably restorative. This creates an unpredictable recovery baseline, your body cannot consistently clear the stress load from training and daily life, which creates inconsistent results even when your other inputs are on point.',
    3: 'You are sleeping well and waking rested. This is the foundation everything else is built on. Consistent quality sleep means your recovery system is functioning, your rhythm is maintained, and your body has the capacity to adapt to training stimuli.',
  },
  'Stress Load': {
    1: 'Your stress load is high. Chronic psychological and physiological stress keeps the body in a continuous stress response, which directly competes with fat loss, muscle retention, and recovery. High stress is often the hidden driver behind plateaus that do not respond to changes in training or nutrition. The real problem is systemic, not programmatic.',
    2: 'Your stress load is moderate. It is manageable most of the time but it is not low. This level of background stress is enough to create inconsistency in results, particularly in fat loss response and recovery. It may not feel like a significant issue day-to-day, but it is affecting your body\'s ability to respond.',
    3: 'Your stress load is low to moderate. This is a meaningful advantage. When the system is not under chronic stress pressure, it can allocate resources toward adaptation, fat loss, muscle development, and performance improvement. This is the foundation of a responsive state.',
  },
  'Training Response': {
    1: 'Your training is not producing adaptation. Flat or declining performance and a body that feels beaten up are signs of accumulated fatigue, incomplete recovery, or a mismatch between training load and your current biological capacity. More training in this state does not solve the problem, it deepens it.',
    2: 'Your training response is inconsistent. You are making some progress but cannot build momentum. This pattern usually indicates that recovery is not keeping pace with training demand. Either the volume is slightly too high, sleep and nutrition are not supporting it, or stress load is interfering with adaptation.',
    3: 'You are responding well to training. Consistent progress, increasing performance, and recovering between sessions are the hallmarks of a responsive system. Your training load and recovery capacity are aligned. This is the state where structured progressive overload produces reliable results.',
  },
  'Fat Loss Response': {
    1: 'Your body is actively resisting fat loss. When someone is doing everything right on paper (clean eating, consistent training) and the body is not responding, it is almost always a biological state issue, not a discipline issue. The body in a depleted or high-stress state suppresses fat oxidation as a survival mechanism. Eating less and training more in this state makes it worse.',
    2: 'Your fat loss is slow or stalled. Movement is inconsistent relative to the effort going in. This gap between input and output usually points to a metabolic adaptation from dieting history, training load exceeding recovery, or a stress and recovery imbalance that is blunting response. The fix is rarely more effort. It is usually a recalibration.',
    3: 'Your body is responding and composition is shifting. This is the clearest signal that your biological state is aligned with your goals. The system is not in resistance mode. If you are in this position, the focus should be on precision, making sure the programme is specific enough to drive the outcome you are after at the rate you want.',
  },
}

function getScoreColor(score: number) {
  if (score === 1) return '#DC2626'
  if (score === 2) return '#B7791F'
  return '#1B6DFC'
}

function getScoreLabel(score: number) {
  if (score === 1) return 'Needs attention'
  if (score === 2) return 'Developing'
  return 'Functioning well'
}

export default function ReportClient({ report }: { report: {
  name: string
  score: number
  body_state: string
  section_scores: Record<string, number>
  token: string
} }) {
  const c = coach()
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead')
    }
  }, [])

  const firstName = report.name.split(' ')[0]
  const state = STATE_CONTENT[report.body_state] ?? STATE_CONTENT['Transitioning State']
  const scores = report.section_scores as Record<string, number>

  const lowestSections = SECTION_KEYS
    .map((key, i) => ({ key, name: SECTIONS[i], score: scores[key] ?? 2 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

  function handleDownload() {
    window.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/logo-black.png" alt={brand().name} style={{ height: '64px' }} />
        <button
          className="no-print"
          onClick={handleDownload}
          style={{
            padding: '10px 20px', background: '#1B6DFC', color: '#FFFFFF',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Download PDF
        </button>
      </div>

      {/* Hero with Signal Blue radial glows — matches /challenge landing page */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 24px 32px', position: 'relative' }}>

          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '20px',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Body Decode Report
            </span>
          </div>

          {/* Founder byline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <img
              src={c.photoUrl}
              alt={c.fullName}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                objectFit: 'cover', objectPosition: 'top center',
                border: '1px solid #E5E5E5', flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
                Prepared by {c.fullName}
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>
                {c.credentials}
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 56px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 22px', color: '#1A1A1A',
          }}>
            {firstName}, here is what your body is telling you.
          </h1>

          {/* 48×3 Signal Blue divider */}
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />

          {/* Lead */}
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Based on your Body State Scorecard results. Score: <strong style={{ color: '#1A1A1A' }}>{report.score}/15</strong>.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Body State */}
        <div style={{ background: state.bg, border: `1px solid ${state.border}`, borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: state.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: state.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{report.body_state}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: 1.3 }}>
            {state.headline}
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            {state.biology}
          </p>
        </div>

        {/* Score Breakdown */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Your section scores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SECTIONS.map((section, i) => {
              const key = SECTION_KEYS[i]
              const s = scores[key] ?? 2
              const c = getScoreColor(s)
              return (
                <div key={key} style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>{section}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: c }}>{getScoreLabel(s)}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: n === s ? `rgba(${s === 1 ? '220,38,38' : s === 2 ? '183,121,31' : '27,109,252'},0.15)` : '#E5E5E5',
                            border: `1.5px solid ${n === s ? c : '#E5E5E5'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', fontWeight: 700, color: n === s ? c : '#4A4A4A',
                          }}>{n}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
                    {SECTION_INTERPRETATIONS[section]?.[s] ?? ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* What is working against you */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            What is working against you right now
          </h3>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '16px' }}>
            {state.whatIsHappening}
          </p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '0' }}>
            Your lowest-scoring areas (<strong style={{ color: '#1A1A1A' }}>{lowestSections[0]?.name}</strong>{lowestSections[1] ? <> and <strong style={{ color: '#1A1A1A' }}>{lowestSections[1].name}</strong></> : null}) are the most likely bottlenecks. Address these before adding more intensity elsewhere.
          </p>
        </div>

        {/* Stop doing */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Stop doing
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {state.stopDoing.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', marginTop: '7px', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start doing */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            What to focus on first
          </h3>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '20px' }}>
            {state.primaryFocus}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {state.startDoing.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1B6DFC', marginTop: '7px', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — light featured card matching the design system */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderLeft: '3px solid #1B6DFC',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 1px 4px rgba(27, 109, 252, 0.06)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 10px' }}>
            Next Step
          </p>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.25 }}>
            The report tells you the state. A call tells you the fix.
          </h3>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '24px' }}>
            We go through your results together, identify the specific driver behind what is not working, and map out exactly what needs to change first. Free. 30 minutes. No pitch.
          </p>
          <a
            href={`${brand().marketingDomain}/book`}
            style={{
              display: 'inline-block', padding: '14px 28px', borderRadius: '10px',
              background: '#1B6DFC', color: '#FFFFFF',
              fontSize: '15px', fontWeight: 800, textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Book a free call
          </a>
        </div>

        <p style={{ fontSize: '12px', color: '#9B9B9B', lineHeight: 1.6, margin: '4px 0 0' }}>
          This report describes patterns and general mechanisms, not a measurement of your hormones or a medical diagnosis. Where something is worth checking clinically, we will flag it and point you to your doctor.
        </p>

      </div>
    </div>
  )
}
