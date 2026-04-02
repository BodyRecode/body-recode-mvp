-- Add direction tracking to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS current_direction text CHECK (current_direction IN ('progress', 'hold', 'rebuild', 'deload'));
ALTER TABLE programs ADD COLUMN IF NOT EXISTS last_review_at timestamptz;

-- Program Weekly Review Records
CREATE TABLE program_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  reviewed_at timestamptz DEFAULT now() NOT NULL,

  -- Session adherence
  adherence_confirmed boolean NOT NULL DEFAULT false,

  -- Performance signals
  signal_category text CHECK (signal_category IN ('performance_up', 'performance_down', 'stalled', 'recovery_constraint', 'neutral_stable')),
  signal_strength text CHECK (signal_strength IN ('weak', 'moderate', 'strong')),
  days_under_observation integer,
  signals_noted text,

  -- Decision
  direction text NOT NULL CHECK (direction IN ('progress', 'hold', 'rebuild', 'deload')),
  adjustment_level text CHECK (adjustment_level IN ('execution', 'structural', 'phase_advance', 'regenerate')),
  adjustment_applied text,
  variable_changed text,

  -- Recovery routing
  deload_triggered boolean DEFAULT false,
  block_extended boolean DEFAULT false,
  new_block_required boolean DEFAULT false,

  coach_notes text
);

CREATE INDEX program_reviews_program_id_idx ON program_reviews(program_id);
CREATE INDEX program_reviews_client_id_idx ON program_reviews(client_id);
