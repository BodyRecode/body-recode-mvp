import type { Metadata } from 'next'
import { brand, coach, logoUrl } from '@/config/tenant'

export const metadata: Metadata = {
  title: 'Body Recode · Links',
  description: 'The Body Decode, the Readiness Scorecard, and everything Body Recode.',
  robots: { index: false, follow: true },
}

export default function LinksPage() {
  const t = brand()
  // THE BODY DECODE, not the retired Challenge. This page is the Instagram bio
  // link, so until 25 Aug 2026 the most-tapped destination Body Recode owns was
  // still advertising fourteen days of daily structured input, a Day 7 check-in
  // and a Day 14 reveal - none of which exist any more - behind a launch flag
  // that said "Opens Mon 13 July".
  //
  // /challenge redirects to /decode so nobody was stranded, but the card sold
  // the wrong product before they ever tapped it.
  const decodeSignup = `${t.marketingDomain}/decode?source=bio`

  const links = [
    {
      href: `${t.marketingDomain}/scorecard?source=bio`,
      title: 'Readiness Scorecard',
      desc: 'Read your starting state in 2 minutes',
    },
    {
      href: t.marketingDomain,
      title: `${t.name}™`,
      desc: 'The biological interpretation intelligence platform',
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

        {/* Featured — The Body Decode */}
        <a
          href={decodeSignup}
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
                Free assessment
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.16em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: '#1B6DFC', color: '#FFFFFF' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFFFFF' }} />
                Open now
              </span>
            </div>

            <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-tight mb-3" style={{ color: '#FFFFFF' }}>
              The Body Decode
            </h1>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.68)' }}>
              About two minutes of questions, then a written report naming which pattern is behind your body not
              responding, why it is happening, and the three things that shift it. Then five short videos, one a day.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              {[
                { big: '2 min', small: 'Of questions' },
                { big: '5 videos', small: 'One a day' },
                { big: '$0', small: 'No card' },
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
              Get my report
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Free, no card, and nothing to buy to get it. Your report is on screen the moment you finish.
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
