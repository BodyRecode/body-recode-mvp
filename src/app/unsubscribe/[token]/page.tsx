import type { Metadata } from 'next'
import { readUnsubscribeToken, isSuppressed } from '@/lib/unsubscribe'
import UnsubscribeClient from './unsubscribe-client'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  // Never index an unsubscribe page — the token identifies a person.
  robots: { index: false, follow: false },
}

/**
 * Human-facing unsubscribe page, linked from the footer of every marketing
 * email. Deliberately does NOT unsubscribe on page load: corporate link
 * scanners follow URLs in incoming mail, and a scanner must not be able to
 * opt someone out by looking at their inbox. The actual change happens on the
 * button press (a server action). One-click from the mail client's own
 * unsubscribe button is handled separately at /api/unsubscribe, which is POST.
 */
export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const email = readUnsubscribeToken(token)

  if (!email) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}
      >
        <div style={{ maxWidth: '480px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 12px' }}>
            This link isn&apos;t valid
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#4A4A4A', margin: 0 }}>
            The unsubscribe link may have been altered in transit. Reply to any email from us with
            the word STOP and we&apos;ll remove you straight away.
          </p>
        </div>
      </main>
    )
  }

  const alreadySuppressed = await isSuppressed(email)

  return (
    <UnsubscribeClient token={token} email={email} initiallySuppressed={alreadySuppressed} />
  )
}
