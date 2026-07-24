const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '8.4': '4593c0bc-e9ff-453d-8e77-67fe57fdf12b',
  '8.5': '5246c332-452e-4883-b81d-61fa7b837084',
};

/* ============================= 8.4 — Acid-Base Reactions and Buffers ============================= */
const t84 = [
  {
    title: 'Q1 — Strong Acid + Strong Base: Exactly Equimolar (HCl + NaOH)',
    content: `A solution is prepared by combining 100.0 mL of 0.10 M HCl(aq) and 100.0 mL of 0.10 M NaOH(aq). Determine whether the acid or base is limiting/in excess, and calculate the final [H+], [OH-], and pH of the combined solution.`,
    answer: `Moles H+ = (0.10)(0.1000) = 0.0100 mol. Moles OH- = (0.10)(0.1000) = 0.0100 mol. Since the moles are exactly equal, neither is in excess — this is an exact equivalence point (equimolar reactants).

H+ + OH- → H2O consumes all of both ions. Total volume = 200.0 mL = 0.2000 L.

Since HCl and NaOH are both strong, and equal moles were combined, the resulting solution is just NaCl(aq) — a neutral salt (neither Na+ nor Cl- hydrolyzes). [H+] = [OH-] = 1.0 x 10^-7 M. pH = 7.00.`,
  },
  {
    title: 'Q2 — Strong Acid + Strong Base: Excess Acid (HBr + KOH)',
    content: `A solution is prepared by combining 260.0 mL of 0.10 M HBr(aq) and 240.0 mL of 0.10 M KOH(aq). Determine whether the acid or base is limiting/in excess, and calculate the final [H+], [OH-], and pH of the combined solution.`,
    answer: `Moles H+ = (0.10)(0.2600) = 0.0260 mol. Moles OH- = (0.10)(0.2400) = 0.0240 mol. Since there is more H+ than OH-, the base (OH-) is the limiting reactant; the acid is in excess.

After H+ + OH- → H2O occurs, excess H+ remaining = 0.0260 - 0.0240 = 0.0020 mol.

Total volume = 260.0 + 240.0 = 500.0 mL = 0.5000 L. [H+] = 0.0020/0.5000 = 4.0 x 10^-3 M.

pH = -log(4.0 x 10^-3) = 2.40. [OH-] = Kw/[H+] = (1.0x10^-14)/(4.0x10^-3) = 2.5 x 10^-12 M.`,
  },
  {
    title: 'Q3 — Strong Acid + Strong Base: Excess Base (HNO3 + Ba(OH)2)',
    content: `A solution is prepared by combining 380.0 mL of 0.10 M HNO3(aq) and 420.0 mL of 0.050 M Ba(OH)2(aq). Determine whether the acid or base is limiting/in excess, and calculate the final [H+], [OH-], and pH of the combined solution.`,
    answer: `Moles H+ = (0.10)(0.3800) = 0.0380 mol. Moles OH- = 2 x (0.050)(0.4200) = 2 x 0.0210 = 0.0420 mol (factor of 2 since Ba(OH)2 provides 2 OH- per formula unit).

Since there is more OH- (0.0420 mol) than H+ (0.0380 mol), the acid (H+) is the limiting reactant; the base is in excess.

After H+ + OH- → H2O occurs, excess OH- remaining = 0.0420 - 0.0380 = 0.0040 mol.

Total volume = 380.0 + 420.0 = 800.0 mL = 0.8000 L. [OH-] = 0.0040/0.8000 = 5.0 x 10^-3 M.

pOH = -log(5.0 x 10^-3) = 2.30. pH = 14 - 2.30 = 11.70. [H+] = Kw/[OH-] = (1.0x10^-14)/(5.0x10^-3) = 2.0 x 10^-12 M.`,
  },
  {
    title: 'Q4 — Weak Acid + Strong Base Titration: Full RICE Analysis (HNO2 + NaOH)',
    content: `Nitrous acid, HNO2, is a weak acid that ionizes in aqueous solution according to the equation shown below.

HNO2(aq) + H2O(l) ⇌ H3O+(aq) + NO2-(aq)     Ka = 4.0 x 10^-4

A 50.0 mL sample of 0.20 M HNO2(aq) (0.0100 mol HNO2) is titrated with 0.20 M NaOH(aq).

(a) Calculate the pH of the original 0.20 M HNO2(aq) before any titrant is added.
(b) Calculate the pH after 20.0 mL of the 0.20 M NaOH titrant has been added (before the half-equivalence point).
(c) Calculate the pH after 25.0 mL of titrant has been added (the half-equivalence point).
(d) Calculate the pH after 30.0 mL of titrant has been added (past the half-equivalence point).
(e) Calculate the pH after 50.0 mL of titrant has been added (the equivalence point).
(f) Calculate the pH after 55.0 mL of titrant has been added (past the equivalence point).`,
    answer: `(a) ICE with x = [H3O+]: Ka = x^2/(0.20-x) ≈ x^2/0.20 = 4.0x10^-4. x^2 = 8.0x10^-5, x = 8.94x10^-3 M. pH = -log(8.94x10^-3) = 2.05.

(b) Moles OH- added = (0.20)(0.0200) = 0.0040 mol, consuming 0.0040 mol HNO2 and producing 0.0040 mol NO2-. Remaining HNO2 = 0.0100-0.0040 = 0.0060 mol; NO2- = 0.0040 mol. Total volume = 70.0 mL. [HNO2] = 0.0857 M, [NO2-] = 0.0571 M. Using Ka: [H3O+] = Ka x [HNO2]/[NO2-] = (4.0x10^-4)(0.0857/0.0571) = 6.0x10^-4 M. pH = 3.22.

(c) At 25.0 mL (half of the 50.0 mL needed for equivalence), exactly half of the original HNO2 (0.0050 mol) has been converted to NO2-, leaving 0.0050 mol HNO2 — equal amounts of HNO2 and NO2-, so pH = pKa = -log(4.0x10^-4) = 3.40.

(d) Moles OH- added = (0.20)(0.0300) = 0.0060 mol. Remaining HNO2 = 0.0100-0.0060 = 0.0040 mol; NO2- = 0.0060 mol. Total volume = 80.0 mL. [HNO2] = 0.0500 M, [NO2-] = 0.0750 M. [H3O+] = (4.0x10^-4)(0.0500/0.0750) = 2.67x10^-4 M. pH = 3.57.

(e) At 50.0 mL, moles OH- added = (0.20)(0.0500) = 0.0100 mol = moles HNO2 originally present — exact equivalence, all HNO2 converted to NO2-. Total volume = 100.0 mL. [NO2-] = 0.0100/0.1000 = 0.100 M. Kb(NO2-) = Kw/Ka = (1.0x10^-14)/(4.0x10^-4) = 2.5x10^-11. Using x = [OH-]: x^2/0.100 = 2.5x10^-11, x^2 = 2.5x10^-12, x = 1.58x10^-6 M. pOH = 5.80. pH = 8.20.

(f) Moles OH- added = (0.20)(0.0550) = 0.0110 mol; excess OH- beyond equivalence = 0.0110-0.0100 = 0.0010 mol. Total volume = 105.0 mL. [OH-] = 0.0010/0.1050 = 9.52x10^-3 M. pOH = 2.02. pH = 11.98.

(These five results — 2.05, 3.22, 3.40, 3.57, 8.20, 11.98 — trace out the characteristic weak-acid/strong-base titration curve shape: a gradual initial rise, a relatively flat "buffer region" through the half-equivalence point, a steep jump through the equivalence point, then leveling off in excess base.)`,
  },
  {
    title: 'Q5 — Weak Base + Strong Acid Titration: Full RICE Analysis (NH3 + HNO3)',
    content: `Ammonia, NH3, is a weak base that ionizes in aqueous solution according to the equation shown below.

NH3(aq) + H2O(l) ⇌ NH4+(aq) + OH-(aq)     Kb = 1.8 x 10^-5

A 50.0 mL sample of 0.20 M NH3(aq) (0.0100 mol NH3) is titrated with 0.20 M HNO3(aq).

(a) Calculate the pH of the original 0.20 M NH3(aq) before any titrant is added.
(b) Calculate the pH after 20.0 mL of the 0.20 M HNO3 titrant has been added (before the half-equivalence point).
(c) Calculate the pH after 25.0 mL of titrant has been added (the half-equivalence point).
(d) Calculate the pH after 30.0 mL of titrant has been added (past the half-equivalence point).
(e) Calculate the pH after 50.0 mL of titrant has been added (the equivalence point).
(f) Calculate the pH after 55.0 mL of titrant has been added (past the equivalence point).`,
    answer: `(a) ICE with x = [OH-]: Kb = x^2/0.20 = 1.8x10^-5. x^2 = 3.6x10^-6, x = 1.897x10^-3 M. pOH = 2.72. pH = 11.28.

(b) Moles H3O+ added = (0.20)(0.0200) = 0.0040 mol, consuming 0.0040 mol NH3 and producing 0.0040 mol NH4+. Remaining NH3 = 0.0060 mol; NH4+ = 0.0040 mol. Total volume = 70.0 mL. [NH3] = 0.0857 M, [NH4+] = 0.0571 M. [OH-] = Kb x [NH3]/[NH4+] = (1.8x10^-5)(0.0857/0.0571) = 2.70x10^-5 M. pOH = 4.57. pH = 9.43.

(c) At 25.0 mL (half-equivalence), equal amounts of NH3 and NH4+ (0.0050 mol each), so pOH = pKb = -log(1.8x10^-5) = 4.74. pH = 9.26.

(d) Moles H3O+ added = (0.20)(0.0300) = 0.0060 mol. Remaining NH3 = 0.0040 mol; NH4+ = 0.0060 mol. Total volume = 80.0 mL. [NH3] = 0.0500 M, [NH4+] = 0.0750 M. [OH-] = (1.8x10^-5)(0.0500/0.0750) = 1.2x10^-5 M. pOH = 4.92. pH = 9.08.

(e) At 50.0 mL, exact equivalence — all NH3 converted to NH4+ (0.0100 mol). Total volume = 100.0 mL. [NH4+] = 0.100 M. Ka(NH4+) = Kw/Kb = (1.0x10^-14)/(1.8x10^-5) = 5.56x10^-10. Using x = [H3O+]: x^2/0.100 = 5.56x10^-10, x^2 = 5.56x10^-11, x = 7.45x10^-6 M. pH = 5.13.

(f) Moles H3O+ added = (0.20)(0.0550) = 0.0110 mol; excess H3O+ beyond equivalence = 0.0010 mol. Total volume = 105.0 mL. [H3O+] = 0.0010/0.1050 = 9.52x10^-3 M. pH = 2.02.

(These results — 11.28, 9.43, 9.26, 9.08, 5.13, 2.02 — trace out the mirror-image titration curve shape compared to a weak-acid/strong-base titration: starting basic and dropping through a buffer region, a steep drop at the equivalence point (below pH 7, since NH4+ is a weak acid), then leveling off in excess strong acid.)`,
  },
  {
    title: 'Q6 — Combining a Weak Acid and a Weak Base (HOCl + CH3NH2)',
    content: `Hypochlorous acid, HOCl, is a weak acid (Ka = 3.0 x 10^-8). Methylamine, CH3NH2, is a weak base (Kb = 4.4 x 10^-4).

(a) Write the balanced chemical equation for the ionization of HOCl in aqueous solution.
(b) Write the balanced chemical equation for the ionization of CH3NH2 in aqueous solution.
(c) Fill in the missing information in the table below: Acid HOCl has Ka = 3.0x10^-8 and conjugate base OCl- with Kb = ?; Acid CH3NH3+ has Ka = ? and conjugate base CH3NH2 with Kb = 4.4x10^-4.
(d) Write the balanced chemical equation for the acid-base reaction that occurs when solutions of HOCl(aq) and CH3NH2(aq) are combined.
(e) A student mixed 50.0 mL of 0.10 M HOCl(aq) with 50.0 mL of 0.10 M CH3NH2(aq). Is the resulting solution acidic, basic, or neutral? Justify your answer in terms of the relative values of Ka and Kb for the products of the reaction represented by the equation you wrote in part (d).`,
    answer: `(a) HOCl(aq) + H2O(l) ⇌ H3O+(aq) + OCl-(aq)

(b) CH3NH2(aq) + H2O(l) ⇌ CH3NH3+(aq) + OH-(aq)

(c) Kb(OCl-) = Kw/Ka(HOCl) = (1.0x10^-14)/(3.0x10^-8) = 3.3x10^-7. Ka(CH3NH3+) = Kw/Kb(CH3NH2) = (1.0x10^-14)/(4.4x10^-4) = 2.3x10^-11.

(d) HOCl(aq) + CH3NH2(aq) → OCl-(aq) + CH3NH3+(aq)

(e) Basic. Since equal volumes and equal concentrations of HOCl and CH3NH2 are combined, they react in a 1:1 stoichiometric ratio and are completely consumed, leaving only the conjugate species OCl- and CH3NH3+ in solution (plus water). Comparing the strength of these two conjugate species: Kb(OCl-) = 3.3x10^-7 is much LARGER than Ka(CH3NH3+) = 2.3x10^-11 — meaning OCl- is a considerably stronger base than CH3NH3+ is an acid. Since the base (OCl-) dominates over the acid (CH3NH3+) in this comparison, the resulting solution is basic (pH > 7).`,
  },
];

/* ============================= 8.5 — Acid-Base Titrations ============================= */
const t85 = [
  {
    title: 'Q7 — Reading a Titration Curve to Find Unknown Concentration, and Predicting Curves for Different Sample Volumes',
    content: `A student is given a sample of HCl(aq) of unknown concentration. The student titrates a 20.0 mL sample of the HCl solution with 0.180 M NaOH(aq). Based on the resulting titration curve, the equivalence point is reached after 30.0 mL of the 0.180 M NaOH titrant has been added.

(a) What is the molar concentration of HCl in the solution?
(b) If the student instead titrates a 10.0 mL sample of the same HCl solution with 0.180 M NaOH(aq), at what volume of titrant would the equivalence point occur? Describe how this titration curve would compare to the original (same shape/initial pH, but reaching equivalence at a different volume).
(c) If the student instead titrates a 40.0 mL sample of the same HCl solution with 0.180 M NaOH(aq), at what volume of titrant would the equivalence point occur?`,
    answer: `(a) At the equivalence point, moles NaOH added = moles HCl originally present. Moles NaOH = (0.180 M)(0.0300 L) = 0.00540 mol = moles HCl. [HCl] = 0.00540 mol / 0.0200 L = 0.270 M.

(b) Since the 10.0 mL sample contains half as many moles of HCl as the original 20.0 mL sample (same concentration, half the volume: moles HCl = (0.270)(0.0100) = 0.00270 mol), it requires half as much titrant to reach equivalence: V(NaOH) = 0.00270 mol / 0.180 M = 15.0 mL. The curve would have the same initial pH (same concentration of HCl) and the same overall S-shape (strong acid/strong base), just compressed to reach its steep equivalence-point jump at 15.0 mL instead of 30.0 mL.

(c) The 40.0 mL sample contains twice as many moles of HCl as the original (moles HCl = (0.270)(0.0400) = 0.01080 mol), requiring twice as much titrant: V(NaOH) = 0.01080 mol / 0.180 M = 60.0 mL. The curve would again have the same initial pH and shape, just stretched to reach its equivalence-point jump at 60.0 mL instead of 30.0 mL.`,
  },
  {
    title: 'Q8 — Determining Concentration and Ka for Formic Acid from a Titration Curve',
    content: `A student is given a sample of formic acid, HCO2H. The student titrates a 50.0 mL sample of the HCO2H solution with 0.20 M NaOH(aq). Based on the titration curve, the equivalence point is reached after 25.0 mL of titrant has been added.

(a) Based on the titration curve, the concentration of HCO2H in the solution is ___ mol/L.
(b) After 12.5 mL of the titrant has been added (the half-equivalence point), the pH of the reaction mixture is equal to 3.75. Use this information to calculate the value of Ka for HCO2H.`,
    answer: `(a) At the equivalence point, moles NaOH = moles HCO2H. Moles NaOH = (0.20 M)(0.0250 L) = 0.00500 mol = moles HCO2H. [HCO2H] = 0.00500 mol / 0.0500 L = 0.100 mol/L.

(b) At the half-equivalence point (12.5 mL, exactly half of the 25.0 mL needed for full equivalence), [HCO2H] = [HCO2-] (equal amounts), so pH = pKa. Therefore pKa = 3.75, and Ka = 10^-3.75 = 1.8 x 10^-4.`,
  },
  {
    title: 'Q9 — Explaining pH = 7.0 at the Equivalence Point for Two Strong Acid/Strong Base Titrations',
    content: `Experiment #1: 50.0 mL of 0.10 M HCl is titrated with 0.10 M NaOH; the equivalence point pH is 7.0.
Experiment #2: 50.0 mL of 0.10 M KOH is titrated with 0.10 M HNO3; the equivalence point pH is 7.0.

(a) When the equivalence point is reached in Experiment #1, circle all of the substances (H3O+, Cl-, Na+, OH-) that are present in the reaction mixture at a concentration greater than 0.01 M.
(b) When the equivalence point is reached in Experiment #2, circle all of the substances (H3O+, NO3-, K+, OH-) that are present in the reaction mixture at a concentration greater than 0.01 M.
(c) Based on your answers to parts (a) and (b), explain why the pH is equal to 7.0 at the equivalence point in each of these titration experiments.`,
    answer: `(a) Cl- and Na+ are present at a concentration greater than 0.01 M (both are spectator ions from the original HCl and NaOH, present at a diluted but still substantial concentration, roughly 0.05 M after mixing). H3O+ and OH- are each only present at about 1.0 x 10^-7 M (since the solution is neutral), which is far less than 0.01 M.

(b) K+ and NO3- are present at a concentration greater than 0.01 M (spectator ions). H3O+ and OH- are each only present at about 1.0 x 10^-7 M, far less than 0.01 M.

(c) In both experiments, the ions that remain at a significant concentration at the equivalence point (Na+ and Cl- in Experiment #1; K+ and NO3- in Experiment #2) are all spectator ions that do NOT react with water — Na+ and K+ are conjugate acids of strong bases (too weak to act as acids), and Cl- and NO3- are conjugate bases of strong acids (too weak to act as bases). Since none of the ions present in significant concentration can hydrolyze water to produce excess H3O+ or OH-, the solution remains neutral, with pH = 7.0, exactly like pure water.`,
  },
  {
    title: 'Q10 — Comparing Titration Curves for a Strong Acid (HNO3) and a Weak Acid (HNO2)',
    content: `Titration curves for two experiments: Experiment #1 is 50.0 mL of 0.10 M HNO3 titrated with 0.10 M NaOH (half-equivalence point pH = 1.48). Experiment #2 is 50.0 mL of 0.10 M HNO2 titrated with 0.10 M NaOH (initial pH = 2.21, half-equivalence point pH = 3.41, equivalence point pH = 8.05).

(a) Fill in the missing information in the table below: Strong or Weak Acid? (Experiment #1: ?, Experiment #2: Weak); Initial pH of 0.10 M HA(aq) (Experiment #1: ?, Experiment #2: 2.21 [given]); pH at the half-equivalence point (Experiment #1: 1.48 [given], Experiment #2: 3.41 [given]); pH at the equivalence point (Experiment #1: ?, Experiment #2: 8.05 [given]).
(b) Use the information from the titration curve for Experiment #2 to calculate pKa and Ka for HNO2.
(c) When the equivalence point is reached in Experiment #2, the pH is greater than 7.0. Circle all of the substances (H3O+, NO2-, Na+, OH-) that are present in the reaction mixture at a concentration greater than 0.01 M at the equivalence point.
(d) Write the net ionic equation for the acid-base reaction that takes place between one of the ions you circled in part (c) and H2O(l). This reaction should provide evidence to explain why the pH is greater than 7 at the equivalence point in Experiment #2.`,
    answer: `(a) Experiment #1 is a Strong acid. Initial pH of 0.10 M HNO3(aq) = -log(0.10) = 1.00 (since HNO3 ionizes completely). pH at the equivalence point for Experiment #1 = 7.0 (strong acid + strong base always gives a neutral salt, NaNO3).

(b) At the half-equivalence point, pH = pKa, so pKa(HNO2) = 3.41. Ka = 10^-3.41 = 3.9 x 10^-4.

(c) NO2- and Na+ are present at a concentration greater than 0.01 M (Na+ is always a spectator; NO2- is the conjugate base of the weak acid HNO2, present in significant concentration after the titration). H3O+ and OH- are present only in trace amounts.

(d) NO2-(aq) + H2O(l) ⇌ HNO2(aq) + OH-(aq). Since NO2- is the conjugate base of a weak acid, it is itself a weak base and reacts with water to produce a small amount of OH-, which is why the equivalence-point solution (containing dissolved NaNO2) is basic rather than neutral.`,
  },
  {
    title: 'Q11 — Comparing Titration Curves for Two Different Weak Acids (HC3H5O2 and HOCl)',
    content: `Titration curves for two experiments, both using 50.0 mL of 0.10 M weak acid titrated with 0.10 M NaOH: Experiment #1 is HC3H5O2 (propanoic acid), initial pH = 2.95, half-equivalence point pH = 4.89. Experiment #2 is HOCl, initial pH = 4.26, half-equivalence point pH = 7.52.

(a) Fill in the missing information: Ka value for the acid, and pH at the equivalence point, for each experiment.
(b) For each experiment, write the net ionic equation for the acid-base reaction that occurs in the reaction mixture that helps to explain why the pH is greater than 7 at the equivalence point.
(c) Comparing these two titration curves, the pH at the equivalence point in the HOCl titration is higher than the pH at the equivalence point for the HC3H5O2 titration. Explain this observation in terms of the relative acid/base strengths of HOCl vs. HC3H5O2 and their conjugate bases.`,
    answer: `(a) Ka(HC3H5O2) = 10^-pKa = 10^-4.89 = 1.3 x 10^-5. Ka(HOCl) = 10^-7.52 = 3.0 x 10^-8.

Equivalence point (50.0 mL acid + 50.0 mL NaOH, total 100.0 mL, [A-] = 0.00500 mol/0.1000 L = 0.0500 M in each case):

For C3H5O2- (Kb = Kw/Ka = (1.0x10^-14)/(1.3x10^-5) = 7.7x10^-10): x^2/0.0500 = 7.7x10^-10, x = 6.2x10^-6 M = [OH-]. pOH = 5.21. pH at equivalence for Experiment #1 = 8.79.

For OCl- (Kb = Kw/Ka = (1.0x10^-14)/(3.0x10^-8) = 3.3x10^-7): x^2/0.0500 = 3.3x10^-7, x = 1.29x10^-4 M = [OH-]. pOH = 3.89. pH at equivalence for Experiment #2 = 10.11.

(b) Experiment #1: C3H5O2-(aq) + H2O(l) ⇌ HC3H5O2(aq) + OH-(aq). Experiment #2: OCl-(aq) + H2O(l) ⇌ HOCl(aq) + OH-(aq).

(c) HOCl is a WEAKER acid than HC3H5O2 (smaller Ka: 3.0x10^-8 vs. 1.3x10^-5), and correspondingly, the OCl- ion is a STRONGER base than the C3H5O2- ion (larger Kb: 3.3x10^-7 vs. 7.7x10^-10) — this is the general inverse relationship between an acid's strength and its conjugate base's strength. Since OCl- is the stronger base, it hydrolyzes water to a greater extent, producing more OH- and resulting in a higher pH at the equivalence point for the HOCl titration compared to the HC3H5O2 titration.`,
  },
  {
    title: 'Q12 — Comparing Titrations of Two Acids with Very Different Ka Values (HClO2 and HClO3)',
    content: `Acid | pKa | Ka
HClO2 | 2.0 | 1 x 10^-2
HClO3 | -2.7 | 5 x 10^2

(a) Which acid is the stronger acid? Justify your answer.

Experiment #1: 50.0 mL of 0.10 M HClO2 is titrated with 0.10 M NaOH. Experiment #2: 50.0 mL of 0.10 M HClO3 is titrated with 0.10 M NaOH.

(b) Which titration experiment will result in a reaction mixture that has a higher pH at the equivalence point? Justify your answer by comparing the relative strengths of the conjugate base for each acid.
(c) A student makes the claim that, when equal volumes of 0.10 M HClO2(aq) and 0.10 M HClO3(aq) are each titrated with 0.10 M NaOH(aq), the HClO3 solution should require a greater volume of NaOH(aq) to reach the equivalence point. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `(a) HClO3 is the stronger acid, since it has the much larger Ka value (5 x 10^2, compared to 1 x 10^-2 for HClO2) — a larger Ka indicates the acid ionizes to a greater extent, i.e., a stronger acid. (Equivalently, HClO3 has the more negative/smaller pKa value.)

(b) Experiment #1 (HClO2 titration) will result in a higher pH at the equivalence point. Since HClO3 is such an extremely strong acid (Ka = 5x10^2, essentially behaving like a strong acid that fully ionizes), its conjugate base ClO3- is an extremely weak base (negligible hydrolysis), so the equivalence point pH for Experiment #2 will be very close to 7 (nearly neutral). In contrast, HClO2 is a comparatively weaker acid (Ka = 1x10^-2), so its conjugate base ClO2- is a comparatively stronger (though still weak) base, hydrolyzing water to a greater extent and producing a higher (more basic) equivalence-point pH than in Experiment #2.

(c) Disagree. The volume of NaOH needed to reach the equivalence point depends ONLY on the number of moles of acid originally present (moles acid = moles base at equivalence), not on the strength (Ka) of the acid. Since both experiments start with the same volume (50.0 mL) and the same concentration (0.10 M) of acid, they contain the identical number of moles of acid (0.00500 mol each), and therefore require the identical volume of 0.10 M NaOH (50.0 mL) to reach the equivalence point — regardless of the fact that HClO3 is a much stronger acid than HClO2.`,
  },
  {
    title: 'Q13 — Titration Curve for a Diprotic Acid (H2SO3)',
    content: `Sulfurous acid, H2SO3, is classified as a diprotic acid.

H2SO3(aq) + H2O(l) ⇌ H3O+(aq) + HSO3-(aq)     Ka1 = 1.4 x 10^-2
HSO3-(aq) + H2O(l) ⇌ H3O+(aq) + SO3^2-(aq)     Ka2 = 6.7 x 10^-8

The titration curve for this experiment (25.0 mL of 0.10 M H2SO3 titrated with 0.10 M NaOH) shows five labeled points: A (pH 1.51), B (pH 2.08, equal amounts of H2SO3 and HSO3-), C (pH 4.57), D (pH 7.17, equal amounts of HSO3- and SO3^2-), E (pH 9.85).

Fill in the missing information in the table: identify the substance(s) present at the highest concentration at points A, C, and E.`,
    answer: `Point A (pH 1.51): H2SO3 is present at the highest concentration. This is the initial point, before any titrant has been added — the solution consists almost entirely of the original diprotic acid (with only trace ionization to H3O+ and HSO3-).

Point C (pH 4.57): HSO3- is present at the highest concentration. This is the first equivalence point — enough NaOH has been added to convert essentially all of the original H2SO3 into HSO3- (the first proton has been fully removed by titration, but the second proton, governed by the much smaller Ka2, has not yet been significantly removed).

Point E (pH 9.85): SO3^2- is present at the highest concentration. This is the second (final) equivalence point — enough NaOH has been added to remove both acidic protons, converting essentially all of the original H2SO3 into SO3^2-.`,
  },
  {
    title: 'Q14 — Particle Diagrams for a Weak Acid – Strong Base Titration (HC2H3O2 + NaOH)',
    content: `A titration experiment is performed in which a sample of the weak acid HC2H3O2 (pKa = 4.74) is titrated with NaOH. Particle diagrams represent the reaction mixture at six points along the titration curve:

Point A (pH ≈ 2.9): Sample of the weak acid HA only — only HC2H3O2 particles present, no Na+, no C2H3O2-.
Point B (before half-equivalence point, [HA] > [A-], pH < pKa): A mixture containing more HC2H3O2 particles than C2H3O2- particles, along with some Na+ particles.
Point C (half-equivalence point, [HA] = [A-], pH = pKa = 4.74): Equal numbers of HC2H3O2 and C2H3O2- particles, with Na+ particles equal to the C2H3O2- count.
Point D (past half-equivalence point, [HA] < [A-], pH > pKa): A mixture containing more C2H3O2- particles than HC2H3O2 particles, with Na+ equal to the total C2H3O2- count.
Point E (equivalence point, pH > 7): Only C2H3O2- and Na+ particles present (in equal numbers), no HC2H3O2 remaining, due to the reaction A- + H2O ⇌ HA + OH-.
Point F (past equivalence point): C2H3O2-, Na+, and a small number of excess OH- particles present.

Explain why the ratio of HC2H3O2 to C2H3O2- particles continuously decreases from Point A to Point F, and explain specifically why Point E (the equivalence point) has a pH greater than 7 even though no NaOH is in excess at that point.`,
    answer: `As NaOH is added throughout the titration, each mole of OH- added reacts with (and permanently converts) one mole of HC2H3O2 into C2H3O2- (HC2H3O2 + OH- → C2H3O2- + H2O). This is a one-way, quantitative (complete) reaction as long as any HC2H3O2 remains — so the amount of HC2H3O2 continuously decreases while the amount of C2H3O2- continuously increases as more titrant is added, explaining the steadily decreasing HC2H3O2-to-C2H3O2- ratio from Point A (100% HC2H3O2) through Point C (50/50) to Point E (0% HC2H3O2, 100% C2H3O2-).

At Point E (the equivalence point), all of the original HC2H3O2 has been converted to C2H3O2-, and there is no excess OH- remaining (moles NaOH added = moles HC2H3O2 originally present, exactly). However, the solution is not neutral, because C2H3O2- itself is a weak base — it reacts with water according to A- + H2O ⇌ HA + OH-, regenerating a small amount of HC2H3O2 and producing a small amount of OH- in the process. This hydrolysis reaction is why the pH at the equivalence point (Point E) is greater than 7, even though there is no excess strong base physically present — the basicity comes from the reaction of the conjugate base (C2H3O2-) with water, not from leftover NaOH.`,
  },
  {
    title: 'Q15 — Particle Diagrams for a Weak Base – Strong Acid Titration (NH3 + HCl)',
    content: `A titration experiment is performed in which a sample of the weak base NH3 (pKb = 4.74, and pKa for its conjugate acid NH4+ = 9.25) is titrated with HCl. Particle diagrams represent the reaction mixture at six points along the titration curve:

Point A (pH ≈ 11.3): Sample of the weak base B (NH3) only — only NH3 particles present, no NH4+, no Cl-.
Point B (before half-equivalence point, [HB+] < [B], pH > pKa for HB+): A mixture containing more NH3 particles than NH4+ particles, along with some Cl- particles.
Point C (half-equivalence point, [HB+] = [B], pH = pKa for HB+ = 9.25): Equal numbers of NH3 and NH4+ particles, with Cl- equal to the NH4+ count.
Point D (past half-equivalence point, [HB+] > [B], pH < pKa for HB+): A mixture containing more NH4+ particles than NH3 particles, with Cl- equal to the total NH4+ count.
Point E (equivalence point, pH < 7): Only NH4+ and Cl- particles present (in equal numbers), no NH3 remaining, due to the reaction HB+ + H2O ⇌ B + H3O+.
Point F (past equivalence point): NH4+, Cl-, and a small number of excess H3O+ particles present.

Explain why the ratio of NH3 to NH4+ particles continuously decreases from Point A to Point F, and explain specifically why Point E (the equivalence point) has a pH less than 7 even though no HCl is in excess at that point.`,
    answer: `As HCl is added throughout the titration, each mole of H3O+ added reacts with (and permanently converts) one mole of NH3 into NH4+ (NH3 + H3O+ → NH4+ + H2O). This is a one-way, quantitative (complete) reaction as long as any NH3 remains — so the amount of NH3 continuously decreases while the amount of NH4+ continuously increases as more titrant is added, explaining the steadily decreasing NH3-to-NH4+ ratio from Point A (100% NH3) through Point C (50/50) to Point E (0% NH3, 100% NH4+).

At Point E (the equivalence point), all of the original NH3 has been converted to NH4+, and there is no excess H3O+ remaining (moles HCl added = moles NH3 originally present, exactly). However, the solution is not neutral, because NH4+ itself is a weak acid — it reacts with water according to NH4+ + H2O ⇌ NH3 + H3O+, regenerating a small amount of NH3 and producing a small amount of H3O+ in the process. This hydrolysis reaction is why the pH at the equivalence point (Point E) is less than 7, even though there is no excess strong acid physically present — the acidity comes from the reaction of the conjugate acid (NH4+) with water, not from leftover HCl.`,
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
    await insertTopic('8.4', t84);
    await insertTopic('8.5', t85);
    console.log('Done — Unit 8 Topics 8.4-8.5 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
