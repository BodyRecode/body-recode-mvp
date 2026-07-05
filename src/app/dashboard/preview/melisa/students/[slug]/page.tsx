import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, MessageSquare, FileText, Clock } from 'lucide-react'
import { MELISA_BRAND } from '../../_lib/brand'
import { STUDENTS, PENDING_CHECKINS } from '../../_lib/data'
import { EyebrowH1, SectionH2, Card, StateBadge, ProgressBar, KV, PowerLine } from '../../_lib/ui'

const BASE = '/dashboard/preview/melisa'

export default async function StudentDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const student = STUDENTS.find((s) => s.slug === slug)
  if (!student) notFound()

  const openCheckin = PENDING_CHECKINS.find((c) => c.studentSlug === slug)

  return (
    <div className="pb-24">
      <Link
        href={`${BASE}/students`}
        className="inline-flex items-center gap-1 text-[11px] mb-6"
        style={{ color: MELISA_BRAND.inkMid, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}
      >
        <ArrowLeft className="w-3 h-3" /> ALL STUDENTS
      </Link>

      <div className="flex items-start gap-6 mb-10">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[22px] font-bold shrink-0"
          style={{ backgroundColor: MELISA_BRAND.accent, fontFamily: MELISA_BRAND.serif }}
        >
          {student.initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-[38px] font-normal leading-tight" style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink }}>
              {student.name}
            </h1>
            <StateBadge state={student.state} />
          </div>
          <p className="text-[14px] leading-relaxed max-w-[60ch]" style={{ color: MELISA_BRAND.inkMid, fontStyle: 'italic' }}>
            &ldquo;{student.focus}&rdquo;
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <Card><KV label="Current block" value={student.block} /></Card>
        <Card>
          <KV label="Week" value={`${student.week} of 6`} />
          <div className="mt-2"><ProgressBar pct={student.progressPct} /></div>
        </Card>
        <Card><KV label="Last check-in" value={student.lastCheckin} /></Card>
        <Card><KV label="With Melisa" value={student.joined} /></Card>
      </div>

      {openCheckin && (
        <div className="mb-14">
          <SectionH2 title="Latest check-in" sub={`Submitted ${openCheckin.submittedAgo}`} />
          <Card>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-6">
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Trajectory</div>
                <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{openCheckin.fields.trajectory}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Quote of the week</div>
                <p className="text-[13px] leading-relaxed italic" style={{ color: MELISA_BRAND.ink }}>&ldquo;{openCheckin.fields.quote}&rdquo;</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.warm, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Obstacle</div>
                <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{openCheckin.fields.obstacle}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.ok, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Win</div>
                <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{openCheckin.fields.win}</p>
              </div>
            </div>

            <div className="pt-5 border-t" style={{ borderColor: MELISA_BRAND.border }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: MELISA_BRAND.accent }} />
                <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
                  AI draft feedback · your voice
                </div>
              </div>
              <div className="space-y-3 text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>
                <p><strong>What we noticed:</strong> You held the whole week under a real workload and still let Wednesday be the anchor. That is the pattern we look for at this point in the block - not a bigger push, a steadier one.</p>
                <p><strong>What to hold this week:</strong> Notice the breath through the mobility work rather than counting time. If a shape starts to feel like a strong effort before it should, name it out loud - it usually points somewhere the body is asking to be listened to.</p>
                <p><strong>One focus:</strong> Keep Thursday as the anchor and let the rest flex around it. Five minutes is still practice.</p>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <button
                  className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: MELISA_BRAND.ink }}
                >
                  Approve + send
                </button>
                <button
                  className="text-[12px] font-semibold px-4 py-2 rounded-lg border"
                  style={{ borderColor: MELISA_BRAND.border, color: MELISA_BRAND.ink }}
                >
                  Edit before sending
                </button>
                <button
                  className="text-[12px] px-4 py-2"
                  style={{ color: MELISA_BRAND.inkMid }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-14">
        <div>
          <SectionH2 title="Current plans" />
          <Card>
            <ul className="divide-y" style={{ borderColor: MELISA_BRAND.border }}>
              <li className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: MELISA_BRAND.accent }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>Program · {student.block}</div>
                  <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>Published · 4 sessions/wk</div>
                </div>
              </li>
              <li className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: MELISA_BRAND.accent }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>Nourishment · Foundation</div>
                  <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>Published · plant-forward defaults</div>
                </div>
              </li>
            </ul>
          </Card>
        </div>

        <div>
          <SectionH2 title="Check-in history" />
          <Card>
            <ul className="divide-y" style={{ borderColor: MELISA_BRAND.border }}>
              {['Wk 3', 'Wk 2', 'Wk 1', 'Onboarding'].map((wk, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: MELISA_BRAND.inkLight }} />
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{wk}</div>
                    <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>Feedback sent · read</div>
                  </div>
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: MELISA_BRAND.inkLight }} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <PowerLine />
    </div>
  )
}
