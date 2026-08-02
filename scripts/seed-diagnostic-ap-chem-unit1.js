const fs = require('fs')
const path = require('path')

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const AP_CHEM_CLASS_ID = 'caba0297-4124-4380-b328-6e3c9fc341d4'
const IMAGE_BASE = 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/diagnostic/ap-chem-unit1/'

const questions = JSON.parse(
  fs.readFileSync('/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/unit1test/questions.json', 'utf8')
)

async function main() {
  const { data: existing } = await sb.from('diagnostic_tests').select('id').eq('slug', 'ap-chemistry-unit-1').maybeSingle()
  let testId = existing?.id

  if (!testId) {
    const { data: test, error: testError } = await sb.from('diagnostic_tests').insert({
      slug: 'ap-chemistry-unit-1',
      title: 'AP Chemistry Unit 1',
      question_count_per_attempt: 35,
      duration_minutes: 50,
      is_active: true,
      class_id: AP_CHEM_CLASS_ID,
    }).select('id').single()
    if (testError) throw testError
    testId = test.id
    console.log('Created test', testId)
  } else {
    await sb.from('diagnostic_tests').update({ class_id: AP_CHEM_CLASS_ID }).eq('id', testId)
    console.log('Reusing existing test', testId)
  }

  let { data: topic } = await sb.from('diagnostic_topics').select('id').eq('diagnostic_test_id', testId).eq('title', 'Unit 1').maybeSingle()
  if (!topic) {
    const { data: newTopic, error: topicError } = await sb.from('diagnostic_topics').insert({
      diagnostic_test_id: testId,
      title: 'Unit 1',
    }).select('id').single()
    if (topicError) throw topicError
    topic = newTopic
    console.log('Created topic', topic.id)
  }

  const rows = questions.map(q => ({
    diagnostic_test_id: testId,
    topic_id: topic.id,
    content: q.content,
    image_url: q.imageUrl ? IMAGE_BASE + q.imageUrl : null,
    mcq_options: q.options,
    mcq_correct_index: q.correctIndex,
    source: 'Unit 1 Test',
    explanation: q.explanation,
    is_active: true,
  }))

  const { data, error } = await sb.from('diagnostic_questions').insert(rows).select('id')
  if (error) throw error
  console.log(`Inserted ${data.length} questions into topic ${topic.id}`)
}

main().catch(err => { console.error(err); process.exit(1) })
