-- Create functions for settings management that bypass schema cache issues
CREATE OR REPLACE FUNCTION save_setting(p_key text, p_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO settings (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) 
  DO UPDATE SET value = p_value, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION get_setting(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT value INTO result FROM settings WHERE key = p_key;
  RETURN result;
END;
$$;

-- Force PostgREST to recognize new tables by commenting on them
COMMENT ON TABLE settings IS 'Application settings storage';
COMMENT ON FUNCTION save_setting(text, jsonb) IS 'Save a setting value';
COMMENT ON FUNCTION get_setting(text) IS 'Get a setting value';