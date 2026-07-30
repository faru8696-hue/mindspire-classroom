-- Lets a teacher attach an explanation to a diagnostic question, shown to
-- the student on their results page next to which questions they got right
-- or wrong (in addition to the existing topic-level breakdown/advice).
alter table diagnostic_questions add column if not exists explanation text;
