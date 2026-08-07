-- Per-test control over whether a completed PUBLIC diagnostic attempt (the
-- free lead-magnet quiz, taken via the anonymous /diagnostic/[slug] intake
-- form) shows results immediately or waits for the teacher to manually
-- release them via ReleaseResultsToggle — see start-attempt/route.ts.
-- Defaults to true (instant) because every test reachable through that
-- public, unauthenticated route is a lead-magnet quiz whose landing page
-- already promises "Instant results" — enrolled students' real class tests
-- go through start-attempt-for-student instead and are unaffected either way.
alter table diagnostic_tests add column if not exists instant_results boolean not null default true;
