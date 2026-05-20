'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      <div className="mt-3 bg-[#FFFFFF]/40 border border-[#E5E5E5] rounded-xl p-4">
        <p className="text-xs text-[#999999]">No medications recorded. Once {clientFirstName}&apos;s medications are saved above, Generate Analysis to produce the coach breakdown + client reading.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Medications Analysis (coach)</p>
            {analyzedAt && (
              <span className="text-[10px] uppercase tracking-widest text-[#999999]">
                Generated {new Date(analyzedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {analysisStale && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Rebuild recommended
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing}
            className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#D4D4D4] hover:text-[#e7e5e4] transition-colors disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : analysis ? 'Regenerate analysis' : 'Generate analysis'}
          </button>
        </div>

        {!analysis ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[#6B6B6B] mb-1">No analysis generated yet</p>
            <p className="text-xs text-[#999999]">Click Generate analysis to draft the structured per-medication breakdown.</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {analysis.medications.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">No medications recorded.</p>
            ) : (
              analysis.medications.map((med, i) => (
                <div key={i} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#e7e5e4]">{med.name}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{med.purpose}</p>
                  </div>
                  <InfluenceRow label="Client influence" body={med.client_influence} />
                  <InfluenceRow label="Program influence" body={med.program_influence} />
                  <InfluenceRow label="Nutrition influence" body={med.nutrition_influence} />
                  <InfluenceRow label="Recovery + regulation influence" body={med.recovery_influence} />
                </div>
              ))
            )}
            {analysis.combined_picture && (
              <div className="bg-[#FFFFFF] border border-blue-500/30 rounded-lg p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">Combined picture</p>
                <p className="text-xs text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{analysis.combined_picture}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Medications Reading (client)</p>
              {readingGeneratedAt && (
                <span className="text-[10px] uppercase tracking-widest text-[#999999]">
                  Generated {new Date(readingGeneratedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${readingPublishedAt ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'}`}>
                {readingPublishedAt ? 'Published' : 'Draft (not on portal)'}
              </span>
              {(readingStale || readingOutOfDateVsMeds) && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Rebuild recommended
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateReading}
                disabled={generatingReading}
                className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#D4D4D4] hover:text-[#e7e5e4] transition-colors disabled:opacity-50"
              >
                {generatingReading ? 'Generating…' : reading ? 'Regenerate reading' : 'Generate reading'}
              </button>
              {reading && (
                <button
                  type="button"
                  onClick={togglePublish}
                  disabled={publishing}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${readingPublishedAt ? 'border border-stone-300 text-stone-700 hover:border-stone-500' : 'bg-blue-500 text-black hover:bg-blue-500'}`}
                >
                  {publishing ? 'Working…' : readingPublishedAt ? 'Unpublish' : 'Publish to portal'}
                </button>
              )}
            </div>
          </div>

          {!reading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#6B6B6B] mb-1">No client reading generated yet</p>
              <p className="text-xs text-[#999999]">Click Generate reading to produce the client-facing version. Reviews before you publish.</p>
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

      {error && <p className="text-xs text-red-400">{error}</p>}
      {status && <p className="text-xs text-blue-500">{status}</p>}
    </div>
  )
}

function InfluenceRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-1">{label}</p>
      <p className="text-xs text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  )
}

function ReadingSection({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-4">
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ? 'text-blue-500' : 'text-[#999999]'}`}>{title}</p>
      <div className="text-xs text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
