// Adds 21 new Mass Percent questions (Honors Chem Unit 3) to reach 30 total
// across topics 3.1 (Molar Mass and Percentage Composition) and 3.2 (Mass Percent of Solutions).
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

const TOPIC_31 = '7663b764-3731-4032-b39e-7cd29a0168c6' // Molar Mass and Percentage Composition
const TOPIC_32 = 'aa4a3724-c50e-40de-bf80-11f5973571c0' // Mass Percent of Solutions

const topic31Questions = [
  {
    title: 'Q6 — Molar Mass and Percent Composition of MgCl2',
    content: 'Calculate the molar mass and percentage composition (by mass) of MgCl2. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of MgCl2
Mg = 24.31 g/mol
Cl = 35.45 g/mol

Molar mass of MgCl2 = (1 x 24.31 g/mol) + (2 x 35.45 g/mol)
Molar mass of MgCl2 = 24.31 g/mol + 70.90 g/mol
Molar mass of MgCl2 = 95.21 g/mol

Step 2: Calculate the mass percent of Magnesium (Mg)
% Mg = (24.31 g/mol / 95.21 g/mol) x 100
% Mg = 25.53%

Step 3: Calculate the mass percent of Chlorine (Cl)
% Cl = (70.90 g/mol / 95.21 g/mol) x 100
% Cl = 74.47%

Check: 25.53% + 74.47% = 100.00%

Final Answer:
Molar Mass of MgCl2 = 95.21 g/mol
Percent Composition: Mg = 25.53%, Cl = 74.47%`,
  },
  {
    title: 'Q7 — Molar Mass and Percent Composition of Al2O3',
    content: 'Calculate the molar mass and percentage composition (by mass) of Al2O3. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of Al2O3
Al = 26.98 g/mol
O = 16.00 g/mol

Molar mass of Al2O3 = (2 x 26.98 g/mol) + (3 x 16.00 g/mol)
Molar mass of Al2O3 = 53.96 g/mol + 48.00 g/mol
Molar mass of Al2O3 = 101.96 g/mol

Step 2: Calculate the mass percent of Aluminum (Al)
% Al = (53.96 g/mol / 101.96 g/mol) x 100
% Al = 52.92%

Step 3: Calculate the mass percent of Oxygen (O)
% O = (48.00 g/mol / 101.96 g/mol) x 100
% O = 47.08%

Check: 52.92% + 47.08% = 100.00%

Final Answer:
Molar Mass of Al2O3 = 101.96 g/mol
Percent Composition: Al = 52.92%, O = 47.08%`,
  },
  {
    title: 'Q8 — Molar Mass and Percent Composition of Fe2O3',
    content: 'Calculate the molar mass and percentage composition (by mass) of Fe2O3. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of Fe2O3
Fe = 55.85 g/mol
O = 16.00 g/mol

Molar mass of Fe2O3 = (2 x 55.85 g/mol) + (3 x 16.00 g/mol)
Molar mass of Fe2O3 = 111.70 g/mol + 48.00 g/mol
Molar mass of Fe2O3 = 159.70 g/mol

Step 2: Calculate the mass percent of Iron (Fe)
% Fe = (111.70 g/mol / 159.70 g/mol) x 100
% Fe = 69.94%

Step 3: Calculate the mass percent of Oxygen (O)
% O = (48.00 g/mol / 159.70 g/mol) x 100
% O = 30.06%

Check: 69.94% + 30.06% = 100.00%

Final Answer:
Molar Mass of Fe2O3 = 159.70 g/mol
Percent Composition: Fe = 69.94%, O = 30.06%`,
  },
  {
    title: 'Q9 — Molar Mass and Percent Composition of KNO3',
    content: 'Calculate the molar mass and percentage composition (by mass) of KNO3. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of KNO3
K = 39.10 g/mol
N = 14.01 g/mol
O = 16.00 g/mol

Molar mass of KNO3 = (1 x 39.10 g/mol) + (1 x 14.01 g/mol) + (3 x 16.00 g/mol)
Molar mass of KNO3 = 39.10 g/mol + 14.01 g/mol + 48.00 g/mol
Molar mass of KNO3 = 101.11 g/mol

Step 2: Calculate the mass percent of Potassium (K)
% K = (39.10 g/mol / 101.11 g/mol) x 100
% K = 38.67%

Step 3: Calculate the mass percent of Nitrogen (N)
% N = (14.01 g/mol / 101.11 g/mol) x 100
% N = 13.86%

Step 4: Calculate the mass percent of Oxygen (O)
% O = (48.00 g/mol / 101.11 g/mol) x 100
% O = 47.47%

Check: 38.67% + 13.86% + 47.47% = 100.00%

Final Answer:
Molar Mass of KNO3 = 101.11 g/mol
Percent Composition: K = 38.67%, N = 13.86%, O = 47.47%`,
  },
  {
    title: 'Q10 — Molar Mass and Percent Composition of Glucose (C6H12O6)',
    content: 'Calculate the molar mass and percentage composition (by mass) of glucose, C6H12O6. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of C6H12O6
C = 12.01 g/mol
H = 1.008 g/mol
O = 16.00 g/mol

Molar mass of C6H12O6 = (6 x 12.01 g/mol) + (12 x 1.008 g/mol) + (6 x 16.00 g/mol)
Molar mass of C6H12O6 = 72.06 g/mol + 12.096 g/mol + 96.00 g/mol
Molar mass of C6H12O6 = 180.16 g/mol

Step 2: Calculate the mass percent of Carbon (C)
% C = (72.06 g/mol / 180.16 g/mol) x 100
% C = 40.00%

Step 3: Calculate the mass percent of Hydrogen (H)
% H = (12.096 g/mol / 180.16 g/mol) x 100
% H = 6.714%

Step 4: Calculate the mass percent of Oxygen (O)
% O = (96.00 g/mol / 180.16 g/mol) x 100
% O = 53.28%

Check: 40.00% + 6.714% + 53.28% = 99.99% (rounds to 100.0%)

Final Answer:
Molar Mass of glucose (C6H12O6) = 180.16 g/mol
Percent Composition: C = 40.00%, H = 6.714%, O = 53.28%`,
  },
  {
    title: 'Q11 — Molar Mass and Percent Composition of NH4NO3',
    content: 'Calculate the molar mass and percentage composition (by mass) of ammonium nitrate, NH4NO3. Show your work and include units.',
    answer_key: `Step 1: Identify the number of atoms of each element in NH4NO3.
Nitrogen (N) = 2 (one in NH4, one in NO3)
Hydrogen (H) = 4
Oxygen (O) = 3

Step 2: Calculate the molar mass of NH4NO3
N = 14.01 g/mol, H = 1.008 g/mol, O = 16.00 g/mol

Mass of N = 2 x 14.01 g/mol = 28.02 g/mol
Mass of H = 4 x 1.008 g/mol = 4.032 g/mol
Mass of O = 3 x 16.00 g/mol = 48.00 g/mol

Molar mass of NH4NO3 = 28.02 + 4.032 + 48.00 = 80.05 g/mol

Step 3: Calculate the mass percent of Nitrogen (N)
% N = (28.02 g/mol / 80.05 g/mol) x 100
% N = 35.00%

Step 4: Calculate the mass percent of Hydrogen (H)
% H = (4.032 g/mol / 80.05 g/mol) x 100
% H = 5.037%

Step 5: Calculate the mass percent of Oxygen (O)
% O = (48.00 g/mol / 80.05 g/mol) x 100
% O = 59.96%

Check: 35.00% + 5.037% + 59.96% = 100.00%

Final Answer:
Molar Mass of NH4NO3 = 80.05 g/mol
Percent Composition: N = 35.00%, H = 5.037%, O = 59.96%`,
  },
  {
    title: 'Q12 — Molar Mass and Percent Composition of Mg3N2',
    content: 'Calculate the molar mass and percentage composition (by mass) of magnesium nitride, Mg3N2. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of Mg3N2
Mg = 24.31 g/mol
N = 14.01 g/mol

Molar mass of Mg3N2 = (3 x 24.31 g/mol) + (2 x 14.01 g/mol)
Molar mass of Mg3N2 = 72.93 g/mol + 28.02 g/mol
Molar mass of Mg3N2 = 100.95 g/mol

Step 2: Calculate the mass percent of Magnesium (Mg)
% Mg = (72.93 g/mol / 100.95 g/mol) x 100
% Mg = 72.24%

Step 3: Calculate the mass percent of Nitrogen (N)
% N = (28.02 g/mol / 100.95 g/mol) x 100
% N = 27.76%

Check: 72.24% + 27.76% = 100.00%

Final Answer:
Molar Mass of Mg3N2 = 100.95 g/mol
Percent Composition: Mg = 72.24%, N = 27.76%`,
  },
  {
    title: 'Q13 — Molar Mass and Percent Composition of Al2(SO4)3',
    content: 'Calculate the molar mass and percentage composition (by mass) of aluminum sulfate, Al2(SO4)3. Show your work and include units.',
    answer_key: `Step 1: Identify the number of atoms of each element in Al2(SO4)3.
Aluminum (Al) = 2
Sulfur (S) = 3
Oxygen (O) = 12 (4 oxygens per sulfate, 3 sulfate groups)

Step 2: Calculate the molar mass of Al2(SO4)3
Al = 26.98 g/mol, S = 32.06 g/mol, O = 16.00 g/mol

Mass of Al = 2 x 26.98 g/mol = 53.96 g/mol
Mass of S = 3 x 32.06 g/mol = 96.18 g/mol
Mass of O = 12 x 16.00 g/mol = 192.00 g/mol

Molar mass of Al2(SO4)3 = 53.96 + 96.18 + 192.00 = 342.14 g/mol

Step 3: Calculate the mass percent of Aluminum (Al)
% Al = (53.96 g/mol / 342.14 g/mol) x 100
% Al = 15.77%

Step 4: Calculate the mass percent of Sulfur (S)
% S = (96.18 g/mol / 342.14 g/mol) x 100
% S = 28.11%

Step 5: Calculate the mass percent of Oxygen (O)
% O = (192.00 g/mol / 342.14 g/mol) x 100
% O = 56.12%

Check: 15.77% + 28.11% + 56.12% = 100.00%

Final Answer:
Molar Mass of Al2(SO4)3 = 342.14 g/mol
Percent Composition: Al = 15.77%, S = 28.11%, O = 56.12%`,
  },
  {
    title: 'Q14 — Molar Mass and Percent Composition of Sucrose (C12H22O11)',
    content: 'Calculate the molar mass and percentage composition (by mass) of sucrose (table sugar), C12H22O11. Show your work and include units.',
    answer_key: `Step 1: Calculate the molar mass of C12H22O11
C = 12.01 g/mol, H = 1.008 g/mol, O = 16.00 g/mol

Mass of C = 12 x 12.01 g/mol = 144.12 g/mol
Mass of H = 22 x 1.008 g/mol = 22.18 g/mol
Mass of O = 11 x 16.00 g/mol = 176.00 g/mol

Molar mass of C12H22O11 = 144.12 + 22.18 + 176.00 = 342.30 g/mol

Step 2: Calculate the mass percent of Carbon (C)
% C = (144.12 g/mol / 342.30 g/mol) x 100
% C = 42.11%

Step 3: Calculate the mass percent of Hydrogen (H)
% H = (22.18 g/mol / 342.30 g/mol) x 100
% H = 6.480%

Step 4: Calculate the mass percent of Oxygen (O)
% O = (176.00 g/mol / 342.30 g/mol) x 100
% O = 51.42%

Check: 42.11% + 6.480% + 51.42% = 100.01% (rounds to 100.0%)

Final Answer:
Molar Mass of sucrose (C12H22O11) = 342.30 g/mol
Percent Composition: C = 42.11%, H = 6.480%, O = 51.42%`,
  },
  {
    title: 'Q15 — Percent Composition of a Hydrate: CuSO4·5H2O',
    content: 'Copper(II) sulfate pentahydrate, CuSO4·5H2O, is a hydrate — it contains water molecules trapped within its crystal structure. Calculate the molar mass of CuSO4·5H2O, and find the percent by mass of water in the compound.',
    answer_key: `Step 1: Calculate the molar mass of the anhydrous part, CuSO4.
Cu = 63.55 g/mol, S = 32.06 g/mol, O = 16.00 g/mol (x4)
Molar mass of CuSO4 = 63.55 + 32.06 + 64.00 = 159.61 g/mol

Step 2: Calculate the mass of the water of hydration, 5H2O.
Molar mass of H2O = (2 x 1.008) + 16.00 = 18.02 g/mol
Mass of 5H2O = 5 x 18.02 g/mol = 90.08 g/mol

Step 3: Calculate the total molar mass of the hydrate.
Molar mass of CuSO4*5H2O = 159.61 g/mol + 90.08 g/mol = 249.69 g/mol

Step 4: Calculate the mass percent of water in the hydrate.
% H2O = (mass of water / total molar mass of hydrate) x 100
% H2O = (90.08 g/mol / 249.69 g/mol) x 100
% H2O = 36.08%

Step 5 (bonus check): Calculate the mass percent of Cu, S, and O (from sulfate) for completeness.
% Cu = (63.55 / 249.69) x 100 = 25.45%
% S = (32.06 / 249.69) x 100 = 12.84%
% O (sulfate) = (64.00 / 249.69) x 100 = 25.63%
Check: 25.45% + 12.84% + 25.63% + 36.08% = 100.00%

Final Answer:
Molar Mass of CuSO4*5H2O = 249.69 g/mol
Percent water in the hydrate = 36.08%`,
  },
]

const topic32Questions = [
  {
    title: 'Q5 — Mass Percent of a Salt Solution',
    content: '15 grams of salt are dissolved in 235 g of water. What is the mass percent of salt in the solution?',
    answer_key: `Formula:
Mass Percent = (mass of solute / mass of solution) x 100

Step 1: Calculate the total mass of the solution.
Mass of solute (salt) = 15 g
Mass of solvent (water) = 235 g
Mass of solution = 15 g + 235 g = 250 g

Step 2: Calculate the mass percent of salt.
Mass Percent = (15 g / 250 g) x 100
Mass Percent = 6.0%

Final Answer:
Mass percent of salt = 6.0%`,
  },
  {
    title: 'Q6 — Solving for Mass of Solute (KCl)',
    content: 'A solution is 12% KCl by mass. If the total mass of the solution is 85 g, how many grams of KCl does it contain?',
    answer_key: `Formula:
Mass Percent = (mass of solute / mass of solution) x 100

Step 1: Rearrange the mass percent formula to solve for mass of solute.
Mass of solute = (Mass Percent / 100) x mass of solution

Step 2: Substitute the given values.
Mass of KCl = (12% / 100) x 85 g
Mass of KCl = 0.12 x 85 g

Step 3: Calculate.
Mass of KCl = 10.2 g

Final Answer:
Mass of KCl = 10.2 g`,
  },
  {
    title: 'Q7 — Solving for Mass of Solution and Solvent',
    content: 'A solution contains 17 g of sugar and is 8.5% sugar by mass. Find the total mass of the solution, then find the mass of water (solvent) used.',
    answer_key: `Formula:
Mass Percent = (mass of solute / mass of solution) x 100

Step 1: Rearrange the mass percent formula to solve for mass of solution.
Mass of solution = mass of solute / (Mass Percent / 100)

Step 2: Substitute the given values.
Mass of solution = 17 g / (8.5% / 100)
Mass of solution = 17 g / 0.085
Mass of solution = 200 g

Step 3: Find the mass of the solvent (water).
Mass of solvent = mass of solution - mass of solute
Mass of solvent = 200 g - 17 g = 183 g

Final Answer:
Mass of solution = 200 g
Mass of water = 183 g`,
  },
  {
    title: 'Q8 — Solving for Mass of Solvent Needed',
    content: 'How many grams of water must be added to 4.0 g of sugar to make a 3.5% sugar solution?',
    answer_key: `Formula:
Mass Percent = (mass of solute / mass of solution) x 100

Step 1: Rearrange the mass percent formula to solve for the total mass of solution needed.
Mass of solution = mass of solute / (Mass Percent / 100)

Step 2: Substitute the given values.
Mass of solution = 4.0 g / (3.5% / 100)
Mass of solution = 4.0 g / 0.035
Mass of solution = 114.29 g

Step 3: Find the mass of water that must be added.
Mass of water = mass of solution - mass of solute
Mass of water = 114.29 g - 4.0 g = 110.29 g

Teacher Grading Note on Significant Figures:
4.0 g has two significant figures, so the final answer should be reported as 110 g (2 sig figs).

Final Answer:
Mass of water needed = 110 g (110.29 g before rounding)`,
  },
  {
    title: 'Q9 — Mass Percent Using Density (Ethanol-Water Solution)',
    content: 'A 250 g solution contains 45 mL of ethanol (density = 0.789 g/mL) dissolved in water. What is the mass percent of ethanol in the solution?',
    answer_key: `Step 1: Convert the volume of ethanol to mass using density.
Mass = volume x density
Mass of ethanol = 45 mL x 0.789 g/mL
Mass of ethanol = 35.505 g

Step 2: Apply the mass percent formula.
Mass Percent = (mass of solute / mass of solution) x 100
Mass Percent of ethanol = (35.505 g / 250 g) x 100
Mass Percent of ethanol = 14.20%

Teacher Grading Note:
Watch for students who forget to convert volume to mass before applying the mass percent formula — mass percent must always use mass (grams), never volume (mL) directly.

Final Answer:
Mass percent of ethanol = 14.2%`,
  },
  {
    title: 'Q10 — Solute Mass and Dilution of a Saline Solution',
    content: 'You have 500 g of a 20.% saline (NaCl) solution. (a) How many grams of NaCl does it contain? (b) How much water must be added to dilute the solution to 8.0% NaCl?',
    answer_key: `Part (a): Find the mass of NaCl in the original solution.
Mass of NaCl = (Mass Percent / 100) x mass of solution
Mass of NaCl = (20./100) x 500 g
Mass of NaCl = 100 g

Part (b): Find the new total solution mass needed for 8.0% concentration.
Note: Diluting a solution adds water only — the mass of NaCl (the solute) does not change.
Mass Percent = (mass of solute / mass of new solution) x 100
mass of new solution = mass of solute / (Mass Percent / 100)
mass of new solution = 100 g / (8.0% / 100)
mass of new solution = 100 g / 0.080
mass of new solution = 1250 g

Step: Find the mass of water that must be added.
Mass of water added = mass of new solution - mass of original solution
Mass of water added = 1250 g - 500 g = 750 g

Final Answer:
(a) Mass of NaCl = 100 g
(b) Mass of water to add = 750 g`,
  },
  {
    title: 'Q11 — Mass Percent and Solvent Mass (KBr Solution)',
    content: 'A solution is made by dissolving 25 g of KBr in enough water to make 220 g of solution. What is the mass percent of KBr, and how many grams of water were used?',
    answer_key: `Step 1: Find the mass of water (solvent) used.
Mass of water = mass of solution - mass of solute
Mass of water = 220 g - 25 g = 195 g

Step 2: Calculate the mass percent of KBr.
Mass Percent = (mass of solute / mass of solution) x 100
Mass Percent of KBr = (25 g / 220 g) x 100
Mass Percent of KBr = 11.36%

Final Answer:
Mass percent of KBr = 11.36%
Mass of water used = 195 g`,
  },
  {
    title: 'Q12 — Mass Percent of Both Solute and Solvent',
    content: 'A 60. g solution contains 9.0 g of dissolved sugar, with the rest being water. Find the mass percent of sugar and the mass percent of water in the solution.',
    answer_key: `Step 1: Calculate the mass percent of sugar (the solute).
Mass Percent = (mass of solute / mass of solution) x 100
Mass Percent of sugar = (9.0 g / 60. g) x 100
Mass Percent of sugar = 15.0%

Step 2: Calculate the mass of water (the solvent).
Mass of water = mass of solution - mass of solute
Mass of water = 60. g - 9.0 g = 51. g

Step 3: Calculate the mass percent of water.
Mass Percent of water = (51. g / 60. g) x 100
Mass Percent of water = 85.0%

Check: The two percentages must sum to 100%.
15.0% + 85.0% = 100.0%

Final Answer:
Mass percent of sugar = 15.0%
Mass percent of water = 85.0%`,
  },
  {
    title: 'Q13 — Mass Percent Applied to a Larger Sample (Brine Solution)',
    content: 'A brine solution is 3.5% NaCl by mass. How many grams of NaCl are in 2.00 kg of this solution? How many grams of water does it contain?',
    answer_key: `Step 1: Convert the mass of solution to grams.
2.00 kg = 2000 g

Step 2: Calculate the mass of NaCl using the mass percent formula.
Mass of NaCl = (Mass Percent / 100) x mass of solution
Mass of NaCl = (3.5% / 100) x 2000 g
Mass of NaCl = 70. g

Step 3: Calculate the mass of water by subtraction.
Mass of water = mass of solution - mass of NaCl
Mass of water = 2000 g - 70. g = 1930 g

Final Answer:
Mass of NaCl = 70. g
Mass of water = 1930 g`,
  },
  {
    title: 'Q14 — Mass Percent Applied to Evaporation (Seawater)',
    content: 'Seawater is approximately 3.5% salt by mass. If 1.20 kg of seawater is completely evaporated, how many grams of salt remain?',
    answer_key: `Step 1: Convert the mass of seawater to grams.
1.20 kg = 1200 g

Step 2: Apply the mass percent formula to find the mass of salt.
Mass of salt = (Mass Percent / 100) x mass of solution
Mass of salt = (3.5% / 100) x 1200 g
Mass of salt = 42 g

Reasoning Note: When a solution is completely evaporated, only the solvent (water) leaves as vapor. The dissolved solute (salt) is left behind, so the mass of salt after evaporation equals the mass of salt originally dissolved in the solution.

Final Answer:
Mass of salt remaining after evaporation = 42 g`,
  },
  {
    title: 'Q15 — Combining Two Solutions of Different Concentrations',
    content: 'Solution A is 400 g of a 10.% NaCl solution. Solution B is 600 g of a 5.0% NaCl solution. If the two solutions are combined, what is the mass percent of NaCl in the resulting solution?',
    answer_key: `Step 1: Calculate the mass of NaCl in Solution A.
Mass of NaCl in A = (10./100) x 400 g = 40. g

Step 2: Calculate the mass of NaCl in Solution B.
Mass of NaCl in B = (5.0/100) x 600 g = 30. g

Step 3: Calculate the total mass of NaCl after combining.
Total mass of NaCl = 40. g + 30. g = 70. g

Step 4: Calculate the total mass of the combined solution.
Total mass of solution = 400 g + 600 g = 1000 g

Step 5: Calculate the mass percent of NaCl in the combined solution.
Mass Percent = (total mass of NaCl / total mass of solution) x 100
Mass Percent = (70. g / 1000 g) x 100
Mass Percent = 7.0%

Teacher Note: This is conceptually the same weighted-average idea used for average atomic mass — each solution's NaCl mass contributes proportionally to its own mass, not evenly.

Final Answer:
Mass percent of NaCl in the combined solution = 7.0%`,
  },
]

async function main() {
  const { data: existing31 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_31).order('order_index', { ascending: false }).limit(1)
  const { data: existing32 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_32).order('order_index', { ascending: false }).limit(1)
  let idx31 = (existing31[0]?.order_index ?? -1) + 1
  let idx32 = (existing32[0]?.order_index ?? -1) + 1

  const rows = []
  for (const q of topic31Questions) {
    rows.push({ ...q, topic_id: TOPIC_31, order_index: idx31++ })
  }
  for (const q of topic32Questions) {
    rows.push({ ...q, topic_id: TOPIC_32, order_index: idx32++ })
  }

  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }
  console.log(`Inserted ${data.length} questions.`)
}

main()
