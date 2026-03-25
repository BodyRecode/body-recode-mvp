export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-2">Dashboard Guide</h1>
        <p className="text-stone-400 text-sm">How the Body Recode Performance Coaching system works end to end.</p>
      </div>

      <div className="space-y-3">

        {/* Section 1 */}
        <Section title="1. Lead Pipeline" colour="teal">
          <p>Every potential client enters the system as a <strong>lead</strong>. Leads are created manually or automatically when someone submits the performance check-in quiz.</p>
          <p>Leads move through statuses as they progress:</p>
          <StatusList items={[
            { label: 'New Check-In', desc: 'Quiz submitted, report not yet sent.' },
            { label: 'Report Sent', desc: 'Performance report scheduled and sent to the lead.' },
            { label: 'Cold - No Booking', desc: 'Report sent but no Zoom 1 booked.' },
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
        </Section>

        {/* Section 2 */}
        <Section title="2. Zoom 1 - Call Companion" colour="teal">
          <p>Open the <strong>Call Companion</strong> from the lead detail page before or during Zoom 1. It opens in a new tab so you can run it alongside the Zoom call.</p>
          <p>The companion has 5 stages:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Opening</strong> - Set context, explain the purpose of the call.</li>
            <li><strong>Check-In Review</strong> - Walk through the lead's quiz responses.</li>
            <li><strong>Signal Exploration</strong> - Explore SLS, RPS, and RILS signal areas using structured prompts.</li>
            <li><strong>Pattern Interpretation</strong> - Name the dominant pattern using signal-specific language.</li>
            <li><strong>Close</strong> - Confirm the report, next steps, and Zoom 2 booking.</li>
          </ol>
          <p>At Stage 5, a <strong>Mark Zoom 1 Complete</strong> button appears in the notes panel. Click it after the call to update the lead status automatically.</p>
          <Note>Scripts and prompts are personalised to each lead's signal levels (SLS, RPS, RILS). The companion also has a live notes panel that saves directly to the lead record.</Note>
        </Section>

        {/* Section 3 */}
        <Section title="3. Orientation" colour="teal">
          <p>After Zoom 1, send the <strong>Orientation Guide</strong> from the lead detail page. This emails the PDF directly to the lead as an attachment.</p>
          <p>The guide covers what Body Recode Performance Coaching is, what to expect, and how to prepare for Zoom 2. The lead should read it before the second call.</p>
          <p>Once sent, the section shows the date it was sent. You can also click <strong>View Guide</strong> to preview the PDF.</p>
        </Section>

        {/* Section 4 */}
        <Section title="4. Zoom 2 - Call Companion" colour="teal">
          <p>Open the <strong>Call Companion</strong> from the lead detail page before Zoom 2. Same structure as Zoom 1 - opens in a new tab.</p>
          <p>The companion has 5 stages:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Report Review</strong> - Ensure the lead has read and understood the report correctly.</li>
            <li><strong>Emotional Acknowledgement</strong> - Normalise confusion and confidence erosion.</li>
            <li><strong>Hot Spot Framing</strong> - Identify the specific point where effort and response stopped aligning.</li>
            <li><strong>Pricing</strong> - Present the coaching structure and packages as information, not persuasion.</li>
            <li><strong>Decision</strong> - Identify the path and close cleanly.</li>
          </ol>
          <p>The companion also has tabs for:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Objections</strong> - 7 prepared responses to common objections.</li>
            <li><strong>Online Coaching</strong> - Drop-down fallback script if the lead objects to in-person pricing.</li>
            <li><strong>Signal Reference</strong> - Quick view of the lead's SLS, RPS, and RILS levels.</li>
          </ul>
          <p>At Stage 5, three decision path buttons appear in the notes panel:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Path A - Declined</strong> - Updates lead status to Closed Declined.</li>
            <li><strong>Path B - Needs Time</strong> - Updates lead status to Zoom 2 Completed.</li>
            <li><strong>Path C - Proceeding</strong> - Updates lead status to Zoom 2 Completed. Then generate the commencement fee link from the lead detail page.</li>
          </ul>
          <Note>Lead with in-person 2x ($299/week). Only introduce online ($149/week) if the lead objects to the price. The 3x in-person package ($409/week) is not presented at Zoom 2 - it is coach-assessed and offered during weekly check-ins once coaching is underway.</Note>
        </Section>

        {/* Section 5 */}
        <Section title="5. Coaching Entry" colour="teal">
          <p>From the lead detail page, click <strong>Generate Commencement Fee Link</strong>. This creates a unique Stripe checkout link for the $240 commencement fee and copies it to your clipboard.</p>
          <p>Send the link to the client. When they pay:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Their client profile is created automatically.</li>
            <li>Their intake link is generated and emailed to them immediately.</li>
            <li>The lead status updates to <strong>Commencement Fee Paid</strong>.</li>
          </ol>
          <p>The lead detail page will then show a <strong>View client profile</strong> link.</p>
          <Note>A manual Convert to Client button is also available as a fallback if needed.</Note>
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
            <li>Set the <strong>Coaching Start Date</strong> on the client profile (3-7 days out).</li>
            <li>Set the <strong>Coaching Package</strong> (online, 2x, or 3x) and send the subscription link.</li>
            <li>Client receives a reminder email the day before coaching begins.</li>
          </ol>
          <Note>Coaching does not start until both the commencement fee and the weekly subscription payment are received.</Note>
        </Section>

        <Section title="7. Deliberate Start Window" colour="teal">
          <p>After conversion, set the <strong>Coaching Start Date</strong> on the client profile. This is the date coaching officially begins - typically 3-7 days after the commencement fee is paid.</p>
          <p>Until the start date:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li>The client dashboard shows <strong>Starts in Xd</strong> badge.</li>
            <li>The client gets a reminder email the day before coaching begins.</li>
          </ul>
          <p>The start date is also used to calculate the client's week number for check-ins and CFWS generation.</p>
        </Section>

        {/* Section 7 */}
        <Section title="8. Client Onboarding" colour="teal">
          <p>After the commencement fee is paid, the client receives an intake link by email. They complete:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li><strong>Coaching Agreement</strong> - signed via the client portal.</li>
            <li><strong>Health Declaration</strong> - submitted via the client portal.</li>
            <li><strong>Foundational Intake</strong> - 208-question intake covering all signal domains.</li>
            <li><strong>Baseline Measurements</strong> - bodyweight, waist, hips, chest, and optional photos.</li>
          </ol>
          <p>When the intake is submitted, the <strong>CFFS</strong> (Client Functional Framework Summary) is generated automatically by Claude.</p>
          <Note>If the CFFS fails to generate, use the Regenerate button on the client profile.</Note>
        </Section>

        {/* Section 8 */}
        <Section title="9. CFFS - Client Functional Framework Summary" colour="teal">
          <p>The CFFS is generated from the foundational intake. It is a structured interpretation of the client's current body state across 8 signal domains.</p>
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
        </Section>

        {/* Section 9 */}
        <Section title="10. Weekly Check-Ins and CFWS" colour="teal">
          <p>Each week, clients complete two check-in forms during the Friday 6pm to Sunday 6pm Brisbane window:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Form A</strong> - Training, recovery, and load questions.</li>
            <li><strong>Form B</strong> - Regulation, lifestyle, and context questions.</li>
          </ul>
          <p>When both forms are submitted, the <strong>CFWS</strong> (Client Functional Weekly Synthesis) is generated automatically. It follows the same structure as the CFFS but reflects the current week's patterns.</p>
          <p>The client profile shows the latest CFWS and the last 8 check-in submissions.</p>
          <Note>Use the Regenerate button to manually trigger a new CFWS if needed.</Note>
        </Section>

        {/* Section 10 */}
        <Section title="11. Coaching Package and Upgrades" colour="teal">
          <p>On the client profile, set the client's <strong>Coaching Package</strong> to record which plan they are on:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Online - $149/week</strong></li>
            <li><strong>In-Person 2x - $299/week</strong></li>
            <li><strong>In-Person 3x - $409/week</strong></li>
          </ul>
          <p>Once a package is selected, a <strong>Copy Subscription Link</strong> button appears. Use this to send the client their Stripe subscription link for the new package.</p>
          <p>To upgrade a client from 2x to 3x:</p>
          <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
            <li>Cancel the existing $299/week subscription in Stripe.</li>
            <li>Select <strong>In-Person 3x</strong> on the client profile.</li>
            <li>Copy and send the $409/week subscription link to the client.</li>
            <li>Update to 3x once they have subscribed.</li>
          </ol>
          <Note>The 3x package is coach-assessed. Only offer it during weekly check-ins once you have enough data to confirm the client can sustain three sessions per week.</Note>
        </Section>

        <Section title="12. Clients Dashboard" colour="teal">
          <p>The clients dashboard shows a live overview of all active clients. For each client in active coaching, the row displays:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Week number</strong> - Current coaching week based on their start date.</li>
            <li><strong>A / B check-in status</strong> - Teal if submitted this week, grey if not yet submitted.</li>
            <li><strong>CFWS readiness dots</strong> - Four coloured dots (Capacity, Schedule, Regulation, Behaviour) from the latest weekly synthesis. Green = ready, Amber = caution, Red = flag.</li>
            <li><strong>Body state badge</strong> - From the latest CFFS.</li>
          </ul>
          <p>Clients in the Deliberate Start Window show a <strong>Starts in Xd</strong> amber badge instead.</p>
        </Section>

        <Section title="13. No-Show Re-engagement" colour="amber">
          <p>If a lead does not attend their Zoom 1, mark their status as <strong>Closed - No Show</strong>. A re-engagement section will appear on their lead detail page.</p>
          <p>Click <strong>Start Re-engagement Sequence</strong> to send 3 scheduled emails:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Day 1</strong> - Calm acknowledgement, door left open.</li>
            <li><strong>Day 4</strong> - Gentle follow-up.</li>
            <li><strong>Day 10</strong> - Final invitation to rebook.</li>
          </ul>
          <p>All emails link to the Calendly booking page. The sequence can be cancelled from the lead detail page if the lead re-engages manually.</p>
        </Section>

        {/* Section 11 */}
        <Section title="14. Stripe Payments" colour="teal">
          <p>Three payment links are used in the coaching entry process:</p>
          <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
            <li><strong>Commencement Fee - $240</strong> - Generated uniquely per lead. Triggers automatic client creation when paid.</li>
            <li><strong>In-Person 2x - $299/week</strong> - Static link. Standard entry package. Send after commencement fee is confirmed.</li>
            <li><strong>In-Person 3x - $409/week</strong> - Static link. Coach-assessed upgrade, offered during weekly check-ins not at Zoom 2.</li>
            <li><strong>Online - $149/week</strong> - Static link. Fallback if lead objects to in-person pricing.</li>
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
