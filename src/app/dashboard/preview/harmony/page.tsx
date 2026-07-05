import Link from 'next/link'
import { ArrowRight, Wind, Mountain, Moon } from 'lucide-react'
import { H, LADDER } from './_lib/tokens'

const BASE = '/dashboard/preview/harmony'

export default function HarmonyHome() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FunnelStrip />
      <TheMethod />
      <HowItWorks />
      <Programmes />
      <SocialProof />
      <AboutMelisa />
      <FAQ />
      <FinalCTA />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Hero
 * ───────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-24 pb-32 px-8 relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto relative">
        {/* Subtle radial glow */}
        <div
          aria-hidden
          className="absolute -top-40 right-0 w-[600px] h-[600px] pointer-events-none opacity-60"
          style={{
            background: `radial-gradient(circle, ${H.terracottaSoft} 0%, transparent 60%)`,
            filter: 'blur(60px)',
          }}
        />

        <div className="grid md:grid-cols-[1.4fr_1fr] gap-16 items-center relative">
          <div>
            <div
              className="inline-flex items-center gap-2 text-[10px] uppercase mb-8"
              style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
            >
              <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
              A studio for practitioners
            </div>
            <h1
              className="text-[68px] leading-[1.05] mb-8 -tracking-[0.01em]"
              style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
            >
              Yoga that meets the body you brought this week.
            </h1>
            <p
              className="text-[17px] leading-[1.65] mb-10 max-w-[52ch]"
              style={{ color: H.inkSoft }}
            >
              Every week you arrive with a different body. Different sleep. Different load carried. Most yoga programmes ignore that and hand you the same class. We don&apos;t. Practice at Harmony is written for the body you brought today, and evolves as your body evolves.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href={`${BASE}/scorecard`}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-[13px] font-semibold uppercase transition-transform hover:scale-[1.02]"
                style={{
                  background: H.terracotta,
                  color: H.cream,
                  fontFamily: H.mono,
                  letterSpacing: '0.16em',
                }}
              >
                Begin the Assessment
                <ArrowRight size={14} />
              </Link>
              <Link
                href={`${BASE}/method`}
                className="text-[13px] font-semibold uppercase"
                style={{ color: H.ink, fontFamily: H.mono, letterSpacing: '0.16em' }}
              >
                Read the method →
              </Link>
            </div>
            <div className="mt-8 text-[11px] leading-relaxed max-w-[42ch]" style={{ color: H.inkLight, fontStyle: 'italic' }}>
              The Assessment takes 2 minutes. No card. No commitment. Your Practice Read arrives inside 24 hours.
            </div>
          </div>

          {/* Right rail - editorial visual (logo mark on cream card with subtle art) */}
          <div className="relative">
            <div
              className="aspect-[4/5] rounded-[3px] border overflow-hidden relative"
              style={{ backgroundColor: H.creamDeep, borderColor: H.border }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={H.logoUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-[0.92]"
                style={{ filter: 'saturate(0.85)' }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent 55%, ${H.creamDeep} 100%)`,
                }}
              />
              <div className="absolute bottom-6 left-6 right-6">
                <div
                  className="text-[10px] uppercase mb-1.5"
                  style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.24em' }}
                >
                  Founded 2026
                </div>
                <div
                  className="text-[15px]"
                  style={{ fontFamily: H.serif, color: H.ink, letterSpacing: '0.02em' }}
                >
                  {H.founder} · {H.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Trust bar
 * ───────────────────────────────────────────────────────────── */
function TrustBar() {
  const words = ['Practitioners not beginners', 'Trauma-informed', 'Anatomy-first', 'Yoga Australia registered', 'By assessment']
  return (
    <div className="border-y py-6 px-8" style={{ borderColor: H.border, backgroundColor: H.creamDeep }}>
      <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {words.map((w, i) => (
          <span key={i} className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.24em' }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Funnel strip - front-and-centre CTA
 * ───────────────────────────────────────────────────────────── */
function FunnelStrip() {
  return (
    <section id="scorecard" className="py-28 px-8">
      <div className="max-w-[900px] mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 text-[10px] uppercase mb-8"
          style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
        >
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
          Begin here
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
        </div>
        <h2
          className="text-[48px] leading-[1.1] mb-6 -tracking-[0.01em]"
          style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
        >
          The Practice Readiness Assessment
        </h2>
        <p
          className="text-[16px] leading-[1.7] mb-10 max-w-[56ch] mx-auto"
          style={{ color: H.inkSoft }}
        >
          Twelve questions about your body, your sleep, your practice history, and the shape of your week. From your answers, {H.founder} writes you a personalised Practice Read - a short document that tells you where you actually are, what to hold in the practice this month, and what to leave alone.
        </p>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Link
            href={`${BASE}/scorecard`}
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full text-[13px] font-semibold uppercase transition-transform hover:scale-[1.02]"
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
        <div
          className="text-[11px]"
          style={{ color: H.inkLight, fontFamily: H.mono, letterSpacing: '0.14em' }}
        >
          FREE · 2 MIN · NO CARD · PRACTICE READ WITHIN 24 HOURS
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * The Method - 3 pillars
 * ───────────────────────────────────────────────────────────── */
function TheMethod() {
  const pillars = [
    {
      icon: Wind,
      label: 'Breath',
      body: 'The nervous-system arrives before the body does. Every session begins by settling the breath so the shapes that follow are met with attention, not effort.',
    },
    {
      icon: Mountain,
      label: 'Body',
      body: 'Anatomy-first, capacity-graded. The strong shapes are earned. Regressions are signposted in every brief. Nothing is prescribed above what today\'s body trusts.',
    },
    {
      icon: Moon,
      label: 'Presence',
      body: 'Notice, don\'t track. Practice is measured by the sensation of steadiness, not the number of times through. The practice is the point.',
    },
  ]
  return (
    <section className="py-28 px-8" style={{ backgroundColor: H.creamDeep }}>
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase mb-6"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
            The Method
            <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
          </div>
          <h2
            className="text-[44px] leading-[1.15] mb-4 -tracking-[0.01em] max-w-[22ch] mx-auto"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            Three pillars, held together across every practice.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} className="p-8 rounded-sm border" style={{ borderColor: H.border, backgroundColor: H.cream }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: H.terracottaSoft }}>
                  <Icon size={20} style={{ color: H.terracottaDeep }} />
                </div>
                <div
                  className="text-[10px] uppercase mb-3"
                  style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
                >
                  {String(i + 1).padStart(2, '0')} · {p.label}
                </div>
                <h3
                  className="text-[26px] leading-tight mb-4"
                  style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
                >
                  {p.label}.
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: H.inkSoft }}>
                  {p.body}
                </p>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-16">
          <Link
            href={`${BASE}/method`}
            className="text-[13px] font-semibold uppercase inline-flex items-center gap-2"
            style={{ color: H.ink, fontFamily: H.mono, letterSpacing: '0.16em' }}
          >
            Read the method in full <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * How it works - the ladder
 * ───────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    LADDER.scorecard,
    LADDER.read,
    LADDER.call,
    LADDER.onboard,
    LADDER.membership,
  ]
  return (
    <section className="py-28 px-8">
      <div className="max-w-[1240px] mx-auto">
        <div className="mb-16">
          <div
            className="text-[10px] uppercase mb-4"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            The Path
          </div>
          <h2
            className="text-[44px] leading-[1.15] mb-4 -tracking-[0.01em] max-w-[24ch]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            Every practitioner walks the same five steps.
          </h2>
          <p className="text-[15px] leading-[1.7] max-w-[62ch]" style={{ color: H.inkSoft }}>
            Not every practitioner will walk all five. The Assessment is the door. The Read decides whether you want to keep going. The Studio is where the work happens.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-8 p-8 rounded-sm border"
              style={{ borderColor: H.border, backgroundColor: H.cream }}
            >
              <div
                className="text-[52px] leading-none shrink-0"
                style={{ fontFamily: H.serif, color: H.terracotta, fontWeight: 500 }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap">
                  <h3 className="text-[22px]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
                    {s.label}
                  </h3>
                  <div
                    className="text-[11px] uppercase"
                    style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.16em' }}
                  >
                    {s.price}
                  </div>
                </div>
                <p className="text-[14px] leading-[1.7]" style={{ color: H.inkSoft }}>{s.hook}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Programmes / pricing cards
 * ───────────────────────────────────────────────────────────── */
function Programmes() {
  const cards = [
    {
      tag: 'Free',
      title: LADDER.scorecard.label,
      price: 'Free',
      priceSub: '2 min · no card',
      body: 'Start here. Twelve questions, one written Practice Read delivered within 24 hours.',
      cta: 'Begin the Assessment',
      href: `${BASE}/scorecard`,
      feature: false,
    },
    {
      tag: 'Foundation',
      title: LADDER.onboard.label,
      price: '$260',
      priceSub: 'one-time',
      body: 'Your first block programme, nourishment foundation, in-studio welcome. For practitioners ready to commit to a block.',
      cta: 'Speak with Melisa',
      href: `${BASE}/scorecard`,
      feature: true,
    },
    {
      tag: 'Membership',
      title: LADDER.membership.label,
      price: '$180',
      priceSub: 'per month · cancel anytime',
      body: 'The ongoing studio. Weekly practice plans, monthly readings, unlimited in-studio + at-home classes.',
      cta: 'Learn more',
      href: `${BASE}/scorecard`,
      feature: false,
    },
  ]
  return (
    <section id="programmes" className="py-28 px-8" style={{ backgroundColor: H.creamDeep }}>
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase mb-6"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
            Programmes
            <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
          </div>
          <h2
            className="text-[44px] leading-[1.15] max-w-[20ch] mx-auto -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            Three ways to begin.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className="p-8 rounded-sm border relative overflow-hidden"
              style={{
                borderColor: c.feature ? H.terracotta : H.border,
                backgroundColor: H.cream,
                borderWidth: c.feature ? '2px' : '1px',
              }}
            >
              {c.feature && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[9px] uppercase"
                  style={{
                    background: H.terracotta,
                    color: H.cream,
                    fontFamily: H.mono,
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                  }}
                >
                  Most chosen
                </div>
              )}
              <div
                className="text-[10px] uppercase mb-4"
                style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
              >
                {c.tag}
              </div>
              <h3 className="text-[26px] leading-tight mb-4" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
                {c.title}
              </h3>
              <div className="flex items-baseline gap-2 mb-5">
                <div className="text-[42px] leading-none" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
                  {c.price}
                </div>
                <div className="text-[11px]" style={{ color: H.inkLight, fontFamily: H.mono, letterSpacing: '0.08em' }}>
                  {c.priceSub}
                </div>
              </div>
              <p className="text-[13px] leading-[1.7] mb-8" style={{ color: H.inkSoft }}>{c.body}</p>
              <Link
                href={c.href}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-semibold uppercase"
                style={{
                  background: c.feature ? H.terracotta : 'transparent',
                  color: c.feature ? H.cream : H.ink,
                  border: c.feature ? 'none' : `1px solid ${H.ink}`,
                  fontFamily: H.mono,
                  letterSpacing: '0.16em',
                }}
              >
                {c.cta} <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Social proof
 * ───────────────────────────────────────────────────────────── */
function SocialProof() {
  const quotes = [
    { body: 'I have practised for twelve years. This is the first coach who could actually tell me what week to hold back and what week to lean in.', who: 'Sarah W.', tag: 'Practitioner, year one' },
    { body: 'The Practice Read landed like someone had actually met me. It was the first time I felt my practice was being written for me, not for a class.', who: 'Emma P.', tag: 'Foundation, month two' },
    { body: 'I stopped feeling like I had to earn the practice. It just met me.', who: 'Anaya R.', tag: 'Studio, year one' },
  ]
  return (
    <section className="py-28 px-8">
      <div className="max-w-[1240px] mx-auto">
        <div className="mb-14">
          <div
            className="text-[10px] uppercase mb-4"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            Practitioners
          </div>
          <h2
            className="text-[44px] leading-[1.15] max-w-[22ch] -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            Written by the people already in the studio.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <blockquote key={i} className="p-8 rounded-sm border" style={{ borderColor: H.border, backgroundColor: H.cream }}>
              <div
                className="text-[48px] leading-none mb-4"
                style={{ fontFamily: H.serif, color: H.terracotta, fontWeight: 500 }}
              >
                &ldquo;
              </div>
              <p className="text-[15px] leading-[1.7] mb-6" style={{ color: H.ink, fontFamily: H.serif }}>
                {q.body}
              </p>
              <footer>
                <div className="text-[13px] font-semibold" style={{ color: H.ink }}>{q.who}</div>
                <div className="text-[10px] uppercase mt-1" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.18em' }}>{q.tag}</div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * About Melisa
 * ───────────────────────────────────────────────────────────── */
function AboutMelisa() {
  return (
    <section id="about" className="py-28 px-8" style={{ backgroundColor: H.creamDeep }}>
      <div className="max-w-[1240px] mx-auto grid md:grid-cols-[1fr_1.2fr] gap-14 items-center">
        <div
          className="aspect-[4/5] rounded-sm border overflow-hidden relative"
          style={{ backgroundColor: H.terracottaSoft, borderColor: H.border }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <div
                className="text-[80px] leading-none mb-2"
                style={{ fontFamily: H.serif, color: H.terracotta, fontWeight: 500, letterSpacing: '-0.02em' }}
              >
                M
              </div>
              <div className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
                Portrait placeholder
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase mb-4"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            About Melisa
          </div>
          <h2
            className="text-[42px] leading-[1.15] mb-6 -tracking-[0.01em] max-w-[22ch]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            A teacher who wanted her practice to actually adapt to her students.
          </h2>
          <div className="space-y-5 text-[15px] leading-[1.8]" style={{ color: H.inkSoft }}>
            <p>
              Melisa has taught yoga in Brisbane for over a decade. She built Harmony after years of watching the same students hit the same wall around month six of any group programme - the wall where a class calendar stops being enough and the body needs something written for it.
            </p>
            <p>
              She teaches from the position that the practice is meant to work with the practitioner, not the other way around. Every session brief at Harmony is personal. Every Practice Read is signed. Every plan is reviewed before it lands with you.
            </p>
            <p>
              She holds a 500-hour teacher training and continuing certifications in trauma-informed practice, restorative yoga, and pre- and post-natal care.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * FAQ
 * ───────────────────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    {
      q: 'Is this an app or a studio?',
      a: 'Both. There is an in-studio experience for Brisbane students and an at-home practice experience for everyone. Every practitioner has a written plan and a coach who reads their check-ins.',
    },
    {
      q: 'Do I need to be experienced?',
      a: 'Harmony is designed for people who already practise. It works best if you have at least six months of consistent practice under any teacher. Complete beginners are gently redirected during the Assessment.',
    },
    {
      q: 'What actually happens after the Assessment?',
      a: 'Melisa reads your Assessment answers, drafts your Practice Read (a written analysis), and emails it to you within 24 hours. From there you can book a Foundation Call to speak with her, or take your Read and go practise on your own.',
    },
    {
      q: 'What is "Powered by Body Recode"?',
      a: 'The written analysis, the practice planning, the check-in coaching feedback - all of that is generated by an interpretation engine built by Body Recode, an Australian coaching platform. The engine + safety layer is theirs. The voice, the practice, and Melisa herself are ours.',
    },
    {
      q: 'Can I cancel the membership?',
      a: 'Yes, anytime. Studio membership renews monthly. Cancel from your account, no email required, no reason required.',
    },
  ]
  return (
    <section className="py-28 px-8">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-14">
          <div
            className="text-[10px] uppercase mb-4"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            Questions
          </div>
          <h2
            className="text-[42px] leading-[1.15] -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            What you might be wondering.
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group p-6 rounded-sm border cursor-pointer"
              style={{ borderColor: H.border, backgroundColor: H.cream }}
            >
              <summary className="flex items-center justify-between gap-6 list-none">
                <div className="text-[16px]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>{f.q}</div>
                <span
                  className="text-[16px] shrink-0 transition-transform group-open:rotate-45"
                  style={{ color: H.terracotta, fontFamily: H.serif }}
                >
                  +
                </span>
              </summary>
              <p className="text-[14px] leading-[1.75] mt-4" style={{ color: H.inkSoft }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
 * Final CTA
 * ───────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-28 px-8" style={{ backgroundColor: H.ink }}>
      <div className="max-w-[820px] mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 text-[10px] uppercase mb-8"
          style={{ fontFamily: H.mono, color: H.terracotta, letterSpacing: '0.24em' }}
        >
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracotta }} />
          Begin
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracotta }} />
        </div>
        <h2
          className="text-[52px] leading-[1.1] mb-8 -tracking-[0.01em]"
          style={{ fontFamily: H.serif, color: H.cream, fontWeight: 500 }}
        >
          Twelve questions. One Practice Read. Nothing else on your calendar.
        </h2>
        <Link
          href={`${BASE}/scorecard`}
          className="inline-flex items-center gap-2 px-8 py-5 rounded-full text-[13px] font-semibold uppercase transition-transform hover:scale-[1.02]"
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
  )
}
