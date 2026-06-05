import Link from 'next/link'
import {
  buildDay7ProgressEmail,
  buildDay14BodyDecodeReportEmail,
  buildDay5UnlockEmail,
  buildDay14FallbackEmail,
} from '@/lib/challenge-checkin-emails'
import { buildChallengeWelcomeEmail } from '@/lib/challenge-welcome-email'

const SAMPLE = {
  firstName: 'Sarah',
  portalUrl: 'https://bodyrecode.au/challenge/sample-token-here',
  sessionVideoUrl: 'https://bodyrecode.au/challenge/sample-token-here',
  progressScore: 6,
  markerRatings: {
    q1_energy: 'better',
    q2_sleep: 'better',
    q3_cravings: 'same',
    q4_digestion: 'better',
    q5_mood: 'better',
    q6_recovery: 'same',
    q7_strength: 'better',
    q8_weight: 'better',
  },
}

const PATTERNS = [
  { slug: 'stress-stored', label: 'Stress-Stored Pattern' },
  { slug: 'metabolic-drift', label: 'Insulin-Drift Pattern' },
  { slug: 'hormonal-shift', label: 'Estrogen-Shift Pattern' },
  { slug: 'system-overload', label: 'Androgen-Decline Pattern' },
]

type EmailKey =
  | 'welcome'
  | 'welcome-returning'
  | 'day5'
  | 'day7'
  | 'day14-report'
  | 'day14-fallback'

const EMAIL_TABS: { key: EmailKey; label: string; trigger: string; iframeHeight: number }[] = [
  { key: 'welcome', label: 'Welcome (new)', trigger: 'Sent on first Challenge enrolment (synchronous from /api/challenge/enroll)', iframeHeight: 1200 },
  { key: 'welcome-returning', label: 'Welcome (returning)', trigger: 'Sent when an existing participant re-submits the signup form. No new drip scheduled.', iframeHeight: 1100 },
  { key: 'day5', label: 'Day 5 unlock', trigger: 'Sent on Day 5 by Inngest when the Week One Progress Session unlocks.', iframeHeight: 1300 },
  { key: 'day7', label: 'Day 7 Progress', trigger: 'Sent on Check-In submission, Day 7-13. No pattern reveal.', iframeHeight: 1400 },
  { key: 'day14-report', label: 'Day 14 Body Decode Report', trigger: 'Sent on Day 14 (Inngest) OR immediately for late-takers (Day 14+ submission).', iframeHeight: 1800 },
  { key: 'day14-fallback', label: 'Day 14 fallback', trigger: 'Sent on Day 14 by Inngest when the participant did NOT complete the Check-In. No result content.', iframeHeight: 1400 },
]

export default async function ChallengeEmailsPreview({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; pattern?: string }>
}) {
  const { email, pattern } = await searchParams
  const selectedEmail: EmailKey =
    (EMAIL_TABS.find(t => t.key === email)?.key) ?? 'welcome'
  const selectedPatternSlug = PATTERNS.find(p => p.slug === pattern)?.slug ?? 'stress-stored'
  const selectedPatternLabel = PATTERNS.find(p => p.slug === selectedPatternSlug)?.label ?? 'Stress-Stored Pattern'

  const built = (() => {
    switch (selectedEmail) {
      case 'welcome':
        return buildChallengeWelcomeEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          returning: false,
        })
      case 'welcome-returning':
        return buildChallengeWelcomeEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          returning: true,
        })
      case 'day5':
        return buildDay5UnlockEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          sessionVideoUrl: SAMPLE.sessionVideoUrl,
        })
      case 'day7':
        return buildDay7ProgressEmail({
          firstName: SAMPLE.firstName,
          progressScore: SAMPLE.progressScore,
          markerRatings: SAMPLE.markerRatings,
        })
      case 'day14-report':
        return buildDay14BodyDecodeReportEmail({
          firstName: SAMPLE.firstName,
          patternSlug: selectedPatternSlug,
          progressScore: SAMPLE.progressScore,
        })
      case 'day14-fallback':
        return buildDay14FallbackEmail({ firstName: SAMPLE.firstName })
    }
  })()

  const currentTab = EMAIL_TABS.find(t => t.key === selectedEmail)!
  const showsPatternSwitcher = selectedEmail === 'day14-report'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        padding: '20px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              14-Day Body Decode Challenge · Email preview
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
              All six Challenge emails, rendered via the actual production builders.
            </h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: 1.5 }}>
              Sample data: <strong>{SAMPLE.firstName}</strong> · progress score <strong>{SAMPLE.progressScore}/8</strong>{showsPatternSwitcher ? <> · pattern <strong>{selectedPatternLabel}</strong></> : null}. What you see is exactly what gets sent.
            </p>
          </div>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to dashboard
          </Link>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EMAIL_TABS.map(tab => {
            const active = tab.key === selectedEmail
            const href = `/dashboard/preview/challenge-emails?email=${tab.key}${tab.key === 'day14-report' ? `&pattern=${selectedPatternSlug}` : ''}`
            return (
              <Link
                key={tab.key}
                href={href}
                style={{
                  display: 'inline-block',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: active ? '#FFFFFF' : '#1A1A1A',
                  background: active ? '#1B6DFC' : '#FFFFFF',
                  border: '1px solid ' + (active ? '#1B6DFC' : '#E5E5E5'),
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {showsPatternSwitcher && (
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 0' }}>
              Pattern:
            </span>
            {PATTERNS.map(p => {
              const active = p.slug === selectedPatternSlug
              return (
                <Link
                  key={p.slug}
                  href={`/dashboard/preview/challenge-emails?email=day14-report&pattern=${p.slug}`}
                  style={{
                    display: 'inline-block',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: active ? '#FFFFFF' : '#1A1A1A',
                    background: active ? '#1B6DFC' : '#FFFFFF',
                    border: '1px solid ' + (active ? '#1B6DFC' : '#E5E5E5'),
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {currentTab.trigger}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Subject: <span style={{ fontWeight: 500 }}>{built!.subject}</span>
          </p>
        </div>
        <iframe
          srcDoc={built!.html}
          style={{
            width: '100%',
            minHeight: `${currentTab.iframeHeight}px`,
            border: '1px solid #E5E5E5',
            borderRadius: '12px',
            background: '#FFFFFF',
          }}
          title={`${currentTab.label} email preview`}
        />
      </div>
    </div>
  )
}
