-- Storage for the training environment and competition answers added on
-- 19 September 2026 from research pass E1b.
--
-- One JSON column rather than eighteen columns: these answers are read
-- together, as context for fluid, heat and competition wording, and adding a
-- column per question would mean a migration every time the research adds one.
-- The hormonal status answers stay as their own columns because individual
-- ones are queried and alerted on; these are not.
--
-- Hidden answers are never stored, the same rule the hormonal section follows:
-- a client who says they compete, answers the show questions, then changes to
-- "No" must not be left with a federation on file.

alter table intakes add column if not exists training_context jsonb;

comment on column intakes.training_context is
  'Training environment, heat exposure and physique competition answers (tr_ and cp_ prefixed, non-scale). Research pass E1b, 19 Sep 2026. Only questions visible under the answers given are stored.';
