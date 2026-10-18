"""Regenerates supabase/tests/04_verify_applied.sql from the migration files.
Run after adding a migration:  python3 scripts/gen_verify_sql.py
The generated query lists every table, function, view, trigger, policy and cron job the migrations create that is
missing from the live database. No rows returned means everything is applied."""
import re, glob

files = sorted(glob.glob('supabase/migrations/*.sql'))
tables, funcs, views, trigs, pols, cron = {}, {}, {}, {}, {}, set()
q = lambda n: n.strip('"')
def apply(f):
    s = re.sub(r'--[^\n]*', '', open(f).read())
    ev = []  # (position, store, key, add?)
    def add(rx, store, keyfn, adding, flags=re.I):
        for m in re.finditer(rx, s, flags): ev.append((m.start(), store, keyfn(m), adding))
    sc = lambda m, i=1: m.group(i) or 'public'
    add(r'create table (?:if not exists )?(?:(\w+)\.)?(\w+)', tables, lambda m: (sc(m), m.group(2)), True)
    add(r'drop table (?:if exists )?(?:(\w+)\.)?(\w+)', tables, lambda m: (sc(m), m.group(2)), False)
    add(r'create (?:or replace )?function (?:(\w+)\.)?(\w+)\s*\(', funcs, lambda m: (sc(m), m.group(2)), True)
    add(r'drop function (?:if exists )?(?:(\w+)\.)?(\w+)', funcs, lambda m: (sc(m), m.group(2)), False)
    add(r'create (?:or replace )?view (?:(\w+)\.)?(\w+)', views, lambda m: (sc(m), m.group(2)), True)
    add(r'create trigger (\w+)\s+(?:before|after|instead of)[^;]*?\bon\s+(?:(\w+)\.)?(\w+)', trigs, lambda m: (sc(m, 2), m.group(3), m.group(1)), True, re.I | re.S)
    add(r'drop trigger (?:if exists )?(\w+)\s+on\s+(?:(\w+)\.)?(\w+)', trigs, lambda m: (sc(m, 2), m.group(3), m.group(1)), False)
    add(r'create policy ("[^"]+"|\w+)\s+on\s+(?:(\w+)\.)?(\w+)', pols, lambda m: (sc(m, 2), m.group(3), q(m.group(1))), True)
    add(r'drop policy (?:if exists )?("[^"]+"|\w+)\s+on\s+(?:(\w+)\.)?(\w+)', pols, lambda m: (sc(m, 2), m.group(3), q(m.group(1))), False)
    for _, store, key, adding in sorted(ev, key=lambda e: e[0]):
        if adding: store[key] = f
        else: store.pop(key, None)
    for m in re.finditer(r"cron\.schedule\(\s*'([^']+)'", s): cron.add(m.group(1))

for f in files:
    apply(f)

NL = ",\n    "
vals = lambda items: NL.join("('" + "','".join(i) + "')" for i in sorted(items))
sql = f'''-- Generated from supabase/migrations by scripts/gen_verify_sql.py. Do not edit by hand.
-- Run: supabase db query --linked -f supabase/tests/04_verify_applied.sql
-- missing_* rows are PROBLEMS (a migration is not fully applied). EXTRA_* rows are objects that exist in the database but that no
-- migration creates: leftovers from the old app. Review each one; they are candidates to drop.

with expected_tables(schema_name, name) as (values
    {vals(list(tables))}),
expected_functions(schema_name, name) as (values
    {vals(list(funcs))}),
expected_views(schema_name, name) as (values
    {vals(list(views))}),
expected_triggers(schema_name, table_name, name) as (values
    {vals(list(trigs))}),
expected_policies(schema_name, table_name, name) as (values
    {vals(list(pols))}),
expected_cron(name) as (values
    {NL.join("('" + c + "')" for c in sorted(cron))})
select 'missing_table' as problem, e.schema_name || '.' || e.name as object from expected_tables e
  where not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = e.schema_name and c.relname = e.name and c.relkind in ('r','p'))
union all
select 'missing_function', e.schema_name || '.' || e.name from expected_functions e
  where not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = e.schema_name and p.proname = e.name)
union all
select 'missing_view', e.schema_name || '.' || e.name from expected_views e
  where not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = e.schema_name and c.relname = e.name and c.relkind in ('v','m'))
union all
select 'missing_trigger', e.schema_name || '.' || e.table_name || ' / ' || e.name from expected_triggers e
  where not exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = e.schema_name and c.relname = e.table_name and t.tgname = e.name and not t.tgisinternal)
union all
select 'missing_policy', e.schema_name || '.' || e.table_name || ' / ' || e.name from expected_policies e
  where not exists (select 1 from pg_policies p where p.schemaname = e.schema_name and p.tablename = e.table_name and p.policyname = e.name)
union all
select 'missing_cron_job', e.name from expected_cron e
  where not exists (select 1 from cron.job j where j.jobname = e.name)
union all
select 'EXTRA_table_not_in_migrations', c.relname::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p') and not exists (select 1 from expected_tables e where e.schema_name = 'public' and e.name = c.relname)
union all
select 'EXTRA_policy_not_in_migrations', (p.schemaname || '.' || p.tablename || ' / ' || p.policyname)::text from pg_policies p
  where p.schemaname in ('public','storage') and not exists (select 1 from expected_policies e where e.schema_name = p.schemaname and e.table_name = p.tablename and e.name = p.policyname)
union all
select 'EXTRA_function_not_in_migrations', (n.nspname || '.' || p.proname)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private') and p.prokind = 'f' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
    and not exists (select 1 from expected_functions e where e.schema_name = n.nspname and e.name = p.proname)
union all
select 'EXTRA_trigger_not_in_migrations', (c.relname || ' / ' || t.tgname)::text from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal and not exists (select 1 from expected_triggers e where e.schema_name = 'public' and e.table_name = c.relname and e.name = t.tgname)
order by 1, 2;
'''
open('supabase/tests/04_verify_applied.sql', 'w').write(sql)
print('tables', len(tables), 'functions', len(funcs), 'views', len(views), 'triggers', len(trigs), 'policies', len(pols), 'cron', len(cron))
