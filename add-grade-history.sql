-- Append-only log of grading events so we can show improvement over time.
-- The feedback table holds only the *latest* grade per submission (it's upserted),
-- which means earlier grades are lost. This table records every grade change with a
-- timestamp, so a student's history (e.g. incorrect → partial → correct) is preserved.
create table if not exists grade_history (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  submission_id uuid references submissions(id) on delete set null,
  grade text not null,
  text_feedback text,
  teacher_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Fast lookups for a student's timeline on a question, and overall timelines.
create index if not exists grade_history_student_question_idx
  on grade_history (student_id, question_id, created_at);
create index if not exists grade_history_student_created_idx
  on grade_history (student_id, created_at);

alter table grade_history enable row level security;

-- Students may read their own history; teachers may read/write everything.
-- (Writes happen server-side via the service-role key, which bypasses RLS — these
-- policies just govern any direct client reads.)
create policy "grade_history_student_own" on grade_history for select using (
  student_id = auth.uid()
);
create policy "grade_history_teacher" on grade_history for all using (
  auth_role() = 'teacher'
);
