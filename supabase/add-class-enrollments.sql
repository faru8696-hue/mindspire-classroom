-- Many-to-many class enrollment table
create table if not exists class_enrollments (
  student_id uuid not null references profiles(id) on delete cascade,
  class_id   uuid not null references classes(id) on delete cascade,
  enrolled_at timestamptz default now() not null,
  primary key (student_id, class_id)
);

alter table class_enrollments enable row level security;

-- Service role (admin client) has full access
create policy "Service role full access" on class_enrollments
  for all to service_role using (true);

-- Students can read their own enrollments
create policy "Students read own" on class_enrollments
  for select to authenticated using (student_id = auth.uid());

-- Migrate existing single-class assignments
insert into class_enrollments (student_id, class_id)
select id, class_id
from profiles
where class_id is not null
  and role = 'student'
  and approved = true
on conflict do nothing;
