import Image from 'next/image'

type Variant = 'ip' | 'consumer'

const TEAL = '#1B6DFC'

export default function MarketingNav({ variant = 'consumer' }: { variant?: Variant }) {
  const isIp = variant === 'ip'

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(12, 10, 9, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E5E5E5',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a href="/" style={{ display: 'block', cursor: 'pointer' }}>
          <Image
            src="/logo-black.png"
            alt="Body Recode"
            width={220}
            height={97}
            style={{ height: 56, width: 'auto' }}
          />
        </a>

        {isIp ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a
              href="#system"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#6B6B6B',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
              className="nav-link-hide-sm"
            >
              The system
            </a>
            <a
              href="#licensing"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#6B6B6B',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
              className="nav-link-hide-sm"
            >
              Licensing
            </a>
            <a
              href="#enquire"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                background: TEAL,
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              Enquire
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a
              href="/scorecard"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                background: TEAL,
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              Take the Scorecard
            </a>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-link-hide-sm { display: none; }
        }
      `}</style>
    </nav>
  )
}
