import { Mail, MessageSquare } from 'lucide-react'
import { COMMUNICATION_KIND_LABELS, type ClientCommunicationKind } from '@/lib/client-communications'

export interface ClientCommunicationRow {
  id: string
  kind: string
  channel: string | null
  subject: string | null
  to_address: string | null
  meta: Record<string, unknown> | null
  sent_at: string
}

function formatSentAt(iso: string): string {
  const sent = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - sent.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} hr ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} day${diffD === 1 ? '' : 's'} ago`
  return sent.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Brisbane',
  })
}

function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Brisbane',
  })
}

function kindLabel(kind: string): string {
  if (kind in COMMUNICATION_KIND_LABELS) {
    return COMMUNICATION_KIND_LABELS[kind as ClientCommunicationKind]
  }
  return kind.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function pickUrl(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null
  const u = meta.url ?? meta.confirm_url
  return typeof u === 'string' ? u : null
}

export default function ClientCommunicationsPanel({ rows }: { rows: ClientCommunicationRow[] }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-medium text-[#1B6DFC]">Communications</p>
        <span className="text-[10px] text-[#666D7A]">{rows.length === 0 ? 'Nothing sent yet' : `Last ${rows.length}`}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-[#98A0AD]">
          Every email or SMS sent to this client will appear here with a timestamp.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map(row => {
            const isEmail = (row.channel ?? 'email') === 'email'
            const Icon = isEmail ? Mail : MessageSquare
            const url = pickUrl(row.meta)
            return (
              <li
                key={row.id}
                className="flex items-start gap-3 px-3 py-2.5 bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg"
              >
                <div className="mt-0.5 w-7 h-7 rounded-md bg-blue-50 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12.5px] font-semibold text-[#141821]">{kindLabel(row.kind)}</span>
                    <span className="text-[10px] text-[#666D7A]">
                      {isEmail ? 'Email' : 'SMS'}
                    </span>
                  </div>
                  {row.subject && (
                    <p className="text-[12.5px] text-[#43474F] truncate mt-0.5">{row.subject}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-[#666D7A]">
                    <span title={fullTimestamp(row.sent_at)}>{formatSentAt(row.sent_at)}</span>
                    {row.to_address && (
                      <>
                        <span className="text-[#D4D4D4]">·</span>
                        <span className="truncate">to {row.to_address}</span>
                      </>
                    )}
                    {url && (
                      <>
                        <span className="text-[#D4D4D4]">·</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          link
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
