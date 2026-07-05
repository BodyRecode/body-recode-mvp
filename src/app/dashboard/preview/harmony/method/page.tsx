import Link from 'next/link'
import { ArrowRight, Wind, Mountain, Moon } from 'lucide-react'
import { H } from '../_lib/tokens'

const BASE = '/dashboard/preview/harmony'

export default function HarmonyMethod() {
  const pillars = [
    {
      icon: Wind,
      label: 'Breath',
      lede: 'The nervous system arrives before the body does.',
      body: [
        'Every practice at Harmony begins by settling the breath. Not as ritual, as function. The nervous system decides what the body can meet today; the breath is the fastest way in.',
        'You will learn to notice when the breath is tight before you notice it in your body. That noticing is the practice as much as any shape is.',
      ],
    },
    {
      icon: Mountain,
      label: 'Body',
      lede: 'Anatomy-first, capacity-graded.',
      body: [
        'The strong shapes are earned. Every session brief carries a regression path signposted for the days your body is not asking to be pushed. Nothing is prescribed above what today\'s body trusts.',
        'The practice progresses on consistency, not intensity. That is the whole trick, and it is not a trick.',
      ],
    },
    {
      icon: Moon,
      label: 'Presence',
      lede: 'Notice, don\'t track.',
      body: [
        'The measurement of a good week of practice is not the number of times through. It is the sensation of steadiness that follows.',
        'We ask you to write us a Weekly Check-In. Melisa reads every one. From that reading, the plan for next week is written for the body you brought this week.',
      ],
    },
  ]

  return (
    <>
      <section className="pt-24 pb-16 px-8">
        <div className="max-w-[820px] mx-auto">
          <div
            className="text-[10px] uppercase mb-8"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            The Method
          </div>
          <h1
            className="text-[56px] leading-[1.1] mb-8 -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            Three pillars, held together across every practice.
          </h1>
          <p className="text-[17px] leading-[1.7]" style={{ color: H.inkSoft }}>
            Breath, body, presence. These are not stages you graduate through - they are the three parts of a single practice, held together in every session brief we write for you.
          </p>
        </div>
      </section>

      {pillars.map((p, i) => {
        const Icon = p.icon
        const isAlt = i % 2 === 1
        return (
          <section key={i} className="py-20 px-8" style={{ backgroundColor: isAlt ? H.creamDeep : H.cream }}>
            <div className="max-w-[1000px] mx-auto grid md:grid-cols-[1fr_1.8fr] gap-16 items-start">
              <div>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: H.terracottaSoft }}
                >
                  <Icon size={26} style={{ color: H.terracottaDeep }} />
                </div>
                <div
                  className="text-[10px] uppercase mb-4"
                  style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
                >
                  Pillar {String(i + 1).padStart(2, '0')}
                </div>
                <h2
                  className="text-[52px] leading-none"
                  style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
                >
                  {p.label}
                </h2>
              </div>
              <div>
                <p
                  className="text-[24px] leading-[1.35] mb-6"
                  style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
                >
                  {p.lede}
                </p>
                {p.body.map((para, j) => (
                  <p key={j} className="text-[15px] leading-[1.8] mb-4" style={{ color: H.inkSoft }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="py-24 px-8" style={{ backgroundColor: H.ink }}>
        <div className="max-w-[820px] mx-auto text-center">
          <h2
            className="text-[38px] leading-[1.2] mb-8 -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.cream, fontWeight: 500 }}
          >
            The way to see how the method meets your body is to take the Assessment.
          </h2>
          <Link
            href={`${BASE}/scorecard`}
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full text-[13px] font-semibold uppercase"
            style={{
              background: H.terracotta,
              color: H.cream,
              fontFamily: H.mono,
              letterSpacing: '0.16em',
            }}
          >
            Take the Assessment
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <div className="py-10 text-center px-8">
        <Link
          href={BASE}
          className="text-[11px] uppercase"
          style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}
        >
          ← Back to Harmony
        </Link>
      </div>
    </>
  )
}
