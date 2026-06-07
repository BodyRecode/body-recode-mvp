import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Engine — Inside Body Recode™ Biological Interpretation',
  description:
    'The deep technical map of the Body Recode™ interpretation engine. Every stage, every model, every signal — what is done, how it is done, and what it produces.',
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

const HAIKU = 'Claude Haiku 4.5'
const SONNET = 'Claude Sonnet 4.6'

/* ---------- Data ---------- */
const FOOTPRINT = [
  { n: '126k', l: 'lines of code', d: 'TypeScript across the platform' },
  { n: '192', l: 'API routes', d: '25 of them call a model' },
  { n: '65', l: 'database tables', d: 'across 63 schema files' },
  { n: '12', l: 'prompt files', d: '3,764 lines of encoded doctrine' },
  { n: '221', l: 'intake signals', d: 'per client, across 8 domains' },
  { n: '2', l: 'Claude models', d: 'Haiku 4.5 + Sonnet 4.6' },
]

const STAGES = [
  { n: '00', label: 'Input Layer', tag: 'Capture' },
  { n: '01', label: 'CFFS — Core Interpretation', tag: 'Layer 1 · owned' },
  { n: '02', label: 'The Reading Family', tag: 'Client-facing' },
  { n: '03', label: 'Execution Generators', tag: 'Layer 2' },
  { n: '04', label: 'Longitudinal Monitoring', tag: 'Across the block' },
]

const INPUTS = [
  {
    name: 'Foundational Intake',
    meta: '8 domains · ~200 scale signals',
    model: null,
    desc: 'The deep input. Eight scored signal domains map one-to-one onto eight JSONB buckets the engine reads: Fat Map, Injury, Training, Nutrition, Schedule, Sleep, Stress, Medications/Supplements.',
    store: 'intakes.*',
  },
  {
    name: 'Baseline',
    meta: 'measurements + photos',
    model: null,
    desc: 'Bodyweight, waist, hips, chest, and three photos (front / side / back). The photos feed the engine’s vision read; bodyweight floors the nutrition protein anchor.',
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
    model: HAIKU,
    desc: 'Client uploads a lab PDF/photo. The engine transcribes every marker against the lab’s own printed range — transcription, not diagnosis. Only a coach-approved panel reaches the interpretation.',
    store: 'blood_panels.*',
  },
]

const CFFS_INPUTS = [
  'Eight intake domains (pre-summarised: average, elevated ≥3/4, low ≤1/4)',
  'Baseline measurements',
  'Baseline photos → vision read (Spatial Patterning)',
  'clients.medications (free text)',
  'Dietary context (hard constraints)',
  'Approved blood markers (the coach gate)',
]

const CFFS_OUTPUTS = [
  'body_state_classification',
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

const READINGS = [
  { name: 'Foundational Reading (FR)', from: 'CFFS', gate: 'Auto-publishes + emails on first generate', store: 'cffs.cr_*' },
  { name: 'Program Reading (PR)', from: 'published FR + active program', gate: 'Auto-publishes + emails on first generate', store: 'programs.pr_*' },
  { name: 'Nutrition Reading (NR)', from: 'published FR + active plan', gate: 'Auto-publishes + emails on first generate', store: 'nutrition_plans.nr_*' },
  { name: 'Medications Reading (MR)', from: 'coach Medications Analysis', gate: 'Draft → publish. No email path.', store: 'clients.medications_reading' },
  { name: 'Block-End Trajectory Reading', from: 'the full CFWS sequence', gate: 'Draft → publish. Emails on first publish.', store: 'programs.tr_*' },
]

const GENERATORS = [
  {
    name: 'Program (Training)',
    model: HAIKU,
    desc: 'Builds a training block from CFFS readiness + prescription inputs + the approved exercise library. Ten doctrine boundaries; per-(training age × phase) RPE and volume calibration. Two deterministic post-clamps adjust load down to doctrine and recovery state.',
    store: 'programs',
  },
  {
    name: 'Nutrition (Plan)',
    model: `${HAIKU} ×3 → ${SONNET}`,
    desc: 'The most defended generator. Three parallel Haiku attempts; the first that passes the validator wins. If none pass, the least-bad attempt’s issues become a correction note and one Sonnet call escalates. Structured foods, server-recomputed macros, appetite-suppression hard rules, doctrine-version stamped, every attempt logged to telemetry.',
    store: 'nutrition_plans',
  },
  {
    name: 'Medications Analysis',
    model: HAIKU,
    desc: 'Coach-facing per-medication breakdown (clinical vocabulary allowed here). Influence on program, nutrition and recovery, plus a combined picture. The client never sees this — the Medications Reading translates it.',
    store: 'clients.medications_analysis',
  },
  {
    name: 'Blood Panel Analysis',
    model: HAIKU,
    desc: 'Reads the transcribed markers into a coaching interpretation. Single out-of-range marker = hypothesis, not finding. Coach approval is what lets the next CFFS read it.',
    store: 'blood_panels.analysis',
  },
  {
    name: 'Coach Guidance Suggest',
    model: HAIKU,
    desc: 'Drafts the standing override text the program engine parses on every regeneration — within the engine’s authority bounds, using the phrases it recognises. Coach saves it; the route does not persist.',
    store: 'training_plans.coach_guidance',
  },
  {
    name: 'Recovery Clamp',
    model: null,
    desc: 'A deterministic second pass that only reduces an existing prescription’s load envelope when the client is in an active recovery state. Never invents exercises. Every adjustment is audited.',
    store: 'recovery_adjustments',
  },
]

const LONGITUDINAL = [
  { name: 'Weekly Check-In (A / B)', model: null, desc: 'Alternating long-form questionnaires plus Recovery Signals and alcohol buckets. Fri 6pm–Sun 6:30pm window with a per-client override. Captures the raw weekly signal.' },
  { name: 'CFWS', model: HAIKU, desc: 'The weekly analogue of the CFFS. Synthesises the Form A+B pair against the CFFS baseline and assigns the four readiness colours. Readiness moves one notch at a time; Red is the floor.' },
  { name: 'Weekly Feedback', model: HAIKU, desc: 'The coach’s three-field client-facing response (Interpretation / optional Reframe / This week hold this). A banned-term gate retries up to 3× rather than ship internal jargon.' },
  { name: 'Signal Monitoring', model: null, desc: 'Deterministic drift detector across consecutive CFWS. Routes to lightweight / delta / full reassessment. Signal-based triggers suppressed until the CFFS is ≥21 days old; the 12-week cap forces a full re-intake.' },
  { name: 'RPE Creep Monitor', model: null, desc: 'Objective load signal: avg logged RPE ≥ prescribed +1.0 = creep; +2.0 or any set ≥9.5 = severe. Folds into Signal Monitoring.' },
  { name: 'Workout Logging', model: null, desc: 'Live set-by-set logging that snapshots the prescription at session start, so progress analysis stays stable against later edits.' },
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
  { zone: 'MZ1', name: 'Stress Belt', loc: 'Stomach / Waist', signal: 'Cortisol and adrenaline dominance' },
  { zone: 'MZ2', name: 'Gut & Bloat', loc: 'Digestive region', signal: 'Insulin timing disruption' },
  { zone: 'MZ3', name: 'Hip & Thigh', loc: 'Hips / Thighs', signal: 'Reproductive hormone and metabolic conservation' },
  { zone: 'MZ4', name: 'Upper Body Stress', loc: 'Upper body', signal: 'Nervous system load, adrenaline, sleep retention' },
]

const INFRA = [
  { k: 'Models', v: `${HAIKU} everywhere. ${SONNET} only as the nutrition escalation. Photos and lab files run on the same Haiku call as the text.` },
  { k: 'JSON', v: 'A brace-counting extractor, never a greedy regex. Every parse survives prose, code fences and stray commentary.' },
  { k: 'Em dashes', v: 'Recursively stripped from every generated string. A banned AI-writing signal across the whole platform.' },
  { k: 'Banned terms', v: 'A regex gate blocks internal jargon (CFFS, CFWS, RPE, cortisol, HPA axis) from client prose, retrying on a leak.' },
  { k: 'Nutrition validator', v: 'The one generate → validate → retry → escalate loop. Doctrine-versioned; every attempt is telemetered.' },
  { k: 'Audit', v: 'Every recovery adjustment and reassessment writes an audit row. Nothing the engine changes is silent.' },
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
            <a href="#stage-02" style={navLink}>Readings</a>
            <a href="#pillars" style={navLink}>Pillars</a>
            <a href="/" style={{ ...navLink, color: BLUE_LIGHT }}>← Home</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '110px 24px 80px', borderBottom: `1px solid ${BORDER}`, background: `radial-gradient(900px 420px at 50% -10%, rgba(27,109,252,0.10), transparent)` }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <SectionLabel>Inside the Engine</SectionLabel>
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 800, color: TXT, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 24 }}>
            The full read.<br />Every stage, opened up.
          </h1>
          <Prose style={{ maxWidth: 660, fontSize: 17 }}>
            The homepage shows the engine as a schematic. This is the deep version: what each stage does,
            how it does it, which model runs, what it reads, and what it produces. Structured data goes in;
            a single conservative interpretation comes out; everything downstream is built on top of it and
            never bends it back.
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
            Not a prompt and a table. A full production system — every figure counted directly from the codebase.
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
            The interpretation itself is small and dense — 25 model-backed routes and 12 prompt files.
            The rest is the platform that captures the inputs and runs the coaching around them.
            Behind all of it: a 39,087-line interpretive canon the prompts operationalise.
          </p>
        </div>
      </section>

      {/* PIPELINE OVERVIEW */}
      <Section id="overview">
        <SectionLabel>The Pipeline</SectionLabel>
        <SectionHeading>Five stages. One direction of travel.</SectionHeading>
        <Prose style={{ marginBottom: 44 }}>
          Capture feeds interpretation. Interpretation feeds both the client-facing translations and the
          execution generators. The whole thing is then watched, week over week, until the block closes and
          the arc is read back.
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
        <StageHead n="00" title="The Input Layer" sub="Mostly deterministic capture. The only model here transcribes blood panels." />
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
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: BLUE_LIGHT, textTransform: 'uppercase' }}>Body Recode™ Interpretation Engine</p>
              <ModelBadge>{HAIKU} · multimodal</ModelBadge>
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
                  and resolves the whole picture through the Fat Map’s four macro zones. Conservative resolution
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

      {/* STAGE 02 — READINGS */}
      <Section id="stage-02" wide>
        <StageHead n="02" title="The Reading Family" sub="The CFFS is never shown to the client. Each analysis is translated into plain language in Kade’s voice. All five run on Haiku 4.5." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {READINGS.map((r) => (
            <div key={r.name} style={{ ...cardStyle, padding: '20px 24px', display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) 1fr 1fr', gap: 18, alignItems: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{r.name}</p>
              <div>
                <ColLabel>Derived from</ColLabel>
                <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.6 }}>{r.from}</p>
              </div>
              <div>
                <ColLabel>Gate</ColLabel>
                <p style={{ fontSize: 12.5, color: TXT_DIM, lineHeight: 1.6 }}>{r.gate}</p>
                <p style={{ fontFamily: MONO, fontSize: 10.5, color: TXT_MUTE, marginTop: 6 }}>{r.store}</p>
              </div>
            </div>
          ))}
        </div>
        <Callout>
          Every reading shares one discipline: no sets, reps or RPE; no calories, macros or food names; no diagnoses; no em dashes.
          Whenever fat loss is named as deferred, the same paragraph reassures that those outcomes follow naturally downstream —
          the framing is never “we are not focused on this.”
        </Callout>
      </Section>

      {/* STAGE 03 — GENERATORS */}
      <section id="stage-03" style={{ padding: '100px 24px', background: CANVAS_2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <StageHead n="03" title="The Execution Generators" sub="Layer 2. These consume the CFFS and design the intervention — inside doctrine, so they never override the interpretation." />
          <Grid min={300} gap={12}>
            {GENERATORS.map((g) => (
              <div key={g.name} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, gap: 8 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{g.name}</p>
                  {g.model ? <ModelBadge>{g.model}</ModelBadge> : <span style={{ ...chip, fontSize: 9 }}>deterministic</span>}
                </div>
                <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75, marginBottom: 14 }}>{g.desc}</p>
                <p style={{ fontFamily: MONO, fontSize: 11, color: TXT_MUTE }}>→ {g.store}</p>
              </div>
            ))}
          </Grid>
        </div>
      </section>

      {/* STAGE 04 — LONGITUDINAL */}
      <Section id="stage-04" wide>
        <StageHead n="04" title="Longitudinal Monitoring" sub="What runs across the block after the first read. The monitors are deterministic; only the two syntheses use a model." />
        <Grid min={300} gap={12}>
          {LONGITUDINAL.map((l) => (
            <div key={l.name} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{l.name}</p>
                {l.model ? <ModelBadge>{l.model}</ModelBadge> : <span style={{ ...chip, fontSize: 9 }}>deterministic</span>}
              </div>
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.75 }}>{l.desc}</p>
            </div>
          ))}
        </Grid>
        <Callout>
          When a block closes, the accumulated weekly syntheses become the input sequence for the Block-End Trajectory
          Reading — the client analogue of the arc — which closes the reading family for that block.
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
        <SectionHeading>Three body states. The Fat Map’s four zones.</SectionHeading>
        <Prose style={{ marginBottom: 40 }}>
          The deep state (named below) is the engine’s own classification, distinct from the public scorecard
          label. Fat-storage conclusions are valid only on the long arc — months, not weeks.
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
              <p style={{ fontSize: 13, color: TXT_DIM, lineHeight: 1.6 }}>{z.signal}</p>
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

      {/* FOOTER */}
      <footer style={{ padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: TXT_MUTE, textTransform: 'uppercase', marginBottom: 14 }}>Body Recode™ · Biological Interpretation Platform</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={navLink}>Home</a>
          <a href="/#engine" style={navLink}>The schematic</a>
          <a href="https://performance.bodyrecode.au" style={{ ...navLink, color: BLUE_LIGHT }}>Performance Coaching →</a>
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
