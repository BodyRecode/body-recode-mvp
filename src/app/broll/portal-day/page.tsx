'use client'

import { CheckCircle2, FileText, Dumbbell, Salad, Sunrise, Moon, Video, MessageCircle, Lock } from 'lucide-react'

/**
 * B-roll canvas: Portal Day-in-the-Life
 *
 * Designed to be screen-recorded as B-roll for the /challenge explainer
 * video. Covers the script section:
 *
 *   "Free. No card. Instant portal access. Daily coaching messages
 *    start the moment you sign up."
 *
 * Also supports the closing CTA:
 *
 *   "If you are done pushing harder against a body that has stopped
 *    responding, sign up below."
 *
 * Three stacked zones. Same design language as /challenge.
 *
 * URL: /broll/portal-day (noindex - see /broll/layout.tsx)
 */

const SMS_THREAD = [
  { day: 1, time: '6:45am', body: 'Morning. Day 1. Walk before coffee. Eat breakfast within the first hour. The structure starts today.' },
  { day: 1, time: '12:30pm', body: 'Eyes on lunch. Slow it down. Protein anchor. Two cupped hands of carbs. A finger of fat.' },
  { day: 1, time: '9:15pm', body: 'Wind down. Phone off the bedside. Magnesium tonight if you have it. Sleep is where the work happens.' },
  { day: 2, time: '6:50am', body: 'Day 2. Session A today. Lower intensity than you think. RIR 3 throughout. The job is to pull load, not add it.' },
  { day: 4, time: '12:30pm', body: 'Day 4. Notice your afternoon energy today. Crash or no crash? That answer is data. Write it down mentally.' },
]

export default function PortalDayPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · "YOU'RE IN" MOMENT (instant access)
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Signal Blue radial accent */}
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Instant access
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            The moment you sign up,<br />the work begins.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '56px', maxWidth: '800px' }}>
            No waiting list. No onboarding call. Your portal opens immediately and Day 1 of the structure starts now.
          </p>

          {/* The "You're in" confirmation card */}
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.3)',
            borderRadius: '20px',
            padding: '48px 40px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(27, 109, 252, 0.08)',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#1B6DFC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(27, 109, 252, 0.35)',
            }}>
              <CheckCircle2 size={40} strokeWidth={2.5} color="#FFFFFF" />
            </div>
            <p style={{ fontSize: '40px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.025em', margin: '0 0 12px' }}>
              You are in.
            </p>
            <p style={{ fontSize: '17px', color: '#1056D6', lineHeight: 1.6, margin: '0 0 24px', fontWeight: 600 }}>
              Check your email for your portal link. Daily coaching messages will arrive on your phone. Day 1 starts now.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '10px 20px', borderRadius: '99px',
              background: '#FFFFFF', border: '1px solid #E5E5E5',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B6DFC' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Day 1 of 14
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · THE PORTAL HOME (a real day inside)
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            A day inside your portal
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Everything in one place.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '800px' }}>
            Training, nutrition, morning and evening protocols, and a coaching note for the day. No external apps. Open the portal, you know what to do.
          </p>

          {/* Portal mockup */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
          }}>
            {/* Portal header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #E5E5E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Body Recode · 14-Day Body Decode
                </p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.015em', margin: 0 }}>
                  Welcome back, Sarah
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px', textAlign: 'right' }}>
                    Progress
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: '#1B6DFC', margin: 0, letterSpacing: '-0.02em' }}>
                    Day 4 of 14
                  </p>
                </div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'conic-gradient(#1B6DFC 0deg 103deg, #E5E5E5 103deg 360deg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>29%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's note (featured) */}
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, rgba(27, 109, 252, 0.04) 0%, transparent 100%)',
              borderBottom: '1px solid #E5E5E5',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#1B6DFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(27, 109, 252, 0.3)',
                }}>
                  <FileText size={18} strokeWidth={2.5} color="#FFFFFF" />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    Today &middot; Day 4 of 14
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Energy patterns
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.65, margin: 0 }}>
                Pay attention to your afternoon energy today. Do you crash at the same time? That pattern has a biological cause. The structure you are building right now is directly targeting it. Stay the course.
              </p>
            </div>

            {/* Tile grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0',
            }}>
              {[
                { icon: Dumbbell, label: "Today's training session", sub: 'Session A · 38 minutes · RIR 3 throughout', cta: 'Start the session', accent: true },
                { icon: Salad, label: 'Nutrition guide', sub: 'Whole foods. Predictable timing. No tracking.', cta: 'Open the guide', accent: false },
                { icon: Sunrise, label: 'Morning reset sequence', sub: 'Five minutes. Done before coffee.', cta: 'Open the sequence', accent: false },
                { icon: Moon, label: 'Evening rhythm sequence', sub: 'Wind-down protocol for deep recovery.', cta: 'Open the sequence', accent: false },
              ].map((t, i) => {
                const Icon = t.icon
                return (
                  <div key={i} style={{
                    padding: '24px 28px',
                    borderRight: i % 2 === 0 ? '1px solid #E5E5E5' : 'none',
                    borderBottom: i < 2 ? '1px solid #E5E5E5' : 'none',
                    background: '#FFFFFF',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: t.accent ? '#1B6DFC' : 'rgba(27, 109, 252, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={20} strokeWidth={2} color={t.accent ? '#FFFFFF' : '#1B6DFC'} />
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px' }}>
                          {t.label}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>
                          {t.sub}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1B6DFC',
                      borderBottom: '1px solid #1B6DFC',
                      paddingBottom: '2px',
                    }}>
                      {t.cta} &rarr;
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Locked Day 5 session preview */}
            <div style={{
              padding: '20px 28px',
              background: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderTop: '1px solid #E5E5E5',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: '#E5E5E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Lock size={15} strokeWidth={2.5} color="#999999" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#3A3A3A', margin: '0 0 2px' }}>
                  Week One Progress Session
                </p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>
                  Unlocks tomorrow on Day 5. A 30-minute recorded session walking you through what your body has been doing.
                </p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Day 5
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · THE SMS THREAD (daily coaching messages)
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Signal Blue radial accent */}
        <div style={{
          position: 'absolute', bottom: '-200px', right: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Daily coaching, on your phone
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Three messages a day.<br />Built around the rhythm.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Morning, midday, evening. Direct from me, into your inbox. Not motivation. Coaching, timed to where your body is in the day.
          </p>

          {/* Phone-style SMS view */}
          <div style={{
            maxWidth: '440px',
            margin: '0 auto',
            background: '#1A1A1A',
            borderRadius: '36px',
            padding: '28px 14px 14px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
          }}>
            {/* Phone header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 20px 16px',
              borderBottom: '1px solid #2C2C2C',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#1B6DFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={18} strokeWidth={2.5} color="#FFFFFF" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Body Recode
                </p>
                <p style={{ fontSize: '11px', color: '#999999', margin: 0 }}>
                  Coach &middot; SMS
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              padding: '20px 12px',
              background: '#0F0F0F',
              borderRadius: '0 0 24px 24px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {SMS_THREAD.map((msg, i) => {
                const prevMsg = SMS_THREAD[i - 1]
                const showDayDivider = !prevMsg || prevMsg.day !== msg.day
                return (
                  <div key={i}>
                    {showDayDivider && (
                      <div style={{
                        textAlign: 'center',
                        fontSize: '10px', fontWeight: 700,
                        color: '#6B6B6B',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        margin: '8px 0 12px',
                      }}>
                        Day {msg.day}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{
                        background: '#1F1F1F',
                        border: '1px solid #2C2C2C',
                        borderRadius: '18px 18px 18px 4px',
                        padding: '12px 16px',
                        maxWidth: '85%',
                      }}>
                        <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, lineHeight: 1.5 }}>
                          {msg.body}
                        </p>
                      </div>
                      <p style={{ fontSize: '10px', color: '#6B6B6B', margin: '4px 0 0 8px' }}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
