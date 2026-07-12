-- Adds a teacher-visible answer key per question, so grading can compare
-- a student's work against a correct solution instead of recalculating it
-- live. AI-generated as a starting draft (see generateAnswerKey in
-- lib/gemini.ts), always teacher-editable/reviewable — never presented as
-- ground truth without a way to fix it if wrong.
alter table questions add column if not exists answer_key text;
