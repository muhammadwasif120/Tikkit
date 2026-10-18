-- DEV ONLY. Wipes every legacy object in the public schema and legacy storage
-- policies so the baseline migrations can be applied from scratch.
-- auth.users and storage objects are NOT touched. The new project never needs this.
-- A full data export of the legacy database is in ~/tikkit-backups/2026-10-14-pre-phase2.

begin;

drop trigger if exists on_auth_user_created on auth.users;

do $$
declare r record;
begin
  -- views and tables
  for r in select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('v','m','r','p') loop
    execute format('drop %s if exists public.%I cascade',
      case r.relkind when 'v' then 'view' when 'm' then 'materialized view' else 'table' end, r.relname);
  end loop;
  -- functions
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind in ('f','p')
             and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
  -- types (enums, composites)
  for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typtype in ('e','c') and t.typrelid = 0 loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
  -- legacy storage policies
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

commit;
