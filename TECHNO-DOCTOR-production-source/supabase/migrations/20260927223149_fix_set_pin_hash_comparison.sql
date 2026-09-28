/*
# Fix token hash comparison in app_set_pin

1. Modified Functions
- app_set_pin: compare token_hash (text) with encode(digest(...),'hex').
*/

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
  WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex') AND expires_at > now();
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_FAILED';
  END IF;

  UPDATE app_accounts SET pin_hash = crypt(p_pin, gen_salt('bf', 10))
  WHERE id = v_account_id;
END;
$$;
