-- Fix #1: the `notifications` table's check constraint only allowed type in
-- ('help', 'submitted') — every attempt to insert a 'comment' notification
-- (from app/api/notify-teacher) has been silently failing with a 400
-- (23514 check_violation) ever since comments were added, because the
-- client-side fetch() call that hits that route is fire-and-forget and
-- never surfaces the error. This is why comment notifications never showed
-- up in the teacher's bell, the dashboard queue, or the fallback poll —
-- they were never persisted to the database in the first place.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('help', 'submitted', 'comment'));

-- Fix #2: app/api/notify-assignment/route.ts and the student notification
-- endpoints all reference a `count` column on student_notifications that
-- was supposed to be added by add-notification-batching.sql — but it was
-- never actually run against this database, so the column doesn't exist.
-- On top of that, PostgREST treats a bare `count` in a select list as the
-- count() aggregate function rather than a column reference, which produces
-- a confusing "column must appear in GROUP BY" error instead of a clean
-- "column does not exist" one. Both problems go away by adding the column
-- under a different name — assignment_count — which the app code has been
-- updated to use instead.
alter table student_notifications add column if not exists assignment_count integer not null default 1;
