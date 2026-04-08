export default function ProgramCancelledPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>No problem.</p>
        <p style={{ fontSize: '15px', color: '#888888', lineHeight: 1.75, margin: '0' }}>
          The link will be in your email whenever you are ready.
        </p>
      </div>
    </div>
  )
}
