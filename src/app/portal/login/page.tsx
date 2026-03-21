'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal/dashboard` },
    })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Client portal</h1>
          <p className="text-stone-400 text-sm">Enter your email to receive a sign-in link.</p>
        </div>

        {sent ? (
          <div className="bg-stone-900 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold mb-2">Check your email</h2>
            <p className="text-stone-400 text-sm">We sent a sign-in link to <span className="text-white">{email}</span>. Tap it to access your portal.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-stone-900 text-white text-base rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 border border-stone-800"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
