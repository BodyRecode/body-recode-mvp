import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sunrise, Moon } from 'lucide-react'
import PortalPageShell from '../portal-page-shell'
import { resolveDailyRoutine, type DailySequence } from '@/lib/daily-routine-defaults'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Client-facing Morning Reset Sequence + Evening Rhythm Sequence.
 *
 * Reads clients.daily_routine (nullable JSONB); resolveDailyRoutine falls
 * back to the canonical Body Recode defaults for any missing field.
 * Names match the Challenge product so a client moving Challenge →
 * Coaching hears the same brand language throughout.
 */
export default async function ClientRoutinePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, daily_routine')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const routine = resolveDailyRoutine(client.daily_routine)

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Daily Sequences"
      title="Your daily anchors"
      description="Two short sequences that hold everything else together — one to open the day, one to close it. Do them consistently before you worry about optimising anything else."
    >
      <div className="space-y-6">
        <SequenceCard icon={<Sunrise size={18} className="text-[#1B6DFC]" />} sequence={routine.morning} />
        <SequenceCard icon={<Moon size={18} className="text-[#1B6DFC]" />} sequence={routine.evening} />
      </div>
    </PortalPageShell>
  )
}

function SequenceCard({ icon, sequence }: { icon: React.ReactNode; sequence: DailySequence }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[#E5E5E5]">
        <div className="w-10 h-10 rounded-xl bg-[#1B6DFC]/10 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[#1A1A1A] leading-tight">{sequence.title}</h2>
          <p className="text-[13px] text-[#6B6B6B] mt-1">{sequence.tagline}</p>
        </div>
      </div>

      <div className="px-5 py-4">
        <ol className="space-y-2.5">
          {sequence.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1B6DFC]/10 text-[#1B6DFC] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-[14px] text-[#1A1A1A] leading-relaxed flex-1">{step}</p>
            </li>
          ))}
        </ol>

        {sequence.coach_note && sequence.coach_note.trim().length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#E5E5E5]">
            <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">A note from your coach</p>
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed whitespace-pre-line">{sequence.coach_note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
