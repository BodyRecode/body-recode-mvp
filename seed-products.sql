-- Seed default Body Recode products
-- Coach ID: df51918c-9d0b-4c06-b175-2efabe02af43

insert into be_products (coach_id, name, description, price, type, billing_interval, is_active) values
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'Coaching Commencement Fee', 'One-time entry fee to begin Performance Coaching', 497, 'one_time', null, true),
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'Weekly Coaching 2x', '2 sessions per week', 200, 'subscription', 'weekly', true),
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'Weekly Coaching 3x', '3 sessions per week', 280, 'subscription', 'weekly', true);
