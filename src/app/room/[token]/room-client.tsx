'use client'

import { useEffect, useState } from 'react'

/**
 * The Partner Room — a private, vision-level walkthrough of how Body Recode,
 * Performance Coaching, the Collective and Arete fit together. Personalised by
 * first name. Committed dark: this is made to be opened on a screen, one guest
 * at a time. All CSS is scoped under #pr so the app's global styles don't leak in.
 */
export default function RoomClient({
  firstName,
  returning,
}: {
  firstName: string
  returning: boolean
}) {
  // Reveal-on-scroll, respecting reduced-motion.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('#pr .fade'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  return (
    <div id="pr">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="hero">
        <div className="wrap">
          <p className="kicker fade">
            A private room for {firstName} &nbsp;/&nbsp; Body Recode &nbsp;/&nbsp; Overview
          </p>
          <h1 className="fade">
            One doctrine.
            <br />
            One engine.
            <br />
            <span className="accent">Many surfaces.</span>
          </h1>
          <p className="thesis fade">
            {returning ? `Welcome back, ${firstName}.` : `Welcome, ${firstName}.`} We turned
            sports-science coaching into <b>a system that scales without losing its standard</b>.
            This is how the pieces fit. Come back to it anytime.
          </p>
          <div className="hero-foot fade">
            <span><span className="dot" />Body Recode</span>
            <span><span className="dot" />Performance Coaching</span>
            <span><span className="dot" />The Collective</span>
            <span><span className="dot" />Arete Protocol</span>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap split">
          <div className="fade">
            <p className="eyebrow">The problem</p>
            <h2>Great coaching doesn&rsquo;t scale. Scaled coaching isn&rsquo;t great.</h2>
          </div>
          <div className="fade">
            <p>
              The best coaches get results because they read the individual body and adjust. But
              that lives in one person&rsquo;s head. The moment they take on more clients, or try to
              license their name, the quality drifts and the results follow.
            </p>
            <p>
              Everyone else solves this by dumbing it down: generic templates, an app, a chatbot. It
              scales the delivery but throws away the thing that actually worked.
            </p>
            <p>
              <strong>We built the opposite: a way to scale the judgment, not just the delivery.</strong>
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow fade">The doctrine</p>
          <h2 className="fade">
            You don&rsquo;t fix a body with more effort. You read its state, then work with it.
          </h2>
          <p className="lead fade" style={{ marginBottom: 34 }}>
            Body Recode is a body-state method. Every client is assessed, given a state and a
            pattern, and moved through the same three-part arc. It is a repeatable framework, not a
            personality.
          </p>
          <div className="arc">
            <div className="step fade">
              <span className="n">01</span>
              <h3>Decode</h3>
              <p>Read the current body-state and the pattern driving it. Name what&rsquo;s actually happening before touching the plan.</p>
            </div>
            <div className="step fade">
              <span className="n">02</span>
              <h3>Rewire</h3>
              <p>Shift the inputs that hold the state in place: training, nutrition, recovery, the daily pattern.</p>
            </div>
            <div className="step fade">
              <span className="n">03</span>
              <h3>Rebuild</h3>
              <p>Consolidate the new state into a body that holds, and a client who can run it themselves.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow fade">The engine</p>
          <h2 className="fade">The doctrine, turned into software.</h2>
          <div className="grid-2" style={{ marginTop: 8 }}>
            <div className="fade">
              <p>
                The core asset isn&rsquo;t a program or an app. It&rsquo;s an engine that takes a
                client&rsquo;s full intake and produces their personalized program, nutrition, and
                coaching artefacts, built to the exact same standard every time.
              </p>
              <p>
                It doesn&rsquo;t replace the coach. It gives every coach the judgment of the best
                one, on tap, for every client, without the drift.
              </p>
              <p>
                <strong>Build it once. It works for every client, every coach, and every brand we put on top of it.</strong>
              </p>
            </div>
            <div className="card fade">
              <p className="eyebrow" style={{ marginBottom: 16 }}>What it already does</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16 }}>Full intake &rarr; assessment</h3>
                  <p style={{ color: 'var(--slate)', fontSize: 14.5 }}>Reads state, pattern and training age from a deep client intake.</p>
                </div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Program generation</h3>
                  <p style={{ color: 'var(--slate)', fontSize: 14.5 }}>Personalized training built to doctrine, per client.</p>
                </div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Nutrition engine</h3>
                  <p style={{ color: 'var(--slate)', fontSize: 14.5 }}>Plans, guardrails and swaps that match the state.</p>
                </div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Coaching artefacts</h3>
                  <p style={{ color: 'var(--slate)', fontSize: 14.5 }}>Readings, check-ins and trajectory the client actually sees.</p>
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <span className="chip live">Live &middot; powering real clients</span>
              </div>
            </div>
          </div>

          <EngineDemo />
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow fade">How it fits together</p>
          <h2 className="fade">One core. Many surfaces.</h2>
          <p className="lead fade" style={{ marginBottom: 30 }}>
            The engine is the asset. Everything else is a business built on top of it. Each surface
            reaches a different market, and every one of them makes the core stronger.
          </p>
          <div className="arch">
            <div className="core fade">
              <span className="tag">The core asset</span>
              <h3>Body Recode Engine</h3>
              <p>The doctrine as software. Owned IP. The one thing that has to be excellent.</p>
            </div>
            <div className="connector fade" />
            <div className="surfaces">
              <div className="surface fade">
                <div className="top"><h3>Performance Coaching</h3></div>
                <span className="role">Consumer arm &middot; the proof</span>
                <p>Our own coaching brand, run on the engine. Real clients, real results. It proves the system works and feeds everything the engine learns.</p>
                <span className="chip live">Live</span>
              </div>
              <div className="surface fade">
                <div className="top"><h3>The Collective</h3></div>
                <span className="role">White-label &middot; the scale play</span>
                <p>Other coaches license the engine and run their own brand on it, to one standard. Capped, invite-only founding partners first.</p>
                <span className="chip building">Building &middot; first partner onboarding</span>
              </div>
              <div className="surface fade">
                <div className="top"><h3>Arete Protocol</h3></div>
                <span className="role">Adjacent vertical &middot; the expansion</span>
                <p>Telehealth for performance and longevity. A separate, regulated health business that sits alongside the coaching and shares the same client.</p>
                <span className="chip planned">Early &middot; foundations in place</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow fade">Why it compounds</p>
          <h2 className="fade">The moat isn&rsquo;t the software. It&rsquo;s the loop.</h2>
          <div className="moat">
            <div className="item fade"><span className="k">01</span><div><h3>Owned doctrine</h3><p>The body-state method and the IP behind it are ours. The engine is the only place it exists as software.</p></div></div>
            <div className="item fade"><span className="k">02</span><div><h3>Every client sharpens it</h3><p>More clients across more surfaces means more signal, and a better engine, for all of them at once.</p></div></div>
            <div className="item fade"><span className="k">03</span><div><h3>One build, many brands</h3><p>The Collective sells the same core again and again, without rebuilding the hard part each time.</p></div></div>
            <div className="item fade"><span className="k">04</span><div><h3>Standard travels with it</h3><p>Every coach on the platform inherits the standard. The brand can grow without the quality drifting.</p></div></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow fade">Where it&rsquo;s going</p>
          <h2 className="fade">Near-term shape.</h2>
          <div className="road">
            <div className="row fade"><div className="when">Now</div><div className="what"><h3>Engine live, powering our own coaching</h3><p>Performance Coaching running on the engine with real clients, proving the standard holds.</p></div></div>
            <div className="row fade"><div className="when">Next</div><div className="what"><h3>Consumer acquisition switched on</h3><p>A public, low-friction front door that turns interest into assessed, engine-ready clients.</p></div></div>
            <div className="row fade"><div className="when">Building</div><div className="what"><h3>The Collective, first partners</h3><p>Onboarding the first licensed coaches onto their own branded platform, hand-held, then made self-serve.</p></div></div>
            <div className="row fade"><div className="when">Horizon</div><div className="what"><h3>Arete as the second vertical</h3><p>A regulated telehealth arm that shares the same client and widens what the ecosystem can do for them.</p></div></div>
          </div>
        </div>
      </section>

      <section className="close">
        <div className="wrap">
          <p className="eyebrow fade">Why now</p>
          <h2 className="fade">The system is built. The next phase is turning it into reach.</h2>
          <p className="lead fade">
            The hard, unglamorous part, the doctrine and the engine, is done and running. What&rsquo;s
            in front of us now is a builder&rsquo;s problem: put the right surfaces in front of the
            right markets and scale them without breaking the standard.
          </p>
          <p className="fade">
            This room is the map, {firstName}. Everything you see here is running on the same system
            we license to coaches. Come back to it whenever you like, and the real conversation is
            about where you&rsquo;d want to sit inside something that already works.
          </p>
          <div className="signoff fade">
            <span>
              <b>Kade Dunstone</b> &nbsp;&middot;&nbsp; Sports Scientist &middot; Business Entrepreneur &middot; Body Recode Founder
            </span>
            <span>Private &middot; for {firstName}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Illustrative "see it work" walkthrough embedded in the Engine section.
 * Everything here is FAKE and canned — a made-up client (Maya), surface-level
 * reasoning only. No data, no live engine, no model calls. Safe on a public link.
 */
const DEMO_TABS = ['Intake', 'The read', 'The plan', 'The check']

function EngineDemo() {
  const [step, setStep] = useState(0)
  return (
    <div className="demo fade">
      <div className="demo-head">
        <span className="demo-eyebrow">See it work</span>
        <p className="demo-sub">
          A quick example. Meet Maya, a made-up client, so nothing here is real data. Step through
          how the engine takes her from a first conversation to a checked plan.
        </p>
      </div>

      <div className="demo-rail">
        {DEMO_TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            className={`demo-tab ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="demo-tab-n">{i + 1}</span>
            {t}
          </button>
        ))}
      </div>

      <div className="demo-stage">
        {step === 0 && (
          <div className="d-card">
            <div className="d-person">
              <div className="d-av">M</div>
              <div>
                <p className="d-name">Maya, 41</p>
                <p className="d-meta">New client &middot; returning after a long break</p>
              </div>
            </div>
            <p className="d-line">
              &ldquo;I want to lose fat and stop the 3pm crash. I train three mornings a week, but I&rsquo;m
              sleeping badly and stress is high.&rdquo;
            </p>
            <div className="d-chips">
              <span>Goal: fat loss</span>
              <span>3 days / week</span>
              <span>Poor sleep</span>
              <span>High stress</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="d-card">
            <p className="d-ksmall">What the engine sees</p>
            <span className="d-badge">Remediation &middot; Restoration</span>
            <p className="d-read">
              Maya is depleted, not unfit. Her body needs its floor rebuilt before the ceiling is
              touched.
            </p>
            <div className="d-gates">
              <div><span>Recovery</span><b className="low">Low</b></div>
              <div><span>Schedule</span><b className="ok">Good</b></div>
              <div><span>Regulation</span><b className="low">Low</b></div>
            </div>
            <p className="d-binding">Binding constraint: recovery, not effort.</p>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="d-two">
              <div className="d-card">
                <p className="d-ksmall">Training</p>
                <p className="d-ptitle">Restoration block</p>
                <ul>
                  <li>Three sessions a week</li>
                  <li>Submaximal effort, no failure work</li>
                  <li>Rebuild capacity, protect recovery</li>
                </ul>
              </div>
              <div className="d-card">
                <p className="d-ksmall">Nutrition</p>
                <p className="d-ptitle">Stabilise first</p>
                <ul>
                  <li>Protein floor set and even</li>
                  <li>Fuel the day, end the crashes</li>
                  <li>No aggressive cut yet</li>
                </ul>
              </div>
            </div>
            <p className="d-note">Built to the same standard every client gets.</p>
          </>
        )}

        {step === 3 && (
          <div className="d-card d-chat">
            <p className="d-ksmall">The co-pilot checks it against the doctrine</p>
            <div className="d-bubble coach">
              <span className="d-who">Coach</span>
              Anything off in this plan?
            </div>
            <div className="d-bubble ai">
              <span className="d-who">Co-pilot</span>
              One thing. The Friday session pushes near-max effort. For a restoration block with
              recovery this low, that&rsquo;s too hot. Ease it back to submaximal and it fits.
            </div>
            <p className="d-caught">Caught before it ever reached the client.</p>
          </div>
        )}
      </div>

      <div className="d-nav">
        <button
          type="button"
          className="d-btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>
        <div className="d-dots">
          {DEMO_TABS.map((t, i) => (
            <span key={t} className={i === step ? 'on' : ''} onClick={() => setStep(i)} />
          ))}
        </div>
        {step < 3 ? (
          <button type="button" className="d-btn primary" onClick={() => setStep((s) => s + 1)}>
            Next
          </button>
        ) : (
          <button type="button" className="d-btn primary" onClick={() => setStep(0)}>
            Replay
          </button>
        )}
      </div>
    </div>
  )
}

const CSS = `
#pr{
  --bg:#0C0F14;--panel:#12161E;--panel-2:#161B25;--line:#232A36;
  --ink:#ECEEF2;--ink-2:#AEB6C4;--slate:#8A93A3;
  --accent:#1B6DFC;--accent-2:#4C8DFF;--glow:rgba(27,109,252,.35);
  --live:#3DD68C;--building:#F5A524;--planned:#6B7482;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  --mono:ui-monospace,"SF Mono","SFMono-Regular",Menlo,Consolas,monospace;
  position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;
  background:
    radial-gradient(1200px 700px at 78% -8%, rgba(27,109,252,.16), transparent 60%),
    radial-gradient(900px 600px at 0% 100%, rgba(27,109,252,.08), transparent 55%),
    var(--bg);
  color:var(--ink);font-family:var(--sans);
  line-height:1.6;letter-spacing:.005em;font-size:17px;
  -webkit-font-smoothing:antialiased;
}
#pr *{box-sizing:border-box;}
#pr .wrap{max-width:1080px;margin:0 auto;padding:0 28px;}
#pr section{padding:76px 0;border-top:1px solid var(--line);}
#pr .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent-2);margin:0 0 18px;display:flex;align-items:center;gap:10px;}
#pr .eyebrow::before{content:"";width:26px;height:1px;background:var(--accent);display:inline-block;}
#pr h1{font-family:var(--sans);font-weight:800;letter-spacing:-.03em;line-height:1.02;font-size:clamp(40px,7.5vw,80px);margin:0;text-wrap:balance;}
#pr h2{font-family:var(--sans);font-weight:800;letter-spacing:-.02em;line-height:1.08;font-size:clamp(28px,4.4vw,44px);margin:0 0 20px;text-wrap:balance;}
#pr h3{font-weight:700;letter-spacing:-.01em;font-size:20px;margin:0 0 8px;}
#pr p{margin:0 0 16px;max-width:64ch;color:var(--ink-2);}
#pr strong{color:var(--ink);font-weight:650;}
#pr .lead{font-size:clamp(19px,2.4vw,23px);color:var(--ink);max-width:60ch;}
#pr .hero{padding:112px 0 86px;border-top:none;}
#pr .hero .kicker{font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate);margin:0 0 26px;}
#pr .hero h1 .accent{color:var(--accent-2);}
#pr .thesis{margin:34px 0 0;font-size:clamp(19px,2.6vw,26px);line-height:1.4;color:var(--ink);max-width:34ch;font-weight:500;letter-spacing:-.01em;}
#pr .thesis b{color:var(--accent-2);font-weight:650;}
#pr .hero-foot{margin-top:52px;display:flex;flex-wrap:wrap;gap:10px 26px;align-items:center;font-family:var(--mono);font-size:12.5px;letter-spacing:.04em;color:var(--slate);}
#pr .hero-foot .dot{width:5px;height:5px;border-radius:50%;background:var(--accent);display:inline-block;margin-right:9px;vertical-align:middle;}
#pr .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:26px;}
#pr .card{background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-radius:16px;padding:26px 24px;}
#pr .card p{margin-bottom:0;}
#pr .chip{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid var(--line);color:var(--slate);}
#pr .chip::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--planned);}
#pr .chip.live{color:#8ff0c4;border-color:rgba(61,214,140,.32);background:rgba(61,214,140,.06);}
#pr .chip.live::before{background:var(--live);box-shadow:0 0 0 3px rgba(61,214,140,.18);}
#pr .chip.building{color:#ffce7a;border-color:rgba(245,165,36,.32);background:rgba(245,165,36,.06);}
#pr .chip.building::before{background:var(--building);}
#pr .chip.planned{color:#aab2c0;}
#pr .split{display:grid;grid-template-columns:.9fr 1.1fr;gap:48px;align-items:start;}
#pr .arc{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:8px;}
#pr .arc .step{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px 20px;}
#pr .arc .step .n{font-family:var(--mono);font-size:12px;color:var(--accent-2);letter-spacing:.12em;}
#pr .arc .step h3{margin-top:10px;font-size:22px;color:var(--ink);}
#pr .arc .step p{font-size:15px;margin:0;}
#pr .arch{margin-top:14px;}
#pr .core{text-align:center;background:radial-gradient(120% 140% at 50% 0%, rgba(27,109,252,.2), transparent 60%),var(--panel);border:1px solid rgba(76,141,255,.4);border-radius:18px;padding:30px 24px;max-width:520px;margin:0 auto;box-shadow:0 0 60px -18px var(--glow);}
#pr .core .tag{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-2);}
#pr .core h3{font-size:26px;margin:10px 0 6px;letter-spacing:-.02em;}
#pr .core p{margin:0 auto;font-size:15px;max-width:44ch;}
#pr .connector{width:1px;height:38px;background:linear-gradient(var(--accent),transparent);margin:6px auto;}
#pr .surfaces{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:6px;}
#pr .surface{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px 20px;display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden;}
#pr .surface::before{content:"";position:absolute;inset:0 auto auto 0;width:100%;height:3px;background:linear-gradient(90deg,var(--accent),transparent);opacity:.7;}
#pr .surface .top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
#pr .surface h3{font-size:18px;margin:0;letter-spacing:-.01em;}
#pr .surface .role{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--slate);}
#pr .surface p{font-size:14.5px;margin:0;color:var(--ink-2);}
#pr .moat{display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;margin-top:6px;}
#pr .moat .item{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line);}
#pr .moat .item:nth-child(1),#pr .moat .item:nth-child(2){border-top:none;}
#pr .moat .k{font-family:var(--mono);color:var(--accent-2);font-size:13px;min-width:26px;padding-top:2px;}
#pr .moat .item p{margin:0;font-size:15px;}
#pr .moat .item h3{font-size:16.5px;margin-bottom:4px;}
#pr .road{display:flex;flex-direction:column;margin-top:8px;}
#pr .road .row{display:grid;grid-template-columns:150px 1fr;gap:24px;padding:20px 0;border-top:1px solid var(--line);}
#pr .road .row:first-child{border-top:none;}
#pr .road .when{font-family:var(--mono);font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-2);padding-top:2px;}
#pr .road .what h3{font-size:17px;margin-bottom:6px;}
#pr .road .what p{font-size:15px;margin:0;}
#pr .close{padding:88px 0 96px;}
#pr .close h2{max-width:20ch;}
#pr .signoff{margin-top:40px;padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;font-family:var(--mono);font-size:12.5px;letter-spacing:.04em;color:var(--slate);}
#pr .signoff b{color:var(--ink);font-weight:600;}
#pr .demo{margin-top:34px;background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-radius:18px;padding:24px 22px;}
#pr .demo-head{margin-bottom:18px;}
#pr .demo-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-2);}
#pr .demo-sub{margin:9px 0 0;font-size:14px;color:var(--slate);max-width:60ch;}
#pr .demo-rail{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
#pr .demo-tab{display:flex;align-items:center;gap:8px;font-family:var(--sans);font-size:13px;color:var(--ink-2);background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:7px 14px 7px 8px;cursor:pointer;transition:border-color .2s,color .2s,background .2s;}
#pr .demo-tab .demo-tab-n{font-family:var(--mono);font-size:11px;width:19px;height:19px;border-radius:50%;background:var(--line);color:var(--ink-2);display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s;}
#pr .demo-tab.on{border-color:var(--accent);color:var(--ink);background:rgba(76,141,255,.10);}
#pr .demo-tab.on .demo-tab-n{background:var(--accent);color:#fff;}
#pr .demo-tab.done .demo-tab-n{background:var(--live);color:#0C0F14;}
#pr .demo-stage{min-height:236px;}
#pr .d-card{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:18px;}
#pr .d-person{display:flex;align-items:center;gap:12px;margin-bottom:13px;}
#pr .d-av{width:40px;height:40px;border-radius:50%;background:rgba(76,141,255,.14);color:var(--accent-2);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
#pr .d-name{margin:0;font-weight:700;font-size:15px;color:var(--ink);}
#pr .d-meta{margin:2px 0 0;font-size:12.5px;color:var(--slate);}
#pr .d-line{margin:0 0 14px;font-size:15.5px;color:var(--ink);font-style:italic;line-height:1.5;}
#pr .d-chips{display:flex;flex-wrap:wrap;gap:8px;}
#pr .d-chips span{font-family:var(--mono);font-size:11px;letter-spacing:.03em;color:var(--ink-2);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:5px 11px;}
#pr .d-ksmall{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-2);margin:0 0 12px;}
#pr .d-badge{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#ffce7a;background:rgba(245,165,36,.10);border:1px solid rgba(245,165,36,.3);border-radius:999px;padding:5px 12px;margin-bottom:13px;}
#pr .d-read{margin:0 0 16px;font-size:16px;color:var(--ink);line-height:1.5;max-width:52ch;}
#pr .d-gates{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:13px;}
#pr .d-gates>div{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px 12px;text-align:center;}
#pr .d-gates span{display:block;font-size:10.5px;color:var(--slate);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;}
#pr .d-gates b{font-size:14px;font-weight:700;}
#pr .d-gates b.low{color:#ff9a9a;}
#pr .d-gates b.ok{color:var(--live);}
#pr .d-binding{margin:0;font-size:14px;color:var(--ink-2);}
#pr .d-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
#pr .d-ptitle{margin:0 0 9px;font-size:16px;font-weight:700;color:var(--ink);}
#pr .d-two ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;}
#pr .d-two li{font-size:13.5px;color:var(--ink-2);padding-left:16px;position:relative;line-height:1.35;}
#pr .d-two li::before{content:"";position:absolute;left:2px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--accent);}
#pr .d-note{margin:14px 0 0;font-size:13.5px;color:var(--slate);text-align:center;}
#pr .d-chat .d-bubble{border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:14.5px;line-height:1.5;}
#pr .d-bubble .d-who{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px;opacity:.7;}
#pr .d-bubble.coach{background:var(--panel);border:1px solid var(--line);color:var(--ink-2);max-width:70%;}
#pr .d-bubble.ai{background:rgba(76,141,255,.10);border:1px solid rgba(76,141,255,.3);color:var(--ink);}
#pr .d-caught{margin:8px 0 0;font-size:13.5px;color:#8ff0c4;font-weight:600;}
#pr .d-nav{display:flex;align-items:center;justify-content:space-between;margin-top:18px;}
#pr .d-btn{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--ink-2);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:9px 18px;cursor:pointer;transition:opacity .2s,border-color .2s;}
#pr .d-btn:disabled{opacity:.4;cursor:default;}
#pr .d-btn.primary{background:var(--accent);color:#fff;border-color:transparent;}
#pr .d-dots{display:flex;gap:8px;}
#pr .d-dots span{width:8px;height:8px;border-radius:50%;background:var(--line);cursor:pointer;transition:background .2s;}
#pr .d-dots span.on{background:var(--accent);}
@media (max-width:760px){#pr .d-two{grid-template-columns:1fr;}#pr .d-bubble.coach{max-width:100%;}}
#pr .fade{opacity:0;transform:translateY(14px);transition:opacity .7s ease,transform .7s ease;}
#pr .fade.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){#pr .fade{opacity:1;transform:none;transition:none;}}
@media (max-width:760px){
  #pr{font-size:16px;}
  #pr section{padding:56px 0;}
  #pr .hero{padding:76px 0 56px;}
  #pr .grid-2,#pr .split,#pr .arc,#pr .surfaces,#pr .moat{grid-template-columns:1fr;}
  #pr .road .row{grid-template-columns:1fr;gap:6px;}
  #pr .split{gap:28px;}
}
`
