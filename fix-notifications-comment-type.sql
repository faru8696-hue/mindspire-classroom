-- The `notifications` table's check constraint only allowed type in
-- ('help', 'submitted') — every attempt to insert a 'comment' notification
-- (from app/api/notify-teacher) has been silently failing with a 400
-- (23514 check_violation) ever since comments were added, because the
-- client-side fetch() call that hits that route is fire-and-forget and
-- never surfaces the error. This is why comment notifications never showed
-- up in the bell, the dashboard queue, or the fallback poll — they were
-- never persisted to the database in the first place.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('help', 'submitted', 'comment'));
