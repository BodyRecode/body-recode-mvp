'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logoUrl, brand } from '@/config/tenant'

/**
 * The coach sign-in.
 *
 * 21 September 2026. It was a white page with a logo, two boxes and a button,
 * and it is the first thing a pilot coach ever sees. Kade, plainly: "its flat
 * and boring".
 *
 * WHAT THE REDESIGN IS ACTUALLY FOR, beyond looking better. A coach arriving
 * for the first time has been told about this in a conversation and has no
 * picture of it. The left side says what they are signing in to, in the three
 * beats the product actually has: the intake becomes a read, the check-in
 * becomes a weekly read, twelve weeks becomes proof. Somebody who reads only
 * that and never signs in still understands what we sell.
 *
 * LANGUAGE STAYS UNIVERSAL. Kade, 21 Sep: the pilot coaches and he both train
 * men. Ninety-three per cent of the audience being women is a fact about who
 * arrives, not a licence to write as though the other seven per cent do not
 * exist, and a coach reading "her" on every line is being told the product is
 * not for half their book.
 *
 * Dark on purpose, matching the panels built the same day. It also does the
 * quiet work of not looking like the fitness software they already have.
 */
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
      // Today rather than the Live view: Live is the owner's business overview,
      // and a coach would be bounced straight off it.
      router.push('/dashboard/today')
    }
  }

  const field =
    'w-full bg-[#141922] border border-[#262D3A] text-white rounded-xl px-4 py-3.5 text-[15px] ' +
    'placeholder:text-[#5B6474] focus:outline-none focus:border-[#3D7DFF] focus:bg-[#171D27] transition-colors'

  return (
    <div className="min-h-screen bg-[#090C11] text-white flex flex-col lg:flex-row">
      {/* What they are signing in to. Stacked above the form on a phone, which
          is where a coach reading an invitation email will open it. */}
      <div className="lg:w-[48%] lg:min-h-screen flex flex-col justify-center px-7 sm:px-12 lg:px-16 pt-14 pb-10 lg:py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(90rem 50rem at 8% 0%, rgba(61,125,255,0.16), transparent 58%), radial-gradient(60rem 40rem at 90% 100%, rgba(56,178,172,0.10), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl('dark')} width="200" alt={brand().name} className="mb-11 opacity-95" />

          <p className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.18em', color: '#6C7788' }}>
            Coach sign in
          </p>
          <h1 className="text-[30px] sm:text-[36px] leading-[1.12] font-semibold tracking-[-0.02em] mt-3 mb-9">
            Read the body,<br />then read the week.
          </h1>

          <div className="space-y-5">
            {[
              ['An intake becomes a read', 'A long assessment turned into one written interpretation of what is actually going on.'],
              ['A check-in becomes a weekly read', 'Every week, what they report is read back against their own baseline rather than against a target.'],
              ['Twelve weeks becomes proof', 'The re-read sits against the first one, so what changed is visible instead of claimed.'],
            ].map(([title, body], i) => (
              <div key={title} className="flex gap-3.5">
                <span className="mt-[3px] w-6 h-6 shrink-0 rounded-full border border-[#2A3342] flex items-center justify-center text-[11px] font-semibold text-[#7D8798] tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14.5px] font-medium text-[#E8EBF0]">{title}</p>
                  <p className="text-[13px] text-[#828C9C] leading-relaxed mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] text-[#5B6474] mt-11 leading-relaxed">
            You write the training and the food. This reads the person.
          </p>
        </div>
      </div>

      {/* The form. */}
      <div className="lg:w-[52%] lg:min-h-screen flex items-center justify-center px-7 sm:px-12 pb-16 pt-2 lg:py-16 bg-[#0C1017] lg:border-l border-[#181E28]">
        <div className="w-full max-w-[380px]">
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] mb-1.5">Sign in</h2>
          <p className="text-[13.5px] text-[#828C9C] mb-8">Your clients, your reads, your week.</p>

          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 border border-[#4A2630] bg-[#1C1216]"
              role="alert"
            >
              <p className="text-[13px] text-[#F0A0A0] leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-[#9AA4B4] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@yourgym.com"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-[#9AA4B4] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={field}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B6DFC] text-white font-semibold rounded-xl py-3.5 text-[15px] hover:bg-[#3D7DFF] active:bg-[#1560E0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-[12.5px] text-[#5B6474] mt-8 leading-relaxed">
            Invited and cannot get in? Use the link in your invitation email to set your password, or reply to
            it and we will sort it.
          </p>
        </div>
      </div>
    </div>
  )
}
