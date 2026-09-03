import type { Metadata } from 'next'
import { brand } from "@/config/tenant";
import { ADVISORY } from "@/config/advisors";
import { getTotalQuestions } from "@/lib/intake-questions";

export const metadata: Metadata = {
  title: 'The Engine — Inside Body Recode™ Biological Interpretation (Layer 1)',
  description:
    'The deep technical map of the Body Recode™ interpretation engine (Layer 1). The read instrument, the CFFS, the weekly CFWS, and the doctrine — where interpretation terminates. The downstream application is documented separately.',
  // Exposes engine internals (models, data flow). Kept out of search by default.
  // Flip to index:true if this should be publicly discoverable.
  robots: { index: false, follow: false },
}

/* ---------- Tokens (dark "platform" expression — mirrors the homepage) ---------- */
const BLUE = '#1B6DFC'
const BLUE_LIGHT = '#5390FF'
const CANVAS = '#08090B'
const CANVAS_2 = '#0C0E12'
const SURFACE = '#121419'
const BORDER = 'rgba(255,255,255,0.08)'
const TXT = '#FFFFFF'
const TXT_BODY = '#C5C8D2'
const TXT_DIM = '#8A8E9B'
const TXT_MUTE = '#565A66'
const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

const CLINICAL = 'Claude Sonnet 5'   // AI_MODELS.clinical
const OPERATIONAL = 'Claude Haiku 4.5' // AI_MODELS.operational

/* ---------- Data ---------- */
const FOOTPRINT = [
  { n: String(getTotalQuestions()), l: 'intake questions', d: 'the read instrument · 8 domains' },
  { n: '5', l: 'interpretive pillars', d: 'FMM primary + PTS/HABNS/RRS/BIRS' },
  { n: '4 + 14', l: 'Fat Map', d: 'patterns + extended sub-zones' },
  { n: '3', l: 'body states', d: 'the classification' },
  { n: 'CFFS', l: 'one read', d: 'refreshed weekly as the CFWS' },
  { n: '39k', l: 'lines of canon', d: 'the doctrine behind it' },
]

const STAGES = [
  { n: '00', label: 'The Read Instrument', tag: 'Inputs' },
  { n: '01', label: 'CFFS — Core Interpretation', tag: 'Layer 1 · the terminus' },
  { n: '02', label: 'CFWS — Weekly Re-Read', tag: 'Layer 1' },
  { n: '03', label: 'Signal Monitoring', tag: 'Layer 1 · governance' },
]

const INPUTS = [
  {
    name: 'Foundational Intake',
    meta: `8 domains · ${getTotalQuestions()} questions`,
    model: null,
    desc: 'The deep input. Eight scored signal domains map one-to-one onto eight JSONB buckets the engine reads: Fat Map, Injury, Training, Nutrition, Schedule, Sleep, Stress, Medications/Supplements.',
    store: 'intakes.*',
  },
  {
    name: 'Baseline',
    meta: 'measurements + photos',
    model: null,
    desc: 'Height, bodyweight, waist, hips, chest, and three photos (front / side / back). The photos feed the engine’s vision read; bodyweight floors the nutrition protein anchor, and height is what makes an energy estimate possible at all.',
    store: 'baselines.*',
  },
  {
    name: 'Medications',
    meta: 'free text · longitudinal',
    model: null,
    desc: 'A single free-text field soliciting hormonal and non-hormonal pharmacology. Read by the engine for signal class, never moralised, never propagated as a compound name to client prose.',
    store: 'clients.medications',
  },
  {
    name: 'Blood Panel',
    meta: 'optional · multimodal',
    model: CLINICAL,
    desc: 'Client uploads a lab PDF/photo. The engine transcribes every marker against the lab’s own printed range — transcription, not diagnosis. Only a coach-approved panel reaches the interpretation.',
    store: 'blood_panels.*',
  },
]

const CFFS_INPUTS = [
  'Eight intake domains (pre-summarised: average, elevated ≥3/4, low ≤1/4)',
  'Baseline measurements → derived ratios (BMI, waist-to-height) with a plausibility check',
  'Baseline photos → vision read (Spatial Patterning)',
  'Any prior pattern read carried in from the funnel (not binding)',
  'clients.medications (free text)',
  'Dietary context (hard constraints)',
  'Approved blood markers (the coach gate)',
]

const CFFS_OUTPUTS = [
  'body_state_classification',
  'pattern_classification (one of four) + confidence',
  'pattern_rationale + competing read',
  'resolution_state',
  'client_context_summary',
  'primary_patterns_and_signals',
  'capacity_constraints_and_guardrails',
  'risk_flags_and_watch_items',
  'tensions_and_tradeoffs',
  'explicit_non_directives',
  'closing_interpretive_notes',
  'visual_signal_summary',
  'exposure_readiness ×4 (Capacity / Schedule / Regulation / Behaviour)',
]

// Layer 2 — the Performance Coaching application built on the engine (summarised here; documented separately)
const LAYER2 = [
  { group: 'Client readings', items: ['Foundational', 'Program', 'Nutrition', 'Medications', 'Trajectory'] },
  { group: 'Generators', items: ['Program (training)', 'Nutrition (+ validator)', 'Medications Analysis', 'Blood Panel Analysis', 'Coach Guidance', 'Recovery Clamp'] },
  { group: 'The weekly loop', items: ['Weekly check-ins (A / B)', 'Coach feedback', 'Workout logging', 'Block-end review'] },
]

const PILLARS = [
  { abbr: 'FMM', name: 'Fat Map Method™', primary: true, desc: 'Primary pillar. Fat accumulation read as hormonal and metabolic signalling, not energy surplus. Where the body stores fat reflects its adaptive response to the current environment.' },
  { abbr: 'PTS', name: 'Performance Training System', desc: 'Physical stress exposure, training load, fatigue and adaptation. Defines what training the body can tolerate now.' },
  { abbr: 'HABNS', name: 'Hybrid Animal-Based Nutrition', desc: 'Nutritional sufficiency and biological threat signalling. Is intake supporting regulation or reinforcing scarcity.' },
  { abbr: 'RRS', name: 'Recovery & Regulation System', desc: 'Capacity to restore and return to baseline. Distinguishes genuine recovery from suppression. RRS always overrides training.' },
  { abbr: 'BIRS', name: 'Behaviour, Identity & Rhythm', desc: 'Emotional load and identity constraints as structural biological stressors. Compliance and identity threat are inputs, not psychology.' },
]

const STATES = [
  { label: 'Remediation', pub: 'Depleted', c: '#F04438', desc: 'Under load it cannot resolve. Performance-level intervention here is counterproductive. Most who present believing they are elsewhere are actually here.' },
  { label: 'Optimisation', pub: 'Transitioning', c: '#F5A623', desc: 'Stabilised. Capacity exists to pursue body composition and performance. Where most coaching begins, but few arrive here.' },
  { label: 'Post-Optimisation', pub: 'Ready', c: BLUE_LIGHT, desc: 'Performing. The goal shifts to identity-level performance and long-term maintenance. Built over time, never forced.' },
]

const ZONES = [
  { zone: 'Cortisol', name: 'Stress-Stored', loc: 'Front of the midsection', signal: 'The middle fills while the limbs stay lean', ext: ['Lower Abdominal Compression', 'Peripheral Sparing'] },
  { zone: 'Insulin', name: 'Insulin-Drift', loc: 'Mid-back, lower back, flanks', signal: 'Afternoon crash, evening cravings. Front spared', ext: ['Subscapular Fullness', 'Flank Carriage', 'Deep Abdominal Fullness'] },
  { zone: 'Oestrogen', name: 'Estrogen-Shift', loc: 'Hips and thighs, then central', signal: 'Two phases. Direction of travel is the read', ext: ['Glute Shelf Retention', 'Lower Quad Crest Retention', 'Hamstring Tie-In Retention', 'Central Migration'] },
  { zone: 'Testosterone', name: 'Androgen-Decline', loc: 'Not one location', signal: 'Central fat rising while muscle and drive fall', ext: ['Central Accumulation', 'Peripheral Softening', 'Chest Fullness'] },
]

const INFRA = [
  { k: 'Model', v: `Tiered by consequence, never chosen at the call site. ${CLINICAL} for anything whose output reaches a client's body — the read and the lab extraction both sit here. ${OPERATIONAL} for drafting, routing and extraction that is cheap to retry. One multimodal call: photos and lab files run alongside the text.` },
  { k: 'JSON', v: 'A brace-counting extractor, never a greedy regex. Every parse survives prose, code fences and stray commentary.' },
  { k: 'Em dashes', v: 'Recursively stripped from every generated string. A banned AI-writing signal across the whole platform.' },
  { k: 'One live read', v: 'Generating a CFFS or CFWS archives the prior one. reassessment_flagged is always server-set, never by the model.' },
  { k: 'Non-diagnostic', v: 'No interpretive surface names a disease, alters a lab range, or gives medical advice. A marker is a hypothesis, not a finding.' },
  { k: 'Governed, not assumed', v: 'Drift and reassessment are surfaced, not silent — the integrity of the read is monitored across the block.' },
]

/* ---------- Page ---------- */
export default function EnginePage() {
  return (
    <div style={{ background: CANVAS, minHeight: '100vh', color: TXT_BODY, overflowX: 'hidden' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,11,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ ...navLink, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em', color: TXT }}>BODY RECODE™</a>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/#engine" style={navLink}>Schematic</a>
            <a href="#stage-01" style={navLink}>CFFS</a>
            <a href="#stage-02" style={navLink}>CFWS</a>
            <a href="#layer2" style={navLink}>Layer 2</a>
            <a href="#pillars" style={navLink}>Pillars</a>
            <a href="/" style={{ ...navLink, color: BLUE_LIGHT }}>← Home</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '110px 24px 80px', borderBottom: `1px solid ${BORDER}`, background: `radial-gradient(900px 420px at 50% -10%, rgba(27,109,252,0.10), transparent)` }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <SectionLabel>Inside the Engine · Layer 1</SectionLabel>
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 800, color: TXT, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 24 }}>
            The read.<br />Where the engine stops.
          </h1>
          <Prose style={{ maxWidth: 660, fontSize: 17 }}>
            The homepage shows the engine as a schematic. This is the deep version of the engine itself — Layer 1.
            Structured data goes in; a single conservative interpretation comes out as the CFFS, refreshed weekly as
            the CFWS. It prescribes nothing. Everything downstream — programs, nutrition, the client readings, the
            coaching loop — is the Performance Coaching application (Layer 2), powered by this read and documented separately.
          </Prose>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 34 }}>
            <Chip>One interpretive core</Chip>
            <Chip>8 signal domains</Chip>
            <Chip>5 pillars</Chip>
            <Chip>3 body states</Chip>
            <Chip>Interpretation terminates at the CFFS</Chip>
          </div>
        </div>
      </section>

      {/* BY THE NUMBERS */}
      <section style={{ padding: '64px 24px', borderBottom: `1px solid ${BORDER}`, background: CANVAS_2 }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>By the Numbers</SectionLabel>
          <p style={{ fontSize: 15.5, color: TXT_DIM, lineHeight: 1.7, maxWidth: 680, marginBottom: 34 }}>
            The interpretation core is small and dense. Every figure is counted directly from the codebase.
          </p>
          <Grid min={150} gap={1} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: BORDER }}>
            {FOOTPRINT.map((f) => (
              <div key={f.l} style={{ background: SURFACE, padding: '22px 20px' }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: BLUE_LIGHT, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>{f.n}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 4 }}>{f.l}</p>
                <p style={{ fontSize: 11.5, color: TXT_MUTE, lineHeight: 1.5 }}>{f.d}</p>
              </div>
            ))}
          </Grid>
          <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, lineHeight: 1.7, marginTop: 20, letterSpacing: '0.02em' }}>
            This is the engine alone. The application built on it — the Performance Coaching environment, ~126k lines
            across 192 routes and 65 tables — is the far larger codebase, documented separately. The interpretation is
            small; the system that makes it usable is large.
          </p>
        </div>
      </section>

      {/* PIPELINE OVERVIEW */}
      <Section id="overview">
        <SectionLabel>The Pipeline</SectionLabel>
        <SectionHeading>Four engine stages, then the handoff.</SectionHeading>
        <Prose style={{ marginBottom: 44 }}>
          The read instrument feeds the CFFS. The CFFS is re-read weekly as the CFWS, and a deterministic monitor
          watches it for drift. That is the whole engine — it terminates here. Everything past it is the
          Performance Coaching application (Layer 2), powered by the read.
        </Prose>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STAGES.map((s, i) => (
            <div key={s.n}>
              <a href={`#stage-${s.n}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 22px', background: s.n === '01' ? 'linear-gradient(180deg, rgba(27,109,252,0.10), rgba(27,109,252,0.02))' : SURFACE, borderColor: s.n === '01' ? 'rgba(27,109,252,0.4)' : BORDER }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: s.n === '01' ? BLUE_LIGHT : TXT_MUTE }}>{s.n}</span>
                  <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: TXT }}>{s.label}</span>
                  <span style={{ ...chip, color: s.n === '01' ? BLUE_LIGHT : TXT_DIM, borderColor: s.n === '01' ? 'rgba(27,109,252,0.4)' : BORDER }}>{s.tag}</span>
                </div>
              </a>
              {i < STAGES.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </Section>

      {/* STAGE 00 — INPUT */}
      <Section id="stage-00" wide>
        <StageHead n="00" title="The Read Instrument" sub="What the engine reads. Mostly deterministic capture; the only model here transcribes blood panels. The capture surfaces are delivered by the application — the signal schema is the engine's." />
        <Grid min={250} gap={12}>
          {INPUTS.map((it) => (
            <div key={it.name} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{it.name}</p>
                {it.model ? <ModelBadge>{it.model}</ModelBadge> : <span style={{ ...chip, fontSize: 9 }}>deterministic</span>}
              </div>
              <p style={{ fontFamily: MONO, fontSize: 10.5, color: BLUE_LIGHT, letterSpacing: '0.06em', marginBottom: 12 }}>{it.meta}</p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7, marginBottom: 14 }}>{it.desc}</p>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE }}>→ {it.store}</p>
            </div>
          ))}
        </Grid>
        <Callout>
          The CFFS is coach-triggered only after <strong style={{ color: TXT_BODY }}>both</strong> the intake and the baseline photos are in,
          so the Fat Map can read spatial patterning from the photos. The engine's entry point is the Foundational Intake — the public scorecard
          is a Performance Coaching lead-gen tool, upstream of and separate from the engine.
        </Callout>
      </Section>

      {/* STAGE 01 — CFFS */}
      <section id="stage-01" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <StageHead n="01" title="The CFFS" sub="Coach-Facing Foundational Synthesis. The heart of the engine. Interpretation terminates here." accent />
          <div style={{ border: '1px solid rgba(27,109,252,0.45)', borderRadius: 18, padding: 'clamp(22px, 4vw, 34px)', background: 'linear-gradient(180deg, rgba(27,109,252,0.10), rgba(27,109,252,0.02))', boxShadow: `0 0 60px -20px ${BLUE}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>{brand().name}™ Interpretation Engine</p>
              <ModelBadge>{CLINICAL} · multimodal</ModelBadge>
            </div>
            <Grid min={260} gap={20}>
              <div>
                <ColLabel>Reads</ColLabel>
                <ul style={ulStyle}>{CFFS_INPUTS.map((x) => <li key={x} style={liStyle}>{x}</li>)}</ul>
              </div>
              <div>
                <ColLabel>Does</ColLabel>
                <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.8 }}>
                  Pre-summarises the scale domains, reads the photos as one signal stream feeding Spatial Patterning,
                  and resolves the whole picture through the Fat Map’s four location-plus-signal patterns. Conservative resolution
                  always overrides the optimistic read. It classifies the body state and rates four exposure-readiness
                  signals — and prescribes <strong style={{ color: TXT_BODY }}>nothing</strong>.
                </p>
              </div>
              <div>
                <ColLabel>Produces</ColLabel>
                <ul style={ulStyle}>{CFFS_OUTPUTS.map((x) => <li key={x} style={{ ...liStyle, fontFamily: MONO, fontSize: 11.5 }}>{x}</li>)}</ul>
              </div>
            </Grid>
          </div>
          <Grid min={230} gap={12} style={{ marginTop: 16 }}>
            <MiniCard title="Vision" body="Front / side / back photos are base64-encoded and passed to the same Haiku call. Eight rules govern the read: photos are one signal, never the conclusion, and never an aesthetic verdict." />
            <MiniCard title="Blood markers" body="Only a coach-approved panel is read, against the lab’s own ranges. A single out-of-range marker is short-arc evidence, never a diagnosis." />
            <MiniCard title="One live read" body="Generating archives the previous CFFS. reassessment_flagged is always set server-side, never by the model — it is a temporal construct." />
          </Grid>
        </div>
      </section>

      {/* STAGE 02 — CFWS */}
      <Section id="stage-02" wide>
        <StageHead n="02" title="The CFWS" sub="Coach-Facing Weekly Synthesis — the weekly re-read. Still interpretation, still coach-facing, still prescribes nothing." />
        <Grid min={260} gap={20}>
          <div>
            <ColLabel>Reads</ColLabel>
            <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.8 }}>
              The week’s check-in signal, anchored to the CFFS baseline. The capture itself is a Layer 2 surface; the
              engine consumes it the way it consumes the intake.
            </p>
          </div>
          <div>
            <ColLabel>Rule</ColLabel>
            <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.8 }}>
              Readiness moves <strong style={{ color: TXT_BODY }}>one notch at a time</strong> from the CFFS anchor.
              Red is the floor. Two-notch jumps only on a named safety event. Single-form answers can’t downgrade alone.
            </p>
          </div>
          <div>
            <ColLabel>Produces</ColLabel>
            <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.8 }}>
              A weekly synthesis + the four readiness colours → <span style={{ fontFamily: MONO, color: BLUE_LIGHT }}>cfws.*</span>.
              The accumulated sequence becomes the input to the block-end arc.
            </p>
          </div>
        </Grid>
        <div style={{ marginTop: 16 }}><ModelBadge>{CLINICAL}</ModelBadge></div>
      </Section>

      {/* STAGE 03 — SIGNAL MONITORING */}
      <section id="stage-03" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <StageHead n="03" title="Signal Monitoring" sub="The engine’s self-governance: it decides when the read has drifted enough to need refreshing. Deterministic. Prescribes nothing." />
          <Grid min={230} gap={12}>
            <MiniCard title="Drift" body="Any Red in the latest CFWS = high. The same signal Amber/Red across two consecutive weeks = sustained instability. A two-notch drop = high." />
            <MiniCard title="Reassessment routing" body="Drift routes to a lightweight, delta, or full re-read. Signal-based triggers are suppressed until the CFFS is ≥21 days old; a 12-week cap forces a full re-intake." />
            <MiniCard title="RPE creep as signal" body="Avg logged RPE ≥ prescribed +1.0 = creep; +2.0 or any set ≥9.5 = severe. The logging is a Layer 2 surface; the monitor consumes it as one more drift input." />
          </Grid>
          <Callout>
            This is where Layer 1 ends. The monitor’s recommendation loops back to a fresh CFFS. Everything past this point is the application.
          </Callout>
        </div>
      </section>

      {/* LAYER 2 — THE APPLICATION (handoff) */}
      <Section id="layer2" wide>
        <SectionLabel>Layer 2 · Powered by the engine</SectionLabel>
        <SectionHeading>What’s built on the read.</SectionHeading>
        <Prose style={{ marginBottom: 40 }}>
          The engine terminates at the CFFS. Everything below is the <strong style={{ color: TXT_BODY }}>Performance Coaching
          application</strong> — the first of five environments — powered by the read. It consumes the CFFS and never bends it.
          It is documented separately; the other environments (Executive, Tactical, Clinical, Developmental) build their own
          Layer 2 on the same engine.
        </Prose>
        <Grid min={250} gap={12}>
          {LAYER2.map((g) => (
            <div key={g.group} style={cardStyle}>
              <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: BLUE_LIGHT, textTransform: 'uppercase', marginBottom: 12 }}>{g.group}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.items.map((it) => (
                  <li key={it} style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.5, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: BLUE_LIGHT }}>·</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Grid>
        <Callout>
          Execution is bounded by interpretation, never the reverse. A program that wants more load or a client who wants a
          faster result never changes the read. That asymmetry is the whole contract between the two layers.
        </Callout>
      </Section>

      {/* PILLARS */}
      <Section id="pillars" wide>
        <SectionLabel>The Lens</SectionLabel>
        <SectionHeading>Five pillars. One synthesised read.</SectionHeading>
        <Prose style={{ marginBottom: 40 }}>
          The engine reads the body across five pillars at once. No single pillar drives the output alone; the
          interpretation is always a synthesis of the full picture.
        </Prose>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PILLARS.map((p) => (
            <div key={p.abbr} style={{ ...cardStyle, padding: '20px 24px', display: 'grid', gridTemplateColumns: '88px minmax(160px, 1fr) 2fr', gap: 18, alignItems: 'center', borderColor: p.primary ? 'rgba(27,109,252,0.4)' : BORDER, background: p.primary ? 'linear-gradient(180deg, rgba(27,109,252,0.08), rgba(27,109,252,0.02))' : SURFACE }}>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: BLUE_LIGHT }}>{p.abbr}</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{p.name}{p.primary && <span style={{ ...chip, fontSize: 9, marginLeft: 8, color: TXT, background: BLUE, borderColor: BLUE }}>PRIMARY</span>}</p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* STATES + ZONES */}
      <Section wide>
        <SectionLabel>The Classification</SectionLabel>
        <SectionHeading>Three body states. Four patterns, fourteen sub-zones.</SectionHeading>
        <Prose style={{ marginBottom: 40 }}>
          The deep state (named below) is the engine’s own classification, with a public-facing label for
          client language. The Fat Map reads at two resolutions, and location alone does not separate the four — three of
          the four drivers push storage centrally, so the pattern says <em>where</em> to look and the
          accompanying signal decides. The extended sub-zone then says <em>how</em>. Fat-storage conclusions are valid only on the
          long arc — months, not weeks.
        </Prose>
        <Grid min={240} gap={12} style={{ marginBottom: 28 }}>
          {STATES.map((s) => (
            <div key={s.label} style={{ ...cardStyle, borderLeft: `3px solid ${s.c}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: TXT }}>{s.label}</p>
                <span style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE }}>public: {s.pub}</span>
              </div>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </Grid>
        <Grid min={230} gap={10}>
          {ZONES.map((z) => (
            <div key={z.zone} style={{ ...cardStyle, padding: 18 }}>
              <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: BLUE_LIGHT, letterSpacing: '0.1em', marginBottom: 8 }}>{z.zone} · {z.name}</p>
              <p style={{ fontSize: 12.5, color: TXT_MUTE, marginBottom: 6 }}>{z.loc}</p>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.6, marginBottom: 12 }}>{z.signal}</p>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 6 }}>Extended zones</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {z.ext.map((e) => (
                  <li key={e} style={{ fontSize: 12, color: TXT_DIM, lineHeight: 1.4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: BLUE_LIGHT }}>·</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Grid>
      </Section>

      {/* INFRA */}
      <section style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>The Machinery</SectionLabel>
          <SectionHeading>What holds it together.</SectionHeading>
          <Prose style={{ marginBottom: 40 }}>
            Shared discipline runs under every stage — the same model strategy, the same JSON handling, the same
            language guards, the same refusal to do anything silently.
          </Prose>
          <Grid min={300} gap={12}>
            {INFRA.map((it) => (
              <div key={it.k} style={cardStyle}>
                <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: BLUE_LIGHT, textTransform: 'uppercase', marginBottom: 10 }}>{it.k}</p>
                <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75 }}>{it.v}</p>
              </div>
            ))}
          </Grid>
        </div>
      </section>

      {/* BOUNDARIES */}
      <Section wide>
        <SectionLabel>The Line</SectionLabel>
        <SectionHeading>What the engine will not do.</SectionHeading>
        <Grid min={300} gap={12} style={{ marginTop: 32 }}>
          <MiniCard title="It interprets, never prescribes" body="Layer 1 terminates at the CFFS. Prescription is Layer 2 and is always derived from the interpretation, never the other way round." />
          <MiniCard title="Non-diagnostic, absolutely" body="No stage names a disease, alters a lab range, or gives medical advice. Markedly abnormal values are referred to a GP in neutral language." />
          <MiniCard title="Pattern, not event" body="Interpretation is pattern-based and conservative resolution always wins. One reading is a hypothesis; the arc is the evidence." />
          <MiniCard title="No aesthetic verdict" body="Photos are signal, not judgment. Words like overweight, lean, soft or athletic are banned from the read." />
          <MiniCard title="The machinery stays hidden" body="No CFFS, RPE or cortisol language ever reaches the client. The reading family translates everything into one voice." />
          <MiniCard title="Brand boundary held" body="Structured compound tracking is Arete’s lane. Body Recode captures it only as free text and never propagates compound names to client prose." />
        </Grid>
      </Section>

      {/* INDEPENDENT REVIEW */}
      <Section wide>
        <SectionLabel>{ADVISORY.eyebrow}</SectionLabel>
        <SectionHeading>{ADVISORY.heading}</SectionHeading>
        <Prose style={{ marginBottom: 40 }}>{ADVISORY.intro}</Prose>
        <Grid min={260} gap={12}>
          {ADVISORY.advisors.map((a) => (
            <div key={a.id} style={cardStyle}>
              {a.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photo} alt={a.name ?? a.role} style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover', filter: 'grayscale(1)', marginBottom: 16 }} />
              )}
              <p style={{ fontSize: 15, fontWeight: 700, color: TXT, lineHeight: 1.3, marginBottom: 4 }}>
                {a.name ?? a.role}
              </p>
              <p style={{ fontFamily: MONO, fontSize: 10.5, color: BLUE_LIGHT, letterSpacing: '0.06em', marginBottom: 16 }}>
                {a.name ? (a.credentials ?? a.role) : a.detail}
              </p>
              <ColLabel>Reviewing</ColLabel>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.7 }}>{a.reviewing}</p>
              {a.href && (
                <a href={a.href} style={{ ...navLink, color: BLUE_LIGHT, display: 'inline-block', marginTop: 14 }}>Profile →</a>
              )}
            </div>
          ))}
        </Grid>
        <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE, lineHeight: 1.7, marginTop: 22, letterSpacing: '0.02em' }}>
          {ADVISORY.note}
        </p>
      </Section>

      {/* FOOTER */}
      <footer style={{ padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 14 }}>{brand().name}™ · Biological Interpretation Intelligence Platform</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={navLink}>Home</a>
          <a href="/#engine" style={navLink}>The schematic</a>

        </div>
      </footer>
    </div>
  )
}

/* ---------- Components ---------- */
function StageHead({ n, title, sub, accent }: { n: string; title: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 'clamp(34px, 6vw, 54px)', fontWeight: 800, color: accent ? BLUE_LIGHT : 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{n}</span>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: TXT, letterSpacing: '-0.025em', lineHeight: 1.1 }}>{title}</h2>
      </div>
      <p style={{ maxWidth: 720, fontSize: 15.5, color: TXT_DIM, lineHeight: 1.75, paddingLeft: 2 }}>{sub}</p>
    </div>
  )
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: TXT, marginBottom: 10 }}>{title}</p>
      <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75 }}>{body}</p>
    </div>
  )
}

function ModelBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', color: BLUE_LIGHT, border: '1px solid rgba(27,109,252,0.4)', background: 'rgba(27,109,252,0.08)', borderRadius: 999, padding: '4px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</span>
  )
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 8 }}>{children}</p>
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span style={chip}>{children}</span>
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24, borderLeft: `3px solid ${BLUE}`, background: 'rgba(27,109,252,0.05)', borderRadius: 8, padding: '18px 22px', fontSize: 14, color: TXT_DIM, lineHeight: 1.8 }}>
      {children}
    </div>
  )
}

function Section({ id, wide, children }: { id?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: '100px 24px', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: wide ? 1040 : 880, margin: '0 auto' }}>{children}</div>
    </section>
  )
}

function Grid({ min, gap = 12, style, children }: { min: number; gap?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap, ...style }}>{children}</div>
}

function Prose({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return <div style={{ maxWidth: 640, color: TXT_DIM, fontSize: 16, lineHeight: 1.85, ...style }}>{children}</div>
}

function Connector() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: 28 }}>
      <div style={{ width: 1, height: '100%', background: 'linear-gradient(180deg, rgba(27,109,252,0.5), rgba(27,109,252,0.1))' }} />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ width: 28, height: 2, borderRadius: 2, background: BLUE }} />
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>{children}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800, color: TXT, letterSpacing: '-0.025em', lineHeight: 1.12, marginBottom: 20 }}>{children}</h2>
}

const cardStyle: React.CSSProperties = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }
const navLink: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: TXT_DIM, textDecoration: 'none', letterSpacing: '0.01em' }
const chip: React.CSSProperties = { fontFamily: MONO, fontSize: 11, color: TXT_DIM, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 10px', background: 'rgba(255,255,255,0.02)', letterSpacing: '0.02em' }
const ulStyle: React.CSSProperties = { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }
const liStyle: React.CSSProperties = { fontSize: 13, color: TXT_DIM, lineHeight: 1.5, paddingLeft: 14, position: 'relative' }
