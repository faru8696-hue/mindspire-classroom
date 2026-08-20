-- Lets students report which curriculum topics their OWN school is
-- currently covering (independent of Faridah's own class pace), and
-- optionally when their school's test on that topic is. Aggregated on the
-- teacher side (app/teacher/planning) to help decide what to teach and when
-- across the Tue/Sat/Sun group sessions, since she can't pace to every
-- individual school.
--
-- Row existence = "my school is teaching this topic." class_id is
-- denormalized from topic_id -> topics.unit_id -> units.class_id (same
-- tradeoff practice_tests.class_id takes in add-self-study.sql) so the
-- teacher planning page can filter/group by class without a 3-hop join.

create table if not exists student_topic_plans (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  test_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_id, topic_id)
);
alter table student_topic_plans enable row level security;
create policy "student_topic_plans_own" on student_topic_plans for all using (student_id = auth.uid());
create policy "student_topic_plans_teacher_read" on student_topic_plans for select using (auth_role() = 'teacher');

create index if not exists student_topic_plans_class_id_idx on student_topic_plans(class_id);
create index if not exists student_topic_plans_topic_id_idx on student_topic_plans(topic_id);
