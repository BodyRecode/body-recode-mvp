'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SCROLL_SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'cffs', title: 'CFFS' },
  { id: 'baseline', title: 'Baseline' },
  { id: 'cfws', title: 'CFWS' },
  { id: 'training', title: 'Training' },
  { id: 'nutrition', title: 'Nutrition' },
  { id: 'payments', title: 'Payments' },
]

const SECTIONS_BEFORE_DIRECTION = ['overview', 'cffs', 'baseline', 'cfws']
const SECTIONS_AFTER_DIRECTION = ['training', 'nutrition', 'payments']

export default function ProfileSidebar({ clientId }: { clientId: string }) {
  const [active, setActive] = useState('overview')
  const pathname = usePathname()
  const isProfilePage = pathname === `/dashboard/clients/${clientId}`
  const isDirectionPage = pathname === `/dashboard/clients/${clientId}/direction`
  const isRoutinePage = pathname === `/dashboard/clients/${clientId}/routine`
  const isRecoveryPage = pathname === `/dashboard/clients/${clientId}/recovery`

  useEffect(() => {
    if (!isProfilePage) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    SCROLL_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [isProfilePage, clientId])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function renderScrollItem(id: string, title: string) {
    return isProfilePage ? (
      <button
        key={id}
        onClick={() => scrollTo(id)}
        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          active === id
            ? 'bg-blue-50 text-blue-500'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50'
        }`}
      >
        {title}
      </button>
    ) : (
      <Link
        key={id}
        href={`/dashboard/clients/${clientId}#${id}`}
        className="block w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50 transition-colors"
      >
        {title}
      </Link>
    )
  }

  return (
    <div className="w-40 shrink-0">
      <nav className="sticky top-8 space-y-0.5">
        {SECTIONS_BEFORE_DIRECTION.map(id => {
          const section = SCROLL_SECTIONS.find(s => s.id === id)!
          return renderScrollItem(section.id, section.title)
        })}

        <Link
          href={`/dashboard/clients/${clientId}/direction`}
          className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isDirectionPage
              ? 'bg-blue-50 text-blue-500'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50'
          }`}
        >
          Direction
        </Link>

        <div className="border-t border-[#E5E5E5] my-1" />

        {SECTIONS_AFTER_DIRECTION.map(id => {
          const section = SCROLL_SECTIONS.find(s => s.id === id)!
          return renderScrollItem(section.id, section.title)
        })}

        <div className="border-t border-[#E5E5E5] my-1" />

        <Link
          href={`/dashboard/clients/${clientId}/routine`}
          className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isRoutinePage
              ? 'bg-blue-50 text-blue-500'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50'
          }`}
        >
          Daily Sequences
        </Link>

        <Link
          href={`/dashboard/clients/${clientId}/recovery`}
          className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isRecoveryPage
              ? 'bg-blue-50 text-blue-500'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50'
          }`}
        >
          Recovery Protocols
        </Link>
      </nav>
    </div>
  )
}
