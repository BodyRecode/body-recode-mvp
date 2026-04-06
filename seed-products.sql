-- Seed default Body Recode products
-- Coach ID: df51918c-9d0b-4c06-b175-2efabe02af43

insert into be_products (coach_id, name, description, price, type, billing_interval, is_active) values
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'Coaching Commencement Fee', 'One-time entry fee to begin Performance Coaching', 240, 'one_time', null, true),
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'In-Person 2x', '2 in-person sessions per week', 299, 'subscription', 'weekly', true),
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'In-Person 3x', '3 in-person sessions per week', 409, 'subscription', 'weekly', true),
  ('df51918c-9d0b-4c06-b175-2efabe02af43', 'Online', 'Online coaching — full program, nutrition, and weekly synthesis', 149, 'subscription', 'weekly', true);
