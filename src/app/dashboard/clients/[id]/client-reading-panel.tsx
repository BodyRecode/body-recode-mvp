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
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Foundational Reading{' '}
            <span className="text-[#4A4A4A] font-normal">- Client Facing</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {generated && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.06em',
                color: published ? '#1B6DFC' : '#6B6B6B',
                background: published ? 'rgba(20,184,166,0.10)' : '#FFFFFF',
                borderColor: published ? '#B5CFFC' : '#E5E5E5',
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: published ? '#1B6DFC' : '#999999' }}
              />
              {published ? 'Live in portal' : 'Unpublished'}
            </span>
          )}
          {emailSent && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] uppercase"
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
                ? 'border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-[#1A1A1A]'
                : 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
            }`}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating...' : generated ? 'Regenerate' : 'Generate & Publish'}
          </button>
          {generated && (
            <button
              onClick={togglePublish}
              disabled={publishing || isPending}
              className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
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
        <div className="bg-[rgba(20,184,166,0.08)] border border-[#B5CFFC] rounded-lg px-3 py-2 text-[12px] text-[#1B6DFC] mb-3">
          {emailNotice}
        </div>
      )}

      {generated && (
        <CoachGuidance cffsId={cffs.id} initial={cffs.cr_coach_guidance} />
      )}

      {!generated ? (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-8 text-center">
          <p className="text-[#6B6B6B] text-[14px] mb-2">No client-facing reading yet</p>
          <p className="text-[#999999] text-[12px]">
            Click Generate &amp; Publish. The reading goes live in the client portal and an email is sent to let them know it is ready.
          </p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5] flex-wrap gap-2">
            <p
              className="text-[11px] text-[#999999]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Last updated {new Date(cffs.client_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/clients/${clientId}/foundational-reading-preview`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-[#1A1A1A] transition-colors"
              >
                <ExternalLink size={11} /> Preview
              </Link>
              <Link
                href={`/api/dashboard/clients/${clientId}/foundational-reading/pdf`}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-[#1A1A1A] transition-colors"
              >
                <Download size={11} /> PDF
              </Link>
              {published && clientToken && (
                <Link
                  href={`/portal/${clientToken}/foundational-reading`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#B5CFFC] bg-[rgba(20,184,166,0.10)] text-[#1B6DFC] hover:bg-[rgba(20,184,166,0.18)] transition-colors"
                >
                  <ExternalLink size={11} /> Client view
                </Link>
              )}
            </div>
          </div>
          <div className="divide-y divide-[#E5E5E5]">
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
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#E5E5E5]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#1B6DFC]" />
          <p
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Coach Guidance
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#1B6DFC] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(20,184,166,0.10)]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#999999]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#E5E5E5]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#999999] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#999999] leading-relaxed">
              Standing notes for the AI. Applied on every Generate and Regenerate. Use this for context the intake did not capture, or to steer how a section is framed. Persists across regenerations.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Sam mentioned in our intake call that she is sensitive about historic restrictive eating. Frame nutrition section as supportive, never targeted."
            rows={4}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-[13px] text-[#e7e5e4] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#fbbf24]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#999999]">
              {savedAt ? 'Saved.' : (savedValue ? 'Last applied to next regeneration.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
                  : 'border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B]'
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
            className="text-[11px] font-black text-[#1B6DFC] shrink-0"
            style={{ fontFamily: MONO_FONT }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <p
            className="text-[10px] font-bold text-[#6B6B6B] uppercase truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            {label}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-[10px] text-[#999999] hover:text-[#1B6DFC] transition-colors"
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
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-[14px] text-[#e7e5e4] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
          {error && <p className="mt-2 text-[11px] text-[#fbbf24]">{error}</p>}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#D4D4D4] transition-colors disabled:opacity-50"
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || isPending || draft === (value ?? '')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
