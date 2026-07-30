-- Lower leg and frontal-plane hip work: taxonomy plus library.
--
-- Found 2026-07-30 while reviewing Vicki S's first program. The engine filled
-- four of the five session slots and left the Capacity/Resilience slot empty.
-- It was not being lazy: across 69 active exercises there was
--
--   * no calf or ankle exercise of ANY kind, and
--   * no hip abduction, clamshell or band walk.
--
-- The only resilience-slot candidates for a client whose limiting tissues are
-- feet and ankles, preparing to walk 28km with a symptomatic sacroiliac, were
-- Bird Dog, Dead Bug, Glute Bridge and Step Up.
--
-- It is not a data-entry oversight. The TAXONOMY could not hold this work:
-- joint_stress_target had no `ankle`, movement_pattern had nothing for
-- plantarflexion or frontal-plane hip work, and mechanical_bias had no calf or
-- abductor option. The schema was never designed to program the lower leg.
--
-- This affects every client with lower-limb history, every walking or running
-- goal, and every Restoration block, which is precisely the phase whose job is
-- building tissue tolerance.
--
-- Safe to extend: the taxonomies are not hardcoded anywhere. program-prompt.ts
-- renders the exercise list dynamically and treats joint stress generically
-- ("exclude ALL exercises where primary_joint_stress = that joint"), so a new
-- ankle value starts being respected by injury exclusion for free. The only
-- code switching on pattern values is training-doctrine.ts, updated alongside.
--
-- Run statements individually. `supabase db query --linked` does not accept
-- multi-statement input, and ALTER TYPE ... ADD VALUE cannot share a
-- transaction with the inserts that use the new value.

-- ── 1. Taxonomy ──────────────────────────────────────────────────────────────

-- One pattern for the lower leg rather than separate plantarflexion and
-- dorsiflexion values. mechanical_bias carries which one it is, which keeps the
-- pattern list readable and avoids two near-identical entries.
alter type movement_pattern add value if not exists 'lower_leg';

-- Frontal-plane hip work. Every existing pattern is sagittal or rotational, so
-- abduction had nowhere to live and pelvic-control work could not be programmed.
alter type movement_pattern add value if not exists 'abduction';

alter type joint_stress_target add value if not exists 'ankle';

alter type mechanical_bias add value if not exists 'calf_dominant';
alter type mechanical_bias add value if not exists 'tibialis_dominant';
alter type mechanical_bias add value if not exists 'abductor_dominant';

-- ── 2. Library ───────────────────────────────────────────────────────────────
-- All tier 1-2, all axial_loading false, all low grip demand. This is
-- resilience-slot work: it belongs in Restoration for everybody, and none of it
-- should ever be gated behind advanced eligibility.

insert into exercises
  (name, primary_pattern, secondary_pattern, mechanical_bias, primary_joint_stress,
   secondary_joint_stress, stability_demand, equipment, load_profile, tier,
   axial_loading, grip_demand, bilateral, is_active)
values
  -- Calf and ankle. The whole posterior lower leg was missing.
  ('Seated Calf Raise',       'lower_leg', null, 'calf_dominant',     'ankle', null, 'low',      'machine',    'machine_profile',    1, false, 'low', true,  true),
  ('Standing Calf Raise',     'lower_leg', null, 'calf_dominant',     'ankle', null, 'low',      'bodyweight', 'bodyweight_profile', 1, false, 'low', true,  true),
  -- Supported deliberately: a wall or rail keeps the pelvis level, which matters
  -- for anyone with a sacroiliac presentation.
  ('Single Leg Calf Raise',   'lower_leg', null, 'calf_dominant',     'ankle', null, 'moderate', 'bodyweight', 'bodyweight_profile', 2, false, 'low', false, true),
  -- Anterior lower leg. Directly relevant to foot and ankle tolerance under
  -- sustained walking, and there was no way to prescribe it at all.
  ('Tibialis Raise',          'lower_leg', null, 'tibialis_dominant', 'ankle', null, 'low',      'bodyweight', 'bodyweight_profile', 1, false, 'low', true,  true),

  -- Frontal-plane hip. Pelvic control work for sacroiliac presentations.
  ('Seated Hip Abduction',    'abduction', null, 'abductor_dominant', 'hip',   null, 'low',      'machine',    'machine_profile',    1, false, 'low', true,  true),
  ('Side Lying Clamshell',    'abduction', null, 'abductor_dominant', 'hip',   null, 'low',      'bodyweight', 'bodyweight_profile', 1, false, 'low', false, true),
  -- Bands are not an equipment_type. Filed as specialty, which means a client
  -- whose equipment list excludes specialty will not be offered it. Adding
  -- 'band' to equipment_type is a separate, larger decision: it would change
  -- what every existing equipment selection means.
  ('Lateral Band Walk',       'abduction', null, 'abductor_dominant', 'hip',   null, 'moderate', 'specialty',  'variable',           2, false, 'low', true,  true)
on conflict do nothing;
