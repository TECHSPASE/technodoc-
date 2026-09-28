/*
# Create finance_entries table (single-tenant, no auth)

1. New Tables
- `finance_entries`
  - `id` (uuid, primary key)
  - `type` (text, not null) — 'доход' | 'расход' | 'долг' | 'вернул'
  - `amount` (numeric, not null, default 0)
  - `note` (text, nullable) — optional remark (от кого / за что)
  - `created_at` (timestamp, default now())
2. Security
- Enable RLS on `finance_entries`.
- Allow anon + authenticated CRUD because the app has no sign-in and the data is intentionally shared.
3. Notes
- Profit counter = sum of доход minus sum of расход. Debts = долг minus вернул.
*/

CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('доход', 'расход', 'долг', 'вернул')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_finance" ON finance_entries;
CREATE POLICY "anon_select_finance" ON finance_entries
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_finance" ON finance_entries;
CREATE POLICY "anon_insert_finance" ON finance_entries
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_finance" ON finance_entries;
CREATE POLICY "anon_update_finance" ON finance_entries
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_finance" ON finance_entries;
CREATE POLICY "anon_delete_finance" ON finance_entries
FOR DELETE TO anon, authenticated USING (true);
