-- ============================================================================
-- ARBA Context OS — Migration 0004: seed ARBA departments
-- ============================================================================

insert into departments (name, slug) values
  ('Product & Supply',                   'product-supply'),
  ('Sales',                              'sales'),
  ('Customer Experience & Operations',   'cx-ops'),
  ('Marketing',                          'marketing'),
  ('Finance & Account',                  'finance'),
  ('People & Governance',                'people-governance'),
  ('Technology',                         'tech')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- BOOTSTRAP THE MASTER (run ONCE, after you have signed in via Supabase Auth
-- at least once so your app_users row exists):
--
--   update app_users
--   set role = 'master', department_id = null, is_active = true
--   where email = 'amiruddin116@gmail.com';
--
-- Then assign your C-levels as department managers, e.g.:
--
--   update app_users set role = 'manager',
--     department_id = (select id from departments where slug = 'product-supply')
--   where email = 'syahmi@arbatravel.com';
--
--   update app_users set role = 'manager',
--     department_id = (select id from departments where slug = 'sales')
--   where email = 'hussaini@arbatravel.com';
--
--   update app_users set role = 'manager',
--     department_id = (select id from departments where slug = 'cx-ops')
--   where email = 'hi@arbatravel.com';
-- ----------------------------------------------------------------------------
