const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

const TOPICS = {
  '3.4': '3caa461f-7678-4754-8c14-25657a8eea30',
  '3.5': 'a4157f22-b9cd-4ac6-b886-040a8e505372',
  '3.6': 'e354fd0b-663d-473a-834b-14038b93dd6d',
  '3.7': 'ba1b5331-20ad-41f6-977e-9b44d41c8874',
};

/* ============================= 3.4 Ideal Gas Law ============================= */
const topic34New = [
  {
    title: 'Q24 — Moles of Air and Partial Pressure of Oxygen in a Basketball',
    content: `A basketball is left outside in winter, where the temperature is -2.00°C. The basketball has a volume of 6.88 L, and the (gauge-adjusted) pressure of the air inside it is 0.795 atm. Assume the air inside is a typical mixture that is approximately 21.0% O2 by mole fraction.

(a) Calculate the total number of moles of gas inside the basketball.
(b) Calculate the partial pressure of O2 inside the basketball.`,
    answer: `(a) T = -2.00°C + 273.15 = 271.15 K

n = PV / RT = (0.795 atm)(6.88 L) / [(0.08206 L atm mol^-1 K^-1)(271.15 K)] = 5.470 / 22.253 = 0.246 mol

(b) Partial pressure of O2 = (mole fraction O2)(total pressure) = (0.210)(0.795 atm) = 0.167 atm`,
  },
  {
    title: 'Q25 — Molar Mass of a Gas from Mass, Volume, Temperature, and Pressure',
    content: `A 0.500 L container holds 1.28 g of an unknown ideal gas at 127°C and 2.00 atm.

Calculate the molar mass of the gas, and identify a plausible gas that matches this molar mass.`,
    answer: `T = 127°C + 273.15 = 400.15 K

n = PV / RT = (2.00 atm)(0.500 L) / [(0.08206 L atm mol^-1 K^-1)(400.15 K)] = 1.00 / 32.84 = 0.03045 mol

Molar mass = mass / n = 1.28 g / 0.03045 mol = 42.0 g/mol

A molar mass of about 42.0 g/mol is consistent with propene, C3H6 (molar mass 42.08 g/mol), or with propane's isomer set more generally — any reasonable answer near 42 g/mol supported by a plausible molecular formula should be accepted.`,
  },
  {
    title: 'Q26 — Mass of KClO3 Decomposed to Produce a Given Volume of O2',
    content: `Potassium chlorate decomposes according to: 2 KClO3(s) → 2 KCl(s) + 3 O2(g)

If 5.30 L of O2(g) is produced at 117.0°C and 0.995 atm, what mass of KClO3 must have decomposed?`,
    answer: `T = 117.0°C + 273.15 = 390.15 K

n(O2) = PV / RT = (0.995 atm)(5.30 L) / [(0.08206 L atm mol^-1 K^-1)(390.15 K)] = 5.274 / 32.02 = 0.1647 mol O2

n(KClO3) = 0.1647 mol O2 x [[frac:2 mol KClO3|3 mol O2]] = 0.1098 mol KClO3

Molar mass of KClO3 = 39.10 + 35.45 + 3(16.00) = 122.55 g/mol

mass = 0.1098 mol x 122.55 g/mol = 13.5 g KClO3`,
  },
  {
    title: 'Q27 — Density of NO2 Gas at a Given Temperature and Pressure',
    content: `What is the density (in g/L) of NO2 gas at 25.0°C and 2.56 atm?`,
    answer: `Using d = PM / RT, where M is molar mass:

Molar mass of NO2 = 14.01 + 2(16.00) = 46.01 g/mol
T = 25.0°C + 273.15 = 298.15 K

d = (2.56 atm)(46.01 g/mol) / [(0.08206 L atm mol^-1 K^-1)(298.15 K)] = 117.8 / 24.47 = 4.81 g/L`,
  },
  {
    title: 'Q28 — Factor Change in Pressure When Volume Decreases and Temperature Doubles',
    content: `By what factor will the pressure of a fixed amount of gas change if its volume is reduced to 2/3 of its original value while its Kelvin temperature is simultaneously doubled?`,
    answer: `Using the combined gas law: P1V1/T1 = P2V2/T2, so P2 = P1 x (V1/V2) x (T2/T1)

V1/V2 = V1 / (2/3 V1) = 3/2

T2/T1 = 2

P2 = P1 x (3/2) x 2 = 3 P1

The pressure increases by a factor of 3 (triples).`,
  },
  {
    title: 'Q29 — Partial Pressures of a High-Altitude Air Sample (Multiple Choice)',
    mcq: true,
    content: `At an altitude of 30,000 feet, the air temperature is -35.0°C. Air at this altitude can be approximated as a mixture that is 78.0% N2, 21.0% O2, and 1.0% Ar by mole fraction. A sample containing 0.594 mol of this air mixture is captured in a rigid 45.0 L container.

What is the partial pressure of N2 in the container?
(A) 0.181 atm
(B) 0.201 atm
(C) 0.232 atm
(D) 0.258 atm`,
    answer: `Correct answer: (B) 0.201 atm

T = -35.0°C + 273.15 = 238.15 K

Total pressure: P = nRT/V = (0.594 mol)(0.08206 L atm mol^-1 K^-1)(238.15 K) / 45.0 L = 11.61 / 45.0 = 0.258 atm

Partial pressure of N2 = (mole fraction N2)(total pressure) = (0.780)(0.258 atm) = 0.201 atm

(A) and (C) do not correspond to 78.0% of the correctly calculated total pressure.
(D) is the total pressure of the mixture, not the partial pressure of N2 alone.`,
  },
];

/* ============================= 3.5 Kinetic Molecular Theory ============================= */
const topic35New = [
  {
    title: 'Q21 — Ranking Average Particle Speed of H2, HCl, and Cl2',
    content: `A sample contains H2, HCl, and Cl2 gas, all at the same temperature.

Rank the three gases from fastest to slowest average particle speed, and justify your ranking.`,
    answer: `Fastest to slowest: H2 > HCl > Cl2

At the same temperature, all three gases have the same average kinetic energy, since average kinetic energy depends only on temperature (KE_avg = (3/2)RT per mole), not on the identity of the gas. Since KE = (1/2)mv^2, a gas made of lighter particles must have a higher average speed to have the same kinetic energy as a gas made of heavier particles. H2 (molar mass 2.02 g/mol) is by far the lightest of the three, so it has the highest average speed. Cl2 (molar mass 70.90 g/mol) is the heaviest, so it has the lowest average speed. HCl (molar mass 36.46 g/mol) falls in between, giving it an intermediate average speed.`,
  },
  {
    title: 'Q22 — Effusion Ranking of Equimolar H2, N2, and F2 Through a Pinhole',
    content: `Equal numbers of moles of H2, N2, and F2 are placed into a container that has a small pinhole opening. After some time has passed, gas has effused out of the container through the pinhole.

Rank the three gases in order of increasing amount remaining in the container, and justify your ranking using Graham's law.`,
    answer: `Increasing amount remaining in the container: H2 < N2 < F2

Graham's law states that the rate of effusion of a gas is inversely proportional to the square root of its molar mass: Rate ∝ 1/√(molar mass). H2 (molar mass 2.02 g/mol) is the lightest gas, so it effuses fastest and therefore has the least amount remaining in the container after a given time. F2 (molar mass 38.00 g/mol) is the heaviest of the three, so it effuses the slowest and has the most gas remaining. N2 (molar mass 28.02 g/mol) has an intermediate molar mass, so it effuses at an intermediate rate and has an intermediate amount remaining.`,
  },
  {
    title: 'Q23 — Comparing Average Particle Speed Across Four Vessels of H2 and Ne',
    content: `A 1.0 L vessel contains 1 mole of H2 gas at 200. K. Consider the following three additional vessels:

Vessel A: 1.0 L containing 1 mole of Ne at 200. K
Vessel B: 1.0 L containing 1 mole of H2 at 100. K
Vessel C: 1.0 L containing 2 moles of H2 at 400. K

For each vessel (A, B, and C), state whether the average particle speed of the gas is greater than, less than, or equal to the average particle speed of H2 in the original 1.0 L, 1 mole, 200. K vessel, and justify each answer.`,
    answer: `Vessel A (1 mol Ne at 200. K): Lower average speed than the original H2 vessel. At the same temperature, all gases have the same average kinetic energy, but Ne (molar mass 20.18 g/mol) is far more massive than H2 (molar mass 2.02 g/mol). Since KE = (1/2)mv^2, the much heavier Ne particles must move much more slowly than H2 particles to have the same average kinetic energy.

Vessel B (1 mol H2 at 100. K): Lower average speed than the original H2 vessel. Average kinetic energy (and therefore average speed) increases with temperature; since Vessel B's H2 is at a lower temperature (100. K vs. 200. K) than the original vessel, its average particle speed is lower. The amount of gas (moles) does not affect the average speed of individual particles.

Vessel C (2 mol H2 at 400. K): Higher average speed than the original H2 vessel. Both vessels contain H2, so the average speed depends only on temperature. Since Vessel C's temperature (400. K) is higher than the original vessel's (200. K), the H2 particles in Vessel C have a higher average kinetic energy and therefore a higher average speed. The doubled number of moles does not affect the average speed of individual particles, only the total pressure/amount of gas.`,
  },
];

/* ============================= 3.6 Deviation from Ideal Gas Law ============================= */
const topic36New = [
  {
    title: 'Q19 — NO2 vs. CO2 Deviation from Ideal Behavior',
    content: `NO2 and CO2 have similar molar masses (46.01 g/mol and 44.01 g/mol, respectively) but different molecular geometries and polarities: NO2 is bent and polar, while CO2 is linear and nonpolar.

Which gas would be predicted to deviate more from ideal gas behavior at the same temperature and pressure? Justify your answer.`,
    answer: `NO2 would be predicted to deviate more from ideal gas behavior than CO2.

The ideal gas law assumes gas particles exert no intermolecular forces on one another. NO2 is a bent, polar molecule, so in addition to London dispersion forces, NO2 molecules experience dipole-dipole attractions with one another. CO2 is linear and nonpolar (its two polar C=O bond dipoles point in opposite directions and cancel), so CO2 molecules experience only London dispersion forces, which are comparable in strength to NO2's dispersion forces given their similar molar mass and size. Because NO2 has the additional dipole-dipole attractions that CO2 lacks, real NO2 gas particles attract each other more strongly than real CO2 gas particles do, causing NO2 to show a larger deviation from the ideal gas law's assumption of non-interacting particles (for example, a lower observed pressure than the ideal gas law would predict, especially at lower temperatures or higher pressures).`,
  },
  {
    title: 'Q20 — Explaining Smaller- and Larger-Than-Predicted Volume for Radon Gas',
    content: `At 10. atm and 100. K, a sample of radon (Rn) gas is found to deviate from the volume predicted by the ideal gas law.

(a) If Rn's actual volume is smaller than the ideal gas law predicts, propose an explanation for this observation.
(b) If Rn's actual volume is larger than the ideal gas law predicts, propose a different explanation for this observation.`,
    answer: `(a) If the actual volume is smaller than predicted, this suggests that intermolecular (London dispersion) attractions between Rn atoms are significant under these conditions (high pressure, low temperature bring the atoms close together). These attractive forces pull the Rn atoms closer to each other than the ideal gas law assumes (which assumes no attraction at all), resulting in the gas occupying less volume than predicted.

(b) If the actual volume is larger than predicted, this suggests that the finite volume occupied by the Rn atoms themselves has become significant relative to the total container volume (Rn atoms are quite large, with many electrons). The ideal gas law assumes point particles with zero volume, so when the real, nonzero volume of the atoms is taken into account, the space actually available for the gas to expand into effectively decreases, meaning the volume predicted using only the "empty space" the ideal gas law imagines undercounts the true volume needed to contain both the atoms and the space between them.`,
  },
];

/* ============================= 3.7 Solutions and Mixtures ============================= */
const topic37New = [
  {
    title: 'Q20 — Volume of LiCl Solution from a Given Mass and Molarity',
    content: `How many liters of 1.25 M LiCl(aq) solution can be prepared using 13.3 g of solid LiCl?`,
    answer: `Molar mass of LiCl = 6.94 + 35.45 = 42.39 g/mol

moles LiCl = 13.3 g / 42.39 g/mol = 0.3138 mol

Volume = moles / molarity = 0.3138 mol / 1.25 mol/L = 0.251 L`,
  },
  {
    title: 'Q21 — Chloride Ion Concentration from Dissolved ZnCl2',
    content: `What is the concentration of chloride ion, [Cl-], in a solution made by dissolving 10.0 g of zinc chloride, ZnCl2, in enough water to make 500. mL of solution?`,
    answer: `ZnCl2(s) → Zn2+(aq) + 2 Cl-(aq), so there are 2 moles of Cl- for every mole of ZnCl2 dissolved.

Molar mass of ZnCl2 = 65.38 + 2(35.45) = 136.28 g/mol

moles ZnCl2 = 10.0 g / 136.28 g/mol = 0.07338 mol

moles Cl- = 0.07338 mol ZnCl2 x [[frac:2 mol Cl-|1 mol ZnCl2]] = 0.1468 mol Cl-

[Cl-] = 0.1468 mol / 0.500 L = 0.294 M`,
  },
  {
    title: 'Q22 — Mass of KOH Needed to Prepare a Dilute Solution',
    content: `What mass of potassium hydroxide, KOH, must be dissolved in water to prepare 250. mL of a 0.10 M KOH solution?`,
    answer: `moles KOH = (0.250 L)(0.10 mol/L) = 0.0250 mol

Molar mass of KOH = 39.10 + 16.00 + 1.01 = 56.11 g/mol

mass = 0.0250 mol x 56.11 g/mol = 1.4 g KOH`,
  },
  {
    title: 'Q23 — Nitrate Ion Concentration from Dissolved Mg(NO3)2',
    content: `What is the nitrate ion concentration, [NO3-], in 100. mL of a solution prepared by dissolving 2.5 g of magnesium nitrate, Mg(NO3)2, in water?`,
    answer: `Mg(NO3)2(s) → Mg2+(aq) + 2 NO3-(aq), so there are 2 moles of NO3- for every mole of Mg(NO3)2 dissolved.

Molar mass of Mg(NO3)2 = 24.31 + 2(14.01 + 3(16.00)) = 24.31 + 2(62.01) = 148.33 g/mol

moles Mg(NO3)2 = 2.5 g / 148.33 g/mol = 0.01685 mol

moles NO3- = 0.01685 mol x [[frac:2 mol NO3-|1 mol Mg(NO3)2]] = 0.03370 mol

[NO3-] = 0.03370 mol / 0.100 L = 0.337 M`,
  },
  {
    title: 'Q24 — Molarity of a Sodium Acetate Solution',
    content: `What is the molar concentration of a solution made by dissolving 2.9 g of sodium acetate, NaC2H3O2, in enough water to make a total volume of 25 mL?`,
    answer: `Molar mass of NaC2H3O2 = 22.99 + 2(12.01) + 3(1.01) + 2(16.00) = 22.99 + 24.02 + 3.03 + 32.00 = 82.04 g/mol

moles NaC2H3O2 = 2.9 g / 82.04 g/mol = 0.0354 mol

Molarity = 0.0354 mol / 0.025 L = 1.4 M`,
  },
  {
    title: 'Q25 — Acetate Ion Concentration from Dissolved Calcium Acetate',
    content: `What is the acetate ion concentration, [C2H3O2-], in 100. mL of a solution prepared by dissolving 25.0 g of calcium acetate, Ca(C2H3O2)2?`,
    answer: `Ca(C2H3O2)2(s) → Ca2+(aq) + 2 C2H3O2-(aq), so there are 2 moles of acetate ion for every mole of Ca(C2H3O2)2 dissolved.

Molar mass of Ca(C2H3O2)2 = 40.08 + 2(12.01 + 3(1.01) + 2(16.00)) = 40.08 + 2(59.05) = 158.18 g/mol

moles Ca(C2H3O2)2 = 25.0 g / 158.18 g/mol = 0.1580 mol

moles C2H3O2- = 0.1580 mol x [[frac:2 mol C2H3O2-|1 mol Ca(C2H3O2)2]] = 0.3160 mol

[C2H3O2-] = 0.3160 mol / 0.100 L = 3.16 M`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing, error: fetchErr } = await sb
    .from('questions')
    .select('order_index')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: false })
    .limit(1);
  if (fetchErr) throw fetchErr;
  let nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

  const rows = questions.map((q) => ({
    topic_id: topicId,
    title: q.title,
    content: q.mcq ? q.content + JUSTIFY : q.content,
    answer_key: q.answer,
    order_index: nextOrder++,
    ...(q.imageUrl ? { image_url: q.imageUrl } : {}),
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    await insertTopic('3.4', topic34New);
    await insertTopic('3.5', topic35New);
    await insertTopic('3.6', topic36New);
    await insertTopic('3.7', topic37New);
    console.log('Done batch 2.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
