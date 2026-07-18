-- Adds indexes on columns that are filtered constantly (by the several
-- polling loops across the teacher/student UI, roughly every 4-15s each)
-- but had no index — meaning every one of those queries was a full table
-- scan. On a small compute tier this steady drumbeat of scans is a
-- meaningful contributor to Disk IO Budget depletion, and it only gets
-- worse as these tables accumulate history over time.
create index if not exists notifications_class_id_idx on notifications(class_id);
create index if not exists notifications_student_id_idx on notifications(student_id);
create index if not exists notifications_read_idx on notifications(read) where read = false;

create index if not exists submissions_student_id_idx on submissions(student_id);
create index if not exists submissions_question_id_idx on submissions(question_id);

create index if not exists practice_attempts_test_id_idx on practice_attempts(test_id);
create index if not exists practice_attempts_student_id_idx on practice_attempts(student_id);

create index if not exists student_notifications_student_id_idx on student_notifications(student_id);
create index if not exists student_notifications_read_idx on student_notifications(read) where read = false;
