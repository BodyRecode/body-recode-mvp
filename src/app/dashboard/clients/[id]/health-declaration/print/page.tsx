import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PrintTrigger from '@/app/dashboard/clients/[id]/cffs-report/print-trigger'

function Row({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null
  let display: string
  if (Array.isArray(value)) { if (value.length === 0) return null; display = value.join(', ') }
  else if (typeof value === 'boolean') { display = value ? 'Yes' : 'No' }
  else { display = String(value) }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', padding: '8px 0', borderBottom: '1px solid #e5e5e5' }}>
      <p style={{ fontSize: '11px', color: '#888', flexShrink: 0, width: '180px' }}>{label}</p>
      <p style={{ fontSize: '12px', color: '#1a1a1a', textAlign: 'right' }}>{display}</p>
    </div>
  )
}

export default async function HealthDeclarationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, health_declaration_submitted_at, health_declaration_data, medical_clearance_required')
    .eq('id', id)
    .single()

  if (!client || !client.health_declaration_submitted_at) return notFound()

  const d = client.health_declaration_data as Record<string, any> | null
  const G = '#0f0f0f'
  const TEAL = '#10E1C2'

  const submittedDate = new Date(client.health_declaration_submitted_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <PrintTrigger />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; background: #fff; color: ${G}; }
        @media print {
          @page { margin: 20mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '740px', margin: '0 auto', padding: '48px 40px' }}>
        <div style={{ borderBottom: `3px solid ${G}`, paddingBottom: '24px', marginBottom: '32px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-teal.png" alt="Body Recode" style={{ height: '36px', marginBottom: '24px', display: 'block' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: G, marginBottom: '4px' }}>Health Declaration</h1>
          <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Client</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: G }}>{client.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Submitted</p>
              <p style={{ fontSize: '13px', color: G }}>{submittedDate}</p>
            </div>
            {client.medical_clearance_required && (
              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Note</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>Medical clearance required</p>
              </div>
            )}
          </div>
        </div>

        {!d ? (
          <p style={{ fontSize: '13px', color: '#666' }}>Detailed answers not available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {[
              { title: 'Personal Details', rows: [
                { label: 'Full Name', value: client.name },
                { label: 'Email', value: client.email },
                { label: 'Date of Birth', value: d.personalDetails?.dob },
                { label: 'Phone', value: d.personalDetails?.phone },
                { label: 'Address', value: d.personalDetails?.address },
                { label: 'Postcode', value: d.personalDetails?.postcode },
              ]},
              { title: 'Emergency Contact', rows: [
                { label: 'Name', value: d.emergencyContact?.name },
                { label: 'Relationship', value: d.emergencyContact?.relationship },
                { label: 'Phone', value: d.emergencyContact?.phone },
              ]},
              { title: 'General Health', rows: [
                { label: 'Health Rating', value: d.generalHealth?.healthRating },
                { label: 'Exercised Before', value: d.generalHealth?.exercisedBefore === 'yes' ? 'Yes' : 'No' },
                { label: 'Exercise Type', value: d.generalHealth?.exerciseType },
                { label: 'Enjoys', value: d.generalHealth?.exerciseEnjoy },
                { label: 'Dislikes', value: d.generalHealth?.exerciseDislike },
              ]},
              { title: 'Medical History', rows: [
                { label: 'Illness/injury last 5yrs', value: d.medicalHistory?.illnessInjury === 'yes' ? 'Yes' : 'No' },
                { label: 'Details', value: d.medicalHistory?.illnessDetails },
                { label: 'Receiving treatment', value: d.medicalHistory?.receivingTreatment === 'yes' ? 'Yes' : 'No' },
                { label: 'Treatment details', value: d.medicalHistory?.treatmentDetails },
                { label: 'On prescription medication', value: d.medicalHistory?.onMedication === 'yes' ? 'Yes' : 'No' },
                { label: 'Medications', value: d.medicalHistory?.medicationList },
                { label: 'Pregnant/postpartum', value: d.medicalHistory?.pregnant === 'yes' ? 'Yes' : 'No' },
              ]},
              { title: 'Musculoskeletal Health', rows: [
                { label: 'Pain/injury areas', value: d.musculoskeletal?.painAreas },
                { label: 'Aggravated by exercise', value: d.musculoskeletal?.painAggravated === 'yes' ? 'Yes' : 'No' },
                { label: 'Receiving treatment', value: d.musculoskeletal?.painTreatment === 'yes' ? 'Yes' : 'No' },
              ]},
              { title: 'Lifestyle', rows: [
                { label: 'Drinks alcohol', value: d.lifestyle?.alcohol === 'yes' ? 'Yes' : 'No' },
                { label: 'Smokes', value: d.lifestyle?.smoking === 'yes' ? 'Yes' : 'No' },
                { label: 'Diet pattern', value: d.lifestyle?.dietPattern },
                { label: 'Eating habits (1-10)', value: d.lifestyle?.eatingHabits },
                { label: 'Needs nutrition support', value: d.lifestyle?.nutritionSupport === 'yes' ? 'Yes' : 'No' },
              ]},
              { title: 'Barriers & Goals', rows: [
                { label: 'Barriers', value: d.barriersAndGoals?.barriers },
                { label: 'Health goals', value: d.barriersAndGoals?.healthGoals },
              ]},
              { title: 'Declaration', rows: [
                { label: 'Declared name', value: d.declaration?.name },
                { label: 'Date', value: d.declaration?.date },
              ]},
            ].map(section => (
              <div key={section.title}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>{section.title}</p>
                {section.rows.map(row => <Row key={row.label} label={row.label} value={row.value} />)}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '10px', color: '#aaa' }}>© Body Recode™ · www.bodyrecode.au</p>
          <p style={{ fontSize: '10px', color: '#aaa' }}>Confidential</p>
        </div>
      </div>
    </>
  )
}
