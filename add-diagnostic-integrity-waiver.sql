-- Lets a teacher waive the automatic tab-switch integrity deduction for one
-- attempt (e.g. the time away was clearly innocent) so the raw, undeducted
-- score is what's shown on the results page, in the PDF, and in result
-- emails — see lib/diagnosticResult.ts, which zeroes out the effective
-- deduction whenever this is true while still keeping the original computed
-- percentage around for the teacher's own reference.
alter table diagnostic_attempts add column if not exists integrity_deduction_waived boolean not null default false;
