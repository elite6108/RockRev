-- Create a health_checks table to track health check submissions
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fit_to_work BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS health_checks_email_idx ON health_checks(email);

-- Create a simple function to record a health check
CREATE OR REPLACE FUNCTION record_health_check(p_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Insert a new health check record
  INSERT INTO health_checks (email, completed_at, fit_to_work)
  VALUES (p_email, NOW(), TRUE);
  
  -- Try to update the workers table if it exists
  BEGIN
    -- Check if the workers table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers') THEN
      -- Check if the worker exists
      IF EXISTS (SELECT 1 FROM workers WHERE email = p_email) THEN
        -- Update the worker record
        UPDATE workers
        SET last_health_questionnaire = NOW()
        WHERE email = p_email;
      ELSE
        -- Insert a new worker record
        INSERT INTO workers (email, last_health_questionnaire)
        VALUES (p_email, NOW());
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore any errors when updating the workers table
    RAISE NOTICE 'Could not update workers table: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION record_health_check TO anon;

-- Grant access to the health_checks table
GRANT SELECT, INSERT ON health_checks TO authenticated;
GRANT SELECT, INSERT ON health_checks TO anon;
