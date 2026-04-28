'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ redirect }: { redirect: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const callbackUrl = new URL('/portal/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirect', redirect)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setStep('code')
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    })

    if (verifyError || !data.session) {
      setError(verifyError?.message ?? 'That code did not work. Check the email or request a new one.')
      setSubmitting(false)
      return
    }

    if (redirect && redirect.startsWith('/portal/')) {
      router.push(redirect)
      router.refresh()
      return
    }

    try {
      const res = await fetch('/api/portal/redirect-target')
      if (res.ok) {
        const json = await res.json()
        if (json.url) {
          router.push(json.url)
          router.refresh()
          return
        }
      }
    } catch {}

    router.push('/portal/login?error=no_client')
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Enter your sign-in code</h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            We sent a 6-digit code to <span className="text-white font-medium">{email}</span>.
          </p>
        </div>

        <div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            required
            className="w-full bg-stone-900 border border-stone-700 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono text-white placeholder-stone-700 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 disabled:bg-stone-800 disabled:text-stone-600 text-black font-bold text-sm rounded-2xl transition-colors"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => { setStep('email'); setCode(''); setError(null) }}
          className="block w-full text-xs text-stone-500 hover:text-stone-300 transition-colors text-center"
        >
          ← Use a different email
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
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
        {submitting ? 'Sending...' : 'Send sign-in code'}
      </button>
    </form>
  )
}
