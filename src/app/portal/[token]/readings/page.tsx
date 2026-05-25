import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import { FileText, ArrowUpRight } from 'lucide-react'
import { isCoachEmail } from '@/lib/coach-auth'

export default async function ReadingsArchivePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  // Pull all published Foundational Readings (chronological, newest first).
  // Unarchived rows where client_reading_published_at is set.
  const { data: readings } = await admin
    .from('cffs')
    .select('id, body_state_classification, client_reading_published_at, generated_at, is_archived')
    .eq('client_id', client.id)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })

  const published = (readings || []).filter(r => !r.is_archived)

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">Your readings</h1>
          <p className="text-[#6B6B6B] text-[15px]">A read of how your body is currently organising itself. Updated when significant signals shift.</p>
        </div>

        {published.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#6B6B6B] text-[14px] mb-2">No readings yet</p>
            <p className="text-[#999999] text-[12px] leading-relaxed">Your Foundational Reading will appear here once it has been finalised. Future weekly readings will join it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* The latest reading is always the live one. There is one Foundational Reading
                per archived/active CFFS pair, so this list grows as reassessments occur. */}
            <Link
              href={`/portal/${token}/foundational-reading`}
              className="group block rounded-2xl border border-blue-200 bg-blue-50 p-5 hover:border-[#1B6DFC]/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={16} className="text-[#1B6DFC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-semibold text-[#1A1A1A] group-hover:text-[#1B6DFC] transition-colors">Foundational Reading</p>
                    <span className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-wider">Current</span>
                  </div>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    {published[0].body_state_classification ? `Currently in ${published[0].body_state_classification}.` : ''} Issued {new Date(published[0].client_reading_published_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </p>
                </div>
                <ArrowUpRight size={14} className="text-[#1B6DFC] shrink-0 mt-2" />
              </div>
            </Link>

            {published.length > 1 && (
              <>
                <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mt-6 mb-2 px-1">Earlier readings</p>
                {published.slice(1).map(r => (
                  <div
                    key={r.id}
                    className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-5 opacity-70"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={16} className="text-[#999999]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#6B6B6B] mb-1">Foundational Reading</p>
                        <p className="text-[12px] text-[#999999] leading-relaxed">
                          {r.body_state_classification ? `${r.body_state_classification}. ` : ''}Issued {new Date(r.client_reading_published_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.
                        </p>
                        <p className="text-[11px] text-[#999999] mt-1">Archived</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
