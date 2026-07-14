-- Self-study feature: student-built custom tests (self-checked against the
-- answer key, no teacher/AI grading involved) and a personal "review" folder
-- of flagged questions (manually flagged, or auto-added when a student marks
-- their own self-test attempt incorrect/partial).
--
-- Deliberately separate from submissions/feedback/grade_history — self-graded
-- attempts are the student's own honesty-based assessment, not a
-- teacher-verified grade, so they must never feed into mastery %, the
-- teacher's grading queue, or parent reports.

create table if not exists practice_tests (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  title text not null,
  question_ids uuid[] not null,
  created_at timestamptz default now() not null
);
alter table practice_tests enable row level security;
create policy "practice_tests_own" on practice_tests for all using (student_id = auth.uid());
create policy "practice_tests_teacher_read" on practice_tests for select using (auth_role() = 'teacher');

create table if not exists practice_attempts (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  test_id uuid references practice_tests(id) on delete cascade, -- null when self-checked directly from the Review folder, not part of a built test
  self_grade text check (self_grade in ('correct', 'partial', 'incorrect')) not null,
  created_at timestamptz default now() not null
);
alter table practice_attempts enable row level security;
create policy "practice_attempts_own" on practice_attempts for all using (student_id = auth.uid());
create policy "practice_attempts_teacher_read" on practice_attempts for select using (auth_role() = 'teacher');

create table if not exists review_flags (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  source text check (source in ('manual', 'auto')) not null default 'manual',
  created_at timestamptz default now() not null,
  unique(student_id, question_id)
);
alter table review_flags enable row level security;
create policy "review_flags_own" on review_flags for all using (student_id = auth.uid());
