-- The `notifications` table (teacher-facing: help/submitted/comment) has no
-- column to store the actual comment text — app/api/notify-teacher was
-- faking it by echoing the message back in the single API response only
-- (never persisted), so the bell, dashboard, and toasts could only ever show
-- "so-and-so commented" with no way to see what was said without opening the
-- board. This adds a real column so the message can be read later, on any
-- subsequent page load or poll.
alter table notifications add column if not exists message text;
