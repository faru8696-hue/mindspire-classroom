-- Lets the app upsert (attempt_id, question_id) rows instead of only ever
-- inserting once at final submit — needed so an in-progress test can
-- autosave a "draft" answer row per question, and final submit can then
-- overwrite it with the graded value, without a duplicate-row conflict.
-- Safe to run: current data already has no duplicate pairs.
create unique index if not exists diagnostic_attempt_answers_attempt_question_idx
  on diagnostic_attempt_answers(attempt_id, question_id);
