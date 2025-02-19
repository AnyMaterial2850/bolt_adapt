/*
  # Fix habit completion time tracking

  1. Changes
    - Rename time column to event_time in habit_completions table
    - Update indexes and constraints
    - Add reminder_time column for tracking reminder times
  
  2. Security
    - Maintains existing RLS policies
*/

-- Rename time column to event_time
ALTER TABLE habit_completions RENAME COLUMN time TO event_time;

-- Add reminder_time column
ALTER TABLE habit_completions ADD COLUMN reminder_time time;

-- Drop existing unique constraint
ALTER TABLE habit_completions 
  DROP CONSTRAINT IF EXISTS habit_completions_user_habit_id_date_time_key;

-- Add new unique constraint
ALTER TABLE habit_completions 
  ADD CONSTRAINT habit_completions_user_habit_id_date_event_time_key 
  UNIQUE (user_habit_id, date, event_time);

-- Drop existing index
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_time_idx;

-- Create new index
CREATE INDEX habit_completions_user_habit_id_date_event_time_idx 
  ON habit_completions(user_habit_id, date, event_time);