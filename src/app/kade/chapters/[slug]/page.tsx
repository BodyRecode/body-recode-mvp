import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CHAPTERS, getChapter } from '@/lib/kade-chapters'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return CHAPTERS.filter(c => c.content).map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const chapter = getChapter(slug)
  if (!chapter) return { title: 'Chapter not found' }
  return {
    title: `${chapter.title} - Tracing Myself - Kade Dunstone`,
    description: chapter.summary,
  }
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params
  const chapter = getChapter(slug)
  if (!chapter || !chapter.content) notFound()

  // Find prev/next in published chapters
  const published = CHAPTERS.filter(c => c.content)
  const idx = published.findIndex(c => c.slug === chapter.slug)
  const prev = idx > 0 ? published[idx - 1] : null
  const next = idx < published.length - 1 ? published[idx + 1] : null

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white">
      <div className="max-w-2xl mx-auto px-5 py-16">

        {/* Back link */}
        <Link href="/kade/chapters" className="text-xs text-stone-500 hover:text-stone-300 transition-colors mb-10 inline-block">← All chapters</Link>

        {/* Chapter header */}
        <div className="mb-12 mt-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase mb-4">Chapter {chapter.number} · {chapter.partLabel}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3">{chapter.title}</h1>
          {chapter.publishedAt && (
            <p className="text-xs text-stone-600">{new Date(chapter.publishedAt + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          )}
        </div>

        {/* Content */}
        <article className="prose-content space-y-5 text-stone-300 leading-relaxed text-[17px]">
          {chapter.content.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>

        {/* Prev / Next */}
        <div className="flex items-center justify-between border-t border-stone-900 mt-16 pt-8 gap-4">
          {prev ? (
            <Link href={`/kade/chapters/${prev.slug}`} className="flex-1 group">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Previous</p>
              <p className="text-sm font-semibold text-stone-300 group-hover:text-teal-400 transition-colors">{prev.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link href={`/kade/chapters/${next.slug}`} className="flex-1 text-right group">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Next</p>
              <p className="text-sm font-semibold text-stone-300 group-hover:text-teal-400 transition-colors">{next.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-900 pt-8 mt-12">
          <p className="text-xs text-stone-600">Kade Dunstone · Performance coach. Builder. Father.</p>
        </div>
      </div>
    </div>
  )
}
