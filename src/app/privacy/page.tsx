import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const section = (n: number, title: string, children: React.ReactNode) => (
  <div style={{ marginBottom: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
      <span style={{
        fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
        letterSpacing: '0.12em', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        background: 'rgba(27, 109, 252, 0.10)', padding: '4px 10px',
        borderRadius: '6px', flexShrink: 0,
      }}>
        {String(n).padStart(2, '0')}
      </span>
      <h2 style={{
        fontSize: '20px', fontWeight: 800, color: '#1A1A1A',
        letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0,
      }}>
        {title}
      </h2>
    </div>
    <div style={{ paddingLeft: '0' }}>{children}</div>
  </div>
)

const p = (text: string) => (
  <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 12px' }}>{text}</p>
)

const subheading = (text: string) => (
  <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', margin: '14px 0 8px', textTransform: 'uppercase' as const }}>
    {text}
  </p>
)

const bullets = (items: string[]) => (
  <ul style={{ paddingLeft: '0', margin: '0 0 12px', listStyle: 'none' }}>
    {items.map(item => (
      <li key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '9px' }} />
        <span style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7 }}>{item}</span>
      </li>
    ))}
  </ul>
)

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
          </Link>
          <Link href="/challenge" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={13} />
            Back to challenge
          </Link>
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Legal
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 8px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Privacy <span style={{ color: '#1B6DFC' }}>Policy.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '16px' }} />
          <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>
            Last updated: December 2025
          </p>
        </div>
      </div>

      {/* Intro card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
          padding: '24px 26px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
        }}>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            This Privacy Policy explains how Body Recode collects, uses, and protects your information when you visit bodyrecode.au, participate in the 14-Day Body Decode Challenge, join the Body Recode Blueprint or Membership, or interact with our coaching programs, content, or communications. By using our website or participating in our programs, you agree to the practices described in this Privacy Policy.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 0' }}>

        {section(1, 'Information We Collect', <>
          {subheading('A. Personal information you provide')}
          {bullets(['Name', 'Email address', 'Phone number', 'Age range', 'Fitness goals', 'Challenge form responses', 'Information provided through WhatsApp coaching flows', 'Payment information processed through secure third-party providers'])}
          {subheading('B. Automatically collected information')}
          {bullets(['IP address', 'Device and browser details', 'Pages viewed and time spent on site', 'Cookies and tracking technologies'])}
          {subheading('C. Health and lifestyle information (voluntary)')}
          {p('To support personalised coaching, you may choose to share training history, activity levels, body goals, lifestyle details, and sleep patterns or stress levels. We do not collect or store medical records.')}
        </>)}

        {section(2, 'How We Use Your Information', <>
          {p('We use your information to:')}
          {bullets(['Deliver Body Recode programs', 'Send challenge emails, WhatsApp coaching messages, and updates', 'Provide support', 'Improve program quality', 'Send marketing related to Body Recode', 'Run advertising campaigns and retargeting', 'Process payments', 'Meet legal obligations'])}
        </>)}

        {section(3, 'Sharing Your Information', <>
          {p('We may share information with:')}
          {bullets(['Payment processors', 'Email and SMS platforms', 'WhatsApp automation tools', 'Advertising partners (Meta and Google)', 'Coaching and administrative contractors'])}
          {p('We never sell your information.')}
        </>)}

        {section(4, 'Cookies and Tracking', <>
          {p('We may use cookies and tracking technologies to analyse website activity, improve marketing effectiveness, measure ad performance, and personalise content. You can adjust cookie settings in your browser.')}
        </>)}

        {section(5, 'Data Security', <>
          {p('We take reasonable steps to protect your information using secure systems, encrypted gateways, and restricted access. No online transmission is completely secure.')}
        </>)}

        {section(6, 'Your Rights (Australia)', <>
          {p('You may request to access your personal information, correct your information, request deletion, or opt out of marketing. Email info@bodyrecode.au for any privacy-related requests.')}
        </>)}

        {section(7, "Children's Privacy", <>
          {p('Body Recode programs are not intended for individuals under 18.')}
        </>)}

        {section(8, 'Changes to This Policy', <>
          {p('We may update this policy at any time. The latest version will always appear here.')}
        </>)}

        {section(9, 'Contact Us', <>
          <div style={{
            background: '#FAFAFA', border: '1px solid #EEEEEE', borderLeft: '3px solid #1B6DFC',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Body Recode
            </p>
            <p style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600, margin: '0 0 2px' }}>
              Email: <a href="mailto:info@bodyrecode.au" style={{ color: '#1B6DFC', textDecoration: 'none' }}>info@bodyrecode.au</a>
            </p>
            <p style={{ fontSize: '14px', color: '#4A4A4A', margin: 0 }}>
              Website: <a href="https://www.bodyrecode.au" style={{ color: '#1B6DFC', textDecoration: 'none' }}>www.bodyrecode.au</a>
            </p>
          </div>
        </>)}

      </div>

      {/* Footer back link */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 24px', borderRadius: '10px',
          background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#1A1A1A',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          <ArrowLeft size={14} />
          Back to bodyrecode.au
        </Link>
      </div>

    </div>
  )
}
