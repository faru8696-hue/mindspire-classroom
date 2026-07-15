-- Two fixes:
-- 1. FRQ work is now saved to the server the moment a test is finished
--    (not deferred until the student actually clicks a self-grade button in
--    review) — so a teacher can see what a student wrote even if the
--    student abandoned the test before finishing self-review. self_grade
--    must be nullable to support that "captured, not yet self-graded" state.
-- 2. "partial" removed as a self-grade option — correct/incorrect only.
alter table practice_attempts alter column self_grade drop not null;
alter table practice_attempts drop constraint if exists practice_attempts_self_grade_check;
alter table practice_attempts add constraint practice_attempts_self_grade_check
  check (self_grade in ('correct', 'incorrect'));
