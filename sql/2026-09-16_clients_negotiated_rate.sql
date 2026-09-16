-- Per-client negotiated coaching rate.
--
-- Kade, 16 Sep 2026: he offered Komang three sessions a week at $205 instead of
-- the $225 list price, and there was no way to send her that. Package links are
-- fixed per package, so Send / Copy / Schedule on her profile would all have
-- charged $225, and her profile would have displayed $225 whatever she paid.
--
-- This is the gap flagged on 26 Aug when the list was repriced: NOBODY HAS EVER
-- PAID A LIST PRICE. Greg pays $225 for 3x, and that only looks right because
-- his negotiated rate happens to equal the new list price. Off-platform MRR
-- reads the package price, so any client on an off-list number reported wrong.
--
-- Nullable on purpose: no rate set means the package price, exactly as before.

alter table clients
  add column if not exists negotiated_weekly_price_cents integer,
  add column if not exists negotiated_stripe_link text,
  add column if not exists negotiated_rate_set_at timestamptz;

comment on column clients.negotiated_weekly_price_cents is
  'What this client actually pays per week, in cents, when it differs from their package list price. Null means they pay the list price. Drives the profile display, the subscription link that is sent, and off-platform MRR.';

comment on column clients.negotiated_stripe_link is
  'Stripe payment link created for this client at their negotiated rate, against the same product as their package so reporting stays continuous. Sent instead of the package link.';

comment on column clients.negotiated_rate_set_at is
  'When the negotiated rate was last set, for the audit trail on a price nobody else pays.';
