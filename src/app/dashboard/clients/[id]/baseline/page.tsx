import { createAdminClient } from '@/lib/supabase/admin'
import { signedBaselinePhotoSet } from '@/lib/baseline-photos'
import { resolveHeightCm } from '@/lib/client-height'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyLinkButton from '../copy-link-button'

export default async function BaselinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: client }, { data: baselines }] = await Promise.all([
    admin.from('clients').select('id, name, baseline_token, height_cm, height_recorded_at, height_source').eq('id', id).maybeSingle(),
    admin.from('baselines').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  const latestBaseline = baselines?.[0] || null
  const resolvedHeight = resolveHeightCm({
    clientHeightCm: client.height_cm,
    clientHeightRecordedAt: client.height_recorded_at ?? null,
    clientHeightSource: client.height_source ?? null,
    baselineHeightCm: latestBaseline?.height_cm,
    baselineCapturedAt: latestBaseline?.captured_at ?? null,
  })
  // Progress photos live in a private bucket; sign them for this render only.
  const baselinePhotos = await signedBaselinePhotoSet(admin, latestBaseline)
  const baselineToken = client.baseline_token as string | undefined

  return (
    <div className="max-w-[980px]">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#666D7A] text-sm mb-2">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-[#141821] transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-[#141821]">Baseline</span>
          </div>
          <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Baseline</h1>
          <p className="text-sm text-[#666D7A] mt-1">Baseline measurements and progress photos.</p>
        </div>
        {baselineToken && (
          <CopyLinkButton
            token={baselineToken}
            label={latestBaseline ? 'Re-capture link' : 'Copy baseline link'}
            path="/baseline"
          />
        )}
      </div>

      {latestBaseline ? (
        <div className="space-y-4">
          <p className="text-[12.5px] text-[#666D7A]">
            Week {latestBaseline.re_capture_week} capture · {new Date(latestBaseline.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Measurements */}
          <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
            <p className="text-[10px] font-medium text-[#666D7A] mb-4">Measurements</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bodyweight', value: latestBaseline.bodyweight_kg, unit: 'kg' },
                { label: 'Waist', value: latestBaseline.waist_cm, unit: 'cm' },
                { label: 'Hips', value: latestBaseline.hips_cm, unit: 'cm' },
                { label: 'Chest', value: latestBaseline.chest_cm, unit: 'cm' },
                // Resolved, not raw: older captures predate the height field
                // entirely, and the standing client record is the only place a
                // height exists for them. Editable on the client file.
                { label: 'Height', value: resolvedHeight.heightCm, unit: 'cm' },
              ].map(m => (
                <div key={m.label} className="bg-[#EFF1F4]/50 rounded-xl p-3 text-center">
                  <p className="text-[12.5px] text-[#666D7A] mb-1">{m.label}</p>
                  <p className="text-base font-semibold text-[#141821]">
                    {m.value ?? '-'}
                    <span className="text-[12.5px] text-[#666D7A] ml-1">{m.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          {(baselinePhotos.front || baselinePhotos.side || baselinePhotos.back) && (
            <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#666D7A] mb-4">Progress Photos</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Front', url: baselinePhotos.front },
                  { label: 'Side', url: baselinePhotos.side },
                  { label: 'Back', url: baselinePhotos.back },
                ].map(photo => (
                  <div key={photo.label} className="space-y-1.5">
                    <p className="text-[12.5px] text-[#666D7A] text-center">{photo.label}</p>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-full aspect-[3/4] object-cover rounded-xl hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#EFF1F4] rounded-xl flex items-center justify-center">
                        <p className="text-[#98A0AD] text-[12.5px]">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous captures */}
          {baselines && baselines.length > 1 && (
            <div>
              <p className="text-[#666D7A] text-sm mb-3">Previous Captures ({baselines.length - 1})</p>
              <div className="space-y-2">
                {baselines.slice(1).map(b => (
                  <div key={b.id} className="bg-[#F4F6F9]/50 border border-[#E8EAEE] rounded-lg px-4 py-3 flex items-center justify-between opacity-60">
                    <span className="text-sm text-[#666D7A]">Week {b.re_capture_week} capture</span>
                    <span className="text-[12.5px] text-[#98A0AD]">
                      {new Date(b.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.bodyweight_kg && ` · ${b.bodyweight_kg}kg`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[#E8EAEE] rounded-xl">
          <p className="text-[#666D7A] mb-2">No baseline submitted yet.</p>
          <p className="text-[#98A0AD] text-[12.5px]">Send the client their baseline link to begin.</p>
        </div>
      )}
    </div>
  )
}
