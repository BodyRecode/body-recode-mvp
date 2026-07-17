export default function RoomClosed({ name }: { name: string }) {
  const firstName = (name ?? '').trim().split(/\s+/)[0] || 'there'
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0C0F14',
        color: '#ECEEF2',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 440 }}>
        <p
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#4C8DFF',
            margin: '0 0 18px',
          }}
        >
          Body Recode
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 14px',
          }}
        >
          This link is no longer active
        </h1>
        <p style={{ color: '#AEB6C4', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          Thanks for stopping by, {firstName}. This room has been closed. If you
          think it should still be open, just reach out to Kade and he&rsquo;ll send
          you a fresh link.
        </p>
      </div>
    </div>
  )
}
