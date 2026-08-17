import { PageHeader, Card, SectionLabel, MONO_FONT } from '@/components/dashboard/ui'
import { HARMONY } from '../_lib/brand'
import { getPreset } from '@/lib/doctrine-parameters-presets'

/**
 * Mirror of /dashboard/settings - Hermony's tenant configuration.
 * Same tabbed sections a real tenant sees: brand, doctrine parameters,
 * safety floors, billing. The doctrine parameters section shows the
 * yoga preset applied (that's what Melisa loads when she first opens
 * this page).
 */
export default function HermonySettings() {
  const yoga = getPreset('yoga-breath-forward')!

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Settings"
        title="Your studio configuration"
        subtitle="Brand, voice, doctrine parameters, and billing. Everything that makes this platform yours."
        accent="terracotta"
      />

      {/* Brand */}
      <Card className="mb-6">
        <SectionLabel accent="terracotta">Brand</SectionLabel>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] text-[#6B6B6B] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Wordmark</div>
            <div className="p-8 rounded-xl border border-[#E5E5E5] bg-white flex items-center gap-5">
              <span className="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden bg-white border" style={{ borderColor: '#1A1A1A' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HARMONY.logoUrl} alt={`${HARMONY.name} logo`} className="w-full h-full object-cover" />
              </span>
              <div>
                <div className="text-[26px] font-semibold text-[#1A1A1A] tracking-tight" style={{ letterSpacing: '0.02em' }}>{HARMONY.name.toUpperCase()}</div>
                <div className="text-[11px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                  {HARMONY.sub.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <KV label="Studio name" value={HARMONY.name} />
            <KV label="Sub-mark" value={HARMONY.sub} />
            <KV label="Founder" value={`${HARMONY.founder} · ${HARMONY.location}`} />
            <KV label="Domain" value="harmony.com.au" />
            <KV label="Support email" value={`${HARMONY.founder.toLowerCase()}@harmony.com.au`} />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-[#E5E5E5]">
          <div className="text-[10px] text-[#6B6B6B] uppercase mb-3" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Palette</div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 rounded-lg border" style={{ background: HARMONY.accentBar, borderColor: '#E5E5E5' }} />
              <div>
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Terracotta</div>
                <div className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>{HARMONY.accentBar}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 rounded-lg border" style={{ background: '#1A1A1A', borderColor: '#E5E5E5' }} />
              <div>
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Ink</div>
                <div className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>#1A1A1A</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 rounded-lg border" style={{ background: '#FAF6EF', borderColor: '#E5E5E5' }} />
              <div>
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Cream</div>
                <div className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>#FAF6EF</div>
              </div>
            </div>
            <div className="ml-2 text-[11px] text-[#999999] italic max-w-[280px]">
              Placeholder palette. Swap once Melisa hands over her final brand guide.
            </div>
          </div>
        </div>
      </Card>

      {/* Voice + doctrine parameters (Mode A+) */}
      <Card className="mb-6">
        <SectionLabel accent="terracotta" meta={`Preset: ${yoga.label}`}>
          Voice + coaching guidance
        </SectionLabel>
        <div className="space-y-5">
          <KV label="Voice tone" value={yoga.parameters.voiceTone} />
          <KV label="Banned phrases" value={yoga.parameters.bannedPhrases.map((p) => `"${p}"`).join(' · ')} />
          <KV label="Terminology substitutions" value={Object.entries(yoga.parameters.terminologySubstitutions).map(([f, t]) => `${f} → ${t}`).join(' · ')} />
          <KV label="Weekly check-in coaching philosophy" value={yoga.parameters.checkinCoachingGuidance} />
          <KV label="Program generation guidance" value={yoga.parameters.programGenerationGuidance} />
          <KV label="Nutrition generation guidance" value={yoga.parameters.nutritionGenerationGuidance} />
        </div>
        <p className="text-[11px] text-[#999999] italic mt-5 pt-5 border-t border-[#E5E5E5]">
          Every generator - check-in feedback, plan readings, content drafts - reads these on the next call. Edit any of them and the next draft respects the change.
        </p>
      </Card>

      {/* Safety floors */}
      <Card className="mb-6" accent="amber">
        <SectionLabel accent="amber" meta="Immutable">
          Safety floors
        </SectionLabel>
        <p className="text-[13px] text-[#4B4B4B] leading-relaxed mb-4">
          The engine holds a set of safety limits that your voice + guidance tuning cannot override. This is what makes it legally defensible for you to run other people&apos;s practice on the platform.
        </p>
        <ul className="text-[13px] text-[#1A1A1A] leading-relaxed space-y-2 list-disc pl-5">
          <li>Regulation Readiness Score clamps + drift monitoring</li>
          <li>Fat Map training limits per body state</li>
          <li>Injury contraindications applied to every prescribed session</li>
          <li>Eligibility floors (age, medical clearance, medication interactions)</li>
          <li>Minimum protein + calorie floors on every nutrition plan</li>
          <li>Platform banned client-terms (Body Recode brand-internal vocabulary)</li>
        </ul>
        <p className="text-[11px] text-[#999999] italic mt-4">
          Per Collective Partner Agreement §7 + IP Licence Deed clause 4.1(h).
        </p>
      </Card>

      {/* Billing */}
      <Card>
        <SectionLabel accent="terracotta">Billing</SectionLabel>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFBFD]">
            <div className="text-[10px] text-[#6B6B6B] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Tier</div>
            <div className="text-[15px] font-semibold text-[#1A1A1A]">Launch (founding rate)</div>
          </div>
          <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFBFD]">
            <div className="text-[10px] text-[#6B6B6B] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Platform subscription</div>
            <div className="text-[15px] font-semibold text-[#1A1A1A]">$400 / month</div>
          </div>
          <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFBFD]">
            <div className="text-[10px] text-[#6B6B6B] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Per active student</div>
            <div className="text-[15px] font-semibold text-[#1A1A1A]">$40 / mo · arrears</div>
          </div>
        </div>
        <p className="text-[11px] text-[#999999] italic mt-4">
          Locked at signing under the founding rate. Body Recode cannot raise your rate for as long as your subscription is continuous - even under change of control.
        </p>
      </Card>

      <div className="mt-10 pt-6 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
        <div className="uppercase">INTERPRETATION ENGINE · DOCTRINE · SAFETY FLOORS — POWERED BY BODY RECODE</div>
        <div className="uppercase">BRAND · VOICE · PRACTICE — {HARMONY.name.toUpperCase()}</div>
      </div>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#6B6B6B] uppercase mb-1" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>{label}</div>
      <div className="text-[13px] text-[#1A1A1A] leading-relaxed">{value}</div>
    </div>
  )
}
