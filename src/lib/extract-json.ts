/**
 * Extract the first top-level JSON object from text the model emits.
 *
 * The previously-common pattern across 15 routes was
 *   const m = text.match(/\{[\s\S]*\}/)
 *   JSON.parse(m[0])
 * which is a GREEDY match — first `{` to LAST `}` in the response. When
 * the model adds prose alongside JSON containing curly braces (e.g.
 * "the {window} stays steady", a code-fenced example, or a stray brace
 * inside a comment), the regex over-captures and JSON.parse dies with
 * "Unexpected non-whitespace character after JSON at position N" or
 * "Expected ',' or '}' after array element."
 *
 * This walker:
 *  - Prefers scanning inside a ```json (or bare ```) fence if present
 *    (unambiguous "JSON starts here" marker)
 *  - Falls back to first `{` if no fence
 *  - Counts braces with proper string-literal + escape handling
 *  - Returns exactly the substring from the opening `{` to its matching `}`
 *  - Returns null if no balanced object is found
 *
 * Callers should JSON.parse the result inside a try/catch and surface a
 * useful error to the coach if parsing still fails (rare — usually means
 * the model truncated mid-object).
 */
export function extractFirstJsonObject(text: string): string | null {
  if (typeof text !== 'string' || text.length === 0) return null

  // Prefer scanning inside a ```json (or bare ```) fence if one exists.
  const fenceMatch = text.match(/```(?:json)?\s*\n/)
  const scanStart = fenceMatch && typeof fenceMatch.index === 'number'
    ? fenceMatch.index + fenceMatch[0].length
    : 0

  const start = text.indexOf('{', scanStart)
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (inString) {
      if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}
