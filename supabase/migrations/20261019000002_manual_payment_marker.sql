-- Follow-up to 20261019000001: an organizer recording a cash payment writes a product_payments row whose
-- screenshot_path is the marker 'manual:recorded' (there is no file). The receipt path guard from the demo
-- hardening migration rejected it because the path does not start with the caller's id.
-- Members still cannot use the marker: they cannot insert into product_payments at all (no grant), and
-- submit_product_payment checks the path itself.

begin;

create or replace function private.check_proof_path()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.screenshot_path is not null
     and not (tg_table_name = 'product_payments' and new.screenshot_path = 'manual:recorded' and new.status = 'approved')
     and (new.screenshot_path not like (auth.uid()::text || '/%') or new.screenshot_path like '%..%') then
    raise exception 'PROOF_PATH: that receipt file is not yours.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

commit;
