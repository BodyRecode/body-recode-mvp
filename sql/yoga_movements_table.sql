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
('Forearm Plank','Phalakasana','core','strong','foundational','{core,shoulders}','arms','{}','{wrist_injury,low_back_injury}','static',20,5,'one long line, hips level','restorative','whole-body stability'),
-- Inversion (gentle)
('Legs Up the Wall','Viparita Karani','restorative','restorative','foundational','{nervous_system,legs}','none','{wall,bolster}','{glaucoma}','static',180,NULL,'let the breath slow all the way down','standing','deep downregulation'),
('Supported Shoulderstand','Salamba Sarvangasana','inversion','strong','advanced','{spine,nervous_system}','full','{blanket}','{neck_injury,high_blood_pressure,glaucoma,pregnancy}','static',30,NULL,'lift through the legs, soft neck','backbend','calming inversion, contraindication-sensitive'),
-- Restorative / close
('Reclined Bound Angle','Supta Baddha Konasana','restorative','restorative','foundational','{hips,chest,nervous_system}','none','{bolster,blanket}','{}','static',180,NULL,'let gravity do the work',NULL,'fully supported opening'),
('Corpse Pose','Savasana','restorative','restorative','foundational','{nervous_system}','none','{bolster,blanket}','{}','static',300,NULL,'complete stillness, natural breath',NULL,'integrate the practice');

-- ---------- Expansion seed (v1.1): broader working repertoire ----------
INSERT INTO yoga_movements
  (name, sanskrit_name, family, intensity, level, target_regions, weight_bearing, props, contraindications, hold_style, default_hold_seconds, default_breaths, breath_cue, counterpose_family, cue)
VALUES
-- Breath / pranayama
('Alternate Nostril Breath','Nadi Shodhana','pranayama','restorative','foundational','{nervous_system}','none','{}','{}','static',120,NULL,'balance the breath side to side',NULL,'calm and centre the mind'),
('Extended Exhale Breath','Vishama Vritti','pranayama','restorative','foundational','{nervous_system}','none','{}','{}','static',90,NULL,'make the exhale longer than the inhale',NULL,'downshift the nervous system'),
('Box Breath','Sama Vritti','pranayama','gentle','foundational','{nervous_system}','none','{}','{}','static',90,NULL,'equal inhale, hold, exhale, hold',NULL,'a steady, square breath'),
-- Sun salutation components
('Half Lift','Ardha Uttanasana','forward_fold','gentle','foundational','{spine,hamstrings}','legs','{block}','{low_back_injury}','dynamic',NULL,1,'inhale to a long flat back','forward_fold','lengthen the spine'),
('Low Lunge','Anjaneyasana','standing','moderate','foundational','{hip_flexors,legs}','legs','{}','{knee_injury}','static',30,5,'sink the hips, lift the chest','forward_fold','open the front of the hip'),
('High Lunge','Ashta Chandrasana','standing','strong','foundational','{legs,hip_flexors}','legs','{}','{}','static',30,5,'back leg strong, front knee over ankle','forward_fold','strength and length'),
('Plank','Phalakasana Full','core','strong','foundational','{core,shoulders}','arms','{}','{wrist_injury}','static',20,5,'one long line from heels to crown','restorative','whole-body tension'),
('Four-Limbed Staff','Chaturanga Dandasana','core','strong','intermediate','{core,shoulders,arms}','arms','{}','{wrist_injury,shoulder_injury}','dynamic',NULL,1,'lower halfway, elbows hugging in','backbend','control the descent'),
('Upward Dog','Urdhva Mukha Svanasana','backbend','moderate','intermediate','{spine,chest}','arms','{}','{low_back_injury,wrist_injury}','dynamic',NULL,1,'open the chest, thighs lifted','forward_fold','lift through the heart'),
('Sun Salutation B','Surya Namaskar B','sun_salutation','strong','intermediate','{full_body}','full','{}','{wrist_injury,high_blood_pressure}','dynamic',NULL,1,'chair, lunge, build the heat',NULL,'a stronger warming flow'),
-- Standing
('Extended Side Angle','Utthita Parsvakonasana','standing','strong','foundational','{hips,legs,side_body}','legs','{block}','{}','static',30,5,'one long line from heel to hand','twist','length along the whole side'),
('Reverse Warrior','Viparita Virabhadrasana','standing','moderate','foundational','{side_body,legs}','legs','{}','{}','static',20,5,'reach up and back, legs strong','side_bend','open the side body'),
('Pyramid Pose','Parsvottanasana','standing','moderate','intermediate','{hamstrings,hips}','legs','{block}','{low_back_injury}','static',30,5,'square the hips, fold with a long spine','backbend','length over depth'),
('Wide-Leg Forward Fold','Prasarita Padottanasana','forward_fold','moderate','foundational','{hamstrings,spine}','legs','{block}','{low_back_injury}','static',45,NULL,'hinge from the hips, crown down','backbend','a calming standing fold'),
('Goddess Pose','Utkata Konasana','standing','strong','foundational','{hips,legs}','legs','{}','{knee_injury}','static',30,5,'sink low, knees over the toes','standing','strong and grounded'),
('Gate Pose','Parighasana','kneeling','gentle','foundational','{side_body,hips}','legs','{}','{knee_injury}','static',30,5,'lengthen the top side over the leg','side_bend','open the side waist'),
('Standing Side Bend','Parsva Tadasana','side_bend','gentle','foundational','{side_body,spine}','legs','{}','{}','static',20,NULL,'reach up and over, feet grounded','side_bend','length through the side body'),
-- Balance
('Half Moon','Ardha Chandrasana','balance','strong','intermediate','{legs,core,hips}','legs','{block}','{}','static',20,NULL,'stack the hips, open the chest','standing','balance, strength, openness'),
('Warrior III','Virabhadrasana III','balance','strong','intermediate','{legs,core,back}','legs','{block}','{}','static',20,NULL,'reach forward and back, one long line','standing','steady, level, strong'),
('Dancer Pose','Natarajasana','balance','strong','advanced','{legs,chest,shoulders}','legs','{strap}','{low_back_injury}','static',20,NULL,'kick into the hand, lift the chest','forward_fold','grace and backbend together'),
('Crow Pose','Bakasana','balance','strong','advanced','{core,arms}','arms','{}','{wrist_injury,pregnancy}','static',15,NULL,'knees high on the arms, gaze forward','restorative','arm balance, gaze and core'),
('Standing Hand-to-Big-Toe','Utthita Hasta Padangusthasana','balance','strong','advanced','{hamstrings,core}','legs','{strap}','{}','static',20,NULL,'extend the lifted leg, steady gaze','standing','balance with a long leg'),
-- Backbend
('Locust Pose','Salabhasana','backbend','moderate','foundational','{spine,back}','full','{}','{low_back_injury,pregnancy}','static',20,5,'lift the chest and legs, lengthen','forward_fold','strengthen the back body'),
('Bow Pose','Dhanurasana','backbend','strong','intermediate','{spine,chest,hip_flexors}','full','{}','{low_back_injury,neck_injury,pregnancy}','static',20,5,'kick into the hands, lift and open','forward_fold','a fuller heart opener'),
('Sphinx Pose','Salamba Bhujangasana','backbend','gentle','foundational','{spine}','full','{}','{low_back_injury}','static',45,NULL,'forearms down, lengthen the low back','restorative','a gentle supported backbend'),
('Wheel Pose','Urdhva Dhanurasana','backbend','strong','advanced','{spine,chest,shoulders}','full','{}','{low_back_injury,neck_injury,high_blood_pressure,wrist_injury}','static',15,5,'press evenly, lift the front body','forward_fold','a deep backbend, approach with care'),
('Fish Pose','Matsyasana','backbend','moderate','intermediate','{chest,spine}','full','{bolster}','{neck_injury}','static',30,5,'open the chest, soften the throat','forward_fold','counter to shoulderstand'),
-- Twist
('Revolved Lunge','Parivrtta Anjaneyasana','twist','strong','intermediate','{spine,hips}','legs','{}','{pregnancy}','static',20,5,'lengthen then revolve from the navel','standing','a twisting lunge'),
('Revolved Triangle','Parivrtta Trikonasana','twist','strong','advanced','{spine,hamstrings}','legs','{block}','{pregnancy,low_back_injury}','static',20,5,'square the hips, twist with a long spine','forward_fold','length and rotation'),
('Revolved Chair','Parivrtta Utkatasana','twist','strong','intermediate','{spine,legs}','legs','{}','{pregnancy}','static',20,5,'hook the elbow, lift the chest','standing','a strong standing twist'),
('Marichi Twist','Marichyasana C','twist','moderate','intermediate','{spine,hips}','none','{}','{pregnancy}','static',30,5,'sit tall, wrap and revolve','seated','a seated bind and twist'),
-- Forward fold / seated / hips
('Head-to-Knee Pose','Janu Sirsasana','forward_fold','moderate','foundational','{hamstrings,spine}','none','{strap}','{low_back_injury}','static',45,NULL,'lengthen over the straight leg','backbend','a calming seated fold'),
('Seated Wide-Angle Fold','Upavistha Konasana','forward_fold','moderate','intermediate','{hamstrings,hips}','none','{bolster}','{low_back_injury}','static',60,NULL,'walk the hands forward, long spine','backbend','open hips and hamstrings'),
('Cow Face Pose','Gomukhasana','seated','moderate','intermediate','{shoulders,hips}','none','{strap}','{shoulder_injury,knee_injury}','static',45,NULL,'stack the knees, open the chest','seated','shoulders and hips together'),
('Hero Pose','Virasana','seated','gentle','foundational','{quadriceps}','none','{block}','{knee_injury}','static',60,NULL,'sit tall between the heels','kneeling','a tall kneeling seat'),
('Fire Log Pose','Agnistambhasana','seated','moderate','intermediate','{hips}','none','{bolster}','{knee_injury}','static',60,NULL,'stack the shins, fold to deepen','seated','a deep outer-hip opener'),
('Easy Seat','Sukhasana','seated','restorative','foundational','{hips,spine}','none','{bolster}','{}','static',60,NULL,'sit tall, soften the shoulders','seated','a simple grounded seat'),
('Lizard Pose','Utthan Pristhasana','seated','moderate','intermediate','{hip_flexors,hips}','legs','{block}','{knee_injury}','static',45,NULL,'sink the hips, breathe in','twist','a deep low hip opener'),
('Garland Pose','Malasana','seated','gentle','foundational','{hips,groin,ankles}','legs','{block}','{knee_injury}','static',45,NULL,'sink the hips, press elbows to knees','standing','a grounding deep squat'),
('Frog Pose','Mandukasana','seated','strong','advanced','{hips,groin}','none','{bolster}','{knee_injury}','static',60,NULL,'widen the knees slowly, breathe','seated','an intense hip opener, go slow'),
-- Kneeling / supine
('Puppy Pose','Uttana Shishosana','kneeling','gentle','foundational','{shoulders,spine}','arms','{bolster}','{shoulder_injury}','static',45,NULL,'walk the hands forward, melt the chest','restorative','heart-opening on the floor'),
('Happy Baby','Ananda Balasana','supine','gentle','foundational','{hips,low_back}','none','{}','{pregnancy}','static',45,NULL,'hold the feet, rock gently','supine','release the low back and hips'),
('Knees-to-Chest','Apanasana','supine','restorative','foundational','{low_back}','none','{}','{}','static',30,NULL,'hug the knees, soften the back','backbend','soothe the low back'),
('Reclined Hand-to-Big-Toe','Supta Padangusthasana','supine','gentle','foundational','{hamstrings}','none','{strap}','{}','static',45,NULL,'extend the leg with a strap','supine','a supported hamstring stretch'),
('Reclined Twist Restorative','Supta Jathara Parivartanasana','restorative','restorative','foundational','{spine,hips}','none','{bolster}','{}','static',90,NULL,'let the knees fall, fully supported','supine','a long, supported unwind'),
-- Core / inversion
('Side Plank','Vasisthasana','core','strong','intermediate','{core,shoulders}','arms','{}','{wrist_injury,shoulder_injury}','static',20,NULL,'stack or stagger the feet, lift the hips','restorative','lateral strength and balance'),
('Dolphin Pose','Ardha Pincha Mayurasana','inversion','strong','intermediate','{shoulders,core}','arms','{}','{shoulder_injury,high_blood_pressure}','static',30,5,'forearms down, lift the hips high','restorative','build toward inversions safely'),
('Plow Pose','Halasana','inversion','strong','advanced','{spine,shoulders}','full','{blanket}','{neck_injury,high_blood_pressure,pregnancy,glaucoma}','static',30,NULL,'feet overhead, protect the neck','backbend','calming but neck-sensitive'),
('Headstand','Sirsasana','inversion','strong','advanced','{shoulders,core}','arms','{wall}','{neck_injury,high_blood_pressure,glaucoma,pregnancy}','static',30,NULL,'weight in the forearms, not the head','restorative','advanced only, contraindication-sensitive'),
-- Restorative / close
('Supported Childs Pose','Salamba Balasana','restorative','restorative','foundational','{spine,hips}','none','{bolster,blanket}','{knee_injury}','static',180,NULL,'rest the torso on the bolster','backbend','fully supported rest'),
('Supported Fish','Salamba Matsyasana','restorative','restorative','foundational','{chest,spine}','none','{bolster}','{}','static',180,NULL,'let the chest drape open','forward_fold','a passive heart opener'),
('Supported Bridge','Salamba Setu Bandha','restorative','restorative','foundational','{spine,hips}','none','{block}','{neck_injury}','static',180,NULL,'rest the sacrum on the block','forward_fold','a gentle supported backbend'),
('Constructive Rest','Savasana Variation','restorative','restorative','foundational','{low_back,nervous_system}','none','{}','{}','static',180,NULL,'feet wide, knees together, soften','restorative','release the low back'),
('Supported Forward Fold','Salamba Paschimottanasana','restorative','restorative','foundational','{spine,hamstrings}','none','{bolster}','{}','static',180,NULL,'rest the torso forward on support','backbend','a calming supported fold'),
('Seated Side Bend','Parsva Sukhasana','side_bend','gentle','foundational','{side_body,spine}','none','{}','{}','static',30,NULL,'reach over, lengthen the waist','side_bend','open the side body seated');
