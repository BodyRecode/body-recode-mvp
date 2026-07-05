import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { STUDENTS } from '../_lib/data'
import { EyebrowH1, SectionH2, Card, StateBadge, ProgressBar, PowerLine } from '../_lib/ui'

const BASE = '/dashboard/preview/melisa'

export default function StudentsRoster() {
  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Your studio roster"
        title={`${STUDENTS.length} students in active practice.`}
        subtitle="Every student, their current block, and how their practice is shaping. Click a row to open her profile, plans, and full check-in history."
      />

      <div className="mb-4 flex items-center justify-between">
        <SectionH2 title="Active" sub={`${STUDENTS.length} of your 10 Founding-tier seats`} />
        <button
          className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-2 rounded-lg border transition"
          style={{ borderColor: MELISA_BRAND.accentBorder, color: MELISA_BRAND.accentText, backgroundColor: MELISA_BRAND.accentSoft }}
        >
          <Plus className="w-3.5 h-3.5" /> Invite a student
        </button>
      </div>

      <Card>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>
              <th className="text-left pb-3 font-normal">Student</th>
              <th className="text-left pb-3 font-normal">State</th>
              <th className="text-left pb-3 font-normal">Current block</th>
              <th className="text-left pb-3 font-normal">Progress</th>
              <th className="text-left pb-3 font-normal">Last check-in</th>
              <th className="text-left pb-3 font-normal">With you</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s) => (
              <tr key={s.slug} className="border-t" style={{ borderColor: MELISA_BRAND.border }}>
                <td className="py-4">
                  <Link href={`${BASE}/students/${s.slug}`} className="flex items-center gap-3 hover:opacity-80">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: MELISA_BRAND.accent }}
                    >
                      {s.initials}
                    </div>
                    <div className="font-semibold" style={{ color: MELISA_BRAND.ink }}>{s.name}</div>
                  </Link>
                </td>
                <td className="py-4"><StateBadge state={s.state} /></td>
                <td className="py-4" style={{ color: MELISA_BRAND.inkMid }}>
                  {s.block}
                  <div className="text-[10px] uppercase" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}>Week {s.week}</div>
                </td>
                <td className="py-4 w-32">
                  <ProgressBar pct={s.progressPct} />
                  <div className="text-[10px] mt-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono }}>{s.progressPct}%</div>
                </td>
                <td className="py-4" style={{ color: MELISA_BRAND.inkMid }}>{s.lastCheckin}</td>
                <td className="py-4" style={{ color: MELISA_BRAND.inkMid }}>{s.joined}</td>
                <td className="py-4 text-right">
                  <Link href={`${BASE}/students/${s.slug}`}>
                    <ArrowRight className="w-4 h-4 inline-block" style={{ color: MELISA_BRAND.inkLight }} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Settling', count: STUDENTS.filter((s) => s.state === 'settling').length, sub: 'First block · orient + regulate' },
          { label: 'Building', count: STUDENTS.filter((s) => s.state === 'building').length, sub: 'Capacity + habit' },
          { label: 'Expression', count: STUDENTS.filter((s) => s.state === 'expression').length, sub: 'Advanced practice cycles' },
        ].map((row, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <StateBadge state={row.label.toLowerCase()} />
              <div
                className="text-[24px] font-normal"
                style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink }}
              >
                {row.count}
              </div>
            </div>
            <div className="text-[11px]" style={{ color: MELISA_BRAND.inkMid }}>{row.sub}</div>
          </Card>
        ))}
      </div>

      <PowerLine />
    </div>
  )
}
