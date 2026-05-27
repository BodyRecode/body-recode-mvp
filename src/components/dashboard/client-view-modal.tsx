'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'

/**
 * Client View Modal
 *
 * Coach-side preview of a portal page. Opens an iframe inside a modal overlay
 * so the coach can see exactly what the client sees WITHOUT leaving the
 * coach dashboard. Triggered by buttons in the reading panels (FR, Program,
 * Nutrition).
 *
 * The portal pages are token-authenticated via URL param (not session
 * cookies), so they render correctly inside an iframe without auth issues.
 *
 * Pressing Esc, clicking the backdrop, or clicking the X button closes the
 * modal and returns the coach to wherever they were on the dashboard with
 * no state lost.
 */
export default function ClientViewModal({
  portalUrl,
  title,
  triggerLabel = 'Client view',
  triggerClassName,
}: {
  portalUrl: string
  title: string
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Esc closes the modal
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => { setLoading(true); setOpen(true) }}
        className={triggerClassName ?? 'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)] text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.18)] transition-colors'}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 shrink-0">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Client preview</p>
                <p className="text-sm font-semibold text-stone-900 truncate">{title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 transition-colors px-2 py-1"
                  title="Open in new tab"
                >
                  <ExternalLink size={12} /> Open in tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                  className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Iframe body */}
            <div className="relative flex-1 bg-stone-50">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="ml-2 text-xs">Loading client preview…</span>
                </div>
              )}
              <iframe
                src={portalUrl}
                title={`Client preview — ${title}`}
                className="w-full h-full"
                onLoad={() => setLoading(false)}
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 shrink-0">
              You&apos;re looking at the client&apos;s portal exactly as they see it. Closing this preview returns you to the coach dashboard.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
