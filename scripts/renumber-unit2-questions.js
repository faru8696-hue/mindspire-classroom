// Renumbers every AP Chemistry Unit 2 topic's questions to start at Q1,
// sequential in current order_index order, preserving each question's
// descriptive title text (and normalizing the "MCQ —"/"FRQ —" prefixes some
// newly-seeded questions used back to the established "Q# —" convention).
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const vars = {}
env.split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
})

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

const TOPICS = {
  '2.1': 'cf42852a-b9c6-4ac0-8558-bef8d61b8dbc',
  '2.2': 'f08579e2-2b71-4546-b6c9-fbb234451479',
  '2.3': 'b4207db6-c796-4d5e-9912-d060fdc26b3c',
  '2.4': '7520f5d7-8f8d-431d-91f3-d4b9ce5aa1c3',
  '2.5': 'db2c2fe1-b576-4a0a-9846-b1a278b9baad',
  '2.6': '97146f93-6f64-462c-b20b-cc0f2baadbb3',
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794',
}

// Strip any existing "Q123 — ", "MCQ — ", or "FRQ — " prefix to isolate the
// descriptive part of the title.
function stripPrefix(title) {
  const m = title.match(/^(?:Q\d+|MCQ|FRQ)\s*[—-]\s*(.*)$/)
  return m ? m[1] : title
}

async function main() {
  for (const [label, topicId] of Object.entries(TOPICS)) {
    const { data: qs, error } = await sb
      .from('questions')
      .select('id, title, order_index')
      .eq('topic_id', topicId)
      .order('order_index')
    if (error) { console.error(`Fetch failed for ${label}:`, error); process.exit(1) }

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i]
      const desc = stripPrefix(q.title)
      const newTitle = `Q${i + 1} — ${desc}`
      const { error: updErr } = await sb
        .from('questions')
        .update({ title: newTitle, order_index: i })
        .eq('id', q.id)
      if (updErr) { console.error(`Update failed for ${q.id}:`, updErr); process.exit(1) }
    }
    console.log(`${label}: renumbered ${qs.length} questions (Q1–Q${qs.length})`)
  }
}

main()
