create table if not exists student_assignments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  due_date date,
  assigned_at timestamptz default now() not null,
  unique(student_id, question_id)
);

alter table student_assignments enable row level security;

create policy "teacher_manage_student_assignments" on student_assignments
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create policy "student_view_own_assignments" on student_assignments
  for select using (student_id = auth.uid());
