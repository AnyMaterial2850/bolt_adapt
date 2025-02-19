/*
  # Add time column to habit_completions table

  1. Changes
    - Add time column to habit_completions table
    - Update unique constraint to include time
    - Update index to include time field
*/

-- Add time column
ALTER TABLE habit_completions ADD COLUMN IF NOT EXISTS time time;

-- Drop existing unique constraint
ALTER TABLE habit_completions 
  DROP CONSTRAINT IF EXISTS habit_completions_user_habit_id_date_key;

-- Add new unique constraint including time
ALTER TABLE habit_completions 
  ADD CONSTRAINT habit_completions_user_habit_id_date_time_key 
  UNIQUE (user_habit_id, date, time);

-- Drop existing index
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_idx;

-- Create new index including time
CREATE INDEX habit_completions_user_habit_id_date_time_idx 
  ON habit_completions(user_habit_id, date, time);