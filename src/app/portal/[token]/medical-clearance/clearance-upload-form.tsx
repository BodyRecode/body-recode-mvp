'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearanceUploadForm({ clientId, portalToken }: { clientId: string; portalToken: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)

    const res = await fetch('/api/portal/upload-clearance', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">Upload completed form</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${file ? 'border-teal-400/40 bg-teal-400/5' : 'border-stone-700 bg-stone-900 hover:border-stone-600'}`}>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? (
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-teal-400 mb-1">{file.name}</p>
              <p className="text-xs text-stone-500">{(file.size / 1024 / 1024).toFixed(1)} MB — tap to change</p>
            </div>
          ) : (
            <div className="text-center px-4">
              <svg className="w-8 h-8 text-stone-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-stone-400">Tap to upload photo or PDF</p>
              <p className="text-xs text-stone-600 mt-1">JPG, PNG or PDF — max 10MB</p>
            </div>
          )}
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading…' : 'Submit completed form'}
        </button>
      </form>
    </div>
  )
}
