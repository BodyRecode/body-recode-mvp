'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img
            src="https://bodyrecode.au/logo-black.png"
            width="280"
            alt="Body Recode"
            className="mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Coach Portal</h1>
          <p className="text-[#6B6B6B] text-sm">Sign in to your coaching dashboard.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#999999] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] text-[#1A1A1A] rounded-xl px-3.5 py-3 text-sm placeholder:text-[#C4C4C4] focus:outline-none focus:border-[#1B6DFC] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#999999] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] text-[#1A1A1A] rounded-xl px-3.5 py-3 text-sm placeholder:text-[#C4C4C4] focus:outline-none focus:border-[#1B6DFC] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B6DFC] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#5390FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
