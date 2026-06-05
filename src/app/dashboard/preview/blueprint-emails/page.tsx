import Link from 'next/link'
import {
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
} from '@/lib/blueprint-emails'

const SAMPLE = {
  firstName: 'Sarah',
  completedWeek: 3,
  newWeek: 4,
  portalUrl: 'https://bodyrecode.au/blueprint/sample-token-here',
}

type EmailKey = 'checkin-prompt' | 'checkin-reminder'

const EMAIL_TABS: { key: EmailKey; label: string; trigger: string; iframeHeight: number }[] = [
  { key: 'checkin-prompt', label: 'Week check-in prompt', trigger: 'Sent by Inngest blueprintWeekAdvanceFunction at the start of each new week (Weeks 2-6).', iframeHeight: 1000 },
  { key: 'checkin-reminder', label: 'Check-in reminder (2-day)', trigger: 'Sent 2 days later if the participant has not submitted the prior week’s check-in.', iframeHeight: 900 },
]

export default async function BlueprintEmailsPreview({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  const selectedEmail: EmailKey =
    (EMAIL_TABS.find(t => t.key === email)?.key) ?? 'checkin-prompt'

  const built = (() => {
    switch (selectedEmail) {
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
              Weekly check-in prompt + 2-day reminder, rendered via production builders.
            </h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: 1.5 }}>
              Sample data: <strong>{SAMPLE.firstName}</strong> · completed week <strong>{SAMPLE.completedWeek}</strong> · entering week <strong>{SAMPLE.newWeek}</strong>. What you see is exactly what gets sent.
            </p>
            <p style={{ fontSize: '12px', color: '#999999', margin: '6px 0 0', lineHeight: 1.5 }}>
              The six pattern-callout weekly emails (Weeks 1-6 + Week 7 follow-up) still compose inline in inngest-functions.ts and are queued for the same migration.
            </p>
          </div>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to dashboard
          </Link>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EMAIL_TABS.map(tab => {
            const active = tab.key === selectedEmail
            return (
              <Link
                key={tab.key}
                href={`/dashboard/preview/blueprint-emails?email=${tab.key}`}
                style={{
                  display: 'inline-block',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: active ? '#FFFFFF' : '#1A1A1A',
                  background: active ? '#1B6DFC' : '#FFFFFF',
                  border: '1px solid ' + (active ? '#1B6DFC' : '#E5E5E5'),
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
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
