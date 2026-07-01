import Link from 'next/link'
import {
  buildMembershipPurchaseWelcomeEmail,
  buildMembershipCoachNotificationEmail,
  buildMembershipCheckinPromptEmail,
  buildMembershipCheckinReminderEmail,
} from '@/lib/membership-emails'
import { brand, coach } from "@/config/tenant";

const SAMPLE = {
  firstName: 'Sarah',
  email: 'sarah@example.com',
  pattern: 'metabolic-drift',
  blueprintToken: 'sample-blueprint-token',
  portalUrl: `${brand().marketingDomain}/membership/sample-token-here`,
  block: 'A',
  completedWeek: 3,
  newWeek: 4,
}

type EmailKey =
  | 'purchase-welcome'
  | 'coach-notification'
  | 'checkin-prompt'
  | 'checkin-reminder'

const EMAIL_TABS: { key: EmailKey; label: string; group: string; trigger: string; iframeHeight: number }[] = [
  { key: 'purchase-welcome', label: 'Purchase welcome', group: 'Purchase', trigger: 'Sent by Stripe webhook on successful $49/wk Membership subscription purchase.', iframeHeight: 1200 },
  { key: 'coach-notification', label: 'Coach notification', group: 'Purchase', trigger: `Sent to ${coach().email} on every Membership purchase. Internal only.`, iframeHeight: 700 },
  { key: 'checkin-prompt', label: 'Check-in prompt', group: 'Check-in', trigger: 'Sent by membershipWeekAdvanceFunction at the start of each new week. Per Block × Week.', iframeHeight: 1000 },
  { key: 'checkin-reminder', label: 'Check-in reminder (2-day)', group: 'Check-in', trigger: 'Sent 2 days later if the participant has not submitted the prior week’s check-in.', iframeHeight: 900 },
]

const GROUPS = ['Purchase', 'Check-in'] as const

export default async function MembershipEmailsPreview({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  const selectedEmail: EmailKey =
    (EMAIL_TABS.find(t => t.key === email)?.key) ?? 'purchase-welcome'

  const built = (() => {
    switch (selectedEmail) {
      case 'purchase-welcome':
        return buildMembershipPurchaseWelcomeEmail({
          firstName: SAMPLE.firstName,
          portalUrl: SAMPLE.portalUrl,
        })
      case 'coach-notification':
        return buildMembershipCoachNotificationEmail({
          firstName: SAMPLE.firstName,
          email: SAMPLE.email,
          pattern: SAMPLE.pattern,
          blueprintToken: SAMPLE.blueprintToken,
        })
      case 'checkin-prompt':
        return buildMembershipCheckinPromptEmail({
          firstName: SAMPLE.firstName,
          block: SAMPLE.block,
          completedWeek: SAMPLE.completedWeek,
          newWeek: SAMPLE.newWeek,
          portalUrl: SAMPLE.portalUrl,
        })
      case 'checkin-reminder':
        return buildMembershipCheckinReminderEmail({
          firstName: SAMPLE.firstName,
          block: SAMPLE.block,
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
              Body Recode Membership · Email preview
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
              All four Membership emails, rendered via the actual production builders.
            </h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: 1.5 }}>
              Sample data: <strong>{SAMPLE.firstName}</strong> · Block <strong>{SAMPLE.block}</strong> · completed week <strong>{SAMPLE.completedWeek}</strong>. What you see is exactly what gets sent.
            </p>
          </div>
          <Link href="/dashboard/preview" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to assets
          </Link>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GROUPS.map(group => (
            <div key={group} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '110px' }}>
                {group}
              </span>
              {EMAIL_TABS.filter(t => t.group === group).map(tab => {
                const active = tab.key === selectedEmail
                return (
                  <Link
                    key={tab.key}
                    href={`/dashboard/preview/membership-emails?email=${tab.key}`}
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
