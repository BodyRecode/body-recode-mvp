import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { logoUrl, brand } from '@/config/tenant'

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

const subheading = (text: string) => (
  <p style={{ fontSize: '11px', fontWeight: 800, color: '#5390FF', letterSpacing: '0.08em', margin: '14px 0 8px', textTransform: 'uppercase' as const }}>
    {text}
  </p>
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

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08090B', color: '#C5C8D2',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '18px 24px', background: '#08090B' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
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
            Privacy <span style={{ color: '#5390FF' }}>Policy.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '16px' }} />
          <p style={{ fontSize: '13px', color: '#8A8E9B', margin: 0 }}>
            Last updated: September 2026
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
            This Privacy Policy explains how {brand().name} collects, uses, and protects your information when you visit bodyrecode.au, take the Readiness Scorecard, complete The Body Decode, receive a read, or work with us in coaching. Most of what we hold about you is health information, which Australian privacy law treats as sensitive and protects more tightly than ordinary personal information. This policy is written to be read, not to be got past.</p>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 0' }}>

        {section(1, 'Information We Collect', <>
          {subheading('A. Who you are')}
          {bullets(['Name', 'Email address', 'Phone number', 'Age and biological sex', 'Payment details, handled by our payment provider and never seen or stored by us'])}
          {subheading('B. Health information')}
          {p('This is the heart of what we hold, and Australian privacy law treats it as sensitive information. Depending on how far you go with us, it includes:')}
          {bullets([
            'Your answers about sleep, stress, energy, digestion, recovery and how your body is responding',
            'Menstrual and hormonal status, including menopause status and any hormone therapy',
            'Medications and supplements you tell us you take',
            'Injuries, surgeries, diagnosed conditions and anything you raise as a health concern',
            'Body measurements, weight and progress photographs, if you provide them',
            'Blood test results your doctor ordered, if you choose to upload them',
            'The read we write about you, which is itself health information we have created and hold',
          ])}
          {p('We ask for your consent before collecting this, and we only ask for what your read and your program actually need. You can decline any question, and you can withdraw your consent at any time by emailing us.')}
          {subheading('C. Collected automatically')}
          {bullets(['IP address', 'Device and browser details', 'Pages viewed and time spent on site', 'Cookies and tracking technologies'])}
        </>)}

        {section(2, 'How We Use Your Information', <>
          {p('We use your information to:')}
          {bullets(['Write your read and build your training, nutrition and daily routine', 'Send you your read, your daily lessons, reminders and coaching messages', 'Provide support', 'Improve the method, using information that does not identify you', 'Send marketing related to Body Recode', 'Run advertising campaigns and retargeting', 'Process payments', 'Meet legal obligations'])}
        </>)}

        {section(3, 'Sharing Your Information', <>
          {p('We use a small number of trusted providers to run Body Recode. Each one only receives what it needs to do its job, and each is bound by its own confidentiality and security obligations.')}
          {subheading('A. Providers that handle your information')}
          {bullets([
            'Supabase, our database and secure file storage. Your records are held in Sydney, Australia.',
            'Anthropic, the interpretation engine that writes your read. Processed in the United States. See below.',
            'Vercel, website and application hosting. United States.',
            'Inngest, runs scheduled and background tasks such as reminders. United States.',
            'Resend, sends our emails. United States.',
            'Twilio, sends our text messages. United States.',
            'Stripe, processes payments. Australia and the United States. We never see or store your full card details.',
            'Zoom, runs coaching calls. We do not record them. United States.',
            'Postmark, receives email replies you send us. United States.',
            'Our own email and file storage (Google Workspace and Dropbox), where signed forms, medical clearances and correspondence are held. United States.',
            'Coaching and administrative contractors, bound by confidentiality agreements. Australia.',
          ])}
          {subheading('B. Advertising and analytics')}
          {p('Meta and Google receive information about website visits and purchases so we can measure and target advertising. They do NOT receive your assessment answers, your photos, your measurements, or any other health information.')}
          {subheading('C. How your health information is interpreted')}
          {p('Your assessment answers, and where you provide them your photos, measurements and blood results, are processed by Anthropic to produce your read. Anthropic processes this on our instructions only, and under its commercial terms it does not use it to train its models. Body Recode does not use your identifiable information to train any model.')}
          {subheading('If you came to us through a coach or a gym')}
          {p('Where a coach or a gym uses Body Recode with you, both they and we hold your information. They see what they need to coach you, and their own privacy obligations apply to them as well as ours to us. We never hand your information to another business to use for its own purposes.')}
          {p('We never sell your information.')}
        </>)}

        {section(4, 'Cookies and Tracking', <>
          {p('We may use cookies and tracking technologies to analyse website activity, improve marketing effectiveness, measure ad performance, and personalise content. You can adjust cookie settings in your browser.')}
        </>)}

        {section(5, 'Data Security', <>
          {p('We take reasonable steps to protect your information using secure systems, encrypted gateways, and restricted access. Information is encrypted in transit and at rest. No online transmission is completely secure.')}
          {subheading('Where your information is stored')}
          {p('Your information is stored in Australia, in Sydney. Some of the providers listed above operate overseas, which means limited information may be processed outside Australia in the course of delivering the service.')}
          {subheading('If something goes wrong')}
          {p(`If a data breach occurs that is likely to cause you serious harm, we will notify you and the Office of the Australian Information Commissioner, as required by the Notifiable Data Breaches scheme. Email ${brand().supportEmail} to report a security concern.`)}
        </>)}

        {section(6, 'How decisions about you are made', <>
          {p('Part of what we do is automated. A computer program, using an artificial intelligence model, reads your answers and writes your read, your training program, your nutrition plan and your daily routine. We are telling you this plainly because from 10 December 2026 Australian privacy law requires it, and because you should know either way.')}
          {subheading('What the program uses')}
          {p('Your questionnaire answers, your check-ins, your measurements and photographs where you provide them, your medications, your menstrual and hormonal status, and your blood results where you upload them.')}
          {subheading('What it decides on its own')}
          {bullets([
            'Which pattern your answers point to, and what your read says',
            'The shape of your training program and your nutrition plan',
            'When an answer means we stop and ask you to see your doctor before we go further',
          ])}
          {subheading('Where a person is involved')}
          {p('Your read is a draft until a coach reviews it and publishes it to you. A coach can change it, hold it, or throw it out. Nothing about your safety is left to the model alone: the rules that stop a program and send you to your doctor are fixed rules, not a judgement the model makes.')}
          {subheading('If you disagree with it')}
          {p(`Tell us. Email ${brand().supportEmail} and a person will look at it. You can ask for the read to be corrected, redone, or removed.`)}
        </>)}

        {section(7, 'How long we keep your information', <>
          {p('We keep your health information while we are working with you, and then for seven years, which is the period health record law requires of health service providers in some Australian states. After that we delete it or strip it of anything that identifies you.')}
          {p('Photographs and blood test results are the most sensitive things we hold and the least often needed twice. You can ask us to delete either at any time, and we will, unless we are required to keep them.')}
          {p(`If you want your information deleted sooner, email ${brand().supportEmail}. We will tell you what we can delete, what we have to keep, and why.`)}
        </>)}

        {section(8, 'Your Rights (Australia)', <>
          {p(`You can ask to see what we hold about you, ask us to correct it, ask us to delete it, withdraw your consent, or opt out of marketing. Email ${brand().supportEmail} and we will answer within 30 days.`)}
          {subheading('If you are not happy with how we handled it')}
          {p(`Tell us first, at ${brand().supportEmail}, and we will try to sort it out. If you are still not satisfied, you can complain to the Office of the Australian Information Commissioner at oaic.gov.au or on 1300 363 992.`)}
        </>)}

        {section(9, "Children's Privacy", <>
          {p('Body Recode is for adults. We do not knowingly accept anyone under 18, and we do not knowingly collect their information. If you believe a person under 18 has signed up, email us and we will delete what we hold.')}
        </>)}

        {section(10, 'Changes to This Policy', <>
          {p('We may update this policy at any time. The latest version will always appear here.')}
        </>)}

        {section(11, 'Contact Us', <>
          <div style={{
            background: '#121419', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #1B6DFC',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#5390FF', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              {brand().name}
                                </p>
            <p style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600, margin: '0 0 2px' }}>
              Email: <a href={`mailto:${brand().supportEmail}`} style={{ color: '#5390FF', textDecoration: 'none' }}>{brand().supportEmail}</a>
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
