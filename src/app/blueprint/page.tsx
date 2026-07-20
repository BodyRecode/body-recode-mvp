'use client'

// Rebuilt on the shared landing template kit (components/landing/kit). Same
// offer and content as before, now composed from reusable sections + the
// objection-led upgrades from the challenge page (hero proof strip, red/blue
// contrast, real consented client voices, FAQ, risk-reversal row).

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dna, Dumbbell, Salad, BookOpen, FileText, Compass, ArrowRight, Award, Activity, ShieldCheck, Lock } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip, LandingVideo,
  FeatureList, ColorCardList, EdgeLine, StepList, ContrastBlock, ProofVoices, FounderBlock,
  StateFilter, CTASection, RiskReversalRow, FAQ, Footer, BLUE,
} from '@/components/landing/kit'
import type { Feature, ColorCard, Step, Voice, FilterRow } from '@/components/landing/kit'

function CheckoutForm({ position, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  if (!isProductLive('blueprint')) {
    return <WaitlistCTA product="blueprint" productName="6-Week Body Rewire Blueprint" position={position} darkBg={darkBg} />
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
      const res = await fetch('/api/blueprint/checkout', {
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
        {loading ? 'Redirecting to checkout...' : 'Start the 6-Week Body Rewire · $97 AUD'}
      </button>
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0 }}>Secure checkout via Stripe. Instant portal access on payment.</p>
    </form>
  )
}

const WHAT_YOU_GET: Feature[] = [
  { icon: Dna, title: 'Pattern-specific programme', timing: 'Day 1', featured: true, desc: 'Every part of this is built around your specific pattern. Training intensity, nutrition timing, weekly coaching, biology lessons, all built for the same pattern. Not a generic template with a few tweaks.' },
  { icon: Dumbbell, title: '6-week training programme', timing: 'Day 1', desc: 'Three sessions a week across three phases. Effort targets, finisher rules, and rest times set for your pattern. Gym, home with dumbbells, or bodyweight. Every session has a version for your setup.' },
  { icon: Salad, title: 'Nutrition framework', timing: 'Day 1', desc: 'Whole foods, structured around what your pattern actually needs. Portion guidance, meal timing, training-day tweaks. No tracking. No calorie counting. No cutting things out.' },
  { icon: BookOpen, title: '5 biology lessons', timing: 'Weekly', desc: 'One per week. Cortisol, insulin, testosterone, thyroid, sleep. Each lesson explains the hormone driving your pattern, why the programme is built the way it is, and what to expect this phase. A note for your specific pattern in every lesson.' },
  { icon: FileText, title: 'Weekly coaching notes', timing: 'Every week', featured: true, desc: 'A note from me each week, written for your pattern. What is changing inside your body. What to expect this week. Where to put your focus. Twenty-four different notes across the four patterns and six weeks.' },
  { icon: Activity, title: 'Weekly Check-In', timing: 'Every week', desc: 'Tracking across 8 body markers, right in your portal. Shows what is moving and what still needs work. Your answers feed back in so the plan adjusts as your body responds.' },
  { icon: Compass, title: 'Midpoint reflection', timing: 'Week 3', desc: 'A structured check at the halfway point. Four questions for your pattern to surface what has already changed before the Adapt phase steps up. Adjusts the back half if your body has moved faster or slower than expected.' },
  { icon: ArrowRight, title: 'Straight into the Membership', timing: 'Week 6', desc: 'Week 6 flows straight into the Body Recode Membership. Everything about your pattern carries across. No gap between stages. Optional, skip it if you do not want it.' },
]

const PATTERNS: ColorCard[] = [
  { name: 'Stress-Stored', colour: '#DC2626', tag: 'Cortisol driver', signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.', body: 'The Blueprint takes stress off first. Sleep matters more than training here. Your body lets go of the holding pattern, and fat starts to move.' },
  { name: 'Insulin-Drift', colour: '#B7791F', tag: 'Insulin driver', signal: 'Full-body softening, carb cravings, post-meal fatigue, energy variability through the day.', body: 'The Blueprint times your carbs to a tight window after training. Blood sugar steadies, insulin starts working properly again, and the softness reverses.' },
  { name: 'Estrogen-Shift', colour: '#8b5cf6', tag: 'Oestrogen driver', signal: 'Hip and thigh storage, water retention, cycle irregularity, mood variability.', body: 'The Blueprint breaks the under-eating cycle that makes this pattern worse. It adjusts around your cycle the whole way through. Recovery is the lever that moves it.' },
  { name: 'Androgen-Decline', colour: BLUE, tag: 'Testosterone driver', signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.', body: 'The Blueprint protects your muscle by managing load and putting recovery first. Testosterone starts working properly again. Drive and capacity come back.' },
]

const PHASES: Step[] = [
  { number: '01', label: 'Regulate', weeks: 'Weeks 1-2', desc: 'Take the load off your specific pattern. Get sleep, training, and food into a rhythm your body can actually handle. Stop piling stress onto a system that is already struggling.' },
  { number: '02', label: 'Adapt', weeks: 'Weeks 3-4', desc: 'Now that your body can respond, the work steps up. Energy lifts. Strength comes back. Fat starts moving the way your biology actually allows.' },
  { number: '03', label: 'Embed', weeks: 'Weeks 5-6', desc: 'Lock in the new normal. The changes become the way your body runs by default. You are ready to keep going without a gap.' },
]

const VOICES: Voice[] = [
  { quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.", name: 'Razia', meta: 'Coaching client · week 8' },
  { quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.", name: 'Amanda', meta: 'Coaching client · 11 weeks in', stateShift: 'Depleted → Transitioning' },
]

const FAQS = [
  { q: 'What if I do not know my pattern yet?', a: 'No problem. A quick two-question check finds your pattern before your portal opens, so you start on the right version from Day 1. If you have done the Challenge, your pattern is already known and carries straight over.' },
  { q: 'Do I need a gym?', a: 'No. Every session comes in three versions: full gym, home with dumbbells, or bodyweight. You follow whichever matches your setup. The programming and effort targets are the same either way.' },
  { q: 'Is the $97 really one-time?', a: 'Yes. One payment, the full six weeks, no subscription. If you choose to continue into the Membership afterwards that is a separate, optional decision.' },
  { q: 'I have never done the Challenge. Can I still start here?', a: 'Yes. The Challenge is one way in, not a requirement. The two-question pattern check does the same job before your Blueprint opens.' },
  { q: 'How much time does it take each week?', a: 'Three training sessions, a short weekly lesson, a weekly check-in, and a coaching note to read. The work is built to fit a normal week, not take it over.' },
  { q: 'What happens after the six weeks?', a: 'The thing holding your fat loss is corrected and your body is ready to build. Week 6 flows straight into the Membership if you want to keep the progression going, or you keep what you have learned and stop. Nothing auto-charges.' },
]

const FILTER_ROWS: FilterRow[] = [
  { state: 'Don\'t know your pattern yet', desc: 'Start with the free 2-minute Body State Scorecard. It reads your state and points you to the free 14-Day Challenge if you are Depleted. By Day 14, the Body Decode Check-In shows you your pattern. Then you come back here.', cta: 'Start with the Scorecard', href: `${brand().performanceDomain}/scorecard?intent=challenge&source=blueprint_filter` },
  { state: 'Past Depleted (Ready State)', desc: 'Your body is already responding. You do not need a six-week reset. You need the ongoing system that takes you from responding to really building.', cta: 'See the Membership', href: '/membership' },
  { state: "Don't know your state yet?", desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.', cta: 'Take the Scorecard', href: `${brand().performanceDomain}/scorecard?source=blueprint_filter` },
]

export default function BlueprintPage() {
  const c = coach()
  const formRef = useRef<HTMLDivElement>(null)

  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />

      <div ref={formRef}>
        <Hero
          badge="6-Week Body Rewire Blueprint"
          coachName={c.fullName}
          credentials={c.credentials}
          headline={<>You&apos;ve done the work.</>}
          headlineAccent={<>Your body hasn&apos;t moved.</>}
          videoSlot={<LandingVideo src="/blueprint-explainer.mp4" />}
          leads={[
            'Here’s what almost no programme accounts for: bodies stall for different reasons. Yours has a specific pattern behind it, a specific reason it is holding on. A plan that does not know that pattern cannot fix it. Worse, the standard plan pushes harder on the exact thing keeping you stuck. Same plan everyone gets. On you, it backfires.',
            'The 6-Week Body Rewire is built the opposite way. First we find your pattern, a 2-minute read if you do not already know it. Then six weeks shaped entirely around it. Training set to you. Nutrition timed to you. A coaching note written for you, every week. By Week 6 the thing holding your fat loss is gone, and your body is finally ready to build. $97.',
          ]}
          stats={[{ value: '6', label: 'Weeks' }, { value: '$97', label: 'One-time' }, { value: 'Day 1', label: 'Instant access' }]}
          proofStrip={<ProofStrip items={[{ icon: Award, label: 'Built by a Sports Scientist' }, { icon: Dna, label: 'Built to your pattern' }, { icon: Activity, label: 'One of four patterns' }]} />}
          form={<CheckoutForm position="hero" />}
        />
      </div>

      {/* Bridge from challenge */}
      <Section borderTop pad="72px 24px 0">
        <Eyebrow>Where the challenge left off</Eyebrow>
        <Heading muted="The Blueprint fixes it.">The Challenge found your pattern.</Heading>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '28px 0 18px' }}>Fourteen days took enough pressure off your body to see it clearly. The Day 7 Check-In and Day 14 Result showed you which of the four patterns is holding your fat loss. That was the diagnosis.</p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 4px' }}>Knowing your pattern is not the same as fixing it. The 6-Week Body Rewire is six weeks of focused work, built around your specific pattern. Training, nutrition timing, weekly coaching notes, and biology lessons, all built around the same pattern. Your body is still Depleted, but now the work is aimed straight at what is holding you.</p>
        <Callout>New here and skipped the Challenge? No problem. A quick two-question check finds your pattern before your portal opens. Same result, same programme.</Callout>
      </Section>

      {/* Mechanism + contrast */}
      <div style={{ marginTop: '72px' }}>
        <Section bg="tint">
          <Eyebrow>Why the standard answer fails</Eyebrow>
          <Heading>Generic programmes push on the exact thing that is stuck.</Heading>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '24px 0 24px' }}>When a body stalls, it is stuck in a holding pattern. But that holding pattern is not the same for everyone. Cortisol-driven storage is nothing like insulin-driven storage. What a Stress-Stored body needs to unstick is the opposite of what an Insulin-Drift body needs. Same plan, opposite result.</p>
          <ContrastBlock
            wrong={{ label: 'The usual playbook', body: 'One programme for everyone. Same intensity, same meal timing, same number of sets. When your body has a specific pattern holding it, that one-size plan either does nothing or pulls the knot tighter.' }}
            right={{ label: 'The Blueprint', body: 'Built around your specific pattern instead. Training intensity, nutrition timing, weekly coaching, biology lessons. Four versions, because the plan has to match the pattern.' }}
          />
          <Callout tone="solid">Your pattern sets the order. What to take off first. What to add first. How hard to push, and when.</Callout>
        </Section>
      </div>

      {/* Patterns */}
      <Section pad="72px 24px 0">
        <Eyebrow>The four patterns</Eyebrow>
        <div style={{ marginBottom: '24px' }}><Heading>One of these is yours. The Blueprint is built to fix it.</Heading></div>
        <ColorCardList items={PATTERNS} />
      </Section>

      <div style={{ marginTop: '72px' }}>
        <EdgeLine eyebrow="The difference">Most programmes push harder on what is already stuck. We take that off first. Then we build to your pattern.</EdgeLine>
      </div>

      {/* Three phases */}
      <Section bg="grey" pad="72px 24px">
        <Eyebrow>The three phases</Eyebrow>
        <Heading>Regulate. Adapt. Embed.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 32px' }}>Each phase has a job. The order is not random. It follows how the body actually changes.</p>
        <StepList items={PHASES} />
      </Section>

      {/* What you get */}
      <Section pad="72px 24px">
        <Eyebrow>What is inside</Eyebrow>
        <Heading>Everything you need, in one portal.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>No external apps. No separate downloads. Everything lives in your Blueprint portal from the moment you purchase.</p>
        <FeatureList items={WHAT_YOU_GET} />
      </Section>

      {/* Proof voices */}
      <Section bg="dark">
        <Eyebrow>Real clients, real change</Eyebrow>
        <div style={{ marginBottom: '10px' }}><Heading dark>The state shifts before the fat does.</Heading></div>
        <ProofVoices intro="Real words from clients doing this work. Notice what moves first: energy, capacity, rhythm. In a stalled body the state shifts before the fat does, and that is exactly the order you should expect." voices={VOICES} />
      </Section>

      {/* Founder */}
      <FounderBlock
        eyebrow="Why pattern-specific"
        heading="Two decades writing programmes. One observation."
        photo="/kade-11.jpg"
        name={c.fullName}
        credentials={c.credentials}
        paras={[
          'After two decades of writing training programmes, I kept seeing the same thing. The same programme worked for some bodies, did nothing for others, and made a few worse. Same plan. Different results. The bodies that did not respond were not broken. They had a specific pattern.',
          'The 6-Week Body Rewire is built around that one observation. Four versions of the same six-week structure. Each one built around the hormone driving that pattern. The plan matches the pattern.',
        ]}
        callout="A generic plan is a guess. A plan built to your pattern is a read on what is actually happening. The Blueprint is that read, built into six weeks of work."
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
        heading="Still Depleted. Pattern identified."
        intro="The 6-Week Body Rewire is built for adults still in a Depleted State who now know their pattern. Fourteen days of reset is not enough on its own to bring a body out of Depleted. Six weeks of focused, pattern-specific work is the next step."
        subhead="If you are at a different stage, the right starting point is different."
        rows={FILTER_ROWS}
        closer="If you are Depleted and you know your pattern, this is your starting point. Sign up below."
      />

      {/* Final CTA */}
      <CTASection
        dark={false}
        eyebrow="Start the fix"
        heading="Six concentrated weeks."
        headingMuted="Your pattern. Fixed."
        sub="$97 AUD. Instant portal access. Your pattern is mapped before Week 1. By Week 6 the thing holding your fat loss is gone and your body is ready to build. Then straight into the Membership, if you want it."
        riskReversal={<RiskReversalRow icon={Lock} items={['One-time $97, no subscription', 'Secure Stripe checkout', 'Instant portal access', 'Pattern mapped before Week 1']} />}
        form={<CheckoutForm position="footer" />}
      />

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
