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
]

export default function ProfileSidebar({ clientId }: { clientId: string }) {
  const [active, setActive] = useState('overview')
  const pathname = usePathname()
  const isProfilePage = pathname === `/dashboard/clients/${clientId}`

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

  const isDirectionPage = pathname === `/dashboard/clients/${clientId}/direction`

  return (
    <div className="w-40 shrink-0">
      <nav className="sticky top-8 space-y-0.5">
        {SCROLL_SECTIONS.map(({ id, title }) => (
          isProfilePage ? (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active === id
                  ? 'bg-teal-500/10 text-teal-400'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              {title}
            </button>
          ) : (
            <Link
              key={id}
              href={`/dashboard/clients/${clientId}#${id}`}
              className="block w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 transition-colors"
            >
              {title}
            </Link>
          )
        ))}
        <div className="border-t border-stone-800 my-1" />
        <Link
          href={`/dashboard/clients/${clientId}/direction`}
          className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isDirectionPage
              ? 'bg-teal-500/10 text-teal-400'
              : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
          }`}
        >
          Direction
        </Link>
      </nav>
    </div>
  )
}
