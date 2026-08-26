'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Avatar } from '@/components/dashboard/ui'

export type ClientListEntry = {
  id: string
  name: string
  status: 'active' | 'scheduled' | 'ended'
}

const STATUS_LABEL: Record<ClientListEntry['status'], string> = {
  active: 'Active',
  scheduled: 'Starting soon',
  ended: 'Ended',
}

/**
 * The middle pane. Lives in the clients layout, so moving between two
 * clients changes only the record on the right - the list does not reload,
 * lose its scroll position, or forget what you typed in the filter.
 */
export default function ClientListColumn({ clients }: { clients: ClientListEntry[] }) {
  const pathname = usePathname() || ''
  const [query, setQuery] = useState('')

  const activeId = pathname.split('/')[3] // /dashboard/clients/<id>/...

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q ? clients.filter(c => c.name.toLowerCase().includes(q)) : clients
    const order: ClientListEntry['status'][] = ['active', 'scheduled', 'ended']
    return order
      .map(status => ({ status, items: matched.filter(c => c.status === status) }))
      .filter(g => g.items.length > 0)
  }, [clients, query])

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <aside className="hidden xl:block print:hidden">
      <div className="sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col rounded-xl border border-[#E8EAEE] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.09),0_1px_2px_-1px_rgba(16,24,40,0.05)] overflow-hidden">
        <div className="p-2.5 border-b border-[#EFF1F4]">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A0AD]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clients"
              aria-label="Search clients"
              className="w-full text-[12.5px] text-[#141821] placeholder:text-[#98A0AD] pl-8 pr-7 py-[7px] rounded-lg border border-[#E8EAEE] bg-[#FBFCFD] focus:outline-none focus:border-[#B9D0FD] focus:bg-white focus:ring-[3px] focus:ring-[rgba(27,109,252,0.13)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#98A0AD] hover:text-[#141821]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-1.5">
          {total === 0 ? (
            <p className="text-[12.5px] text-[#98A0AD] px-3 py-6 text-center">
              No client matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            groups.map(group => (
              <div key={group.status}>
                <p className="px-3 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-[0.07em] text-[#9AA2B0]">
                  {STATUS_LABEL[group.status]}
                  <span className="ml-1.5 font-normal tracking-normal">{group.items.length}</span>
                </p>
                {group.items.map(c => {
                  const on = c.id === activeId
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/clients/${c.id}`}
                      aria-current={on ? 'page' : undefined}
                      className={`flex items-center gap-2.5 mx-1.5 px-2 py-[7px] rounded-lg text-[13px] transition-colors ${
                        on
                          ? 'bg-[rgba(27,109,252,0.09)] text-[#1B6DFC] font-medium'
                          : 'text-[#464C58] hover:bg-[#F4F6F9] hover:text-[#141821]'
                      }`}
                    >
                      <Avatar name={c.name} size={24} ring={false} />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
