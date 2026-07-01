import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { logoUrl } from '@/config/tenant'

const section = (n: number, title: string, children: React.ReactNode) => (
  <div style={{ marginBottom: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
      <span style={{
        fontSize: '11px', fontWeight: 800, color: '#5390FF',
        letterSpacing: '0.12em', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        background: 'rgba(27, 109, 252, 0.16)', padding: '4px 10px',
        borderRadius: '6px', flexShrink: 0,
      }}>
        {String(n).padStart(2, '0')}
      </span>
      <h2 style={{
        fontSize: '20px', fontWeight: 800, color: '#FFFFFF',
        letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0,
      }}>
        {title}
      </h2>
    </div>
    <div style={{ paddingLeft: '0' }}>{children}</div>
  </div>
)

const p = (text: string) => (
  <p style={{ fontSize: '15px', color: '#C5C8D2', lineHeight: 1.75, margin: '0 0 12px' }}>{text}</p>
)

const bullets = (items: string[]) => (
  <ul style={{ paddingLeft: '0', margin: '0 0 12px', listStyle: 'none' }}>
    {items.map(item => (
      <li key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '9px' }} />
        <span style={{ fontSize: '15px', color: '#C5C8D2', lineHeight: 1.7 }}>{item}</span>
      </li>
    ))}
  </ul>
)

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08090B', color: '#C5C8D2',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '18px 24px', background: '#08090B' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <Link href="/" style={{ fontSize: '13px', color: '#5390FF', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={13} />
            Back to home
          </Link>
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#5390FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Legal
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 8px', color: '#FFFFFF', lineHeight: 1.05,
          }}>
            Terms <span style={{ color: '#5390FF' }}>and Conditions.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '16px' }} />
          <p style={{ fontSize: '13px', color: '#8A8E9B', margin: 0 }}>
            Last updated: December 2025
          </p>
        </div>
      </div>

      {/* Intro card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 24px 0' }}>
        <div style={{
          background: '#121419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
          padding: '24px 26px',
        }}>
          <p style={{ fontSize: '15px', color: '#C5C8D2', lineHeight: 1.75, margin: 0 }}>
            Please read these Terms and Conditions carefully before using bodyrecode.au, participating in the 14-Day Body Decode Challenge, or accessing any Body Recode programs including the Blueprint, Membership, or personalised coaching. By accessing our website or programs, you agree to these Terms.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 0' }}>

        {section(1, 'Program Purpose', <>
          {p('Body Recode provides training, nutrition, and lifestyle guidance for general well-being. Programs are not medical advice or clinical treatment. Seek medical clearance before beginning any program.')}
        </>)}

        {section(2, 'Not Medical Advice', <>
          {p('Body Recode coaches are not doctors, dietitians, psychologists, or healthcare providers. All coaching and content are for general education and do not constitute medical advice.')}
        </>)}

        {section(3, 'Payment Terms', <>
          {p('For paid programs:')}
          {bullets(['All payments are final unless stated otherwise', 'Payment plans must be completed in full', 'Failed payments may pause program access'])}
          {p('Refunds are not provided for change of mind.')}
        </>)}

        {section(4, 'User Responsibilities', <>
          {p('Participants agree to:')}
          {bullets(['Train safely within their own limits', 'Stop exercising if pain or discomfort occurs', 'Seek medical attention when needed', 'Use Body Recode materials for personal use only', 'Not share or distribute proprietary resources'])}
        </>)}

        {section(5, 'Coaching Access and Expectations', <>
          {p('Coaching access may include WhatsApp coaching messages, email support, video responses, and check-ins. Support is provided within the boundaries of the chosen program.')}
        </>)}

        {section(6, 'Results Disclaimer', <>
          {p('We do not guarantee specific outcomes. Results vary based on consistency, effort, lifestyle, and individual factors.')}
        </>)}

        {section(7, 'Intellectual Property', <>
          {p('All Body Recode content including training plans, nutrition guides, frameworks, coaching guides, branding, and messaging are owned by Body Recode and may not be copied, shared, or redistributed without written permission.')}
        </>)}

        {section(8, 'Termination', <>
          {p('We may suspend or remove access for abusive behaviour, sharing copyrighted materials, or program rule violations. Refunds are not provided for terminated accounts.')}
        </>)}

        {section(9, 'Community Participation', <>
          {p('Any group or community spaces require respectful conduct. No spam, harassment, or unsolicited promotion is permitted.')}
        </>)}

        {section(10, 'Waiver of Liability', <>
          {p('You assume all risks associated with fitness activities. Body Recode is not responsible for injury, illness, damages, or losses arising from participation in any program.')}
        </>)}

        {section(11, 'Governing Law', <>
          {p('These Terms are governed by Australian law.')}
        </>)}

        {section(12, 'Contact Us', <>
          <div style={{
            background: '#121419', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #1B6DFC',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#5390FF', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Body Recode
            </p>
            <p style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600, margin: '0 0 2px' }}>
              Email: <a href="mailto:info@bodyrecode.au" style={{ color: '#5390FF', textDecoration: 'none' }}>info@bodyrecode.au</a>
            </p>
            <p style={{ fontSize: '14px', color: '#C5C8D2', margin: 0 }}>
              Website: <a href="https://www.bodyrecode.au" style={{ color: '#5390FF', textDecoration: 'none' }}>www.bodyrecode.au</a>
            </p>
          </div>
        </>)}

      </div>

      {/* Footer back link */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 24px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.14)', color: '#FFFFFF',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          <ArrowLeft size={14} />
          Back to bodyrecode.au
        </Link>
      </div>

    </div>
  )
}
