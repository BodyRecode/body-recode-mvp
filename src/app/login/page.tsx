'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BrandMark } from '@/components/brand-mark'

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
 *
 * 22 September 2026, the palette pass. First surface converted to graphite and
 * paper. There is no brand colour: see src/lib/brand-tokens.ts. The interest
 * here comes from contrast, scale and space instead, which is the thing that
 * has to be true on every screen for a monochrome identity to work rather than
 * turn into grey soup:
 *
 *   - the sign-in button is PAPER, the brightest thing on the page, because in
 *     a monochrome system the thing you press is the highest contrast thing
 *     rather than the most coloured one
 *   - the neutrals are warm-grey, not blue-grey. The old ones were all shifted
 *     towards blue to sit beside the accent, and with the accent gone they read
 *     cold for no reason
 *   - the wash behind the left panel is paper at 5 per cent, not a colour
 *
 * The one colour on the page is the error state, which is the rule working: it
 * appears only when it means something.
 *
 * SAME DAY, SECOND PASS. Rendered it and looked at it properly. It did not read
 * boring, it read EMPTY: small content sitting in a large dark frame, with dead
 * space above and below both halves. That is the failure mode of a monochrome
 * screen, and it is worth naming because every other surface will meet it.
 * Take colour away without replacing it with anything and you get quiet, and
 * quiet at full-screen size looks like nothing happened.
 *
 * Three fixes, none of them a colour:
 *
 *   1. THE HEADLINE NOW MATCHES THE FRAME IT IS IN. It was 36px in a 900px
 *      space. Scale is what carries a monochrome layout, and polite type in a
 *      big frame is most of what "flat" actually means.
 *   2. THE TWO HALVES ARE PROPERLY APART. They were four points of lightness
 *      from each other, so the split read accidental. Now the left is the
 *      deepest surface on the page and the right is visibly raised off it.
 *   3. THE FORM IS AN OBJECT, NOT FLOATING TEXT. It sits in a bordered card, so
 *      the empty space around it is framing rather than absence.
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
    'w-full bg-[#101319] border border-[#2A2F39] text-[#FAFAF8] rounded-xl px-4 py-3.5 text-[15px] ' +
    'placeholder:text-[#676D76] focus:outline-none focus:border-[#8A9099] focus:bg-[#14181F] transition-colors'

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#FAFAF8] flex flex-col lg:flex-row">
      {/* What they are signing in to. Stacked above the form on a phone, which
          is where a coach reading an invitation email will open it. */}
      <div className="lg:w-[48%] lg:min-h-screen flex flex-col justify-center px-7 sm:px-12 lg:px-16 pt-14 pb-10 lg:py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(85rem 48rem at 6% -4%, rgba(250,250,248,0.07), transparent 56%), radial-gradient(55rem 36rem at 96% 104%, rgba(250,250,248,0.035), transparent 58%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-[540px]">
          {/* Drawn rather than loaded: the dark logo file has never existed, so
              this page showed nothing at all. See components/brand-mark.tsx. */}
          <div className="mb-11">
            <BrandMark tone="light" size="lg" />
          </div>

          <p className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.18em', color: '#8A9099' }}>
            Coach sign in
          </p>
          <h1 className="text-[38px] sm:text-[48px] lg:text-[54px] leading-[1.06] font-semibold tracking-[-0.03em] mt-4 mb-11">
            Read the body,<br />then read the week.
          </h1>

          <div className="space-y-6">
            {[
              ['An intake becomes a read', 'A long assessment turned into one written interpretation of what is actually going on.'],
              ['A check-in becomes a weekly read', 'Every week, what they report is read back against their own baseline rather than against a target.'],
              ['Twelve weeks becomes proof', 'The re-read sits against the first one, so what changed is visible instead of claimed.'],
            ].map(([title, body], i) => (
              <div key={title} className="flex gap-4">
                <span className="mt-[2px] w-7 h-7 shrink-0 rounded-full border border-[#2A2F39] flex items-center justify-center text-[11.5px] font-semibold text-[#8A9099] tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15.5px] font-medium text-[#FAFAF8]">{title}</p>
                  <p className="text-[13.5px] text-[#8A9099] leading-relaxed mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] text-[#676D76] mt-11 leading-relaxed">
            You write the training and the food. This reads the person.
          </p>
        </div>
      </div>

      {/* The form. */}
      <div className="lg:w-[52%] lg:min-h-screen flex items-center justify-center px-7 sm:px-12 pb-16 pt-2 lg:py-16 bg-[#14181F] lg:border-l border-[#262B34]">
        <div className="w-full max-w-[404px] rounded-2xl border border-[#272C36] bg-[#191D25] px-7 sm:px-8 py-8 sm:py-9 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)]">
          <h2 className="text-[22px] font-semibold tracking-[-0.015em] mb-1.5">Sign in</h2>
          <p className="text-[13.5px] text-[#8A9099] mb-7">Your clients, your reads, your week.</p>

          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 border border-[#4A2222] bg-[#1A1214]"
              role="alert"
            >
              <p className="text-[13px] text-[#D98C8C] leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-[#C2C6CC] mb-2">
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
              <label htmlFor="password" className="block text-[12px] font-medium text-[#C2C6CC] mb-2">
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
              className="w-full bg-[#FAFAF8] text-[#0F1115] font-semibold rounded-xl py-3.5 text-[15px] hover:bg-[#FFFFFF] active:bg-[#E4E4E0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-[12.5px] text-[#676D76] mt-7 leading-relaxed">
            Invited and cannot get in? Use the link in your invitation email to set your password, or reply to
            it and we will sort it.
          </p>
        </div>
      </div>
    </div>
  )
}
