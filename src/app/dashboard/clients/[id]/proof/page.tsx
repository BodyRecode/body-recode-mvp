import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope, assertOwnsClient } from '@/lib/coach-scope'
import ProofActions from './proof-actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Twelve weeks', robots: { index: false, follow: false } }

/**
 * Twelve weeks, side by side.
 *
 * 23 September 2026. Queued on 21 September and never built: the re-read as
 * something a coach can HAND OVER, rather than something that only exists
 * inside their dashboard.
 *
 * It is the best evidence this product makes. Two reads, twelve weeks apart,
 * written by the same engine against the same person's own baseline. A coach
 * can show it to the client it is about, or show it anonymised to somebody
 * deciding whether to start.
 *
 * IT IS A DOCUMENT, SO IT IS LIGHT. A tool is dark and a document is light,
 * and this is the one screen in the dashboard that exists to be read by
 * somebody who is not the coach. It also has to print.
 *
 * IT ADDS NO INTERPRETATION. Every word here was already written by the engine
 * and already published to the client. This page arranges it. If it started
 * summarising, it would become a fourth read that nobody audited.
 *
 * ANONYMISED IS A VIEW, NOT A COPY. ?anon=1 removes the name and the dates.
 * Nothing is stored, so there is no second artefact to keep in step, and a
 * coach cannot accidentally send the wrong one because they are the same page.
 */

/**
 * The engine already decided which way it moved and stores it as improved,
 * held or declined. This page reads that rather than comparing the two states
 * itself: a second opinion computed here would disagree with the read the
 * client was sent the moment the doctrine changed, and the read is the one
 * that was audited.
 */
const MOVEMENT: Record<string, string> = {
  improved:
    'Readiness improved, which means more can be asked of them now than at the start.',
  held:
    'Readiness held where it was. Holding is a result: it means the work is being absorbed rather than accumulating.',
  declined:
    'Readiness moved back, which means less is being asked of them now. That is a decision the read made on the evidence, not a verdict on them.',
}

export default async function ProofPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ anon?: string }>
}) {
  const { id } = await params
  const { anon } = await searchParams
  const anonymous = anon === '1'

  const scope = await requireCoachScope()
  await assertOwnsClient(id, scope)

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name, coaching_started_at').eq('id', id).maybeSingle()
  if (!client) notFound()

  const { data: read } = await admin
    .from('progress_reads')
    .select('generated_at, published_at, previous_body_state, body_state_classification, state_direction, pattern_classification, pattern_changed, comparison_text, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, previous_read_id, previous_read_kind')
    .eq('client_id', id).eq('is_archived', false)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle()

  const name = anonymous ? 'A client' : (client.name ?? 'This client')

  if (!read) {
    return (
      <div className="max-w-[760px] mx-auto py-10 px-6">
        <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115]">Nothing to show yet</h1>
        <p className="text-[13.5px] text-[#4A4F57] leading-[1.6] mt-3">
          This appears once {anonymous ? 'a client' : (client.name ?? 'this client')} has been read a second time,
          twelve weeks after the first. It is the two reads side by side, and it is the clearest evidence the
          work is doing anything.
        </p>
        <Link href={`/dashboard/clients/${id}`} className="inline-block text-[13.5px] font-semibold mt-6 underline text-[#0F1115]">
          Back to their file
        </Link>
      </div>
    )
  }

  const moved = MOVEMENT[String(read.state_direction ?? '')] ?? null
  const signals = [
    ['Capacity', read.exposure_readiness_capacity],
    ['Schedule', read.exposure_readiness_schedule],
    ['Regulation', read.exposure_readiness_regulation],
    ['Behaviour', read.exposure_readiness_behaviour],
  ] as Array<[string, string | null]>

  const dot = (v: string | null) =>
    v === 'Green' ? '#2B5E45' : v === 'Amber' ? '#B06E1F' : v === 'Red' ? '#8F2D2D' : '#DCDCD7'

  const Col = ({ label, when, state }: { label: string; when: string | null; state: string | null }) => (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB]">{label}</div>
      {!anonymous && when && (
        <div className="text-[11px] text-[#9CA2AB] mt-1">
          {new Date(when).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
      <div className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115] mt-2.5 leading-tight">
        {state ?? 'Not read'}
      </div>
    </div>
  )

  return (
    <div className="bg-[#FAFAF8] min-h-screen -mx-6 -my-6 lg:-mx-9 lg:-my-9">
      <div className="max-w-[820px] mx-auto px-8 py-12 print:py-0">
        <ProofActions clientId={id} anonymous={anonymous} />

        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB]">Twelve weeks</div>
        <h1 className="text-[46px] font-extrabold tracking-[-0.038em] leading-[1] text-[#0F1115] mt-2">
          {name}
        </h1>
        <p className="text-[16px] text-[#4A4F57] leading-[1.6] mt-3 max-w-[620px]">
          The same assessment, read twice, twelve weeks apart. Both were written against{' '}
          {anonymous ? 'their' : 'their'} own starting point rather than against a target.
        </p>

        <div className="flex items-start gap-8 mt-10 pt-8 border-t border-[#E4E4E0]">
          <Col label="At the start" when={null} state={read.previous_body_state as string | null} />
          <div className="pt-8 text-[20px] text-[#9CA2AB] shrink-0">&rarr;</div>
          <Col label="Twelve weeks on" when={read.generated_at as string} state={read.body_state_classification as string | null} />
        </div>

        {moved && <p className="text-[13.5px] text-[#4A4F57] mt-5 max-w-[620px]">{moved}</p>}

        {read.pattern_classification && (
          <div className="mt-10 pt-8 border-t border-[#E4E4E0]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB]">What is driving it</div>
            <div className="text-[20px] font-bold tracking-[-0.028em] text-[#0F1115] mt-2">
              {read.pattern_classification as string}
            </div>
            <p className="text-[13.5px] text-[#4A4F57] mt-2">
              {read.pattern_changed ? 'This changed over the twelve weeks.' : 'This held across both reads.'}
            </p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-[#E4E4E0]">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB] mb-4">Where they are now</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {signals.map(([label, v]) => (
              <div key={label}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: dot(v) }} />
                <div className="text-[13.5px] font-semibold text-[#0F1115] mt-2">{label}</div>
                <div className="text-[12.5px] text-[#6E747D]">{v && v !== 'Unknown' ? v : 'Not read'}</div>
              </div>
            ))}
          </div>
        </div>

        {read.comparison_text && (
          <div className="mt-10 pt-8 border-t border-[#E4E4E0]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB] mb-4">What changed</div>
            <div className="text-[13.5px] text-[#0F1115] leading-[1.7] whitespace-pre-wrap max-w-[640px]">
              {read.comparison_text as string}
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#9CA2AB] leading-[1.6] mt-12 pt-6 border-t border-[#E4E4E0] max-w-[620px]">
          This is an interpretation of what was reported, not a diagnosis, and it does not diagnose, treat, cure
          or prevent anything. It says what appears to be going on. What to do about it is the coach&rsquo;s decision.
        </p>
      </div>
    </div>
  )
}
