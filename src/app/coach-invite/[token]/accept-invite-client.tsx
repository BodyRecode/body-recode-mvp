'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Two states and nothing clever: check the invitation, then set a password.
 *
 * The password rule is stated before they type rather than after they fail,
 * because the alternative is a person being told their password is wrong once
 * they have already chosen it.
 */
export default function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/coach/invitations/accept?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((d: { ok?: boolean; problem?: string; fullName?: string; businessName?: string }) => {
        if (cancelled) return
        if (!d.ok) setProblem(d.problem ?? 'This invitation link is not valid.')
        else {
          setFullName(d.fullName ?? '')
          setBusinessName(d.businessName ?? '')
        }
      })
      .catch(() => { if (!cancelled) setProblem('Could not check this invitation. Try again in a moment.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 10) return setError('Choose a password of at least 10 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setSaving(true)
    try {
      const res = await fetch('/api/coach/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !d.ok) setError(d.error ?? 'Something went wrong. Try again.')
      else {
        setDone(true)
        setTimeout(() => router.push('/login'), 2500)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center text-[#6B6B6B] text-sm">Checking your invitation…</p>

  if (problem) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">This link will not work</h1>
        <p className="text-[#6B6B6B] text-sm leading-relaxed">{problem}</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">You are set up</h1>
        <p className="text-[#6B6B6B] text-sm leading-relaxed">Taking you to the sign-in page. Use your email address and the password you just chose.</p>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-widest mb-4">
          Coach account
        </div>
        <h1 className="text-2xl font-bold mb-2">{fullName ? `Welcome, ${fullName.split(/\s+/)[0]}` : 'Welcome'}</h1>
        <p className="text-[#6B6B6B] text-sm leading-relaxed">
          Set a password for {businessName || 'your account'}. Nobody else knows it, including us.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-[#E8EAEE] text-sm focus:outline-none focus:border-[#1B6DFC]"
            placeholder="At least 10 characters"
          />
          <p className="text-[11.5px] text-[#98A0AD] mt-1.5">
            At least 10 characters. This account can read client health information, so it is worth using a password manager.
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">Password again</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-[#E8EAEE] text-sm focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
        {error && <p className="text-[13px] text-[#C0392B]">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-[#1B6DFC] text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Setting up your account…' : 'Set my password'}
        </button>
      </form>
    </>
  )
}
