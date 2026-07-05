import { Calendar as CalIcon, Radio, Image as ImageIcon, Video, Sparkles } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { CONTENT_CALENDAR } from '../_lib/data'
import { EyebrowH1, SectionH2, Card, PowerLine } from '../_lib/ui'

const KIND_META = {
  reel:     { icon: Video,     label: 'Reel'     },
  carousel: { icon: ImageIcon, label: 'Carousel' },
  story:    { icon: CalIcon,   label: 'Story'    },
  live:     { icon: Radio,     label: 'Live'     },
} as const

export default function ContentPage() {
  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Content"
        title="Publish rhythm, not a factory."
        subtitle="Your voice, drafted for you. Same tuning as your check-ins and plans - so the Instagram caption sounds like the reply you sent Sarah on Wednesday. Approve what feels right; skip what doesn't."
      />

      <SectionH2 title="This week" sub="7 days ahead" />
      <Card>
        <ul className="divide-y" style={{ borderColor: MELISA_BRAND.border }}>
          {CONTENT_CALENDAR.map((c, i) => {
            const K = KIND_META[c.kind]
            const Icon = K.icon
            const status =
              c.status === 'published' ? { bg: 'rgba(91,122,77,0.1)', fg: MELISA_BRAND.ok, label: 'PUBLISHED' } :
              c.status === 'scheduled' ? { bg: MELISA_BRAND.accentSoft, fg: MELISA_BRAND.accentText, label: 'SCHEDULED' } :
                                          { bg: MELISA_BRAND.warmSoft, fg: MELISA_BRAND.warm, label: 'DRAFTING' }
            return (
              <li key={i} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                <div className="w-28 text-[10px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
                  {c.when}
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: MELISA_BRAND.accentSoft }}>
                  <Icon className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ color: MELISA_BRAND.ink }}>{c.title}</div>
                  <div className="text-[10px] uppercase mt-0.5" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}>{K.label}</div>
                </div>
                <span
                  className="text-[9px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: status.bg, color: status.fg, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em', fontWeight: 700 }}
                >
                  {status.label}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="mt-14">
        <SectionH2 title="Caption drafted for tomorrow's reel" sub="Your voice · plant-forward · breath-forward" />
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5" style={{ color: MELISA_BRAND.accent }} />
            <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.accentText, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
              Preview
            </div>
          </div>
          <div className="text-[14px] leading-relaxed space-y-3" style={{ color: MELISA_BRAND.ink, fontFamily: MELISA_BRAND.sans }}>
            <p>Ninety seconds this morning:</p>
            <p>The settling before the strong is where the practice actually happens.</p>
            <p>Most of us treat the first ten minutes of a session as the throat-clear before the real work. It isn&apos;t. It&apos;s the invitation. If you skip it, the body knows.</p>
            <p>Try this on any practice for the next week: give the settling as much attention as the strong. Notice how your Wednesday feels different by Friday.</p>
            <p className="text-[12px] italic" style={{ color: MELISA_BRAND.inkMid }}>#yogaathome · #restisapractice · #melisayoga</p>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-5 border-t" style={{ borderColor: MELISA_BRAND.border }}>
            <button
              className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: MELISA_BRAND.ink }}
            >
              Approve for tomorrow 7am
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
              Regenerate softer
            </button>
          </div>
        </Card>
      </div>

      <PowerLine />
    </div>
  )
}
