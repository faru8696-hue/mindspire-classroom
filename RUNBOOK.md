# Runbook — "something's broken, what do I do"

This is not a support contract — it's a checklist so you (or whoever's
helping you) isn't starting from zero when something breaks.

## First, always

1. Check https://vercel.com (your project) → **Deployments** — is the
   latest one green ("Ready") or did the build fail? A red/failed build
   means the last push never actually went live; the site is still
   running the previous version.
2. Check the browser console (F12 → Console) on the broken page for a red
   error — this usually tells you which file/feature is involved.

## "A grade / comment / notification isn't showing up for a student or teacher"

Almost always one of:
- **RLS blocking a read.** If it's teacher-side, the fix is a service-role
  API route (see `lib/supabase/server.ts` → `createAdminClient()`), not a
  direct browser query. Search for a similar existing route
  (`app/api/feedback-canvas`, `app/api/ai-chat-history`, etc.) to copy the
  pattern.
- **Broadcast missed, no polling fallback.** Check whether the relevant
  view has a `setInterval` poll as backup — most do. If not, that's the
  bug: realtime alone isn't reliable enough here (see README's Realtime
  section).

## "AI Faridah / AI Check says it failed"

1. Read the actual error message shown — routes surface the real reason
   (not a generic string) specifically so this is diagnosable without
   server logs.
2. **"GEMINI_API_KEY is not set"** → the env var is missing or misnamed in
   Vercel Production. Check Settings → Environment Variables: key must be
   exactly `GEMINI_API_KEY`, Production checkbox ticked. Then trigger a
   new deploy (env var changes don't apply retroactively) —
   `git commit --allow-empty -m "redeploy" && git push` if nothing else
   changed.
3. **404 "no longer available to new users"** → the pinned model name got
   retired. Go to https://aistudio.google.com/apikey, check what models
   are listed as available for your key, and update `MODEL` in
   `lib/gemini.ts`.
4. **429 "quota exceeded" / "RESOURCE_EXHAUSTED"** → either the free-tier
   daily cap (20/day at time of writing) or your own per-student chat cap
   (`DAILY_STUDENT_MESSAGE_LIMIT`, currently 10/day) was hit. Check
   https://aistudio.google.com billing/usage to see which.
5. **503 "high demand" / UNAVAILABLE** → transient overload on Google's
   end. The code already retries automatically; if it still fails after
   retries, it's genuinely down — wait and retry later.

## "The whiteboard text tool / drawing doesn't work on some device"

This has broken three separate ways before (see git log around commit
`e5717c5` and nearby): touch events needing their own handler branch
separate from mouse events, and async React renders not being ready for
`.focus()` to grab it (fixed with `flushSync`). If a new whiteboard bug
shows up, reproduce it with the exact tool + exact device type (touch vs
mouse) first — the fix has been device-specific every time so far.

## "I need to change the database schema"

1. Write a new `.sql` file at the repo root (don't edit an old one).
2. Paste it into Supabase → SQL Editor → Run.
3. No separate migration/rollback tooling exists — if it's wrong, write
   a follow-up `.sql` file to fix it (e.g. `alter table ... drop column`).

## "I'm not sure this change is safe"

Run `npx tsc --noEmit` before every push — it's the only automated check
that exists right now. It won't catch behavior bugs (RLS, realtime,
touch/focus issues above), only type errors, so for anything touching
grading, AI, or the whiteboard, actually click through the feature on the
live site after deploying instead of trusting the typecheck alone.
