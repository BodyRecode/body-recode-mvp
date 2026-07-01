import Image from 'next/image'
import { brand } from "@/config/tenant";

type Variant = 'ip' | 'consumer'

const TEAL = '#1B6DFC'

export default function MarketingFooter({ variant = 'consumer' }: { variant?: Variant }) {
  const isIp = variant === 'ip'

  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E5E5E5',
        padding: '64px 20px 32px',
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div>
            <Image
              src="/logo-black.png"
              alt="Body Recode"
              width={220}
              height={97}
              style={{ height: 48, width: 'auto', marginBottom: 18 }}
            />
            <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.7 }}>
              {isIp ? (
                <>
                  Biological interpretation platform.
                  <br />
                  One engine. Five environments.
                </>
              ) : (
                <>
                  Performance Coaching, the consumer arm of the Body Recode™ system.
                </>
              )}
            </p>
          </div>

          {/* Environments / Pages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#999999',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {isIp ? 'Environments' : 'Coaching'}
            </p>
            {isIp ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={brand().performanceDomain}
                    style={{
                      fontSize: 13,
                      color: TEAL,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Performance Coaching
                  </a>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: TEAL,
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}
                  >
                    Live
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#3f3936' }}>Executive Performance</span>
                <span style={{ fontSize: 13, color: '#3f3936' }}>Operational Readiness</span>
                <span style={{ fontSize: 13, color: '#3f3936' }}>Clinical Integration</span>
                <span style={{ fontSize: 13, color: '#3f3936' }}>Developmental Performance</span>
              </>
            ) : (
              <>
                <a href="/performance-coaching" style={footerLink}>Online 1:1</a>
                <a href="/scorecard" style={footerLink}>Body State Scorecard</a>
                <a href="/book" style={footerLink}>Book a call</a>
                <a href={brand().marketingDomain} style={footerLinkMuted}>Body Recode™ Platform →</a>
              </>
            )}
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#999999',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Contact
            </p>
            {isIp ? (
              <>
                <a href="#enquire" style={footerLink}>Licensing enquiries</a>
                <a href="mailto:info@bodyrecode.au" style={footerLink}>info@bodyrecode.au</a>
                <a
                  href={brand().performanceDomain}
                  style={{ ...footerLinkMuted, marginTop: 6 }}
                >
                  performance.bodyrecode.au →
                </a>
              </>
            ) : (
              <>
                <a href="mailto:info@bodyrecode.au" style={footerLink}>info@bodyrecode.au</a>
                <a href="/privacy" style={footerLinkMuted}>Privacy</a>
                <a href="/terms" style={footerLinkMuted}>Terms</a>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #E5E5E5',
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 11, color: '#3f3936' }}>
            ©2026 Body Recode™. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: '#3f3936' }}>
            {isIp ? 'www.bodyrecode.au' : 'performance.bodyrecode.au'}
          </p>
        </div>
      </div>
    </footer>
  )
}

const footerLink: React.CSSProperties = {
  fontSize: 13,
  color: '#6B6B6B',
  textDecoration: 'none',
}

const footerLinkMuted: React.CSSProperties = {
  fontSize: 12,
  color: '#999999',
  textDecoration: 'none',
}
