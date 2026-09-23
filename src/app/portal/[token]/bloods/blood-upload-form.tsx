'use client'

import { useState } from 'react'
import { CollectionNotice, HealthConsent } from '@/components/collection-notice'
import { useRouter } from 'next/navigation'
import { compressImage, MAX_UPLOAD_BYTES } from '@/lib/compress-image'

/**
 * Client self-serve blood test upload. Mirrors the medical-clearance upload
 * form but adds optional lab name, collection date, and a note. Images are
 * compressed client-side; PDFs pass through under the 4MB cap.
 */
export default function BloodUploadForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [labName, setLabName] = useState('')
  const [collectedOn, setCollectedOn] = useState('')
  const [clientNote, setClientNote] = useState('')
  const [lastPeriodStart, setLastPeriodStart] = useState('')
  const [uploading, setUploading] = useState(false)
  const [optimising, setOptimising] = useState(false)
  const [error, setError] = useState('')
  const [missingFile, setMissingFile] = useState(false)
  const [done, setDone] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentMissing, setConsentMissing] = useState(false)

  async function handleFilePick(picked: File | null) {
    if (!picked) { setFile(null); return }
    setMissingFile(false)
    setError('')
    if (picked.type.startsWith('image/')) {
      setOptimising(true)
      try {
        setFile(await compressImage(picked))
      } finally {
        setOptimising(false)
      }
    } else {
      setFile(picked)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setMissingFile(true); setError(''); return }
    // Pathology results are the most sensitive thing a client can hand us.
    // Consent is asked here, at the point of upload, not inherited from the
    // intake she filled in months ago.
    if (!consented) { setConsentMissing(true); setError(''); return }
    if (optimising) { setError('Your file is still being optimised. Try again in a moment.'); return }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`This file is ${(file.size / 1024 / 1024).toFixed(1)} MB, which is too large. PDFs need to be under 4 MB. Try a lower-resolution scan, or take a photo of the page instead.`)
      return
    }
    setMissingFile(false)
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    if (labName.trim()) formData.append('labName', labName.trim())
    if (collectedOn) formData.append('collectedOn', collectedOn)
    if (clientNote.trim()) formData.append('clientNote', clientNote.trim())
    if (lastPeriodStart) formData.append('lastPeriodStart', lastPeriodStart)
    formData.append('healthConsent', 'true')

    let res: Response
    try {
      res = await fetch('/api/portal/upload-blood-panel', { method: 'POST', body: formData })
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setUploading(false)
      return
    }

    if (!res.ok) {
      if (res.status === 413) {
        setError('Your file is too large to upload. Try a smaller PDF or a photo of the page instead.')
      } else {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? `Upload failed (status ${res.status}). Please try again, or contact your coach.`)
      }
      setUploading(false)
      return
    }

    setDone(true)
    setUploading(false)
    setTimeout(() => router.refresh(), 1200)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#DCDCD7] bg-[#F2F2EF] p-6 text-center">
        <p className="text-sm font-semibold text-[#0F1115] mb-1">Results received</p>
        <p className="text-xs text-[#6E747D] leading-relaxed">
          Thank you. Your coach has been notified and will review your results. Nothing changes in your plan until they have looked them over.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label
        className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
          file ? 'border-[#0F1115]/40 bg-[#F2F2EF]' : missingFile ? 'border-[#E8C9C9] bg-[#FBF1F1]' : 'border-[#E4E4E0] bg-[#FFFFFF] hover:border-[#DCDCD7]'
        }`}
      >
        <input type="file" accept="image/*,.pdf" onChange={e => handleFilePick(e.target.files?.[0] ?? null)} className="hidden" />
        {optimising ? (
          <div className="flex items-center gap-3 px-4">
            <div className="w-5 h-5 border-2 border-[#0F1115] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#6E747D] text-sm">Optimising photo...</span>
          </div>
        ) : file ? (
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-[#0F1115] mb-1">{file.name}</p>
            <p className="text-xs text-[#9CA2AB]">{(file.size / 1024 / 1024).toFixed(2)} MB · tap to change</p>
          </div>
        ) : (
          <div className="text-center px-4">
            <svg className={`w-8 h-8 mx-auto mb-2 ${missingFile ? 'text-[#8F2D2D]' : 'text-[#9CA2AB]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className={`text-sm ${missingFile ? 'text-[#8F2D2D]' : 'text-[#6E747D]'}`}>Tap to upload photo or PDF</p>
            <p className="text-xs text-[#9CA2AB] mt-1">Photos are optimised automatically. PDFs must be under 4 MB.</p>
          </div>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#9CA2AB] mb-1.5">Lab (optional)</label>
          <input
            type="text"
            value={labName}
            onChange={e => setLabName(e.target.value)}
            placeholder="e.g. QML, Sullivan Nicolaides"
            className="w-full rounded-xl border border-[#E4E4E0] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#0F1115] placeholder:text-[#9CA2AB] focus:border-[#0F1115] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#9CA2AB] mb-1.5">Date taken (optional)</label>
          <input
            type="date"
            value={collectedOn}
            onChange={e => setCollectedOn(e.target.value)}
            className="w-full rounded-xl border border-[#E4E4E0] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#0F1115] focus:border-[#0F1115] focus:outline-none"
          />
        </div>
      </div>

      {/* Cycle context. Labs print four reference ranges for the hormone markers,
          one per cycle phase, so without this those results cannot be read at
          all. Optional and self-gating: anyone it does not apply to leaves it
          blank. Left empty is not the same as unknown: the upload route falls
          back to the date her weekly check-in keeps current on her record, so
          most of the time this does not need answering twice. */}
      <div>
        <label className="block text-[12px] font-medium text-[#9CA2AB] mb-1.5">
          First day of your last period (optional)
        </label>
        <input
          type="date"
          value={lastPeriodStart}
          onChange={e => setLastPeriodStart(e.target.value)}
          className="w-full rounded-xl border border-[#E4E4E0] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#0F1115] focus:border-[#0F1115] focus:outline-none"
        />
        <p className="mt-1.5 text-[12px] text-[#9CA2AB] leading-relaxed">
          Only if it applies to you. Some hormone results are read against a different normal range depending on where you are in your cycle, so without this a few of them cannot be read properly at all.
        </p>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#9CA2AB] mb-1.5">Anything to add (optional)</label>
        <textarea
          value={clientNote}
          onChange={e => setClientNote(e.target.value)}
          rows={2}
          placeholder="e.g. my GP ordered these for fatigue"
          className="w-full rounded-xl border border-[#E4E4E0] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#0F1115] placeholder:text-[#9CA2AB] focus:border-[#0F1115] focus:outline-none resize-none"
        />
      </div>

      <div className="space-y-3 pt-1">
        <CollectionNotice compact />
        <HealthConsent
          checked={consented}
          onChange={v => { setConsented(v); if (v) setConsentMissing(false) }}
          label="I agree to Body Recode holding this blood test result and using it to shape my coaching. I understand my doctor is the one who interprets it medically."
        />
        {consentMissing && (
          <p className="text-[13px] font-medium text-[#8F2D2D]">Please tick this before uploading.</p>
        )}
      </div>

      {error && <p className="text-[#8F2D2D] text-sm">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-[#0F1115] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#000000] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading…' : 'Submit results'}
      </button>
    </form>
  )
}
