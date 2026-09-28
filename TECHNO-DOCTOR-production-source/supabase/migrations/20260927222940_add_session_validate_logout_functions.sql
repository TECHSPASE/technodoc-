/*
# Add session validation and logout functions

1. New Functions
- `app_validate_session(p_token text)` — returns true if the session token is valid and not expired; touches last_used_at.
- `app_logout(p_token text)` — deletes the session (logout).
2. Security
- Both are SECURITY DEFINER with fixed search_path; EXECUTE revoked from public/anon.
- Edge functions call them with the service role, which is unaffected by grants, but revocation
  prevents any direct client calls.
*/

CREATE OR REPLACE FUNCTION app_validate_session(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN false;
  END IF;
  UPDATE app_login_sessions
    SET last_used_at = now()
    WHERE token_hash = digest(p_token, 'sha256') AND expires_at > now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION app_logout(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM app_login_sessions WHERE token_hash = digest(p_token, 'sha256');
END;
$$;

REVOKE EXECUTE ON FUNCTION app_validate_session FROM public, anon;
REVOKE EXECUTE ON FUNCTION app_logout FROM public, anon;
