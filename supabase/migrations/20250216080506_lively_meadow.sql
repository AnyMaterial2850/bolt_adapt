-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Add notification preferences to user_habits
ALTER TABLE user_habits
  ADD COLUMN notifications_enabled boolean DEFAULT true,
  ADD COLUMN notification_settings jsonb DEFAULT '{
    "reminder": true,
    "completion": true,
    "streak": true
  }'::jsonb;

-- Create function to validate notification settings
CREATE OR REPLACE FUNCTION validate_notification_settings(settings jsonb)
RETURNS boolean AS $$
BEGIN
  RETURN (
    settings ? 'reminder' AND
    settings ? 'completion' AND
    settings ? 'streak' AND
    jsonb_typeof(settings->'reminder') = 'boolean' AND
    jsonb_typeof(settings->'completion') = 'boolean' AND
    jsonb_typeof(settings->'streak') = 'boolean'
  );
END;
$$ LANGUAGE plpgsql;

-- Add constraint for notification settings validation
ALTER TABLE user_habits
  ADD CONSTRAINT valid_notification_settings
  CHECK (validate_notification_settings(notification_settings));

-- Add indexes
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions(user_id);
CREATE INDEX user_habits_notifications_enabled_idx ON user_habits(notifications_enabled);

-- Add helpful comments
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for users';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Push subscription details from the browser';
COMMENT ON COLUMN user_habits.notifications_enabled IS 'Whether notifications are enabled for this habit';
COMMENT ON COLUMN user_habits.notification_settings IS 'Detailed notification preferences for this habit';