/**
 * Read an API response without assuming it is JSON.
 *
 * Every generation route in the dashboard called `await res.json()` before
 * checking `res.ok`. That is fine until the platform itself answers instead of
 * the route: a function timeout, a cold-start failure or a gateway error
 * returns an HTML page, `res.json()` throws on the first character, and the
 * coach sees
 *
 *   Unexpected token 'A', "An error o"... is not valid JSON
 *
 * which tells them nothing except that something broke. Vicki's program
 * generation failed exactly this way on 2026-07-29 after the clinical engines
 * moved to Sonnet, which is slower than Haiku and pushed a three-attempt retry
 * loop past the 300 second function limit.
 *
 * This returns the parsed body when there is one and an honest, human sentence
 * when there is not.
 */
export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean
  status: number
  data: T | null
  /** Present when the call failed. Safe to show a coach directly. */
  error: string | null
}

export async function parseApiResponse<T = Record<string, unknown>>(
  res: Response
): Promise<ApiResult<T>> {
  const raw = await res.text()

  let data: T | null = null
  try {
    data = raw ? (JSON.parse(raw) as T) : null
  } catch {
    data = null
  }

  if (data !== null) {
    const err = (data as { error?: unknown }).error
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? null : (typeof err === 'string' ? err : `Request failed (${res.status}).`),
    }
  }

  // Not JSON. Name what actually happened rather than echoing the HTML.
  return { ok: false, status: res.status, data: null, error: describeNonJson(res.status, raw) }
}

function describeNonJson(status: number, raw: string): string {
  if (status === 504 || status === 408 || /timed? ?out/i.test(raw)) {
    return 'The generation took too long and the server cut it off. This usually means the request was unusually large. Try again, and if it keeps happening the block may need splitting.'
  }
  if (status === 502 || status === 503) {
    return 'The server was unavailable while generating. Nothing was saved. Try again in a moment.'
  }
  if (status === 401 || status === 403) {
    return 'Your session has expired. Refresh the page and sign in again.'
  }
  if (status === 413) {
    return 'The request was too large to process.'
  }
  return `The server returned an unexpected response (${status}). Nothing was saved.`
}
