'use client'

import { useState, useMemo } from 'react'

interface PreCallReadProps {
  leadId: string
  initialBrief: string | null
}

type Block =
  | { kind: 'section'; title: string; id: string }
  | { kind: 'script'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'conditional'; text: string }
  | { kind: 'list'; lines: string[] }
  | { kind: 'body'; text: string }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isSectionHeader(line: string) {
  const t = line.trim()
  if (t.length < 3 || t.length > 80) return false
  if (/^=+$/.test(t)) return false
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length < 3) return false
  return letters === letters.toUpperCase()
}

function parseBrief(brief: string): Block[] {
  const blocks: Block[] = []
  const lines = brief.split('\n')

  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (!trimmed) {
      i++
      continue
    }

    if (/^=+$/.test(trimmed)) {
      i++
      continue
    }

    if (isSectionHeader(trimmed)) {
      blocks.push({ kind: 'section', title: trimmed, id: slugify(trimmed) })
      i++
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^=+$/.test(lines[i].trim()) && !isSectionHeader(lines[i].trim())) {
      para.push(lines[i])
      i++
    }
    const text = para.join('\n').trim()
    if (!text) continue

    if (/^\(.+\)$/s.test(text)) {
      blocks.push({ kind: 'note', text: text.replace(/^\(|\)$/g, '').trim() })
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const blocks = useMemo(() => parseBrief(brief), [brief])
  const sections = useMemo(() => blocks.filter(b => b.kind === 'section') as Extract<Block, { kind: 'section' }>[], [blocks])

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
    setCollapsed(c => ({ ...c, [id]: !c[id] }))
  }

  function renderBlocks() {
    const out: React.ReactNode[] = []
    let currentSectionId: string | null = null
    let suppressed = false

    blocks.forEach((b, i) => {
      if (b.kind === 'section') {
        currentSectionId = b.id
        suppressed = !!collapsed[b.id]
        out.push(
          <div key={i} id={b.id} className="flex items-center gap-3 pt-6 first:pt-0 scroll-mt-20">
            <button
              onClick={() => toggleSection(b.id)}
              className="flex items-center gap-2 group"
            >
              <span className={`text-stone-600 group-hover:text-stone-400 transition-colors text-xs font-mono ${suppressed ? '' : 'rotate-90'} transform inline-block`}>▶</span>
              <h3 className="text-xs font-bold text-[#10E1C2] uppercase tracking-widest">
                {b.title}
              </h3>
            </button>
            <div className="flex-1 h-px bg-stone-800" />
          </div>
        )
        return
      }

      if (suppressed) return

      if (b.kind === 'script') {
        out.push(
          <div key={i} className="bg-[#10E1C2]/5 border-l-2 border-[#10E1C2] rounded-r-lg pl-4 pr-4 py-3 ml-1">
            <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">&ldquo;{b.text}&rdquo;</p>
          </div>
        )
        return
      }

      if (b.kind === 'note') {
        out.push(
          <div key={i} className="ml-1 px-3 py-2">
            <p className="text-stone-500 text-xs leading-relaxed italic whitespace-pre-line">{b.text}</p>
          </div>
        )
        return
      }

      if (b.kind === 'conditional') {
        out.push(
          <div key={i} className="bg-amber-400/5 border-l-2 border-amber-400/50 rounded-r-lg pl-4 pr-4 py-3 ml-1">
            <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{b.text}</p>
          </div>
        )
        return
      }

      if (b.kind === 'list') {
        out.push(
          <ul key={i} className="ml-1 space-y-1.5 pl-2">
            {b.lines.map((l, j) => (
              <li key={j} className="text-stone-300 text-sm leading-relaxed flex gap-2">
                <span className="text-[#10E1C2] flex-shrink-0">·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        )
        return
      }

      out.push(
        <p key={i} className="text-stone-300 text-sm leading-relaxed whitespace-pre-line ml-1">
          {b.text}
        </p>
      )
    })

    return out
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Pre-Call Read</h2>
          <p className="text-stone-500 text-sm">
            Lead-specific brief for this call. Their pattern, what to listen for, lines to have ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={cancel}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-sm font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="text-sm font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
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
          className="w-full bg-stone-950 border border-stone-800 rounded-lg p-4 text-stone-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-stone-600 placeholder-stone-700"
          style={{ minHeight: '480px' }}
        />
      ) : brief ? (
        <div className="space-y-4">
          {sections.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-2 pb-4 border-b border-stone-800">
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300 hover:border-[#10E1C2]/40 hover:text-[#10E1C2] transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {renderBlocks()}
          </div>

          <div className="pt-4 mt-2 border-t border-stone-800 flex flex-wrap gap-3 text-[11px] text-stone-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#10E1C2]/40 rounded-sm" />
              What you say
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-400/50 rounded-sm" />
              Conditional response
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-stone-500 italic">italic</span>
              Coach note
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-800 border-dashed rounded-lg p-6 text-center">
          <p className="text-stone-500 text-sm">No pre-call read written yet for this lead.</p>
          <p className="text-stone-600 text-xs mt-1">Click Add to write one.</p>
        </div>
      )}
    </div>
  )
}
