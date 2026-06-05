-- Teacher private notes per student
create table if not exists teacher_notes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  content     text not null default '',
  updated_at  timestamptz default now() not null,
  unique(teacher_id, student_id)
);

-- Only the teacher who owns the note can read/write it
alter table teacher_notes enable row level security;

create policy "teacher can manage own notes"
  on teacher_notes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
