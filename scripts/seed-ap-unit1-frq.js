const fs = require('fs')
const path = require('path')

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOPIC_IDS = {
  periodicTrends: '616020e0-79a3-47fe-baef-f3669e1b3193', // 1.7 Periodic Trends
  massSpec: 'ba0fae17-c9f6-4831-9df6-e22853ca073d',        // 1.2 Mass Spectroscopy of Elements
  pes: '08497fdf-0b09-44c4-992b-27a3912b77bd',              // 1.6 Photoelectron Spectroscopy
}

const IMAGE_BASE = {
  frq2_massspec: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/ap-chem-unit1-frq/frq2_massspec.png',
  frq4_pes: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/ap-chem-unit1-frq/frq4_pes.png',
}

const questions = JSON.parse(
  fs.readFileSync('/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/unit1test/frq_questions.json', 'utf8')
)

async function main() {
  for (const q of questions) {
    const topicId = TOPIC_IDS[q.topicKey]
    const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1)
    const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0
    const title = q.title.replace('Q —', `Q${nextIndex + 1} —`)
    const imageUrl = q.imageUrl ? IMAGE_BASE[q.imageUrl.replace('.png', '')] : null

    const { error } = await sb.from('questions').insert({
      topic_id: topicId,
      title,
      content: q.content,
      answer_key: q.answer_key,
      order_index: nextIndex,
      image_url: imageUrl,
      difficulty: 'hard',
      points: 4,
      question_type: 'frq',
      mcq_options: null,
      mcq_correct_index: null,
      source: 'Unit 1 Test',
      is_active: true,
    })
    if (error) throw error
    console.log(`Inserted "${title}" into topic ${topicId}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
