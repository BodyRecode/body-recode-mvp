import { getBriefing, type BoardroomRole, type BriefingItem } from '@/lib/boardroom-briefing'
import Link from 'next/link'

const TYPE_STYLES: Record<
  BriefingItem['type'],
  { badge: string; icon: string; badgeText: string; borderColor: string }
> = {
  action: { badge: 'bg-[#DDE9FD] text-[#1056D6]', icon: '→', badgeText: 'Action', borderColor: 'border-[#2A2F39]' },
  question: { badge: 'bg-[#1A1E26] text-[#C2C6CC]', icon: '?', badgeText: 'Question', borderColor: 'border-[#2A2F39]' },
  observation: { badge: 'bg-[#1A1E26] text-[#FAFAF8]', icon: '·', badgeText: 'Observation', borderColor: 'border-[#2A2F39]' },
  alert: { badge: 'bg-[#FBDCDC] text-[#D4817E]', icon: '!', badgeText: 'Alert', borderColor: 'border-[#EFAFAF]' },
}

const PRIORITY_STYLES: Record<
  BriefingItem['priority'],
  { ring: string }
> = {
  critical: { ring: 'ring-2 ring-[#EFAFAF]' },
  high: { ring: 'ring-1 ring-[#E5C98F]' },
  normal: { ring: '' },
}

export async function BriefingCards({
  role,
  contextJson,
  label,
}: {
  role: BoardroomRole
  contextJson: string
  label?: string
}) {
  const briefing = await getBriefing(role, contextJson)

  if (briefing.error) {
    return (
      <div className="mb-8 p-4 rounded-xl border border-[#2A2F39] bg-[#14171D] text-[12.5px] text-[#8A9099] leading-relaxed">
        <strong className="text-[#FAFAF8]">{briefing.persona}&apos;s briefing unavailable.</strong> {briefing.error}
      </div>
    )
  }

  if (briefing.items.length === 0) {
    return (
      <div className="mb-8 p-4 rounded-xl border border-[#2A2F39] bg-[#14171D] text-[12.5px] text-[#8A9099] leading-relaxed">
        <strong className="text-[#FAFAF8]">{briefing.persona}</strong> is quiet today. Metrics below look nominal.
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-[11px] font-medium text-[#8A9099]">
          {label ?? `${briefing.persona}'s briefing`}
        </h3>
        <span className="text-[10px] text-[#676D76] font-mono">
          {new Date(briefing.generatedAt).toLocaleTimeString('en-AU', {
            timeZone: 'Australia/Brisbane',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="space-y-3">
        {briefing.items.map((item, idx) => (
          <BriefingCard key={idx} item={item} />
        ))}
      </div>
    </div>
  )
}

function BriefingCard({ item }: { item: BriefingItem }) {
  const style = TYPE_STYLES[item.type]
  const priority = PRIORITY_STYLES[item.priority]

  return (
    <div className={`bg-[#14171D] border ${style.borderColor} rounded-xl p-5 ${priority.ring}`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full ${style.badge} flex items-center justify-center text-[13.5px] font-bold shrink-0 mt-0.5`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${style.badge} px-1.5 py-0.5 rounded`}>
              {style.badgeText}
            </span>
            {item.priority === 'critical' && (
              <span className="text-[10px] font-medium bg-[#FBDCDC] text-[#D4817E] px-1.5 py-0.5 rounded">
                Critical
              </span>
            )}
            {item.priority === 'high' && (
              <span className="text-[10px] font-medium bg-[#FAEFD8] text-[#A96A12] px-1.5 py-0.5 rounded">
                High
              </span>
            )}
          </div>
          <h4 className="text-[16px] font-bold text-[#FAFAF8] mb-1 leading-snug">{item.title}</h4>
          <p className="text-[13.5px] text-[#FAFAF8] leading-relaxed">{item.body}</p>
          {item.cta_href && item.cta_label && (
            <Link
              href={item.cta_href}
              className="inline-block mt-3 text-[13.5px] font-semibold text-[#E4E4E0] hover:text-[#1056D6] underline"
            >
              {item.cta_label} →
            </Link>
          )}
          {!item.cta_href && item.cta_label && (
            <span className="inline-block mt-3 text-[13.5px] font-semibold text-[#676D76] italic">
              {item.cta_label} (Ask panel coming soon)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
