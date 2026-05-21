import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function Row({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-200 last:border-0">
      <p className="text-xs text-stone-500 flex-shrink-0 w-44">{label}</p>
      <p className="text-sm text-stone-800 text-right">{display}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-4">
      <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">{title}</p>
      {children}
    </div>
  )
}

export default async function HealthDeclarationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, health_declaration_submitted_at, health_declaration_data, medical_clearance_required')
    .eq('id', id)
    .single()

  if (!client) return notFound()
  if (!client.health_declaration_submitted_at) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-[#1A1A1A] text-sm transition-colors">← Back</Link>
          <span className="text-stone-700">/</span>
          <p className="text-sm text-stone-600">Health Declaration - {client.name}</p>
        </div>
        <p className="text-stone-500 text-sm">Health declaration not yet submitted.</p>
      </div>
    )
  }

  const d = client.health_declaration_data as Record<string, any> | null

  const submittedDate = new Date(client.health_declaration_submitted_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-[#1A1A1A] text-sm transition-colors">← Back</Link>
        <span className="text-stone-700">/</span>
        <p className="text-sm text-stone-600">Health Declaration - {client.name}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{client.name}</h1>
          <p className="text-xs text-stone-500 mt-1">Submitted {submittedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {client.medical_clearance_required && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Clearance required
            </span>
          )}
          <Link
            href={`/dashboard/clients/${id}/health-declaration/print`}
            target="_blank"
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-800 transition-colors"
          >
            Download PDF
          </Link>
        </div>
      </div>

      {!d ? (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <p className="text-stone-500 text-sm">Form was submitted but detailed answers were not saved (submitted before this feature was added).</p>
        </div>
      ) : (
        <>
          {/* Personal Details */}
          <Section title="Personal Details">
            <Row label="Full Name" value={client.name} />
            <Row label="Email" value={client.email} />
            <Row label="Date of Birth" value={d.personalDetails?.dob} />
            <Row label="Phone" value={d.personalDetails?.phone} />
            <Row label="Address" value={d.personalDetails?.address} />
            <Row label="Postcode" value={d.personalDetails?.postcode} />
          </Section>

          {/* Emergency Contact */}
          <Section title="Emergency Contact">
            <Row label="Name" value={d.emergencyContact?.name} />
            <Row label="Relationship" value={d.emergencyContact?.relationship} />
            <Row label="Phone" value={d.emergencyContact?.phone} />
          </Section>

          {/* General Health */}
          <Section title="General Health">
            <Row label="Health Rating" value={d.generalHealth?.healthRating} />
            <Row label="Exercised Before" value={d.generalHealth?.exercisedBefore === 'yes' ? 'Yes' : 'No'} />
            <Row label="Exercise Type" value={d.generalHealth?.exerciseType} />
            <Row label="Exercise Enjoys" value={d.generalHealth?.exerciseEnjoy} />
            <Row label="Exercise Dislikes" value={d.generalHealth?.exerciseDislike} />
          </Section>

          {/* Cardiovascular Screening */}
          <Section title="Cardiovascular & Respiratory Screening">
            {d.cardiovascularScreening?.symptoms?.length > 0 ? (
              <div className="space-y-1.5">
                {d.cardiovascularScreening.symptoms.map((s: string) => (
                  <div key={s} className={`text-sm px-3 py-2 rounded-lg ${s === 'None of the above' ? 'text-blue-500 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-600">No symptoms reported</p>
            )}
          </Section>

          {/* Medical History */}
          <Section title="Medical History">
            <Row label="Illness/injury (last 5 yrs)" value={d.medicalHistory?.illnessInjury === 'yes' ? 'Yes' : 'No'} />
            {d.medicalHistory?.illnessDetails && <Row label="Details" value={d.medicalHistory.illnessDetails} />}
            <Row label="Receiving treatment" value={d.medicalHistory?.receivingTreatment === 'yes' ? 'Yes' : 'No'} />
            {d.medicalHistory?.treatmentDetails && <Row label="Treatment details" value={d.medicalHistory.treatmentDetails} />}
            <Row label="On prescription medication" value={d.medicalHistory?.onMedication === 'yes' ? 'Yes' : 'No'} />
            {d.medicalHistory?.medicationList && <Row label="Medications" value={d.medicalHistory.medicationList} />}
            <Row label="Pregnant/postpartum" value={d.medicalHistory?.pregnant === 'yes' ? 'Yes' : 'No'} />
          </Section>

          {/* Musculoskeletal */}
          <Section title="Musculoskeletal Health">
            <Row label="Pain/injury areas" value={d.musculoskeletal?.painAreas} />
            {d.musculoskeletal?.painAggravated && <Row label="Aggravated by exercise" value={d.musculoskeletal.painAggravated === 'yes' ? 'Yes' : 'No'} />}
            {d.musculoskeletal?.painTreatment && <Row label="Receiving treatment" value={d.musculoskeletal.painTreatment === 'yes' ? 'Yes' : 'No'} />}
          </Section>

          {/* Lifestyle */}
          <Section title="Lifestyle">
            <Row label="Drinks alcohol" value={d.lifestyle?.alcohol === 'yes' ? 'Yes' : 'No'} />
            <Row label="Smokes" value={d.lifestyle?.smoking === 'yes' ? 'Yes' : 'No'} />
            <Row label="Diet pattern" value={d.lifestyle?.dietPattern} />
            <Row label="Eating habits (1–10)" value={d.lifestyle?.eatingHabits} />
            <Row label="Needs nutrition support" value={d.lifestyle?.nutritionSupport === 'yes' ? 'Yes' : 'No'} />
          </Section>

          {/* Barriers & Goals */}
          <Section title="Barriers & Goals">
            {d.barriersAndGoals?.barriers?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-stone-500 mb-2">Barriers</p>
                <div className="flex flex-wrap gap-2">
                  {d.barriersAndGoals.barriers.map((b: string) => (
                    <span key={b} className="text-xs bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-300">{b}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Health goals" value={d.barriersAndGoals?.healthGoals} />
            {d.barriersAndGoals?.actions?.filter(Boolean).map((a: string, i: number) => (
              <Row key={i} label={`Action ${i + 1}`} value={a} />
            ))}
          </Section>

          {/* Declaration */}
          <Section title="Declaration">
            <Row label="Declared name" value={d.declaration?.name} />
            <Row label="Date" value={d.declaration?.date} />
          </Section>
        </>
      )}
    </div>
  )
}
