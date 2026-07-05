import { ShieldCheck, Palette, DollarSign, Sparkles } from 'lucide-react'
import { MELISA_BRAND } from '../_lib/brand'
import { getPreset } from '@/lib/doctrine-parameters-presets'
import { EyebrowH1, SectionH2, Card, KV, PowerLine } from '../_lib/ui'

export default function SettingsPage() {
  const yoga = getPreset('yoga-breath-forward')!

  return (
    <div className="pb-24">
      <EyebrowH1
        eyebrow="Settings"
        title="Your brand, your voice, your business shape."
        subtitle="Everything that makes this platform yours. Change any of it and every generator in the system - check-ins, plans, content - reads the new values on the next call."
      />

      {/* Brand */}
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Brand" sub="Name, wordmark, palette, tagline" />
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-[10px] uppercase mb-2" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Wordmark</div>
            <div className="p-6 rounded-lg border flex items-center justify-center" style={{ borderColor: MELISA_BRAND.border, backgroundColor: MELISA_BRAND.bgDeep }}>
              <div
                className="text-[42px] font-normal tracking-[0.14em] uppercase"
                style={{ fontFamily: MELISA_BRAND.serif, color: MELISA_BRAND.ink }}
              >
                {MELISA_BRAND.name}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <KV label="Studio name" value={MELISA_BRAND.name} />
            <KV label="Sub-mark" value={MELISA_BRAND.sub} />
            <KV label="Tagline" value={`"${MELISA_BRAND.tagline}"`} />
            <KV label="Location" value={MELISA_BRAND.location} />
          </div>
        </div>

        <div className="pt-6 border-t" style={{ borderColor: MELISA_BRAND.border }}>
          <div className="text-[10px] uppercase mb-3" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Palette</div>
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: 'Page', color: MELISA_BRAND.bg },
              { label: 'Card', color: MELISA_BRAND.card },
              { label: 'Ink', color: MELISA_BRAND.ink },
              { label: 'Accent', color: MELISA_BRAND.accent },
              { label: 'Warm', color: MELISA_BRAND.warm },
              { label: 'Border', color: MELISA_BRAND.border },
            ].map((s, i) => (
              <div key={i}>
                <div className="w-full h-16 rounded-lg border" style={{ backgroundColor: s.color, borderColor: MELISA_BRAND.border }} />
                <div className="text-[10px] mt-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.1em' }}>{s.label.toUpperCase()}</div>
                <div className="text-[9px]" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono }}>{s.color}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Doctrine parameters (Mode A+) */}
      <div className="flex items-center gap-2 mt-14 mb-4">
        <Sparkles className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Voice + coaching guidance (Mode A+)" sub={`Preset applied: ${yoga.label}`} />
      </div>
      <Card>
        <div className="space-y-5">
          <KV label="Voice tone" value={yoga.parameters.voiceTone} />
          <KV label="Banned phrases" value={yoga.parameters.bannedPhrases.map((p) => `"${p}"`).join(' · ')} />
          <KV label="Terminology substitutions" value={Object.entries(yoga.parameters.terminologySubstitutions).map(([f, t]) => `${f} → ${t}`).join(' · ')} />
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Weekly check-in coaching guidance</div>
            <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{yoga.parameters.checkinCoachingGuidance}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Program generation guidance</div>
            <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{yoga.parameters.programGenerationGuidance}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: MELISA_BRAND.inkLight, fontFamily: MELISA_BRAND.mono, letterSpacing: '0.14em' }}>Nutrition generation guidance</div>
            <p className="text-[13px] leading-relaxed" style={{ color: MELISA_BRAND.ink }}>{yoga.parameters.nutritionGenerationGuidance}</p>
          </div>
        </div>
      </Card>

      {/* Safety floors */}
      <div className="flex items-center gap-2 mt-14 mb-4">
        <ShieldCheck className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Safety floors" sub="Immutable · your platform indemnity" />
      </div>
      <Card>
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: MELISA_BRAND.inkMid }}>
          The engine holds a set of safety limits that your Mode A+ tuning cannot override. This is the layer that makes it legally defensible for you to run other people&apos;s practice.
        </p>
        <ul className="text-[13px] space-y-2" style={{ color: MELISA_BRAND.ink }}>
          <li>• Regulation Readiness Score clamps + drift monitoring</li>
          <li>• Fat Map training limits per body state</li>
          <li>• Injury contraindications applied to every prescribed session</li>
          <li>• Eligibility floors (age, medical clearance, medication interactions)</li>
          <li>• Minimum protein + calorie floors on every nutrition plan</li>
          <li>• Platform banned client-terms (Body Recode brand-internal vocabulary)</li>
        </ul>
        <p className="text-[11px] italic mt-4" style={{ color: MELISA_BRAND.inkLight }}>
          Per Founding Partner Agreement §7 + IP Licence Deed clause 4.1(h). These cannot be tuned by you or by us.
        </p>
      </Card>

      {/* Billing */}
      <div className="flex items-center gap-2 mt-14 mb-4">
        <DollarSign className="w-4 h-4" style={{ color: MELISA_BRAND.accent }} />
        <SectionH2 title="Billing" sub="Your Body Recode subscription · locked for life at Founding Ten rate" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><KV label="Tier" value="Launch (Founding Ten)" /></Card>
        <Card><KV label="Subscription" value="$400 / month" /></Card>
        <Card><KV label="Per active student" value="$40 / mo · billed in arrears" /></Card>
      </div>
      <p className="text-[11px] italic mt-3" style={{ color: MELISA_BRAND.inkLight }}>
        Locked at signing under the Founding Ten discount. Body Recode cannot raise your rate for as long as your subscription is continuous - even under change of control.
      </p>

      <PowerLine />
    </div>
  )
}
