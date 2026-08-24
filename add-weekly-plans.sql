-- Persists the AI-generated weekly plan (app/teacher/planning) per class so
-- it survives a page reload instead of only living in client state, and
-- lets the teacher publish it for students to see on their dashboard.
-- One row per class — generating a new plan overwrites the old one and
-- resets shared to false, so a regenerated plan always needs a fresh,
-- deliberate share rather than silently replacing what students see.
create table if not exists weekly_plans (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade not null unique,
  feasibility_note text,
  sessions jsonb not null,
  generated_at timestamptz default now() not null,
  shared boolean not null default false,
  shared_at timestamptz
);
alter table weekly_plans enable row level security;
create policy "weekly_plans_teacher_all" on weekly_plans for all using (auth_role() = 'teacher');
create policy "weekly_plans_student_read_shared" on weekly_plans for select using (
  auth_role() = 'student' and auth_is_approved() and shared = true
  and exists (select 1 from class_enrollments ce where ce.class_id = weekly_plans.class_id and ce.student_id = auth.uid())
);
