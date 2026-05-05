'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Send, EyeOff, ExternalLink, Loader2, Download } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

interface Reading {
  id: string
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  client_reading_generated_at: string | null
  client_reading_published_at: string | null
}

export default function ClientReadingPanel({
  cffs,
  clientId,
  clientToken,
}: {
  cffs: Reading
  clientId: string
  clientToken: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generated = !!cffs.client_reading_generated_at
  const published = !!cffs.client_reading_published_at

  const sections = [
    { label: 'Where you are right now', content: cffs.cr_where_you_are },
    { label: 'What your body is telling us', content: cffs.cr_what_your_body_is_telling_us },
    { label: 'What we are focusing on first', content: cffs.cr_what_were_focusing_on_first },
    { label: 'What we are not doing yet', content: cffs.cr_what_were_not_doing_yet },
    { label: 'A note from your coach', content: cffs.cr_coach_note },
  ]

  const generate = async () => {
    if (generating) return
    if (generated && !confirm('This will replace the current draft and unpublish it from the portal until you re-publish. Continue?')) return
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffs.id }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Server returned ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate')
    } finally {
      setGenerating(false)
    }
  }

  const togglePublish = async () => {
    if (publishing) return
    if (!published && !confirm('Publish this Foundational Reading to the client portal? They will be able to view and download it.')) return
    if (published && !confirm('Unpublish this reading? The client will no longer see it in their portal.')) return
    setError(null)
    setPublishing(true)
    try {
      const res = await fetch('/api/publish-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffs.id, action: published ? 'unpublish' : 'publish' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Server returned ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
          <h2
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Foundational Reading{' '}
            <span className="text-[#3c3835] font-normal">- Client Facing</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {generated && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.06em',
                color: published ? '#14b8a6' : '#a8a29e',
                background: published ? 'rgba(20,184,166,0.10)' : '#0c0a09',
                borderColor: published ? '#0d2d29' : '#1c1917',
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: published ? '#14b8a6' : '#57534e' }}
              />
              {published ? 'Live in portal' : 'Draft only'}
            </span>
          )}
          <button
            onClick={generate}
            disabled={generating || isPending}
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating...' : generated ? 'Regenerate' : 'Generate Reading'}
          </button>
          {generated && (
            <button
              onClick={togglePublish}
              disabled={publishing || isPending}
              className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                published
                  ? 'border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white'
                  : 'bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-[#14b8a6]'
              }`}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : (published ? <EyeOff size={13} /> : <Send size={13} />)}
              {publishing ? 'Updating...' : (published ? 'Unpublish' : 'Send to client')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#1a1108] border border-[#3a2410] rounded-lg px-3 py-2 text-[12px] text-[#fbbf24] mb-3">
          {error}
        </div>
      )}

      {!generated ? (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-8 text-center">
          <p className="text-[#a8a29e] text-[14px] mb-2">No client-facing reading yet</p>
          <p className="text-[#57534e] text-[12px]">
            Generate a draft, review it, then send it to the client portal when you are ready.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-3">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1917]">
              <p
                className="text-[11px] text-[#57534e]"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
              >
                Drafted {new Date(cffs.client_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                {cffs.client_reading_published_at && (
                  <>
                    {' · '}
                    Published {new Date(cffs.client_reading_published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/clients/${clientId}/foundational-reading-preview`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors"
                >
                  <ExternalLink size={11} /> Preview
                </Link>
                <Link
                  href={`/api/dashboard/clients/${clientId}/foundational-reading/pdf`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors"
                >
                  <Download size={11} /> PDF
                </Link>
                {published && clientToken && (
                  <Link
                    href={`/portal/${clientToken}/foundational-reading`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#0d2d29] bg-[rgba(20,184,166,0.10)] text-[#14b8a6] hover:bg-[rgba(20,184,166,0.18)] transition-colors"
                  >
                    <ExternalLink size={11} /> Client view
                  </Link>
                )}
              </div>
            </div>
            <div className="divide-y divide-[#1c1917]">
              {sections.map((s, i) => (
                <div key={s.label} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[11px] font-black text-[#14b8a6]"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="text-[10px] font-bold text-[#a8a29e] uppercase"
                      style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                    >
                      {s.label}
                    </p>
                  </div>
                  <p className="text-[14px] text-[#e7e5e4] leading-relaxed whitespace-pre-line">
                    {s.content || '(empty)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
