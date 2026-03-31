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
      <p style={{ fontSize: '11px', color: '#888', flexShrink: 0, width: '200px', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</p>
      <p style={{ fontSize: '12px', color: '#1a1a1a', textAlign: 'right' }}>{display}</p>
    </div>
  )
}

function ScaleSection({ title, data, teal }: { title: string; data: Record<string, number> | null; teal: string }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <div>
      <p style={{ fontSize: '9px', fontWeight: 700, color: teal, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>{title}</p>
      {Object.entries(data).map(([key, val]) => (
        <Row key={key} label={key} value={`${val} / 4`} />
      ))}
    </div>
  )
}

export default async function IntakePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin.from('clients').select('id, name').eq('id', id).single()
  if (!client) return notFound()

  const { data: intake } = await admin
    .from('intakes')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!intake) return notFound()

  const G = '#0f0f0f'
  const TEAL = '#10E1C2'

  const submittedDate = new Date(intake.created_at).toLocaleDateString('en-AU', {
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: G, marginBottom: '4px' }}>Foundational Intake</h1>
          <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Client</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: G }}>{client.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Submitted</p>
              <p style={{ fontSize: '13px', color: G }}>{submittedDate}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>Identity</p>
            <Row label="Full name" value={intake.full_name} />
            <Row label="Date of birth" value={intake.date_of_birth} />
            <Row label="Gender" value={intake.gender} />
            <Row label="Occupation" value={intake.occupation} />
            <Row label="Mobile" value={intake.mobile_number} />
            <Row label="Emergency contact" value={intake.emergency_contact_name} />
            <Row label="Emergency phone" value={intake.emergency_contact_phone} />
            <Row label="How did you hear" value={intake.how_did_you_hear} />
          </div>

          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>Goals</p>
            <Row label="Primary goal" value={intake.primary_goal} />
            <Row label="Secondary goals" value={intake.secondary_goals} />
            <Row label="Desired timeline" value={intake.desired_timeline} />
            <Row label="Motivator" value={intake.subjective_motivator} />
          </div>

          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>Injury</p>
            <Row label="Current locations" value={intake.injury_location_current} />
            <Row label="Historical locations" value={intake.injury_location_history} />
            <Row label="Primary concern" value={intake.injury_primary_concern} />
            <Row label="Aggravating movements" value={intake.injury_aggravating_movements} />
          </div>

          <ScaleSection title="Fat Map Responses" data={intake.fat_map_responses} teal={TEAL} />
          <ScaleSection title="Training Responses" data={intake.training_responses} teal={TEAL} />
          <ScaleSection title="Nutrition Responses" data={intake.nutrition_responses} teal={TEAL} />
          <ScaleSection title="Sleep Responses" data={intake.sleep_responses} teal={TEAL} />
          <ScaleSection title="Stress Responses" data={intake.stress_responses} teal={TEAL} />
          <ScaleSection title="Schedule Responses" data={intake.schedule_responses} teal={TEAL} />
          <ScaleSection title="Supplement Responses" data={intake.supplement_responses} teal={TEAL} />
          <ScaleSection title="Injury Responses" data={intake.injury_responses} teal={TEAL} />

          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>Declaration</p>
            <Row label="Final disclosure" value={intake.final_disclosure} />
            <Row label="System alignment confirmed" value={intake.final_system_alignment} />
            <Row label="Accuracy confirmed" value={intake.final_accuracy} />
          </div>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '10px', color: '#aaa' }}>© Body Recode™ · www.bodyrecode.au</p>
          <p style={{ fontSize: '10px', color: '#aaa' }}>Confidential</p>
        </div>
      </div>
    </>
  )
}
