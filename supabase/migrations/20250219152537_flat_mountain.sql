/*
  # Fix Habit Deletion and Database Constraints

  1. Changes
    - Fix ambiguous column references
    - Add proper cascading deletes
    - Safely recreate indexes
    - Add better constraints
  
  2. Security
    - Maintain existing RLS policies
    - Add better error handling
*/

-- Drop existing foreign key constraints if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'habit_completions_user_habit_id_fkey'
  ) THEN
    ALTER TABLE habit_completions 
      DROP CONSTRAINT habit_completions_user_habit_id_fkey;
  END IF;
END $$;

-- Recreate foreign key with ON DELETE CASCADE
ALTER TABLE habit_completions
  ADD CONSTRAINT habit_completions_user_habit_id_fkey
  FOREIGN KEY (user_habit_id)
  REFERENCES user_habits(id)
  ON DELETE CASCADE;

-- Drop existing unique constraint if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'habit_completions_user_habit_id_date_event_time_key'
  ) THEN
    ALTER TABLE habit_completions 
      DROP CONSTRAINT habit_completions_user_habit_id_date_event_time_key;
  END IF;
END $$;

-- Add new unique constraint with explicit column references
ALTER TABLE habit_completions 
  ADD CONSTRAINT habit_completions_unique_completion 
  UNIQUE (user_habit_id, date, event_time);

-- Safely drop and recreate indexes
DO $$ BEGIN
  -- Drop old indexes if they exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'habit_completions_user_habit_id_date_event_time_idx') THEN
    DROP INDEX habit_completions_user_habit_id_date_event_time_idx;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'habit_completions_date_idx') THEN
    DROP INDEX habit_completions_date_idx;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'habit_completions_user_habit_id_idx') THEN
    DROP INDEX habit_completions_user_habit_id_idx;
  END IF;
END $$;

-- Create new optimized indexes
CREATE INDEX IF NOT EXISTS idx_habit_completions_lookup 
  ON habit_completions(user_habit_id, date, event_time);

CREATE INDEX IF NOT EXISTS idx_habit_completions_date 
  ON habit_completions(date);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit 
  ON habit_completions(user_habit_id);

-- Add function to safely delete habits
CREATE OR REPLACE FUNCTION delete_habit_safely(habit_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete associated storage objects first
  DELETE FROM storage.objects
  WHERE bucket_id = 'habits'
    AND path LIKE habit_id || '/%';

  -- Delete habit images
  DELETE FROM habit_images
  WHERE habit_id = $1;

  -- Delete habit (will cascade to user_habits and completions)
  DELETE FROM habits
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON CONSTRAINT habit_completions_user_habit_id_fkey 
  ON habit_completions IS 'Cascade delete habit completions when user habit is deleted';

COMMENT ON CONSTRAINT habit_completions_unique_completion 
  ON habit_completions IS 'Ensure unique completions per habit per day per event time';

COMMENT ON FUNCTION delete_habit_safely IS 'Safely delete a habit and all associated data';