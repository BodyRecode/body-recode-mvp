import type { Metadata } from 'next'
import Link from 'next/link'
import { CHAPTERS } from '@/lib/kade-chapters'

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
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <div className="max-w-2xl mx-auto px-5 py-16">

        {/* Back link */}
        <Link href="/kade" className="text-xs text-stone-500 hover:text-stone-700 transition-colors mb-12 inline-block">← bodyrecode.au/kade</Link>

        {/* Header */}
        <div className="mb-16 mt-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase mb-4">Tracing Myself</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">A memoir of meaning, misfires, and the making of me.</h1>
          <p className="text-stone-600 leading-relaxed">Twenty chapters. Published as I write them.</p>
        </div>

        {/* Parts */}
        {PARTS.map(part => {
          const chapters = CHAPTERS.filter(c => c.part === part.number)
          return (
            <section key={part.number} className="mb-12">
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-5">Part {romanize(part.number)} - {part.label}</p>
              <div className="space-y-px">
                {chapters.map(c => {
                  const isPublished = !!c.content
                  return isPublished ? (
                    <Link
                      key={c.slug}
                      href={`/kade/chapters/${c.slug}`}
                      className="group flex items-baseline gap-4 py-3.5 px-4 -mx-4 rounded-lg hover:bg-stone-100/50 transition-colors"
                    >
                      <span className="text-xs font-mono text-stone-400 group-hover:text-stone-600 transition-colors w-8 shrink-0">{String(c.number).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-[#1A1A1A] group-hover:text-blue-500 transition-colors">{c.title}</p>
                        <p className="text-sm text-stone-500 mt-0.5">{c.summary}</p>
                      </div>
                      <span className="text-stone-400 group-hover:text-blue-500 transition-colors text-sm shrink-0">Read →</span>
                    </Link>
                  ) : (
                    <div
                      key={c.slug}
                      className="flex items-baseline gap-4 py-3.5 px-4 -mx-4 opacity-50"
                    >
                      <span className="text-xs font-mono text-stone-400 w-8 shrink-0">{String(c.number).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-stone-600">{c.title}</p>
                        <p className="text-sm text-stone-400 mt-0.5">{c.summary}</p>
                      </div>
                      <span className="text-xs text-stone-300 shrink-0">Coming</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <div className="border-t border-stone-100 pt-8 mt-16">
          <p className="text-xs text-stone-400">Kade Dunstone · Performance coach. Builder. Father.</p>
        </div>
      </div>
    </div>
  )
}

function romanize(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V'][n - 1] ?? String(n)
}
