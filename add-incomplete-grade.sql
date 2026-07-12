-- Adds "incomplete" as a selectable grade (for work that's only partway
-- done, not wrong) alongside correct/incorrect. The original check
-- constraint (add-grades-comments.sql) didn't allow it.
alter table feedback drop constraint if exists feedback_grade_check;
alter table feedback add constraint feedback_grade_check
  check (grade in ('correct', 'incorrect', 'partial', 'incomplete'));
