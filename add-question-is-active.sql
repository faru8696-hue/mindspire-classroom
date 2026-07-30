-- Lets a teacher "delete" a question that already has student submissions
-- without destroying that grading history — questions.id is referenced with
-- `on delete cascade` by submissions, comments, board, answer_key_releases,
-- ai_chat, assignments, student_assignments, and grade_history, so a hard
-- delete would silently wipe out every student's past work on it. Mirrors
-- the same is_active pattern already used by diagnostic_questions.
alter table questions add column if not exists is_active boolean not null default true;
create index if not exists questions_active_idx on questions(topic_id) where is_active = true;
