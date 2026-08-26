'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { Card, EmptyState, MONO_FONT, Pill, accentColour } from '@/components/dashboard/ui'

type Direction = 'progress' | 'hold' | 'rebuild' | 'deload' | null

export interface ProgramCard {
  client_id: string
  client_name: string
  package_format: 'in_person' | 'online' | 'unknown'
  package_label: string
  sessions_per_week: number
  has_program: boolean
  // program fields
  program_id?: string
  block_name?: string
  progression_phase?: string
  training_goal?: string
  week_duration?: number
  current_week?: number | null
  current_direction?: Direction
  last_review_at?: string | null
  generated_at?: string | null
}

const DIRECTION_ACCENT: Record<NonNullable<Direction>, 'teal' | 'amber' | 'red' | 'blue'> = {
  progress: 'teal',
  hold: 'amber',
  rebuild: 'red',
  deload: 'blue',
}

const DIRECTION_LABEL: Record<NonNullable<Direction>, string> = {
  progress: 'On Track',
  hold: 'Hold',
  rebuild: 'Rebuild',
  deload: 'Deload',
}

type Filter = 'all' | 'in_person' | 'online' | 'no_program'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_person', label: 'Face-to-Face' },
  { id: 'online', label: 'Online' },
  { id: 'no_program', label: 'No Program' },
]

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function ProgramsGrid({ items }: { items: ProgramCard[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(it => {
      if (filter === 'in_person' && it.package_format !== 'in_person') return false
      if (filter === 'online' && it.package_format !== 'online') return false
      if (filter === 'no_program' && it.has_program) return false
      if (q && !it.client_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filter, query])

  const counts = useMemo(() => {
    const c = { all: items.length, in_person: 0, online: 0, no_program: 0 }
    for (const it of items) {
      if (it.package_format === 'in_person') c.in_person++
      if (it.package_format === 'online') c.online++
      if (!it.has_program) c.no_program++
    }
    return c
  }, [items])

  return (
    <div>
      {/* Filter + search bar */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => {
            const active = filter === f.id
            const count = counts[f.id]
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[12px] px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#EFF1F4] text-[#141821] border-[#CFD4DC]'
                    : 'bg-transparent text-[#666D7A] border-[#E8EAEE] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)]'
                }`}
              >
                {f.label}
                <span
                  className="ml-2 text-[10px] text-[#98A0AD]"
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0AD]" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search clients..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-md pl-9 pr-3 py-2 text-[13px] text-[#141821] placeholder:text-[#98A0AD] focus:outline-none focus:border-[#CFD4DC]"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="No matching programs"
            hint={query ? 'Try clearing the search.' : 'Try a different filter.'}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(item => (
            <ProgramCardTile key={item.client_id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProgramCardTile({ item }: { item: ProgramCard }) {
  const directionAccent =
    item.current_direction && item.has_program ? accentColour(DIRECTION_ACCENT[item.current_direction]) : null
  const accentBar = directionAccent ?? accentColour(item.has_program ? 'teal' : 'neutral')

  // If they have a program go straight to it. Otherwise to the macro plan to build one.
  const href = item.has_program
    ? `/dashboard/clients/${item.client_id}/program`
    : `/dashboard/clients/${item.client_id}/plan`

  return (
    <Link href={href} className="block group">
      <div className="relative br-card p-5 h-full transition-colors hover:border-[#CFD4DC] active:bg-[#EFF1F4]/40">
        <div
          className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
          style={{ background: accentBar.bar }}
        />
        <ArrowUpRight
          size={14}
          className="absolute top-5 right-5 text-[#98A0AD] group-hover:text-[#666D7A] transition-colors"
        />

        <div className="mt-4 mb-3">
          <p className="text-[16px] font-semibold text-[#141821] group-hover:text-[#1B6DFC] transition-colors leading-tight">
            {item.client_name}
          </p>
          <p
            className="text-[10px] text-[#666D7A] mt-1.5"
          >
            {item.package_label}
          </p>
        </div>

        {item.has_program ? (
          <>
            <p className="text-[13px] text-[#d6d3d1] leading-snug mb-3 line-clamp-2">
              {item.block_name}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {item.current_direction && (
                <Pill accent={DIRECTION_ACCENT[item.current_direction]}>
                  {DIRECTION_LABEL[item.current_direction]}
                </Pill>
              )}
              {item.progression_phase && (
                <Pill accent="neutral">{item.progression_phase}</Pill>
              )}
              {item.training_goal && (
                <Pill accent="neutral">{item.training_goal}</Pill>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#98A0AD]">
              <span>
                {item.current_week != null ? (
                  <>Wk {item.current_week}{item.week_duration ? ` / ${item.week_duration}` : ''}</>
                ) : (
                  <>Pre-start</>
                )}
              </span>
              <span>
                {item.last_review_at
                  ? `Reviewed ${formatRelative(item.last_review_at)}`
                  : item.generated_at
                  ? `Built ${formatRelative(item.generated_at)}`
                  : ''}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#666D7A] leading-snug">
            No active program. Tap to open the macro plan and build one.
          </p>
        )}
      </div>
    </Link>
  )
}
