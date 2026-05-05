'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  title: string
}

export default function StickyScrollNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-40 shrink-0">
      <nav className="sticky top-8 space-y-0.5">
        {sections.map(({ id, title }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              active === id
                ? 'bg-teal-500/10 text-teal-400'
                : 'text-[#57534e] hover:text-[#d4cfc9] hover:bg-[#1c1917]/50'
            }`}
          >
            {title}
          </button>
        ))}
      </nav>
    </div>
  )
}
