-- Adds FRQ (free-response) support to the Tests / diagnostic_* system,
-- which was originally built MCQ-only. FRQ questions have no correct
-- answer to auto-grade against — they're scratch-canvas work saved with
-- the attempt and reviewed afterward (by the student on their results
-- page and by the teacher on the attempt detail page), same pattern as
-- FRQ everywhere else in this app (submissions.canvas_data,
-- practice_attempts.canvas_data).

-- 1. question_type distinguishes MCQ (auto-graded) from FRQ (reviewed,
--    not scored).
alter table diagnostic_questions add column if not exists question_type text not null default 'mcq' check (question_type in ('mcq', 'frq'));

-- 2. mcq_options / mcq_correct_index only apply to MCQ questions now.
alter table diagnostic_questions alter column mcq_options drop not null;
alter table diagnostic_questions alter column mcq_correct_index drop not null;

-- 3. Drop the original unconditional CHECK constraints (auto-named at
--    table creation) and replace with a version that only applies to MCQ
--    rows — done dynamically since the original constraint names weren't
--    explicitly set.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'diagnostic_questions'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%mcq_options%' or pg_get_constraintdef(oid) ilike '%mcq_correct_index%')
  loop
    execute format('alter table diagnostic_questions drop constraint %I', con.conname);
  end loop;
end $$;

alter table diagnostic_questions add constraint diagnostic_questions_mcq_shape check (
  question_type = 'frq' or (
    mcq_options is not null
    and jsonb_typeof(mcq_options) = 'array'
    and jsonb_array_length(mcq_options) >= 2
    and mcq_correct_index is not null
    and mcq_correct_index >= 0
    and mcq_correct_index < jsonb_array_length(mcq_options)
  )
);

-- 4. Reference/model answer for FRQ questions, shown during review
--    (parallel to `explanation` for MCQ).
alter table diagnostic_questions add column if not exists answer_key text;

-- 5. diagnostic_attempt_answers: selected_index/is_correct only apply to
--    MCQ answers now; FRQ answers get their scratch-canvas snapshot
--    instead.
alter table diagnostic_attempt_answers alter column selected_index drop not null;
alter table diagnostic_attempt_answers alter column is_correct drop not null;
alter table diagnostic_attempt_answers add column if not exists canvas_data text;
