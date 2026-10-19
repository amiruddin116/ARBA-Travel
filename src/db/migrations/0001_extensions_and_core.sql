-- ============================================================================
-- ARBA Context OS — Migration 0001: extensions, enums, core identity tables
-- Run order: 0001 -> 0002 -> 0003 -> 0004
-- Target: PostgreSQL on Supabase (uses the built-in `auth.users` table).
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";       -- pgvector (embeddings)

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('master', 'manager', 'builder', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type context_sensitivity as enum ('shared', 'restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type context_status as enum ('draft', 'published', 'stale', 'archived');
exception when duplicate_object then null; end $$;

-- ---------- Shared updated_at trigger ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- departments ----------
create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_departments_updated on departments;
create trigger trg_departments_updated
  before update on departments
  for each row execute function set_updated_at();

-- ---------- app_users ----------
-- One row per person, keyed to the Supabase auth user.
-- A user belongs to exactly one department. The master may have department_id
-- NULL, meaning "whole company".
create table if not exists app_users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text,
  department_id  uuid references departments(id) on delete set null,
  role           user_role not null default 'viewer',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_app_users_department on app_users(department_id);

drop trigger if exists trg_app_users_updated on app_users;
create trigger trg_app_users_updated
  before update on app_users
  for each row execute function set_updated_at();
