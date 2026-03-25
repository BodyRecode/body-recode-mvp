export type BodyStateClassification = 'Remediation' | 'Optimisation' | 'Post-Optimisation'

export type ResolutionState = 'Fully Resolved' | 'Partially Resolved' | 'Unresolved' | 'Deferred'

export type AdaptationArc = 'short' | 'mid' | 'long'

export type ExposureReadiness = 'Green' | 'Amber' | 'Red' | 'Unknown'

export type LeadSource = 'quiz' | 'instagram' | 'facebook' | 'google' | 'gym_floor' | 'referral' | 'direct' | 'other'

export type LeadStatus =
  | 'new_check_in'
  | 'report_sent'
  | 'cold_no_booking'
  | 'zoom_1_booked'
  | 'zoom_1_completed'
  | 'closed_no_show'
  | 'zoom_2_booked'
  | 'zoom_2_completed'
  | 'closed_declined'
  | 'commencement_fee_paid'
  | 'active_deliberate_start'
  | 'active_coaching'

export interface Lead {
  id: string
  coach_id: string
  name: string
  email?: string
  phone?: string
  source: LeadSource
  source_detail?: string
  status: LeadStatus
  check_in_answers?: Record<string, number>
  zoom_1_date?: string
  zoom_2_date?: string
  zoom_meeting_url?: string
  orientation_sent_at?: string
  notes?: string
  converted_to_client_id?: string
  converted_at?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  coach_id: string
  name: string
  email?: string
  coaching_started_at?: string
  created_at: string
}

export interface IntakeInvitation {
  id: string
  client_id: string
  token: string
  status: 'pending' | 'started' | 'complete'
  created_at: string
  completed_at?: string
}

export interface Intake {
  id: string
  client_id: string
  invitation_id?: string
  schema_version: string
  // Identity
  full_name: string
  date_of_birth: string
  gender: string
  occupation: string
  mobile_number: string
  emergency_contact_name: string
  emergency_contact_phone: string
  how_did_you_hear: string
  // JSONB diagnostic responses
  fat_map_responses: Record<string, number>
  injury_responses: Record<string, number>
  training_responses: Record<string, number>
  nutrition_responses: Record<string, number>
  schedule_responses: Record<string, number>
  sleep_responses: Record<string, number>
  stress_responses: Record<string, number>
  supplement_responses: Record<string, number>
  // Injury specifics
  injury_location_current: string[]
  injury_location_history: string[]
  injury_primary_concern: string
  injury_aggravating_movements: string
  // Goals
  primary_goal: string
  secondary_goals: string
  desired_timeline: string
  subjective_motivator: string
  // Final confirmation
  final_disclosure: string
  final_system_alignment: boolean
  final_accuracy: boolean
  submitted_at: string
}

export interface CFFS {
  id: string
  client_id: string
  intake_id: string
  generated_at: string
  resolution_state: ResolutionState
  body_state_classification: BodyStateClassification
  client_context_summary: string
  primary_patterns_and_signals: string
  capacity_constraints_and_guardrails: string
  risk_flags_and_watch_items: string
  tensions_and_tradeoffs: string
  explicit_non_directives: string
  closing_interpretive_notes: string
  exposure_readiness_capacity: ExposureReadiness
  exposure_readiness_schedule: ExposureReadiness
  exposure_readiness_regulation: ExposureReadiness
  exposure_readiness_behaviour: ExposureReadiness
  reassessment_flagged: boolean
  is_archived: boolean
  superseded_by?: string
}

export interface WeeklyCheckin {
  id: string
  client_id: string
  week_number: number
  form_type: 'A' | 'B'
  submitted_at: string
  responses: Record<string, unknown>
}

export interface CFWS {
  id: string
  client_id: string
  week_number: number
  generated_at: string
  resolution_state: ResolutionState
  rolling_window_weeks: number[]
  client_context_snapshot: string
  dominant_weekly_patterns: string
  weekly_capacity_constraints: string
  weekly_risk_flags: string
  weekly_tensions_tradeoffs: string
  explicit_weekly_non_directives: string
  closing_weekly_notes: string
  exposure_readiness_capacity: ExposureReadiness
  exposure_readiness_schedule: ExposureReadiness
  exposure_readiness_regulation: ExposureReadiness
  exposure_readiness_behaviour: ExposureReadiness
  reassessment_language_triggered: boolean
}
