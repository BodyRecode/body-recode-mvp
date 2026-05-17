'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [width, setWidth] = useState<number>(800)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      {error ? (
        <div className="p-6 text-sm text-red-300 bg-red-950/30 border border-red-900/40 rounded-lg">
          Could not render PDF in-browser ({error}). Use the &ldquo;Open in new tab&rdquo; link above to download it.
        </div>
      ) : (
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={err => setError(err.message)}
          loading={<div className="p-6 text-sm text-stone-400">Loading PDF…</div>}
          className="flex flex-col gap-3"
        >
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="rounded-lg overflow-hidden border border-stone-700 bg-white"
            />
          ))}
        </Document>
      )}
    </div>
  )
}
