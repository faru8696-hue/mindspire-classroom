const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '4.1': '1b0ba58f-efea-4097-9a9a-e150ac03bc17',
  '4.2': '3ffb745f-9197-4845-a202-5a9f4a0c9b64',
  '4.3': 'ff3ecc6f-0dea-4c78-87b0-665c9be07c22',
  '4.4': 'c234dd3f-b253-4d74-ad06-90f5f5fc0645',
  '4.5': '4fbf18f9-60f4-46c3-83ff-af67342f3a92',
  '4.6': 'c89c3086-84b5-4172-8d32-5a8e4ad6a6a6',
  '4.7': '88c6a12c-88d5-42b0-b183-db0b4e06e0d8',
  '4.8': '8fd35cca-19cf-4a1e-b0de-a69f805a109c',
  '4.9': '8d27639b-b74a-442e-b317-ef2f699ef511',
};

const IMG_DIR = path.join(__dirname, 'tmp-episode-imgs', 'unit4');

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `unit4-episodes/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 4.4 — Physical and Chemical Changes (Episode #11) ============================= */
const t44 = [
  {
    title: 'Episode Review Q1 — Identifying a Physical Change from Particle Diagrams',
    imageKey: 'q1_diagrams',
    content: `Which of the following particle diagrams is the best representation of a process that is classified as a physical change?

(A), (B), (C), and (D) each show a "before" box and an "after" box of particles (grey and black circles representing two different types of atoms).`,
    answer: `(A). In diagram (A), the atoms are unbonded (grey and black circles sitting separately, not paired) in both the initial (solid, packed at the bottom) and final (gas, dispersed) states — no chemical bonds are broken or formed, only a phase change occurs, which is the hallmark of a physical change.

In (B), the atoms start unbonded but end up paired into new grey-black molecules — this is bond FORMATION, a chemical change. In (C), the atoms start already paired (bonded molecules) and end still paired as the same molecules — while this shows no reaction, the question asks for the "best" representation of a physical change among the options, and (A) more clearly depicts a phase change (solid-like packed row → dispersed gas) without any ambiguity about bonding. In (D), bonded pairs in the gas phase separate into individual unbonded atoms that then condense into a solid — this shows bond BREAKING, a chemical change.`,
  },
  {
    title: 'Episode Review Q2 — Evidence Supporting a Specific Claim About a Chemical Reaction',
    content: `2 NaHCO3(s) → Na2CO3(s) + H2O(g) + CO2(g)

A student added a 5.0-gram sample of NaHCO3(s) to a steel crucible and then heated the crucible on a hot plate at 250°C for 15 minutes. The student made the claim that during the process of heating the sample of NaHCO3(s), a chemical reaction occurred according to the equation shown above. Which of the following observations about the solid present in the crucible at the end of the experiment provides the best evidence to support the claim that this particular chemical reaction has taken place?

(A) The solid is soluble in water.
(B) The solid has a mass of 3.2 g.
(C) The solid does not conduct electricity.
(D) The solid starts to melt when it is heated to a temperature of 850°C.`,
    answer: `(B). Molar mass of NaHCO3 = 84.01 g/mol; moles NaHCO3 = 5.0 g / 84.01 g/mol = 0.0595 mol. Since the equation shows 2 mol NaHCO3 → 1 mol Na2CO3, moles Na2CO3 produced = 0.0595/2 = 0.0298 mol. Molar mass Na2CO3 = 105.99 g/mol. Predicted mass of solid remaining = 0.0298 mol × 105.99 g/mol = 3.15 g ≈ 3.2 g.

This predicted mass matches option (B) almost exactly, and it reflects a mass DECREASE consistent with the two gaseous products (H2O and CO2) escaping the open crucible — this is precise, quantitative evidence that specifically supports THIS reaction's stoichiometry, not just any generic change. Options (A), (C), and (D) describe properties that do not distinguish between the reactant and product (both are white, water-soluble, non-conducting ionic solids), so they do not provide specific evidence that this particular reaction occurred.`,
  },
];

/* ============================= 4.2 — Net Ionic Equations (Episode #11) ============================= */
const t42 = [
  {
    title: 'Episode Review Q3 — Net Ionic Equation for a Silver Carbonate Precipitation',
    content: `A student combines a solution of silver nitrate, AgNO3(aq), with a solution of sodium carbonate, Na2CO3(aq), and a solid precipitate is formed. Which of the following is the balanced net-ionic equation for the reaction that occurs when these two solutions are combined?

(A) Ag+(aq) + CO3–(aq) → AgCO3(s)
(B) 2 Ag+(aq) + CO3^2–(aq) → Ag2CO3(s)
(C) AgNO3(aq) + Na2CO3(aq) → AgCO3(s) + Na2NO3(aq)
(D) 2 AgNO3(aq) + Na2CO3(aq) → Ag2CO3(s) + 2 NaNO3(aq)`,
    answer: `(B). Silver ion is Ag+ (1+ charge) and carbonate ion is CO3^2– (2– charge), so the correct precipitate formula balancing charge is Ag2CO3 (not AgCO3). Na+ and NO3– are spectator ions and are excluded from the net ionic equation. Option (C) has an incorrectly balanced/incorrect formula (AgCO3, Na2NO3), and option (D) is the correct molecular equation but includes the spectator ions, so it is not the net ionic equation.`,
  },
  {
    title: 'Episode Review Q4 — Charges, Formulas, and Net Ionic Equation for a Precipitation Reaction',
    content: `Mg(NO3)2(aq) + K3PO4(aq) →

A student combined a solution of magnesium nitrate, Mg(NO3)2(aq), with an excess amount of aqueous potassium phosphate, K3PO4(aq), as represented above, and observed the formation of a precipitate.

(a) Circle the correct charge for each ion present: magnesium (Mg), nitrate (NO3), potassium (K), phosphate (PO4).

The student wrote the following chemical formulas to represent the products of the reaction: MgPO4 and KNO3.

(b) Only one of the student's chemical formulas is correct. Based on your answers to part (a), circle the one correct chemical formula.
(c) Write the correct balanced molecular equation for the precipitation reaction.
(d) Write the correct balanced net ionic equation for the precipitation reaction.`,
    answer: `(a) magnesium, Mg = 2+; nitrate, NO3 = 1–; potassium, K = 1+; phosphate, PO4 = 3–.

(b) KNO3 is correct. MgPO4 is incorrect because Mg2+ and PO4^3– do not balance in a 1:1 ratio (the correct formula would be Mg3(PO4)2); K+ and NO3– do balance correctly in a 1:1 ratio, so KNO3 is correct.

(c) 3 Mg(NO3)2(aq) + 2 K3PO4(aq) → Mg3(PO4)2(s) + 6 KNO3(aq)

(d) 3 Mg2+(aq) + 2 PO4^3–(aq) → Mg3(PO4)2(s)`,
  },
  {
    title: 'Episode Review Q5 — Net Ionic Equation for Aluminum Reacting with Excess HCl',
    content: `Hydrochloric acid (HCl) is an example of a strong acid that completely ionizes in aqueous solution according to the equation shown below.

HCl(aq) → H+(aq) + Cl–(aq)

A sample of Al(s) is added to a beaker containing an excess amount of HCl(aq). A chemical reaction occurs, resulting in the formation of H2(g). At the end of the experiment, the beaker contains a mixture of AlCl3(aq) and HCl(aq).

Which of the following is a balanced net ionic equation that represents only the species that react and the species that are produced in this experiment?

(A) 2 Al(s) + 6 HCl(aq) → 2 AlCl3(aq) + 3 H2(g)
(B) 2 Al(s) + 6 H+(aq) + 6 Cl–(aq) → 2 Al3+(aq) + 6 Cl–(aq) + 3 H2(g)
(C) 2 Al(s) + 6 H+(aq) → 2 Al3+(aq) + 3 H2(g)
(D) 2 Al(s) + 6 H+(aq) + 6 Cl–(aq) → 2 AlCl3(aq) + 3 H2(g)`,
    answer: `(C). Cl–(aq) appears unchanged on both sides of the full ionic equation (option B), making it a spectator ion that should be removed to obtain the net ionic equation. Option (A) is the molecular equation (not split into ions). Option (D) incorrectly recombines the product into AlCl3(aq) instead of leaving it as separated ions. Removing the spectator Cl– from option (B) gives option (C): 2 Al(s) + 6 H+(aq) → 2 Al3+(aq) + 3 H2(g).`,
  },
  {
    title: 'Episode Review Q6 — Net Ionic Equation for Iron Displacing Copper',
    content: `Fe(s) + CuCl2(aq) → Cu(s) + FeCl2(aq)

Which of the following is the correct net ionic equation for the equation shown above?

(A) Fe(s) + Cu+(aq) → Cu(s) + Fe+(aq)
(B) Fe(s) + Cu2+(aq) → Cu(s) + Fe2+(aq)
(C) Fe(s) + Cl2(aq) → FeCl2(aq)
(D) Fe(s) + 2 Cl–(aq) → FeCl2(aq)`,
    answer: `(B). Cl–(aq) is a spectator ion (2 Cl– appear unchanged on both sides), so it is removed. Cu2+ and Fe2+ are the correct charges (from CuCl2 and FeCl2, each with two 1– chloride ions balancing a 2+ metal ion), giving: Fe(s) + Cu2+(aq) → Cu(s) + Fe2+(aq).`,
  },
];

/* ============================= 4.3 — Representations of Reactions (Episode #11) ============================= */
const t43 = [
  {
    title: 'Episode Review Q7 — Determining the Product Mixture from a Particle Diagram (CO + O2 → CO2)',
    imageKey: 'q7_combined',
    content: `A mixture of CO(g) and O2(g) is placed in a reaction vessel as shown in the diagram (4 CO molecules and 4 O2 molecules, using the key: filled circle = C, open circle = O). A reaction between CO(g) and O2(g) occurs, forming CO2(g). Which of the following best represents the contents of the reaction vessel after the reaction has proceeded as completely as possible?

(A), (B), (C), and (D) each show a possible product mixture.`,
    answer: `(C). The initial mixture contains 4 CO molecules and 4 O2 molecules (4 C atoms, 12 O atoms total). The balanced equation is 2 CO(g) + O2(g) → 2 CO2(g). With 4 CO and 4 O2 available, CO is the limiting reactant (4 CO needs only 2 O2, leaving 2 O2 unreacted). The reaction produces 4 CO2 molecules (1:1 with CO consumed), leaving 2 O2 molecules unreacted (0 CO remaining).

Option (C) correctly shows 4 CO2 molecules plus 2 leftover O2 molecules (conserving all 4 C atoms and all 12 O atoms). Option (A) shows only 4 CO2 with no leftover O2 (loses 4 O atoms — violates conservation of mass). Option (B) shows 4 CO2 plus only 1 leftover O2 (loses 2 O atoms — also violates conservation). Option (D) shows 6 CO2 molecules, which would require 6 C atoms — more carbon than was available in the original mixture (violates conservation of C atoms).`,
  },
  {
    title: 'Episode Review Q8 — Determining the Balanced Equation from a Particle Diagram (X2 + Y2 → X2Y)',
    imageKey: 'q8_diagrams',
    content: `X = open circle, Y = filled circle. A reactant mixture (6 X2 molecules and 3 Y2 molecules) reacts to form a product mixture (6 X2Y molecules). Based on the information in the particle diagrams, which of the following represents the correct balanced chemical equation for the reaction that occurred?

(A) X2 + 2 Y2 → XY2
(B) X2 + 2 Y2 → 2 XY2
(C) 2 X2 + Y2 → X2Y
(D) 2 X2 + Y2 → 2 X2Y`,
    answer: `(D). The reactant mixture shows 6 X2 molecules (12 X atoms) and 3 Y2 molecules (6 Y atoms) — a 2:1 ratio of X2 to Y2. The product mixture shows 6 X2Y molecules, each containing 2 X atoms and 1 Y atom (12 X atoms and 6 Y atoms total), which exactly matches the atoms available in the reactant mixture. Dividing the coefficients (6 X2 : 3 Y2 : 6 X2Y) by 3 gives the simplest whole-number ratio: 2 X2 + Y2 → 2 X2Y, which is option (D).`,
  },
];

/* ============================= 4.5 — Stoichiometry (Episode #12) ============================= */
const t45 = [
  {
    title: 'Episode Review Q1 — Mass of O2 Required for Complete Combustion of Vinyl Chloride',
    content: `2 C2H3Cl(l) + 5 O2(g) → 4 CO2(g) + 2 H2O(g) + 2 HCl(g)

In a certain experiment, a sample of C2H3Cl(l) reacts completely with O2(g) in a chemical reaction according to the equation shown above. Calculate the mass of O2(g) that is required to react completely with 16.75 grams of C2H3Cl(l).`,
    answer: `Molar mass of C2H3Cl = 2(12.011) + 3(1.008) + 35.45 = 62.50 g/mol.

Moles C2H3Cl = 16.75 g / 62.50 g/mol = 0.2680 mol.

Mole ratio O2 : C2H3Cl = 5 : 2, so moles O2 = 0.2680 mol × (5/2) = 0.6700 mol.

Mass O2 = 0.6700 mol × 32.00 g/mol = 21.44 g.`,
  },
  {
    title: 'Episode Review Q2 — Comparing Masses of CO2 Produced from Different Combustion Reactions',
    content: `Which of the following will produce the greatest mass of CO2(g) when it undergoes complete combustion with O2(g)?

(A) 65 g of CH4
(B) 75 g of C2H6
(C) 85 g of C3H8O
(D) 95 g of C4H8O2`,
    answer: `(B). For each substance, find moles, then use the mole ratio of C atoms (since 1 mol of any CxHyOz produces x mol CO2) to find moles and mass of CO2 produced.

(A) CH4 (16.04 g/mol): moles = 65/16.04 = 4.052 mol → 1 C per molecule → 4.052 mol CO2 → mass = 4.052 × 44.01 = 178.3 g.

(B) C2H6 (30.07 g/mol): moles = 75/30.07 = 2.494 mol → 2 C per molecule → 4.988 mol CO2 → mass = 4.988 × 44.01 = 219.5 g.

(C) C3H8O (60.10 g/mol): moles = 85/60.10 = 1.415 mol → 3 C per molecule → 4.245 mol CO2 → mass = 4.245 × 44.01 = 186.8 g.

(D) C4H8O2 (88.11 g/mol): moles = 95/88.11 = 1.078 mol → 4 C per molecule → 4.313 mol CO2 → mass = 4.313 × 44.01 = 189.9 g.

The greatest mass of CO2 (219.5 g) is produced by option (B).`,
  },
  {
    title: 'Episode Review Q3 — Limiting Reactant, Theoretical Yield, and Percent Yield (Maleic Acid + NaHCO3)',
    content: `H2C4H2O4(aq) + 2 NaHCO3(aq) → 2 CO2(g) + 2 H2O(l) + Na2C4H2O4(aq)

A chemical reaction between maleic acid (H2C4H2O4) and sodium bicarbonate (NaHCO3) occurs in the presence of water to produce carbon dioxide and sodium maleate (Na2C4H2O4), as represented by the equation above. A student combines samples of H2C4H2O4(s) and NaHCO3(s) with sufficient water and measures the mass of CO2(g) produced. Assume the reaction proceeds until one reactant is completely consumed.

Trial 1: 1.543 g H2C4H2O4(s), 1.251 g NaHCO3(s), 0.655 g CO2(g) produced.
Trial 2: 1.543 g H2C4H2O4(s), 1.686 g NaHCO3(s), 0.883 g CO2(g) produced.

For trial 1: 1.543 g H2C4H2O4 × (1 mol / 116.072 g) = 0.01329 mol H2C4H2O4. 1.251 g NaHCO3 × (1 mol / 84.008 g) = 0.01489 mol NaHCO3.

(a) The student claims that the identity of the limiting reactant in trial 1 is H2C4H2O4 because the number of moles of H2C4H2O4 is less than the number of moles of NaHCO3. Do you agree or disagree with the student's claim? Justify your answer.

Trial 3: 2.135 g H2C4H2O4(s), 3.217 g NaHCO3(s), 1.376 g CO2(g) produced.

(b) On the basis of the experimental data for trial 3, determine each of the following. You must show the set-up for your calculations in addition to your final answer.
(i) The identity of the limiting reactant
(ii) The theoretical yield of CO2, in grams
(iii) The percent yield of CO2`,
    answer: `(a) Disagree. Comparing raw initial moles is only valid when the reactants combine in a 1:1 mole ratio. Here, the balanced equation requires a 1:2 ratio (1 mol H2C4H2O4 : 2 mol NaHCO3). For 0.01329 mol H2C4H2O4 to fully react, 2 × 0.01329 = 0.02658 mol NaHCO3 would be required — but only 0.01489 mol NaHCO3 is available, which is less than needed. Therefore NaHCO3 (not H2C4H2O4) is actually the limiting reactant in trial 1, since it runs out first.

(b) Moles H2C4H2O4 = 2.135 g / 116.072 g/mol = 0.018393 mol. Moles NaHCO3 = 3.217 g / 84.008 g/mol = 0.038295 mol.

(i) For 0.018393 mol H2C4H2O4 to fully react, 2 × 0.018393 = 0.036786 mol NaHCO3 is required. Since 0.038295 mol NaHCO3 is available (more than required), NaHCO3 is in excess, and H2C4H2O4 is the limiting reactant.

(ii) Mole ratio H2C4H2O4 : CO2 = 1 : 2, so moles CO2 = 2 × 0.018393 = 0.036786 mol. Theoretical yield = 0.036786 mol × 44.01 g/mol = 1.619 g.

(iii) Percent yield = (actual yield / theoretical yield) × 100 = (1.376 g / 1.619 g) × 100 = 85.0%.`,
  },
  {
    title: 'Episode Review Q4 — Limiting Reactant and Theoretical Yield (C5H8O Combustion)',
    content: `2 C5H8O(g) + 13 O2(g) → 10 CO2(g) + 8 H2O(g)

In a certain experiment, 14 mol of C5H8O(g) reacts with 78 mol of O2(g) according to the equation above until one of the reactants is completely consumed. Which of the following identifies the limiting reactant and the theoretical yield of H2O in this experiment?

Limiting Reactant | Theoretical Yield of H2O
(A) C5H8O | 48 mol H2O
(B) C5H8O | 56 mol H2O
(C) O2 | 48 mol H2O
(D) O2 | 56 mol H2O`,
    answer: `(C). For 14 mol C5H8O to fully react, moles O2 required = 14 × (13/2) = 91 mol. Only 78 mol O2 is available (less than 91 mol needed), so O2 is the limiting reactant.

Theoretical yield of H2O: mole ratio O2 : H2O = 13 : 8, so moles H2O = 78 mol × (8/13) = 48 mol.

Answer: (C) O2 is limiting, 48 mol H2O theoretical yield.`,
  },
  {
    title: 'Episode Review Q5 — Determining an Unknown Metal Carbonate from Titration-Style Precipitation Data',
    content: `A student is given a pure sample of a metal carbonate salt with the generic formula M2CO3. The identity is unknown, but it is one of: lithium carbonate (Li2CO3), sodium carbonate (Na2CO3), potassium carbonate (K2CO3), or rubidium carbonate (Rb2CO3).

The student dissolves 5.00 g of the metal carbonate salt into water, forming a solution with a total volume of 50.00 mL. This solution is completely transferred to a beaker. An excess amount of Ba(NO3)2(aq) is added, and the reaction below occurs:

M2CO3(aq) + Ba(NO3)2(aq) → BaCO3(s) + 2 MNO3(aq)

The BaCO3(s) is filtered, dried, and weighed. Data: 5.00 g M2CO3(s) dissolved, 50.00 mL M2CO3(aq), 300.0 mL of 0.20 M Ba(NO3)2(aq) added, 7.14 g BaCO3(s) recovered.

(a) Calculate the molar mass of the metal carbonate salt, M2CO3, used in this experiment.
(b) Which substance is most likely the identity of the metal carbonate salt?
(c) Calculate the molar concentration of the CO3^2– ions in the 50.00 mL sample of solution that was present in the beaker before Ba(NO3)2(aq) was added.`,
    answer: `(a) Molar mass BaCO3 = 137.33 + 12.01 + 3(16.00) = 197.34 g/mol. Moles BaCO3 = 7.14 g / 197.34 g/mol = 0.036177 mol.

Since Ba(NO3)2 is added in excess, all of the M2CO3 reacts, and the mole ratio M2CO3 : BaCO3 = 1:1, so moles M2CO3 = 0.036177 mol.

Molar mass M2CO3 = 5.00 g / 0.036177 mol = 138.2 g/mol.

(b) Comparing to the molar masses of the candidates: Li2CO3 = 73.89 g/mol, Na2CO3 = 105.99 g/mol, K2CO3 = 138.21 g/mol, Rb2CO3 = 230.95 g/mol. The calculated value (138.2 g/mol) matches K2CO3 (138.21 g/mol) almost exactly, so the salt is potassium carbonate, K2CO3.

(c) Moles CO3^2– in the original 50.00 mL sample = moles M2CO3 dissolved = 0.036177 mol (each M2CO3 fully dissociates to release one CO3^2– ion). Concentration = 0.036177 mol / 0.05000 L = 0.724 M.`,
  },
];

/* ============================= 4.6 — Introduction to Titration (Episode #12) ============================= */
const t46 = [
  {
    title: 'Episode Review Q6 — Reading Buret Volumes and Calculating Fe2+ Concentration from a KMnO4 Titration',
    imageKey: 'q6_buret',
    content: `8 H+(aq) + MnO4–(aq) + 5 Fe2+(aq) → Mn2+(aq) + 5 Fe3+(aq) + 4 H2O(l)

In a titration experiment, a student added 25.0 mL of an acidified Fe2+(aq) solution to an Erlenmeyer flask, then titrated it with a solution of KMnO4(aq) (dark purple color) using a 50.0 mL buret, according to the equation above, until a faint lavender color indicated the endpoint. The initial and final buret readings are shown in the diagram (magnified circles show the meniscus position between the "5" and "6" mL marks for the initial reading, and between the "37" and "38" mL marks for the final reading).

The student recorded the initial buret reading as 5.5 mL and the final buret reading as 38.21 mL.

(a) Identify the error associated with the initial buret measurement recorded by the student.
(b) Identify the error associated with the final buret measurement recorded by the student.
(c) Write down the correct measurements for the initial and final buret readings, and use these values to determine the volume of KMnO4(aq) added during the titration.
(d) Given that the concentration of KMnO4(aq) used in the titration was 0.0236 M, calculate the number of moles of MnO4– ions that completely reacted with the Fe2+ ions in this experiment.
(e) Calculate the molar concentration of the Fe2+ ions in the 25.0 mL sample of solution that was present in the flask at the beginning of this titration experiment.`,
    answer: `(a) The recorded value "5.5 mL" is not precise enough. A buret's smallest graduations are 0.1 mL, so a reading must be estimated one digit further (to the hundredths place), e.g. approximately 5.45 mL based on where the meniscus sits between the two smallest gridlines shown in the diagram — the student's value is missing this estimated digit.

(b) The recorded value "38.21 mL" incorrectly places the meniscus below (past) the 38 mL mark. The diagram actually shows the meniscus sitting above the 38 mL mark, between the 37 and 38 mL lines — so the correct final reading should be approximately 37.8 mL, not a value past 38.

(c) Correct initial reading ≈ 5.45 mL; correct final reading ≈ 37.80 mL. Volume of KMnO4(aq) added = 37.80 − 5.45 = 32.35 mL.

(d) Moles MnO4– = concentration × volume = 0.0236 mol/L × 0.03235 L = 7.63 × 10⁻⁴ mol.

(e) Mole ratio Fe2+ : MnO4– = 5 : 1, so moles Fe2+ = 5 × 7.63 × 10⁻⁴ = 3.82 × 10⁻³ mol. Concentration Fe2+ = 3.82 × 10⁻³ mol / 0.0250 L = 0.153 M.`,
  },
  {
    title: 'Episode Review Q7 — Titration Curve for Propanoic Acid and the Effect of a More Dilute Titrant',
    imageKey: 'q7_titration_graph',
    content: `HC3H5O2(aq) + NaOH(aq) → NaC3H5O2(aq) + H2O(l)

A 10.0 mL solution of propanoic acid, HC3H5O2(aq), is titrated with 0.20 M NaOH(aq). The titration curve produced shows pH rising gradually from about 3 to 6 over the first ~13 mL, then a steep equivalence-point jump centered at 14.0 mL (rising from about pH 6 to pH 12), followed by a gradual leveling off toward pH 13 by 32 mL.

(a) The volume of the HC3H5O2(aq) solution that was titrated was 10.0 mL. What was the initial concentration of HC3H5O2 in the solution?
(b) The student performs a second trial with another 10.0 mL solution that has the same concentration of HC3H5O2 as trial 1, but uses 0.10 M NaOH(aq) as the titrant. Describe the titration curve that would be expected for trial 2, compared to trial 1.`,
    answer: `(a) At the equivalence point (14.0 mL of 0.20 M NaOH), moles NaOH = 0.0140 L × 0.20 M = 2.80 × 10⁻³ mol. Since the reaction has a 1:1 mole ratio of acid to base, moles HC3H5O2 = 2.80 × 10⁻³ mol. Initial concentration = 2.80 × 10⁻³ mol / 0.0100 L = 0.280 M.

(b) Trial 2 uses a titrant that is half as concentrated (0.10 M instead of 0.20 M), so twice the volume of titrant is needed to reach equivalence: 2.80 × 10⁻³ mol / 0.10 M = 0.0280 L = 28.0 mL (double the original 14.0 mL). The trial 2 curve should start at the same initial pH (same initial acid concentration), rise more gradually (a less steep slope throughout, since the titrant delivers OH– more slowly per mL added), and reach its equivalence-point jump centered at 28.0 mL instead of 14.0 mL, with a less steep (more gradual) jump at the equivalence point since the titrant is more dilute.`,
  },
  {
    title: 'Episode Review Q8 — Determining Unknown NaOH Concentration from a Strong Acid-Base Titration Curve',
    imageKey: 'q8_titration_graph',
    content: `A 50.0 mL sample of a 0.100 M HCl(aq) solution is titrated with a NaOH(aq) solution of unknown concentration. The titration curve shows pH starting near 1, rising gradually to about pH 2 by 8 mL, then a steep equivalence-point jump centered at 10.0 mL (rising from about pH 2 to pH 12), leveling off toward pH 13 by 20 mL.

Based on the titration curve, what is the molar concentration of the NaOH(aq) solution?

(A) 0.0200 M
(B) 0.250 M
(C) 0.500 M
(D) 1.00 M`,
    answer: `(C). Moles HCl = 0.0500 L × 0.100 M = 5.00 × 10⁻³ mol. At the equivalence point (volume = 10.0 mL, read from the graph), moles NaOH added = moles HCl (1:1 mole ratio) = 5.00 × 10⁻³ mol. Concentration NaOH = 5.00 × 10⁻³ mol / 0.0100 L = 0.500 M.`,
  },
  {
    title: 'Episode Review Q9 — Determining Molar Mass of an Unknown Acid from Titration Data',
    content: `HX(aq) + KOH(aq) → NaX(aq) + H2O(l)

A chemist performed a titration experiment to determine the molar mass of an acidic substance, HX. The chemist dissolved a sample of HX(s) in water, added a few drops of an acid-base indicator, and titrated the HX(aq) solution with KOH(aq). Data from the experiment:

Mass of HX(s): 0.100 g
Initial buret reading: 3.00 mL
Final buret reading: 8.56 mL
Concentration of KOH(aq): 0.100 M

Based on the experimental data, the molar mass of HX is approximately

(A) 11.7 g/mol
(B) 18.0 g/mol
(C) 117 g/mol
(D) 180. g/mol`,
    answer: `(D). Volume KOH delivered = 8.56 mL − 3.00 mL = 5.56 mL = 0.00556 L. Moles KOH = 0.00556 L × 0.100 M = 5.56 × 10⁻⁴ mol. Since the mole ratio HX : KOH = 1:1, moles HX = 5.56 × 10⁻⁴ mol.

Molar mass HX = 0.100 g / 5.56 × 10⁻⁴ mol = 180. g/mol.`,
  },
  {
    title: 'Episode Review Q10 — Titration of an Antacid Tablet Containing Mg(OH)2',
    content: `An antacid tablet containing Mg(OH)2(s) is titrated with a solution of HNO3(aq). The end point is determined using an indicator. Initial buret reading: 2.75 mL. Final buret reading: 20.76 mL.

(a) Write a balanced chemical equation for the acid-base reaction that occurs between Mg(OH)2(s) and HNO3(aq) during the titration. The products are water and aqueous magnesium nitrate, Mg(NO3)2(aq).
(b) Given that the concentration of HNO3(aq) used in the titration was 0.200 M, calculate the number of moles of HNO3 that completely reacted with the Mg(OH)2 in this experiment.
(c) Calculate the mass, in grams, of Mg(OH)2 that was present in the antacid tablet.`,
    answer: `(a) Mg(OH)2(s) + 2 HNO3(aq) → Mg(NO3)2(aq) + 2 H2O(l)

(b) Volume HNO3 delivered = 20.76 mL − 2.75 mL = 18.01 mL = 0.01801 L. Moles HNO3 = 0.01801 L × 0.200 M = 3.60 × 10⁻³ mol.

(c) Mole ratio Mg(OH)2 : HNO3 = 1 : 2, so moles Mg(OH)2 = 3.60 × 10⁻³ mol / 2 = 1.80 × 10⁻³ mol. Molar mass Mg(OH)2 = 24.31 + 2(16.00 + 1.008) = 58.33 g/mol. Mass Mg(OH)2 = 1.80 × 10⁻³ mol × 58.33 g/mol = 0.105 g.`,
  },
];

/* ============================= 4.7 — Types of Chemical Reactions (Episode #13) ============================= */
const t47 = [
  {
    title: 'Episode Review Q1 — Classifying the Reaction Between Calcium and Hydrochloric Acid',
    content: `Ca(s) + 2 HCl(aq) → CaCl2(aq) + H2(g)

Calcium metal reacts with a solution of hydrochloric acid according to the equation shown above. Which of the following is true about this reaction?

(A) It is a Brønsted-Lowry acid-base reaction, because hydrochloric acid donates H+ ions to Ca atoms.
(B) It is a Brønsted-Lowry acid-base reaction, because OH– ions are converted into H2 molecules.
(C) It is a redox reaction, because Ca is oxidized and H is reduced.
(D) It is a redox reaction, because Ca is oxidized and Cl is reduced.`,
    answer: `(C). Ca goes from an oxidation number of 0 (elemental) to +2 (in CaCl2) — it is oxidized (loses electrons). H goes from +1 (in HCl) to 0 (in H2) — it is reduced (gains electrons). Cl remains −1 throughout (spectator ion, not reduced). There is no proton transfer between species here in the Brønsted-Lowry sense (Ca is a metal, not a base accepting protons), so this is a redox reaction, not an acid-base reaction — ruling out (A) and (B). Option (D) incorrectly identifies Cl as being reduced, when its oxidation number does not change.`,
  },
  {
    title: 'Episode Review Q2 — Identifying the Brønsted-Lowry Acid in a Proton-Transfer Reaction',
    content: `C2H3O2–(aq) + H3O+(aq) → HC2H3O2(aq) + H2O(l)

Which of the following is true about the reaction represented by the equation shown above?

(A) It is a Brønsted-Lowry acid-base reaction, because the C2H3O2– ion behaves as a proton donor.
(B) It is a Brønsted-Lowry acid-base reaction, because the H3O+ ion behaves as a proton donor.
(C) It is a redox reaction, because C is oxidized and H is reduced.
(D) It is a redox reaction, because C is reduced and H is oxidized.`,
    answer: `(B). H3O+ donates a proton (H+) to C2H3O2–, becoming H2O; C2H3O2– accepts that proton, becoming HC2H3O2. Since H3O+ is the proton donor, it behaves as the Brønsted-Lowry acid, and C2H3O2– (the proton acceptor) behaves as the base. No oxidation numbers change in this reaction (it is not a redox reaction), ruling out (C) and (D). Option (A) incorrectly identifies C2H3O2– as the proton donor, when it is actually the proton acceptor.`,
  },
  {
    title: 'Episode Review Q3 — Fate of Spectator Ions in a Precipitation Reaction (KI + Pb(NO3)2)',
    content: `A sample of solid potassium iodide, KI(s), is dissolved in distilled water, and an excess amount of aqueous lead(II) nitrate, Pb(NO3)2(aq), is added to the solution. A precipitate forms, which is then filtered, washed, and dried. At the end of the experiment, the majority of the potassium ions

(A) are present in the solid precipitate on the filter paper
(B) remain dissolved in the filtrate solution
(C) have been converted into potassium atoms
(D) have combined with lead to form a metal alloy`,
    answer: `(B). The precipitate that forms is PbI2(s) (from Pb2+ + 2 I– → PbI2(s)); K+ and NO3– are spectator ions that remain dissolved in solution throughout the reaction (K+ never combines with anything to form an insoluble compound — all potassium salts are soluble). Therefore, after filtering out the PbI2(s) precipitate, the majority of the K+ ions remain dissolved in the filtrate (the liquid that passes through the filter paper).`,
  },
];

/* ============================= 4.8 — Introduction to Acid-Base Reactions (Episode #13) ============================= */
const t48 = [
  {
    title: 'Episode Review Q4 — Identifying a Conjugate Acid-Base Pair (CH3NH2 + HSO4–)',
    content: `CH3NH2(aq) + HSO4–(aq) ⇌ CH3NH3+(aq) + SO4^2–(aq)

Which of the following correctly identifies a Bronsted-Lowry conjugate acid-base pair in the reaction represented by the equation shown above?

(A) The acid is CH3NH2, and the conjugate base is HSO4–.
(B) The acid is CH3NH2, and the conjugate base is CH3NH3+.
(C) The acid is HSO4–, and the conjugate base is CH3NH2.
(D) The acid is HSO4–, and the conjugate base is SO4^2–.`,
    answer: `(D). HSO4– donates a proton (H+) to become SO4^2–, so HSO4– is the acid and SO4^2– is its conjugate base — a conjugate acid-base pair differs by exactly one H+. (CH3NH2 is the base in this reaction, accepting a proton to become its conjugate acid, CH3NH3+ — the other conjugate pair in this reaction, but not the pair described correctly in any option except by process of elimination against (D).)`,
  },
  {
    title: 'Episode Review Q5 — Identifying Both Conjugate Acid-Base Pairs (HPO4^2– + H2O)',
    content: `HPO4^2–(aq) + H2O(aq) ⇌ H2PO4–(aq) + OH–(aq)

The hydrogen phosphate ion, HPO4^2–, reacts with water according to the equation shown above. Identify both sets of conjugate acid-base pairs in the reaction by writing the correct formula of each substance in the table below.

Acid (Reactant) | Conjugate Base (Product)
Base (Reactant) | Conjugate Acid (Product)`,
    answer: `Acid (Reactant) = H2O; Conjugate Base (Product) = OH–. (H2O donates a proton, becoming OH–.)

Base (Reactant) = HPO4^2–; Conjugate Acid (Product) = H2PO4–. (HPO4^2– accepts a proton, becoming H2PO4–.)`,
  },
];

/* ============================= 4.9 — Oxidation-Reduction (Redox) Reactions (Episode #13) ============================= */
const t49 = [
  {
    title: 'Episode Review Q6 — Assigning Oxidation Numbers and Identifying Oxidation/Reduction (Ethanol + Chromic Acid)',
    content: `C2H6O + H2CrO4 → C2H4O + H2CrO3 + H2O

Consider the balanced redox equation shown above (oxidation of ethanol, C2H6O, to acetaldehyde, C2H4O, by chromic acid).

(a) Assign (average) oxidation numbers to each element on each side of this chemical equation.
(b) Identify which element is reduced (state its oxidation numbers before and after), and which element is oxidized (state its oxidation numbers before and after).`,
    answer: `(a) Reactants: In C2H6O, treating O = −2 and H = +1: 2C + 6(+1) + (−2) = 0 → C = −2 (average). H = +1. O = −2. In H2CrO4: 2(+1) + Cr + 4(−2) = 0 → Cr = +6.

Products: In C2H4O: 2C + 4(+1) + (−2) = 0 → C = −1 (average). H = +1. O = −2. In H2CrO3: 2(+1) + Cr + 3(−2) = 0 → Cr = +4.

(b) Cr is reduced, because its oxidation number changes from +6 (in H2CrO4) to +4 (in H2CrO3) — a decrease. C is oxidized, because its (average) oxidation number changes from −2 (in C2H6O) to −1 (in C2H4O) — an increase. (H and O oxidation numbers do not change: +1 and −2 respectively throughout.)`,
  },
  {
    title: 'Episode Review Q7 — Identifying a Redox Reaction in Which Sulfur Is Reduced',
    content: `Which of the following represents a redox reaction in which S atoms are reduced?

(A) OF2 + H2S → H2O + SF2
(B) FeS + HCl → FeCl2 + H2S
(C) 2 SO2 + O2 → 2 SO3
(D) 2 HBr + H2SO4 → 2 H2O + SO2 + Br2`,
    answer: `(D). In H2SO4, S has an oxidation number of +6 (standard sulfate/sulfuric acid assignment). In SO2 (the product), S has an oxidation number of +4. Since S decreases from +6 to +4, S is reduced — matching the question. (In (A), S in H2S is −2 and S in SF2 is +2, an increase — oxidized, not reduced. In (B), S remains −2 in both FeS and H2S — no change, not even a redox reaction. In (C), S in SO2 is +4 and S in SO3 is +6, an increase — oxidized, not reduced.)`,
  },
  {
    title: 'Episode Review Q8 — Combining Half-Reactions for Aluminum and Tin(II) Ion',
    content: `Half-Reaction:
Al(s) → Al3+(aq) + 3 e–
Sn2+(aq) + 2 e– → Sn(s)

When a sample of aluminum metal, Al(s), is added to a solution of tin(II) nitrate, Sn(NO3)2(aq), a redox reaction occurs. Based on the half-reactions shown above, which of the following is the balanced net ionic equation for the redox reaction that occurs when Al(s) reacts with Sn2+(aq)?

(A) Al(s) + Sn2+(aq) → Al3+(aq) + Sn(s)
(B) 2 Al3+(aq) + 3 Sn(s) → 2 Al(s) + 3 Sn2+(aq)
(C) 2 Al(s) + 3 Sn2+(aq) → 2 Al3+(aq) + 3 Sn(s)
(D) 3 Al(s) + 2 Sn2+(aq) → 3 Al3+(aq) + 2 Sn(s)`,
    answer: `(C). The least common multiple of 3 electrons (Al half-reaction) and 2 electrons (Sn half-reaction) is 6. Multiply the Al half-reaction by 2: 2 Al(s) → 2 Al3+(aq) + 6 e–. Multiply the Sn half-reaction by 3: 3 Sn2+(aq) + 6 e– → 3 Sn(s). Adding these together (electrons cancel): 2 Al(s) + 3 Sn2+(aq) → 2 Al3+(aq) + 3 Sn(s).`,
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
    imgMap['q1_diagrams'] = await uploadImage('q1_diagrams.png', 'ep11-q1-physical-change-diagrams.png');
    imgMap['q7_combined'] = await uploadImage('q7_options.png', 'ep11-q7-co-o2-product-options.png');
    imgMap['q8_diagrams'] = await uploadImage('q8_diagrams.png', 'ep11-q8-x2-y2-x2y-diagrams.png');
    imgMap['q6_buret'] = await uploadImage('q6_full_buret.png', 'ep12-q6-buret-initial-final.png');
    imgMap['q7_titration_graph'] = await uploadImage('q7_graph.png', 'ep12-q7-propanoic-acid-titration-curve.png');
    imgMap['q8_titration_graph'] = await uploadImage('q8_graph.png', 'ep12-q8-hcl-naoh-titration-curve.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t43) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t46) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('4.4', t44);
    await insertTopic('4.2', t42);
    await insertTopic('4.3', t43);
    await insertTopic('4.5', t45);
    await insertTopic('4.6', t46);
    await insertTopic('4.7', t47);
    await insertTopic('4.8', t48);
    await insertTopic('4.9', t49);
    console.log('Done — Unit 4 Episode Review (Episodes #11-13) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
