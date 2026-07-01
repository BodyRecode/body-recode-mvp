import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { logoUrl } from '@/config/tenant'

export default function ProgramCancelledPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Payment not completed
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5.5vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            No problem.
            <br />
            <span style={{ color: '#1B6DFC' }}>The link will be there when you are.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            The checkout was cancelled before payment completed. Nothing has been charged. The link to retry is still in your email, and you can come back to it whenever you are ready.
          </p>
        </div>
      </div>

      {/* Two-option card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
          padding: '24px 26px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Two paths from here
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Path 1 - retry via email */}
            <div style={{
              background: '#FAFAFA', border: '1px solid #EEEEEE',
              borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Want to try again?
              </p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
                The original offer email has the same link. Open it any time and the checkout will be there. Nothing was lost.
              </p>
            </div>
            {/* Path 2 - free call */}
            <div style={{
              background: '#FAFAFA', border: '1px solid #EEEEEE',
              borderLeft: '3px solid #B7791F', borderRadius: '10px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Want to talk it through first?
              </p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: '0 0 14px' }}>
                Free 30-minute call. We go through your scorecard result, what is driving your situation, and what would unstick it fastest. No pitch.
              </p>
              <Link
                href="/book?source=program_cancelled"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 800, color: '#1B6DFC',
                  textDecoration: 'none',
                }}
              >
                Book a free call
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer back link */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="https://performance.bodyrecode.au/scorecard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 24px', borderRadius: '10px',
          background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#1A1A1A',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          <ArrowLeft size={14} />
          Back to the Scorecard
        </Link>
      </div>

    </div>
  )
}
