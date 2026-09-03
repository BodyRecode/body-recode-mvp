import type { Metadata } from 'next'
import Image from 'next/image'
import LicensingEnquiryForm from '@/components/marketing/licensing-enquiry-form'
import { ADVISORY } from '@/config/advisors'
import { brand } from "@/config/tenant";

export const metadata: Metadata = {
  title: 'Body Recode™ | The interpretation engine',
  description:
    'Body Recode™ reads what state a body is in before any training, nutrition or clinical intervention is designed. One engine, 221 structured signals, and it stops at the read. Licensable for practitioners, clinics and platforms.',
}

/* ---------- Tokens (dark "platform" expression of the shared brand) ---------- */
const BLUE = '#1B6DFC'
const BLUE_LIGHT = '#5390FF'
const CANVAS = '#08090B'
const CANVAS_2 = '#0C0E12'
const SURFACE = '#121419'
const BORDER = 'rgba(255,255,255,0.08)'
const BORDER_STRONG = 'rgba(255,255,255,0.14)'
const TXT = '#FFFFFF'
const TXT_BODY = '#C5C8D2'
const TXT_DIM = '#8A8E9B'
const TXT_MUTE = '#565A66'
const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/* ---------- Data ---------- */
const DOMAINS = [
  { num: '01', name: 'Training Load', desc: 'Physical stress exposure, training history, volume and fatigue patterns.' },
  { num: '02', name: 'Recovery Capacity', desc: 'The system’s ability to restore and return to baseline between exposures.' },
  { num: '03', name: 'Stress Architecture', desc: 'How the stress response is organised and its capacity to resolve accumulated load.' },
  { num: '04', name: 'Hormonal Signals', desc: 'Endocrine markers and hormonal regulation patterns affecting body state.' },
  { num: '05', name: 'Fat Distribution', desc: 'Adaptive fat accumulation read as hormonal signalling via the Fat Map Method™.' },
  { num: '06', name: 'Sleep Quality', desc: 'Sleep depth, recovery patterns and nervous system restoration during rest.' },
  { num: '07', name: 'Behavioural Patterns', desc: 'Observable behaviours reflecting underlying biological state and adaptation capacity.' },
  { num: '08', name: 'Emotional Load', desc: 'Emotional threat, identity load and over-compliance read as structural stressors.' },
]

const PILLARS_SHORT = [
  { abbr: 'FMM', name: 'Fat Map Method™' },
  { abbr: 'PTS', name: 'Performance Training System' },
  { abbr: 'HABNS', name: 'Hybrid Animal-Based Nutrition' },
  { abbr: 'RRS', name: 'Recovery & Regulation System' },
  { abbr: 'BIRS', name: 'Behaviour, Identity & Rhythm' },
]

const PILLARS = [
  {
    num: '02',
    name: 'Performance Training System',
    abbr: 'PTS',
    desc: 'Reads physical stress exposure, training load, fatigue and adaptation signals. Defines the risk and capacity picture for what training the body can tolerate now.',
  },
  {
    num: '03',
    name: 'Hybrid Animal-Based Nutrition System',
    abbr: 'HABNS',
    desc: 'Interprets nutritional sufficiency and biological threat signalling. Assesses whether intake is supporting regulation or reinforcing scarcity and hormonal disruption.',
  },
  {
    num: '04',
    name: 'Recovery and Regulation System',
    abbr: 'RRS',
    desc: 'Reads the system’s capacity to restore, downregulate and return to baseline. Distinguishes genuine recovery from suppression: the body that appears stable but is not regenerating.',
  },
  {
    num: '05',
    name: 'Behaviour, Identity and Rhythm System',
    abbr: 'BIRS',
    desc: 'Interprets emotional load, identity constraints and behavioural patterns as structural biological stressors. Compliance and identity threat are inputs, not psychology.',
  },
]

const FAT_ZONES = [
  { zone: 'Cortisol', name: 'Stress-Stored', loc: 'Front of the midsection', signal: 'The middle fills while the limbs stay lean', ext: ['Lower Abdominal Compression', 'Peripheral Sparing'] },
  { zone: 'Insulin', name: 'Insulin-Drift', loc: 'Mid-back, lower back, flanks', signal: 'Afternoon crash, evening cravings. Front spared', ext: ['Subscapular Fullness', 'Flank Carriage', 'Deep Abdominal Fullness'] },
  { zone: 'Oestrogen', name: 'Estrogen-Shift', loc: 'Hips and thighs, then central', signal: 'Two phases. Direction of travel is the read', ext: ['Glute Shelf Retention', 'Lower Quad Crest Retention', 'Hamstring Tie-In Retention', 'Central Migration'] },
  { zone: 'Testosterone', name: 'Androgen-Decline', loc: 'Not one location', signal: 'Central fat rising while muscle and drive fall', ext: ['Central Accumulation', 'Peripheral Softening', 'Chest Fullness'] },
]

const STATES = [
  {
    label: 'Remediation',
    pub: 'Depleted',
    c: '#F04438',
    text: 'The body is under load it cannot resolve. Stress architecture is dominant. Recovery is compromised. Pushing performance-level intervention here is counterproductive. Most who present believing they are in Optimisation are actually here.',
  },
  {
    label: 'Optimisation',
    pub: 'Transitioning',
    c: '#F5A623',
    text: 'The body has stabilised. Capacity exists to pursue body composition and performance goals. This is where most coaching begins, but very few clients are actually here when they arrive.',
  },
  {
    label: 'Post-Optimisation',
    pub: 'Ready',
    c: BLUE_LIGHT,
    text: 'The body is performing. The goal shifts to identity-level performance and long-term system maintenance. Built over time. Cannot be forced.',
  },
]

const ENVIRONMENTS = [
  {
    live: true,
    kicker: 'Health & Fitness',
    title: 'Performance Coaching',
    desc: 'The founder\u2019s own coaching practice, and the first thing built on the engine. It runs on the read daily, which is where the doctrine gets tested against real bodies. It is a separate product with its own brand, powered by the engine rather than part of it.',
    link: { href: brand().performanceDomain, label: 'Visit Performance Coaching →' },
  },
  {
    kicker: 'Corporate & Executive',
    title: 'Executive Performance',
    desc: 'High-performing professionals under chronic cognitive and organisational load. The body under sustained mental stress responds identically to physical stress: cortisol elevation, recovery suppression, regulatory disruption.',
  },
  {
    kicker: 'Military & Tactical',
    title: 'Operational Readiness',
    desc: 'Defence personnel, law enforcement and tactical operators. The stakes of misread body state in this environment are operational. An operator in Remediation pushed through performance-level training is a liability.',
  },
  {
    kicker: 'Medical & Allied Health',
    title: 'Clinical Integration',
    desc: 'GPs, physiotherapists, sports medicine practitioners and allied health professionals. Body Recode™ sits upstream of clinical assessment, providing a structured biological read that informs the clinical picture before the appointment.',
  },
  {
    kicker: 'Education & Youth',
    title: 'Developmental Performance',
    desc: 'Young athletes, student populations and development-stage bodies. The earlier a body is read correctly, the less dysfunction accumulates over time.',
  },
]

export default function HomePage() {
  return (
    <div style={{ background: CANVAS, minHeight: '100vh', color: TXT_BODY, overflowX: 'hidden' }}>
      {/* ===== NAV ===== */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(8,9,11,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 84,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a href="/" style={{ display: 'block' }}>
            <Image
              src="/logo-black.png"
              alt={brand().name}
              width={220}
              height={97}
              priority
              style={{ height: 64, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#engine" className="nav-link" style={navLink}>The engine</a>
            <a href="#line" className="nav-link" style={navLink}>What it won&rsquo;t do</a>
            <a href="#licensing" className="nav-link" style={navLink}>Licensing</a>
            <a
              href="#enquire"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: TXT,
                background: BLUE,
                padding: '9px 18px',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: `0 0 0 1px ${BLUE}, 0 8px 24px -8px ${BLUE}`,
              }}
            >
              Enquire
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        style={{
          position: 'relative',
          padding: '120px 24px 100px',
          borderBottom: `1px solid ${BORDER}`,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 720,
            height: 360,
            background: 'radial-gradient(ellipse at center, rgba(27,109,252,0.22), transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px 6px 10px',
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: 999,
              marginBottom: 28,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: BLUE_LIGHT, boxShadow: `0 0 8px ${BLUE_LIGHT}` }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: TXT_DIM }}>
              v1.0 · 221 signals · 8 domains · 5 pillars · 3 states
            </span>
          </div>

          <p
            style={{
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.22em',
              color: BLUE_LIGHT,
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            The Interpretation Engine
          </p>
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 800,
              color: TXT,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              marginBottom: 28,
            }}
          >
            Interpretation
            <br />
            before prescription.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: TXT_DIM, maxWidth: 620, marginBottom: 40 }}>
            One engine that reads what state a person&rsquo;s body is actually in: how they are storing fat and
            why, what their capacity and regulation can currently take, and what should not be touched yet. It
            reads 221 structured signals and stops there. It does not write programs, diets or treatment.
            What gets built on the read is yours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a
              href="#enquire"
              style={{
                background: BLUE,
                color: TXT,
                fontWeight: 700,
                fontSize: 14,
                padding: '15px 30px',
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: `0 10px 30px -10px ${BLUE}`,
              }}
            >
              Enquire about licensing
            </a>
            <a
              href="#engine"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: TXT,
                fontWeight: 600,
                fontSize: 14,
                padding: '15px 30px',
                borderRadius: 10,
                border: `1px solid ${BORDER_STRONG}`,
                textDecoration: 'none',
              }}
            >
              See the engine ↓
            </a>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <Section>
        <SectionLabel>The Problem</SectionLabel>
        <SectionHeading>Every intervention fails at the same point.</SectionHeading>
        <Prose>
          <p style={{ marginBottom: 18 }}>
            The conventional model is to assess goals, prescribe an approach, measure output and
            adjust. This works when the body is in a state to respond. Most of the time, it is not.
            The model assumes readiness. It rarely asks whether it exists.
          </p>
          <p>
            The result is effort without response. Training that does not build. Nutrition that does
            not shift body composition. Recovery that never fully lands. The intervention is not
            wrong. The sequencing is.
          </p>
        </Prose>
      </Section>

      {/* ===== THE SOLUTION ===== */}
      <Section>
        <SectionLabel>The Solution</SectionLabel>
        <SectionHeading>Read the body first. Then prescribe.</SectionHeading>
        <Prose style={{ marginBottom: 44 }}>
          {brand().name}™ sits one step upstream of every intervention. Before anything is prescribed, it
          answers one question: what state is this body in right now, and why is it organised that way?
          Everything downstream is built from that answer.
        </Prose>
        <Grid min={220}>
          <StatCard value="221" label="Intake data points" detail="Structured across eight signal domains. Not a questionnaire. A biological read." />
          <StatCard value="5" label="Interpretive pillars" detail="Each reads a different domain. The output is always a synthesis." />
          <StatCard value="3" label="Body state classifications" detail="Every body, every environment. The classification drives everything downstream." />
        </Grid>
      </Section>

      {/* ===== ARCHITECTURE ===== */}
      <Section wide>
        <SectionLabel>Architecture</SectionLabel>
        <SectionHeading>Two layers. Neither collapses into the other.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          The interpretive layer is owned by {brand().name}™. The execution layer is owned by the
                            practitioner. The separation is architectural, not stylistic. It is what makes the system
                            defensible and licensable.
                          </Prose>
        <Grid min={300}>
          <LayerCard
            accent
            label="Layer 1 · Interpretation"
            owner="Owned by Body Recode™"
            body="Takes structured input data across eight signal domains and produces the CFFS: Coach-Facing Foundational Synthesis. It does not prescribe. It does not design programs. Interpretation terminates at interpretation."
          />
          <LayerCard
            label="Layer 2 · Execution"
            owner="Owned by the practitioner"
            body="Downstream of the CFFS, the practitioner designs the actual intervention: training, nutrition, load management, clinical protocol, performance strategy. Everything here is derived from the interpretation. The interpretation never changes to accommodate the execution."
          />
        </Grid>
      </Section>

      {/* ===== THE LINE ===== */}
      <Section id="line" wide>
        <SectionLabel>The Line</SectionLabel>
        <SectionHeading>What the engine will not do.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          The limits are the product. An interpretation that quietly starts prescribing is no longer an
          interpretation, and one that bends to suit what somebody wants to sell is worth nothing.
        </Prose>
        <Grid min={260}>
          <LimitCard
            title="It does not prescribe"
            body="No programs, no meal plans, no protocols, no dosages. The output is a read. What is done about it is the practitioner\u2019s decision and the practitioner\u2019s responsibility."
          />
          <LimitCard
            title="It does not diagnose"
            body="It reads patterns in structured self-reported data. It does not name conditions, it does not replace investigation, and where something belongs with a doctor it is written to say so."
          />
          <LimitCard
            title="It does not treat"
            body="Nothing here is medical care and nothing here substitutes for it. The engine sits before the clinical picture and informs it. It does not stand in for it."
          />
          <LimitCard
            title="It does not bend"
            body="The interpretation never changes to accommodate the execution. If the read says the body cannot take what somebody wants to sell it, the read stands and the plan changes."
          />
        </Grid>
      </Section>

      {/* ===== THE ENGINE (schematic) ===== */}
      <section id="engine" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>The Engine</SectionLabel>
          <SectionHeading>One interpretive core. Built to scale across industries.</SectionHeading>
          <Prose style={{ maxWidth: 720, marginBottom: 28 }}>
            Structured client data is read across five pillars, classified into a body state, and
            resolved into the CFFS. The engine is environment-agnostic. Each execution layer is a
            downstream application with its own product, interface and practitioner tools.
          </Prose>

          <a
            href="/engine"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(27,109,252,0.08)',
              color: BLUE_LIGHT,
              fontWeight: 600,
              fontSize: 13.5,
              padding: '12px 22px',
              borderRadius: 10,
              border: '1px solid rgba(27,109,252,0.4)',
              textDecoration: 'none',
              marginBottom: 56,
            }}
          >
            Open the engine — full technical breakdown →
          </a>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* INPUT */}
            <StageCard kicker="Input" title="Foundational Intake" meta="221 structured signals">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DOMAINS.map((d) => (
                  <span key={d.num} style={chip}>{d.name}</span>
                ))}
              </div>
            </StageCard>

            <Connector />

            {/* ENGINE CORE */}
            <div
              style={{
                position: 'relative',
                border: '1px solid rgba(27,109,252,0.45)',
                borderRadius: 18,
                padding: '32px 28px',
                background: 'linear-gradient(180deg, rgba(27,109,252,0.10), rgba(27,109,252,0.02))',
                boxShadow: `0 0 60px -20px ${BLUE}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>
                  {brand().name}™ Interpretation Engine
                                                  </p>
                <span style={{ ...chip, borderColor: 'rgba(27,109,252,0.4)', color: BLUE_LIGHT }}>Owned · Layer 1</span>
              </div>
              <Grid min={150} gap={10}>
                {PILLARS_SHORT.map((p) => (
                  <div key={p.abbr} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: BLUE_LIGHT, marginBottom: 6 }}>{p.abbr}</p>
                    <p style={{ fontSize: 12.5, color: TXT_BODY, lineHeight: 1.4, fontWeight: 500 }}>{p.name}</p>
                  </div>
                ))}
              </Grid>
            </div>

            <Connector />

            {/* CLASSIFICATION */}
            <StageCard kicker="Classification" title="Body State" meta="1 of 3">
              <Grid min={180} gap={10}>
                {STATES.map((s) => (
                  <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderLeft: `3px solid ${s.c}`, borderRadius: 10, padding: '14px 16px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 3 }}>{s.label}</p>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE }}>public: {s.pub}</p>
                  </div>
                ))}
              </Grid>
            </StageCard>

            <Connector />

            {/* OUTPUT */}
            <StageCard kicker="Output" title="CFFS" meta="Coach-Facing Foundational Synthesis" tail>
              <p style={{ fontSize: 14, color: TXT_DIM, lineHeight: 1.7 }}>
                A single synthesised read. Non-prescriptive. Interpretation terminates here. The
                execution layer is built downstream by the practitioner, and never changes the
                interpretation to suit itself.
              </p>
            </StageCard>

            <div style={{ textAlign: 'center', margin: '8px 0 4px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: TXT_MUTE, textTransform: 'uppercase' }}>
              ↓ the same read applies in five contexts ↓
            </div>

            <Grid min={170} gap={10} style={{ marginTop: 12 }}>
              {ENVIRONMENTS.map((e) => (
                <div
                  key={e.title}
                  style={{
                    border: e.live ? '1px solid rgba(27,109,252,0.4)' : `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: '16px',
                    background: e.live ? 'rgba(27,109,252,0.06)' : SURFACE,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.live ? BLUE_LIGHT : '#3A3D47', boxShadow: e.live ? `0 0 8px ${BLUE_LIGHT}` : 'none' }} />
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: e.live ? BLUE_LIGHT : TXT_MUTE }}>
                      {e.live ? 'In use' : 'Not built'}
                    </span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: TXT_MUTE, marginBottom: 5 }}>{e.kicker}</p>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: e.live ? TXT : TXT_DIM, lineHeight: 1.3 }}>{e.title}</p>
                </div>
              ))}
            </Grid>
          </div>
        </div>
      </section>

      {/* ===== SIGNAL DOMAINS ===== */}
      <Section wide>
        <SectionLabel>Foundational Intake</SectionLabel>
        <SectionHeading>221 structured signals. Eight domains.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          Before any interpretation begins, the system collects structured data across eight distinct
          signal domains. The depth and specificity of the intake is what makes the output
          defensible.
        </Prose>
        <Grid min={230}>
          {DOMAINS.map((d) => (
            <div key={d.num} style={cardStyle}>
              <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: BLUE_LIGHT, textTransform: 'uppercase', marginBottom: 12 }}>{d.num}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 8 }}>{d.name}</p>
              <p style={{ fontSize: 12.5, color: TXT_DIM, lineHeight: 1.7 }}>{d.desc}</p>
            </div>
          ))}
        </Grid>
      </Section>

      {/* ===== INTERPRETIVE PILLARS ===== */}
      <Section wide>
        <SectionLabel>Interpretive Pillars</SectionLabel>
        <SectionHeading>Five pillars. One synthesised read.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          The engine reads the body across five distinct pillars simultaneously. Each contributes
          signal data. No single pillar drives the output in isolation. The interpretation is always
          a synthesis of the full picture.
        </Prose>

        {/* Pillar 1 featured */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(27,109,252,0.08), rgba(27,109,252,0.02))',
            border: '1px solid rgba(27,109,252,0.35)',
            borderRadius: 18,
            padding: 32,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>
              Pillar 01 · FMM
            </p>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, background: BLUE, color: TXT, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Primary
            </span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: TXT, marginBottom: 12 }}>Fat Map Method™</h3>
          <p style={{ fontSize: 14, color: TXT_DIM, lineHeight: 1.85, marginBottom: 24, maxWidth: 760 }}>
            Fat accumulation patterns are read as hormonal and metabolic signalling, not simple energy
            surplus. Where the body stores fat reflects its adaptive response to the current hormonal
            and regulatory environment.
          </p>
          <Grid min={220} gap={10}>
            {FAT_ZONES.map((z) => (
              <div key={z.zone} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: BLUE_LIGHT }}>{z.zone}</p>
                  <p style={{ fontSize: 11, color: TXT_MUTE }}>{z.loc}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 4 }}>{z.name}</p>
                <p style={{ fontSize: 11.5, color: TXT_DIM, lineHeight: 1.6, marginBottom: 10 }}>{z.signal}</p>
                <p style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 4 }}>Extended zones</p>
                <p style={{ fontSize: 11, color: TXT_MUTE, lineHeight: 1.55 }}>{z.ext.join(' · ')}</p>
              </div>
            ))}
          </Grid>
          <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, lineHeight: 1.6, marginTop: 14 }}>
            Location narrows the read, the accompanying signal decides it — three of the four drivers push storage centrally. Each pattern then resolves further into extended sub-zones.
          </p>
        </div>

        {/* Pillars 2-5 */}
        <Grid min={300}>
          {PILLARS.map((p) => (
            <div key={p.num} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: TXT_MUTE, textTransform: 'uppercase' }}>Pillar {p.num}</p>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: TXT_DIM, border: `1px solid ${BORDER_STRONG}`, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.1em' }}>{p.abbr}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: TXT, marginBottom: 10 }}>{p.name}</p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </Grid>
      </Section>

      {/* ===== BODY STATES ===== */}
      <Section wide>
        <SectionLabel>Classification Output</SectionLabel>
        <SectionHeading>Three body states. Every body, every environment.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          The interpretation produces one of three classifications. The classification drives the
          entire downstream approach.
        </Prose>
        <Grid min={300}>
          {STATES.map((s) => (
            <div key={s.label} style={{ ...cardStyle, borderTop: `2px solid ${s.c}` }}>
              <div style={{ width: 28, height: 2, background: s.c, borderRadius: 2, marginBottom: 14 }} />
              <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: s.c, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, marginBottom: 14 }}>public: {s.pub}</p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.8 }}>{s.text}</p>
            </div>
          ))}
        </Grid>
        <p style={{ fontSize: 12, color: TXT_MUTE, marginTop: 24, maxWidth: 720, lineHeight: 1.7 }}>
          Practitioner-facing labels are shown above. Consumer-facing translations (Depleted /
          Transitioning / Ready) are used in client communication, never in the CFFS.
        </p>
      </Section>

      {/* ===== ENVIRONMENTS ===== */}
      <section id="environments" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Where the read applies</SectionLabel>
          <SectionHeading>One engine. The context changes, the biology does not.</SectionHeading>
          <Prose style={{ maxWidth: 720, marginBottom: 20 }}>
            The body responds to load through the same mechanisms whether the load is training, work,
            deployment or illness. So the read is the same in every context. What changes is what the
            practitioner does with it afterwards.
          </Prose>
          <Prose style={{ maxWidth: 720, marginBottom: 44, color: TXT_MUTE, fontSize: 14 }}>
            Said plainly, because it matters: performance coaching is the only one of these in operation
            today, and it is the founder&rsquo;s own practice. The other four are contexts the same read
            applies to. They are not products, they are not in development, and nothing is being sold in
            them. They are listed because the engine is context-agnostic by design, not because they exist.
          </Prose>
          <Grid min={300}>
            {ENVIRONMENTS.map((e) => (
              <div
                key={e.title}
                style={{
                  background: e.live ? 'rgba(27,109,252,0.06)' : SURFACE,
                  border: e.live ? '1px solid rgba(27,109,252,0.35)' : `1px solid ${BORDER}`,
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: e.live ? BLUE_LIGHT : TXT_MUTE, textTransform: 'uppercase' }}>{e.kicker}</p>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      background: e.live ? BLUE : 'transparent',
                      color: e.live ? TXT : TXT_MUTE,
                      border: e.live ? 'none' : `1px solid ${BORDER_STRONG}`,
                      padding: '4px 10px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {e.live ? 'In use today' : 'Not built'}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: TXT, marginBottom: 10 }}>{e.title}</h3>
                <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75, marginBottom: e.link ? 18 : 0 }}>{e.desc}</p>
                {e.link && (
                  <a href={e.link.href} style={{ fontSize: 13, color: BLUE_LIGHT, fontWeight: 600, textDecoration: 'none' }}>{e.link.label}</a>
                )}
              </div>
            ))}
          </Grid>
        </div>
      </section>

      {/* ===== INDEPENDENT REVIEW ===== */}
      <Section wide>
        <SectionLabel>{ADVISORY.eyebrow}</SectionLabel>
        <SectionHeading>{ADVISORY.heading}</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>{ADVISORY.intro}</Prose>
        <Grid min={260}>
          {ADVISORY.advisors.map((a) => (
            <div key={a.id} style={cardStyle}>
              <p style={{ fontSize: 15, fontWeight: 700, color: TXT, marginBottom: 4 }}>{a.name ?? a.role}</p>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, marginBottom: 14 }}>
                {a.name ? a.credentials ?? a.role : a.detail}
              </p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75 }}>Reviewing {a.reviewing}</p>
            </div>
          ))}
        </Grid>
        <p style={{ fontSize: 12, color: TXT_MUTE, marginTop: 24, maxWidth: 720, lineHeight: 1.7 }}>
          {ADVISORY.note}
        </p>
      </Section>

      {/* ===== LICENSING ===== */}
      <Section id="licensing" wide>
        <SectionLabel>For Practitioners and Organisations</SectionLabel>
        <SectionHeading>The interpretation engine is licensable.</SectionHeading>
        <Prose style={{ maxWidth: 720, marginBottom: 44 }}>
          {brand().name}™ is built as one interpretive core with multiple execution layers on top. The
                            interpretation engine, the intake architecture and the CFFS methodology are available for
                            licensing, white-labelling or integration into existing workflows.
                          </Prose>
        <Grid min={260}>
          <LicenseCard title="License" desc="Use the Body Recode™ interpretation system within your practice. Full access to the intake architecture, the five interpretive pillars and the CFFS output framework." />
          <LicenseCard title="White-label" desc="Deploy the system under your own brand. The engine, intake and output documents are built to operate independently of the Body Recode™ identity where required." />
          <LicenseCard title="Integrate" desc="Embed the interpretation layer into existing clinical, coaching or organisational workflows. The system sits upstream of whatever the practitioner does with the output." />
        </Grid>
      </Section>

      {/* ===== ENQUIRY ===== */}
      <section id="enquire" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionLabel>Enquire</SectionLabel>
          <SectionHeading>Talk to us about deploying the system.</SectionHeading>
          <Prose style={{ marginBottom: 36 }}>
            Licensing and integration enquiries are handled directly by the founder. Tell us where you
            are operating and what you are trying to solve. We will respond within two business days.
          </Prose>
          <LicensingEnquiryForm />
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: CANVAS, borderTop: `1px solid ${BORDER}`, padding: '64px 24px 36px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <Image
                src="/logo-black.png"
                alt={brand().name}
                width={220}
                height={97}
                style={{ height: 56, width: 'auto', marginBottom: 18, filter: 'brightness(0) invert(1)' }}
              />
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7 }}>
                The interpretation engine.
                <br />
                One read. It stops before the prescription.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterHead>Where it applies</FooterHead>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={brand().performanceDomain} style={{ fontSize: 13, color: BLUE_LIGHT, fontWeight: 600, textDecoration: 'none' }}>Performance Coaching</a>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: BLUE, color: TXT, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.12em' }}>In use</span>
              </div>
              <span style={{ fontSize: 13, color: TXT_MUTE }}>Executive Performance</span>
              <span style={{ fontSize: 13, color: TXT_MUTE }}>Operational Readiness</span>
              <span style={{ fontSize: 13, color: TXT_MUTE }}>Clinical Integration</span>
              <span style={{ fontSize: 13, color: TXT_MUTE }}>Developmental Performance</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterHead>Contact</FooterHead>
              <a href={`mailto:${brand().supportEmail}`} style={{ fontSize: 13, color: TXT_DIM, textDecoration: 'none' }}>{brand().supportEmail}</a>
              <a href="#enquire" style={{ fontSize: 13, color: TXT_DIM, textDecoration: 'none' }}>Licensing enquiry</a>
              <span style={{ fontSize: 13, color: TXT_MUTE }}>Brisbane, Australia</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterHead>Legal</FooterHead>
              <a href="/privacy" style={{ fontSize: 13, color: TXT_DIM, textDecoration: 'none' }}>Privacy</a>
              <a href="/terms" style={{ fontSize: 13, color: TXT_DIM, textDecoration: 'none' }}>Terms</a>
              <a href="/kade" style={{ fontSize: 13, color: TXT_DIM, textDecoration: 'none' }}>Founder</a>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, letterSpacing: '0.04em' }}>© {YEAR} {brand().name}™. All rights reserved.</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, letterSpacing: '0.04em' }}>Interpretation before prescription.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #fff !important; }
        @media (max-width: 720px) {
          .nav-link { display: none; }
        }
      `}</style>
    </div>
  )
}

const YEAR = 2026

/* ---------- Layout primitives ---------- */

function Section({ id, wide, children }: { id?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: '100px 24px', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: wide ? 1040 : 880, margin: '0 auto' }}>{children}</div>
    </section>
  )
}

function Grid({ min, gap = 12, style, children }: { min: number; gap?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap, ...style }}>
      {children}
    </div>
  )
}

function Prose({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return <div style={{ maxWidth: 640, color: TXT_DIM, fontSize: 16, lineHeight: 1.85, ...style }}>{children}</div>
}

const cardStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 24,
}

function Connector() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: 36 }}>
      <div style={{ width: 1, height: '100%', background: 'linear-gradient(180deg, rgba(27,109,252,0.5), rgba(27,109,252,0.1))' }} />
    </div>
  )
}

function StageCard({ kicker, title, meta, tail, children }: { kicker: string; title: string; meta: string; tail?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', background: SURFACE }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: TXT_MUTE, textTransform: 'uppercase' }}>{kicker}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: TXT }}>{title}</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: tail ? BLUE_LIGHT : TXT_MUTE }}>{meta}</span>
      </div>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ width: 28, height: 2, borderRadius: 2, background: BLUE }} />
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>
        {children}
      </span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800, color: TXT, letterSpacing: '-0.025em', lineHeight: 1.12, marginBottom: 20 }}>
      {children}
    </h2>
  )
}

function StatCard({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 30, fontWeight: 800, color: BLUE_LIGHT, marginBottom: 6, letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 12.5, color: TXT_DIM, lineHeight: 1.7 }}>{detail}</p>
    </div>
  )
}

function LayerCard({ accent, label, owner, body }: { accent?: boolean; label: string; owner: string; body: string }) {
  return (
    <div
      style={{
        background: accent ? 'linear-gradient(180deg, rgba(27,109,252,0.08), rgba(27,109,252,0.02))' : SURFACE,
        border: accent ? '1px solid rgba(27,109,252,0.35)' : `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: 32,
      }}
    >
      <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: accent ? BLUE_LIGHT : TXT_DIM, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, marginBottom: 16 }}>{owner}</p>
      <p style={{ fontSize: 14, color: TXT_DIM, lineHeight: 1.85 }}>{body}</p>
    </div>
  )
}

function LimitCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ ...cardStyle, padding: 28, borderLeft: `3px solid ${BORDER_STRONG}` }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: TXT, marginBottom: 10 }}>{title}</p>
      <p style={{ fontSize: 13.5, color: TXT_DIM, lineHeight: 1.8 }}>{body}</p>
    </div>
  )
}

function LicenseCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ ...cardStyle, padding: 28 }}>
      <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: BLUE_LIGHT, textTransform: 'uppercase', marginBottom: 12 }}>{title}</p>
      <p style={{ fontSize: 14, color: TXT_DIM, lineHeight: 1.8 }}>{desc}</p>
    </div>
  )
}

function FooterHead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 4 }}>
      {children}
    </p>
  )
}

const navLink: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: TXT_DIM,
  textDecoration: 'none',
  letterSpacing: '0.01em',
}

const chip: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  color: TXT_DIM,
  border: `1px solid ${BORDER}`,
  borderRadius: 7,
  padding: '5px 10px',
  background: 'rgba(255,255,255,0.02)',
  letterSpacing: '0.02em',
}
