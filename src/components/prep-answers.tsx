/**
 * Pre-call form answers, laid out to be read.
 *
 * `/api/book-prep` stores the answers as one labelled text blob on the lead
 * timeline ("#1 goal: ...\nBiggest frustration: ..."), which is fine for an
 * email but unreadable on screen — it renders as an eight-line paragraph you
 * have to hunt through mid-call. This parses the labels back out and gives each
 * field its own block, with the stats lifted into chips.
 *
 * Parsing rather than reading the structured answers directly because the blob
 * is what gets persisted; the original object is not stored anywhere.
 */

const FIELDS: Array<{ label: string; title: string; hint?: string }> = [
  { label: '#1 goal', title: 'What they most want to change' },
  { label: 'Biggest frustration', title: 'Biggest frustration' },
  { label: 'Already tried', title: 'Already tried', hint: 'Do not re-prescribe any of this' },
  { label: 'Normal week', title: 'A normal week' },
  { label: 'Other', title: 'Injuries, medications, anything else' },
]

interface Parsed {
  stats: string[]
  fields: Array<{ title: string; hint?: string; lines: string[] }>
  unlabelled: string[]
}

function parse(notes: string): Parsed {
  const labels = [...FIELDS.map(f => f.label), 'Stats']
  const buckets: Record<string, string[]> = {}
  const unlabelled: string[] = []
  let current: string | null = null

  for (const raw of notes.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const hit = labels.find(l => line.toLowerCase().startsWith(`${l.toLowerCase()}:`))
    if (hit) {
      current = hit
      const rest = line.slice(hit.length + 1).trim()
      buckets[hit] = rest ? [rest] : []
      continue
    }
    if (current) buckets[current].push(line)
    else unlabelled.push(line)
  }

  const statsRaw = (buckets['Stats'] ?? []).join(', ')
  const stats = statsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const fields = FIELDS
    .filter(f => buckets[f.label]?.length)
    .map(f => ({ title: f.title, hint: f.hint, lines: buckets[f.label] }))

  return { stats, fields, unlabelled }
}

export default function PrepAnswers({ notes, compact = false }: { notes: string; compact?: boolean }) {
  const { stats, fields, unlabelled } = parse(notes)

  // Nothing matched the expected labels — show it raw rather than hiding it.
  if (!fields.length && !stats.length) {
    return (
      <pre className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans">{notes}</pre>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stats.map(s => (
            <span key={s} className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#F4F4F4] text-[#3A3A3A] border border-[#E5E5E5]">
              {s}
            </span>
          ))}
        </div>
      )}

      {fields.map(f => (
        <div key={f.title}>
          <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-[0.14em] mb-1.5">
            {f.title}
            {f.hint && <span className="text-[#999999] font-semibold normal-case tracking-normal"> · {f.hint}</span>}
          </p>
          <div className="space-y-1">
            {f.lines.map((l, i) => (
              <p key={i} className="text-[14px] leading-relaxed text-[#3A3A3A]">{l}</p>
            ))}
          </div>
        </div>
      ))}

      {unlabelled.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">Also said</p>
          {unlabelled.map((l, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-[#3A3A3A]">{l}</p>
          ))}
        </div>
      )}
    </div>
  )
}
