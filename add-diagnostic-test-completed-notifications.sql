-- Lets a "student completed a test" event reuse the existing notifications
-- table (teacher bell + activity feed + dashboard roster all already read
-- from it) instead of building a parallel system.

-- The existing type check constraint only allows ('help', 'submitted',
-- 'comment') — see fix-notifications-comment-type.sql, which fixed the
-- exact same issue for 'comment' after inserts were silently failing.
-- Do this again here for 'test_completed', up front.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('help', 'submitted', 'comment', 'test_completed'));

-- A test-completion event has no single question, so question_id must be
-- nullable (a no-op if it already is).
alter table notifications alter column question_id drop not null;

alter table notifications add column if not exists diagnostic_test_id uuid references diagnostic_tests(id) on delete cascade;
alter table notifications add column if not exists diagnostic_attempt_id uuid references diagnostic_attempts(id) on delete cascade;
