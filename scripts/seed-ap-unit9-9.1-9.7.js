const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '9.1': 'd5cf1364-e871-44d5-81ac-bae2aea2c5b3',
  '9.2': '0b665475-c52e-40c9-aff3-709e07936a6a',
  '9.3': 'd6c38ef0-e004-47d2-beda-2da22f798927',
  '9.4': 'a8ba0aa1-a7c0-4cfe-8943-42b1a8c41c7e',
  '9.5': '1ac86406-d22d-4c4d-b801-577d177fb246',
  '9.6': '1dec5262-ca62-4038-bdfb-2e10a1747930',
  '9.7': '278fedc7-d2c0-415e-a8ff-0a718d684f61',
};

/* ============================= 9.1 — Introduction to Entropy ============================= */
const t91 = [
  {
    title: 'Q1 — Predicting the Sign of ΔS for Twelve Changes',
    content: `For each of the following, indicate the sign (+ or -) of ΔS associated with the change.

(a) H2O(s) → H2O(l)
(b) CH3OH(l) → CH3OH(g)
(c) CO2(s) → CO2(g)
(d) NH4NO3(s) → NH4+(aq) + NO3-(aq)
(e) 2 KClO3(s) → 2 KCl(s) + 3 O2(g)
(f) PCl5(g) → PCl3(g) + Cl2(g)
(g) C6H6(l) → C6H6(s)
(h) Br2(g) → Br2(l)
(i) I2(g) → I2(s)
(j) Ag+(aq) + Cl-(aq) → AgCl(s)
(k) 4 Fe(s) + 3 O2(g) → 2 Fe2O3(s)
(l) N2(g) + 3 H2(g) → 2 NH3(g)`,
    answer: `(a) + (melting: solid → liquid, particles become more dispersed/free to move)
(b) + (vaporizing: liquid → gas, particles become far more dispersed)
(c) + (subliming: solid → gas directly, a large increase in dispersal)
(d) + (a solid ionic lattice dissolves into freely-moving dissolved ions, increasing dispersal)
(e) + (0 mol of gas among reactants → 3 mol of gas among products, a large increase in the number of gas particles)
(f) + (1 mol of gas → 2 mol of gas, an increase in the number of gas particles)
(g) - (freezing: liquid → solid, particles become more ordered/less dispersed)
(h) - (condensing: gas → liquid, particles become less dispersed)
(i) - (depositing: gas → solid directly, a large decrease in dispersal)
(j) - (two freely-dissolved ions combine into an ordered solid precipitate, decreasing dispersal)
(k) - (3 mol of gas among reactants → 0 mol of gas among products, a decrease in the number of gas particles)
(l) - (4 mol of gas among reactants → 2 mol of gas among products, a decrease in the number of gas particles)`,
  },
  {
    title: 'Q2 — Comparing Entropy Change from Particle Diagrams (Before/After)',
    content: `Particulate representations for two different processes are shown.

Process #1: Before — a tightly packed, ordered cluster of identical particles (like a solid). After — the same particles scattered randomly and separated throughout a much larger container (like a gas).

Process #2: Before — two separate 2-particle clusters (each a black particle bonded to a white particle) scattered independently throughout the container. After — the same particles now combined into two larger 4-particle clusters (2 black + 2 white particles each), each cluster more tightly grouped together.

Indicate whether the entropy of the system increases or decreases for each process. Justify your answers in terms of the arrangement of the particles.`,
    answer: `Process #1: Entropy increases. The particles go from a highly ordered, tightly packed arrangement (few possible arrangements, matter concentrated in a small volume) to a disordered, widely dispersed arrangement (many more possible arrangements, matter spread throughout a much larger volume) — an increase in the dispersal of matter always corresponds to an increase in entropy.

Process #2: Entropy decreases. The particles go from being separated into several smaller, independent 2-particle units (more independent particles, more possible arrangements) to being combined into fewer, larger 4-particle units (fewer independent particles overall, since two smaller units have combined into one larger unit) — combining smaller independent particles into fewer, larger particles reduces the number of independent particles and possible arrangements, decreasing the entropy of the system (analogous to a chemical reaction where the total number of moles of gas particles decreases).`,
  },
  {
    title: 'Q3 — Reading a Maxwell-Boltzmann Distribution to Compare Temperature and Entropy',
    content: `A diagram shows two different Maxwell-Boltzmann distributions of kinetic energies (fraction of molecules vs. kinetic energy) for identical samples of He(g) at two different temperatures. One curve (solid line) is tall and narrow, peaking at a lower kinetic energy. The other curve (dashed line) is shorter and broader, peaking at a higher kinetic energy and extending further to the right.

(a) The curve represented by the dashed line represents the sample that is at a (lower / higher) temperature.
(b) When the temperature of a sample of gas is increased, this results in a (narrower / broader) distribution of kinetic energies.
(c) A broader distribution of kinetic energies is associated with a greater dispersal of energy. Therefore when the temperature of a gas sample is increased, the entropy of the gas sample (decreases / increases).`,
    answer: `(a) Higher. The dashed curve is shifted to the right (toward higher kinetic energies) and is broader/flatter, both of which are characteristic of a higher-temperature sample (particles have greater average kinetic energy and a wider range of speeds).

(b) Broader. As temperature increases, the particles' kinetic energies become distributed across a wider range of values (some particles moving much faster, some still relatively slow), broadening the distribution curve.

(c) Increases. A broader distribution of kinetic energies means the energy is spread out (dispersed) over a wider range of possible values among the particles — since entropy increases with a greater dispersal of energy, increasing the temperature of a gas sample increases its entropy.`,
  },
];

/* ============================= 9.2 — Absolute Entropy and Entropy Change ============================= */
const t92 = [
  {
    title: 'Q4 — Calculating ΔS°rxn for Calcium Carbonate Decomposition',
    content: `Substance | S° (J/(K·mol))
CaCO3(s) | 92.9
CaO(s) | 38.1
CO2(g) | 213.8

(a) Use the data in the table to calculate the value of the standard entropy change, ΔS°rxn, in units of J/(K·molrxn), for the reaction represented by the following equation.

CaCO3(s) → CaO(s) + CO2(g)

(b) How does the entropy of the system change as this reaction occurs?`,
    answer: `(a) ΔS°rxn = ΣS°(products) - ΣS°(reactants) = [S°(CaO) + S°(CO2)] - S°(CaCO3) = (38.1 + 213.8) - 92.9 = 251.9 - 92.9 = +159.0 J/(K·molrxn).

(b) The entropy of the system increases (ΔS°rxn is positive). This makes sense because a solid reactant (CaCO3) decomposes into a solid product (CaO) plus a gaseous product (CO2) — the formation of a gas from a solid represents a large increase in the dispersal of matter, increasing the system's entropy.`,
  },
  {
    title: 'Q5 — Calculating ΔS°rxn for the Oxidation of NO',
    content: `Substance | S° (J/(K·mol))
NO(g) | 210.7
O2(g) | 205.0
NO2(g) | 240.0

(a) Use the data in the table to calculate the value of the standard entropy change, ΔS°rxn, in units of J/(K·molrxn), for the reaction represented by the following equation.

2 NO(g) + O2(g) → 2 NO2(g)

(b) How does the entropy of the system change as this reaction occurs?`,
    answer: `(a) ΔS°rxn = ΣS°(products) - ΣS°(reactants) = [2(240.0)] - [2(210.7) + 205.0] = 480.0 - (421.4 + 205.0) = 480.0 - 626.4 = -146.4 J/(K·molrxn).

(b) The entropy of the system decreases (ΔS°rxn is negative). This makes sense because the reaction converts 3 total moles of gas (2 NO + 1 O2) into only 2 moles of gas product (2 NO2) — a decrease in the total number of gas particles decreases the dispersal of matter, decreasing the system's entropy.`,
  },
];

/* ============================= 9.3 — Gibbs Free Energy and Thermodynamic Favorability ============================= */
const t93 = [
  {
    title: 'Q6 — Calculating ΔG°rxn for Calcium Carbonate Decomposition from Free Energies of Formation',
    content: `Substance | ΔGf° (kJ/mol)
CaCO3(s) | -1128.8
CaO(s) | -603.3
CO2(g) | -394.4

(a) Use the data in the table to calculate the value of the standard free energy change, ΔG°rxn, in units of kJ/molrxn, for the reaction represented by the following equation.

CaCO3(s) → CaO(s) + CO2(g)

(b) Is this reaction thermodynamically favored under standard conditions?`,
    answer: `(a) ΔG°rxn = ΣΔGf°(products) - ΣΔGf°(reactants) = [ΔGf°(CaO) + ΔGf°(CO2)] - ΔGf°(CaCO3) = [-603.3 + (-394.4)] - (-1128.8) = -997.7 + 1128.8 = +131.1 kJ/molrxn.

(b) No, this reaction is NOT thermodynamically favored under standard conditions, since ΔG°rxn is positive (+131.1 kJ/molrxn).`,
  },
  {
    title: 'Q7 — Calculating ΔG°rxn for the Oxidation of NO from Free Energies of Formation',
    content: `Substance | ΔGf° (kJ/mol)
NO(g) | 86.6
O2(g) | 0
NO2(g) | 51.3

(a) Use the data in the table to calculate the value of the standard free energy change, ΔG°rxn, in units of kJ/molrxn, for the reaction represented by the following equation.

2 NO(g) + O2(g) → 2 NO2(g)

(b) Is this reaction thermodynamically favored under standard conditions?`,
    answer: `(a) ΔG°rxn = ΣΔGf°(products) - ΣΔGf°(reactants) = [2(51.3)] - [2(86.6) + 0] = 102.6 - 173.2 = -70.6 kJ/molrxn.

(b) Yes, this reaction IS thermodynamically favored under standard conditions, since ΔG°rxn is negative (-70.6 kJ/molrxn).`,
  },
  {
    title: 'Q8 — Identifying Why a Reaction Is Not Thermodynamically Favored (CaCO3 Decomposition)',
    content: `CaCO3(s) → CaO(s) + CO2(g)     ΔG°rxn = +131.1 kJ/molrxn, ΔH°rxn = +178.5 kJ/molrxn, ΔS°rxn = +159.0 J/(K·molrxn)

Which of the following statements best explains why this reaction is NOT thermodynamically favored under standard conditions?

(A) The change in enthalpy is positive, which does not support the favorability of the reaction.
(B) The change in entropy is positive, which does not support the favorability of the reaction.`,
    answer: `Correct answer: (A).

The change in enthalpy (ΔH° = +178.5 kJ/molrxn) is positive (endothermic), which does NOT support thermodynamic favorability — this is why the reaction is not favored overall.

Statement (B) is factually incorrect: the change in entropy (ΔS° = +159.0 J/(K·molrxn)) is positive, which actually DOES support favorability (a positive ΔS favors a negative ΔG, via ΔG° = ΔH° - TΔS°). In this case, the unfavorable positive enthalpy is large enough (and not sufficiently offset by TΔS° at 298 K) that the overall ΔG° ends up positive despite entropy favoring the reaction.`,
  },
  {
    title: 'Q9 — Identifying Why a Reaction Is Thermodynamically Favored (Oxidation of NO)',
    content: `2 NO(g) + O2(g) → 2 NO2(g)     ΔG°rxn = -70.6 kJ/molrxn, ΔH°rxn = -114.2 kJ/molrxn, ΔS°rxn = -146.4 J/(K·molrxn)

Which of the following statements best explains why this reaction IS thermodynamically favored under standard conditions?

(A) The change in enthalpy is negative, which supports the favorability of the reaction.
(B) The change in entropy is negative, which supports the favorability of the reaction.`,
    answer: `Correct answer: (A).

The change in enthalpy (ΔH° = -114.2 kJ/molrxn) is negative (exothermic), which supports thermodynamic favorability — this is the driving force that makes the reaction favored overall.

Statement (B) is factually incorrect: the change in entropy (ΔS° = -146.4 J/(K·molrxn)) is negative, which actually does NOT support favorability (a negative ΔS favors a positive/less-negative ΔG, via ΔG° = ΔH° - TΔS°, since -T x (negative) = positive contribution to ΔG°). In this case, the favorable negative enthalpy is large enough to overcome the unfavorable negative entropy at 298 K, resulting in an overall negative ΔG°.`,
  },
  {
    title: 'Q10 — Identifying the Driving Force for Dissolving NH4NO3',
    content: `NH4NO3(s) → NH4+(aq) + NO3-(aq)

The process represented by the equation above is thermodynamically favored to occur at 298 K. When a small amount of NH4NO3(s) is added to a sample of water and the mixture is stirred, all of the solid dissolves. The temperature of the solution decreases.

(a) The sign of ΔH° for this process is (negative / positive).
(b) The sign of ΔS° for this process is (negative / positive).
(c) What is the driving force for this process? (enthalpy only / entropy only / both enthalpy and entropy)`,
    answer: `(a) Positive. Since the temperature of the solution DECREASES as the solid dissolves, the system is absorbing heat from the surroundings (the solution) — this is an endothermic process, meaning ΔH° is positive.

(b) Positive. A solid ionic lattice breaking apart into freely dissolved, dispersed aqueous ions represents an increase in the dispersal of matter — this increases entropy, so ΔS° is positive.

(c) Entropy only. Since ΔH° is positive (unfavorable — it works against the process being thermodynamically favored) but the overall process IS still favored (ΔG° < 0, as given), the favorable factor must be the entropy change (ΔS° is positive, which favors a negative ΔG° via the -TΔS° term). The entropy increase is large enough to overcome the unfavorable enthalpy increase, making entropy the driving force for this process.`,
  },
  {
    title: 'Q11 — Identifying the Driving Force for the Combustion of Hydrogen Gas',
    content: `2 H2(g) + O2(g) → 2 H2O(g)

The process represented by the equation above is thermodynamically favored to occur at 298 K. A mixture of hydrogen gas and oxygen gas is sparked to initiate a chemical reaction. Water vapor is produced, and heat and light are released.

(a) The sign of ΔH° for this reaction is (negative / positive).
(b) The sign of ΔS° for this reaction is (negative / positive).
(c) What is the driving force for this process? (enthalpy only / entropy only / both enthalpy and entropy)`,
    answer: `(a) Negative. Since heat and light are released during the reaction, the system is releasing energy to the surroundings — this is an exothermic process, meaning ΔH° is negative.

(b) Negative. The reaction converts 3 total moles of gas (2 mol H2 + 1 mol O2) into only 2 moles of gas product (2 mol H2O) — a decrease in the total number of gas particles decreases the dispersal of matter, decreasing entropy, so ΔS° is negative.

(c) Enthalpy only. Since ΔS° is negative (unfavorable — it works against the process being thermodynamically favored, via the -TΔS° term becoming positive), but the overall process IS still favored (ΔG° < 0, as given), the favorable factor must be the enthalpy change (ΔH° is negative, which directly favors a negative ΔG°). The exothermic enthalpy release is large enough to overcome the unfavorable entropy decrease, making enthalpy the driving force for this process (consistent with this reaction being favored specifically at low-to-moderate temperatures, since a large negative ΔH combined with a negative ΔS favors a negative ΔG only when T is not too large).`,
  },
  {
    title: 'Q12 — Full Thermodynamic Analysis of Glucose Formation (Photosynthesis)',
    content: `6 CO2(g) + 6 H2O(g) → C6H12O6(s) + 6 O2(g)

Substance | ΔHf° (kJ/mol) | S° (J/(K·mol))
CO2(g) | -393.5 | 213.8
H2O(g) | -241.8 | 188.8
C6H12O6(s) | -1274.4 | 212.1
O2(g) | 0 | 205.0

(a) Calculate the standard enthalpy change, ΔH°rxn, in kJ/molrxn, for this reaction.
(b) Calculate the standard entropy change, ΔS°rxn, in J/(K·molrxn), for this reaction.
(c) Use the Gibbs free energy equation and your answers to parts (a) and (b) to calculate ΔG°rxn, in kJ/molrxn, for this reaction at 298 K. (Convert ΔS° to kJ/(K·molrxn) before combining with ΔH° in kJ/molrxn.)
(d) Is this reaction thermodynamically favored at 298 K?
(e) Circle the situation that best describes this reaction: Not favored at any T / Favored at all T / Favored at high T / Favored at low T.`,
    answer: `(a) ΔH°rxn = [ΔHf°(C6H12O6) + 6ΔHf°(O2)] - [6ΔHf°(CO2) + 6ΔHf°(H2O)] = [-1274.4 + 0] - [6(-393.5) + 6(-241.8)] = -1274.4 - [-2361.0 + (-1450.8)] = -1274.4 - (-3811.8) = +2537.4 kJ/molrxn.

(b) ΔS°rxn = [S°(C6H12O6) + 6S°(O2)] - [6S°(CO2) + 6S°(H2O)] = [212.1 + 6(205.0)] - [6(213.8) + 6(188.8)] = [212.1 + 1230.0] - [1282.8 + 1132.8] = 1442.1 - 2415.6 = -973.5 J/(K·molrxn).

(c) ΔG°rxn = ΔH°rxn - TΔS°rxn = 2537.4 kJ/molrxn - (298 K)(-973.5 J/(K·molrxn))(1 kJ/1000 J) = 2537.4 - (298)(-0.9735) = 2537.4 - (-290.1) = 2537.4 + 290.1 = +2827.5 kJ/molrxn.

(d) No, this reaction is NOT thermodynamically favored at 298 K (ΔG°rxn is a very large positive value).

(e) Not favored at any T. Since ΔH°rxn is positive (unfavorable) AND ΔS°rxn is negative (also unfavorable), this reaction can never be thermodynamically favored at any temperature under standard conditions — both terms work against a negative ΔG°. (This is exactly why photosynthesis requires an external energy source — light — to drive this otherwise thermodynamically unfavorable process, an example of the coupled/externally-driven reactions covered in Topic 9.7.)`,
  },
  {
    title: 'Q13 — Full Thermodynamic Analysis of Hydrazine Combustion',
    content: `N2H4(g) + O2(g) → N2(g) + 2 H2O(g)

Substance | ΔHf° (kJ/mol) | S° (J/(K·mol))
N2H4(g) | 95.4 | 238.5
O2(g) | 0 | 205.0
N2(g) | 0 | 191.5
H2O(g) | -241.8 | 188.8

(a) Calculate the standard enthalpy change, ΔH°rxn, in kJ/molrxn, for this reaction.
(b) Calculate the standard entropy change, ΔS°rxn, in J/(K·molrxn), for this reaction.
(c) Use the Gibbs free energy equation and your answers to parts (a) and (b) to calculate ΔG°rxn, in kJ/molrxn, for this reaction at 298 K.
(d) Is this reaction thermodynamically favored at 298 K?
(e) Circle the situation that best describes this reaction: Not favored at any T / Favored at all T / Favored at high T / Favored at low T.`,
    answer: `(a) ΔH°rxn = [0 + 2(-241.8)] - [95.4 + 0] = -483.6 - 95.4 = -579.0 kJ/molrxn.

(b) ΔS°rxn = [191.5 + 2(188.8)] - [238.5 + 205.0] = [191.5 + 377.6] - 443.5 = 569.1 - 443.5 = +125.6 J/(K·molrxn).

(c) ΔG°rxn = -579.0 kJ/molrxn - (298 K)(0.1256 kJ/(K·molrxn)) = -579.0 - 37.4 = -616.4 kJ/molrxn.

(d) Yes, this reaction IS thermodynamically favored at 298 K (large negative ΔG°rxn).

(e) Favored at all T. Since ΔH°rxn is negative (favorable) AND ΔS°rxn is positive (also favorable), this reaction is thermodynamically favored at every temperature — both terms work together to make ΔG° negative regardless of T.`,
  },
  {
    title: 'Q14 — Full Thermodynamic Analysis of Methanol Decomposition, Including Two Temperatures',
    content: `CH3OH(g) → CO(g) + 2 H2(g)

Substance | ΔHf° (kJ/mol) | S° (J/(K·mol))
CH3OH(g) | -200.7 | 239.9
CO(g) | -110.5 | 197.7
H2(g) | 0 | 130.6

(a) Calculate the standard enthalpy change, ΔH°rxn, in kJ/molrxn, for this reaction.
(b) Calculate the standard entropy change, ΔS°rxn, in J/(K·molrxn), for this reaction.
(c) Use the Gibbs free energy equation and your answers to parts (a) and (b) to calculate ΔG°rxn, in kJ/molrxn, for this reaction at 298 K.
(d) Is this reaction thermodynamically favored at 298 K?
(e) Circle the situation that best describes this reaction: Not favored at any T / Favored at all T / Favored at high T / Favored at low T.
(f) Assuming ΔH°rxn and ΔS°rxn do not change significantly with temperature, calculate ΔGrxn at 200 K and at 500 K.`,
    answer: `(a) ΔH°rxn = [-110.5 + 0] - [-200.7] = -110.5 + 200.7 = +90.2 kJ/molrxn.

(b) ΔS°rxn = [197.7 + 2(130.6)] - [239.9] = [197.7 + 261.2] - 239.9 = 458.9 - 239.9 = +219.0 J/(K·molrxn).

(c) ΔG°rxn = 90.2 kJ/molrxn - (298 K)(0.2190 kJ/(K·molrxn)) = 90.2 - 65.3 = +24.9 kJ/molrxn.

(d) No, this reaction is NOT thermodynamically favored at 298 K (positive ΔG°rxn).

(e) Favored at high T. Since ΔH°rxn is positive (unfavorable) but ΔS°rxn is positive (favorable), the -TΔS° term becomes more negative (more favorable) as T increases, eventually overcoming the unfavorable positive ΔH — so this reaction becomes favored only at sufficiently high temperatures.

(f) At 200 K: ΔG = 90.2 - (200)(0.2190) = 90.2 - 43.8 = +46.4 kJ/molrxn (not favored — even less favorable at lower T, consistent with "favored at high T").

At 500 K: ΔG = 90.2 - (500)(0.2190) = 90.2 - 109.5 = -19.3 kJ/molrxn (favored — confirms that at a high enough temperature, this reaction becomes thermodynamically favored).`,
  },
  {
    title: 'Q15 — Full Thermodynamic Analysis of NH4Cl Formation, Including Two Temperatures',
    content: `NH3(g) + HCl(g) → NH4Cl(s)

Substance | ΔHf° (kJ/mol) | S° (J/(K·mol))
NH3(g) | -46.1 | 192.5
HCl(g) | -92.3 | 186.9
NH4Cl(s) | -314.4 | 94.6

(a) Calculate the standard enthalpy change, ΔH°rxn, in kJ/molrxn, for this reaction.
(b) Calculate the standard entropy change, ΔS°rxn, in J/(K·molrxn), for this reaction.
(c) Use the Gibbs free energy equation and your answers to parts (a) and (b) to calculate ΔG°rxn, in kJ/molrxn, for this reaction at 298 K.
(d) Is this reaction thermodynamically favored at 298 K?
(e) Circle the situation that best describes this reaction: Not favored at any T / Favored at all T / Favored at high T / Favored at low T.
(f) Assuming ΔH°rxn and ΔS°rxn do not change significantly with temperature, calculate ΔGrxn at 200 K and at 700 K.`,
    answer: `(a) ΔH°rxn = [-314.4] - [-46.1 + (-92.3)] = -314.4 - (-138.4) = -314.4 + 138.4 = -176.0 kJ/molrxn.

(b) ΔS°rxn = [94.6] - [192.5 + 186.9] = 94.6 - 379.4 = -284.8 J/(K·molrxn).

(c) ΔG°rxn = -176.0 kJ/molrxn - (298 K)(-0.2848 kJ/(K·molrxn)) = -176.0 - (-84.9) = -176.0 + 84.9 = -91.1 kJ/molrxn.

(d) Yes, this reaction IS thermodynamically favored at 298 K (negative ΔG°rxn).

(e) Favored at low T. Since ΔH°rxn is negative (favorable) but ΔS°rxn is also negative (unfavorable), the -TΔS° term becomes more positive (more unfavorable) as T increases — so this reaction is favored only at sufficiently low temperatures, where the favorable enthalpy term dominates.

(f) At 200 K: ΔG = -176.0 - (200)(-0.2848) = -176.0 + 56.96 = -119.0 kJ/molrxn (favored — even more favorable at lower T, consistent with "favored at low T").

At 700 K: ΔG = -176.0 - (700)(-0.2848) = -176.0 + 199.4 = +23.4 kJ/molrxn (not favored — confirms that at a high enough temperature, this reaction becomes thermodynamically unfavored).`,
  },
];

/* ============================= 9.4 — Thermodynamic and Kinetic Control ============================= */
const t94 = [
  {
    title: 'Q16 — True or False: Thermodynamic Favorability vs. Reaction Rate',
    content: `Decide if each of the following statements is true or false.

(a) If the sign of ΔG° for a certain process is negative, the process is thermodynamically favored to occur under standard conditions.
(b) If the sign of ΔG° for a certain process is negative, the process should occur at a relatively fast rate under standard conditions.
(c) If a certain process has a relatively high activation energy, the process is likely to occur at a relatively fast rate.
(d) If a certain process has a relatively high activation energy, the process is likely to occur at a relatively slow rate.`,
    answer: `(a) True. This is the definition of thermodynamic favorability: ΔG° < 0 means the process is thermodynamically favored under standard conditions.

(b) False. Thermodynamic favorability (ΔG° < 0) says nothing about the RATE at which a process occurs — a process can be thermodynamically favored yet occur extremely slowly (or not at all on a practical timescale) if it has a high activation energy (i.e., it is under kinetic control).

(c) False. A relatively high activation energy means fewer particles have enough energy to react upon collision, resulting in a relatively slow reaction rate, not a fast one.

(d) True. A relatively high activation energy is a common reason for a process to occur at a relatively slow rate (it may even appear not to occur at all on an observable timescale), regardless of how thermodynamically favorable the process is.`,
  },
  {
    title: 'Q17 — Explaining Why Thermodynamically Favored NH3 Formation Is Not Observed',
    content: `N2(g) + 3 H2(g) → 2 NH3(g)     ΔH° < 0 and ΔG° < 0

Information about the formation of NH3(g) from N2(g) and H2(g) is shown above. When equal volumes of N2(g) and H2(g), each at 1 atm, are mixed in a closed container at 298 K, no formation of NH3(g) is observed. Select all of the following statements that represent a valid explanation for this observation.

(A) The formation of NH3(g) from N2(g) and H2(g) is not thermodynamically favored to occur at standard conditions.
(B) The reactants N2(g) and H2(g) must be combined in a 1-to-3 mole ratio in order for the reaction to proceed.
(C) The formation of NH3(g) from N2(g) and H2(g) has a relatively high activation energy, which causes the rate of the reaction to be extremely slow at standard conditions.
(D) The driving force for the formation of NH3(g) from N2(g) and H2(g) is the change in entropy (ΔS°).`,
    answer: `Correct answer: (C) only.

(C) is valid: a relatively high activation energy causes an extremely slow reaction rate, which fully explains why no observable formation of NH3(g) occurs even though the reaction is thermodynamically favored (ΔG° < 0) — this is a classic example of a reaction under kinetic control.

(A) is false — the problem explicitly states ΔG° < 0, meaning the reaction IS thermodynamically favored; this cannot be the explanation for the lack of observed reaction.

(B) is false — while a 1-to-3 mole ratio of N2 to H2 is the STOICHIOMETRIC ratio for a complete/efficient reaction, mixing the reactants in EQUAL volumes (not a 1:3 ratio) does not prevent the reaction from occurring at all; some reaction could still proceed with one reactant in excess. This is not a valid explanation for the complete absence of any observed reaction.

(D) is false (and irrelevant to the observation) — for N2 + 3 H2 → 2 NH3, the moles of gas decrease (4 mol → 2 mol), so ΔS° for this reaction is actually negative, not positive; entropy would actually be an unfavorable factor here, not the driving force. Regardless, this statement doesn't address why no reaction is observed — that requires a kinetic explanation, not a thermodynamic one.`,
  },
  {
    title: 'Q18 — Explaining Why a Catalyst Speeds Up H2O2 Decomposition',
    content: `H2O2(aq) → H2O(l) + O2(g)     ΔH° < 0 and ΔG° < 0

Information about the decomposition of H2O2(aq) to form H2O(l) and O2(g) is shown above. A solution of H2O2(aq) is typically stable for up to a year stored in a dark bottle at 298 K. When a suitable catalyst is added to the solution of H2O2(aq), the decomposition reaction occurs at a much faster rate. Select all of the following statements that represent a valid explanation for this observation.

(A) The addition of a catalyst decreases the value of ΔG°, causing the reaction to become thermodynamically favorable.
(B) The addition of a catalyst increases the value of ΔG°, causing the reaction to become thermodynamically favorable.
(C) The addition of a catalyst provides a reaction pathway with a lower activation energy, resulting in a faster reaction rate.
(D) The addition of a catalyst provides a reaction pathway with a higher activation energy, resulting in a faster reaction rate.`,
    answer: `Correct answer: (C) only.

(C) is valid: a catalyst works by providing an alternative reaction pathway with a LOWER activation energy, which allows a much larger fraction of particles to have enough energy to react upon collision, resulting in a faster reaction rate.

(A) and (B) are both false — a catalyst does NOT change the value of ΔG° (or the value of the equilibrium constant K) at all; it has no effect on thermodynamic favorability, only on the rate at which equilibrium (or completion) is reached. The reaction was already thermodynamically favored (ΔG° < 0, as given) both before and after the catalyst is added — the catalyst just makes it happen faster.

(D) is false — a HIGHER activation energy would result in a SLOWER reaction rate, not a faster one; this directly contradicts how catalysts function.`,
  },
];

/* ============================= 9.5 — Free Energy and Equilibrium ============================= */
const t95 = [
  {
    title: 'Q19 — Relating K and ΔG° for Four Different Equations',
    content: `Fill in the missing information in the table below. Use R = 8.314 J/(mol·K) and T = 298 K. Use the equation ΔG° = -RT ln K (or K = e^(-ΔG°/RT)) as needed.

Equation | K at 298 K | ΔG° (kJ/molrxn) | Reactants or Products Favored at Equilibrium?
AgCl(s) ⇌ Ag+(aq) + Cl-(aq) | 1.8 x 10^-10 | ? | ?
CO(g) + H2O(g) ⇌ CO2 + H2(g) | 1.0 x 10^5 | ? | ?
N2(g) + 2 O2(g) ⇌ 2 NO2 | ? | +103 | ?
C2H4(g) + H2(g) ⇌ C2H6(g) | ? | -101 | ?`,
    answer: `Row 1 (AgCl): ΔG° = -RT ln K = -(8.314 J/(mol·K))(298 K) ln(1.8 x 10^-10) = -(2477.6)(-22.44) = 55,600 J/molrxn ≈ +55.6 kJ/molrxn. Since K < 1 (and ΔG° > 0), reactants are favored at equilibrium.

Row 2 (CO + H2O): ΔG° = -(2477.6)(ln(1.0 x 10^5)) = -(2477.6)(11.51) = -28,520 J/molrxn ≈ -28.5 kJ/molrxn. Since K > 1 (and ΔG° < 0), products are favored at equilibrium.

Row 3 (N2 + 2 O2): K = e^(-ΔG°/RT) = e^(-103,000/[(8.314)(298)]) = e^(-103,000/2477.6) = e^(-41.58) ≈ 8 x 10^-19 (an extremely small number). Since ΔG° > 0 (and K << 1), reactants are favored at equilibrium.

Row 4 (C2H4 + H2): K = e^(-(-101,000)/[(8.314)(298)]) = e^(101,000/2477.6) = e^(40.76) ≈ 5 x 10^17 (an extremely large number). Since ΔG° < 0 (and K >> 1), products are favored at equilibrium.`,
  },
];

/* ============================= 9.6 — Free Energy of Dissolution ============================= */
const t96 = [
  {
    title: 'Q20 — Enthalpy and Entropy Changes for the Three Steps of Ionic Dissolution',
    content: `A particle diagram (previously presented in Unit 6) represents three different steps describing particle-level events that occur when an ionic solute dissolves in a polar solvent such as water:

Step 1: A cluster of ions from the solid ionic lattice separates into individual, widely-spaced gas-phase ions.
Step 2: The tightly-packed water molecules of the solvent separate from each other, creating space to accommodate the incoming ions.
Step 3: The separated ions and the separated water molecules combine, with water molecules surrounding (hydrating) each ion in an organized shell.

For each step, indicate whether attractive forces between particles are broken or formed, indicate the sign of ΔH, indicate whether the particles of matter become more dispersed or less dispersed, and indicate the sign of ΔS.`,
    answer: `Step 1 (separating the ions of the solid lattice): Attractive forces are BROKEN (ionic bonds holding the lattice together are overcome). ΔH is POSITIVE (breaking attractive forces requires energy — endothermic). The particles become MORE dispersed (going from a fixed, ordered lattice to freely separated gas-phase ions). ΔS is POSITIVE.

Step 2 (separating the water molecules from each other): Attractive forces are BROKEN (hydrogen bonds between neighboring water molecules are overcome to make room). ΔH is POSITIVE (endothermic). The particles become MORE dispersed (water molecules are pushed apart from their close-packed liquid arrangement). ΔS is POSITIVE.

Step 3 (combining the separated ions and water molecules into hydrated ions): Attractive forces are FORMED (new ion-dipole attractions between each ion and the surrounding water molecules). ΔH is NEGATIVE (forming attractive forces releases energy — exothermic). The particles become LESS dispersed (the previously freely-separated, independent ions and water molecules become organized into structured hydration shells, a more ordered arrangement than fully independent, freely-moving separate particles). ΔS is NEGATIVE.`,
  },
];

/* ============================= 9.7 — Coupled Reactions ============================= */
const t97 = [
  {
    title: 'Q21 — Determining Thermodynamic Favorability from the Sign of ΔG°',
    content: `Cu2S(s) ⇌ 2 Cu(s) + S(s)     ΔG° = +86.2 kJ/molrxn

(a) The reaction represented by the equation above (is / isn't) thermodynamically favored to occur because the sign of ΔG° for the reaction is positive.

S(s) + O2(g) ⇌ SO2(g)     ΔG° = -300.4 kJ/molrxn

(b) The reaction represented by the equation above (is / isn't) thermodynamically favored to occur because the sign of ΔG° for the reaction is negative.`,
    answer: `(a) Isn't. Since ΔG° = +86.2 kJ/molrxn is positive, this reaction (the decomposition of Cu2S into Cu and S) is NOT thermodynamically favored to occur under standard conditions.

(b) Is. Since ΔG° = -300.4 kJ/molrxn is negative, this reaction (the combustion of S to form SO2) IS thermodynamically favored to occur under standard conditions.`,
  },
  {
    title: 'Q22 — Coupling Two Reactions to Make an Unfavorable Process Favorable (Cu2S + O2)',
    content: `Cu2S(s) ⇌ 2 Cu(s) + S(s)     ΔG° = +86.2 kJ/molrxn
S(s) + O2(g) ⇌ SO2(g)     ΔG° = -300.4 kJ/molrxn

Cu2S(s) + O2(g) ⇌ 2 Cu(s) + SO2(g)     ΔG° = ?

(a) Show how the two equations above can be combined together to produce the overall equation shown above (this is similar to Hess's Law from Topic 6.9).
(b) Calculate the value of ΔG° for the overall equation. Is the reaction represented by this equation thermodynamically favorable? Justify your answer.`,
    answer: `(a) Add the two equations directly (no reversal or scaling needed): Cu2S(s) ⇌ 2 Cu(s) + S(s), plus S(s) + O2(g) ⇌ SO2(g). Adding: Cu2S(s) + S(s) + O2(g) ⇌ 2 Cu(s) + S(s) + SO2(g). The S(s) term appears as both a product (from equation 1) and a reactant (from equation 2) in equal amounts, so it cancels, leaving: Cu2S(s) + O2(g) ⇌ 2 Cu(s) + SO2(g), which matches the target equation.

(b) ΔG°(overall) = ΔG°(eq. 1) + ΔG°(eq. 2) = (+86.2) + (-300.4) = -214.2 kJ/molrxn.

Yes, this overall reaction IS thermodynamically favorable, since ΔG°(overall) is negative (-214.2 kJ/molrxn) — even though the decomposition of Cu2S alone is unfavorable (positive ΔG°), coupling it with the highly favorable combustion of sulfur (S + O2 → SO2, which shares the common intermediate S) makes the OVERALL combined process thermodynamically favorable.`,
  },
  {
    title: "Q23 — Coupling Two Reactions to Reduce Iron Ore (Fe2O3 + C)",
    content: `Equation #1: 2 Fe2O3(s) ⇌ 4 Fe(s) + 3 O2(g)     ΔG° = +742.2 kJ/molrxn
Equation #2: C(s) + O2(g) ⇌ CO2(g)     ΔG° = -394.4 kJ/molrxn
Equation #3: 2 Fe2O3(s) + 3 C(s) ⇌ 4 Fe(s) + 3 CO2(g)     ΔG° = ?

(a) Show how Equations #1 and #2 can be combined together to produce Equation #3.
(b) Calculate the value of ΔG° for Equation #3. Is the reaction represented by Equation #3 thermodynamically favorable? Justify your answer.`,
    answer: `(a) Equation #2 must be multiplied by 3 (to supply the 3 C and 3 O2 needed to match Equation #3, and to produce 3 CO2): 3 C(s) + 3 O2(g) ⇌ 3 CO2(g), with ΔG° = 3 x (-394.4) = -1183.2 kJ/molrxn.

Adding Equation #1 (unmodified) to the modified Equation #2: 2 Fe2O3(s) + 3 C(s) + 3 O2(g) ⇌ 4 Fe(s) + 3 O2(g) + 3 CO2(g). The 3 O2(g) term appears as both a product (from Equation #1) and a reactant (from the modified Equation #2), so it cancels, leaving: 2 Fe2O3(s) + 3 C(s) ⇌ 4 Fe(s) + 3 CO2(g), which matches Equation #3.

(b) ΔG°(Equation #3) = ΔG°(Equation #1) + 3 x ΔG°(Equation #2) = (+742.2) + 3(-394.4) = 742.2 + (-1183.2) = -441.0 kJ/molrxn.

Yes, Equation #3 IS thermodynamically favorable, since ΔG° is negative (-441.0 kJ/molrxn) — even though the decomposition of Fe2O3 alone is highly unfavorable (large positive ΔG°), coupling it with the highly favorable combustion of carbon (sharing O2 as the common intermediate) makes the overall reduction of iron ore by carbon thermodynamically favorable. (This coupled reaction is essentially the thermodynamic basis for smelting iron ore in a blast furnace.)`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId);
  const startIdx = existing && existing.length > 0 ? Math.max(...existing.map(q => q.order_index)) + 1 : 0;

  const rows = questions.map((q, idx) => ({
    topic_id: topicId,
    title: q.title,
    content: q.content,
    answer_key: q.answer,
    order_index: startIdx + idx,
    source: 'Topic Worksheet',
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    await insertTopic('9.1', t91);
    await insertTopic('9.2', t92);
    await insertTopic('9.3', t93);
    await insertTopic('9.4', t94);
    await insertTopic('9.5', t95);
    await insertTopic('9.6', t96);
    await insertTopic('9.7', t97);
    console.log('Done — Unit 9 Topics 9.1-9.7 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
