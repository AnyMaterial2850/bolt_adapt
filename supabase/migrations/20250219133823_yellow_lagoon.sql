-- Add target weight column to profiles table
ALTER TABLE profiles
  ADD COLUMN target_weight numeric(5,2) CHECK (target_weight > 0);

-- Add helpful comment
COMMENT ON COLUMN profiles.target_weight IS 'User''s target weight in their preferred unit (kg or lbs)';