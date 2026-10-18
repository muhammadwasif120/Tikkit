-- TIKKIT X baseline 10/10: storage, scheduled jobs, seed data

begin;

-- ---------------------------------------------------------------------------
-- Seed: plans and limits (-1 = unlimited). Tuned later without a deploy.
-- ---------------------------------------------------------------------------
insert into public.plans (id, name, price_pkr_month, price_pkr_year, sort, is_purchasable) values
  ('trial', 'Trial', 0, 0, 0, false),
  ('starter', 'Starter', 2999, 29990, 1, true),
  ('growth', 'Growth', 7999, 79990, 2, true),
  ('pro', 'Pro', 12999, 129990, 3, true)
on conflict (id) do update set name = excluded.name, price_pkr_month = excluded.price_pkr_month,
  price_pkr_year = excluded.price_pkr_year, sort = excluded.sort, is_purchasable = excluded.is_purchasable;

insert into public.plan_limits (plan_id, key, value) values
  ('trial', 'events_per_month', '1'::jsonb),
  ('starter', 'events_per_month', '3'::jsonb),
  ('growth', 'events_per_month', '10'::jsonb),
  ('pro', 'events_per_month', '-1'::jsonb),
  ('trial', 'registrations_per_event', '100'::jsonb),
  ('starter', 'registrations_per_event', '150'::jsonb),
  ('growth', 'registrations_per_event', '1000'::jsonb),
  ('pro', 'registrations_per_event', '-1'::jsonb),
  ('trial', 'gate_staff_links', '10'::jsonb),
  ('starter', 'gate_staff_links', '2'::jsonb),
  ('growth', 'gate_staff_links', '10'::jsonb),
  ('pro', 'gate_staff_links', '-1'::jsonb),
  ('trial', 'announcements_per_event', '-1'::jsonb),
  ('starter', 'announcements_per_event', '2'::jsonb),
  ('growth', 'announcements_per_event', '-1'::jsonb),
  ('pro', 'announcements_per_event', '-1'::jsonb),
  ('trial', 'auto_reveal', 'true'::jsonb),
  ('starter', 'auto_reveal', 'false'::jsonb),
  ('growth', 'auto_reveal', 'true'::jsonb),
  ('pro', 'auto_reveal', 'true'::jsonb),
  ('trial', 'promoters', '-1'::jsonb),
  ('starter', 'promoters', '3'::jsonb),
  ('growth', 'promoters', '-1'::jsonb),
  ('pro', 'promoters', '-1'::jsonb),
  ('trial', 'advanced_commission', 'true'::jsonb),
  ('starter', 'advanced_commission', 'false'::jsonb),
  ('growth', 'advanced_commission', 'true'::jsonb),
  ('pro', 'advanced_commission', 'true'::jsonb),
  ('trial', 'full_guest_score', 'true'::jsonb),
  ('starter', 'full_guest_score', 'false'::jsonb),
  ('growth', 'full_guest_score', 'true'::jsonb),
  ('pro', 'full_guest_score', 'true'::jsonb),
  ('trial', 'vendors', '-1'::jsonb),
  ('starter', 'vendors', '10'::jsonb),
  ('growth', 'vendors', '-1'::jsonb),
  ('pro', 'vendors', '-1'::jsonb),
  ('trial', 'full_analytics', 'true'::jsonb),
  ('starter', 'full_analytics', 'false'::jsonb),
  ('growth', 'full_analytics', 'true'::jsonb),
  ('pro', 'full_analytics', 'true'::jsonb),
  ('trial', 'email_blasts_per_month', '200'::jsonb),
  ('starter', 'email_blasts_per_month', '0'::jsonb),
  ('growth', 'email_blasts_per_month', '2000'::jsonb),
  ('pro', 'email_blasts_per_month', '10000'::jsonb),
  ('trial', 'remove_branding', 'true'::jsonb),
  ('starter', 'remove_branding', 'false'::jsonb),
  ('growth', 'remove_branding', 'true'::jsonb),
  ('pro', 'remove_branding', 'true'::jsonb),
  ('trial', 'white_label', 'false'::jsonb),
  ('starter', 'white_label', 'false'::jsonb),
  ('growth', 'white_label', 'false'::jsonb),
  ('pro', 'white_label', 'true'::jsonb),
  ('trial', 'id_required_events', 'true'::jsonb),
  ('starter', 'id_required_events', 'false'::jsonb),
  ('growth', 'id_required_events', 'true'::jsonb),
  ('pro', 'id_required_events', 'true'::jsonb),
  ('trial', 'classes', '1'::jsonb),
  ('starter', 'classes', '1'::jsonb),
  ('growth', 'classes', '5'::jsonb),
  ('pro', 'classes', '-1'::jsonb),
  ('trial', 'spaces', '1'::jsonb),
  ('starter', 'spaces', '1'::jsonb),
  ('growth', 'spaces', '3'::jsonb),
  ('pro', 'spaces', '-1'::jsonb)
on conflict (plan_id, key) do update set value = excluded.value;

insert into public.event_categories (id, name, slug, icon, color, sort) values
  ('033bba95-a74f-4502-b2d7-da3a6bead9d7', 'Music', 'music', '🎵', '#8B5CF6', 1),
  ('e4d75599-9662-4fe2-aac3-1c197dda2508', 'Tech', 'tech', '💻', '#06B6D4', 2),
  ('6dcc3362-5e0a-4933-b0e5-95d808218f48', 'Art & Culture', 'art-culture', '🎨', '#F59E0B', 3),
  ('766223a3-e6a6-41cf-8bf5-111601c019c8', 'Sports', 'sports', '⚽', '#10B981', 4),
  ('c52ae858-8a5e-43d9-8558-ea0c30556f9b', 'Food & Drink', 'food-drink', '🍔', '#EF4444', 5),
  ('f02ac773-6b97-4d47-8ddc-9f3db01d736f', 'Business', 'business', '💼', '#1E5EFF', 6),
  ('cfed7bad-9455-4413-b31e-3127a8188ba5', 'Fashion', 'fashion', '👗', '#EC4899', 7),
  ('3ec90f28-a3c1-4e20-8806-cb139257393f', 'Networking', 'networking', '🤝', '#6366F1', 8),
  ('10baea70-2dfc-40af-b574-a885c18bee0d', 'Education', 'education', '📚', '#14B8A6', 9),
  ('f900c53b-5616-4e72-88d0-dfaa1d995b83', 'Gaming', 'gaming', '🎮', '#7C3AED', 10),
  ('6178d019-6460-46f5-b778-6682df1e21ba', 'Health & Wellness', 'health-wellness', '💪', '#84CC16', 11),
  ('4f504d0a-d406-48d4-a547-2a6d6a23f817', 'Comedy', 'comedy', '😂', '#F97316', 12),
  ('4c46038e-3e85-4cd7-937d-1d65261611d4', 'Social', 'social', '🥳', '#FB7185', 13),
  ('e8f33122-d048-4e52-a01a-af33777f4133', 'Charity', 'charity', '❤️', '#F43F5E', 14)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('event-media',        'event-media',        true,  10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('payment-proofs',     'payment-proofs',     false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('id-documents',       'id-documents',       false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('subscription-proofs','subscription-proofs',false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Folder conventions
--   event-media/<user_id>/...
--   payment-proofs/<attendee_id>/<registration_id>/...
--   id-documents/<user_id>/...
--   subscription-proofs/<organizer_id>/...
create or replace function private.try_uuid(p text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

create policy "event media is public" on storage.objects for select to anon, authenticated
  using (bucket_id = 'event-media');
create policy "event media owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "event media owner update" on storage.objects for update to authenticated
  using (bucket_id = 'event-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "event media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'event-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "payment proofs attendee upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "payment proofs readable by parties" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs'
         and ((storage.foldername(name))[1] = auth.uid()::text
              or private.can_see_registration(private.try_uuid((storage.foldername(name))[2]))));

create policy "id documents owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "id documents owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'id-documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));

create policy "subscription proofs owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'subscription-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "subscription proofs owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'subscription-proofs'
         and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));

-- ---------------------------------------------------------------------------
-- Scheduled jobs (pg_cron). Idempotent by name.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job
 where jobname in ('tkx_reveal_due_events', 'tkx_process_no_shows', 'auto-archive-events');  -- legacy job removed
select cron.schedule('tkx_reveal_due_events', '* * * * *', $$select public.reveal_due_events()$$);
select cron.schedule('tkx_process_no_shows',  '17 * * * *', $$select public.process_no_shows()$$);

commit;
