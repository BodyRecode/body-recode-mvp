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
    zoom_1_booked: 'Zoom 1 Booked',
    zoom_1_completed: 'Zoom 1 Done',
    closed_no_show: 'Closed — No Show',
    zoom_2_booked: 'Zoom 2 Booked',
    zoom_2_completed: 'Zoom 2 Done',
    closed_declined: 'Closed — Declined',
    commencement_fee_paid: 'Commencement Fee Paid',
    active_deliberate_start: 'Deliberate Start',
    active_coaching: 'Active Coaching',
  }
  return labels[status] ?? status
}

export function getLeadStatusColour(status: string) {
  switch (status) {
    case 'new_check_in': return 'bg-blue-950 text-blue-300 border-blue-800'
    case 'report_sent': return 'bg-violet-950 text-violet-300 border-violet-800'
    case 'cold_no_booking': return 'bg-stone-800 text-stone-400 border-stone-700'
    case 'zoom_1_booked': return 'bg-amber-950 text-amber-300 border-amber-800'
    case 'zoom_1_completed': return 'bg-amber-950 text-amber-200 border-amber-700'
    case 'closed_no_show': return 'bg-stone-800 text-stone-500 border-stone-700'
    case 'zoom_2_booked': return 'bg-orange-950 text-orange-300 border-orange-800'
    case 'zoom_2_completed': return 'bg-orange-950 text-orange-200 border-orange-700'
    case 'closed_declined': return 'bg-stone-800 text-stone-500 border-stone-700'
    case 'commencement_fee_paid': return 'bg-emerald-950 text-emerald-300 border-emerald-800'
    case 'active_deliberate_start': return 'bg-emerald-950 text-emerald-200 border-emerald-700'
    case 'active_coaching': return 'bg-teal-950 text-teal-300 border-teal-700'
    default: return 'bg-stone-800 text-stone-400 border-stone-700'
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
    google: 'Google',
    referral: 'Referral',
    direct: 'Direct',
    gym_floor: 'Gym Floor',
    quiz: 'Quiz (untracked)',
    founder_program: 'Founder Program',
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
