-- Add classes table
create table if not exists classes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  order_index integer not null default 0,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Add class_id to units
alter table units add column if not exists class_id uuid references classes(id) on delete cascade;

-- Enable RLS
alter table classes enable row level security;

-- Policies for classes
create policy "classes_teacher" on classes for all using (auth_role() = 'teacher');
create policy "classes_student" on classes for select using (auth_role() = 'student' and auth_is_approved());

-- Insert the two classes
insert into classes (title, order_index, created_by) values
  ('Honors Chemistry', 0, '02db000a-e94e-4220-95e2-6202433e6054'),
  ('AP Chemistry', 1, '02db000a-e94e-4220-95e2-6202433e6054');
s


