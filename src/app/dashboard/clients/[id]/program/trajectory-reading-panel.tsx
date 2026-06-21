'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ClientViewModal from '@/components/dashboard/client-view-modal'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import {
  Sparkles, EyeOff, Eye, Loader2, Mail,
  Pencil, Check, X, Save, MessageSquare, Info, CalendarClock,
} from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type SectionField =
  | 'tr_where_this_block_started'
  | 'tr_how_your_signal_moved'
  | 'tr_what_held_steady'
  | 'tr_what_this_sets_up_next'
  | 'tr_coach_note'

interface Reading {
  id: string
  tr_where_this_block_started: string | null
  tr_how_your_signal_moved: string | null
  tr_what_held_steady: string | null
  tr_what_this_sets_up_next: string | null
  tr_coach_note: string | null
  tr_coach_guidance: string | null
  trajectory_reading_generated_at: string | null
  trajectory_reading_published_at: string | null
  trajectory_reading_email_sent_at: string | null
}

export interface TrajectoryBlockStatus {
  isAtBlockEnd: boolean
  currentWeek: number | null
  weekDuration: number | null
  weeksRemaining: number | null
}

const SECTION_LABELS: { field: SectionField; label: string }[] = [
  { field: 'tr_where_this_block_started', label: 'Where this block started' },
  { field: 'tr_how_your_signal_moved',    label: 'How your signal moved' },
  { field: 'tr_what_held_steady',         label: 'What held steady' },
  { field: 'tr_what_this_sets_up_next',   label: 'What this sets up next' },
  { field: 'tr_coach_note',               label: 'A note from your coach' },
]

export default function TrajectoryReadingPanel({
  program,
  clientToken,
  blockStatus,
}: {
  program: Reading
  clientToken: string | null
  blockStatus: TrajectoryBlockStatus | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const generated = !!program.trajectory_reading_generated_at
  const published = !!program.trajectory_reading_published_at
  const emailSent = !!program.trajectory_reading_email_sent_at
  const atBlockEnd = blockStatus?.isAtBlockEnd ?? false

  const generate = async () => {
    if (generating) return
    if (!atBlockEnd && !generated) {
      const wk = blockStatus?.currentWeek
      const dur = blockStatus?.weekDuration
      const where = wk && dur ? ` (currently week ${wk} of ${dur})` : ''
      if (!confirm(`This block is not at its end yet${where}. The Trajectory Reading is designed to read the whole block once it has finished. Generate a draft anyway?`)) return
    }
    if (generated) {
      const guidanceNote = program.tr_coach_guidance && program.tr_coach_guidance.trim()
        ? '\n\nYour Coach Guidance will be applied to the new draft.'
        : ''
      if (!confirm('Replace the current draft with a fresh read of the block arc?\n\nThis overwrites any inline edits. If the reading is live, it stays live and the client is not re-emailed.' + guidanceNote)) return
    }
    setError(null)
    setNotice(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-trajectory-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      if (data.weeksRead) setNotice(`Draft generated from ${data.weeksRead} weekly synthesis${data.weeksRead === 1 ? '' : 'es'} (weeks ${data.blockStartWeek}-${data.blockEndWeek}). Review, then Publish to send it.`)
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
    if (action === 'publish' && !emailSent && !confirm('Publish this reading to the client portal and email the client that their block-end reading is ready?')) return
    if (action === 'unpublish' && !confirm('Take this reading down from the client portal? You can republish at any time.')) return
    setError(null)
    setNotice(null)
    setPublishing(true)
    try {
      const res = await fetch('/api/publish-trajectory-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      if (data.emailSent) setNotice('Published. Notification email sent to client.')
      if (data.emailError) setNotice(`Published, but email failed to send: ${data.emailError}`)
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
        title="Block-End Trajectory Reading"
        stages={[
          { start: 0,  label: 'Reading every weekly synthesis (CFWS) from this block' },
          { start: 6,  label: 'Reading active program, CFFS, and coach guidance' },
          { start: 12, label: 'Drafting the trajectory across the block (5 sections)' },
          { start: 35, label: 'Scanning for banned client-facing terms' },
          { start: 45, label: 'Saving the new draft and refreshing the panel' },
          { start: 75, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Trajectory Reading reads the whole block's signal arc, not a single moment. Uses Claude Sonnet 4.6. Typical: 50 to 70 seconds. The page is not frozen, please don't refresh."
      />
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Block-End Trajectory Reading{' '}
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
                background: published ? 'rgba(27,109,252,0.10)' : '#FFFFFF',
                borderColor: published ? '#B5CFFC' : '#E5E5E5',
              }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: published ? '#1B6DFC' : '#999999' }} />
              {published ? 'Live in portal' : 'Draft'}
            </span>
          )}
          {emailSent && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
              title={`Notification sent ${new Date(program.trajectory_reading_email_sent_at!).toLocaleString('en-AU')}`}
            >
              <Mail size={10} /> Notified
            </span>
          )}
          <button
            onClick={generate}
            disabled={generating || isPending}
            className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              generated
                ? 'border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC]'
                : 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
            }`}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Reading the arc...' : generated ? 'Regenerate' : 'Generate draft'}
          </button>
          {generated && (
            <button
              onClick={togglePublish}
              disabled={publishing || isPending}
              className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                published
                  ? 'border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC]'
                  : 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
              }`}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : (published ? <EyeOff size={13} /> : <Eye size={13} />)}
              {publishing ? 'Updating...' : (published ? 'Unpublish' : (emailSent ? 'Republish' : 'Publish & notify'))}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14] mb-3">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-lg px-3 py-2 text-[12px] text-[#1B6DFC] mb-3">
          {notice}
        </div>
      )}

      {generated && (
        <CoachGuidance programId={program.id} initial={program.tr_coach_guidance} />
      )}

      {!generated ? (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-8 text-center">
          {atBlockEnd ? (
            <>
              <p className="text-[#6B6B6B] text-[14px] mb-2">Block complete - trajectory reading available</p>
              <p className="text-[#999999] text-[12px]">
                Click Generate draft. It reads every weekly synthesis across this block into one arc. Review it, then Publish to surface it on the portal and email the client.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-[#999999] mb-2" style={{ fontFamily: MONO_FONT }}>
                <CalendarClock size={12} />
                {blockStatus?.currentWeek && blockStatus?.weekDuration
                  ? `Block in progress - week ${blockStatus.currentWeek} of ${blockStatus.weekDuration}`
                  : 'Block in progress'}
              </div>
              <p className="text-[#6B6B6B] text-[14px] mb-2">Trajectory reading is for block end</p>
              <p className="text-[#999999] text-[12px]">
                This reading is designed to read the whole block once it has finished{blockStatus?.weeksRemaining ? `, about ${blockStatus.weeksRemaining} week${blockStatus.weeksRemaining === 1 ? '' : 's'} from now` : ''}. You can still generate an early draft from the weeks completed so far.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5] flex-wrap gap-2">
            <p
              className="text-[11px] text-[#999999]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Last updated {new Date(program.trajectory_reading_generated_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              {published && clientToken && (
                <ClientViewModal
                  portalUrl={`/portal/${clientToken}/program/trajectory-reading`}
                  title="Block-End Reading — Document"
                  triggerLabel="Document"
                  triggerClassName="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#3A3A3A] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
                />
              )}
            </div>
          </div>
          <div className="divide-y divide-[#E5E5E5]">
            {SECTION_LABELS.map(({ field, label }, i) => (
              <EditableSection
                key={field}
                programId={program.id}
                field={field}
                label={label}
                index={i}
                value={program[field]}
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
function CoachGuidance({ programId, initial }: { programId: string; initial: string | null }) {
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
      const res = await fetch('/api/update-trajectory-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          field: 'tr_coach_guidance',
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
              className="text-[10px] text-[#1B6DFC] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)]"
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
              Standing notes for the AI. Applied on every Generate and Regenerate of this block&apos;s trajectory reading. Use it to steer how the arc is framed (e.g. account for a known life event mid-block). Each block starts fresh.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Weeks 3 and 4 were disrupted by travel, not a loss of capacity. Frame the dip as expected and the recovery as the real signal."
            rows={4}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#8A5A14]">{error}</div>
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
 * place. Saves the field directly to the programs row.
 * =========================================================== */
function EditableSection({
  programId,
  field,
  label,
  index,
  value,
}: {
  programId: string
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
      const res = await fetch('/api/update-trajectory-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, field, value: draft }),
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
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-[14px] text-[#1A1A1A] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
          {error && <p className="mt-2 text-[11px] text-[#8A5A14]">{error}</p>}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors disabled:opacity-50"
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
        <p className="text-[14px] text-[#1A1A1A] leading-relaxed whitespace-pre-line">
          {value || '(empty)'}
        </p>
      )}
    </div>
  )
}
