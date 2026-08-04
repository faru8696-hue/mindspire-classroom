-- The teacher dashboard's "Classes" section and Study Tracker both need to
-- know, for every submission, whether the student actually wrote/drew
-- anything (a submission row can exist as an empty '[]' canvas placeholder
-- — see app/api/grade/route.ts, which auto-creates one when a teacher
-- grades a question the student never touched). That check used to be done
-- in JS after fetching every submission's full canvas_data/text_answer —
-- but canvas_data is a base64-encoded PNG, and fetching all of them
-- unfiltered on every dashboard load has grown slow enough to time out the
-- query outright ("canceling statement due to statement timeout").
--
-- A generated column lets Postgres compute and index this once per row,
-- maintained automatically on every insert/update (no application code
-- needs to set it), so the dashboard can filter server-side
-- (`.eq('has_content', true)`) instead of transferring every blob just to
-- throw most of them away in JS.
alter table submissions add column if not exists has_content boolean
  generated always as (
    (canvas_data is not null and length(canvas_data) > 5) or
    (text_answer is not null and length(trim(text_answer)) > 0)
  ) stored;

create index if not exists submissions_has_content_idx on submissions(has_content) where has_content = true;
