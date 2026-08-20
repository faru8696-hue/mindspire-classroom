-- Per-class extras alongside the topic checklist (student_topic_plans, see
-- add-topic-planning.sql): "my school hasn't started this class yet" and a
-- free-text catch-all for anything not on our curriculum list. Also doubles
-- as the completion signal for the login gate — a class counts as "done" if
-- the student checked a topic OR filled in one of these.

create table if not exists student_school_status (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  not_started boolean not null default false,
  other_topics text,
  updated_at timestamptz default now() not null,
  unique(student_id, class_id)
);
alter table student_school_status enable row level security;
create policy "student_school_status_own" on student_school_status for all using (student_id = auth.uid());
create policy "student_school_status_teacher_read" on student_school_status for select using (auth_role() = 'teacher');
