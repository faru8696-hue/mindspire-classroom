const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

// NOTE: the DB has no Topic 8.11 (Unit 8 only goes up to 8.10). The source
// PDF's final two questions (Q15/Q16) are actually solubility-equilibria
// content (Ksp, common-ion/pH effects on Mg(OH)2 and CaF2 solubility) —
// that's Unit 7 territory, not Unit 8, and matches Unit 7's Topic 7.13
// (pH and Solubility) exactly, so they're filed there instead of being
// force-fit into a Unit 8 topic they don't conceptually belong to.
const TOPICS = {
  '8.6': 'b382c0d0-33cc-41ad-a010-2c4caeac59aa',
  '8.7': 'afcc432c-80b0-43a4-9469-385c9da09b7c',
  '8.8': 'cfc4e526-70f2-4636-9c55-0fb55591ce49',
  '8.9': 'd2c7ffc4-4f89-4426-8f8e-5d2beff60214',
  '8.10': '156d1f74-e16e-4505-bdb3-786f1edf8bef',
  '7.13': 'd9895411-191b-48e3-9a4c-6028cabdb046',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit8-topics8.6-8.11-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '8.6', image: 'u8c_q1_full.png',
    title: 'Q1 — Identifying the Most Acidic Hydrogen in Lactic Acid',
    content: `Carboxylic acids are one common class of weak acid. The structural formula of lactic acid, HC3H5O3, is shown above and is an example of a carboxylic acid. Lactic acid undergoes an acid-base reaction with hydroxide ions according to the equation shown below.

HC3H5O3(aq) + OH⁻(aq) → C3H5O3⁻(aq) + H2O(l)

Which of the following correctly identifies the hydrogen atom in the lactic acid molecule that most readily participates in the reaction with the hydroxide ion and provides the correct justification? (See the four labeled structures and justifications above.)

(A) The alcohol –OH hydrogen; the C3H5O2⁻ ion is made more stable by localization of the negative charge on a single oxygen atom.
(B) The alcohol –OH hydrogen; the C3H5O2⁻ ion is made more stable by delocalization of the negative charge on two oxygen atoms through resonance.
(C) The carboxylic acid –OH hydrogen; the C3H5O2⁻ ion is made more stable by localization of the negative charge on a single oxygen atom.
(D) The carboxylic acid –OH hydrogen; the C3H5O2⁻ ion is made more stable by delocalization of the negative charge on two oxygen atoms through resonance.${JUSTIFY}`,
    answer: `(D). The carboxylic acid hydrogen (on the –C(=O)–O–H group) is far more acidic than the alcohol hydrogen (on the side-chain –OH), because removing it forms a carboxylate ion whose negative charge is DELOCALIZED via resonance across TWO equivalent oxygen atoms — a much more stable arrangement than the alkoxide ion formed by removing the alcohol hydrogen, which would leave the negative charge stuck (localized) on a single oxygen with no resonance stabilization. This rules out both alcohol-hydrogen choices (A and B — wrong hydrogen identified) and choice (C), which correctly identifies the carboxylic hydrogen but pairs it with the wrong (localization) justification. Only (D) pairs the correct hydrogen with the correct resonance-delocalization justification.`,
  },
  {
    topic: '8.6', image: 'u8c_q2_full.png',
    title: 'Q2 — Comparing the Acid Strength of HOCl and HOI',
    content: `The Lewis electron-dot diagrams of the HOCl molecule and the HOI molecule are shown above. Which of the following identifies the substance that represents the stronger acid and correctly identifies a factor that contributes to its being the stronger acid? (See the answer-choice table above.)

(A) HOCl(aq); HOCl molecules experience weaker London dispersion forces.
(B) HOCl(aq); The chlorine atom is more electronegative than the iodine atom, and this helps to stabilize the conjugate base.
(C) HOI(aq); HOI molecules experience stronger London dispersion forces.
(D) HOI(aq); The iodine atom is more electronegative than the chlorine atom, and this helps to stabilize the conjugate base.${JUSTIFY}`,
    answer: `(B). Among the hypohalous acids (HOX), acid strength increases as the electronegativity of X increases: a more electronegative halogen pulls electron density away from the O–H bond and better stabilizes the negative charge on the conjugate base (OX⁻) through induction. Chlorine is more electronegative than iodine, so HOCl is the stronger acid — matching (B). Choice (D) is factually false (iodine is NOT more electronegative than chlorine), and choices (A) and (C) invoke London dispersion forces, which affect physical properties like boiling point, not relative acid strength in aqueous solution.`,
  },
  {
    topic: '8.7', image: 'u8c_q3_full.png',
    title: 'Q3 — Using an Indicator Color Change to Determine pH and Relative Concentrations',
    content: `Information about the properties of the indicator bromothymol blue is listed in the table above (yellow below pH 6.0, blue above pH 7.6). A student uses bromothymol blue to test a solution in a beaker containing a mixture of HOCl(aq) (pKa = 7.54) and NaOCl(aq). The color of the solution turns yellow after a few drops of bromothymol blue are added to the beaker. Based on the results of this experiment, which of the following is true about the pH of the solution in the beaker and the relative concentrations of HOCl(aq) and OCl⁻(aq)? (See the answer-choice table above.)

(A) pH less than 6.0; [HOCl] > [OCl⁻]
(B) pH less than 6.0; [HOCl] < [OCl⁻]
(C) pH greater than 7.6; [HOCl] > [OCl⁻]
(D) pH greater than 7.6; [HOCl] < [OCl⁻]${JUSTIFY}`,
    answer: `(A). A yellow color means the pH is below the indicator's transition range, so pH < 6.0 — ruling out (C) and (D). Since pH < 6.0 is well below HOCl's pKa of 7.54, the Henderson-Hasselbalch equation (pH = pKa + log([OCl⁻]/[HOCl])) requires log([OCl⁻]/[HOCl]) to be strongly negative, meaning [OCl⁻] << [HOCl] — i.e., [HOCl] > [OCl⁻]. This matches (A), not (B) (which has the concentrations backwards).`,
  },
  {
    topic: '8.7', image: 'u8c_q4_full.png',
    title: 'Q4 — Choosing the Best Indicator for a Titration',
    content: `A sample of NH3(aq) is titrated with HCl(aq). The pH of the solution is measured with a pH meter and graphed as a function of the volume of HCl(aq) added, as shown in the graph above (equivalence point near 30 mL, where the curve drops steeply through roughly pH 7–5). A student carries out the same titration but wants to use an indicator instead of a pH meter. Information about two different indicators is listed in the table above. Which of the following identifies the best indicator to use for the titration and provides the correct justification? (See the answer-choice table above.)

(A) Methyl red; The pKa value of methyl red is close to the pH of the solution at the half-equivalence point.
(B) Methyl red; The pKa value of methyl red is close to the pH of the solution at the equivalence point.
(C) Phenolphthalein; The pKa value of phenolphthalein is close to the pH of the solution at the half-equivalence point.
(D) Phenolphthalein; The pKa value of phenolphthalein is close to the pH of the solution at the equivalence point.${JUSTIFY}`,
    answer: `(B). The best indicator for a titration is one whose pKa is close to the pH AT THE EQUIVALENCE POINT (not the half-equivalence point) — this rules out (A) and (C), which both cite the wrong reference point. Since NH3 (a weak base) is titrated with HCl (a strong acid), the equivalence point solution contains the weak acid NH4⁺, making the equivalence-point pH acidic — reading the graph, this occurs somewhere in the steep drop, in the mildly acidic range (around pH 5–6), much closer to methyl red's pKa (5.0) than to phenolphthalein's pKa (9.4, which is only useful for equivalence points that are clearly basic). This rules out (D) as well, leaving (B) as the indicator with a pKa correctly matched to this titration's (acidic) equivalence point.`,
  },
  {
    topic: '8.8', image: 'u8c_q5_table.png',
    title: 'Q5 — Predicting Small pH Changes for a Buffer Under Acid or Base Addition',
    content: `A solution is prepared by combining equal volumes of 1.0 M HF(aq) and 1.0 M NaF in a beaker. Which of the following correctly predicts how the pH will change if a small amount of HCl(aq) or NaOH(aq) is added to the beaker and provides the correct equation for the reaction that accounts for the relatively small change in pH? (See the answer-choice table above.)

(A) HCl(aq); Decrease Slightly; H3O⁺(aq) + F⁻(aq) → HF(aq) + H2O(l)
(B) HCl(aq); Increase Slightly; Cl⁻(aq) + HF(aq) → HCl(aq) + F⁻(aq)
(C) NaOH(aq); Decrease Slightly; OH⁻(aq) + HF(aq) → F⁻(aq) + H2O(l)
(D) NaOH(aq); Increase Slightly; OH⁻(aq) + F⁻(aq) → HF(aq) + O²⁻(aq)${JUSTIFY}`,
    answer: `(A). Adding a strong acid (HCl) supplies H3O⁺, which reacts with the buffer's base component, F⁻, forming HF and water — this reaction consumes most of the added H⁺, but adding acid still causes the pH to decrease slightly overall (never increase — ruling out B). Choice (C) proposes a chemically correct buffering reaction (OH⁻ + HF → F⁻ + H2O) but pairs it with the wrong substance/direction combination for this option's label ("NaOH; Decrease Slightly" — adding a base should increase pH, not decrease it). Choice (D) is chemically nonsensical (O²⁻ does not exist as a stable species in aqueous solution). Only (A) correctly pairs HCl addition with a slight pH decrease and the genuine buffering reaction that dampens the change.`,
  },
  {
    topic: '8.8',
    title: 'Q6 — Identifying the Buffering Reaction for an Amine Buffer',
    content: `C2H5NH2(aq) + H2O(l) ⇌ C2H5NH3⁺(aq) + OH⁻(aq)

Ethylamine, C2H5NH2, reacts with water according to the equation shown above. A buffer solution is prepared that contains equimolar amounts of C2H5NH2(aq) and C2H5NH3⁺(aq). When a small amount of 12 M HNO3(aq) is added to this buffer solution, the pH of the solution changes from 10.75 to 10.73. Which of the following equations represents the reaction that accounts for the fact that the pH does not change significantly when HNO3(aq) is added?

(A) C2H5NH2(aq) + H⁺(aq) → C2H5NH3⁺(aq)
(B) C2H5NH3⁺(aq) + H⁺(aq) → C2H5NH4²⁺(aq)
(C) NO3⁻(aq) + H⁺(aq) → HNO3(aq)
(D) OH⁻(aq) + H⁺(aq) → H2O(l)${JUSTIFY}`,
    answer: `(A). The buffer's base component, C2H5NH2, absorbs the added H⁺ by converting into its conjugate acid, C2H5NH3⁺ — this is exactly what buffering means, and it's what keeps the pH nearly unchanged. Choice (B) proposes an impossible double-protonation of the ammonium-like ion, which doesn't occur. Choice (C) is false: HNO3 is a strong acid and stays essentially 100% dissociated, so NO3⁻ does not meaningfully re-form HNO3. Choice (D) describes simple H⁺/OH⁻ neutralization, but free OH⁻ is present only in trace equilibrium amounts here — it is the amine itself, not free hydroxide, that provides the buffer's actual capacity to absorb the added acid.`,
  },
  {
    topic: '8.8',
    title: 'Q7 — Identifying the Buffering Reaction for a Carboxylic Acid Buffer',
    content: `HCOOH(aq) + H2O(l) ⇌ H3O⁺(aq) + HCOO⁻(aq)

Methanoic acid, HCOOH, reacts with water according to the equation shown above. A buffer solution is prepared that contains equimolar amounts of HCOOH(aq) and HCOO⁻(aq). When a small amount of 12 M KOH(aq) is added to this buffer solution, the pH of the solution changes from 3.74 to 3.76. Which of the following equations represents the reaction that accounts for the fact that the pH does not change significantly when KOH(aq) is added?

(A) HCOO⁻(aq) + OH⁻(aq) → HCOOH(aq) + O²⁻(aq)
(B) HCOOH(aq) + OH⁻(aq) → HCOO⁻(aq) + H2O(l)
(C) K⁺(aq) + OH⁻(aq) → KOH(aq)
(D) H⁺(aq) + OH⁻(aq) → H2O(l)${JUSTIFY}`,
    answer: `(B). The buffer's acid component, HCOOH, absorbs the added OH⁻ by donating a proton to it, forming HCOO⁻ and water — this is the reaction that gives the buffer its capacity to resist the pH change. Choice (A) is chemically nonsensical (O²⁻ is not a real aqueous species). Choice (C) is false: KOH is a strong base and stays essentially 100% dissociated, so K⁺ does not meaningfully react with OH⁻ to re-form KOH. Choice (D) doesn't capture the actual buffering mechanism here, since free H⁺ is present only in trace equilibrium amounts — it is the weak acid HCOOH itself that absorbs the added hydroxide.`,
  },
  {
    topic: '8.8', image: 'u8c_q8_full.png',
    title: 'Q8 — Identifying an Unknown Addition from a Particulate Diagram',
    content: `A student measures the pH of a solution in a beaker that contains equimolar amounts of HC2H3O2(aq) and NaC2H3O2(aq) and records the pH as 4.74. Then the student adds a small amount of an unknown solution to the beaker and stirs the mixture thoroughly. The identity of the unknown solution is either HCl(aq) or NaOH(aq). The particulate diagrams above represent the relative amounts of HC2H3O2 and C2H3O2⁻ in a sample of the solution in the beaker before and after the unknown solution is added (water molecules and ions such as Na⁺ or Cl⁻ are omitted). Which of the following correctly identifies the unknown solution that is added to the beaker and describes the pH of the mixture at the end of the experiment?

(A) HCl(aq); Less than 4.74
(B) HCl(aq); Greater than 4.74
(C) NaOH(aq); Less than 4.74
(D) NaOH(aq); Greater than 4.74${JUSTIFY}`,
    answer: `(D). The "before" diagram shows 5 HC2H3O2 and 5 C2H3O2⁻ (equal amounts, consistent with the initial pH of 4.74 equaling acetic acid's pKa). The "after" diagram shows only 4 HC2H3O2 but 6 C2H3O2⁻ — the amount of acid DECREASED while the amount of conjugate base INCREASED. This can only happen if a base was added that deprotonated some HC2H3O2 into C2H3O2⁻, meaning the unknown solution was NaOH — ruling out both HCl choices (adding an acid would do the opposite: increase HC2H3O2 and decrease C2H3O2⁻). Since the ratio shifted toward more base than acid ([C2H3O2⁻] > [HC2H3O2]), the Henderson-Hasselbalch equation gives a pH greater than the pKa (4.74) — matching (D).`,
  },
  {
    topic: '8.9', image: 'u8c_q9_table.png',
    title: 'Q9 — Choosing a Mixture That Produces a Target Buffer pH',
    content: `The acid dissociation constants of HC3H5O3(aq) and CH3NH3⁺(aq) are given in the table above (HC3H5O3 Ka = 8.3 × 10⁻⁴; CH3NH3⁺ Ka = 2.3 × 10⁻¹¹). Which of the following mixtures would produce a buffer solution with a pH of approximately 3?

(A) A mixture of 100. mL of 0.10 M HC3H5O3 and 50. mL of 0.10 M NaOH
(B) A mixture of 100. mL of 0.10 M CH3NH3Cl and 50. mL of 0.10 M NaOH
(C) A mixture of 100. mL of 0.10 M HC3H5O3 and 100. mL of 0.10 M NaOH
(D) A mixture of 100. mL of 0.10 M CH3NH3Cl and 100. mL of 0.10 M NaOH${JUSTIFY}`,
    answer: `(A). HC3H5O3 (lactic acid) has pKa = −log(8.3×10⁻⁴) ≈ 3.08, close to the target pH of 3 — this immediately rules out both CH3NH3Cl options (B and D), since CH3NH3⁺'s pKa ≈ 10.64 would only buffer near pH 10.6, nowhere close to 3. Between the two lactic-acid options: in (A), 50. mL of NaOH (0.0050 mol) neutralizes exactly half of the 100. mL of HC3H5O3 (0.0100 mol), leaving a 1:1 mixture of HC3H5O3 and its conjugate base — a genuine buffer at pH ≈ pKa ≈ 3. In (C), the NaOH added (0.0100 mol) exactly equals the moles of acid, reaching the full equivalence point (not a buffer at all) — the solution becomes pure conjugate base, C3H5O3⁻, which is basic, not pH ≈ 3.`,
  },
  {
    topic: '8.9',
    title: 'Q10 — Diagnosing Why a Prepared Buffer\'s pH Came Out Too Low',
    content: `A student attempts to prepare a buffer solution with a pH of 7.5 by adding HOCl (pKa = 7.54) and NaOCl to distilled water. Instead of the desired pH, the measured pH of the buffer solution is 7.0. Which of the following is the most likely reason that the pH is too low?

(A) Too much HOCl was used.
(B) Too much NaOCl was used.
(C) There was water in the flask before HOCl and NaOCl were added.
(D) In order to prepare the buffer, a few drops of a strong base should have been added.${JUSTIFY}`,
    answer: `(A). A pH lower than intended means the actual [OCl⁻]/[HOCl] ratio ended up smaller than planned (more acid relative to base), since pH = pKa + log([OCl⁻]/[HOCl]) — this points directly to too much of the acid component, HOCl, having been used. Choice (B) would cause the opposite effect (too much base would raise the pH above 7.5, not lower it). Choice (C) — extra water dilutes both buffer components proportionally, which barely affects pH at all (buffer pH depends on the RATIO of components, not their absolute concentrations), so it doesn't explain a systematic shift. Choice (D) describes an alternative preparation technique rather than diagnosing what actually went wrong with this specific result.`,
  },
  {
    topic: '8.9',
    title: 'Q11 — Choosing a Mixture to Achieve a Specific Buffer pH',
    content: `The Ka value of hydrofluoric acid, HF(aq), is equal to 6.8 × 10⁻⁴. Which of the following mixtures would produce a solution with a pH that is closest to 3.5?

(A) 50.0 mL of 1.0 M HF(aq) and 50.0 mL of 1.0 M NaF(aq)
(B) 50.0 mL of 1.0 M HF(aq) and 50.0 mL of 2.0 M NaF(aq)
(C) 50.0 mL of 1.0 M HF(aq) and 50.0 mL of 1.0 M NaOH(aq)
(D) 50.0 mL of 2.0 M HF(aq) and 50.0 mL of 1.0 M NaF(aq)${JUSTIFY}`,
    answer: `(B). pKa of HF = −log(6.8×10⁻⁴) ≈ 3.17. Using Henderson-Hasselbalch, pH = pKa + log([F⁻]/[HF]); solving for a target pH of 3.5 gives log([F⁻]/[HF]) ≈ 0.33, so [F⁻]/[HF] ≈ 2.1. In (B): moles HF = 0.050 mol, moles NaF = 0.100 mol, giving a ratio of 2.0 — pH = 3.17 + log(2.0) ≈ 3.17 + 0.30 = 3.47, very close to 3.5. In (A), the ratio is 1:1, giving pH = pKa ≈ 3.17 (too low). In (D), the ratio is inverted (0.5), giving pH ≈ 2.87 (too low). In (C), NaOH is a strong base that completely neutralizes all of the HF (equal moles), reaching the equivalence point rather than forming a buffer at all — this gives a basic solution (from F⁻ hydrolysis), not pH 3.5.`,
  },
  {
    topic: '8.9',
    title: 'Q12 — Calculating Buffer pH from Given Concentrations and Volumes',
    content: `The Ka value of acetic acid, HC2H3O2, is equal to 1.8 × 10⁻⁵. A buffer solution is prepared by mixing 500. mL of 2.0 M HC2H3O2(aq) and 500. mL of 1.0 M NaC2H3O2(aq). The pH of this buffer solution is closest to

(A) 4.44
(B) 4.74
(C) 5.05
(D) 7.00${JUSTIFY}`,
    answer: `(A). pKa of acetic acid = −log(1.8×10⁻⁵) ≈ 4.745. Moles HC2H3O2 = 0.500 L × 2.0 M = 1.0 mol; moles NaC2H3O2 = 0.500 L × 1.0 M = 0.50 mol. Since both components are diluted equally upon mixing, the ratio [A⁻]/[HA] = 0.50/1.0 = 0.50 is unaffected by the dilution. pH = pKa + log(0.50) = 4.745 − 0.301 ≈ 4.44.`,
  },
  {
    topic: '8.10', image: 'u8c_q13_table.png',
    title: 'Q13 — Comparing pH and Buffer Capacity at Different Absolute Concentrations',
    content: `Two buffer solutions are prepared, and the concentrations of each buffer component are listed in the table above (Solution #1: [HNO2] = [NO2⁻] = 0.10 M; Solution #2: [HNO2] = [NO2⁻] = 1.0 M). Which of the following correctly compares the pH and the buffer capacity of solutions #1 and #2?

(A) Solutions #1 and #2 have the same pH; Solutions #1 and #2 have the same buffer capacity.
(B) Solutions #1 and #2 have the same pH; Solution #2 has a larger buffer capacity than solution #1.
(C) Solution #2 has a higher pH than solution #1; Solutions #1 and #2 have the same buffer capacity.
(D) Solution #2 has a higher pH than solution #1; Solution #2 has a larger buffer capacity than solution #1.${JUSTIFY}`,
    answer: `(B). Both solutions have an identical [HNO2]/[NO2⁻] ratio of 1:1, so by Henderson-Hasselbalch, both have exactly the same pH (= pKa) — this rules out both "higher pH" choices (C and D), which incorrectly claim solution #2's pH differs. However, buffer capacity depends on the ABSOLUTE concentrations of the buffer components, not just their ratio: solution #2 has 10 times more of both HNO2 and NO2⁻ available, meaning it can neutralize far more added strong acid or base before its pH changes significantly. This makes solution #2's buffer capacity larger, despite the identical pH — matching (B), not (A) (which incorrectly claims equal buffer capacity).`,
  },
  {
    topic: '8.10', image: 'u8c_q14_table.png',
    title: 'Q14 — Comparing Buffer Capacity from Experimental pH-Change Data',
    content: `Two different buffer solutions X and Y are prepared by combining solutions of NH3(aq) and NH4⁺(aq). A student records the initial pH of each buffer solution and then adds 10.0 mL of 10.0 M HNO3(aq) to 1.00 L of each buffer solution. The student correctly measures the final pH of each solution. Data from the experiment are shown in the table above (Solution X: initial pH 9.3, final pH 9.2; Solution Y: initial pH 9.0, final pH 2.2). Which of the following correctly compares the buffer capacity of solutions X and Y and provides the correct justification?

(A) Solution X has a larger buffer capacity than solution Y; The initial pH of solution X is slightly higher than the initial pH of Solution Y.
(B) Solution X has a larger buffer capacity than solution Y; The change in pH for solution X is much smaller than the change in pH for solution Y.
(C) Solution Y has a larger buffer capacity than solution X; The initial pH of solution Y is slightly lower than the initial pH of Solution X.
(D) Solution Y has a larger buffer capacity than solution X; The change in pH for solution Y is much larger than the change in pH for solution X.${JUSTIFY}`,
    answer: `(B). Buffer capacity is directly measured by how little a solution's pH changes when a given amount of strong acid or base is added. Solution X's pH barely moved (9.3 → 9.2, a change of only 0.1), while solution Y's pH collapsed dramatically (9.0 → 2.2, a change of 6.8) upon adding the identical amount of HNO3 — this means solution X has the much larger buffer capacity, ruling out both "Solution Y has a larger buffer capacity" choices (C and D). Choice (A) reaches the correct conclusion (X has larger capacity) but for an insufficient reason — the small 0.3-unit difference in INITIAL pH values doesn't by itself explain such a drastically different response to the same amount of added acid; the direct, valid justification is the actual observed difference in how much each solution's pH changed, as stated in (B).`,
  },
  {
    topic: '7.13',
    title: 'Q15 — Which Change Increases the Solubility of Mg(OH)2',
    content: `Mg(OH)2(s) ⇌ Mg²⁺(aq) + 2 OH⁻(aq)

The dissolution of Mg(OH)2(s) in water is represented by the equation above. The Ksp of Mg(OH)2 is 5.6 × 10⁻¹². Which of the following changes will increase the solubility of Mg(OH)2 in an aqueous solution?

(A) Decreasing the pH
(B) Increasing the pH
(C) Adding NH3 to the solution
(D) Adding Mg(NO3)2 to the solution${JUSTIFY}`,
    answer: `(A). Decreasing the pH means adding H⁺, which reacts with the dissolved OH⁻ (H⁺(aq) + OH⁻(aq) → H2O(l)), removing it from solution and shifting the Mg(OH)2 dissolution equilibrium FORWARD to replace the consumed OH⁻ — dissolving more solid and increasing solubility. Increasing the pH (B) does the opposite: it adds more OH⁻ (a common ion), suppressing solubility via Le Chatelier's principle. Adding NH3 (C), a weak base, tends to raise the pH rather than lower it, which would also suppress (not increase) solubility. Adding Mg(NO3)2 (D) introduces Mg²⁺, a common ion shared with the dissolution equilibrium, which likewise shifts the equilibrium in reverse and decreases solubility.`,
  },
  {
    topic: '7.13',
    title: 'Q16 — Net-Ionic Equation for the Increased Solubility of CaF2 in Acid',
    content: `CaF2(s) ⇌ Ca²⁺(aq) + 2 F⁻(aq)

The dissolution of CaF2(s) in water is represented by the equation above. The Ksp of CaF2 is 3.9 × 10⁻¹¹. The molar solubility of CaF2 increases when it is dissolved in 0.50 M HNO3(aq) instead of neutral distilled water. Which of the following represents the balanced net-ionic equation for the process that occurs between species in solution that contributes to the increased solubility of CaF2(aq) in HNO3(aq)?

(A) F⁻(aq) + H3O⁺(aq) ⇌ HF(aq) + H2O(l)
(B) 2 F⁻(aq) + 2 NO3⁻(aq) ⇌ F2(g) + N2(g) + 3 O2(g)
(C) Ca²⁺(aq) + 2 F⁻(aq) ⇌ CaF2(s)
(D) Ca²⁺(aq) + 2 NO3⁻(aq) ⇌ Ca(NO3)2(s)${JUSTIFY}`,
    answer: `(A). F⁻ is the conjugate base of the weak acid HF, so the H3O⁺ supplied by HNO3 reacts with F⁻ to form HF, removing F⁻ from solution. This shifts the CaF2 dissolution equilibrium forward (to replace the consumed F⁻), dissolving more CaF2(s) and increasing its solubility. Choice (B) proposes a bizarre, non-occurring reaction (F⁻ and NO3⁻ do not decompose into F2, N2, and O2 gases in aqueous solution). Choice (C) is simply the reverse of the given dissolution equation (precipitation), which would decrease, not increase, solubility. Choice (D) is chemically wrong — Ca(NO3)2 is a soluble salt, not a solid that would precipitate from Ca²⁺ and NO3⁻.`,
  },
];

(async () => {
  const topicOrderCounter = {};
  for (const [k, v] of Object.entries(TOPICS)) {
    const { count } = await sb.from('questions').select('id', { count: 'exact', head: true }).eq('topic_id', v);
    topicOrderCounter[k] = count ?? 0;
  }

  for (const q of QUESTIONS) {
    const imageUrl = q.image ? await uploadImage(q.image) : null;
    const { error } = await sb.from('questions').insert({
      topic_id: TOPICS[q.topic],
      title: q.title,
      content: q.content,
      answer_key: q.answer,
      image_url: imageUrl,
      difficulty: 'medium',
      points: 2,
      question_type: 'frq',
      source: 'MCQ Practice',
      order_index: topicOrderCounter[q.topic]++,
    });
    if (error) throw error;
    console.log('Inserted:', q.title);
  }
  console.log('Done —', QUESTIONS.length, 'questions inserted.');
})();
