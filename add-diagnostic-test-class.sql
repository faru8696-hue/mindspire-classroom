-- Lets a teacher "publish" a Test to one of their classes so enrolled
-- students see it inside their normal logged-in classroom view, instead of
-- only being reachable via the raw public /diagnostic/<slug> link.
alter table diagnostic_tests add column if not exists class_id uuid references classes(id) on delete set null;

create index if not exists diagnostic_tests_class_id_idx on diagnostic_tests(class_id) where class_id is not null;

-- Logged-in students need to read the (non-sensitive) title/description/slug
-- of a test published to their own class, so it can show up in their normal
-- classroom view. diagnostic_tests otherwise has no authenticated-role
-- policy at all (every other read/write goes through createAdminClient()).
create policy "diagnostic_tests_student" on diagnostic_tests for select using (
  auth_role() = 'student' and auth_is_approved() and is_active = true and class_id = auth_student_class_id()
);
