-- Add sex field to profiles table
ALTER TABLE profiles
  ADD COLUMN sex text CHECK (sex IN ('male', 'female'));

-- Add helpful comment
COMMENT ON COLUMN profiles.sex IS 'Biological sex (male/female) used for hydration target calculations';