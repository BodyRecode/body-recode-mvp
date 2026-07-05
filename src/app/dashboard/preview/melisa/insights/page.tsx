import { TrendingUp, Users, DollarSign, Heart } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { INSIGHTS } from '../_lib/data'
import { EyebrowH1, SectionH2, Card, StatFigure, PowerLine } from '../_lib/ui'

export default function InsightsPage() {
  const currency = (n: number) => `$${n.toLocaleString('en-AU')}`
  const maxMrr = Math.max(...INSIGHTS.breakdownMonths.map((m) => m.mrr))

  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Studio insights"
        title="Where your practice is running."
        subtitle="MRR, retention, engagement, and reach. Read weekly on Monday morning; used to decide who to check in with, what to publish, and when to open the next intake."
      />

      <div className="grid grid-cols-4 gap-5 mb-14">
        <StatFigure label="Monthly recurring" value={currency(INSIGHTS.mrr)} sub={`${INSIGHTS.activeStudents} students × Launch tier`} />
        <StatFigure label="Retention · 12wk" value={`${INSIGHTS.retention12wk}%`} sub={`24wk: ${INSIGHTS.retention24wk}%`} accent="ok" />
        <StatFigure label="Engagement · wk" value={`${Math.round(INSIGHTS.weeklyEngagement * 100)}%`} sub="of prescribed practice complete" />
        <StatFigure label="LTV · blended" value={currency(INSIGHTS.ltvBlended)} sub="Founding Ten cohort" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-14">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
            <SectionH2 title="Revenue trajectory" sub="Since Founding Ten launch" />
          </div>
          <Card>
            <div className="flex items-end gap-4 h-40 mb-4">
              {INSIGHTS.breakdownMonths.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${(m.mrr / maxMrr) * 100}%`,
                        backgroundColor: MELISA_BRAND.accent,
                        minHeight: '20px',
                      }}
                    />
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: MELISA_BRAND.ink, fontFamily: MELISA_BRAND.mono }}>
                    {m.month}
                  </div>
                  <div className="text-[10px]" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono }}>
                    ${(m.mrr / 1000).toFixed(1)}k
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t flex items-center justify-between text-[11px]" style={{ borderColor: MELISA_BRAND.border, color: MELISA_BRAND.inkMid }}>
              <span>4-month growth</span>
              <span className="font-semibold" style={{ color: MELISA_BRAND.ok }}>+ 133%</span>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
            <SectionH2 title="Cohort health" sub="Founding Ten only" />
          </div>
          <Card>
            <div className="space-y-4">
              <Row label="Waitlist" value={`${INSIGHTS.waitlist} names`} />
              <Row label="NPS · 90-day rolling" value={`${INSIGHTS.npsAvg} / 10`} />
              <Row label="Churn · 12wk" value={`${(INSIGHTS.churnRate * 100).toFixed(1)}%`} valueColor={MELISA_BRAND.ok} />
              <Row label="Content reach · 30d" value={INSIGHTS.contentReach.toLocaleString('en-AU')} />
              <Row label="Content growth · WoW" value={`+ ${Math.round(INSIGHTS.contentGrowth * 100)}%`} valueColor={MELISA_BRAND.ok} />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Monday morning brief" sub="AI-drafted from your data · your voice · read in 90 seconds" />
      </div>
      <Card>
        <div className="text-[13px] leading-relaxed space-y-3" style={{ color: MELISA_BRAND.ink }}>
          <p><strong>What&apos;s working:</strong> The Founding Ten cohort is holding at 100% retention. The rhythm you set (Monday brief, Wednesday practice, Friday close) is now showing up in the engagement pattern - practice complete rates are highest in that middle third of the week.</p>
          <p><strong>What to notice:</strong> Emma is settling but slowly. She&apos;s in Week 2 and her check-in language is still tentative. Consider a light-touch voice note this week rather than pushing more structure.</p>
          <p><strong>What to publish this week:</strong> The audience is asking &ldquo;how do you know when to rest.&rdquo; The Sunday carousel is drafted; consider filming a 90-second reel alongside it so you can lean into the same idea in two shapes.</p>
        </div>
      </Card>

      <div className="flex items-center gap-2 mt-14 mb-4">
        <TrendingUp className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Decisions this reads for" />
      </div>
      <Card>
        <ul className="text-[13px] space-y-2" style={{ color: MELISA_BRAND.ink }}>
          <li>• When to open the next 2 seats (waitlist at {INSIGHTS.waitlist} · you&apos;re 3 short of Launch cap)</li>
          <li>• Whether to raise from Launch tier ($400) to Standard tier at your first pricing review</li>
          <li>• Which student needs a personal check-in outside the weekly rhythm</li>
          <li>• When content is stalling vs when it&apos;s finding shape (WoW reach trend)</li>
        </ul>
      </Card>

      <PowerLine />
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>{label}</span>
      <span className="text-[14px] font-semibold" style={{ color: valueColor || MELISA_BRAND.ink, fontFamily: MELISA_BRAND.serif }}>{value}</span>
    </div>
  )
}
