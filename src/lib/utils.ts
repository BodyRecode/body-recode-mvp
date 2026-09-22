import { BRAND } from './brand-tokens'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * The readiness pill.
 *
 * 22 September 2026. THIS WAS PAINTING REMEDIATION RED AND OPTIMISATION AMBER,
 * which is not a near miss, it is the doctrine inverted. Remediation is never
 * red: somebody in Remediation is not in trouble, they are being asked for
 * less, and red tells a coach the opposite of what the read says, on a screen
 * they look at before they speak to a client. Amber is Remediation's colour, so
 * giving it to Optimisation meant the two states a coach most needs to tell
 * apart were wearing each other's clothes.
 *
 * It survived because it was a Tailwind palette name rather than a hex code, so
 * every sweep that counted colours walked straight past it. Worth remembering:
 * `bg-red-100` is a colour decision that no search for `#` will ever find.
 *
 * Returns inline styles rather than classes, so it reads from the one palette
 * (lib/brand-tokens) instead of a second set of colours that can drift again.
 */
export function readinessPillStyle(state: string, onDark = false): React.CSSProperties {
  const c =
    state === 'Remediation' ? (onDark ? BRAND.remediationOnDark : BRAND.remediation)
    : state === 'Optimisation' ? (onDark ? BRAND.optimisationOnDark : BRAND.optimisation)
    : state === 'Post-Optimisation' ? (onDark ? BRAND.postOptimisationOnDark : BRAND.postOptimisation)
    : state === 'Attention' ? (onDark ? BRAND.attentionOnDark : BRAND.attention)
    : (onDark ? BRAND.darkInkSoft : BRAND.inkSoft)
  return { color: c, background: `${c}1F`, borderColor: `${c}44` }
}

/** @deprecated Use readinessPillStyle. Kept so nothing breaks mid-sweep. */
export function getStateColour(_state: string) {
  return 'border'
}

export function getLeadStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new_check_in: 'New — Check-In',
    report_sent: 'Report Sent',
    cold_no_booking: 'Cold — No Booking',
    zoom_booked: 'Zoom Booked',
    zoom_1_booked: 'Zoom Booked',
    // The DB constraint allows zoom_1_completed, not zoom_completed. The old
    // key stays mapped so historic records still render a label.
    zoom_completed: 'Zoom Done',
    zoom_1_completed: 'Zoom 1 Done',
    zoom_2_booked: 'Zoom 2 Booked',
    zoom_2_completed: 'Zoom 2 Done',
    closed_no_show: 'Closed — No Show',
    closed_declined: 'Closed — Declined',
    commencement_fee_paid: 'Commencement Fee Paid',
    active_deliberate_start: 'Pre-Start',
    active_coaching: 'Active Coaching',
  }
  return labels[status] ?? status
}

export function getLeadStatusColour(status: string) {
  switch (status) {
    case 'new_check_in': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'report_sent': return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'cold_no_booking': return 'bg-stone-50 text-stone-600 border-stone-200'
    case 'zoom_booked': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'zoom_1_booked': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'zoom_completed': return 'bg-amber-50 text-amber-800 border-amber-300'
    case 'zoom_1_completed': return 'bg-amber-50 text-amber-800 border-amber-300'
    case 'zoom_2_booked': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'zoom_2_completed': return 'bg-amber-50 text-amber-800 border-amber-300'
    case 'closed_no_show': return 'bg-stone-50 text-stone-500 border-stone-200'
    case 'closed_declined': return 'bg-stone-50 text-stone-500 border-stone-200'
    case 'commencement_fee_paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'active_deliberate_start': return 'bg-emerald-50 text-emerald-800 border-emerald-300'
    case 'active_coaching': return 'bg-blue-50 text-blue-700 border-blue-200'
    default: return 'bg-stone-50 text-stone-600 border-stone-200'
  }
}

export function getLeadSourceLabel(source: string) {
  const labels: Record<string, string> = {
    qr_floor_banner: 'QR — Floor Banner',
    qr_window: 'QR — Window',
    qr_card: 'QR — Business Card',
    qr_flyer: 'QR — Flyer',
    website: 'Website',
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    google: 'Google',
    referral: 'Referral',
    direct: 'Direct',
    gym_floor: 'Gym Floor',
    quiz: 'Quiz (untracked)',
    other: 'Other',
  }
  return labels[source] ?? source
}

export const LEAD_SOURCES = [
  { value: 'qr_floor_banner', label: 'QR — Floor Banner' },
  { value: 'qr_window', label: 'QR — Window' },
  { value: 'qr_card', label: 'QR — Business Card' },
  { value: 'qr_flyer', label: 'QR — Flyer' },
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct' },
  { value: 'gym_floor', label: 'Gym Floor' },
  { value: 'quiz', label: 'Quiz (untracked)' },
  { value: 'other', label: 'Other' },
]

/**
 * The four Green/Amber/Red signals from a read. Unlike readiness, these ARE a
 * traffic light and mean what a traffic light means, so they keep that shape.
 * They now come from the palette rather than from Tailwind's defaults, which
 * were louder than anything else on a screen whose only colour is a readiness.
 */
export function getReadinessColour(status: string): React.CSSProperties {
  const c =
    status === 'Green' ? BRAND.postOptimisation
    : status === 'Amber' ? BRAND.remediation
    : status === 'Red' ? BRAND.attention
    : BRAND.noReading
  return { background: c }
}
