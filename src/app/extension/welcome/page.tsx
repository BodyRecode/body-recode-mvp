import { logoUrl, brand } from '@/config/tenant'

export default function ExtensionWelcomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <img src={logoUrl()} width={110} alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(27, 109, 252,0.15)', border: '1px solid rgba(27, 109, 252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B6DFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>You are in. 12 weeks starts now.</h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.7, margin: '0 0 32px' }}>
          Your 90-Day Extension portal is loading. Check your email for your personal portal link. Weeks 1-6 run Block A (Consolidate), Weeks 7-12 run Block B (Advance).
        </p>
        <p style={{ fontSize: 13, color: '#4A4A4A', lineHeight: 1.6 }}>
          Questions? <a href={`mailto:${brand().supportEmail}`} style={{ color: '#1B6DFC', textDecoration: 'none' }}>{brand().supportEmail}</a>
        </p>
      </div>
    </div>
  )
}
