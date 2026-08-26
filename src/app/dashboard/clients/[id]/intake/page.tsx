import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function Row({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null
  let display: string
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    display = value.join(', ')
  } else if (typeof value === 'boolean') {
    display = value ? 'Yes' : 'No'
  } else if (typeof value === 'object') {
    display = JSON.stringify(value)
  } else {
    display = String(value)
  }
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#E8EAEE] last:border-0">
      <p className="text-[12.5px] text-[#666D7A] flex-shrink-0 w-52">{label}</p>
      <p className="text-sm text-[#141821] text-right">{display}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5 mb-4">
      <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">{title}</p>
      {children}
    </div>
  )
}

function ScaleSection({ title, data }: { title: string; data: Record<string, number> | null }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <Section title={title}>
      {Object.entries(data).map(([key, val]) => (
        <Row key={key} label={key.replace(/_/g, ' ')} value={`${val} / 4`} />
      ))}
    </Section>
  )
}

export default async function IntakeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  // Try by client_id first, then fall back to looking up via invitation
  let intake = null
  const { data: byClient } = await admin
    .from('intakes')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (byClient) {
    intake = byClient
  } else {
    // Fallback: find via invitation_id
    const { data: invitation } = await admin
      .from('intake_invitations')
      .select('id')
      .eq('client_id', id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (invitation) {
      const { data: byInvitation } = await admin
        .from('intakes')
        .select('*')
        .eq('invitation_id', invitation.id)
        .maybeSingle()
      intake = byInvitation
    }
  }

  const submittedDate = intake?.created_at
    ? new Date(intake.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/clients/${id}`} className="text-[#666D7A] hover:text-[#141821] text-sm transition-colors">← Back</Link>
        <span className="text-[#141821]">/</span>
        <p className="text-sm text-[#666D7A]">Intake - {client.name}</p>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#141821]">{client.name}</h1>
          {submittedDate && <p className="text-[12.5px] text-[#666D7A] mt-1">Submitted {submittedDate}</p>}
        </div>
        {intake && (
          <Link
            href={`/dashboard/clients/${id}/intake/print`}
            target="_blank"
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
          >
            Download PDF
          </Link>
        )}
      </div>

      {!intake ? (
        <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
          <p className="text-[#666D7A] text-sm">Intake not yet submitted.</p>
        </div>
      ) : (
        <>
          <Section title="Identity">
            <Row label="Full name" value={intake.full_name} />
            <Row label="Date of birth" value={intake.date_of_birth} />
            <Row label="Gender" value={intake.gender} />
            <Row label="Occupation" value={intake.occupation} />
            <Row label="Mobile" value={intake.mobile_number} />
            <Row label="Emergency contact" value={intake.emergency_contact_name} />
            <Row label="Emergency phone" value={intake.emergency_contact_phone} />
            <Row label="How did you hear" value={intake.how_did_you_hear} />
          </Section>

          <Section title="Goals">
            <Row label="Primary goal" value={intake.primary_goal} />
            <Row label="Secondary goals" value={intake.secondary_goals} />
            <Row label="Desired timeline" value={intake.desired_timeline} />
            <Row label="Motivator" value={intake.subjective_motivator} />
          </Section>

          <Section title="Injury">
            <Row label="Current injury locations" value={intake.injury_location_current} />
            <Row label="Historical injury locations" value={intake.injury_location_history} />
            <Row label="Primary concern" value={intake.injury_primary_concern} />
            <Row label="Aggravating movements" value={intake.injury_aggravating_movements} />
          </Section>

          <ScaleSection title="Fat Map Responses" data={intake.fat_map_responses} />
          <ScaleSection title="Training Responses" data={intake.training_responses} />
          <ScaleSection title="Nutrition Responses" data={intake.nutrition_responses} />
          <ScaleSection title="Sleep Responses" data={intake.sleep_responses} />
          <ScaleSection title="Stress Responses" data={intake.stress_responses} />
          <ScaleSection title="Schedule Responses" data={intake.schedule_responses} />
          <ScaleSection title="Supplement Responses" data={intake.supplement_responses} />
          <ScaleSection title="Injury Responses" data={intake.injury_responses} />

          <Section title="Declaration">
            <Row label="Final disclosure" value={intake.final_disclosure} />
            <Row label="System alignment confirmed" value={intake.final_system_alignment} />
            <Row label="Accuracy confirmed" value={intake.final_accuracy} />
          </Section>
        </>
      )}
    </div>
  )
}
