-- ============================================================
-- Body Recode™ Yoga Movement Library  (modality pack: yoga)
-- Parallel to exercises_table.sql (strength modality).
-- Run in Supabase SQL Editor / via `supabase db query --linked`.
-- ============================================================

-- ---------- Enums ----------
CREATE TYPE yoga_family AS ENUM (
  'standing', 'seated', 'kneeling', 'supine', 'prone',
  'balance', 'inversion', 'twist', 'backbend', 'forward_fold',
  'side_bend', 'core', 'restorative', 'sun_salutation', 'pranayama', 'transition'
);

CREATE TYPE yoga_intensity AS ENUM ('restorative', 'gentle', 'moderate', 'strong');

CREATE TYPE yoga_level AS ENUM ('foundational', 'intermediate', 'advanced');

CREATE TYPE yoga_weight_bearing AS ENUM ('none', 'legs', 'arms', 'full');

CREATE TYPE yoga_hold_style AS ENUM ('static', 'dynamic');

-- ---------- Table ----------
CREATE TABLE IF NOT EXISTS yoga_movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL UNIQUE,          -- common English name
  sanskrit_name       text,
  family              yoga_family NOT NULL,
  intensity           yoga_intensity NOT NULL,
  level               yoga_level NOT NULL,
  target_regions      text[] NOT NULL DEFAULT '{}',  -- e.g. {spine, hips, hamstrings}
  weight_bearing      yoga_weight_bearing NOT NULL DEFAULT 'none',
  props               text[] NOT NULL DEFAULT '{}',  -- e.g. {block, strap, bolster}
  contraindications   text[] NOT NULL DEFAULT '{}',  -- e.g. {pregnancy, high_blood_pressure, neck_injury}
  hold_style          yoga_hold_style NOT NULL DEFAULT 'static',
  default_hold_seconds integer,                      -- for static holds
  default_breaths     integer,                       -- for breath-counted holds
  breath_cue          text,                          -- e.g. 'inhale to lengthen, exhale to fold'
  counterpose_family  yoga_family,                   -- what family neutralises this one
  cue                 text,                          -- short teaching cue
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX yoga_movements_family_idx     ON yoga_movements(family);
CREATE INDEX yoga_movements_intensity_idx  ON yoga_movements(intensity);
CREATE INDEX yoga_movements_level_idx      ON yoga_movements(level);

-- ============================================================================
-- GRANTS  (REQUIRED — explicit grants default; without these: 42501)
-- ============================================================================
grant select, insert, update, delete on public.yoga_movements to service_role;
-- Coaches read the library via the SSR server client when logged in:
grant select on public.yoga_movements to authenticated;

-- ============================================================================
-- RLS + POLICIES  (mirror the exercises library: coaches read, service manages)
-- ============================================================================
alter table yoga_movements enable row level security;

drop policy if exists "coaches read yoga movements" on yoga_movements;
create policy "coaches read yoga movements"
  on yoga_movements for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

drop policy if exists "service role manages yoga movements" on yoga_movements;
create policy "service role manages yoga movements"
  on yoga_movements for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- SEED — foundational library (v1, general yoga knowledge; Melisa deepens later)
-- ============================================================================
INSERT INTO yoga_movements
  (name, sanskrit_name, family, intensity, level, target_regions, weight_bearing, props, contraindications, hold_style, default_hold_seconds, default_breaths, breath_cue, counterpose_family, cue)
VALUES
-- Breath / centering
('Seated Breath Awareness','Sukhasana Pranayama','pranayama','restorative','foundational','{nervous_system}','none','{bolster}','{}','static',120,NULL,'slow even nasal breath',NULL,'settle, lengthen the spine, soften the jaw'),
('Three-Part Breath','Dirga Pranayama','pranayama','restorative','foundational','{nervous_system}','none','{}','{}','static',90,NULL,'fill belly, ribs, chest on the inhale',NULL,'downregulate before movement'),
('Ocean Breath','Ujjayi','pranayama','gentle','foundational','{nervous_system}','none','{}','{}','dynamic',NULL,10,'soft constriction at the throat',NULL,'breath leads the movement'),
-- Warm-up / gentle
('Cat-Cow','Marjaryasana-Bitilasana','kneeling','gentle','foundational','{spine}','full','{}','{wrist_injury}','dynamic',NULL,8,'inhale to arch, exhale to round','core','mobilise the spine with the breath'),
('Child''s Pose','Balasana','kneeling','restorative','foundational','{spine,hips}','none','{bolster}','{knee_injury}','static',60,NULL,'exhale and release the back body','backbend','a home base to return to'),
('Thread the Needle','Parsva Balasana','kneeling','gentle','foundational','{shoulders,spine}','arms','{}','{shoulder_injury}','static',45,NULL,'exhale to thread and soften','twist','open the upper back gently'),
('Downward Dog','Adho Mukha Svanasana','inversion','moderate','foundational','{shoulders,hamstrings,spine}','full','{}','{wrist_injury,high_blood_pressure}','static',30,5,'press the floor away, lengthen the spine','forward_fold','an active reset between shapes'),
('Sun Salutation A','Surya Namaskar A','sun_salutation','moderate','foundational','{full_body}','full','{}','{wrist_injury,high_blood_pressure}','dynamic',NULL,1,'one breath, one movement',NULL,'build heat and link breath to movement'),
-- Standing
('Mountain Pose','Tadasana','standing','gentle','foundational','{full_body}','legs','{}','{}','static',30,NULL,'ground evenly through the feet','forward_fold','find steady, tall alignment'),
('Forward Fold','Uttanasana','forward_fold','gentle','foundational','{hamstrings,spine}','legs','{block}','{low_back_injury}','static',45,NULL,'exhale to fold from the hips','backbend','soft knees, let the head hang'),
('Warrior I','Virabhadrasana I','standing','strong','foundational','{hips,legs,chest}','legs','{}','{}','static',30,5,'inhale to lift, root the back heel','forward_fold','strength and openness together'),
('Warrior II','Virabhadrasana II','standing','strong','foundational','{hips,legs,shoulders}','legs','{}','{}','static',30,5,'gaze past the front hand','forward_fold','steady, wide, grounded'),
('Triangle','Trikonasana','standing','moderate','foundational','{hips,hamstrings,side_body}','legs','{block}','{}','static',30,5,'lengthen both sides of the waist','twist','length over depth'),
('Chair Pose','Utkatasana','standing','strong','foundational','{legs,spine}','legs','{}','{}','static',20,5,'sit the hips back, lift the chest','forward_fold','build leg strength and heat'),
-- Balance
('Tree Pose','Vrksasana','balance','moderate','foundational','{legs,core}','legs','{wall}','{}','static',30,NULL,'fix the gaze, root the standing foot','standing','steady breath steadies balance'),
('Eagle Pose','Garudasana','balance','strong','intermediate','{legs,shoulders}','legs','{}','{knee_injury}','static',20,NULL,'wrap and lift, soft steady gaze','standing','focus and squeeze'),
-- Backbend
('Cobra','Bhujangasana','backbend','moderate','foundational','{spine,chest}','full','{}','{low_back_injury,pregnancy}','static',20,5,'inhale to lift, elbows hugging in','forward_fold','lengthen before you lift'),
('Bridge','Setu Bandha','backbend','moderate','foundational','{spine,hips,chest}','full','{block}','{neck_injury}','static',30,5,'press the feet, lift the hips','forward_fold','open the front body'),
('Camel','Ustrasana','backbend','strong','intermediate','{spine,chest,hip_flexors}','legs','{}','{low_back_injury,neck_injury,high_blood_pressure}','static',20,5,'lift the chest before reaching back','forward_fold','heart-opening, approach with care'),
-- Twist
('Supine Twist','Supta Matsyendrasana','twist','gentle','foundational','{spine,hips}','none','{}','{}','static',45,NULL,'exhale to release across the body','supine','unwind the spine, both sides'),
('Seated Twist','Ardha Matsyendrasana','twist','moderate','foundational','{spine}','none','{}','{pregnancy}','static',30,5,'inhale tall, exhale to revolve','seated','length first, then twist'),
-- Seated / forward fold
('Staff Pose','Dandasana','seated','gentle','foundational','{spine,legs}','none','{}','{}','static',30,NULL,'sit tall, flex the feet','forward_fold','the seated foundation'),
('Seated Forward Fold','Paschimottanasana','forward_fold','moderate','foundational','{hamstrings,spine}','none','{strap}','{low_back_injury}','static',60,NULL,'lengthen on the inhale, fold on the exhale','backbend','fold from the hips, not the back'),
('Bound Angle','Baddha Konasana','seated','gentle','foundational','{hips,groin}','none','{block}','{knee_injury}','static',60,NULL,'let the knees soften toward the floor','seated','open the hips with patience'),
('Pigeon','Eka Pada Rajakapotasana','seated','moderate','intermediate','{hips,hip_flexors}','none','{bolster}','{knee_injury}','static',60,NULL,'square the hips, breathe into the stretch','twist','deep hip release'),
-- Core
('Boat Pose','Navasana','core','strong','intermediate','{core,hip_flexors}','none','{}','{low_back_injury,pregnancy}','static',20,5,'lift the chest, draw the navel in','forward_fold','steady core, steady breath'),
('Forearm Plank','Phalakasana','core','strong','foundational','{core,shoulders}','arms','{}','{wrist_injury,low_back_injury}','static',20,5,'one long line, hips level','child','whole-body stability'),
-- Inversion (gentle)
('Legs Up the Wall','Viparita Karani','restorative','restorative','foundational','{nervous_system,legs}','none','{wall,bolster}','{glaucoma}','static',180,NULL,'let the breath slow all the way down','standing','deep downregulation'),
('Supported Shoulderstand','Salamba Sarvangasana','inversion','strong','advanced','{spine,nervous_system}','full','{blanket}','{neck_injury,high_blood_pressure,glaucoma,pregnancy}','static',30,NULL,'lift through the legs, soft neck','backbend','calming inversion, contraindication-sensitive'),
-- Restorative / close
('Reclined Bound Angle','Supta Baddha Konasana','restorative','restorative','foundational','{hips,chest,nervous_system}','none','{bolster,blanket}','{}','static',180,NULL,'let gravity do the work',NULL,'fully supported opening'),
('Corpse Pose','Savasana','restorative','restorative','foundational','{nervous_system}','none','{bolster,blanket}','{}','static',300,NULL,'complete stillness, natural breath',NULL,'integrate the practice');
