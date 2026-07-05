import Link from 'next/link'
import { Users, ArrowUpRight, Activity, UserPlus } from 'lucide-react'
import { PageHeader, Card, SectionLabel, Pill, MONO_FONT } from '@/components/dashboard/ui'
import { HARMONY, HARMONY_STUDENTS } from '../_lib/brand'

/**
 * Mirror of /dashboard/coaching - active student roster. Same table
 * shape as the real BR coaching page (name, state, week/block,
 * check-in status, actions), Hermony's fake data.
 */
export default function HermonyCoaching() {
  const active = HARMONY_STUDENTS.length

  const statusToPill: Record<string, { label: string; accent: 'ink' | 'amber' | 'red' | 'neutral' }> = {
    active_settling:   { label: 'Settling',   accent: 'amber' },
    active_building:   { label: 'Building',   accent: 'ink' },
    active_expression: { label: 'Expression', accent: 'ink' },
    new:               { label: 'New',        accent: 'neutral' },
  }

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Students"
        title="Active roster"
        subtitle={`${active} students in active practice. ${10 - active} seats left in your Founding tier.`}
        accent="ink"
        cta={
          <button
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4] transition-colors"
          >
            <UserPlus size={14} /> Invite a student
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active', value: HARMONY_STUDENTS.length, sub: 'Practicing this week' },
          { label: 'Settling', value: HARMONY_STUDENTS.filter((s) => s.status === 'active_settling').length, sub: 'Block 1 · orient' },
          { label: 'Building', value: HARMONY_STUDENTS.filter((s) => s.status === 'active_building').length, sub: 'Block 2 · capacity' },
          { label: 'Expression', value: HARMONY_STUDENTS.filter((s) => s.status === 'active_expression').length, sub: 'Block 3+ · advanced' },
        ].map((s, i) => (
          <div
            key={i}
            className="relative bg-[#FAFBFD] border border-[#E5E5E5] rounded-2xl p-5 overflow-hidden"
          >
            <div
              className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
              style={{ background: HARMONY.accentBar }}
            />
            <p
              className="text-[10px] text-[#6B6B6B] uppercase mt-4 mb-3"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              {s.label}
            </p>
            <p
              className="text-[40px] font-extrabold text-[#1A1A1A] tracking-tight leading-none mb-2.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {s.value}
            </p>
            <p className="text-[11px] text-[#999999] truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      <Card padding="none">
        <SectionLabel
          accent="ink"
          cta={
            <div className="flex items-center gap-2">
              <button className="text-[12px] text-[#6B6B6B] hover:text-[#1A1A1A]">Active</button>
              <span className="text-[#E5E5E5]">·</span>
              <button className="text-[12px] text-[#6B6B6B] hover:text-[#1A1A1A]">Inactive</button>
            </div>
          }
        >
          <span className="px-6">All Students</span>
        </SectionLabel>

        <div className="border-t border-[#E5E5E5]">
          <div
            className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-3 border-b border-[#E5E5E5] text-[10px] text-[#6B6B6B] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
          >
            <div>Student</div>
            <div>State</div>
            <div>Current block</div>
            <div>Week</div>
            <div>Last check-in</div>
            <div></div>
          </div>
          {HARMONY_STUDENTS.map((s) => {
            const pill = statusToPill[s.status] || statusToPill.new
            return (
              <Link
                key={s.id}
                href="#"
                className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 border-b border-[#F0F0F0] last:border-0 items-center hover:bg-[#FAFBFD] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ background: HARMONY.accentBar }}
                    >
                      {s.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1A1A1A]">{s.name}</div>
                      <div className="text-[11px] text-[#999999]">{s.email}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <Pill accent={pill.accent}>{pill.label}</Pill>
                </div>
                <div className="text-[13px] text-[#4B4B4B]">{s.block}</div>
                <div className="text-[13px] text-[#4B4B4B]" style={{ fontFamily: MONO_FONT }}>W{s.week}</div>
                <div className="text-[13px] text-[#4B4B4B]">Fri</div>
                <div className="text-right">
                  <ArrowUpRight size={14} className="inline-block text-[#999999]" />
                </div>
              </Link>
            )
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Card>
          <SectionLabel accent="amber">Waiting on your reply</SectionLabel>
          <p className="text-[13px] text-[#4B4B4B] leading-relaxed mb-3">
            2 weekly check-ins ready. Both have AI-drafted feedback in your voice waiting for your review and send.
          </p>
          <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: HARMONY.accentText }}>
            Open queue <ArrowUpRight size={12} />
          </Link>
        </Card>

        <Card>
          <SectionLabel accent="ink">Readings ready to notify</SectionLabel>
          <p className="text-[13px] text-[#4B4B4B] leading-relaxed mb-3">
            1 nutrition plan and 1 block-end trajectory reading are drafted and waiting for you to click Notify.
          </p>
          <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: HARMONY.accentText }}>
            Review + send <ArrowUpRight size={12} />
          </Link>
        </Card>
      </div>

      <div className="mt-10 pt-6 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
        <div className="uppercase">INTERPRETATION ENGINE · POWERED BY BODY RECODE</div>
        <div className="uppercase">STUDENTS · {HARMONY.name.toUpperCase()}</div>
      </div>
    </div>
  )
}

// keep unused imports quiet in case of future re-use
void Users; void Activity;
