/*
# Таблица app_secrets для серверных ключей (обходной путь, пока секрет не добавлен через Secrets)

1. Новая таблица `app_secrets`
- `name` (text, primary key) — имя ключа, например OPENAI_API_KEY
- `value` (text, not null) — значение ключа
- `created_at` (timestamptz, default now())

2. Безопасность
- RLS включён, НИ ОДНОЙ политики не создаётся — это deny-by-default:
  ни anon, ни authenticated не имеют доступа к таблице на уровне строк.
- Чтение выполняется только серверной ИИ-функцией через service role ключ,
  который обходит RLS и недоступен браузеру.

3. Важно
- Таблица не доступна через Data API для клиентов с anon ключом.
- Ключ хранится как обычный text; доступ к нему имеет только сервер.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON app_secrets FROM anon, authenticated;
