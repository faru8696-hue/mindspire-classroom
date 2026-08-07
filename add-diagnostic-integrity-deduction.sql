-- Persists the score deduction applied for time spent away from the test
-- tab (see assessTestIntegrity in lib/diagnosticGrading.ts), frozen at
-- submit time like topic_breakdown already is — so a later tuning of the
-- deduction curve never retroactively rewrites a historical attempt's
-- grade. Existing completed attempts are backfilled to "no deduction",
-- since tab-switch data was already being tracked for them but never
-- turned into a grade adjustment before now.
--
-- integrity_likely_cheating is stored separately rather than derived from
-- the deduction percentage at display time — assessTestIntegrity's severe
-- tier can be triggered by trip count alone even when the fraction-based
-- deduction lands well under its ceiling, so the flag and the percentage
-- aren't always redundant with each other.
alter table diagnostic_attempts add column if not exists integrity_deduction_pct numeric not null default 0;
alter table diagnostic_attempts add column if not exists integrity_likely_cheating boolean not null default false;
