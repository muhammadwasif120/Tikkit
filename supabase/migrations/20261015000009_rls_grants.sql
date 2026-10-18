-- TIKKIT X baseline 9/10: privileges and row level security
-- Principle: deny by default. anon and authenticated receive explicit grants only,
-- per table and per column. Trust data is changed through functions, not direct writes.

begin;

-- ---------------------------------------------------------------------------
-- 1. Remove every default privilege
-- ---------------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Helper predicates used by policies (security definer, private schema)
-- ---------------------------------------------------------------------------
create or replace function private.is_registrant(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.registrations r where r.event_id = p_event and r.attendee_id = auth.uid())
$$;

create or replace function private.can_see_registration(p_reg uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.registrations r
    join public.events e on e.id = r.event_id
    where r.id = p_reg and (r.attendee_id = auth.uid() or e.organizer_id = auth.uid() or private.is_admin())
  )
$$;

create or replace function private.attendee_sees_account(p_account uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_payment_accounts epa
    join public.registrations r on r.event_id = epa.event_id
    where epa.payment_account_id = p_account
      and r.attendee_id = auth.uid()
      and r.status in ('awaiting_payment', 'payment_submitted')
  )
$$;

-- ---------------------------------------------------------------------------
-- 3. Plan guard on vendor contacts, commission status transitions
-- ---------------------------------------------------------------------------
create or replace function private.vendor_plan_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if auth.role() not in ('anon', 'authenticated') then return new; end if;
  select count(*) into n from public.organizer_vendors where organizer_id = new.organizer_id;
  if n >= private.plan_limit_int(new.organizer_id, 'vendors') then
    raise exception 'PLAN_LIMIT:vendors: your plan allows % vendors.', private.plan_limit_int(new.organizer_id, 'vendors')
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger organizer_vendors_plan_guard before insert on public.organizer_vendors
  for each row execute function private.vendor_plan_guard();

create or replace function private.commission_status_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if old.status = 'void' or new.status = 'void' then
      raise exception 'commission is void' using errcode = '42501';
    end if;
    if new.status = 'paid' and new.paid_at is null then new.paid_at := now(); end if;
  end if;
  return new;
end;
$$;
create trigger commissions_status_guard before update on public.commissions
  for each row execute function private.commission_status_guard();

-- Organizer view of registrant scores. Detail depends on the plan.
create or replace function public.get_registrant_scores(p_event uuid)
returns table (registration_id uuid, attendee_id uuid, tier public.score_tier,
               attended integer, no_shows integer, score integer, id_verified boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_org uuid; v_full boolean;
begin
  if not private.manages_event(p_event) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select organizer_id into v_org from public.events where id = p_event;
  v_full := private.plan_allows(v_org, 'full_guest_score');
  return query
    select r.id, r.attendee_id, coalesce(st.tier, 'new'::public.score_tier),
           case when v_full then st.attended end, case when v_full then st.no_shows end,
           case when v_full then st.score end,
           coalesce(pp.id_status = 'verified', false)
    from public.registrations r
    left join public.attendee_stats st on st.id = r.attendee_id
    left join public.profile_private pp on pp.id = r.attendee_id
    where r.event_id = p_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Row level security + grants, table by table
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- profiles: owner reads; public data is served through public_organizers
grant select on public.profiles to authenticated;
grant update (full_name, username, avatar_url, city, ui_theme) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- profile_private
grant select on public.profile_private to authenticated;
grant update (phone, date_of_birth, gender, notification_prefs) on public.profile_private to authenticated;
create policy profile_private_select on public.profile_private for select to authenticated
  using (id = auth.uid() or private.is_admin());
create policy profile_private_update on public.profile_private for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- organizer_profiles
grant select on public.organizer_profiles to authenticated;
grant update (company_name, bio, logo_url, cover_url, whatsapp, contact_email, instagram, website, public_contact)
  on public.organizer_profiles to authenticated;
create policy organizer_profiles_select on public.organizer_profiles for select to authenticated
  using (id = auth.uid() or private.is_admin());
create policy organizer_profiles_update on public.organizer_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- score data: owner only (organizers use get_registrant_scores)
grant select on public.attendee_stats to authenticated;
create policy attendee_stats_select on public.attendee_stats for select to authenticated
  using (id = auth.uid() or private.is_admin());
grant select on public.score_events to authenticated;
create policy score_events_select on public.score_events for select to authenticated
  using (attendee_id = auth.uid() or private.is_admin());

-- billing
grant select on public.plans, public.plan_limits to anon, authenticated;
create policy plans_select on public.plans for select to anon, authenticated using (true);
create policy plan_limits_select on public.plan_limits for select to anon, authenticated using (true);
grant select on public.organizer_subscriptions, public.subscription_payments, public.subscription_invoices to authenticated;
create policy subs_select on public.organizer_subscriptions for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());
create policy sub_payments_select on public.subscription_payments for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());
create policy sub_invoices_select on public.subscription_invoices for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());

-- categories: public
grant select on public.event_categories to anon, authenticated;
create policy event_categories_select on public.event_categories for select to anon, authenticated using (true);

-- events
grant select on public.events to authenticated;
grant insert (organizer_id, title, description, cover_image_url, category_id, tags, city, area_label, venue_name, venue_address,
              is_secret_venue, starts_at, ends_at, capacity, status, visibility, registration_mode,
              require_id_verified, male_ratio_max, female_ratio_max)
  on public.events to authenticated;
grant update (title, description, cover_image_url, category_id, tags, city, area_label, venue_name, venue_address,
              is_secret_venue, starts_at, ends_at, capacity, status, visibility, registration_mode,
              require_id_verified, male_ratio_max, female_ratio_max)
  on public.events to authenticated;
grant delete on public.events to authenticated;
create policy events_select on public.events for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin() or private.is_registrant(id));
create policy events_insert on public.events for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy events_update on public.events for update to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy events_delete on public.events for delete to authenticated
  using (organizer_id = auth.uid() and status = 'draft');

-- event_secrets: organizer only (attendees go through get_event_secret)
grant select on public.event_secrets to authenticated;
grant update (venue_address, venue_notes, reveal_at, require_reference_code, reference_code)
  on public.event_secrets to authenticated;
create policy event_secrets_select on public.event_secrets for select to authenticated
  using (private.manages_event(event_id));
create policy event_secrets_update on public.event_secrets for update to authenticated
  using (private.owns_event(event_id)) with check (private.owns_event(event_id));

-- ticket types
grant select, insert, update, delete on public.ticket_types to authenticated;
create policy ticket_types_select on public.ticket_types for select to authenticated
  using (private.manages_event(event_id) or private.is_registrant(event_id));
create policy ticket_types_insert on public.ticket_types for insert to authenticated
  with check (private.owns_event(event_id));
create policy ticket_types_update on public.ticket_types for update to authenticated
  using (private.owns_event(event_id)) with check (private.owns_event(event_id));
create policy ticket_types_delete on public.ticket_types for delete to authenticated
  using (private.owns_event(event_id)
         and not exists (select 1 from public.registrations r where r.ticket_type_id = ticket_types.id));

-- announcements: read by organizer and registrants; written by publish_announcement()
grant select on public.event_announcements to authenticated;
create policy announcements_select on public.event_announcements for select to authenticated
  using (private.manages_event(event_id) or private.is_registrant(event_id));

-- favourites
grant select, insert, delete on public.organizer_favourites to authenticated;
create policy favourites_all on public.organizer_favourites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- registrations: read only. Mutations go through functions. Organizers may flag VIP and add notes.
grant select on public.registrations to authenticated;
grant update (is_vip, notes, plus_one, plus_one_name) on public.registrations to authenticated;
create policy registrations_select on public.registrations for select to authenticated
  using (attendee_id = auth.uid() or private.manages_event(event_id));
create policy registrations_update on public.registrations for update to authenticated
  using (private.owns_event(event_id)) with check (private.owns_event(event_id));

-- payment accounts and links
grant select, insert, update, delete on public.payment_accounts to authenticated;
create policy payment_accounts_select on public.payment_accounts for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin() or private.attendee_sees_account(id));
create policy payment_accounts_insert on public.payment_accounts for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy payment_accounts_update on public.payment_accounts for update to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy payment_accounts_delete on public.payment_accounts for delete to authenticated
  using (organizer_id = auth.uid());

grant select, insert, delete on public.event_payment_accounts to authenticated;
create policy epa_select on public.event_payment_accounts for select to authenticated
  using (private.manages_event(event_id) or private.is_registrant(event_id));
create policy epa_insert on public.event_payment_accounts for insert to authenticated
  with check (private.owns_event(event_id)
              and exists (select 1 from public.payment_accounts a
                          where a.id = payment_account_id and a.organizer_id = auth.uid()));
create policy epa_delete on public.event_payment_accounts for delete to authenticated
  using (private.owns_event(event_id));

-- payment submissions: read only
grant select on public.payment_submissions to authenticated;
create policy payment_submissions_select on public.payment_submissions for select to authenticated
  using (private.can_see_registration(registration_id));

-- gate staff links: organizer reads own, never the token hash
grant select (id, organizer_id, label, event_ids, expires_at, revoked_at, last_used_at, created_at)
  on public.gate_staff_links to authenticated;
create policy gate_links_select on public.gate_staff_links for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());

-- scan logs
grant select on public.scan_logs to authenticated;
create policy scan_logs_select on public.scan_logs for select to authenticated
  using (private.manages_event(event_id));

-- referrals
grant select (id, organizer_id, name, phone, email, is_active, created_at) on public.referrers to authenticated;
grant update (name, phone, email, is_active) on public.referrers to authenticated;
create policy referrers_select on public.referrers for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());
create policy referrers_update on public.referrers for update to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());

grant select, delete on public.referral_links to authenticated;
grant insert (event_id, referrer_id, code, commission_mode, commission_value, commission_tiers,
              buyer_discount_type, buyer_discount_value, discount_funded_by, max_uses, expires_at, is_active)
  on public.referral_links to authenticated;
grant update (code, commission_mode, commission_value, commission_tiers, buyer_discount_type,
              buyer_discount_value, discount_funded_by, max_uses, expires_at, is_active)
  on public.referral_links to authenticated;
create policy referral_links_select on public.referral_links for select to authenticated
  using (private.manages_event(event_id));
create policy referral_links_insert on public.referral_links for insert to authenticated
  with check (private.owns_event(event_id)
              and exists (select 1 from public.referrers r where r.id = referrer_id and r.organizer_id = auth.uid()));
create policy referral_links_update on public.referral_links for update to authenticated
  using (private.owns_event(event_id)) with check (private.owns_event(event_id));
create policy referral_links_delete on public.referral_links for delete to authenticated
  using (private.owns_event(event_id));

grant select, delete on public.coupons to authenticated;
grant insert (event_id, code, discount_type, discount_value, max_uses, expires_at, is_active)
  on public.coupons to authenticated;
grant update (code, discount_type, discount_value, max_uses, expires_at, is_active) on public.coupons to authenticated;
create policy coupons_select on public.coupons for select to authenticated using (private.manages_event(event_id));
create policy coupons_insert on public.coupons for insert to authenticated with check (private.owns_event(event_id));
create policy coupons_update on public.coupons for update to authenticated
  using (private.owns_event(event_id)) with check (private.owns_event(event_id));
create policy coupons_delete on public.coupons for delete to authenticated using (private.owns_event(event_id));

grant select, insert, update on public.organizer_commission_defaults to authenticated;
create policy commission_defaults_all on public.organizer_commission_defaults for all to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid() and private.is_organizer());

grant select on public.commissions to authenticated;
grant update (status, paid_at, note) on public.commissions to authenticated;
create policy commissions_select on public.commissions for select to authenticated
  using (organizer_id = auth.uid() or private.is_admin());
create policy commissions_update on public.commissions for update to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());

-- CRM
grant select, insert, update, delete on public.organizer_vendors, public.organizer_vendor_invoices to authenticated;
create policy vendors_all on public.organizer_vendors for all to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid() and private.is_organizer());
create policy vendor_invoices_all on public.organizer_vendor_invoices for all to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid()
              and exists (select 1 from public.organizer_vendors v where v.id = vendor_id and v.organizer_id = auth.uid()));

-- notifications
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.push_tokens to authenticated;
create policy push_tokens_all on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- system tables: no client access. email_outbox is service role only.
grant select on public.admin_audit_log to authenticated;
create policy audit_select on public.admin_audit_log for select to authenticated using (private.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Views: the public read surface
-- ---------------------------------------------------------------------------
grant select on public.event_listings, public.public_ticket_types, public.public_organizers to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Function execute grants
-- ---------------------------------------------------------------------------
grant execute on function
  public.get_event(text),
  public.get_top_organizers(integer),
  public.gate_get_events(text),
  public.gate_check_in(text, uuid, text, uuid, boolean),
  public.gate_lookup(text, uuid, text),
  public.promoter_dashboard(text)
  to anon, authenticated;

grant execute on function
  public.register_for_event(uuid, uuid, date[], text, text, text, boolean, text, text),
  public.submit_payment(uuid, text, text),
  public.review_registration(uuid, boolean, text),
  public.review_payment(uuid, boolean, text),
  public.cancel_registration(uuid),
  public.add_manual_registration(uuid, text, text, text, uuid, public.registration_source, boolean, boolean, date[]),
  public.organizer_check_in(uuid, text, uuid),
  public.create_gate_link(text, uuid[]),
  public.revoke_gate_link(uuid),
  public.get_event_secret(uuid),
  public.publish_announcement(uuid, text, boolean),
  public.create_referrer(text, text, text),
  public.rotate_referrer_token(uuid),
  public.preview_code(uuid, text, uuid),
  public.submit_id_verification(public.id_type, text, text, date),
  public.review_id_verification(uuid, boolean, text),
  public.submit_subscription_payment(text, public.billing_period, text, text),
  public.review_subscription_payment(uuid, boolean, text),
  public.my_entitlements(),
  public.master_overview(),
  public.admin_set_event_status(uuid, public.admin_status),
  public.get_registrant_scores(uuid)
  to authenticated;

grant execute on function public.reveal_due_events(), public.process_no_shows() to service_role;

commit;
