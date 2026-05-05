'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, EyeOff, Eye, ExternalLink, Loader2, Download, Mail,
  Pencil, Check, X, Save, MessageSquare, Info,
} from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type SectionField =
  | 'cr_where_you_are'
  | 'cr_what_your_body_is_telling_us'
  | 'cr_what_were_focusing_on_first'
  | 'cr_what_were_not_doing_yet'
  | 'cr_coach_note'

interface Reading {
  id: string
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  cr_coach_guidance: string | null
  client_reading_generated_at: string | null
  client_reading_published_at: string | null
  client_reading_email_sent_at: string | null
}

const SECTION_LABELS: { field: SectionField; label: string }[] = [
  { field: 'cr_where_you_are',                label: 'Where you are right now' },
  { field: 'cr_what_your_body_is_telling_us', label: 'What your body is telling us' },
  { field: 'cr_what_were_focusing_on_first',  label: 'What we are focusing on first' },
  { field: 'cr_what_were_not_doing_yet',      label: 'What we are not doing yet' },
  { field: 'cr_coach_note',                   label: 'A note from your coach' },
]

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
  const [emailNotice, setEmailNotice] = useState<string | null>(null)

  const generated = !!cffs.client_reading_generated_at
  const published = !!cffs.client_reading_published_at
  const emailSent = !!cffs.client_reading_email_sent_at

  const generate = async () => {
    if (generating) return
    if (generated) {
      const guidanceNote = cffs.cr_coach_guidance && cffs.cr_coach_guidance.trim()
        ? '\n\nYour Coach Guidance will be applied to the new draft.'
        : ''
      const baseMsg = emailSent
        ? 'Replace the live reading with a fresh draft? Your client will not be re-emailed.'
        : 'Replace the current draft? This will publish the new version to the portal and send the client an email.'
      if (!confirm(baseMsg + '\n\nThis will overwrite any inline edits you have made.' + guidanceNote)) return
    }
    setError(null)
    setEmailNotice(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffs.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      if (data.emailSent) setEmailNotice('Notification email sent to client.')
      if (data.emailError) setEmailNotice(`Reading published, but email failed to send: ${data.emailError}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate')
    } finally {
      setGenerating(false)
    }
  }

  const togglePublish = async () => {
    if (publishing) return
    const action = published ? 'unpublish' : 'publish'
    if (action === 'unpublish' && !confirm('Take this reading down from the client portal? You can republish at any time.')) return
    setError(null)
    setPublishing(true)
    try {
      const res = await fetch('/api/publish-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffs.id, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
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
              {published ? 'Live in portal' : 'Unpublished'}
            </span>
          )}
          {emailSent && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-[#1c1917] bg-[#0c0a09] text-[#a8a29e] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
              title={`Notification sent ${new Date(cffs.client_reading_email_sent_at!).toLocaleString('en-AU')}`}
            >
              <Mail size={10} /> Notified
            </span>
          )}
          <button
            onClick={generate}
            disabled={generating || isPending}
            className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              generated
                ? 'border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white'
                : 'bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-[#14b8a6]'
            }`}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating...' : generated ? 'Regenerate' : 'Generate & Publish'}
          </button>
          {generated && (
            <button
              onClick={togglePublish}
              disabled={publishing || isPending}
              className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : (published ? <EyeOff size={13} /> : <Eye size={13} />)}
              {publishing ? 'Updating...' : (published ? 'Unpublish' : 'Republish')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#1a1108] border border-[#3a2410] rounded-lg px-3 py-2 text-[12px] text-[#fbbf24] mb-3">
          {error}
        </div>
      )}
      {emailNotice && (
        <div className="bg-[rgba(20,184,166,0.08)] border border-[#0d2d29] rounded-lg px-3 py-2 text-[12px] text-[#14b8a6] mb-3">
          {emailNotice}
        </div>
      )}

      {generated && (
        <CoachGuidance cffsId={cffs.id} initial={cffs.cr_coach_guidance} />
      )}

      {!generated ? (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-8 text-center">
          <p className="text-[#a8a29e] text-[14px] mb-2">No client-facing reading yet</p>
          <p className="text-[#57534e] text-[12px]">
            Click Generate &amp; Publish. The reading goes live in the client portal and an email is sent to let them know it is ready.
          </p>
        </div>
      ) : (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1917] flex-wrap gap-2">
            <p
              className="text-[11px] text-[#57534e]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Last updated {new Date(cffs.client_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            {SECTION_LABELS.map(({ field, label }, i) => (
              <EditableSection
                key={field}
                cffsId={cffs.id}
                field={field}
                label={label}
                index={i}
                value={cffs[field]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ===========================================================
 * Coach Guidance editor - persists across regenerations,
 * passed to the AI on every Generate or Regenerate call.
 * =========================================================== */
function CoachGuidance({ cffsId, initial }: { cffsId: string; initial: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initial ?? '')
  const [savedValue, setSavedValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(!!initial)

  const dirty = value !== savedValue

  const save = async () => {
    if (saving || !dirty) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/update-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cffs_id: cffsId,
          field: 'cr_coach_guidance',
          value: value.trim() ? value : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSavedValue(value)
      setSavedAt(Date.now())
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#1c1917]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#14b8a6]" />
          <p
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Coach Guidance
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#14b8a6] px-1.5 py-0.5 rounded-full border border-[#0d2d29] bg-[rgba(20,184,166,0.10)]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#57534e]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#1c1917]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#57534e] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#57534e] leading-relaxed">
              Standing notes for the AI. Applied on every Generate and Regenerate. Use this for context the intake did not capture, or to steer how a section is framed. Persists across regenerations.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Sam mentioned in our intake call that she is sensitive about historic restrictive eating. Frame nutrition section as supportive, never targeted."
            rows={4}
            className="w-full bg-[#0c0a09] border border-[#1c1917] rounded-lg px-3 py-2.5 text-[13px] text-[#e7e5e4] placeholder:text-[#3c3835] focus:outline-none focus:border-[#292524] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#fbbf24]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#57534e]">
              {savedAt ? 'Saved.' : (savedValue ? 'Last applied to next regeneration.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-[#14b8a6]'
                  : 'border border-[#1c1917] bg-[#0c0a09] text-[#a8a29e]'
              }`}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving...' : 'Save guidance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===========================================================
 * Editable section - click pencil to edit any section text in
 * place. Saves the field directly to the cffs row.
 * =========================================================== */
function EditableSection({
  cffsId,
  field,
  label,
  index,
  value,
}: {
  cffsId: string
  field: SectionField
  label: string
  index: number
  value: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value ?? '')
      requestAnimationFrame(() => ref.current?.focus())
    }
  }, [editing, value])

  const save = async () => {
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/update-client-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffsId, field, value: draft }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setEditing(false)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft(value ?? '')
    setEditing(false)
    setError(null)
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-[11px] font-black text-[#14b8a6] shrink-0"
            style={{ fontFamily: MONO_FONT }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <p
            className="text-[10px] font-bold text-[#a8a29e] uppercase truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            {label}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-[10px] text-[#57534e] hover:text-[#14b8a6] transition-colors"
            aria-label="Edit section"
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Math.max(4, draft.split('\n').length + 1)}
            className="w-full bg-[#0c0a09] border border-[#1c1917] rounded-lg px-3 py-2.5 text-[14px] text-[#e7e5e4] focus:outline-none focus:border-[#292524] leading-relaxed resize-y"
          />
          {error && <p className="mt-2 text-[11px] text-[#fbbf24]">{error}</p>}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#1c1917] text-[#a8a29e] hover:text-white hover:border-[#292524] transition-colors disabled:opacity-50"
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || isPending || draft === (value ?? '')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-[#14b8a6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <p className="text-[14px] text-[#e7e5e4] leading-relaxed whitespace-pre-line">
          {value || '(empty)'}
        </p>
      )}
    </div>
  )
}
