'use client'

// ============================================================================
// WHITE-LABEL PROTOTYPE — not a real page, not linked, never shipped live.
// Demonstrates the SAME Body Recode methodology + engine, run by a different
// coach: "Harmony" (Melisa, Founding Partner #1, Yoga & Meditation, Brisbane),
// in her own brand colour. CORRECTED to reflect the real model: same Body State
// Scorecard, same body states (Depleted / Transitioning / Ready), same
// state-based funnel — yoga & meditation is only the DELIVERY MODALITY on top.
// Copy is illustrative placeholder, not Melisa's approved offer.
// ============================================================================

import { useState } from 'react'
import { Wind, Sunrise, Users, Moon, HeartPulse, Sparkles, Award, Activity, MapPin, Lock } from 'lucide-react'
import {
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip,
  FeatureList, ColorCardList, EdgeLine, ContrastBlock, StateFilter, CTASection,
  RiskReversalRow, FAQ, Footer, BLUE,
} from '@/components/landing/kit'
import type { Feature, ColorCard, FilterRow } from '@/components/landing/kit'

// Harmony brand shell (what would live in Melisa's tenant config). Only the
// brand + modality changes — the methodology, scorecard, states and engine are
// Body Recode's, shared across every coach in the Collective.
const HARMONY = {
  name: 'Harmony',
  accent: '#3E8E7E', // eucalyptus green — Melisa's brand colour, not BR blue
  coachName: 'Melisa',
  credentials: 'Yoga & Meditation Teacher · Brisbane',
  supportEmail: 'hello@harmony.example',
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233E8E7E'/%3E%3Ctext x='20' y='27' font-family='sans-serif' font-size='20' fill='white' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E",
}

function ScorecardCTA() {
  const [form, setForm] = useState({ name: '', email: '' })
  const inputStyle: React.CSSProperties = { width: '100%', padding: '15px 16px', borderRadius: '10px', border: '1px solid #D4D4D4', background: '#ffffff', color: '#1A1A1A', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }
  return (
    <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input placeholder="First name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
      </div>
      <button type="submit" style={{ width: '100%', padding: '17px', borderRadius: '10px', border: 'none', background: BLUE, color: '#ffffff', fontSize: '16px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em', boxSizing: 'border-box' }}>
        Take the free 2-minute Body State read
      </button>
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0 }}>Prototype form, not connected. The read is free and names your starting point.</p>
    </form>
  )
}

// Delivery is yoga/meditation — but it moves you through the SAME body states.
const FEATURES: Feature[] = [
  { icon: Activity, title: 'Your Body State read', timing: 'Day 1', featured: true, desc: 'The same 2-minute read every Body Recode coach uses. It names your state (Depleted, Transitioning, or Ready) so your practice starts from where your body actually is.' },
  { icon: Sunrise, title: 'Daily practice for your state', timing: 'Every day', featured: true, desc: 'A short guided session each morning, matched to your body state. A Depleted body gets restoration; a Ready body gets depth. Same method, met with yoga and breath.' },
  { icon: Wind, title: 'Breathwork library', timing: 'Anytime', desc: 'Regulation techniques for the days your state slips. Two minutes to bring a guarded body back down.' },
  { icon: Users, title: 'Weekly live class + check-in', timing: 'Weekly', desc: 'A live session with Melisa, plus the weekly check-in that tracks your markers and re-tunes the next week, exactly like the Body Recode engine does.' },
  { icon: Moon, title: 'Wind-down rituals', timing: 'Every evening', desc: 'Evening sequences that drop you out of fight-or-flight before sleep, so recovery actually happens overnight.' },
  { icon: Sparkles, title: 'The state progression', timing: 'Ongoing', desc: 'Depleted to Transitioning to Ready. The same arc every coach in the collective moves clients along, delivered through Melisa’s practice.' },
]

// The SHARED body states — same three, same 5-15 scorecard bands as every BR
// page. Only the "how Harmony meets it" line is coach/modality specific.
const STATES: ColorCard[] = [
  { name: 'Depleted', colour: '#C0563F', tag: 'Scorecard 5-8 · running on empty', signal: 'Tired but wired. Tension you cannot release, sleep that does not restore, weight that will not shift.', bodyLabel: 'How Harmony meets it', body: 'Take the load off first. Slow, restorative practice and long exhales tell a guarded body it is safe to settle. Nothing forced.' },
  { name: 'Transitioning', colour: '#C99A3F', tag: 'Scorecard 9-11 · starting to settle', signal: 'Calmer, but it does not hold. Good days and bad days, capacity coming and going.', bodyLabel: 'How Harmony meets it', body: 'Now we build. Breath and movement that grow steadiness, so calm becomes something your body keeps rather than chases.' },
  { name: 'Ready', colour: HARMONY.accent, tag: 'Scorecard 12-15 · settled', signal: 'Regulated and resourced. Ready to deepen the practice, not just recover.', bodyLabel: 'How Harmony meets it', body: 'The ongoing practice that compounds. Strength, stillness and depth, held to one standard.' },
]

const FAQS = [
  { q: 'Is this the same thing as Body Recode?', a: 'Underneath, yes. Harmony runs on the Body Recode method and the same Body State read, check-ins and progression. I deliver it through yoga and meditation instead of the gym. The science is the same standard; the practice is mine.' },
  { q: 'Why do I start with a quiz?', a: 'Because the same practice does not suit every body. The 2-minute Body State read names where your nervous system and body actually are, so your first practice meets you there instead of guessing.' },
  { q: 'Do I need to be flexible or experienced?', a: 'No. This is built for real beginners. Every practice has an easier and a stronger version, and Melisa cues both.' },
  { q: 'How much time does it take each day?', a: 'Ten to fifteen minutes for the daily practice. Consistency and regulation matter more than long sessions.' },
  { q: 'Do I need equipment?', a: 'A mat and room to lie down. That is genuinely it.' },
]

const FILTER_ROWS: FilterRow[] = [
  { state: "Don't know your body state yet", desc: 'Start with the free 2-minute Body State read. It names your state and points you to the right first practice.', cta: 'Take the free read', href: '#' },
  { state: 'Already settled (Ready)', desc: 'You do not need a reset. The ongoing practice takes a regulated body deeper, block by block.', cta: 'See the ongoing practice', href: '#' },
  { state: 'Somewhere in between (Transitioning)', desc: 'Your calm is coming and going. The build phase makes it hold. Start with the read to confirm.', cta: 'Confirm with the read', href: '#' },
]

export default function HarmonyPrototype() {
  return (
    <LandingRoot accent={HARMONY.accent}>
      {/* Prototype banner — makes clear this is a demo, never live */}
      <div style={{ background: '#1A1A1A', color: '#FFD84D', textAlign: 'center', fontSize: '12px', fontWeight: 700, padding: '8px 16px', letterSpacing: '0.03em' }}>
        WHITE-LABEL PROTOTYPE · same Body Recode method + scorecard, delivered through yoga · not live
      </div>

      <Nav logo="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='30'%3E%3Ctext x='0' y='22' font-family='Georgia,serif' font-size='24' fill='%233E8E7E'%3EHarmony%3C/text%3E%3C/svg%3E" brandName={HARMONY.name} />

      <Hero
        badge="Body State Reset · Yoga & Meditation"
        coachName={HARMONY.coachName}
        coachPhoto={HARMONY.avatar}
        credentials={HARMONY.credentials}
        headline={<>You find calm on the mat.</>}
        headlineAccent={<>Your body loses it by Tuesday.</>}
        leads={[
          'A body under long-term stress shifts into a protective, depleted state. It holds tension, holds fatigue, holds weight, and no amount of forcing calm makes it let go. Push harder on the mat and a guarded body only braces tighter.',
          'So this starts where every good plan should: by reading your body. The same 2-minute Body State read every Body Recode coach uses names where you actually are. Then yoga and breath shaped to move you out of Depleted and back to settled. Same method your body needs, met with stillness instead of strain.',
        ]}
        stats={[{ value: '2 min', label: 'Body State read' }, { value: '10 min', label: 'A day' }, { value: 'At home', label: 'On a mat' }]}
        proofStrip={<ProofStrip items={[{ icon: Award, label: 'Yoga & Meditation Teacher' }, { icon: Activity, label: 'Reads your Body State' }, { icon: MapPin, label: 'Live in Brisbane' }]} />}
        form={<ScorecardCTA />}
      />

      {/* Mechanism + contrast — same body-state / protection-mode doctrine */}
      <div style={{ marginTop: '8px' }}>
        <Section bg="tint">
          <Eyebrow>Why calm never sticks</Eyebrow>
          <Heading>You cannot relax a body that does not feel safe yet.</Heading>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '24px 0 24px' }}>When a body has been under stress for long enough, it settles into a protective state. Cortisol stays up, recovery stays down, and the system holds on to everything. Sitting down to force stillness on top of that often makes it louder. The state has to come down first, and what a Depleted body needs is the opposite of what a Ready one does.</p>
          <ContrastBlock
            wrong={{ label: 'The usual advice', body: 'One class for everyone. More sessions, stronger flows, more discipline. To a body stuck in a protective state that reads as more pressure, and it braces harder.' }}
            right={{ label: 'The Harmony way', body: 'Read your body state first, then meet it. Restore what is depleted, build what is transitioning, deepen what is ready. The same Body Recode method, delivered through breath and movement.' }}
          />
          <Callout tone="solid">Your body state sets the practice. What to soften first. What to build. How much to do, and when to do less.</Callout>
        </Section>
      </div>

      {/* The three shared body states */}
      <Section pad="72px 24px 0">
        <Eyebrow>The three body states</Eyebrow>
        <div style={{ marginBottom: '24px' }}><Heading>The read names where your body actually is.</Heading></div>
        <ColorCardList items={STATES} />
      </Section>

      <div style={{ marginTop: '72px' }}>
        <EdgeLine eyebrow="The difference">Most classes give everyone the same flow. This one starts by reading the state your body is actually in.</EdgeLine>
      </div>

      {/* What you get */}
      <Section bg="grey" pad="72px 24px">
        <Eyebrow>What is inside</Eyebrow>
        <Heading>The method, delivered through practice.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>The same read, check-ins and state progression every Body Recode coach runs, met with yoga and meditation, all in one calm space.</p>
        <FeatureList items={FEATURES} />
      </Section>

      {/* FAQ */}
      <Section pad="72px 24px">
        <Eyebrow>Before you begin</Eyebrow>
        <div style={{ marginBottom: '28px' }}><Heading>The questions people ask most.</Heading></div>
        <FAQ items={FAQS} />
      </Section>

      {/* State filter */}
      <StateFilter
        eyebrow="Is this for you?"
        heading="Built for a Depleted body that cannot settle."
        intro="This starts with the people whose body state comes back Depleted: wired, exhausted, holding tension they cannot release. The reset meets that body first. If you are further along, the right starting point is different."
        subhead="Not sure where you are? The read takes two minutes and tells you."
        rows={FILTER_ROWS}
        closer="If your read comes back Depleted, this is where you begin."
      />

      {/* Final CTA */}
      <CTASection
        dark={false}
        eyebrow="Begin with the read"
        heading="Start where your body is."
        headingMuted="Not where a class assumes it is."
        sub="The free 2-minute Body State read names your state. Then yoga and breath shaped to move you along it, a live class each week with Melisa, and the check-ins that keep it honest."
        riskReversal={<RiskReversalRow icon={Lock} items={['Free Body State read', 'Cancel any time', 'Beginner friendly', 'Live + recorded']} />}
        form={<ScorecardCTA />}
      />

      <Footer brandName={HARMONY.name} supportEmail={HARMONY.supportEmail} />
    </LandingRoot>
  )
}
