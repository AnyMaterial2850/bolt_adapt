/*
  # Add profile fields and weight tracking

  1. New Fields
    - Add first_name and last_name to profiles
    - Add date_of_birth to profiles
    - Add mobile_number to profiles
    - Add mobile_country_code to profiles

  2. New Table
    - Create weight_entries table for tracking weight history
    - Add RLS policies for weight entries
    
  3. Indexes
    - Add indexes for efficient querying
*/

-- Add new fields to profiles table
ALTER TABLE profiles
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN date_of_birth date,
  ADD COLUMN mobile_number text,
  ADD COLUMN mobile_country_code text,
  ADD COLUMN preferred_weight_unit text DEFAULT 'kg' CHECK (preferred_weight_unit IN ('kg', 'lbs'));

-- Create weight_entries table
CREATE TABLE weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  weight numeric(5,2) NOT NULL CHECK (weight > 0),
  unit text NOT NULL CHECK (unit IN ('kg', 'lbs')),
  recorded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for weight_entries
CREATE POLICY "Users can view their own weight entries"
  ON weight_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own weight entries"
  ON weight_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weight entries"
  ON weight_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own weight entries"
  ON weight_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX weight_entries_user_id_recorded_at_idx ON weight_entries(user_id, recorded_at DESC);

-- Add helpful comments
COMMENT ON TABLE weight_entries IS 'Stores user weight measurements over time';
COMMENT ON COLUMN weight_entries.weight IS 'Weight value in the specified unit';
COMMENT ON COLUMN weight_entries.unit IS 'Unit of measurement (kg or lbs)';
COMMENT ON COLUMN weight_entries.notes IS 'Optional notes about the weight entry';
COMMENT ON COLUMN profiles.preferred_weight_unit IS 'User''s preferred weight unit (kg or lbs)';