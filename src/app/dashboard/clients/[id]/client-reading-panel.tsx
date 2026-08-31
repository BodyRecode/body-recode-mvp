'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ClientViewModal from '@/components/dashboard/client-view-modal'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
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
  // Blocking lint findings from a refused publish, shown in full so the coach
  // can see the offending sentence rather than just being told no.
  const [lintFindings, setLintFindings] = useState<{ severity: string; message: string; excerpt?: string }[]>([])
  const [emailNotice, setEmailNotice] = useState<string | null>(null)
  const [notifying, setNotifying] = useState(false)

  const generated = !!cffs.client_reading_generated_at
  const published = !!cffs.client_reading_published_at
  const emailSent = !!cffs.client_reading_email_sent_at

  async function notifyClient() {
    if (notifying) return
    setError(null)
    setEmailNotice(null)
    setNotifying(true)
    try {
      const res = await fetch('/api/notify-client-foundational-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cffs_id: cffs.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setEmailNotice(emailSent ? 'Client re-notified — their reading is live.' : 'Client notified — their reading is live.')
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not notify the client')
    } finally {
      setNotifying(false)
    }
  }

  const generate = async () => {
    if (generating) return
    if (generated) {
      const guidanceNote = cffs.cr_coach_guidance && cffs.cr_coach_guidance.trim()
        ? '\n\nYour Coach Guidance will be applied to the new draft.'
        : ''
      const baseMsg = emailSent
        ? 'Replace the live reading with a fresh draft? Your client will not be re-emailed.'
        : 'Replace the current draft with a fresh one? Nothing is published or emailed; you still publish separately.'
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
      if (!res.ok) {
        // 422 means the pre-publish lint refused. Show the findings, not just a message.
        setLintFindings(Array.isArray(data.findings) ? data.findings : [])
        throw new Error(data.error || `Server returned ${res.status}`)
      }
      setLintFindings([])
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mb-6">
      <GenerationProgressOverlay
        active={generating}
        title="Foundational Reading"
        stages={[
          { start: 0,  label: 'Reading CFFS, intake, and coach guidance' },
          { start: 4,  label: 'Drafting the 5 client-facing reading sections' },
          { start: 18, label: 'Scanning for banned client-facing terms' },
          { start: 22, label: 'Auto-retrying if any banned terms leaked' },
          { start: 35, label: 'Saving the new draft and refreshing the panel' },
          { start: 55, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Foundational Reading generation uses Claude Haiku 4.5 with automatic banned-term retry. Typical: 20 to 40 seconds. The page is not frozen, please don't refresh."
      />
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-medium text-[#141821]"
          >
            Foundational Reading{' '}
            <span className="text-[#43474F] font-normal">- Client Facing</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {generated && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.06em',
                color: published ? '#1B6DFC' : '#666D7A',
                background: published ? 'rgba(27,109,252,0.10)' : '#FFFFFF',
                borderColor: published ? '#B5CFFC' : '#E8EAEE',
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: published ? '#1B6DFC' : '#98A0AD' }}
              />
              {published ? 'Live in portal' : generated ? 'Unpublished' : 'Not generated yet'}
            </span>
          )}
          {emailSent && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-[#E8EAEE] bg-[#FFFFFF] text-[#666D7A]"
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
                ? 'border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC]'
                : 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1560E0] border border-[#1B6DFC]'
            }`}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {/* Generation does NOT publish - the route nulls the published
                timestamp on purpose. */}
            {generating ? 'Generating...' : generated ? 'Regenerate' : 'Generate draft'}
          </button>
          {generated && (
            <button
              onClick={togglePublish}
              disabled={publishing || isPending}
              className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : (published ? <EyeOff size={13} /> : <Eye size={13} />)}
              {/* "Publish", not "Republish": this said Republish even on a reading
                  that had never been published, so a coach looking for a publish
                  button concluded there wasn't one. Same fix as the program
                  reading panel (cd88d369). */}
              {publishing ? 'Updating...' : (published ? 'Unpublish' : 'Publish')}
            </button>
          )}
          {published && (
            <button
              onClick={notifyClient}
              disabled={notifying || isPending}
              title={emailSent ? 'Send the client another email that their reading is live' : 'Email the client that their reading is live in the portal'}
              className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                emailSent
                  ? 'border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC]'
                  : 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1560E0] border border-[#1B6DFC]'
              }`}
            >
              {notifying ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              {notifying ? 'Notifying...' : emailSent ? 'Re-notify client' : 'Notify client'}
            </button>
          )}
        </div>
      </div>

      {lintFindings.length > 0 && (

        <div className="mb-3 rounded-xl border border-[#EFAFAF] bg-[#FDEDED] p-4">

          <p className="text-[12.5px] font-medium text-[#8A1919]">Not published</p>

          <p className="text-[12.5px] text-[#A11D1D] mt-1">These have to be fixed before the client can see this. Edit the section or regenerate.</p>

          <ul className="mt-2 space-y-2">

            {lintFindings.map((f, i) => (

              <li key={i} className="text-[12.5px] text-[#A11D1D]">

                <span className="font-semibold">{f.message}</span>

                {f.excerpt && <span className="block mt-0.5 italic text-[#C82626]">&ldquo;{f.excerpt}&rdquo;</span>}

              </li>

            ))}

          </ul>

        </div>

      )}


      {error && (
        <div className="bg-[#FDF6E9] border border-[#F1DEB8] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14] mb-3">
          {error}
        </div>
      )}
      {emailNotice && (
        <div className="bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-lg px-3 py-2 text-[12px] text-[#1B6DFC] mb-3">
          {emailNotice}
        </div>
      )}

      {generated && (
        <CoachGuidance cffsId={cffs.id} initial={cffs.cr_coach_guidance} />
      )}

      {!generated ? (
        <div className="br-card p-8 text-center">
          <p className="text-[#666D7A] text-[14px] mb-2">No client-facing reading yet</p>
          <p className="text-[#98A0AD] text-[12px]">
            Click Generate &amp; Publish. The reading goes live in the client portal. Then use Notify client to email them it is ready.
          </p>
        </div>
      ) : (
        <div className="br-card overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8EAEE] flex-wrap gap-2">
            <p
              className="text-[11px] text-[#98A0AD]"
            >
              Last updated {new Date(cffs.client_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/clients/${clientId}/foundational-reading-preview`}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC] transition-colors"
              >
                Preview
              </Link>
              <Link
                href={`/api/dashboard/clients/${clientId}/foundational-reading/pdf`}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC] transition-colors"
              >
                <Download size={11} /> PDF
              </Link>
              {published && clientToken && (
                <ClientViewModal
                  portalUrl={`/portal/${clientToken}/foundational-reading`}
                  title="Foundational Reading — Client View"
                  triggerLabel="Client view"
                />
              )}
            </div>
          </div>
          <div className="divide-y divide-[#EFF1F4]">
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
    <div className="br-card overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#EFF1F4]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#1B6DFC]" />
          <p
            className="text-[11px] font-medium text-[#141821]"
          >
            Coach Guidance
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#1B6DFC] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)]"
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#98A0AD]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#E8EAEE]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#98A0AD] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#98A0AD] leading-relaxed">
              Standing notes for the AI. Applied on every Generate and Regenerate. Use this for context the intake did not capture, or to steer how a section is framed. Persists across regenerations.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Sam mentioned in our intake call that she is sensitive about historic restrictive eating. Frame nutrition section as supportive, never targeted."
            rows={4}
            className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-[13px] text-[#141821] placeholder:text-[#43474F] focus:outline-none focus:border-[#CFD4DC] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#8A5A14]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#98A0AD]">
              {savedAt ? 'Saved.' : (savedValue ? 'Last applied to next regeneration.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1560E0] border border-[#1B6DFC]'
                  : 'border border-[#E8EAEE] bg-[#FFFFFF] text-[#666D7A]'
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
            className="text-[10px] font-medium text-[#666D7A] truncate"
          >
            {label}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-[10px] text-[#98A0AD] hover:text-[#1B6DFC] transition-colors"
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
            className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-[14px] text-[#141821] focus:outline-none focus:border-[#CFD4DC] leading-relaxed resize-y"
          />
          {error && <p className="mt-2 text-[11px] text-[#8A5A14]">{error}</p>}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E8EAEE] text-[#666D7A] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || isPending || draft === (value ?? '')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1560E0] border border-[#1B6DFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <p className="text-[14px] text-[#141821] leading-relaxed whitespace-pre-line">
          {value || '(empty)'}
        </p>
      )}
    </div>
  )
}
