'use client'

import { useState } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [optimising, setOptimising] = useState(false)
  const [error, setError] = useState('')
  const [missingFile, setMissingFile] = useState(false)
  const [done, setDone] = useState(false)

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
      <div className="rounded-2xl border border-[#B5CFFC] bg-[#EFF5FE] p-6 text-center">
        <p className="text-sm font-semibold text-[#1B6DFC] mb-1">Results received</p>
        <p className="text-xs text-[#666D7A] leading-relaxed">
          Thank you. Your coach has been notified and will review your results. Nothing changes in your plan until they have looked them over.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label
        className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
          file ? 'border-[#1B6DFC]/40 bg-[#EFF5FE]' : missingFile ? 'border-red-400 bg-[#FDEDED]' : 'border-[#E8EAEE] bg-[#FFFFFF] hover:border-[#CFD4DC]'
        }`}
      >
        <input type="file" accept="image/*,.pdf" onChange={e => handleFilePick(e.target.files?.[0] ?? null)} className="hidden" />
        {optimising ? (
          <div className="flex items-center gap-3 px-4">
            <div className="w-5 h-5 border-2 border-[#1B6DFC] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#666D7A] text-sm">Optimising photo...</span>
          </div>
        ) : file ? (
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-[#1B6DFC] mb-1">{file.name}</p>
            <p className="text-xs text-[#98A0AD]">{(file.size / 1024 / 1024).toFixed(2)} MB · tap to change</p>
          </div>
        ) : (
          <div className="text-center px-4">
            <svg className={`w-8 h-8 mx-auto mb-2 ${missingFile ? 'text-[#C82626]' : 'text-[#98A0AD]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className={`text-sm ${missingFile ? 'text-[#C82626]' : 'text-[#666D7A]'}`}>Tap to upload photo or PDF</p>
            <p className="text-xs text-[#98A0AD] mt-1">Photos are optimised automatically. PDFs must be under 4 MB.</p>
          </div>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#98A0AD] mb-1.5">Lab (optional)</label>
          <input
            type="text"
            value={labName}
            onChange={e => setLabName(e.target.value)}
            placeholder="e.g. QML, Sullivan Nicolaides"
            className="w-full rounded-xl border border-[#E8EAEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#141821] placeholder:text-[#C4C4C4] focus:border-[#1B6DFC] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#98A0AD] mb-1.5">Date taken (optional)</label>
          <input
            type="date"
            value={collectedOn}
            onChange={e => setCollectedOn(e.target.value)}
            className="w-full rounded-xl border border-[#E8EAEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#141821] focus:border-[#1B6DFC] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#98A0AD] mb-1.5">Anything to add (optional)</label>
        <textarea
          value={clientNote}
          onChange={e => setClientNote(e.target.value)}
          rows={2}
          placeholder="e.g. my GP ordered these for fatigue"
          className="w-full rounded-xl border border-[#E8EAEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#141821] placeholder:text-[#C4C4C4] focus:border-[#1B6DFC] focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-[#C82626] text-sm">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#1560E0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading…' : 'Submit results'}
      </button>
    </form>
  )
}
