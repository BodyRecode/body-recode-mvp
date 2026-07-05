import { Dumbbell, Apple, Sparkles } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { PLANS } from '../_lib/data'
import { EyebrowH1, SectionH2, Card, PowerLine } from '../_lib/ui'

export default function PlansPage() {
  const programs = PLANS.filter((p) => p.kind === 'program')
  const nutrition = PLANS.filter((p) => p.kind === 'nutrition')

  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Plans"
        title="Program + nourishment plans, drafted in your voice."
        subtitle="Every plan is generated from your student's intake + current signal, then written in the voice you've tuned. You review before publish. Nothing lands with your student until you say so."
      />

      <div className="grid grid-cols-2 gap-6 mb-14">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
            <SectionH2 title="Programs" sub={`${programs.length} active`} />
          </div>
          <div className="space-y-3">
            {programs.map((p, i) => (
              <PlanCard key={i} title={p.title} student={p.student} status={p.status} block={p.block} updated={p.updated} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Apple className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
            <SectionH2 title="Nourishment" sub={`${nutrition.length} active`} />
          </div>
          <div className="space-y-3">
            {nutrition.map((p, i) => (
              <PlanCard key={i} title={p.title} student={p.student} status={p.status} block={p.block} updated={p.updated} />
            ))}
          </div>
        </div>
      </div>

      <SectionH2 title="Sample: Sarah W. · Block 1 program reading" sub="How a plan actually lands in your voice" />
      <Card>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b" style={{ borderColor: MELISA_BRAND.border }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: MELISA_BRAND.accent }} />
          <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
            Program reading · yoga voice · breath-forward guidance applied
          </div>
        </div>
        <div className="text-[13px] leading-relaxed space-y-3" style={{ color: MELISA_BRAND.ink }}>
          <p>This block is a settling block. Four practices a week - three active, one restorative - with breath cues woven through every session brief. The intention is to notice what steady practice under an unhurried tempo feels like before we ask the body to do more.</p>
          <p>Your Wednesday session is the longest and holds most of the strength patterning. Notice how the shapes land, particularly in the hips and shoulders, and let that inform how you approach Friday&apos;s shorter session.</p>
          <p>Regression paths are signposted in every brief. If a shape is asking for less on any day, take less. This block progresses on consistency, not intensity.</p>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <button
            className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: MELISA_BRAND.ink }}
          >
            Publish + notify Sarah
          </button>
          <button
            className="text-[12px] font-semibold px-4 py-2 rounded-lg border"
            style={{ borderColor: MELISA_BRAND.border, color: MELISA_BRAND.ink }}
          >
            Edit
          </button>
          <button
            className="text-[12px] px-4 py-2"
            style={{ color: MELISA_BRAND.inkMid }}
          >
            Regenerate
          </button>
        </div>
      </Card>

      <PowerLine />
    </div>
  )
}

function PlanCard({ title, student, status, block, updated }: { title: string; student: string; status: string; block: string; updated: string }) {
  const chipColor =
    status === 'published'      ? { fg: MELISA_BRAND.ok,       bg: 'rgba(91,122,77,0.1)' } :
    status === 'draft-ready'    ? { fg: MELISA_BRAND.accentText, bg: MELISA_BRAND.accentSoft } :
                                  { fg: MELISA_BRAND.warm,     bg: MELISA_BRAND.warmSoft }
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{title}</div>
          <div className="text-[11px]" style={{ color: MELISA_BRAND.inkLight }}>{student} · {block}</div>
        </div>
        <span
          className="text-[9px] uppercase px-2 py-0.5 rounded"
          style={{ color: chipColor.fg, backgroundColor: chipColor.bg, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.12em', fontWeight: 600 }}
        >
          {status.replace('-', ' ')}
        </span>
      </div>
      <div className="text-[10px] mt-2" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}>
        UPDATED {updated.toUpperCase()}
      </div>
    </Card>
  )
}
