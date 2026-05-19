# Versioned migrations

Each migration is a single SQL file named `YYYYMMDDHHMM_<description>.sql`.

Examples:
```
202605170900_add_must_change_password_to_users.sql
202605181200_create_payments_index.sql
```

## How it runs

`backend/src/database/migrate.js` executes in two phases:

1. **Base schema** — the inline `schema` constant (idempotent
   `CREATE TABLE IF NOT EXISTS` + `ALTER ... IF NOT EXISTS`).
   This is the legacy state that already exists in production.
2. **Versioned migrations** — every `.sql` file in this folder is run
   in lexicographic order, **once**, and tracked in the
   `schema_migrations` table. Already-applied files are skipped.

## Authoring rules

- Pick `YYYYMMDDHHMM` from "now" so files sort chronologically.
- Use **idempotent** statements when possible
  (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, …)
  so re-runs in dev or partial failures are safe.
- A migration runs in a single connection. To split into multiple
  statements, terminate each with `;`. Plain SQL only — no JS.
- Do not edit a migration after it has been applied in any
  shared environment. Add a new file instead.

## Local workflow

```bash
npm run migrate           # base schema + pending versioned files
npm run migrate:fresh     # DROP everything + re-run base + all versioned
```

The `schema_migrations` table is created automatically on first run.
