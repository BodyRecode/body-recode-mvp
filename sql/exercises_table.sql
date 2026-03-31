-- ============================================================
-- Body Recode™ Exercise Database
-- Run in Supabase SQL Editor
-- ============================================================

-- Enums
CREATE TYPE movement_pattern AS ENUM (
  'squat', 'hinge', 'horizontal_push', 'vertical_push',
  'horizontal_pull', 'vertical_pull', 'rotation', 'anti_rotation',
  'carry', 'locomotion'
);

CREATE TYPE mechanical_bias AS ENUM (
  'quad_dominant', 'hip_dominant', 'glute_dominant', 'knee_dominant',
  'chest_dominant', 'lat_dominant', 'shoulder_dominant', 'scapular_dominant',
  'trunk_dominant', 'anterior_chain', 'posterior_chain'
);

CREATE TYPE joint_stress_target AS ENUM (
  'hip', 'knee', 'lumbar_spine', 'thoracic_spine', 'shoulder', 'elbow'
);

CREATE TYPE stability_level AS ENUM ('low', 'moderate', 'high');

CREATE TYPE equipment_type AS ENUM (
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'specialty'
);

CREATE TYPE load_profile_type AS ENUM (
  'constant', 'variable', 'machine_profile', 'bodyweight_profile'
);

-- Main table
CREATE TABLE exercises (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL UNIQUE,
  primary_pattern       movement_pattern NOT NULL,
  secondary_pattern     movement_pattern,
  mechanical_bias       mechanical_bias NOT NULL,
  primary_joint_stress  joint_stress_target NOT NULL,
  secondary_joint_stress joint_stress_target,
  stability_demand      stability_level NOT NULL,
  equipment             equipment_type NOT NULL,
  load_profile          load_profile_type NOT NULL,
  tier                  integer NOT NULL CHECK (tier IN (1, 2, 3)),
  axial_loading         boolean NOT NULL DEFAULT false,
  grip_demand           stability_level NOT NULL DEFAULT 'low',
  bilateral             boolean NOT NULL DEFAULT true,
  regression_id         uuid REFERENCES exercises(id),
  progression_id        uuid REFERENCES exercises(id),
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX exercises_primary_pattern_idx ON exercises(primary_pattern);
CREATE INDEX exercises_equipment_idx ON exercises(equipment);
CREATE INDEX exercises_stability_demand_idx ON exercises(stability_demand);
CREATE INDEX exercises_tier_idx ON exercises(tier);
CREATE INDEX exercises_primary_joint_stress_idx ON exercises(primary_joint_stress);

-- ============================================================
-- SEED DATA — Pass 1: Insert all exercises (no regression/progression links yet)
-- ============================================================

INSERT INTO exercises (name, primary_pattern, mechanical_bias, primary_joint_stress, secondary_joint_stress, stability_demand, equipment, load_profile, tier, axial_loading, grip_demand, bilateral) VALUES

-- SQUAT PATTERN
('Barbell Back Squat',       'squat', 'quad_dominant',  'knee',   'lumbar_spine', 'high',     'barbell',   'constant',          1, true,  'moderate', true),
('Barbell Front Squat',      'squat', 'quad_dominant',  'knee',   'thoracic_spine','high',    'barbell',   'constant',          1, true,  'moderate', true),
('Goblet Squat',             'squat', 'quad_dominant',  'knee',   'hip',          'moderate', 'kettlebell','constant',          2, false, 'moderate', true),
('Dumbbell Goblet Squat',    'squat', 'quad_dominant',  'knee',   'hip',          'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),
('Hack Squat',               'squat', 'quad_dominant',  'knee',   'hip',          'low',      'machine',   'machine_profile',   2, false, 'low',      true),
('Leg Press',                'squat', 'quad_dominant',  'knee',   'hip',          'low',      'machine',   'machine_profile',   2, false, 'low',      true),
('Bulgarian Split Squat',    'squat', 'quad_dominant',  'knee',   'hip',          'high',     'dumbbell',  'constant',          2, false, 'moderate', false),
('Split Squat',              'squat', 'quad_dominant',  'knee',   'hip',          'moderate', 'dumbbell',  'constant',          2, false, 'moderate', false),
('Step Up',                  'squat', 'knee_dominant',  'knee',   'hip',          'moderate', 'dumbbell',  'constant',          2, false, 'moderate', false),
('Bodyweight Squat',         'squat', 'quad_dominant',  'knee',   'hip',          'moderate', 'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Supported Squat',          'squat', 'quad_dominant',  'knee',   'hip',          'low',      'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Single Leg Squat',         'squat', 'quad_dominant',  'knee',   'hip',          'high',     'bodyweight','bodyweight_profile',2, false, 'low',      false),

-- HINGE PATTERN
('Conventional Deadlift',    'hinge', 'posterior_chain','lumbar_spine','hip',     'high',     'barbell',   'constant',          1, true,  'high',     true),
('Trap Bar Deadlift',        'hinge', 'hip_dominant',   'lumbar_spine','knee',    'high',     'specialty', 'constant',          1, true,  'high',     true),
('Romanian Deadlift',        'hinge', 'glute_dominant', 'lumbar_spine','hip',     'high',     'barbell',   'constant',          1, true,  'high',     true),
('Dumbbell Romanian Deadlift','hinge','glute_dominant', 'lumbar_spine','hip',     'moderate', 'dumbbell',  'constant',          2, true,  'high',     true),
('Stiff Leg Deadlift',       'hinge', 'posterior_chain','lumbar_spine','hip',     'high',     'barbell',   'constant',          2, true,  'high',     true),
('Hip Thrust',               'hinge', 'glute_dominant', 'hip',    'lumbar_spine', 'moderate', 'barbell',   'constant',          2, false, 'low',      true),
('Glute Bridge',             'hinge', 'glute_dominant', 'hip',    null,           'low',      'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Kettlebell Swing',         'hinge', 'hip_dominant',   'lumbar_spine','hip',     'high',     'kettlebell','constant',          2, true,  'high',     true),
('Cable Pull Through',       'hinge', 'glute_dominant', 'hip',    'lumbar_spine', 'moderate', 'cable',     'variable',          3, false, 'moderate', true),
('Single Leg Romanian Deadlift','hinge','glute_dominant','lumbar_spine','hip',    'high',     'dumbbell',  'constant',          2, true,  'high',     false),
('Good Morning',             'hinge', 'posterior_chain','lumbar_spine','hip',     'high',     'barbell',   'constant',          2, true,  'moderate', true),

-- HORIZONTAL PUSH
('Barbell Bench Press',      'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'high',     'barbell',   'constant',          1, false, 'moderate', true),
('Dumbbell Bench Press',     'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),
('Machine Chest Press',      'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'low',      'machine',   'machine_profile',   2, false, 'low',      true),
('Push Up',                  'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'moderate', 'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Cable Chest Press',        'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'moderate', 'cable',     'variable',          2, false, 'moderate', true),
('Incline Dumbbell Press',   'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),
('Dumbbell Fly',             'horizontal_push', 'chest_dominant', 'shoulder',null,          'moderate', 'dumbbell',  'constant',          3, false, 'low',      true),
('Wall Push Up',             'horizontal_push', 'chest_dominant', 'shoulder','elbow',       'low',      'bodyweight','bodyweight_profile',3, false, 'low',      true),

-- VERTICAL PUSH
('Barbell Overhead Press',   'vertical_push', 'shoulder_dominant','shoulder','thoracic_spine','high',   'barbell',   'constant',          1, true,  'moderate', true),
('Dumbbell Shoulder Press',  'vertical_push', 'shoulder_dominant','shoulder','elbow',       'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),
('Machine Shoulder Press',   'vertical_push', 'shoulder_dominant','shoulder','elbow',       'low',      'machine',   'machine_profile',   2, false, 'low',      true),
('Arnold Press',             'vertical_push', 'shoulder_dominant','shoulder','elbow',       'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),
('Landmine Press',           'vertical_push', 'shoulder_dominant','shoulder','thoracic_spine','moderate','barbell',  'constant',          2, false, 'moderate', false),
('Seated Dumbbell Press',    'vertical_push', 'shoulder_dominant','shoulder','elbow',       'moderate', 'dumbbell',  'constant',          2, false, 'moderate', true),

-- HORIZONTAL PULL
('Barbell Bent Over Row',    'horizontal_pull','scapular_dominant','lumbar_spine','thoracic_spine','high','barbell',  'constant',          1, true,  'high',     true),
('Dumbbell Row',             'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'moderate', 'dumbbell',  'constant',          2, false, 'high',     false),
('Seated Cable Row',         'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'low',      'cable',     'variable',          2, false, 'high',     true),
('Chest Supported Row',      'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'low',      'dumbbell',  'constant',          2, false, 'high',     true),
('Machine Row',              'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'low',      'machine',   'machine_profile',   2, false, 'moderate', true),
('Inverted Row',             'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'moderate', 'bodyweight','bodyweight_profile',3, false, 'high',     true),
('Single Arm Cable Row',     'horizontal_pull','scapular_dominant','thoracic_spine','elbow',  'moderate', 'cable',     'variable',          2, false, 'high',     false),

-- VERTICAL PULL
('Pull Up',                  'vertical_pull', 'lat_dominant',    'shoulder', 'elbow',       'high',     'bodyweight','bodyweight_profile',1, false, 'high',     true),
('Chin Up',                  'vertical_pull', 'lat_dominant',    'shoulder', 'elbow',       'high',     'bodyweight','bodyweight_profile',1, false, 'high',     true),
('Lat Pulldown',             'vertical_pull', 'lat_dominant',    'shoulder', 'elbow',       'low',      'machine',   'machine_profile',   2, false, 'high',     true),
('Assisted Pull Up',         'vertical_pull', 'lat_dominant',    'shoulder', 'elbow',       'moderate', 'machine',   'machine_profile',   3, false, 'high',     true),
('Cable Pullover',           'vertical_pull', 'lat_dominant',    'shoulder', null,          'moderate', 'cable',     'variable',          3, false, 'moderate', true),
('Single Arm Lat Pulldown',  'vertical_pull', 'lat_dominant',    'shoulder', 'elbow',       'moderate', 'cable',     'variable',          3, false, 'high',     false),

-- ROTATION
('Cable Rotation',           'rotation', 'trunk_dominant',    'thoracic_spine',null,         'moderate', 'cable',     'variable',          3, false, 'moderate', false),
('Landmine Rotation',        'rotation', 'trunk_dominant',    'thoracic_spine','lumbar_spine','moderate','barbell',   'constant',          3, true,  'moderate', false),
('Medicine Ball Rotational Throw','rotation','trunk_dominant', 'thoracic_spine',null,         'high',     'specialty', 'constant',          3, false, 'moderate', false),

-- ANTI-ROTATION
('Pallof Press',             'anti_rotation','trunk_dominant',  'thoracic_spine',null,        'moderate', 'cable',     'variable',          3, false, 'moderate', true),
('Pallof Press Hold',        'anti_rotation','trunk_dominant',  'thoracic_spine',null,        'low',      'cable',     'variable',          3, false, 'moderate', true),
('Dead Bug',                 'anti_rotation','trunk_dominant',  'lumbar_spine',null,          'moderate', 'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Bird Dog',                 'anti_rotation','trunk_dominant',  'lumbar_spine',null,          'moderate', 'bodyweight','bodyweight_profile',3, false, 'low',      true),
('Side Plank',               'anti_rotation','trunk_dominant',  'lumbar_spine',null,          'moderate', 'bodyweight','bodyweight_profile',3, false, 'low',      false),
('Plank',                    'anti_rotation','trunk_dominant',  'lumbar_spine','shoulder',    'low',      'bodyweight','bodyweight_profile',3, false, 'low',      true),

-- CARRY
('Farmer Carry',             'carry', 'trunk_dominant',    'lumbar_spine','shoulder',        'high',     'dumbbell',  'constant',          2, true,  'high',     true),
('Suitcase Carry',           'carry', 'trunk_dominant',    'lumbar_spine',null,              'high',     'dumbbell',  'constant',          2, true,  'high',     false),
('Front Rack Carry',         'carry', 'trunk_dominant',    'lumbar_spine','shoulder',        'high',     'kettlebell','constant',          2, true,  'high',     true),
('Overhead Carry',           'carry', 'trunk_dominant',    'shoulder',   'lumbar_spine',     'high',     'dumbbell',  'constant',          2, true,  'high',     true),
('Trap Bar Carry',           'carry', 'trunk_dominant',    'lumbar_spine','shoulder',        'high',     'specialty', 'constant',          2, true,  'high',     true),

-- LOCOMOTION
('Sled Push',                'locomotion','anterior_chain',  'knee',       'lumbar_spine',   'high',     'specialty', 'constant',          2, false, 'moderate', true),
('Sled Pull',                'locomotion','posterior_chain', 'hip',        'lumbar_spine',   'high',     'specialty', 'constant',          2, false, 'high',     true),
('Loaded Walking Lunge',     'locomotion','quad_dominant',   'knee',       'hip',            'moderate', 'dumbbell',  'constant',          2, false, 'moderate', false),
('Assault Bike',             'locomotion','anterior_chain',  'knee',       'shoulder',       'low',      'specialty', 'constant',          3, false, 'low',      true),
('Rowing Ergometer',         'locomotion','posterior_chain', 'lumbar_spine','hip',           'moderate', 'specialty', 'constant',          3, true,  'high',     true);

-- ============================================================
-- SEED DATA — Pass 2: Set regression/progression links
-- ============================================================

-- SQUAT progression ladder: Supported Squat → Bodyweight Squat → Goblet Squat → Split Squat → Bulgarian Split Squat → Barbell Front Squat → Barbell Back Squat
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Bodyweight Squat')    WHERE name = 'Supported Squat';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Supported Squat')     WHERE name = 'Bodyweight Squat';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Goblet Squat')        WHERE name = 'Bodyweight Squat';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Bodyweight Squat')    WHERE name = 'Goblet Squat';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Bulgarian Split Squat') WHERE name = 'Split Squat';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Split Squat')         WHERE name = 'Bulgarian Split Squat';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Barbell Front Squat') WHERE name = 'Goblet Squat';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Goblet Squat')        WHERE name = 'Barbell Front Squat';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Barbell Back Squat')  WHERE name = 'Barbell Front Squat';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Barbell Front Squat') WHERE name = 'Barbell Back Squat';

-- HINGE progression ladder: Glute Bridge → Hip Thrust → Romanian Deadlift → Trap Bar Deadlift → Conventional Deadlift
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Hip Thrust')               WHERE name = 'Glute Bridge';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Glute Bridge')             WHERE name = 'Hip Thrust';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Romanian Deadlift')        WHERE name = 'Hip Thrust';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Hip Thrust')               WHERE name = 'Romanian Deadlift';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Trap Bar Deadlift')        WHERE name = 'Romanian Deadlift';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Romanian Deadlift')        WHERE name = 'Trap Bar Deadlift';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Conventional Deadlift')    WHERE name = 'Trap Bar Deadlift';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Trap Bar Deadlift')        WHERE name = 'Conventional Deadlift';

-- HORIZONTAL PUSH progression ladder: Wall Push Up → Push Up → Dumbbell Bench Press → Barbell Bench Press
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Push Up')                  WHERE name = 'Wall Push Up';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Wall Push Up')             WHERE name = 'Push Up';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Dumbbell Bench Press')     WHERE name = 'Push Up';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Push Up')                  WHERE name = 'Dumbbell Bench Press';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Barbell Bench Press')      WHERE name = 'Dumbbell Bench Press';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Dumbbell Bench Press')     WHERE name = 'Barbell Bench Press';

-- VERTICAL PUSH progression ladder: Machine Shoulder Press → Dumbbell Shoulder Press → Barbell Overhead Press
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Dumbbell Shoulder Press')  WHERE name = 'Machine Shoulder Press';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Machine Shoulder Press')   WHERE name = 'Dumbbell Shoulder Press';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Barbell Overhead Press')   WHERE name = 'Dumbbell Shoulder Press';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Dumbbell Shoulder Press')  WHERE name = 'Barbell Overhead Press';

-- VERTICAL PULL progression ladder: Assisted Pull Up → Lat Pulldown → Chin Up → Pull Up
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Lat Pulldown')             WHERE name = 'Assisted Pull Up';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Assisted Pull Up')         WHERE name = 'Lat Pulldown';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Chin Up')                  WHERE name = 'Lat Pulldown';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Lat Pulldown')             WHERE name = 'Chin Up';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Pull Up')                  WHERE name = 'Chin Up';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Chin Up')                  WHERE name = 'Pull Up';

-- HORIZONTAL PULL progression ladder: Machine Row → Chest Supported Row → Dumbbell Row → Barbell Bent Over Row
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Chest Supported Row')      WHERE name = 'Machine Row';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Machine Row')              WHERE name = 'Chest Supported Row';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Dumbbell Row')             WHERE name = 'Chest Supported Row';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Chest Supported Row')      WHERE name = 'Dumbbell Row';
UPDATE exercises SET progression_id = (SELECT id FROM exercises WHERE name = 'Barbell Bent Over Row')    WHERE name = 'Dumbbell Row';
UPDATE exercises SET regression_id  = (SELECT id FROM exercises WHERE name = 'Dumbbell Row')             WHERE name = 'Barbell Bent Over Row';
