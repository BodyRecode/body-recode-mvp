'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

interface Marker {
  name: string
  value: string
  unit: string | null
  reference_range: string | null
  flag: 'low' | 'normal' | 'high' | 'very_low' | 'very_high' | 'unknown'
}

interface AnalysisGroup {
  title: string
  markers_referenced: string
  coaching_significance: string
  program_influence: string
  nutrition_influence: string
  gp_note: string | null
}

interface CoachAnalysis {
  groups: AnalysisGroup[]
  combined_picture: string
}

interface ClientReading {
  bp_what_we_saw: string
  bp_why_it_matters: string
  bp_how_we_account_for_it: string
  bp_what_to_watch: string
}

interface FramedPattern {
  id: string
  label: string
  observation: string
  whatWouldClarify: string[]
  clinicianQuestion: string
  caveat: string
  confidence: 'low' | 'moderate'
}
interface LensResult {
  derived: Record<string, { value: number; unit?: string; system?: string } | undefined>
  framed_patterns: FramedPattern[]
  patterns: Array<{ id: string; label: string; evidence: string; confidence: string }>
  unresolved_markers: string[]
  missing_for_patterns: string[]
  note?: string
  disclaimer: string
}

export interface BloodPanelData {
  id: string
  status: string
  approved_for_plan: boolean
  submitted_at: string
  collected_on: string | null
  lab_name: string | null
  original_filename: string | null
  client_note: string | null
  panel_summary: string | null
  markers: Marker[] | null
  gp_flags: string[] | null
  extraction_meta: { unreadable?: boolean; notes?: string | null; error?: string } | null
  analysis: CoachAnalysis | null
  analyzed_at: string | null
  reading: ClientReading | null
  reading_generated_at: string | null
  reading_published_at: string | null
  approved_at: string | null
}

const FLAG_STYLE: Record<Marker['flag'], string> = {
  normal: 'text-[#98A0AD]',
  low: 'text-amber-700',
  high: 'text-amber-700',
  very_low: 'text-red-700 font-semibold',
  very_high: 'text-red-700 font-semibold',
  unknown: 'text-[#C4C4C4]',
}
const FLAG_LABEL: Record<Marker['flag'], string> = {
  normal: '', low: 'low', high: 'high', very_low: 'markedly low', very_high: 'markedly high', unknown: '?',
}

function shortDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

/**
 * Coach-side Blood Panels card. One BloodPanelCard per uploaded panel, each
 * driving its own AI steps (re-extract -> analyze -> reading -> publish) and
 * the plan-influence approval gate. Mirrors the MedicationsAnalysisPanel.
 */
export default function BloodPanelsPanel({
  clientId,
  clientFirstName,
  panels,
}: {
  clientId: string
  clientFirstName: string
  panels: BloodPanelData[]
}) {
  if (panels.length === 0) {
    return (
      <div className="bg-[#FFFFFF]/40 border border-[#E8EAEE] rounded-xl p-4">
        <p className="text-[12.5px] text-[#98A0AD]">
          No blood panels uploaded yet. {clientFirstName} can upload a copy of their blood test results from the Health Markers section of their portal at any time. Once a panel arrives, it is transcribed automatically and appears here for you to analyse and approve.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {panels.map(panel => (
        <BloodPanelCard key={panel.id} clientId={clientId} clientFirstName={clientFirstName} panel={panel} />
      ))}
    </div>
  )
}

function BloodPanelCard({ clientId, clientFirstName, panel }: { clientId: string; clientFirstName: string; panel: BloodPanelData }) {
  const router = useRouter()
  const base = `/api/clients/${clientId}/blood-panels/${panel.id}`

  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(panel.analysis)
  const [reading, setReading] = useState<ClientReading | null>(panel.reading)
  const [publishedAt, setPublishedAt] = useState<string | null>(panel.reading_published_at)
  const [approved, setApproved] = useState<boolean>(panel.approved_for_plan)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [lens, setLens] = useState<LensResult | null>(null)
  const [lensOpen, setLensOpen] = useState(false)

  const markers = panel.markers ?? []
  const hasMarkers = markers.length > 0

  async function call(path: string, body?: object, key?: string): Promise<Record<string, unknown> | null> {
    setError(null); setStatus(null); setBusy(key ?? path)
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong'); return null }
      return json
    } catch (err) {
      setError((err as Error).message); return null
    } finally {
      setBusy(null)
    }
  }

  async function viewFile() {
    setError(null); setBusy('file')
    try {
      const res = await fetch(`${base}/file`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not open file'); return }
      window.open(json.url, '_blank', 'noopener')
    } finally {
      setBusy(null)
    }
  }

  async function reextract() {
    const json = await call('/reextract', undefined, 'reextract')
    if (json) { setStatus(`Re-read complete: ${json.markerCount ?? 0} markers.`); router.refresh() }
  }
  async function analyze() {
    const json = await call('/analyze', undefined, 'analyze')
    if (json) { setAnalysis(json.analysis as CoachAnalysis); setStatus('Analysis generated.'); router.refresh() }
  }
  async function generateReading() {
    const json = await call('/reading', undefined, 'reading')
    if (json) { setReading(json.reading as ClientReading); setStatus(`Reading drafted. Review before publishing to ${clientFirstName}'s portal.`); router.refresh() }
  }
  async function togglePublish() {
    const json = await call('/publish', { action: publishedAt ? 'unpublish' : 'publish' }, 'publish')
    if (json) {
      const p = json.panel as { reading_published_at: string | null }
      setPublishedAt(p.reading_published_at)
      setStatus(p.reading_published_at ? 'Published to client portal.' : 'Unpublished from client portal.')
      router.refresh()
    }
  }
  async function toggleApprove() {
    const json = await call('/approve', { action: approved ? 'revoke' : 'approve' }, 'approve')
    if (json) {
      const p = json.panel as { approved_for_plan: boolean }
      setApproved(p.approved_for_plan)
      setStatus(p.approved_for_plan
        ? 'Approved for plan. Regenerate the CFFS to fold these markers into the Foundational Reading, program, and nutrition.'
        : 'Approval revoked. These markers will not feed the next CFFS.')
      router.refresh()
    }
  }

  async function runLens() {
    setError(null); setStatus(null); setBusy('lens'); setLensOpen(true)
    try {
      const res = await fetch(`${base}/research-lens`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Research Lens failed'); return }
      setLens(json as LensResult)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const dateLabel = shortDate(panel.collected_on) || shortDate(panel.submitted_at)
  const isFailed = panel.status === 'failed' || panel.extraction_meta?.unreadable

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl overflow-hidden">
      <GenerationProgressOverlay
        active={busy === 'reextract'}
        title="Re-reading Blood Panel File"
        stages={[
          { start: 0,  label: 'Loading the uploaded blood test image / PDF' },
          { start: 4,  label: 'Multimodal extraction of every marker, value, unit, and reference range' },
          { start: 25, label: 'Flagging out-of-range markers against the lab\'s own ranges' },
          { start: 40, label: 'Saving extracted markers to the panel' },
          { start: 60, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Blood panel re-extraction uses Claude Haiku 4.5 multimodal. Typical: 30 to 50 seconds. The page is not frozen, please don't refresh."
      />
      <GenerationProgressOverlay
        active={busy === 'analyze'}
        title="Generating Coach Analysis"
        stages={[
          { start: 0,  label: 'Reading every marker on this panel + CFFS + medications' },
          { start: 4,  label: 'Drafting per-marker reasoning (physiology + clinical context)' },
          { start: 20, label: 'Drafting cross-marker patterns and the combined picture' },
          { start: 32, label: 'Saving the coach analysis' },
          { start: 50, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Coach analysis uses Claude Haiku 4.5. Coach-facing only — separate from the client-facing reading. Typical: 25 to 45 seconds. The page is not frozen, please don't refresh."
      />
      <GenerationProgressOverlay
        active={busy === 'reading'}
        title="Generating Client Reading"
        stages={[
          { start: 0,  label: 'Reading the coach analysis you saved + CFFS + medications' },
          { start: 4,  label: 'Drafting the client-facing prose under conservative-disclosure doctrine' },
          { start: 20, label: 'Scanning for banned terms and over-claiming' },
          { start: 25, label: 'Auto-retrying if any banned terms leaked' },
          { start: 35, label: 'Saving the new reading' },
          { start: 55, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Client reading uses Claude Haiku 4.5 with automatic banned-term retry, gated by conservative-disclosure doctrine (no diagnosis language, no severity scoring). Typical: 25 to 45 seconds. The page is not frozen, please don't refresh."
      />
      <GenerationProgressOverlay
        active={busy === 'lens'}
        title="Running Research Lens"
        stages={[
          { start: 0,  label: 'Computing derived metrics (non-HDL, remnant cholesterol, TG:HDL, HOMA-IR, ApoB:ApoA1)' },
          { start: 6,  label: 'Detecting the six named patterns deterministically' },
          { start: 12, label: 'Drafting prose framing for any patterns found' },
          { start: 35, label: 'Returning the result (not persisted — exploratory only)' },
          { start: 55, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Research Lens is coach / admin only, exploratory, and never written to the panel or injected into the plan. Uses Claude Haiku 4.5. Typical: 25 to 45 seconds. The page is not frozen, please don't refresh."
      />
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E8EAEE] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="text-[12px] font-medium text-blue-500">Blood panel · {dateLabel}</p>
          {panel.lab_name && <span className="text-[10px] text-[#98A0AD]">{panel.lab_name}</span>}
          {approved && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">Approved for plan</span>
          )}
          {isFailed && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">Read failed</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={viewFile} disabled={busy === 'file'} className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors disabled:opacity-50">
            {busy === 'file' ? 'Opening…' : 'View file'}
          </button>
          <button type="button" onClick={reextract} disabled={!!busy} className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors disabled:opacity-50">
            {busy === 'reextract' ? 'Re-reading…' : 'Re-read file'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {panel.client_note && (
          <p className="text-[12.5px] text-[#666D7A] italic">Client note: &ldquo;{panel.client_note}&rdquo;</p>
        )}
        {panel.panel_summary && <p className="text-[12.5px] text-[#43474F] leading-relaxed">{panel.panel_summary}</p>}
        {panel.extraction_meta?.notes && (
          <p className="text-[12.5px] text-amber-700">Reader notes: {panel.extraction_meta.notes}</p>
        )}

        {/* Markers table */}
        {hasMarkers ? (
          <div className="border border-[#E8EAEE] rounded-lg overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[#FAFAFA] text-[#98A0AD] text-[10px]">
                  <th className="text-left font-bold px-3 py-2">Marker</th>
                  <th className="text-left font-bold px-3 py-2">Value</th>
                  <th className="text-left font-bold px-3 py-2">Ref range</th>
                </tr>
              </thead>
              <tbody>
                {markers.map((m, i) => (
                  <tr key={i} className="border-t border-[#F0F0F0]">
                    <td className="px-3 py-2 text-[#43474F]">{m.name}</td>
                    <td className={`px-3 py-2 ${FLAG_STYLE[m.flag]}`}>
                      {[m.value, m.unit].filter(Boolean).join(' ')}
                      {FLAG_LABEL[m.flag] && <span className="ml-1.5 text-[10px]">({FLAG_LABEL[m.flag]})</span>}
                    </td>
                    <td className="px-3 py-2 text-[#98A0AD]">{m.reference_range ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12.5px] text-[#98A0AD]">No markers transcribed. Re-read the file, or ask {clientFirstName} for a clearer copy.</p>
        )}

        {(panel.gp_flags?.length ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[11.5px] font-medium text-amber-700 mb-1.5">Lab-flagged · route to GP</p>
            <ul className="space-y-1">
              {panel.gp_flags!.map((f, i) => <li key={i} className="text-[12.5px] text-amber-800 leading-relaxed">{f}</li>)}
            </ul>
          </div>
        )}

        {/* Action bar */}
        {hasMarkers && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button type="button" onClick={analyze} disabled={!!busy} className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50">
              {busy === 'analyze' ? 'Analyzing…' : analysis ? 'Regenerate analysis' : 'Generate analysis'}
            </button>
            {analysis && (
              <button type="button" onClick={generateReading} disabled={!!busy} className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50">
                {busy === 'reading' ? 'Generating…' : reading ? 'Regenerate reading' : 'Generate reading'}
              </button>
            )}
            {reading && (
              <button type="button" onClick={togglePublish} disabled={!!busy} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${publishedAt ? 'border border-[#E8EAEE] text-[#141821] hover:border-[#CFD4DC]' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                {busy === 'publish' ? 'Working…' : publishedAt ? 'Unpublish reading' : 'Publish reading'}
              </button>
            )}
            <button type="button" onClick={toggleApprove} disabled={!!busy} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${approved ? 'border border-blue-300 text-blue-700 hover:border-blue-500' : 'bg-[#1B6DFC] text-white hover:bg-[#5390FF]'}`}>
              {busy === 'approve' ? 'Working…' : approved ? 'Revoke plan approval' : 'Approve for plan'}
            </button>
          </div>
        )}

        {/* Coach analysis render */}
        {analysis && (
          <div className="space-y-3 pt-1">
            <p className="text-[11.5px] font-medium text-blue-500">Analysis (coach) {panel.analyzed_at && <span className="text-[#98A0AD] font-normal ml-1">· {shortDate(panel.analyzed_at)}</span>}</p>
            {analysis.groups.map((g, i) => (
              <div key={i} className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-[#141821]">{g.title}</p>
                  <p className="text-[11px] text-[#98A0AD] mt-0.5">{g.markers_referenced}</p>
                </div>
                <Influence label="Coaching significance" body={g.coaching_significance} />
                <Influence label="Program" body={g.program_influence} />
                <Influence label="Nutrition" body={g.nutrition_influence} />
                {g.gp_note && (
                  <p className="text-[11px] text-amber-700 leading-relaxed"><span className="font-medium text-[10px]">GP: </span>{g.gp_note}</p>
                )}
              </div>
            ))}
            {analysis.combined_picture && (
              <div className="bg-[#FFFFFF] border border-blue-200 rounded-lg p-4">
                <p className="text-[11.5px] font-medium text-blue-500 mb-1.5">Combined picture</p>
                <p className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{analysis.combined_picture}</p>
              </div>
            )}
          </div>
        )}

        {/* Client reading render */}
        {reading && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-[11.5px] font-medium text-blue-500">Reading (client)</p>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${publishedAt ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                {publishedAt ? 'Published' : 'Draft (not on portal)'}
              </span>
            </div>
            <ReadingSection title="What we saw" body={reading.bp_what_we_saw} />
            <ReadingSection title="Why it matters" body={reading.bp_why_it_matters} />
            <ReadingSection title="How we account for it" body={reading.bp_how_we_account_for_it} />
            <ReadingSection title="What to watch" body={reading.bp_what_to_watch} accent />
          </div>
        )}

        {/* Research Lens — coach-only exploratory cross-marker reading. */}
        {hasMarkers && (
          <div className="border border-violet-200 bg-violet-50/40 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => (lensOpen ? setLensOpen(false) : (lens ? setLensOpen(true) : runLens()))}
              className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-violet-50 transition-colors"
            >
              <span className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-medium text-violet-700">Research Lens</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-100 border border-violet-200 text-violet-700">coach only · exploratory · not shared · not in plan</span>
              </span>
              <span className="text-[12.5px] font-medium text-violet-700 shrink-0">{busy === 'lens' ? 'Running…' : lensOpen ? 'Hide' : lens ? 'Show' : 'Run'}</span>
            </button>

            {lensOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3">
                {!lens && busy === 'lens' && <p className="text-[12.5px] text-violet-700">Reading across markers…</p>}
                {lens && (
                  <>
                    {/* Derived metrics */}
                    {lens.derived && Object.values(lens.derived).some(Boolean) && (
                      <div className="flex flex-wrap gap-2">
                        {lens.derived.non_hdl && <Metric label="non-HDL" v={`${lens.derived.non_hdl.value} ${lens.derived.non_hdl.unit ?? ''}`} />}
                        {lens.derived.remnant_cholesterol && <Metric label="remnant" v={`${lens.derived.remnant_cholesterol.value} ${lens.derived.remnant_cholesterol.unit ?? ''}`} />}
                        {lens.derived.tg_hdl_ratio && <Metric label="TG:HDL" v={`${lens.derived.tg_hdl_ratio.value} (${lens.derived.tg_hdl_ratio.system})`} />}
                        {lens.derived.homa_ir && <Metric label="HOMA-IR" v={`${lens.derived.homa_ir.value}`} />}
                        {lens.derived.apob_apoa1 && <Metric label="ApoB:ApoA1" v={`${lens.derived.apob_apoa1.value}`} />}
                      </div>
                    )}

                    {/* Framed patterns */}
                    {lens.framed_patterns.length === 0 ? (
                      <p className="text-[12.5px] text-violet-700">{lens.note ?? 'No contextual patterns assessable from these markers.'}</p>
                    ) : (
                      lens.framed_patterns.map((p, i) => (
                        <div key={i} className="bg-white border border-violet-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#141821]">{p.label}</p>
                            <span className="text-[9px] font-medium text-violet-600">{p.confidence}</span>
                          </div>
                          <p className="text-[12.5px] text-[#43474F] leading-relaxed">{p.observation}</p>
                          {p.whatWouldClarify.length > 0 && (
                            <p className="text-[11px] text-[#666D7A] leading-relaxed"><span className="font-medium text-[10px] text-violet-600">What would clarify: </span>{p.whatWouldClarify.join(', ')}</p>
                          )}
                          <p className="text-[11px] text-[#43474F] leading-relaxed"><span className="font-medium text-[10px] text-violet-600">Ask a clinician: </span>{p.clinicianQuestion}</p>
                          {p.caveat && <p className="text-[11px] text-[#98A0AD] italic leading-relaxed">{p.caveat}</p>}
                        </div>
                      ))
                    )}

                    {lens.missing_for_patterns.length > 0 && (
                      <details className="text-[11px] text-[#666D7A]">
                        <summary className="cursor-pointer">Not assessable ({lens.missing_for_patterns.length})</summary>
                        <ul className="mt-1 space-y-0.5 pl-3">{lens.missing_for_patterns.map((m, i) => <li key={i}>· {m}</li>)}</ul>
                      </details>
                    )}
                    {lens.unresolved_markers.length > 0 && (
                      <p className="text-[11px] text-[#98A0AD]">Unmapped markers (not read by the Lens): {lens.unresolved_markers.join(', ')}</p>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-[10px] text-[#98A0AD] italic leading-relaxed">{lens.disclaimer}</p>
                      <button type="button" onClick={runLens} disabled={busy === 'lens'} className="text-[11px] font-medium text-violet-700 hover:text-violet-900 shrink-0 disabled:opacity-50">Re-run</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-[12.5px] text-red-700">{error}</p>}
        {status && <p className="text-[12.5px] text-blue-500">{status}</p>}
      </div>
    </div>
  )
}

function Metric({ label, v }: { label: string; v: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 bg-white border border-violet-200 rounded-md px-2 py-1">
      <span className="text-[9px] font-medium text-violet-600">{label}</span>
      <span className="text-[12.5px] font-medium text-[#141821]">{v}</span>
    </span>
  )
}

function Influence({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-[#98A0AD] mb-0.5">{label}</p>
      <p className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  )
}

function ReadingSection({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-4">
      <p className={`text-[11.5px] font-medium mb-2 ${accent ? 'text-blue-500' : 'text-[#98A0AD]'}`}>{title}</p>
      <div className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
