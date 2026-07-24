const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '7.11': '67b58ec6-c8c9-4fdd-8bb8-b00f0c102fa4',
  '7.12': '058942dc-79fe-44ce-ad41-bc029ca5893e',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/u712imgs';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.11-7.12/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 7.11 — Introduction to Solubility Equilibria ============================= */
const t711 = [
  {
    title: 'Q1 — Writing Dissolution Equations and Ksp Expressions for Five Salts',
    content: `Fill in the missing information in the table below (write the equation for the dissolution of the solid, and the Ksp expression).

Name and Formula: silver chloride, AgCl
Name and Formula: lead(II) iodide, PbI2
Name and Formula: silver chromate, Ag2CrO4
Name and Formula: chromium(III) hydroxide, Cr(OH)3
Name and Formula: magnesium phosphate, Mg3(PO4)2`,
    answer: `silver chloride: AgCl(s) ⇌ Ag+(aq) + Cl-(aq)     Ksp = [Ag+][Cl-]

lead(II) iodide: PbI2(s) ⇌ Pb2+(aq) + 2 I-(aq)     Ksp = [Pb2+][I-]^2

silver chromate: Ag2CrO4(s) ⇌ 2 Ag+(aq) + CrO4^2-(aq)     Ksp = [Ag+]^2[CrO4^2-]

chromium(III) hydroxide: Cr(OH)3(s) ⇌ Cr3+(aq) + 3 OH-(aq)     Ksp = [Cr3+][OH-]^3

magnesium phosphate: Mg3(PO4)2(s) ⇌ 3 Mg2+(aq) + 2 PO4^3-(aq)     Ksp = [Mg2+]^3[PO4^3-]^2`,
  },
  {
    title: 'Q2 — Molar Solubility and Solubility of Ca(OH)2',
    content: `Answer the following questions related to the solubility of calcium hydroxide, Ca(OH)2.

(a) Write a balanced chemical equation for the dissolution of Ca(OH)2(s) in pure water.
(b) The value of Ksp for Ca(OH)2 is 5.0 x 10^-6 at 25°C. Calculate the molar solubility of Ca(OH)2 in water at 25°C.
(c) Calculate the solubility of Ca(OH)2 in water at 25°C in units of grams per liter.

A beaker contains 100 mL of a saturated solution of Ca(OH)2(aq) at 25°C with a small amount of undissolved Ca(OH)2(s) present at the bottom of the beaker. The beaker is warmed gently, and some of the water evaporates so that the volume of the solution decreases to 75 mL. The beaker is allowed to sit at room temperature until the temperature returns to 25°C.

(d) Is the value of [Ca2+] in the 75 mL sample of solution less than, greater than, or equal to the value of [Ca2+] in the original 100 mL sample of solution? Justify your answer.

A different beaker contains 75 mL of a saturated solution of Ca(OH)2(aq) at 25°C with a small amount of undissolved Ca(OH)2(s) at the bottom. Water is added to the beaker, and the mixture is stirred thoroughly. The volume of the solution increases to 100 mL. A small amount of undissolved Ca(OH)2(s) is present at the bottom of the beaker.

(e) Is the value of [Ca2+] in the 100 mL sample of solution less than, greater than, or equal to the value of [Ca2+] in the 75 mL sample of solution? Justify your answer.`,
    answer: `(a) Ca(OH)2(s) ⇌ Ca2+(aq) + 2 OH-(aq)

(b) Let x = molar solubility of Ca(OH)2. Then [Ca2+] = x and [OH-] = 2x. Ksp = [Ca2+][OH-]^2 = (x)(2x)^2 = 4x^3.

5.0 x 10^-6 = 4x^3

x^3 = 1.25 x 10^-6

x = (1.25 x 10^-6)^(1/3) = 0.01077 ≈ 1.1 x 10^-2 M.

(c) Solubility in g/L = molar solubility x molar mass. Molar mass of Ca(OH)2 = 40.08 + 2(16.00+1.01) = 40.08 + 34.02 = 74.10 g/mol.

Solubility = (1.077 x 10^-2 mol/L)(74.10 g/mol) = 0.798 g/L ≈ 0.80 g/L.

(d) Equal to. Since the solution is saturated both before and after evaporation (undissolved solid Ca(OH)2 is present at the bottom in both cases, and the temperature is the same, 25°C), the concentration of Ca2+ in a saturated solution is fixed by the value of Ksp at that temperature — it does not depend on the total volume of solution, as long as excess solid is present and equilibrium is maintained. So [Ca2+] remains the same (the solution simply has less total volume, with the same saturated concentration).

(e) Equal to. By the same reasoning as part (d): since both the 75 mL and the 100 mL samples are saturated solutions (undissolved Ca(OH)2(s) is present in both) at the same temperature (25°C), the equilibrium concentration of Ca2+ is fixed by Ksp and does not change with volume — so [Ca2+] remains the same after diluting with water, as long as excess solid remains present to maintain saturation.`,
  },
  {
    title: 'Q3 — Determining Ksp for Ag2CO3 from Solubility Data',
    content: `Answer the following questions related to the solubility of silver carbonate, Ag2CO3.

(a) Write a balanced chemical equation for the dissolution of Ag2CO3(s) in pure water.
(b) The solubility of Ag2CO3 in water at 25°C is 0.035 g/L. Calculate the molar solubility of Ag2CO3 in water at 25°C.
(c) Calculate the value of Ksp for Ag2CO3 at 25°C.`,
    answer: `(a) Ag2CO3(s) ⇌ 2 Ag+(aq) + CO3^2-(aq)

(b) Molar mass of Ag2CO3 = 2(107.87) + 12.01 + 3(16.00) = 215.74 + 12.01 + 48.00 = 275.75 g/mol.

Molar solubility = (0.035 g/L) / (275.75 g/mol) = 1.269 x 10^-4 mol/L ≈ 1.3 x 10^-4 M.

(c) Let x = molar solubility = 1.269 x 10^-4 M. Then [Ag+] = 2x and [CO3^2-] = x.

Ksp = [Ag+]^2[CO3^2-] = (2x)^2(x) = 4x^3 = 4(1.269 x 10^-4)^3 = 4(2.043 x 10^-12) = 8.17 x 10^-12 ≈ 8.2 x 10^-12.`,
  },
  {
    title: 'Q4 — Comparing Molar Solubility from Ksp Values (CaF2, SrF2, BaF2)',
    content: `Compound | CaF2 | SrF2 | BaF2
Ksp at 25°C | 3.9 x 10^-11 | 4.3 x 10^-9 | 1.8 x 10^-7

Saturated solutions of each compound listed in the table above were prepared at 25°C. Use the information in the table above to answer the following questions.

(a) Which compound has the smallest value for molar solubility in water at 25°C? Justify your answer.
(b) Calculate the value of [F-] (in mol/L) in a saturated solution of the compound that you selected in part (a).`,
    answer: `(a) CaF2 has the smallest molar solubility. For each compound MF2, Ksp = [M2+][F-]^2 = (x)(2x)^2 = 4x^3, where x = molar solubility. Solving for x: x = (Ksp/4)^(1/3). Since all three compounds have the same stoichiometry (1:2 ratio of cation to fluoride), the compound with the smallest Ksp will have the smallest molar solubility (x is a monotonically increasing function of Ksp for this common stoichiometric pattern). Since CaF2 has the smallest Ksp (3.9 x 10^-11) among the three, it has the smallest molar solubility.

(b) For CaF2: 4x^3 = 3.9 x 10^-11, so x^3 = 9.75 x 10^-12, so x = (9.75 x 10^-12)^(1/3) = 2.14 x 10^-4 M (molar solubility).

[F-] = 2x = 2(2.14 x 10^-4) = 4.28 x 10^-4 M ≈ 4.3 x 10^-4 M.`,
  },
  {
    title: 'Q5 — Comparing [CrO4^2-] Between Two Compounds with Different Stoichiometry',
    content: `Compound | Ag2CrO4 | BaCrO4
Ksp at 25°C | 1.1 x 10^-12 | 1.2 x 10^-10
[CrO4^2-] in a saturated solution at 25°C | ? | ?

Saturated solutions of each compound listed in the table above were prepared at 25°C. Use the information in the table above to answer the following questions.

(a) Without doing any calculations, predict which solution contains a higher concentration of CrO4^2-(aq).
(b) Check to see if the prediction you made in part (a) is correct by calculating the value of [CrO4^2-] (in mol/L) for saturated solutions of Ag2CrO4 and BaCrO4.`,
    answer: `(a) This cannot be reliably predicted "without calculation" from the Ksp values alone, because the two compounds have DIFFERENT stoichiometric ratios (Ag2CrO4 is a 2:1 salt, while BaCrO4 is a 1:1 salt) — a larger Ksp does not necessarily mean a larger solubility (or ion concentration) when the stoichiometries differ. A reasonable initial guess might favor BaCrO4 since its Ksp (1.2 x 10^-10) is roughly 100 times larger than Ag2CrO4's Ksp (1.1 x 10^-12), but this must be checked with an actual calculation in part (b), since the exponents in the Ksp expressions differ between the two compounds.

(b) For Ag2CrO4: Ksp = [Ag+]^2[CrO4^2-] = (2x)^2(x) = 4x^3, where x = [CrO4^2-] = molar solubility.

4x^3 = 1.1 x 10^-12

x^3 = 2.75 x 10^-13

x = (2.75 x 10^-13)^(1/3) = 6.5 x 10^-5 M.

For BaCrO4: Ksp = [Ba2+][CrO4^2-] = (x)(x) = x^2, where x = [CrO4^2-] = molar solubility.

x^2 = 1.2 x 10^-10

x = (1.2 x 10^-10)^(1/2) = 1.1 x 10^-5 M.

Comparing: Ag2CrO4 gives [CrO4^2-] = 6.5 x 10^-5 M, while BaCrO4 gives [CrO4^2-] = 1.1 x 10^-5 M. So Ag2CrO4 actually has the HIGHER [CrO4^2-] — the opposite of what the larger raw Ksp value for BaCrO4 might have suggested, confirming that Ksp values cannot be directly compared between compounds with different stoichiometric ratios.`,
  },
  {
    title: 'Q6 — Determining Whether BaSO4 Precipitates from Mixed Solutions',
    content: `Answer the following questions about the reaction between Na2SO4(aq) and Ba(NO3)2(aq).

(a) A student adds an excess amount of Na2SO4(aq) to a solution of Ba(NO3)2(aq), resulting in the formation of a precipitate. Write the net ionic equation for the reaction that occurred in this experiment.

In a separate experiment, a 200.0 mL sample of 3.0 x 10^-6 M Ba(NO3)2(aq) is added to a 150.0 mL sample of 2.0 x 10^-5 M Na2SO4(aq). The mixture is stirred to ensure that it is thoroughly mixed.

(b) Calculate the number of moles of Ba2+(aq) present in 200.0 mL of 3.0 x 10^-6 M Ba(NO3)2(aq).
(c) Calculate the number of moles of SO4^2-(aq) present in 150.0 mL of 2.0 x 10^-5 M Na2SO4(aq).
(d) The volume of the mixture formed in this experiment is 350.0 mL. Calculate the initial concentrations of Ba2+(aq) and SO4^2-(aq) in the mixture at the moment that the two solutions are combined, but before any chemical reaction occurs.
(e) Use your answers to part (d) to calculate the value of the reaction quotient (Qsp) for BaSO4.
(f) The value of Ksp for BaSO4 at 25°C is 1.1 x 10^-10. Will a precipitate of BaSO4(s) be formed in this experiment? Justify your answer by comparing Qsp with Ksp. Assume that the temperature of the mixture is 25°C.`,
    answer: `(a) Ba2+(aq) + SO4^2-(aq) → BaSO4(s)

(b) Moles Ba2+ = (3.0 x 10^-6 mol/L)(0.2000 L) = 6.0 x 10^-7 mol.

(c) Moles SO4^2- = (2.0 x 10^-5 mol/L)(0.1500 L) = 3.0 x 10^-6 mol.

(d) [Ba2+] initial (in combined mixture) = (6.0 x 10^-7 mol) / (0.3500 L) = 1.714 x 10^-6 M ≈ 1.7 x 10^-6 M.

[SO4^2-] initial (in combined mixture) = (3.0 x 10^-6 mol) / (0.3500 L) = 8.571 x 10^-6 M ≈ 8.6 x 10^-6 M.

(e) Qsp = [Ba2+][SO4^2-] = (1.714 x 10^-6)(8.571 x 10^-6) = 1.469 x 10^-11 ≈ 1.5 x 10^-11.

(f) No, a precipitate will not form. Since Qsp (1.5 x 10^-11) is less than Ksp (1.1 x 10^-10), the solution is unsaturated with respect to BaSO4 — there are not enough ions present to exceed the solubility limit, so no precipitate forms.`,
  },
  {
    title: 'Q7 — Identifying an Error in a Particle Diagram and Calculating Ksp for Sr(OH)2',
    imageKey: 'srohdiagram',
    content: `Sr(OH)2(s) ⇌ Sr2+(aq) + 2 OH-(aq)     Ksp = [Sr2+][OH-]^2 at 25°C

(a) A student draws the particulate diagram shown to represent the ions present in an aqueous solution of Sr(OH)2. (Water molecules are intentionally omitted.) The diagram shows 4 Sr2+ ions (gray circles) and 4 OH- ions (white circles) scattered throughout the container. Identify the error in the student's drawing.
(b) The student prepares a saturated solution of Sr(OH)2 by adding excess Sr(OH)2(s) to distilled water at 25°C and stirring until no more solid dissolves. The student then determines that [Sr2+] = 0.043 M in the solution.
   (i) Calculate the value of [OH-] in the solution.
   (ii) Calculate the value of Ksp for Sr(OH)2 at 25°C.
(c) The student prepares a second saturated solution of Sr(OH)2 in aqueous 0.10 M Sr(NO3)2 instead of distilled water. Will the value of [OH-] in the second solution be greater than, less than, or equal to the value in the first solution? Justify your answer. Assume that the temperature remains constant at 25°C.`,
    answer: `(a) The error is that the diagram shows an equal number of Sr2+ and OH- ions (4 of each, a 1:1 ratio). Based on the dissolution equation, Sr(OH)2(s) ⇌ Sr2+(aq) + 2 OH-(aq), each formula unit of Sr(OH)2 that dissolves produces 1 Sr2+ ion but 2 OH- ions — so the correct diagram should show TWICE as many OH- ions as Sr2+ ions (a 1:2 ratio), not an equal (1:1) number of each.

(b) (i) Since each Sr(OH)2 that dissolves produces 2 OH- for every 1 Sr2+, [OH-] = 2 x [Sr2+] = 2(0.043) = 0.086 M.

(ii) Ksp = [Sr2+][OH-]^2 = (0.043)(0.086)^2 = (0.043)(0.007396) = 3.18 x 10^-4 ≈ 3.2 x 10^-4.

(c) Less than. This is an example of the common-ion effect: the second solution already contains Sr2+ ions (from the 0.10 M Sr(NO3)2), which is one of the ions produced by the dissolution of Sr(OH)2. By Le Chatelier's principle, the presence of additional Sr2+ (a "product" of the dissolution equilibrium) shifts the dissolution equilibrium Sr(OH)2(s) ⇌ Sr2+(aq) + 2 OH-(aq) to the LEFT, suppressing the dissolution of Sr(OH)2 and resulting in a lower solubility. Since less Sr(OH)2 dissolves in the Sr(NO3)2 solution compared to in pure water, less OH- is produced, so [OH-] in the second solution is less than in the first (pure water) solution.`,
  },
];

/* ============================= 7.12 — Common-Ion Effect ============================= */
const t712 = [
  {
    title: 'Q8 — Effect of Adding NaBr on the Solubility of PbBr2',
    content: `The value of Ksp for PbBr2 is 1.9 x 10^-5 at 25°C. A saturated solution is prepared by adding excess PbBr2(s) to distilled water at 25°C and stirring until no more solid dissolves.

(a) Fill in the values in the table below: [Pb2+] and [Br-] in a saturated solution of PbBr2 at 25°C.
(b) A small amount of NaBr(s) is added to 100 mL of the saturated solution of PbBr2, and the mixture is stirred thoroughly. Assume a constant temperature of 25°C and that the change in volume is negligible. Should the value of [Pb2+] decrease, increase, or remain the same after NaBr(s) is added? Justify your answer.`,
    answer: `(a) Let x = molar solubility of PbBr2. Then [Pb2+] = x and [Br-] = 2x. Ksp = [Pb2+][Br-]^2 = (x)(2x)^2 = 4x^3.

1.9 x 10^-5 = 4x^3

x^3 = 4.75 x 10^-6

x = (4.75 x 10^-6)^(1/3) = 0.01682 ≈ 1.7 x 10^-2 M.

[Pb2+] = x = 1.7 x 10^-2 M. [Br-] = 2x = 3.4 x 10^-2 M.

(b) [Pb2+] should decrease. Adding NaBr(s) introduces additional Br- ions into the solution — Br- is one of the ions already involved in the PbBr2 dissolution equilibrium (a common ion). By Le Chatelier's principle, increasing [Br-] shifts the equilibrium PbBr2(s) ⇌ Pb2+(aq) + 2 Br-(aq) to the LEFT (toward the solid), causing some of the dissolved Pb2+ to re-precipitate as PbBr2(s). This reduces [Pb2+] in the solution — this is the common-ion effect.`,
  },
  {
    title: 'Q9 — Comparing [Ca2+] for CaF2 Dissolved in Water vs. NaF Solution',
    content: `A student added an excess amount of CaF2(s) to two different beakers. One beaker contained distilled water, and the other beaker contained 0.50 M NaF(aq). The contents of each beaker were stirred thoroughly after the addition of CaF2(s). A small amount of undissolved CaF2(s) remained at the bottom of each beaker at the end of the experiment. Assume that the temperature is 25°C.

(a) The value of Ksp for CaF2 at 25°C is 3.9 x 10^-11. Calculate the value of [Ca2+] in each beaker at the end of the experiment.
(b) Explain the difference in [Ca2+] in the two beakers in terms of the common-ion effect and Le Chatelier's principle.`,
    answer: `(a) Beaker 1 (distilled water): Let x = molar solubility of CaF2. Then [Ca2+] = x and [F-] = 2x. Ksp = (x)(2x)^2 = 4x^3.

3.9 x 10^-11 = 4x^3

x^3 = 9.75 x 10^-12

x = (9.75 x 10^-12)^(1/3) = 2.14 x 10^-4 M.

[Ca2+] in distilled water = 2.14 x 10^-4 M ≈ 2.1 x 10^-4 M.

Beaker 2 (0.50 M NaF): Since NaF is a soluble salt that fully dissociates, [F-] from NaF alone is already 0.50 M — much larger than any F- that could be contributed by the small amount of dissolved CaF2. So the equilibrium [F-] ≈ 0.50 M (the contribution from CaF2 dissolving is negligible in comparison).

Ksp = [Ca2+][F-]^2 ≈ [Ca2+](0.50)^2 = [Ca2+](0.25)

3.9 x 10^-11 = [Ca2+](0.25)

[Ca2+] = (3.9 x 10^-11)/0.25 = 1.56 x 10^-10 M ≈ 1.6 x 10^-10 M.

(b) [Ca2+] is much lower in the 0.50 M NaF solution (1.6 x 10^-10 M) than in distilled water (2.1 x 10^-4 M). This is the common-ion effect: the NaF solution already contains a large concentration of F-, one of the ions involved in the CaF2 dissolution equilibrium (CaF2(s) ⇌ Ca2+(aq) + 2 F-(aq)). By Le Chatelier's principle, the presence of this additional "common ion" (F-) shifts the dissolution equilibrium to the LEFT, strongly suppressing the dissolution of CaF2(s) and resulting in a much lower solubility (and much lower [Ca2+]) compared to dissolving CaF2 in pure water, where no F- is present initially.`,
  },
  {
    title: 'Q10 — Effect of Adding KI on the Solubility and Concentration for PbI2',
    content: `A saturated solution is prepared in a beaker by adding excess PbI2(s) to distilled water at 25°C and stirring until no more solid dissolves. A small amount of undissolved PbI2(s) remained at the bottom of the beaker. Then several drops of 1.0 M KI(aq) are added to the saturated solution in the beaker. The contents of the beaker are stirred thoroughly. Assume a constant temperature of 25°C and that the change in volume is negligible.

(a) Do you predict that the mass of PbI2(s) present in the beaker should decrease, increase, or remain the same as a result of the addition of KI(aq)? Justify your answer in terms of the common-ion effect and Le Chatelier's principle.
(b) Do you predict that the concentration of Pb2+(aq) in the solution should decrease, increase, or remain the same as a result of the addition of KI(aq)? Justify your answer in terms of the common-ion effect and Le Chatelier's principle.`,
    answer: `(a) The mass of PbI2(s) should increase. Adding KI(aq) introduces additional I- ions, which is one of the ions already involved in the PbI2 dissolution equilibrium, PbI2(s) ⇌ Pb2+(aq) + 2 I-(aq) (a common ion). By Le Chatelier's principle, increasing [I-] shifts this equilibrium to the LEFT (toward the solid), causing some of the dissolved Pb2+ and I- ions to combine and re-precipitate as additional solid PbI2(s) — increasing the mass of undissolved solid at the bottom of the beaker.

(b) The concentration of Pb2+(aq) should decrease. As explained in part (a), the addition of the common ion I- shifts the dissolution equilibrium to the left (the common-ion effect), causing some of the dissolved Pb2+ to precipitate back out of solution as PbI2(s), which reduces [Pb2+] remaining in solution.`,
  },
  {
    title: 'Q11 — Calculating Moles of NaF Needed to Reduce [Ba2+] via the Common-Ion Effect',
    content: `The value of Ksp for barium fluoride, BaF2, at 25°C is 1.8 x 10^-7.

(a) A saturated solution of BaF2 is prepared at 25°C by adding excess BaF2(s) to distilled water and stirring until no more solid dissolves. Calculate the value of [Ba2+] in this saturated solution.
(b) A small amount of NaF(s) is dissolved completely into a 1.00 liter sample of a saturated solution of BaF2. Assume a constant temperature of 25°C and that the change in volume is negligible. As a result of this experiment, the value of [Ba2+] in the solution is reduced to 5.0 x 10^-7 M. Calculate the number of moles of NaF(s) that was added to the solution.`,
    answer: `(a) Let x = molar solubility of BaF2. Then [Ba2+] = x and [F-] = 2x. Ksp = (x)(2x)^2 = 4x^3.

1.8 x 10^-7 = 4x^3

x^3 = 4.5 x 10^-8

x = (4.5 x 10^-8)^(1/3) = 3.56 x 10^-3 M.

[Ba2+] in the original saturated solution = 3.56 x 10^-3 M ≈ 3.6 x 10^-3 M.

(b) When [Ba2+] is reduced to 5.0 x 10^-7 M, use Ksp to find the new [F-]:

Ksp = [Ba2+][F-]^2

1.8 x 10^-7 = (5.0 x 10^-7)[F-]^2

[F-]^2 = (1.8 x 10^-7)/(5.0 x 10^-7) = 0.36

[F-] = 0.60 M (this is the new equilibrium concentration of F- after NaF is added).

The amount of Ba2+ that precipitated out = original [Ba2+] - new [Ba2+] = 3.56 x 10^-3 - 5.0 x 10^-7 ≈ 3.56 x 10^-3 M (approximately all of the decrease). Since each Ba2+ that precipitates removes 2 F- from solution (forming BaF2(s)), the amount of F- consumed by re-precipitation = 2 x 3.56 x 10^-3 = 7.11 x 10^-3 M.

Total F- added (from NaF) = final [F-] + F- consumed by re-precipitation - original [F-] = 0.60 + 7.11 x 10^-3 - 2(3.56 x 10^-3) = 0.60 + 7.11 x 10^-3 - 7.11 x 10^-3 = 0.60 M (the F- consumed by re-precipitation and the original F- present cancel out, since original [F-] = 2 x original [Ba2+] = 7.11 x 10^-3 M ≈ the amount consumed).

Since the volume is 1.00 L, moles of NaF added ≈ 0.60 mol (the F- contributed by re-dissolved/re-precipitated BaF2 approximately cancels out, so essentially all of the new equilibrium [F-] of 0.60 M comes from the added NaF).`,
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
    imgMap['srohdiagram'] = await uploadImage('q7a_712_crop.png', 'sroh2-particle-diagram-error.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t711) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('7.11', t711);
    await insertTopic('7.12', t712);
    console.log('Done — Unit 7 Topics 7.11-7.12 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
