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
  LandingRoot, Nav, Section, Eyebrow, Heading, Callout, Hero, ProofStrip, StatTiles,
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
  'It has settled around your middle, and it never used to sit there.',
  'You eat well all day, then stand in the kitchen at nine at night, not really hungry, eating anyway.',
  'The same clothes fit differently over a fortnight while the scale does not move.',
  'You train hard on Monday and still feel it on Thursday.',
  'Someone tells you it is just your age, or just your hormones, and the conversation ends there.',
]

const READ_PARTS: Feature[] = [
  { icon: Dna, title: 'Which pattern is yours', timing: 'Part 1', desc: 'Named, and explained in plain terms. Not a guess based on where the fat sits, because different causes put it in the same place.', featured: true },
  { icon: Activity, title: 'Why it is happening to you', timing: 'Part 2', desc: 'What is actually causing it, not just the symptoms, and why eating less and training more has been making it worse rather than better.' },
  { icon: Moon, title: 'Where it shows up in an ordinary week', timing: 'Part 3', desc: 'The lived signals. Most women recognise themselves in about ten seconds and have never had a name for any of it.' },
  { icon: ShieldCheck, title: 'What it is commonly mistaken for', timing: 'Part 4', desc: 'Laziness, willpower, too many carbs, just getting older. Every wrong explanation is a plan you already tried.' },
  { icon: Compass, title: 'Three actions, specific to you', timing: 'Part 5', desc: 'Aimed at your actual pattern rather than the average, and in the order that matters.' },
]

const DAYS: Step[] = [
  { number: '1', label: 'Your two lowest scores', weeks: 'Day 1', desc: 'Sleep and stress load are what decide whether the training turns into anything, and they are the two nobody measures.' },
  { number: '2', label: 'Why it is happening', weeks: 'Day 2', desc: 'Your body has decided this is not a safe time to let go of stored fat. Eating less and training harder tells it the same thing again.' },
  { number: '3', label: 'Where this shows up', weeks: 'Day 3', desc: 'A pattern does not arrive as a diagnosis. It arrives as an ordinary week you have stopped noticing is strange.' },
  { number: '4', label: 'What this is not', weeks: 'Day 4', desc: 'The part most people skim, and the one worth reading twice.' },
  { number: '5', label: 'What moves it', weeks: 'Day 5', desc: 'Three actions, and the order to do them in. Start with the regulation ones, not the training one.' },
]

const VOICES: Voice[] = [
  { quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.", name: 'Razia', meta: 'Coaching client · week 8' },
  { quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.", name: 'Amanda', meta: 'Coaching client · 11 weeks in', stateShift: 'Depleted → Transitioning' },
]

const FAQS = [
  { q: 'What is this, exactly?', a: 'A free online assessment. You answer questions about your sleep, stress load, energy, and how your body responds to training and to fat loss. Those five things get scored, and the pattern across them tells us which of four common causes is behind your body not responding. You get that as a written report, and then five short videos walk you through it, one a day.' },
  { q: 'How long does it actually take?', a: 'The questions are twelve taps and four boxes to type in, so about two minutes. Your report is on screen straight after. Then five short videos, one a day, a few minutes each. Nothing is timed and nothing expires.' },
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
          'The Body Decode is a free online assessment for women whose bodies have stopped responding. About two minutes of questions, and at the end you get a written report naming which of four common causes is behind it, why it is happening, what it usually gets mistaken for, and the three things that shift it.',
          'The report is yours to keep. Then five short videos, one a day, walking you through it.',
        ]}
        stats={[
          { value: '2 min', label: 'of questions' },
          { value: '5 videos', label: 'one a day, a few minutes each' },
          { value: '$0', label: 'no card, nothing to buy' },
        ]}
        form={<DecodeSignupForm position="hero" />}
        proofStrip={<ProofStrip items={[
          { icon: Lock, label: 'No card required' },
          { icon: FileText, label: 'A written report you keep' },
          { icon: ShieldCheck, label: 'Nothing to buy, ever, to get it' },
        ]} />}
      />

      {/* "Read" is our word, not hers, and until 24 Aug this page leaned on it
          from the first line without ever defining it. Kade: "it's too cryptic
          for me to understand straight away what it actually is, let alone
          anyone else." Same rule that keeps the spine line off this page: a
          word has to be taught before it can carry weight. Plain description
          first, name second, vocabulary only after that. */}
      <Section bg="grey" pad="64px 24px">
        <Eyebrow>In plain terms</Eyebrow>
        <div style={{ marginBottom: '20px' }}>
          <Heading muted="Not a plan, a programme or a challenge.">We call it a read.</Heading>
        </div>
        <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 16px' }}>
          A read is an assessment of what your body is doing right now, done before anybody writes you anything. You answer questions about your sleep, your stress load, your energy, and how your body responds to training and to fat loss. Those five get scored out of three, and the pattern across them points at which of four common causes is behind it.
        </p>
        <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 16px' }}>
          There is nothing to do during the five days. No training plan, no diet, nothing to comply with and no health form to fill in. You are not being asked to change anything yet, because working out what is actually wrong comes first.
        </p>
        <Callout tone="solid">If you have ever been handed a plan and found out months later it was aimed at the wrong thing, this is the step that was missing.</Callout>
      </Section>

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
        headline="Your body has gone into protection mode."
        body="Protection mode resists fat loss by design, and it is regulation rather than metabolism. Your body is constantly reading its own situation and deciding how safe it is to let go of stored energy: your sleep, the load you are under, whether you are eating enough, how hard you are training, and how long all of it has been going on."
        steps={[
          { k: 'The load stays high', v: 'and it has been high for a while' },
          { k: 'Your body makes a decision', v: 'hold on, this is not the time' },
          { k: 'You eat less and train more', v: 'which tells it the same thing again, so it digs in' },
        ]}
        takeaway="That is not a malfunction. It is the system doing exactly what it is built to do, at a time you would rather it did not."
      />

      {/* HORMONES. Missing from the first build entirely, which was the biggest
          copy gap on the page: almost all of this audience is women and six in
          ten are peri or post, so it is the conversation they are already having
          with themselves.

          The position is deliberately NOT "we fix your hormones". Doctrine is
          that hormones get OVER-attributed, and the moment they take the blame
          the checking stops. Menopause is the POPULATION, not a pillar.

          n=27 and n=25 figures, so RATIOS ONLY - "about a third", never 37%.
          Ratios survive a growing sample, decimals do not. */}
      {/* White, not tint: Mechanism directly above is already the blue band, and
          two tinted sections back to back read as one long band with no break. */}
      <Section pad="72px 24px">
        <Eyebrow>The hormone question</Eyebrow>
        <div style={{ marginBottom: '22px' }}>
          <Heading muted="It is just usually not the whole answer.">Hormones are genuinely in the mix.</Heading>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '26px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 16px' }}>
              About six in ten of the women we assess are perimenopausal or past it. So hormones really are part of this, and nobody is arguing otherwise.
            </p>
            <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 16px' }}>
              Here is what happens next though. <strong style={{ color: INK }}>The moment hormones get the blame, everything else stops being checked.</strong> Not the load you are carrying. Not whether you are eating enough to support it. Not how long any of it has been going on.
            </p>
            <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
              That is not being dismissed. It is being explained away, which is worse, because it sounds like an answer and it ends the conversation.
            </p>
          </div>
          {/* woman-7 is the pre-dawn portrait. She is awake before sunrise,
              which is the argument this section makes. Greyscale is locked. */}
          <div
            aria-hidden="true"
            style={{
              minHeight: '330px', borderRadius: '14px',
              backgroundImage: 'url(/woman-7.jpg)', backgroundSize: 'cover',
              backgroundPosition: '50% 18%', filter: 'grayscale(1)',
            }}
          />
        </div>

        <div style={{ margin: '28px 0 22px' }}>
          <StatTiles stats={[
            { value: 'About a third', label: 'come out oestrogen-driven' },
            { value: 'About half', label: 'come out driven by stress load' },
            { value: '1 in 25', label: 'are actually insulin' },
          ]} />
        </div>

        <Callout tone="solid">So &ldquo;it is your hormones&rdquo; is right often enough to be believable, and wrong often enough to send most women down the wrong road for a year.</Callout>
      </Section>

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
          right={{ label: 'The Body Decode', body: 'The read first. Which pattern is yours, why it is happening, what it usually gets confused with, and the three things that actually shift it. Then you decide what to do, knowing what you are aiming at.' }}
        />
        <Callout tone="solid">Read before you prescribe. It is the whole method, and this is the part of it that costs nothing.</Callout>
      </Section>

      <Section pad="72px 24px">
        <Eyebrow>What you actually get</Eyebrow>
        <div style={{ marginBottom: '10px' }}><Heading>A written report, in five parts.</Heading></div>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 28px' }}>
          You get all five parts as soon as you finish the questions. Nothing is held back and nothing unlocks later, and it stays yours whatever you decide to do next.
        </p>
        <FeatureList items={READ_PARTS} />
      </Section>

      <Section bg="grey" pad="72px 24px">
        <Eyebrow>The five videos</Eyebrow>
        <Heading>Then someone walks you through it.</Heading>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, margin: '10px 0 32px' }}>
          One short video a day, each covering one part of your report. Not because it unlocks, but because a report this long does not get absorbed in one sitting.
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

      {/* IS THIS FOR ME. This existed on the first build and was lost in the kit
          rebuild without being noticed - the three-state split and the
          disqualifier went with it.

          It qualifies on BEHAVIOUR, never on a score she has not seen yet. The
          challenge page filtered to a Depleted State and turned away the half
          who are Transitioning, and working out which one she is IS the
          product. n=88 for the state split, so exact figures would be
          quotable; ratios read better and survive a growing sample. */}
      <Section bg="grey" pad="72px 24px">
        <Eyebrow>Is this for you</Eyebrow>
        <div style={{ marginBottom: '24px' }}>
          <Heading muted="You do not need to know which one you are yet.">This is for women whose bodies have stopped responding.</Heading>
        </div>

        {/* woman-3 is the gym portrait: she is already doing the work, which is
            the whole point of this section. Matching the portrait to the copy is
            a constraint, not a preference. Greyscale is locked. */}
        <div
          aria-hidden="true"
          style={{
            height: '230px', borderRadius: '14px', marginBottom: '26px',
            backgroundImage: 'url(/woman-3.jpg)', backgroundSize: 'cover',
            backgroundPosition: '50% 20%', filter: 'grayscale(1)',
          }}
        />

        <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 22px' }}>
          Almost everyone who does this is a woman, and most have been doing the right things for a while and getting less back for it. Of the women we have assessed:
        </p>

        <div style={{ marginBottom: '24px' }}>
          <StatTiles stats={[
            { value: 'A third', label: 'have nothing spare' },
            { value: 'Half', label: 'are somewhere in the middle' },
            { value: 'Under 1 in 5', label: 'could handle a hard plan today' },
          ]} />
        </div>

        <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
          The read works out which one you are <strong style={{ color: INK }}>before anyone writes you a plan</strong>, so you do not need to know before you start. That is the part everybody skips.
        </p>
        <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
          If you are training well and progressing, this is not for you and it will not tell you much.
        </p>
      </Section>

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
        heading="Ten minutes of questions."
        headingMuted="Then you know what you are actually dealing with."
        sub="Free, and there is no card at signup. Your report is on screen the moment you finish the questions, then five short videos walk you through it. If you are training well and progressing, this is not for you and it will not tell you much."
        riskReversal={<RiskReversalRow icon={Lock} items={['No card at any point to get the report', 'The report is yours to keep', 'Nothing prescribed, nothing to comply with', 'Reply STOP to the texts any time']} />}
        form={<DecodeSignupForm position="footer" />}
      />

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
