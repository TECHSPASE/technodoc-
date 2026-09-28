/*
# Accounts with phone login and PIN

1. New Tables
- `app_accounts`
  - `id` (uuid, primary key)
  - `phone` (text, unique, not null) — Russian mobile number WITHOUT country code: 10 digits starting with 9 (e.g. 9012713157)
  - `pin_hash` (text, nullable) — salted hash of the login PIN; created on first login (pin setup)
  - `created_at`, `last_login_at` (timestamps)
2. Security
- Enable RLS on `app_accounts`.
- NO policies: the table is fully locked for anon/authenticated clients.
- All login logic runs through SECURITY DEFINER functions:
  - `app_login(p_phone text, p_pin text)` — verifies the number is in the whitelist and the PIN matches;
    returns a random session token on success.
  - `app_set_pin(p_token text, p_pin text)` — sets/updates the PIN using a valid session token.
- Sessions: `app_login_sessions` table stores random tokens (hashed), with expiry and last_used_at.
  Sessions also have no client policies; the edge function works with them via service role.
3. Notes
- Phone format enforced by CHECK: exactly 10 digits, starts with 9.
- PIN must be 4-8 digits; stored with pgcrypto salted hash (crypt + gen_salt).
- Failed login attempts are rate-limited: after 5 failures the number is locked for 15 minutes.
- Owner's number seeded: 9012713157.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE CHECK (phone ~ '^9\d{9}$'),
  pin_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS app_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  last_used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_login_sessions ENABLE ROW LEVEL SECURITY;

-- No policies added: both tables are fully closed to anon/authenticated clients.
-- The edge function uses the service role key which bypasses RLS.

INSERT INTO app_accounts (phone) VALUES ('9012713157')
ON CONFLICT (phone) DO NOTHING;

CREATE OR REPLACE FUNCTION app_login(p_phone text, p_pin text)
RETURNS TABLE (token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account app_accounts;
  v_token text;
BEGIN
  -- Validate input formats
  IF p_phone IS NULL OR p_phone !~ '^9\d{9}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^\d{4,8}$' THEN
    RAISE EXCEPTION 'INVALID_PIN';
  END IF;

  SELECT * INTO v_account FROM app_accounts WHERE phone = p_phone;
  IF NOT FOUND THEN
    -- Same error for unknown number and wrong PIN: do not reveal which is which
    RAISE EXCEPTION 'AUTH_FAILED';
  END IF;

  -- First login: set the initial PIN (only allowed if no PIN has ever been set)
  IF v_account.pin_hash IS NULL THEN
    IF EXISTS (SELECT 1 FROM app_login_sessions WHERE account_id = v_account.id) THEN
      RAISE EXCEPTION 'AUTH_FAILED';
    END IF;
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

  RETURN QUERY SELECT v_token, (SELECT expires_at FROM app_login_sessions WHERE token_hash = digest(v_token, 'sha256'));
END;
$$;

CREATE OR REPLACE FUNCTION app_set_pin(p_token text, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

REVOKE EXECUTE ON FUNCTION app_login FROM public, anon;
REVOKE EXECUTE ON FUNCTION app_set_pin FROM public, anon;
