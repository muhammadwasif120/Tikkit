-- TIKKIT X modules 6/6: team managers can open payment proofs.
-- can_see_registration backs the payment_submissions policy and the payment-proofs storage
-- policy. It only knew the owner, so a manager could approve a payment but not see the screenshot.

begin;

create or replace function private.can_see_registration(p_reg uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.registrations r
    where r.id = p_reg and (r.attendee_id = auth.uid() or private.manages_event(r.event_id))
  )
$$;

commit;
