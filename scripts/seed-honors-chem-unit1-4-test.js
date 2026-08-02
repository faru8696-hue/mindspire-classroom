// One-off seed for the "Honors Chemistry Unit 1-4 Test" — a fixed 30-question
// test (20 MCQ + 10 FRQ), not a random draw from a larger pool. Created
// unpublished (no class_id, is_active: false) so the teacher can review it in
// the Tests dashboard before publishing it to Honors Chemistry.
//
// Convention: manual .env.local parsing + service-role client, matching every
// other scripts/seed-*.js in this repo. Run with: node scripts/seed-honors-chem-unit1-4-test.js
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const env = {}
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2]
})
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TOPICS = [
  {
    key: '1.1',
    title: '1.1 Protons, Neutrons, and Electrons',
    prep_advice: 'Review how atomic number, mass number, and charge relate to protons, neutrons, and electrons — especially for ions, where the electron count differs from the proton count.',
  },
  {
    key: '2.1',
    title: '2.1 Calculating Average Atomic Mass',
    prep_advice: 'Practice the weighted-average formula (fractional abundance x isotopic mass, summed for every isotope) rather than a plain average of the isotope masses.',
  },
  {
    key: '2.2',
    title: '2.2 Percent Abundance from Average Mass',
    prep_advice: 'Practice solving for an unknown abundance algebraically by setting up the weighted-average equation with a variable (x) and (1 - x) for a two-isotope element.',
  },
  {
    key: '3.1',
    title: '3.1 Molar Mass and Percentage Composition',
    prep_advice: 'Review calculating molar mass from a chemical formula, including compounds with more than two elements and hydrates (don’t forget the water of crystallization’s mass).',
  },
  {
    key: '3.2',
    title: '3.2 Mass Percent of Solutions',
    prep_advice: 'Remember mass percent divides by the total mass of the SOLUTION (solute + solvent), not just the solvent — and convert volume to mass using density when a volume is given instead of a mass.',
  },
  {
    key: '4.1',
    title: '4.1 Empirical Formula',
    prep_advice: 'Practice converting mass or percent-composition data to moles, then reducing to the smallest whole-number ratio — including combustion-analysis problems where oxygen must be found by subtraction.',
  },
  {
    key: '4.2',
    title: '4.2 Molecular Formula',
    prep_advice: 'Review finding the empirical formula mass and dividing the actual molar mass by it to get the whole-number multiplier that scales the empirical formula up to the molecular formula.',
  },
]

const MCQ = [
  {
    topic: '1.1',
    content: 'An ion has 16 protons, 18 neutrons, and 18 electrons. What is the identity and charge of this ion?',
    options: ['S²⁻', 'S²⁺', 'Cl⁻', 'Ar (neutral)'],
    correct: 0,
  },
  {
    topic: '1.1',
    content: 'Which pair below represents two isotopes of the same element?',
    options: ['Carbon-14 and Nitrogen-14', 'Carbon-12 and Carbon-14', 'Potassium-40 and Calcium-40', 'Chlorine-35 and Argon-36'],
    correct: 1,
  },
  {
    topic: '1.1',
    content: 'A neutral atom has 4 more neutrons than protons. Its mass number is 56. What is the identity of this atom, and how many electrons does it have?',
    options: ['Iron (Fe), 30 electrons', 'Manganese (Mn), 25 electrons', 'Iron (Fe), 26 electrons', 'Cobalt (Co), 27 electrons'],
    correct: 2,
  },
  {
    topic: '2.1',
    content: 'Gallium has two isotopes: Ga-69 (60.11%, 68.93 amu) and Ga-71 (39.89%, 70.92 amu). What is gallium’s average atomic mass?',
    options: ['69.93 amu', '70.02 amu', '68.93 amu', '69.72 amu'],
    correct: 3,
  },
  {
    topic: '2.1',
    content: 'Element Z has two isotopes. Z’s average atomic mass is much closer to isotope 1’s mass than isotope 2’s. What can be concluded?',
    options: ['Isotope 1 is more abundant', 'Isotope 1 has more neutrons', 'Isotope 2 is radioactive', 'Isotope 1 has a larger atomic radius'],
    correct: 0,
  },
  {
    topic: '2.1',
    content: 'Silicon has three isotopes: Si-28 (92.23%, 27.977 amu), Si-29 (4.68%, 28.976 amu), Si-30 (3.09%, 29.974 amu). What is silicon’s average atomic mass?',
    options: ['28.98 amu', '28.09 amu', '27.98 amu', '28.31 amu'],
    correct: 1,
  },
  {
    topic: '2.2',
    content: 'Rubidium has isotopes Rb-85 (84.91 amu) and Rb-87 (86.91 amu). If the average atomic mass is 85.47 amu, what is the percent abundance of Rb-85?',
    options: ['28%', '50%', '72%', '78%'],
    correct: 2,
  },
  {
    topic: '2.2',
    content: 'If an element’s average atomic mass is very close to a whole number matching one isotope’s mass number, this suggests that isotope is:',
    options: ['The only isotope that exists', 'Radioactive', 'Equal in abundance to the others', 'The most abundant one'],
    correct: 3,
  },
  {
    topic: '2.2',
    content: 'Element X has isotopes with mass numbers 10 and 11. X’s average atomic mass is 10.81. Which isotope is more abundant, and by roughly how much?',
    options: ['X-11, roughly 4× more abundant', 'X-10, roughly 4× more abundant', 'X-11, roughly 2× more abundant', 'They’re equally abundant'],
    correct: 0,
  },
  {
    topic: '3.1',
    content: 'What is the percent composition of nitrogen in ammonium nitrate, NH4NO3?',
    options: ['17.5%', '35.0%', '60.0%', '5.0%'],
    correct: 1,
  },
  {
    topic: '3.1',
    content: 'Which of these compounds has the highest percent composition by mass of oxygen?',
    options: ['CO2', 'SO3', 'H2O', 'MgO'],
    correct: 2,
  },
  {
    topic: '3.1',
    content: 'A 50.0 g sample of a compound contains 15.0 g of nitrogen. What is the percent composition of nitrogen?',
    options: ['15.0%', '35.0%', '3.33%', '30.0%'],
    correct: 3,
  },
  {
    topic: '3.2',
    content: 'A solution is made from 12.0 g of KCl dissolved in 88.0 g of water. What is the mass percent of KCl?',
    options: ['12.0%', '13.6%', '88.0%', '7.3%'],
    correct: 0,
  },
  {
    topic: '3.2',
    content: 'How many grams of solute are in 250 g of an 8.00% NaCl solution?',
    options: ['8.00 g', '20.0 g', '230 g', '31.3 g'],
    correct: 1,
  },
  {
    topic: '3.2',
    content: '150 mL of a solution has a density of 1.20 g/mL and contains 27.0 g of solute. What is the mass percent of the solute?',
    options: ['18.0%', '22.5%', '15.0%', '20.0%'],
    correct: 2,
  },
  {
    topic: '4.1',
    content: 'A compound is 40.0% C, 6.7% H, and 53.3% O by mass. What is its empirical formula?',
    options: ['C2H4O2', 'CHO', 'CH3O', 'CH2O'],
    correct: 3,
  },
  {
    topic: '4.1',
    content: 'Which statement about empirical formulas is TRUE?',
    options: [
      'The empirical formula shows the simplest whole-number ratio of atoms in a compound',
      'The empirical formula always matches the molecular formula',
      'Empirical formulas can be found from percent composition without needing elements’ molar masses',
      'Ionic compounds don’t have empirical formulas',
    ],
    correct: 0,
  },
  {
    topic: '4.1',
    content: 'A 5.00 g sample of a magnesium oxide compound contains 3.02 g of magnesium. What is its empirical formula?',
    options: ['Mg2O', 'MgO', 'MgO2', 'Mg2O3'],
    correct: 1,
  },
  {
    topic: '4.2',
    content: 'A compound has empirical formula C3H4 and a molar mass of approximately 120 g/mol. What is its molecular formula?',
    options: ['C6H8', 'C3H4', 'C9H12', 'C12H16'],
    correct: 2,
  },
  {
    topic: '4.2',
    content: 'A compound’s empirical formula is CH2O (formula mass 30.03 g/mol). Its actual molar mass is 60.06 g/mol. How many times larger is the molecular formula than the empirical formula?',
    options: ['1×', '3×', '4×', '2×'],
    correct: 3,
  },
]

const FRQ = [
  {
    topic: '1.1',
    points: 4,
    content: 'A particular ion has 34 protons, 45 neutrons, and 36 electrons.\n(a) Identify the element (name and symbol).\n(b) Determine the mass number of this ion.\n(c) Determine the overall charge of the ion and write its full isotopic/ionic symbol.\n(d) Explain, in terms of protons and electrons, why this species carries that charge even though protons alone determine the element’s identity.',
    answer_key: '(a) Z = 34, so the element is Selenium, Se.\n(b) Mass number = protons + neutrons = 34 + 45 = 79.\n(c) Charge = protons - electrons = 34 - 36 = -2, so the ion is Se²⁻; full symbol ⁷⁹₃₄Se²⁻.\n(d) The proton count (34) is unchanged, so it is still selenium — but it has gained 2 extra electrons beyond that, so the negative charges (electrons) outnumber the positive charges (protons) by 2, giving a net -2 charge.',
  },
  {
    topic: '2.1',
    points: 3,
    content: 'Magnesium has three naturally occurring isotopes: Mg-24 (23.985 amu, 78.99%), Mg-25 (24.986 amu, 10.00%), and Mg-26 (25.983 amu, 11.01%). Calculate the average atomic mass of magnesium. Show all work.',
    answer_key: 'Average atomic mass = (0.7899 × 23.985) + (0.1000 × 24.986) + (0.1101 × 25.983)\n= 18.9458 + 2.4986 + 2.8607\n= 24.31 amu.',
  },
  {
    topic: '2.2',
    points: 3,
    content: 'Antimony has two isotopes, Sb-121 (120.90 amu) and Sb-123 (122.90 amu). The average atomic mass of antimony is 121.76 amu. Calculate the percent abundance of each isotope. Show your algebraic setup.',
    answer_key: 'Let x = fractional abundance of Sb-121.\n121.76 = 120.90x + 122.90(1 - x)\n121.76 = 122.90 - 2.00x\n2.00x = 1.14\nx = 0.570\nSb-121 = 57.0%, Sb-123 = 43.0%.',
  },
  {
    topic: '3.1',
    points: 4,
    content: 'Calculate the molar mass and percent composition (by mass) of every element in copper(II) sulfate pentahydrate, CuSO4·5H2O. (Hint: the water of hydration contributes mass too — don’t leave it out.)',
    answer_key: 'Molar mass = Cu (63.55) + S (32.06) + 9 total O [4 from SO4 + 5 from H2O] (9 × 16.00 = 144.00) + 10 H [from 5 H2O] (10 × 1.008 = 10.08) = 249.69 g/mol.\n%Cu = 63.55 / 249.69 × 100 = 25.45%\n%S = 32.06 / 249.69 × 100 = 12.84%\n%O = 144.00 / 249.69 × 100 = 57.67%\n%H = 10.08 / 249.69 × 100 = 4.04%\n(Check: 25.45 + 12.84 + 57.67 + 4.04 = 100.00%.)',
  },
  {
    topic: '3.2',
    points: 3,
    content: 'A chemist prepares 250. mL of an aqueous glucose solution with a density of 1.06 g/mL. If the solution is 12.0% glucose by mass, how many grams of glucose and how many grams of water does it contain?',
    answer_key: 'Mass of solution = 250. mL × 1.06 g/mL = 265 g.\nMass of glucose = 0.120 × 265 g = 31.8 g.\nMass of water = 265 g - 31.8 g = 233 g.',
  },
  {
    topic: '4.1',
    points: 3,
    content: 'A compound is composed of 43.64% phosphorus and 56.36% oxygen by mass. Determine its empirical formula.',
    answer_key: 'In a 100 g sample: 43.64 g P ÷ 30.97 g/mol = 1.409 mol P; 56.36 g O ÷ 16.00 g/mol = 3.523 mol O.\nDivide by the smaller value (1.409): P = 1.00, O = 2.50.\nSince 2.50 is not a whole number, multiply both by 2: P = 2, O = 5.\nEmpirical formula: P2O5.',
  },
  {
    topic: '4.1',
    points: 4,
    content: 'A 2.500 g sample of a hydrocarbon (containing only carbon and hydrogen) is completely combusted, producing 7.857 g of CO2 and 3.219 g of H2O. Determine its empirical formula.',
    answer_key: 'mol CO2 = 7.857 / 44.01 = 0.1785 mol → mol C = 0.1785, mass C = 0.1785 × 12.01 = 2.144 g.\nmol H2O = 3.219 / 18.02 = 0.1786 mol → mol H = 2 × 0.1786 = 0.3573, mass H = 0.3573 × 1.008 = 0.360 g.\n(Check: 2.144 + 0.360 = 2.504 g, matching the 2.500 g sample — confirms no other element is present.)\nMole ratio C:H = 0.1785 : 0.3573 → divide by the smaller → 1.00 : 2.00.\nEmpirical formula: CH2.',
  },
  {
    topic: '4.2',
    points: 3,
    content: 'A hydrocarbon has empirical formula CH2 and a molar mass of 84.16 g/mol. Determine its molecular formula.',
    answer_key: 'Empirical formula mass = 12.01 + 2(1.008) = 14.03 g/mol.\nn = 84.16 / 14.03 = 6.00.\nMolecular formula: C6H12.',
  },
  {
    topic: '4.2',
    points: 4,
    content: 'A compound used as automotive antifreeze is 38.7% C, 9.7% H, and 51.6% O by mass, with a molar mass of approximately 62.07 g/mol.\n(a) Determine its empirical formula.\n(b) Determine its molecular formula.\n(c) Name this compound.',
    answer_key: '(a) In 100 g: mol C = 38.7/12.01 = 3.223, mol H = 9.7/1.008 = 9.623, mol O = 51.6/16.00 = 3.225. Divide by the smallest (3.223): C = 1.00, H = 2.99 ≈ 3, O = 1.00 → empirical formula CH3O.\n(b) Empirical formula mass = 12.01 + 3(1.008) + 16.00 = 31.03 g/mol. n = 62.07 / 31.03 = 2.00 → molecular formula C2H6O2.\n(c) This is ethylene glycol, the main ingredient in automotive antifreeze.',
  },
  {
    topic: '4.2',
    points: 6,
    content: 'A 4.375 g sample of a compound containing only C, H, and O is completely combusted, producing 6.560 g of CO2 and 1.791 g of H2O. The compound’s molar mass is measured to be 176.12 g/mol.\n(a) Determine the mass of carbon, hydrogen, and oxygen in the original sample.\n(b) Determine the empirical formula.\n(c) Determine the molecular formula.\n(d) Calculate the percent composition by mass of oxygen in this compound.',
    answer_key: '(a) mol CO2 = 6.560/44.01 = 0.1491 mol → mol C = 0.1491, mass C = 0.1491 × 12.01 = 1.790 g. mol H2O = 1.791/18.02 = 0.09939 mol → mol H = 0.1988, mass H = 0.1988 × 1.008 = 0.2004 g. Oxygen is not measured directly (some O in the CO2/H2O came from the combustion air), so it is found by subtraction: mass O = 4.375 - 1.790 - 0.2004 = 2.385 g.\n(b) mol O = 2.385/16.00 = 0.1491. Mole ratio C:H:O = 0.1491 : 0.1988 : 0.1491 → divide by the smallest → 1.000 : 1.333 : 1.000. Multiply through by 3 to clear the 1.333 (= 4/3): empirical formula C3H4O3, formula mass = 3(12.01) + 4(1.008) + 3(16.00) = 88.06 g/mol.\n(c) n = 176.12/88.06 = 2.00 → molecular formula C6H8O6 (this is ascorbic acid — vitamin C).\n(d) %O = (6 × 16.00)/176.12 × 100 = 96.00/176.12 × 100 = 54.51%. (This comes out the same whether computed from the empirical or molecular formula, since percent composition is a ratio that doesn’t change when the whole formula is scaled — a good check on parts (b)/(c).)',
  },
]

async function main() {
  const { data: test, error: testError } = await supabase
    .from('diagnostic_tests')
    .insert({
      title: 'Honors Chemistry Unit 1–4 Test',
      slug: 'honors-chemistry-unit-1-4',
      description: 'Covers Units 1–4: Subatomic Particles, Average Atomic Mass, Mass Percent, and Empirical/Molecular Formula.',
      question_count_per_attempt: 30,
      duration_minutes: 75,
      is_active: false,
    })
    .select('id')
    .single()
  if (testError) throw testError
  console.log('Created test:', test.id)

  const topicRows = TOPICS.map(t => ({ diagnostic_test_id: test.id, title: t.title, prep_advice: t.prep_advice }))
  const { data: insertedTopics, error: topicsError } = await supabase.from('diagnostic_topics').insert(topicRows).select('id, title')
  if (topicsError) throw topicsError
  const topicIdByKey = new Map(TOPICS.map((t, i) => [t.key, insertedTopics.find(it => it.title === t.title).id]))
  console.log('Created', insertedTopics.length, 'topics')

  const mcqRows = MCQ.map(q => ({
    diagnostic_test_id: test.id,
    topic_id: topicIdByKey.get(q.topic),
    content: q.content,
    question_type: 'mcq',
    mcq_options: q.options,
    mcq_correct_index: q.correct,
    points: null,
    answer_key: null,
    source: 'Honors Chemistry Unit 1-4 Test',
    is_active: true,
  }))
  const frqRows = FRQ.map(q => ({
    diagnostic_test_id: test.id,
    topic_id: topicIdByKey.get(q.topic),
    content: q.content,
    question_type: 'frq',
    mcq_options: null,
    mcq_correct_index: null,
    points: q.points,
    answer_key: q.answer_key,
    source: 'Honors Chemistry Unit 1-4 Test',
    is_active: true,
  }))

  const { error: qError } = await supabase.from('diagnostic_questions').insert([...mcqRows, ...frqRows])
  if (qError) throw qError
  console.log('Created', mcqRows.length, 'MCQ +', frqRows.length, 'FRQ =', mcqRows.length + frqRows.length, 'questions')
  console.log('\nDone. Test is UNPUBLISHED (is_active: false, no class assigned) — review it at /teacher/diagnostics, then use Manage Test to activate and publish to Honors Chemistry when ready.')
}

main().catch(e => { console.error(e); process.exit(1) })
