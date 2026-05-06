import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import type { ReactNode } from 'react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export interface GuideSection {
  heading: string
  body: ReactNode
}

export default function GuideShell({
  token,
  eyebrow,
  title,
  intro,
  sections,
  closing,
}: {
  token: string
  eyebrow: string
  title: string
  intro: string
  sections: GuideSection[]
  closing?: string
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/guides`} className="text-[12px] text-[#57534e] hover:text-[#d4cfc9] transition-colors">← Back to guides</Link>
          <p
            className="text-[10px] font-bold text-[#14b8a6] uppercase mt-4 mb-3"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
          >
            {eyebrow}
          </p>
          <h1 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mb-3">{title}</h1>
          <p className="text-[#a8a29e] text-[15px] leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-5">
          {sections.map(s => (
            <div key={s.heading} className="rounded-2xl border border-[#1c1917] bg-[#111110] p-5">
              <p className="text-[14px] font-semibold text-white mb-2.5">{s.heading}</p>
              <div className="text-[13px] text-[#a8a29e] leading-relaxed space-y-2">{s.body}</div>
            </div>
          ))}
        </div>

        {closing && (
          <p className="text-[12px] text-[#57534e] italic mt-8 leading-relaxed">{closing}</p>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
