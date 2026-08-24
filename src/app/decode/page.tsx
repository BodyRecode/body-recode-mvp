'use client'

// /decode — The Body Decode. Funnel B Stage 1, replacing the free 14-Day Challenge.
//
// Built on the shared landing kit (components/landing/kit), same as /blueprint
// and /membership. The challenge page stays the FROZEN MASTER TEMPLATE and is
// not touched; this page is composed to match it, not cloned from it.
//
// Four things the /challenge page got wrong that are deliberately fixed here,
// from the 22 Aug copy review:
//
//   1. It filtered to a Depleted State, which is 31% of the women assessed
//      while Transitioning is 51%. There is NO StateFilter section on this page
//      for exactly that reason: the whole product is that the read works out
//      which one she is, so a page that asks her to self-sort first contradicts
//      the offer and turns away the largest group.
//   2. It asserted cortisol in the hero. Three of the four drivers push fat
//      centrally, so leading on cortisol is the mis-typing the content warns
//      her about. Says "protection mode" instead, a state not a mechanism claim.
//   3. It said "adults" and never "women", against a 93% female audience.
//   4. "Readiness" appeared zero times despite being locked as the outward
//      vocabulary on 14 Aug.
//
// The spine line "capacity is fine, regulation is gone" is deliberately NOT
// used. It has to be taught before it carries weight and the coverage audit
// flags it as jargon on purpose.
//
// Numbers: n=86/88 figures are exact and quotable, n=27 figures must be ratios.
// Every figure below re-verified against scripts/state-of-the-data.ts on
// 24 Aug 2026. Re-run it before changing any of them.

import { Activity, Moon, Gauge, FileText, Compass, Dna, ShieldCheck, Lock, Zap } from 'lucide-react'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip,
  FeatureList, EdgeLine, StepList, ContrastBlock, ProofVoices, FounderBlock,
  CTASection, RiskReversalRow, FAQ, Footer, BLUE, INK, SignalsList, Mechanism,
} from '@/components/landing/kit'
import type { Feature, Step, Voice } from '@/components/landing/kit'
import DecodeSignupForm from './decode-signup-form'
import DecodeExplainer from './decode-explainer'
import { DECODE_EXPLAINER_VIDEO, DECODE_EXPLAINER_POSTER } from '@/lib/video-urls'

const RED = '#DC2626'

// n=86. Exact figures, re-verified 24 Aug 2026.
const SECTIONS = [
  { label: 'Training response', score: 2.05, note: 'The highest of the five.' },
  { label: 'Fat loss response', score: 2.00, note: '' },
  { label: 'Energy', score: 1.94, note: '' },
  { label: 'Stress load', score: 1.86, note: 'High, ongoing, not letting up.', low: true },
  { label: 'Sleep', score: 1.80, note: 'Four in ten are on the floor.', low: true },
]

const SIGNALS = [
  'You wake at three in the morning with nothing actually wrong.',
  'The afternoon drops out from under you around three or four.',
  'You eat well all day, then stand in the kitchen at nine at night not really hungry, eating anyway.',
  'The same clothes fit differently over a fortnight while the scale does not move.',
  'You train hard on Monday and still feel it on Thursday.',
  'Someone tells you it is just your age, and the conversation ends there.',
]

const READ_PARTS: Feature[] = [
  { icon: Dna, title: 'Your pattern, named and defined', timing: 'Part 1', desc: 'Which of four is holding your body. Not a guess from where the fat sits, because three of the four put it in the same place.', featured: true },
  { icon: Activity, title: 'Why your body has been holding it', timing: 'Part 2', desc: 'The mechanism, not the symptoms. Regulation rather than metabolism, and why restriction reads to your body as more load.' },
  { icon: Moon, title: 'Where it shows up in an ordinary week', timing: 'Part 3', desc: 'The lived signals. Most women recognise themselves in about ten seconds and have never had a name for any of it.' },
  { icon: ShieldCheck, title: 'What it is commonly mistaken for', timing: 'Part 4', desc: 'Laziness, willpower, too many carbs, just getting older. Every wrong explanation is a plan you already tried.' },
  { icon: Compass, title: 'Three actions, specific to you', timing: 'Part 5', desc: 'Aimed at your actual pattern rather than the average, and in the order that matters.' },
]

const DAYS: Step[] = [
  { number: '1', label: 'Your two lowest', weeks: 'Day 1', desc: 'Sleep and stress load are what decide whether the training turns into anything, and they are the two nobody measures.' },
  { number: '2', label: 'Why your body is holding it', weeks: 'Day 2', desc: 'Regulation, not metabolism. Your body made a decision to hold on, and restriction reads to it as more load.' },
  { number: '3', label: 'Where this shows up', weeks: 'Day 3', desc: 'A pattern does not arrive as a diagnosis. It arrives as an ordinary week you have stopped noticing is strange.' },
  { number: '4', label: 'What this is not', weeks: 'Day 4', desc: 'The part most people skim, and the one worth reading twice.' },
  { number: '5', label: 'What moves it', weeks: 'Day 5', desc: 'Three actions, and the order to do them in. Start with the regulation ones, not the training one.' },
]

const VOICES: Voice[] = [
  { quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.", name: 'Razia', meta: 'Coaching client · week 8' },
  { quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.", name: 'Amanda', meta: 'Coaching client · 11 weeks in', stateShift: 'Depleted → Transitioning' },
]

const FAQS = [
  { q: 'How long does it actually take?', a: 'About ten minutes to answer the questions, and your read is on screen straight after. Then five lessons, one a day, and each is a couple of minutes. Nothing is timed and nothing expires.' },
  { q: 'Is anything held back until later?', a: 'No. Your full read is there from the start and stays there. The five lessons walk you through it a part at a time because it is a lot to take in at once, not because it unlocks.' },
  { q: 'Do I need to know my pattern before I start?', a: 'No, and that is the point. Working it out is what the read does. If you already know it from the scorecard it carries straight over and you are not asked anything twice.' },
  { q: 'Is there anything to buy?', a: 'Not to get the read. It is free and there is no card at signup. There is a paid next step if you want to correct what the read finds, and it is entirely optional.' },
  { q: 'Do I have to train or change my diet during the five days?', a: 'No. Nothing is prescribed. This is a read, not a programme, so there is nothing to comply with and no health clearance to fill in.' },
  { q: 'What if my answers do not point at one of the four patterns?', a: 'That happens and it is a real result rather than a missing one. It usually means the foundations are in better shape than the four compensation patterns describe. Your five scores still stand and the five days still run.' },
]

export default function DecodeLandingPage() {
  const c = coach()

  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />

      <Hero
        badge="Free · The Body Decode"
        coachName={c.fullName}
        credentials={c.credentials}
        headline="You're training. You're eating well."
        headlineAccent="And the fat won't move."
        videoSlot={<DecodeExplainer src={DECODE_EXPLAINER_VIDEO} poster={DECODE_EXPLAINER_POSTER} />}
        leads={[
          'Your body has shifted into protection mode, and protection mode resists fat loss by design. Push harder and it holds tighter.',
          "What's driving that isn't the same in everyone. Three of the four common causes push fat to the same place, so where it sits tells you almost nothing on its own. Guessing is how most plans end up aimed at the wrong thing, and it is why the last one didn't work.",
        ]}
        stats={[
          { value: '10 min', label: 'to your full read' },
          { value: '5 days', label: 'of short lessons' },
          { value: 'Free', label: 'no card to start' },
        ]}
        form={<DecodeSignupForm position="hero" />}
        proofStrip={<ProofStrip items={[
          { icon: Lock, label: 'No card required' },
          { icon: FileText, label: 'Your read is yours to keep' },
          { icon: ShieldCheck, label: 'Nothing to buy to get it' },
        ]} />}
      />

      {/* SignalsList is a bare fragment with no container of its own, so it has
          to be wrapped in a Section or it runs full-bleed. */}
      <Section pad="72px 24px">
        <SignalsList
          eyebrow="Sound familiar"
          headline="None of this is dramatic."
          headlineMuted="That is exactly why it never gets raised."
          items={SIGNALS}
          closing="These are not random annoyances. They are the pattern showing itself, and once it has a name the list stops being a list and starts being a shape."
          icon={Zap}
        />
      </Section>

      <Mechanism
        eyebrow="What is actually happening"
        headline="Regulation, not metabolism."
        body="Your body is constantly reading its own situation and deciding how safe it is to let go of stored energy. Sleep, load, whether you are eating enough, how hard you are training, and how long all of it has been going on."
        steps={[
          { k: 'The load stays high', v: 'and it has been high for a while' },
          { k: 'Your body makes a decision', v: 'hold on, this is not the time' },
          { k: 'You eat less and train more', v: 'which reads as more load, so it holds tighter' },
        ]}
        takeaway="That is not a malfunction. It is the system doing exactly what it is built to do, at a time you would rather it did not."
      />

      {/* The data. This is the page's strongest asset and no competitor has it. */}
      <Section pad="72px 24px">
        <Eyebrow>What 86 scorecards show</Eyebrow>
        <div style={{ marginBottom: '10px' }}>
          <Heading muted="It scores five things out of three.">Eighty-six women have finished this now.</Heading>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0', alignItems: 'stretch', marginTop: '32px' }}>
          {/* Greyscale is locked in the visual identity. Never colour. */}
          <div
            aria-hidden="true"
            style={{
              minHeight: '400px',
              backgroundImage: 'url(/woman-5.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: '50% 12%',
              filter: 'grayscale(1)',
              borderRadius: '14px 0 0 14px',
            }}
          />
          {/* The artifact floating over the photograph. Proof, not a claim, and
              the thing the eye stops on. Straight out of the ad creative system. */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '0 14px 14px 0',
            padding: '30px 30px 26px', boxShadow: '0 18px 44px rgba(16,24,40,0.10)',
          }}>
            <p style={{ fontSize: '10.5px', fontWeight: 800, color: BLUE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              86 completed scorecards
            </p>
            <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 3px', color: INK }}>
              Average score, by section.
            </p>
            <p style={{ fontSize: '13.5px', color: '#6B6B6B', margin: '0 0 22px' }}>
              Out of three. Worst two in red.
            </p>

            <div style={{ display: 'grid', gap: '15px' }}>
              {SECTIONS.map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '12px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: s.low ? RED : INK }}>{s.label}</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: s.low ? RED : INK, fontVariantNumeric: 'tabular-nums' }}>
                      {s.score.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ height: '9px', background: '#ECEDEF', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(s.score / 3) * 100}%`, height: '100%', background: s.low ? RED : BLUE, borderRadius: '99px' }} />
                  </div>
                  {s.note && <p style={{ fontSize: '12.5px', color: '#6B6B6B', margin: '5px 0 0', lineHeight: 1.5 }}>{s.note}</p>}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #E5E5E5', margin: '22px 0 0', paddingTop: '16px' }}>
              <p style={{ fontSize: '13.5px', color: '#6B6B6B', margin: '0 0 3px' }}>Even the best of the five only reaches 2.05.</p>
              <p style={{ fontSize: '14.5px', fontWeight: 800, color: INK, margin: 0 }}>Nothing here is working. Training is just closest.</p>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '30px 0 0' }}>
          A 2 out of 3 on our scale means some progress, but inconsistent, and hard to build on. So nothing here is working. Training is just the closest to working, <strong style={{ color: INK }}>and it is the only one of the three anybody ever writes a plan for.</strong> Your training score is really a score of your effort, and the effort was never the problem. The two that decide whether your body can absorb any of it are the two nobody measured.
        </p>
      </Section>

      <div style={{ marginTop: '20px' }}>
        <EdgeLine eyebrow="The difference">Most programmes prescribe first and find out later. This reads you first, and the read is the free part.</EdgeLine>
      </div>

      <Section bg="tint" pad="72px 24px">
        <Eyebrow>Why the last plan did not work</Eyebrow>
        <div style={{ marginBottom: '24px' }}><Heading>A plan that does not know your pattern cannot fix it.</Heading></div>
        <ContrastBlock
          wrong={{ label: 'The usual order', body: 'A plan first, and you find out whether it fits by running it for twelve weeks. If it does not work, that gets read as you not wanting it enough.' }}
          right={{ label: 'The Body Decode', body: 'The read first. Which pattern, why it is held, what it is mistaken for, and what actually moves it. Then you decide what to do about it, knowing what you are aiming at.' }}
        />
        <Callout tone="solid">Read before you prescribe. It is the whole method, and this is the part of it that costs nothing.</Callout>
      </Section>

      <Section pad="72px 24px">
        <Eyebrow>What your read contains</Eyebrow>
        <div style={{ marginBottom: '10px' }}><Heading>Five parts. All of it at minute ten.</Heading></div>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>
          Nothing is held back and nothing unlocks later. Your read is complete from the start and it stays yours whatever you decide to do next.
        </p>
        <FeatureList items={READ_PARTS} />
      </Section>

      <Section bg="grey" pad="72px 24px">
        <Eyebrow>The five days</Eyebrow>
        <Heading>Then someone walks you through it.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 32px' }}>
          One short lesson a day, covering one part of your read. Not because it unlocks, but because a document this long does not get absorbed in one sitting.
        </p>
        <StepList items={DAYS} />
      </Section>

      <Section bg="dark">
        <Eyebrow>Real clients, real change</Eyebrow>
        <div style={{ marginBottom: '10px' }}><Heading dark>The state shifts before the fat does.</Heading></div>
        <ProofVoices intro="Real words from clients doing this work. Notice what moves first: energy, capacity, rhythm. In a stalled body the state shifts before the fat does, and that is exactly the order you should expect." voices={VOICES} />
      </Section>

      <FounderBlock
        eyebrow="Why read first"
        heading="Two decades writing programmes. One observation."
        photo="/kade-11.jpg"
        name={c.fullName}
        credentials={c.credentials}
        paras={[
          'After two decades of writing training programmes, I kept seeing the same thing. The same programme worked for some bodies, did nothing for others, and made a few worse. Same plan, different results. The bodies that did not respond had a specific pattern nobody had looked for.',
          'So we stopped writing the plan first. The Body Decode is the read on its own, given away, because a plan aimed at the wrong pattern is worse than no plan at all and you should not have to pay to find out which one you are.',
        ]}
        callout="A generic plan is a guess. A read is what is actually happening. This is the read, and there is nothing to buy to get it."
      />

      <Section pad="72px 24px">
        <Eyebrow>Before you start</Eyebrow>
        <div style={{ marginBottom: '28px' }}><Heading>The questions people ask most.</Heading></div>
        <FAQ items={FAQS} />
      </Section>

      {/* No StateFilter here, deliberately. The Challenge page filtered to a
          Depleted State and turned away the 51% who are Transitioning. Working
          out which one she is IS the product, so asking her to self-sort before
          she starts contradicts the offer. */}

      <CTASection
        dark={false}
        eyebrow="Get your read"
        heading="About ten minutes."
        headingMuted="Then you know what you are aiming at."
        sub="Free, and no card to start. Your full read on screen when you finish the questions, then five short lessons walking you through it. If you are training well and progressing, this is not for you and it will not tell you much."
        riskReversal={<RiskReversalRow icon={Lock} items={['No card, ever, to get the read', 'Your read is yours to keep', 'Nothing prescribed, nothing to comply with', 'Reply STOP to the texts any time']} />}
        form={<DecodeSignupForm position="footer" />}
      />

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
