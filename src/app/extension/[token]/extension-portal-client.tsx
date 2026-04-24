'use client'

// The Extension portal mirrors the Membership portal.
// Weeks 1-6 show Block A content. Weeks 7-12 show Block B content.
// Re-exports the membership portal client with an adapter.

import MembershipPortalClient from '@/app/membership/[token]/membership-portal-client'

type ExtensionEnrollment = {
  id: string
  first_name: string
  email: string
  token: string
  pattern: string
  current_week: number
  purchase_date: string
}

export default function ExtensionPortalClient({ enrollment }: { enrollment: ExtensionEnrollment }) {
  // Map extension weeks to membership block/week
  // Weeks 1-6 → Block A, week as-is
  // Weeks 7-12 → Block B, week minus 6
  const block = enrollment.current_week <= 6 ? 'A' : 'B'
  const week = enrollment.current_week <= 6 ? enrollment.current_week : enrollment.current_week - 6

  const membershipEnrollment = {
    id: enrollment.id,
    first_name: enrollment.first_name,
    email: enrollment.email,
    token: enrollment.token,
    pattern: enrollment.pattern,
    current_block: block,
    current_week: week,
    joined_at: enrollment.purchase_date,
  }

  return <MembershipPortalClient enrollment={membershipEnrollment} />
}
