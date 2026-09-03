'use client'

import { useState } from 'react'
import { ExternalLink, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { appUrl } from '@/lib/app-url'
import { brand } from "@/config/tenant";

// All known token slots in the URL catalog. Each maps to either an
// enrollment token (Challenge/Blueprint/Membership) or a per-client token
// from the Stage 4 Test Client seed (/tmp/seed-test-client.ts).
type TokenKind =
  | 'challenge'
  | 'blueprint'
  | 'membership'
  | 'portalOnboarding'
  | 'portalCheckin'
  | 'portalBaseline'
  | 'intakeFoundational'
  | 'intakeSupplementary'
  | 'scorecardReport'
  | 'preview'   // last-resort placeholder when no real token exists

type Tokens = Partial<Record<TokenKind, string>>

type FunnelTag = 'A' | 'B' | 'A+B' | 'shared' | 'meta'

type PageEntry = {
  name: string
  url: string
  description: string
  external?: boolean
  tokenKind?: TokenKind
}

type StageGroup = {
  stage: string
  blurb: string
  accent: string
  funnel: FunnelTag
  pages: PageEntry[]
}

const FUNNEL_TAG_META: Record<FunnelTag, { label: string; color: string; bg: string }> = {
  'shared': { label: 'Shared entry · A + B', color: '#141821', bg: '#F5F5F5' },
  'A':      { label: 'Funnel A · Direct 1:1', color: '#FFFFFF', bg: '#1B6DFC' },
  'B':      { label: 'Funnel B · Product ladder', color: '#FFFFFF', bg: '#8b5cf6' },
  'A+B':    { label: 'Funnels A + B converge', color: '#FFFFFF', bg: '#0A337A' },
  'meta':   { label: 'Production / Strategy', color: '#FFFFFF', bg: '#666D7A' },
}

// URL catalog. Each group is explicitly tagged Funnel A / Funnel B / shared
// so the funnel mapping is unambiguous when scanning the list.
const STAGES: StageGroup[] = [
  {
    stage: 'Entry · Scorecard + $37 Body Decode Report',
    blurb: 'The single front door for both Funnel A and Funnel B. Lives on the performance domain; supporting APIs live in this repo.',
    accent: '#141821',
    funnel: 'shared',
    pages: [
      { name: 'Readiness Scorecard', url: `${brand().performanceDomain}/scorecard`, description: 'Canonical scorecard URL. State-routed result page CTAs.', external: true },
      { name: 'Scorecard (legacy redirect)', url: '/scorecard', description: 'Redirects to performance.bodyrecode.au/scorecard with query string preserved.' },
      { name: '$37 Body Decode Report (token-gated)', url: '/report/{token}', description: 'Stripe-purchased report. Token per buyer.', tokenKind: 'scorecardReport' },
      { name: 'Get Report', url: '/get-report', description: 'Post-purchase landing.' },
      { name: 'Buy Report (route)', url: '/buy-report', description: 'Stripe checkout entry for the $37 report.' },
      { name: 'Report pending', url: '/report/pending', description: 'Pending state while report generates.' },
      { name: 'Report preview (admin)', url: '/report-preview', description: 'Preview the report design without buying.' },
    ],
  },
  {
    stage: 'Funnel A · Direct 1:1 coaching path',
    blurb: 'Scorecard → $37 Report → Zoom 1 → Foundational Read → Weekly subscription. Path A decline drops into the 3-email re-engagement + $97 12-Week State Program.',
    accent: '#1B6DFC',
    funnel: 'A',
    pages: [
      { name: 'Book a free call (Zoom 1 booking)', url: '/book', description: 'Funnel A entry point. Calendar booking page.' },
      { name: 'Book a Conversation', url: '/book-a-conversation', description: 'Alternative booking landing.' },
      { name: 'Zoom 1 Call Companion (coach-only)', url: '/dashboard/leads/[id]/companion', description: 'In-call companion. 4 stages + Path A/B/C decision. Coach-only.' },
      { name: 'Pre-Call Read (coach-only)', url: '/dashboard/leads/[id]/pre-call', description: 'Lead-specific pre-call brief.' },
      { name: '12-Week State Program preview · Depleted', url: '/dashboard/preview/program/depleted', description: 'Preview the Depleted state self-guided 12-week program.' },
      { name: '12-Week State Program preview · Transitioning', url: '/dashboard/preview/program/transitioning', description: 'Preview the Transitioning state self-guided program.' },
      { name: '12-Week State Program preview · Ready', url: '/dashboard/preview/program/ready', description: 'Preview the Ready state self-guided program.' },
      { name: 'Downsell email preview', url: '/dashboard/preview/downsell-email/depleted', description: 'Branded email body for the $97 downsell.' },
      { name: 'Performance Check-In', url: '/performance-check-in', description: 'Free 3-min performance check-in.' },
      { name: 'Performance Check-In Quiz', url: '/performance-check-in-quiz', description: 'Companion quiz to the check-in.' },
      { name: 'Orientation Guide', url: '/orientation', description: 'Sent as pre-call material to Zoom 1 invitees.' },
    ],
  },
  {
    stage: 'Funnel B · Stage 1 · The Body Decode (FREE)',
    blurb: 'Her read is open the moment she finishes the questions; the five daily lessons walk her through it. The day gate paces the LESSONS, never the read.',
    accent: '#1B6DFC',
    funnel: 'B',
    pages: [
      { name: 'The Body Decode landing page', url: '/decode', description: 'Funnel B Stage 1. /challenge redirects here (cut over 24 Aug 2026).' },
      { name: 'Decode portal home', url: '/decode/{token}', description: 'Her read plus the five lessons, locked to the day she has reached.', tokenKind: 'challenge' },
      { name: 'Her read', url: '/decode/{token}/read', description: 'The complete five-part read. Carries NO unlock check by design - pacing what she has already earned is still holding it back.', tokenKind: 'challenge' },
      { name: 'Day lesson', url: '/decode/{token}/day/1', description: 'Amanda walks her through one part of the read. Days 1-5; swap the number to preview each.', tokenKind: 'challenge' },
    ],
  },
  {
    stage: 'Funnel B · Stage 1 (RETIRED) · 14-Day Body Decode Challenge',
    blurb: 'Replaced by The Body Decode on 24 Aug 2026. Day 1 to Day 14 lost 14 of the 15 who cleared every form. The portal routes stay live so the 30 people who ran it keep their artefacts - nobody new enters here.',
    accent: '#98A0AD',
    funnel: 'B',
    pages: [
      { name: 'Challenge portal home', url: '/challenge/{token}', description: 'Participant portal home. Past participants only.', tokenKind: 'challenge' },
      { name: 'Training plan', url: '/challenge/{token}/training', description: 'Full 14-day training plan.', tokenKind: 'challenge' },
      { name: 'Nutrition guide (HABNS)', url: '/challenge/{token}/nutrition', description: 'Meal builder + shopping list + nutrition principles.', tokenKind: 'challenge' },
      { name: 'Day 5 framing page', url: '/challenge/{token}/day-5', description: 'Week One Progress Session host.', tokenKind: 'challenge' },
      { name: 'Day 7 framing page', url: '/challenge/{token}/day-7', description: 'Pre-Check-In intro. Leads into /check-in.', tokenKind: 'challenge' },
      { name: 'Body Decode Check-In', url: '/challenge/{token}/check-in', description: 'The form (Part 1 Progress Scan + Part 2 Signal Pattern).', tokenKind: 'challenge' },
      { name: 'Day 14 framing page', url: '/challenge/{token}/day-14', description: 'Day 14 Read host. Framed the $37 report, which was retired the same day.', tokenKind: 'challenge' },
      // These are not separate routes: the [token] segment catches the literal
      // word "preview" and each page special-cases it with a mocked enrollment.
      // They still resolve, so they stay listed.
      { name: 'Day 5 preview (no Supabase)', url: '/challenge/preview/day-5', description: 'Renders with a mocked enrollment - "preview" is caught by the [token] segment. For design review.' },
      { name: 'Day 7 preview', url: '/challenge/preview/day-7', description: 'Day 7 preview, mocked enrollment.' },
      { name: 'Day 14 preview', url: '/challenge/preview/day-14', description: 'Day 14 preview, mocked enrollment.' },
      { name: 'Check-in preview', url: '/challenge/preview/check-in', description: 'Check-in form preview, mocked enrollment.' },
    ],
  },
  {
    stage: 'Funnel B · Stage 2 · 6-Week Body Rewire Blueprint ($97)',
    blurb: 'Marketing landing live; product delivery TO BUILD. The portal route exists as a placeholder.',
    accent: '#B7791F',
    funnel: 'B',
    pages: [
      { name: 'Blueprint landing page', url: '/blueprint', description: 'State-first marketing landing with cross-routing for non-Transitioning visitors.' },
      { name: 'Blueprint pending', url: '/blueprint/pending', description: 'Pending state during enrollment.' },
      { name: 'Blueprint portal', url: '/blueprint/{token}', description: 'Token-gated portal. Product delivery infrastructure not yet built.', tokenKind: 'blueprint' },
      { name: 'Extension landing', url: '/extension', description: '12-week Extension landing (preserved from v1.0 funnel).' },
      { name: 'Extension welcome', url: '/extension/welcome', description: 'Post-purchase welcome.' },
    ],
  },
  {
    stage: 'Funnel B · Stage 3 · Body Recode Membership ($49/wk)',
    blurb: 'Marketing landing live; product delivery TO BUILD. Fat Map Method introduced for the first time here.',
    accent: '#8b5cf6',
    funnel: 'B',
    pages: [
      { name: 'Membership landing page', url: '/membership', description: 'State-first marketing landing.' },
      { name: 'Membership welcome', url: '/membership/welcome', description: 'Post-signup welcome.' },
      { name: 'Membership portal', url: '/membership/{token}', description: 'Token-gated portal.', tokenKind: 'membership' },
    ],
  },
  {
    stage: 'Stage 4 · 1:1 Performance Coaching · Funnel A + B both ascend into here (LIVE)',
    blurb: '$297 Foundational Read + weekly subscription. Online + Brisbane in-person (2x / 3x). The only fully-live product stage. Token-linked pages render using the Test Client seed.',
    accent: '#0A337A',
    funnel: 'A+B',
    pages: [
      { name: 'Performance Coaching landing', url: '/performance-coaching', description: 'Primary landing.' },
      { name: 'Performance Coaching · Brisbane', url: '/performance-coaching/brisbane', description: 'Brisbane local segment.' },
      { name: 'Performance Coaching · Online', url: '/performance-coaching/online', description: 'Online 1:1 segment.' },
      { name: 'Fat Loss · Brisbane', url: '/performance-coaching/fat-loss/brisbane', description: 'Fat loss + Brisbane targeting.' },
      { name: 'Fat Loss · Online', url: '/performance-coaching/fat-loss/online', description: 'Fat loss + online targeting.' },
      { name: 'Personal Training · Brisbane', url: '/performance-coaching/personal-training/brisbane', description: 'Personal training + Brisbane.' },
      { name: 'Personal Training · Online', url: '/performance-coaching/personal-training/online', description: 'Personal training + online.' },
      { name: 'Strength · Brisbane', url: '/performance-coaching/strength/brisbane', description: 'Strength + Brisbane.' },
      { name: 'Strength · Online', url: '/performance-coaching/strength/online', description: 'Strength + online.' },
      { name: 'Performance landing', url: '/performance', description: 'Top-level Performance landing.' },
      { name: 'Client portal (onboarding token)', url: '/portal/{token}', description: 'Tier 4 client portal. Full system access. Uses clients.onboarding_token.', tokenKind: 'portalOnboarding' },
      { name: 'Client view (checkin token)', url: '/client/{token}', description: 'Legacy client view route. Uses clients.checkin_token.', tokenKind: 'portalCheckin' },
      { name: 'Intake (230 questions)', url: '/intake/{token}', description: 'Foundational intake form. Triggers CFFS generation.', tokenKind: 'intakeFoundational' },
      { name: 'Intake supplement', url: '/intake-supplement/{token}', description: '5-question supplementary intake. Used to backfill data.', tokenKind: 'intakeSupplementary' },
      { name: 'Baseline measurements', url: '/baseline/{token}', description: 'Baseline measurements capture. Uses clients.baseline_token.', tokenKind: 'portalBaseline' },
      { name: 'Weekly check-in', url: '/checkin/{token}', description: 'Weekly check-in form. Uses clients.checkin_token.', tokenKind: 'portalCheckin' },
      { name: 'Coaching guide', url: '/coaching-guide', description: 'Public coaching guide.' },
    ],
  },
  {
    stage: 'Video assets · Challenge landing hero (LIVE)',
    blurb: 'Already produced + live on /challenge. Uses 3 B-roll canvases as cutaways.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Watch live on Challenge landing', url: '/challenge', description: 'Hero video plays on the Challenge marketing page.' },
      { name: '↳ B-roll · 14-Day Flow', url: '/broll/14-day-flow', description: 'The 14-day Challenge arc broken into named zones.' },
      { name: '↳ B-roll · The Long Arc', url: '/broll/the-long-arc', description: 'Months-long state-shift visualisation.' },
      { name: '↳ B-roll · Portal Day', url: '/broll/portal-day', description: 'A typical day inside the participant portal.' },
    ],
  },
  {
    stage: 'Video assets · Day 5 Session Video (IN PRODUCTION)',
    blurb: 'Amanda Tier 0 launch-blocker. 3 stitched sections (~8-9 min total). Section 2 is voice-over-portrait (no avatar). Uses 4 B-roll canvases.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Host page · Day 5 framing', url: '/challenge/{token}/day-5', description: 'Where the produced video will land (currently placeholder).', tokenKind: 'challenge' },
      { name: '↳ B-roll · Rhythm vs Restriction (Section 1)', url: '/broll/rhythm-vs-restriction', description: 'Doctrinal core of the Day 5 message.' },
      { name: '↳ B-roll · Reset vs Results Arc (Section 3)', url: '/broll/reset-vs-results-arc', description: 'The reset → results timeline doctrine.' },
      { name: '↳ B-roll · Blueprint Six Weeks (Section 3)', url: '/broll/blueprint-six-weeks', description: '6-week Blueprint structure (reused).' },
      { name: '↳ B-roll · Four Patterns (Section 3)', url: '/broll/four-patterns', description: 'The 4 biological patterns scroll (reused).' },
    ],
  },
  {
    stage: 'Video assets · Day 7 Pre-Check-In Intro Reel (BACKLOG)',
    blurb: 'Amanda Tier 4. Talking-head only, no B-roll canvases. Brief drafted, awaiting production.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Host page · Day 7 framing', url: '/challenge/{token}/day-7', description: 'Where the produced reel will land (placeholder).', tokenKind: 'challenge' },
    ],
  },
  {
    stage: 'Video assets · Day 14 Read (BACKLOG)',
    blurb: 'Amanda Tier 4. Talking-head only, no B-roll canvases. Brief drafted, awaiting production.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Host page · Day 14 framing', url: '/challenge/{token}/day-14', description: 'Where the produced video will land (placeholder).', tokenKind: 'challenge' },
    ],
  },
  {
    stage: 'Video assets · Blueprint Landing Explainer (TBD)',
    blurb: 'Not yet briefed. Would use blueprint-six-weeks + four-patterns canvases. Lives on /blueprint.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Host page · Blueprint landing', url: '/blueprint', description: 'Where the explainer will land.' },
      { name: '↳ B-roll · Blueprint Six Weeks', url: '/broll/blueprint-six-weeks', description: 'Already built for Day 5; reusable for Blueprint explainer.' },
      { name: '↳ B-roll · Four Patterns', url: '/broll/four-patterns', description: 'Already built for Day 5; reusable for Blueprint explainer.' },
    ],
  },
  {
    stage: 'Video assets · Membership Landing Explainer (TBD)',
    blurb: 'Not yet briefed. Would use inside-the-membership + the-long-arc canvases. Lives on /membership.',
    accent: '#1056D6',
    funnel: 'meta',
    pages: [
      { name: 'Host page · Membership landing', url: '/membership', description: 'Where the explainer will land.' },
      { name: '↳ B-roll · Inside the Membership', url: '/broll/inside-the-membership', description: 'What is inside the Membership platform.' },
      { name: '↳ B-roll · The Long Arc', url: '/broll/the-long-arc', description: 'Months-long state-shift visualisation (reused).' },
    ],
  },
  {
    stage: 'B-roll canvases · Strategy / positioning (Kade-facing)',
    blurb: 'Visual reference for funnel architecture conversations, pitch decks, and partner discussions. Not currently used in produced video assets.',
    accent: '#021A4D',
    funnel: 'meta',
    pages: [
      { name: 'Full Funnel Arc', url: '/broll/full-funnel-arc', description: '4-stage horizontal funnel: Free → $97 → $49/wk → $149/wk.' },
      { name: 'Funnel A · Direct Coaching Arc', url: '/broll/funnel-a-direct-coaching-arc', description: 'High-intent path: Scorecard → Zoom 1 → Foundational Read → Subscription.' },
      { name: 'Funnel B · Product Arc', url: '/broll/funnel-b-product-arc', description: 'Product ladder: Scorecard → Stage 1 → 2 → 3 → 4 ascension + side branches.' },
      { name: 'July 2026 Funnel Map', url: '/broll/july-funnel-map', description: 'Two doors → one room: paid Challenge ladder (Stage 1–4) + organic Scorecard arc converging at coaching. Cash reality + the 6 metrics to track.' },
    ],
  },
  {
    stage: 'B-roll canvases · V2 IG Reels (Amanda HeyGen production)',
    blurb: 'Inset-card cutaways used in the June V2 reel pipeline. Each canvas pairs to a specific reel scene — Amanda screen-records the relevant zone in 9:16 portrait crop.',
    accent: '#1B6DFC',
    funnel: 'meta',
    pages: [
      { name: 'States Split · Depleted vs Transitioning', url: '/broll/states-split', description: 'Reel 1 S4. Two state cards side-by-side, generic demographic program struck through.' },
      { name: 'Blueprint Six Weeks (reused)', url: '/broll/blueprint-six-weeks', description: 'Reel 1 S5. Six-week shape of the Blueprint.' },
      { name: 'One vs Many Variables', url: '/broll/one-vs-many-variables', description: 'Reel 2 S3. TRT acts on one variable. System dysregulated across four.' },
      { name: 'Order of Operations', url: '/broll/order-of-operations', description: 'Reel 2 S4. Four-step doctrine: read → reduce → restore → then consider hormonal support.' },
      { name: 'Postnatal Substrate', url: '/broll/postnatal-substrate', description: 'Reel 3 S4 (Zone 1, conditions absent) + S5 (Zone 2, restore the substrate).' },
      { name: 'Rhythm vs Restriction (reused)', url: '/broll/rhythm-vs-restriction', description: 'Reel 4 S3. Reactive Biology vs Regulated Biology side-by-side.' },
      { name: 'Pull-Back Intervention', url: '/broll/pull-back-intervention', description: 'Reel 4 S4. REDUCE training / INCREASE recovery / RESTORE sleep + regulation.' },
    ],
  },
]

function urlFor(page: PageEntry, tokens: Tokens): string {
  if (!page.tokenKind || !page.url.includes('{token}')) return page.url
  const t = tokens[page.tokenKind]
  if (!t) return page.url.replace('{token}', 'PREVIEW')
  return page.url.replace('{token}', t)
}

function fullUrl(url: string): string {
  if (url.startsWith('http')) return url
  // Production-safe canonical domain (https://app.bodyrecode.au), not a
  // hardcoded localhost — so Open/Copy work from any device (iPad, phone).
  return `${appUrl()}${url}`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11.5px] font-medium text-[#666D7A] hover:text-[#1560E0] hover:bg-[rgba(27,109,252,0.06)] transition"
      title="Copy URL"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function FunnelBadge({ funnel }: { funnel: FunnelTag }) {
  const meta = FUNNEL_TAG_META[funnel]
  return (
    <span
      className="inline-block text-[9px] font-extrabold px-2 py-1 rounded whitespace-nowrap"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  )
}

export default function PagesIndex({ tokens }: { tokens: Tokens }) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  function toggle(i: number) {
    setCollapsed(s => ({ ...s, [i]: !s[i] }))
  }

  return (
    <div className="space-y-4 mt-2">
      {/* Active tokens summary */}
      <div className="rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] px-4 py-3 text-[12px] text-[#666D7A] leading-relaxed">
        <p className="font-bold text-[#141821] mb-2">Active tokens applied to {'{token}'} URLs:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 font-mono text-[11px]">
          <div>Challenge: <span className="text-[#141821]">{tokens.challenge ? tokens.challenge.slice(0, 14) + '…' : '—'}</span></div>
          <div>Blueprint: <span className="text-[#141821]">{tokens.blueprint ? tokens.blueprint.slice(0, 14) + '…' : '—'}</span></div>
          <div>Membership: <span className="text-[#141821]">{tokens.membership ? tokens.membership.slice(0, 14) + '…' : '—'}</span></div>
          <div>Portal (onboarding): <span className="text-[#141821]">{tokens.portalOnboarding ? tokens.portalOnboarding.slice(0, 14) + '…' : '—'}</span></div>
          <div>Check-in: <span className="text-[#141821]">{tokens.portalCheckin ? tokens.portalCheckin.slice(0, 14) + '…' : '—'}</span></div>
          <div>Baseline: <span className="text-[#141821]">{tokens.portalBaseline ? tokens.portalBaseline.slice(0, 14) + '…' : '—'}</span></div>
          <div>Intake (foundational): <span className="text-[#141821]">{tokens.intakeFoundational ? tokens.intakeFoundational.slice(0, 14) + '…' : '—'}</span></div>
          <div>Intake (supplementary): <span className="text-[#141821]">{tokens.intakeSupplementary ? tokens.intakeSupplementary.slice(0, 14) + '…' : '—'}</span></div>
          <div>Scorecard Report: <span className="text-[#141821]">{tokens.scorecardReport ? tokens.scorecardReport.slice(0, 14) + '…' : '—'}</span></div>
        </div>
      </div>

      {STAGES.map((group, gi) => {
        const isCollapsed = !!collapsed[gi]
        return (
          <div key={gi} className="rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggle(gi)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#FBFCFD] transition"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: group.accent }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <FunnelBadge funnel={group.funnel} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#141821]">{group.stage}</h3>
                  <p className="text-[12px] text-[#666D7A] mt-0.5 leading-snug">{group.blurb}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                <span className="text-[11.5px] font-medium text-[#98A0AD]">{group.pages.length} page{group.pages.length === 1 ? '' : 's'}</span>
                {isCollapsed ? <ChevronDown className="w-4 h-4 text-[#98A0AD]" /> : <ChevronUp className="w-4 h-4 text-[#98A0AD]" />}
              </div>
            </button>

            {/* Pages */}
            {!isCollapsed && (
              <div className="border-t border-[#E8EAEE]">
                {group.pages.map((page, pi) => {
                  const url = urlFor(page, tokens)
                  const fullForOpen = fullUrl(url)
                  return (
                    <a
                      key={pi}
                      href={fullForOpen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 px-5 py-3 hover:bg-[rgba(27,109,252,0.06)]/40 transition border-b last:border-b-0 border-[#F4F6F9]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-[#141821] group-hover:text-[#1056D6] transition truncate">{page.name}</p>
                          {page.external && <ExternalLink className="w-3 h-3 text-[#98A0AD] flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] font-mono text-[#666D7A] truncate mt-0.5">{fullForOpen}</p>
                        <p className="text-[11px] text-[#666D7A] mt-1 leading-snug">{page.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 pt-1">
                        <CopyButton value={fullForOpen} />
                        <span className="text-[11.5px] font-medium text-[#1560E0] opacity-0 group-hover:opacity-100 transition">Open</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
