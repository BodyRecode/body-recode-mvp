'use client'

import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'cffs', title: 'CFFS' },
  { id: 'baseline', title: 'Baseline' },
  { id: 'cfws', title: 'CFWS' },
  { id: 'training', title: 'Training' },
  { id: 'nutrition', title: 'Nutrition' },
]

export default function ProfileSidebar() {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-40 shrink-0">
      <nav className="sticky top-8 space-y-0.5">
        {SECTIONS.map(({ id, title }) => (
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
        ))}
      </nav>
    </div>
  )
}
