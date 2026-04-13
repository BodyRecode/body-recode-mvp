-- Add training_days_available column to intakes table
-- Stores the days of the week the client is available to train
-- e.g. ['Monday', 'Tuesday', 'Thursday', 'Saturday']
alter table intakes
  add column if not exists training_days_available text[] default '{}';
