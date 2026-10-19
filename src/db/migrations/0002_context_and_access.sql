-- ============================================================================
-- ARBA Context OS — Migration 0002: context, chunks, access grants, audit
-- ============================================================================

-- ---------- context_items ----------
-- The unit of organizational knowledge: an SOP, a policy, a supplier briefing,
-- a sales playbook, a past decision, a CX script, etc.
create table if not exists context_items (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  body                 text not null default '',
  summary              text,
  source               text not null default 'manual',  -- manual | google_drive | sleekflow | sales | web
  source_ref           text,                              -- external id / url
  owner_department_id  uuid not null references departments(id) on delete restrict,
  sensitivity          context_sensitivity not null default 'shared',
  status               context_status not null default 'published',
  tags                 text[] not null default '{}',
  version              integer not null default 1,
  created_by           uuid references app_users(id) on delete set null,
  updated_by           uuid references app_users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_context_items_dept       on context_items(owner_department_id);
create index if not exists idx_context_items_status      on context_items(status);
create index if not exists idx_context_items_sensitivity on context_items(sensitivity);
create index if not exists idx_context_items_tags        on context_items using gin(tags);

drop trigger if exists trg_context_items_updated on context_items;
create trigger trg_context_items_updated
  before update on context_items
  for each row execute function set_updated_at();

-- ---------- context_chunks ----------
-- Each context_item is split into chunks and embedded for semantic search.
-- IMPORTANT: the vector dimension MUST match your embedding model.
--   1024 = Voyage AI voyage-3 / voyage-3-large  (Anthropic's recommended embeddings)
-- If you change models, change vector(N) and re-ingest everything.
create table if not exists context_chunks (
  id               uuid primary key default gen_random_uuid(),
  context_item_id  uuid not null references context_items(id) on delete cascade,
  chunk_index      integer not null,
  content          text not null,
  embedding        vector(1024),
  token_count      integer,
  created_at       timestamptz not null default now(),
  unique (context_item_id, chunk_index)
);
create index if not exists idx_context_chunks_item on context_chunks(context_item_id);
-- HNSW index for fast cosine similarity search.
create index if not exists idx_context_chunks_embedding
  on context_chunks using hnsw (embedding vector_cosine_ops);

-- ---------- access_grants ----------
-- Grant a department OR a specific user READ access to a TARGET department's
-- context. This is the selective cross-department sharing switch.
create table if not exists access_grants (
  id                     uuid primary key default gen_random_uuid(),
  grantee_department_id  uuid references departments(id) on delete cascade,
  grantee_user_id        uuid references app_users(id) on delete cascade,
  target_department_id   uuid not null references departments(id) on delete cascade,
  can_read_restricted    boolean not null default false,
  granted_by             uuid references app_users(id) on delete set null,
  expires_at             timestamptz,
  created_at             timestamptz not null default now(),
  -- exactly one grantee type must be set
  constraint chk_one_grantee check (
    (grantee_department_id is not null)::int + (grantee_user_id is not null)::int = 1
  )
);
create index if not exists idx_grants_target on access_grants(target_department_id);
create index if not exists idx_grants_dept   on access_grants(grantee_department_id);
create index if not exists idx_grants_user   on access_grants(grantee_user_id);

-- ---------- audit_log ----------
-- Every meaningful action, including AI retrieval, is logged. Master-only read.
create table if not exists audit_log (
  id               uuid primary key default gen_random_uuid(),
  actor_user_id    uuid references app_users(id) on delete set null,
  action           text not null,   -- read | search | create | update | delete | export | grant | revoke
  context_item_id  uuid references context_items(id) on delete set null,
  detail           jsonb not null default '{}',
  created_at       timestamptz not null default now()
);
create index if not exists idx_audit_actor   on audit_log(actor_user_id);
create index if not exists idx_audit_created  on audit_log(created_at);
