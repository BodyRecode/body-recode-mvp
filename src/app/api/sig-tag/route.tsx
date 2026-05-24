import { ImageResponse } from 'next/og'
import { taglineForDate } from '@/lib/sig-taglines'

/**
 * Daily-rotating tagline image used in Kade's personal Gmail signature.
 *
 * GET /api/sig-tag → 960x80 PNG of today's tagline in the brand palette.
 *
 * Same line for every viewer on a given UTC day (see `taglineForDate`), so
 * caching is safe: 1 day at the CDN edge, 1 hour in the recipient's mail
 * client. We do not want long-lived caching because the whole point is the
 * line changes.
 */
export const runtime = 'edge'

export async function GET() {
  const line = taglineForDate(new Date())

  return new ImageResponse(
    (
      <div
        style={{
          width: '960px',
          height: '80px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '6px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '44px',
              background: '#1B6DFC',
              borderRadius: '3px',
            }}
          />
          <div
            style={{
              fontSize: '24px',
              fontWeight: 500,
              color: '#3A3A3A',
              letterSpacing: '-0.005em',
              lineHeight: 1.3,
            }}
          >
            {line}
          </div>
        </div>
      </div>
    ),
    {
      width: 960,
      height: 80,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    },
  )
}
