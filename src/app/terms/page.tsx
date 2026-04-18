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

export default function TermsPage() {
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
          Terms and Conditions
        </h1>
        <p style={{ fontSize: '14px', color: '#a8a29e', marginBottom: '48px' }}>Last updated: December 2025</p>

        <div style={{ background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '24px 28px', marginBottom: '48px' }}>
          <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.75, margin: 0 }}>
            Please read these Terms and Conditions carefully before using bodyrecode.au, participating in the 14-Day Body Decode Challenge, or accessing any Body Recode programs including the Blueprint, Membership, or personalised coaching. By accessing our website or programs, you agree to these Terms.
          </p>
        </div>

        {section('1. Program Purpose', <>
          {p('Body Recode provides training, nutrition, and lifestyle guidance for general well-being. Programs are not medical advice or clinical treatment. Seek medical clearance before beginning any program.')}
        </>)}

        {section('2. Not Medical Advice', <>
          {p('Body Recode coaches are not doctors, dietitians, psychologists, or healthcare providers. All coaching and content are for general education and do not constitute medical advice.')}
        </>)}

        {section('3. Payment Terms', <>
          {p('For paid programs:')}
          {bullets(['All payments are final unless stated otherwise', 'Payment plans must be completed in full', 'Failed payments may pause program access'])}
          {p('Refunds are not provided for change of mind.')}
        </>)}

        {section('4. User Responsibilities', <>
          {p('Participants agree to:')}
          {bullets(['Train safely within their own limits', 'Stop exercising if pain or discomfort occurs', 'Seek medical attention when needed', 'Use Body Recode materials for personal use only', 'Not share or distribute proprietary resources'])}
        </>)}

        {section('5. Coaching Access and Expectations', <>
          {p('Coaching access may include WhatsApp coaching messages, email support, video responses, and check-ins. Support is provided within the boundaries of the chosen program.')}
        </>)}

        {section('6. Results Disclaimer', <>
          {p('We do not guarantee specific outcomes. Results vary based on consistency, effort, lifestyle, and individual factors.')}
        </>)}

        {section('7. Intellectual Property', <>
          {p('All Body Recode content including training plans, nutrition guides, frameworks, coaching guides, branding, and messaging are owned by Body Recode and may not be copied, shared, or redistributed without written permission.')}
        </>)}

        {section('8. Termination', <>
          {p('We may suspend or remove access for abusive behaviour, sharing copyrighted materials, or program rule violations. Refunds are not provided for terminated accounts.')}
        </>)}

        {section('9. Community Participation', <>
          {p('Any group or community spaces require respectful conduct. No spam, harassment, or unsolicited promotion is permitted.')}
        </>)}

        {section('10. Waiver of Liability', <>
          {p('You assume all risks associated with fitness activities. Body Recode is not responsible for injury, illness, damages, or losses arising from participation in any program.')}
        </>)}

        {section('11. Governing Law', <>
          {p('These Terms are governed by Australian law.')}
        </>)}

        {section('12. Contact Us', <>
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
