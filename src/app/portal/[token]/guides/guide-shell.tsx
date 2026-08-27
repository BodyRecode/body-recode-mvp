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
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/guides`} className="text-[12px] text-[#98A0AD] hover:text-[#43474F] transition-colors">← Back to guides</Link>
          <p
            className="text-[10px] font-bold text-[#1B6DFC] uppercase mt-4 mb-3"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
          >
            {eyebrow}
          </p>
          <h1 className="text-[30px] font-extrabold text-[#141821] tracking-tight leading-[1.1] mb-3">{title}</h1>
          <p className="text-[#666D7A] text-[15px] leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-5">
          {sections.map(s => (
            <div key={s.heading} className="rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5">
              <p className="text-[14px] font-semibold text-[#141821] mb-2.5">{s.heading}</p>
              <div className="text-[13px] text-[#666D7A] leading-relaxed space-y-2">{s.body}</div>
            </div>
          ))}
        </div>

        {closing && (
          <p className="text-[12px] text-[#98A0AD] italic mt-8 leading-relaxed">{closing}</p>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
