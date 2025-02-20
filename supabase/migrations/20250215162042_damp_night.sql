-- Add owner_id column to habits table
ALTER TABLE habits
  ADD COLUMN owner_id uuid REFERENCES profiles(id);

-- First ensure there's at least one admin user in auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Try to find existing admin
  SELECT id INTO admin_user_id FROM profiles WHERE is_admin = true LIMIT 1;
  
  -- If no admin exists, create one
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users first
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000000', 'system.admin@example.com')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO admin_user_id;

    -- Then create profile
    INSERT INTO profiles (id, email, is_admin)
    VALUES (
      admin_user_id,
      'system.admin@example.com',
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Set existing habits to be owned by the first admin user
UPDATE habits
SET owner_id = (
  SELECT id FROM profiles WHERE is_admin = true LIMIT 1
)
WHERE owner_id IS NULL;

-- Verify no null owner_ids remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM habits WHERE owner_id IS NULL) THEN
    RAISE EXCEPTION 'Some habits still have null owner_id values';
  END IF;
END $$;

-- Make owner_id required for future records
ALTER TABLE habits
  ALTER COLUMN owner_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view habits" ON habits;
DROP POLICY IF EXISTS "Only admins can modify habits" ON habits;

-- Create new policies
CREATE POLICY "Authenticated users can view habits"
  ON habits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and admins can update their habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Owners and admins can delete their habits"
  ON habits FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can create habits they own"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add index for faster lookups
CREATE INDEX habits_owner_id_idx ON habits(owner_id);

-- Add helpful comments
COMMENT ON COLUMN habits.owner_id IS 'User ID of the habit owner. System habits are owned by admin users.';