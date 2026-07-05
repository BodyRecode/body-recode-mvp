import type { Metadata } from 'next'
import { brand, coach, logoUrl } from '@/config/tenant'
import { isProductLive } from '@/lib/product-launch'

export const metadata: Metadata = {
  title: 'Body Recode · Links',
  description: 'The 14-Day Body Decode Challenge, the Body State Scorecard, and everything Body Recode.',
  robots: { index: false, follow: true },
}

export default function LinksPage() {
  const t = brand()
  const challengeLive = isProductLive('challenge')
  const scorecardChallenge = `${t.marketingDomain}/scorecard?intent=challenge&source=bio`

  const links = [
    {
      href: `${t.marketingDomain}/scorecard?source=bio`,
      title: 'Body State Scorecard',
      desc: 'Read your starting state in 2 minutes',
    },
    {
      href: t.marketingDomain,
      title: `${t.name}™`,
      desc: 'The biological interpretation platform',
    },
    {
      href: t.performanceDomain,
      title: 'Performance Coaching',
      desc: '1:1 coaching, online and in Brisbane',
    },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-14"
      style={{ background: '#F5F7FA', color: '#1A1A1A', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl()} width={168} alt={t.name} className="mx-auto block" />
          <p className="mt-4 text-[13px] leading-snug" style={{ color: '#6B6B6B' }}>
            It&apos;s a state problem, not a discipline problem.
            <br />
            Read the state first, then prescribe.
          </p>
        </div>

        {/* Featured — the Challenge, via the Scorecard */}
        <a
          href={scorecardChallenge}
          className="group block w-full rounded-[18px] p-7 mb-6 relative overflow-hidden transition-shadow hover:shadow-2xl"
          style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)', boxShadow: '0 14px 34px rgba(11,31,51,0.28)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(27,109,252,0.30), transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: '#8FB4F5' }}>
                14-Day Diagnostic
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.16em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: challengeLive ? '#1B6DFC' : 'rgba(255,255,255,0.10)', color: challengeLive ? '#FFFFFF' : '#8FB4F5' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: challengeLive ? '#FFFFFF' : '#1B6DFC' }} />
                {challengeLive ? 'Open now' : 'Opens Mon 13 July'}
              </span>
            </div>

            <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-tight mb-3" style={{ color: '#FFFFFF' }}>
              The 14-Day Body Decode Challenge
            </h1>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.68)' }}>
              Fourteen days of daily structured input. A Day 7 check-in. By Day 14 your Body Decode Report names the specific
              pattern driving how your body has been responding.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              {[
                { big: 'Free', small: 'No payment' },
                { big: '14 days', small: 'Daily portal' },
                { big: '1 of 4', small: 'Pattern read' },
              ].map((v) => (
                <div key={v.small} className="text-center">
                  <p className="text-[15px] font-bold mb-0.5" style={{ color: '#FFFFFF' }}>{v.big}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>{v.small}</p>
                </div>
              ))}
            </div>

            <div
              className="flex items-center justify-center gap-2 font-bold text-[15px] px-5 py-3.5 rounded-xl w-full text-center transition-colors"
              style={{ background: '#1B6DFC', color: '#FFFFFF' }}
            >
              {challengeLive ? 'Start with the Scorecard' : 'Join the waitlist'}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Start with the 2-minute Body State Scorecard. It reads your state and confirms your fit.
            </p>
          </div>
        </a>

        {/* Secondary links */}
        <div className="space-y-3">
          {links.map((l) => (
            <a
              key={l.title}
              href={l.href}
              className="group flex items-center justify-between w-full rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5"
              style={{ background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)' }}
            >
              <div>
                <p className="text-[15px] font-bold" style={{ color: '#1A1A1A' }}>{l.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: '#6B6B6B' }}>{l.desc}</p>
              </div>
              <span aria-hidden className="text-lg transition-transform group-hover:translate-x-0.5" style={{ color: '#1B6DFC' }}>&rarr;</span>
            </a>
          ))}

          {/* Contact */}
          <a
            href={`mailto:${coach().email}`}
            className="group flex items-center justify-between w-full rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5"
            style={{ background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)' }}
          >
            <div>
              <p className="text-[15px] font-bold" style={{ color: '#1A1A1A' }}>Get in touch</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#6B6B6B' }}>{coach().email}</p>
            </div>
            <span aria-hidden className="text-lg transition-transform group-hover:translate-x-0.5" style={{ color: '#1B6DFC' }}>&rarr;</span>
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] mt-11 tracking-[0.12em]" style={{ color: '#9AA0AA' }}>@body_recode_</p>
        <p className="text-center text-[10px] mt-1 tracking-wide" style={{ color: '#9AA0AA' }}>bodyrecode.au/links</p>
      </div>
    </div>
  )
}
