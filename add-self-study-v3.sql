-- Self-study v3: FRQ questions now get a scratch canvas during the test
-- (student's work is saved alongside their self-grade), and completed tests
-- notify the teacher.
alter table practice_attempts add column if not exists canvas_data text;
alter table practice_attempts add column if not exists mcq_selected_index integer;

-- Deliberately a separate table from the shared `notifications` table
-- (which is question_id-keyed, doesn't fit a multi-question test, and has a
-- restrictive type check constraint) — this is a self-contained "a student
-- finished a self-study test" alert, not mixed into the existing
-- help/submitted/comment feed.
create table if not exists practice_test_notifications (
  id uuid default gen_random_uuid() primary key,
  test_id uuid references practice_tests(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  read boolean not null default false,
  created_at timestamptz default now() not null
);
alter table practice_test_notifications enable row level security;
create policy "practice_test_notifications_teacher" on practice_test_notifications for all using (auth_role() = 'teacher');
