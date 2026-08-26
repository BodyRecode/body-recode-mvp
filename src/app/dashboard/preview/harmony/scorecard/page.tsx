import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { H, LADDER } from '../_lib/tokens'

const BASE = '/dashboard/preview/harmony'

export default function HarmonyScorecard() {
  const promises = [
    'A 2-minute assessment on the body you brought this week',
    'A written Practice Read by Melisa, delivered within 24 hours',
    'A clear read on what to hold and what to leave alone in your practice this month',
    'No card, no commitment, no follow-up sales flow',
  ]
  const questions = [
    { section: 'The body', items: ['Where is your body carrying tension right now?', 'How is your sleep this week?', 'Any injury or restriction we should hold the practice around?'] },
    { section: 'The week', items: ['What is the shape of your work-week?', 'How many practices are realistic for you right now?', 'What time of day suits your body best?'] },
    { section: 'The history', items: ['How long have you been practising?', 'What lineages have you moved through?', 'When did you last feel the practice actually working?'] },
  ]

  return (
    <>
      {/* Header block */}
      <section className="pt-24 pb-16 px-8">
        <div className="max-w-[920px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 text-[10px] mb-8"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
            Step 01 of the Path
          </div>
          <h1
            className="text-[56px] leading-[1.08] mb-6 -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
          >
            The Practice Readiness Assessment
          </h1>
          <p className="text-[17px] leading-[1.7] max-w-[56ch] mx-auto" style={{ color: H.inkSoft }}>
            Twelve questions. Melisa reads every answer personally. You receive a written Practice Read within 24 hours - a two-page document that reads like a letter from a coach who has just met you.
          </p>
        </div>
      </section>

      {/* The promise */}
      <section className="py-16 px-8" style={{ backgroundColor: H.creamDeep }}>
        <div className="max-w-[820px] mx-auto">
          <div
            className="text-[10px] mb-6 text-center"
            style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}
          >
            What you get
          </div>
          <ul className="space-y-4">
            {promises.map((p, i) => (
              <li key={i} className="flex items-start gap-4 p-5 rounded-sm border" style={{ borderColor: H.border, backgroundColor: H.cream }}>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: H.terracottaSoft }}
                >
                  <Check size={12} style={{ color: H.terracottaDeep }} strokeWidth={2.5} />
                </span>
                <span className="text-[15px] leading-relaxed" style={{ color: H.ink }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What we ask */}
      <section className="py-24 px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-14 text-center">
            <div className="text-[10px] mb-4" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
              What we ask
            </div>
            <h2
              className="text-[36px] leading-[1.15] max-w-[28ch] mx-auto -tracking-[0.01em]"
              style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}
            >
              Twelve questions across three domains.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {questions.map((q, i) => (
              <div key={i} className="p-6 rounded-sm border" style={{ borderColor: H.border, backgroundColor: H.cream }}>
                <div
                  className="text-[10px] mb-4"
                  style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.2em' }}
                >
                  0{i + 1} · {q.section}
                </div>
                <ul className="space-y-3">
                  {q.items.map((item, j) => (
                    <li key={j} className="text-[13px] leading-relaxed" style={{ color: H.inkSoft }}>
                      <span style={{ color: H.terracotta, fontFamily: H.serif, fontSize: '15px', marginRight: '6px' }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + what's next */}
      <section className="py-24 px-8" style={{ backgroundColor: H.ink }}>
        <div className="max-w-[820px] mx-auto text-center">
          <div
            className="text-[10px] mb-6"
            style={{ fontFamily: H.mono, color: H.terracotta, letterSpacing: '0.24em' }}
          >
            When you&apos;re ready
          </div>
          <h2
            className="text-[44px] leading-[1.1] mb-6 -tracking-[0.01em]"
            style={{ fontFamily: H.serif, color: H.cream, fontWeight: 500 }}
          >
            Two minutes. No card. No pressure.
          </h2>
          <p className="text-[15px] leading-[1.7] mb-10 max-w-[52ch] mx-auto" style={{ color: '#B8AA95' }}>
            After you submit, Melisa reads it and writes your Practice Read the same evening or the next morning. It lands in your inbox within 24 hours. You can act on it, or not.
          </p>
          <button
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full text-[13px] font-semibold uppercase transition-transform hover:scale-[1.02]"
            style={{
              background: H.terracotta,
              color: H.cream,
              fontFamily: H.mono,
              letterSpacing: '0.16em',
            }}
          >
            Begin the Assessment
            <ArrowRight size={14} />
          </button>
          <div className="mt-10 pt-8 border-t max-w-[520px] mx-auto" style={{ borderColor: '#2C2C2C' }}>
            <div className="text-[10px] mb-3" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}>
              What follows
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: H.cream }}>{LADDER.read.label}</div>
                <div className="text-[11px]" style={{ color: '#8A8175' }}>{LADDER.read.price}</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: H.cream }}>{LADDER.call.label}</div>
                <div className="text-[11px]" style={{ color: '#8A8175' }}>{LADDER.call.price}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-10 text-center px-8">
        <Link
          href={BASE}
          className="text-[11px]"
          style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}
        >
          ← Back to Harmony
        </Link>
      </div>
    </>
  )
}
