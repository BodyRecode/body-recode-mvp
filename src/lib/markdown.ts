/**
 * Minimal markdown-to-HTML renderer for Body Recode program documents.
 * Handles the elements used in these programs only.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // H1
    if (line.startsWith('# ')) {
      output.push(`<h1>${inline(line.slice(2))}</h1>`)
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      output.push(`<h2>${inline(line.slice(3))}</h2>`)
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      output.push(`<h3>${inline(line.slice(4))}</h3>`)
      i++
      continue
    }

    // H4
    if (line.startsWith('#### ')) {
      output.push(`<h4>${inline(line.slice(5))}</h4>`)
      i++
      continue
    }

    // HR
    if (line.trim() === '---') {
      output.push('<hr />')
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      output.push(`<blockquote>${inline(line.slice(2))}</blockquote>`)
      i++
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      output.push(buildTable(tableLines))
      continue
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`)
        i++
      }
      output.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`)
        i++
      }
      output.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('|') && !lines[i].startsWith('- ') && !lines[i].startsWith('* ') && !/^\d+\. /.test(lines[i]) && lines[i] !== '---') {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      output.push(`<p>${inline(paraLines.join(' '))}</p>`)
    }
  }

  return output.join('\n')
}

function buildTable(rows: string[]): string {
  const parsed = rows.map(r =>
    r.split('|').slice(1, -1).map(c => c.trim())
  )
  // Remove separator rows (---|--- pattern)
  const header = parsed[0]
  const body = parsed.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c)))

  const headerHtml = header.map(c => `<th>${inline(c)}</th>`).join('')
  const bodyHtml = body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')

  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
}

function inline(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
}
