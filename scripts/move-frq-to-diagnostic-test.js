const fs = require('fs')
const path = require('path')

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TEST_ID = '9a125aea-b85b-4833-8b6c-b4a986a4bfd2' // AP Chemistry Unit 1
const TOPIC_ID = '65ed4f6d-f790-4e43-8aad-594f1f7d47fd' // "Unit 1" topic under that test

const IMAGE_BASE = {
  frq2_massspec: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/ap-chem-unit1-frq/frq2_massspec.png',
  frq4_pes: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/ap-chem-unit1-frq/frq4_pes.png',
}

// Same content/answer keys authored earlier for the class-content version —
// being moved into the Tests system instead per correction ("not in the
// regular class content").
const questions = JSON.parse(
  fs.readFileSync('/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/unit1test/frq_questions.json', 'utf8')
)

async function main() {
  // 1. Insert into diagnostic_questions as FRQ.
  const rows = questions.map(q => ({
    diagnostic_test_id: TEST_ID,
    topic_id: TOPIC_ID,
    content: q.content,
    question_type: 'frq',
    mcq_options: null,
    mcq_correct_index: null,
    image_url: q.imageUrl ? IMAGE_BASE[q.imageUrl.replace('.png', '')] : null,
    source: 'Unit 1 Test',
    answer_key: q.answer_key,
    is_active: true,
  }))
  const { data: inserted, error: insertError } = await sb.from('diagnostic_questions').insert(rows).select('id')
  if (insertError) throw insertError
  console.log(`Inserted ${inserted.length} FRQ questions into the Test.`)

  // 2. Remove the same 4 questions from regular class content — they were
  // added there by mistake before the Tests system supported FRQ.
  const { data: toDelete, error: findError } = await sb
    .from('questions')
    .select('id, title')
    .eq('source', 'Unit 1 Test')
    .eq('question_type', 'frq')
  if (findError) throw findError
  if (!toDelete || toDelete.length === 0) {
    console.log('No matching class-content FRQ questions found to remove.')
    return
  }
  const ids = toDelete.map(q => q.id)
  const { error: deleteError } = await sb.from('questions').delete().in('id', ids)
  if (deleteError) throw deleteError
  console.log(`Removed ${toDelete.length} FRQ questions from class content:`, toDelete.map(q => q.title))
}

main().catch(err => { console.error(err); process.exit(1) })
