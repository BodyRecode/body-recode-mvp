import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'

const TERMS: Array<{ term: string; def: string }> = [
  {
    term: 'Body State',
    def: 'A descriptive label for what your body is currently doing across recovery, regulation, and adaptation. The three states we work with are Remediation (system under stress, needs stabilising before we push), Optimisation (system stable enough to build and progress), and Post-Optimisation (long-arc performance phase, system resilient).',
  },
  {
    term: 'CFFS - Coach-Facing Foundational Synthesis',
    def: 'The structured interpretation your coach generates from your foundational intake. It translates your intake answers across eight signal domains into a single picture of how your body is currently organising itself. You see the client-facing version called the Foundational Reading; your coach reads the technical version.',
  },
  {
    term: 'CFWS - Coach-Facing Weekly Synthesis',
    def: 'The weekly equivalent of the CFFS. Generated after both Form A and Form B check-ins are submitted. Reads what is happening in your body that week and feeds your coach\'s decisions about your training and nutrition.',
  },
  {
    term: 'Foundational Reading',
    def: 'Your client-facing read of the same intake the CFFS was built from. Lives in your portal and explains where your body is right now, what it is signalling, what we are focusing on first, and what we are deliberately not doing yet.',
  },
  {
    term: 'Form A and Form B',
    def: 'The two weekly check-in forms. Form A is experience-forward (how the week felt). Form B is pattern-aware (what specifically happened). Both together give your coach a complete picture of your week.',
  },
  {
    term: 'Exposure Readiness',
    def: 'Four signals your weekly check-ins produce: Capacity (do you have the recovery margin), Schedule (does your week allow consistent training), Regulation (is your nervous system in a good place), Behaviour (are your habits stable). Each rated Green / Amber / Red.',
  },
  {
    term: 'RPE - Rate of Perceived Exertion',
    def: 'A 1-10 scale you use to describe how hard a set or session felt, where 10 is maximum effort and you could not have done one more rep. RPE 7 means you had three reps left in the tank. RPE 5 means it felt comfortably challenging but easy to extend. We use RPE to calibrate load to your current state, not just numbers on a bar.',
  },
  {
    term: 'Regulation Load',
    def: 'How much your nervous system is currently managing. High regulation load means your body is using a lot of resources to keep you stable, which leaves less for adaptation. We work to bring regulation load down before we push training intensity up.',
  },
  {
    term: 'Recovery Margin',
    def: 'The buffer between what your body is being asked to do and what it can absorb. When the margin is small, anything extra (a stressful week, a missed meal, a poor sleep) tips the system into overload. When the margin is generous, training compounds.',
  },
  {
    term: 'Deliberate Start Window',
    def: 'The intentional period at the very start of coaching where we calibrate before we push. Usually about a week. We are not trying to get a result in this window. We are establishing the baseline that everything else builds on.',
  },
  {
    term: 'Block',
    def: 'A defined chunk of training time, typically 4-6 weeks long, with a specific intent. Each block has a phase (Accumulation, Intensification, Realization, or Restoration) that determines what we prioritise during that period.',
  },
  {
    term: 'Macro Arc',
    def: 'The bigger picture trajectory across multiple blocks. The macro arc is treated as an expected path, not a locked schedule. If your body responds differently to what was anticipated, the arc adjusts.',
  },
  {
    term: 'Reassessment',
    def: 'A formal re-read of your body state. Happens at block boundaries, when signals deteriorate, or annually. Can be lightweight (your coach re-runs the read against your existing intake plus recent check-ins), a delta intake (a shortened form covering what is most likely to have changed), or a full re-intake (the full 208-question intake again).',
  },
  {
    term: 'Drift',
    def: 'A change in one of your readiness signals from the prior week. A single-notch drop (Green to Amber, or Amber to Red) is advisory. A multi-notch drop (Green to Red in one week) triggers automatic regression.',
  },
  {
    term: 'Regression',
    def: 'A deliberate easing of training stimulus when your body signals it cannot absorb what it is being given. Not failure. The system is doing its job - protecting you from overreach.',
  },
  {
    term: 'Progression',
    def: 'An increase in training stimulus when your body signals it is ready for more. Eligibility is signal-driven, never time-driven. We never progress because the calendar said so.',
  },
  {
    term: 'Fat Map Method',
    def: 'The interpretive framework Body Recode uses to read where your body is storing energy and what that storage pattern is signalling about your current state. Four macro zones, each with four internal pillars.',
  },
  {
    term: 'Stability',
    def: 'The default state of the system. Neither progressing nor regressing is assumed - your body has to demonstrate readiness for either. Stability is good. It means your training and nutrition are matched to where you are.',
  },
]

export default async function GlossaryPage({ params }: { params: Promise<{ token: string }> }) {
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
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    redirect(`/portal/${token}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#57534e] hover:text-[#d4cfc9] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mt-4 mb-2">Glossary</h1>
          <p className="text-[#a8a29e] text-[15px]">Plain-language definitions of every term you hear from your coach.</p>
        </div>

        <div className="space-y-3">
          {TERMS.map(t => (
            <div key={t.term} className="rounded-2xl border border-[#1c1917] bg-[#111110] p-5">
              <p className="text-[14px] font-semibold text-white mb-1.5">{t.term}</p>
              <p className="text-[13px] text-[#a8a29e] leading-relaxed">{t.def}</p>
            </div>
          ))}
        </div>

        <div className="h-16" />
      </div>
    </div>
  )
}
