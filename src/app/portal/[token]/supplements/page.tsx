import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import PortalPageShell from '../portal-page-shell'
import AskAboutThis from '@/components/ask-about-this'
import { substanceBySlug, CATEGORY_LABELS, type SupplementCategory, type SupplementSubstance, type SupplementTier } from '@/lib/supplement-substances-seed'
import { Sparkles } from 'lucide-react'

/**
 * Client-facing supplement stack. Shows active assignments only.
 * Each assigned substance renders all three tiers (Essential /
 * Enhanced / Elite) so the client picks what fits their budget and
 * commitment level. Client can upgrade themselves later without
 * asking the coach.
 */
export default async function ClientSupplementsPage({
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
    .from('supplement_assignments')
    .select('*')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  type PortalAssignment = {
    id: string
    coach_note: string | null
    substance: SupplementSubstance
  }
  const assignments: PortalAssignment[] = (assignmentsRaw ?? [])
    .map(a => {
      const substance = substanceBySlug(a.substance_slug)
      if (!substance) return null
      return { id: a.id, coach_note: a.coach_note, substance } satisfies PortalAssignment
    })
    .filter((a): a is PortalAssignment => a !== null)

  const byCategory: Record<SupplementCategory, PortalAssignment[]> = {
    foundational: [], sleep_recovery: [], performance_peri_workout: [],
    gut_digestion: [], cognitive_focus: [], womens_specific: [],
    mens_specific: [], longevity_inflammation: [],
  }
  for (const a of assignments) byCategory[a.substance.category].push(a)
  const categories: SupplementCategory[] = [
    'foundational', 'sleep_recovery', 'performance_peri_workout',
    'gut_digestion', 'cognitive_focus', 'womens_specific',
    'mens_specific', 'longevity_inflammation',
  ]
  const categoriesWithData = categories.filter(c => byCategory[c].length > 0)

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Supplement Stack"
      title="Your supplements"
      description="Substances your coach has prescribed. Each one shows three tiers - Essential, Enhanced, Elite. Pick the tier that fits your budget and commitment. You can upgrade yourself later without asking."
    >
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] px-6 py-10 text-center">
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            No supplements assigned right now. Your coach will add substances here as they become relevant to your program.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoriesWithData.map(cat => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">{CATEGORY_LABELS[cat]}</p>
              <div className="space-y-6">
                {byCategory[cat].map(a => (
                  <div key={a.id} className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E5E5E5]">
                      <h2 className="text-lg font-semibold text-[#1A1A1A] leading-tight">{a.substance.name}</h2>
                      <p className="text-[13px] text-[#6B6B6B] mt-1">{a.substance.short_description}</p>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-2">What it does</p>
                        <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{a.substance.what_it_does}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-2">Choose your tier</p>
                        <div className="space-y-3">
                          <PortalTierCard tier={a.substance.tiers.essential} />
                          <PortalTierCard tier={a.substance.tiers.enhanced} />
                          <PortalTierCard tier={a.substance.tiers.elite} />
                        </div>
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

                      {a.substance.contraindications.length > 0 && (
                        <details className="pt-2">
                          <summary className="cursor-pointer text-[11px] text-[#6B6B6B] hover:text-[#1A1A1A]">Safety notes and when to skip</summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Do not take if</p>
                              <ul className="text-[12px] text-[#6B6B6B] leading-relaxed space-y-0.5">
                                {a.substance.contraindications.map((c, i) => <li key={i}>- {c}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest mb-1">Safety</p>
                              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{a.substance.safety_notes}</p>
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
        <AskAboutThis token={token} kind="supplements" />
      </div>
    </PortalPageShell>
  )
}

function PortalTierCard({ tier }: { tier: SupplementTier }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-[#F5F7FA] px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest">{tier.label}</span>
      </div>
      <div className="space-y-1.5 text-[13px] text-[#1A1A1A]">
        <div><span className="text-[#6B6B6B] font-medium">Form:</span> {tier.form}</div>
        <div><span className="text-[#6B6B6B] font-medium">Dose:</span> {tier.dose}</div>
        <div><span className="text-[#6B6B6B] font-medium">Timing:</span> {tier.timing}</div>
      </div>
      <p className="text-[12px] text-[#6B6B6B] mt-2 leading-relaxed">{tier.notes}</p>
      <p className="text-[12px] text-[#6B6B6B] mt-1 italic leading-relaxed">Best for: {tier.fits_client_profile}</p>
    </div>
  )
}
