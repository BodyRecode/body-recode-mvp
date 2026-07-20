'use client'

// Rebuilt on the shared landing template kit (components/landing/kit). Same
// offer and content as before, composed from reusable sections + the
// objection-led upgrades (hero proof strip, mechanism contrast, real consented
// client voices, FAQ, risk-reversal row). Membership video not produced yet, so
// the hero keeps the branded "coming soon" frame.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Salad, Video, Users, Library, LineChart, Award, Activity, Lock } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip, VideoComingSoon,
  FeatureList, ColorCardList, EdgeLine, StepList, ContrastBlock, ProofVoices, FounderBlock,
  StateFilter, CTASection, RiskReversalRow, FAQ, Footer, BLUE,
} from '@/components/landing/kit'
import type { Feature, ColorCard, Step, Voice, FilterRow } from '@/components/landing/kit'

function CheckoutForm({ position, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  if (!isProductLive('membership')) {
    return <WaitlistCTA product="membership" productName="Body Recode Membership" position={position} darkBg={darkBg} />
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
      const res = await fetch('/api/membership/checkout', {
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
        {loading ? 'Redirecting to checkout...' : 'Join the Membership · $49 per week'}
      </button>
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0 }}>Secure checkout via Stripe. Billed weekly. Cancel anytime.</p>
    </form>
  )
}

const WHAT_YOU_GET: Feature[] = [
  { icon: Video, title: 'Monthly coach Loom', timing: 'Monthly', featured: true, desc: 'Once a month I review your check-in data and record a personal 3 to 5 minute Loom for you. Not a generic email. Specific to your numbers. What is shifting, what needs adjusting, what to watch for in the next block.' },
  { icon: Dumbbell, title: 'Progressive training blocks', timing: 'Every 6 weeks', featured: true, desc: 'Block A picks up from your locked foundation. Every six weeks a new block unlocks. More demanding movement patterns, more sophisticated programming. Gym, home with dumbbells, or bodyweight. All three versions every session.' },
  { icon: Salad, title: 'Nutrition layer updates', timing: 'Every block', desc: 'The HABNS foundation stays. Each block adds a new precision layer matched to your pattern. Carb cycling, cycle-aware eating, recovery nutrition protocols.' },
  { icon: Users, title: 'Monthly group Q&A call', timing: 'Monthly', desc: 'Live once a month. I answer the questions that come up most across the membership that month. Replays available in your portal.' },
  { icon: Library, title: 'Pattern resource library', timing: 'Growing', desc: 'Deep-dive guides built for your specific pattern. Supplement protocols, sleep strategies, stress management tools, and lifestyle adjustments. New material added every block.' },
  { icon: LineChart, title: 'Check-in trend dashboard', timing: 'Weekly', desc: 'Your weekly check-in data visualised over time. Energy, sleep, recovery, fat loss, and mood markers across 6, 12, and 18 weeks. The arc becomes visible in the data.' },
]

const BLOCKS: Step[] = [
  { label: 'Foundation', weeks: 'Pattern locked', status: 'complete', desc: 'Your pattern is identified and the body is out of acute compensation. Via the 6-Week Blueprint if you have done it, or calibrated from your intake if you are starting here. Locked before Block A either way.' },
  { label: 'Block A - Consolidate', weeks: 'Weeks 7-12', status: 'active', desc: 'Foundation holds under more demanding work. Training progresses to harder movement patterns. Nutrition adds precision through carb timing, cycle-aware strategies, and recovery protocols matched to your pattern.' },
  { label: 'Block B - Advance', weeks: 'Weeks 13-18', status: 'upcoming', desc: 'Training intensity steps up. Complex movement patterns introduced. Nutrition introduces calorie periodisation across training and rest days. The system handles real load now.' },
  { label: 'Block C - Refine', weeks: 'Weeks 19-24', status: 'upcoming', desc: 'Peak intensity for the cycle. Pattern reassessment at the end. The data tells us whether to repeat the structure at higher intensity or shift your pattern routing.' },
]

const PATTERNS: ColorCard[] = [
  { name: 'Stress-Stored', colour: '#DC2626', tag: 'Cortisol driver', signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.', bodyLabel: 'Block A prescription', body: 'Cortisol anchor evening meal introduced. Caffeine cutoff tightened to 10am. Post-training carb window widens as training demand increases. Zone 2 only.' },
  { name: 'Insulin-Drift', colour: '#B7791F', tag: 'Insulin driver', signal: 'Full-body softening, carb cravings, post-meal fatigue, energy variability through the day.', bodyLabel: 'Block A prescription', body: 'Formal carb cycling introduced. Training days get more carbs, rest days fruit only. Protein target increases to 2.5 to 3 palms per day. Post-meal walk is non-negotiable.' },
  { name: 'Estrogen-Shift', colour: '#8b5cf6', tag: 'Oestrogen driver', signal: 'Hip and thigh storage, water retention, cycle irregularity, mood variability.', bodyLabel: 'Block A prescription', body: 'Cycle-aware eating introduced. Follicular phase pushes harder. Luteal phase increases fat and rest-day carbs. Fat quality becomes the primary focus.' },
  { name: 'Androgen-Decline', colour: BLUE, tag: 'Testosterone driver', signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.', bodyLabel: 'Block A prescription', body: 'Protein anchored at 2.0 to 2.2 g/kg. Dietary fat protected (low-fat suppresses testosterone). Magnesium and zinc inputs prioritised. Resistance training stimulus retained, total volume controlled.' },
]

const VOICES: Voice[] = [
  { quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.", name: 'Razia', meta: 'Coaching client · week 8' },
  { quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.", name: 'Amanda', meta: 'Coaching client · 11 weeks in', stateShift: 'Depleted → Transitioning' },
]

const FAQS = [
  { q: 'Is there a lock-in contract?', a: 'No. It is billed weekly and you can cancel anytime. You keep access through the week you have paid for. No minimum term, no exit fee.' },
  { q: 'Do I need to have done the Blueprint first?', a: 'No. If you have done the Blueprint, the Membership picks up exactly where it ended. If you are starting here, your intake locks your pattern first, then Block A begins. Either way there is no gap.' },
  { q: 'Do I need a gym?', a: 'No. Every session comes in three versions: full gym, home with dumbbells, or bodyweight. The programming is the same either way.' },
  { q: 'How is this different from a normal fitness subscription?', a: 'A subscription gives everyone the same content. The Membership calibrates. Your weekly check-in data adjusts each block, and once a month I record a personal Loom reading your actual numbers. It is coaching, not a content library.' },
  { q: 'What if I am already past Depleted?', a: 'The Membership works across the whole arc. Block A calibrates to where you are, whether you are still consolidating out of Depleted, building through Transitioning, or compounding in Ready. What you need first is your pattern read.' },
  { q: 'Can I really cancel anytime?', a: 'Yes. One click in your portal. Billing stops at the end of the current week and nothing else is taken.' },
]

const FILTER_ROWS: FilterRow[] = [
  { state: 'No pattern read yet', desc: 'Start with the free 2-minute Body State Scorecard. It captures your state and routes you into the free 14-Day Challenge if you are Depleted. Day 7 Check-In identifies your pattern. Day 14 Result tells you which one. Then come back here ready.', cta: 'Start with the Scorecard', href: `${brand().performanceDomain}/scorecard?intent=challenge&source=membership_filter` },
  { state: 'Want focused six weeks first', desc: 'The 6-Week Body Rewire Blueprint is concentrated pattern correction. $97 one-time. By Week 6 the pattern is corrected and the Membership becomes the natural ascension.', cta: 'Start with the Blueprint', href: '/blueprint' },
  { state: "Don't know your state yet?", desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.', cta: 'Take the Scorecard', href: `${brand().performanceDomain}/scorecard?source=membership_filter` },
]

export default function MembershipPage() {
  const c = coach()
  const formRef = useRef<HTMLDivElement>(null)

  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />

      <div ref={formRef}>
        <Hero
          badge={`${brand().name} Membership`}
          coachName={c.fullName}
          credentials={c.credentials}
          headline={<>You do the work.<br />The results come.</>}
          headlineAccent={<>They never last.</>}
          videoSlot={<VideoComingSoon eyebrow="Explainer · 3 minutes" title="How the Membership works" />}
          leads={[
            'Most programmes deliver the work for a fixed window. Six weeks. Twelve weeks. Three months. The window closes, the structure disappears, and the body slowly returns to where it was.',
            `The ${brand().name} Membership is the infrastructure for the long arc. Block by block. Pattern continuity. A monthly Loom from me reading your check-in data. $49 per week. Cancel anytime.`,
          ]}
          stats={[{ value: '6-week', label: 'Rotating blocks' }, { value: '$49', label: 'Per week' }, { value: 'Cancel', label: 'Anytime' }]}
          proofStrip={<ProofStrip items={[{ icon: Award, label: 'Built by a Sports Scientist' }, { icon: LineChart, label: 'Calibrated to your data' }, { icon: Activity, label: 'Pattern continuity' }]} />}
          form={<CheckoutForm position="hero" />}
        />
      </div>

      {/* What this is */}
      <Section borderTop pad="88px 24px 0">
        <Eyebrow>What this is</Eyebrow>
        <Heading>Not a restart. A continuation.</Heading>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '14px 0 0' }}>If you have done the Blueprint, the Membership picks up exactly where it ended. If you are starting here, your intake locks your pattern first, then Block A begins. Either way your portal opens and the progression continues without a gap.</p>
        <Callout>This is not a content library you subscribe to. It is an ongoing coaching system that uses your weekly check-in data to track whether the work is landing.</Callout>
      </Section>

      {/* Mechanism + contrast */}
      <div style={{ marginTop: '72px' }}>
        <Section bg="tint">
          <Eyebrow>Why this works</Eyebrow>
          <Heading>State shift is a months-long arc, not a six-week event.</Heading>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '24px 0 24px' }}>Correcting the pattern brings the body out of acute compensation. But moving from Depleted to Transitioning takes months of consistent inputs landing on a stable system. Moving from Transitioning to Ready takes longer. The arc that follows pattern correction needs infrastructure.</p>
          <ContrastBlock
            wrong={{ label: 'Most subscriptions', body: 'A content library you log into. New videos, new plans, same for everyone. Nothing calibrates to whether the work is actually landing on your body.' }}
            right={{ label: 'The Membership', body: 'An ongoing coaching system. Your weekly check-in data calibrates each block, and a monthly Loom from me reads your numbers. The work adjusts as your state shifts.' }}
          />
          <Callout tone="solid">Most subscriptions are content libraries. This is an ongoing coaching system that uses your data to calibrate the work as your state shifts.</Callout>
        </Section>
      </div>

      {/* Progression */}
      <Section pad="88px 24px 0">
        <Eyebrow>The progression</Eyebrow>
        <div style={{ marginBottom: '28px' }}><Heading>Twenty-four weeks. Four blocks. Pattern reassessment at the end.</Heading></div>
        <StepList items={BLOCKS} />
      </Section>

      {/* What you get */}
      <div style={{ marginTop: '72px' }}>
        <Section bg="grey" pad="72px 24px">
          <Eyebrow>What is included</Eyebrow>
          <Heading>Six things. All inside your portal.</Heading>
          <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>No external apps. No separate logins. Everything lives in the portal you already know.</p>
          <FeatureList items={WHAT_YOU_GET} />
        </Section>
      </div>

      <div style={{ marginTop: '72px' }}>
        <EdgeLine eyebrow="The difference">Most subscriptions deliver content. This one delivers calibration.</EdgeLine>
      </div>

      {/* Block A by pattern */}
      <Section pad="88px 24px 0">
        <Eyebrow>Block A by pattern</Eyebrow>
        <div style={{ marginBottom: '24px' }}><Heading>What changes in your first membership block.</Heading></div>
        <ColorCardList items={PATTERNS} />
      </Section>

      {/* Proof voices */}
      <div style={{ marginTop: '72px' }}>
        <Section bg="dark">
          <Eyebrow>Real clients, real change</Eyebrow>
          <div style={{ marginBottom: '10px' }}><Heading dark>This is what the long arc looks like.</Heading></div>
          <ProofVoices intro="The Membership exists to move people along the state arc. Here is that arc in progress, in clients' own words. Notice Amanda: the whole point of the long game is a move like this one." voices={VOICES} />
        </Section>
      </div>

      {/* Founder */}
      <FounderBlock
        eyebrow="Why an ongoing system"
        heading="The gains people lose are the gains they had no system to keep."
        photo="/kade-11.jpg"
        name={c.fullName}
        credentials={c.credentials}
        paras={[
          'Over two decades of coaching, the same pattern. People do a programme. Get good results. Then go back to guessing. The system that produced the gains is gone the day the programme ends. Six months later they are back where they started.',
          'The Membership is the answer to that observation. The gains stay because the system that produces them continues. Block by block. Calibrated to your data. Pattern continuity through every block.',
        ]}
        callout="The compound effect requires infrastructure. The Membership is the infrastructure."
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
        heading="For anyone with their pattern read, anywhere on the state arc."
        intro="The Membership is the long-arc infrastructure. It works whether you are still consolidating out of Depleted, building through Transitioning, or compounding in Ready. The Block A nutrition and training calibrate to where you are. Pattern continuity carries through."
        subhead="What you do need first: your pattern. If you have not had your pattern read yet, the right starting point is different."
        rows={FILTER_ROWS}
        closer="If your pattern is read, your starting point is right here. Sign up below."
      />

      {/* Final CTA */}
      <CTASection
        dark={false}
        eyebrow="Start the long arc"
        heading="The long arc."
        headingMuted="Block by block. Calibrated to your data."
        sub="$49 per week. Cancel anytime. Block A loads from your locked foundation the moment you join. A monthly Loom from me reading your check-in data. The infrastructure for the state shift."
        riskReversal={<RiskReversalRow icon={Lock} items={['$49/week, cancel anytime', 'Secure Stripe checkout', 'Billed weekly, no lock-in', 'Instant portal access']} />}
        form={<CheckoutForm position="footer" />}
      />

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
