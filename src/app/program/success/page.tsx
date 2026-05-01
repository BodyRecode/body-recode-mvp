import PurchaseTracker from './purchase-tracker'

export default function ProgramSuccessPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: '24px' }}>
      <PurchaseTracker value={97} contentName="state_program_downsell" />
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>Payment confirmed.</p>
        <p style={{ fontSize: '15px', color: '#888888', lineHeight: 1.75, margin: '0 0 8px' }}>
          Your program is on its way. Check your inbox for the link.
        </p>
        <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.75, margin: '0' }}>
          If you do not see it in a few minutes, check your spam folder.
        </p>
      </div>
    </div>
  )
}
