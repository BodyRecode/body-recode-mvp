'use client'

import { useState, useMemo, type ReactNode } from 'react'

interface PreCallReadProps {
  leadId: string
  initialBrief: string | null
}

type Block =
  | { kind: 'section'; title: string; id: string }
  | { kind: 'label'; text: string }
  | { kind: 'script'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'conditional'; text: string }
  | { kind: 'list'; lines: string[] }
  | { kind: 'body'; text: string }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const DIVIDER = /^[=\u2550\u2500-]{3,}$/

function isSectionHeader(line: string) {
  const t = line.trim()
  if (t.length < 3 || t.length > 80) return false
  if (DIVIDER.test(t)) return false
  // Ignore any parenthetical when testing for caps, so "KEY LINES (in your
  // pocket)" and "IF THEY DON'T PROCEED (Path A or B)" still read as headers
  // rather than falling through to body copy.
  const letters = t.replace(/\([^)]*\)/g, '').replace(/[^A-Za-z]/g, '')
  if (letters.length < 3) return false
  return letters === letters.toUpperCase()
}

function parseBrief(brief: string): Block[] {
  const blocks: Block[] = []
  const lines = brief.split('\n')

  let i = 0
  let afterDivider = false
  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (!trimmed) {
      i++
      continue
    }

    if (DIVIDER.test(trimmed)) {
      afterDivider = true
      i++
      continue
    }

    if (isSectionHeader(trimmed)) {
      if (afterDivider || blocks.length === 0) {
        blocks.push({ kind: 'section', title: trimmed, id: slugify(trimmed) })
      } else {
        blocks.push({ kind: 'label', text: trimmed })
      }
      afterDivider = false
      i++
      continue
    }
    afterDivider = false

    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !DIVIDER.test(lines[i].trim()) && !isSectionHeader(lines[i].trim())) {
      para.push(lines[i])
      i++
    }
    const text = para.join('\n').trim()
    if (!text) continue

    if (text.startsWith('(') && text.endsWith(')')) {
      blocks.push({ kind: 'note', text: text.slice(1, -1).trim() })
      continue
    }

    if (text.startsWith('"') && text.endsWith('"')) {
      blocks.push({ kind: 'script', text: text.replace(/^"|"$/g, '').trim() })
      continue
    }

    if (/^If (she|he|they)|^When (she|he|they)/i.test(text)) {
      blocks.push({ kind: 'conditional', text })
      continue
    }

    const looksLikeList = para.length >= 2 && para.every(l => /^\s*(\d+\.|-|\*)\s/.test(l) || l.trim() === '')
    if (looksLikeList) {
      blocks.push({ kind: 'list', lines: para.map(l => l.replace(/^\s*(\d+\.|-|\*)\s/, '').trim()).filter(Boolean) })
      continue
    }

    blocks.push({ kind: 'body', text })
  }

  return blocks
}

export default function PreCallRead({ leadId, initialBrief }: PreCallReadProps) {
  const [brief, setBrief] = useState(initialBrief ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(initialBrief ?? '')
  const [collapsed, setCollapsed] = useState<Record<string, boolean> | null>(null)

  const blocks = useMemo(() => parseBrief(brief), [brief])
  const sections = useMemo(() => blocks.filter(b => b.kind === 'section') as Extract<Block, { kind: 'section' }>[], [blocks])

  // Default: everything shut. The card above already carries what you need at a
  // glance, so this layer is for when you go looking for a specific thing.
  const collapsedState = useMemo(() => {
    if (collapsed) return collapsed
    return Object.fromEntries(sections.map(s => [s.id, true]))
  }, [collapsed, sections])

  const allOpen = sections.length > 0 && sections.every(s => !collapsedState[s.id])

  function setAll(open: boolean) {
    setCollapsed(Object.fromEntries(sections.map(s => [s.id, !open])))
  }

  function openSection(id: string) {
    setCollapsed({ ...collapsedState, [id]: false })
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pre_call_brief: draft }),
    })
    setSaving(false)
    if (res.ok) {
      setBrief(draft)
      setEditing(false)
    }
  }

  function startEdit() {
    setDraft(brief)
    setEditing(true)
  }

  function cancel() {
    setDraft(brief)
    setEditing(false)
  }

  function toggleSection(id: string) {
    setCollapsed({ ...collapsedState, [id]: !collapsedState[id] })
  }

  function renderBlocks() {
    const out: ReactNode[] = []
    let suppressed = false

    blocks.forEach((b, i) => {
      if (b.kind === 'section') {
        suppressed = !!collapsedState[b.id]
        out.push(
          <div key={i} id={b.id} className="flex items-center gap-3 pt-6 first:pt-0 scroll-mt-20">
            <button
              onClick={() => toggleSection(b.id)}
              className="flex items-center gap-2 group"
            >
              <span className={`text-[#4A4A4A] group-hover:text-[#6B6B6B] transition-colors text-xs font-mono ${suppressed ? '' : 'rotate-90'} transform inline-block`}>▶</span>
              <h3 className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">
                {b.title}
              </h3>
            </button>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>
        )
        return
      }

      if (suppressed) return

      if (b.kind === 'label') {
        out.push(
          <p key={i} className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.1em] pt-3 ml-1">
            {b.text}
          </p>
        )
        return
      }

      if (b.kind === 'script') {
        out.push(
          <div key={i} className="bg-blue-50 border-l-2 border-[#1B6DFC] rounded-r-lg pl-4 pr-4 py-3 ml-1">
            <p className="text-[#1A1A1A] text-sm leading-relaxed whitespace-pre-line">&ldquo;{b.text}&rdquo;</p>
          </div>
        )
        return
      }

      if (b.kind === 'note') {
        out.push(
          <div key={i} className="ml-1 px-3 py-2">
            <p className="text-[#999999] text-xs leading-relaxed italic whitespace-pre-line">{b.text}</p>
          </div>
        )
        return
      }

      if (b.kind === 'conditional') {
        out.push(
          <div key={i} className="bg-amber-50 border-l-2 border-amber-300 rounded-r-lg pl-4 pr-4 py-3 ml-1">
            <p className="text-[#1A1A1A] text-sm leading-relaxed whitespace-pre-line">{b.text}</p>
          </div>
        )
        return
      }

      if (b.kind === 'list') {
        out.push(
          <ul key={i} className="ml-1 space-y-1.5 pl-2">
            {b.lines.map((l, j) => (
              <li key={j} className="text-[#3A3A3A] text-sm leading-relaxed flex gap-2">
                <span className="text-[#1B6DFC] flex-shrink-0">·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        )
        return
      }

      out.push(
        <p key={i} className="text-[#3A3A3A] text-sm leading-relaxed whitespace-pre-line ml-1">
          {b.text}
        </p>
      )
    })

    return out
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
            <h2 className="text-[11px] font-bold text-[#1B6DFC] uppercase" style={{ letterSpacing: '0.14em' }}>Pre-Call Read</h2>
          </div>
          <p className="text-[#6B6B6B] text-sm">
            Lead-specific brief for this call. Their pattern, what to listen for, lines to have ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={cancel}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="text-sm font-bold px-4 py-2 border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-blue-50 transition-colors"
            >
              {brief ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Paste or write the pre-call brief for this lead. Pattern, hot spot triggers, key lines..."
          className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-4 text-[#1A1A1A] text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D4D4D4] placeholder-[#999999]"
          style={{ minHeight: '480px' }}
        />
      ) : brief ? (
        <div className="space-y-4">
          {sections.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-4 border-b border-[#E5E5E5]">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => openSection(s.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                    collapsedState[s.id]
                      ? 'bg-[#F4F4F4] border-[#E5E5E5] text-[#6B6B6B] hover:border-[#1B6DFC] hover:text-[#1B6DFC]'
                      : 'bg-blue-50 border-[#B5CFFC] text-[#1B6DFC]'
                  }`}
                >
                  {s.title}
                </button>
              ))}
              <button
                onClick={() => setAll(!allOpen)}
                className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
              >
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}
          <div className="space-y-3">
            {renderBlocks()}
          </div>

          <div className="pt-4 mt-2 border-t border-[#E5E5E5] flex flex-wrap gap-3 text-[11px] text-[#4A4A4A]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#1B6DFC] rounded-sm" />
              What you say
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-400 rounded-sm" />
              Conditional response
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#999999] italic">italic</span>
              Coach note
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-dashed rounded-lg p-6 text-center">
          <p className="text-[#999999] text-sm">No pre-call read written yet for this lead.</p>
          <p className="text-[#4A4A4A] text-xs mt-1">Click Add to write one.</p>
        </div>
      )}
    </div>
  )
}
