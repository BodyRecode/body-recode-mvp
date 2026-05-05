'use client'

import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'

export default function PrintTrigger({ backHref }: { backHref?: string }) {
  return (
    <div
      className="no-print sticky top-0 z-50"
      style={{
        background: 'rgba(12, 10, 9, 0.78)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1c1917',
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
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-[12px] text-[#a8a29e] hover:text-white transition-colors"
            style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}
          >
            <ChevronLeft size={13} /> Back to client
          </Link>
        ) : (
          <span />
        )}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 transition-colors"
          style={{
            background: '#14b8a6',
            color: '#0c0a09',
            border: 'none',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            borderRadius: 8,
          }}
        >
          <Download size={13} />
          Download PDF
        </button>
      </div>
    </div>
  )
}
