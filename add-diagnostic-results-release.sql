-- New attempts no longer show the student their score the instant they
-- submit — a teacher must explicitly release it. Existing completed
-- attempts are backfilled to "already released" so nothing a student has
-- already seen suddenly disappears; the false default only affects
-- attempts submitted after this migration runs.
alter table diagnostic_attempts add column if not exists results_released boolean not null default false;
update diagnostic_attempts set results_released = true where status = 'completed';
