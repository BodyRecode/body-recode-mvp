import type { Metadata } from 'next'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import LicensingEnquiryForm from '@/components/marketing/licensing-enquiry-form'

export const metadata: Metadata = {
  title: 'Body Recode™ | Biological Interpretation Platform',
  description:
    'Body Recode™ is a biological interpretation system. One interpretive engine. Five environments. Licensable across performance coaching, executive, tactical, clinical and developmental contexts.',
}

const TEAL = '#1B6DFC'

export default function HomePage() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <MarketingNav variant="ip" />

      {/* HERO */}
      <section
        style={{
          background: '#FFFFFF',
          paddingTop: 160,
          paddingBottom: 120,
          paddingLeft: 20,
          paddingRight: 20,
          borderBottom: '1px solid #E5E5E5',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div
            style={{
              width: 32,
              height: 3,
              background: TEAL,
              borderRadius: 2,
              marginBottom: 24,
            }}
          />
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: TEAL,
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Biological Interpretation Platform
          </p>
          <h1
            style={{
              fontSize: 'clamp(34px, 6vw, 56px)',
              fontWeight: 800,
              color: '#1A1A1A',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              marginBottom: 28,
            }}
          >
            Interpretation before prescription.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: '#6B6B6B',
              maxWidth: 640,
              marginBottom: 36,
            }}
          >
            Body Recode™ is the upstream interpretive layer for performance, clinical and tactical
            practice. One engine reads body state across 208 structured signals before any
            intervention is designed. The system terminates at interpretation. What is built on top
            of it is yours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a
              href="#enquire"
              style={{
                background: TEAL,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                padding: '14px 28px',
                borderRadius: 10,
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              Enquire about licensing
            </a>
            <a
              href="#system"
              style={{
                background: '#FFFFFF',
                color: '#3A3A3A',
                fontWeight: 600,
                fontSize: 14,
                padding: '14px 28px',
                borderRadius: 10,
                border: '1px solid #E5E5E5',
                textDecoration: 'none',
              }}
            >
              How the system works
            </a>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section
        id="system"
        style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <SectionLabel>The Problem</SectionLabel>
          <SectionHeading>Every intervention fails at the same point.</SectionHeading>
          <div style={{ maxWidth: 640, color: '#6B6B6B', fontSize: 16, lineHeight: 1.85 }}>
            <p style={{ marginBottom: 18 }}>
              The conventional model is to assess goals, prescribe an approach, measure output and
              adjust. This works when the body is in a state to respond. Most of the time, it is
              not. The model assumes readiness. It rarely asks whether it exists.
            </p>
            <p>
              The result is effort without response. Training that does not build. Nutrition that
              does not shift body composition. Recovery that never fully lands. The intervention is
              not wrong. The sequencing is.
            </p>
          </div>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <SectionLabel>The Solution</SectionLabel>
          <SectionHeading>Read the body first. Then prescribe.</SectionHeading>
          <p
            style={{
              maxWidth: 640,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            Body Recode™ sits one layer upstream of every intervention. Before anything is
            prescribed, the system asks one question: what state is this body actually in right
            now, and why is it organised that way?
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard value="208" label="Intake data points" detail="Structured across eight signal domains. Not a questionnaire. A biological read." />
            <StatCard value="5" label="Interpretive pillars" detail="Each reads a different domain. The output is always a synthesis." />
            <StatCard value="3" label="Body state classifications" detail="Every body, every environment. The classification drives everything downstream." />
          </div>
        </div>
      </section>

      {/* TWO LAYERS */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Architecture</SectionLabel>
          <SectionHeading>Two layers. Neither collapses into the other.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            The interpretive layer is owned by Body Recode™. The execution layer is owned by the
            practitioner. The separation is architectural, not stylistic. It is what makes the
            system defensible and licensable.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <Card accent>
              <CardLabel accent>Layer 1 · Interpretation</CardLabel>
              <CardBody>
                Takes structured input data across eight signal domains and produces the CFFS:
                Coach-Facing Foundational Synthesis. It does not prescribe. It does not design
                programs. Interpretation terminates at interpretation.
              </CardBody>
            </Card>
            <Card>
              <CardLabel>Layer 2 · Execution</CardLabel>
              <CardBody>
                Downstream of the CFFS, the practitioner designs the actual intervention: training,
                nutrition, load management, clinical protocol, performance strategy. Everything in
                the execution layer is derived from the interpretation. The interpretation never
                changes to accommodate the execution.
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* PLATFORM DIAGRAM */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Platform</SectionLabel>
          <SectionHeading>One engine. Built to scale across industries.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            The interpretation engine ingests structured client data, classifies body state, and
            produces the CFFS. This engine is environment-agnostic. Each execution layer is a
            downstream application: its own product, its own interface, its own practitioner tools.
          </p>
          <div
            style={{
              border: '1px solid #E5E5E5',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#FFFFFF',
            }}
          >
            <div
              style={{
                background: 'rgba(16, 225, 194, 0.08)',
                borderBottom: '1px solid rgba(16, 225, 194, 0.18)',
                padding: 20,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: TEAL,
                  textTransform: 'uppercase',
                }}
              >
                Body Recode™ Interpretation Engine
              </p>
              <p style={{ fontSize: 11, color: '#6B6B6B', marginTop: 6 }}>
                Intake · Classification · CFFS
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                borderTop: '1px solid #E5E5E5',
              }}
            >
              {[
                { name: 'Performance Coaching', live: true },
                { name: 'Executive Performance', live: false },
                { name: 'Operational Readiness', live: false },
                { name: 'Clinical Integration', live: false },
                { name: 'Developmental Performance', live: false },
              ].map((env, i) => (
                <div
                  key={env.name}
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    borderRight: i < 4 ? '1px solid #E5E5E5' : 'none',
                    background: env.live ? 'rgba(16, 225, 194, 0.05)' : 'transparent',
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: env.live ? TEAL : '#999999',
                      textTransform: 'uppercase',
                      lineHeight: 1.4,
                    }}
                  >
                    {env.name}
                  </p>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: env.live ? TEAL : '#E5E5E5',
                      margin: '8px auto 0',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIGNAL DOMAINS */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Foundational Intake</SectionLabel>
          <SectionHeading>208 structured signals. Eight domains.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            Before any interpretation begins, the system collects structured data across eight
            distinct signal domains. The depth and specificity of the intake is what makes the
            output defensible.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {[
              { num: '01', name: 'Training Load', desc: 'Physical stress exposure, training history, volume and fatigue patterns.' },
              { num: '02', name: 'Recovery Capacity', desc: 'The system’s ability to restore and return to baseline between exposures.' },
              { num: '03', name: 'Stress Architecture', desc: 'How the stress response is organised and its capacity to resolve accumulated load.' },
              { num: '04', name: 'Hormonal Signals', desc: 'Endocrine markers and hormonal regulation patterns affecting body state.' },
              { num: '05', name: 'Fat Distribution', desc: 'Adaptive fat accumulation read as hormonal signalling via the Fat Map Method™.' },
              { num: '06', name: 'Sleep Quality', desc: 'Sleep depth, recovery patterns and nervous system restoration during rest.' },
              { num: '07', name: 'Behavioural Patterns', desc: 'Observable behaviours reflecting underlying biological state and adaptation capacity.' },
              { num: '08', name: 'Emotional Load', desc: 'Emotional threat, identity load and over-compliance read as structural stressors.' },
            ].map((d) => (
              <div
                key={d.num}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    color: TEAL,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  {d.num}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
                  {d.name}
                </p>
                <p style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.7 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERPRETIVE PILLARS */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Interpretive Pillars</SectionLabel>
          <SectionHeading>Five pillars. One synthesised read.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            The engine reads the body across five distinct pillars simultaneously. Each contributes
            signal data. No single pillar drives the output in isolation. The interpretation is
            always a synthesis of the full picture.
          </p>

          {/* Pillar 1 featured */}
          <div
            style={{
              background: 'rgba(16, 225, 194, 0.05)',
              border: '1px solid rgba(16, 225, 194, 0.25)',
              borderRadius: 16,
              padding: 32,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: TEAL,
                  textTransform: 'uppercase',
                }}
              >
                Pillar 01
              </p>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: TEAL,
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Primary
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>
              Fat Map Method™
            </h3>
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.85, marginBottom: 24 }}>
              Fat accumulation patterns are read as hormonal and metabolic signalling, not simple
              energy surplus. Where the body stores fat reflects its adaptive response to the
              current hormonal and regulatory environment.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10,
              }}
            >
              {[
                { zone: 'MZ1', name: 'Stress Belt', loc: 'Stomach / Waist', signal: 'Cortisol and adrenaline dominance' },
                { zone: 'MZ2', name: 'Gut and Bloat', loc: 'Digestive region', signal: 'Insulin timing disruption' },
                { zone: 'MZ3', name: 'Hip and Thigh', loc: 'Hips / Thighs', signal: 'Reproductive hormone and metabolic conservation' },
                { zone: 'MZ4', name: 'Upper Body Stress', loc: 'Upper body', signal: 'Nervous system load, adrenaline, sleep retention' },
              ].map((z) => (
                <div
                  key={z.zone}
                  style={{
                    background: 'rgba(12, 10, 9, 0.4)',
                    border: '1px solid rgba(16, 225, 194, 0.15)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        color: TEAL,
                        textTransform: 'uppercase',
                      }}
                    >
                      {z.zone}
                    </p>
                    <p style={{ fontSize: 11, color: '#6B6B6B' }}>{z.loc}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
                    {z.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.6 }}>{z.signal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars 2-5 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {[
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
            ].map((p) => (
              <div
                key={p.num}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: '#6B6B6B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pillar {p.num}
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#6B6B6B',
                      border: '1px solid #E5E5E5',
                      padding: '2px 8px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {p.abbr}
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
                  {p.name}
                </p>
                <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BODY STATES */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Classification Output</SectionLabel>
          <SectionHeading>Three body states. Every body, every environment.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            The interpretation produces one of three classifications. The classification drives the
            entire downstream approach.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            <BodyStateCard
              label="Remediation"
              public="Depleted"
              colour="#DC2626"
              bg="#2d0d0d"
              text="The body is under load it cannot resolve. Stress architecture is dominant. Recovery is compromised. Pushing performance-level intervention here is counterproductive. Most who present believing they are in Optimisation are actually here."
            />
            <BodyStateCard
              label="Optimisation"
              public="Transitioning"
              colour="#B7791F"
              bg="#2d1f0a"
              text="The body has stabilised. Capacity exists to pursue body composition and performance goals. This is where most coaching begins, but very few clients are actually here when they arrive."
            />
            <BodyStateCard
              label="Post-Optimisation"
              public="Ready"
              colour="#1B6DFC"
              bg="#B5CFFC"
              text="The body is performing. The goal shifts to identity-level performance and long-term system maintenance. Built over time. Cannot be forced."
            />
          </div>
          <p style={{ fontSize: 12, color: '#999999', marginTop: 24, maxWidth: 720, lineHeight: 1.7 }}>
            Practitioner-facing labels are shown above. Consumer-facing translations (Depleted /
            Transitioning / Ready) are used in client communication, never in the CFFS.
          </p>
        </div>
      </section>

      {/* ENVIRONMENTS */}
      <section style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>Environments</SectionLabel>
          <SectionHeading>One engine. Five environments.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            The interpretive layer does not care what environment the body is operating in. The body
            responds to load through the same biological mechanisms regardless of context. What
            changes between environments is what the practitioner does with the interpretation.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            <EnvCard
              live
              kicker="Health & Fitness"
              title="Performance Coaching"
              desc="The origin environment and first proof of concept. General-population clients whose bodies have stopped responding to effort. Available online worldwide and face-to-face in Brisbane."
              link={{ href: 'https://performance.bodyrecode.au', label: 'Performance Coaching →' }}
            />
            <EnvCard
              kicker="Corporate & Executive"
              title="Executive Performance"
              desc="High-performing professionals under chronic cognitive and organisational load. The body under sustained mental stress responds identically to physical stress: cortisol elevation, recovery suppression, regulatory disruption."
            />
            <EnvCard
              kicker="Military & Tactical"
              title="Operational Readiness"
              desc="Defence personnel, law enforcement and tactical operators. The stakes of misread body state in this environment are operational. An operator in Remediation pushed through performance-level training is a liability."
            />
            <EnvCard
              kicker="Medical & Allied Health"
              title="Clinical Integration"
              desc="GPs, physiotherapists, sports medicine practitioners and allied health professionals. Body Recode™ sits upstream of clinical assessment, providing a structured biological read that informs the clinical picture before the appointment."
            />
            <EnvCard
              kicker="Education & Youth"
              title="Developmental Performance"
              desc="Young athletes, student populations and development-stage bodies. The earlier a body is read correctly, the less dysfunction accumulates over time."
            />
          </div>
        </div>
      </section>

      {/* LICENSING OPTIONS */}
      <section
        id="licensing"
        style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <SectionLabel>For Practitioners and Organisations</SectionLabel>
          <SectionHeading>The interpretation engine is licensable.</SectionHeading>
          <p
            style={{
              maxWidth: 720,
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 40,
            }}
          >
            Body Recode™ is built as one interpretive core with multiple execution layers on top.
            The interpretation engine, the intake architecture and the CFFS methodology are
            available for licensing, white-labelling or integration into existing workflows.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            <LicenseCard
              title="License"
              desc="Use the Body Recode™ interpretation system within your practice. Full access to the intake architecture, the five interpretive pillars and the CFFS output framework."
            />
            <LicenseCard
              title="White-label"
              desc="Deploy the system under your own brand. The engine, intake and output documents are built to operate independently of the Body Recode™ identity where required."
            />
            <LicenseCard
              title="Integrate"
              desc="Embed the interpretation layer into existing clinical, coaching or organisational workflows. The system sits upstream of whatever the practitioner does with the output."
            />
          </div>
        </div>
      </section>

      {/* ENQUIRY */}
      <section
        id="enquire"
        style={{ background: '#FFFFFF', padding: '96px 20px', borderBottom: '1px solid #E5E5E5' }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionLabel>Enquire</SectionLabel>
          <SectionHeading>Talk to us about deploying the system.</SectionHeading>
          <p
            style={{
              color: '#6B6B6B',
              fontSize: 16,
              lineHeight: 1.85,
              marginBottom: 32,
            }}
          >
            Licensing and integration enquiries are handled directly by the founder. Tell us where
            you are operating and what you are trying to solve. We will respond within two business
            days.
          </p>
          <LicensingEnquiryForm />
        </div>
      </section>

      <MarketingFooter variant="ip" />
    </div>
  )
}

/* ---------- Local presentation helpers ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{ width: 32, height: 3, background: TEAL, borderRadius: 2, marginBottom: 16 }}
      />
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: TEAL,
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        {children}
      </p>
    </>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(26px, 4vw, 36px)',
        fontWeight: 800,
        color: '#1A1A1A',
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        marginBottom: 24,
      }}
    >
      {children}
    </h2>
  )
}

function StatCard({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <p style={{ fontSize: 26, fontWeight: 800, color: TEAL, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.7 }}>{detail}</p>
    </div>
  )
}

function Card({ accent, children }: { accent?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: accent ? 'rgba(16, 225, 194, 0.05)' : '#FFFFFF',
        border: accent ? '1px solid rgba(16, 225, 194, 0.25)' : '1px solid #E5E5E5',
        borderRadius: 16,
        padding: 32,
      }}
    >
      {children}
    </div>
  )
}

function CardLabel({ accent, children }: { accent?: boolean; children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: accent ? TEAL : '#6B6B6B',
        textTransform: 'uppercase',
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  )
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.85 }}>{children}</p>
}

function BodyStateCard({
  label,
  public: publicLabel,
  colour,
  bg,
  text,
}: {
  label: string
  public: string
  colour: string
  bg: string
  text: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${colour}33`,
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div style={{ width: 32, height: 3, background: colour, borderRadius: 2, marginBottom: 14 }} />
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: colour,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 11,
          color: '#999999',
          marginBottom: 14,
          letterSpacing: '0.05em',
        }}
      >
        Public: {publicLabel}
      </p>
      <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.8 }}>{text}</p>
    </div>
  )
}

function EnvCard({
  live,
  kicker,
  title,
  desc,
  link,
}: {
  live?: boolean
  kicker: string
  title: string
  desc: string
  link?: { href: string; label: string }
}) {
  return (
    <div
      style={{
        background: live ? 'rgba(16, 225, 194, 0.05)' : '#FFFFFF',
        border: live ? '1px solid rgba(16, 225, 194, 0.3)' : '1px solid #E5E5E5',
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: live ? TEAL : '#999999',
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </p>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: live ? TEAL : 'transparent',
            color: live ? '#FFFFFF' : '#999999',
            border: live ? 'none' : '1px solid #E5E5E5',
            padding: '4px 10px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {live ? 'Live' : 'In Development'}
        </span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.75, marginBottom: link ? 18 : 0 }}>
        {desc}
      </p>
      {link && (
        <a
          href={link.href}
          style={{
            fontSize: 13,
            color: TEAL,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {link.label}
        </a>
      )}
    </div>
  )
}

function LicenseCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: 16,
        padding: 28,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: TEAL,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {title}
      </p>
      <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.8 }}>{desc}</p>
    </div>
  )
}
