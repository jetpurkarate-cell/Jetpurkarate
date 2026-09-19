create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.notification_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  link text,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','sent','cancelled','failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  birth_date date not null,
  branch_name text,
  notification_enabled boolean not null default true,
  notification_time time not null default '09:00',
  last_notified_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_schedules enable row level security;
alter table public.birthdays enable row level security;

-- The public panel uses its publishable key only after you add your own
-- authenticated-admin policy. Keep service/secret keys out of the browser.
-- Edge Functions use the server-side secret key for privileged operations.

create index if not exists notification_schedules_due_idx
  on public.notification_schedules (status, scheduled_at);

create index if not exists birthdays_due_idx
  on public.birthdays (notification_enabled, birth_date, notification_time);

-- Run the processor every minute. Replace PROJECT_REF and CRON_SECRET
-- in the Supabase Dashboard/Vault before enabling this job.
-- See README for the exact setup.
