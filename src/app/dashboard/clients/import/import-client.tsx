'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Result { name: string; email: string | null; outcome: string; intakeUrl?: string }

export default function ImportClient() {
  const [text, setText] = useState('')
  const [sendInvites, setSendInvites] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Result[] | null>(null)
  const [done, setDone] = useState<Result[] | null>(null)
  const [unparsed, setUnparsed] = useState<string[]>([])

  async function run(dryRun: boolean) {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/clients/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sendInvites: dryRun ? false : sendInvites, dryRun }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string; results?: Result[]; unparsed?: string[] }
      if (!res.ok || !d.ok) { setError(d.error ?? 'Could not read that list.'); return }
      setUnparsed(d.unparsed ?? [])
      if (dryRun) { setPreview(d.results ?? []); setDone(null) }
      else { setDone(d.results ?? []); setPreview(null) }
    } catch {
      setError('Could not read that list.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const added = done.filter(r => r.outcome.startsWith('added')).length
    const skipped = done.filter(r => r.outcome.includes('already')).length
    return (
      <div className="space-y-4">
        <div className="bg-[#EEF7F0] border border-[#CFE6D6] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#2E6B3E] mb-1">{added} client{added === 1 ? '' : 's'} added{skipped > 0 ? `, ${skipped} already on your list` : ''}</p>
          <p className="text-[13px] text-[#43474F]">Each one now has an intake waiting. {sendInvites ? 'The invitations have gone out.' : 'Nothing has been emailed yet: open a client and send their intake when you are ready.'}</p>
        </div>
        <div className="space-y-1.5">
          {done.map((r, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 text-[13px] border-b border-[#F0F1F4] pb-1.5">
              <span className="font-medium text-[#141821]">{r.name}<span className="font-normal text-[#98A0AD]"> · {r.email ?? 'no email'}</span></span>
              <span className={r.outcome.startsWith('added') ? 'text-[#2E6B3E]' : 'text-[#8A6218]'}>{r.outcome}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard/clients" className="inline-block text-[13px] text-[#1B6DFC] font-medium">Back to clients</Link>
      </div>
    )
  }

  const box = 'w-full px-3 py-2.5 rounded-lg border border-[#E8EAEE] text-sm font-mono focus:outline-none focus:border-[#1B6DFC]'

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E8EAEE] rounded-xl p-5 space-y-4">
        <p className="text-[13px] text-[#43474F] leading-relaxed">
          One client per line: a name and an email, separated by a comma or a tab. A phone number is optional. Paste straight from a
          spreadsheet and a header row will be ignored. Anyone already on your list is skipped rather than duplicated, so running
          this twice is safe.
        </p>
        <textarea
          className={box}
          rows={10}
          value={text}
          onChange={e => { setText(e.target.value); setPreview(null) }}
          placeholder={'Sarah Johnson, sarah@example.com\nTom Blake, tom@example.com, +61 400 111 222'}
        />
        <label className="flex items-start gap-2.5 text-[13px] text-[#43474F]">
          <input type="checkbox" checked={sendInvites} onChange={e => setSendInvites(e.target.checked)} className="mt-0.5" />
          <span>Email each of them their intake now. Leave this off to add them quietly and invite them yourself later.</span>
        </label>
        {error && <p className="text-[13px] text-[#C0392B]">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={() => run(true)} disabled={busy || !text.trim()} className="px-4 py-2.5 rounded-lg border border-[#E8EAEE] text-sm font-semibold disabled:opacity-60">
            {busy ? 'Reading…' : 'Check the list'}
          </button>
          {preview && (
            <button onClick={() => run(false)} disabled={busy} className="px-4 py-2.5 rounded-lg bg-[#1B6DFC] text-white text-sm font-semibold disabled:opacity-60">
              {busy ? 'Adding…' : `Add ${preview.filter(r => r.outcome === 'would be added').length} client${preview.filter(r => r.outcome === 'would be added').length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div className="bg-white border border-[#E8EAEE] rounded-xl p-5">
          <p className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Nothing has been created yet. This is what would happen.</p>
          <div className="space-y-1.5">
            {preview.map((r, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 text-[13px] border-b border-[#F0F1F4] pb-1.5">
                <span className="font-medium text-[#141821]">{r.name}<span className="font-normal text-[#98A0AD]"> · {r.email ?? 'no email'}</span></span>
                <span className={r.outcome === 'would be added' ? 'text-[#2E6B3E]' : 'text-[#8A6218]'}>{r.outcome}</span>
              </div>
            ))}
          </div>
          {unparsed.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#F0F1F4]">
              <p className="text-[12.5px] font-semibold text-[#8A6218] mb-1.5">These lines were not used</p>
              {unparsed.map((u, i) => <p key={i} className="text-[12.5px] text-[#6B6B6B]">{u}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
