-- Prevent duplicate "help" / "done" alerts from piling up in the teacher's
-- notification feed. Previously every click of "Get Help" or "Done — Check my
-- work" inserted a brand new row with no dedup, so a class of 20 students could
-- easily produce 100+ notifications (repeat clicks, or clicking again while
-- waiting) making it impossible to tell which student was doing which question.
--
-- This partial unique index means there can only be ONE unread notification per
-- (student, question, type) at a time. The API route (app/api/student-alert)
-- upserts against it: a repeat click bumps the existing row's timestamp instead
-- of creating a new one. Once the teacher marks it read, the student can trigger
-- a fresh one again.
create unique index if not exists notifications_unread_dedup_idx
  on notifications (student_id, question_id, type)
  where read = false;
