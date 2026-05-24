'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage, MAX_UPLOAD_BYTES } from '@/lib/compress-image'

export default function ClearanceUploadForm({ clientId, portalToken: _portalToken }: { clientId: string; portalToken: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [optimising, setOptimising] = useState(false)
  const [error, setError] = useState('')
  const [missingFile, setMissingFile] = useState(false)

  async function handleFilePick(picked: File | null) {
    if (!picked) { setFile(null); return }
    setMissingFile(false)
    setError('')
    if (picked.type.startsWith('image/')) {
      setOptimising(true)
      try {
        const compressed = await compressImage(picked)
        setFile(compressed)
      } finally {
        setOptimising(false)
      }
    } else {
      setFile(picked)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMissingFile(true)
      setError('')
      return
    }
    if (optimising) {
      setError('Your file is still being optimised. Try again in a moment.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`This file is ${(file.size / 1024 / 1024).toFixed(1)} MB, which is too large to upload. PDFs need to be under 4 MB. If it is a scan, try saving it at a lower resolution or take a photo of the form instead.`)
      return
    }
    setMissingFile(false)
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)

    let res: Response
    try {
      res = await fetch('/api/portal/upload-clearance', {
        method: 'POST',
        body: formData,
      })
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setUploading(false)
      return
    }

    if (!res.ok) {
      if (res.status === 413) {
        setError('Your file is too large to upload. Try a smaller PDF or take a photo of the form instead.')
      } else {
        setError(`Upload failed (status ${res.status}). Please try again, or contact your coach if it keeps happening.`)
      }
      setUploading(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Upload completed form</p>
      {missingFile && (
        <div className="mb-4 border-l-2 border-red-500 bg-red-50 rounded-r-2xl px-4 py-3">
          <p className="text-red-700 text-sm font-medium">Please upload your completed clearance form before submitting.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
            file
              ? 'border-[#1B6DFC]/40 bg-blue-50'
              : missingFile
              ? 'border-red-400 bg-red-50'
              : 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#D4D4D4]'
          }`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => handleFilePick(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {optimising ? (
            <div className="flex items-center gap-3 px-4">
              <div className="w-5 h-5 border-2 border-[#1B6DFC] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#6B6B6B] text-sm">Optimising photo...</span>
            </div>
          ) : file ? (
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-[#1B6DFC] mb-1">{file.name}</p>
              <p className="text-xs text-[#999999]">{(file.size / 1024 / 1024).toFixed(2)} MB · tap to change</p>
            </div>
          ) : (
            <div className="text-center px-4">
              <svg className={`w-8 h-8 mx-auto mb-2 ${missingFile ? 'text-red-700' : 'text-[#999999]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className={`text-sm ${missingFile ? 'text-red-700' : 'text-[#6B6B6B]'}`}>Tap to upload photo or PDF</p>
              <p className="text-xs text-[#999999] mt-1">Photos are optimised automatically. PDFs must be under 4 MB.</p>
            </div>
          )}
        </label>

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#5390FF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading…' : 'Submit completed form'}
        </button>
      </form>
    </div>
  )
}
