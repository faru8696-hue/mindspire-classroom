-- Add grade to feedback
alter table feedback add column if not exists grade text check (grade in ('correct', 'incorrect', 'partial'));

-- Comments table (per question, per student thread)
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now() not null
);

alter table comments enable row level security;

-- Students see/write comments on their own thread
create policy "comments_student_own" on comments for all using (
  student_id = auth.uid() or author_id = auth.uid()
);
-- Teachers see/write all comments
create policy "comments_teacher" on comments for all using (auth_role() = 'teacher');
