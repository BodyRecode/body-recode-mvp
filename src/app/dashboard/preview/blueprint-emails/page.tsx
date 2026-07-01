import Link from 'next/link'
import {
  buildBlueprintPurchaseWelcomeEmail,
  buildBlueprintCoachNotificationEmail,
  buildBlueprintWeekEmail,
  buildBlueprintWeek7FollowupEmail,
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
  BLUEPRINT_PATTERN_LABELS,
} from '@/lib/blueprint-emails'
import { brand } from "@/config/tenant";

const SAMPLE = {
  firstName: 'Sarah',
  name: 'Sarah Jenkins',
  email: 'sarah@example.com',
  portalUrl: `${brand().marketingDomain}/blueprint/sample-token-here`,
  completedWeek: 3,
  newWeek: 4,
}

const PATTERNS = Object.entries(BLUEPRINT_PATTERN_LABELS).map(([slug, label]) => ({ slug, label }))

type EmailKey =
  | 'purchase-welcome'
  | 'coach-notification'
  | 'week-1' | 'week-2' | 'week-3' | 'week-4' | 'week-5' | 'week-6'
  | 'week-7-followup'
  | 'checkin-prompt'
  | 'checkin-reminder'

const EMAIL_TABS: { key: EmailKey; label: string; group: string; trigger: string; iframeHeight: number; usesPattern: boolean }[] = [
  { key: 'purchase-welcome', label: 'Purchase welcome', group: 'Purchase', trigger: 'Sent by Stripe webhook on successful $97 Blueprint purchase.', iframeHeight: 1200, usesPattern: true },
  { key: 'coach-notification', label: 'Coach notification', group: 'Purchase', trigger: 'Sent to kade@bodyrecode.au on every Blueprint purchase. Internal only.', iframeHeight: 700, usesPattern: true },
  { key: 'week-1', label: 'Week 1', group: 'Weekly programme', trigger: 'Sent by Inngest blueprintEmailSequenceFunction 1 day after enrollment.', iframeHeight: 1500, usesPattern: true },
  { key: 'week-2', label: 'Week 2', group: 'Weekly programme', trigger: 'Sent 7 days after Week 1 email.', iframeHeight: 1500, usesPattern: true },
  { key: 'week-3', label: 'Week 3', group: 'Weekly programme', trigger: 'Sent 7 days after Week 2 email. Marks the Adapt phase transition.', iframeHeight: 1500, usesPattern: true },
  { key: 'week-4', label: 'Week 4', group: 'Weekly programme', trigger: 'Sent 7 days after Week 3 email.', iframeHeight: 1500, usesPattern: true },
  { key: 'week-5', label: 'Week 5', group: 'Weekly programme', trigger: 'Sent 7 days after Week 4 email. Peak intensity week.', iframeHeight: 1500, usesPattern: true },
  { key: 'week-6', label: 'Week 6', group: 'Weekly programme', trigger: 'Sent 7 days after Week 5 email. Deload week. CTA points to "See what comes next".', iframeHeight: 1500, usesPattern: true },
  { key: 'week-7-followup', label: 'Week 7 follow-up', group: 'Weekly programme', trigger: 'Sent 7 days after Week 6. Closes the 6-week Blueprint arc, invites a reply for Stage 3 conversation.', iframeHeight: 1200, usesPattern: true },
  { key: 'checkin-prompt', label: 'Check-in prompt', group: 'Check-in', trigger: 'Sent by blueprintWeekAdvanceFunction at the start of each new week (Weeks 2-6).', iframeHeight: 1000, usesPattern: false },
  { key: 'checkin-reminder', label: 'Check-in reminder (2-day)', group: 'Check-in', trigger: 'Sent 2 days later if the participant has not submitted the prior week’s check-in.', iframeHeight: 900, usesPattern: false },
]

const GROUPS = ['Purchase', 'Weekly programme', 'Check-in'] as const

export default async function BlueprintEmailsPreview({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; pattern?: string }>
}) {
  const { email, pattern } = await searchParams
  const selectedEmail: EmailKey =
    (EMAIL_TABS.find(t => t.key === email)?.key) ?? 'purchase-welcome'
  const selectedPatternSlug = PATTERNS.find(p => p.slug === pattern)?.slug ?? 'stress-stored'
  const selectedPatternLabel = BLUEPRINT_PATTERN_LABELS[selectedPatternSlug]

  const built = (() => {
    switch (selectedEmail) {
      case 'purchase-welcome':
        return buildBlueprintPurchaseWelcomeEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          pattern: selectedPatternSlug,
        })
      case 'coach-notification':
        return buildBlueprintCoachNotificationEmail({
          name: SAMPLE.name,
          email: SAMPLE.email,
          pattern: selectedPatternSlug,
        })
      case 'week-1':
      case 'week-2':
      case 'week-3':
      case 'week-4':
      case 'week-5':
      case 'week-6':
        return buildBlueprintWeekEmail({
          week: Number(selectedEmail.slice(-1)) as 1 | 2 | 3 | 4 | 5 | 6,
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          pattern: selectedPatternSlug,
        })
      case 'week-7-followup':
        return buildBlueprintWeek7FollowupEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
          pattern: selectedPatternSlug,
        })
      case 'checkin-prompt':
        return buildBlueprintCheckinPromptEmail({
          firstName: SAMPLE.firstName,
          completedWeek: SAMPLE.completedWeek,
          newWeek: SAMPLE.newWeek,
          portalUrl: SAMPLE.portalUrl,
        })
      case 'checkin-reminder':
        return buildBlueprintCheckinReminderEmail({
          firstName: SAMPLE.firstName,
          completedWeek: SAMPLE.completedWeek,
          portalUrl: SAMPLE.portalUrl,
        })
    }
  })()

  const currentTab = EMAIL_TABS.find(t => t.key === selectedEmail)!

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        padding: '20px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              6-Week Body Rewire Blueprint · Email preview
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
              All nine Blueprint emails, rendered via the actual production builders.
            </h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: 1.5 }}>
              Sample data: <strong>{SAMPLE.firstName}</strong>{currentTab.usesPattern ? <> · pattern <strong>{selectedPatternLabel}</strong></> : null}. What you see is exactly what gets sent.
            </p>
          </div>
          <Link href="/dashboard/preview" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to assets
          </Link>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GROUPS.map(group => (
            <div key={group} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '130px' }}>
                {group}
              </span>
              {EMAIL_TABS.filter(t => t.group === group).map(tab => {
                const active = tab.key === selectedEmail
                const href = `/dashboard/preview/blueprint-emails?email=${tab.key}${tab.usesPattern ? `&pattern=${selectedPatternSlug}` : ''}`
                return (
                  <Link
                    key={tab.key}
                    href={href}
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: active ? '#FFFFFF' : '#1A1A1A',
                      background: active ? '#1B6DFC' : '#FFFFFF',
                      border: '1px solid ' + (active ? '#1B6DFC' : '#E5E5E5'),
                      borderRadius: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {currentTab.usesPattern && (
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '130px' }}>
              Pattern:
            </span>
            {PATTERNS.map(p => {
              const active = p.slug === selectedPatternSlug
              return (
                <Link
                  key={p.slug}
                  href={`/dashboard/preview/blueprint-emails?email=${selectedEmail}&pattern=${p.slug}`}
                  style={{
                    display: 'inline-block',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: active ? '#FFFFFF' : '#1A1A1A',
                    background: active ? '#1B6DFC' : '#FFFFFF',
                    border: '1px solid ' + (active ? '#1B6DFC' : '#E5E5E5'),
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {currentTab.trigger}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Subject: <span style={{ fontWeight: 500 }}>{built!.subject}</span>
          </p>
        </div>
        <iframe
          srcDoc={built!.html}
          style={{
            width: '100%',
            minHeight: `${currentTab.iframeHeight}px`,
            border: '1px solid #E5E5E5',
            borderRadius: '12px',
            background: '#FFFFFF',
          }}
          title={`${currentTab.label} email preview`}
        />
      </div>
    </div>
  )
}
