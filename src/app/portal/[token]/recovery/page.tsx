import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import PortalPageShell from '../portal-page-shell'
import AskAboutThis from '@/components/ask-about-this'
import { protocolBySlug, CATEGORY_LABELS, type RecoveryCategory, type RecoveryProtocol } from '@/lib/recovery-protocols-seed'
import { Sparkles } from 'lucide-react'

/**
 * Client-facing Recovery Protocols page.
 *
 * Read-only. Shows only ACTIVE assignments for this client. Grouped by
 * category. Coach note (if present) shows under each protocol.
 *
 * Paused / completed are coach-side only - client never sees them.
 */
export default async function ClientRecoveryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const { data: assignmentsRaw } = await admin
    .from('recovery_protocol_assignments')
    .select('*')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  type PortalAssignment = {
    id: string
    coach_note: string | null
    protocol: RecoveryProtocol
  }
  const assignments: PortalAssignment[] = (assignmentsRaw ?? [])
    .map(a => {
      const protocol = protocolBySlug(a.protocol_slug)
      if (!protocol) return null
      return { id: a.id, coach_note: a.coach_note, protocol } satisfies PortalAssignment
    })
    .filter((a): a is PortalAssignment => a !== null)

  // Derived from CATEGORY_LABELS rather than hardcoded (2026-08-17). Adding
  // the 'movement' category broke this: the Record above was a type error the
  // compiler caught, but the display list below it was an `as` cast, so a new
  // category would have been silently dropped from the client's portal with
  // no error anywhere. Deriving both from one source removes that trap.
  const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as RecoveryCategory[]
  const byCategory = Object.fromEntries(
    ALL_CATEGORIES.map(c => [c, [] as PortalAssignment[]])
  ) as Record<RecoveryCategory, PortalAssignment[]>
  for (const a of assignments) {
    byCategory[a.protocol.category].push(a)
  }
  const categoriesWithData = ALL_CATEGORIES.filter(c => byCategory[c].length > 0)

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Recovery"
      title="Your recovery protocols"
      description="Situational tools your coach has assigned. Do these when your body signals it needs them, not every day."
    >
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] px-6 py-10 text-center">
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            No recovery protocols assigned right now. Your coach will assign these based on your signals - training load, sleep, and how you&apos;re tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoriesWithData.map(cat => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">{CATEGORY_LABELS[cat]}</p>
              <div className="space-y-4">
                {byCategory[cat].map(a => (
                  <div key={a.id} className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E5E5E5]">
                      {a.protocol.progression && (
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">
                          {a.protocol.progression.group_label} · Level {a.protocol.progression.level}
                        </p>
                      )}
                      <h2 className="text-lg font-semibold text-[#1A1A1A] leading-tight">{a.protocol.name}</h2>
                      <p className="text-[13px] text-[#6B6B6B] mt-1">{a.protocol.short_description}</p>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-2">Steps</p>
                        <ol className="space-y-2">
                          {a.protocol.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-[#1B6DFC]/10 text-[#1B6DFC] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-[14px] text-[#1A1A1A] leading-relaxed flex-1">{s}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <PortalDosing label="How often" body={a.protocol.dosing.frequency} />
                        <PortalDosing label="How long" body={a.protocol.dosing.duration} />
                        {a.protocol.dosing.timing && <PortalDosing label="When" body={a.protocol.dosing.timing} />}
                      </div>
                      {a.coach_note && (
                        <div className="pt-3 border-t border-[#E5E5E5]">
                          <div className="flex items-start gap-2">
                            <Sparkles size={12} className="text-[#1B6DFC] mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-1">A note from your coach</p>
                              <p className="text-[13px] text-[#6B6B6B] leading-relaxed whitespace-pre-line">{a.coach_note}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {a.protocol.contraindications.length > 0 && (
                        <details className="pt-2">
                          <summary className="cursor-pointer text-[11px] text-[#6B6B6B] hover:text-[#1A1A1A]">Safety notes and when to skip</summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Do not do this if</p>
                              <ul className="text-[12px] text-[#6B6B6B] leading-relaxed space-y-0.5">
                                {a.protocol.contraindications.map((c, i) => <li key={i}>- {c}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-1">Safety</p>
                              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{a.protocol.safety_notes}</p>
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5">
        <AskAboutThis token={token} kind="recovery" />
      </div>
    </PortalPageShell>
  )
}

function PortalDosing({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
      <p className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[12px] text-[#1A1A1A] leading-relaxed">{body}</p>
    </div>
  )
}
