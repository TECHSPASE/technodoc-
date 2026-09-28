/*
# Fix token hash storage in app_login

1. Modified Functions
- app_login: store token_hash as hex string via encode(digest(...),'hex'), matching
  the comparison functions (validate/logout).
2. Data fixes
- app_login_sessions rows with '\x...' escape-prefixed hashes are deleted (they were unreadable
  by the validator anyway); those users simply log in again.
*/

CREATE OR REPLACE FUNCTION app_login(p_phone text, p_pin text)
RETURNS TABLE (token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_account app_accounts;
  v_token text;
  v_expires timestamptz;
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
  v_expires := now() + interval '30 days';
  INSERT INTO app_login_sessions (account_id, token_hash, expires_at)
  VALUES (v_account.id, encode(digest(v_token, 'sha256'), 'hex'), v_expires);

  RETURN QUERY SELECT v_token, v_expires;
END;
$$;

DELETE FROM app_login_sessions WHERE token_hash LIKE '\x%';
