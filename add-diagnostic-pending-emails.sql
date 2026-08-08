-- Holds a result email until the teacher confirms it. email-result no longer
-- sends to the student/parent directly — it sends a preview of the exact
-- same email to the teacher's own address with a "Confirm & Send" link, and
-- only confirm-send-email (hit from that link, after teacher login) actually
-- delivers to the student/parent. See app/api/diagnostic/admin/email-result
-- and .../confirm-send-email.
create table if not exists diagnostic_pending_emails (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references diagnostic_attempts(id) on delete cascade,
  teacher_note text,
  include_mcq boolean not null default true,
  include_frq boolean not null default true,
  include_integrity_note boolean not null default true,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists diagnostic_pending_emails_token_idx on diagnostic_pending_emails(token);

-- Every read/write to this table goes through the service-role admin
-- client (which bypasses RLS regardless), never the anon/authenticated
-- client — so RLS with no policies just locks it to service-role only,
-- matching the pattern already used by the rest of this app's tables.
alter table diagnostic_pending_emails enable row level security;
