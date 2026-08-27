import type { ReactNode } from 'react'

/**
 * Seven days of engagement, readable in one glance.
 *
 * Taken from Kahunas' client app, with one change that matters: theirs marks
 * a day done or not done, which only tells the truth when something is
 * expected EVERY day. Training is not - a client on 3 sessions a week would
 * show four failures every week. So the fill is meal logging, which an active
 * nutrition plan does expect daily, and a logged session is a separate mark
 * that can only ever add. A day can look quiet; it cannot look failed for
 * something that was never asked of it.
 *
 * Days before the client's plan started read as "not asked", not as missed.
 */
export type WeekDayState = {
  /** ISO date, yyyy-mm-dd, in Brisbane time. */
  date: string
  /** Weekday initial, e.g. "M". */
  initial: string
  /** full = every prescribed meal logged, partial = some, none = nothing. */
  meals: 'full' | 'partial' | 'none' | 'not-asked'
  /** A session was logged that day. Additive only - never a gap. */
  workout: boolean
  isToday: boolean
  /** Human-readable summary for the tooltip. */
  label: string
}

const FILL: Record<WeekDayState['meals'], string> = {
  full: '#1B6DFC',
  partial: 'rgba(27,109,252,0.32)',
  none: '#EFF1F4',
  'not-asked': 'transparent',
}

export function WeekStrip({
  days,
  showInitials = false,
  trailing,
}: {
  days: WeekDayState[]
  /** Weekday letters under the row. Off in a list, on in a record. */
  showInitials?: boolean
  trailing?: ReactNode
}) {
  return (
    <div className="inline-flex items-end gap-2">
      <div className="flex items-end gap-[3px]">
        {days.map(d => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span
              title={d.label}
              className="relative block w-[16px] h-[16px] rounded-[5px]"
              style={{
                background: FILL[d.meals],
                boxShadow:
                  d.meals === 'not-asked'
                    ? 'inset 0 0 0 1px #EFF1F4'
                    : d.meals === 'none'
                      ? 'inset 0 0 0 1px #E8EAEE'
                      : 'none',
                outline: d.isToday ? '1.5px solid #B9D0FD' : undefined,
                outlineOffset: d.isToday ? '1.5px' : undefined,
              }}
            >
              {d.workout && (
                <span
                  className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full"
                  style={{ background: '#177245', boxShadow: '0 0 0 1.5px #FFFFFF' }}
                  aria-hidden
                />
              )}
            </span>
            {showInitials && (
              <span className="text-[9.5px] leading-none text-[#98A0AD]">{d.initial}</span>
            )}
          </div>
        ))}
      </div>
      {trailing}
    </div>
  )
}

/**
 * Legend, for the one place the strip is explained rather than glanced at.
 */
export function WeekStripLegend() {
  return (
    <div className="flex items-center gap-4 text-[11.5px] text-[#666D7A] flex-wrap">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: '#1B6DFC' }} />
        Meals all logged
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: 'rgba(27,109,252,0.32)' }} />
        Some logged
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: '#EFF1F4', boxShadow: 'inset 0 0 0 1px #E8EAEE' }} />
        Nothing logged
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[11px] h-[11px] rounded-[3px]" style={{ boxShadow: 'inset 0 0 0 1px #EFF1F4' }} />
        No plan yet
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#177245' }} />
        Session logged
      </span>
    </div>
  )
}
