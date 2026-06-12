// Stage 4 ascension CTA — surfaced at a product's completion / high-intent
// moment so a client can go straight to 1:1 coaching from any stage
// (Challenge / Blueprint / Membership). See the Stage 4 Ascension Spec.
//
// Plain presentational component (no hooks, no 'use client') so it works in
// both server and client portal pages. Routes to the live coaching path
// (book a free call) with a ?from= tag for stage attribution.

export function CoachingAscensionCTA({
  source,
  variant = 'secondary',
}: {
  source: string
  variant?: 'primary' | 'secondary'
}) {
  const primary = variant === 'primary'
  const href = `https://bodyrecode.au/book?from=${source}`
  return (
    <div style={{
      maxWidth: 640, margin: '0 auto', textAlign: 'center', boxSizing: 'border-box',
      background: primary ? '#021A4D' : '#FFFFFF',
      border: primary ? '2px solid #1B6DFC' : '1px solid #E5E5E5',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: primary ? '#B5CFFC' : '#1056D6', margin: '0 0 6px' }}>
        Skip ahead · the ceiling
      </p>
      <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em', color: primary ? '#FFFFFF' : '#1A1A1A', margin: '0 0 6px' }}>
        Ready for 1:1 coaching?
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: primary ? '#B5CFFC' : '#4A4A4A', margin: '0 0 16px' }}>
        {"If you'd rather have a coach reading your body and writing your plan every week, you can go straight to 1:1 Performance Coaching from here."}
      </p>
      <a href={href} style={{
        display: 'inline-block', padding: '13px 26px', borderRadius: 10,
        background: '#1B6DFC', color: '#FFFFFF', fontSize: 14, fontWeight: 800, textDecoration: 'none',
      }}>
        Book a free call →
      </a>
    </div>
  )
}
