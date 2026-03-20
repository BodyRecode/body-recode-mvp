'use client'

import { useState } from 'react'

export default function PrintButton({ clientName }: { clientName: string }) {
  const [loading, setLoading] = useState(false)

  async function downloadPdf() {
    setLoading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.getElementById('report-content')
      if (!element) return

      await html2pdf()
        .set({
          margin: 0,
          filename: `${clientName.replace(/\s+/g, '_')}_Performance_Report.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={downloadPdf}
      disabled={loading}
      style={{
        background: '#10E1C2', color: '#0a0a0a', border: 'none', borderRadius: '8px',
        padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
        letterSpacing: '0.02em', opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Generating…' : 'Download PDF'}
    </button>
  )
}
