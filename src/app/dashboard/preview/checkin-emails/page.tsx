import Link from 'next/link'
import {
  buildDay7ProgressEmail,
  buildDay14BodyDecodeReportEmail,
} from '@/lib/challenge-checkin-emails'

const firstName = 'Sarah'
const progressScore = 6
const markerRatings = {
  q1_energy: 'better',
  q2_sleep: 'better',
  q3_cravings: 'same',
  q4_digestion: 'better',
  q5_mood: 'better',
  q6_recovery: 'same',
  q7_strength: 'better',
  q8_weight: 'better',
}

const PATTERNS = [
  { slug: 'stress-stored', label: 'Stress-Stored Pattern' },
  { slug: 'metabolic-drift', label: 'Insulin-Drift Pattern' },
  { slug: 'hormonal-shift', label: 'Estrogen-Shift Pattern' },
  { slug: 'system-overload', label: 'Androgen-Decline Pattern' },
]

export default async function CheckinEmailsPreview({
  searchParams,
}: {
  searchParams: Promise<{ pattern?: string }>
}) {
  const { pattern } = await searchParams
  const selectedSlug = PATTERNS.find(p => p.slug === pattern)?.slug ?? 'stress-stored'
  const selectedLabel = PATTERNS.find(p => p.slug === selectedSlug)?.label ?? 'Stress-Stored Pattern'

  const day7 = buildDay7ProgressEmail({ firstName, progressScore, markerRatings })
  const day14 = buildDay14BodyDecodeReportEmail({
    firstName,
    patternSlug: selectedSlug,
    progressScore,
  })

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
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Body Decode Check-In · Two-stage email preview
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
              Day 7 Progress (left) · Day 14 Body Decode Report (right)
            </h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: 1.5 }}>
              Sample data: <strong>{firstName}</strong>, progress score <strong>{progressScore}/8</strong>, pattern <strong>{selectedLabel}</strong>.
              Both emails are rendered via the actual <code>buildDay7ProgressEmail</code> and <code>buildDay14BodyDecodeReportEmail</code> builders — what you see here is exactly what gets sent.
            </p>
          </div>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to dashboard
          </Link>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 0' }}>
            Day 14 pattern:
          </span>
          {PATTERNS.map(p => (
            <Link
              key={p.slug}
              href={`/dashboard/preview/checkin-emails?pattern=${p.slug}`}
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: selectedSlug === p.slug ? '#FFFFFF' : '#1A1A1A',
                background: selectedSlug === p.slug ? '#1B6DFC' : '#FFFFFF',
                border: '1px solid ' + (selectedSlug === p.slug ? '#1B6DFC' : '#E5E5E5'),
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px 32px 48px' }}>
        <div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Sent on Check-In submission, Day 7-13
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Subject: <span style={{ fontWeight: 500 }}>{day7.subject}</span>
            </p>
          </div>
          <iframe
            srcDoc={day7.html}
            style={{ width: '100%', minHeight: '1400px', border: '1px solid #E5E5E5', borderRadius: '12px', background: '#FFFFFF' }}
            title="Day 7 Progress email"
          />
        </div>

        <div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Sent on Day 14 (Inngest) OR immediately for late-takers
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Subject: <span style={{ fontWeight: 500 }}>{day14.subject}</span>
            </p>
          </div>
          <iframe
            srcDoc={day14.html}
            style={{ width: '100%', minHeight: '1800px', border: '1px solid #E5E5E5', borderRadius: '12px', background: '#FFFFFF' }}
            title="Day 14 Body Decode Report email"
          />
        </div>
      </div>
    </div>
  )
}
