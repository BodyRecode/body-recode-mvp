import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PortalPageShell from '../portal-page-shell'
import { requirePortalClient } from '@/lib/portal-guard'

interface Baseline {
  id: string
  bodyweight_kg: number | null
  waist_cm: number | null
  hips_cm: number | null
  chest_cm: number | null
  re_capture_week: number | null
  created_at: string
}

function diff(current: number | null, baseline: number | null): string | null {
  if (current === null || baseline === null) return null
  const d = current - baseline
  if (d === 0) return '-'
  return (d > 0 ? '+' : '') + d.toFixed(1)
}

function diffColour(current: number | null, baseline: number | null, lowerIsBetter = true): string {
  if (current === null || baseline === null) return 'text-[#999999]'
  const d = current - baseline
  if (d === 0) return 'text-[#999999]'
  const improved = lowerIsBetter ? d < 0 : d > 0
  return improved ? 'text-[#1B6DFC]' : 'text-red-700'
}

export default async function PortalProgressPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const client = await requirePortalClient(token)

  if (!client) return notFound()

  const { data: baselines } = await admin
    .from('baselines')
    .select('id, bodyweight_kg, waist_cm, hips_cm, chest_cm, re_capture_week, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: true })

  const sorted = baselines || []
  const baseline = sorted[0] ?? null
  const recaptures = sorted.slice(1).reverse() // most recent first

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Progress"
      title="Your progress"
      description="Measurements captured at key points throughout your coaching."
    >
      {!baseline ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#999999] text-sm">No measurements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Baseline */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E5E5E5] flex items-center justify-between">
                <p className="text-xs font-bold text-[#999999] uppercase tracking-widest">Starting point</p>
                <p className="text-xs text-[#999999]">{new Date(baseline.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-4 divide-x divide-[#E5E5E5]">
                {[
                  { label: 'Weight', value: baseline.bodyweight_kg, unit: 'kg' },
                  { label: 'Waist', value: baseline.waist_cm, unit: 'cm' },
                  { label: 'Hips', value: baseline.hips_cm, unit: 'cm' },
                  { label: 'Chest', value: baseline.chest_cm, unit: 'cm' },
                ].map(m => (
                  <div key={m.label} className="px-4 py-3 text-center">
                    <p className="text-xs text-[#999999] mb-1">{m.label}</p>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{m.value ?? '-'}{m.value ? m.unit : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-captures */}
            {recaptures.length > 0 ? recaptures.map((b: Baseline) => (
              <div key={b.id} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E5E5] flex items-center justify-between">
                  <p className="text-xs font-bold text-[#999999] uppercase tracking-widest">
                    {b.re_capture_week ? `Week ${b.re_capture_week} re-capture` : 'Re-capture'}
                  </p>
                  <p className="text-xs text-[#999999]">{new Date(b.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-4 divide-x divide-[#E5E5E5]">
                  {[
                    { label: 'Weight', value: b.bodyweight_kg, base: baseline.bodyweight_kg, unit: 'kg' },
                    { label: 'Waist', value: b.waist_cm, base: baseline.waist_cm, unit: 'cm' },
                    { label: 'Hips', value: b.hips_cm, base: baseline.hips_cm, unit: 'cm' },
                    { label: 'Chest', value: b.chest_cm, base: baseline.chest_cm, unit: 'cm' },
                  ].map(m => (
                    <div key={m.label} className="px-4 py-3 text-center">
                      <p className="text-xs text-[#999999] mb-1">{m.label}</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{m.value ?? '-'}{m.value ? m.unit : ''}</p>
                      {diff(m.value, m.base) && (
                        <p className={`text-xs mt-0.5 font-medium ${diffColour(m.value, m.base)}`}>{diff(m.value, m.base)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-5 text-center">
                <p className="text-[#999999] text-sm">Re-capture measurements will appear here every 6–8 weeks.</p>
              </div>
            )}
        </div>
      )}
    </PortalPageShell>
  )
}
