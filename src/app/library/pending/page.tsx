import Link from 'next/link'
import { coach, brand } from "@/config/tenant";

export default async function LibraryPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; slug?: string }>
}) {
  const { email, slug } = await searchParams

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        maxWidth: '640px', margin: '0 auto',
        padding: '88px 24px 64px', textAlign: 'center',
      }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: '14px',
        }}>
          {brand().name} Library
                          </p>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.1,
          color: '#1A1A1A', marginBottom: '14px',
        }}>
          Payment confirmed.
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', margin: '0 auto 28px' }} />
        <p style={{
          fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7,
          marginBottom: '24px',
        }}>
          Your download is on its way to <strong style={{ color: '#1A1A1A' }}>{email ?? 'your inbox'}</strong>. The email should arrive within the next minute or two with the PDF link and a portal reader option.
        </p>

        <div style={{
          background: '#FAFAFA',
          border: '1px solid #E5E5E5',
          borderRadius: '14px',
          padding: '24px 26px',
          textAlign: 'left',
          marginBottom: '32px',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Three steps
          </p>
          <ol style={{
            margin: 0, padding: 0, listStyle: 'none',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            {[
              ['Done', 'Payment confirmed', '#1B6DFC'],
              ['Now', 'Delivery email with download link', '#1B6DFC'],
              ['Within a minute', 'PDF in your inbox', '#999999'],
            ].map(([when, what, accent], i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: accent as string,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  minWidth: '110px',
                }}>
                  {when}
                </span>
                <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>
                  {what}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div style={{
          background: 'rgba(220, 38, 38, 0.06)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '13px', color: '#1A1A1A', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#DC2626' }}>If you do not see the email</strong>, check your spam / promotions folder and whitelist <strong>{coach().email}</strong>. The delivery is automated and lands within a minute of payment.
          </p>
        </div>

        <Link
          href="/"
          style={{
            display: 'inline-block', padding: '12px 22px',
            background: 'transparent', color: '#1B6DFC',
            fontSize: '14px', fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid #1B6DFC', borderRadius: '8px',
          }}
        >
          Back to {brand().name}
                          </Link>

        {slug && (
          <p style={{ fontSize: '12px', color: '#999999', marginTop: '32px' }}>
            Reference: {slug}
          </p>
        )}
      </div>
    </div>
  )
}
