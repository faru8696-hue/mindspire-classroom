-- Public, reusable diagnostic-test system (e.g. "AP Chemistry Readiness
-- Diagnostic"). Fully separate from classes/units/topics/questions, which
-- are AP-curriculum-specific and enrollment-gated. Nothing here is ever
-- read via a browser Supabase client — every table is service-role only,
-- accessed exclusively through createAdminClient() in API routes and
-- Server Components, the same way app/teacher/practice-tests/page.tsx
-- talks to practice_tests. Scoring is unweighted (1 question = 1 point).

create table if not exists diagnostic_tests (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  description text,
  question_count_per_attempt integer not null default 90,
  duration_minutes integer not null default 120,
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

-- One topic taxonomy per diagnostic test (NOT shared with `topics`, which is
-- AP-curriculum-specific). prep_advice is authored once per topic and is
-- what powers the deterministic, non-AI "before you start AP Chem" advice —
-- it's just surfaced verbatim for any topic the student scores below
-- "mastered" on. Never generated at request time.
create table if not exists diagnostic_topics (
  id uuid default gen_random_uuid() primary key,
  diagnostic_test_id uuid not null references diagnostic_tests(id) on delete cascade,
  title text not null,
  prep_advice text,
  created_at timestamptz default now() not null,
  unique (diagnostic_test_id, title)
);

create table if not exists diagnostic_questions (
  id uuid default gen_random_uuid() primary key,
  diagnostic_test_id uuid not null references diagnostic_tests(id) on delete cascade,
  -- restrict, not cascade: deleting a topic that still has questions on it
  -- would silently corrupt topic-breakdown scoring for past attempts, so
  -- force the teacher to reassign/delete questions first.
  topic_id uuid not null references diagnostic_topics(id) on delete restrict,
  content text not null,
  image_url text,
  mcq_options jsonb not null,
  mcq_correct_index integer not null,
  source text,
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  check (jsonb_typeof(mcq_options) = 'array' and jsonb_array_length(mcq_options) >= 2),
  check (mcq_correct_index >= 0 and mcq_correct_index < jsonb_array_length(mcq_options))
);

-- Lead-capture record, collected before every attempt (parent contact info
-- doubles as a marketing lead for the tutoring business — first-class,
-- queryable rows, not transient form state). One row per attempt: since
-- there is no login/session at all, a retake simply asks again rather than
-- trying to fuzzy-match/dedupe by email server-side.
create table if not exists diagnostic_leads (
  id uuid default gen_random_uuid() primary key,
  diagnostic_test_id uuid not null references diagnostic_tests(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  created_at timestamptz default now() not null
);

create table if not exists diagnostic_attempts (
  id uuid default gen_random_uuid() primary key,
  diagnostic_test_id uuid not null references diagnostic_tests(id) on delete cascade,
  lead_id uuid not null references diagnostic_leads(id) on delete cascade,
  -- locked-in random draw for this attempt, set once at start and never
  -- recomputed — this IS the "getting new questions on retake" mechanism,
  -- since a new attempt row always samples fresh.
  question_ids uuid[] not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz default now() not null,
  submitted_at timestamptz,
  correct_count integer,
  total_count integer,
  score_pct numeric,
  -- Snapshot written once at grading time: [{topicId, topicTitle, correct,
  -- total, pct, tier}, ...]. Deliberately NOT a live join against
  -- diagnostic_questions.topic_id, so editing a question's topic later
  -- can't rewrite historical results.
  topic_breakdown jsonb,
  created_at timestamptz default now() not null
);

-- Per-question audit trail: which option the student actually picked and
-- whether it was correct (server-computed, never trusts the client) — lets
-- the teacher drill into exactly which questions a student missed, and
-- later supports finding "questions everyone gets wrong" across all attempts.
create table if not exists diagnostic_attempt_answers (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid not null references diagnostic_attempts(id) on delete cascade,
  question_id uuid not null references diagnostic_questions(id) on delete cascade,
  selected_index integer not null,
  is_correct boolean not null,
  created_at timestamptz default now() not null,
  unique (attempt_id, question_id)
);

alter table diagnostic_tests enable row level security;
alter table diagnostic_topics enable row level security;
alter table diagnostic_questions enable row level security;
alter table diagnostic_leads enable row level security;
alter table diagnostic_attempts enable row level security;
alter table diagnostic_attempt_answers enable row level security;

-- Service-role only: no authenticated/anon policy on any of these tables.
-- Every read and write goes through createAdminClient() in an API route or
-- Server Component — there is never a direct browser Supabase-client query
-- against this schema (the public pages have no session to attach anyway).
create policy "Service role full access" on diagnostic_tests for all to service_role using (true);
create policy "Service role full access" on diagnostic_topics for all to service_role using (true);
create policy "Service role full access" on diagnostic_questions for all to service_role using (true);
create policy "Service role full access" on diagnostic_leads for all to service_role using (true);
create policy "Service role full access" on diagnostic_attempts for all to service_role using (true);
create policy "Service role full access" on diagnostic_attempt_answers for all to service_role using (true);

create index if not exists diagnostic_topics_test_id_idx on diagnostic_topics(diagnostic_test_id);
create index if not exists diagnostic_questions_test_id_idx on diagnostic_questions(diagnostic_test_id);
create index if not exists diagnostic_questions_topic_id_idx on diagnostic_questions(topic_id);
create index if not exists diagnostic_questions_active_idx on diagnostic_questions(diagnostic_test_id) where is_active = true;
create index if not exists diagnostic_leads_test_id_idx on diagnostic_leads(diagnostic_test_id);
create index if not exists diagnostic_attempts_test_id_idx on diagnostic_attempts(diagnostic_test_id);
create index if not exists diagnostic_attempts_lead_id_idx on diagnostic_attempts(lead_id);
create index if not exists diagnostic_attempt_answers_attempt_id_idx on diagnostic_attempt_answers(attempt_id);
create index if not exists diagnostic_attempt_answers_question_id_idx on diagnostic_attempt_answers(question_id);
