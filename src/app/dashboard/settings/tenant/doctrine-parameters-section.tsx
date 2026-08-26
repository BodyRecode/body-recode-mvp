'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PRESETS, getPreset } from '@/lib/doctrine-parameters-presets'
import type { PreviewOutput } from '@/lib/doctrine-parameters-preview'
import type { LivePreviewResult } from '@/lib/doctrine-parameters-live-preview'

type DoctrineParameters = {
  voiceTone?: string
  bannedPhrases?: string[]
  terminologySubstitutions?: Record<string, string>
  checkinCoachingGuidance?: string
  programGenerationGuidance?: string
  nutritionGenerationGuidance?: string
} | null

export function DoctrineParametersSection({
  initial,
}: {
  initial: DoctrineParameters
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [previewPending, startPreviewTransition] = useTransition()
  const [livePending, startLiveTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewOutput | null>(null)
  const [live, setLive] = useState<LivePreviewResult | null>(null)

  const [voiceTone, setVoiceTone] = useState(initial?.voiceTone ?? '')
  const [bannedPhrasesText, setBannedPhrasesText] = useState(
    (initial?.bannedPhrases ?? []).join('\n'),
  )
  const [terminologyText, setTerminologyText] = useState(
    Object.entries(initial?.terminologySubstitutions ?? {})
      .map(([from, to]) => `${from} => ${to}`)
      .join('\n'),
  )
  const [checkinGuidance, setCheckinGuidance] = useState(initial?.checkinCoachingGuidance ?? '')
  const [programGuidance, setProgramGuidance] = useState(initial?.programGenerationGuidance ?? '')
  const [nutritionGuidance, setNutritionGuidance] = useState(initial?.nutritionGenerationGuidance ?? '')

  function applyPreset(presetId: string) {
    if (!presetId) return
    const preset = getPreset(presetId)
    if (!preset) return
    const confirmed = window.confirm(
      `Load "${preset.label}"? This overwrites the current form values. You can still tune after loading, and nothing is saved until you click Save.`,
    )
    if (!confirmed) return
    setVoiceTone(preset.parameters.voiceTone)
    setBannedPhrasesText(preset.parameters.bannedPhrases.join('\n'))
    setTerminologyText(
      Object.entries(preset.parameters.terminologySubstitutions)
        .map(([from, to]) => `${from} => ${to}`)
        .join('\n'),
    )
    setCheckinGuidance(preset.parameters.checkinCoachingGuidance)
    setProgramGuidance(preset.parameters.programGenerationGuidance)
    setNutritionGuidance(preset.parameters.nutritionGenerationGuidance)
    setPreview(null)
    setError(null)
    setSuccess(null)
  }

  function currentPayload(): DoctrineParameters {
    return {
      voiceTone: voiceTone.trim() || undefined,
      bannedPhrases: parsePhrasesLines(bannedPhrasesText),
      terminologySubstitutions: parseTerminologyLines(terminologyText),
      checkinCoachingGuidance: checkinGuidance.trim() || undefined,
      programGenerationGuidance: programGuidance.trim() || undefined,
      nutritionGenerationGuidance: nutritionGuidance.trim() || undefined,
    }
  }

  function handlePreview() {
    setError(null)
    setSuccess(null)
    setPreview(null)
    startPreviewTransition(async () => {
      const r = await fetch('/api/tenant/doctrine-parameters/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctrineParameters: currentPayload() }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'preview failed' }))
        setError(body.error ?? 'preview failed')
        return
      }
      const body = await r.json() as { preview: PreviewOutput }
      setPreview(body.preview)
    })
  }

  function handleLivePreview() {
    setError(null)
    setSuccess(null)
    setLive(null)
    startLiveTransition(async () => {
      const r = await fetch('/api/tenant/doctrine-parameters/preview/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctrineParameters: currentPayload() }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'live preview failed' }))
        setError(body.error ?? 'live preview failed')
        return
      }
      const body = await r.json() as { result: LivePreviewResult }
      setLive(body.result)
    })
  }

  function parsePhrasesLines(text: string): string[] {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }

  function parseTerminologyLines(text: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parts = trimmed.split(/\s*=>\s*/)
      if (parts.length !== 2 || !parts[0] || !parts[1]) continue
      out[parts[0]] = parts[1]
    }
    return out
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload = currentPayload()

    startTransition(async () => {
      const r = await fetch('/api/tenant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'licence',
          patch: { doctrineParameters: payload },
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'save failed' }))
        setError(body.error ?? 'save failed')
        return
      }
      setSuccess('Saved. Cache invalidated. Generators will read the new values on next call.')
      router.refresh()
    })
  }

  return (
    <div className="mb-4 bg-white border border-[#E8EAEE] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Doctrine parameters (Mode A+)</h3>
      </div>
      <div className="p-5">
        <p className="text-[13px] text-[#666D7A] leading-relaxed mb-4">
          Middle ground between running BR&apos;s doctrine unchanged (Mode A) and injecting your own method (Mode B, reserved for later-stage). Tune tone, add banned phrases, substitute terminology, add coaching-style guidance. <strong>Hard Safety Floors cannot be tuned here</strong> — RRS clamps, Fat Map limits, injury contraindications, eligibility floors remain immutable per the Collective Partner Agreement.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[12px] text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-3 p-3 rounded-lg border border-green-200 bg-green-50 text-[12px] text-green-800">{success}</div>
        )}

        <div className="mb-5 p-4 rounded-lg border border-blue-100 bg-blue-50/40">
          <div className="text-[11px] font-medium text-[#666D7A] mb-1">Start from a preset</div>
          <p className="text-[11px] text-[#666D7A] leading-relaxed mb-2">Overwrites the current form values. Nothing is saved until you click Save; tune the loaded shape as you like.</p>
          <select
            defaultValue=""
            onChange={(e) => { applyPreset(e.target.value); e.target.value = '' }}
            className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={pending || previewPending}
          >
            <option value="" disabled>Choose a preset...</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label} - {p.description}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <Field
            label="Voice tone"
            hint='Appended to system prompts for client-facing content. Examples: "warm and encouraging", "gentle and grounding", "direct and clinical". Read by nutrition, program, and check-in generators.'
          >
            <input
              type="text"
              value={voiceTone}
              onChange={(e) => setVoiceTone(e.target.value)}
              placeholder="warm and grounded"
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Banned phrases"
            hint="Partner-specific banned phrases, one per line. Applied on top of the platform-wide banned-terms list. Content that leaks any of these will fail the audit and prompt regeneration."
          >
            <textarea
              value={bannedPhrasesText}
              onChange={(e) => setBannedPhrasesText(e.target.value)}
              rows={4}
              placeholder="downregulate\nsympathetic dominance"
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Terminology substitutions"
            hint='One substitution per line in the form "from => to". Case-insensitive. Applied post-generation as a rewrite. Example: "winding down => settling".'
          >
            <textarea
              value={terminologyText}
              onChange={(e) => setTerminologyText(e.target.value)}
              rows={4}
              placeholder="winding down => settling\ndownregulate => soften"
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Weekly check-in coaching guidance"
            hint="Partner-specific coaching philosophy appended to the weekly check-in feedback prompt. Shapes tone + focus of feedback."
          >
            <textarea
              value={checkinGuidance}
              onChange={(e) => setCheckinGuidance(e.target.value)}
              rows={3}
              placeholder="Emphasise breath awareness in every regulation cue. Never prescribe measurable metrics."
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Program generation guidance"
            hint="Appended to program generation prompt. Frequency preferences, session structure, favoured exercise families. NOT a safety override."
          >
            <textarea
              value={programGuidance}
              onChange={(e) => setProgramGuidance(e.target.value)}
              rows={3}
              placeholder="Prefer 4 sessions per week over 5. Always include one restorative session."
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Nutrition generation guidance"
            hint="Appended to nutrition plan generation prompt. Food preferences, cultural context, dietary philosophy. NOT a safety override."
          >
            <textarea
              value={nutritionGuidance}
              onChange={(e) => setNutritionGuidance(e.target.value)}
              rows={3}
              placeholder="Emphasise plant-forward proteins. Prefer whole-food-first substitutions."
              className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <div className="flex items-center justify-between pt-2 border-t border-[#F4F6F9] gap-3 flex-wrap">
            <p className="text-[11px] text-[#666D7A] italic flex-1 min-w-[220px]">
              Cache invalidates on save. Generators read new values on their next call.
            </p>
            <button
              type="button"
              onClick={handlePreview}
              disabled={pending || previewPending || livePending}
              className="px-4 py-2 rounded-md border border-[#E8EAEE] bg-white text-[#141821] text-[13px] font-semibold hover:bg-[#FBFCFD] disabled:opacity-40"
              title="Deterministic. Free. Fast. Renders the exact system-prompt block + shows terminology substitutions on a sample sentence."
            >
              {previewPending ? 'Previewing…' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={handleLivePreview}
              disabled={pending || previewPending || livePending}
              className="px-4 py-2 rounded-md border border-[#E8EAEE] bg-white text-[#141821] text-[13px] font-semibold hover:bg-[#FBFCFD] disabled:opacity-40"
              title="One real Anthropic call using your current tuning applied to a fixed stub check-in. Costs ~$0.001/click."
            >
              {livePending ? 'Generating…' : 'Generate a real sample'}
            </button>
            <button
              type="submit"
              disabled={pending || previewPending || livePending}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              {pending ? 'Saving…' : 'Save doctrine parameters'}
            </button>
          </div>
        </form>

        {preview && <PreviewPanel preview={preview} onDismiss={() => setPreview(null)} />}
        {live && <LivePreviewPanel live={live} onDismiss={() => setLive(null)} />}
      </div>
    </div>
  )
}

function LivePreviewPanel({ live, onDismiss }: { live: LivePreviewResult; onDismiss: () => void }) {
  const platformClean = live.meta.platformBannedHits.length === 0
  const partnerClean = live.meta.partnerBannedHits.length === 0
  return (
    <div className="mt-5 border border-emerald-200 rounded-xl bg-emerald-50/30 overflow-hidden">
      <div className="px-5 py-3 border-b border-emerald-200 bg-emerald-50 flex items-center justify-between">
        <h4 className="text-[12px] font-medium text-emerald-900">Live sample · one Anthropic call</h4>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
        >
          Dismiss
        </button>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid gap-2 md:grid-cols-4 text-[11px] text-[#666D7A]">
          <div>Model · <span className="font-mono">{live.meta.modelId.replace(/-\d{8}$/, '')}</span></div>
          <div>Latency · <span className="font-mono">{live.meta.latencyMs} ms</span></div>
          <div>Tokens in · <span className="font-mono">{live.meta.inputTokens ?? '?'}</span></div>
          <div>Tokens out · <span className="font-mono">{live.meta.outputTokens ?? '?'}</span></div>
        </div>

        <div className="p-4 rounded-md border border-[#E8EAEE] bg-white">
          <div className="text-[10px] font-medium text-[#666D7A] mb-2">Interpretation</div>
          <p className="text-[13px] text-[#141821] leading-relaxed">{live.interpretation}</p>
        </div>
        <div className="p-4 rounded-md border border-[#E8EAEE] bg-white">
          <div className="text-[10px] font-medium text-[#666D7A] mb-2">Reframe</div>
          <p className="text-[13px] text-[#141821] leading-relaxed">{live.reframe}</p>
        </div>
        <div className="p-4 rounded-md border border-[#E8EAEE] bg-white">
          <div className="text-[10px] font-medium text-[#666D7A] mb-2">Next focus</div>
          <p className="text-[13px] text-[#141821] leading-relaxed">{live.next_focus}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={`p-3 rounded-md border ${platformClean ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-[11.5px] font-medium mb-1" style={{ color: platformClean ? '#047857' : '#b91c1c' }}>Platform audit</div>
            {platformClean ? (
              <div className="text-[11px] text-emerald-800">Clean · no platform-banned terms leaked</div>
            ) : (
              <div className="text-[11px] text-red-800">Leaked: {live.meta.platformBannedHits.join(', ')}</div>
            )}
          </div>
          <div className={`p-3 rounded-md border ${partnerClean ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-[11.5px] font-medium mb-1" style={{ color: partnerClean ? '#047857' : '#b91c1c' }}>Partner audit</div>
            {partnerClean ? (
              <div className="text-[11px] text-emerald-800">Clean · none of your banned phrases fired</div>
            ) : (
              <div className="text-[11px] text-red-800">Fired: {live.meta.partnerBannedHits.join(', ')}</div>
            )}
          </div>
          <div className="p-3 rounded-md border border-[#E8EAEE] bg-white">
            <div className="text-[10px] font-medium text-[#666D7A] mb-1">Substitutions applied</div>
            {live.meta.terminologySubsApplied.length === 0 ? (
              <div className="text-[11px] text-[#666D7A] italic">None matched the output</div>
            ) : (
              <div className="text-[11px] text-[#141821] font-mono">{live.meta.terminologySubsApplied.join('  ·  ')}</div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-[#666D7A] italic pt-2 border-t border-[#F4F6F9]">
          Sample based on a fixed stub check-in (Sarah, Week 3). Comparable across previews so you can iterate on tuning. Real check-ins use the full generator with retry-on-leak.
        </p>
      </div>
    </div>
  )
}

function PreviewPanel({
  preview,
  onDismiss,
}: {
  preview: PreviewOutput
  onDismiss: () => void
}) {
  return (
    <div className="mt-5 border border-blue-200 rounded-xl bg-blue-50/30 overflow-hidden">
      <div className="px-5 py-3 border-b border-blue-200 bg-blue-50 flex items-center justify-between">
        <h4 className="text-[12px] font-medium text-blue-900">Preview (deterministic - no LLM call)</h4>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-blue-700 hover:text-blue-900 underline"
        >
          Dismiss
        </button>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <div className="text-[11px] font-medium text-[#666D7A] mb-1">Summary</div>
          <div className="text-[12px] text-[#141821] flex flex-wrap gap-2">
            <SummaryChip on={preview.summary.hasVoiceTone} label="voice tone" />
            <SummaryChip on={preview.summary.bannedPhraseCount > 0} label={`${preview.summary.bannedPhraseCount} banned phrase${preview.summary.bannedPhraseCount === 1 ? '' : 's'}`} />
            <SummaryChip on={preview.summary.substitutionCount > 0} label={`${preview.summary.substitutionCount} substitution${preview.summary.substitutionCount === 1 ? '' : 's'}`} />
            <SummaryChip on={preview.summary.guidanceFieldsSet > 0} label={`${preview.summary.guidanceFieldsSet}/3 guidance fields`} />
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#666D7A] mb-1">What gets added to each generator&apos;s system prompt</div>
          <div className="space-y-2">
            {preview.systemPromptBlocks.map((block) => (
              <div key={block.generator} className="border border-[#E8EAEE] rounded-md bg-white">
                <div className="px-3 py-1.5 border-b border-[#F4F6F9] text-[11px] font-medium text-[#666D7A]">{block.generator}</div>
                <pre className="p-3 text-[11px] text-[#141821] whitespace-pre-wrap font-mono leading-relaxed">{block.text}</pre>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#666D7A] mb-1">Terminology substitution demo</div>
          {preview.substitutionDemo.substitutionsApplied.length === 0 ? (
            <p className="text-[12px] text-[#666D7A] italic">No substitutions matched the demo sentence.</p>
          ) : (
            <>
              <p className="text-[11px] text-[#666D7A] mb-1">Applied: {preview.substitutionDemo.substitutionsApplied.join(', ')}</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 rounded-md border border-[#E8EAEE] bg-white">
                  <div className="text-[10px] font-medium text-[#666D7A] mb-1">Before</div>
                  <p className="text-[12px] text-[#141821] leading-relaxed">{preview.substitutionDemo.before}</p>
                </div>
                <div className="p-3 rounded-md border border-blue-200 bg-blue-50/60">
                  <div className="text-[10px] font-medium text-blue-700 mb-1">After (post-generation rewrite)</div>
                  <p className="text-[12px] text-[#141821] leading-relaxed">{preview.substitutionDemo.after}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#666D7A] mb-1">Banned phrase demo</div>
          <p className="text-[11px] text-[#666D7A] mb-1">If a draft contained the sentence below, these phrases would fire the audit + trigger regeneration:</p>
          <div className="p-3 rounded-md border border-[#E8EAEE] bg-white mb-2">
            <p className="text-[12px] text-[#141821] leading-relaxed italic">&quot;{preview.bannedPhraseDemo.sample}&quot;</p>
          </div>
          {preview.bannedPhraseDemo.hits.length === 0 ? (
            <p className="text-[12px] text-[#666D7A] italic">No configured banned phrases matched the demo sentence. Add phrases above to see hits.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {preview.bannedPhraseDemo.hits.map((hit, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-mono">{hit}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={
        on
          ? 'px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold'
          : 'px-2 py-0.5 rounded-md bg-[#F4F6F9] text-[#666D7A] text-[11px]'
      }
    >
      {label}
    </span>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-[#666D7A] mb-1">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-[#666D7A] leading-relaxed mt-1.5">{hint}</p>}
    </div>
  )
}
