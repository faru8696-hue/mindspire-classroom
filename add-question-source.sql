-- Tracks which source batch a question came from (topic worksheet, episode
-- review packet, MCQ practice set, summative assessment, savemyexams, etc.)
-- so teachers can see and publish these sets separately in the assign UI.
-- Purely additive/teacher-facing — never exposed to students.
alter table questions add column if not exists source text;
