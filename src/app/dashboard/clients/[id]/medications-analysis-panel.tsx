'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

interface MedicationRow {
  name: string
  purpose: string
  client_influence: string
  program_influence: string
  nutrition_influence: string
  recovery_influence: string
}

interface CoachAnalysis {
  medications: MedicationRow[]
  combined_picture: string
}

interface ClientReading {
  mr_what_youre_taking: string
  mr_why_it_matters: string
  mr_how_we_account_for_it: string
  mr_what_to_watch: string
}

interface Props {
  clientId: string
  clientFirstName: string
  medicationsText: string | null
  medicationsUpdatedAt: string | null
  analysis: CoachAnalysis | null
  analyzedAt: string | null
  reading: ClientReading | null
  readingGeneratedAt: string | null
  readingPublishedAt: string | null
}

/**
 * Coach-side Medications Analysis card. Sits below the MedicationsEditor.
 * - Generate Analysis: structured per-med breakdown (Claude → coach JSON)
 * - Generate Reading: client-facing prose (requires analysis first)
 * - Publish Reading: toggles portal visibility
 *
 * Both AI calls happen via fetch to dedicated routes; this component only
 * displays state and surfaces freshness warnings (medications text changed
 * after the analysis was generated → pill says "Rebuild recommended").
 */
export default function MedicationsAnalysisPanel({
  clientId,
  clientFirstName,
  medicationsText,
  medicationsUpdatedAt,
  analysis: initialAnalysis,
  analyzedAt: initialAnalyzedAt,
  reading: initialReading,
  readingGeneratedAt: initialReadingGeneratedAt,
  readingPublishedAt: initialReadingPublishedAt,
}: Props) {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(initialAnalysis)
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(initialAnalyzedAt)
  const [reading, setReading] = useState<ClientReading | null>(initialReading)
  const [readingGeneratedAt, setReadingGeneratedAt] = useState<string | null>(initialReadingGeneratedAt)
  const [readingPublishedAt, setReadingPublishedAt] = useState<string | null>(initialReadingPublishedAt)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingReading, setGeneratingReading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const hasMeds = !!medicationsText && medicationsText.trim().length > 0
  const analysisStale = !!medicationsUpdatedAt && !!analyzedAt
    ? new Date(medicationsUpdatedAt) > new Date(analyzedAt)
    : false
  const readingStale = !!analyzedAt && !!readingGeneratedAt
    ? new Date(analyzedAt) > new Date(readingGeneratedAt)
    : false
  const readingOutOfDateVsMeds = !!medicationsUpdatedAt && !!readingGeneratedAt
    ? new Date(medicationsUpdatedAt) > new Date(readingGeneratedAt)
    : false

  async function analyze() {
    setError(null); setStatus(null); setAnalyzing(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/medications/analyze`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Analysis failed'); return }
      setAnalysis(json.analysis ?? null)
      setAnalyzedAt(json.analyzedAt ?? null)
      setStatus('Analysis generated.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function generateReading() {
    setError(null); setStatus(null); setGeneratingReading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/medications/reading/generate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Reading generation failed'); return }
      setReading(json.reading ?? null)
      setReadingGeneratedAt(json.generatedAt ?? null)
      setStatus(`Reading generated. Review before publishing to ${clientFirstName}'s portal.`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGeneratingReading(false)
    }
  }

  async function togglePublish() {
    setError(null); setStatus(null); setPublishing(true)
    try {
      const action = readingPublishedAt ? 'unpublish' : 'publish'
      const res = await fetch(`/api/clients/${clientId}/medications/reading/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Publish failed'); return }
      setReadingPublishedAt(json.client?.medications_reading_published_at ?? null)
      setStatus(action === 'publish' ? 'Published to client portal.' : 'Unpublished from client portal.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  if (!hasMeds) {
    return (
      <div className="mt-3 bg-[#FFFFFF]/40 br-card p-4">
        <p className="text-[12.5px] text-[#98A0AD]">No medications recorded. Once {clientFirstName}&apos;s medications are saved above, Generate Analysis to produce the coach breakdown + client reading.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <GenerationProgressOverlay
        active={analyzing}
        title="Analysing Medications"
        stages={[
          { start: 0,  label: 'Reading client medications field, intake context, CFFS' },
          { start: 4,  label: 'Drafting per-medication analysis (purpose, influence on client / program / nutrition / recovery)' },
          { start: 18, label: 'Drafting the combined picture across all medications' },
          { start: 30, label: 'Saving and refreshing the panel' },
          { start: 50, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Medications Analysis uses Claude Haiku 4.5. Typical: 20 to 40 seconds. The page is not frozen, please don't refresh."
      />
      <GenerationProgressOverlay
        active={generatingReading}
        title="Generating Medications Reading"
        stages={[
          { start: 0,  label: 'Reading the medications analysis you just saved' },
          { start: 4,  label: 'Drafting the 4 client-facing reading sections' },
          { start: 18, label: 'Scanning for banned client-facing terms' },
          { start: 22, label: 'Auto-retrying if any banned terms leaked' },
          { start: 35, label: 'Saving and refreshing the panel' },
          { start: 55, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Medications Reading generation uses Claude Haiku 4.5 with automatic banned-term retry. Typical: 20 to 40 seconds. The page is not frozen, please don't refresh."
      />
      <div className="br-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8EAEE] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-[12px] font-medium text-[#1B6DFC]">Medications Analysis (coach)</p>
            {analyzedAt && (
              <span className="text-[10px] text-[#98A0AD]">
                Generated {new Date(analyzedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {analysisStale && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] text-[#A96A12]">
                Rebuild recommended
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing}
            className="br-btn disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : analysis ? 'Regenerate analysis' : 'Generate analysis'}
          </button>
        </div>

        {!analysis ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[#666D7A] mb-1">No analysis generated yet</p>
            <p className="text-[12.5px] text-[#98A0AD]">Click Generate analysis to draft the structured per-medication breakdown.</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {analysis.medications.length === 0 ? (
              <p className="text-sm text-[#666D7A]">No medications recorded.</p>
            ) : (
              analysis.medications.map((med, i) => (
                <div key={i} className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#141821]">{med.name}</p>
                    <p className="text-[12.5px] text-[#666D7A] mt-1 leading-relaxed">{med.purpose}</p>
                  </div>
                  <InfluenceRow label="Client influence" body={med.client_influence} />
                  <InfluenceRow label="Program influence" body={med.program_influence} />
                  <InfluenceRow label="Nutrition influence" body={med.nutrition_influence} />
                  <InfluenceRow label="Recovery + regulation influence" body={med.recovery_influence} />
                </div>
              ))
            )}
            {analysis.combined_picture && (
              <div className="bg-[#FFFFFF] border border-[#B5CFFC] rounded-lg p-4">
                <p className="text-[11.5px] font-medium text-[#1B6DFC] mb-1.5">Combined picture</p>
                <p className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{analysis.combined_picture}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {analysis && (
        <div className="br-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8EAEE] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-[12px] font-medium text-[#1B6DFC]">Medications Reading (client)</p>
              {readingGeneratedAt && (
                <span className="text-[10px] text-[#98A0AD]">
                  Generated {new Date(readingGeneratedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${readingPublishedAt ? 'bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] text-[#1056D6]' : 'bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] text-[#A96A12]'}`}>
                {readingPublishedAt ? 'Published' : 'Draft (not on portal)'}
              </span>
              {(readingStale || readingOutOfDateVsMeds) && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] text-[#A96A12]">
                  Rebuild recommended
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateReading}
                disabled={generatingReading}
                className="br-btn disabled:opacity-50"
              >
                {generatingReading ? 'Generating…' : reading ? 'Regenerate reading' : 'Generate reading'}
              </button>
              {reading && (
                <button
                  type="button"
                  onClick={togglePublish}
                  disabled={publishing}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${readingPublishedAt ? 'border border-[#E8EAEE] text-[#141821] hover:border-[#CFD4DC]' : 'bg-[#1B6DFC] text-white hover:bg-[#1560E0]'}`}
                >
                  {publishing ? 'Working…' : readingPublishedAt ? 'Unpublish' : 'Publish to portal'}
                </button>
              )}
            </div>
          </div>

          {!reading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#666D7A] mb-1">No client reading generated yet</p>
              <p className="text-[12.5px] text-[#98A0AD]">Click Generate reading to produce the client-facing version. Reviews before you publish.</p>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              <ReadingSection title="What you're taking" body={reading.mr_what_youre_taking} />
              <ReadingSection title="Why it matters" body={reading.mr_why_it_matters} />
              <ReadingSection title="How we account for it" body={reading.mr_how_we_account_for_it} />
              <ReadingSection title="What to watch" body={reading.mr_what_to_watch} accent />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[12.5px] text-[#C82626]">{error}</p>}
      {status && <p className="text-[12.5px] text-[#1B6DFC]">{status}</p>}
    </div>
  )
}

function InfluenceRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-[#98A0AD] mb-1">{label}</p>
      <p className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  )
}

function ReadingSection({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-4">
      <p className={`text-[11.5px] font-medium mb-2 ${accent ? 'text-[#1B6DFC]' : 'text-[#98A0AD]'}`}>{title}</p>
      <div className="text-[12.5px] text-[#43474F] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
