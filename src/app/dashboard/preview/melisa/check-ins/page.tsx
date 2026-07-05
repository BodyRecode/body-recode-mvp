import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { PENDING_CHECKINS, STUDENTS } from '../_lib/data'
import { EyebrowH1, SectionH2, Card, PowerLine } from '../_lib/ui'

const BASE = '/dashboard/preview/melisa'

export default function CheckInsQueue() {
  const historical = STUDENTS.filter((s) => !PENDING_CHECKINS.some((c) => c.studentSlug === s.slug)).slice(0, 5)

  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Check-in queue"
        title="Draft, tune, send. Your voice, at your pace."
        subtitle="Every check-in comes back with a drafted reply in your voice, shaped by the guidance you've set. Approve, edit, or regenerate - the student sees only what you send."
      />

      <SectionH2 title="Waiting on your reply" sub={`${PENDING_CHECKINS.length} pending · aim to close within 48 hours`} />
      <div className="space-y-4 mb-14">
        {PENDING_CHECKINS.map((c) => (
          <Card key={c.studentSlug}>
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                style={{ backgroundColor: MELISA_BRAND.accent }}
              >
                {c.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-[16px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{c.studentName}</div>
                  <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>· {c.block} · Week {c.week}</div>
                </div>
                <div className="text-[10px] uppercase mt-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
                  Submitted {c.submittedAgo}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 pl-4 border-l-2" style={{ borderColor: MELISA_BRAND.accentBorder }}>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Trajectory</div>
                <p className="text-[12px] leading-relaxed" style={{ color: MELISA_BRAND.inkMid }}>{c.fields.trajectory}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Quote</div>
                <p className="text-[12px] leading-relaxed italic" style={{ color: MELISA_BRAND.inkMid }}>&ldquo;{c.fields.quote}&rdquo;</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.warm, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Obstacle</div>
                <p className="text-[12px] leading-relaxed" style={{ color: MELISA_BRAND.inkMid }}>{c.fields.obstacle}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.ok, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Win</div>
                <p className="text-[12px] leading-relaxed" style={{ color: MELISA_BRAND.inkMid }}>{c.fields.win}</p>
              </div>
            </div>

            <div className="p-5 rounded-lg" style={{ backgroundColor: MELISA_BRAND.bgDeep }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: MELISA_BRAND.accent }} />
                <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
                  Drafted in your voice · breath-forward · plant-forward
                </div>
              </div>
              <div className="text-[13px] leading-relaxed space-y-2" style={{ color: MELISA_BRAND.ink }}>
                <p><strong>What we noticed:</strong> Your practice held steady through a heavier work week - the settling before Wednesday&apos;s longer session showed in your energy by Friday. That&apos;s the pattern we look for: not a bigger push, a steadier one.</p>
                <p><strong>What to hold this week:</strong> Notice the sensation of breath through the mobility work rather than counting time. If a shape starts to feel like a strong effort before we&apos;ve intended it to, name it out loud - it usually points somewhere the body is asking to be listened to.</p>
                <p><strong>One focus:</strong> Keep the Thursday practice as the anchor and let the rest flex around it.</p>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <button
                  className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: MELISA_BRAND.ink }}
                >
                  Approve + send
                </button>
                <button
                  className="text-[12px] font-semibold px-4 py-2 rounded-lg border bg-white"
                  style={{ borderColor: MELISA_BRAND.border, color: MELISA_BRAND.ink }}
                >
                  Edit before sending
                </button>
                <button
                  className="text-[12px] px-4 py-2"
                  style={{ color: MELISA_BRAND.inkMid }}
                >
                  Regenerate with more emphasis on breath
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionH2 title="Recently closed" sub="Last 7 days" />
      <Card>
        <ul className="divide-y" style={{ borderColor: MELISA_BRAND.border }}>
          {historical.map((s) => (
            <li key={s.slug} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
              <CheckCircle2 className="w-4 h-4" style={{ color: MELISA_BRAND.ok }} />
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: MELISA_BRAND.accent }}
              >
                {s.initials}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{s.name}</div>
                <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>{s.block} · sent {s.lastCheckin}</div>
              </div>
              <Link href={`${BASE}/students/${s.slug}`} className="inline-flex items-center gap-1 text-[11px]" style={{ color: MELISA_BRAND.inkMid }}>
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <PowerLine />
    </div>
  )
}
