/*
# Fix search_path for auth functions (pgcrypto lives in extensions schema)

1. Modified Functions
- app_login, app_set_pin, app_validate_session, app_logout:
  search_path now includes public + extensions so crypt/gen_salt/digest resolve.
2. Notes
- Behavior unchanged; only function metadata (SET search_path) is updated.
*/

CREATE OR REPLACE FUNCTION app_login(p_phone text, p_pin text)
RETURNS TABLE (token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_account app_accounts;
  v_token text;
BEGIN
  IF p_phone IS NULL OR p_phone !~ '^9\d{9}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^\d{4,8}$' THEN
    RAISE EXCEPTION 'INVALID_PIN';
  END IF;

  SELECT * INTO v_account FROM app_accounts WHERE phone = p_phone;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUTH_FAILED';
  END IF;

  IF v_account.pin_hash IS NULL THEN
    UPDATE app_accounts
      SET pin_hash = crypt(p_pin, gen_salt('bf', 10))
      WHERE id = v_account.id;
  ELSE
    IF v_account.pin_hash <> crypt(p_pin, v_account.pin_hash) THEN
      RAISE EXCEPTION 'AUTH_FAILED';
    END IF;
  END IF;

  UPDATE app_accounts SET last_login_at = now() WHERE id = v_account.id;

  v_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO app_login_sessions (account_id, token_hash, expires_at)
  VALUES (v_account.id, digest(v_token, 'sha256'), now() + interval '30 days');

  RETURN QUERY SELECT v_token, now() + interval '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION app_set_pin(p_token text, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^\d{4,8}$' THEN
    RAISE EXCEPTION 'INVALID_PIN';
  END IF;

  SELECT account_id INTO v_account_id FROM app_login_sessions
  WHERE token_hash = digest(p_token, 'sha256') AND expires_at > now();
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_FAILED';
  END IF;

  UPDATE app_accounts SET pin_hash = crypt(p_pin, gen_salt('bf', 10))
  WHERE id = v_account_id;
END;
$$;

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
    WHERE token_hash = digest(p_token, 'sha256') AND expires_at > now();
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
  DELETE FROM app_login_sessions WHERE token_hash = digest(p_token, 'sha256');
END;
$$;
