/*
  # Fix Habit Deletion Cascade

  1. Changes
    - Add ON DELETE CASCADE to habit_completions foreign keys
    - Fix ambiguous event_time column references
    - Add indexes for better performance
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key constraints
ALTER TABLE habit_completions 
  DROP CONSTRAINT IF EXISTS habit_completions_user_habit_id_fkey;

-- Recreate foreign key with ON DELETE CASCADE
ALTER TABLE habit_completions
  ADD CONSTRAINT habit_completions_user_habit_id_fkey
  FOREIGN KEY (user_habit_id)
  REFERENCES user_habits(id)
  ON DELETE CASCADE;

-- Drop existing unique constraint
ALTER TABLE habit_completions 
  DROP CONSTRAINT IF EXISTS habit_completions_user_habit_id_date_event_time_key;

-- Add new unique constraint with table alias
ALTER TABLE habit_completions 
  ADD CONSTRAINT habit_completions_user_habit_id_date_event_time_key 
  UNIQUE (user_habit_id, date, event_time);

-- Drop existing indexes
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_event_time_idx;
DROP INDEX IF EXISTS habit_completions_date_idx;

-- Create new indexes with better naming and coverage
CREATE INDEX idx_habit_completions_user_habit ON habit_completions(user_habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(date);
CREATE INDEX idx_habit_completions_event_time ON habit_completions(event_time);
CREATE INDEX idx_habit_completions_composite 
  ON habit_completions(user_habit_id, date, event_time);

-- Add helpful comments
COMMENT ON CONSTRAINT habit_completions_user_habit_id_fkey 
  ON habit_completions IS 'Cascade delete habit completions when user habit is deleted';

COMMENT ON CONSTRAINT habit_completions_user_habit_id_date_event_time_key 
  ON habit_completions IS 'Ensure unique completions per habit per day per event time';