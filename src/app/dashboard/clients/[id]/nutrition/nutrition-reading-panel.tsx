'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, EyeOff, Eye, ExternalLink, Loader2, Mail,
  Pencil, Check, X, Save, MessageSquare, Info,
} from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type SectionField =
  | 'nr_why_this_plan'
  | 'nr_what_this_nutrition_is_doing'
  | 'nr_how_well_know_its_working'
  | 'nr_what_were_not_doing_yet'
  | 'nr_coach_note'

interface Reading {
  id: string
  nr_why_this_plan: string | null
  nr_what_this_nutrition_is_doing: string | null
  nr_how_well_know_its_working: string | null
  nr_what_were_not_doing_yet: string | null
  nr_coach_note: string | null
  nr_coach_guidance: string | null
  nutrition_reading_generated_at: string | null
  nutrition_reading_published_at: string | null
  nutrition_reading_email_sent_at: string | null
}

const SECTION_LABELS: { field: SectionField; label: string }[] = [
  { field: 'nr_why_this_plan',                label: 'Why this plan' },
  { field: 'nr_what_this_nutrition_is_doing', label: 'What this nutrition is doing' },
  { field: 'nr_how_well_know_its_working',    label: 'How we will know it is working' },
  { field: 'nr_what_were_not_doing_yet',      label: 'What we are not doing yet' },
  { field: 'nr_coach_note',                   label: 'A note from your coach' },
]

export default function NutritionReadingPanel({
  plan,
  clientToken,
}: {
  plan: Reading
  clientToken: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotice, setEmailNotice] = useState<string | null>(null)

  const generated = !!plan.nutrition_reading_generated_at
  const published = !!plan.nutrition_reading_published_at
  const emailSent = !!plan.nutrition_reading_email_sent_at

  const generate = async () => {
    if (generating) return
    if (generated) {
      const guidanceNote = plan.nr_coach_guidance && plan.nr_coach_guidance.trim()
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
      const res = await fetch('/api/generate-nutrition-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
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
      const res = await fetch('/api/publish-nutrition-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, action }),
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
            Nutrition Reading{' '}
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
              title={`Notification sent ${new Date(plan.nutrition_reading_email_sent_at!).toLocaleString('en-AU')}`}
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
        <CoachGuidance planId={plan.id} initial={plan.nr_coach_guidance} />
      )}

      {!generated ? (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-8 text-center">
          <p className="text-[#a8a29e] text-[14px] mb-2">No Nutrition Reading yet</p>
          <p className="text-[#57534e] text-[12px]">
            Click Generate &amp; Publish. The reading appears at the top of the client&apos;s nutrition plan and an email is sent to let them know the new plan is ready.
          </p>
          <p className="text-[#3c3835] text-[11px] mt-3">
            Requires a published Foundational Reading. The Nutrition Reading builds from it.
          </p>
        </div>
      ) : (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1917] flex-wrap gap-2">
            <p
              className="text-[11px] text-[#57534e]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Last updated {new Date(plan.nutrition_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              {published && clientToken && (
                <Link
                  href={`/portal/${clientToken}/my-plan`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#0d2d29] bg-[rgba(20,184,166,0.10)] text-[#14b8a6] hover:bg-[rgba(20,184,166,0.18)] transition-colors"
                >
                  <ExternalLink size={11} /> Client view
                </Link>
              )}
              {published && clientToken && (
                <Link
                  href={`/portal/${clientToken}/my-plan/reading`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors"
                >
                  <ExternalLink size={11} /> Document
                </Link>
              )}
            </div>
          </div>
          <div className="divide-y divide-[#1c1917]">
            {SECTION_LABELS.map(({ field, label }, i) => (
              <EditableSection
                key={field}
                planId={plan.id}
                field={field}
                label={label}
                index={i}
                value={plan[field]}
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
function CoachGuidance({ planId, initial }: { planId: string; initial: string | null }) {
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
      const res = await fetch('/api/update-nutrition-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          field: 'nr_coach_guidance',
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
              Standing notes for the AI. Applied on every Generate and Regenerate of this plan&apos;s reading. Use this to steer framing for THIS plan. Each new nutrition plan starts fresh.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Client has a long history of restrictive dieting. Frame this plan strongly around fuel and stabilisation, never deficit. Avoid any language that hints at restriction."
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
 * place. Saves the field directly to the nutrition_plans row.
 * =========================================================== */
function EditableSection({
  planId,
  field,
  label,
  index,
  value,
}: {
  planId: string
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
      const res = await fetch('/api/update-nutrition-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, field, value: draft }),
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
