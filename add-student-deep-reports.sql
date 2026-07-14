create table if not exists student_deep_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade unique,
  report_text text not null,
  generated_by uuid references profiles(id),
  generated_at timestamptz not null default now()
);

alter table student_deep_reports enable row level security;

-- All reads/writes happen server-side via the service-role key (bypasses RLS).
-- This policy just governs any direct client access: teacher-only, since the
-- content is a diagnostic tool for teachers/parents, not meant to be shown
-- directly to the student in-app.
create policy "student_deep_reports_teacher" on student_deep_reports for all using (
  auth_role() = 'teacher'
);
