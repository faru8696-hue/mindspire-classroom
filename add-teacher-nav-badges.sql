-- Generic "last seen" tracker so nav badges (Submissions, Students,
-- Activity) behave like Self Study's: a count of NEW items since the
-- teacher last visited that section, which clears the moment they click in
-- — not a live backlog count that never goes away while work remains.
create table if not exists teacher_nav_seen (
  nav_key text primary key,
  seen_at timestamptz not null default '1970-01-01'
);
alter table teacher_nav_seen enable row level security;
create policy "teacher_nav_seen_teacher" on teacher_nav_seen for all using (auth_role() = 'teacher');
