import { getBriefing, type BoardroomRole, type BriefingItem } from '@/lib/boardroom-briefing'
import Link from 'next/link'

const TYPE_STYLES: Record<
  BriefingItem['type'],
  { badge: string; icon: string; badgeText: string; borderColor: string }
> = {
  action: { badge: 'bg-blue-100 text-blue-700', icon: '→', badgeText: 'Action', borderColor: 'border-blue-200' },
  question: { badge: 'bg-purple-100 text-purple-700', icon: '?', badgeText: 'Question', borderColor: 'border-purple-200' },
  observation: { badge: 'bg-[#F4F6F9] text-[#141821]', icon: '·', badgeText: 'Observation', borderColor: 'border-[#E8EAEE]' },
  alert: { badge: 'bg-red-100 text-red-700', icon: '!', badgeText: 'Alert', borderColor: 'border-red-300' },
}

const PRIORITY_STYLES: Record<
  BriefingItem['priority'],
  { ring: string }
> = {
  critical: { ring: 'ring-2 ring-red-300' },
  high: { ring: 'ring-1 ring-amber-300' },
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
      <div className="mb-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
        <strong className="text-[#141821]">{briefing.persona}&apos;s briefing unavailable.</strong> {briefing.error}
      </div>
    )
  }

  if (briefing.items.length === 0) {
    return (
      <div className="mb-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
        <strong className="text-[#141821]">{briefing.persona}</strong> is quiet today. Metrics below look nominal.
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-[11px] font-medium text-[#666D7A]">
          {label ?? `${briefing.persona}'s briefing`}
        </h3>
        <span className="text-[10px] text-[#98A0AD] font-mono">
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
    <div className={`bg-white border ${style.borderColor} rounded-xl p-5 ${priority.ring}`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full ${style.badge} flex items-center justify-center text-[13px] font-bold shrink-0 mt-0.5`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${style.badge} px-1.5 py-0.5 rounded`}>
              {style.badgeText}
            </span>
            {item.priority === 'critical' && (
              <span className="text-[9px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                Critical
              </span>
            )}
            {item.priority === 'high' && (
              <span className="text-[9px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                High
              </span>
            )}
          </div>
          <h4 className="text-[15px] font-bold text-[#141821] mb-1 leading-snug">{item.title}</h4>
          <p className="text-[13px] text-[#141821] leading-relaxed">{item.body}</p>
          {item.cta_href && item.cta_label && (
            <Link
              href={item.cta_href}
              className="inline-block mt-3 text-[13px] font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              {item.cta_label} →
            </Link>
          )}
          {!item.cta_href && item.cta_label && (
            <span className="inline-block mt-3 text-[13px] font-semibold text-[#98A0AD] italic">
              {item.cta_label} (Ask panel coming soon)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
