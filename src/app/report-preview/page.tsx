import ReportClient from '../report/[token]/report-client'

const PREVIEWS = {
  depleted: {
    name: 'Kade Dunstone',
    score: 6,
    body_state: 'Depleted State',
    section_scores: { '01': 1, '02': 1, '03': 1, '04': 2, '05': 1 },
  },
  transitioning: {
    name: 'Kade Dunstone',
    score: 10,
    body_state: 'Transitioning State',
    section_scores: { '01': 2, '02': 2, '03': 1, '04': 2, '05': 3 },
  },
  ready: {
    name: 'Kade Dunstone',
    score: 14,
    body_state: 'Ready State',
    section_scores: { '01': 3, '02': 3, '03': 3, '04': 3, '05': 2 },
  },
}

export default async function ReportPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>
}) {
  const { state } = await searchParams
  const key = (state === 'transitioning' || state === 'ready') ? state : 'depleted'
  const report = PREVIEWS[key]

  return (
    <>
      <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', zIndex: 9999,
        background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}>
        {(['depleted', 'transitioning', 'ready'] as const).map(s => (
          <a
            key={s}
            href={`/report-preview?state=${s}`}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              textDecoration: 'none',
              background: key === s ? '#14b8a6' : 'transparent',
              color: key === s ? '#0c0a09' : '#78716c',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </a>
        ))}
      </div>
      <ReportClient report={{ ...report, token: 'preview' }} />
    </>
  )
}
