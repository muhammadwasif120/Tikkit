-- TIKKIT X: live database security audit (read only)
-- Run: supabase db query --linked -f supabase/tests/05_security_audit.sql
--
-- Sections starting with PROBLEM_ should return nothing. Sections starting with REVIEW_ list things that are
-- allowed by design and are there so a person can confirm the list is what they expect.

-- ===== PROBLEM: every public table must have row level security =====
select 'PROBLEM_table_without_rls' as section, c.relname::text as object, '' as detail
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity

union all
-- ===== PROBLEM: anonymous visitors must not hold privileges on base tables (only on the public views) =====
select 'PROBLEM_anon_privilege_on_table', g.table_name::text, string_agg(g.privilege_type, ', ')
from information_schema.role_table_grants g
join pg_class c on c.relname = g.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = g.table_schema
where g.grantee = 'anon' and g.table_schema = 'public' and c.relkind = 'r'
group by g.table_name

union all
-- ===== PROBLEM: write policies that allow everything =====
select 'PROBLEM_open_write_policy', (p.schemaname || '.' || p.tablename || ' / ' || p.policyname)::text, (p.cmd || ' roles=' || p.roles::text)
from pg_policies p
where p.schemaname in ('public', 'storage')
  and ((p.cmd = 'INSERT' and p.with_check = 'true')
    or (p.cmd in ('UPDATE', 'DELETE') and p.qual = 'true')
    or (p.cmd = 'ALL' and (p.qual = 'true' or p.with_check = 'true')))

union all
-- ===== PROBLEM: SECURITY DEFINER functions must pin their search_path =====
select 'PROBLEM_definer_without_search_path', (n.nspname || '.' || p.proname)::text, ''
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef and n.nspname in ('public', 'private')
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%')

union all
-- ===== PROBLEM: sensitive columns a signed in user must never be able to change directly =====
select 'PROBLEM_authenticated_can_update_column', (v.t || '.' || v.c)::text, ''
from (values
  ('profiles', 'role'), ('profiles', 'is_complete'), ('profile_private', 'id_status'), ('profile_private', 'id_number_enc'),
  ('profile_private', 'email'), ('events', 'admin_status'), ('events', 'organizer_id'), ('registrations', 'status'),
  ('registrations', 'price_paid_pkr'), ('registrations', 'qr_token'), ('registrations', 'checked_in_at'),
  ('organizer_subscriptions', 'plan_id'), ('organizer_subscriptions', 'status'), ('attendee_stats', 'score'),
  ('class_bookings', 'status'), ('space_bookings', 'status'), ('pass_purchases', 'sessions_used'),
  ('commissions', 'status'), ('payment_submissions', 'status')
) as v(t, c)
where has_column_privilege('authenticated', ('public.' || v.t)::regclass, v.c, 'UPDATE')

union all
-- ===== PROBLEM: tables a signed in user must not write to directly (changes go through checked functions) =====
select 'PROBLEM_authenticated_direct_write', (v.t || ' (' || p.priv || ')')::text, ''
from (values ('subscription_payments'), ('subscription_invoices'), ('organizer_subscriptions'), ('commissions'), ('score_events'),
             ('scan_logs'), ('email_outbox'), ('admin_audit_log'), ('attendee_stats'), ('demo_config'), ('plans'), ('plan_limits')) as v(t)
cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
where has_table_privilege('authenticated', ('public.' || v.t)::regclass, p.priv)

union all
-- ===== PROBLEM: functions that must never be callable from a browser =====
select 'PROBLEM_function_exposed', (v.f)::text, ''
from (values ('public.demo_reseed(boolean)'), ('private.seed_demo()'), ('private.seed_demo_attendee()'), ('private.seed_demo_catalogue()')) as v(f)
where to_regprocedure(v.f) is not null
  and (has_function_privilege('anon', to_regprocedure(v.f), 'execute') or has_function_privilege('authenticated', to_regprocedure(v.f), 'execute'))

union all
-- ===== PROBLEM: the collectibles function must not be callable anonymously =====
select 'PROBLEM_function_exposed', 'public.my_collectibles()', 'anon can execute'
where to_regprocedure('public.my_collectibles()') is not null and has_function_privilege('anon', to_regprocedure('public.my_collectibles()'), 'execute')

union all
-- ===== PROBLEM: extensions installed into the public schema =====
select 'PROBLEM_extension_in_public', e.extname::text, ''
from pg_extension e join pg_namespace n on n.oid = e.extnamespace where n.nspname = 'public'

union all
-- ===== PROBLEM: storage buckets that are public but should not be, or have no size limit =====
select 'PROBLEM_bucket', b.id::text, ('public=' || b.public::text || ' size_limit=' || coalesce(b.file_size_limit::text, 'none'))
from storage.buckets b
where (b.public and b.id in ('payment-proofs', 'id-documents', 'subscription-proofs', 'retreat-documents'))
   or b.file_size_limit is null

union all
-- ===== PROBLEM: demo safeguards must be present =====
select 'PROBLEM_demo_safeguard_missing', v.t::text, ''
from (values ('email_outbox / email_outbox_demo_suppress'), ('organizer_team_members / organizer_team_members_demo_block'),
             ('subscription_payments / subscription_payments_demo_block'), ('profile_private / profile_private_demo_block')) as v(t)
where not exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  where not t.tgisinternal and c.relname || ' / ' || t.tgname = v.t)

union all
-- ===== REVIEW: policies that apply to anonymous visitors =====
select 'REVIEW_policy_for_anon', (p.schemaname || '.' || p.tablename || ' / ' || p.policyname)::text, (p.cmd || ' ' || p.roles::text)
from pg_policies p
where p.schemaname in ('public', 'storage') and (p.roles::text like '%anon%' or p.roles::text like '%public%')

union all
-- ===== REVIEW: what anonymous visitors can read (should be the public views only) =====
select 'REVIEW_anon_can_select', g.table_name::text, ''
from information_schema.role_table_grants g
where g.grantee = 'anon' and g.table_schema = 'public' and g.privilege_type = 'SELECT'

union all
-- ===== REVIEW: public functions anonymous visitors can run =====
select 'REVIEW_anon_can_execute', (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')')::text, (case when p.prosecdef then 'SECURITY DEFINER' else 'invoker' end)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f' and has_function_privilege('anon', p.oid, 'execute')
  and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')

union all
-- ===== REVIEW: tables a signed in user can write to directly (row policies decide which rows) =====
select 'REVIEW_authenticated_writes', t.table_name::text, string_agg(t.privilege_type, ', ' order by t.privilege_type)
from information_schema.role_table_grants t
join pg_class c on c.relname = t.table_name join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
where t.grantee = 'authenticated' and t.table_schema = 'public' and c.relkind = 'r' and t.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
group by t.table_name

union all
-- ===== REVIEW: storage buckets =====
select 'REVIEW_bucket', b.id::text, ('public=' || b.public::text || ' size_limit=' || coalesce(b.file_size_limit::text, 'none') || ' types=' || coalesce(array_to_string(b.allowed_mime_types, ','), 'any'))
from storage.buckets b

union all
-- ===== REVIEW: scheduled jobs =====
select 'REVIEW_cron_job', j.jobname::text, (j.schedule || ' ' || left(j.command, 80))
from cron.job j

order by 1, 2;
