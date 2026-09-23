'use client'

import { useEffect, useState } from 'react'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import ClientListColumn, { type ClientListEntry } from './client-list-column'

/**
 * The client list beside a record, and the ability to put it away.
 *
 * WHY. Kade, 23 Sep 2026: "i thought we said the whole screen shoiuld be used
 * like in the screen /dashboard/today". He was right, and the reason this page
 * felt narrower than Today is that it has THREE columns rather than two: the
 * section rail, this list, and the record. On a laptop that is 480px gone
 * before the record starts.
 *
 * The list is genuinely useful when working down a book of clients one at a
 * time, so it is not deleted, it is put away. Closed by default, because the
 * common case is arriving at one client from Today or from search, and the rail
 * already carries a jump-to-anything search. Open it and it stays open, per
 * browser.
 *
 * Closed leaves a 26px strip rather than nothing, because a control that
 * vanishes completely is a feature nobody finds twice.
 */
export default function ClientsPane({
  clients,
  children,
}: {
  clients: ClientListEntry[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try { setOpen(window.localStorage.getItem('br.clientList') === 'open') } catch { /* private window */ }
    setReady(true)
  }, [])

  function toggle() {
    setOpen(prev => {
      const next = !prev
      try { window.localStorage.setItem('br.clientList', next ? 'open' : 'closed') } catch { /* private window */ }
      return next
    })
  }

  return (
    <div
      className={open ? 'xl:grid xl:grid-cols-[244px_minmax(0,1fr)] xl:gap-7' : 'xl:grid xl:grid-cols-[26px_minmax(0,1fr)] xl:gap-4'}
      // Until localStorage has been read the pane renders closed, which is the
      // default anyway, so there is no flash of a list that then disappears.
      data-ready={ready ? 'yes' : 'no'}
    >
      {open ? (
        <div className="hidden xl:block print:hidden">
          <button
            type="button"
            onClick={toggle}
            className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-[#676D76] hover:text-[#FAFAF8] transition-colors"
            aria-label="Hide the client list"
          >
            <PanelLeftClose size={13} /> Hide list
          </button>
          <ClientListColumn clients={clients} />
        </div>
      ) : (
        <div className="hidden xl:flex print:hidden justify-center pt-1">
          <button
            type="button"
            onClick={toggle}
            className="h-[26px] w-[26px] rounded-lg border border-[#2A2F39] bg-[#14171D] text-[#676D76] hover:text-[#FAFAF8] hover:border-[#4A4F57] transition-colors flex items-center justify-center sticky top-4"
            aria-label="Show the client list"
            title="Show the client list"
          >
            <PanelLeftOpen size={13} />
          </button>
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
