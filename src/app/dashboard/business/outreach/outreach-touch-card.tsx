'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, X, Eye, Save, Loader2 } from 'lucide-react'

interface Props {
  id: string
  email: string
  subject: string
  bodyText: string
  aiModel: string
  edited: boolean
}

export default function OutreachTouchCard({ id, email, subject: initialSubject, bodyText: initialBody, aiModel, edited }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [busy, setBusy] = useState<null | 'send' | 'skip' | 'save'>(null)
  const [error, setError] = useState('')

  const dirty = subject !== initialSubject || body !== initialBody

  async function save(): Promise<boolean> {
    setBusy('save'); setError('')
    try {
      const res = await fetch(`/api/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body_text: body }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Save failed'); return false }
      router.refresh()
      return true
    } catch { setError('Save failed'); return false }
    finally { setBusy(null) }
  }

  async function send() {
    if (dirty) { const ok = await save(); if (!ok) return }
    setBusy('send'); setError('')
    try {
      const res = await fetch(`/api/outreach/${id}/send`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Send failed'); setBusy(null); return }
      router.refresh()
    } catch { setError('Send failed'); setBusy(null) }
  }

  async function skip() {
    setBusy('skip'); setError('')
    try {
      const res = await fetch(`/api/outreach/${id}/skip`, { method: 'POST' })
      if (!res.ok) { setError('Skip failed'); setBusy(null); return }
      router.refresh()
    } catch { setError('Skip failed'); setBusy(null) }
  }

  return (
    <div className="p-5">
      <label className="block text-[11px] font-semibold text-[#666D7A] mb-1">Subject</label>
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        className="w-full text-sm font-medium text-[#141821] border border-[#E8EAEE] rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />

      <label className="block text-[11px] font-semibold text-[#666D7A] mb-1">
        Body <span className="normal-case font-normal text-[#98A0AD]">— blank line between paragraphs. Greeting, button and signature are added automatically.</span>
      </label>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={Math.max(6, body.split('\n').length + 1)}
        className="w-full text-sm text-[#141821] leading-relaxed border border-[#E8EAEE] rounded-lg px-3 py-2 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />

      <div className="flex items-center justify-between mt-2 mb-4">
        <p className="text-[11px] text-[#98A0AD]">
          To {email || 'lead'} · {aiModel === 'fallback-template' ? 'template fallback' : 'AI draft'}{edited ? ' · edited' : ''}
        </p>
        <a
          href={`/api/outreach/${id}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#666D7A] hover:text-blue-600"
          onClick={async e => { if (dirty) { e.preventDefault(); const ok = await save(); if (ok) window.open(`/api/outreach/${id}/preview`, '_blank') } }}
        >
          <Eye className="w-3.5 h-3.5" /> Preview email
        </a>
      </div>

      {error && <p className="text-[12.5px] text-red-600 mb-3">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Approve &amp; send
        </button>
        {dirty && (
          <button
            onClick={save}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 border border-[#E8EAEE] text-[#141821] hover:bg-[#FBFCFD] text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save edits
          </button>
        )}
        <button
          onClick={skip}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 text-[#666D7A] hover:text-red-600 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-50 ml-auto"
        >
          {busy === 'skip' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Skip
        </button>
      </div>
    </div>
  )
}
