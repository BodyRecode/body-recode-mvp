'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import DashboardNav from './nav'
import type { NavBadges } from '@/lib/dashboard-badges'

/**
 * App shell: a rail of every section down the left that never moves, and a
 * content panel on the right. Replaces the top nav whose six hover dropdowns
 * hid roughly forty pages one hover deep.
 */
export default function DashboardShell({
  brandName,
  brandInitials,
  userEmail,
  hint,
  logout,
  badges,
  children,
}: {
  brandName: string
  brandInitials: string
  userEmail?: string
  hint?: ReactNode
  logout?: ReactNode
  badges?: NavBadges
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // The drawer closes on any nav click (onNavigate) and on Escape.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const brandBlock = (
    <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5 min-w-0">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-[11px] font-medium shrink-0"
        style={{
          background: 'linear-gradient(160deg,#4B8DFF,#1B6DFC 55%,#0B4FCB)',
          boxShadow: '0 2px 6px -1px rgba(27,109,252,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
          fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
          letterSpacing: '-0.02em',
        }}
      >
        {brandInitials}
      </span>
      <span className="text-[14px] font-semibold text-[#141821] tracking-[-0.015em] truncate">
        {brandName}
      </span>
    </Link>
  )

  const rail = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-[15px] pt-[15px] pb-3">
        {brandBlock}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden text-[#666D7A] hover:text-[#141821] p-1 -mr-1"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      {hint && <div className="px-3 pb-1.5">{hint}</div>}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DashboardNav onNavigate={() => setDrawerOpen(false)} badges={badges} />
      </div>
      <div className="border-t border-[#E8EAEE] bg-white/60 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#98A0AD] truncate min-w-0">{userEmail}</span>
        {logout}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-[#141821]">
      {/* Mobile bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-[#E8EAEE] bg-white/90 backdrop-blur-xl print:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-[#4A4A4A] hover:text-[#141821] p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        {brandBlock}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 print:hidden">
          <div
            className="absolute inset-0 bg-[#101828]/35"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute inset-y-0 left-0 w-[264px] border-r border-[#E8EAEE] shadow-[0_20px_50px_-20px_rgba(16,24,40,0.45)]"
            style={{ background: 'linear-gradient(180deg,#F8F9FB 0%,#F3F5F8 100%)' }}
          >
            {rail}
          </aside>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[236px_1fr]">
        {/* Rail */}
        <aside
          className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-[#E8EAEE] print:hidden"
          style={{
            background: 'linear-gradient(180deg,#F8F9FB 0%,#F3F5F8 100%)',
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.9)',
          }}
        >
          {rail}
        </aside>

        {/* Panel */}
        <main
          className="min-w-0 px-6 py-8 lg:px-9 lg:py-9 print:p-0"
          style={{ background: 'linear-gradient(180deg,#FDFDFE,#FFFFFF 260px)' }}
        >
          <div className="max-w-[1320px] print:max-w-none">{children}</div>
        </main>
      </div>
    </div>
  )
}
