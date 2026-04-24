export default function ExtensionWelcomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={110} alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>You are in. 12 weeks starts now.</h1>
        <p style={{ fontSize: 16, color: '#78716c', lineHeight: 1.7, margin: '0 0 32px' }}>
          Your 90-Day Extension portal is loading. Check your email for your personal portal link. Weeks 1-6 run Block A (Consolidate), Weeks 7-12 run Block B (Advance).
        </p>
        <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6 }}>
          Questions? <a href="mailto:info@bodyrecode.au" style={{ color: '#14b8a6', textDecoration: 'none' }}>info@bodyrecode.au</a>
        </p>
      </div>
    </div>
  )
}
