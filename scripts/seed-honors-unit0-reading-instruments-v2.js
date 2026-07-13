// Replaces "Reading Measurement Instruments" with diagram-based questions.
// Uploads matplotlib-generated instrument diagrams to the question-images bucket
// and sets image_url on each question, with shorter content that refers to "the diagram below".
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

const TOPIC_READ = '4f359810-6ee3-4c7e-b019-42424622433e' // Reading Measurement Instruments
const IMG_DIR = '/tmp/instrument_imgs'

const questions = [
  {
    title: 'Q1 — Reading a Graduated Cylinder (1 mL Graduations)',
    file: 'q1_cylinder.png',
    content: 'The graduated cylinder below is marked in 1 mL increments. Read the volume of liquid shown, recording your answer with the correct number of significant figures (remember to estimate one digit past the smallest graduation).',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 1 mL.

Step 2: Read the certain digits from the graduation marks. The meniscus sits between the 23 mL and 24 mL lines, so the certain reading is 23 mL.

Step 3: Estimate one additional digit beyond the smallest graduation, based on the meniscus position within that interval.

Final Answer:
23.4 mL`,
  },
  {
    title: 'Q2 — Reading a Metric Ruler (mm Graduations)',
    file: 'q2_ruler.png',
    content: 'The ruler below is marked in millimeters (smallest division = 0.1 cm). Read the length of the object shown (measured from the 0 cm mark to its right edge), recording your answer with the correct number of significant figures.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.1 cm (1 mm).

Step 2: Read the certain digits. The object's edge falls between the 5.4 cm and 5.5 cm marks, so the certain reading is 5.4 cm.

Step 3: Estimate one additional digit beyond the smallest graduation, based on the edge's position within that interval.

Final Answer:
5.43 cm`,
  },
  {
    title: 'Q3 — Reading a Thermometer (1°C Graduations)',
    file: 'q3_thermometer.png',
    content: 'The thermometer below is marked in 1°C increments. Read the temperature shown, recording your answer with the correct number of significant figures.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 1°C.

Step 2: Read the certain digit. The mercury level is between the 36°C and 37°C marks, so the certain reading is 36°C.

Step 3: Estimate one additional digit beyond the smallest graduation, based on the mercury's position within that interval.

Final Answer:
36.5°C`,
  },
  {
    title: 'Q4 — Comparing Precision of Two Rulers',
    file: 'q4_ruler_compare.png',
    content: 'The diagram below shows the same object measured with two different rulers: Ruler A (marked only in whole centimeters) and Ruler B (marked in millimeters). Read the object\'s length using each ruler, and state which ruler allows for a more precise (more significant figures) measurement.',
    answer_key: `Step 1: Read the length using Ruler A (smallest graduation = 1 cm).
The edge falls between the 7 cm and 8 cm marks. Estimating one digit beyond the 1 cm graduation gives approximately 7.6 cm (2 sig figs).

Step 2: Read the length using Ruler B (smallest graduation = 0.1 cm).
The edge falls between the 7.5 cm and 7.6 cm marks. Estimating one digit beyond the 0.1 cm graduation gives approximately 7.60 cm (3 sig figs).

Step 3: Compare the precision.
Ruler B has finer graduations (mm vs. cm), so its estimated digit represents a much smaller, more meaningful fraction of the total length, giving one more significant figure of precision than Ruler A.

Final Answer:
Ruler A: approximately 7.6 cm (2 sig figs). Ruler B: approximately 7.60 cm (3 sig figs). Ruler B (the mm-marked ruler) gives the more precise measurement.`,
  },
  {
    title: 'Q5 — Reading a Graduated Cylinder (10 mL Major, 2 mL Minor Graduations)',
    file: 'q5_cylinder.png',
    content: 'The graduated cylinder below has major markings every 10 mL and minor (unlabeled) markings every 2 mL. Read the volume of liquid shown, recording your answer with the correct number of significant figures.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 2 mL.

Step 2: Read the certain digits. The liquid level lines up exactly at the 46 mL minor graduation line, so 46 mL is the certain part of the reading.

Step 3: Estimate one additional digit beyond the smallest graduation (2 mL). Since the level sits exactly on the line, the estimated digit is 0.

Final Answer:
46.0 mL`,
  },
  {
    title: 'Q6 — Digital vs. Analog Instrument Precision',
    file: 'q6_digital_balance.png',
    content: 'The digital balance display below shows the mass of a sample. State how many significant figures this measurement has, and explain why digital readouts don\'t require the same "estimate one extra digit" rule used for analog instruments.',
    answer_key: `Step 1: Count the significant figures in the digital readout.
24.583 g has 5 significant figures (2, 4, 5, 8, 3 are all significant digits).

Step 2: Explain why digital instruments differ from analog instruments.
Analog instruments require a human to visually judge (estimate) the position between two graduation marks, which introduces one uncertain, estimated digit. Digital instruments internally process and display a fixed number of digits determined by the instrument's electronic precision — the last digit shown is already the instrument's best estimate.

Final Answer:
24.583 g has 5 significant figures. Digital instruments already include their own internal precision limit in the displayed digits, so the reader simply records exactly what is shown.`,
  },
  {
    title: 'Q7 — Reading a Burette to Calculate Volume Delivered',
    file: 'q7_burette.png',
    content: 'The burette diagram below (marked in 0.5 mL increments, read to the nearest 0.01 mL) shows the initial and final liquid levels during a titration. Calculate the volume of titrant delivered, with correct precision.',
    answer_key: `Step 1: Read the initial level. Initial reading = 0.00 mL.

Step 2: Read the final level. Final reading = 23.45 mL.

Step 3: Calculate the volume delivered.
Volume delivered = final reading - initial reading = 23.45 mL - 0.00 mL

Final Answer:
23.45 mL`,
  },
  {
    title: 'Q8 — Identifying Insufficient Precision in a Recorded Reading',
    file: 'q8_cylinder.png',
    content: 'A student looked at the graduated cylinder shown below (marked in 1 mL increments) and simply recorded the volume as "24 mL," without estimating any additional digit. Using the diagram, determine the correctly recorded reading, and explain why the student\'s original reading had insufficient precision.',
    answer_key: `Step 1: Identify the smallest graduation. The graduated cylinder is marked in 1 mL increments.

Step 2: Read the diagram correctly. The meniscus sits between the 24 mL and 25 mL lines, closer to 24 mL.

Step 3: Explain the error. By stopping at "24 mL" with no digit past the ones place, the student recorded only the certain digit and left out the required estimated digit, discarding real precision the instrument can provide.

Final Answer:
The correct reading is 24.3 mL. The student's "24 mL" was missing the required estimated digit beyond the smallest 1 mL graduation.`,
  },
  {
    title: 'Q9 — Parallax Error When Reading a Meniscus',
    file: 'q9_parallax.png',
    content: 'The diagram below shows three possible eye positions for reading the same liquid meniscus: looking down from above, looking straight across at eye level, and looking up from below. Identify which viewing position gives the correct reading, and explain the error that occurs with the other two.',
    answer_key: `Step 1: Identify the source of error.
Reading a liquid level from any angle other than straight-on (at eye level with the meniscus) introduces parallax error — an apparent shift in the reading caused by the viewing angle.

Step 2: Identify the correct position.
The "eye level" position, with the line of sight level with (perpendicular to) the meniscus, gives the accurate reading.

Step 3: Explain the other two positions.
Looking down from above makes the meniscus appear higher (closer to a higher graduation) than it truly is. Looking up from below makes it appear lower than it truly is.

Final Answer:
The eye-level position gives the correct reading. Reading from above or below introduces parallax error, distorting the apparent position of the meniscus relative to the graduation marks.`,
  },
  {
    title: 'Q10 — Reading a Coarser Ruler (Whole Centimeter Graduations Only)',
    file: 'q10_ruler_coarse.png',
    content: 'The ruler below is marked only at each whole centimeter, with no millimeter subdivisions. Read the length of the object shown, recording your answer with the correct precision for this coarser instrument.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division on this ruler is 1 cm.

Step 2: Read the certain digit. The edge is between the 7 cm and 8 cm marks, so the certain reading is 7 cm.

Step 3: Estimate one additional digit beyond the smallest graduation (1 cm), based on the edge's position within the interval.

Final Answer:
7.6 cm`,
  },
  {
    title: 'Q11 — Reading a Thermometer with Half-Degree Graduations',
    file: 'q11_thermometer.png',
    content: 'The thermometer below is marked every 0.5°C. Read the temperature shown, recording your answer with correct precision (one estimated digit beyond the 0.5°C graduation).',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.5°C.

Step 2: Read the certain digit(s). The mercury sits just above the 98.5°C mark, so the certain reading is 98.5°C.

Step 3: Estimate one additional digit beyond the smallest graduation, based on how far past the 98.5°C line the mercury sits.

Final Answer:
98.6°C`,
  },
  {
    title: 'Q12 — Why the Bottom of the Meniscus Is Used',
    file: 'q12_meniscus.png',
    content: 'The cross-section diagram below shows a liquid meniscus in a graduated cylinder. Using the diagram, identify which line (top or bottom of the curve) is the correct place to take a volume reading, and explain why.',
    answer_key: `Step 1: Describe what a meniscus is.
Water (and aqueous solutions) form a concave meniscus in glass due to surface tension and adhesive forces between the liquid and the glass walls, causing the surface to curve upward at the edges.

Step 2: Identify the correct reading point.
The BOTTOM of the concave curve (shown in the diagram) represents the true, consistent liquid level, unaffected by the extra height the liquid climbs along the glass walls.

Step 3: Explain why the top would be wrong.
Reading at the top of the curve (where the liquid touches the glass) would give an inflated, less consistent reading that varies with cylinder diameter and glass cleanliness.

Final Answer:
The bottom of the meniscus (the green dashed line in the diagram) is the correct reading point, because it reflects the true liquid level unaffected by adhesion to the glass walls.`,
  },
  {
    title: 'Q13 — Checking a Reading for the Correct Number of Estimated Digits',
    file: 'q13_cylinder.png',
    content: 'The graduated cylinder below is marked in 1 mL increments. Read the volume shown, and confirm that your reading includes the correct number of estimated digits.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 1 mL.

Step 2: Read the certain digits. The meniscus is between the 32 mL and 33 mL marks, so the certain reading is 32 mL.

Step 3: Estimate one additional digit beyond the smallest graduation, based on the meniscus position.

Final Answer:
32.5 mL — this reading correctly includes the certain digits (32) plus exactly one estimated digit (.5) beyond the smallest 1 mL graduation.`,
  },
  {
    title: 'Q14 — Reading an Analog Balance Scale',
    file: 'q14_balance.png',
    content: 'The analog balance scale below has a smallest readable division of 0.1 g. Read the mass indicated by the pointer, including the appropriate estimated digit.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.1 g.

Step 2: Read the certain digits. The pointer rests essentially at the 15.2 g mark, so the certain reading is 15.2 g.

Step 3: Estimate one additional digit beyond the smallest graduation (0.1 g), based on exactly where the pointer sits relative to the 15.2 g line.

Final Answer:
15.21 g (accept any reasonable value very close to 15.20-15.22 g, recorded to one estimated decimal place beyond the 0.1 g graduation)`,
  },
  {
    title: 'Q15 — Comparing Precision: Beaker vs. Graduated Cylinder',
    file: 'q15_compare.png',
    content: 'The diagram below shows the same 120 mL of liquid measured in two different containers: a beaker marked in 50 mL increments, and a graduated cylinder marked in 1 mL increments. Read the volume using each container\'s graduations, and state which instrument should be preferred for a more precise volume measurement.',
    answer_key: `Step 1: Read the volume using the beaker (smallest graduation = 50 mL).
The liquid level is roughly at the 120 mL mark within a 50 mL interval, giving a reading of approximately 120 mL with meaningful precision only to about 2 significant figures, and much greater potential reading error.

Step 2: Read the volume using the graduated cylinder (smallest graduation = 1 mL).
The liquid level lines up at the 120 mL mark, giving a reading of 120.0 mL with precision to the nearest 0.1 mL — effectively 4 significant figures.

Step 3: Compare and recommend.
The graduated cylinder provides far greater precision because its graduations are much finer (1 mL vs. 50 mL), allowing the estimated digit to represent a much smaller, more meaningful fraction of the total volume.

Final Answer:
Beaker: approximately 120 mL (~2 sig figs). Graduated cylinder: 120.0 mL (~4 sig figs). The graduated cylinder should be preferred for precise volume measurements.`,
  },
]

async function main() {
  // Remove the old text-only reading-instrument questions
  const { error: delErr } = await sb.from('questions').delete().eq('topic_id', TOPIC_READ)
  if (delErr) { console.error('Delete failed:', delErr); process.exit(1) }
  console.log('Deleted old questions.')

  let idx = 0
  for (const q of questions) {
    const filePath = path.join(IMG_DIR, q.file)
    const fileBuffer = fs.readFileSync(filePath)
    const storagePath = `reading-instruments/${q.file}`
    const { error: upErr } = await sb.storage.from('question-images').upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    })
    if (upErr) { console.error(`Upload failed for ${q.file}:`, upErr); process.exit(1) }
    const { data: pub } = sb.storage.from('question-images').getPublicUrl(storagePath)

    const { error: insErr } = await sb.from('questions').insert({
      topic_id: TOPIC_READ,
      title: q.title,
      content: q.content,
      answer_key: q.answer_key,
      image_url: pub.publicUrl,
      order_index: idx++,
    })
    if (insErr) { console.error(`Insert failed for ${q.title}:`, insErr); process.exit(1) }
    console.log(`Inserted: ${q.title} (${pub.publicUrl})`)
  }
  console.log('Done.')
}

main()
