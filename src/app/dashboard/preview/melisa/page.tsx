import Link from 'next/link'
import { ArrowLeft, Info, User, MessageSquare, Apple, Dumbbell, Sparkles, ShieldCheck } from 'lucide-react'
import { PageHeader, MONO_FONT } from '@/components/dashboard/ui'
import { getPreset } from '@/lib/doctrine-parameters-presets'
import { isCoachEmail } from '@/lib/coach-auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Preview mockup of what Melisa's tenant dashboard will look like once
 * she's provisioned as the first Founding Partner. Coach-gated (only
 * Kade sees this). Renders:
 *   - the Yoga (breath-forward) doctrine preset as her active tuning
 *   - deterministic pre-written sample content in the yoga voice, so
 *     you can review the FEEL of the tuning without spending LLM tokens
 *   - a stub tenant brand shape (placeholder colours/name until Melisa
 *     hands over the real brand pack)
 *
 * No DB writes. No LLM calls. Nothing here reads or mutates real tenant
 * config - this is a review artefact only.
 */
export default async function MelisaPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  const yoga = getPreset('yoga-breath-forward')!

  return (
    <div className="min-h-screen" style={{ backgroundColor: MELISA_STUB.pageBg }}>
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-3 text-[12px]">
          <Link href="/dashboard/preview" className="text-stone-500 hover:text-stone-700 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to previews
          </Link>
        </div>

        <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-[13px] text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Preview mockup - not real data</p>
              <p>What Melisa&apos;s tenant will look like once provisioned. Brand assets are placeholders (real colours + logo swap in at seed time). Client roster + AI content are hand-written samples to show voice; no LLM calls fire, nothing persists. Swap the preset or edit her doctrine parameters at <Link href="/dashboard/settings/tenant" className="underline">tenant settings</Link>.</p>
            </div>
          </div>
        </div>

        <MelisaHeader />

        <PageHeader
          eyebrow="Studio dashboard"
          title="Wednesday, morning"
          subtitle="Two check-ins to review before Friday, one nutrition plan waiting on your notify, one program reading queued for the block-end."
          accent="teal"
          glow={false}
        />

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatTile label="Active students" value="7" hint="of 10 in your launch tier" />
          <StatTile label="Check-ins pending" value="2" hint="Sarah W. + Emma P." />
          <StatTile label="Readings queued" value="3" hint="1 nutrition, 2 program" />
        </div>

        <Section icon={User} title="Your active tuning (Mode A+)" subtitle={`Preset: ${yoga.label}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <TuningRow label="Voice tone" value={yoga.parameters.voiceTone} />
            <TuningRow label="Banned phrases" value={yoga.parameters.bannedPhrases.map((p) => `"${p}"`).join(', ')} />
            <TuningRow label="Terminology substitutions" value={Object.entries(yoga.parameters.terminologySubstitutions).map(([f, t]) => `${f} → ${t}`).join('  ·  ')} />
            <TuningRow label="Guidance fields set" value="Check-in, program, and nutrition all configured" />
          </div>
          <p className="text-[11px] text-stone-500 italic mt-3">
            <ShieldCheck className="w-3 h-3 inline-block -mt-0.5 mr-1" />
            Hard Safety Floors (RRS clamps, Fat Map limits, injury contraindications, eligibility floors, minimum protein floors) remain immutable per the Founding Partner Agreement. Your tuning is additive - it cannot override safety.
          </p>
        </Section>

        <Section icon={MessageSquare} title="Sample weekly check-in feedback" subtitle="How your voice + guidance shape a real check-in reply">
          <ClientSampleCard clientName="Sarah W." week="Week 3">
            <p><strong>What we noticed:</strong> Your practice held steady through a heavier work week - the settling before Wednesday&apos;s longer session showed in your energy scores by Friday. That&apos;s exactly the pattern we look for: not a bigger push, a steadier one.</p>
            <p><strong>What to hold this week:</strong> Notice the sensation of breath through the mobility work rather than counting time. If a shape starts to feel like a strong effort before we&apos;ve intended it to, that&apos;s worth naming out loud - it usually points somewhere the body is asking to be listened to.</p>
            <p><strong>One focus:</strong> Keep the Thursday practice as the anchor and let the rest flex around it. If the day runs long, five minutes is still practice.</p>
          </ClientSampleCard>
        </Section>

        <Section icon={Apple} title="Sample nutrition reading" subtitle="Your dietary philosophy shapes the framing">
          <ClientSampleCard clientName="Emma P." week="Foundational reading">
            <p>Your plan this block is designed around nourishment more than efficiency. Three meals a day, breakfast anchored around slow protein (eggs or overnight oats with almond butter), lunch a plant-forward bowl with something warm and something crisp, dinner grounded in whatever the market gave you that week.</p>
            <p>You&apos;ll notice the plan doesn&apos;t chase precision. Colour and texture matter more than exact macronutrient splits at this stage. Trust the sensory cues - if a meal felt satisfying and settled, that&apos;s data; if it left you looking for something else an hour later, that&apos;s data too.</p>
            <p>The one non-negotiable across the plan is that adequate protein appears at every meal. Everything else is negotiable to the shape of your week.</p>
          </ClientSampleCard>
        </Section>

        <Section icon={Dumbbell} title="Sample program reading" subtitle="How the program brief lands in your voice">
          <ClientSampleCard clientName="Sarah W." week="Block 1 - Capacity Foundation">
            <p>This block is a settling block. Four practices a week - three active, one restorative - with breath cues woven through every session brief. The intention is to notice what steady practice under an unhurried tempo feels like before we ask the body to do more.</p>
            <p>Your Wednesday session is the longest and holds most of the strength patterning. Notice how the shapes land, particularly in the hips and shoulders, and let that inform how you approach Friday&apos;s shorter session.</p>
            <p>Regression paths are signposted in every brief. If a shape is asking for less on any day, take less. This block progresses on consistency, not intensity.</p>
          </ClientSampleCard>
        </Section>

        <Section icon={Sparkles} title="What&apos;s deliberately NOT tunable" subtitle="Platform Hard Safety Floors - immutable per the Agreement">
          <ul className="text-[13px] text-stone-700 leading-relaxed space-y-1.5 list-disc pl-5">
            <li>RRS (Regulation Readiness Score) clamps + drift monitor</li>
            <li>Fat Map training limits per body state</li>
            <li>Injury contraindications applied to every prescribed session</li>
            <li>Eligibility floors (age, medical clearance, medication interactions)</li>
            <li>Minimum protein + calorie floors on every nutrition plan</li>
            <li>Platform-wide banned client-terms (Body Recode brand-internal vocabulary)</li>
          </ul>
          <p className="text-[11px] text-stone-500 italic mt-3">
            Your Mode A+ tuning layers ON TOP of these - it cannot override or bypass them. The engine + doctrine remain Body Recode&apos;s IP under the Licence Deed clause 4.1(h).
          </p>
        </Section>

        <div className="mt-8 mb-16 p-5 rounded-xl border border-stone-200 bg-white">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">What ships when Melisa signs</div>
          <ol className="text-[13px] text-stone-700 leading-relaxed space-y-1 list-decimal pl-5">
            <li>Founding Partner Agreement + IP Licence Deed v1.0 signed (both together)</li>
            <li>Setup fee cleared ($2,500 Founding Ten Launch tier locked)</li>
            <li>You collect: business name, domain, brand assets (logo light + dark), tagline, voice sample, IG handles - 8 placeholders in the pre-built seed SQL</li>
            <li>Run <code className="text-[11px] font-mono bg-stone-100 px-1 rounded">scripts/create-coach-auth-user.ts</code> to get her UUID</li>
            <li>Fill placeholders in <code className="text-[11px] font-mono bg-stone-100 px-1 rounded">2026-07-05_melisa_seed.sql</code> + apply</li>
            <li>Real tenant live at her custom domain, this preview retired</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// ── Stub Melisa brand shape (placeholders - real values swap in at seed) ────
const MELISA_STUB = {
  brandName: 'Melisa Yoga (placeholder)',
  tagline: 'The practice, the studio, the container',
  pageBg: '#faf7f2',
  accent: '#7a6b52',
  accentSoft: 'rgba(122,107,82,0.08)',
}

function MelisaHeader() {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
          style={{ backgroundColor: MELISA_STUB.accent }}
        >
          MY
        </div>
        <div>
          <div className="text-[15px] font-bold text-stone-900">{MELISA_STUB.brandName}</div>
          <div className="text-[11px] text-stone-500 italic">{MELISA_STUB.tagline}</div>
        </div>
      </div>
      <div
        className="text-[10px] font-mono uppercase px-2.5 py-1 rounded"
        style={{ color: MELISA_STUB.accent, backgroundColor: MELISA_STUB.accentSoft, letterSpacing: '0.08em' }}
      >
        Powered by Body Recode
      </div>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="p-4 rounded-xl border border-stone-200 bg-white">
      <div className="text-[10px] font-mono uppercase text-stone-500 tracking-widest mb-2" style={{ letterSpacing: '0.1em' }}>{label}</div>
      <div className="text-[32px] font-extrabold text-stone-900 leading-none mb-1" style={{ letterSpacing: '-0.02em' }}>{value}</div>
      <div className="text-[11px] text-stone-500">{hint}</div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: MELISA_STUB.accentSoft }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-stone-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-[12px] text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">{children}</div>
    </section>
  )
}

function TuningRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase text-stone-500 mb-1" style={{ letterSpacing: '0.1em' }}>{label}</div>
      <div className="text-[13px] text-stone-800 leading-relaxed">{value || <span className="italic text-stone-400">(none)</span>}</div>
    </div>
  )
}

function ClientSampleCard({ clientName, week, children }: { clientName: string; week: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ backgroundColor: MELISA_STUB.accent }}
        >
          {clientName.split(' ').map((n) => n[0]).join('')}
        </div>
        <div className="text-[13px] font-semibold text-stone-900">{clientName}</div>
        <div className="text-[11px] text-stone-500">·</div>
        <div className="text-[11px] text-stone-500">{week}</div>
      </div>
      <div className="text-[13px] text-stone-700 leading-relaxed space-y-2.5 [&_strong]:font-bold [&_strong]:text-stone-900">
        {children}
      </div>
    </div>
  )
}
