export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-2">Dashboard Guide</h1>
        <p className="text-stone-400 text-sm">How the Body Recode Performance Coaching system works — and why each part is structured the way it is.</p>
      </div>

      <div className="space-y-3">

        {/* Section 1 */}
        <Section title="1. Lead Pipeline" colour="teal">
          <p>Every potential client enters the system as a <strong>lead</strong>. Leads are created manually or automatically when someone submits the performance check-in quiz.</p>
          <p>On the lead detail page, the <strong>Contact</strong> section has an <strong>Edit</strong> link that lets you update the lead&apos;s name, email, and phone number directly from the dashboard without going to Supabase.</p>
          <p>Leads move through statuses as they progress:</p>
          <StatusList items={[
            { label: 'New Check-In', desc: 'Quiz submitted, report not yet sent.' },
            { label: 'Report Sent', desc: 'Performance report scheduled and sent to the lead.' },
            { label: 'Cold - No Booking', desc: 'Report sent but no Zoom 1 booked after follow-ups.' },
            { label: 'Zoom 1 Booked', desc: 'First consultation booked.' },
            { label: 'Zoom 1 Completed', desc: 'First consultation done.' },
            { label: 'Closed - No Show', desc: 'Lead did not attend. Re-engagement sequence available.' },
            { label: 'Zoom 2 Booked', desc: 'Orientation review and pricing call booked.' },
            { label: 'Zoom 2 Completed', desc: 'Pricing conversation completed.' },
            { label: 'Closed - Declined', desc: 'Lead decided not to proceed.' },
            { label: 'Commencement Fee Paid', desc: 'Payment received. Client profile created automatically.' },
            { label: 'Active - Deliberate Start', desc: 'In the 3-7 day window before coaching begins.' },
            { label: 'Active Coaching', desc: 'Coaching underway.' },
          ]} />
          <Training title="Why statuses matter">
            <p>The pipeline exists to tell you exactly where every lead is at a glance — and where the system is getting stuck. If you have 12 leads sitting at Report Sent with no Zoom 1 booked, that is a data point, not a coincidence. It means the report landed but didn&apos;t create enough pull to book the call.</p>
            <p className="mt-2">Cold - No Booking is not a failure status. It means the timing wasn&apos;t right when the sequence ran. These leads still have their data on file — they&apos;re candidates for the re-engagement blast when you&apos;re ready to run it.</p>
            <p className="mt-2">Closed - Declined and Closed - No Show are both recoverable. They go into the re-engagement pool. Don&apos;t treat them as dead.</p>
          </Training>
        </Section>

        {/* Section 2 */}
        <Section title="2. Zoom 1 - Call Companion" colour="teal">
          <p>Open the <strong>Call Companion</strong> from the lead detail page before or during Zoom 1. It opens in a new tab so you can run it alongside the Zoom call.</p>
          <p>The companion has 5 stages:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Opening</strong> — Set context, explain the purpose of the call.</li>
            <li><strong>Check-In Review</strong> — Walk through the lead&apos;s quiz responses.</li>
            <li><strong>Signal Exploration</strong> — Explore SLS, RPS, and RILS signal areas using structured prompts.</li>
            <li><strong>Pattern Interpretation</strong> — Name the dominant pattern using signal-specific language.</li>
            <li><strong>Close</strong> — Confirm the report, next steps, and Zoom 2 booking.</li>
          </ol>
          <p>The notes panel on the right contains three persistent actions available at any stage:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Book Zoom 2</strong> — enter the date and confirm directly from the companion. Updates the lead record and status to Zoom 2 Booked without leaving the call.</li>
            <li><strong>Mark Zoom 1 Complete</strong> — updates lead status. Available at any stage, not just Stage 5.</li>
            <li><strong>Readiness Check</strong> — A (ready), B (hesitant), C (not right fit). Use it to anchor your read before Stage 5.</li>
          </ul>
          <p>After the call, switch to <strong>Post-Call</strong> view, paste the Zoom transcript, and generate an AI summary. Click <strong>Save to lead notes</strong> to persist it to the lead record — it won&apos;t survive a page refresh otherwise.</p>
          <Note>Scripts and prompts are personalised to each lead&apos;s signal levels (SLS, RPS, RILS). Stage 3 prompts are grouped by category (Training, Recovery, Consistency, Pressure) with sub-questions indented below each.</Note>
          <Training title="What Zoom 1 is actually for">
            <p><strong>Zoom 1 is not a sales call.</strong> There is nothing to sell yet. The only job in this call is to make the lead feel correctly understood and to build the interpretation that the report is based on something real, not generic.</p>
            <p className="mt-2">The reason this matters for Zoom 2 is simple: if a lead doesn&apos;t trust the report, price becomes the only thing they can evaluate. If they do trust the report, they are evaluating whether this is the right intervention — which is a completely different conversation.</p>
            <p className="mt-2">The signal exploration in Stage 3 gives you the language for Stage 3 of Zoom 2. The hot spot you name in Zoom 2 should come directly from what surfaced in Zoom 1. Keep your notes panel updated — those notes are what you&apos;ll reference two calls later.</p>
            <p className="mt-2">The Close in Stage 5 has one goal: get Zoom 2 booked before the call ends. The orientation guide you send after Zoom 1 is not a follow-up — it&apos;s a warm handoff that does cognitive work for you before Zoom 2 even happens.</p>
          </Training>
        </Section>

        {/* Section 3 */}
        <Section title="3. Orientation" colour="teal">
          <p>After Zoom 1, send the <strong>Orientation Guide</strong> from the lead detail page. This emails the lead a branded link to the orientation page at <strong>app.bodyrecode.au/orientation</strong> — no PDF attachment.</p>
          <p>The guide covers what Body Recode Performance Coaching is, what to expect, and how to prepare for Zoom 2. The lead should read it before the second call.</p>
          <p>Once sent, the section shows the date it was sent. Click <strong>View Guide</strong> to preview the page as the client sees it.</p>
          <Training title="Why this step exists between the two calls">
            <p>Most coaches go straight from a discovery call to a pricing call. The gap between Zoom 1 and Zoom 2 is intentional — it is not dead time.</p>
            <p className="mt-2">The orientation guide does cognitive work that you cannot do live. It explains the framework, sets expectations, and begins the mental shift from &quot;I&apos;m thinking about this&quot; to &quot;I understand what I&apos;m walking into.&quot; A lead who arrives at Zoom 2 having read the guide is in a completely different state than one who hasn&apos;t.</p>
            <p className="mt-2">If a lead comes into Zoom 2 not understanding what the program actually is, the pricing conversation becomes a negotiation about cost rather than a decision about fit. The guide removes that friction before it can happen.</p>
            <p className="mt-2">Send it the same day as Zoom 1 while the conversation is fresh in their mind.</p>
          </Training>
        </Section>

        {/* Section 4 */}
        <Section title="4. Zoom 2 - Call Companion" colour="teal">
          <p>Open the <strong>Call Companion</strong> from the lead detail page before Zoom 2. It opens in a new tab at <strong>/companion/[id]/zoom-2</strong> — outside the dashboard so it runs full screen during the call.</p>
          <p>The companion has 5 stages:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Report Review</strong> — Ensure the lead has read and understood the report correctly.</li>
            <li><strong>Emotional Acknowledgement</strong> — Normalise confusion and confidence erosion.</li>
            <li><strong>Hot Spot Framing</strong> — Name the specific point from Zoom 1 where effort and response stopped aligning.</li>
            <li><strong>Pricing</strong> — Present the coaching structure and packages as information, not persuasion.</li>
            <li><strong>Decision</strong> — Identify the path and close cleanly.</li>
          </ol>

          <Training title="The sales logic behind each stage">
            <p><strong>Stage 1 — Report Review.</strong> Don&apos;t assume they read it, or that they understood it correctly. A lead who misread the report will evaluate everything that follows against the wrong mental model. You&apos;re checking comprehension, not quizzing them. If they interpreted something incorrectly, correct it now — before pricing. The transition out of Stage 1 is: &quot;Good — that&apos;s exactly what I needed to know. Let&apos;s keep going.&quot;</p>
            <p className="mt-2"><strong>Stage 2 — Emotional Acknowledgement.</strong> Before pricing lands, the lead needs to feel heard. Confusion and confidence erosion are common in people who have been trying and not getting results. If you skip this stage, the lead feels like you ran through a report and jumped straight to selling. This stage doesn&apos;t need to be long — but it must be done. The transition is: &quot;Good — I want to come back to something specific you mentioned earlier.&quot;</p>
            <p className="mt-2"><strong>Stage 3 — Hot Spot Framing.</strong> This is the bridge between &quot;I understand my situation&quot; and &quot;I understand why I need help with it.&quot; Name the specific thing from Zoom 1. This is not a generic pitch — it should sound like you were listening. If you named it right, they&apos;ll feel seen. That feeling is what makes pricing land differently. Do not move to pricing until this is done.</p>
            <p className="mt-2"><strong>Stage 4 — Pricing.</strong> Lead with in-person 2x ($299/week). Present it as information, not a pitch. You&apos;re telling them what the structure looks like — not trying to convince them. After you say the number: pause. Let it land. Do not fill the silence. The silence is not awkward — it is the lead processing. The moment you start talking to fill it, you&apos;ve signalled that you&apos;re nervous about the price, and they will take their cue from you.</p>
            <p className="mt-2"><strong>Stage 5 — Decision.</strong> Three possible paths. Know which one you&apos;re in before you respond.</p>
          </Training>

          <p className="mt-1">The companion has five tabs:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Script &amp; Prompts</strong> — Full verbatim script and stage-by-stage prompts for the call.</li>
            <li><strong>Objection-Triggered</strong> — Three-step script for making the Founding Client offer after a price objection. Step 1: handle the objection. Step 2: introduce the program. Step 3: walk them through the details if they want to know more — covers minimum commitment, what gets documented, consent tiers, and the signing sequence.</li>
            <li><strong>Manual Override</strong> — Script for proactively offering the Founding Client program to a high-suitability lead before any objection arises. Includes a four-point qualification checklist — all four must be true before using this tab.</li>
            <li><strong>Online Coaching</strong> — Fallback script if the lead objects to in-person pricing and online is appropriate.</li>
            <li><strong>Signal Reference</strong> — Quick view of the lead&apos;s SLS, RPS, and RILS levels mid-call.</li>
          </ul>

          <Training title="When to use each tab">
            <p><strong>Objection-Triggered.</strong> The script in this tab exists so you don&apos;t have to improvise a price objection response live. Improvising usually ends in one of two places: you discount, or you retreat. The script holds the position. The first move is always to repeat the objection back — so the lead knows you heard them, and so you both agree on what you&apos;re actually responding to. Then you reframe the investment. Then, if they still need it, introduce the Founding Client program as the second offer.</p>
            <p className="mt-2"><strong>Manual Override.</strong> This tab is not a convenience tool for leads who can&apos;t afford the full rate. It is for a specific type of lead where the data capture value is genuinely high and the case study potential is strong. The four-point checklist exists because the program has limited positions — using them on the wrong person closes the door on the right one. Read the checklist carefully before using it.</p>
            <p className="mt-2"><strong>Online Coaching.</strong> Online is a real product, not a consolation offer. If a lead&apos;s situation genuinely calls for it, present it that way. Don&apos;t frame it as second-best.</p>
            <p className="mt-2"><strong>Signal Reference.</strong> Use this if you need a quick reminder of the lead&apos;s signal levels mid-call without switching away from the companion.</p>
          </Training>

          <p className="mt-1">At Stage 5, three decision path buttons appear in the notes panel:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Path A — Declined</strong> — Updates lead status to Closed Declined.</li>
            <li><strong>Path B — Needs Time</strong> — Updates lead status to Zoom 2 Completed.</li>
            <li><strong>Path C — Proceeding</strong> — A pathway selector appears. Choose from Full Rate, Founding Client (Objection Triggered), Founding Client (Manual Override), or Online. For Founding Client pathways a <strong>Send Case Study Agreement</strong> button appears — click it to email the signing link to the lead. The commencement fee is sent only after the agreement is signed.</li>
          </ul>

          <Training title="How to handle each decision path">
            <p><strong>Path A — Declined.</strong> Clean close. Do not re-pitch. Say what the script says — the report still stands, they now have a clearer read on what&apos;s going on, the door is open if anything changes. Do not undersell yourself or your time to keep them interested. A clean exit is better than a desperate one.</p>
            <p className="mt-2"><strong>Path B — Needs Time.</strong> The most important thing here is diagnosing what&apos;s actually sitting with them. &quot;I need to think about it&quot; is not a decision — it&apos;s a pause with a reason behind it. The script asks directly: is it the investment, whether this is the right fit, or something else? Each answer takes you to a different response. And you set a specific follow-up date before the call ends. &quot;I&apos;ll check back in with you&quot; is not a follow-up. A date is a follow-up.</p>
            <p className="mt-2"><strong>Path C — Proceeding.</strong> Select the correct pathway before clicking anything. The pathway you select determines what gets recorded on the lead&apos;s profile and what the Founding Client section on their client profile will show. For Founding Client pathways, send the agreement before the commencement fee. This is the order. Do not deviate from it.</p>
          </Training>

          <Note>Lead with in-person 2x ($299/week). Only introduce online ($149/week) if the lead objects to the price. The 3x in-person package ($409/week) is not presented at Zoom 2 — it is coach-assessed and offered during weekly check-ins once coaching is underway. Founding client rates: 2x $149.50/week, 3x $204.50/week, online $74.50/week.</Note>
        </Section>

        {/* Section 5 */}
        <Section title="5. Coaching Entry" colour="teal">
          <p>From the lead detail page, the Coaching Entry section has two options:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Send to Client</strong> — generates a unique Stripe checkout link and emails it directly to the lead in a branded email. One click.</li>
            <li><strong>Copy Link</strong> — generates the link and copies it to your clipboard for manual sending.</li>
          </ul>
          <p>When the client pays:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>You receive an email notification immediately confirming the payment.</li>
            <li>Their client profile is created automatically.</li>
            <li>Their welcome email and intake link are sent to them immediately.</li>
            <li>The lead status updates to <strong>Commencement Fee Paid</strong>.</li>
          </ol>
          <p>The lead detail page will then show a <strong>View client profile</strong> link.</p>
          <Note>A manual Convert to Client button is also available as a fallback if needed.</Note>
          <Training title="Why the commencement fee exists">
            <p>The $240 commencement fee is not a deposit. It is a commitment signal. It separates people who are interested from people who are ready. Someone who pays the commencement fee has moved from considering the program to entering it. That psychological shift matters — it changes how they engage with everything that follows.</p>
            <p className="mt-2">The automation triggered by this payment (profile creation, welcome email, intake link) removes the most failure-prone handover in the entire process. Manual client creation is where admin errors happen. Tying it to the payment makes it impossible to miss.</p>
          </Training>
        </Section>

        {/* Section 6 */}
        <Section title="6. Post-Conversion Sequence" colour="teal">
          <p>Once the commencement fee is paid, the following happens automatically and in order:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Client profile created in the Clients dashboard.</li>
            <li>Welcome email sent to the client with their intake link.</li>
            <li>Client completes the foundational intake (208 questions, 15-20 min).</li>
            <li>CFFS generated automatically and appears on the client profile.</li>
          </ol>
          <p>Your manual steps after conversion:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Set the <strong>Coaching Package</strong> (online, 2x, or 3x) on the client profile and copy the subscription link to send to the client.</li>
            <li>When the client pays, the Coaching Package section shows a <strong>Subscription Active</strong> badge automatically.</li>
            <li>Once both payments are confirmed, set the <strong>Coaching Start Date</strong> (3-7 days out).</li>
            <li>Client receives a reminder email the day before coaching begins.</li>
          </ol>
          <Note>Coaching does not start until both the commencement fee and the weekly subscription payment are received. Wait for the Subscription Active badge before setting the start date.</Note>
          <Training title="Why this sequence is ordered this way">
            <p>The commencement fee comes first, then the subscription. The commencement fee creates the client. The subscription funds ongoing coaching. Starting coaching before the subscription is active means you are working without confirmation that payment is in place. The Subscription Active badge is your signal that it is safe to set the start date.</p>
            <p className="mt-2">The intake link goes out immediately after payment — not 24 hours later. Momentum is highest right after the payment decision. If you delay the intake, you delay the CFFS, which delays the start date, which delays coaching. The automation handles the immediate send so no action is required on your end.</p>
          </Training>
        </Section>

        <Section title="7. Deliberate Start Window" colour="teal">
          <p>After conversion, set the <strong>Coaching Start Date</strong> on the client profile. This is the date coaching officially begins — typically 3-7 days after the commencement fee is paid.</p>
          <p>Until the start date:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>The client dashboard shows a <strong>Starts in Xd</strong> badge.</li>
            <li>The client gets a reminder email the day before coaching begins.</li>
          </ul>
          <p>The start date is also used to calculate the client&apos;s week number for check-ins and CFWS generation.</p>
          <Training title="Why not start immediately">
            <p>The 3-7 day window is not admin lag. It is intentional. The client needs psychological preparation time — a moment between deciding to do something and actually doing it. Starting immediately after payment can feel reactive. Starting after a deliberate lead-in period signals that this is a structured process, not an impulse.</p>
            <p className="mt-2">The window also gives the client time to complete their intake before coaching begins. The CFFS informs your first week of coaching. If the intake isn&apos;t done yet, don&apos;t set the start date.</p>
          </Training>
        </Section>

        {/* Section 7 */}
        <Section title="8. Client Onboarding" colour="teal">
          <p>After the commencement fee is paid, the client receives an intake link by email. They complete:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Coaching Agreement</strong> — signed via the client portal.</li>
            <li><strong>Health Declaration</strong> — submitted via the client portal.</li>
            <li><strong>Foundational Intake</strong> — 208-question intake covering all signal domains.</li>
            <li><strong>Baseline Measurements</strong> — bodyweight, waist, hips, chest, and optional photos.</li>
          </ol>
          <p>When the intake is submitted, the <strong>CFFS</strong> (Client Functional Framework Summary) is generated automatically by Claude.</p>
          <Note>If the CFFS fails to generate, use the Regenerate button on the client profile.</Note>
          <Training title="What the intake is building">
            <p>The 208-question intake is not a form. It is the raw material for the CFFS — a structured read of the client&apos;s current body state across all signal domains. The questions exist because body response patterns don&apos;t reveal themselves in a short intake. Depth matters.</p>
            <p className="mt-2">The baseline measurements taken here are the reference point for everything that follows. Week 1 data only becomes meaningful because of what was captured here. Encourage the client to be accurate rather than aspirational with their numbers.</p>
          </Training>
        </Section>

        {/* Section 8 */}
        <Section title="9. CFFS — Client Functional Framework Summary" colour="teal">
          <p>The CFFS is generated from the foundational intake. It is a structured interpretation of the client&apos;s current body state across 8 signal domains.</p>
          <p>It includes:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>Body State Classification (Remediation, Optimisation, Post-Optimisation)</li>
            <li>Resolution State</li>
            <li>Exposure Readiness across 4 dimensions</li>
            <li>Client Context Summary</li>
            <li>Primary Patterns and Signals</li>
            <li>Capacity Constraints and Guardrails</li>
            <li>Risk Flags and Watch Items</li>
            <li>Tensions and Trade-Offs</li>
            <li>Explicit Non-Directives</li>
            <li>Closing Interpretive Notes</li>
          </ul>
          <Note>The CFFS is a coaching reference document, not a diagnostic tool. It does not prescribe training changes.</Note>
          <Training title="How to use the CFFS">
            <p>The CFFS is not a report to file away. It is the interpretive framework for your first weeks of coaching. Before you prescribe anything — load, frequency, nutrition adjustments — read the CFFS. The Capacity Constraints and Guardrails section in particular tells you what not to do before it tells you what to do.</p>
            <p className="mt-2">The Body State Classification (Remediation, Optimisation, Post-Optimisation) should orient your entire early coaching approach. A client in Remediation is not ready for the same intervention as one in Optimisation. The CFFS makes that distinction clearly — your programming should reflect it.</p>
            <p className="mt-2">Risk Flags and Watch Items are not optional reading. If something is flagged, it means the intake data produced a pattern that requires attention. These should inform how you frame weekly check-in prompts and what you&apos;re watching for in the CFWS.</p>
          </Training>
        </Section>

        {/* Section 9 */}
        <Section title="10. Weekly Check-Ins and CFWS" colour="teal">
          <p>Each week, clients complete one check-in form during the Friday 6pm to Sunday 6pm Brisbane window. Forms alternate each week:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Form A</strong> (odd weeks) — Training, recovery, and load questions.</li>
            <li><strong>Form B</strong> (even weeks) — Regulation, lifestyle, and context questions.</li>
          </ul>
          <p>Every Friday at 6pm Brisbane time, clients receive an automated email notifying them that the window is open. The email includes a link to their personal client dashboard at <strong>/client/[token]</strong>.</p>
          <p>The client dashboard shows:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>Current week number and window status (open or closed).</li>
            <li>The active form for this week — ticked if submitted, with a Complete button if not.</li>
            <li>Next window open time if the window is currently closed.</li>
          </ul>
          <p>When the form is submitted:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>The client receives a confirmation email — &quot;Got it, [name]. Your Week X check-in has been received.&quot;</li>
            <li>You receive a notification email with a link to the client profile.</li>
            <li>The <strong>CFWS</strong> (Client Functional Weekly Synthesis) is generated automatically using the most recent Form A and Form B available.</li>
          </ol>
          <p>The client profile shows the latest CFWS and the last 8 check-in submissions.</p>
          <Note>Use the Regenerate button to manually trigger a new CFWS if needed.</Note>
          <Training title="Why this structure exists">
            <p><strong>Alternating forms.</strong> Form A captures load, training, and recovery. Form B captures regulation, lifestyle, and context. Together they produce a complete picture of the week. Running both every week would be 20+ minutes per check-in. Alternating them halves the client burden while keeping the data complete over a two-week cycle. The CFWS is always generated using the most recent Form A and Form B — even if they weren&apos;t from the same week.</p>
            <p className="mt-2"><strong>The Friday-Sunday window.</strong> Friday 6pm is not arbitrary. It gives the client the full week to have happened before they reflect on it. Sunday 6pm closes it before Monday, so you have the CFWS ready before the new week begins. Read the CFWS before Monday if you can — it will orient your coaching decisions for the week ahead.</p>
            <p className="mt-2"><strong>The notification to you.</strong> The email you receive links directly to the client profile. The CFWS is there waiting. You don&apos;t need to remember to check — the system tells you when something needs your attention.</p>
          </Training>
        </Section>

        {/* Section 10 */}
        <Section title="11. Coaching Package and Upgrades" colour="teal">
          <p>On the client profile, set the client&apos;s <strong>Coaching Package</strong> to record which plan they are on:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Online — $149/week</strong></li>
            <li><strong>In-Person 2x — $299/week</strong></li>
            <li><strong>In-Person 3x — $409/week</strong></li>
          </ul>
          <p>Once a package is selected, a <strong>Copy Subscription Link</strong> button appears. The link includes the client&apos;s ID so the system can identify them when they pay. When the client completes payment, the <strong>Subscription Active</strong> badge appears automatically on the client profile.</p>
          <p>To upgrade a client from 2x to 3x:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Cancel the existing $299/week subscription in Stripe.</li>
            <li>Select <strong>In-Person 3x</strong> on the client profile.</li>
            <li>Copy and send the $409/week subscription link to the client.</li>
            <li>Update to 3x once they have subscribed.</li>
          </ol>
          <Note>The 3x package is coach-assessed. Only offer it during weekly check-ins once you have enough data to confirm the client can sustain three sessions per week.</Note>
          <Training title="Why 3x is not offered at Zoom 2">
            <p>At Zoom 2, you have a report, one consultation, and whatever they told you about themselves. That is not enough data to know whether a client can sustain three sessions per week on top of their life. Offering 3x too early sets up a client for a load they can&apos;t maintain — and when they struggle with it, they attribute the problem to the program rather than the prescription.</p>
            <p className="mt-2">The 3x upgrade should come from the CFWS data. Several weeks of check-ins will show you whether a client&apos;s recovery, regulation, and schedule can support a third session. When the data says yes, you make the offer from a position of evidence. The client will feel the difference between being sold a bigger package at the start and being assessed for one after you&apos;ve watched them closely for weeks.</p>
          </Training>
        </Section>

        <Section title="12. Clients Dashboard" colour="teal">
          <p>The clients dashboard shows a live overview of all active clients. For each client in active coaching, the row displays:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Week number</strong> — Current coaching week based on their start date.</li>
            <li><strong>A / B check-in status</strong> — Teal if submitted this week, grey if not yet submitted.</li>
            <li><strong>CFWS readiness dots</strong> — Four coloured dots (Capacity, Schedule, Regulation, Behaviour) from the latest weekly synthesis. Green = ready, Amber = caution, Red = flag.</li>
            <li><strong>Body state badge</strong> — From the latest CFFS.</li>
          </ul>
          <p>Clients in the Deliberate Start Window show a <strong>Starts in Xd</strong> amber badge instead.</p>
          <Training title="How to read the clients dashboard">
            <p>The dashboard is designed to tell you who needs attention this week without clicking into every profile. The readiness dots are your triage layer. If a client has any amber or red dots, open their profile before their session.</p>
            <p className="mt-2">A grey A or B check-in badge mid-week is normal — the window may still be open. A grey badge on Monday means they didn&apos;t submit. That is worth a check-in message, not just a note.</p>
            <p className="mt-2">Week number matters more than it looks. A client in week 2 is in a completely different phase than a client in week 14. The early weeks are about establishing baseline patterns. Overloading someone in week 2 because their CFWS looks good is still overloading them in week 2.</p>
          </Training>
        </Section>

        <Section title="13. Automated Status Flow" colour="teal">
          <p>Lead statuses update automatically at these trigger points. You do not need to change them manually.</p>
          <div className="space-y-2">
            <FlowRow trigger="Check-in quiz submitted" from="—" to="New Check-In" auto />
            <FlowRow trigger="Report scheduled and sent" from="New Check-In" to="Report Sent" auto />
            <FlowRow trigger="Lead books via Calendly" from="Report Sent (or earlier)" to="Zoom 1 Booked" auto />
            <FlowRow trigger="Lead books via Calendly again" from="Zoom 1 Completed" to="Zoom 2 Booked" auto />
            <FlowRow trigger="Commencement fee paid via Stripe" from="Any" to="Commencement Fee Paid" auto />
          </div>
          <p className="mt-2">These transitions are manual — they require your input after the call or conversation:</p>
          <div className="space-y-2">
            <FlowRow trigger="You mark after Zoom 1 call ends" from="Zoom 1 Booked" to="Zoom 1 Completed" auto={false} />
            <FlowRow trigger="Decision at Zoom 2 (Path B or C)" from="Zoom 2 Booked" to="Zoom 2 Completed" auto={false} />
            <FlowRow trigger="Lead declines at Zoom 2 (Path A)" from="Zoom 2 Booked" to="Closed - Declined" auto={false} />
            <FlowRow trigger="Lead did not attend Zoom 1" from="Zoom 1 Booked" to="Closed - No Show" auto={false} />
            <FlowRow trigger="Report sent but no booking after follow-ups" from="Report Sent" to="Cold - No Booking" auto={false} />
          </div>
          <Training title="What requires your attention vs what runs itself">
            <p>The automations handle the objective triggers — payment, quiz submission, Calendly booking. You handle the human judgements — whether a Zoom 1 is complete, which path a Zoom 2 conversation ended on, whether a lead genuinely went cold or just needs more time.</p>
            <p className="mt-2">The manual transitions are not admin tasks. They are your interpretive decisions about where a lead is in the process. Keeping them accurate keeps the pipeline data trustworthy. If statuses drift, you lose visibility into where the real friction is.</p>
          </Training>
        </Section>

        <Section title="14. Email Sequences and Automation" colour="teal">
          <p>The following outbound email sequences run automatically. All emails send from <strong>kade@bodyrecode.au</strong> via Resend.</p>

          <p className="font-semibold text-white mt-2">Performance Report + Follow-Up Sequence</p>
          <p>Triggered when a lead submits the check-in quiz. The report is scheduled to send the following morning at 9am Brisbane time.</p>
          <div className="space-y-1">
            <SeqRow day="Next morning 9am" label="Performance report email" />
            <SeqRow day="Day 2" label="Follow-up 1 — Re: Your check-in report" />
            <SeqRow day="Day 5" label="Follow-up 2 — When the effort doesn't match the result" />
            <SeqRow day="Day 9" label="Follow-up 3 — Last one from me, [name]" />
          </div>
          <p className="mt-2">The follow-up sequence is <strong>automatically cancelled</strong> the moment the lead books a Zoom via Calendly. If you need to cancel it manually, use the Cancel Sequence button on the lead detail page.</p>

          <p className="font-semibold text-white mt-4">Re-engagement Blast (Admin Action)</p>
          <p>A one-time admin action available on the dashboard homepage. Sends the re-engagement email plus a fresh follow-up sequence to all leads who have check-in answers on file. Any previously scheduled follow-ups are cancelled before the new sequence is sent.</p>
          <p>Leads with statuses <strong>Commencement Fee Paid</strong>, <strong>Closed - Declined</strong>, or <strong>Closed - No Show</strong> do not receive new follow-ups.</p>

          <p className="font-semibold text-white mt-4">Orientation Guide</p>
          <p>Sent manually from the lead detail page after Zoom 1. Sends the orientation PDF as an email attachment. The date it was sent is shown on the lead page.</p>

          <p className="font-semibold text-white mt-4">No-Show Re-engagement Sequence</p>
          <p>Triggered manually from the lead detail page when a lead is marked Closed - No Show.</p>
          <div className="space-y-1">
            <SeqRow day="Day 1" label="Calm acknowledgement, door left open" />
            <SeqRow day="Day 4" label="Gentle follow-up" />
            <SeqRow day="Day 10" label="Final invitation to rebook" />
          </div>

          <p className="font-semibold text-white mt-4">Welcome Email (Post-Conversion)</p>
          <p>Sent automatically when the commencement fee is paid. Contains the client&apos;s unique intake link. Triggered by the Stripe webhook.</p>

          <p className="font-semibold text-white mt-4">Weekly Check-In Window Open</p>
          <p>Sent automatically every Friday at 6pm Brisbane time to all active clients. Contains a link to the client dashboard. Triggered by a Vercel cron job.</p>

          <p className="font-semibold text-white mt-4">Coaching Start Reminder</p>
          <p>Sent automatically the day before a client&apos;s coaching start date. Triggered by a Vercel cron job that runs daily.</p>

          <p className="font-semibold text-white mt-4">Founding Client Case Study Agreement</p>
          <p>Sent manually from the Zoom 2 companion when a Founding Client pathway is selected at Stage 5. Click <strong>Send Case Study Agreement</strong> — the system creates the agreement record, generates a unique signing token, and emails the lead a link to review and sign online. The email is sent from kade@bodyrecode.au. The agreement must be signed before the commencement fee is sent.</p>

          <Training title="The logic behind the follow-up timing">
            <p>Day 2, Day 5, Day 9. Not daily. Not weekly. The gaps are intentional. Day 2 is when the report is still fresh. Day 5 is when most people have filed it away but haven&apos;t fully forgotten it. Day 9 is the last reach — the tone shifts to a genuine close. Running them too close together feels like pressure. Too far apart and the thread is lost.</p>
            <p className="mt-2">The sequence cancels automatically on booking because the goal of the sequence is a Zoom 1. Once that happens, the follow-ups would be noise. They don&apos;t just stop — they are actively cancelled so nothing goes out while the lead is already in the pipeline.</p>
          </Training>
        </Section>

        <Section title="15. Communications Timeline" colour="teal">
          <p>Every lead detail page has a <strong>Communications</strong> panel. It shows a reverse-chronological timeline of all outbound emails logged for that lead.</p>
          <p>Events logged automatically:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>Performance report scheduled</li>
            <li>Follow-up emails scheduled (Day 2, 5, 9) with subject lines</li>
            <li>Re-engagement blast sent</li>
            <li>Orientation guide sent</li>
            <li>Zoom booking confirmed (via Calendly)</li>
            <li>No-show sequence emails scheduled</li>
          </ul>
          <p>Each entry shows the event type, subject line, and exact Brisbane timestamp. The timeline is live — it updates as emails go out.</p>
          <Note>Historical leads (those who submitted before this feature was built) will not have events in the timeline. All new activity is logged going forward.</Note>
        </Section>

        <Section title="16. Admin Actions" colour="teal">
          <p>The following actions are available on the <strong>Dashboard Homepage</strong> in the Admin Actions panel.</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Send preview email</strong> — Sends a sample re-engagement report email to kade@bodyrecode.au. Use this to preview formatting and layout before running the blast.</li>
            <li><strong>Resend reports to all leads</strong> — Triggers the re-engagement blast. Cancels all existing follow-up sequences and sends a fresh re-engagement email plus a new 3-email follow-up sequence to every lead with check-in data. Requires confirmation before firing.</li>
          </ul>
          <Note>The blast is protected by an admin secret and requires confirmation. It will not fire accidentally.</Note>
        </Section>

        <Section title="17. Founding Client Program" colour="teal">
          <p>The Founding Client Program is a limited, selective participation model. Up to 5 positions are available. The fee is adjusted by 50% in exchange for the client&apos;s documented participation in a structured case study process.</p>
          <p>This is a structured trade, not a discount. The client provides participation of commercial and developmental value to the system. The adjusted fee reflects that exchange.</p>

          <Training title="Why framing matters here">
            <p>The language matters. Calling it a discount frames it as you giving something up. Calling it a trade frames it as an exchange — and it is an exchange. The client gets a reduced fee. You get documented case study data, which has real commercial value for the system&apos;s long-term development.</p>
            <p className="mt-2">Presenting it as a trade also screens out the wrong leads. Someone who responds well to the framing understands the nature of the program. Someone who immediately treats it as a price negotiation tool is likely the wrong fit for it. The five positions are finite — use them with intent.</p>
          </Training>

          <p className="font-semibold text-white mt-2">Two entry triggers</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Objection-triggered</strong> — The full rate offer is made first. If the lead objects to price, the Founding Client offer is introduced as the second offer. Use the Objection-Triggered tab in the Zoom 2 companion for the full script and qualification checklist.</li>
            <li><strong>Manual override</strong> — For a high-suitability lead, you may proactively offer the program before any objection arises. Use the Manual Override tab. This requires deliberate intent, not convenience. The positioning criteria must be met.</li>
          </ul>

          <Training title="Objection-triggered vs manual override — know the difference">
            <p><strong>Objection-triggered</strong> is the standard pathway. Full rate goes first, always. If the lead objects to price, you handle the objection first (repeat it back, reframe the investment), and if they still need something to move, the Founding Client program becomes the second offer. The script walks you through the steps — use it.</p>
            <p className="mt-2"><strong>Manual override</strong> is not for when you want to help someone who can&apos;t afford the full rate. That is a misuse of the program and a misuse of a position. Manual override is for a lead where the case study potential is genuinely high — they have a compelling story, a body state that produces useful data, and the willingness to be part of a documented process. All four criteria on the checklist must be true before you use it.</p>
          </Training>

          <p className="font-semibold text-white mt-2">Agreement before commencement</p>
          <p>The Founding Client Case Study Agreement must be signed before the commencement fee is sent. This is non-negotiable. The sequence is:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Lead accepts the Founding Client offer at Zoom 2.</li>
            <li>Select Path C → Founding Client pathway in the Zoom 2 decision panel.</li>
            <li>Click <strong>Send Case Study Agreement</strong> — this creates the agreement record and emails the signing link to the lead.</li>
            <li>Lead reviews and signs the agreement online, selecting their consent tier.</li>
            <li>Once signed, generate and send the commencement fee from the lead detail page.</li>
          </ol>

          <p className="font-semibold text-white mt-2">Consent tiers</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Tier 1 — Anonymised</strong> — Case study may be published with identity removed.</li>
            <li><strong>Tier 2 — Named</strong> — Case study may be published with identity, subject to client review of identifying material.</li>
          </ul>

          <Training title="Why consent tiers exist">
            <p>The consent tier is selected by the client at signing — not decided by you. This is important. The agreement is legally and ethically structured around what the client has consented to. Tier 2 gives you more flexibility to publish and use the case study publicly. Tier 1 still produces valuable documented data, but you cannot attach a name or identifying details to it.</p>
            <p className="mt-2">The tier selection is captured at signing and shown permanently on the client&apos;s profile. It determines what you can do with the case study when the time comes. Don&apos;t assume — check the profile.</p>
          </Training>

          <p className="font-semibold text-white mt-2">Founding Client badge and section on client profile</p>
          <p>Once the agreement is signed and the client converts, their profile shows a <strong>Founding Client</strong> badge in the header and a dedicated section with entry type, consent tier, program start date, and 12-week threshold date.</p>
          <p>At the bottom of that section is an <strong>Update status</strong> link. Click it to reveal four status buttons — Active, 12 Weeks Complete, Extended, Withdrawn. The current status is highlighted. Click any other to update it immediately. The status badge updates on the page automatically.</p>

          <p className="font-semibold text-white mt-2">Founding client rates</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>Online — $74.50/week (standard $149)</li>
            <li>In-Person 2x — $149.50/week (standard $299)</li>
            <li>In-Person 3x — $204.50/week (standard $409)</li>
          </ul>

          <Note>Minimum participation is 12 weeks. Ideal engagement is 6-12 months. Status states: Active → 12 Weeks Complete → Extended → Withdrawn. Status is managed manually as the case study progresses.</Note>
        </Section>

        {/* Section 11 */}
        <Section title="18. Stripe Payments" colour="teal">
          <p>Three payment links are used in the coaching entry process:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Commencement Fee — $240</strong> — Generated uniquely per lead. Triggers automatic client creation when paid.</li>
            <li><strong>In-Person 2x — $299/week</strong> — Static link. Standard entry package. Send after commencement fee is confirmed.</li>
            <li><strong>In-Person 3x — $409/week</strong> — Static link. Coach-assessed upgrade, offered during weekly check-ins not at Zoom 2.</li>
            <li><strong>Online — $149/week</strong> — Static link. Fallback if lead objects to in-person pricing.</li>
          </ul>
          <p>Payment links for the weekly subscription are available in the Zoom 2 companion Stage 5 Decision panel.</p>
          <Note>Always send the commencement fee first. Coaching does not start until both the commencement fee and the first weekly subscription payment are received.</Note>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, colour, children }: { title: string; colour: 'teal' | 'amber'; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className={`px-6 py-4 border-b border-stone-800 ${colour === 'amber' ? 'bg-amber-400/5' : ''}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${colour === 'amber' ? 'text-amber-400' : 'text-teal-400'}`}>{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-3 text-stone-300 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Training({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-violet-950/30 border border-violet-400/20 rounded-lg px-4 py-3 space-y-1">
      <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-xs text-stone-300 leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  )
}

function StatusList({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="grid gap-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2">
          <span className="text-teal-400 font-semibold text-xs shrink-0 mt-0.5">{item.label}</span>
          <span className="text-stone-400 text-xs">{item.desc}</span>
        </div>
      ))}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-xs text-stone-400 leading-relaxed">
      <span className="font-bold text-stone-300">Note: </span>{children}
    </div>
  )
}

function FlowRow({ trigger, from, to, auto }: { trigger: string; from: string; to: string; auto: boolean }) {
  return (
    <div className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
      <span className={`text-xs font-bold shrink-0 mt-0.5 w-16 ${auto ? 'text-teal-400' : 'text-amber-400'}`}>
        {auto ? 'AUTO' : 'MANUAL'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-300">{trigger}</p>
        {from !== '—' && (
          <p className="text-xs text-stone-500 mt-0.5">
            <span className="text-stone-400">{from}</span>
            <span className="mx-1.5">→</span>
            <span className="text-white font-medium">{to}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function SeqRow({ day, label }: { day: string; label: string }) {
  return (
    <div className="flex items-start gap-3 bg-stone-800/40 rounded-lg px-3 py-2">
      <span className="text-xs font-semibold text-teal-400 shrink-0 w-20">{day}</span>
      <span className="text-xs text-stone-300">{label}</span>
    </div>
  )
}
