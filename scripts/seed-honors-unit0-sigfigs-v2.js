// Replaces "Units, Scientific Notation, and Significant Figures" with computational
// questions matching real honors-chem worksheet style (count/round/calculate — no essays),
// based on the format of published worksheets like nhvweb.net's Unit 2 Extra Practice.
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

const TOPIC_UNITS = 'be1f8866-4c38-4d5b-bbca-972315638bbf' // Units, Scientific Notation, and Significant Figures

const questions = [
  {
    title: 'Q1 — Count Significant Figures (Set A)',
    content: `Count the number of significant figures in each of the following:
a) 1234
b) 0.023
c) 890
d) 91010
e) 9010.0
f) 1090.0010
g) 0.00120
h) 3.4 x 10^4`,
    answer_key: `a) 1234 -> 4 sig figs
b) 0.023 -> 2 sig figs (leading zeros are never significant)
c) 890 -> 2 sig figs (trailing zero with no decimal point shown is not significant)
d) 91010 -> 4 sig figs (the zeros between nonzero digits are significant; the trailing zero is not)
e) 9010.0 -> 5 sig figs (decimal point shown, so the trailing zero is significant)
f) 1090.0010 -> 8 sig figs (decimal point shown, so every digit including trailing zeros is significant)
g) 0.00120 -> 3 sig figs (leading zeros are not significant; the trailing zero after the decimal is significant)
h) 3.4 x 10^4 -> 2 sig figs (only digits in the coefficient count)`,
  },
  {
    title: 'Q2 — Count Significant Figures (Set B)',
    content: `Count the number of significant figures in each of the following:
a) 9.0 x 10^-3
b) 0.00030
c) 1020010
d) 780.
e) 1000
f) 918.010
g) 0.0001
h) 0.00390`,
    answer_key: `a) 9.0 x 10^-3 -> 2 sig figs
b) 0.00030 -> 2 sig figs (leading zeros not significant; trailing zero after decimal is significant)
c) 1020010 -> 6 sig figs (zeros between nonzero digits are significant; the final trailing zero, with no decimal shown, is not)
d) 780. -> 3 sig figs (the decimal point after the trailing zero makes it significant)
e) 1000 -> 1 sig fig (no decimal point shown, so trailing zeros are not significant)
f) 918.010 -> 6 sig figs (decimal point shown, so every digit including trailing zeros is significant)
g) 0.0001 -> 1 sig fig
h) 0.00390 -> 3 sig figs`,
  },
  {
    title: 'Q3 — Count Significant Figures (Set C)',
    content: `Count the number of significant figures in each of the following:
a) 8120
b) 9.010 x 10^-2
c) 7.91 x 10^-10
d) 72`,
    answer_key: `a) 8120 -> 3 sig figs (no decimal point shown, so the trailing zero is not significant)
b) 9.010 x 10^-2 -> 4 sig figs
c) 7.91 x 10^-10 -> 3 sig figs
d) 72 -> 2 sig figs`,
  },
  {
    title: 'Q4 — Round to 3 Significant Figures',
    content: `Round each of the following to 3 significant figures:
a) 128.6721
b) 0.0045678
c) 3456
d) 0.099951
e) 62.049`,
    answer_key: `a) 128.6721 -> 129 (the 4th sig fig, 6, rounds the 8 up to 9)
b) 0.0045678 -> 0.00457
c) 3456 -> 3460 (or 3.46 x 10^3, to clearly show only 3 sig figs)
d) 0.099951 -> 0.100
e) 62.049 -> 62.0`,
  },
  {
    title: 'Q5 — Convert to Scientific Notation',
    content: `Convert each of the following to scientific notation:
a) 0.0000456
b) 123000 (3 sig figs)
c) 0.00982
d) 45600000 (3 sig figs)
e) 0.000000071`,
    answer_key: `a) 0.0000456 -> 4.56 x 10^-5
b) 123000 -> 1.23 x 10^5
c) 0.00982 -> 9.82 x 10^-3
d) 45600000 -> 4.56 x 10^7
e) 0.000000071 -> 7.1 x 10^-8`,
  },
  {
    title: 'Q6 — Convert to Standard Notation',
    content: `Convert each of the following to standard decimal notation:
a) 3.2 x 10^5
b) 7.05 x 10^-3
c) 9.11 x 10^-1
d) 1.2 x 10^7
e) 6.0 x 10^0`,
    answer_key: `a) 3.2 x 10^5 -> 320,000
b) 7.05 x 10^-3 -> 0.00705
c) 9.11 x 10^-1 -> 0.911
d) 1.2 x 10^7 -> 12,000,000
e) 6.0 x 10^0 -> 6.0`,
  },
  {
    title: 'Q7 — Sig Figs in Addition and Subtraction',
    content: `Solve each of the following and report the answer with the correct number of significant figures:
a) 334.540 g + 198.9916 g
b) 0.0010 m - 0.11 m
c) 349 cm + 1.10 cm + 100 cm
d) 298.01 kg + 34.112 kg`,
    answer_key: `Rule: for addition/subtraction, round the answer to match the FEWEST decimal places among the values being added or subtracted.

a) 334.540 + 198.9916 = 533.5316 -> round to 3 decimal places (matching 334.540) -> 533.532 g
b) 0.0010 - 0.11 = -0.1090 -> round to 2 decimal places (matching 0.11) -> -0.11 m
c) 349 + 1.10 + 100 = 450.10 -> round to 0 decimal places (matching 349 and 100) -> 450 cm
d) 298.01 + 34.112 = 332.122 -> round to 2 decimal places (matching 298.01) -> 332.12 kg`,
  },
  {
    title: 'Q8 — Sig Figs in Multiplication and Division',
    content: `Solve each of the following and report the answer with the correct number of significant figures:
a) 34.1 g / 1.1 mL
b) 2.11 x 10^6 joules / 34 sec
c) 450. m / 114 sec
d) 84 m/s x 31.221 sec`,
    answer_key: `Rule: for multiplication/division, round the answer to match the FEWEST significant figures among the values used.

a) 34.1 / 1.1 = 31.0000... -> 1.1 has 2 sig figs -> 31 g/mL
b) 2.11 x 10^6 / 34 = 62058.8... -> 34 has 2 sig figs -> 6.2 x 10^4 J/s
c) 450. / 114 = 3.9473... -> 450. has 3 sig figs (decimal shown), 114 has 3 sig figs -> 3.95 m/s
d) 84 x 31.221 = 2622.564 -> 84 has 2 sig figs -> 2600 m (or 2.6 x 10^3 m)`,
  },
  {
    title: 'Q9 — Mixed Operations with Scientific Notation',
    content: `Solve each of the following and report the answer, in scientific notation, with the correct number of significant figures:
a) (3.20 x 10^2) + (4.111 x 10^1)
b) (6.25 x 10^3) x (2.4 x 10^-2)
c) (8.00 x 10^4) / (2.0 x 10^2)`,
    answer_key: `a) Convert to the same power of 10: 320.0 + 41.11 = 361.11 -> round to 1 decimal place (matching 320.0) -> 361.1 -> 3.611 x 10^2
b) 6.25 x 10^3 x 2.4 x 10^-2 = 150.0 -> 2.4 has 2 sig figs -> 1.5 x 10^2
c) 8.00 x 10^4 / 2.0 x 10^2 = 400.00 -> 2.0 has 2 sig figs -> 4.0 x 10^2`,
  },
  {
    title: 'Q10 — Metric Prefix Multipliers',
    content: `Give the power-of-ten multiplier represented by each metric prefix:
a) kilo (k)
b) centi (c)
c) milli (m)
d) micro (µ)
e) nano (n)`,
    answer_key: `a) kilo (k) = 10^3
b) centi (c) = 10^-2
c) milli (m) = 10^-3
d) micro (µ) = 10^-6
e) nano (n) = 10^-9`,
  },
  {
    title: 'Q11 — Metric Prefix Conversions',
    content: 'Convert 2.5 kilometers to meters, and then to centimeters.',
    answer_key: `2.5 km x (1000 m / 1 km) = 2500 m
2500 m x (100 cm / 1 m) = 250,000 cm

Final Answer:
2.5 km = 2500 m = 250,000 cm (2.5 x 10^5 cm)`,
  },
  {
    title: 'Q12 — Sig Figs with an Exact (Counted) Number',
    content: 'A student counts exactly 12 test tubes on a lab tray. Each test tube has a measured mass of 24.5 g. Calculate the total mass of all 12 test tubes, reporting your answer with the correct number of significant figures.',
    answer_key: `Total mass = 12 x 24.5 g = 294 g

Because 12 is an exact (counted) number, it does not limit the number of significant figures in the answer. Only the measured value (24.5 g, 3 sig figs) limits the precision.

Final Answer:
294 g (3 sig figs)`,
  },
  {
    title: 'Q13 — Converting and Counting Sig Figs',
    content: 'Convert 5.67 x 10^-3 to standard decimal notation, and state the number of significant figures.',
    answer_key: `5.67 x 10^-3 = 0.00567

Number of significant figures: 3 (5, 6, 7)`,
  },
  {
    title: 'Q14 — Scientific Notation with a Specified Number of Sig Figs',
    content: 'Write 350 in scientific notation two different ways: once showing exactly 2 significant figures, and once showing exactly 3 significant figures.',
    answer_key: `2 significant figures: 3.5 x 10^2
3 significant figures: 3.50 x 10^2`,
  },
  {
    title: 'Q15 — Multi-Step Sig Fig Calculation',
    content: 'A rectangular block measures 12.5 cm x 4.20 cm x 2.0 cm. Calculate its volume, reporting the answer with the correct number of significant figures.',
    answer_key: `Volume = length x width x height
Volume = 12.5 cm x 4.20 cm x 2.0 cm = 105.0 cm^3

The value with the fewest sig figs is 2.0 cm (2 sig figs), so the answer is rounded to 2 sig figs.

Final Answer:
110 cm^3 (or 1.1 x 10^2 cm^3)`,
  },
]

async function main() {
  const rows = questions.map((q, i) => ({ ...q, topic_id: TOPIC_UNITS, order_index: i }))
  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }
  console.log(`Inserted ${data.length} questions.`)
}

main()
