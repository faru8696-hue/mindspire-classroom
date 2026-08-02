-- Lets a teacher draw directly on a student's FRQ scratch work (circles,
-- checkmarks, notes) instead of only entering a numeric score. Stored as a
-- separate flattened PNG (student's original work is never overwritten —
-- annotate-frq-answer/route.ts always starts a fresh annotation pass from
-- the current teacher_annotation if one exists, else the original
-- canvas_data), same pattern as ScratchBoard everywhere else in this app.
alter table diagnostic_attempt_answers add column if not exists teacher_annotation text;
