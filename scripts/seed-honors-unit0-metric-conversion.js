const fs = require('fs')
const path = require('path')

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOPIC_ID = '30775594-75a4-48d7-a4d3-7dbb207935a3'

const questions = JSON.parse(
  fs.readFileSync('/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/metric-conversion-questions.json', 'utf8')
)

async function main() {
  const rows = questions.map((q, i) => ({
    topic_id: TOPIC_ID,
    title: q.title,
    content: q.content,
    answer_key: q.answer_key,
    order_index: i,
    image_url: null,
    difficulty: null,
    points: 1,
    question_type: 'frq',
    mcq_options: null,
    mcq_correct_index: null,
    source: null,
    is_active: true,
  }))

  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) throw error
  console.log(`Inserted ${data.length} questions into topic ${TOPIC_ID}`)
}

main()
