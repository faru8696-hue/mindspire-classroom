const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Note: this class's Unit 8 only has official CED topics 8.1-8.10 (no "8.11").
// Episode #27's PDF-labeled "8.11 pH and Solubility" content belongs in Unit 7's
// pre-existing "7.13 pH and Solubility" topic instead (same cross-unit mismatch
// pattern found for the Topic Worksheet content processed earlier this session).
const TOPICS = {
  '8.1': 'e69ef38f-a102-4bc0-be5f-4a3f4e64da3f',
  '8.2': 'c8449c6b-38e6-4277-a48a-473afffd5c08',
  '8.3': 'ef536392-f05c-409a-937a-dafbfe95e39f',
  '8.4': '4593c0bc-e9ff-453d-8e77-67fe57fdf12b',
  '8.5': '5246c332-452e-4883-b81d-61fa7b837084',
  '8.6': 'b382c0d0-33cc-41ad-a010-2c4caeac59aa',
  '8.7': 'afcc432c-80b0-43a4-9469-385c9da09b7c',
  '8.8': 'cfc4e526-70f2-4636-9c55-0fb55591ce49',
  '8.9': 'd2c7ffc4-4f89-4426-8f8e-5d2beff60214',
  '8.10': '156d1f74-e16e-4505-bdb3-786f1edf8bef',
  '7.13': 'd9895411-191b-48e3-9a4c-6028cabdb046',
};

const IMG_DIR = path.join(__dirname, 'tmp-episode-imgs', 'unit8');

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `unit8-episodes/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 8.1 — Introduction to Acids and Bases (Episode #24) ============================= */
const t81 = [
  {
    title: 'Episode Review Q1 — pOH and pKw of Pure Water at a Non-Standard Temperature',
    content: `The pH of pure water at 10°C is 7.27. Which of the following provides correct predictions for the pOH of pure water at 10°C and the value of pKw at 10°C?

pOH of pure water at 10°C | pKw at 10°C
(A) less than 7.27 | equal to 14
(B) less than 7.27 | greater than 14
(C) equal to 7.27 | equal to 14
(D) equal to 7.27 | greater than 14`,
    answer: `(D). Pure water is always neutral, meaning pH = pOH at any temperature (equal to 7.27 here, not just at 25°C). Since pKw = pH + pOH = 7.27 + 7.27 = 14.54, which is greater than 14 (the value only at 25°C), pKw is greater than 14 at 10°C.`,
  },
];

/* ============================= 8.2 — pH and pOH of Strong Acids and Bases (Episode #24) ============================= */
const t82 = [
  {
    title: 'Episode Review Q2 — Effect of Dilution on pH and [H3O+] of a Strong Base',
    content: `The pH of a 200.0 mL sample of NaOH(aq) in a beaker is recorded as 7.90. Distilled water is added to the beaker, bringing the total volume of solution to 400.0 mL. Which of the following correctly predicts how the pH of the solution and the value of [H3O+] in the solution will be affected by the addition of distilled water to the beaker? (Assume constant temperature at 25°C.)

pH | [H3O+]
(A) decreases | decreases
(B) decreases | increases
(C) increases | decreases
(D) increases | increases`,
    answer: `(B). Diluting the NaOH(aq) solution with water decreases [OH–] (since the same moles of OH– are now in a larger volume), making the solution less basic — so pOH increases, meaning pH DECREASES. Since pH decreases, the solution is becoming more acidic, meaning [H3O+] INCREASES (as [H3O+] and pH are inversely related).`,
  },
  {
    title: 'Episode Review Q3 — Calculating [H3O+] and pH Before and After Dilution (HNO3)',
    content: `A beaker contains a 100.0 mL sample of HNO3(aq) with a pH of 5.25. Distilled water is added to the beaker until the final volume of the solution is 500.0 mL. (Assume constant temperature at 25°C.)

(a) Calculate the value of [H3O+] in the 100.0 mL sample of HNO3(aq) present in the beaker at the beginning of the experiment.
(b) Calculate the pH of the 500.0 mL sample of solution present in the beaker at the end of the experiment.`,
    answer: `(a) [H3O+] = 10^(–pH) = 10^(–5.25) = 5.62 × 10⁻⁶ M.

(b) The dilution factor is 100.0/500.0 = 1/5. New [H3O+] = 5.62 × 10⁻⁶ M / 5 = 1.125 × 10⁻⁶ M. New pH = –log(1.125 × 10⁻⁶) = 5.95.`,
  },
  {
    title: 'Episode Review Q4 — Calculating pH and [H3O+] for Strong Acids (Table)',
    content: `Fill in the missing information in the table below. Show the setup for the calculations required to determine the missing information in each row. Assume each solution is at 25°C.

Solution | [H3O+] | pH
(a) 2.3 × 10⁻⁴ M HNO3(aq) | ? | ?
(b) HCl(aq) of unknown concentration | ? | 5.77`,
    answer: `(a) Since HNO3 is a strong acid, [H3O+] = initial concentration = 2.3 × 10⁻⁴ M. pH = –log(2.3 × 10⁻⁴) = 3.64.

(b) [H3O+] = 10^(–5.77) = 1.7 × 10⁻⁶ M. Since HCl is a strong acid, this value also equals the initial concentration of HCl(aq): 1.7 × 10⁻⁶ M.`,
  },
  {
    title: 'Episode Review Q5 — Determining the Concentration of a Strong Base from pH',
    content: `The pH of a solution of KOH(aq) is 8.00. The concentration of KOH in this solution is closest to which of the following?

(A) 1.0 × 10⁻⁸ M
(B) 1.0 × 10⁻⁶ M
(C) 6.0 M
(D) 8.0 M`,
    answer: `(B). pOH = 14.00 – 8.00 = 6.00. [OH–] = 10^(–6.00) = 1.0 × 10⁻⁶ M. Since KOH is a strong base (group I hydroxide, 1:1 dissociation), [KOH] = [OH–] = 1.0 × 10⁻⁶ M.`,
  },
  {
    title: 'Episode Review Q6 — Identifying and Correcting a Mistake in a Strong Base pH Calculation (Ba(OH)2)',
    content: `A student performs the following calculation to determine the pH of 0.050 M Ba(OH)2(aq):

pOH = –log(0.050) = 1.30
pH = 14.00 – pOH
pH = 14.00 – 1.30 = 12.70

Identify the specific mistake made by the student, and determine the correct value for the pH of 0.050 M Ba(OH)2(aq).`,
    answer: `Mistake: Ba(OH)2 is a group II hydroxide, which produces TWO OH– ions per formula unit upon dissociation. The student incorrectly used the initial molarity of Ba(OH)2 (0.050 M) directly as [OH–], without doubling it.

Correct: [OH–] = 2 × 0.050 M = 0.10 M. pOH = –log(0.10) = 1.00. pH = 14.00 – 1.00 = 13.00.`,
  },
  {
    title: 'Episode Review Q7 — Confirming Strong Acid Behavior and Calculating Percent Ionization of a Weak Acid',
    content: `The pH of solutions of two different acids prepared at two different concentrations were measured:

Solution | pH
0.010 M HClO4(aq) | 2.00
0.10 M HClO4(aq) | 1.00

Solution | pH
0.010 M HClO2(aq) | 2.20
0.10 M HClO2(aq) | 1.55

(a) Perform a calculation to illustrate why HClO4 is classified as a strong acid.
(b) Determine the percent ionization of HClO2 in 0.10 M HClO2(aq).`,
    answer: `(a) For 0.010 M HClO4: [H3O+] = 10^(–2.00) = 0.010 M — exactly equal to the initial concentration. For 0.10 M HClO4: [H3O+] = 10^(–1.00) = 0.10 M — again exactly equal to the initial concentration. Since [H3O+] equals the initial concentration in both cases (100% ionization, regardless of concentration), HClO4 is confirmed to be a strong acid.

(b) [H3O+] = 10^(–1.55) = 0.0282 M. Percent ionization = ([H3O+]equilibrium / [HA]initial) × 100% = (0.0282 / 0.10) × 100% = 28%.`,
  },
];

/* ============================= 8.3 — Weak Acid and Base Equilibria (Episode #24) ============================= */
const t83 = [
  {
    title: 'Episode Review Q8 — Calculating Kb for Pyridine from the pH of Its Solution',
    content: `C5H5N(aq) + H2O(l) ⇌ C5H5NH+(aq) + OH–(aq)     Kb = ?

A 0.10 M solution of pyridine, C5H5N(aq), has a pH equal to 9.11. The ionization constant, Kb, of C5H5N is closest to which of the following?

(A) 1.7 × 10⁻¹⁰
(B) 7.8 × 10⁻¹⁰
(C) 1.7 × 10⁻⁹
(D) 5.9 × 10⁻⁶`,
    answer: `(C). pOH = 14.00 – 9.11 = 4.89. [OH–] = 10^(–4.89) = 1.29 × 10⁻⁵ M. Since x = [OH–] << 0.10 M, Kb ≈ x² / 0.10 = (1.29 × 10⁻⁵)² / 0.10 = 1.66 × 10⁻¹⁰ / 0.10 = 1.7 × 10⁻⁹.`,
  },
  {
    title: 'Episode Review Q9 — Determining Missing Concentration Data for Two Weak Acids',
    content: `Fill in the missing information in each row of the table below. Show the setup for the calculations required. Assume each solution is at 25°C.

Acid (HA) | Ka value | [HA] | [H3O+] | pH
(a) HC3H5O2 | 1.4 × 10⁻⁵ | ? | 4.9 × 10⁻⁴ M | 3.31
(b) HOBr | ? | 0.085 M | 1.4 × 10⁻⁵ M | 4.85`,
    answer: `(a) Using Ka ≈ [H3O+]² / [HA]initial (since x << [HA]initial): [HA]initial = [H3O+]² / Ka = (4.9 × 10⁻⁴)² / (1.4 × 10⁻⁵) = 2.401 × 10⁻⁷ / 1.4 × 10⁻⁵ = 0.0172 M.

(b) Ka ≈ [H3O+]² / [HA]initial = (1.4 × 10⁻⁵)² / 0.085 = 1.96 × 10⁻¹⁰ / 0.085 = 2.3 × 10⁻⁹.`,
  },
  {
    title: 'Episode Review Q10 — pH, Percent Ionization, and the Effect of Dilution on a Weak Acid (HF)',
    content: `HF(aq) + H2O(l) ⇌ H3O+(aq) + F–(aq)     Ka = 6.8 × 10⁻⁴

(a) Calculate the pH of a 0.92 M HF(aq) solution.
(b) Determine the percent ionization of HF in 0.92 M HF(aq).
(c) If 50.0 mL of distilled water is added to 50.0 mL of 0.92 M HF(aq), will the percent ionization of HF in the solution decrease, increase, or remain the same? Justify your answer by comparing Q with Ka.`,
    answer: `(a) x²/(0.92 – x) ≈ x²/0.92 = 6.8 × 10⁻⁴. x² = 6.256 × 10⁻⁴. x = [H3O+] = 0.0250 M. pH = –log(0.0250) = 1.60.

(b) Percent ionization = (0.0250/0.92) × 100% = 2.7%.

(c) The percent ionization will increase. Diluting halves every concentration: immediately after dilution, [HF] = 0.4475 M, [H3O+] = [F–] = 0.01251 M (each halved from the original equilibrium values). Q = (0.01251)²/0.4475 = 3.50 × 10⁻⁴, which is LESS than Ka (6.8 × 10⁻⁴). Since Q < Ka, the forward (ionization) reaction is favored, so more HF ionizes to restore equilibrium — increasing the percent ionization.`,
  },
  {
    title: 'Episode Review Q11 — pH and Percent Ionization of a Weak Base (Methylamine)',
    content: `CH3NH2(aq) + H2O(l) ⇌ CH3NH3+(aq) + OH–(aq)     Kb = 4.4 × 10⁻⁴

(a) Calculate the pH of a 2.5 M CH3NH2(aq) solution.
(b) Determine the percent ionization of CH3NH2 in 2.5 M CH3NH2(aq).`,
    answer: `(a) x²/(2.5 – x) ≈ x²/2.5 = 4.4 × 10⁻⁴. x² = 1.1 × 10⁻³. x = [OH–] = 0.0332 M. pOH = –log(0.0332) = 1.48. pH = 14.00 – 1.48 = 12.52.

(b) Percent ionization = (0.0332/2.5) × 100% = 1.3%.`,
  },
  {
    title: 'Episode Review Q12 — Net Ionic Equation for the Basic Hydrolysis of Fluoride Ion (NaF)',
    content: `When a sample of solid sodium fluoride, NaF(s), is dissolved in water, the solution has a pH that is greater than 7. Write the net ionic equation for the reaction that occurs to cause the NaF(aq) solution to be basic.`,
    answer: `F–(aq) + H2O(l) ⇌ HF(aq) + OH–(aq)

(F– is the conjugate base of the weak acid HF, so it reacts with water — hydrolysis — to produce OH–, making the solution basic. Na+ is a spectator ion and does not appear in the net ionic equation.)`,
  },
];

/* ============================= 8.4 — Acid-Base Reactions and Buffers (Episode #25) ============================= */
const t84 = [
  {
    title: 'Episode Review Q1 — Strong Acid + Strong Base Neutralization and pH of Excess Base',
    content: `A solution is prepared by combining 200.0 mL of 0.40 M HClO4(aq) with 300.0 mL of 0.30 M KOH(aq).

(a) Write the balanced net ionic equation for the acid-base reaction that occurs between HClO4 and KOH.
(b) Calculate the number of moles of HClO4 and the number of moles of KOH present in each solution before they are combined.
(c) The volume of the combined solution is 500.0 mL. Calculate the pH of the combined solution.`,
    answer: `(a) H+(aq) + OH–(aq) → H2O(l)

(b) Moles HClO4 = 0.2000 L × 0.40 M = 0.0800 mol. Moles KOH = 0.3000 L × 0.30 M = 0.0900 mol.

(c) Since 1:1 stoichiometry, excess OH– = 0.0900 – 0.0800 = 0.0100 mol. [OH–]excess = 0.0100 mol / 0.5000 L = 0.0200 M. pOH = –log(0.0200) = 1.70. pH = 14.00 – 1.70 = 12.30.`,
  },
  {
    title: 'Episode Review Q2 — Weak Acid + Strong Base Neutralization Forming a Weak-Base Solution (Acetic Acid + NaOH)',
    content: `HC2H3O2(aq) + H2O(l) ⇌ H3O+(aq) + C2H3O2–(aq)

Acetic acid, HC2H3O2, ionizes according to the equation above. A solution is prepared by combining a sample of HC2H3O2(aq) with a sample of NaOH(aq).

(a) Write the balanced net ionic equation for the acid-base reaction that occurs between HC2H3O2 and NaOH.
(b) In a certain experiment, a 50.0 mL sample of 0.40 M HC2H3O2(aq) is combined with a 50.0 mL sample of 0.40 M NaOH(aq). (Assume volumes are additive.) The resulting solution has a pH greater than 7. The acetate ion, C2H3O2–, behaves as a weak base:

C2H3O2–(aq) + H2O(l) ⇌ HC2H3O2(aq) + OH–(aq)     Kb = ?

(i) The value of Ka for HC2H3O2 is 1.8 × 10⁻⁵. Calculate the value of Kb for the acetate ion, C2H3O2–.
(ii) Calculate the concentration of C2H3O2– in the combined solution.
(iii) Calculate the pH of the combined solution.`,
    answer: `(a) HC2H3O2(aq) + OH–(aq) → C2H3O2–(aq) + H2O(l)

(b) Since both samples are 50.0 mL of 0.40 M (equimolar, 0.0200 mol each), the reaction goes to completion, converting all of the acid into 0.0200 mol C2H3O2– (total volume 100.0 mL).

(i) Kb = Kw/Ka = (1.0 × 10⁻¹⁴)/(1.8 × 10⁻⁵) = 5.6 × 10⁻¹⁰.

(ii) [C2H3O2–] = 0.0200 mol / 0.1000 L = 0.200 M.

(iii) x²/(0.200 – x) ≈ x²/0.200 = 5.6 × 10⁻¹⁰. x² = 1.11 × 10⁻¹⁰. x = [OH–] = 1.05 × 10⁻⁵ M. pOH = 4.98. pH = 14.00 – 4.98 = 9.02.`,
  },
  {
    title: 'Episode Review Q3 — Weak Base + Strong Acid Titration and Sign of Equivalence-Point pH (Aniline)',
    content: `C6H5NH2(aq) + H2O(l) ⇌ C6H5NH3+(aq) + OH–(aq)     Kb = 4.0 × 10⁻⁴

Aniline, C6H5NH2, ionizes according to the equation above. A student is given a solution of aniline and asked to determine its concentration by titration with HCl(aq).

(a) Write the balanced net ionic equation for the acid-base reaction between C6H5NH2 and HCl.
(b) The student titrates a 25.0 mL sample of C6H5NH2(aq) with 1.24 M HCl(aq). The end point is reached after 16.63 mL of HCl has been added. Calculate the molarity of the C6H5NH2(aq) solution.
(c) Do you predict that the solution at the equivalence point will have a pH less than 7, equal to 7, or greater than 7? Write a balanced net ionic equation to support your prediction.`,
    answer: `(a) C6H5NH2(aq) + H3O+(aq) → C6H5NH3+(aq) + H2O(l)

(b) Moles HCl = 0.01663 L × 1.24 M = 0.02062 mol = moles C6H5NH2 (1:1 ratio). [C6H5NH2] = 0.02062 mol / 0.0250 L = 0.825 M.

(c) Less than 7 (acidic). At the equivalence point, all of the C6H5NH2 has been converted into its conjugate acid, C6H5NH3+, which is a weak acid that hydrolyzes: C6H5NH3+(aq) + H2O(l) ⇌ C6H5NH2(aq) + H3O+(aq), producing excess H3O+ and making the solution acidic.`,
  },
  {
    title: 'Episode Review Q4 — Combining a Weak Acid and Weak Base and Predicting Acidic/Basic Character (HNO2 + Pyridine)',
    content: `Equation #1: HNO2(aq) + H2O(l) ⇌ H3O+(aq) + NO2–(aq)     Ka = 4.0 × 10⁻⁴
Equation #2: C5H5N(aq) + H2O(l) ⇌ C5H5NH+(aq) + OH–(aq)     Kb = 1.7 × 10⁻⁹

(a) Write the balanced net ionic equation for the acid-base reaction that occurs when solutions of HNO2(aq) and C5H5N(aq) are mixed together.
(b) Calculate each of the following:
(i) the value of Kb for the NO2– ion
(ii) the value of Ka for the C5H5NH+ ion
(c) A 50.0 mL sample of 0.10 M HNO2(aq) is combined with a 50.0 mL sample of 0.10 M C5H5N(aq). Is the resulting solution acidic, basic, or neutral? Justify your answer by comparing the values of Ka and Kb calculated in part (b).`,
    answer: `(a) HNO2(aq) + C5H5N(aq) → NO2–(aq) + C5H5NH+(aq)

(b)(i) Kb(NO2–) = Kw/Ka(HNO2) = (1.0 × 10⁻¹⁴)/(4.0 × 10⁻⁴) = 2.5 × 10⁻¹¹.

(ii) Ka(C5H5NH+) = Kw/Kb(C5H5N) = (1.0 × 10⁻¹⁴)/(1.7 × 10⁻⁹) = 5.9 × 10⁻⁶.

(c) Acidic. Since equal moles of HNO2 and C5H5N are combined (0.0050 mol each), the products NO2– and C5H5NH+ are also formed in equal moles. Comparing Ka(C5H5NH+) = 5.9 × 10⁻⁶ to Kb(NO2–) = 2.5 × 10⁻¹¹: since Ka(C5H5NH+) >> Kb(NO2–), the conjugate acid C5H5NH+ ionizes much more extensively than the conjugate base NO2– hydrolyzes, producing a net excess of H3O+ — making the solution acidic.`,
  },
];

/* ============================= 8.5 — Acid-Base Titrations (Episode #25) ============================= */
const t85 = [
  {
    title: 'Episode Review Q5 — Relative Acid and Base Strength from an Equilibrium Constant (HCN + F– ⇌ HF + CN–)',
    content: `HCN(aq) + F–(aq) ⇌ HF(aq) + CN–(aq)     Keq = 9.1 × 10⁻⁷

What are the relative strengths of the acids and bases in the reaction represented by the equation above?

Acid Strength | Base Strength
(A) HCN > HF | CN– > F–
(B) HCN > HF | CN– < F–
(C) HCN < HF | CN– > F–
(D) HCN < HF | CN– < F–`,
    answer: `(C). Since Keq < 1, the reverse reaction is favored at equilibrium, meaning the stronger acid and stronger base are found on the RIGHT side of the equation (the side favored at equilibrium): HF is the stronger acid (HCN < HF), and CN– is the stronger base (CN– > F–).`,
  },
  {
    title: 'Episode Review Q6 — Identifying the Reaction Behind a Titration Curve (Weak Base + Strong Acid)',
    imageKey: 'ep25_q6',
    content: `A titration curve shows pH starting at approximately 11.8, gradually declining through a broad buffer-like region to about pH 9 by 10-12 mL, then dropping steeply (from about pH 9 to pH 3) centered at 12 mL of 0.10 M acid added, and leveling off near pH 1.5-2 by 20 mL.

Which of the following molecular equations could represent the reaction used to generate this titration curve?

(A) NaOH(aq) + HCl(aq) → H2O(l) + NaCl(aq)
(B) KOH(aq) + HF(aq) → H2O(l) + KF(aq)
(C) CH3NH2(aq) + HBr(aq) → CH3NH3Br(aq)
(D) NH3(aq) + 3 Cl2(g) → NCl3(l) + 3 HCl(aq)`,
    answer: `(C). The gradual, continuously declining pre-equivalence region (rather than a flat plateau) is characteristic of titrating a WEAK base with a strong acid (a buffer region formed by the weak base and its conjugate acid). The very low final pH plateau (~1.5-2) after the equivalence point requires the titrant to be a genuinely STRONG acid (only excess strong acid drives pH that low) — ruling out (B), where HF is a weak acid titrant. Option (A) is a strong acid/strong base reaction, which would show a much flatter pre-equivalence region rather than the observed gradual decline. Option (D) is not even an acid-base neutralization (it's a substitution/redox-type reaction), so it doesn't fit the titration format at all. Option (C), CH3NH2 (a weak base) titrated with HBr (a strong acid), matches all three features of the curve.`,
  },
  {
    title: 'Episode Review Q7 — Determining Ka for Trimethylamine\'s Conjugate Acid and the pH Range for Majority Protonation',
    content: `(CH3)3N(aq) + H2O(l) ⇌ (CH3)3NH+(aq) + OH–(aq)     Kb = 6.5 × 10⁻⁵

Trimethylamine, (CH3)3N, is a weak base that ionizes according to the equation above.

(a) Calculate the Ka value and the pKa value for the conjugate acid, (CH3)3NH+.
(b) A sample of strong acid is slowly added to a solution of trimethylamine. On the number scale 1 through 14, identify each whole-number pH for which more than 50 percent of the (CH3)3N molecules are in the protonated form, (CH3)3NH+. Justify your answer.`,
    answer: `(a) Ka = Kw/Kb = (1.0 × 10⁻¹⁴)/(6.5 × 10⁻⁵) = 1.5 × 10⁻¹⁰. pKa = –log(1.5 × 10⁻¹⁰) = 9.81.

(b) More than 50% of (CH3)3N is in the protonated form, (CH3)3NH+, whenever pH < pKa (9.81) of the conjugate acid. This is true for every whole-number pH from 1 through 9 (since all of these are less than 9.81), but NOT for pH = 10 or higher (since 10 > 9.81, at which point less than 50% would be protonated).`,
  },
  {
    title: 'Episode Review Q8 — Choosing the Best Indicator for a Titration (Methyl Red vs. Others)',
    imageKey: 'ep26_q6',
    content: `A sample of a base is titrated with 0.10 M HCl, and the results are shown in a titration curve: pH starts near 11, gradually declines to about pH 8 by 14 mL, then drops steeply (from about pH 8 to pH 2.5) centered at 15 mL, leveling off near pH 1.5-2 by 20 mL. Based on the pH range of the color change given for each indicator, which of the following indicators would be the best choice for the titration?

(A) Orange IV; 1.4 – 2.8
(B) Methyl red; 4.4 – 6.2
(C) Phenolphthalein; 8.3 – 10.0
(D) Alizarine Yellow R; 10.1 – 12.0`,
    answer: `(B). The equivalence point occurs at the steepest part of the curve, at 15 mL, where the pH passes through approximately 5 (the midpoint of the jump from ~8 down to ~2.5). This falls squarely within methyl red's color-change range (4.4–6.2), making it the best choice. The other indicators' ranges (very low, very high, or high) do not overlap with the equivalence-point pH region of this curve.`,
  },
  {
    title: 'Episode Review Q9 — Choosing the Best Indicator for an Unknown Monoprotic Acid Titration',
    imageKey: 'ep26_q8',
    content: `HA(aq) + OH–(aq) → H2O(l) + A–(aq)

A 10.0 mL sample of an unknown monoprotic acid, HA, is titrated with 0.10 M NaOH(aq). The titration curve shows pH starting near 3, rising gradually to about pH 6 by 17 mL, then jumping steeply (from about pH 6.5 to pH 11) centered at 18 mL, and leveling off near pH 12-12.5 by 24 mL.

The same titration is to be performed again, this time using an indicator. The following acid-base indicators are available: Bromocresol green indicator (pKa = 4.9), Phenolphthalein indicator (pKa = 9.4).

(a) On the titration curve, indicate the location of the pKa value for both bromocresol green (4.9) and phenolphthalein (9.4).
(b) Which indicator, bromocresol green or phenolphthalein, is the better choice to use in this titration experiment? Justify your answer.`,
    answer: `(a) Bromocresol green's pKa (4.9) falls in the gradual pre-equivalence buffering region of the curve (around 3-4 mL added), well before the equivalence point. Phenolphthalein's pKa (9.4) falls right within the steep equivalence-point jump (which occurs between approximately pH 6.5 and 11, centered at 18 mL).

(b) Phenolphthalein is the better choice. Its pKa (9.4) is very close to the pH at the equivalence point of this titration (which falls within the steep vertical jump around 18 mL), so its color change will occur right at the equivalence point. Bromocresol green's pKa (4.9) falls in the gradual buffer region well before equivalence, so it would change color too early — long before the titration reaches its true equivalence point.`,
  },
  {
    title: 'Episode Review Q10 — Full Analysis of a Weak Acid Titration Curve (Propanoic Acid): Concentration, pKa, and Particle Diagram',
    imageKey: 'ep25_q9',
    content: `HC3H5O2(aq) + H2O(l) ⇌ H3O+(aq) + C3H5O2–(aq)

Propanoic acid, HC3H5O2, ionizes according to the equation above. A student determines the molar concentration of a HC3H5O2(aq) solution by titration with a standardized 0.420 M KOH(aq) solution, using a buret, flask, indicator, and pH probe. The titration curve produced when a 15.0 mL sample of the HC3H5O2(aq) solution was titrated shows pH starting near 3, rising gradually to about pH 6.5 by 18 mL, then jumping steeply (from about pH 7 to pH 12) centered at 20.0 mL, and leveling off near pH 13 by 40 mL.

(a) Calculate the molarity of HC3H5O2 in the 15.0 mL sample of solution used in this titration.
(b) Use the graph to determine the approximate value of pKa for propanoic acid.
(c) Based on your answer to part (b), calculate the value of Ka for propanoic acid.

The particle diagram shown is an incomplete representation of the solution in the flask at a certain point during the titration: it currently shows 4 particles, all drawn as HC3H5O2 (open circle attached to filled circle), with zero C3H5O2– particles (filled circle alone) shown.

(d) Complete the particle diagram by describing the species that should be added to accurately represent the relative amounts of HC3H5O2 and C3H5O2– present in the solution after a volume of 10.0 mL of 0.420 M KOH has been added to the flask.
(e) The student repeats the titration using the same solutions, this time titrating a 30.0 mL sample of the HC3H5O2(aq) solution instead of 15.0 mL. Describe the titration curve that would be expected for this second trial, compared to the first.`,
    answer: `(a) At the equivalence point (20.0 mL of 0.420 M KOH), moles KOH = 0.0200 L × 0.420 M = 0.00840 mol = moles HC3H5O2 initially. [HC3H5O2] = 0.00840 mol / 0.0150 L = 0.560 M.

(b) The half-equivalence point occurs at 10.0 mL (half of 20.0 mL). Reading the pH at 10.0 mL from the graph gives approximately pH 4.9, so pKa ≈ 4.9.

(c) Ka = 10^(–4.9) = 1.3 × 10⁻⁵.

(d) At 10.0 mL of KOH added, the titration is exactly at the half-equivalence point (half of the 20.0 mL equivalence volume), where by definition [HC3H5O2] = [C3H5O2–] (equal amounts). Since the diagram already shows 4 HC3H5O2 particles (representing the acid remaining unreacted at this point), 4 more particles should be added, each drawn as a single filled circle (no attached open circle) to represent C3H5O2–, giving an equal 4:4 ratio of HC3H5O2 to C3H5O2–.

(e) Since the acid concentration (0.560 M) is unchanged but the sample volume doubles (30.0 mL vs. 15.0 mL), the moles of acid double, so the equivalence volume of KOH needed also doubles, from 20.0 mL to 40.0 mL. The trial 2 curve should start at the same initial pH (same acid concentration), pass through the same pKa (~4.9) at the new half-equivalence point (20.0 mL instead of 10.0 mL), and reach its steep equivalence jump centered at 40.0 mL instead of 20.0 mL — essentially the same curve shape, stretched to twice the volume scale.`,
  },
];

/* ============================= 8.6 — Molecular Structure of Acids and Bases (Episode #26) ============================= */
const t86 = [
  {
    title: 'Episode Review Q1 — Comparing Ka of HOCl and HOBr via Electronegativity',
    content: `Equation 1: HOCl(aq) + H2O(l) ⇌ H3O+(aq) + ClO–(aq)
Equation 2: HOBr(aq) + H2O(l) ⇌ H3O+(aq) + BrO–(aq)

The ionization of two different acids is represented by equations 1 and 2. Which of the following identifies the acid with the larger Ka value and provides the correct justification?

Larger Ka value | Justification
(A) HOCl | The Cl atom is more effective at stabilizing the conjugate base, ClO–.
(B) HOBr | The Cl atom is more effective at stabilizing the conjugate base, ClO–.
(C) HOCl | The Br atom is more effective at stabilizing the conjugate base, BrO–.
(D) HOBr | The Br atom is more effective at stabilizing the conjugate base, BrO–.`,
    answer: `(A). Cl is more electronegative than Br, so Cl is more effective at withdrawing electron density and stabilizing the negative charge on the conjugate base (ClO–) via the inductive effect. Greater conjugate-base stabilization means HOCl ionizes more readily, giving it the larger Ka.`,
  },
  {
    title: 'Episode Review Q2 — Comparing Acid Strength Using Structure, pH Data, and Electronegativity (Haloacetic Acids)',
    imageKey: 'ep26_q2',
    content: `Information about three acids (drawn as Lewis structures): Acid 1 = CF3COOH (trifluoroacetic acid, three F atoms on the carbon adjacent to the carboxyl group), pH of 0.0010 M solution = 3.00. Acid 2 = FCH2COOH (fluoroacetic acid, one F atom), pH of 0.0010 M solution = 3.11. Acid 3 = ICH2COOH (iodoacetic acid, one I atom in place of F), pH of 0.0010 M solution = ?

(a) Which substance, acid 1 or acid 2, is the stronger acid? Justify your answer in terms of the pH of a 0.0010 M solution of each acid.
(b) Do you predict that acid 3 is a stronger acid or a weaker acid than acid 2? Justify your prediction in terms of: (i) the relative electronegativity values of fluorine (F) and iodine (I); (ii) the relative stability of the conjugate bases of acids 2 and 3.`,
    answer: `(a) Acid 1 (CF3COOH) is the stronger acid. At the same concentration (0.0010 M), acid 1 has a LOWER pH (3.00) than acid 2 (3.11), meaning acid 1 has a HIGHER [H3O+] — it ionizes to a greater extent, making it the stronger acid. This makes sense structurally: acid 1 has three highly electronegative F atoms (compared to acid 2's one F atom), which more strongly stabilize the conjugate base via the inductive effect.

(b) Acid 3 is predicted to be a WEAKER acid than acid 2.
(i) Fluorine (F) is more electronegative than iodine (I) — F is one of the most electronegative elements, while I (a larger halogen, farther down the group) is considerably less electronegative.
(ii) Since F is more electronegative than I, F stabilizes the negative charge on the conjugate base (via the inductive effect) more effectively than I does. This means acid 2's conjugate base (FCH2COO–) is more stabilized (more stable) than acid 3's conjugate base (ICH2COO–). Since a more stable conjugate base corresponds to a stronger acid, acid 2 is the stronger acid, making acid 3 the weaker acid of the two.`,
  },
  {
    title: 'Episode Review Q3 — Identifying the Acidic Hydrogen in Hydracrylic Acid',
    imageKey: 'ep26_q3',
    content: `C3H6O3(aq) + NaOH(aq) → NaC3H5O3(aq) + H2O(l)

The reaction between hydracrylic acid, C3H6O3 (structure: H–O–C(=O)–CH2–CH2–O–H, i.e., a carboxylic acid group on one end and an alcohol group on the other end), and sodium hydroxide is represented above. Circle the hydrogen atom that most readily participates in the chemical reaction with sodium hydroxide.`,
    answer: `The hydrogen atom that reacts is the one in the LEFT "H–O–" group — the hydrogen attached to the oxygen that is bonded directly to the carbonyl carbon (the carboxylic acid's O–H). This hydrogen is acidic because the resulting conjugate base is stabilized by resonance/electronegativity effects from the adjacent C=O group. The hydrogen in the RIGHT "–O–H" group (the terminal alcohol) is NOT acidic enough to react with NaOH under normal conditions — alcohols do not appreciably react with strong bases like carboxylic acids do.`,
  },
  {
    title: 'Episode Review Q4 — Identifying the Correct Lewis Structure for the Conjugate Acid of Methylamine',
    imageKey: 'ep26_q4',
    content: `The structural formula of methylamine, CH3NH2 (a weak base, with a lone pair shown on the nitrogen), is given. Which of the following best represents the structural formula of the conjugate acid of methylamine?

(A) A structure showing a lone pair on carbon instead of nitrogen, with an overall negative charge.
(B) A structure showing nitrogen bonded to a methyl carbon and three hydrogen atoms (no remaining lone pair on N), with an overall positive charge.
(C) A structure retaining the lone pair on nitrogen (only bonded to one H), with an overall negative charge.
(D) A structure showing nitrogen with a retained lone pair AND an extra H bonded to another H (rather than directly to N), with an overall positive charge.`,
    answer: `(B). The conjugate acid of methylamine, CH3NH3+, forms when the nitrogen's lone pair is used to bond a new H+ ion. The correctly drawn conjugate acid must show: nitrogen bonded to the methyl carbon and THREE hydrogen atoms (4 total bonds to N), NO remaining lone pair on nitrogen (since it was used to form the new N–H bond), and an overall +1 formal charge on the ion. Option (A) incorrectly shows a lone pair on carbon and a negative charge (wrong atom, wrong sign). Option (C) retains the lone pair on N and shows a negative charge (represents deprotonation, not protonation — the opposite of a conjugate acid). Option (D) incorrectly retains a lone pair on N while also showing an extra H bonded to another H instead of directly to N (chemically invalid connectivity).`,
  },
];

/* ============================= 8.7 — pH and pKa (Episode #26) ============================= */
const t87 = [
  {
    title: 'Episode Review Q5 — Calculating pKa and Comparing Acid/Base Form Concentrations During a Titration (Salicylic Acid)',
    content: `HC7H5O3(aq) + H2O(l) ⇌ H3O+(aq) + C7H5O3–(aq)

Salicylic acid ionizes in aqueous solution according to the equation above.

(a) The Ka for salicylic acid is 1.1 × 10⁻³. Calculate the value of pKa for salicylic acid.

A student titrates a sample of HC7H5O3(aq) with 0.010 M NaOH(aq), using a probe to monitor pH. The student is asked to predict which substance, HC7H5O3 or C7H5O3–, has a higher concentration in the flask when the pH of the titration mixture is 4.00.

(b) The student claims that the concentration of the weak acid, HC7H5O3, has a higher concentration in the flask when the pH is 4.00 because the pH is less than 7.00. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `(a) pKa = –log(1.1 × 10⁻³) = 2.96.

(b) Disagree. The correct comparison is between the solution's pH and the acid's pKa (2.96), not between pH and 7.00 (which is irrelevant here — that comparison only tells you whether a solution is neutral overall, not the protonation state of a specific weak acid). Since pH (4.00) is GREATER than pKa (2.96), the essential-knowledge rule states the BASE form has the higher concentration — meaning C7H5O3– (not HC7H5O3) has the higher concentration in the flask at this point.`,
  },
  {
    title: 'Episode Review Q6 — Choosing the Best Indicator for a Base Titrated with Strong Acid',
    imageKey: 'ep26_q6',
    content: `A sample of a base is titrated with 0.10 M HCl, and the titration curve is produced (starting near pH 11, gradually declining to about pH 8 by 14 mL, then dropping steeply through the equivalence point centered at 15 mL, down to about pH 2.5, leveling off near pH 1.5-2 by 20 mL). Based on the pH range of the color change given for each indicator, which of the following indicators would be the best choice for the titration?

(A) Orange IV; 1.4 – 2.8
(B) Methyl red; 4.4 – 6.2
(C) Phenolphthalein; 8.3 – 10.0
(D) Alizarine Yellow R; 10.1 – 12.0`,
    answer: `(B). The equivalence point occurs at the steepest part of the jump, centered at 15 mL, where the pH passes through approximately 5 — squarely within methyl red's color-change range (4.4–6.2). None of the other indicators' ranges overlap with this equivalence-point pH.`,
  },
  {
    title: "Episode Review Q7 — Finding Ka, pKa, and the pH Range for Majority Protonation of Trimethylamine's Conjugate Acid",
    content: `(CH3)3N(aq) + H2O(l) ⇌ (CH3)3NH+(aq) + OH–(aq)

Trimethylamine, (CH3)3N, is a weak base that ionizes according to the equation above.

(a) The Kb value for (CH3)3N is 6.5 × 10⁻⁵. Calculate the Ka value and pKa value for the conjugate acid, (CH3)3NH+.
(b) A sample of strong acid is slowly added to a solution of trimethylamine, and the pH is measured during the experiment. On the number scale 1 through 14, identify each whole-number pH for which more than 50 percent of the (CH3)3N molecules are in the protonated form, (CH3)3NH+. Justify your answer.`,
    answer: `(a) Ka = Kw/Kb = (1.0 × 10⁻¹⁴)/(6.5 × 10⁻⁵) = 1.5 × 10⁻¹⁰. pKa = –log(1.5 × 10⁻¹⁰) = 9.81.

(b) More than 50% of the (CH3)3N is in the protonated form, (CH3)3NH+, when pH < pKa (9.81) of the conjugate acid. This is true for whole-number pH values 1 through 9 (all less than 9.81), but not for pH = 10 or higher.`,
  },
  {
    title: 'Episode Review Q8 — Marking pKa on a Titration Curve and Selecting the Better Indicator',
    imageKey: 'ep26_q8',
    content: `HA(aq) + OH–(aq) → H2O(l) + A–(aq)

A 10.0 mL sample of an unknown monoprotic acid, HA, is titrated with 0.10 M NaOH(aq). The titration curve produced shows pH starting near 3, rising gradually to about pH 6 by 17 mL, then jumping steeply (from about pH 6.5 to pH 11) centered at 18 mL, leveling off near pH 12-12.5 by 24 mL.

The same titration is to be performed again using an indicator. Available: Bromocresol green (pKa = 4.9), Phenolphthalein (pKa = 9.4).

(a) On the titration curve, indicate the location of the pKa value for both bromocresol green (4.9) and phenolphthalein (9.4).
(b) Which indicator, bromocresol green or phenolphthalein, is the better choice for this titration? Justify your answer.`,
    answer: `(a) Bromocresol green's pKa (4.9) falls in the gradual pre-equivalence buffering region of the curve (around 3-4 mL added). Phenolphthalein's pKa (9.4) falls within the steep equivalence-point jump (between roughly pH 6.5 and 11, centered at 18 mL).

(b) Phenolphthalein is the better choice, because its pKa (9.4) is very close to the pH at the equivalence point of this titration, so its color change occurs right at the equivalence point. Bromocresol green's pKa (4.9) falls well before the equivalence point (in the gradual buffer region), so it would change color too early.`,
  },
  {
    title: 'Episode Review Q9 — Calculating [H3O+] and the Buffer Ratio from pH (HOCl/ClO– Buffer)',
    content: `HOCl(aq) + H2O(l) ⇌ H3O+(aq) + ClO–(aq)     Ka = 3.0 × 10⁻⁸

A buffer solution is prepared by combining solutions of NaOCl(aq) and HOCl(aq). The pH of the buffer solution is determined to be 7.82.

(a) Calculate the molarity of H3O+ in the buffer solution.
(b) Calculate the value of the ratio [ClO–]/[HOCl] in the buffer solution.
(c) Based on your answer to part (b), which substance, HOCl or ClO–, has a higher concentration in the buffer solution?`,
    answer: `(a) [H3O+] = 10^(–7.82) = 1.51 × 10⁻⁸ M.

(b) Using the Henderson-Hasselbalch equation: pKa = –log(3.0 × 10⁻⁸) = 7.52. 7.82 = 7.52 + log([ClO–]/[HOCl]). log(ratio) = 0.30. Ratio = 10^0.30 = 2.0.

(c) Since the ratio [ClO–]/[HOCl] ≈ 2.0 (greater than 1), ClO– has the higher concentration in the buffer solution.`,
  },
];

/* ============================= 8.8 — Properties of Buffers (Episode #26) ============================= */
const t88 = [
  {
    title: 'Episode Review Q10 — Identifying the Reaction That Resists pH Change in a Pyridine Buffer',
    content: `C5H5N(aq) + H2O(l) ⇌ C5H5NH+(aq) + OH–(aq)

Pyridine, C5H5N, reacts with water according to the equation above. A buffer solution is prepared containing equimolar amounts of C5H5N(aq) and C5H5NH+(aq). When a small amount of KOH(aq) is added, the pH changes from 5.23 to 5.25 (barely changes). Which of the following equations represents the reaction that accounts for this small pH change?

(A) C5H5NH+(aq) + OH–(aq) → C5H5N(aq) + H2O(l)
(B) C5H5N(aq) + OH–(aq) → C5H5NH+(aq) + O2–(aq)
(C) K+(aq) + OH–(aq) → KOH(aq)
(D) H+(aq) + OH–(aq) → H2O(l)`,
    answer: `(A). The buffer's conjugate acid component, C5H5NH+, reacts with the added OH– (from KOH), converting it back to C5H5N and water. This consumes the added base, preventing a large pH change — the defining behavior of a buffer.`,
  },
  {
    title: 'Episode Review Q11 — Identifying the Reaction That Resists pH Change in an HF/F– Buffer',
    content: `HF(aq) + H2O(l) ⇌ H3O+(aq) + F–(aq)

Hydrofluoric acid, HF, reacts with water according to the equation above. A buffer solution is prepared containing equimolar amounts of HF(aq) and F–(aq). When a small amount of HNO3(aq) is added, the pH changes from 3.17 to 3.15 (barely changes). Which of the following equations represents the reaction that accounts for this small pH change?

(A) HF(aq) + H3O+(aq) → H2F+(aq) + H2O(l)
(B) F–(aq) + H3O+(aq) → HF(aq) + H2O(l)
(C) NO3–(aq) + H3O+(aq) → HNO3(aq) + H2O(l)
(D) OH–(aq) + H3O+(aq) → 2 H2O(l)`,
    answer: `(B). The buffer's conjugate base component, F–, reacts with the added H3O+ (from HNO3), converting it into HF and water. This consumes the added acid, preventing a large pH change.`,
  },
  {
    title: 'Episode Review Q12 — Identifying Solution X and Predicting pH Change from Particle Diagrams (HNO2/NO2– Buffer)',
    imageKey: 'ep26_q12',
    content: `A chemist measures the pH of a solution containing equimolar amounts of HNO2(aq) and NO2–(aq) and records the pH as 3.40. The chemist then adds a small amount of solution X (either HCl(aq) or NaOH(aq)) and stirs. The particle diagrams show, before X is added: 5 HNO2 molecules (open-filled pairs) and 5 NO2– ions (filled circles alone) — equal amounts. After X is added: 6 HNO2 molecules and 4 NO2– ions.

Based on the particle diagrams, which of the following correctly identifies solution X and describes the pH of the solution at the end of the experiment?

Identity of Solution X | pH of the Mixture at the End of the Experiment
(A) HCl(aq) | Less than 3.40
(B) HCl(aq) | Greater than 3.40
(C) NaOH(aq) | Less than 3.40
(D) NaOH(aq) | Greater than 3.40`,
    answer: `(A). Comparing before (5 HNO2, 5 NO2–) to after (6 HNO2, 4 NO2–): the amount of HNO2 increased and the amount of NO2– decreased. This is consistent with an acid being added: NO2–(aq) + H3O+(aq) → HNO2(aq) + H2O(l), which converts some NO2– into HNO2 — so solution X is HCl(aq). Since [NO2–]/[HNO2] decreased (the ratio in the Henderson-Hasselbalch equation), the pH decreases below the original 3.40.`,
  },
  {
    title: 'Episode Review Q13 — Preparing a Buffer at pH = pKa by Two Different Methods (Acetic Acid)',
    content: `A student wants to prepare a buffer solution starting with a 1.0 M HC2H3O2(aq) solution. The pKa value of HC2H3O2 is 4.74.

(a) The student also has access to a solution of 1.0 M KC2H3O2(aq). How many milliliters of 1.0 M KC2H3O2(aq) must be added to a sample of 75.0 mL of 1.0 M HC2H3O2(aq) in order to prepare a buffer solution with a pH of 4.74? Justify your answer.
(b) Write the net ionic equation for the reaction between HC2H3O2(aq) and KOH(aq).
(c) How many milliliters of 1.0 M KOH(aq) must be added to a sample of 100.0 mL of 1.0 M HC2H3O2(aq) in order to prepare a buffer solution with a pH of 4.74? Justify your answer.`,
    answer: `(a) 75.0 mL. Since pH = pKa exactly when [A–] = [HA] (equal moles of conjugate base and acid), and 75.0 mL of 1.0 M HC2H3O2 contains 75.0 mmol of acid, an equal 75.0 mmol of KC2H3O2 is needed — which, since it's also 1.0 M, requires exactly 75.0 mL of the KC2H3O2 solution.

(b) HC2H3O2(aq) + OH–(aq) → C2H3O2–(aq) + H2O(l)

(c) 50.0 mL. 100.0 mL of 1.0 M HC2H3O2 contains 100.0 mmol of acid. To reach pH = pKa via partial neutralization, exactly half of the acid must be converted to its conjugate base, requiring moles OH– = ½ × 100.0 mmol = 50.0 mmol. Volume of 1.0 M KOH needed = 50.0 mmol / 1.0 M = 50.0 mL.`,
  },
];

/* ============================= 8.9 — Henderson-Hasselbalch Equation (Episode #27) ============================= */
const t89 = [
  {
    title: 'Episode Review Q1 — Calculating pKa and the pH of a Buffer Formed by Partial Neutralization (Nitrous Acid)',
    content: `HNO2(aq) + H2O(l) ⇌ H3O+(aq) + NO2–(aq)     Ka = 4.0 × 10⁻⁴

(a) Calculate the value of pKa for nitrous acid.
(b) A chemist prepares a buffer solution by combining 100.0 mL of 0.40 M NaOH(aq) with 100.0 mL of 1.0 M HNO2(aq). (Assume volumes are additive.)
(i) Write the net ionic equation for the reaction between HNO2(aq) and NaOH(aq).
(ii) Calculate the pH of this buffer solution.`,
    answer: `(a) pKa = –log(4.0 × 10⁻⁴) = 3.40.

(b)(i) HNO2(aq) + OH–(aq) → NO2–(aq) + H2O(l)

(ii) Moles NaOH = 0.1000 L × 0.40 M = 40.0 mmol (limiting). Moles HNO2 = 0.1000 L × 1.0 M = 100.0 mmol (excess). After reaction: moles NO2– formed = 40.0 mmol, moles HNO2 remaining = 100.0 – 40.0 = 60.0 mmol.

pH = pKa + log([NO2–]/[HNO2]) = 3.40 + log(40.0/60.0) = 3.40 + (–0.176) = 3.22.`,
  },
  {
    title: 'Episode Review Q2 — Selecting the Correct Henderson-Hasselbalch Set-Up for an Ammonia Buffer',
    content: `A buffer solution is prepared in a beaker containing 100.0 mL of a solution that is 0.85 M NH3 and 0.65 M NH4NO3. The Kb value for NH3 is 1.8 × 10⁻⁵. Which of the following mathematical expressions can be used to determine the approximate pH of this buffer solution?

(A) pH = –log(1.8 × 10⁻⁵) + log(0.65/0.85) = 4.63
(B) pH = –log(1.8 × 10⁻⁵) + log(0.85/0.65) = 4.86
(C) pH = [14.00 + log(1.8 × 10⁻⁵)] + log(0.65/0.85) = 9.14
(D) pH = [14.00 + log(1.8 × 10⁻⁵)] + log(0.85/0.65) = 9.37`,
    answer: `(D). The Henderson-Hasselbalch equation requires pKa (of the conjugate acid, NH4+), not pKb. Since pKa = 14.00 – pKb = 14.00 + log(Kb) [because pKb = –log(Kb)], pKa = 14.00 + log(1.8 × 10⁻⁵) = 14.00 – 4.745 = 9.255. The ratio must be [base]/[acid] = [NH3]/[NH4+] = 0.85/0.65 (not inverted). pH = 9.255 + log(0.85/0.65) = 9.255 + 0.117 = 9.37.`,
  },
  {
    title: 'Episode Review Q3 — Calculating the Buffer Ratio and pH for an HF/F– Buffer',
    content: `A student prepares a buffer solution by mixing 100.0 mL of 1.00 M HF(aq) with 100.0 mL of 1.10 M NaF(aq). The pKa of HF is 3.17. Which of the following shows the correct values for both the ratio [F–]/[HF] and the pH of this solution?

[F–]/[HF] | pH of Buffer Solution
(A) 0.909 | 3.13
(B) 0.909 | 3.21
(C) 1.10 | 3.13
(D) 1.10 | 3.21`,
    answer: `(D). Since both solutions are combined in equal volumes (both diluted by the same factor), the ratio [F–]/[HF] simplifies to the ratio of the original concentrations: 1.10 M / 1.00 M = 1.10. pH = pKa + log(ratio) = 3.17 + log(1.10) = 3.17 + 0.0414 = 3.21.`,
  },
];

/* ============================= 8.10 — Buffer Capacity (Episode #27) ============================= */
const t810 = [
  {
    title: 'Episode Review Q4 — Identifying Which Buffer Has Greater Capacity for Added Acid vs. Base',
    content: `Solution | Composition | Volume | pH
#1 | 1.0 M HC2H3O2(aq) and 2.0 M KC2H3O2(aq) | 1.0 L | 5.04
#2 | 2.0 M HCN(aq) and 1.0 M KCN(aq) | 1.0 L | 8.91

Based on this information, which of the following statements regarding buffer capacity is correct?

(A) Solution #1 has a greater buffer capacity for the addition of added base than acid, because the pH of the solution is less than 7.
(B) Solution #1 has a greater buffer capacity for the addition of added acid than base, because the number of moles of C2H3O2– is greater than that of HC2H3O2.
(C) Solution #2 has a greater buffer capacity for the addition of added base than acid, because the pH of the solution is greater than 7.
(D) Solution #2 has a greater buffer capacity for the addition of added acid than base, because the number of moles of HCN is greater than that of CN–.`,
    answer: `(B). A buffer with MORE conjugate base than acid has a greater capacity to neutralize ADDED ACID (since there's more base available to react with it). Solution #1 has more C2H3O2– (2.0 mol) than HC2H3O2 (1.0 mol), so it has greater capacity for added acid than base — matching option (B)'s conclusion and its correct mole-based justification. (Options (A) and (C) use an irrelevant justification — comparing pH to 7 does not determine buffer capacity direction. Option (D) reaches the wrong conclusion — more HCN than CN– means greater capacity for added BASE, not added acid.)`,
  },
  {
    title: 'Episode Review Q5 — Comparing pH, Total Moles, and Buffer Capacity Between Two HOCl/ClO– Buffers of Different Concentration',
    content: `Two solutions are prepared by combining HClO(aq) and KClO(aq):

Solution | How the solution is prepared
#1 | 1.0 L of 0.20 M HClO combined with 1.0 L of 0.20 M KClO
#2 | 1.0 L of 2.0 M HClO combined with 1.0 L of 2.0 M KClO

(a) The Ka for HClO is 3.0 × 10⁻⁸. Calculate the pH of solution #1.
(b) Is the pH of solution #2 less than, greater than, or equal to the pH of solution #1? Justify your answer.

A sample of 0.10 mol NaOH(s) is added to each solution and dissolved completely (assume negligible volume change).

(c) Which solution, #1 or #2, should experience a greater change in pH as a result of the 0.10 mol NaOH addition? Justify your prediction in terms of: (i) the number of moles of the buffer components; (ii) the buffer capacity.`,
    answer: `(a) Since HClO and ClO– are combined in equal moles (equimolar, ratio = 1), pH = pKa = –log(3.0 × 10⁻⁸) = 7.52.

(b) Equal to the pH of solution #1. Both solutions have the same 1:1 ratio of HClO to ClO– (equimolar in both cases), and pH depends only on this ratio (and pKa, which is the same substance/temperature) — not on the absolute concentration. So the pH is the same (7.52) in both solutions, despite solution #2 being ten times more concentrated.

(c) Solution #1 should experience the greater pH change. (i) Solution #1 contains only 0.20 mol each of HClO and ClO– (far fewer total moles of buffer components) compared to solution #2's 2.0 mol each. (ii) Because solution #1 has far fewer moles of buffer components, it has a much SMALLER buffer capacity — the 0.10 mol of added NaOH consumes half of solution #1's HClO (a large fraction of its capacity) but only 5% of solution #2's HClO, so solution #1 (the lower-capacity buffer) experiences a much greater change in pH.`,
  },
];

/* ============================= 7.13 — pH and Solubility (Episode #27; DB places this content in Unit 7, not Unit 8) ============================= */
const t713 = [
  {
    title: 'Episode Review Q6 — Identifying Solution X from Observed Precipitation (Ca(OH)2)',
    content: `Ca(OH)2(s) ⇌ Ca2+(aq) + 2 OH–(aq)     Ksp = 5.0 × 10⁻⁶

A chemist prepares a saturated solution of Ca(OH)2(aq) by adding excess Ca(OH)2(s) to distilled water and stirring until no more solid dissolves. The chemist then adds a few drops of solution X (either HNO3(aq) or NaOH(aq)) and observes that the solution turns cloudy (a precipitate forms). Which of the following indicates the correct comparison of Q and Ksp when solution X is added, and correctly identifies solution X?

Comparison of Q and Ksp | Identity of Solution X
(A) Q is less than Ksp | HNO3(aq)
(B) Q is less than Ksp | NaOH(aq)
(C) Q is greater than Ksp | HNO3(aq)
(D) Q is greater than Ksp | NaOH(aq)`,
    answer: `(D). Since a precipitate forms (cloudiness), the system must have shifted toward the solid, which requires Q to become GREATER than Ksp. This happens when [OH–] is INCREASED — which occurs when solution X is NaOH(aq) (adding a common ion, OH–, directly raises the ion product Q above Ksp). (If X were HNO3, the added H3O+ would REACT with and REMOVE OH–, decreasing [OH–] and causing Q < Ksp — favoring more dissolution and a clearer, not cloudier, solution — the opposite of what was observed.)`,
  },
  {
    title: 'Episode Review Q7 — Effect of Adding Strong Acid on Undissolved Mg(OH)2',
    content: `Mg(OH)2(s) ⇌ Mg2+(aq) + 2 OH–(aq)     Ksp = 5.6 × 10⁻¹²

A student prepared a saturated solution of Mg(OH)2(aq) by adding excess Mg(OH)2(s) to a beaker of distilled water and stirring until no more solid dissolves. The student then adds several drops of concentrated HNO3(aq) to the mixture. Does the amount of undissolved Mg(OH)2(s) increase, decrease, or remain the same as the HNO3(aq) is added? Justify your prediction with a comparison of Q and Ksp.`,
    answer: `Decreases. The H3O+ from HNO3(aq) reacts with OH–(aq): H3O+(aq) + OH–(aq) → 2 H2O(l), decreasing [OH–]. Since Ksp = [Mg2+][OH–]², this decrease in [OH–] makes Q less than Ksp. The equilibrium shifts to produce more Mg2+ and OH– (dissolving more solid) until equilibrium is re-established, resulting in less undissolved Mg(OH)2(s).`,
  },
  {
    title: 'Episode Review Q8 — Identifying the Net Ionic Equation Responsible for Increased AgCN Solubility in Acid',
    content: `AgCN(s) ⇌ Ag+(aq) + CN–(aq)     Ksp = 6.0 × 10⁻¹⁷

The molar solubility of AgCN increases when it is dissolved in 0.50 M HNO3(aq) instead of neutral distilled water. Which of the following represents the balanced, net-ionic equation for the process that occurs between species in solution that contributes to the increased solubility of AgCN in HNO3(aq)?

(A) Ag+(aq) + CN–(aq) ⇌ AgCN(s)
(B) H3O+(aq) + CN–(aq) ⇌ HCN(aq) + H2O(l)
(C) H3O+(aq) + AgCN(s) ⇌ HCN(aq) + AgOH(s)
(D) H3O+(aq) + NO3–(aq) ⇌ HNO3(aq) + H2O(l)`,
    answer: `(B). CN– is the conjugate base of the weak acid HCN, so it reacts with the H3O+ provided by HNO3: H3O+(aq) + CN–(aq) ⇌ HCN(aq) + H2O(l). This lowers [CN–] in solution, making Q less than Ksp for AgCN, which shifts the AgCN(s) ⇌ Ag+(aq) + CN–(aq) equilibrium toward more dissolution — increasing solubility. (Option (C) incorrectly shows a reaction between H3O+ and the undissolved SOLID directly — the undissolved solid does not appear in the Ksp expression and does not react directly with H3O+ in a way that counts toward this explanation.)`,
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
    imgMap['ep25_q6'] = await uploadImage('ep25_q6_graph.png', 'ep25-q6-titration-curve.png');
    imgMap['ep25_q9'] = await uploadImage('ep25_q9_particles.png', 'ep25-q9-particle-diagram.png');
    imgMap['ep26_q2'] = await uploadImage('ep26_q2_table.png', 'ep26-q2-haloacetic-acids-lewis-table.png');
    imgMap['ep26_q3'] = await uploadImage('ep26_q3_structure.png', 'ep26-q3-hydracrylic-acid-structure.png');
    imgMap['ep26_q4'] = await uploadImage('ep26_q4_structures.png', 'ep26-q4-methylamine-conjugate-acid-options.png');
    imgMap['ep26_q6'] = await uploadImage('ep26_q6_graph.png', 'ep26-q6-base-hcl-titration-curve.png');
    imgMap['ep26_q8'] = await uploadImage('ep26_q8_graph.png', 'ep26-q8-unknown-acid-titration-curve.png');
    imgMap['ep26_q12'] = await uploadImage('ep26_q12_particles.png', 'ep26-q12-hno2-no2-particle-diagram.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t85) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t86) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t87) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t88) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('8.1', t81);
    await insertTopic('8.2', t82);
    await insertTopic('8.3', t83);
    await insertTopic('8.4', t84);
    await insertTopic('8.5', t85);
    await insertTopic('8.6', t86);
    await insertTopic('8.7', t87);
    await insertTopic('8.8', t88);
    await insertTopic('8.9', t89);
    await insertTopic('8.10', t810);
    await insertTopic('7.13', t713);
    console.log('Done — Unit 8 Episode Review (Episodes #24-27) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
