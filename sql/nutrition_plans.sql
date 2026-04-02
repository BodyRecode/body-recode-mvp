-- Nutrition Plans
CREATE TABLE nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,

  -- Plan identity
  plan_name text NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  is_active boolean NOT NULL DEFAULT false,

  -- Entry state (the control variable — all downstream decisions derive from this)
  entry_state text NOT NULL CHECK (entry_state IN ('stabilisation', 'training_support', 'high_output_support', 'recovery_reset')),

  -- Context at generation time
  pts_phase text,
  body_state text, -- from CFFS: Remediation / Optimisation / Post-Optimisation
  constraint_level text CHECK (constraint_level IN ('low', 'moderate', 'high')),
  recovery_status text CHECK (recovery_status IN ('stable', 'impaired', 'strong')),
  uncertainty_level text CHECK (uncertainty_level IN ('low', 'moderate', 'high')),

  -- Nutrition targets
  protein_anchor_g integer NOT NULL,
  carb_demand_level text NOT NULL CHECK (carb_demand_level IN ('low', 'moderate', 'high')),
  estimated_calorie_band text, -- e.g. "2400–2600 kcal"
  meal_frequency integer NOT NULL,

  -- Modulation
  modulation_level text NOT NULL CHECK (modulation_level IN ('prohibited', 'restricted', 'permitted')),
  active_strategies text[] DEFAULT '{}',
  nutrient_timing_permission text CHECK (nutrient_timing_permission IN ('prohibited', 'restricted', 'permitted')),
  peri_workout_config jsonb,

  -- Full structured output
  meals jsonb NOT NULL DEFAULT '[]',              -- array of meal objects
  training_day_adjustments jsonb,
  rest_day_adjustments jsonb,
  food_selection_guidelines text[],
  substitution_options text[],
  execution_rules text[],
  what_not_to_change text[],

  -- Client-facing summary blocks
  entry_state_summary jsonb,     -- { current_focus, what_this_means, prioritise, avoid }
  key_priorities text[],
  weekly_structure_notes text,
  progression_notes text,

  -- System flags
  simplification_required boolean DEFAULT false,
  deescalation_triggered boolean DEFAULT false,
  confidence_level text CHECK (confidence_level IN ('low', 'moderate', 'high')),

  -- Weekly review state
  current_direction text CHECK (current_direction IN ('progress', 'hold', 'rebuild')),
  last_review_at timestamptz
);

-- Indexes
CREATE INDEX nutrition_plans_client_id_idx ON nutrition_plans(client_id);
CREATE INDEX nutrition_plans_status_idx ON nutrition_plans(status);
CREATE INDEX nutrition_plans_is_active_idx ON nutrition_plans(is_active);

-- Weekly Review Records
CREATE TABLE nutrition_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id uuid REFERENCES nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  reviewed_at timestamptz DEFAULT now() NOT NULL,

  -- Input signals (from CFWS check-in data)
  adherence_confirmed boolean NOT NULL DEFAULT false,
  signal_category text CHECK (signal_category IN ('under_fuelling', 'over_fuelling', 'recovery_constraint', 'adherence_constraint', 'neutral_stable')),
  signal_strength text CHECK (signal_strength IN ('weak', 'moderate', 'strong')),
  days_under_observation integer, -- time qualification gate
  signals_noted text,             -- coach notes on what was observed

  -- Decision
  direction text NOT NULL CHECK (direction IN ('progress', 'hold', 'rebuild')),
  adjustment_level text CHECK (adjustment_level IN ('behavioural', 'structural', 'nutritional', 'advanced')),
  adjustment_applied text,        -- description of what changed
  variable_changed text,          -- single variable rule — what was the one thing changed

  -- Recovery routing
  deload_triggered boolean DEFAULT false,
  reset_triggered boolean DEFAULT false,
  recovery_mode_triggered boolean DEFAULT false,

  coach_notes text
);

CREATE INDEX nutrition_reviews_plan_id_idx ON nutrition_reviews(nutrition_plan_id);
CREATE INDEX nutrition_reviews_client_id_idx ON nutrition_reviews(client_id);
