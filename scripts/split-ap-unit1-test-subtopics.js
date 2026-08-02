const fs = require('fs')
const path = require('path')

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TEST_ID = '9a125aea-b85b-4833-8b6c-b4a986a4bfd2'
const OLD_TOPIC_ID = '65ed4f6d-f790-4e43-8aad-594f1f7d47fd' // flat "Unit 1" bucket, being retired

const SUBTOPICS = [
  '1.1 Moles and Molar Mass',
  '1.2 Mass Spectroscopy of Elements',
  '1.3 Elemental Composition of Pure Substances',
  '1.4 Composition of Mixtures',
  '1.5 Atomic Structure and Electron Configuration',
  '1.6 Photoelectron Spectroscopy',
  '1.7 Periodic Trends',
  '1.8 Valence Electrons and Ionic Compounds',
]

// question id -> subtopic title, mapped by content (verified against the
// live rows before running).
const ASSIGNMENTS = {
  '1dbcbd30-711c-432f-8c34-bf8893a335ad': '1.5 Atomic Structure and Electron Configuration', // most unpaired electrons
  'bb7d5924-a3f1-41ce-96fc-8691f287983e': '1.6 Photoelectron Spectroscopy', // PES: what element
  'f9e1c08e-8c01-4494-9264-2edf89b6e6f2': '1.6 Photoelectron Spectroscopy', // PES: 2s peak
  '243f9575-84e5-4e95-bf07-7a2e2f8c66a4': '1.6 Photoelectron Spectroscopy', // PES: greatest velocity
  'daf4ad18-016b-4a56-aca4-fc3592379298': '1.6 Photoelectron Spectroscopy', // PES: valence electrons
  '064eaa2e-c400-4ab8-ab04-046dd882f948': '1.7 Periodic Trends', // P3- radius
  'd5c7a69a-eea5-4c0e-a7d2-fa9917909e8c': '1.3 Elemental Composition of Pure Substances', // SiO2 empirical formula
  'c2bbecc8-75f8-4fef-92c1-e4555cafb9b0': '1.7 Periodic Trends', // X/Y/Z relative sizes
  'dbb77dc8-967b-4cf7-b4bc-41a17854dd55': '1.5 Atomic Structure and Electron Configuration', // transition metal +2
  '1529efb8-502b-430f-8f0f-4cc64b3dd737': '1.7 Periodic Trends', // K vs Cl/Ar ionization energy
  'f60c853f-7d5c-436a-b70e-03bb51fe608e': '1.6 Photoelectron Spectroscopy', // Cl subshell ejection velocity
  '5c678ec2-2817-437b-a1dd-c6a063e8ec32': '1.1 Moles and Molar Mass', // average mass of a mole
  'd82c276f-1ab9-4205-b26b-a99f3a4610d4': '1.7 Periodic Trends', // Na vs Cl trends
  '074aa895-ef39-411f-94e6-9c28a381950b': '1.1 Moles and Molar Mass', // neutrons in 10g Ar-40
  '4529a88f-dc5a-4b32-ae7d-9339d2a925a0': '1.6 Photoelectron Spectroscopy', // PES: exactly 3 peaks
  '3ebf9598-206e-4fee-81ee-1c4af2a24f14': '1.2 Mass Spectroscopy of Elements', // inferred from mass spec
  '81660ecb-eef1-4a42-b575-79dd58017c1b': '1.7 Periodic Trends', // metals vs nonmetals IE
  'b23881fa-bcaa-4147-86cf-e5db58c86eae': '1.8 Valence Electrons and Ionic Compounds', // IE table -> magnesium
  '06e809f5-09e6-4a2f-8e1d-98efbeb859b1': '1.7 Periodic Trends', // N electronegativity vs P/O
  '74bc3eeb-b42b-4bc7-ab4a-ed73e10dd931': '1.7 Periodic Trends', // FRQ1: IE/PES trends
  '7a48bc80-ae2d-4f75-8a5b-fd4f9fd4a7e2': '1.2 Mass Spectroscopy of Elements', // FRQ2: ClO- mass spectrum
  '5a670a59-b52a-428a-b8ea-de0c28530f39': '1.7 Periodic Trends', // FRQ3: radius/IE table
  '0b85575f-da88-4cc6-91b2-6fb3e090a658': '1.6 Photoelectron Spectroscopy', // FRQ4: 5-peak PES
}

async function main() {
  const { data: existingTopics } = await sb.from('diagnostic_topics').select('id, title').eq('diagnostic_test_id', TEST_ID)
  const topicIdByTitle = new Map((existingTopics ?? []).map(t => [t.title, t.id]))

  for (const title of SUBTOPICS) {
    if (topicIdByTitle.has(title)) continue
    const { data, error } = await sb.from('diagnostic_topics').insert({ diagnostic_test_id: TEST_ID, title }).select('id').single()
    if (error) throw error
    topicIdByTitle.set(title, data.id)
    console.log(`Created topic "${title}" -> ${data.id}`)
  }

  const questionIds = Object.keys(ASSIGNMENTS)
  const { data: questions } = await sb.from('diagnostic_questions').select('id').in('id', questionIds).eq('diagnostic_test_id', TEST_ID)
  if (!questions || questions.length !== questionIds.length) {
    throw new Error(`Expected ${questionIds.length} questions, found ${questions?.length ?? 0} — check ASSIGNMENTS ids match current DB state.`)
  }

  for (const [questionId, subtopicTitle] of Object.entries(ASSIGNMENTS)) {
    const topicId = topicIdByTitle.get(subtopicTitle)
    const { error } = await sb.from('diagnostic_questions').update({ topic_id: topicId }).eq('id', questionId)
    if (error) throw error
  }
  console.log(`Reassigned ${questionIds.length} questions to subtopics.`)

  const { count: remaining } = await sb.from('diagnostic_questions').select('id', { count: 'exact', head: true }).eq('topic_id', OLD_TOPIC_ID)
  if (remaining === 0) {
    const { error } = await sb.from('diagnostic_topics').delete().eq('id', OLD_TOPIC_ID)
    if (error) throw error
    console.log('Removed the now-empty flat "Unit 1" topic.')
  } else {
    console.log(`Old "Unit 1" topic still has ${remaining} question(s) — left in place.`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
