const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '8.6': 'b382c0d0-33cc-41ad-a010-2c4caeac59aa',
  '8.7': 'afcc432c-80b0-43a4-9469-385c9da09b7c',
  '8.8': 'cfc4e526-70f2-4636-9c55-0fb55591ce49',
  '8.9': 'd2c7ffc4-4f89-4426-8f8e-5d2beff60214',
  '8.10': '156d1f74-e16e-4505-bdb3-786f1edf8bef',
  '7.13': 'd9895411-191b-48e3-9a4c-6028cabdb046',
};

/* ============================= 8.6 — Molecular Structure of Acids and Bases ============================= */
const t86 = [
  {
    title: 'Q1 — Kb for the Conjugate Base of a Strong Acid (Cl-)',
    content: `HCl(aq) + H2O(l) ⇌ H3O+(aq) + Cl-(aq)     Ka = 1.0 x 10^6

Cl-(aq) + H2O(l) ⇌ HCl(aq) + OH-(aq)     Kb = ?

(a) HCl and Cl- represent a conjugate acid-base pair. Calculate the value of Kb for the reaction represented by the second equation above.
(b) Which is true: the Cl- ion is not likely to react with H2O to form OH- ions, or the Cl- ion is very likely to react with H2O to form OH- ions?
(c) Justify your choice in part (b) in terms of the magnitude of the Kb value calculated in part (a).`,
    answer: `(a) Kb = Kw/Ka = (1.0x10^-14)/(1.0x10^6) = 1.0 x 10^-20.

(b) The Cl- ion is NOT likely to react with H2O to form OH- ions.

(c) The calculated Kb value (1.0 x 10^-20) is extraordinarily small — vastly smaller than 1, indicating that the equilibrium for Cl- + H2O ⇌ HCl + OH- lies overwhelmingly to the left (toward the reactants). This confirms that Cl- is an exceptionally weak base (essentially non-basic in practice) and does not meaningfully react with water to produce OH- — consistent with the general rule that the conjugate base of a strong acid is always a negligibly weak base.`,
  },
  {
    title: 'Q2 — Carboxylic Acids: Structure, Ionization, and Resonance Stabilization',
    content: `Carboxylic acids are one common class of weak acid, with the general formula RCO2H, where R represents a group of atoms (mostly carbon and hydrogen) bonded to the -CO2H portion of the molecule.

(a) Acetic acid, CH3CO2H, is a weak acid found in household vinegar — one example of a carboxylic acid.
   (i) Describe the Lewis diagram for acetic acid (the central carbon of the -CO2H group is double-bonded to one O and single-bonded to another O-H; the other central carbon is bonded to 3 H atoms and to the carboxyl carbon).
   (ii) Write the balanced chemical equation for the ionization of CH3CO2H in aqueous solution.
   (iii) The acidic behavior of a carboxylic acid is supported by the fact that its conjugate base, RCO2-, is stabilized by resonance, which delocalizes the negative charge over several atoms. Describe the two resonance forms of the acetate ion, CH3CO2-.
(b) For propanoic acid (CH3CH2CO2H) and salicylic acid (HC7H5O3), identify which specific H atom is lost as a H+ ion when each carboxylic acid molecule reacts as a H+ donor.`,
    answer: `(a) (i) Acetic acid's Lewis diagram: a central C bonded to 3 H atoms (the "methyl" carbon) is single-bonded to a second central C; this second C is double-bonded to one O (with 2 lone pairs) and single-bonded to a second O (with 2 lone pairs), which is in turn bonded to an H atom. This -C(=O)-O-H arrangement is the carboxyl (-CO2H) functional group.

(ii) CH3CO2H(aq) + H2O(l) ⇌ CH3CO2-(aq) + H3O+(aq)

(iii) The two resonance forms of CH3CO2- both show the same carbon-oxygen connectivity (C bonded to two O atoms), but differ in which C-O bond is drawn as the double bond: in one resonance form, the double bond is to the "left" oxygen (with a full negative charge and 3 lone pairs on the "right" oxygen); in the other resonance form, the double bond is to the "right" oxygen (with a full negative charge and 3 lone pairs on the "left" oxygen). The true structure is an average (hybrid) of these two forms, with the negative charge delocalized equally over both oxygen atoms — this delocalization stabilizes the ion, making acetic acid a better proton donor (more acidic) than it would be if the negative charge were localized on a single oxygen.

(b) For propanoic acid (CH3CH2CO2H): the H atom that is lost is the one bonded to the single-bonded oxygen in the -CO2H group (the O-H hydrogen), NOT any of the C-H hydrogens on the carbon chain. For salicylic acid (HC7H5O3): likewise, the H atom that is lost is the one bonded to the carboxyl oxygen (O-H) in its -CO2H group, not the aromatic ring C-H hydrogens or the other O-H (phenol) hydrogen on the ring (which is a much weaker acid site than the carboxylic acid O-H).`,
  },
  {
    title: 'Q3 — Writing the Ionization Equation for a Weak Base (Ethylamine)',
    content: `NH3(aq) + H2O(l) ⇌ NH4+(aq) + OH-(aq)     Kb = 1.8 x 10^-5

Ammonia, NH3, is one example of a weak base, as shown by the equation above. Ethylamine, CH3CH2NH2, is another example of a weak base that reacts with water in a similar way to NH3. Write the balanced chemical equation for the ionization of ethylamine in aqueous solution.`,
    answer: `CH3CH2NH2(aq) + H2O(l) ⇌ CH3CH2NH3+(aq) + OH-(aq)

(Just like NH3, the nitrogen atom's lone pair in ethylamine accepts a proton from water, forming the protonated ethylammonium cation, CH3CH2NH3+, and releasing a hydroxide ion, OH-.)`,
  },
  {
    title: 'Q4 — Comparing Acid Strength for HOCl, HOBr, and HOI Based on Electronegativity',
    content: `Acid | HOCl | HOBr | HOI
Ka | 2.9 x 10^-8 | 2.4 x 10^-9 | 2.3 x 10^-11

Which of these acids is the strongest acid? Justify your answer in terms of the Ka value and the electronegativity of the halogen atom (X) in each H-O-X acid.`,
    answer: `HOCl is the strongest acid of the three, since it has the largest Ka value (2.9 x 10^-8).

This is explained by the electronegativity of the halogen (X = Cl, Br, or I): electronegativity decreases going down the halogen group (Cl > Br > I). As the electronegativity of X increases, two effects increase the acid's strength: (1) electron density is pulled away from the H-O bond, weakening and polarizing it, making it easier to break (release H+); and (2) the resulting conjugate base (OX-) is stabilized by X pulling electron density away from the negatively charged oxygen, making the conjugate base more stable and the forward (acid-ionizing) reaction more favorable. Since Cl is the most electronegative of the three halogens, HOCl experiences both stabilizing effects most strongly, making it the strongest acid of the three (consistent with it having the largest Ka).`,
  },
  {
    title: 'Q5 — Comparing Acid Strength for HOCl, HClO2, and HClO3 (Oxyacids)',
    content: `Acid | HOCl | HClO2 | HClO3
Ka | 2.9 x 10^-8 | 1.1 x 10^-2 | 5.0 x 10^2

These acids are known as oxyacids — they contain a hydrogen atom bonded to an oxygen atom, with additional oxygen atoms bonded to the central Cl atom in HClO2 and HClO3. Which of these acids is the strongest acid? Justify your answer in terms of the Ka value and the number of oxygen atoms bonded to the central atom.`,
    answer: `HClO3 is the strongest acid of the three, since it has the largest Ka value (5.0 x 10^2) — in fact, this Ka value is so large that HClO3 behaves essentially as a strong acid.

This trend is explained by the number of oxygen atoms bonded to the central Cl atom: HOCl has one O atom bonded to Cl, HClO2 has two, and HClO3 has three. As the number of oxygen atoms increases, two effects increase the acid's strength: (1) each additional highly electronegative oxygen atom pulls more electron density away from the O-H bond, weakening and polarizing it, favoring its breaking; and (2) each additional oxygen atom provides another site over which the negative charge of the conjugate base can be delocalized (spread out via resonance), stabilizing the conjugate base. Since HClO3 has the most oxygen atoms (three) bonded to the central Cl, it benefits the most from both effects, making it the strongest acid of the three.`,
  },
];

/* ============================= 8.7 — pH and pKa ============================= */
const t87 = [
  {
    title: 'Q6 — Predicting Relative Concentrations of HA and A- from pH vs. pKa',
    content: `Acid | pKa
HC2H3O2 | 4.74
NH4+ | 9.26

(a) A solution is prepared by combining samples of HC2H3O2(aq) and NaOH(aq). The pH of the combined solution is equal to 4.00. Which substance, HC2H3O2 or C2H3O2-, is present in a higher concentration in the combined solution? Justify your answer.
(b) A particulate representation of a solution made by combining HC2H3O2(aq) and NaC2H3O2(aq) shows 4 HC2H3O2 particles and 8 C2H3O2- particles (water molecules and Na+ ions not shown). Is the pH of this solution less than, greater than, or equal to 4.74? Justify your answer.
(c) A student titrates 50.0 mL of 1.0 M NH4Cl(aq) with 1.0 M NaOH(aq). Three points on the titration curve, labeled X, Y, and Z, occur at volumes of NaOH added of approximately 15 mL, 25 mL (the half-equivalence point, where pH = pKa = 9.26), and 35 mL, respectively. Compare the relative concentrations of NH4+ and NH3 at each of these three points.`,
    answer: `(a) HC2H3O2 is present in a higher concentration. Since the solution's pH (4.00) is LESS than the acid's pKa (4.74), the rule "when pH < pKa, the acid form (HA) has a higher concentration than the base form (A-)" applies — so HC2H3O2 (the acid form) has a higher concentration than C2H3O2- (the base form) in this solution.

(b) Greater than 4.74. Since there are more C2H3O2- particles (8) than HC2H3O2 particles (4) in the diagram — meaning [C2H3O2-] > [HC2H3O2] — the rule "when the base form has a higher concentration than the acid form, pH > pKa" applies, so the pH of this solution must be greater than 4.74 (the pKa of acetic acid).

(c) At point X (V ≈ 15 mL, before the half-equivalence point at 25 mL): less NaOH has been added than at the half-equivalence point, so less NH4+ has been converted to NH3, meaning [NH4+] > [NH3] (still closer to the original, fully-protonated NH4Cl solution).

At point Y (V = 25 mL, the half-equivalence point): exactly half of the original NH4+ has been converted to NH3, so [NH4+] = [NH3] (this is why pH = pKa here).

At point Z (V ≈ 35 mL, past the half-equivalence point): more than half of the original NH4+ has been converted to NH3, so [NH4+] < [NH3].`,
  },
  {
    title: 'Q7 — Predicting Indicator Color from pH and pKa (Bromothymol Blue)',
    content: `Indicator | pKa | Color of Acid Form, HIn | Color of Conjugate Base Form, In-
Bromothymol Blue | 7.0 | Yellow (below pH = 6) | Blue (above pH = 8)

Three solutions of bromothymol blue (pKa = 7.0) were prepared with different pH values: 4.0, 7.0, and 10.0. Determine the expected color for each solution.`,
    answer: `pH = 4.0: Since this pH is well below the indicator's pKa (7.0) — and specifically below pH 6, where the table specifies the acid form's color directly applies — the acid form (HIn) dominates, so the solution is Yellow.

pH = 7.0: Since this pH exactly equals the indicator's pKa, [HIn] = [In-] (equal concentrations of both forms) — the solution shows an intermediate/transitional color, typically described as green (a mix of the yellow acid form and blue conjugate-base form).

pH = 10.0: Since this pH is well above the indicator's pKa (7.0) — and specifically above pH 8, where the table specifies the conjugate base form's color directly applies — the conjugate base form (In-) dominates, so the solution is Blue.`,
  },
  {
    title: 'Q8 — Titrating Potassium Sorbate to Determine Concentration, Choose an Indicator, and Estimate pKa',
    content: `Potassium sorbate, KC6H7O2, is commonly added to diet soft drinks as a preservative; its conjugate acid is sorbic acid, HC6H7O2. A student is given a stock solution of KC6H7O2(aq) of unknown concentration and titrates a sample with HCl(aq), using both an indicator and a pH meter.

(a) Write the net ionic equation for the reaction between KC6H7O2(aq) and HCl(aq).

The student titrated a 50.0 mL sample of KC6H7O2(aq) with 1.25 M HCl(aq). Based on the titration curve, the initial pH (before any titrant is added) is about 9.3, and the equivalence point is reached after 25.0 mL of the 1.25 M HCl titrant has been added, at which point the pH is about 4.8. The pH continues to fall steeply past the equivalence point.

(b) (i) Calculate the value of [C6H7O2-] in the original stock solution.
   (ii) Available indicators: Thymol Blue (pKa = 2.0), Methyl Red (pKa = 5.1), Bromothymol Blue (pKa = 7.0), Phenolphthalein (pKa = 9.3). Which indicator would be the best choice for determining the end point of this titration? Justify your answer.
   (iii) Estimate the value of pKa for sorbic acid, based on the titration curve.
(c) The pH of a soft drink is 3.37 after the addition of a sample of KC6H7O2(aq). Which substance, HC6H7O2 or C6H7O2-, has a higher concentration in the soft drink? Justify your answer.`,
    answer: `(a) C6H7O2-(aq) + H3O+(aq) → HC6H7O2(aq) + H2O(l)     (or equivalently, using H+: C6H7O2-(aq) + H+(aq) → HC6H7O2(aq))

(b) (i) At the equivalence point, moles HCl added = moles C6H7O2- originally present. Moles HCl = (1.25 M)(0.0250 L) = 0.03125 mol. [C6H7O2-] = 0.03125 mol / 0.0500 L = 0.625 M.

(ii) Methyl Red (pKa = 5.1) is the best choice. The best indicator for a titration is one whose pKa is close to the pH of the solution AT the equivalence point (approximately 4.8 in this titration). Methyl Red's pKa (5.1) is the closest match to 4.8 among the four choices, so it will change color at (or very near) the true equivalence point, giving the most accurate end point.

(iii) The pKa of sorbic acid can be estimated from the pH at the half-equivalence point of the titration (half of 25.0 mL = 12.5 mL of titrant added). Based on the shape of the titration curve (a roughly midway point on the gradual portion of the curve between the initial pH of ~9.3 and the equivalence-point pH of ~4.8), the pKa of sorbic acid is approximately 4.8 (estimated from where the curve is flattest/most buffered, roughly midway through the titration before the steep drop) — consistent with typical sorbic acid Ka values (Ka ≈ 1.7 x 10^-5, pKa ≈ 4.76).

(c) HC6H7O2 has a higher concentration. Since the solution's pH (3.37) is less than sorbic acid's pKa (≈4.8, from part iii), the acid form (HC6H7O2) has a higher concentration than the conjugate base form (C6H7O2-).`,
  },
];

/* ============================= 8.8 — Properties of Buffers ============================= */
const t88 = [
  {
    title: 'Q9 — Buffer pH Calculation and Response to Added Strong Acid/Base (Acetic Acid/Acetate)',
    content: `A buffer solution is prepared by combining 500.0 mL of 2.00 M HC2H3O2(aq) with 500.0 mL of 2.00 M NaC2H3O2(aq). The Ka for HC2H3O2 is 1.8 x 10^-5.

(a) Calculate the pH of this buffer solution.
(b) Write the net ionic equation for the reaction that occurs when HNO3(aq) (or any strong acid) is added to this buffer solution.
(c) When a small amount of HNO3(aq) is added to this buffer solution, will [HC2H3O2] increase or decrease, and will [C2H3O2-] increase or decrease?
(d) Suppose that 4.0 mL of 10.0 M HNO3(aq) is added to 1.00 L of this buffer solution (assume the buffer initially contains 1.00 mol HC2H3O2 and 1.00 mol C2H3O2- in 1.00 L). Calculate the pH of the buffer solution after HNO3(aq) is added. Assume the final volume remains 1.00 L.
(e) Suppose instead that 4.0 mL of 10.0 M HNO3(aq) is added to 1.00 L of pure water. Calculate the pH of the solution after HNO3(aq) is added. Assume the final volume remains 1.00 L.
(f) Write the net ionic equation for the reaction that occurs when KOH(aq) (or any strong base) is added to this buffer solution.
(g) When a small amount of KOH(aq) is added to this buffer solution, will [HC2H3O2] increase or decrease, and will [C2H3O2-] increase or decrease?
(h) Suppose that 4.0 mL of 10.0 M KOH(aq) is added to 1.00 L of this buffer solution (1.00 mol HC2H3O2 and 1.00 mol C2H3O2- initially). Calculate the pH of the buffer solution after KOH(aq) is added. Assume the final volume remains 1.00 L.
(i) Suppose instead that 4.0 mL of 10.0 M KOH(aq) is added to 1.00 L of pure water. Calculate the pH of the solution after KOH(aq) is added. Assume the final volume remains 1.00 L.`,
    answer: `(a) Since equal volumes of equal concentrations of HC2H3O2 and C2H3O2- are combined, [HC2H3O2] = [C2H3O2-] = 1.00 M each (equimolar buffer). Since the amounts are equal, [H3O+] = Ka = 1.8x10^-5. pH = -log(1.8x10^-5) = 4.74 (= pKa).

(b) C2H3O2-(aq) + H3O+(aq) → HC2H3O2(aq) + H2O(l)

(c) [HC2H3O2] will increase (the added H3O+ converts some C2H3O2- into HC2H3O2). [C2H3O2-] will decrease.

(d) Moles HNO3 added = (10.0 M)(0.0040 L) = 0.040 mol. RICE (moles): Initial: C2H3O2- = 1.00, H3O+ = 0.040, HC2H3O2 = 1.00. Change: C2H3O2- = -0.040, H3O+ = -0.040, HC2H3O2 = +0.040. Equilibrium: C2H3O2- = 0.960 mol, HC2H3O2 = 1.040 mol (H3O+ ~0, reaction goes to completion since it's a strong acid neutralization). [C2H3O2-] = 0.960 M, [HC2H3O2] = 1.040 M (volume = 1.00 L). Ka = 1.8x10^-5 = [H3O+](0.960)/(1.040) → [H3O+] = 1.8x10^-5 x (1.040/0.960) = 1.95x10^-5 M. pH = -log(1.95x10^-5) = 4.71. (Notice: the pH barely changed, from 4.74 to 4.71 — this is the buffering effect.)

(e) Moles HNO3 added = 0.040 mol into 1.00 L pure water (no buffer to resist the change): [H3O+] = 0.040 mol / 1.00 L = 0.040 M (H3O+ from water autoionization is negligible in comparison). pH = -log(0.040) = 1.40. (Notice the dramatic drop from pH 7 to pH 1.40 — with no buffer present, the same amount of added acid causes a huge pH change, in sharp contrast to part (d).)

(f) HC2H3O2(aq) + OH-(aq) → C2H3O2-(aq) + H2O(l)

(g) [HC2H3O2] will decrease (the added OH- converts some HC2H3O2 into C2H3O2-). [C2H3O2-] will increase.

(h) Moles KOH added = (10.0 M)(0.0040 L) = 0.040 mol. RICE (moles): Initial: HC2H3O2 = 1.00, OH- = 0.040, C2H3O2- = 1.00. Change: HC2H3O2 = -0.040, OH- = -0.040, C2H3O2- = +0.040. Equilibrium: HC2H3O2 = 0.960 mol, C2H3O2- = 1.040 mol. [HC2H3O2] = 0.960 M, [C2H3O2-] = 1.040 M. [H3O+] = 1.8x10^-5 x (0.960/1.040) = 1.66x10^-5 M. pH = -log(1.66x10^-5) = 4.78. (Again, the pH barely changed, from 4.74 to 4.78 — the buffering effect.)

(i) Moles KOH added = 0.040 mol into 1.00 L pure water: [OH-] = 0.040 M. pOH = -log(0.040) = 1.40. pH = 14 - 1.40 = 12.60. (Again, a dramatic change compared to the buffered case in part (h) — from pH 7 all the way to pH 12.60.)`,
  },
  {
    title: 'Q10 — Identifying Which Combinations Form an HNO2/NO2- Buffer (pKa = 3.40)',
    content: `The pKa of HNO2 is 3.40. Select all of the following descriptions that would result in the formation of a buffer with a pH of 3.40 (i.e., an equimolar buffer of HNO2 and NO2-).

(A) 100.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M KNO2(aq) are combined.
(B) 100.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M KOH(aq) are combined.
(C) 100.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M HNO3(aq) are combined.
(D) 200.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M KNO2(aq) are combined.
(E) 200.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M KOH(aq) are combined.
(F) 200.0 mL of 1.0 M HNO2(aq) and 100.0 mL of 1.0 M HNO3(aq) are combined.`,
    answer: `Correct answers: (A) and (E) only.

(A) YES — this directly combines equal moles of the weak acid (HNO2, 0.100 mol) and its conjugate base (NO2- from KNO2, 0.100 mol), producing an equimolar buffer with pH = pKa = 3.40.

(E) YES — 200.0 mL of 1.0 M HNO2 (0.200 mol) combined with 100.0 mL of 1.0 M KOH (0.100 mol): the KOH (0.100 mol OH-) is exactly half the moles of HNO2 (0.200 mol), so this is the half-equivalence-point scenario — the OH- converts exactly half of the HNO2 into NO2- (0.100 mol converted, 0.100 mol HNO2 remaining), producing an equimolar HNO2/NO2- buffer with pH = pKa = 3.40.

(B) NO — mixing EQUAL moles of HNO2 (0.100 mol) with KOH (0.100 mol) is the full equivalence point, not the half-equivalence point: the OH- converts ALL of the HNO2 into NO2- (HNO2 + OH- → NO2- + H2O), leaving no HNO2 remaining — this is a pure NO2- solution, not an HNO2/NO2- buffer.

(C) and (F) NO — both combine HNO2 with another strong acid (HNO3). No conjugate base (NO2-) is produced, so no buffer forms — just an acidic mixture.

(D) NO (as an equimolar, pH = 3.40 buffer) — this does form an HNO2/NO2- buffer, but in a 2:1 mole ratio (0.200 mol HNO2 to 0.100 mol NO2-) rather than 1:1, so its pH would be LESS than 3.40 (excess HNO2 relative to NO2-), not exactly equal to the pKa.`,
  },
  {
    title: 'Q11 — Identifying Which Combinations Form an NH3/NH4+ Buffer (pKa of NH4+ = 9.26)',
    content: `The pKa of NH4+ is 9.26. Select all of the following descriptions that would result in the formation of a buffer with a pH of 9.26 (i.e., an equimolar buffer of NH3 and NH4+).

(A) 100.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M NH4NO3(aq) are combined.
(B) 100.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M HNO3(aq) are combined.
(C) 100.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M KOH(aq) are combined.
(D) 200.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M NH4NO3(aq) are combined.
(E) 200.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M HNO3(aq) are combined.
(F) 200.0 mL of 1.0 M NH3(aq) and 100.0 mL of 1.0 M KOH(aq) are combined.`,
    answer: `(A) YES — this directly combines equal moles of the weak base (NH3, 0.100 mol) and its conjugate acid (NH4+ from NH4NO3, 0.100 mol), producing an equimolar buffer with pH = pKa = 9.26.

(E) YES — 200.0 mL of 1.0 M NH3 (0.200 mol) combined with 100.0 mL of 1.0 M HNO3 (0.100 mol) — the HNO3 (0.100 mol H3O+) is exactly half the moles of NH3 (0.200 mol), so this is the "half-equivalence point" scenario: the H3O+ converts exactly half of the NH3 into NH4+ (0.100 mol converted, 0.100 mol NH3 remaining) — producing an equimolar NH3/NH4+ buffer with pH = pKa = 9.26.

(B) does NOT form a buffer with pH 9.26 — combining equal moles of NH3 (0.100 mol) and HNO3 (0.100 mol, a strong acid) converts ALL of the NH3 into NH4+ (exact equivalence), leaving only NH4+ (a pure weak-acid solution, not a buffer).

(C) does NOT form this buffer — combining NH3 with KOH (another strong base) simply produces a solution of two bases with no conjugate acid (NH4+) formed at all, so no NH3/NH4+ buffer exists.

(D) does form an NH3/NH4+ buffer, but NOT with a 1:1 (equimolar) ratio — it's a 2:1 ratio of NH3 to NH4+ (0.200 mol to 0.100 mol), so the pH would be greater than 9.26 (excess NH3, the base).

(F) does NOT form a buffer — combining NH3 with KOH (another strong base) produces no NH4+ at all.

Correct answer: Only (A) and (E) result in an equimolar NH3/NH4+ buffer with pH exactly equal to 9.26.`,
  },
];

/* ============================= 8.9 — Henderson-Hasselbalch Equation ============================= */
const t89 = [
  {
    title: 'Q12 — Calculating Buffer pH Using Ka and the Henderson-Hasselbalch Equation (HF/NaF)',
    content: `Three different buffer solutions are prepared by combining solutions of HF(aq) and NaF(aq):

Buffer #1: [HF] = 1.0 M, [NaF] = 1.0 M
Buffer #2: [HF] = 1.0 M, [NaF] = 2.0 M
Buffer #3: [HF] = 2.0 M, [NaF] = 1.0 M

Ka(HF) = 6.8 x 10^-4

(a) Calculate the pH of each buffer solution using the Ka expression for HF.
(b) Calculate the pH of each buffer solution using the Henderson-Hasselbalch equation, pH = pKa + log([F-]/[HF]). Confirm that your answers match part (a).
(c) Describe how the particle diagram for Buffer #2 (twice as many F- particles as HF particles) and Buffer #3 (twice as many HF particles as F- particles) would each compare to Buffer #1 (equal numbers of HF and F- particles).`,
    answer: `(a) Buffer #1: Ka = [H3O+][F-]/[HF] → [H3O+] = Ka x [HF]/[F-] = (6.8x10^-4)(1.0/1.0) = 6.8x10^-4 M. pH = -log(6.8x10^-4) = 3.17.

Buffer #2: [H3O+] = (6.8x10^-4)(1.0/2.0) = 3.4x10^-4 M. pH = -log(3.4x10^-4) = 3.47.

Buffer #3: [H3O+] = (6.8x10^-4)(2.0/1.0) = 1.36x10^-3 M. pH = -log(1.36x10^-3) = 2.87.

(b) pKa = -log(6.8x10^-4) = 3.17.

Buffer #1: pH = 3.17 + log(1.0/1.0) = 3.17 + log(1) = 3.17 + 0 = 3.17. Matches part (a). ✓

Buffer #2: pH = 3.17 + log(2.0/1.0) = 3.17 + 0.301 = 3.47. Matches part (a). ✓

Buffer #3: pH = 3.17 + log(1.0/2.0) = 3.17 + (-0.301) = 2.87. Matches part (a). ✓

(c) Buffer #2's diagram should show twice as many F- particles as HF particles (e.g., if Buffer #1 shows 6 HF and 6 F-, Buffer #2 should show 6 HF and 12 F-, or an equivalent 1:2 ratio) — since it has more of the conjugate base relative to the acid, consistent with its higher pH (3.47 > 3.17). Buffer #3's diagram should show twice as many HF particles as F- particles (e.g., 12 HF and 6 F-) — since it has more of the acid relative to the conjugate base, consistent with its lower pH (2.87 < 3.17).`,
  },
  {
    title: 'Q13 — Using the Henderson-Hasselbalch Equation to Fill In a Table (Formic Acid)',
    content: `HCO2H(aq) + H2O(l) ⇌ HCO2-(aq) + H3O+(aq)     Ka = 1.8 x 10^-4

pH = pKa + log([HCO2-]/[HCO2H])

Use either the Ka expression or the Henderson-Hasselbalch equation to fill in the missing information in the table below.

Solution #1: [HCO2H] = 1.00 M, [HCO2-] = 1.00 M, ratio = 1.00, pH = 3.74 (given)
Solution #2: [HCO2H] = 0.750 M, [HCO2-] = 1.35 M, ratio = ?, pH = ?
Solution #3: [HCO2H] = ?, [HCO2-] = 1.00 M, ratio = ?, pH = 3.52 (given)
Solution #4: [HCO2H] = 1.00 M, [HCO2-] = ?, ratio = ?, pH = 3.82 (given)`,
    answer: `pKa = -log(1.8x10^-4) = 3.745 ≈ 3.74 (confirmed by Solution #1, where the equal concentrations of HCO2H and HCO2- give pH = pKa).

Solution #2: ratio = [HCO2-]/[HCO2H] = 1.35/0.750 = 1.80. pH = pKa + log(1.80) = 3.745 + 0.255 = 4.00.

Solution #3: pH = 3.52 = pKa + log(ratio) → log(ratio) = 3.52 - 3.745 = -0.225 → ratio = 10^-0.225 = 0.596. Since ratio = [HCO2-]/[HCO2H] = 0.596, and [HCO2-] = 1.00 M: [HCO2H] = 1.00/0.596 = 1.68 M.

Solution #4: pH = 3.82 = pKa + log(ratio) → log(ratio) = 3.82 - 3.745 = 0.075 → ratio = 10^0.075 = 1.19. Since ratio = [HCO2-]/[HCO2H] = 1.19, and [HCO2H] = 1.00 M: [HCO2-] = 1.19 x 1.00 = 1.19 M.`,
  },
];

/* ============================= 8.10 — Buffer Capacity ============================= */
const t810 = [
  {
    title: 'Q14 — Comparing Buffer Capacity for a Concentrated vs. Dilute Buffer (Acetic Acid/Acetate)',
    content: `Two different buffer solutions are prepared by combining solutions of HC2H3O2(aq) and NaC2H3O2(aq): Buffer #1 has [HC2H3O2] = 1.00 M and [NaC2H3O2] = 1.00 M. Buffer #2 has [HC2H3O2] = 0.0500 M and [NaC2H3O2] = 0.0500 M. The Ka for HC2H3O2 is 1.8 x 10^-5.

(a) Calculate the pH of each buffer solution.
(b) A sample of 0.045 mol of HNO3(aq) is added to 1.00 L of buffer #1 (assume it initially contains 1.00 mol HC2H3O2 and 1.00 mol C2H3O2-). Assume the change in volume is negligible. Calculate the pH of the solution after HNO3 is added.
(c) A sample of 0.045 mol of HNO3(aq) is added to 1.00 L of buffer #2 (assume it initially contains 0.0500 mol HC2H3O2 and 0.0500 mol C2H3O2-). Assume the change in volume is negligible. Calculate the pH of the solution after HNO3 is added.
(d) Which buffer solution, #1 or #2, experienced a greater change in pH after the addition of 0.045 mol of HNO3?
(e) Which buffer solution, #1 or #2, has the greater buffer capacity?`,
    answer: `(a) Both buffers are equimolar (equal concentrations of HC2H3O2 and C2H3O2-), so for both: [H3O+] = Ka = 1.8x10^-5, pH = -log(1.8x10^-5) = 4.74. (Both buffers start at the SAME pH, since pH of an equimolar buffer depends only on pKa, not on the absolute concentrations.)

(b) RICE (moles): Initial: C2H3O2- = 1.00, H3O+(added) = 0.045, HC2H3O2 = 1.00. After complete reaction: C2H3O2- = 1.00-0.045 = 0.955 mol, HC2H3O2 = 1.00+0.045 = 1.045 mol. [H3O+] = Ka x (1.045/0.955) = (1.8x10^-5)(1.094) = 1.97x10^-5 M. pH = -log(1.97x10^-5) = 4.71.

(c) RICE (moles): Initial: C2H3O2- = 0.0500, H3O+(added) = 0.045, HC2H3O2 = 0.0500. Since 0.045 mol H3O+ is being added to only 0.0500 mol C2H3O2- (nearly consuming almost all of it!): C2H3O2- remaining = 0.0500-0.045 = 0.0050 mol, HC2H3O2 = 0.0500+0.045 = 0.0950 mol. [H3O+] = Ka x (0.0950/0.0050) = (1.8x10^-5)(19.0) = 3.42x10^-4 M. pH = -log(3.42x10^-4) = 3.47.

(d) Buffer #2 experienced a much greater change in pH (from 4.74 to 3.47, a change of 1.27 pH units) compared to Buffer #1 (from 4.74 to 4.71, a change of only 0.03 pH units).

(e) Buffer #1 has the greater buffer capacity. Even though both buffers started at the same pH (since they have the same ratio of HC2H3O2 to C2H3O2-), Buffer #1 contains much larger absolute amounts of both the acid and conjugate base (1.00 mol each, vs. only 0.0500 mol each in Buffer #2). Since the added 0.045 mol of HNO3 is a much smaller fraction of Buffer #1's total capacity (of 1.00 mol) than of Buffer #2's total capacity (of only 0.0500 mol — the added acid is nearly 90% of the available C2H3O2-!), Buffer #1 is far better able to absorb the added acid without a significant pH change. This confirms that increasing the concentration of buffer components (while keeping the ratio the same) increases buffer capacity, even though it doesn't change the initial pH.`,
  },
  {
    title: 'Q15 — Determining Buffer Capacity from Experimental Data (Ammonia/Ammonium)',
    content: `Two different buffer solutions are prepared by combining solutions of NH3(aq) and NH4NO3(aq). A sample of NaOH is added to each buffer solution, and the pH is recorded before and after.

Buffer #1: Volume = 1.00 L, Initial pH = 9.26, Amount of NaOH added = 0.10 mol, Final pH = 9.35.
Buffer #2: Volume = 1.00 L, Initial pH = 9.26, Amount of NaOH added = 0.10 mol, Final pH = 9.96.

Which buffer solution, #1 or #2, has the greater buffer capacity? Justify your answer in terms of the data given.`,
    answer: `Buffer #1 has the greater buffer capacity.

Both buffers started at the exact same initial pH (9.26 = pKa of NH4+, indicating both are equimolar NH3/NH4+ buffers) and received the exact same amount of added NaOH (0.10 mol) in the same volume (1.00 L). However, Buffer #1's pH changed only slightly (from 9.26 to 9.35, a change of just 0.09 pH units), while Buffer #2's pH changed much more significantly (from 9.26 to 9.96, a change of 0.70 pH units).

Since buffer capacity refers to a buffer's ability to resist pH change when acid or base is added, and Buffer #1 resisted the pH change far more effectively than Buffer #2 did (despite receiving the identical amount of added NaOH), Buffer #1 must have a greater buffer capacity — likely because it contains a substantially higher total concentration of NH3 and NH4+ (even though both started at the same pH/ratio), giving it more "reserve" to absorb the added base without a large pH shift.`,
  },
  {
    title: 'Q16 — Predicting Which Buffer Has Greater Capacity for Added Acid vs. Base (HNO2/KNO2)',
    content: `Two different buffer solutions are prepared by combining solutions of HNO2(aq) and KNO2(aq):

Buffer #1: [HNO2] = 1.50 M, [KNO2] = 1.00 M.
Buffer #2: [HNO2] = 1.00 M, [KNO2] = 1.50 M.

(a) Buffer #1 has a greater buffer capacity for the addition of added (acid / base) because it contains a higher concentration of (HNO2 / NO2-).
(b) Buffer #2 has a greater buffer capacity for the addition of added (acid / base) because it contains a higher concentration of (HNO2 / NO2-).`,
    answer: `(a) Buffer #1 has a greater buffer capacity for the addition of added BASE, because it contains a higher concentration of HNO2 (1.50 M). When a strong base (OH-) is added to a buffer, it is neutralized by reacting with the buffer's weak ACID component (HNO2 + OH- → NO2- + H2O) — so a buffer with MORE of the acid component (HNO2) present can neutralize a larger amount of added base before running out of HNO2 to react with, giving it a greater capacity for added base.

(b) Buffer #2 has a greater buffer capacity for the addition of added ACID, because it contains a higher concentration of NO2- (1.50 M). When a strong acid (H3O+) is added to a buffer, it is neutralized by reacting with the buffer's weak BASE component (NO2- + H3O+ → HNO2 + H2O) — so a buffer with MORE of the conjugate base component (NO2-) present can neutralize a larger amount of added acid before running out of NO2- to react with, giving it a greater capacity for added acid.`,
  },
];

/* ============================= 7.13 — pH and Solubility ============================= */
const t713 = [
  {
    title: 'Q1 — Effect of pH on the Solubility of Mg(OH)2',
    content: `Mg(OH)2(s) ⇌ Mg2+(aq) + 2 OH-(aq)     Ksp = 5.6 x 10^-12

The dissolution of Mg(OH)2(s) in water is represented by the equation above. A saturated solution is prepared in a beaker at 25°C by adding excess Mg(OH)2(s) to distilled water and stirring until no more solid dissolves.

(a) Several drops of concentrated NaOH(aq) are added to the saturated solution, and the mixture is stirred thoroughly (assume negligible volume change, constant 25°C temperature). This addition causes [Mg2+] to decrease. Explain this result in terms of Le Chatelier's principle, including a comparison of Qsp and Ksp at the moment NaOH is added.
(b) Several drops of concentrated HNO3(aq) are added to a separate saturated solution of Mg(OH)2(aq), and the mixture is stirred thoroughly. This addition causes [Mg2+] to increase. Explain this result in terms of Le Chatelier's principle, including a comparison of Qsp and Ksp at the moment HNO3 is added.
(c) Based on parts (a) and (b): does the solubility of Mg(OH)2 increase or decrease as the pH of the solution increases? Does the solubility of Mg(OH)2 increase or decrease as the pH of the solution decreases?`,
    answer: `(a) Adding NaOH increases [OH-] in the solution (OH- is a common ion, already part of the Mg(OH)2 dissolution equilibrium). At the moment NaOH is added, this increased [OH-] makes Qsp = [Mg2+][OH-]^2 momentarily GREATER than Ksp (since [Mg2+] hasn't changed yet, but [OH-] just increased). Since Qsp > Ksp, the system is no longer at equilibrium — by Le Chatelier's principle, the dissolution equilibrium shifts to the LEFT (toward the solid), causing some dissolved Mg2+ and OH- to recombine and precipitate as additional Mg(OH)2(s). This reduces [Mg2+] in solution until Qsp once again equals Ksp.

(b) Adding HNO3 introduces H3O+, which reacts with (and consumes) the OH- already present in solution (H3O+ + OH- → 2 H2O), decreasing [OH-]. At the moment HNO3 is added (and [OH-] drops), Qsp = [Mg2+][OH-]^2 becomes momentarily LESS than Ksp (since [Mg2+] hasn't changed yet, but [OH-] just decreased). Since Qsp < Ksp, the system is no longer at equilibrium — by Le Chatelier's principle, the dissolution equilibrium shifts to the RIGHT (toward the products), causing more solid Mg(OH)2(s) to dissolve, increasing [Mg2+] in solution until Qsp once again equals Ksp.

(c) The solubility of Mg(OH)2 DECREASES as the pH of the solution increases (part a: adding NaOH raises pH and lowers solubility/[Mg2+]). The solubility of Mg(OH)2 INCREASES as the pH of the solution decreases (part b: adding HNO3 lowers pH and raises solubility/[Mg2+]).`,
  },
  {
    title: 'Q2 — Effect of pH on the Solubility of Ni(OH)2',
    content: `Ni(OH)2(s) ⇌ Ni2+(aq) + 2 OH-(aq)     Ksp = 5.5 x 10^-16

A saturated solution of Ni(OH)2 is prepared in a beaker at 25°C by adding excess Ni(OH)2(s) to distilled water and stirring until no more solid dissolves. The solubility of Ni(OH)2 in water will be affected by changes in the pH of the solution.

(a) When a small amount of concentrated HNO3(aq) is added to this saturated solution: what happens to the pH, the concentration of hydroxide ions, the value of Qsp relative to Ksp, the direction of net conversion for the dissolution equilibrium, and the solubility of Ni(OH)2?
(b) When a small amount of concentrated KOH(aq) is added to this saturated solution: what happens to the same five quantities listed in part (a)?`,
    answer: `(a) Adding HNO3: the pH will DECREASE (adding a strong acid). The concentration of hydroxide ions will DECREASE (H3O+ from HNO3 reacts with and consumes OH-). As a result, the value of Qsp will become LESS than Ksp (since [OH-] just dropped while [Ni2+] hasn't changed yet). The equilibrium for the dissolution of Ni(OH)2 will experience a net conversion from reactants to products (shifting right, toward more dissolution, since Qsp < Ksp). The solubility of Ni(OH)2 will INCREASE when HNO3(aq) is added.

(b) Adding KOH: the pH will INCREASE (adding a strong base). The concentration of hydroxide ions will INCREASE (KOH directly supplies additional OH-, a common ion). As a result, the value of Qsp will become GREATER than Ksp (since [OH-] just increased while [Ni2+] hasn't changed yet). The equilibrium for the dissolution of Ni(OH)2 will experience a net conversion from products to reactants (shifting left, toward re-precipitation, since Qsp > Ksp). The solubility of Ni(OH)2 will DECREASE when KOH(aq) is added.`,
  },
  {
    title: 'Q3 — Oxalate Ion Hybridization and the Effect of Acid on Silver Oxalate Solubility',
    content: `The oxalate ion, C2O4^2-, has a Lewis electron-dot structure with two carbon atoms double-bonded to each other, each carbon also singly bonded to one O atom (with a full negative charge and 3 lone pairs) and doubly bonded to another O atom (with 2 lone pairs).

(a) Identify the hybridization of the valence orbitals of either carbon atom in the oxalate ion.

Silver oxalate, Ag2C2O4(s), is slightly soluble in water. The value of Ksp for Ag2C2O4 is 5.40 x 10^-12 at 25°C.

(b) (i) Write the expression for the solubility-product constant, Ksp, for Ag2C2O4.
   (ii) Calculate the molar solubility of Ag2C2O4 in neutral distilled water at 25°C.
   (iii) The molar solubility of Ag2C2O4 increases when it is dissolved in 0.50 M HClO4(aq) instead of neutral distilled water. Write a balanced net-ionic equation for the process that occurs between species in solution that contributes to the increased solubility of Ag2C2O4(aq) in HClO4(aq).`,
    answer: `(a) Each carbon atom in the oxalate ion is bonded to 3 other atoms/groups (the other C atom, one single-bonded O, and one double-bonded O) with no lone pairs on carbon — this gives 3 total electron domains around each carbon, corresponding to sp2 hybridization.

(b) (i) Ksp = [Ag+]^2[C2O4^2-]

(ii) Let x = molar solubility of Ag2C2O4. Then [Ag+] = 2x and [C2O4^2-] = x. Ksp = (2x)^2(x) = 4x^3.

5.40 x 10^-12 = 4x^3

x^3 = 1.35 x 10^-12

x = (1.35 x 10^-12)^(1/3) = 1.10 x 10^-4 M.

(iii) C2O4^2-(aq) + H3O+(aq) ⇌ HC2O4-(aq) + H2O(l)

(The oxalate ion, C2O4^2-, is the conjugate base of a weak acid (HC2O4-/H2C2O4) and reacts with the H3O+ supplied by the strong acid HClO4, consuming C2O4^2- from solution. By Le Chatelier's principle, this removal of C2O4^2- shifts the Ag2C2O4 dissolution equilibrium to the right, allowing more Ag2C2O4(s) to dissolve — explaining the increased molar solubility in acidic solution.)`,
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
    await insertTopic('8.6', t86);
    await insertTopic('8.7', t87);
    await insertTopic('8.8', t88);
    await insertTopic('8.9', t89);
    await insertTopic('8.10', t810);
    await insertTopic('7.13', t713);
    console.log('Done — Unit 8 Topics 8.6-8.10 (+ 7.13 pH/Solubility) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
