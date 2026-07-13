// Adds 21 new Empirical/Molecular Formula questions (Honors Chem Unit 4) to reach 30 total
// across topics 4.1 (Empirical Formula) and 4.2 (Molecular Formula).
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

const TOPIC_41 = '396250ac-60fe-453c-be80-5b2a5cd6d037' // Empirical Formula
const TOPIC_42 = '82447dd3-3b3e-4699-b24b-234f3cd018f9' // Molecular Formula

const topic41Questions = [
  {
    title: 'Q5 — Empirical Formula of a Nitrogen Oxide',
    content: 'A compound contains 36.86% N and 63.14% O. What is the empirical formula of this compound?',
    answer_key: `Step 1: Assume a 100.0 g sample. The percentages become grams directly.
Mass of N = 36.86 g
Mass of O = 63.14 g

Step 2: Convert mass to moles using molar masses.
Moles of N = 36.86 g / 14.01 g/mol = 2.631 mol N
Moles of O = 63.14 g / 16.00 g/mol = 3.946 mol O

Step 3: Divide each mole value by the smallest value.
N: 2.631 / 2.631 = 1.00
O: 3.946 / 2.631 = 1.50

Step 4: Multiply both ratios by 2 to clear the 0.50 fraction and obtain whole numbers.
N: 1.00 x 2 = 2
O: 1.50 x 2 = 3

Final Answer:
N2O3`,
  },
  {
    title: 'Q6 — Empirical Formula from Grams (Nitrogen Oxide)',
    content: 'A compound contains 2.04 g of nitrogen and 4.65 g of oxygen. What is its empirical formula?',
    answer_key: `Step 1: Convert the mass of each element to moles.
Moles of N = 2.04 g / 14.01 g/mol = 0.1456 mol N
Moles of O = 4.65 g / 16.00 g/mol = 0.2906 mol O

Step 2: Divide each mole value by the smallest value.
N: 0.1456 / 0.1456 = 1.00
O: 0.2906 / 0.1456 = 2.00

Final Answer:
NO2`,
  },
  {
    title: 'Q7 — Empirical Formula of Sodium Thiosulfate',
    content: 'A compound is found to contain 29.08% Na, 40.56% S, and 30.36% O by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of Na = 29.08 g
Mass of S = 40.56 g
Mass of O = 30.36 g

Step 2: Convert each mass to moles.
Moles of Na = 29.08 g / 22.99 g/mol = 1.265 mol Na
Moles of S = 40.56 g / 32.06 g/mol = 1.265 mol S
Moles of O = 30.36 g / 16.00 g/mol = 1.898 mol O

Step 3: Divide each mole value by the smallest value (1.265 mol).
Na: 1.265 / 1.265 = 1.00
S: 1.265 / 1.265 = 1.00
O: 1.898 / 1.265 = 1.50

Step 4: Multiply all ratios by 2 to clear the 0.50 fraction.
Na: 1.00 x 2 = 2
S: 1.00 x 2 = 2
O: 1.50 x 2 = 3

Final Answer:
Na2S2O3`,
  },
  {
    title: 'Q8 — Empirical Formula from a Synthesis Reaction (Magnesium Chloride)',
    content: '1.20 g of magnesium metal reacts completely with chlorine gas to form 4.75 g of a magnesium chloride compound. Determine the empirical formula of the compound.',
    answer_key: `Step 1: Find the mass of chlorine that reacted, using conservation of mass.
Mass of Cl = mass of compound - mass of Mg
Mass of Cl = 4.75 g - 1.20 g = 3.55 g

Step 2: Convert the mass of each element to moles.
Moles of Mg = 1.20 g / 24.31 g/mol = 0.04936 mol Mg
Moles of Cl = 3.55 g / 35.45 g/mol = 0.1001 mol Cl

Step 3: Divide each mole value by the smallest value.
Mg: 0.04936 / 0.04936 = 1.00
Cl: 0.1001 / 0.04936 = 2.03, which rounds to 2

Final Answer:
MgCl2`,
  },
  {
    title: 'Q9 — Empirical Formula from Combustion Analysis (Hydrocarbon)',
    content: 'A 2.500 g sample of a hydrocarbon is burned completely in oxygen, producing 7.857 g of CO2 and 3.214 g of H2O. Determine the empirical formula of the hydrocarbon.',
    answer_key: `Step 1: Find the mass of carbon from the CO2 produced.
Every mole of CO2 contains exactly one mole of C from the original sample.
Mass of C = mass of CO2 x (molar mass of C / molar mass of CO2)
Mass of C = 7.857 g x (12.01 g/mol / 44.01 g/mol) = 2.144 g C

Step 2: Find the mass of hydrogen from the H2O produced.
Every mole of H2O contains exactly two moles of H from the original sample.
Mass of H = mass of H2O x (2 x molar mass of H / molar mass of H2O)
Mass of H = 3.214 g x (2.016 g/mol / 18.02 g/mol) = 0.3596 g H

Step 3: Check for oxygen in the original sample.
Mass of C + mass of H = 2.144 g + 0.3596 g = 2.504 g
This is approximately equal to the original sample mass (2.500 g), so the compound contains only C and H — no oxygen (confirming it is a hydrocarbon).

Step 4: Convert the mass of C and H to moles.
Moles of C = 2.144 g / 12.01 g/mol = 0.1786 mol C
Moles of H = 0.3596 g / 1.008 g/mol = 0.3568 mol H

Step 5: Divide each mole value by the smallest value.
C: 0.1786 / 0.1786 = 1.00
H: 0.3568 / 0.1786 = 2.00

Final Answer:
CH2`,
  },
  {
    title: 'Q10 — Empirical Formula of Potassium Dichromate',
    content: 'A compound contains 26.58% K, 35.35% Cr, and 38.07% O by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of K = 26.58 g
Mass of Cr = 35.35 g
Mass of O = 38.07 g

Step 2: Convert each mass to moles.
Moles of K = 26.58 g / 39.10 g/mol = 0.6798 mol K
Moles of Cr = 35.35 g / 52.00 g/mol = 0.6798 mol Cr
Moles of O = 38.07 g / 16.00 g/mol = 2.379 mol O

Step 3: Divide each mole value by the smallest value (0.6798 mol).
K: 0.6798 / 0.6798 = 1.00
Cr: 0.6798 / 0.6798 = 1.00
O: 2.379 / 0.6798 = 3.50

Step 4: Multiply all ratios by 2 to clear the 0.50 fraction.
K: 1.00 x 2 = 2
Cr: 1.00 x 2 = 2
O: 3.50 x 2 = 7

Final Answer:
K2Cr2O7`,
  },
  {
    title: 'Q11 — Empirical Formula of Pyruvic Acid',
    content: 'Pyruvic acid, an important compound in cellular metabolism, is found to contain 40.92% C, 4.58% H, and 54.50% O by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of C = 40.92 g
Mass of H = 4.58 g
Mass of O = 54.50 g

Step 2: Convert each mass to moles.
Moles of C = 40.92 g / 12.01 g/mol = 3.407 mol C
Moles of H = 4.58 g / 1.008 g/mol = 4.544 mol H
Moles of O = 54.50 g / 16.00 g/mol = 3.406 mol O

Step 3: Divide each mole value by the smallest value (3.406 mol).
C: 3.407 / 3.406 = 1.00
H: 4.544 / 3.406 = 1.33
O: 3.406 / 3.406 = 1.00

Step 4: Multiply all ratios by 3 to clear the 0.33 (1/3) fraction.
C: 1.00 x 3 = 3
H: 1.33 x 3 = 4
O: 1.00 x 3 = 3

Final Answer:
C3H4O3`,
  },
  {
    title: 'Q12 — Empirical Formula of Ammonium Chloride',
    content: 'A compound contains 26.19% N, 7.54% H, and 66.27% Cl by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of N = 26.19 g
Mass of H = 7.54 g
Mass of Cl = 66.27 g

Step 2: Convert each mass to moles.
Moles of N = 26.19 g / 14.01 g/mol = 1.870 mol N
Moles of H = 7.54 g / 1.008 g/mol = 7.480 mol H
Moles of Cl = 66.27 g / 35.45 g/mol = 1.869 mol Cl

Step 3: Divide each mole value by the smallest value (1.869 mol).
N: 1.870 / 1.869 = 1.00
H: 7.480 / 1.869 = 4.00
Cl: 1.869 / 1.869 = 1.00

Final Answer:
NH4Cl`,
  },
  {
    title: 'Q13 — Empirical Formula of Calcium Carbonate',
    content: 'A compound contains 40.04% Ca, 12.00% C, and 47.96% O by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of Ca = 40.04 g
Mass of C = 12.00 g
Mass of O = 47.96 g

Step 2: Convert each mass to moles.
Moles of Ca = 40.04 g / 40.08 g/mol = 0.9990 mol Ca
Moles of C = 12.00 g / 12.01 g/mol = 0.9992 mol C
Moles of O = 47.96 g / 16.00 g/mol = 2.998 mol O

Step 3: Divide each mole value by the smallest value (0.9990 mol).
Ca: 0.9990 / 0.9990 = 1.00
C: 0.9992 / 0.9990 = 1.00
O: 2.998 / 0.9990 = 3.00

Final Answer:
CaCO3`,
  },
  {
    title: 'Q14 — Empirical Formula of Aluminum Hydroxide',
    content: 'A compound contains 34.59% Al, 61.54% O, and 3.88% H by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of Al = 34.59 g
Mass of O = 61.54 g
Mass of H = 3.88 g

Step 2: Convert each mass to moles.
Moles of Al = 34.59 g / 26.98 g/mol = 1.282 mol Al
Moles of O = 61.54 g / 16.00 g/mol = 3.846 mol O
Moles of H = 3.88 g / 1.008 g/mol = 3.849 mol H

Step 3: Divide each mole value by the smallest value (1.282 mol).
Al: 1.282 / 1.282 = 1.00
O: 3.846 / 1.282 = 3.00
H: 3.849 / 1.282 = 3.00

Final Answer:
Al(OH)3`,
  },
  {
    title: 'Q15 — Empirical Formula of Ethanol',
    content: 'A compound is 52.14% C, 13.13% H, and 34.74% O by mass. Determine its empirical formula.',
    answer_key: `Step 1: Assume a 100.0 g sample.
Mass of C = 52.14 g
Mass of H = 13.13 g
Mass of O = 34.74 g

Step 2: Convert each mass to moles.
Moles of C = 52.14 g / 12.01 g/mol = 4.342 mol C
Moles of H = 13.13 g / 1.008 g/mol = 13.03 mol H
Moles of O = 34.74 g / 16.00 g/mol = 2.171 mol O

Step 3: Divide each mole value by the smallest value (2.171 mol).
C: 4.342 / 2.171 = 2.00
H: 13.03 / 2.171 = 6.00
O: 2.171 / 2.171 = 1.00

Final Answer:
C2H6O`,
  },
]

const topic42Questions = [
  {
    title: 'Q6 — Molecular Formula from an Empirical Formula (C2H4O)',
    content: 'A compound has the empirical formula C2H4O and a molar mass of 88.11 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Calculate the empirical formula mass (EFM) of C2H4O.
EFM = (2 x 12.01 g/mol) + (4 x 1.008 g/mol) + (1 x 16.00 g/mol)
EFM = 24.02 g/mol + 4.032 g/mol + 16.00 g/mol = 44.05 g/mol

Step 2: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass
n = 88.11 g/mol / 44.05 g/mol = 2.00

Step 3: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (C2H4O) x 2 = C4H8O2

Final Answer:
C4H8O2`,
  },
  {
    title: 'Q7 — Molecular Formula of Cyclopropane',
    content: 'Cyclopropane is 85.63% C and 14.37% H by mass, with a molar mass of 42.08 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Assume a 100.0 g sample and convert to moles.
Moles of C = 85.63 g / 12.01 g/mol = 7.130 mol C
Moles of H = 14.37 g / 1.008 g/mol = 14.26 mol H

Step 2: Divide by the smallest mole value to find the empirical formula.
C: 7.130 / 7.130 = 1.00
H: 14.26 / 7.130 = 2.00
Empirical Formula = CH2

Step 3: Calculate the empirical formula mass (EFM).
EFM = 12.01 g/mol + 2(1.008 g/mol) = 14.03 g/mol

Step 4: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 42.08 g/mol / 14.03 g/mol = 3.00

Step 5: Multiply the subscripts of the empirical formula by n = 3.
Molecular Formula = (CH2) x 3 = C3H6

Final Answer:
C3H6`,
  },
  {
    title: 'Q8 — Molecular Formula of Succinic Acid',
    content: 'Succinic acid is 40.68% C, 5.12% H, and 54.20% O by mass, with a molar mass of 118.09 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Assume a 100.0 g sample and convert to moles.
Moles of C = 40.68 g / 12.01 g/mol = 3.387 mol C
Moles of H = 5.12 g / 1.008 g/mol = 5.079 mol H
Moles of O = 54.20 g / 16.00 g/mol = 3.388 mol O

Step 2: Divide by the smallest mole value to find the empirical formula.
C: 3.387 / 3.387 = 1.00
H: 5.079 / 3.387 = 1.50
O: 3.388 / 3.387 = 1.00

Step 3: Multiply all ratios by 2 to clear the 0.50 fraction.
C: 1.00 x 2 = 2
H: 1.50 x 2 = 3
O: 1.00 x 2 = 2
Empirical Formula = C2H3O2

Step 4: Calculate the empirical formula mass (EFM).
EFM = 2(12.01) + 3(1.008) + 2(16.00) = 24.02 + 3.024 + 32.00 = 59.04 g/mol

Step 5: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 118.09 g/mol / 59.04 g/mol = 2.00

Step 6: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (C2H3O2) x 2 = C4H6O4

Final Answer:
C4H6O4`,
  },
  {
    title: 'Q9 — Molecular Formula of Glucose (from Grams)',
    content: 'A 3.00 g sample of a compound contains 1.200 g of C, 0.2016 g of H, and 1.600 g of O. The molar mass of the compound is 180.16 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Convert the mass of each element to moles.
Moles of C = 1.200 g / 12.01 g/mol = 0.09992 mol C
Moles of H = 0.2016 g / 1.008 g/mol = 0.2000 mol H
Moles of O = 1.600 g / 16.00 g/mol = 0.1000 mol O

Step 2: Divide each mole value by the smallest value (0.09992 mol) to find the empirical formula.
C: 0.09992 / 0.09992 = 1.00
H: 0.2000 / 0.09992 = 2.00
O: 0.1000 / 0.09992 = 1.00
Empirical Formula = CH2O

Step 3: Calculate the empirical formula mass (EFM).
EFM = 12.01 g/mol + 2(1.008 g/mol) + 16.00 g/mol = 30.03 g/mol

Step 4: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 180.16 g/mol / 30.03 g/mol = 6.00

Step 5: Multiply the subscripts of the empirical formula by n = 6.
Molecular Formula = (CH2O) x 6 = C6H12O6

Final Answer:
C6H12O6 (glucose)`,
  },
  {
    title: 'Q10 — Molecular Formula from an Empirical Formula (P2O5)',
    content: 'A phosphorus oxide has the empirical formula P2O5 and a molar mass of 283.88 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Calculate the empirical formula mass (EFM) of P2O5.
EFM = (2 x 30.97 g/mol) + (5 x 16.00 g/mol)
EFM = 61.94 g/mol + 80.00 g/mol = 141.94 g/mol

Step 2: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 283.88 g/mol / 141.94 g/mol = 2.00

Step 3: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (P2O5) x 2 = P4O10

Final Answer:
P4O10`,
  },
  {
    title: 'Q11 — Molecular Formula of Benzene',
    content: 'Benzene has the empirical formula CH and a molar mass of 78.11 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Calculate the empirical formula mass (EFM) of CH.
EFM = 12.01 g/mol + 1.008 g/mol = 13.02 g/mol

Step 2: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 78.11 g/mol / 13.02 g/mol = 6.00

Step 3: Multiply the subscripts of the empirical formula by n = 6.
Molecular Formula = (CH) x 6 = C6H6

Final Answer:
C6H6 (benzene)`,
  },
  {
    title: 'Q12 — Molecular Formula of Naphthalene',
    content: 'A compound is 93.71% C and 6.29% H by mass, with a molar mass of 128.17 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Assume a 100.0 g sample and convert to moles.
Moles of C = 93.71 g / 12.01 g/mol = 7.803 mol C
Moles of H = 6.29 g / 1.008 g/mol = 6.240 mol H

Step 2: Divide by the smallest mole value (6.240 mol) to find the mole ratio.
C: 7.803 / 6.240 = 1.25
H: 6.240 / 6.240 = 1.00

Step 3: Multiply both ratios by 4 to clear the 0.25 (1/4) fraction.
C: 1.25 x 4 = 5
H: 1.00 x 4 = 4
Empirical Formula = C5H4

Step 4: Calculate the empirical formula mass (EFM).
EFM = 5(12.01) + 4(1.008) = 60.05 + 4.032 = 64.08 g/mol

Step 5: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 128.17 g/mol / 64.08 g/mol = 2.00

Step 6: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (C5H4) x 2 = C10H8

Final Answer:
C10H8 (naphthalene)`,
  },
  {
    title: 'Q13 — Molecular Formula of Hexane (from Combustion Analysis)',
    content: 'Combustion of a 4.300 g sample of a hydrocarbon produces 13.18 g of CO2 and 6.295 g of H2O. The molar mass of the compound is 86.18 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Find the mass of carbon from the CO2 produced.
Mass of C = mass of CO2 x (molar mass of C / molar mass of CO2)
Mass of C = 13.18 g x (12.01 g/mol / 44.01 g/mol) = 3.597 g C

Step 2: Find the mass of hydrogen from the H2O produced.
Mass of H = mass of H2O x (2 x molar mass of H / molar mass of H2O)
Mass of H = 6.295 g x (2.016 g/mol / 18.02 g/mol) = 0.7042 g H

Step 3: Check for oxygen.
Mass of C + mass of H = 3.597 g + 0.7042 g = 4.301 g, which matches the original 4.300 g sample.
The compound contains only C and H — no oxygen.

Step 4: Convert the mass of C and H to moles.
Moles of C = 3.597 g / 12.01 g/mol = 0.2996 mol C
Moles of H = 0.7042 g / 1.008 g/mol = 0.6987 mol H

Step 5: Divide by the smallest mole value to find the empirical formula.
C: 0.2996 / 0.2996 = 1.00
H: 0.6987 / 0.2996 = 2.33

Step 6: Multiply both ratios by 3 to clear the 0.33 (1/3) fraction.
C: 1.00 x 3 = 3
H: 2.33 x 3 = 7
Empirical Formula = C3H7

Step 7: Calculate the empirical formula mass (EFM).
EFM = 3(12.01) + 7(1.008) = 36.03 + 7.056 = 43.09 g/mol

Step 8: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 86.18 g/mol / 43.09 g/mol = 2.00

Step 9: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (C3H7) x 2 = C6H14

Final Answer:
C6H14 (hexane)`,
  },
  {
    title: 'Q14 — Molecular Formula from an Empirical Formula (CH3)',
    content: 'A compound has the empirical formula CH3 and a molar mass of 30.07 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Calculate the empirical formula mass (EFM) of CH3.
EFM = 12.01 g/mol + 3(1.008 g/mol) = 12.01 g/mol + 3.024 g/mol = 15.03 g/mol

Step 2: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 30.07 g/mol / 15.03 g/mol = 2.00

Step 3: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (CH3) x 2 = C2H6

Final Answer:
C2H6 (ethane)`,
  },
  {
    title: 'Q15 — Molecular Formula of Octane',
    content: 'A compound has the empirical formula C4H9 and a molar mass of 114.22 g/mol. Determine its molecular formula.',
    answer_key: `Step 1: Calculate the empirical formula mass (EFM) of C4H9.
EFM = 4(12.01 g/mol) + 9(1.008 g/mol) = 48.04 g/mol + 9.072 g/mol = 57.11 g/mol

Step 2: Calculate the scaling factor (n).
n = Molar Mass / Empirical Formula Mass = 114.22 g/mol / 57.11 g/mol = 2.00

Step 3: Multiply the subscripts of the empirical formula by n = 2.
Molecular Formula = (C4H9) x 2 = C8H18

Final Answer:
C8H18 (octane)`,
  },
]

async function main() {
  const { data: existing41 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_41).order('order_index', { ascending: false }).limit(1)
  const { data: existing42 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_42).order('order_index', { ascending: false }).limit(1)
  let idx41 = (existing41[0]?.order_index ?? -1) + 1
  let idx42 = (existing42[0]?.order_index ?? -1) + 1

  const rows = []
  for (const q of topic41Questions) {
    rows.push({ ...q, topic_id: TOPIC_41, order_index: idx41++ })
  }
  for (const q of topic42Questions) {
    rows.push({ ...q, topic_id: TOPIC_42, order_index: idx42++ })
  }

  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }
  console.log(`Inserted ${data.length} questions.`)
}

main()
