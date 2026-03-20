import { buildReportEmail } from '@/lib/generate-report'

export const dynamic = 'force-dynamic'

// Sample answers representing a moderate load profile for preview
const SAMPLE_ANSWERS: Record<string, number> = {
  effort_vs_result: 2,
  consistency: 1,
  training_response: 2,
  recovery_predictability: 2,
  planning_vs_reality: 1,
  week_variability: 2,
  body_signals: 1,
  external_load: 2,
  adjustments: 1,
  support: 2,
}

export default async function ReportPreviewPage() {
  const html = await buildReportEmail(
    'Sample',
    SAMPLE_ANSWERS,
    'Optimisation',
    process.env.BOOKING_LINK ?? 'https://bodyrecode.au/book-a-conversation'
  )

  return (
    <div>
      <div style={{ background: '#1c1917', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#10E1C2', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
          Body Recode™ — Report Preview
        </span>
        <span style={{ color: '#78716c', fontSize: '12px', fontFamily: 'sans-serif' }}>
          Sample answers · Optimisation band · This is exactly what the scheduled email will look like
        </span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
