import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fsfvcgrrevkeakepwioi.supabase.co',
  'sb_secret_Sh2GT9wyBQwHcaOjPUNQ8w_Un04njC1'
)

const sql = `
-- Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('teacher', 'student')),
  approved boolean not null default false,
  created_at timestamptz default now() not null
);

-- Units
create table if not exists units (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Topics
create table if not exists topics (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade not null,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz default now() not null
);

-- Questions
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  title text not null,
  content text,
  order_index integer not null default 0,
  created_at timestamptz default now() not null
);

-- Submissions
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  canvas_data text,
  text_answer text,
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(question_id, student_id)
);

-- Feedback
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade not null unique,
  teacher_id uuid references profiles(id) on delete cascade not null,
  canvas_data text,
  text_feedback text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table units enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table feedback enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_select_teacher" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_update_teacher" on profiles;
drop policy if exists "units_teacher" on units;
drop policy if exists "units_student" on units;
drop policy if exists "topics_teacher" on topics;
drop policy if exists "topics_student" on topics;
drop policy if exists "questions_teacher" on questions;
drop policy if exists "questions_student" on questions;
drop policy if exists "submissions_student" on submissions;
drop policy if exists "submissions_teacher_select" on submissions;
drop policy if exists "feedback_teacher" on feedback;
drop policy if exists "feedback_student" on feedback;

-- Profile policies
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_select_teacher" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_update_teacher" on profiles for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);

-- Unit policies
create policy "units_teacher" on units for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "units_student" on units for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student' and p.approved = true)
);

-- Topic policies
create policy "topics_teacher" on topics for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "topics_student" on topics for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student' and p.approved = true)
);

-- Question policies
create policy "questions_teacher" on questions for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "questions_student" on questions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student' and p.approved = true)
);

-- Submission policies
create policy "submissions_student" on submissions for all using (auth.uid() = student_id);
create policy "submissions_teacher_select" on submissions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);

-- Feedback policies
create policy "feedback_teacher" on feedback for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "feedback_student" on feedback for select using (
  exists (
    select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()
  )
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    case when coalesce(new.raw_user_meta_data->>'role', 'student') = 'teacher' then true else false end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`

async function run() {
  console.log('Setting up database...')
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: null }))

  // Use the REST API to run SQL directly
  const response = await fetch(`https://fsfvcgrrevkeakepwioi.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'sb_secret_Sh2GT9wyBQwHcaOjPUNQ8w_Un04njC1',
      'Authorization': `Bearer sb_secret_Sh2GT9wyBQwHcaOjPUNQ8w_Un04njC1`
    },
    body: JSON.stringify({ sql_query: sql })
  })

  if (!response.ok) {
    // Try the management API approach
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/fsfvcgrrevkeakepwioi/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sb_secret_Sh2GT9wyBQwHcaOjPUNQ8w_Un04njC1`
      },
      body: JSON.stringify({ query: sql })
    })
    const mgmtData = await mgmtResponse.text()
    console.log('Management API response:', mgmtData)
  } else {
    const data = await response.json()
    console.log('Done:', data)
  }
}

run().catch(console.error)
