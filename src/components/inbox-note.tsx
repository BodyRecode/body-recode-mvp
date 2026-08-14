import { ShieldAlert } from 'lucide-react'
import { coach } from '@/config/tenant'

// The spam-folder note, in one place.
//
// It existed on five pages and was missing from four others that also send
// someone to their inbox - including the booking confirmation, which carries the
// pre-call form link, and the extension welcome, where the email is the only way
// in. Five hand-rolled copies is how a warning goes missing from the sixth page,
// so it lives here now.
//
// Always render it NEXT TO the instruction to go and look, not further down the
// page. A warning read after someone has already given up on their inbox is not
// a warning.
export function InboxNote({
  heading = 'If it does not arrive within 5 minutes',
  wait,
  dark = false,
}: {
  heading?: string
  /** Overrides the heading for anything not sent immediately, e.g. "one business day". */
  wait?: string
  dark?: boolean
}) {
  const title = wait ? `If it has not arrived after ${wait}` : heading
  return (
    <div style={{
      background: dark ? 'rgba(245, 158, 11, 0.10)' : 'rgba(245, 158, 11, 0.05)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: '12px', padding: '16px 18px',
      display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left',
    }}>
      <ShieldAlert size={18} style={{ color: '#B7791F', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <p style={{ fontSize: '13px', fontWeight: 800, color: dark ? '#FFFFFF' : '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {title}
        </p>
        <p style={{ fontSize: '13px', color: dark ? 'rgba(255,255,255,0.72)' : '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
          Check your spam or promotions folder for an email from{' '}
          <strong style={{ color: dark ? '#FFFFFF' : '#1A1A1A' }}>{coach().email}</strong>. Some mail
          providers route first-time senders away from the inbox. Moving it across means everything
          after it lands where you can see it.
        </p>
      </div>
    </div>
  )
}
