-- Difficulty + point value per question, so students can choose harder
-- questions instead of just working through a topic in fixed order.
-- questions already has RLS enabled (see supabase-setup.sql) and existing
-- policies select/operate on the whole row, so no new policy is needed —
-- these are just additional columns on an already-covered table.
alter table questions add column if not exists difficulty text check (difficulty in ('easy', 'medium', 'hard'));
alter table questions add column if not exists points integer not null default 1;
