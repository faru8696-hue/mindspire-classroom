-- Step 1: Drop ALL policies on all tables (no matter what they're called)
do $$
declare r record;
begin
  for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Step 2: Helper functions (read role from JWT, no table query)
create or replace function auth_role()
returns text as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student')
$$ language sql stable;

create or replace function auth_is_approved()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and approved = true)
$$ language sql stable security definer;

-- Step 3: Create correct policies
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_select_teacher" on profiles for select using (auth_role() = 'teacher');
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_update_teacher" on profiles for update using (auth_role() = 'teacher');

create policy "units_teacher" on units for all using (auth_role() = 'teacher');
create policy "units_student" on units for select using (auth_role() = 'student' and auth_is_approved());

create policy "topics_teacher" on topics for all using (auth_role() = 'teacher');
create policy "topics_student" on topics for select using (auth_role() = 'student' and auth_is_approved());

create policy "questions_teacher" on questions for all using (auth_role() = 'teacher');
create policy "questions_student" on questions for select using (auth_role() = 'student' and auth_is_approved());

create policy "submissions_student" on submissions for all using (auth.uid() = student_id);
create policy "submissions_teacher_select" on submissions for select using (auth_role() = 'teacher');

create policy "feedback_teacher" on feedback for all using (auth_role() = 'teacher');
create policy "feedback_student" on feedback for select using (
  exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid())
);

create policy "comments_student" on comments for all using (
  student_id = auth.uid() or author_id = auth.uid()
);
create policy "comments_teacher" on comments for all using (auth_role() = 'teacher');
