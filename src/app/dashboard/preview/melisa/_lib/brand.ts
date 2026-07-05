/**
 * Hermony brand tokens (Melisa's business). Represents the white-label
 * shape her tenant will run: same BR platform layout, same components,
 * her brand name + accent applied at the header + accent-bar callsites.
 *
 * When the real tenant is provisioned at seed time, these values live
 * in tenant_config.brand; this file is retired.
 */
export const HERMONY = {
  name: 'Hermony',
  sub: 'Yoga & Meditation',
  initials: 'H',
  founder: 'Melisa',
  location: 'Brisbane',

  // Accent - warm sage instead of BR's Signal Blue #1B6DFC
  accentBar: '#7A8A6B',
  accentText: '#4D5A41',
  accentSoftBg: 'rgba(122, 138, 107, 0.08)',
  accentRing: '#C5CFBA',
} as const

export const HERMONY_STUDENTS = [
  { id: '1', name: 'Sarah Whittaker', email: 'sarah@example.com',  status: 'active_settling',   week: 3,  block: 'Capacity Foundation' },
  { id: '2', name: 'Emma Prescott',   email: 'emma@example.com',   status: 'active_settling',   week: 2,  block: 'Stabilisation' },
  { id: '3', name: 'Anaya Rao',       email: 'anaya@example.com',  status: 'active_expression', week: 5,  block: 'Performance Expression' },
  { id: '4', name: 'Jenna Tomlin',    email: 'jenna@example.com',  status: 'active_building',   week: 4,  block: 'Capacity Foundation' },
  { id: '5', name: 'Ruth Larkin',     email: 'ruth@example.com',   status: 'new',               week: 1,  block: 'Stabilisation' },
  { id: '6', name: 'Priya Menon',     email: 'priya@example.com',  status: 'active_expression', week: 3,  block: 'Performance Expression' },
  { id: '7', name: 'Kate Beattie',    email: 'kate@example.com',   status: 'active_building',   week: 6,  block: 'Capacity Foundation' },
] as const

export const HERMONY_RECENT_LEADS = [
  { id: 'l1', name: 'Lauren Chen',   email: 'lauren@example.com',   status: 'new_check_in' },
  { id: 'l2', name: 'Freya Adamson', email: 'freya@example.com',    status: 'report_sent' },
  { id: 'l3', name: 'Mia Ortega',    email: 'mia@example.com',      status: 'zoom_booked' },
  { id: 'l4', name: 'Hana Ito',      email: 'hana@example.com',     status: 'cold_no_booking' },
  { id: 'l5', name: 'Anya Fitzgerald', email: 'anya@example.com',   status: 'commencement_fee_paid' },
] as const

export const HERMONY_RECENT_CHECKINS = [
  { id: 'c1', client_name: 'Sarah Whittaker', week: 3, form_type: 'B', submitted_at: '2026-07-05' },
  { id: 'c2', client_name: 'Emma Prescott',   week: 2, form_type: 'A', submitted_at: '2026-07-04' },
  { id: 'c3', client_name: 'Anaya Rao',       week: 5, form_type: 'C', submitted_at: '2026-07-04' },
  { id: 'c4', client_name: 'Priya Menon',     week: 3, form_type: 'B', submitted_at: '2026-07-03' },
  { id: 'c5', client_name: 'Kate Beattie',    week: 6, form_type: 'C', submitted_at: '2026-07-02' },
] as const
