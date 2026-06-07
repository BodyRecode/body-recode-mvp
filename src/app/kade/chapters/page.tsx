import type { Metadata } from 'next'
import Link from 'next/link'
import { CHAPTERS } from '@/lib/kade-chapters'
import { Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tracing Myself - Kade Dunstone',
  description: 'A memoir of meaning, misfires, and the making of me.',
}

const PARTS = [
  { number: 1, label: 'The Father & The Fracture' },
  { number: 2, label: 'Building Myself From Scratch' },
  { number: 3, label: 'Love, Loss, and Starting Again' },
  { number: 4, label: 'Unmasking Myself' },
] as const

export default function ChaptersIndexPage() {
  return (
    <div className={`${serif.className} min-h-screen bg-[#F3E9E1] text-[#2A1E16]`}>
      <div className="max-w-2xl mx-auto px-5 py-16">

        {/* Back link */}
        <Link href="/kade" className="text-xs italic text-[#8A7565] hover:text-[#B5552F] transition-colors mb-12 inline-block tracking-wide">← bodyrecode.au/kade</Link>

        {/* Header */}
        <div className="mb-16 mt-6">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#B5552F] uppercase mb-4">Tracing Myself</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4">A memoir of meaning, misfires, and the making of me.</h1>
          <p className="text-[#6E5B4D] italic leading-relaxed">Twenty chapters. Published as I write them.</p>
        </div>

        {/* Clay rule */}
        <div className="w-12 h-px bg-[#B5552F] mb-12" />

        {/* Parts */}
        {PARTS.map(part => {
          const chapters = CHAPTERS.filter(c => c.part === part.number)
          return (
            <section key={part.number} className="mb-14">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#8A7565] uppercase mb-5">Part {romanize(part.number)} — {part.label}</p>
              <div className="space-y-px">
                {chapters.map(c => {
                  const isPublished = !!c.content
                  return isPublished ? (
                    <Link
                      key={c.slug}
                      href={`/kade/chapters/${c.slug}`}
                      className="group flex items-baseline gap-4 py-3.5 px-4 -mx-4 rounded-lg hover:bg-[#EFE4D8] transition-colors"
                    >
                      <span className="text-xs font-mono text-[#8A7565] group-hover:text-[#B5552F] transition-colors w-8 shrink-0">{String(c.number).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">{c.title}</p>
                        <p className="text-sm text-[#6E5B4D] italic mt-0.5">{c.summary}</p>
                      </div>
                      <span className="text-[#8A7565] group-hover:text-[#B5552F] transition-colors text-sm shrink-0 italic">Read →</span>
                    </Link>
                  ) : (
                    <div
                      key={c.slug}
                      className="flex items-baseline gap-4 py-3.5 px-4 -mx-4 opacity-50"
                    >
                      <span className="text-xs font-mono text-[#8A7565] w-8 shrink-0">{String(c.number).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-[#6E5B4D]">{c.title}</p>
                        <p className="text-sm text-[#8A7565] italic mt-0.5">{c.summary}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[#8A7565] shrink-0">Coming</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <div className="border-t border-[#E0D1C0] pt-8 mt-16">
          <p className="text-xs text-[#8A7565] italic tracking-wide">Kade Dunstone · Performance coach. Father. Builder.</p>
        </div>
      </div>
    </div>
  )
}

function romanize(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V'][n - 1] ?? String(n)
}
