import DecodeSignupForm from './decode-signup-form'

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#4A4A4A'
const MUTED = '#6B6B6B'

/**
 * The Body Decode landing page. Funnel B Stage 1.
 *
 * Replaces /challenge. The argument is the one in Amanda's script pack and the
 * September content: three of the four common causes push fat to the same
 * place, so where it sits tells you almost nothing on its own, and guessing is
 * how most plans end up aimed at the wrong thing.
 *
 * Four things the old /challenge page got wrong that are deliberately fixed
 * here (from the 22 Aug copy review):
 *
 *   1. It filtered to a Depleted State, which is 31% of the women assessed
 *      while Transitioning is 51%. This page qualifies on behaviour ("doing the
 *      right things and getting less back") rather than on a score she has not
 *      seen yet.
 *   2. It asserted cortisol in the hero. Three of the four drivers push fat
 *      centrally, so leading on cortisol is exactly the mis-typing the content
 *      warns her about. Says "protection mode" instead, which is a state rather
 *      than a mechanism claim.
 *   3. It said "adults" and never "women", against 93% female.
 *   4. "Readiness" appeared zero times despite being locked as the outward
 *      vocabulary on 14 Aug.
 *
 * The spine line "capacity is fine, regulation is gone" is deliberately NOT
 * used. It has to be taught before it carries weight, and this page teaches
 * nothing before the fit section.
 *
 * Numbers rule: n=86/88 figures are exact and quotable. n=27 figures must be
 * ratios. Re-run scripts/state-of-the-data.ts before changing any of them.
 */
export const metadata = {
  title: 'The Body Decode',
  description: 'A free read of why your body has stopped responding. Your result in about ten minutes, then five short lessons on what it means.',
}

export default function DecodeLandingPage() {
  return (
    <main style={{ background: '#FFFFFF', color: INK }}>
      {/* HERO */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 24px 8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 800, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 18px' }}>
          Free · The Body Decode
        </p>
        <h1 style={{ fontSize: 'clamp(31px, 6vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, margin: '0 0 20px' }}>
          You&apos;re training. You&apos;re eating well. And the fat won&apos;t move.
        </h1>
        <p style={{ fontSize: '18px', color: BODY, lineHeight: 1.68, margin: '0 0 16px' }}>
          What&apos;s happened is your body has shifted into protection mode, and protection mode resists fat loss by design. Most programs try to override it. More training, less food. For a body in this state that&apos;s the wrong answer, because the harder you push, the tighter it holds.
        </p>
        <p style={{ fontSize: '18px', color: BODY, lineHeight: 1.68, margin: '0 0 32px' }}>
          <strong style={{ color: INK }}>What&apos;s driving it isn&apos;t the same in everyone.</strong> Three of the four common causes push fat to the same place, so where it sits tells you almost nothing on its own. Guessing is how most plans end up aimed at the wrong thing.
        </p>
      </section>

      {/* SIGNUP, high on the page */}
      <section style={{ maxWidth: '520px', margin: '0 auto', padding: '0 24px 48px' }}>
        <DecodeSignupForm position="hero" />
      </section>

      {/* WHAT SHE ACTUALLY GETS */}
      <section style={{ background: '#FAFAFA', borderTop: '1px solid #EDEDED', borderBottom: '1px solid #EDEDED', padding: '52px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(25px, 4.4vw, 33px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 28px' }}>
            You read your body first.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Step
              tag="About ten minutes"
              title="Your read. All of it."
              body="You answer a short set of questions, the same ones every Body Recode client answers. Then you get five scores out of three, your two lowest named, your readiness, and which of four patterns is holding your body. Along with why it's held on, where it shows up in an ordinary week, what it commonly gets mistaken for, and the three things that actually move it."
            />
            <Step
              tag="Then five days"
              title="One short lesson a day."
              body="Nothing is held back and nothing unlocks later. You have the whole read from the start. The five lessons walk you through it a part at a time, because it is a lot to take in at once."
            />
          </div>

          <p style={{ fontSize: '16px', color: BODY, lineHeight: 1.68, margin: '28px 0 0' }}>
            It&apos;s free, there&apos;s no card, and there&apos;s nothing to buy at the end of it to get the read.
          </p>
        </div>
      </section>

      {/* PROOF — n=86, exact figures only */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '52px 24px' }}>
        <h2 style={{ fontSize: 'clamp(25px, 4.4vw, 33px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 14px' }}>
          Eighty-six women have finished this now.
        </h2>
        <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.68, margin: '0 0 28px' }}>
          It scores five things out of three. Here is what keeps coming back.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '26px' }}>
          <Score label="Sleep" value="1.80" note="Lowest of the five. Four in ten are on the floor." low />
          <Score label="Stress load" value="1.86" note="Second lowest. High, ongoing, and not letting up." low />
          <Score label="Energy" value="1.94" note="" />
          <Score label="Fat loss response" value="2.00" note="" />
          <Score label="Training response" value="2.05" note="The highest of the five." />
        </div>

        <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.68, margin: '0 0 14px' }}>
          Read that quickly and the last line sounds like good news. A 2 out of 3 on our scale means some progress, but inconsistent, and hard to build on. So nothing here is working. Training is just the closest to working.
        </p>
        <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.68, margin: 0 }}>
          <strong style={{ color: INK }}>And it&apos;s the only one of the three anybody ever writes a plan for.</strong> Your training score is really a score of your effort, and the effort was never the problem. The two that decide whether your body can absorb any of it are the two nobody measured.
        </p>
      </section>

      {/* FIT — qualifies on behaviour, not on a score she has not seen */}
      <section style={{ background: '#FAFAFA', borderTop: '1px solid #EDEDED', borderBottom: '1px solid #EDEDED', padding: '52px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(23px, 4vw, 29px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.18, margin: '0 0 16px' }}>
            This is built for a body that has stopped responding.
          </h2>
          <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.68, margin: '0 0 16px' }}>
            Most women who start have been doing the right things for a while and getting less back for it. Of the women we have assessed, about a third have nothing spare, half are somewhere in the middle, and fewer than one in five could handle a hard plan today.
          </p>
          <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.68, margin: 0 }}>
            The read works out which one you are before anyone writes you a plan, <strong style={{ color: INK }}>so you don&apos;t need to know before you start.</strong> If you&apos;re training well and progressing, this isn&apos;t for you and it won&apos;t tell you much.
          </p>
        </div>
      </section>

      {/* CLOSE */}
      <section style={{ maxWidth: '520px', margin: '0 auto', padding: '52px 24px 72px' }}>
        <h2 style={{ fontSize: 'clamp(23px, 4vw, 29px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.18, margin: '0 0 12px', textAlign: 'center' }}>
          If you&apos;re done pushing harder against a body that&apos;s stopped responding.
        </h2>
        <p style={{ fontSize: '16px', color: MUTED, lineHeight: 1.65, margin: '0 0 26px', textAlign: 'center' }}>
          Your read in about ten minutes. Free, and no card to start.
        </p>
        <DecodeSignupForm position="footer" />
      </section>
    </main>
  )
}

function Step({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderLeft: `3px solid ${BLUE}`, borderRadius: '12px', padding: '22px 24px' }}>
      <p style={{ fontSize: '10.5px', fontWeight: 800, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
        {tag}
      </p>
      <p style={{ fontSize: '19px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 8px' }}>{title}</p>
      <p style={{ fontSize: '15.5px', color: BODY, lineHeight: 1.68, margin: 0 }}>{body}</p>
    </div>
  )
}

function Score({ label, value, note, low }: { label: string; value: string; note: string; low?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      background: low ? 'rgba(220,38,38,0.05)' : '#FFFFFF',
      border: `1px solid ${low ? 'rgba(220,38,38,0.22)' : '#E5E5E5'}`,
      borderRadius: '10px', padding: '14px 18px',
    }}>
      <span style={{
        fontSize: '18px', fontWeight: 900, color: low ? '#DC2626' : INK,
        fontVariantNumeric: 'tabular-nums', minWidth: '52px',
      }}>{value}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '15.5px', fontWeight: 700, color: INK, margin: 0 }}>{label}</p>
        {note && <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55, margin: '2px 0 0' }}>{note}</p>}
      </div>
    </div>
  )
}
