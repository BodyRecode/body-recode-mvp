'use client'

/**
 * Client-side button that triggers POST /api/portal/log/start-session and
 * routes the user into the live logging UI for the resulting session_completion.
 *
 * - If the session is already completed: shows "View" (read-only logging UI)
 * - If in progress: shows "Resume"
 * - Otherwise: "Start logging"
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  clientId: string
  sessionIndex: number
  weekNumberInBlock: number
  existingCompletionId: string | null
  status: string | null
  variant: 'primary' | 'secondary'
  /** POST target for start-session. Default is the client portal route;
   *  the coach dashboard passes '/api/coach/log/start-session'. */
  startEndpoint?: string
  /** Base path the session id is appended to for navigation. Default is the
   *  client portal log; the coach passes '/dashboard/clients/{id}/train'. */
  logHrefBase?: string
}

export default function StartSessionButton(props: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCompleted = props.status === 'completed'
  const isInProgress = props.status === 'in_progress'

  const label = isCompleted ? 'View logged session' : isInProgress ? 'Resume' : 'Start logging'

  const startEndpoint = props.startEndpoint ?? '/api/portal/log/start-session'
  const logHrefBase = props.logHrefBase ?? `/portal/${props.token}/program/log`

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      // If the session is already created, just navigate
      if (props.existingCompletionId) {
        router.push(`${logHrefBase}/${props.existingCompletionId}`)
        return
      }
      const res = await fetch(startEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: props.token,
          clientId: props.clientId,
          sessionIndex: props.sessionIndex,
          weekNumberInBlock: props.weekNumberInBlock,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not start session')
        return
      }
      router.push(`${logHrefBase}/${data.sessionCompletionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const baseClass = 'block w-full text-center font-semibold rounded-xl transition-colors disabled:opacity-50'
  const sizeClass = props.variant === 'primary' ? 'py-3.5 text-sm' : 'py-2.5 text-xs mt-2'
  const colourClass = isCompleted
    ? 'bg-[#E5E5E5] text-[#3A3A3A] hover:bg-[#262421]'
    : 'bg-[#1B6DFC] text-white hover:bg-[#5390FF]'

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${baseClass} ${sizeClass} ${colourClass}`}
      >
        {loading ? 'Loading…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-700 text-center">{error}</p>}
    </>
  )
}
