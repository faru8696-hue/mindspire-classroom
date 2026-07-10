-- AI Faridah chat history — every turn of a student's Socratic tutor chat,
-- so teachers can review what a student asked and how the AI guided them.
create table if not exists ai_chat_messages (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  message text not null,
  created_at timestamptz default now() not null
);

create index if not exists ai_chat_messages_question_student_idx
  on ai_chat_messages (question_id, student_id, created_at);

alter table ai_chat_messages enable row level security;

-- Students see/write only their own chat
create policy "ai_chat_student_own" on ai_chat_messages for all using (
  student_id = auth.uid()
);
-- Teachers can read (and write, for consistency with other tables) all chats
create policy "ai_chat_teacher" on ai_chat_messages for all using (auth_role() = 'teacher');
