-- Neutral "left the test tab" counter, shown to the teacher as a plain fact
-- (not an accusation) on the attempt page — not a screenshot detector
-- (no such thing exists on the web), just visibilitychange/blur tracking.
alter table diagnostic_attempts add column if not exists tab_switch_count integer;
alter table diagnostic_attempts add column if not exists tab_switch_seconds integer;
