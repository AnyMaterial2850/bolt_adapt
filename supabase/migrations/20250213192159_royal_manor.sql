/*
  # Add test user habits

  1. Changes
    - Insert test user habits for the current user
    - Links existing habits to the user
*/

-- Function to create user habits for a specific user
CREATE OR REPLACE FUNCTION create_user_habits_for_user(user_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Create user habits for all existing habits
  INSERT INTO user_habits (user_id, habit_id, frequency_per_day, active)
  SELECT 
    user_uuid,
    habits.id,
    1,  -- default frequency
    false -- default to inactive
  FROM habits
  WHERE NOT EXISTS (
    SELECT 1 FROM user_habits
    WHERE user_habits.user_id = user_uuid
    AND user_habits.habit_id = habits.id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create user habits for new users
CREATE OR REPLACE FUNCTION create_user_habits_on_profile_create()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_user_habits_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_habits_for_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_habits_on_profile_create();

-- Create user habits for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles
  LOOP
    PERFORM create_user_habits_for_user(user_record.id);
  END LOOP;
END $$;