create table if not exists corporate_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  full_name   text not null,
  company     text not null,
  role        text not null,
  email       text not null,
  phone       text,
  event_type  text not null,
  headcount   text not null,
  message     text,

  status      text not null default 'new'  -- new | contacted | qualified | closed
);

alter table corporate_leads enable row level security;

-- Only service role (server actions) can insert/read
create policy "service_insert" on corporate_leads
  for insert with check (true);
