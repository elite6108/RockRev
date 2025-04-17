-- Create functions to handle site check-in and check-out
-- These functions will bypass RLS policies

-- Function to create a site log entry (check-in)
CREATE OR REPLACE FUNCTION create_site_log(
  p_site_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_company TEXT,
  p_email TEXT,
  p_fit_to_work BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO site_logs (
    site_id,
    full_name,
    phone,
    company,
    email,
    fit_to_work,
    logged_in_at
  ) VALUES (
    p_site_id,
    p_full_name,
    p_phone,
    p_company,
    p_email,
    p_fit_to_work,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a site log entry for check-out
CREATE OR REPLACE FUNCTION update_site_log_checkout(
  p_log_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE site_logs
  SET logged_out_at = NOW()
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION create_site_log TO authenticated;
GRANT EXECUTE ON FUNCTION create_site_log TO anon;
GRANT EXECUTE ON FUNCTION update_site_log_checkout TO authenticated;
GRANT EXECUTE ON FUNCTION update_site_log_checkout TO anon;
