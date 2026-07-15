-- Lets a teacher release a specific question's answer key to one specific
-- student (e.g. after they've struggled with it enough, or for a makeup
-- situation) without exposing it to the whole class.
create table if not exists answer_key_releases (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(student_id, question_id)
);
alter table answer_key_releases enable row level security;
create policy "answer_key_releases_student_read" on answer_key_releases for select using (student_id = auth.uid());
create policy "answer_key_releases_teacher_all" on answer_key_releases for all using (auth_role() = 'teacher');
