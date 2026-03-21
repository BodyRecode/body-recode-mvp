import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, getStateColour, getReadinessColour } from '@/lib/utils'
import Link from 'next/link'
import CopyLinkButton from './copy-link-button'
import SendEmailButton from '@/components/send-email-button'
import RegenerateCFFSButton from '@/components/regenerate-cffs-button'
import NewIntakeButton from '@/components/new-intake-button'
import PortalInviteButton from '@/components/portal-invite-button'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const [{ data: cffsRecords }, { data: invitations }, { data: intakes }, { data: cfwsRecords }, { data: recentCheckins }, { data: baselines }] = await Promise.all([
    supabase
      .from('cffs')
      .select('*')
      .eq('client_id', id)
      .order('generated_at', { ascending: false }),
    supabase
      .from('intake_invitations')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('intakes')
      .select('id')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1),
    supabase
      .from('cfws')
      .select('*')
      .eq('client_id', id)
      .order('week_number', { ascending: false })
      .limit(4),
    supabase
      .from('weekly_checkins')
      .select('week_number, form_type, submitted_at')
      .eq('client_id', id)
      .order('week_number', { ascending: false })
      .limit(8),
    supabase
      .from('baselines')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  const activeCffs = cffsRecords?.find(c => !c.is_archived) || null
  const archivedCffs = cffsRecords?.filter(c => c.is_archived) || []
  const latestInvitation = invitations?.[0] || null
  const latestIntakeId = intakes?.[0]?.id || null
  const latestCfws = cfwsRecords?.[0] || null
  const checkinToken = client.checkin_token as string | undefined
  const latestBaseline = baselines?.[0] || null
  const baselineToken = client.baseline_token as string | undefined

  const readinessItems = activeCffs
    ? [
        { label: 'Capacity', value: activeCffs.exposure_readiness_capacity },
        { label: 'Schedule', value: activeCffs.exposure_readiness_schedule },
        { label: 'Regulation', value: activeCffs.exposure_readiness_regulation },
        { label: 'Behaviour', value: activeCffs.exposure_readiness_behaviour },
      ]
    : []

  const cffsSections = activeCffs
    ? [
        { label: 'Client Context Summary', content: activeCffs.client_context_summary },
        { label: 'Primary Patterns & Signals', content: activeCffs.primary_patterns_and_signals },
        { label: 'Capacity Constraints & Guardrails', content: activeCffs.capacity_constraints_and_guardrails },
        { label: 'Risk Flags & Watch Items', content: activeCffs.risk_flags_and_watch_items },
        { label: 'Tensions & Trade-Offs', content: activeCffs.tensions_and_tradeoffs },
        { label: 'Explicit Non-Directives', content: activeCffs.explicit_non_directives },
        { label: 'Closing Interpretive Notes', content: activeCffs.closing_interpretive_notes },
      ]
    : []

  const statusColour = {
    pending: 'text-stone-400 bg-stone-800 border-stone-700',
    started: 'text-amber-300 bg-amber-950/50 border-amber-800',
    complete: 'text-green-300 bg-green-950/50 border-green-800',
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href="/dashboard" className="hover:text-stone-300 transition-colors">Clients</Link>
            <span>/</span>
            <span className="text-stone-300">{client.name}</span>
          </div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-stone-400 text-sm mt-1">Added {formatDate(client.created_at)}</p>
        </div>
        <NewIntakeButton
          clientId={client.id}
          clientName={client.name}
          clientEmail={client.email}
        />
      </div>

      {/* Onboarding status */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-stone-500">Onboarding</p>
          <PortalInviteButton clientId={client.id} onboardingToken={client.onboarding_token} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Agreement', done: !!client.agreement_accepted_at },
            { label: 'Health Declaration', done: !!client.health_declaration_submitted_at },
            { label: 'Intake', done: latestInvitation?.status === 'complete' },
            { label: 'Baseline', done: !!baselines?.[0] },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-teal-400' : 'bg-stone-700'}`} />
              <span className={`text-xs ${item.done ? 'text-stone-300' : 'text-stone-600'}`}>{item.label}</span>
            </div>
          ))}
        </div>
        {client.medical_clearance_required && (
          <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between">
            {client.medical_clearance_received_at ? (
              <p className="text-xs text-teal-400">Medical clearance received</p>
            ) : (
              <>
                <p className="text-xs text-amber-400">Medical clearance required</p>
                <Link href={`/dashboard/clients/${id}/medical-clearance`} className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors">Manage →</Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Intake status */}
      {latestInvitation && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Intake</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                    statusColour[latestInvitation.status as keyof typeof statusColour]
                  }`}
                >
                  {latestInvitation.status}
                </span>
                {latestInvitation.status === 'complete' && latestInvitation.completed_at && (
                  <span className="text-xs text-stone-500">
                    Completed {formatDate(latestInvitation.completed_at)}
                  </span>
                )}
              </div>
            </div>
            {latestInvitation.status !== 'complete' && (
              <div className="flex items-center gap-2">
                {client.email && (
                  <SendEmailButton
                    clientId={client.id}
                    clientName={client.name}
                    clientEmail={client.email}
                    intakeToken={latestInvitation.token}
                    variant="outline"
                  />
                )}
                <CopyLinkButton token={latestInvitation.token} />
              </div>
            )}
          </div>
        </div>
      )}

      {!activeCffs ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center">
          <p className="text-stone-400 mb-2">No CFFS generated yet</p>
          <p className="text-stone-600 text-sm mb-4">
            {latestInvitation?.status === 'pending'
              ? 'Waiting for the client to complete their intake.'
              : latestIntakeId
              ? 'Intake submitted but CFFS generation may have failed.'
              : 'CFFS will be generated automatically when the client submits their intake.'}
          </p>
          {latestIntakeId && (
            <div className="flex justify-center">
              <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
            </div>
          )}
        </div>
      ) : (
        <>

          {/* State + Exposure Readiness */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Body State</p>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full border ${getStateColour(activeCffs.body_state_classification)}`}
                >
                  {activeCffs.body_state_classification}
                </span>
              </div>
              <div className="text-right">
                <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Resolution</p>
                <p className="text-sm text-stone-300">{activeCffs.resolution_state}</p>
              </div>
            </div>

            <div>
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-3">Exposure Readiness</p>
              <div className="grid grid-cols-4 gap-2">
                {readinessItems.map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${getReadinessColour(item.value)}`} />
                    <p className="text-xs text-stone-500">{item.label}</p>
                    <p className="text-xs text-stone-300 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-stone-600 text-xs">Generated {formatDate(activeCffs.generated_at)}</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/clients/${client.id}/cffs-report`}
                  target="_blank"
                  className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
                >
                  Download PDF
                </Link>
                {latestIntakeId && (
                  <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
                )}
              </div>
            </div>
          </div>

          {/* What is a CFFS */}
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 mb-4">
            <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">What You Are Looking At</p>
            <p className="text-sm font-semibold text-stone-200 leading-relaxed mb-3">
              This is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
            </p>
            <p className="text-sm text-stone-400 leading-relaxed mb-2">
              The CFFS translates 208 data points across eight signal domains into a single, coherent picture of the client&apos;s current body state — their regulatory load, recovery capacity, training exposure, stress architecture, and behavioural patterns.
            </p>
            <p className="text-sm text-stone-400 leading-relaxed">
              Nothing here prescribes or diagnoses. Every conclusion emerges from convergence across multiple signals. You remain the interpretive authority — this document gives you the foundation.
            </p>
          </div>

          {/* CFFS Sections */}
          <div className="space-y-3 mb-6">
            {cffsSections.map(section => (
              <div key={section.label} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">{section.label}</p>
                <p className="text-sm text-stone-200 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Archived CFFS */}
          {archivedCffs.length > 0 && (
            <div className="mt-8">
              <p className="text-stone-500 text-sm mb-3">Previous CFFS ({archivedCffs.length})</p>
              <div className="space-y-2">
                {archivedCffs.map(c => (
                  <div
                    key={c.id}
                    className="bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between opacity-60"
                  >
                    <span className="text-sm text-stone-400">{formatDate(c.generated_at)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getStateColour(c.body_state_classification)}`}
                    >
                      {c.body_state_classification}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Baseline Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Baseline</h2>
          {baselineToken && !latestBaseline && (
            <CopyLinkButton token={baselineToken} label="Copy baseline link" path="/baseline" />
          )}
        </div>

        {latestBaseline ? (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500 uppercase tracking-wider">Week {latestBaseline.re_capture_week} capture · {new Date(latestBaseline.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {baselineToken && (
                <CopyLinkButton token={baselineToken} label="Re-capture link" path="/baseline" />
              )}
            </div>

            {/* Measurements */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bodyweight', value: latestBaseline.bodyweight_kg, unit: 'kg' },
                { label: 'Waist', value: latestBaseline.waist_cm, unit: 'cm' },
                { label: 'Hips', value: latestBaseline.hips_cm, unit: 'cm' },
                { label: 'Chest', value: latestBaseline.chest_cm, unit: 'cm' },
              ].map(m => (
                <div key={m.label} className="bg-stone-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-stone-500 mb-1">{m.label}</p>
                  <p className="text-base font-semibold text-white">{m.value ?? '—'}<span className="text-xs text-stone-500 ml-1">{m.unit}</span></p>
                </div>
              ))}
            </div>

            {/* Photos */}
            {(latestBaseline.photo_front_url || latestBaseline.photo_side_url || latestBaseline.photo_back_url) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Front', url: latestBaseline.photo_front_url },
                  { label: 'Side', url: latestBaseline.photo_side_url },
                  { label: 'Back', url: latestBaseline.photo_back_url },
                ].map(photo => (
                  <div key={photo.label} className="space-y-1.5">
                    <p className="text-xs text-stone-500 text-center">{photo.label}</p>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt={photo.label} className="w-full aspect-[3/4] object-cover rounded-xl hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-stone-800 rounded-xl flex items-center justify-center">
                        <p className="text-stone-600 text-xs">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 text-center">
            <p className="text-stone-500 text-sm">No baseline submitted yet</p>
            <p className="text-stone-600 text-xs mt-1">Send the client their baseline link to begin</p>
          </div>
        )}
      </div>

      {/* Weekly Check-In Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Weekly Check-Ins</h2>
          {checkinToken && (
            <CopyLinkButton token={checkinToken} label="Copy check-in link" path="/checkin" />
          )}
        </div>

        {/* Latest CFWS */}
        {latestCfws ? (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">Week {latestCfws.week_number} Synthesis</p>
              <span className="text-xs text-stone-500">{formatDate(latestCfws.generated_at)}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Capacity', value: latestCfws.exposure_readiness_capacity },
                { label: 'Schedule', value: latestCfws.exposure_readiness_schedule },
                { label: 'Regulation', value: latestCfws.exposure_readiness_regulation },
                { label: 'Behaviour', value: latestCfws.exposure_readiness_behaviour },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${getReadinessColour(item.value)}`} />
                  <p className="text-xs text-stone-500">{item.label}</p>
                  <p className="text-xs text-stone-300 font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { label: 'Context Snapshot', content: latestCfws.client_context_snapshot },
                { label: 'Dominant Patterns', content: latestCfws.dominant_weekly_patterns },
                { label: 'Capacity Constraints', content: latestCfws.weekly_capacity_constraints },
                { label: 'Risk Flags', content: latestCfws.weekly_risk_flags },
                { label: 'Tensions & Trade-Offs', content: latestCfws.weekly_tensions_tradeoffs },
                { label: 'Non-Directives', content: latestCfws.explicit_weekly_non_directives },
                { label: 'Closing Notes', content: latestCfws.closing_weekly_notes },
              ].filter(s => s.content).map(section => (
                <div key={section.label} className="border-t border-stone-800 pt-3">
                  <p className="text-xs uppercase tracking-wider text-stone-600 mb-1">{section.label}</p>
                  <p className="text-sm text-stone-300 leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 mb-3 text-center">
            <p className="text-stone-500 text-sm">No weekly synthesis yet</p>
            <p className="text-stone-600 text-xs mt-1">Generated after each A+B check-in pair is complete</p>
          </div>
        )}

        {/* Check-in submission log */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">Recent Submissions</p>
            <div className="space-y-2">
              {recentCheckins.map((ci, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Week {ci.week_number} · Form {ci.form_type}</span>
                  <span className="text-stone-600">{formatDate(ci.submitted_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
