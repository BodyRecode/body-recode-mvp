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
    if (!email.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/portal/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not send code. Try again.')
        setSubmitting(false)
        return
      }
      setStep('code')
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      // Verify our custom code, get a fresh Supabase token_hash back
      const verifyRes = await fetch('/api/portal/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      })
      const verifyData = await verifyRes.json().catch(() => ({}))
      if (!verifyRes.ok) {
        setError(verifyData.error ?? 'That code did not work. Check the email or request a new one.')
        setSubmitting(false)
        return
      }

      // Establish the Supabase session client-side using the fresh token_hash.
      // This token has never been emailed - no scanner could have touched it.
      const supabase = createClient()
      const { data, error: sessionError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: verifyData.token_hash,
      })

      if (sessionError || !data?.session) {
        setError(sessionError?.message ?? 'Sign-in failed. Try again.')
        setSubmitting(false)
        return
      }

      // Where to send them
      if (redirect && redirect.startsWith('/portal/')) {
        router.push(redirect)
        router.refresh()
        return
      }

      try {
        const targetRes = await fetch('/api/portal/redirect-target')
        if (targetRes.ok) {
          const targetData = await targetRes.json()
          if (targetData.url) {
            router.push(targetData.url)
            router.refresh()
            return
          }
        }
      } catch {}

      // Authenticated, but no client record matches this email
      setError(`No client account found for ${email.toLowerCase()}. Contact your coach.`)
      setSubmitting(false)
    } catch {
      setError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-full bg-[#F2F2EF] border border-[#DCDCD7] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#0F1115]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-[#0F1115] mb-1">Enter your sign-in code</h2>
          <p className="text-[#6E747D] text-[13.5px] leading-relaxed">
            We sent a 6-digit code to <span className="text-[#0F1115] font-medium">{email.toLowerCase()}</span>.
          </p>
          {/* Beside every "check your email", always. A code that landed in junk
              and a code that never arrived look identical from here, and the
              client's next move is to message their coach. */}
          <p className="text-[12.5px] text-[#9CA2AB] leading-relaxed mt-2">
            If it is not there in a minute, check your junk or spam folder.
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
            className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-2xl px-4 py-4 text-center text-[20px] tracking-[0.4em] font-mono text-[#0F1115] placeholder-[#9CA2AB] focus:outline-none focus:border-[#0F1115] transition-colors"
          />
        </div>

        {error && (
          <div className="bg-[#FBF1F1] border border-[#E8C9C9] rounded-xl px-4 py-3">
            <p className="text-[13.5px] text-[#8F2D2D]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="w-full py-3.5 bg-[#0F1115] hover:bg-[#000000] disabled:opacity-60 text-[#FAFAF8] font-bold text-[13.5px] rounded-2xl transition-colors"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => { setStep('email'); setCode(''); setError(null) }}
          className="block w-full text-[12.5px] text-[#9CA2AB] hover:text-[#4A4F57] transition-colors text-center"
        >
          ← Use a different email
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div>
        <label className="block text-[12.5px] font-semibold text-[#6E747D] mb-2">Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-2xl px-4 py-3 text-[13.5px] text-[#0F1115] placeholder-[#9CA2AB] focus:outline-none focus:border-[#0F1115] transition-colors"
        />
      </div>

      {error && (
        <div className="bg-[#FBF1F1] border border-[#E8C9C9] rounded-xl px-4 py-3">
          <p className="text-[13.5px] text-[#8F2D2D]">{error}</p>
        </div>
      )}

      {/* IT USED TO ARRIVE GREY. The button was disabled until something was
          typed, so the first thing a client saw on the sign-in page was the
          only action on it, looking switched off. Now it is the button it will
          be, and an empty box is caught by the field's own required check.
          25 Sep 2026. */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-[#0F1115] hover:bg-[#000000] disabled:opacity-60 text-[#FAFAF8] font-bold text-[13.5px] rounded-2xl transition-colors"
      >
        {submitting ? 'Sending…' : 'Email me a sign-in code'}
      </button>

      <p className="text-[12.5px] text-[#9CA2AB] leading-relaxed text-center">
        No password. We email you a six-digit code each time.
      </p>
    </form>
  )
}
