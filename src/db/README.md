# ARBA Context OS — Database Setup

ARBA's shared, permission-controlled company brain. Departments contribute and
own their context; people and AI agents search it by meaning; who can see what
is enforced by **PostgreSQL Row-Level Security (RLS)** — not by app code, so an
application bug cannot leak data.

## Stack
- **PostgreSQL on Supabase** — database, Auth (Google SSO), auto REST/RPC API.
- **pgvector** — embeddings + semantic search, inside the same database so RLS
  applies to search results too (permission-aware retrieval).

## What's here
```
src/db/
├── schema.sql                         # human-readable overview (read this first)
├── migrations/
│   ├── 0001_extensions_and_core.sql   # extensions, enums, departments, app_users
│   ├── 0002_context_and_access.sql    # context_items, context_chunks, grants, audit
│   ├── 0003_functions_and_rls.sql     # helpers, auth sync, match_context, ALL RLS
│   └── 0004_seed.sql                  # ARBA departments + bootstrap notes
├── client.ts                          # user-scoped vs service-role clients
└── queries/context.ts                 # typed query + search functions
src/types/context.ts                   # shared TypeScript types
scripts/ingest.ts                      # chunk + embed + store (ingestion scaffold)
```

## Setup (about 30 minutes)

1. **Create a Supabase project** at supabase.com. Note the Project URL, the
   `anon` key, and the `service_role` key.
2. **Enable Google sign-in** (Auth → Providers → Google) so your team logs in
   with their ARBA Google accounts.
3. **Run the migrations in order** (Supabase SQL editor, or `psql`):
   `0001` → `0002` → `0003` → `0004`.
4. **Sign in once yourself** (through your app or the Supabase Auth UI) so your
   `app_users` row is auto-created.
5. **Bootstrap the master** — run the `UPDATE` at the bottom of `0004_seed.sql`
   to set your account to role `master`.
6. **Assign your C-levels** as department `manager`s (examples in `0004_seed.sql`).
7. **Configure env** — copy `.env.example` to `.env.local` and fill in the keys.
8. **Ingest** — implement `embed()` in `scripts/ingest.ts` with your embedding
   provider, then run it over your first context items.

## The access model (summary)

| Role | Write | Read |
|------|-------|------|
| **master** (you) | everything, incl. restricted | everything |
| **manager** (C-level) | own dept (shared + restricted) | own dept + granted depts |
| **builder** (staff) | own dept (shared only) | own dept + granted depts |
| **viewer** | nothing | own dept shared + granted depts |

- **`shared`** context follows department + grant rules.
- **`restricted`** context is the master vault (finance, salaries, strategy,
  deal terms) — master + owning-dept manager + explicit `can_read_restricted`
  grants only. **Keep this set small** — locking most context recreates a
  single point of failure.
- **Cross-department reads** happen only through `access_grants`. A manager can
  grant other departments read access to their own department's context.
- New users default to `viewer` with **no department** → they see nothing until
  the master assigns them. Secure by default.

## Permission-aware AI (the critical rule)

`match_context()` runs with the **caller's** privileges, so RLS filters its
results. An AI agent answering for a Sales viewer only retrieves what that
viewer may see.

> **Always** call `match_context` / all user queries with a **user-scoped
> client** (`createUserClient`, carrying the user's JWT).
> **Never** use the `service_role` key for user-facing reads — it bypasses RLS
> and would leak the restricted vault. The service key is for ingestion and
> migrations only.

## Security checklist
- [ ] RLS enabled on every table (migrations do this — don't disable it).
- [ ] `service_role` key only on the server, never shipped to the browser.
- [ ] User queries always go through `createUserClient`.
- [ ] `.env.local` is git-ignored; never commit real keys.
- [ ] Audit log reviewed periodically (master-only).

## Notes
- The `auth.users` reference assumes Supabase. On plain PostgreSQL, replace that
  FK and the `on_auth_user_created` trigger with your own auth source.
- Embedding dimension is `1024` (Voyage `voyage-3`). Change `vector(N)` in
  `0002` and re-ingest if you switch models.
