import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Palette,
  Sparkles,
  CreditCard,
  Phone,
  Globe,
  UserPlus,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenant } from '@/config/tenant'
import { PageHeader, Card, MONO_FONT } from '@/components/dashboard/ui'

export const dynamic = 'force-dynamic'

/**
 * Tenant-scoped "Getting Started" checklist. The first thing Melisa (or
 * any Founding Ten partner) should see when they log into their tenant.
 * Reads their current tenant_config + a couple of ambient signals
 * (has a student been invited yet? has a check-in been read?), shows
 * which of the setup steps are done vs still open, and deep-links to
 * the right settings page for each.
 *
 * For the BR tenant (Kade), every step reads as done. For a fresh
 * partner tenant, everything is open. The page grows less useful over
 * time - that's the point.
 */
export default async function GettingStartedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = getTenant()
  const admin = createAdminClient()

  // ── Ambient signals ────────────────────────────────────────────
  const { count: studentCount } = await admin
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  const { count: checkinCount } = await admin
    .from('weekly_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  // ── Step evaluations ───────────────────────────────────────────
  const brandSet =
    !!t.brand.name &&
    !!t.brand.tagline &&
    !!t.brand.accentColor &&
    t.brand.name !== 'Body Recode' /* BR default - not the partner's real brand */
    ? true
    : t.licence.tenantId !== 'melisa' && t.brand.name === 'Body Recode'
      ? true // BR always considered done
      : t.brand.name !== 'Body Recode' && !!t.brand.tagline

  const isBR = t.licence.tenantId === 'body-recode'
  const dp = t.licence.doctrineParameters
  const doctrineFields = [
    dp?.voiceTone,
    (dp?.bannedPhrases ?? []).length > 0 ? 'set' : '',
    dp?.terminologySubstitutions && Object.keys(dp.terminologySubstitutions).length > 0 ? 'set' : '',
    dp?.checkinCoachingGuidance,
    dp?.programGenerationGuidance,
    dp?.nutritionGenerationGuidance,
  ].filter((v) => typeof v === 'string' && v.trim().length > 0).length

  const stripeConnected = t.licence.stripeAccountStatus === 'active'
  const twilioConnected = !!t.licence.twilioSubaccountSid
  const domainConnected =
    !!t.brand.apexDomain && t.brand.apexDomain !== 'bodyrecode.au' /* BR default */
      ? true
      : isBR /* BR always considered done */

  const firstStudentInvited = (studentCount ?? 0) >= 1
  const firstCheckinRead = (checkinCount ?? 0) >= 1

  const steps = [
    {
      key: 'brand',
      title: 'Your brand shell',
      subtitle: 'Studio name, tagline, wordmark, palette',
      done: isBR || brandSet,
      icon: Palette,
      href: '/dashboard/settings/tenant',
      description: 'Set the name your students see, the tagline that appears in emails, and the accent colour that runs through your dashboard.',
    },
    {
      key: 'doctrine',
      title: 'Your voice + coaching guidance',
      subtitle: `Mode A+ tuning · ${doctrineFields} / 6 fields set`,
      done: isBR || doctrineFields >= 4,
      icon: Sparkles,
      href: '/dashboard/settings/tenant',
      description: 'Pick a preset (yoga, powerlifting, corporate wellness, rehab) or configure your voice tone, banned phrases, terminology substitutions, and guidance for check-in / program / nutrition generation. Preview the effect before you save.',
    },
    {
      key: 'stripe',
      title: 'Stripe Connect onboarding',
      subtitle: stripeConnected ? 'Connected · payouts to your account' : 'Not yet started',
      done: isBR || stripeConnected,
      icon: CreditCard,
      href: '/dashboard/settings/tenant',
      description: 'Connect your Stripe account so client payments (report, blueprint, commencement fees, memberships) flow direct to you. Takes 5-10 minutes. Reversible.',
    },
    {
      key: 'twilio',
      title: 'SMS number set up',
      subtitle: twilioConnected ? 'Configured · your own AU number' : 'Kade to provision',
      done: isBR || twilioConnected,
      icon: Phone,
      href: '/dashboard/settings/tenant',
      description: 'A dedicated Twilio Subaccount + Australian mobile number for lead speed-to-lead SMS. Kade sets this up in the shared Twilio; nothing on your side.',
      external: !isBR && !twilioConnected,
    },
    {
      key: 'domain',
      title: 'Custom domain wired',
      subtitle: domainConnected ? `${t.brand.apexDomain}` : 'DNS + Vercel routing pending',
      done: domainConnected,
      icon: Globe,
      href: '/dashboard/settings/tenant',
      description: 'Your apex domain points to the platform, and clients see your brand at your URL. DNS records go via your registrar; Kade adds the tenant to Vercel routing.',
      external: !isBR && !domainConnected,
    },
    {
      key: 'first-student',
      title: 'First student in the system',
      subtitle: firstStudentInvited ? `${studentCount ?? 0} students on the roster` : 'None yet',
      done: firstStudentInvited,
      icon: UserPlus,
      href: '/dashboard/coaching',
      description: 'Invite your first student via the coaching page. She completes intake, gets her Foundational Reading, and begins her first block. This is the real test that the platform is set up for you.',
    },
    {
      key: 'first-checkin',
      title: 'First check-in reviewed',
      subtitle: firstCheckinRead ? `${checkinCount ?? 0} check-ins on file` : 'When your first student submits',
      done: firstCheckinRead,
      icon: MessageCircle,
      href: '/dashboard/coaching',
      description: 'Your first student submits her Weekly Check-In. The generator drafts feedback in your voice. You review, edit, send. This is the loop the whole platform is built around.',
    },
  ]

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow={`${t.brand.name} · Founding Ten`}
        title={completed === total ? 'You are all set.' : `Getting started at ${t.brand.name}`}
        subtitle={
          completed === total
            ? 'Every setup step is complete. Head to your coaching page or content calendar.'
            : `${completed} of ${total} steps done. The rest are shown below with what to click to complete them.`
        }
        accent="teal"
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: MONO_FONT, color: '#6B6B6B', letterSpacing: '0.16em' }}
          >
            Setup progress
          </span>
          <span
            className="text-[12px] font-semibold"
            style={{ color: '#1B6DFC', fontFamily: MONO_FONT, letterSpacing: '0.08em' }}
          >
            {completed} / {total} · {pct}%
          </span>
        </div>
        <div className="h-[6px] rounded-full overflow-hidden bg-stone-200">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: t.brand.accentColor ?? '#1B6DFC' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <Card key={step.key}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {step.done ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap mb-1">
                    <span
                      className="text-[10px] uppercase"
                      style={{ fontFamily: MONO_FONT, color: '#6B6B6B', letterSpacing: '0.14em' }}
                    >
                      Step {String(i + 1).padStart(2, '0')}
                    </span>
                    <Icon className="w-3.5 h-3.5" style={{ color: t.brand.accentColor ?? '#1B6DFC' }} />
                  </div>
                  <h3 className="text-[16px] font-bold text-stone-900 mb-1">{step.title}</h3>
                  <div className="text-[11px] text-stone-500 mb-3" style={{ fontFamily: MONO_FONT }}>{step.subtitle}</div>
                  <p className="text-[13px] leading-relaxed text-stone-700 mb-4">{step.description}</p>
                  {!step.done && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-md border border-stone-300 bg-white hover:bg-stone-50 transition-colors"
                    >
                      {step.external ? 'Kade to complete' : 'Open the settings'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Safety floors reminder */}
      <div className="mt-10 pt-8 border-t border-stone-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ fontFamily: MONO_FONT, color: '#6B6B6B', letterSpacing: '0.14em' }}>
              Hard Safety Floors
            </div>
            <p className="text-[12px] text-stone-600 leading-relaxed">
              Some things cannot be tuned by you or by us: RRS clamps, Fat Map training limits, injury contraindications, eligibility floors, minimum protein and calorie floors, platform-wide banned client terms. Your Mode A+ tuning layers ON TOP of these. This is what makes it legally defensible for you to run other people&apos;s practice on the platform.
            </p>
            <p className="text-[11px] text-stone-500 italic mt-2">
              Per Founding Partner Agreement §7 + IP Licence Deed clause 4.1(h).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
