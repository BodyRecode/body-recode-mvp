ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active'));
