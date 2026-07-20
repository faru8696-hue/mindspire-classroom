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
  '4.1': '1b0ba58f-efea-4097-9a9a-e150ac03bc17',
  '4.2': '3ffb745f-9197-4845-a202-5a9f4a0c9b64',
  '4.3': 'ff3ecc6f-0dea-4c78-87b0-665c9be07c22',
  '4.4': 'c234dd3f-b253-4d74-ad06-90f5f5fc0645',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/b6f07a60-ced5-4dcc-a0d5-4c09cda06403/scratchpad';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit4-topics1-4/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 4.1 — Introduction for Reactions ============================= */
/* Source PDF has no dedicated 4.1 practice content (only 4.2/4.3/4.4 material), so these are
   original questions written to the same CED scope: writing/balancing equations, conservation
   of mass, and physical states in equations. */
const t41 = [
  {
    title: 'Q1 — Balancing a Combustion Equation',
    content: `Balance the following equation for the combustion of propane, C3H8:

___ C3H8(g) + ___ O2(g) → ___ CO2(g) + ___ H2O(g)`,
    answer: `C3H8(g) + 5 O2(g) → 3 CO2(g) + 4 H2O(g)

Balance carbon first: 3 C on the left requires 3 CO2 on the right.
Balance hydrogen next: 8 H on the left requires 4 H2O on the right (4 x 2 = 8 H).
Balance oxygen last: the right side now has (3 x 2) + (4 x 1) = 10 O atoms, so 5 O2 is needed on the left (5 x 2 = 10 O).
Check: C: 3=3, H: 8=8, O: 10=10. The equation is balanced.`,
  },
  {
    title: 'Q2 — Balancing a Double-Replacement Equation with States of Matter',
    content: `Balance the following equation, and include the correct physical state symbol — (s), (l), (g), or (aq) — for every reactant and product:

Al(NO3)3(aq) + NaOH(aq) → Al(OH)3 + NaNO3

Aluminum hydroxide, Al(OH)3, is insoluble in water; sodium nitrate, NaNO3, is soluble in water.`,
    answer: `Al(NO3)3(aq) + 3 NaOH(aq) → Al(OH)3(s) + 3 NaNO3(aq)

Balance aluminum: 1 Al on each side already.
Balance hydroxide/sodium: 3 OH on the left (from Al(OH)3 needing 3 OH) requires 3 NaOH, which also supplies 3 Na, requiring 3 NaNO3 on the right.
Balance nitrate: 3 NO3 on the left (from Al(NO3)3) matches the 3 NO3 in 3 NaNO3 on the right.
States of matter: Al(OH)3 is stated to be insoluble, so it is written as a solid, (s), since it forms as a precipitate. NaNO3 is stated to be soluble, so it remains dissolved and is written as (aq), consistent with the two reactants which are also given as (aq).`,
  },
  {
    title: 'Q3 — Conservation of Mass in a Sealed Reaction Vessel',
    content: `A student places 12.0 g of solid magnesium into a sealed, rigid container along with 8.0 g of oxygen gas. The magnesium reacts completely with the oxygen gas to form solid magnesium oxide, and no gas escapes the container.

Predict the total mass of the contents of the container after the reaction is complete, and justify your prediction using the law of conservation of mass.`,
    answer: `Total mass after the reaction = 12.0 g + 8.0 g = 20.0 g

The law of conservation of mass states that atoms are neither created nor destroyed in a chemical reaction — they are only rearranged into new combinations. Since the container is sealed and rigid, no matter can enter or escape during the reaction. Every atom of magnesium and every atom of oxygen present before the reaction is still present after the reaction, just rearranged into magnesium oxide instead of separate magnesium and oxygen gas. Because the total number and identity of atoms present does not change, the total mass of the sealed system also does not change, so the mass after the reaction must still equal the combined starting mass of 20.0 g.`,
  },
  {
    title: 'Q4 — Translating a Word Description into a Balanced Equation',
    content: `Solid iron(III) oxide reacts with carbon monoxide gas to produce solid iron and carbon dioxide gas. Write the balanced chemical equation for this reaction, including the correct physical state symbol for every reactant and product.`,
    answer: `Fe2O3(s) + 3 CO(g) → 2 Fe(s) + 3 CO2(g)

Unbalanced skeleton equation: Fe2O3(s) + CO(g) → Fe(s) + CO2(g)
Balance iron: 2 Fe on the left requires 2 Fe on the right.
Balance carbon: matching CO to CO2 keeps carbon 1:1, so the coefficient in front of CO must equal the coefficient in front of CO2.
Balance oxygen: the left side has 3 O from Fe2O3 plus 1 O per CO; the right side has 2 O per CO2. Setting the CO/CO2 coefficient to 3 gives 3 + 3 = 6 O on the left and 3 x 2 = 6 O on the right, which balances.
Check: Fe: 2=2, O: 6=6, C: 3=3. The equation is balanced.`,
  },
  {
    title: 'Q5 — Which Skeleton Equation Is Already Correctly Balanced? (Multiple Choice)',
    mcq: true,
    content: `Which of the following chemical equations is correctly balanced as written?

(A) N2(g) + O2(g) → 2 NO2(g)
(B) 2 H2O2(l) → 2 H2O(l) + O2(g)
(C) CaCO3(s) → Ca(s) + CO2(g) + O2(g)
(D) 2 KClO3(s) → 2 KCl(s) + O2(g)`,
    answer: `Correct answer: (B)

(B): Left side: 4 H, 4 O (from 2 H2O2, each with 2 H and 2 O). Right side: 4 H, 2 O (from 2 H2O) + 2 O (from O2) = 4 O. Both sides have 4 H and 4 O, so this equation is balanced as written.

(A) is unbalanced: left side has 2 N and 2 O, but the right side (2 NO2) has 2 N and 4 O — oxygen is not balanced.
(C) is unbalanced: left side has 1 Ca, 1 C, 3 O, but the right side has 1 Ca, 1 C, and (2+2) = 4 O — oxygen is not balanced (this equation is also not a realistic decomposition, since CaCO3 actually decomposes to CaO + CO2, not elemental Ca).
(D) is unbalanced: left side has 2 K, 2 Cl, 6 O, but the right side has 2 K, 2 Cl, and only 2 O — oxygen is not balanced (the correct balanced form is 2 KClO3(s) → 2 KCl(s) + 3 O2(g)).`,
  },
];

/* ============================= 4.2 — Net Ionic Equations ============================= */
const t42 = [
  {
    title: 'Q1 — Explaining Conductivity for Six Different Samples',
    content: `A substance can conduct electricity when there are mobile charged particles present. For each of the following samples, explain the observation, referring to the presence or absence of charged particles and whether or not those charged particles are free to move.

(a) A piece of solid silver metal, Ag(s), does conduct electricity.
(b) A sample of solid crystals of sodium chloride, NaCl(s), does not conduct electricity.
(c) A sample of molten (melted) sodium chloride, NaCl(l), does conduct electricity.
(d) A sample of aqueous sucrose, C12H22O11(aq), does not conduct electricity.
(e) A sample of aqueous methanol, CH3OH(aq), does not conduct electricity.
(f) A sample of aqueous potassium hydroxide, KOH(aq), does conduct electricity.`,
    answer: `(a) Solid silver metal conducts electricity because metallic bonding involves a "sea" of delocalized valence electrons that are free to move throughout the fixed lattice of metal cations; these mobile electrons are the charged particles that carry current.

(b) Solid NaCl does not conduct electricity because, although Na+ and Cl- ions are present, they are locked in fixed positions within the rigid ionic crystal lattice and are not free to move or flow.

(c) Molten NaCl conducts electricity because melting breaks down the rigid lattice structure, freeing the Na+ and Cl- ions to move throughout the liquid; these now-mobile ions are able to carry current.

(d) Aqueous sucrose does not conduct electricity because sucrose is a covalent molecular compound that dissolves as intact, neutral C12H22O11 molecules — no charged particles are produced upon dissolving, so there is nothing to carry current.

(e) Aqueous methanol does not conduct electricity for the same reason as sucrose: methanol is a covalent molecular compound that dissolves as intact, neutral CH3OH molecules, producing no charged particles in solution.

(f) Aqueous KOH conducts electricity because KOH is an ionic compound that dissociates completely into mobile K+ and OH- ions upon dissolving in water; these free-moving charged particles carry current through the solution.`,
  },
  {
    title: 'Q2 — Writing Dissolution Equations for Six Solutes',
    content: `Write a balanced chemical equation representing what happens to the solute particles when each of the following solutes is dissolved in water. Include physical state symbols.

(a) copper(II) chloride, CuCl2
(b) glucose, C6H12O6
(c) sodium sulfate, Na2SO4
(d) ammonium nitrate, NH4NO3
(e) ethanol, CH3CH2OH
(f) barium hydroxide, Ba(OH)2`,
    answer: `(a) CuCl2(s) → Cu2+(aq) + 2 Cl-(aq)  — ionic compound, dissociates completely into ions

(b) C6H12O6(s) → C6H12O6(aq)  — covalent molecular compound, dissolves as intact neutral molecules (does not dissociate into ions)

(c) Na2SO4(s) → 2 Na+(aq) + SO42-(aq)  — ionic compound, dissociates completely into ions

(d) NH4NO3(s) → NH4+(aq) + NO3-(aq)  — ionic compound, dissociates completely into ions

(e) CH3CH2OH(l) → CH3CH2OH(aq)  — covalent molecular compound, dissolves as intact neutral molecules (does not dissociate into ions)

(f) Ba(OH)2(s) → Ba2+(aq) + 2 OH-(aq)  — ionic compound, dissociates completely into ions`,
  },
  {
    title: 'Q3 — Identifying Errors in Student Dissolution Equations',
    content: `Several students were asked to write an equation representing what happens to the particles when solid calcium nitrate, Ca(NO3)2, dissolves in water. For each incorrect response below, explain what is wrong with it.

(a) Ca(NO3)2(s) → Ca(NO3)2(aq)
(b) Ca(NO3)2(s) → Ca(aq) + N2(aq) + 3 O2(aq)
(c) Ca(NO3)2(s) → Ca2+(aq) + 2 NO3(aq)
(d) Ca(NO3)2(s) → Ca+(aq) + 2 NO3-(aq)
(e) Ca(NO3)2(s) → Ca2+(aq) + 2 N3-(aq) + 6 O2-(aq)`,
    answer: `(a) This shows Ca(NO3)2 dissolving as one intact neutral formula unit, but Ca(NO3)2 is an ionic compound and must dissociate into its separate ions (Ca2+ and NO3-) upon dissolving — it does not stay together as a single aqueous "molecule."

(b) This incorrectly breaks the polyatomic nitrate ion, NO3-, apart into elemental nitrogen and oxygen. Dissolving is a physical process — it does not break covalent bonds within the polyatomic ion. The nitrate ion must remain intact as NO3-.

(c) The nitrate ions are shown without their 1- charge (written as "NO3" instead of "NO3-"). Charge must be conserved and shown explicitly: the overall equation must have equal total charge on both sides (0 on the left, 0 on the right only if the ion charges are correctly included), and nitrate is a polyatomic ion with a 1- charge.

(d) The calcium ion is shown with a 1+ charge instead of its correct 2+ charge. Calcium is a group 2 metal and always forms a 2+ cation (isoelectronic with the nearest noble gas), so it must be written as Ca2+, not Ca+.

(e) This again incorrectly breaks the nitrate polyatomic ion apart into separate nitride (N3-) and oxide (O2-) ions. Dissolving does not break the covalent bonds holding the nitrate ion together; NO3- must dissolve as one intact polyatomic ion.`,
  },
  {
    title: 'Q4 — Particle-Level Description of Dissolved Ionic Compounds',
    content: `(a) Describe, at the particle level, a diagram representing solid sodium chloride, NaCl(s), compared to a diagram representing aqueous sodium chloride, NaCl(aq).
(b) Describe, at the particle level, a diagram representing aqueous magnesium chloride, MgCl2(aq).`,
    answer: `(a) A particle diagram of NaCl(s) would show alternating Na+ and Cl- ions arranged in a fixed, rigid, repeating lattice pattern, with no empty space between neighboring ions and no ability for the ions to move. A particle diagram of NaCl(aq) would instead show the same Na+ and Cl- ions completely separated from one another and dispersed throughout the container, each surrounded by space (representing the surrounding water), moving independently and randomly rather than locked in a fixed pattern.

(b) A particle diagram of MgCl2(aq) would show separated, mobile Mg2+ ions and Cl- ions dispersed throughout the solution, in a 1:2 ratio (twice as many Cl- ions as Mg2+ ions, reflecting the formula MgCl2), with no ions bonded or clustered together — each ion moves independently through the solution.`,
  },
  {
    title: 'Q5 — Predicting Whether a Precipitate Forms Using the "SNAP" Solubility Rule',
    content: `All sodium (Na+), nitrate (NO3-), ammonium (NH4+), and potassium (K+) salts — the "SNAP" ions — are soluble in water.

A student combines aqueous solutions of ammonium nitrate, NH4NO3(aq), and sodium sulfate, Na2SO4(aq).

(a) Identify the chemical formulas of the two possible new compounds that could be formed if a double-replacement reaction occurred.
(b) Predict whether a precipitate will form when these two solutions are combined. Justify your answer using the solubility rule given above.`,
    answer: `(a) Swapping cations/anions gives the two possible new compounds: ammonium sulfate, (NH4)2SO4, and sodium nitrate, NaNO3.

(b) No precipitate will form. Both possible products are salts of "SNAP" ions: (NH4)2SO4 contains the ammonium ion (NH4+), and NaNO3 contains both the sodium ion (Na+) and the nitrate ion (NO3-). Since all SNAP-ion salts are soluble in water, both possible products remain fully dissolved as separate ions in solution, so no insoluble solid (precipitate) forms — the combined solution simply contains four different spectator ions (NH4+, NO3-, Na+, SO42-) all dissolved together with no reaction occurring.`,
  },
  {
    title: 'Q6 — Molecular, Complete Ionic, and Net Ionic Equations for AgNO3 + NH4Cl',
    content: `A student combines solutions of silver nitrate, AgNO3(aq), and ammonium chloride, NH4Cl(aq), and a white precipitate of silver chloride, AgCl, is formed.

(a) Write the balanced molecular equation for the reaction, including physical states.
(b) Write the balanced complete ionic equation for the reaction, including physical states.
(c) Write the balanced net ionic equation for the reaction, including physical states.`,
    answer: `(a) Molecular equation: AgNO3(aq) + NH4Cl(aq) → AgCl(s) + NH4NO3(aq)

(b) Complete ionic equation: Ag+(aq) + NO3-(aq) + NH4+(aq) + Cl-(aq) → AgCl(s) + NH4+(aq) + NO3-(aq)
(AgNO3 and NH4Cl fully dissociate as strong electrolytes; AgCl is written as a solid since it is the insoluble precipitate; NH4NO3 remains fully dissociated since both NH4+ and NO3- are "SNAP" ions and stay in solution.)

(c) Net ionic equation: Ag+(aq) + Cl-(aq) → AgCl(s)
(NH4+ and NO3- appear unchanged on both sides of the complete ionic equation, so they are spectator ions and are eliminated, leaving only the ions that actually react to form the precipitate.)`,
  },
  {
    title: 'Q7 — Molecular, Complete Ionic, and Net Ionic Equations for BaCl2 + K2SO4',
    content: `A student combines solutions of barium chloride, BaCl2(aq), and potassium sulfate, K2SO4(aq), and a white precipitate of barium sulfate, BaSO4, is formed.

(a) Write the balanced molecular equation for the reaction, including physical states.
(b) Write the balanced complete ionic equation for the reaction, including physical states.
(c) Write the balanced net ionic equation for the reaction, including physical states.`,
    answer: `(a) Molecular equation: BaCl2(aq) + K2SO4(aq) → BaSO4(s) + 2 KCl(aq)

(b) Complete ionic equation: Ba2+(aq) + 2 Cl-(aq) + 2 K+(aq) + SO42-(aq) → BaSO4(s) + 2 K+(aq) + 2 Cl-(aq)
(BaCl2 and K2SO4 fully dissociate as strong electrolytes; BaSO4 is written as a solid since it is the insoluble precipitate; KCl remains fully dissociated since both K+ and Cl- stay dissolved in solution.)

(c) Net ionic equation: Ba2+(aq) + SO42-(aq) → BaSO4(s)
(K+ and Cl- appear unchanged on both sides of the complete ionic equation, so they are spectator ions and are eliminated, leaving only the ions that actually combine to form the precipitate.)`,
  },
  {
    title: 'Q8 — Molecular, Complete Ionic, and Net Ionic Equations for CuCl2 + NaOH',
    content: `A student combines solutions of copper(II) chloride, CuCl2(aq), and sodium hydroxide, NaOH(aq), and a light blue precipitate of copper(II) hydroxide, Cu(OH)2, is formed.

(a) Write the balanced molecular equation for the reaction, including physical states.
(b) Write the balanced complete ionic equation for the reaction, including physical states.
(c) Write the balanced net ionic equation for the reaction, including physical states.`,
    answer: `(a) Molecular equation: CuCl2(aq) + 2 NaOH(aq) → Cu(OH)2(s) + 2 NaCl(aq)

(b) Complete ionic equation: Cu2+(aq) + 2 Cl-(aq) + 2 Na+(aq) + 2 OH-(aq) → Cu(OH)2(s) + 2 Na+(aq) + 2 Cl-(aq)
(CuCl2 and NaOH fully dissociate as strong electrolytes; Cu(OH)2 is written as a solid since it is the insoluble precipitate; NaCl remains fully dissociated since both Na+ and Cl- stay dissolved in solution.)

(c) Net ionic equation: Cu2+(aq) + 2 OH-(aq) → Cu(OH)2(s)
(Na+ and Cl- appear unchanged on both sides of the complete ionic equation, so they are spectator ions and are eliminated, leaving only the ions that actually combine to form the precipitate.)`,
  },
  {
    title: 'Q9 — Particle Diagram for BaCl2(aq) + K2SO4(aq)',
    content: `The particle diagram below shows a solution of BaCl2(aq) (left) combined with a solution of K2SO4(aq) (right): 2 Ba2+ ions and 4 Cl- ions on the left, and 4 K+ ions and 2 SO42- ions on the right.

The reaction that occurs is: BaCl2(aq) + K2SO4(aq) → BaSO4(s) + 2 KCl(aq)

Determine the composition of the resulting mixture after the reaction occurs (identify every species present, both dissolved ions and any solid precipitate), and justify your answer using conservation of mass and the given ion counts.`,
    imageUrl: 'BACL2_K2SO4',
    answer: `Ba2+ and SO42- combine in a 1:1 ratio to form the insoluble precipitate BaSO4(s). Since exactly 2 Ba2+ ions and 2 SO42- ions are present, they combine completely and exactly, with no excess of either ion, forming 2 formula units of BaSO4(s) as a solid precipitate.

K+ and Cl- are spectator ions (K+ pairs with NO3-/Cl- salts that stay soluble, and Cl- does not combine with Ba2+ under these conditions since BaCl2 itself is soluble) — all 4 K+ ions and all 4 Cl- ions remain unchanged, separated, and dissolved in solution.

Final mixture: 2 formula units of solid BaSO4(s) (precipitate) + 4 dissolved K+(aq) ions + 4 dissolved Cl-(aq) ions. This is consistent with conservation of mass: the same 2 Ba, 2 S, 8 O, 4 K, and 4 Cl atoms/ions present before the reaction are all still accounted for after the reaction, just recombined.`,
  },
  {
    title: 'Q10 — Particle Diagram for CuCl2(aq) + NaOH(aq)',
    content: `The particle diagram below shows a solution of CuCl2(aq) (left) combined with a solution of NaOH(aq) (right): 2 Cu2+ ions and 4 Cl- ions on the left, and 4 Na+ ions and 4 OH- ions on the right.

The reaction that occurs is: CuCl2(aq) + 2 NaOH(aq) → Cu(OH)2(s) + 2 NaCl(aq)

Determine the composition of the resulting mixture after the reaction occurs (identify every species present, both dissolved ions and any solid precipitate), and justify your answer using conservation of mass and the given ion counts.`,
    imageUrl: 'CUCL2_NAOH',
    answer: `Cu2+ and OH- combine in a 1:2 ratio to form the insoluble precipitate Cu(OH)2(s). Since exactly 2 Cu2+ ions and 4 OH- ions are present, they combine completely and exactly in the required 1:2 ratio, with no excess of either ion, forming 2 formula units of Cu(OH)2(s) as a solid precipitate.

Na+ and Cl- are spectator ions — all 4 Na+ ions and all 4 Cl- ions remain unchanged, separated, and dissolved in solution (both NaCl and the original reactants containing these ions are soluble).

Final mixture: 2 formula units of solid Cu(OH)2(s) (precipitate) + 4 dissolved Na+(aq) ions + 4 dissolved Cl-(aq) ions. This is consistent with conservation of mass: the same 2 Cu, 8 O, 8 H, 4 Na, and 4 Cl atoms/ions present before the reaction are all still accounted for after the reaction, just recombined.`,
  },
];

/* ============================= 4.3 — Representations of Reactions ============================= */
const t43 = [
  {
    title: 'Q1 — Completing a Particle Diagram for 2 NO(g) + O2(g) → 2 NO2(g)',
    content: `The particle diagram below shows a reaction vessel containing a mixture of NO(g) and O2(g) (black = N, white = O). The reaction 2 NO(g) + O2(g) → 2 NO2(g) proceeds until one reactant is completely consumed.

Determine the number of NO and O2 molecules present in the reactant mixture shown, then determine the exact composition of the product mixture (number of each type of molecule present) once the reaction is complete.`,
    imageUrl: 'Q19_NO_O2',
    answer: `Counting the reactant diagram: 6 NO molecules and 3 O2 molecules are present.

The balanced equation requires NO and O2 to react in a 2:1 mole ratio. With 6 NO and 3 O2 present, the ratio is exactly 6:3 = 2:1, so both reactants are used up in exactly the correct stoichiometric ratio — neither reactant is left over.

Using the mole ratio from the balanced equation: 6 NO molecules produce 6 NO2 molecules (1:1 ratio of NO to NO2), consuming all 3 O2 molecules in the process (2:1 ratio of NO to O2).

Final product mixture: 6 NO2 molecules, with 0 NO and 0 O2 remaining (both reactants completely consumed). A correct particle diagram of the product box would show exactly 6 bent triatomic NO2 molecules (each with 1 black N atom bonded to 2 white O atoms) and no leftover diatomic molecules.`,
  },
  {
    title: 'Q2 — Working Backward from a Product Diagram for 2 NO(g) + O2(g) → 2 NO2(g)',
    content: `A different trial of the same reaction, 2 NO(g) + O2(g) → 2 NO2(g), is run in a separate vessel. The particle diagram below shows the product mixture once the reaction is complete: it contains 4 NO2 molecules and 4 unreacted NO molecules (black = N, white = O).

Determine the exact composition (number of NO molecules and number of O2 molecules) of the original reactant mixture that must have been present at the start of this reaction.`,
    imageUrl: 'Q20_NO_NO2',
    answer: `Working backward from the final mixture: 4 NO2 molecules were formed as product.

Using the 2:1 mole ratio from the balanced equation, forming 4 NO2 required consuming 4 NO molecules and 2 O2 molecules (2 NO2 forms from 2 NO + 1 O2, so 4 NO2 forms from 4 NO + 2 O2).

The final mixture also shows 4 NO molecules remaining unreacted — since O2 was the reactant that ran out completely (no O2 remains in the final mixture), NO must be the reactant present in excess, and this leftover 4 NO was never consumed.

Total initial NO = (NO consumed) + (NO leftover) = 4 + 4 = 8 NO molecules
Total initial O2 = (O2 consumed) + (O2 leftover) = 2 + 0 = 2 O2 molecules

Original reactant mixture: 8 NO molecules and 2 O2 molecules. Checking atom conservation: initial N = 8 (all in NO), final N = 4 (in NO2) + 4 (in NO) = 8, consistent. Initial O = 8 (from NO) + 4 (from 2 O2) = 12; final O = 8 (from 4 NO2, 2 each) + 4 (from 4 NO, 1 each) = 12, consistent.`,
  },
  {
    title: 'Q3 — Completing a Particle Diagram for N2(g) + 3 H2(g) → 2 NH3(g)',
    content: `The particle diagram below shows a reaction vessel containing a mixture of N2(g) and H2(g) (black = N, white = H). The reaction N2(g) + 3 H2(g) → 2 NH3(g) proceeds until one reactant is completely consumed.

Determine the number of N2 and H2 molecules present in the reactant mixture shown, identify the limiting reactant, and determine the exact composition of the product mixture once the reaction is complete.`,
    imageUrl: 'Q21_N2_H2',
    answer: `Counting the reactant diagram: 4 N2 molecules and 6 H2 molecules are present.

The balanced equation requires N2 and H2 to react in a 1:3 mole ratio. To completely react with all 4 N2, 4 x 3 = 12 H2 would be required, but only 6 H2 are available — so H2 is the limiting reactant, and N2 is present in excess.

Using H2 as the limiting reactant: 6 H2 molecules require 6/3 = 2 N2 molecules (1:3 ratio) and produce (2/3) x 6 = 4 NH3 molecules (2:3 ratio of NH3 to H2).

N2 consumed = 2 molecules, so N2 remaining = 4 - 2 = 2 molecules (leftover, unreacted).

Final product mixture: 4 NH3 molecules + 2 unreacted N2 molecules, with 0 H2 remaining. A correct particle diagram of the product box would show 4 pyramidal NH3 molecules (each 1 black N atom bonded to 3 white H atoms) plus 2 separate diatomic N2 molecules (black-black pairs), and no H2 remaining.`,
  },
  {
    title: 'Q4 — Determining a Balanced Equation from Particle Diagrams of an Unknown Decomposition',
    content: `The particle diagrams below show the decomposition of an unknown diatomic-type compound X2Z2 (black = X, white = Z). The reactant mixture (left) contains 6 identical X2Z2 molecules, each consisting of a chain of 2 X atoms bonded between 2 Z atoms (Z-X-X-Z). The product mixture (right) contains 3 X2 molecules (2 X atoms bonded together) and 6 XZ2 molecules (1 X atom bonded to 2 Z atoms).

Based on this particle-level information, write the balanced chemical equation for the decomposition of X2Z2, using the smallest whole-number coefficients.`,
    imageUrl: 'Q22_X2Z2',
    answer: `From the diagrams: 6 X2Z2 molecules decompose to form 3 X2 molecules and 6 XZ2 molecules.

Written directly from the particle counts: 6 X2Z2 → 3 X2 + 6 XZ2

Dividing every coefficient by the greatest common factor, 3, to reach the smallest whole-number ratio:

2 X2Z2 → X2 + 2 XZ2

Checking atom conservation: left side has 2 x (2X + 2Z) = 4 X + 4 Z. Right side has 1 x (2X) + 2 x (1X + 2Z) = 2X + 2X + 4Z = 4X + 4Z. Both sides match, confirming the equation is correctly balanced.`,
  },
];

/* ============================= 4.4 — Physical and Chemical Changes ============================= */
const t44 = [
  {
    title: 'Q1 — Evaporation of Water in a Sealed Flask (Multiple Choice)',
    mcq: true,
    content: `A pure sample of liquid water is added to a previously evacuated, rigid flask. The pressure inside the flask increases, eventually reaching a constant value of 20 torr after 30 seconds. The temperature inside the flask is kept at 300 K, and liquid water is observed to remain present at the bottom of the container. Which of the following best describes the change that occurs immediately after the sample of liquid water is added to the flask, and gives a correct justification?

(A) Physical — Covalent bonds are broken.
(B) Physical — Intermolecular attractions are overcome.
(C) Chemical — Covalent bonds are broken.
(D) Chemical — Intermolecular attractions are overcome.`,
    answer: `Correct answer: (B)

The pressure increase is caused by some liquid water evaporating into the gas phase (water vapor), which is a change of physical state, not a change in chemical composition — the substance is still H2O throughout, just present in a different phase. This is classified as a physical change.

The correct justification is that intermolecular attractions (hydrogen bonds between H2O molecules) are overcome as individual water molecules gain enough energy to escape the liquid surface and enter the gas phase; the covalent O-H bonds within each water molecule remain completely intact.

(A) and (C) incorrectly claim that covalent bonds are broken — evaporation does not break the covalent bonds holding each H2O molecule together, only the intermolecular attractions between separate molecules.
(D) correctly describes the mechanism (intermolecular attractions overcome) but incorrectly classifies this as a chemical change; overcoming intermolecular forces without breaking covalent bonds is the hallmark of a physical change.`,
  },
  {
    title: 'Q2 — Classifying the Decomposition of HI (Multiple Choice)',
    mcq: true,
    content: `2 HI(g) → H2(g) + I2(g)

Which of the following describes the change represented by the equation above, and gives a correct justification?

(A) Physical — A mixture of hydrogen and iodine is separated into simpler substances.
(B) Physical — Covalent bonds are broken and new covalent bonds are formed.
(C) Chemical — A mixture of hydrogen and iodine is separated into simpler substances.
(D) Chemical — Covalent bonds are broken and new covalent bonds are formed.`,
    answer: `Correct answer: (D)

This is a chemical change: the starting substance, HI, is chemically transformed into two entirely new substances, H2 and I2, each with a different chemical composition than the original HI. The correct justification is that the covalent H-I bonds in each HI molecule are broken, and new covalent bonds (H-H in H2 and I-I in I2) are formed between like atoms — this bond-breaking-and-forming process is the defining feature of a chemical change.

(A) and (C) incorrectly describe this as separating "a mixture of hydrogen and iodine" — the reactant HI is not a mixture of separate H2 and I2 to begin with; it is a single pure compound whose molecules must be chemically broken apart and reassembled, which is a much stronger claim than simple physical separation of an existing mixture.
(B) correctly identifies the bond-breaking-and-forming mechanism but incorrectly classifies the change as physical; a process that breaks and re-forms covalent bonds to create new substances is chemical, not physical.`,
  },
  {
    title: 'Q3 — Identifying Evidence of a Chemical Reaction Between HCl and NaOH (Multiple Choice)',
    mcq: true,
    content: `HCl(aq) + NaOH(aq) → NaCl(aq) + H2O(l)

A student had two dilute, colorless solutions, HCl(aq) and NaOH(aq), at the same temperature. The student combined the solutions, and the process represented by the equation above occurred. Which of the following results would be evidence that a chemical reaction took place?

(A) The resulting solution is colorless.
(B) The temperature of the reaction mixture increases.
(C) The total volume of the mixture is approximately equal to the sum of the initial volumes.
(D) The resulting solution conducts electricity.`,
    answer: `Correct answer: (B)

A temperature increase indicates that heat was released during the process (an exothermic change), which is one of the classic pieces of evidence for a chemical change (production of heat or light). Since both starting solutions were at the same temperature, and no external heat source was applied, a measured temperature increase upon mixing indicates that a chemical process released energy — consistent with an acid-base neutralization reaction occurring.

(A) is not useful evidence: both the reactants and the products in this reaction are colorless, so the solution staying colorless is expected regardless of whether a reaction occurred, and gives no information either way.
(C) is not evidence of a chemical change; approximately additive volumes are typical of simply combining two aqueous solutions (a physical mixing process) and do not by themselves indicate any chemical transformation occurred.
(D) is not useful evidence: both HCl(aq) and NaOH(aq) are themselves strong electrolytes that conduct electricity before mixing (since they fully ionize/dissociate in water), and the product NaCl(aq) is also a strong electrolyte, so the solution conducting electricity both before and after mixing does not indicate that a reaction took place.`,
  },
  {
    title: 'Q4 — Identifying Evidence of a Chemical Reaction Between a Solid and Air (Multiple Choice)',
    mcq: true,
    content: `A student places a 5.00-gram sample of a dark grey solid into a crucible. The crucible and solid are heated strongly in air for several minutes. The student claims that a chemical reaction has taken place between the dark grey solid and a substance present in the air. Which of the following observations is most likely to support the claim that a chemical reaction has occurred?

(A) The final mass of the solid in the crucible is equal to 5.00 grams after heating.
(B) The final mass of the solid in the crucible is equal to 8.00 grams after heating.
(C) The solid present in the crucible after heating is dark grey in appearance.
(D) The solid present in the crucible after heating is not soluble in water.`,
    answer: `Correct answer: (B)

If the student's claim is correct — that the solid reacted with a substance in the air (most likely oxygen, forming a metal oxide) — then atoms from the air would have chemically combined with and become incorporated into the solid, increasing its total mass. An increase in mass from 5.00 g to 8.00 g is direct evidence that additional matter (from the air) was incorporated into the solid through a chemical process, supporting the claim that a chemical reaction occurred.

(A) is evidence against a reaction with air: if the mass is unchanged, no measurable amount of any airborne substance was incorporated into (or lost from) the solid, which does not support the claim of a reaction with air.
(C) and (D) are not useful evidence on their own: the solid staying the same color, or being insoluble in water, are both properties that could remain unchanged whether or not a chemical reaction occurred, and neither one demonstrates that new chemical bonds were formed or that the composition of the solid changed.`,
  },
  {
    title: 'Q5 — Classifying Six Everyday Processes as Physical or Chemical Changes',
    content: `Classify each of the following processes as a physical change or a chemical change, and briefly justify each classification.

(a) Dry ice (solid CO2) sublimes directly into CO2 gas.
(b) A silver spoon left exposed to air slowly develops a black tarnish (Ag2S) coating.
(c) Sugar is stirred into water until it completely dissolves.
(d) A firework explodes, producing a bright flash of light and a loud bang.
(e) A piece of paper is torn into many small pieces.
(f) Natural gas (CH4) burns in a stove burner, producing a blue flame.`,
    answer: `(a) Physical change. Sublimation is a change of phase (solid to gas) for a pure substance; the CO2 molecules themselves are unchanged, only the arrangement/spacing of the intermolecular attractions between them changes.

(b) Chemical change. The formation of Ag2S indicates that silver atoms have chemically combined with sulfur-containing compounds in the air to form a new substance with a different composition than the original silver metal — a color change here (developing black tarnish) is not from simple mixing, but from new chemical bonds forming.

(c) Physical change. Dissolving sugar in water forms a mixture (solution) of intact sucrose molecules dispersed among water molecules; no new substance is formed, and the sugar could in principle be recovered unchanged by evaporating the water.

(d) Chemical change. The bright flash of light and loud bang (rapid release of energy) are produced by the rapid combustion/decomposition reactions of the firework's chemical compounds, which break and re-form chemical bonds to create new gaseous products — production of light and a rapid energy release are hallmark evidence of a chemical change.

(e) Physical change. Tearing paper only changes its size and shape; the cellulose fibers making up the paper are chemically unchanged, and no new substance is formed.

(f) Chemical change. Combustion of CH4 involves breaking the C-H bonds in methane and the bonds in O2, then forming new bonds to produce CO2 and H2O; the blue flame (light) and heat released are further evidence of a chemical process, and the products (CO2 and H2O) have entirely different compositions than the reactants (CH4 and O2).`,
  },
  {
    title: 'Q6 — Physical or Chemical? The Ambiguous Case of Dissolving an Ionic Salt',
    content: `The AP Chemistry CED notes that a plausible argument can be made for classifying the dissolution of an ionic salt in water as either a physical process or a chemical process, since this process involves breaking ionic bonds within the solid lattice and forming new ion-dipole interactions between the ions and water molecules.

(a) Construct an argument for why dissolving NaCl(s) in water could be classified as a physical change.
(b) Construct an argument for why dissolving NaCl(s) in water could be classified as a chemical change.`,
    answer: `(a) Argument for physical change: When NaCl(s) dissolves, the Na+ and Cl- ions that separate into solution are chemically identical to the Na+ and Cl- ions that were already present within the solid ionic lattice — no new elements or new types of particles are created, and the ions retain their original identity and charge throughout the process. Additionally, the dissolved NaCl could in principle be recovered completely unchanged (as solid NaCl) simply by evaporating the water, without requiring any further chemical transformation — a hallmark of a physical (rather than chemical) change, similar to other processes like the formation and separation of mixtures.

(b) Argument for chemical change: Dissolving NaCl(s) requires breaking the ionic bonds holding the Na+ and Cl- ions together in the rigid crystal lattice, and forming entirely new interactions — ion-dipole attractions between the ions and surrounding polar water molecules. Because this process involves the breaking of one type of bond (ionic) and the formation of a different type of interaction (ion-dipole), rather than simply overcoming intermolecular forces between intact molecules (as in a typical phase change), it can be argued to more closely resemble the bond-breaking-and-forming pattern that is generally characteristic of chemical changes.`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing, error: fetchErr } = await sb
    .from('questions')
    .select('id, order_index')
    .eq('topic_id', topicId);
  if (fetchErr) throw fetchErr;
  if (existing.length > 0) {
    const { error: delErr } = await sb.from('questions').delete().eq('topic_id', topicId);
    if (delErr) throw delErr;
  }

  const rows = questions.map((q, idx) => ({
    topic_id: topicId,
    title: q.title,
    content: q.mcq ? q.content + JUSTIFY : q.content,
    answer_key: q.answer,
    order_index: idx,
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
    imgMap['BACL2_K2SO4'] = await uploadImage('q17_crop.png', 'bacl2-k2so4-particles.png');
    imgMap['CUCL2_NAOH'] = await uploadImage('q18_crop.png', 'cucl2-naoh-particles.png');
    imgMap['Q19_NO_O2'] = await uploadImage('q19_final.png', 'no-o2-reactant-particles.png');
    imgMap['Q20_NO_NO2'] = await uploadImage('q20_final.png', 'no-no2-product-particles.png');
    imgMap['Q21_N2_H2'] = await uploadImage('q21_final.png', 'n2-h2-reactant-particles.png');
    imgMap['Q22_X2Z2'] = await uploadImage('q22_final.png', 'x2z2-decomposition-particles.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t42) if (q.imageUrl) q.resolvedImageUrl = imgMap[q.imageUrl];
    for (const q of t43) if (q.imageUrl) q.resolvedImageUrl = imgMap[q.imageUrl];

    await insertTopic('4.1', t41);
    await insertTopic('4.2', t42);
    await insertTopic('4.3', t43);
    await insertTopic('4.4', t44);
    console.log('Done — Unit 4 Topics 4.1-4.4 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
