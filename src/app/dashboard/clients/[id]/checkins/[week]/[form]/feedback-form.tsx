'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ExistingFeedback {
  id: string
  interpretation: string
  reframe: string | null
  next_focus: string
  email_sent_at: string | null
  updated_at: string
}

/**
 * Two modes:
 *   - "view"  — feedback exists, render it as a Past response card (same shape
 *               the client sees) with an Edit button to revise.
 *   - "edit"  — show the editable form (3 textareas + Generate + Save buttons).
 *
 * Default to "view" when feedback already exists on page load, "edit" when not.
 * After a successful save, switch back to "view" so the page reflects the
 * stored state instead of staying in active-editing mode.
 */
export default function CheckinFeedbackForm({
  checkinId,
  existing: existingFromServer,
  clientFirstName,
}: {
  checkinId: string
  existing: ExistingFeedback | null
  clientFirstName: string
}) {
  const router = useRouter()
  // Local copy of the saved feedback so we can flip back to view mode without
  // a router round-trip on save. Server stays the source of truth on reload.
  const [existing, setExisting] = useState<ExistingFeedback | null>(existingFromServer)
  const [mode, setMode] = useState<'view' | 'edit'>(existingFromServer ? 'view' : 'edit')

  const [interpretation, setInterpretation] = useState(existingFromServer?.interpretation ?? '')
  const [reframe, setReframe] = useState(existingFromServer?.reframe ?? '')
  const [nextFocus, setNextFocus] = useState(existingFromServer?.next_focus ?? '')
  const [pending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generateDraft() {
    setError(null)
    setStatus(null)
    const hasContent = interpretation.trim() || reframe.trim() || nextFocus.trim()
    if (hasContent) {
      const ok = confirm('This will overwrite your current draft with an AI-generated one. Continue?')
      if (!ok) return
    }
    setGenerating(true)
    try {
      const res = await fetch(`/api/weekly-checkins/${checkinId}/feedback/generate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed')
        return
      }
      const draft = json.draft ?? {}
      setInterpretation(draft.interpretation ?? '')
      setReframe(draft.reframe ?? '')
      setNextFocus(draft.next_focus ?? '')
      setStatus('Draft generated. Review, edit if needed, then click Save and email to approve.')
    } catch (err) {
      setError((err as Error).message ?? 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function submit(sendEmail: boolean) {
    setError(null)
    setStatus(null)
    if (!interpretation.trim()) { setError('Interpretation is required.'); return }
    if (!nextFocus.trim()) { setError('Next focus is required.'); return }

    startTransition(async () => {
      const res = await fetch(`/api/weekly-checkins/${checkinId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interpretation: interpretation.trim(),
          reframe: reframe.trim() || null,
          next_focus: nextFocus.trim(),
          send_email: sendEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save')
        return
      }
      // Update local copy with what we just saved so the view-mode card
      // shows the latest values immediately, no refresh flicker.
      const savedAt = new Date().toISOString()
      const newExisting: ExistingFeedback = {
        id: json.feedback?.id ?? existing?.id ?? 'unknown',
        interpretation: interpretation.trim(),
        reframe: reframe.trim() || null,
        next_focus: nextFocus.trim(),
        email_sent_at: sendEmail ? (json.feedback?.email_sent_at ?? savedAt) : existing?.email_sent_at ?? null,
        updated_at: savedAt,
      }
      setExisting(newExisting)
      setStatus(
        sendEmail
          ? `Saved and emailed to ${clientFirstName}.`
          : 'Saved as draft. Client will not receive this until you send it.'
      )
      setMode('view')
      router.refresh()
    })
  }

  // ── VIEW MODE ───────────────────────────────────────────────────────────
  if (mode === 'view' && existing) {
    const sent = !!existing.email_sent_at
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Coach response</p>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                sent
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}
            >
              {sent ? `Emailed ${formatShort(existing.email_sent_at!)}` : 'Draft (not sent)'}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-500">
              Last saved {formatShort(existing.updated_at)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setMode('edit'); setStatus(null); setError(null) }}
            className="text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors"
          >
            Edit response →
          </button>
        </div>
        <div className="px-5 py-5 space-y-5">
          <SavedSection title="Interpretation" body={existing.interpretation} />
          {existing.reframe && <SavedSection title="Reframe" body={existing.reframe} />}
          <SavedSection title="This week, hold this" body={existing.next_focus} accent />
        </div>
        {status && <p className="px-5 pb-4 text-xs text-teal-400">{status}</p>}
      </div>
    )
  }

  // ── EDIT MODE ───────────────────────────────────────────────────────────
  const previouslyEmailed = !!existing?.email_sent_at

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-400">
          {existing ? 'Edit coach response' : 'Coach response'}
        </p>
        <div className="flex items-center gap-3">
          {previouslyEmailed && (
            <p className="text-[10px] uppercase tracking-widest text-stone-500">
              Emailed {formatShort(existing!.email_sent_at!)}
            </p>
          )}
          {existing && (
            <button
              type="button"
              onClick={() => { setMode('view'); setStatus(null); setError(null) }}
              className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed mb-4">
        Three fields go to {clientFirstName} as a dark-template email and appear under this check-in in their portal. Reframe is optional, use it when {clientFirstName} is misreading their own signal.
      </p>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-[#0c0a09] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Draft with AI</p>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">Pulls this check-in, the synthesis, prior check-ins, and active program. You review and approve before anything sends.</p>
        </div>
        <button
          type="button"
          onClick={generateDraft}
          disabled={generating || pending}
          className="shrink-0 px-3 py-2 bg-teal-500/10 border border-teal-500/40 hover:bg-teal-500/20 text-teal-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate response'}
        </button>
      </div>

      <div className="space-y-5">
        <Field
          label="Interpretation"
          hint="What you are seeing in this check-in. The read, not the directive."
          value={interpretation}
          onChange={setInterpretation}
          required
          rows={6}
          placeholder="e.g. Recovery has stepped down two notches in a week and capacity is starting to compress. Sleep and appetite are holding, so the foundations are intact, but the load source looks upstream of training..."
        />
        <Field
          label="Reframe (optional)"
          hint="Use when the client is misreading their own pattern. Leave blank if not needed."
          value={reframe}
          onChange={setReframe}
          rows={4}
          placeholder="e.g. The clothes feeling tighter is much more likely abdominal bloating than weight gain..."
        />
        <Field
          label="This week, hold this"
          hint="One thing for the client to anchor on this week."
          value={nextFocus}
          onChange={setNextFocus}
          required
          rows={3}
          placeholder="e.g. Keep training as your stress release, not as an extra demand. If a session feels like adding load, swap it for a 20-minute walk and a sleep-priority night."
        />
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400">{error}</p>
      )}
      {status && (
        <p className="mt-4 text-xs text-teal-400">{status}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {pending ? 'Working…' : previouslyEmailed ? 'Save and re-send email' : 'Save and email client'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="px-4 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          Save without sending
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows,
  required,
  placeholder,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  rows: number
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{label}</label>
      <p className="text-xs text-stone-500 mb-2 leading-relaxed">{hint}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-[#0c0a09] border border-stone-800 rounded-lg p-3 text-sm text-stone-100 placeholder:text-stone-700 focus:outline-none focus:border-teal-500/60 resize-y"
      />
    </div>
  )
}

function SavedSection({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${accent ? 'text-teal-400' : 'text-stone-500'}`}>{title}</p>
      <div className="text-sm text-stone-200 leading-relaxed space-y-3 whitespace-pre-wrap">{body}</div>
    </div>
  )
}

function formatShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
