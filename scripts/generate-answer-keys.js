// One-off backfill: generates an AI answer key for every question that
// doesn't have one yet, using the same generateAnswerKey prompt/model as
// lib/gemini.ts (duplicated here in plain JS since this runs standalone via
// `node`, not through Next.js). Run with: node scripts/generate-answer-keys.js
//
// Sequential, not parallel — gentler on the Gemini rate limit across ~300
// questions, and each result is saved immediately so a crash partway
// through doesn't lose progress (rerun and it just picks up where it left
// off, skipping already-answered questions).

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Minimal .env.local loader (avoids adding a dotenv dependency for a
// one-off script) — just KEY=VALUE lines, no quoting/escaping support.
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const MODEL = 'gemini-flash-latest'
const GEMINI_KEY = process.env.GEMINI_API_KEY
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function postToGemini(body) {
  const generationConfig = { ...(body.generationConfig || {}), thinkingConfig: { thinkingBudget: -1 } }
  const fullBody = { ...body, generationConfig }
  const delays = [0, 1000, 3000]
  let lastError
  for (const delay of delays) {
    if (delay) await new Promise(r => setTimeout(r, delay))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullBody) }
    )
    if (res.ok) {
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned no content')
      return text
    }
    const errText = await res.text()
    lastError = new Error(`Gemini API error ${res.status}: ${errText}`)
    if (res.status !== 503 && res.status !== 429) throw lastError
  }
  throw lastError
}

async function imagePartFromUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch image: ${res.status}`)
  const mimeType = res.headers.get('content-type') || 'image/png'
  const buf = await res.arrayBuffer()
  const data = Buffer.from(buf).toString('base64')
  return { inline_data: { mime_type: mimeType, data } }
}

async function generateAnswerKey(title, content, imageUrl) {
  const prompt = `You are an expert AP/Honors Chemistry teacher writing an internal answer key for another teacher to reference while grading — the student never sees this text.

Question: ${title}
${content ? `Question details: ${content}` : ''}
${imageUrl ? 'A diagram/graph/data table image is attached — read it carefully, it may contain values needed for the solution.' : ''}

Write the complete, correct solution:
- Show the full step-by-step work a teacher would check against (formulas used, values substituted, unit conversions, dimensional analysis).
- State the final answer clearly at the end, with correct units and significant figures for a numeric answer, or the correct conceptual answer if it's not a calculation.
- Double-check your arithmetic, units, and chemistry (e.g. valences, stoichiometric ratios, sig figs) before finalizing — this is used as the reference for grading, so it must be correct.
- Be concise but complete: enough shown to verify correctness at a glance, not padded with restating the question.
- Plain text only, no markdown formatting (no **, no #, no bullet characters — use line breaks and "Step 1:", "Step 2:" style labels instead).`

  const parts = [{ text: prompt }]
  if (imageUrl) {
    try { parts.push(await imagePartFromUrl(imageUrl)) } catch (e) { console.warn('  (image fetch failed, continuing without it:', e.message, ')') }
  }
  return (await postToGemini({ contents: [{ parts }] })).trim()
}

async function main() {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set in .env.local')

  const { data: questions, error } = await sb
    .from('questions')
    .select('id, title, content, image_url, answer_key')
    .order('order_index')
  if (error) throw error

  const pending = questions.filter(q => !q.answer_key)
  console.log(`${questions.length} total questions, ${pending.length} missing an answer key.`)

  let done = 0, failed = 0
  for (const q of pending) {
    process.stdout.write(`[${done + failed + 1}/${pending.length}] ${q.title.slice(0, 60)} ... `)
    try {
      const answerKey = await generateAnswerKey(q.title, q.content, q.image_url)
      const { error: updateError } = await sb.from('questions').update({ answer_key: answerKey }).eq('id', q.id)
      if (updateError) throw updateError
      done++
      console.log('done')
    } catch (e) {
      failed++
      console.log('FAILED:', e.message)
    }
  }
  console.log(`\nFinished. ${done} generated, ${failed} failed (rerun this script to retry failures — it skips anything already answered).`)
}

main().catch(e => { console.error(e); process.exit(1) })
