import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logoUrl, brand } from '@/config/tenant'
import TrainingPlan from './training-plan'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'

export default async function TrainingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()
  if (!enrollment) notFound()

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F7FA', color: '#141821',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E8EAEE', padding: '18px 24px', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500 }}>
            Back to portal
          </Link>
        </div>
      </div>

      {/* Premium dark hero */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)', borderRadius: 18, padding: '28px', position: 'relative', overflow: 'hidden', boxShadow: '0 14px 34px rgba(11,31,51,0.28)' }}>
          <div style={{ position: 'absolute', top: -90, right: -70, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.28), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8FB4F5', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>14-Day Body Decode Challenge</p>
            <h1 style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.1 }}>Training Plan</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, margin: 0 }}>
              This plan is not about intensity. It is about rhythm. Your goal is to give your nervous system consistent, structured stimulus so your body starts adapting and rebuilding its baseline. Three to four sessions across two weeks.
            </p>
          </div>
        </div>
      </div>

      <TrainingPlan />
    </div>
  )
}
