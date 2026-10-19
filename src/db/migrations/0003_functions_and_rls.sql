-- ============================================================================
-- ARBA Context OS — Migration 0003: identity helpers, auth sync,
-- the permission-aware search function, and all Row-Level Security policies.
--
-- THIS FILE IS THE SECURITY CORE. Permissions are enforced by PostgreSQL,
-- not by application code — a bug in the app cannot leak data.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Identity helpers. SECURITY DEFINER so they can read app_users without being
-- blocked by app_users' own RLS (avoids policy recursion).
-- ---------------------------------------------------------------------------
create or replace function current_app_user_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from app_users where id = auth.uid() and is_active = true $$;

create or replace function current_app_user_department()
returns uuid
language sql stable security definer set search_path = public
as $$ select department_id from app_users where id = auth.uid() and is_active = true $$;

create or replace function is_master()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from app_users
    where id = auth.uid() and role = 'master' and is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision an app_users row when a new auth user signs up.
-- New users default to role 'viewer' with NO department -> they see nothing
-- until the master assigns a department and role. Secure by default.
-- ---------------------------------------------------------------------------
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into app_users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Block privilege escalation: a non-master may not change their own role,
-- department, or active flag (they can still update their display name, etc).
-- ---------------------------------------------------------------------------
create or replace function prevent_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if is_master() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.department_id is distinct from old.department_id
     or new.is_active is distinct from old.is_active then
    raise exception 'Not allowed to change role, department, or active status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_users_no_escalation on app_users;
create trigger trg_app_users_no_escalation
  before update on app_users
  for each row execute function prevent_privilege_escalation();

-- ---------------------------------------------------------------------------
-- Permission-aware semantic search.
-- SECURITY INVOKER (default): runs with the CALLER's privileges, so RLS on
-- context_items / context_chunks filters the results automatically. An AI
-- agent calling this on behalf of a user can only ever surface context that
-- user is allowed to see.
--
-- >>> Call this with the end-user's JWT (anon/authenticated role).
-- >>> NEVER call it with the service-role key for user-facing queries —
--     the service role bypasses RLS and would leak restricted context.
-- ---------------------------------------------------------------------------
create or replace function match_context(
  query_embedding   vector(1024),
  match_count       int   default 8,
  min_similarity    float default 0.0,
  filter_department uuid  default null
)
returns table (
  context_item_id     uuid,
  chunk_id            uuid,
  title               text,
  content             text,
  owner_department_id uuid,
  similarity          float
)
language sql stable
as $$
  select
    ci.id,
    cc.id,
    ci.title,
    cc.content,
    ci.owner_department_id,
    1 - (cc.embedding <=> query_embedding) as similarity
  from context_chunks cc
  join context_items ci on ci.id = cc.context_item_id
  where cc.embedding is not null
    and ci.status = 'published'
    and (filter_department is null or ci.owner_department_id = filter_department)
    and 1 - (cc.embedding <=> query_embedding) >= min_similarity
  order by cc.embedding <=> query_embedding
  limit match_count;
$$;

-- ===========================================================================
-- ROW-LEVEL SECURITY
-- ===========================================================================

-- ---------- departments: everyone signed-in can read; master writes ----------
alter table departments enable row level security;

drop policy if exists departments_select on departments;
create policy departments_select on departments
  for select using (auth.uid() is not null);

drop policy if exists departments_write on departments;
create policy departments_write on departments
  for all using (is_master()) with check (is_master());

-- ---------- app_users ----------
alter table app_users enable row level security;

drop policy if exists app_users_select on app_users;
create policy app_users_select on app_users
  for select using (
    id = auth.uid()
    or is_master()
    or (current_app_user_role() = 'manager'
        and department_id = current_app_user_department())
  );

drop policy if exists app_users_insert on app_users;
create policy app_users_insert on app_users
  for insert with check (is_master());

-- Users may update their own row (role/dept changes blocked by trigger above);
-- master may update anyone.
drop policy if exists app_users_update on app_users;
create policy app_users_update on app_users
  for update using (is_master() or id = auth.uid())
  with check (is_master() or id = auth.uid());

drop policy if exists app_users_delete on app_users;
create policy app_users_delete on app_users
  for delete using (is_master());

-- ---------- context_items: the heart of the access model ----------
alter table context_items enable row level security;

-- READ: master sees all. Otherwise you may read an item if it is in your own
-- department (restricted items only if you are that department's manager), OR
-- a valid grant gives your department/you read access to its department
-- (restricted items only if the grant allows restricted).
drop policy if exists context_items_select on context_items;
create policy context_items_select on context_items
  for select using (
    is_master()
    or (
      status <> 'archived'
      and (
        (owner_department_id = current_app_user_department()
          and (sensitivity = 'shared' or current_app_user_role() = 'manager'))
        or exists (
          select 1 from access_grants g
          where g.target_department_id = context_items.owner_department_id
            and (g.expires_at is null or g.expires_at > now())
            and (g.grantee_department_id = current_app_user_department()
                 or g.grantee_user_id = auth.uid())
            and (context_items.sensitivity = 'shared' or g.can_read_restricted)
        )
      )
    )
  );

-- INSERT: master anywhere. Managers create shared or restricted in their own
-- department. Builders create shared only, in their own department.
drop policy if exists context_items_insert on context_items;
create policy context_items_insert on context_items
  for insert with check (
    is_master()
    or (
      owner_department_id = current_app_user_department()
      and (
        current_app_user_role() = 'manager'
        or (current_app_user_role() = 'builder' and sensitivity = 'shared')
      )
    )
  );

-- UPDATE: master anywhere; managers & builders within their own department
-- (builders cannot turn an item restricted).
drop policy if exists context_items_update on context_items;
create policy context_items_update on context_items
  for update using (
    is_master()
    or (owner_department_id = current_app_user_department()
        and current_app_user_role() in ('manager', 'builder'))
  )
  with check (
    is_master()
    or (
      owner_department_id = current_app_user_department()
      and (
        current_app_user_role() = 'manager'
        or (current_app_user_role() = 'builder' and sensitivity = 'shared')
      )
    )
  );

-- DELETE: master, or the owning department's manager.
drop policy if exists context_items_delete on context_items;
create policy context_items_delete on context_items
  for delete using (
    is_master()
    or (owner_department_id = current_app_user_department()
        and current_app_user_role() = 'manager')
  );

-- NOTE: role 'viewer' matches no insert/update/delete policy => writes denied.
-- Viewers can only SELECT what the read policy allows. Exactly the requirement.

-- ---------- context_chunks: visibility inherits from the parent item ----------
alter table context_chunks enable row level security;

-- The EXISTS subquery is itself RLS-filtered by context_items, so a chunk is
-- visible iff its parent item is visible to the caller.
drop policy if exists context_chunks_select on context_chunks;
create policy context_chunks_select on context_chunks
  for select using (
    exists (select 1 from context_items i where i.id = context_chunks.context_item_id)
  );

-- Chunks are normally written by the service-role ingestion pipeline (which
-- bypasses RLS). This policy allows writes only where the parent is visible.
drop policy if exists context_chunks_write on context_chunks;
create policy context_chunks_write on context_chunks
  for all using (
    exists (select 1 from context_items i where i.id = context_chunks.context_item_id)
  ) with check (
    exists (select 1 from context_items i where i.id = context_chunks.context_item_id)
  );

-- ---------- access_grants: managers manage sharing of their own department ----------
alter table access_grants enable row level security;

drop policy if exists grants_select on access_grants;
create policy grants_select on access_grants
  for select using (
    is_master()
    or target_department_id = current_app_user_department()
    or grantee_department_id = current_app_user_department()
    or grantee_user_id = auth.uid()
  );

drop policy if exists grants_insert on access_grants;
create policy grants_insert on access_grants
  for insert with check (
    is_master()
    or (current_app_user_role() = 'manager'
        and target_department_id = current_app_user_department())
  );

drop policy if exists grants_update on access_grants;
create policy grants_update on access_grants
  for update using (
    is_master()
    or (current_app_user_role() = 'manager'
        and target_department_id = current_app_user_department())
  ) with check (
    is_master()
    or (current_app_user_role() = 'manager'
        and target_department_id = current_app_user_department())
  );

drop policy if exists grants_delete on access_grants;
create policy grants_delete on access_grants
  for delete using (
    is_master()
    or (current_app_user_role() = 'manager'
        and target_department_id = current_app_user_department())
  );

-- ---------- audit_log: anyone writes their own entry; only master reads ----------
alter table audit_log enable row level security;

drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log
  for select using (is_master());

drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log
  for insert with check (actor_user_id = auth.uid() or is_master());
