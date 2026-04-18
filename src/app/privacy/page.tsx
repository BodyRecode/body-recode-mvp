import Link from 'next/link'

const section = (title: string, children: React.ReactNode) => (
  <div style={{ marginBottom: '40px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.01em', marginBottom: '14px' }}>{title}</h2>
    {children}
  </div>
)

const p = (text: string) => (
  <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.75, margin: '0 0 12px' }}>{text}</p>
)

const bullets = (items: string[]) => (
  <ul style={{ paddingLeft: '0', margin: '0 0 12px', listStyle: 'none' }}>
    {items.map(item => (
      <li key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0, marginTop: '8px' }} />
        <span style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.7 }}>{item}</span>
      </li>
    ))}
  </ul>
)

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf9', color: '#1c1917',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ borderBottom: '1px solid #e7e5e0', padding: '18px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <img src="https://bodyrecode.au/logo-teal.png" width="100" alt="Body Recode" style={{ display: 'block' }} />
          </Link>
          <Link href="/challenge" style={{ fontSize: '13px', color: '#0f766e', textDecoration: 'none', fontWeight: 500 }}>
            Back to challenge
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 24px 100px' }}>

        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Legal
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', color: '#1c1917', marginBottom: '8px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '14px', color: '#a8a29e', marginBottom: '48px' }}>Last updated: December 2025</p>

        <div style={{ background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '24px 28px', marginBottom: '48px' }}>
          <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.75, margin: 0 }}>
            This Privacy Policy explains how Body Recode collects, uses, and protects your information when you visit bodyrecode.au, participate in the 14-Day Body Decode Challenge, join the Body Recode Blueprint or Membership, or interact with our coaching programs, content, or communications. By using our website or participating in our programs, you agree to the practices described in this Privacy Policy.
          </p>
        </div>

        {section('1. Information We Collect', <>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '0 0 8px' }}>A. Personal information you provide</p>
          {bullets(['Name', 'Email address', 'Phone number', 'Age range', 'Fitness goals', 'Challenge form responses', 'Information provided through WhatsApp coaching flows', 'Payment information processed through secure third-party providers'])}
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '16px 0 8px' }}>B. Automatically collected information</p>
          {bullets(['IP address', 'Device and browser details', 'Pages viewed and time spent on site', 'Cookies and tracking technologies'])}
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '16px 0 8px' }}>C. Health and lifestyle information (voluntary)</p>
          {p('To support personalised coaching, you may choose to share training history, activity levels, body goals, lifestyle details, and sleep patterns or stress levels. We do not collect or store medical records.')}
        </>)}

        {section('2. How We Use Your Information', <>
          {p('We use your information to:')}
          {bullets(['Deliver Body Recode programs', 'Send challenge emails, WhatsApp coaching messages, and updates', 'Provide support', 'Improve program quality', 'Send marketing related to Body Recode', 'Run advertising campaigns and retargeting', 'Process payments', 'Meet legal obligations'])}
        </>)}

        {section('3. Sharing Your Information', <>
          {p('We may share information with:')}
          {bullets(['Payment processors', 'Email and SMS platforms', 'WhatsApp automation tools', 'Advertising partners (Meta and Google)', 'Coaching and administrative contractors'])}
          {p('We never sell your information.')}
        </>)}

        {section('4. Cookies and Tracking', <>
          {p('We may use cookies and tracking technologies to analyse website activity, improve marketing effectiveness, measure ad performance, and personalise content. You can adjust cookie settings in your browser.')}
        </>)}

        {section('5. Data Security', <>
          {p('We take reasonable steps to protect your information using secure systems, encrypted gateways, and restricted access. No online transmission is completely secure.')}
        </>)}

        {section('6. Your Rights (Australia)', <>
          {p('You may request to access your personal information, correct your information, request deletion, or opt out of marketing. Email info@bodyrecode.au for any privacy-related requests.')}
        </>)}

        {section('7. Children\'s Privacy', <>
          {p('Body Recode programs are not intended for individuals under 18.')}
        </>)}

        {section('8. Changes to This Policy', <>
          {p('We may update this policy at any time. The latest version will always appear here.')}
        </>)}

        {section('9. Contact Us', <>
          <div style={{ background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '10px', padding: '18px 20px' }}>
            <p style={{ fontSize: '15px', color: '#1c1917', fontWeight: 600, margin: '0 0 4px' }}>Body Recode</p>
            <p style={{ fontSize: '14px', color: '#57534e', margin: '0 0 2px' }}>Email: info@bodyrecode.au</p>
            <p style={{ fontSize: '14px', color: '#57534e', margin: 0 }}>Website: www.bodyrecode.au</p>
          </div>
        </>)}

      </div>
    </div>
  )
}
