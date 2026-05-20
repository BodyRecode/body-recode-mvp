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

export function getStateColour(state: string) {
  switch (state) {
    case 'Remediation': return 'bg-red-100 text-red-800 border-red-200'
    case 'Optimisation': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Post-Optimisation': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getLeadStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new_check_in: 'New — Check-In',
    report_sent: 'Report Sent',
    cold_no_booking: 'Cold — No Booking',
    zoom_booked: 'Zoom Booked',
    zoom_1_booked: 'Zoom Booked',
    zoom_completed: 'Zoom Done',
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

export function getReadinessColour(status: string) {
  switch (status) {
    case 'Green': return 'bg-green-500'
    case 'Amber': return 'bg-amber-500'
    case 'Red': return 'bg-red-500'
    default: return 'bg-gray-300'
  }
}
