'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Download, Loader2 } from 'lucide-react'

const SCREEN_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export default function PortalReadingDownload({
  backHref,
  pdfHref,
  filename,
}: {
  backHref: string
  pdfHref: string
  filename: string
}) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadPdf = async () => {
    if (downloading) return
    setError(null)
    setDownloading(true)
    try {
      const res = await fetch(pdfHref, { credentials: 'include' })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Could not generate PDF')
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="no-print sticky top-0 z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E5E5',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[12px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          style={{ fontFamily: SCREEN_FONT }}
        >
          <ChevronLeft size={13} /> Back to portal
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {error && (
            <span style={{ fontSize: 11, color: '#DC2626', fontFamily: SCREEN_FONT }}>{error}</span>
          )}
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 transition-colors"
            style={{
              background: downloading ? '#1056D6' : '#1B6DFC',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: SCREEN_FONT,
              cursor: downloading ? 'wait' : 'pointer',
              letterSpacing: '0.04em',
              borderRadius: 8,
            }}
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
