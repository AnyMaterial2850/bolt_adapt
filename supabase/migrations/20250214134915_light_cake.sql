/*
  # Add timestamp tracking for habit interactions

  1. Changes
    - Add selected_at timestamp to user_habits table to track when users select habits
    - Add last_interaction_at timestamp to user_habits table to track updates
    - Add last_completion_at timestamp to habit_completions table
*/

-- Add tracking columns to user_habits
ALTER TABLE user_habits 
  ADD COLUMN IF NOT EXISTS selected_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz DEFAULT now();

-- Add tracking column to habit_completions
ALTER TABLE habit_completions
  ADD COLUMN IF NOT EXISTS last_completion_at timestamptz DEFAULT now();

-- Create function to update last_interaction_at
CREATE OR REPLACE FUNCTION update_user_habit_last_interaction()
RETURNS trigger AS $$
BEGIN
  NEW.last_interaction_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_interaction_at
DROP TRIGGER IF EXISTS update_user_habit_last_interaction_trigger ON user_habits;
CREATE TRIGGER update_user_habit_last_interaction_trigger
  BEFORE UPDATE ON user_habits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_habit_last_interaction();

-- Create function to update last_completion_at
CREATE OR REPLACE FUNCTION update_habit_completion_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.last_completion_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_completion_at
DROP TRIGGER IF EXISTS update_habit_completion_timestamp_trigger ON habit_completions;
CREATE TRIGGER update_habit_completion_timestamp_trigger
  BEFORE UPDATE ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_completion_timestamp();

-- Add indexes for timestamp columns
CREATE INDEX IF NOT EXISTS idx_user_habits_selected_at ON user_habits(selected_at);
CREATE INDEX IF NOT EXISTS idx_user_habits_last_interaction_at ON user_habits(last_interaction_at);
CREATE INDEX IF NOT EXISTS idx_habit_completions_last_completion_at ON habit_completions(last_completion_at);