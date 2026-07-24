-- Fix #1: the student-visibility policy added in add-diagnostic-test-class.sql
-- checked profiles.class_id / auth_student_class_id(), which is a legacy
-- single-class field nobody actually has set anymore (every real student has
-- profiles.class_id = null). Real enrollment lives in the many-to-many
-- class_enrollments table (student_id, class_id) — switch the policy to that.
drop policy if exists "diagnostic_tests_student" on diagnostic_tests;
create policy "diagnostic_tests_student" on diagnostic_tests for select using (
  auth_role() = 'student' and auth_is_approved() and is_active = true
  and exists (
    select 1 from class_enrollments ce
    where ce.class_id = diagnostic_tests.class_id and ce.student_id = auth.uid()
  )
);

-- Fix #2: tie a lead/attempt back to the actual logged-in student account
-- (when there is one), so a completed test can be shown as "done" in that
-- student's own classroom view instead of only existing as an anonymous
-- lead-capture record matched by typed-in name/email.
alter table diagnostic_leads add column if not exists student_id uuid references profiles(id) on delete set null;
create index if not exists diagnostic_leads_student_id_idx on diagnostic_leads(student_id) where student_id is not null;
