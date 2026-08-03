import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import BodyDecodeCheckIn from '../body-decode-check-in'
import { logoUrl, brand } from '@/config/tenant'
import { Lock } from 'lucide-react'
import { hasPortalAccess } from '@/lib/challenge-access'

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Preview path: /challenge/preview/check-in renders the form with mock data
  // (no DB query, no saved result, no real participant). For design preview only.
  let currentDay: number
  let savedResult: string | null = null
  let savedAnswers: Record<string, string> | null = null
  if (token === 'preview') {
    currentDay = 14
    savedResult = null
    savedAnswers = null
  } else {
    const admin = createAdminClient()
    const { data: enrollment } = await admin
      .from('challenge_enrollments')
      .select('id, enrolled_at, status, quiz_result, quiz_answers')
      .eq('token', token)
      .single()

    if (!enrollment || !hasPortalAccess(enrollment.status)) notFound()

    const enrolledAt = new Date(enrollment.enrolled_at as string)
    const msPerDay = 1000 * 60 * 60 * 24
    currentDay = Math.min(
      Math.floor((Date.now() - enrolledAt.getTime()) / msPerDay) + 1,
      14
    )
    savedResult = (enrollment.quiz_result as string | null) ?? null
    savedAnswers = (enrollment.quiz_answers as Record<string, string> | null) ?? null
  }

  const locked = currentDay < 7
  const resultRevealUnlocked = currentDay >= 14
  // "Day 7 view" = post-submission, pre-Day-14 state. Shows progress + Week 2
  // guidance + Day 14 teaser. Pattern is held until Day 14.
  const showingDay7View = savedResult && !resultRevealUnlocked
  const showingResult = savedResult && resultRevealUnlocked

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
          <Link href={`/challenge/${token}/day-7`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Day 7
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Day 7 · Body Decode Check-In
          </p>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.1,
          }}>
            {showingResult
              ? 'Your Body Decode Report'
              : showingDay7View
              ? 'Your Day 7 progress is in.'
              : 'The Body Decode Check-In'}
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
          {!savedResult && (
            <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
              Two short parts. Five to ten minutes total. Rate eight biological markers, then answer two signal questions. Your full Body Decode Report is delivered on Day 14, identifying which of four patterns your body is currently working through.
            </p>
          )}
          {showingDay7View && (
            <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
              You finished the Check-In. Below is what your body has done across the first seven days, what those signals mean, and what to focus on through Week 2. Your full Body Decode Report arrives on Day 14.
            </p>
          )}
        </div>
      </div>

      {/* Locked state */}
      {locked && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            background: '#F5F5F5', borderRadius: '14px', border: '1px dashed #D4D4D4',
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(27,109,252,0.10)', color: '#1B6DFC', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#4A4A4A', marginBottom: '6px' }}>
              Unlocks on Day 7
            </p>
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
              You are currently on Day {currentDay} of 14.
            </p>
          </div>
        </div>
      )}

      {/* Form / Day-7-view / Result */}
      {!locked && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 32px' }}>
          <BodyDecodeCheckIn
            token={token}
            savedResult={savedResult}
            savedAnswers={savedAnswers}
            currentDay={currentDay}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <Link href={`/challenge/${token}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 24px', borderRadius: '10px',
          background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#1A1A1A',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          ← Back to your portal
        </Link>
      </div>
    </div>
  )
}
