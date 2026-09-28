/*
# Fix token_hash type comparison in session functions

1. Modified Functions
- app_validate_session, app_logout: compare token_hash (text) with encode(digest(...),'hex')
  instead of raw bytea digest, avoiding text = bytea operator error.
2. Notes
- Data unchanged; sessions stored earlier remain valid.
*/

CREATE OR REPLACE FUNCTION app_validate_session(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN false;
  END IF;
  UPDATE app_login_sessions
    SET last_used_at = now()
    WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex') AND expires_at > now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION app_logout(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM app_login_sessions WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex');
END;
$$;
