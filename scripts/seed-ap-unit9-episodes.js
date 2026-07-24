const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Note: as found earlier this session, these source PDFs' own numbering (9.4-9.11)
// includes an extra non-CED topic "9.6 Free Energy of Dissolution" that isn't a
// separate DB topic in this class's Unit 9 — that content instead belongs in
// Unit 7's "7.14 Free Energy of Dissolution" topic. Everything the PDFs label
// 9.7 and higher is therefore shifted back by one relative to this class's real
// Unit 9 topic numbers (same shift already applied to the Topic Worksheet content
// seeded earlier this session).
const TOPICS = {
  '9.1': 'd5cf1364-e871-44d5-81ac-bae2aea2c5b3',
  '9.2': '0b665475-c52e-40c9-aff3-709e07936a6a',
  '9.3': 'd6c38ef0-e004-47d2-beda-2da22f798927',
  '9.4': 'a8ba0aa1-a7c0-4cfe-8943-42b1a8c41c7e',
  '9.5': '1ac86406-d22d-4c4d-b801-577d177fb246',
  '9.6': '1dec5262-ca62-4038-bdfb-2e10a1747930',
  '9.7': '278fedc7-d2c0-415e-a8ff-0a718d684f61',
  '9.8': '6f1f1464-4e71-425b-8af0-14c86afbcb72',
  '9.9': '213d2f22-b72e-49ff-a4a7-5eff7bb99382',
  '9.10': '5a9bdcfa-4e63-428f-9110-7bfb6d8ca781',
  '7.14': '24ba5bc7-b7ec-4f3e-bdac-55b57e6f0fbc',
};

const IMG_DIR = path.join(__dirname, 'tmp-episode-imgs', 'unit9');

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `unit9-episodes/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 9.1 — Introduction to Entropy (Episode #28) ============================= */
const t91 = [
  {
    title: 'Episode Review Q1 — Identifying the Process with the Most Negative ΔS°',
    content: `Which of the following equations represents a process that has the most negative value of ΔS°?

(A) NH3(g) + HCl(g) → NH4Cl(s)
(B) H2O(l) → H2O(s)
(C) H2(g) + Cl2(g) → 2 HCl(g)
(D) HNO2(aq) + KOH(aq) → H2O(l) + KNO2(aq)`,
    answer: `(A). This process converts 2 mol of gas-phase reactants into 0 mol of gas in the product (a solid) — a complete elimination of gas-phase dispersal, in addition to the phase change from gas to solid. This represents by far the largest decrease in the number of accessible microstates among the options. (B) is a liquid-to-solid phase change with no gases involved (a much smaller decrease). (C) involves 2 mol gas → 2 mol gas (no change in moles of gas, ΔS° ≈ small). (D) involves only aqueous and liquid species (no gases at all), so the entropy change is modest.`,
  },
  {
    title: 'Episode Review Q2 — Particle-Level Explanation for a Negative ΔS° (Phosphorus Combustion)',
    content: `P4(s) + 5 O2(g) → P4O10(s)     ΔS° = –837 J/(K · molrxn)

Using particle-level reasoning, explain why the entropy decreases as the reaction progresses.`,
    answer: `Gas particles are far more dispersed (occupy a much greater number of microstates/arrangements) than solid particles. Because the reactants include a gas (O2) that is entirely consumed and converted into the solid product (P4O10), the highly dispersed, freely-moving O2 molecules become locked into an ordered solid structure with far fewer accessible microstates. This loss of gas-phase dispersal causes the overall entropy of the system to decrease.`,
  },
  {
    title: 'Episode Review Q3 — Predicting Relative Standard Molar Entropy (Si(s) vs. H2(g))',
    content: `The absolute molar entropy, S°, of Si(s) is 18 J/(K · mol). Do you predict that the value of S° for H2(g) should be less than or greater than 18 J/(K · mol)? Justify your answer.`,
    answer: `Greater than 18 J/(K · mol). Gases are far more dispersed than solids — gas particles have vastly more accessible positions/microstates available to them (moving freely through a large volume) compared to particles locked into a solid's fixed lattice structure. Since standard molar entropy generally reflects this difference in dispersal, H2(g) should have a substantially higher S° than Si(s), regardless of the fact that H2 has a much smaller molar mass.`,
  },
  {
    title: 'Episode Review Q4 — Identifying the Particle Diagram with the Greatest Positive ΔS°',
    imageKey: 'q4_diagram',
    content: `Which of the following particulate diagrams represents the change with the greatest positive value of ΔS°? Each diagram shows a "before" box and an "after" box.

(A) Before: 3 six-atom molecules (each with 2 filled + 4 open atoms). After: 6 three-atom molecules (each with 1 filled + 2 open atoms) — the same total atom count, but the number of separate molecules doubles from 3 to 6.
(B) Before: 6 individual two-atom (open-open) molecules dispersed throughout the box. After: all atoms clustered tightly together in one corner in an ordered, closely-packed arrangement.
(C) Before: 6 molecules (4 mixed open-filled pairs + 2 open-open pairs). After: 4 three-atom molecules (each 1 filled + 2 open) — the number of separate molecules decreases from 6 to 4.
(D) Before: 6 two-atom molecules (3 open-open pairs + 3 filled-filled pairs). After: 6 mixed open-filled two-atom molecules — the same total number of molecules (6), just recombined into different (heteronuclear) pairs.`,
    answer: `(A). In diagram (A), the number of separate gas-phase molecules DOUBLES, from 3 (larger, six-atom molecules) to 6 (smaller, three-atom molecules) — a substantial increase in the number of independent gas particles, which corresponds to a large positive ΔS° (many more accessible microstates with more, smaller particles). In diagram (B), gas particles condense into a tightly ordered cluster (a phase change to a solid-like arrangement) — this is a large entropy DECREASE, not an increase. In diagram (C), the number of molecules DECREASES from 6 to 4 — an entropy decrease. In diagram (D), the total number of molecules stays the same (6 before and 6 after) — at most a very small entropy change, since the number of gas particles is unchanged.`,
  },
];

/* ============================= 9.2 — Absolute Entropy and Entropy Change (Episode #28) ============================= */
const t92 = [
  {
    title: 'Episode Review Q5 — Identifying an Error in an Entropy Calculation (Methanol Decomposition)',
    content: `Substance | S° (J/(K · mol))
CH3OH(g) | 240.
CO(g) | 198
H2(g) | 131

A student was asked to use the data in the table above to calculate the value of the standard entropy change, ΔS°rxn, for the reaction represented by the following equation:

CH3OH(g) → CO(g) + 2 H2(g)

The student's set-up for the calculation is shown below:

ΔS°rxn = [(198) + (131)] – [240.] = +89 J/(K · molrxn)

Identify the error in the student's set-up for this calculation, and calculate the correct value of ΔS°rxn for the reaction. Include units in your answer.`,
    answer: `Error: The student failed to account for the coefficient of "2" in front of H2(g) in the balanced equation — they used only one factor of S°(H2) = 131 instead of multiplying it by 2.

Correct calculation: ΔS°rxn = [S°(CO) + 2 × S°(H2)] – S°(CH3OH) = [198 + 2(131)] – 240. = [198 + 262] – 240. = 460 – 240. = +220 J/(K · molrxn).`,
  },
  {
    title: 'Episode Review Q6 — Solving for an Unknown Standard Molar Entropy (SO3)',
    content: `Substance | S° (J/(K · mol))
SO2(g) | 248.2
O2(g) | 205.0
SO3(g) | ?

2 SO2(g) + O2(g) → 2 SO3(g)     ΔS°rxn = –187.8 J/(K · molrxn)

According to the information in the table and the chemical equation shown above, calculate the value of the standard molar entropy, S°, of SO3(g), in units of J/(K · mol).`,
    answer: `ΔS°rxn = 2 × S°(SO3) – [2 × S°(SO2) + S°(O2)]

–187.8 = 2 × S°(SO3) – [2(248.2) + 205.0]

–187.8 = 2 × S°(SO3) – [496.4 + 205.0]

–187.8 = 2 × S°(SO3) – 701.4

2 × S°(SO3) = –187.8 + 701.4 = 513.6

S°(SO3) = 513.6 / 2 = 256.8 J/(K · mol).`,
  },
];

/* ============================= 9.3 — Gibbs Free Energy and Thermodynamic Favorability (Episode #28) ============================= */
const t93 = [
  {
    title: 'Episode Review Q7 — Determining Thermodynamic Favorability at Two Temperatures (NOCl Decomposition)',
    content: `2 NOCl(g) → 2 NO(g) + Cl2(g)     ΔH°rxn = 77 kJ/molrxn; ΔS°rxn = 121 J/(K · molrxn)

The reaction represented by the equation shown above is run at both 300 K and 800 K. Which one of the following correctly identifies the thermodynamic favorability for the reaction at these two temperatures? (Assume that ΔH° and ΔS° do not change with temperature.)

At 300 K | At 800 K
(A) Unfavorable | Unfavorable
(B) Unfavorable | Favorable
(C) Favorable | Unfavorable
(D) Favorable | Favorable`,
    answer: `(B). Since ΔH° is positive and ΔS° is positive, the reaction is favored only at high enough temperatures (per the sign rules: +,+ → favored at high T). The crossover temperature is T = ΔH°/ΔS° = 77,000 J / 121 J/K = 636 K. Since 300 K < 636 K, the reaction is Unfavorable at 300 K. Since 800 K > 636 K, the reaction is Favorable at 800 K.`,
  },
  {
    title: 'Episode Review Q8 — Identifying a Unit-Consistency Error in a ΔG° Calculation',
    content: `N2(g) + 3 F2(g) → 2 NF3(g)     ΔH°rxn = –264 kJ/molrxn; ΔS°rxn = –278 J/(K · molrxn)

Based on the information shown above, a student was asked to calculate the value of the standard free energy change for the reaction represented by the equation shown above at 298 K. The student's set-up for the calculation is shown below:

ΔG° = ΔH° – TΔS° = (–264) – (298)(–278) = 82,600

(a) Identify the error in the student's set-up for this calculation.
(b) Calculate the value of ΔG° for this reaction in units of kJ/molrxn.`,
    answer: `(a) The student combined ΔH° (in kJ/molrxn) and TΔS° (in J/molrxn, since ΔS° is in J/(K · molrxn)) without converting them to consistent units. ΔS° must first be converted from J/(K · molrxn) to kJ/(K · molrxn) (by dividing by 1000) before it can be combined with ΔH°, which is already in kJ/molrxn.

(b) ΔS° = –278 J/(K · molrxn) = –0.278 kJ/(K · molrxn). ΔG° = ΔH° – TΔS° = (–264 kJ/molrxn) – (298 K)(–0.278 kJ/(K · molrxn)) = –264 – (–82.844) = –264 + 82.844 = –181 kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q9 — Determining the Sign of ΔH° from the Signs of ΔG° and ΔS°',
    content: `C2H5OH(g) → C2H4(g) + H2O(g)     ΔG°rxn > 0; ΔS°rxn > 0

Given the signs of ΔG°rxn and ΔS°rxn at 298 K for the reaction represented by the equation shown above, is the sign of ΔH°rxn for this reaction positive or negative? Justify your answer.`,
    answer: `Positive. Using ΔG° = ΔH° – TΔS°: since ΔS° > 0 and T > 0, the term –TΔS° is negative — on its own, this would make ΔG° negative (favorable). Since the reaction's actual ΔG° is positive (unfavorable) despite this negative contribution, ΔH° must be positive, and large enough in magnitude to outweigh the negative –TΔS° term, resulting in an overall positive ΔG°.`,
  },
  {
    title: 'Episode Review Q10 — Evaluating a Claim About Thermodynamic Favorability at High Temperature',
    content: `N2(g) + 2 H2(g) → N2H4(l)     ΔH°rxn > 0; ΔS°rxn < 0

A student makes the claim that the reaction represented by the equation shown above is thermodynamically favorable at high temperatures. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `Disagree. Since ΔH° is positive and ΔS° is negative, both terms in ΔG° = ΔH° – TΔS° work against favorability at every temperature: ΔH° is positive (unfavorable contribution), and since ΔS° is negative, –TΔS° is also positive (also an unfavorable contribution). With both terms positive at all temperatures, ΔG° remains positive (unfavorable) regardless of temperature — this reaction is never thermodynamically favored, at any temperature (not just at low temperatures, and certainly not "favorable at high temperatures" as the student claims).`,
  },
  {
    title: 'Episode Review Q11 — Identifying the Driving Force Behind an Endothermic, Favorable Reaction',
    content: `NaHCO3(s) + HC2H3O2(aq) → NaC2H3O2(aq) + H2O(l) + CO2(g)     ΔH°rxn > 0; ΔG°rxn < 0 at 298 K

Which of the following is true about the reaction represented above?

(A) At 298 K, it is driven by enthalpy only.
(B) At 298 K, it is driven by entropy only.
(C) At 298 K, it is driven by both enthalpy and entropy.
(D) It is not thermodynamically favorable at 298 K.`,
    answer: `(B). Since ΔG° = ΔH° – TΔS°, and ΔG° < 0 while ΔH° > 0 (working against favorability), the term –TΔS° must be negative and large enough in magnitude to overcome the positive ΔH° — which requires ΔS° > 0. Since the positive entropy change is the only factor making ΔG° negative overall (enthalpy is actually working against favorability, being endothermic), this reaction is driven by entropy only.`,
  },
];

/* ============================= 9.4 — Thermodynamic and Kinetic Control (Episode #29) ============================= */
const t94 = [
  {
    title: 'Episode Review Q1 — Explaining Why a Favorable Reaction Does Not Occur Observably (N2O Decomposition)',
    content: `2 N2O(g) → 2 N2(g) + O2(g)     ΔH° = –164 kJ/molrxn; ΔS° = +148 J/(K · molrxn)

The decomposition of N2O(g) to form N2(g) and O2(g) is represented above. A pure sample of N2O(g) is placed in a flask at 298 K, and no evidence of N2(g) or O2(g) is detected in the flask after several hours. Which of the following is the best explanation for why the decomposition reaction does not occur to an observable extent at 298 K?

(A) The reaction is not thermodynamically favorable at 298 K.
(B) The change in enthalpy for the reaction is negative.
(C) The change in entropy for the reaction is positive.
(D) The reaction has a high activation energy.`,
    answer: `(D). Since ΔH° < 0 and ΔS° > 0, this reaction is thermodynamically favored at ALL temperatures (ruling out (A) — the reaction IS favorable). Options (B) and (C) simply restate given information without explaining the LACK of observed reaction. Since the reaction is favorable but does not proceed at a measurable rate, it must be under kinetic control — meaning it has a high activation energy that prevents the reaction from occurring at an observable rate, even though it is thermodynamically favored.`,
  },
  {
    title: 'Episode Review Q2 — Identifying Favorability and Activation Energy for a Slow Reaction (Urea Synthesis)',
    content: `CO2(g) + 2 NH3(g) → CO(NH2)2(s) + H2O(l)     ΔH° = –134 kJ/molrxn; ΔS° = –424 J/(K · molrxn)

The reaction represented above does not proceed at a measurable rate at 298 K. Which of the following provides correct information about the thermodynamic favorability of this reaction at 298 K and provides a correct description of the value of the activation energy for this reaction?

Thermodynamic Favorability at 298 K | Activation Energy
(A) Favorable | low
(B) Favorable | high
(C) Not Favorable | low
(D) Not Favorable | high`,
    answer: `(B). Since ΔH° < 0 and ΔS° < 0, this reaction is favored only at LOW temperatures. The crossover temperature is T = ΔH°/ΔS° = 134,000 J / 424 J/K = 316 K. Since 298 K < 316 K, the reaction IS in the "favorable" (low-temperature) regime — it is thermodynamically Favorable at 298 K. Since the reaction is favorable yet doesn't proceed at a measurable rate, it must have a HIGH activation energy (kinetic control).`,
  },
];

/* ============================= 9.5 — Free Energy and Equilibrium (Episode #29) ============================= */
const t95 = [
  {
    title: "Episode Review Q3 — Combining Equilibrium Constants and Determining the Sign of ΔG°",
    content: `A2X(g) ⇌ A2(g) + X(g)     Keq = 4 × 10⁻³ at 300 K
XY4(g) ⇌ X(g) + 2 Y2(g)     Keq = 2 × 10⁻⁶ at 300 K

Based on the information above, which of the following gives the value of Keq and the sign of ΔG° for the reaction represented by the equation below at 300 K?

A2X(g) + 2 Y2(g) ⇌ A2(g) + XY4(g)     Keq = ?

(A) 8 × 10⁻⁹, Positive
(B) 8 × 10⁻⁹, Negative
(C) 2 × 10³, Positive
(D) 2 × 10³, Negative`,
    answer: `(D). Keep the first equation as written: A2X → A2 + X, Keq1 = 4 × 10⁻³. Reverse the second equation: X + 2 Y2 → XY4, Keq2' = 1/(2 × 10⁻⁶) = 5 × 10⁵. Adding these (the X terms cancel): A2X + 2 Y2 → A2 + XY4 — matching the target equation.

Keq(target) = Keq1 × Keq2' = (4 × 10⁻³)(5 × 10⁵) = 2 × 10³.

Since Keq = 2 × 10³ is much greater than 1, ΔG° must be Negative (K > 1 corresponds to ΔG° < 0).`,
  },
  {
    title: 'Episode Review Q4 — Calculating ΔG° from Free Energies of Formation and Then Finding K',
    content: `CO(g) + H2O(g) → CO2(g) + H2(g)

Substance | ΔGf° (kJ/mol)
CO(g) | –137
H2O(g) | –229
CO2(g) | –394
H2(g) | 0

(a) Calculate the value of ΔG° for the reaction represented by the equation above.
(b) Calculate the value of the equilibrium constant, K, for this reaction under standard conditions at 298 K.`,
    answer: `(a) ΔG°rxn = ΣΔGf°(products) – ΣΔGf°(reactants) = [(–394) + (0)] – [(–137) + (–229)] = (–394) – (–366) = –28 kJ/molrxn.

(b) K = e^(–ΔG°/RT) = e^(–(–28,000 J/mol)/[(8.314 J/(mol·K))(298 K)]) = e^(28,000/2477.6) = e^11.30 ≈ 8.1 × 10⁴.`,
  },
];

/* ============================= 7.14 — Free Energy of Dissolution (Episode #29; DB places this in Unit 7, not Unit 9) ============================= */
const t714 = [
  {
    title: 'Episode Review Q5 — Explaining the Signs of ΔH° and ΔS° for the Dissolution of AlCl3',
    content: `AlCl3(s) → Al3+(aq) + 3 Cl–(aq)

The dissolution of AlCl3(s) in water is represented by the equation shown above. Information about the dissolution of AlCl3(s):

ΔG° | ΔH° | ΔS°
negative | negative | negative

Which of the following provides a valid explanation of the information in the table?

(A) The sign of ΔS° is negative because the dissolution of AlCl3(s) is not thermodynamically favored under standard conditions.
(B) The sign of ΔS° is negative because the water molecules in the hydration shells of Al3+ and Cl– ions have a smaller number of arrangements than the molecules in pure water.
(C) The sign of ΔH° is negative because the Al3+ and Cl– ions in aqueous solution have a larger number of arrangements than the ions in pure AlCl3(s).
(D) The sign of ΔH° is negative because thermal energy is released when attractive forces between Al3+ and Cl– ions are broken.`,
    answer: `(B). Highly charged ions like Al3+ (and to a lesser extent Cl–) strongly organize and orient the surrounding water molecules into a highly ordered hydration shell — this ordered arrangement has FEWER accessible microstates than the relatively disordered arrangement of molecules in pure (bulk) water, causing ΔS° to be negative. (Option (A) incorrectly attributes the negative ΔS° to the overall favorability of the process — ΔG° being negative actually means the process IS favored, and this reasoning conflates ΔS° with ΔG°. Option (C) incorrectly applies "number of arrangements" reasoning — an entropy concept — to explain ΔH°, the wrong variable. Option (D) is factually backwards: breaking attractive forces (the ionic lattice) always REQUIRES energy input (endothermic), it does not release energy.)`,
  },
  {
    title: 'Episode Review Q6 — Calculating ΔG° for Dissolution and Evaluating a Claim About ΔH°',
    content: `NH4NO3(s) → NH4+(aq) + NO3–(aq)

Data for the Dissolution of NH4NO3(s): ΔH° = +26 kJ/molrxn, ΔS° = +110 J/(K · molrxn).

(a) Use the information above to calculate the value of the standard free energy change, ΔG°, for the dissolution of NH4NO3(s) in water at 298 K.
(b) At 298 K, is the dissolution of NH4NO3(s) in water thermodynamically favorable? Justify your answer based on the value of ΔG° that you calculated in part (a).
(c) A student makes the claim that the sign of ΔH° for the dissolution of NH4NO3(s) is positive because the formation of strong ion-dipole forces between particles of solute and solvent contribute significantly to the dissolution process being endothermic. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `(a) ΔS° = +110 J/(K · molrxn) = +0.110 kJ/(K · molrxn). ΔG° = ΔH° – TΔS° = 26 – (298)(0.110) = 26 – 32.78 = –6.78 kJ/molrxn.

(b) Yes, thermodynamically favorable at 298 K, since the calculated ΔG° is negative (–6.78 kJ/molrxn).

(c) Disagree. Forming NEW attractive forces (such as ion-dipole interactions during hydration) is always an EXOTHERMIC process (it releases energy), not an endothermic one — the claim has this backwards. If anything, the formation of ion-dipole interactions between NH4NO3's ions and water would contribute a negative (exothermic) term to ΔH°, opposing the observed positive value. The actual positive (endothermic) ΔH° is better explained by the energy required to break the strong ionic lattice attractions holding NH4NO3(s) together, which exceeds the energy released during hydration.`,
  },
];

/* ============================= 9.6 — Coupled Reactions (Episode #29) ============================= */
const t96 = [
  {
    title: 'Episode Review Q7 — Coupling Two Reactions to Produce Iron Through a Favorable Overall Process',
    content: `Reaction | Chemical Equation | ΔG° (kJ/molrxn)
1 | 2 Fe2O3(s) ⇌ 4 Fe(s) + 3 O2(g) | +742
2 | C(s) + O2(g) ⇌ CO2(g) | –394

The chemical equations for reactions 1 and 2 are listed in the table above. Which of the following choices provides the best representation of how reactions 1 and 2 can be coupled together in order to produce Fe(s) through a thermodynamically favorable process?

Chemical Equation for the Overall Reaction | ΔG° (kJ/molrxn)
(A) 4 Fe(s) + 6 O2(g) + 3 C(s) ⇌ 2 Fe2O3(s) + 3 CO2(g) | –1924
(B) 4 Fe(s) + 4 O2(g) + C(s) ⇌ 2 Fe2O3(s) + CO2(g) | –1136
(C) 2 Fe2O3(s) + 3 C(s) ⇌ 4 Fe(s) + 3 CO2(g) | –440
(D) 2 Fe2O3(s) + C(s) ⇌ 4 Fe(s) + 2 O2(g) + CO2(g) | +348`,
    answer: `(C). Reaction 1 (forward) produces the desired Fe(s), but releases 3 mol O2 as a byproduct and is itself unfavorable (+742 kJ/molrxn). To make the overall process favorable, all 3 mol of O2 produced must be fully consumed by reaction 2 (run 3 times, since reaction 2 consumes 1 mol O2 each time): 3 C(s) + 3 O2(g) → 3 CO2(g), ΔG° = 3 × (–394) = –1182 kJ/molrxn.

Adding reaction 1 + (3 × reaction 2): 2 Fe2O3(s) + 3 C(s) + 3 O2(g) → 4 Fe(s) + 3 O2(g) + 3 CO2(g). Canceling the 3 O2(g) (present on both sides): 2 Fe2O3(s) + 3 C(s) → 4 Fe(s) + 3 CO2(g).

ΔG°(overall) = 742 + (–1182) = –440 kJ/molrxn — matching option (C), which correctly produces Fe(s) as the desired product with a negative (favorable) overall ΔG°. (Options (A) and (B) produce Fe2O3 instead of consuming it — the wrong direction. Option (D) only couples with 1 unit of reaction 2 instead of the required 3, leaving 2 mol O2 unconsumed and an overall ΔG° that remains positive/unfavorable.)`,
  },
];

/* ============================= 9.7 — Galvanic (Voltaic) and Electrolytic Cells (Episode #30) ============================= */
const t97 = [
  {
    title: 'Episode Review Q1 — Writing the Anode Half-Reaction, Electron Flow, and Salt Bridge Ion Movement (Pb/Au Cell)',
    content: `A scientist constructs a standard galvanic cell with a Pb(s) electrode immersed in 1.0 M Pb(NO3)2(aq) and an Au(s) electrode immersed in 1.0 M Au(NO3)3(aq), connected by a KNO3(aq) salt bridge. The overall reaction that occurs in this cell is:

3 Pb(s) + 2 Au3+(aq) → 3 Pb2+(aq) + 2 Au(s)     E° = +2.46 V

(a) Write the balanced equation for the oxidation half-reaction that occurs at the anode.
(b) Describe the direction of electron flow in the wire.
(c) A solution of potassium nitrate, KNO3(aq), is used in the salt bridge. Describe the movement of the K+ and NO3– ions in the salt bridge as the cell begins to operate.
(d) As this galvanic cell operates, which electrode, aluminum... — correction, which electrode, lead (Pb) or gold (Au), will increase in mass? Justify your answer.`,
    answer: `(a) Pb(s) → Pb2+(aq) + 2 e– (this is the anode, since Pb is oxidized in the overall reaction).

(b) Electrons flow through the wire from the anode (Pb) to the cathode (Au), since electrons are released at the anode (where oxidation occurs) and travel to the cathode (where reduction occurs).

(c) K+ (cations) move through the salt bridge toward the cathode (the Au half-cell), since Au3+ is being consumed (reduced) there. NO3– (anions) move through the salt bridge toward the anode (the Pb half-cell), since Pb2+ is being produced (via oxidation) there.

(d) The gold (Au) electrode increases in mass. Since Au3+(aq) is reduced to Au(s) at the cathode, solid gold is deposited onto the Au electrode, increasing its mass. (The Pb electrode instead decreases in mass, since Pb(s) is oxidized and dissolves into solution as Pb2+.)`,
  },
  {
    title: 'Episode Review Q2 — Analyzing the Electrolysis of Molten Zinc Chloride',
    content: `An external direct-current power supply is connected to two graphite electrodes immersed in a container of molten zinc chloride, ZnCl2(l). As the cell operates, molten Zn is formed at one electrode, and Cl2 gas is produced at the other electrode.

Half-Reaction | E° (V)
Cl2 + 2 e– → 2 Cl– | 1.36
Zn2+ + 2 e– → Zn | –0.76

(a) Identify a specific item included in the setup for this electrochemical cell that supports the fact that this chemical reaction is not thermodynamically favored.
(b) Calculate the value of the standard cell potential (E°), in units of volts, for the chemical reaction that occurs in this electrochemical cell. Show your calculations.
(c) Write the balanced net ionic equation for the chemical reaction that occurs in this cell.
(d) Describe the direction of electron flow in the wire as this cell operates.
(e) Based on your answer to part (b), would an applied voltage of 1.4 V be sufficient for the reaction to occur? Justify your answer.`,
    answer: `(a) The external direct-current power supply. An electrolytic cell always requires an external power source to force an otherwise nonspontaneous (thermodynamically unfavorable) reaction to occur — a galvanic (spontaneous) cell would not need one.

(b) Since Zn(l) forms (reduction) and Cl2(g) forms (oxidation, reverse of the given reduction): E°cell = E°(cathode) – E°(anode, as reduction reference) = E°(Zn2+/Zn) – E°(Cl2/Cl–) = (–0.76) – (1.36) = –2.12 V.

(c) Zn2+(l) + 2 Cl–(l) → Zn(l) + Cl2(g)

(d) Electrons flow through the wire from the anode (the electrode where Cl2 forms, oxidation) through the power source to the cathode (the electrode where Zn forms, reduction).

(e) No. Since E°cell = –2.12 V, the applied voltage must be at least 2.12 V in magnitude to force this nonspontaneous reaction to occur. Since 1.4 V < 2.12 V, it would NOT be sufficient.`,
  },
];

/* ============================= 9.8 — Cell Potential and Free Energy (Episode #30) ============================= */
const t98 = [
  {
    title: 'Episode Review Q3 — Calculating E° and ΔG° for a Standard Ag/Zn Galvanic Cell',
    content: `Half-Reaction | E° (V)
Ag+(aq) + e– → Ag(s) | +0.80
Zn2+(aq) + 2 e– → Zn(s) | –0.76

The standard reduction potentials of the half-reactions associated with a galvanic cell are listed in the table above. Which of the following shows the correct values for the cell potential (E°) and the Gibbs free energy change (ΔG°) for the overall reaction that occurs in this standard galvanic cell?

E° (V) | ΔG° (kJ/molrxn)
(A) +2.36 | –455
(B) +1.56 | –301
(C) +2.36 | –228
(D) +1.56 | –151`,
    answer: `(B). Since Ag+/Ag has the higher E°, Ag+ is reduced (cathode) and Zn is oxidized (anode). Balancing electrons (LCM = 2): Zn → Zn2+ + 2e–, and 2 Ag+ + 2e– → 2 Ag. E°cell = E°(cathode) – E°(anode) = 0.80 – (–0.76) = 1.56 V.

n = 2 electrons transferred. ΔG° = –nFE° = –(2)(96,485 C/mol)(1.56 V) = –301,073 J/mol ≈ –301 kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q4 — Full Analysis of a Cu/Pb Cell and Identifying an Error in a Voltage Calculation (Au/Be)',
    content: `Table 1 — Half-Reaction | E° (V)
Au3+(aq) + 3 e– → Au(s) | +1.50
Cu2+(aq) + 2 e– → Cu(s) | +0.34
Pb2+(aq) + 2 e– → Pb(s) | –0.13
Be2+(aq) + 2 e– → Be(s) | –1.85

A student constructs a standard galvanic cell using electrodes of Cu(s) and Pb(s), with 1.0 M Cu(NO3)2(aq) and 1.0 M Pb(NO3)2(aq).

(a)(i) Write the balanced net ionic equation for the overall reaction that occurs in the galvanic cell.
(a)(ii) Determine the value of the standard voltage, E°, for this galvanic cell.
(b) As the galvanic cell runs over time, it is observed that the Pb(s) electrode decreases in mass. Where does the mass go?

The student wants to design a galvanic cell that would produce a greater voltage, using Au(s) and Be(s). The correct balanced net ionic equation is:

Equation 1: 2 Au3+(aq) + 3 Be(s) → 2 Au(s) + 3 Be2+(aq)

The student set up the following (incorrect) calculation: E° = (1.50 V)(2) + (1.85 V)(3) = 8.55 V

(c) The student's answer of +8.55 V is incorrect. Identify the error in the set-up for the student's calculation that explains why the calculated value for E° is incorrect.
(d) Calculate the value of the standard voltage, E°, for the reaction represented by Equation 1. Show the correct set-up for the calculation.
(e) Calculate the value of the standard free energy change, ΔG°, (in kJ/molrxn) for the reaction represented by Equation 1.`,
    answer: `(a)(i) Since Cu2+/Cu has the higher E° (+0.34 vs. –0.13), Cu2+ is reduced (cathode) and Pb is oxidized (anode): Pb(s) + Cu2+(aq) → Pb2+(aq) + Cu(s).

(a)(ii) E° = E°(cathode) – E°(anode) = 0.34 – (–0.13) = 0.47 V.

(b) The mass goes into the solution, as dissolved Pb2+(aq) ions — Pb(s) is oxidized at the anode (Pb → Pb2+ + 2e–), so the solid lead atoms leave the electrode and enter the solution as aqueous ions.

(c) The student incorrectly (1) multiplied each E° value by its stoichiometric coefficient (E° should never be scaled by the number of electrons or the reaction coefficients — it is an intensive property), and (2) simply ADDED both given reduction potentials, rather than correctly identifying the cathode and anode and subtracting: E°cell = E°(cathode) – E°(anode, as reduction reference).

(d) Au3+/Au has the higher E° (reduced, cathode): +1.50 V. Be is oxidized (anode), using its reduction value (–1.85 V) as the reference. E°cell = E°(cathode) – E°(anode) = 1.50 – (–1.85) = 3.35 V.

(e) n = 6 electrons transferred (from the balanced equation: 2 Au3+ needs 2×3 = 6 e–, matching 3 Be needing 3×2 = 6 e–). ΔG° = –nFE° = –(6)(96,485 C/mol)(3.35 V) = –1,939,148 J/mol ≈ –1.94 × 10³ kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q5 — Identifying an Error in Combining Half-Reactions and Finding the Most Favorable Reaction',
    content: `Half-Reaction | E° (V)
1. Ag+(aq) + e– → Ag(s) | +0.80
2. Cu2+(aq) + 2 e– → Cu(s) | +0.34
3. Cd2+(aq) + 2 e– → Cd(s) | –0.40
4. Cr3+(aq) + 3 e– → Cr(s) | –0.74

(a) A student used the values of E° for half-reactions 1 and 2 to calculate the cell potential for a standard galvanic cell with electrodes of Ag(s) and Cu(s). The student incorrectly calculates the value of the cell potential as follows: E° = 0.80 + 0.34 = 1.14 V.
(i) Explain why the student's calculated value of 1.14 V is incorrect.
(ii) Calculate the correct value of E° for a standard galvanic cell based on half-reactions 1 and 2.
(b) Based on the half-reactions given in the table, write the balanced net ionic equation for the reaction that has the greatest thermodynamic favorability.
(c) Calculate the value of E° for the reaction represented by the equation you wrote in part (b).`,
    answer: `(a)(i) The student simply added both given reduction potentials together, instead of correctly identifying which half-reaction is the cathode (reduction, kept as written) and which is the anode (oxidation, requiring the reduction potential to be used as a subtracted reference value): E°cell = E°(cathode) – E°(anode), not E°(cathode) + E°(anode).

(ii) Since Ag+/Ag has the higher E°, Ag+ is reduced (cathode) and Cu is oxidized (anode): E°cell = 0.80 – 0.34 = 0.46 V.

(b) The reaction with the greatest thermodynamic favorability (greatest E°) pairs the strongest oxidizing agent (highest E°, Ag+, reduced) with the strongest reducing agent (most negative E°, Cr, oxidized). Balancing electrons (LCM = 3): 3 Ag+ + 3e– → 3 Ag, and Cr → Cr3+ + 3e–. Net ionic equation: Cr(s) + 3 Ag+(aq) → Cr3+(aq) + 3 Ag(s).

(c) E°cell = E°(cathode) – E°(anode) = 0.80 – (–0.74) = 1.54 V.`,
  },
  {
    title: "Episode Review Q6 — Finding an Unknown Half-Reaction's E° from a Given Overall Reaction",
    content: `Reaction | E° (V)
Ag+(aq) + e– → Ag(s) | +0.80
2 Ag+(aq) + Pb(s) → 2 Ag(s) + Pb2+(aq) | +0.67

According to the information shown above, what is the value of E° for the following half-reaction?

Pb2+(aq) + 2 e– → Pb(s)     E° = ?

(A) –0.93 V
(B) –0.13 V
(C) +0.13 V
(D) +0.93 V`,
    answer: `(C). In the given overall reaction, Ag+ is reduced (cathode, E° = +0.80 V) and Pb is oxidized (anode). Using E°cell = E°(cathode) – E°(anode): 0.67 = 0.80 – E°(Pb2+/Pb). Solving: E°(Pb2+/Pb) = 0.80 – 0.67 = +0.13 V.`,
  },
  {
    title: 'Episode Review Q7 — Writing and Analyzing an Electroplating Half-Reaction Combination (Chromium Plating)',
    content: `A chemist performs an electroplating experiment in which a metal object is plated with a layer of chromium metal. Solid chromium, Cr(s), is deposited onto the surface of the metal from an acidified solution of Cr2(SO4)3(aq). Oxygen gas is also produced during this process.

Half-Reaction | E° (V)
Cr3+(aq) + 3 e– → Cr(s) | –0.74
O2(g) + 4 H+(aq) + 4 e– → 2 H2O(l) | +1.23

(a) Write the balanced net ionic equation for the reaction in which Cr(s) is plated onto the surface of the metal object.
(b) Calculate the value of E° for the reaction in part (a).
(c) Based on your answer to part (b), explain why this process requires the use of an external power source.`,
    answer: `(a) Cr(s) is plated (reduced, cathode); O2(g) is produced (meaning water is oxidized, reverse of the given reduction, anode). Balancing electrons (LCM of 3 and 4 = 12): 4 Cr3+ + 12e– → 4 Cr (×4), and 6 H2O → 3 O2 + 12 H+ + 12e– (×3, reversed).

Net ionic equation: 4 Cr3+(aq) + 6 H2O(l) → 4 Cr(s) + 3 O2(g) + 12 H+(aq).

(b) E°cell = E°(cathode) – E°(anode) = E°(Cr3+/Cr) – E°(O2/H2O) = (–0.74) – (1.23) = –1.97 V.

(c) Since E°cell is negative (–1.97 V), this reaction is not thermodynamically favored (it is nonspontaneous) — an external power source is required to force the reaction to proceed, which is the defining characteristic of an electrolytic cell.`,
  },
  {
    title: 'Episode Review Q8 — Determining ΔG° and Keq Sign from E° (Zn/Cu)',
    content: `Half-Reaction | E° (V)
Zn2+(aq) + 2 e– → Zn(s) | –0.76
Cu2+(aq) + 2 e– → Cu(s) | +0.34

Which of the following is true for the reaction represented by the equation shown below?

Zn(s) + Cu2+(aq) → Zn2+(aq) + Cu(s)

(A) ΔG° < 0 and Keq < 1
(B) ΔG° < 0 and Keq > 1
(C) ΔG° > 0 and Keq < 1
(D) ΔG° > 0 and Keq > 1`,
    answer: `(B). E°cell = E°(Cu2+/Cu) – E°(Zn2+/Zn) = 0.34 – (–0.76) = +1.10 V (positive). A positive E° corresponds to a thermodynamically favored reaction, meaning ΔG° < 0 and Keq > 1.`,
  },
  {
    title: 'Episode Review Q9 — Predicting Whether a Reaction Occurs Based on E° (Cu Strip in Zn(NO3)2)',
    content: `Half-Reaction | E° (V)
Zn2+(aq) + 2 e– → Zn(s) | –0.76
Cu2+(aq) + 2 e– → Cu(s) | +0.34

A student added a strip of Cu(s) to a beaker containing 1.0 M Zn(NO3)2(aq). After 30 minutes, the student examined the strip of Cu(s), looking for evidence of a chemical reaction. Which of the following provides the most likely description of the student's observation and provides a valid justification?

Student's Observation | Justification
(A) The surface of the copper is clean, with no visible evidence of a chemical reaction. | The reaction between Cu(s) and Zn2+(aq) has a cell potential, E°, that is negative.
(B) The surface of the copper is clean, with no visible evidence of a chemical reaction. | The reaction between Cu(s) and Zn2+(aq) has a cell potential, E°, that is positive.
(C) A residue of dark solid appears on the surface of the copper, indicating that a chemical reaction has occurred. | The reaction between Cu(s) and Zn2+(aq) has a cell potential, E°, that is negative.
(D) A residue of dark solid appears on the surface of the copper, indicating that a chemical reaction has occurred. | The reaction between Cu(s) and Zn2+(aq) has a cell potential, E°, that is positive.`,
    answer: `(A). For Cu(s) to react with Zn2+(aq) (Cu + Zn2+ → Cu2+ + Zn), Zn2+ would need to be reduced (cathode) and Cu oxidized (anode): E°cell = E°(Zn2+/Zn) – E°(Cu2+/Cu) = (–0.76) – (0.34) = –1.10 V (negative). Since E° is negative, this reaction is NOT thermodynamically favored and will not occur — the copper strip's surface should remain clean, with no visible reaction.`,
  },
  {
    title: 'Episode Review Q10 — Determining the Minimum Applied Voltage for an Electrolytic Cell from ΔG°',
    content: `2 Cu2+(aq) + 2 H2O(l) → 2 Cu(s) + O2(g) + 4 H+(aq)     ΔG° = 340 kJ/molrxn

What is the approximate minimum voltage that must be supplied to a 1.0 M solution of Cu(NO3)2(aq) to produce Cu(s) according to the reaction above?

(A) 0.0035 V
(B) 0.88 V
(C) 1.8 V
(D) 3.5 V`,
    answer: `(B). n = 4 electrons transferred (from the equation: forming 1 mol O2 requires 4 e–, matching 2 mol Cu2+ requiring 2×2 = 4 e– for reduction). Using ΔG° = –nFE°: E° = –ΔG°/(nF) = –(340,000 J/mol) / [(4)(96,485 C/mol)] = –340,000/385,940 = –0.881 V.

Since E° is negative (as expected for this unfavorable, electrolytic process), the minimum voltage that must be externally APPLIED is at least the magnitude of E°, approximately 0.88 V.`,
  },
];

/* ============================= 9.9 — Cell Potential Under Nonstandard Conditions (Episode #31) ============================= */
const t99 = [
  {
    title: 'Episode Review Q1 — Predicting the Effect of Precipitate Formation on Cell Potential (Pb/Au Cell)',
    content: `A standard galvanic cell is constructed with Pb(s) and Au(s) electrodes. The overall reaction is:

3 Pb(s) + 2 Au3+(aq) → 3 Pb2+(aq) + 2 Au(s)     E° = +1.63 V

Under standard conditions, E° = +1.63 V. A small amount of K2CO3(aq) is added to the Pb half-cell, and a white precipitate (PbCO3) is formed. The observed cell potential changes slightly. Which of the following correctly describes how the cell potential, E, is affected by the addition of K2CO3(aq) to the Pb half-cell and provides a valid justification?

(A) The value of E is less than 1.63 V because the reaction quotient, Q, decreases.
(B) The value of E is less than 1.63 V because the reaction quotient, Q, increases.
(C) The value of E is greater than 1.63 V because the reaction quotient, Q, decreases.
(D) The value of E is greater than 1.63 V because the reaction quotient, Q, increases.`,
    answer: `(C). Adding K2CO3 causes Pb2+(aq) + CO3²–(aq) → PbCO3(s), removing Pb2+ (a PRODUCT of the cell reaction) from solution. Since Q = [Pb2+]³/[Au3+]², decreasing [Pb2+] decreases Q (moving the system further from equilibrium than standard conditions, where Q was 1). Since Q < 1 (further from equilibrium than standard conditions), the cell potential E is GREATER than E° (per the relationship: further from equilibrium → larger magnitude of E).`,
  },
  {
    title: 'Episode Review Q2 — Calculating E° and Q for an Al/Zn Cell with Modified Concentration',
    content: `A student sets up a standard galvanic cell with an aluminum electrode in 1.0 M Al(NO3)3(aq) and a zinc electrode in 1.0 M Zn(NO3)2(aq).

Half-Reaction | E° (V)
Al3+(aq) + 3 e– → Al(s) | –1.66
Zn2+(aq) + 2 e– → Zn(s) | –0.76

(a) Write the balanced net ionic equation for the reaction that occurs as this galvanic cell operates.
(b) Calculate the value of the standard cell potential, E°, for the reaction that occurs as this cell begins to operate.

The student sets up a second galvanic cell, identical to the first, except the initial [Zn2+] in the Zn half-cell is changed:

Initial [Al3+] | Initial [Zn2+]
Galvanic Cell #1: 1.0 M | 1.0 M
Galvanic Cell #2: 1.0 M | 0.50 M

(c) Calculate the value of the reaction quotient, Q, for galvanic cell #2 at the moment the cell begins to operate.
(d) Based on the value of Q calculated in part (c), is the cell potential for galvanic cell #2 less than, greater than, or equal to the value of E° calculated in part (b)? Justify your answer.`,
    answer: `(a) Since Zn2+/Zn has the higher E°, Zn2+ is reduced (cathode) and Al is oxidized (anode). Balancing electrons (LCM = 6): 2 Al(s) → 2 Al3+(aq) + 6 e–, and 3 Zn2+(aq) + 6 e– → 3 Zn(s). Net ionic equation: 2 Al(s) + 3 Zn2+(aq) → 2 Al3+(aq) + 3 Zn(s).

(b) E° = E°(cathode) – E°(anode) = (–0.76) – (–1.66) = 0.90 V.

(c) Q = [Al3+]²/[Zn2+]³ = (1.0)²/(0.50)³ = 1.0/0.125 = 8.0.

(d) Less than E° (0.90 V). Since Q (8.0) is greater than 1 (the standard-conditions value), the system in cell #2 is closer to equilibrium than standard conditions — and being closer to equilibrium means a smaller driving force, so the cell potential E is less than E°.`,
  },
  {
    title: 'Episode Review Q3 — Effect of Electrode Size on Cell Potential (Cu/Zn)',
    content: `A standard galvanic cell is constructed with Cu(s) and Zn(s), with a standard cell potential, E°, of +1.10 V. A second standard galvanic cell is set up with conditions identical to the first cell, except that the Cu(s) electrode has a larger mass than the Cu(s) electrode used in the first galvanic cell.

Do you predict that the measured cell potential in the second galvanic cell should be less than, greater than, or equal to 1.10 V? Justify your answer.`,
    answer: `Equal to 1.10 V. Cu(s) is a pure solid, and pure solids are never included in the reaction quotient (Q) expression — only the aqueous ion concentrations ([Cu2+] and [Zn2+]) affect Q. Since changing the mass (amount) of the solid Cu electrode does not change Q, it has no effect on the cell potential, E. The measured cell potential remains equal to 1.10 V.`,
  },
];

/* ============================= 9.10 — Electrolysis and Faraday's Laws (Episode #31) ============================= */
const t910 = [
  {
    title: "Episode Review Q4 — Minimum Voltage and Time Calculation for PbBr2 Electrolysis (Faraday's Law)",
    content: `PbBr2(l) → Pb(l) + Br2(g)

Molten lead bromide, PbBr2(l), is electrolyzed using an external power supply and inert electrodes. Liquid lead metal and bromine gas are produced according to the equation shown above.

Half-Reaction | E° (V)
Pb2+ + 2 e– → Pb | –0.13
Br2 + 2 e– → 2 Br– | +1.07

(a) Calculate the minimum value of voltage that must be applied for the electrolysis reaction to occur.
(b) If the current in the cell is kept at a constant 4.00 ampere, how many seconds does it take to produce 3.00 g of Pb(l) at the cathode?`,
    answer: `(a) Pb2+ is reduced (cathode, forming Pb); Br– is oxidized (anode, forming Br2, reverse of the given reduction). E°cell = E°(cathode) – E°(anode) = (–0.13) – (1.07) = –1.20 V. Since electrolytic (nonspontaneous), the minimum applied voltage (in magnitude) required is 1.20 V.

(b) Moles Pb = 3.00 g / 207.2 g/mol = 0.01448 mol. Moles e– needed (2 mol e– per mol Pb) = 2 × 0.01448 = 0.02896 mol. Charge q = moles e– × F = 0.02896 mol × 96,485 C/mol = 2794.6 C. Time = q/I = 2794.6 C / 4.00 A = 699 s.`,
  },
  {
    title: "Episode Review Q5 — Net Ionic Equation and Average Current for Copper Electrolysis (Faraday's Law)",
    content: `An external direct-current power supply is connected to two platinum electrodes immersed in a beaker containing 1.0 M Cu(NO3)2(aq). As the cell operates, Cu(s) is deposited onto one electrode, and O2(g) is produced at the other electrode.

Half-Reaction | E° (V)
O2(g) + 4 H+(aq) + 4 e– → 2 H2O(l) | +1.23
Cu2+(aq) + 2 e– → Cu(s) | +0.34

(a) Write a balanced net ionic equation for the electrolysis reaction that occurs in the cell.
(b) Calculate the average current, in C/s, that must flow through the cell to produce 1.25 g of Cu(s) in 1680 seconds.`,
    answer: `(a) Cu2+ is reduced (cathode); water is oxidized (anode, forming O2, reverse of the given reduction). Balancing electrons (LCM of 2 and 4 = 4): 2 Cu2+ + 4e– → 2 Cu (×2), and 2 H2O → O2 + 4 H+ + 4e– (as given).

Net ionic equation: 2 Cu2+(aq) + 2 H2O(l) → 2 Cu(s) + O2(g) + 4 H+(aq).

(b) Moles Cu = 1.25 g / 63.55 g/mol = 0.01967 mol. Moles e– needed (2 mol e– per mol Cu) = 2 × 0.01967 = 0.03934 mol. Charge q = 0.03934 mol × 96,485 C/mol = 3795.3 C. Average current = q/t = 3795.3 C / 1680 s = 2.26 C/s.`,
  },
  {
    title: "Episode Review Q6 — Calculating Mass Deposited in an Electroplating Experiment (Faraday's Law)",
    content: `Au(CN)4–(aq) + 3 e– → Au(s) + 4 CN–(aq)

An electroplating experiment is performed in which a bronze coin is immersed in a solution containing Au(CN)4–(aq). Electricity is passed through the solution, and a thin layer of solid gold, Au(s), is deposited onto the surface of the coin according to the reaction shown above. A constant current of 5.00 A is applied to the cell for a period of 925 seconds.

Calculate the mass of Au(s) that should be deposited on the surface of the coin during the experiment.`,
    answer: `Charge q = I × t = 5.00 A × 925 s = 4625 C. Moles e– = q/F = 4625 C / 96,485 C/mol = 0.04794 mol. Since 3 mol e– is required per 1 mol Au (from the half-reaction), moles Au = 0.04794 / 3 = 0.01598 mol. Mass Au = 0.01598 mol × 196.97 g/mol = 3.15 g.`,
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
    source: 'Episode Review',
    ...(q.resolvedImageUrl ? { image_url: q.resolvedImageUrl } : {}),
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    console.log('Uploading images...');
    const imgMap = {};
    imgMap['q4_diagram'] = await uploadImage('ep28_q4_particles.png', 'ep28-q4-entropy-particle-diagrams.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t91) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('9.1', t91);
    await insertTopic('9.2', t92);
    await insertTopic('9.3', t93);
    await insertTopic('9.4', t94);
    await insertTopic('9.5', t95);
    await insertTopic('7.14', t714);
    await insertTopic('9.6', t96);
    await insertTopic('9.7', t97);
    await insertTopic('9.8', t98);
    await insertTopic('9.9', t99);
    await insertTopic('9.10', t910);
    console.log('Done — Unit 9 Episode Review (Episodes #28-31) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
