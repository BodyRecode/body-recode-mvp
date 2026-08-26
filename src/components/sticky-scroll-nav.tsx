'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  title: string
}

/**
 * In-page section nav for long records (training program, macro plan).
 *
 * Both the offsets here assume a sticky page header above: the rail parks
 * below it rather than sliding under it, and the observer ignores the band
 * the header covers, so a section is not marked active while it is hidden.
 * The scroll landing itself is handled once, globally, by scroll-padding-top
 * on <html> - see globals.css.
 */
export default function StickyScrollNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-104px 0px -65% 0px', threshold: 0 }
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
      <nav className="sticky top-[104px] space-y-0.5">
        {sections.map(({ id, title }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            aria-current={active === id ? 'true' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              active === id
                ? 'bg-[rgba(27,109,252,0.09)] text-[#1B6DFC] font-medium'
                : 'text-[#666D7A] hover:text-[#141821] hover:bg-[#F4F6F9]'
            }`}
          >
            {title}
          </button>
        ))}
      </nav>
    </div>
  )
}
