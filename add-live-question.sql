-- Lets the teacher push "we're working on this question right now" to every
-- student in a class during a live session, instead of telling each student
-- individually which unit/topic/question to open. Nullable pointer on
-- classes (not a new table) since there's only ever one current question per
-- class at a time. Students already have full read access to classes via
-- the existing classes_student policy, so no new RLS policy is needed —
-- the teacher writes it via classes_teacher's existing "for all" policy.
alter table classes add column if not exists live_question_id uuid references questions(id) on delete set null;
