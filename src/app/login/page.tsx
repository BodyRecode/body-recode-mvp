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
 *   2. THE TWO HALVES ARE PROPERLY APART.
 *   3. THE FORM IS AN OBJECT, NOT FLOATING TEXT.
 *
 * THIRD PASS, same day. Kade on the second: "dark and grey are not enough of a
 * contrast", and he was right. Two dark halves a few points of lightness apart
 * is not a split, it is a seam, and no amount of widening the gap between two
 * near-blacks fixes that.
 *
 * So it is now GRAPHITE AND PAPER, which is the identity doing the work rather
 * than a shade of it: the story side is the deepest surface in the product and
 * the form side is paper. That is section 3.2 of the brand guidelines, positive
 * and negative space, applied to a whole screen instead of a swatch.
 *
 * It also sorts out a thing the dark version fudged. On the dark side the mark
 * is paper on graphite. On the paper side the button is graphite on paper. Both
 * are the highest-contrast object on their own half, which is exactly how a
 * monochrome system says "this is the thing" without reaching for a colour.
 *
 * THE CARD IS GONE. It existed to give a dark void a shape. The split does that
 * now, and a bordered card floating on paper beside a full-bleed graphite panel
 * is fussy: two competing ideas about where the structure lives.
 *
 * FOURTH PASS, the copy. Kade: reads flat. Three reasons, and they are the
 * usual three:
 *
 *   1. EVERY STEP TITLE WAS THE SAME SHAPE. "An intake becomes a read", "A
 *      check-in becomes a weekly read", "Twelve weeks becomes proof". Parallel
 *      structure three times in a row stops reading as rhythm and starts
 *      reading as a spec sheet.
 *   2. THE BODIES DESCRIBED MECHANICS, NOT STAKES. Accurate sentences about
 *      what the system does, with no reason for a coach to care.
 *   3. NOTHING NAMED THE COACH'S ACTUAL PROBLEM. The whole page talked about
 *      the product. The brand book has the line it should have been built on:
 *      they already write good programmes, what they cannot do is read a body
 *      in a way they can defend to the person in front of them. That is now
 *      the subheading, and it is the only sentence on the page a coach will
 *      recognise as their own.
 *
 * DELIBERATELY NOT USED: the question count. It is a real number and it is a
 * retired claim. Counting inputs is the register of the market this is
 * positioned away from.
 *
 * FIFTH PASS, and the copy above was wrong in a way worth recording. Kade: "its
 * not just about people who are stuck, this is so they can finally properly
 * read a person's readiness, this platform and its capabilities is next level,
 * this currently undersells it".
 *
 * HE IS RIGHT AND THE ERROR WAS A FRAMING ONE. Leading on "why is this person
 * stuck" turns a reading system into a troubleshooting tool, and quietly says
 * it is for the hard cases. It is for every client, every week. A coach who
 * only reaches for it when somebody stalls has been sold the wrong product.
 *
 * SO IT NOW LEADS ON THE CAPABILITY. Readiness is the core: how much load this
 * person can carry right now, named and explained, which is the thing a coach
 * actually programmes against and has never been able to do anything but
 * estimate. Then the pattern underneath it. Then the same read every week.
 *
 * THE THIRD BLOCK IS THE ONE NOTHING ELSE DOES, and it took five passes to put
 * it on the page: the system knows when to stop. When the picture needs a
 * doctor rather than a coach it holds and says so, rather than guessing past
 * it. The safety gates are not a disclaimer, they are the reason to trust the
 * other two blocks, and they are genuinely uncopyable by a questionnaire.
 *
 * HELD BACK ON PURPOSE: bloodwork, which is in the read and is the single
 * highest item on the medical-device risk note. It is a real capability and it
 * is not going on a public page until that has been through a lawyer. Flagged
 * to Kade rather than quietly omitted.
 *
 * SIXTH PASS, plain words. Kade: could be said in plainer terms. He is right,
 * and the offenders were all mine rather than the product's:
 *
 *   "a written interpretation of how much load they can carry"  -> how hard
 *       you can push someone
 *   "storage"                -> where they carry body fat. "Storage" is an
 *       internal label and it means nothing to a coach reading this cold.
 *   "hormonal status"        -> hormones
 *   "you get a readiness"    -> a readiness is not a thing you get. Say what
 *       it tells you first, then name it.
 *   "programme against something real" -> not a guess
 *   "the interaction is usually where the answer is" -> most problems only
 *       show up when you look at them side by side
 *   "it holds and says so"   -> it says so and waits. "Holds" is ours.
 *
 * THE ORDER IS THE RULE, not just the vocabulary: say the plain thing first,
 * then name it. "How hard you can push them. That is their readiness." A coach
 * learns the word from the sentence instead of having to already know it.
 *
 * COLOURS ON THIS PAGE ARE ALL IN src/lib/brand-tokens.ts. They were not when
 * it shipped: this page invented six, three of them within four points of a
 * token that already existed. Three were real gaps and are now named in the
 * palette (darkWell, lineStrong, the Stop wash pair) and three were snapped
 * back. Nothing here may be a hex code that is not in that file.
 *
 * SEVENTH PASS, and it stops describing the product. Kade, after six: "I think
 * we can still do better." He was right and more words were not going to fix
 * it. Two things were actually wrong:
 *
 *   - ALL THREE BLOCKS BEGAN WITH "IT". The spec-sheet rhythm I removed in the
 *     fourth pass had grown back in a new vocabulary.
 *   - IT WAS ALL CLAIMS. Every line asserted a capability and nothing let a
 *     coach see one. "Next level" is not a thing you can say about yourself.
 *
 * SO IT SHOWS A READ INSTEAD. Readiness and pattern, which are the two axes,
 * with the reason written underneath exactly as the product writes it. A coach
 * knows within five seconds whether this is worth their time, which is more
 * than three paragraphs of claims ever got them.
 *
 * FOUR THINGS ABOUT THE EXAMPLE, all deliberate:
 *
 *   1. IT INTERPRETS, IT DOES NOT INSTRUCT. The first draft of this card said
 *      "push less this block", which is the read telling the coach what to do
 *      and is the one line this product may never write. It now says what is
 *      happening and what follows from it. The coach decides.
 *   2. NO NAME, AND IT IS LABELLED AS AN EXAMPLE. A card with a client's name
 *      on a page anyone can load reads like leaked data even when invented.
 *   3. STRESS-STORED, because it is the only universal pattern. Any of the
 *      other three would gender the example on a page that is deliberately
 *      universal.
 *   4. THE AMBER DOT IS THE ONLY COLOUR ON THE DARK HALF, and it is carrying
 *      meaning rather than decoration, which is the palette rule demonstrated
 *      rather than asserted. Remediation is amber and never red: somebody in
 *      Remediation is not in trouble, they are being asked for less.
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
    'w-full bg-[#FFFFFF] border border-[#DCDCD7] text-[#0F1115] rounded-xl px-4 py-3.5 text-[15px] ' +
    'placeholder:text-[#9CA2AB] focus:outline-none focus:border-[#0F1115] focus:ring-[3px] focus:ring-[#0F1115]/8 transition-[border-color,box-shadow]'

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
        <div className="relative max-w-[600px]">
          {/* Drawn rather than loaded: the dark logo file has never existed, so
              this page showed nothing at all. See components/brand-mark.tsx. */}
          <div className="mb-9">
            <BrandMark tone="light" size="lg" />
          </div>

          <p className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.18em', color: '#8A9099' }}>
            Coach sign in
          </p>
          <h1 className="text-[36px] sm:text-[44px] lg:text-[50px] leading-[1.05] font-semibold tracking-[-0.03em] mt-4 mb-5">
            Read the whole person,<br />every week.
          </h1>
          <p className="text-[16px] sm:text-[16.5px] text-[#C2C6CC] leading-[1.55] mb-9 max-w-[500px]">
            It tells you how hard you can push someone right now, what is going on
            underneath that, and why. Written out in plain words, so you can read
            it straight to them.
          </p>

          {/* An example read rather than three claims about reads. Everything
              here is interpretation: nothing on this card tells a coach what to
              do, because the product never does. */}
          <p className="text-[10.5px] font-medium uppercase mb-3" style={{ letterSpacing: '0.16em', color: '#676D76' }}>
            An example read
          </p>
          <div className="rounded-2xl border border-[#2A2F39] bg-[#14171D] px-6 py-5 sm:px-7 sm:py-6">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[10.5px] font-medium uppercase text-[#676D76]" style={{ letterSpacing: '0.14em' }}>
                Readiness
              </span>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#FAFAF8]">
                {/* The one colour on this half of the page, and it is carrying
                    meaning. Amber, never red: Remediation is not trouble, it is
                    being asked for less. Value chosen by Kade 22 Sep. */}
                <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: '#E0A254' }} />
                Remediation
              </span>
            </div>
            <p className="text-[13.5px] text-[#C2C6CC] leading-[1.6] mt-2.5">
              The system is settling rather than building. Sleep has been under six
              hours for three weeks and recovery has not come back up between
              sessions. Anything added now lands on top of that.
            </p>

            <div className="h-px bg-[#2A2F39] my-5" />

            <div className="flex items-baseline gap-2.5">
              <span className="text-[10.5px] font-medium uppercase text-[#676D76]" style={{ letterSpacing: '0.14em' }}>
                Pattern
              </span>
              <span className="text-[15px] font-semibold text-[#FAFAF8]">Stress-Stored</span>
            </div>
            <p className="text-[13.5px] text-[#C2C6CC] leading-[1.6] mt-2.5">
              Cortisol driven. Fat sitting around the middle, puffy in the morning,
              flat by mid afternoon. Wired and tired rather than simply tired.
            </p>
          </div>

          <p className="text-[12.5px] text-[#676D76] mt-7 leading-relaxed">
            Every client gets one of these, and a fresh one every week, measured
            against where they started rather than against a target. What to do
            about it is still your call.
          </p>
        </div>
      </div>

      {/* The form. */}
      <div className="lg:w-[52%] lg:min-h-screen flex items-center justify-center px-7 sm:px-12 pb-16 pt-12 lg:py-16 bg-[#FAFAF8] text-[#0F1115]">
        <div className="w-full max-w-[392px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] mb-1.5">Sign in</h2>
          <p className="text-[13.5px] text-[#6E747D] mb-8">Every client, read properly.</p>

          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 border border-[#E8C9C9] bg-[#FBF1F1]"
              role="alert"
            >
              <p className="text-[13px] text-[#8F2D2D] leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-[#4A4F57] mb-2">
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
              <label htmlFor="password" className="block text-[12px] font-medium text-[#4A4F57] mb-2">
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
              className="w-full bg-[#0F1115] text-[#FAFAF8] font-semibold rounded-xl py-3.5 text-[15px] hover:bg-[#242932] active:bg-[#000000] transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-[12.5px] text-[#6E747D] mt-7 leading-relaxed">
            Invited but cannot get in? Set your password from the link in your invitation, or just reply to
            that email and we will sort it out.
          </p>
        </div>
      </div>
    </div>
  )
}
