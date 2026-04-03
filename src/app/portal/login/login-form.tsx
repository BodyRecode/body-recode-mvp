'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ redirect }: { redirect: string }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const callbackUrl = new URL('/portal/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirect', redirect)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-stone-400 text-sm leading-relaxed">
          We sent a sign-in link to <span className="text-white font-medium">{email}</span>.<br />
          Click the link in the email to access your portal.
        </p>
        <p className="text-stone-600 text-xs mt-4">Check your spam folder if you don&apos;t see it within a minute.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-stone-400 mb-2">Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-stone-900 border border-stone-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !email.trim()}
        className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 disabled:bg-stone-800 disabled:text-stone-600 text-black font-bold text-sm rounded-2xl transition-colors"
      >
        {submitting ? 'Sending...' : 'Send sign-in link'}
      </button>
    </form>
  )
}
