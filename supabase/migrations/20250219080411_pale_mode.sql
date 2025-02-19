-- Create analytics_config table
CREATE TABLE analytics_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view analytics config"
  ON analytics_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify analytics config"
  ON analytics_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create function to update config
CREATE OR REPLACE FUNCTION update_analytics_config(
  p_key text,
  p_value jsonb,
  p_description text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_config (key, value, description, updated_by)
  VALUES (p_key, p_value, p_description, auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Insert default configurations
INSERT INTO analytics_config (key, value, description) VALUES
  (
    'analysis_periods',
    '[
      {"days": 30, "label": "30 Days", "is_default": true},
      {"days": 60, "label": "60 Days"},
      {"days": 90, "label": "90 Days"}
    ]'::jsonb,
    'Available analysis periods for analytics calculations'
  ),
  (
    'performance_thresholds',
    '{
      "excellent": 90,
      "good": 75,
      "fair": 50,
      "poor": 25
    }'::jsonb,
    'Performance threshold definitions'
  ),
  (
    'seasonal_definitions',
    '{
      "winter": {"start_month": 12, "end_month": 2},
      "spring": {"start_month": 3, "end_month": 5},
      "summer": {"start_month": 6, "end_month": 8},
      "fall": {"start_month": 9, "end_month": 11}
    }'::jsonb,
    'Seasonal period definitions'
  ),
  (
    'scoring_weights',
    '{
      "completion": 0.6,
      "consistency": 0.3,
      "trend": 0.1
    }'::jsonb,
    'Weights used in scoring calculations'
  );

-- Create indexes
CREATE INDEX analytics_config_key_idx ON analytics_config(key);
CREATE INDEX analytics_config_updated_at_idx ON analytics_config(updated_at);

-- Add helpful comments
COMMENT ON TABLE analytics_config IS 'Stores configuration parameters for analytics calculations';
COMMENT ON COLUMN analytics_config.key IS 'Unique identifier for the configuration';
COMMENT ON COLUMN analytics_config.value IS 'Configuration value in JSON format';
COMMENT ON COLUMN analytics_config.description IS 'Human-readable description of the configuration';
COMMENT ON COLUMN analytics_config.updated_by IS 'User ID who last updated the configuration';