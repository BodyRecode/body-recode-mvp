import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CHAPTERS, getChapter } from '@/lib/kade-chapters'
import { Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

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
    <div className={`${serif.className} min-h-screen bg-[#F3E9E1] text-[#2A1E16]`}>
      <div className="max-w-2xl mx-auto px-5 py-16">

        {/* Back link */}
        <Link href="/kade/chapters" className="text-xs italic text-[#8A7565] hover:text-[#B5552F] transition-colors mb-10 inline-block tracking-wide">← All chapters</Link>

        {/* Chapter header */}
        <div className="mb-12 mt-6">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#B5552F] uppercase mb-4">Chapter {chapter.number} · {chapter.partLabel}</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-3">{chapter.title}</h1>
          {chapter.publishedAt && (
            <p className="text-xs italic text-[#8A7565] tracking-wide">{new Date(chapter.publishedAt + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          )}
        </div>

        {/* Clay rule */}
        <div className="w-12 h-px bg-[#B5552F] mb-10" />

        {/* Content — generous reading typography on warm paper */}
        <article className="prose-content space-y-6 text-[#2A1E16] leading-[1.75] text-[18px]">
          {chapter.content.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>

        {/* Prev / Next */}
        <div className="flex items-center justify-between border-t border-[#E0D1C0] mt-16 pt-8 gap-4">
          {prev ? (
            <Link href={`/kade/chapters/${prev.slug}`} className="flex-1 group">
              <p className="text-[10px] uppercase tracking-widest text-[#8A7565] mb-1">Previous</p>
              <p className="text-sm font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">{prev.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link href={`/kade/chapters/${next.slug}`} className="flex-1 text-right group">
              <p className="text-[10px] uppercase tracking-widest text-[#8A7565] mb-1">Next</p>
              <p className="text-sm font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">{next.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0D1C0] pt-8 mt-12">
          <p className="text-xs text-[#8A7565] italic tracking-wide">Kade Dunstone · Performance coach. Father. Builder.</p>
        </div>
      </div>
    </div>
  )
}
