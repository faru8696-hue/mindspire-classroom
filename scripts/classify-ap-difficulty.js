// One-off audit: classifies every AP Chemistry question into easy/medium/hard
// (points 1/2/3) so students can jump straight to a harder question within a
// topic instead of working through it in fixed order. Batches ~20 questions
// per Gemini call (text-only, no images, low thinking budget) to keep this
// cheap — one call per batch instead of one call per question.
//
// Requires add-question-difficulty.sql to have been run first (adds the
// `difficulty`/`points` columns) — this script only UPDATEs existing rows.
//
// Usage: node scripts/classify-ap-difficulty.js

const fs = require('fs')

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_API_KEY = env.GEMINI_API_KEY
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 1200

function sbHeaders() {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() })
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Supabase PATCH ${path} failed: ${res.status} ${await res.text()}`)
}

async function classifyBatch(questions) {
  const prompt = `You are an experienced AP Chemistry teacher auditing a question bank to assign each question a DIFFICULTY level and POINT VALUE, so students can choose to work on harder questions instead of easier ones within the same topic.

Rubric (use this consistently across ALL questions, not relative to just this batch):
- "easy" (1 point): single-step recall, a direct definition, or a one-line plug-into-a-formula calculation. A student who understands the topic at a basic level should get this quickly.
- "medium" (2 points): a multi-step calculation, or applying a single concept correctly but requiring some setup/reasoning (e.g. unit conversions, stoichiometry with one intermediate step, interpreting one graph/diagram).
- "hard" (3 points): synthesizes multiple concepts, requires deeper reasoning or an edge case, or is AP free-response-level (multi-part reasoning, unusual scenario, requires justifying an answer conceptually, not just computing it).

For each question below (given as id / title / content / answer key), return its difficulty and points.

Questions:
${questions.map(q => `id: ${q.id}\ntitle: ${q.title}\ncontent: ${q.content || '(none)'}\nanswer key: ${(q.answer_key || '(none)').slice(0, 600)}`).join('\n---\n')}`

  const schema = {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            points: { type: 'integer' },
          },
          required: ['id', 'difficulty', 'points'],
        },
      },
    },
    required: ['results'],
  }

  // NOTE: combining thinkingConfig with responseSchema on this model made the
  // request hang indefinitely (confirmed via a 300s HTTP/2 stream timeout,
  // no response at all) — omitting thinkingConfig here is what makes this
  // actually return (in ~50s per batch of 20, structured JSON output alone
  // is slow but reliable).
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
  }

  const delays = [0, 1000, 2500]
  let lastErr
  for (const d of delays) {
    if (d) await new Promise(r => setTimeout(r, d))
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal,
      }).finally(() => clearTimeout(timeout))
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('Gemini returned no content')
        return JSON.parse(text).results
      }
      lastErr = new Error(`Gemini error ${res.status}: ${await res.text()}`)
      if (res.status !== 503 && res.status !== 429) throw lastErr
    } catch (err) {
      // Network error or abort (timeout) — retry like a 503 rather than
      // failing the batch on the first transient hiccup.
      lastErr = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastErr
}

async function main() {
  console.log('Fetching AP Chemistry question bank...')
  const classes = await sbGet('classes?select=id,title')
  const apClass = classes.find(c => /\bap\b/i.test(c.title))
  if (!apClass) throw new Error('Could not find an AP class')

  const units = await sbGet(`units?select=id&class_id=eq.${apClass.id}`)
  const unitIds = units.map(u => u.id)
  const topics = unitIds.length ? await sbGet(`topics?select=id&unit_id=in.(${unitIds.join(',')})`) : []
  const topicIds = topics.map(t => t.id)

  let allQuestions = []
  const CHUNK = 50
  for (let i = 0; i < topicIds.length; i += CHUNK) {
    const chunk = topicIds.slice(i, i + CHUNK)
    const qs = await sbGet(`questions?select=id,title,content,answer_key,difficulty&topic_id=in.(${chunk.join(',')})`)
    allQuestions = allQuestions.concat(qs)
  }
  console.log(`Found ${allQuestions.length} AP Chemistry questions total.`)
  allQuestions = allQuestions.filter(q => !q.difficulty)
  console.log(`${allQuestions.length} still unclassified — resuming just those.`)

  let done = 0, failed = 0
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE)
    try {
      const results = await classifyBatch(batch)
      for (const r of results) {
        await sbPatch(`questions?id=eq.${r.id}`, { difficulty: r.difficulty, points: r.points })
      }
      done += results.length
      console.log(`[${done}/${allQuestions.length}] classified (batch ${i / BATCH_SIZE + 1})`)
    } catch (err) {
      failed += batch.length
      console.error(`Batch starting at index ${i} failed:`, err.message)
    }
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
  }

  console.log(`Done. Classified ${done}, failed ${failed}.`)
}

main().catch(err => { console.error(err); process.exit(1) })
