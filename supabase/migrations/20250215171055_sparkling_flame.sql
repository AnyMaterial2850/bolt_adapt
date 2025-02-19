-- Create test table for connection checks
CREATE TABLE IF NOT EXISTS test_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view
CREATE POLICY "Authenticated users can view test table"
  ON test_table FOR SELECT
  TO authenticated
  USING (true);

-- Add test data
INSERT INTO test_table (name) VALUES ('Test Entry 1'), ('Test Entry 2');

-- Add helpful comment
COMMENT ON TABLE test_table IS 'Test table to verify database connectivity';