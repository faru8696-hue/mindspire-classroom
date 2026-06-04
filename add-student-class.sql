-- Add class assignment to student profiles
alter table profiles add column if not exists class_id uuid references classes(id) on delete set null;

-- Function to get student's assigned class (security definer = bypasses RLS)
create or replace function auth_student_class_id()
returns uuid as $$
  select class_id from profiles where id = auth.uid()
$$ language sql stable security definer;

-- Update unit policy: students only see units from their assigned class
drop policy if exists "units_student" on units;
create policy "units_student" on units for select using (
  auth_role() = 'student' and auth_is_approved() and class_id = auth_student_class_id()
);

-- Update topic policy: students only see topics in their class's units
drop policy if exists "topics_student" on topics;
create policy "topics_student" on topics for select using (
  auth_role() = 'student' and auth_is_approved() and
  exists (
    select 1 from units u where u.id = unit_id and u.class_id = auth_student_class_id()
  )
);

-- Update question policy: students only see questions in their class
drop policy if exists "questions_student" on questions;
create policy "questions_student" on questions for select using (
  auth_role() = 'student' and auth_is_approved() and
  exists (
    select 1 from topics t
    join units u on u.id = t.unit_id
    where t.id = topic_id and u.class_id = auth_student_class_id()
  )
);
