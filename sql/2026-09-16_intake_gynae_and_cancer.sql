-- Two things the intake never asked, both written by a client.
--
-- Kimberly Hamilton wrote in after completing her intake on 16 Sep 2026. She
-- has had a hysterectomy with one ovary kept. The form reached that sideways,
-- through a question about periods, then asked a woman with no uterus whether
-- she was pregnant, and it could not record ONE ovary, which is the difference
-- between a normal hormonal picture and reduced reserve with an earlier
-- menopause. It also asked nothing about cancer anywhere, so hormone-blocking
-- treatment, ovaries stopped by treatment, and the effect on what a body
-- tolerates in training were all invisible to the read.
--
-- The hormonal section saves by question id, so these three columns are all
-- the storage the new questions need.

alter table intakes
  add column if not exists gynae_surgery text,
  add column if not exists cancer_history text,
  add column if not exists cancer_hormonal_effect text;

comment on column intakes.gynae_surgery is
  'Hysterectomy or ovarian surgery, asked directly. Distinguishes uterus removed with both ovaries, with one ovary, and with both ovaries removed, because each is a different hormonal picture. Suggested by the client whose situation the old wording could not hold.';

comment on column intakes.cancer_history is
  'Cancer diagnosis and where they are with treatment. Deliberately not a history: the detail stays with the coach in private. Asked because treatment can stop the ovaries and changes exercise tolerance.';

comment on column intakes.cancer_hormonal_effect is
  'Whether the cancer or its treatment affected their hormones, as the client understands it. Shown only when cancer_history is a yes.';
