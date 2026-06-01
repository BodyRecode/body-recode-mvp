import Link from 'next/link'
import { CheckCircle2, Mail, Clock, ShieldAlert, ArrowRight } from 'lucide-react'
import PurchaseTracker from './purchase-tracker'

const TIMELINE: { eyebrow: string; title: string; body: string; icon: typeof CheckCircle2 }[] = [
  {
    eyebrow: 'Step 1 · Done',
    title: 'Payment confirmed',
    body: 'Your $97 12-Week State Program purchase has been received.',
    icon: CheckCircle2,
  },
  {
    eyebrow: 'Step 2 · Now',
    title: 'Building your access link',
    body: 'Your program portal is being set up with the version matched to your scorecard state.',
    icon: Clock,
  },
  {
    eyebrow: 'Step 3 · Within a minute',
    title: 'Delivered to your inbox',
    body: 'Branded email from kade@bodyrecode.au with your private program link. Bookmark it - everything is in there.',
    icon: Mail,
  },
]

export default function ProgramSuccessPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <PurchaseTracker value={97} contentName="state_program_downsell" />

      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 24px', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(27, 109, 252, 0.10)', border: '1px solid rgba(27, 109, 252, 0.25)',
            borderRadius: '99px', padding: '7px 14px', marginBottom: '20px',
          }}>
            <CheckCircle2 size={14} style={{ color: '#1B6DFC' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Payment confirmed
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(30px, 5.5vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Your 12-Week Program
            <br />
            <span style={{ color: '#1B6DFC' }}>is on its way.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            Watch your inbox. Your private program link lands at the email you paid with - usually within a minute. Bookmark it. Everything you need is in there.
          </p>
        </div>
      </div>

      {/* What happens next - 3 step timeline */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
          padding: '28px 28px 22px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            What happens next
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TIMELINE.map((step, i) => {
              const Icon = step.icon
              const isDone = i === 0
              const isActive = i === 1
              return (
                <div key={step.title} style={{
                  background: '#FAFAFA', border: '1px solid #EEEEEE',
                  borderLeft: `3px solid ${isDone ? '#1B6DFC' : isActive ? '#1056D6' : '#D4D4D4'}`,
                  borderRadius: '10px', padding: '14px 16px',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isDone || isActive ? 'rgba(27, 109, 252, 0.10)' : '#F5F5F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} style={{ color: isDone || isActive ? '#1056D6' : '#6B6B6B' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: isDone || isActive ? '#1056D6' : '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {step.eyebrow}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Spam folder note */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px', padding: '16px 18px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <ShieldAlert size={18} style={{ color: '#B7791F', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
              If it does not arrive within 5 minutes
            </p>
            <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
              Check your spam or promotions folder for an email from <strong style={{ color: '#1A1A1A' }}>kade@bodyrecode.au</strong>. Some mail providers route first-time senders away from the inbox.
            </p>
          </div>
        </div>
      </div>

      {/* While you wait · book a call */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{
          background: '#1A1A1A', borderRadius: '14px', padding: '28px',
          border: '1px solid rgba(27, 109, 252, 0.3)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#B5CFFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            While you wait
          </p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
            The program covers the prescription. A free call covers the diagnosis.
          </p>
          <p style={{ fontSize: '14px', color: '#B5CFFC', lineHeight: 1.7, marginBottom: '20px' }}>
            A 30-minute call walks through why your body is in the state it is in, and what is driving it. No pitch. If you want context for the program before you start, this is where to get it.
          </p>
          <Link
            href="/book?source=state_program_success"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 24px', borderRadius: '10px',
              background: '#1B6DFC', color: '#FFFFFF',
              fontSize: '14px', fontWeight: 800, textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Book a free call with Kade
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Founder byline */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{
          background: '#FAFAFA', border: '1px solid #EEEEEE',
          borderRadius: '14px', padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        }}>
          <img
            src="https://bodyrecode.au/kade.jpg"
            alt="Kade Dunstone"
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'top center',
              border: '1px solid #E5E5E5', flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
              Written by Kade Dunstone
            </p>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, lineHeight: 1.45 }}>
              Human Movement Scientist · Business Entrepreneur · Body Recode Founder
            </p>
          </div>
        </div>
      </div>

      {/* Footer · help link */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          Still nothing in 10 minutes?{' '}
          <a href="mailto:kade@bodyrecode.au?subject=12-Week%20Program%20not%20received" style={{ color: '#1B6DFC', textDecoration: 'underline', fontWeight: 700 }}>
            Email kade@bodyrecode.au
          </a>
          {' '} and we will resend the link.
        </p>
      </div>

    </div>
  )
}
