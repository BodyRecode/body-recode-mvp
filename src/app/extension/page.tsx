'use client'

// Rebuilt on the shared landing template kit (components/landing/kit) to match
// the Blueprint and Membership pages. Same $197 offer and positioning as the
// previous hand-rolled page, now composed from the reusable sections.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dna, Dumbbell, Salad, BookOpen, FileText, Activity, Layers, ArrowRight, Award, TrendingUp, Lock } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip, VideoComingSoon,
  FeatureList, ColorCardList, EdgeLine, StepList, ContrastBlock, ProofVoices, FounderBlock,
  StateFilter, CTASection, RiskReversalRow, FAQ, Footer, BLUE, SignalsList, Mechanism,
} from '@/components/landing/kit'
import type { Feature, ColorCard, Step, Voice, FilterRow } from '@/components/landing/kit'

function CheckoutForm({ position, darkBg }: { position: string; darkBg?: boolean }) {
  if (!isProductLive('extension')) {
    return <WaitlistCTA product="extension" productName="90-Day Body Rewire Extension" position={position} darkBg={darkBg} />
  }
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/extension/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      })
      const data = await res.json()
      if (data.url) { router.push(data.url) } else { setError('Something went wrong. Please try again.'); setLoading(false) }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px', border: '1px solid #D4D4D4',
    background: '#ffffff', color: '#1A1A1A', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={inputStyle} />
        <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={inputStyle} />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading || !form.name.trim() || !form.email.trim()}
        style={{ width: '100%', padding: '17px', borderRadius: '10px', border: 'none', background: loading ? 'rgba(27,109,252,0.6)' : BLUE, color: '#ffffff', fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em', transition: 'background 0.2s', boxSizing: 'border-box' }}>
        {loading ? 'Redirecting to checkout...' : 'Continue the Rewire · $197 AUD'}
      </button>
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0 }}>Secure checkout via Stripe. One-time payment, instant portal access.</p>
    </form>
  )
}

const WHAT_YOU_GET: Feature[] = [
  { icon: Layers, title: '12 weeks of progressive programming', timing: 'Day 1', featured: true, desc: 'Block A (Consolidate, Weeks 1-6) then Block B (Advance, Weeks 7-12). Each block builds on the last, and both build on the Blueprint you just finished. No reset, no repeat.' },
  { icon: Dumbbell, title: 'Pattern-specific training', timing: 'Day 1', desc: 'The same three-session structure, progressed. Gym, home with dumbbells, or bodyweight, every session in all three modes. Your pattern rules carry straight over from the Blueprint.' },
  { icon: Salad, title: 'Nutrition precision layer', timing: 'Day 1', desc: 'Block A adds carb cycling, meal anchoring, and pattern-specific protocols. Block B introduces calorie periodisation. Still whole foods, still no tracking.' },
  { icon: FileText, title: '12 weekly coaching notes', timing: 'Every week', featured: true, desc: 'A note from me each week, written for your pattern. What is changing, what to expect this block, and where to put your focus as the work steps up.' },
  { icon: Activity, title: 'Weekly Check-In', timing: 'Every week', desc: 'The same 8 body markers you tracked in the Blueprint, now across 12 weeks. Shows what is still moving and keeps the plan honest as your body adapts.' },
  { icon: BookOpen, title: 'Pattern resource library', timing: 'Ongoing', desc: 'Deep-dive guides for your pattern. Supplement protocols, biology explanations, and lifestyle tools, all in the portal you already know.' },
]

// Same four patterns as the Blueprint - they carry forward, reframed for the
// build phase rather than the initial correction.
const PATTERNS: ColorCard[] = [
  { name: 'Stress-Stored', colour: '#DC2626', tag: 'Cortisol driver', signal: 'The Blueprint took the stress load off. Now the holding pattern is loose enough to build against.', body: 'The Extension adds progressive load without re-triggering the cortisol response. Recovery stays protected while capacity climbs.' },
  { name: 'Insulin-Drift', colour: '#B7791F', tag: 'Insulin driver', signal: 'Blood sugar is steadier and the post-meal fatigue has eased. The window is open.', body: 'The Extension layers carb cycling and calorie periodisation onto the window the Blueprint opened. Insulin sensitivity keeps improving as you build.' },
  { name: 'Estrogen-Shift', colour: '#8b5cf6', tag: 'Oestrogen driver', signal: 'The under-eating cycle is broken and recovery is working. Ready for more.', body: 'The Extension progresses load while still adjusting around your cycle. Muscle comes on without tipping the pattern back.' },
  { name: 'Androgen-Decline', colour: BLUE, tag: 'Testosterone driver', signal: 'Drive and capacity started coming back in the Blueprint. Now you build on it.', body: 'The Extension pushes strength and load with recovery still first. Testosterone keeps working, and the build actually holds.' },
]

const BLOCKS: Step[] = [
  { number: '01', label: 'Block A · Consolidate', weeks: 'Weeks 1-6', desc: 'Lock in what the Blueprint corrected. Progressive load, tighter nutrition timing, and pattern-specific protocols that make the changes the default way your body runs.' },
  { number: '02', label: 'Block B · Advance', weeks: 'Weeks 7-12', desc: 'Now you build. Load steps up, calorie periodisation comes in, and the work moves from holding the change to genuinely progressing on it. Twelve weeks in, this is a different body.' },
]

const VOICES: Voice[] = [
  { quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.", name: 'Razia', meta: 'Coaching client · week 8' },
  { quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.", name: 'Amanda', meta: 'Coaching client · 11 weeks in', stateShift: 'Depleted → Transitioning' },
]

const FAQS = [
  { q: 'How is this different from the Membership?', a: 'Same quality of programming, different commitment. The Extension is a one-time $197 for a fixed 12 weeks. The Membership is an ongoing weekly subscription. If you are not ready to commit to a subscription but do not want to stop, the Extension is built for exactly that.' },
  { q: 'Do I need to have done the Blueprint first?', a: 'The Extension is designed to pick up where the Blueprint ended, and your pattern carries straight over. If you have not done the Blueprint, a quick pattern check sets you up before your portal opens, but most people arrive here straight off the 6 weeks.' },
  { q: 'Is the $197 really one-time?', a: 'Yes. One payment, the full 12 weeks, no subscription and nothing auto-charges. If you choose to continue into the Membership afterwards, that is a separate, optional decision.' },
  { q: 'What if I join the Membership later?', a: 'The Extension covers Blocks A and B. Join the Membership afterwards and you pick up at Block C, with no repeated content and no backtracking. The Extension is a stepping stone, not a detour.' },
  { q: 'Do I need a gym?', a: 'No. Every session comes in three versions: full gym, home with dumbbells, or bodyweight. The programming and effort targets are the same either way.' },
  { q: 'How much time does it take each week?', a: 'Three training sessions, a weekly check-in, and a coaching note to read. The same rhythm as the Blueprint, built to fit a normal week.' },
]

const FILTER_ROWS: FilterRow[] = [
  { state: 'Just finished the Blueprint', desc: 'This is your natural next step. Twelve more weeks of pattern-specific progression, one payment, no subscription. Your pattern and progress carry straight over.', cta: 'Continue below', href: '#' },
  { state: 'Ready to commit to the ongoing system', desc: 'If you want the open-ended progression with the full block rotation, the Membership is the better home. The Extension covers Blocks A and B; the Membership keeps going.', cta: 'See the Membership', href: '/membership' },
  { state: "Haven't done the Blueprint yet", desc: 'Start with the 6-Week Body Rewire Blueprint. It finds and corrects your pattern first. The Extension builds on that foundation.', cta: 'Start with the Blueprint', href: '/blueprint' },
]

export default function ExtensionPage() {
  const c = coach()
  const formRef = useRef<HTMLDivElement>(null)

  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />

      <div ref={formRef}>
        <Hero
          badge="90-Day Body Rewire Extension"
          coachName={c.fullName}
          credentials={c.credentials}
          headline={<>Six weeks in. The change is real.</>}
          headlineAccent={<>Twelve more locks it in.</>}
          videoSlot={<VideoComingSoon eyebrow="Explainer · 60 seconds" title="In production with Amanda" />}
          leads={[
            'The Blueprint did its job. It found the pattern holding your fat loss, corrected it, and got your body ready to build. But six weeks corrects the pattern, it does not fully embed the change. Stop now and a stressed body drifts back toward the old holding pattern. The window is open, and it does not stay open on its own.',
            'The 90-Day Extension is the 12 weeks where the correction becomes permanent and you actually build on it. Block A consolidates, Block B advances, all still shaped to your pattern. One payment of $197, no subscription. It picks up exactly where the Blueprint ended, with nothing repeated.',
          ]}
          stats={[{ value: '12', label: 'Weeks' }, { value: '$197', label: 'One-time' }, { value: 'Day 1', label: 'Instant access' }]}
          proofStrip={<ProofStrip items={[{ icon: Award, label: 'Built by a Sports Scientist' }, { icon: Dna, label: 'Built to your pattern' }, { icon: TrendingUp, label: 'Picks up where the Blueprint ended' }]} />}
          form={<CheckoutForm position="hero" />}
        />
      </div>

      {/* Signals */}
      <Section borderTop pad="72px 24px">
        <SignalsList
          eyebrow="Where the Blueprint left you"
          headline="The work started moving."
          headlineMuted="You don't want to lose it."
          items={[
            'Six weeks in and the body is finally responding',
            'Energy and rhythm you have not had in a long time',
            'You can feel the change is real, but not yet permanent',
            'Not ready to commit to an ongoing subscription',
            'Worried that stopping now means drifting straight back',
            'You want to build on this, not just hold it',
          ]}
          closing="The Blueprint corrected the pattern. Six weeks is enough to see the change, not enough to embed it. The next twelve weeks are where it becomes the way your body runs by default."
        />
      </Section>

      {/* Mechanism */}
      <Mechanism
        eyebrow="Why six weeks is not the finish line"
        headline="Corrected is not the same as embedded."
        body="Six weeks takes the pressure off your pattern and gets the body responding again. That is the correction. But a change that new is fragile. The body has not yet made it the default. Stop here and, under the first bit of real-life stress, it drifts back toward the pattern you just unwound. Twelve more weeks of progression is what turns a correction into your new normal."
        steps={[
          { k: 'Blueprint', v: 'Corrected the pattern, opened the window' },
          { k: 'Stopping now', v: 'Change is real but not yet embedded' },
          { k: 'Extension', v: '12 weeks that make it permanent, and build' },
        ]}
        takeaway="The Extension is not more of the same. It is the consolidate-then-advance work that locks the change in and progresses it."
      />

      {/* Bridge from Blueprint */}
      <Section borderTop pad="72px 24px 0">
        <Eyebrow>Where the Blueprint left off</Eyebrow>
        <Heading muted="The Extension builds on it.">The Blueprint corrected your pattern.</Heading>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '28px 0 18px' }}>Six weeks of focused work took the load off the pattern holding your fat loss and got your body responding. Training, nutrition timing, and weekly coaching, all built around your pattern. That was the correction.</p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 4px' }}>The Extension is the 12 weeks that come next. Your pattern and your progress carry straight over. Block A consolidates the change, Block B advances it. Same portal, same pattern, no reset and nothing repeated.</p>
        <Callout>Not ready for the ongoing Membership subscription? That is exactly who this is for. One payment, twelve weeks, no commitment beyond it.</Callout>
      </Section>

      {/* Contrast */}
      <div style={{ marginTop: '72px' }}>
        <Section bg="tint">
          <Eyebrow>Extension or Membership</Eyebrow>
          <Heading>Keep building without the subscription.</Heading>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '24px 0 24px' }}>Both keep the progression going. The difference is commitment. The Membership is an open-ended weekly subscription with the full block rotation. The Extension is a fixed 12 weeks for one payment, for the people who want to keep going but are not ready to sign up to something ongoing.</p>
          <ContrastBlock
            wrong={{ label: 'Stopping at six weeks', body: 'The correction is real but not embedded. Under the first stretch of real-life stress, a fresh change drifts back toward the pattern you just unwound. The six weeks holds you, but it does not finish the job.' }}
            right={{ label: 'The 90-Day Extension', body: 'Twelve more weeks of pattern-specific progression. Consolidate, then advance. One payment, no subscription. The change becomes the default, and you build real capacity on top of it.' }}
          />
          <Callout tone="solid">The Extension covers Blocks A and B. If you join the Membership later, you pick up at Block C. No repeated content, no backtracking.</Callout>
        </Section>
      </div>

      {/* Patterns carry forward */}
      <Section pad="72px 24px 0">
        <Eyebrow>Your pattern carries forward</Eyebrow>
        <div style={{ marginBottom: '24px' }}><Heading>The same pattern the Blueprint corrected. Now you build on it.</Heading></div>
        <ColorCardList items={PATTERNS} />
      </Section>

      <div style={{ marginTop: '72px' }}>
        <EdgeLine eyebrow="The difference">Most people stop the moment they feel better. That is exactly when the change is most fragile. The Extension is the twelve weeks that make it permanent.</EdgeLine>
      </div>

      {/* Two blocks */}
      <Section bg="grey" pad="72px 24px">
        <Eyebrow>The two blocks</Eyebrow>
        <Heading>Consolidate. Then advance.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 32px' }}>Twelve weeks in two halves. The first locks the change in. The second builds on it. The order is not random, it follows how the body actually holds a change.</p>
        <StepList items={BLOCKS} />
      </Section>

      {/* What you get */}
      <Section pad="72px 24px">
        <Eyebrow>What is inside</Eyebrow>
        <Heading>Everything you need, in one portal.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>The same portal you used for the Blueprint. Your Extension unlocks the moment you purchase, no separate apps or downloads.</p>
        <FeatureList items={WHAT_YOU_GET} />
      </Section>

      {/* Proof voices */}
      <Section bg="dark">
        <Eyebrow>Real clients, real change</Eyebrow>
        <div style={{ marginBottom: '10px' }}><Heading dark>The change compounds when you keep going.</Heading></div>
        <ProofVoices intro="Real words from clients doing this work over months, not weeks. The people who keep going are the ones who stop drifting back. This is what the back half looks like." voices={VOICES} />
      </Section>

      {/* Founder */}
      <FounderBlock
        eyebrow="Why twelve more weeks"
        heading="The people who hold it are the ones who kept going."
        photo="/kade-11.jpg"
        name={c.fullName}
        credentials={c.credentials}
        paras={[
          'The pattern I have watched for two decades is not just why bodies stall, it is why the fix does not hold. People correct the pattern, feel better, and stop. Then the change unwinds, because six weeks is enough to correct a pattern but not enough to make the correction permanent.',
          'The Extension exists for that exact gap. Twelve more weeks, still built around your pattern, that take the change from real to embedded and then build genuine capacity on top. One payment, no subscription, for the people who are not done.',
        ]}
        callout="A correction you stop is a correction you lose. The Extension is the work that makes it stick."
      />

      {/* FAQ */}
      <Section pad="72px 24px">
        <Eyebrow>Before you decide</Eyebrow>
        <div style={{ marginBottom: '28px' }}><Heading>The questions people ask most.</Heading></div>
        <FAQ items={FAQS} />
      </Section>

      {/* State filter */}
      <StateFilter
        eyebrow="Is this for you?"
        heading="Finished the Blueprint. Not ready to stop."
        intro="The 90-Day Extension is built for people who have finished the 6-Week Blueprint, felt the change start, and want to make it permanent without committing to an ongoing subscription."
        subhead="If you are at a different stage, the right starting point is different."
        rows={FILTER_ROWS}
        closer="If you finished the Blueprint and you want to keep building, this is your next step. Continue below."
      />

      {/* Final CTA */}
      <CTASection
        dark={false}
        eyebrow="Keep building"
        heading="Twelve more weeks."
        headingMuted="The change made permanent."
        sub="$197 AUD, one-time. Instant portal access. Block A consolidates, Block B advances, all built around your pattern. Picks up exactly where the Blueprint ended, with nothing repeated. Then into the Membership at Block C, if you want it."
        riskReversal={<RiskReversalRow icon={Lock} items={['One-time $197, no subscription', 'Secure Stripe checkout', 'Instant portal access', 'Picks up where the Blueprint ended']} />}
        form={<CheckoutForm position="footer" />}
      />

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
