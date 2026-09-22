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
        <div className="bg-[#14171D] border border-[#1A1E26] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#6FA98B] mb-1">{added} client{added === 1 ? '' : 's'} added{skipped > 0 ? `, ${skipped} already on your list` : ''}</p>
          <p className="text-[13.5px] text-[#C2C6CC]">Each one now has an intake waiting. {sendInvites ? 'The invitations have gone out.' : 'Nothing has been emailed yet: open a client and send their intake when you are ready.'}</p>
        </div>
        <div className="space-y-1.5">
          {done.map((r, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 text-[13.5px] border-b border-[#1A1E26] pb-1.5">
              <span className="font-medium text-[#FAFAF8]">{r.name}<span className="font-normal text-[#676D76]"> · {r.email ?? 'no email'}</span></span>
              <span className={r.outcome.startsWith('added') ? 'text-[#6FA98B]' : 'text-[#E0A254]'}>{r.outcome}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard/clients" className="inline-block text-[13.5px] text-[#FAFAF8] font-medium">Back to clients</Link>
      </div>
    )
  }

  const box = 'w-full px-3 py-2.5 rounded-lg border border-[#2A2F39] text-sm font-mono focus:outline-none focus:border-[#FAFAF8]'

  return (
    <div className="space-y-5">
      <div className="bg-[#14171D] border border-[#2A2F39] rounded-xl p-5 space-y-4">
        <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">
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
        <label className="flex items-start gap-2.5 text-[13.5px] text-[#C2C6CC]">
          <input type="checkbox" checked={sendInvites} onChange={e => setSendInvites(e.target.checked)} className="mt-0.5" />
          <span>Email each of them their intake now. Leave this off to add them quietly and invite them yourself later.</span>
        </label>
        {error && <p className="text-[13.5px] text-[#D4817E]">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={() => run(true)} disabled={busy || !text.trim()} className="px-4 py-2.5 rounded-lg border border-[#2A2F39] text-sm font-semibold disabled:opacity-60">
            {busy ? 'Reading…' : 'Check the list'}
          </button>
          {preview && (
            <button onClick={() => run(false)} disabled={busy} className="px-4 py-2.5 rounded-lg bg-[#FAFAF8] text-[#0B0D10] text-sm font-semibold disabled:opacity-60">
              {busy ? 'Adding…' : `Add ${preview.filter(r => r.outcome === 'would be added').length} client${preview.filter(r => r.outcome === 'would be added').length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div className="bg-[#14171D] border border-[#2A2F39] rounded-xl p-5">
          <p className="text-[12.5px] font-semibold text-[#8A9099] mb-3">Nothing has been created yet. This is what would happen.</p>
          <div className="space-y-1.5">
            {preview.map((r, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 text-[13.5px] border-b border-[#1A1E26] pb-1.5">
                <span className="font-medium text-[#FAFAF8]">{r.name}<span className="font-normal text-[#676D76]"> · {r.email ?? 'no email'}</span></span>
                <span className={r.outcome === 'would be added' ? 'text-[#6FA98B]' : 'text-[#E0A254]'}>{r.outcome}</span>
              </div>
            ))}
          </div>
          {unparsed.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#1A1E26]">
              <p className="text-[12.5px] font-semibold text-[#E0A254] mb-1.5">These lines were not used</p>
              {unparsed.map((u, i) => <p key={i} className="text-[12.5px] text-[#8A9099]">{u}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
