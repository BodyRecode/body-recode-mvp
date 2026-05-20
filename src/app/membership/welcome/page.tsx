export default function MembershipWelcomePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0c0a09', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={110} alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(27,109,252,0.15)', border: '1px solid rgba(27,109,252,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          Welcome to the membership.
        </h1>

        <p style={{ fontSize: 16, color: '#78716c', lineHeight: 1.7, margin: '0 0 12px' }}>
          Your subscription is confirmed. Block A is loading into your portal now.
        </p>

        <p style={{ fontSize: 16, color: '#78716c', lineHeight: 1.7, margin: '0 0 32px' }}>
          Check your email for your portal link. If you are an existing Blueprint member, use the same link you have been using - your portal has already been upgraded.
        </p>

        <div style={{
          background: '#111110', border: '1px solid #292524',
          borderRadius: 12, padding: '20px 24px', marginBottom: 32, textAlign: 'left',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#a8a29e', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            What happens next
          </p>
          {[
            'Portal link sent to your email within a few minutes',
            'Block A training and nutrition unlocked immediately',
            'First monthly coach Loom sent at the end of Week 4',
            'Monthly group Q&A call details sent via email',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(27,109,252,0.15)', border: '1px solid rgba(27,109,252,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: 14, color: '#a8a29e', margin: 0, lineHeight: 1.6 }}>{item}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6 }}>
          Questions? <a href="mailto:info@bodyrecode.au" style={{ color: '#14b8a6', textDecoration: 'none' }}>info@bodyrecode.au</a>
        </p>
      </div>
    </div>
  )
}
