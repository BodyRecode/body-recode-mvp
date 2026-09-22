/**
 * The Actions tab on a lead, laid out in the order things happen.
 *
 * Until 14 Sep 2026 this was three cards grouped by kind of button: Booking,
 * "Coaching entry" (convert, the $297 fee and the $97 offer in one row, with two
 * identical "Copy Link" buttons) and "Sequences". Kade: "this page looks like it
 * could be organised better". The fee's status line sat between the two Copy
 * Link buttons and read as belonging to the $97 offer, and the declined
 * follow-up sat away from the offer it sends.
 *
 * Now: book the call, then what happened on it (starting coaching / not ready
 * yet / did not show up), then stopping follow-ups. Every action says under it
 * what has already been done and when, from the lead's timeline. Nothing is
 * folded away; the outcome that matches where the lead is gets highlighted.
 */

import ConvertButton from './convert-button'
import CancelSequenceButton from './cancel-sequence-button'
import NoShowSequenceButton from '@/components/noshow-sequence-button'
import Zoom1DeclinedButton from '@/components/zoom1-declined-button'
import CommencementFeeButton from '@/components/commencement-fee-button'
import DownsellButton from '@/components/downsell-button'
import BookingActionButtons from '@/components/booking-action-buttons'

type LeadEvent = { id: string; type: string; subject: string | null; notes: string | null; sent_at: string }
type Booking = { id: string; scheduled_at: string; duration_minutes: number; status: string }

function bne(d: string) {
  return new Date(d).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="br-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-6 h-[3px] rounded-full bg-[#1B6DFC]" />
        <h2 className="text-[11px] font-medium text-[#141821]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Outcome({ title, active, children }: { title: string; active: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${active ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.04)]' : 'border-[#E8EAEE]'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold text-[#141821]">{title}</h3>
        {active && <span className="text-[10px] font-medium text-[#1B6DFC] bg-[rgba(27,109,252,0.1)] px-2 py-0.5 rounded-full">Where this lead is</span>}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] font-medium text-[#43474F]">{children}</p>
}

function Status({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'done' | 'warn' }) {
  const c = tone === 'done' ? 'text-[#15803D]' : tone === 'warn' ? 'text-[#B45309]' : 'text-[#666D7A]'
  return <p className={`text-[12.5px] leading-relaxed ${c}`}>{children}</p>
}

/**
 * One run of follow-up emails, as far as the timeline can tell. Each run logs
 * three events whose sent_at is the time each email is DUE, not when the run
 * was started. The lead row keeps the email ids of the most recent run only
 * (followup_email_ids), which is also all the Cancel button can stop.
 */
function runSummary(run: LeadEvent[], isNewest: boolean, queued: boolean, cancelledAt: string | null, now: number) {
  if (!run.length) return { text: 'Not started.', tone: 'muted' as const, cancellable: 0 }
  const times = run.map(e => e.sent_at).sort()
  const first = new Date(times[0]).getTime()
  const last = new Date(times[times.length - 1]).getTime()
  const future = times.filter(t => new Date(t).getTime() > now)
  const wasCancelled = isNewest && !queued && cancelledAt != null
    && new Date(cancelledAt).getTime() < last
    && new Date(cancelledAt).getTime() > first - 2 * 86400000
  if (wasCancelled) {
    return { text: `Started, then cancelled ${bne(cancelledAt!)}. Emails due after that were not sent.`, tone: 'warn' as const, cancellable: 0 }
  }
  if (future.length) {
    return {
      text: `${times.length} emails scheduled. ${times.length - future.length} sent, ${future.length} still to go. Next one ${bne(future[0])}.`,
      tone: 'muted' as const,
      cancellable: isNewest && queued ? future.length : 0,
    }
  }
  return { text: `All ${times.length} emails sent. Last one ${bne(times[times.length - 1])}.`, tone: 'done' as const, cancellable: 0 }
}

export default function LeadActionsTab({
  lead,
  events,
  bookings,
  now,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lead: any
  events: LeadEvent[]
  bookings: Booking[]
  /** Passed in from the page so every line is judged against the same moment. */
  now: number
}) {
  const firstName = String(lead.name ?? '').split(' ')[0] || 'This lead'
  const latest = (pred: (e: LeadEvent) => boolean) => events.find(pred) ?? null
  const all = (pred: (e: LeadEvent) => boolean) => events.filter(pred)

  // ── Booking ────────────────────────────────────────────────────────────────
  const bookingLinkSent = latest(e => e.subject === 'Booking link sent')
  const confirmed = latest(e => e.type === 'zoom_booked' || e.type === 'booking_confirmation_sent')
  const nextCall = bookings.find(b => b.status === 'scheduled' && new Date(b.scheduled_at).getTime() > now)
  const callLine = nextCall
    ? `Call booked for ${bne(nextCall.scheduled_at)}.`
    : lead.zoom_1_date ? `Call was set for ${bne(lead.zoom_1_date)}.` : 'No call booked.'

  // ── $297 commencement fee ─────────────────────────────────────────────────
  // Both subjects count: the event was "Foundational Read link sent" until 14 Sep 2026.
  const feeSends = all(e => e.type === 'email_sent' && (e.subject === 'Commencement fee link sent' || e.subject === 'Foundational Read link sent'))
  const lastFeeSend = feeSends[0] ?? null
  const feeLinkExpiresAt = lastFeeSend
    ? (String(lastFeeSend.notes ?? '').match(/Link expires (\S+?)\.?$/)?.[1]
        ?? new Date(new Date(lastFeeSend.sent_at).getTime() + 24 * 36e5).toISOString())
    : null
  const feePaid = ['commencement_fee_paid', 'active_deliberate_start', 'active_coaching'].includes(lead.status)
  const converted = Boolean(lead.converted_to_client_id)

  // ── $97 self-guided program ────────────────────────────────────────────────
  const offerSends = all(e => e.type === 'email_sent' && String(e.subject ?? '').startsWith('Self-Guided Program offer sent'))
  const lastOffer = offerSends[0] ?? null

  // ── Follow-up emails ───────────────────────────────────────────────────────
  const cancelled = latest(e => e.type === 'followup_cancelled')
  const queued = Array.isArray(lead.followup_email_ids) && lead.followup_email_ids.length > 0
  // Events arrive newest first; a run is three emails, so the latest run is the first three.
  const declinedRun = all(e => e.type === 'followup_scheduled').slice(0, 3)
  const noShowRun = all(e => e.type === 'noshow_sequence_scheduled').slice(0, 3)
  const firstDue = (run: LeadEvent[]) => (run.length ? run.map(e => e.sent_at).sort()[0] : '')
  const declinedIsNewest = firstDue(declinedRun) >= firstDue(noShowRun)
  const declined = runSummary(declinedRun, declinedIsNewest, queued, cancelled?.sent_at ?? null, now)
  const noShow = runSummary(noShowRun, !declinedIsNewest, queued, cancelled?.sent_at ?? null, now)
  const cancellable = declined.cancellable + noShow.cancellable

  // ── Which outcome this lead is in ─────────────────────────────────────────
  const starting = feePaid || converted || feeSends.length > 0
  const notReady = !starting && (Boolean(lead.downsell_purchased) || offerSends.length > 0 || declinedRun.length > 0
    || ['cold_no_booking', 'closed_declined'].includes(lead.status))
  const noShowActive = !starting && !notReady && (lead.status === 'closed_no_show' || noShowRun.length > 0)

  return (
    <div className="space-y-4">
      <Section title="Book the call">
        <BookingActionButtons leadId={lead.id} leadName={lead.name} leadEmail={lead.email ?? undefined} hasZoomDate={!!lead.zoom_1_date || !!nextCall} />
        <div className="mt-3 space-y-1">
          <Status>
            {callLine}{' '}
            {bookingLinkSent ? `Booking link emailed ${bne(bookingLinkSent.sent_at)}.` : 'Booking link not sent.'}{' '}
            {confirmed ? `Confirmation emailed ${bne(confirmed.sent_at)}.` : ''}
          </Status>
        </div>
        {bookings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E8EAEE] space-y-1.5">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between text-[12.5px]">
                <span className="text-[#43474F]">{bne(b.scheduled_at)} · {b.duration_minutes} min</span>
                <span className={b.status === 'scheduled' ? 'text-[#1B6DFC] font-semibold' : 'text-[#98A0AD]'}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="After the call">
        <div className="space-y-3">
          <Outcome title={`${firstName} is starting coaching`} active={starting}>
            <Label>$297 commencement fee</Label>
            <CommencementFeeButton
              leadId={lead.id}
              email={lead.email ?? null}
              paid={feePaid}
              lastSentAt={lastFeeSend?.sent_at ?? null}
              linkExpiresAt={feeLinkExpiresAt}
              timesSent={feeSends.length}
            />
            <div className="pt-3 border-t border-[#E8EAEE] space-y-2">
              {converted ? (
                <>
                  <Status tone="done">Client profile created{lead.converted_at ? ` ${bne(lead.converted_at)}` : ''}.</Status>
                  <ConvertButton leadId={lead.id} leadName={lead.name} alreadyConverted clientId={lead.converted_to_client_id} />
                </>
              ) : (
                <>
                  <Status>{firstName} becomes a client automatically when the fee is paid. Only convert by hand if coaching is starting before payment.</Status>
                  <ConvertButton leadId={lead.id} leadName={lead.name} alreadyConverted={false} clientId={lead.converted_to_client_id} />
                </>
              )}
            </div>
          </Outcome>

          <Outcome title="Not ready yet" active={notReady}>
            <Label>$97 12-week self-guided program</Label>
            <DownsellButton leadId={lead.id} alreadyPurchased={!!lead.downsell_purchased} />
            <Status tone={lead.downsell_purchased ? 'done' : 'muted'}>
              {lead.downsell_purchased
                ? `Bought the program${lead.downsell_purchased_at ? ` ${bne(lead.downsell_purchased_at)}` : ''}.`
                : lastOffer
                  ? `Offer emailed ${bne(lastOffer.sent_at)}${lastOffer.notes === 'Auto-sent on decline.' ? ', automatically with the declined follow-up' : ''}. Not bought yet.${offerSends.length > 1 ? ` Sent ${offerSends.length} times.` : ''}`
                  : 'Offer not sent yet.'}
            </Status>
            <div className="pt-3 border-t border-[#E8EAEE] space-y-2">
              <Label>Declined follow-up emails</Label>
              <Zoom1DeclinedButton leadId={lead.id} />
              <Status tone={declined.tone}>{declined.text}</Status>
              <Status>Sends 3 emails (tomorrow 9am, then 5 and 12 days later) and emails the $97 offer straight away, so there is no need to send the offer as well.</Status>
            </div>
          </Outcome>

          <Outcome title={`${firstName} didn't show up`} active={noShowActive}>
            <Label>Re-engagement emails</Label>
            <NoShowSequenceButton leadId={lead.id} />
            <Status tone={noShow.tone}>{noShow.text}</Status>
            <Status>Sends 3 emails: tomorrow 9am, then 4 and 10 days later. Set the status to Closed - No Show in Admin as well.</Status>
          </Outcome>
        </div>
      </Section>

      <Section title="Stop follow-up emails">
        <div className="flex flex-wrap items-center gap-3">
          <CancelSequenceButton leadId={lead.id} hasScheduled={queued} />
          <Status>
            {cancellable
              ? `${cancellable} follow-up email${cancellable === 1 ? '' : 's'} still scheduled. Cancelling stops them. Emails already sent cannot be recalled.`
              : cancelled ? `Nothing scheduled. Last cancelled ${bne(cancelled.sent_at)}.` : 'Nothing scheduled.'}
          </Status>
        </div>
      </Section>
    </div>
  )
}
