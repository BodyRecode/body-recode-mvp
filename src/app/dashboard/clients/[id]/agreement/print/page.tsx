import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { AGREEMENT_SECTIONS } from '@/lib/agreement-sections'
import PrintTrigger from '@/app/dashboard/clients/[id]/cffs-report/print-trigger'

export default async function AgreementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, agreement_accepted_at, agreement_accepted_name')
    .eq('id', id)
    .single()

  if (!client || !client.agreement_accepted_at) return notFound()

  const signedDate = new Date(client.agreement_accepted_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const G = '#0f0f0f'
  const TEAL = '#1B6DFC'

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
        {/* Header */}
        <div style={{ borderBottom: `3px solid ${G}`, paddingBottom: '24px', marginBottom: '32px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="Body Recode" style={{ height: '36px', marginBottom: '24px', display: 'block' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: G, marginBottom: '4px' }}>Body Recode™ Coaching Agreement</h1>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Version 2.5 - Sole Trader, Queensland, Australia</p>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Client</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: G }}>{client.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Signed by</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: G }}>{client.agreement_accepted_name}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Date signed</p>
              <p style={{ fontSize: '13px', color: G }}>{signedDate}</p>
            </div>
          </div>
        </div>

        {/* Agreement body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '14px' }}>
                {section.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {section.subsections.map((sub) => (
                  <div key={sub.title}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: G, marginBottom: '3px' }}>{sub.title}</p>
                    <p style={{ fontSize: '12px', color: '#444', lineHeight: '1.75' }}>{sub.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Signature block */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: `2px solid ${G}` }}>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
            Electronic Signature
          </p>
          <div style={{ display: 'flex', gap: '48px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Signed by</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: G }}>{client.agreement_accepted_name}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Date</p>
              <p style={{ fontSize: '14px', color: G }}>{signedDate}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '14px', color: G }}>{client.email}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '10px', color: '#aaa' }}>© Body Recode™ · www.bodyrecode.au</p>
          <p style={{ fontSize: '10px', color: '#aaa' }}>Confidential</p>
        </div>
      </div>
    </>
  )
}
