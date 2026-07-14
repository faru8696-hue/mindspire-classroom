-- Extends self-study: question type (FRQ vs MCQ, so MCQ can be auto-graded
-- by software instead of self-checked), and a timer on practice tests.
alter table questions add column if not exists question_type text not null default 'frq' check (question_type in ('frq', 'mcq'));
alter table questions add column if not exists mcq_options jsonb; -- array of option strings, e.g. ["6.02 x 10^23", "3.01 x 10^23", ...]
alter table questions add column if not exists mcq_correct_index integer; -- 0-based index into mcq_options

alter table practice_tests add column if not exists duration_minutes integer; -- null = untimed
