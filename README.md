# Mindspire Lab Classroom

Live at **classroom.mindspirelab.com**. An AP/Honors Chemistry tutoring
platform: teachers assign questions, students work them out on a live
whiteboard, teachers grade in real time (live or async), and an AI tutor
("AI Faridah") helps students think through problems without just handing
them the answer.

Stack: Next.js (App Router) + Supabase (Postgres, Auth, Storage, Realtime) +
Vercel. See `RUNBOOK.md` for "something's broken, what do I do" steps.

## ⚠️ Important: how deploys actually work

**Nothing goes live until it's pushed to `main` on GitHub.** There is no
staging environment and no local dev server in normal use — changes are
tested directly on production after Vercel finishes deploying (usually
1–2 minutes after a push). `npm run dev` works locally for quick checks,
but the real test is always on the live site.

## Local setup (for a new contributor/AI session)

```bash
npm install
```

Copy `.env.local.example` → `.env.local` (see below for where to get each
value), then:

```bash
npm run dev       # local dev server, http://localhost:3000
npx tsc --noEmit   # typecheck before every commit — CI-equivalent, always run this
```

### Environment variables

All of these live in `.env.local` locally, and must ALSO be set in
**Vercel → Project → Settings → Environment Variables** for Production
(and Preview, if used) — adding one in Vercel does **not** retroactively
apply to already-running deployments; it takes effect on the next deploy.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (never expose client-side) |
| `TEACHER_SIGNUP_CODE` | Whatever code teachers enter to self-register as a teacher role |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey — see "AI Faridah" below |

## Database

Supabase Postgres, RLS enabled on most tables. There is no migration
tool/CLI wired up — schema changes ship as one-off `.sql` files at the repo
root (e.g. `add-ai-chat.sql`), which get pasted into **Supabase → SQL
Editor → Run** by hand. If you add a table or column, add a new `.sql` file
here rather than editing an old one, and tell whoever runs it to paste it in.

Key RLS pattern used throughout: tables like `submissions`, `feedback`,
`student_notifications`, and `ai_chat_messages` are RLS-gated to "a
student can only touch their own rows." Teacher-side reads/writes of
OTHER students' data always go through a Next.js API route using the
service-role client (`lib/supabase/server.ts`'s `createAdminClient()`),
never directly from the browser. If a teacher-facing feature seems to
silently return nothing, this is almost always why — check whether the
query needs to go through an API route instead of the browser Supabase
client.

Realtime also follows a pattern: Supabase Broadcast channels for instant
updates (grades, comments, live drawing), NOT `postgres_changes` — the
latter never fires for a teacher client on an RLS-gated table. Most
teacher views also poll a service-role API endpoint every few seconds as a
durable fallback in case a broadcast is missed.

## AI Faridah (Gemini)

`lib/gemini.ts` wraps the Gemini API directly via `fetch` (no SDK). Three
things to know if this breaks:

1. **Model name**: uses the `gemini-flash-latest` alias, not a pinned
   version — pinned model names get retired for new API keys/projects and
   start returning 404. If Gemini calls suddenly 404, check
   https://aistudio.google.com/apikey → your project's available models
   and update `MODEL` in `lib/gemini.ts`.
2. **Cost guardrail**: students are capped at 10 AI Faridah chat messages
   per rolling 24h (`DAILY_STUDENT_MESSAGE_LIMIT` in
   `app/api/ai-chat/route.ts`) — a hard ceiling on worst-case spend, not a
   quality setting. Adjust the constant if you want it higher/lower.
3. **Thinking mode**: on for grading/AI-check (`gradeStudentWork`, worth
   the cost for reading handwriting), off for chat (short guiding
   questions don't need it, and it roughly doubles token cost). This is
   set per-call in `postToGemini()`'s `thinkingBudget` argument.

Check actual spend at https://aistudio.google.com (usage/billing) — set a
budget alert there so a runaway never goes unnoticed.

## No automated tests yet

There is currently no test suite. `npx tsc --noEmit` is the only
CI-equivalent check — always run it before pushing. If you're adding a
test suite, prioritize the RLS-sensitive API routes and the AI cost
guardrail logic first (see `RUNBOOK.md`), since those are the riskiest to
silently break.
