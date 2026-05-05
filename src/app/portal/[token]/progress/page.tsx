import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import Link from 'next/link'

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
  if (current === null || baseline === null) return 'text-[#57534e]'
  const d = current - baseline
  if (d === 0) return 'text-[#57534e]'
  const improved = lowerIsBetter ? d < 0 : d > 0
  return improved ? 'text-[#14b8a6]' : 'text-red-400'
}

export default async function PortalProgressPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Your Progress</h1>
          <p className="text-[#a8a29e] text-sm">Measurements captured at key points throughout your coaching.</p>
        </div>

        {!baseline ? (
          <div className="rounded-2xl border border-[#1c1917] bg-[#111110] p-6 text-center">
            <p className="text-[#57534e] text-sm">No measurements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Baseline */}
            <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1c1917] flex items-center justify-between">
                <p className="text-xs font-bold text-[#57534e] uppercase tracking-widest">Starting point</p>
                <p className="text-xs text-[#3c3835]">{new Date(baseline.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-4 divide-x divide-[#1c1917]">
                {[
                  { label: 'Weight', value: baseline.bodyweight_kg, unit: 'kg' },
                  { label: 'Waist', value: baseline.waist_cm, unit: 'cm' },
                  { label: 'Hips', value: baseline.hips_cm, unit: 'cm' },
                  { label: 'Chest', value: baseline.chest_cm, unit: 'cm' },
                ].map(m => (
                  <div key={m.label} className="px-4 py-3 text-center">
                    <p className="text-xs text-[#3c3835] mb-1">{m.label}</p>
                    <p className="text-sm font-semibold text-white">{m.value ?? '-'}{m.value ? m.unit : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-captures */}
            {recaptures.length > 0 ? recaptures.map((b: Baseline) => (
              <div key={b.id} className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1c1917] flex items-center justify-between">
                  <p className="text-xs font-bold text-[#57534e] uppercase tracking-widest">
                    {b.re_capture_week ? `Week ${b.re_capture_week} re-capture` : 'Re-capture'}
                  </p>
                  <p className="text-xs text-[#3c3835]">{new Date(b.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-4 divide-x divide-[#1c1917]">
                  {[
                    { label: 'Weight', value: b.bodyweight_kg, base: baseline.bodyweight_kg, unit: 'kg' },
                    { label: 'Waist', value: b.waist_cm, base: baseline.waist_cm, unit: 'cm' },
                    { label: 'Hips', value: b.hips_cm, base: baseline.hips_cm, unit: 'cm' },
                    { label: 'Chest', value: b.chest_cm, base: baseline.chest_cm, unit: 'cm' },
                  ].map(m => (
                    <div key={m.label} className="px-4 py-3 text-center">
                      <p className="text-xs text-[#3c3835] mb-1">{m.label}</p>
                      <p className="text-sm font-semibold text-white">{m.value ?? '-'}{m.value ? m.unit : ''}</p>
                      {diff(m.value, m.base) && (
                        <p className={`text-xs mt-0.5 font-medium ${diffColour(m.value, m.base)}`}>{diff(m.value, m.base)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-[#1c1917] bg-[#111110]/50 p-5 text-center">
                <p className="text-[#3c3835] text-sm">Re-capture measurements will appear here every 6–8 weeks.</p>
              </div>
            )}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  )
}
