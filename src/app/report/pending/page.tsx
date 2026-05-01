import PurchaseTracker from './purchase-tracker'

export default function ReportPendingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PurchaseTracker value={37} contentName="scorecard_report" />
      <div style={{ maxWidth: '480px', textAlign: 'center', padding: '40px 24px' }}>
        <img src="/logo-teal.png" alt="Body Recode" style={{ height: '44px', marginBottom: '48px' }} />
        <div style={{ width: '32px', height: '3px', background: '#14b8a6', margin: '0 auto 24px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Payment confirmed.
        </h1>
        <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '8px' }}>
          Your Body Decode Report is on its way. Check your inbox — it should arrive within a minute.
        </p>
        <p style={{ fontSize: '14px', color: '#57534e', lineHeight: 1.7 }}>
          Check your spam folder if it does not appear.
        </p>
      </div>
    </div>
  )
}
