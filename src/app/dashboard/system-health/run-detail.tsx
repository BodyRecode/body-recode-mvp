'use client'

import { useState } from 'react'

type CheckStatus = 'ok' | 'fixed' | 'failed' | 'info'

type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
  action?: string
  manualFix?: string
}

type Run = {
  id: string
  ran_at: string
  status: string
  failures_count: number
  fixes_count: number
  checks: CheckResult[]
  report_md: string
}

const SECTIONS = [
  { label: 'Infrastructure', range: [0, 4] },
  { label: 'Write Smoke Tests', range: [4, 9] },
  { label: 'Data Integrity', range: [9, 15] },
  { label: 'Automation + Pipeline', range: [15, 17] },
]

export default function RunDetail({ run }: { run: Run }) {
  const [downloading, setDownloading] = useState(false)

  const checks: CheckResult[] = Array.isArray(run.checks) ? run.checks : []
  const failures = checks.filter(c => c.status === 'failed')
  const fixes = checks.filter(c => c.status === 'fixed')

  const ranAt = new Date(run.ran_at)
  const dateStr = ranAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const overallColor = run.status === 'ok'
    ? 'text-blue-500 border-blue-200 bg-blue-500/5'
    : run.status === 'fixed'
    ? 'text-amber-700 border-amber-200 bg-amber-400/5'
    : 'text-red-700 border-red-200 bg-red-400/5'

  const overallLabel = run.status === 'ok'
    ? 'All systems operational'
    : run.status === 'fixed'
    ? `${run.fixes_count} issue${run.fixes_count === 1 ? '' : 's'} auto-fixed`
    : `${run.failures_count} issue${run.failures_count === 1 ? '' : 's'} need your attention`

  function download() {
    setDownloading(true)
    const filename = `body-recode-health-${ranAt.toISOString().slice(0, 10)}.md`
    const blob = new Blob([run.report_md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const statusIcon = (s: CheckStatus) => {
    if (s === 'ok') return <span className="text-blue-500 font-bold">&#10003;</span>
    if (s === 'fixed') return <span className="text-amber-700 font-bold">&#9889;</span>
    if (s === 'failed') return <span className="text-red-700 font-bold">&#10007;</span>
    return <span className="text-[#98A0AD]">&#8212;</span>
  }

  const statusTextColor = (s: CheckStatus) => {
    if (s === 'ok') return 'text-[#141821]'
    if (s === 'fixed') return 'text-amber-700'
    if (s === 'failed') return 'text-red-700'
    return 'text-[#666D7A]'
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12.5px] text-[#666D7A] mb-1">{dateStr}</p>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${overallColor}`}>
              {overallLabel}
            </span>
            <p className="text-[12.5px] text-[#98A0AD] mt-2">{checks.length} checks run</p>
          </div>
          <button
            onClick={download}
            disabled={downloading}
            className="flex-shrink-0 text-[12.5px] font-semibold px-4 py-2 border border-[#E8EAEE] text-[#141821] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download .md'}
          </button>
        </div>

        {/* Summary callouts */}
        {failures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E8EAEE]">
            <p className="text-[12.5px] font-medium text-red-700 mb-2">Needs manual attention</p>
            <div className="space-y-1.5">
              {failures.map((f, i) => (
                <div key={i}>
                  <p className="text-[12.5px] text-[#141821] font-medium">{f.name}</p>
                  {f.manualFix && <p className="text-[12.5px] text-[#666D7A] mt-0.5">{f.manualFix}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {fixes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E8EAEE]">
            <p className="text-[12.5px] font-medium text-amber-700 mb-2">Auto-fixed</p>
            <div className="space-y-1">
              {fixes.map((f, i) => (
                <p key={i} className="text-[12.5px] text-[#666D7A]">{f.name} - {f.action}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full check results by section */}
      <div className="space-y-4">
        {SECTIONS.map(section => {
          const sectionChecks = checks.slice(section.range[0], section.range[1])
          if (sectionChecks.length === 0) return null
          return (
            <div key={section.label} className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
              <p className="text-[12.5px] font-medium text-[#666D7A] mb-4">{section.label}</p>
              <div className="space-y-3">
                {sectionChecks.map((c, i) => (
                  <div key={i} className={`pb-3 ${i < sectionChecks.length - 1 ? 'border-b border-[#E8EAEE]' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(c.status)}
                      <span className={`text-sm font-semibold ${statusTextColor(c.status)}`}>{c.name}</span>
                    </div>
                    <p className="text-[12.5px] text-[#666D7A] pl-5">{c.detail}</p>
                    {c.action && (
                      <p className="text-[12.5px] text-amber-700 pl-5 mt-1">&#9889; {c.action}</p>
                    )}
                    {c.manualFix && (
                      <p className="text-[12.5px] text-red-700 pl-5 mt-1">Action needed: {c.manualFix}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
