-- Lets a student say WHEN their school expects to start a class they've
-- flagged as not-started yet (student_school_status.not_started), so that
-- date can expire the same way a test date does — once it passes, they're
-- asked again whether it's actually started.
alter table student_school_status add column if not exists starts_on date;
