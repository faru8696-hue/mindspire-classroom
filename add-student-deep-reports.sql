create table if not exists student_deep_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade unique,
  report_text text not null,
  generated_by uuid references profiles(id),
  generated_at timestamptz not null default now()
);
