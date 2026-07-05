import Link from 'next/link'
import { FileText, Mail, BookOpen, ExternalLink, ArrowUpRight, Sparkles, type LucideIcon } from 'lucide-react'
import { PageHeader, MONO_FONT, accentColour } from '@/components/dashboard/ui'

type StateAccent = 'red' | 'amber' | 'teal' | 'neutral'

type Asset = {
  label: string
  description: string
  href: string
  external?: boolean
  tag?: string
  tagAccent?: StateAccent
}

type AssetGroup = {
  title: string
  icon: LucideIcon
  assets: Asset[]
}

const ASSET_GROUPS: AssetGroup[] = [
  {
    title: 'Body Decode Reports ($37 deliverable)',
    icon: FileText,
    assets: [
      { label: 'Depleted State Report',     description: 'The $37 Body Decode Report a lead receives after purchase if they scored 5-8',  href: '/report-preview?state=depleted',     external: true, tag: 'Depleted',     tagAccent: 'red' },
      { label: 'Transitioning State Report', description: 'The $37 Body Decode Report a lead receives after purchase if they scored 9-11', href: '/report-preview?state=transitioning', external: true, tag: 'Transitioning', tagAccent: 'amber' },
      { label: 'Ready State Report',        description: 'The $37 Body Decode Report a lead receives after purchase if they scored 12-15', href: '/report-preview?state=ready',         external: true, tag: 'Ready',        tagAccent: 'teal' },
    ],
  },
  {
    title: 'Self-Guided Programs ($97 deliverable)',
    icon: BookOpen,
    assets: [
      { label: 'Depleted State Program',     description: '12-week self-guided training and nutrition program for Depleted State',     href: '/dashboard/preview/program/depleted',     tag: 'Depleted',     tagAccent: 'red' },
      { label: 'Transitioning State Program', description: '12-week self-guided training and nutrition program for Transitioning State', href: '/dashboard/preview/program/transitioning', tag: 'Transitioning', tagAccent: 'amber' },
      { label: 'Ready State Program',        description: '12-week self-guided training and nutrition program for Ready State',        href: '/dashboard/preview/program/ready',         tag: 'Ready',        tagAccent: 'teal' },
    ],
  },
  {
    title: 'Booking Emails',
    icon: Mail,
    assets: [
      { label: 'Booking Link + Confirmation Emails', description: 'Emails sent from the lead profile - booking link and manual booking confirmation', href: '/dashboard/preview/email' },
    ],
  },
  {
    title: 'Downsell Emails',
    icon: Mail,
    assets: [
      { label: 'Depleted - Offer + Delivery Emails',     description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase', href: '/dashboard/preview/downsell-email/depleted',     tag: 'Depleted',     tagAccent: 'red' },
      { label: 'Transitioning - Offer + Delivery Emails', description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase', href: '/dashboard/preview/downsell-email/transitioning', tag: 'Transitioning', tagAccent: 'amber' },
      { label: 'Ready - Offer + Delivery Emails',        description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase', href: '/dashboard/preview/downsell-email/ready',         tag: 'Ready',        tagAccent: 'teal' },
    ],
  },
  {
    title: 'Funnel B Emails (Challenge → Blueprint → Membership)',
    icon: Mail,
    assets: [
      { label: 'Challenge Emails (6 total)',  description: 'Welcome (new + returning), Day 5 unlock, Day 7 Progress, Day 14 Body Decode Report (×4 patterns), Day 14 fallback. All rendered via the production builders.', href: '/dashboard/preview/challenge-emails',  tag: 'Stage 1', tagAccent: 'neutral' },
      { label: 'Blueprint Emails (9 total)',  description: 'Purchase welcome, coach notification, Weeks 1-6 programme emails (per pattern), Week 7 follow-up, weekly check-in prompt, 2-day reminder.',                                href: '/dashboard/preview/blueprint-emails',  tag: 'Stage 2', tagAccent: 'neutral' },
      { label: 'Membership Emails (4 total)', description: 'Purchase welcome, coach notification, weekly check-in prompt (per Block × Week), 2-day reminder.',                                                                          href: '/dashboard/preview/membership-emails', tag: 'Stage 3', tagAccent: 'neutral' },
    ],
  },
  {
    title: 'SaaS / Founding Ten',
    icon: Sparkles,
    assets: [
      { label: 'Harmony (Melisa) tenant preview',    description: 'White-label mockup: the actual BR dashboard shell wearing Melisa\'s Harmony brand (Yoga & Meditation, monochrome ink palette, mountain-at-moon logo). Same header, same nav clusters, same StatCard grid - only the brand mark, name, and accent change. Home + Students + Settings pages walkable. Sales-ready to show her what her tenant will look like.',    href: '/dashboard/preview/melisa',    tag: 'Preview',    tagAccent: 'neutral' },
    ],
  },
  {
    title: 'Client-Facing Pages',
    icon: FileText,
    assets: [
      { label: 'Scorecard',               description: 'Body State Scorecard at performance.bodyrecode.au/scorecard',                  href: '/scorecard',          external: true },
      { label: 'Scorecard Results (example)', description: 'What the lead sees after completing the scorecard',             href: '/scorecard-preview',  external: true },
      { label: 'Book a Call',             description: 'Public booking page at bodyrecode.au/book',                         href: '/book',               external: true },
      { label: 'Orientation Guide',       description: 'Page sent to leads after Zoom 1',                                   href: '/orientation',        external: true },
      { label: 'Coaching Guide',          description: 'Active client coaching guide at app.bodyrecode.au/coaching-guide',  href: '/coaching-guide',     external: true },
    ],
  },
]

export default function PreviewIndexPage() {
  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Assets"
        title="Assets"
        subtitle="All client-facing assets, programs, and emails. View exactly what clients and leads receive."
      />

      <div className="space-y-8">
        {ASSET_GROUPS.map(group => {
          const Icon = group.icon
          return (
            <div key={group.title}>
              <div className="flex items-center gap-2.5 mb-3">
                <Icon size={14} className="text-[#1B6DFC]" />
                <p
                  className="text-[10px] font-bold text-[#999999] uppercase"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                >
                  {group.title}
                </p>
              </div>
              <div className="space-y-2">
                {group.assets.map(asset => {
                  const tag = asset.tagAccent ? accentColour(asset.tagAccent) : null
                  const ArrowIcon = asset.external ? ExternalLink : ArrowUpRight
                  return (
                    <Link
                      key={asset.href}
                      href={asset.href}
                      target={asset.external ? '_blank' : undefined}
                      rel={asset.external ? 'noopener noreferrer' : undefined}
                      className="group flex items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-5 py-4 hover:border-[#D4D4D4] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-semibold text-[#1A1A1A] group-hover:text-[#1B6DFC] transition-colors truncate">{asset.label}</span>
                          {asset.tag && tag && (
                            <span
                              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
                              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em', color: tag.text, background: tag.bg, borderColor: tag.ring }}
                            >
                              {asset.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#999999] leading-relaxed">{asset.description}</p>
                      </div>
                      <ArrowIcon size={14} className="text-[#999999] group-hover:text-[#1B6DFC] transition-colors shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
