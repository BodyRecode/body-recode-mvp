import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MELISA_BRAND } from './_lib/brand'
import { PENDING_CHECKINS, TODAY_SESSIONS, RECENT_ACTIVITY, INSIGHTS } from './_lib/data'
import { EyebrowH1, SectionH2, Card, StatFigure, PowerLine } from './_lib/ui'

const BASE = '/dashboard/preview/melisa'

export default function MelisaHome() {
  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Your studio · Wednesday morning"
        title="Two check-ins waiting. One nourishment plan ready to send. One block-end review queued."
      />

      {/* Top row: focus tiles */}
      <div className="grid grid-cols-3 gap-5 mb-14">
        <StatFigure label="Active students" value={String(INSIGHTS.activeStudents)} sub="of 10 in your Launch tier" />
        <StatFigure label="Check-ins pending" value={String(PENDING_CHECKINS.length)} sub="Sarah W. · Emma P." accent="warm" />
        <StatFigure label="Weekly engagement" value={`${Math.round(INSIGHTS.weeklyEngagement * 100)}%`} sub="of prescribed practice complete" accent="ok" />
      </div>

      {/* Two-col: today + activity */}
      <div className="grid grid-cols-2 gap-5 mb-14">
        <div>
          <SectionH2 title="Today" sub="Live from your calendar" />
          <Card>
            <ul className="divide-y" style={{ borderColor: MELISA_BRAND.border }}>
              {TODAY_SESSIONS.map((s, i) => (
                <li key={i} className="py-3 flex items-center gap-4 first:pt-0 last:pb-0">
                  <div
                    className="w-14 text-center text-[13px] font-semibold"
                    style={{ color: MELISA_BRAND.ink, fontFamily: MELISA_BRAND.mono }}
                  >
                    {s.time}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{s.label}</div>
                    <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>{s.who}</div>
                  </div>
                  <span
                    className="text-[9px] uppercase px-2 py-0.5 rounded"
                    style={{
                      color: s.kind === 'group' ? MELISA_BRAND.accentText : MELISA_BRAND.warm,
                      backgroundColor: s.kind === 'group' ? MELISA_BRAND.accentSoft : MELISA_BRAND.warmSoft,
                      fontFamily: MELISA_BRAND.mono,
                      letterSpacing: '0.12em',
                    }}
                  >
                    {s.kind}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <SectionH2 title="Studio activity" sub="Last 48 hours" />
          <Card>
            <ul className="space-y-2.5">
              {RECENT_ACTIVITY.map((a, i) => (
                <li key={i} className="flex gap-3 text-[13px]">
                  <span
                    className="w-16 shrink-0 text-[10px] uppercase pt-0.5"
                    style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}
                  >
                    {a.when}
                  </span>
                  <span style={{ color: MELISA_BRAND.ink }}>{a.what}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Pending check-ins panel */}
      <SectionH2 title="Waiting on your reply" sub="AI has drafted feedback in your voice - review and send" />
      <div className="space-y-4 mb-14">
        {PENDING_CHECKINS.map((c) => (
          <Link key={c.studentSlug} href={`${BASE}/check-ins`} className="block">
            <Card hover>
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                  style={{ backgroundColor: MELISA_BRAND.accent }}
                >
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-[14px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{c.studentName}</div>
                    <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>· {c.block} · Week {c.week}</div>
                    <div
                      className="text-[10px] uppercase ml-auto"
                      style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}
                    >
                      {c.submittedAgo}
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.inkMid }}>{c.summary}</p>
                </div>
                <ArrowRight className="w-4 h-4 mt-1 shrink-0" style={{ color: MELISA_BRAND.inkLight }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Powered-by line */}
      <PowerLine />
    </div>
  )
}
