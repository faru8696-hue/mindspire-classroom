-- Teacher grading for FRQ answers in the Tests system. FRQ questions have
-- no correct answer to auto-grade (see add-diagnostic-frq-support.sql) —
-- this is the teacher's manual review verdict per FRQ answer, read live
-- (not frozen) so grading can happen any time after the attempt completes.
alter table diagnostic_attempt_answers add column if not exists grade text check (grade in ('correct', 'partial', 'incorrect'));
