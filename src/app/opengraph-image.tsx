import { ImageResponse } from 'next/og'
import { getTotalQuestions } from '@/lib/intake-questions'
import { brand } from "@/config/tenant";

export const runtime = 'edge'
export const alt = 'Body Recode™ | Biological Interpretation Intelligence Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#08090B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Signal Blue glow top right */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-120px',
            width: '620px',
            height: '620px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,109,252,0.28) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
          {/* spec strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '999px',
              alignSelf: 'flex-start',
              marginBottom: '6px',
            }}
          >
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#5390FF' }} />
            <div style={{ fontSize: '15px', color: '#8A8E9B', letterSpacing: '0.06em' }}>
              {getTotalQuestions()} questions · 8 domains · 5 pillars · 3 states
            </div>
          </div>

          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#5390FF',
              textTransform: 'uppercase',
            }}
          >
            Biological Interpretation Intelligence Platform
          </div>
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {brand().name}™
                                </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#C5C8D2',
              maxWidth: '600px',
              lineHeight: 1.5,
            }}
          >
            One interpretive engine. Five environments. The IP sits above all of it.
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#565A66',
              letterSpacing: '0.05em',
            }}
          >
            bodyrecode.au
          </div>
        </div>

        {/* Bottom Signal Blue line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '3px',
            background: '#1B6DFC',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
