-- Lets a teacher (a) allow a test's timer to run past zero without
-- auto-submitting, so a student can keep answering, and (b) explicitly
-- decide per-attempt whether a late submission's score actually counts.
--
-- allow_overtime is a per-test setting the teacher toggles on the test
-- dashboard. submitted_late/overtime_seconds are computed and frozen at
-- submit time (same reasoning as topic_breakdown/integrity_deduction_pct —
-- a later change shouldn't rewrite a historical attempt's facts).
-- overtime_accepted starts NULL ("not yet decided") and is only ever set
-- explicitly by the teacher; release-results and email-result both refuse
-- to release a late attempt until this is true.
alter table diagnostic_tests add column if not exists allow_overtime boolean not null default false;
alter table diagnostic_attempts add column if not exists submitted_late boolean not null default false;
alter table diagnostic_attempts add column if not exists overtime_seconds integer not null default 0;
alter table diagnostic_attempts add column if not exists overtime_accepted boolean;
