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
  '3.7': 'ba1b5331-20ad-41f6-977e-9b44d41c8874',   // Solutions and Mixtures
  '3.8': '76e96e76-219d-411d-b3fa-2cc8bdcd02d5',   // Representations of Solutions
  '3.9': '20aae461-9149-4817-ba40-fcaed2d474a1',   // Separation of Solutions and Mixtures / Chromatography
  '3.10': '86646ce4-d71a-4a65-8d75-d3394d274479',  // Solubility
};

const IMG_BASE = 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/unit3/';

/*
Curated from SaveMyExams "Solutions & Mixtures" MCQ/FRQ sets (solutions-mixtures-MCQ.pdf,
solutions-mixtures-MCQ ANS.pdf, "solutions-mixtures FRQ.pdf", "solutions-mixtures-FRQ ANS.pdf").
Every calculation was independently re-verified (molarity, dilution, moles-of-ion, Rf value,
percent-mass arithmetic) rather than copied blindly from the answer keys; all checked out
correct against the source's own mark schemes with no numerical errors found this time (unlike
some prior units, this source's arithmetic was clean).

CED SCOPE AUDIT: this source is otherwise clean of colligative-properties/molality content
(no freezing-point depression, boiling-point elevation, osmotic pressure, van't Hoff factor,
or molality anywhere in the MCQ/FRQ sets). One FRQ part was excluded for a different scope
reason: FRQ Hard Q1(c) asks students to calculate energy required to vaporize a sample of
NCl3 given ΔH°vaporization — this is a calorimetry/thermochemistry calculation unrelated to
solutions/mixtures content and was dropped; parts (a) and (b) of that same question (molarity
calc, solubility-via-IMF explanation) were kept and routed to 3.7/3.10 respectively.

Five diagrams were recovered from the PDFs via pdftoppm + Python/Pillow cropping and uploaded
to Supabase Storage question-images/unit3/: a two-vessel ion-ratio diagram (CaCl2 vs KCl,
3.8), a 4-panel heterogeneous/homogeneous mixture comparison (3.8), an Rf-value chromatogram
figure (compounds A/B, 3.9), a simple-distillation apparatus diagram (3.9), and a dye
chromatography chambers+developed-chromatogram figure (3.9). Two chromatogram-based
questions (an Rf-value "identify dye X" MCQ and a particle-diagram MCQ) were rewritten as
fully self-contained text descriptions instead of cropped, since their source figures were
lower-value/more cluttered to crop cleanly and the numeric/positional information translates
easily to prose.
*/

// ---------------- 3.7 Solutions and Mixtures ----------------
const topic3_7 = [
  {
    topic: '3.7', mcq: true,
    title: 'Q10 — Correct Procedure to Prepare 0.100 M Na2CO3 (Multiple Choice)',
    content:
`Which of the following describes the correct procedure to prepare 0.25 L of 0.100 M Na2CO3 (aq)?

(The molar mass of Na2CO3 is 106 g/mol.)

(A) Dissolve 1.06 g of Na2CO3 (s) in a small amount of distilled water and dilute to 0.25 L.
(B) Dissolve 2.65 g of Na2CO3 (s) in a small amount of distilled water and dilute to 0.25 L.
(C) Add 1.06 g of Na2CO3 (s) to 0.25 L of distilled water.
(D) Add 2.65 g of Na2CO3 (s) to 0.25 L of distilled water.`,
    answer: `Correct answer: (B) Dissolve 2.65 g of Na2CO3 (s) in a small amount of distilled water and dilute to 0.25 L.

Moles of Na2CO3 needed: n = M × V = 0.100 mol/L × 0.25 L = 0.025 mol
Mass needed: m = n × molar mass = 0.025 mol × 106 g/mol = 2.65 g

Correct technique: dissolve the solid in a small amount of solvent first, then dilute up to the final calibrated volume (in a volumetric flask). Adding the solid directly to a fixed 0.25 L of water instead of diluting up to 0.25 L total means the final solution volume would be more than 0.25 L, so the concentration would be wrong even with the correct mass.

(A) and (C) use 1.06 g, which is off by a factor of 10 in the wrong direction — actually it corresponds to only 0.01 mol, not 0.025 mol — so the mass is simply incorrect.
(C) and (D) are also wrong procedurally: adding solid directly to 0.25 L of water (rather than dissolving it and diluting up to 0.25 L total) does not guarantee the final solution volume is exactly 0.25 L.`
  },
  {
    topic: '3.7', mcq: true,
    title: 'Q11 — Molarity of a K2SO4 Solution from Mass and Volume (Multiple Choice)',
    content:
`A 5.23 g sample of anhydrous K2SO4 (molar mass 174.3 g/mol) is dissolved in 1.75 L of solution.

What is the molarity of the solution, to three significant figures?

(A) 0.0221 M
(B) 0.0171 M
(C) 0.0300 M
(D) 0.0111 M`,
    answer: `Correct answer: (B) 0.0171 M

Moles of K2SO4 = mass ÷ molar mass = [[frac:5.23 g|174.3 g/mol]] = 0.0300 mol

Molarity = moles ÷ volume (L) = [[frac:0.0300 mol|1.75 L]] = 0.0171 M (1.71 × 10⁻² M)

(A) results from using an incorrect formula (KSO4) for potassium sulfate instead of K2SO4.
(C) is just the number of moles (0.0300), not divided by volume — it stops one step early.
(D) results from using an incorrect formula (K2(SO4)2) for potassium sulfate.`
  },
  {
    topic: '3.7', mcq: true,
    title: 'Q12 — Which Solution Has the Greatest Moles of Chloride Ion (Multiple Choice)',
    content:
`Which of the following solutions contains the greatest number of moles of Cl⁻ ions?

(A) 25 mL of 0.10 M CaCl2
(B) 10 mL of 0.15 M NaCl
(C) 20 mL of 0.20 M SrCl2
(D) 10 mL of 0.10 M KCl`,
    answer: `Correct answer: (C) 20 mL of 0.20 M SrCl2

Each formula unit's moles of Cl⁻ = (ions of Cl⁻ per formula unit) × molarity × volume (L).

(A) CaCl2 (2 Cl⁻ per unit): 2 × 0.10 M × 0.025 L = 5.0 × 10⁻³ mol Cl⁻
(B) NaCl (1 Cl⁻ per unit): 1 × 0.15 M × 0.010 L = 1.5 × 10⁻³ mol Cl⁻
(C) SrCl2 (2 Cl⁻ per unit): 2 × 0.20 M × 0.020 L = 8.0 × 10⁻³ mol Cl⁻
(D) KCl (1 Cl⁻ per unit): 1 × 0.10 M × 0.010 L = 1.0 × 10⁻³ mol Cl⁻

(C) gives the greatest number of moles of Cl⁻ (8.0 × 10⁻³ mol). The key idea is that for salts with more than one anion per formula unit (CaCl2, SrCl2), the moles of Cl⁻ ion is double the moles of the salt itself — this multiplier must not be skipped.`
  },
  {
    topic: '3.7', mcq: true,
    title: 'Q13 — Identify the Incorrect Statement About Solutions (Multiple Choice)',
    content:
`Which of the following statements about solutions is incorrect?

(A) A solution is a homogeneous mixture.
(B) The solvent is always the component in the largest amount.
(C) Adding solvent changes the number of moles of solute.
(D) Molarity expresses concentration as moles of solute per liter of solution.`,
    answer: `Correct answer: (C) Adding solvent changes the number of moles of solute.

Adding solvent to a solution dilutes it (lowers the concentration/molarity) but does not change the number of moles of solute present — no solute is added or removed, only the total solution volume increases. This is the incorrect statement, since it is a false claim.

(A) is a correct definition — a solution is, by definition, a homogeneous mixture.
(B) is a correct definition of "solvent" (the majority component that the solute is dissolved in).
(D) is a correct definition of molarity: M = moles of solute / liters of solution.`
  },
  {
    topic: '3.7', mcq: true,
    title: 'Q14 — Concentration of Hydroxide Ions from Dissolved Barium Hydroxide (Multiple Choice)',
    content:
`A 50.2 g sample of barium hydroxide, Ba(OH)2, is dissolved in 1.25 L of solution.

What is the concentration of hydroxide ions, to three significant figures?

(A) 0.234 M
(B) 0.366 M
(C) 0.469 M
(D) 0.732 M`,
    answer: `Correct answer: (C) 0.469 M

Molar mass of Ba(OH)2 = 137.33 + 2(16.00 + 1.008) = 171.35 g/mol

Moles of Ba(OH)2 = [[frac:50.2 g|171.35 g/mol]] = 0.293 mol

Each formula unit of Ba(OH)2 releases 2 OH⁻ ions:
Moles of OH⁻ = 2 × 0.293 mol = 0.586 mol

Concentration of OH⁻ = [[frac:0.586 mol|1.25 L]] = 0.469 M

(A) fails to account for the 2 OH⁻ ions released per formula unit (uses moles of Ba(OH)2 directly instead of moles of OH⁻).
(B) makes the same error as (A) and also multiplies by 1.25 instead of dividing by it.
(D) correctly doubles for the 2 OH⁻ ions but then multiplies by 1.25 instead of dividing by it.`
  },
  {
    topic: '3.7', mcq: true,
    title: 'Q15 — Volume of Ascorbic Acid Solution Needed for a Given Mass (Multiple Choice)',
    content:
`Ascorbic acid has the chemical formula C6H8O6 (molar mass 176.12 g/mol).

How many milliliters of a 0.0653 M solution of ascorbic acid would be required to obtain 4.90 g of ascorbic acid?

(A) 27.8 mL
(B) 426 mL
(C) 550 mL
(D) 2350 mL`,
    answer: `Correct answer: (B) 426 mL

Moles of ascorbic acid needed = [[frac:4.90 g|176.12 g/mol]] = 0.0278 mol

Volume of solution needed = [[frac:moles|molarity]] = [[frac:0.0278 mol|0.0653 mol/L]] = 0.426 L

Converting to mL: 0.426 L × 1000 mL/L = 426 mL`
  },
  {
    topic: '3.7',
    title: 'Q16 — Diluting NaCl Stock Solution and Explaining Molarity in Dilution',
    content:
`A student prepares 250.0 mL of a 0.250 M NaCl solution by diluting a more concentrated 1.00 M NaCl stock solution.

(a) Describe what molarity represents and explain how it is used in solution calculations.

(b) Calculate the volume of 1.00 M NaCl stock solution required to prepare 250.0 mL of the 0.250 M solution.

(c) Describe how to accurately prepare 250.0 mL of the 0.250 M NaCl solution in a laboratory, starting from the stock solution.

(d) Explain what happens to the molarity and to the total number of moles of solute when a solution is diluted.`,
    answer: `(a) Molarity is the concentration of a solution expressed as moles of solute per liter of solution (M = n/V). It is used in solution calculations to determine how much solute (or how much of a more concentrated stock solution) is needed to prepare a solution of a desired concentration and volume, via M = n/V or the dilution equation M1V1 = M2V2.

(b) Using the dilution equation M1V1 = M2V2, where M1 = 1.00 M (stock), M2 = 0.250 M (target), V2 = 250.0 mL:
V1 = [[frac:M2 × V2|M1]] = [[frac:0.250 M × 250.0 mL|1.00 M]] = 62.5 mL

(c) Measure exactly 62.5 mL of the 1.00 M NaCl stock solution using a graduated cylinder or volumetric pipette, and transfer it into a 250.0 mL volumetric flask. Add distilled water to the flask until the solution level reaches the calibration mark (the meniscus sits exactly on the mark), then cap the flask and invert it several times to mix thoroughly.

(d) When a solution is diluted, the total number of moles of solute stays the same — no solute is added or removed, only more solvent is added. However, because molarity is moles of solute per liter of solution, increasing the total solution volume while keeping the moles of solute fixed results in a lower molarity.`
  },
  {
    topic: '3.7',
    title: 'Q17 — Seawater Conductivity and Total Ion Concentration from Multiple Dissolved Salts',
    content:
`A seawater sample contains the following ionic-compound concentrations:
• 0.550 M NaCl
• 0.250 M MgCl2
• 0.100 M CaCl2

(a) Explain how the ions dissolved from these salts allow seawater to conduct electricity.

(b) Calculate the total concentration of ions (all dissolved particles from all three salts combined) in the solution.`,
    answer: `(a) When NaCl, MgCl2, and CaCl2 dissolve, they dissociate into free-moving, independent ions (Na+, Mg2+, Ca2+, Cl⁻) dispersed throughout the water. These charged particles are free to migrate through the solution, so when the solution is connected to a circuit, positive ions move toward the negative electrode and negative ions move toward the positive electrode, completing the circuit and allowing electric current to flow. A solution with no dissolved ions (like pure water or a solution of a nonelectrolyte) cannot conduct in this way.

(b) Multiply the concentration of each salt by the number of ions it produces per formula unit upon dissociation, then add:
NaCl → Na+ + Cl⁻ (2 ions/unit): 0.550 M × 2 = 1.10 M
MgCl2 → Mg2+ + 2Cl⁻ (3 ions/unit): 0.250 M × 3 = 0.750 M
CaCl2 → Ca2+ + 2Cl⁻ (3 ions/unit): 0.100 M × 3 = 0.300 M

Total ion concentration = 1.10 M + 0.750 M + 0.300 M = 2.15 M`
  },
  {
    topic: '3.7',
    title: 'Q18 — Moles of NH2Cl in a Dilute Aqueous Solution',
    content:
`A student measures the concentration of dissolved NH2Cl (molar mass 51.48 g/mol) in a 1.0 L water sample and finds it to be 0.0016 g/L.

Calculate the number of moles of NH2Cl present in the 1.0 L sample.`,
    answer: `First convert the concentration from g/L to mol/L by dividing by the molar mass:

[[frac:0.0016 g/L|51.48 g/mol]] = 3.1 × 10⁻⁵ mol/L

Since the sample volume is exactly 1.0 L, the number of moles present is:

n = concentration × volume = 3.1 × 10⁻⁵ mol/L × 1.0 L = 3.1 × 10⁻⁵ mol`
  },
  {
    topic: '3.7',
    title: 'Q19 — Moles of Sulfate Ion After Diluting an Al2(SO4)3 Solution and Why Conductivity Still Drops',
    content:
`A student prepares a solution by dissolving 8.56 g of Al2(SO4)3 (molar mass 342.14 g/mol) in 250.0 mL of distilled water. The student then dilutes 50.0 mL of this solution to a total volume of 200.0 mL with additional distilled water.

(a) Calculate the moles of SO4²⁻ ions present in the final diluted 200.0 mL solution.

(b) Explain why the total number of SO4²⁻ ions in that 50.0 mL portion remains the same after dilution to 200.0 mL, even though the solution's electrical conductivity decreases.`,
    answer: `(a) Moles of Al2(SO4)3 in the original 250.0 mL solution:
n = [[frac:8.56 g|342.14 g/mol]] = 0.02502 mol

Moles of Al2(SO4)3 in the 50.0 mL portion taken (same concentration, smaller volume):
n = 0.02502 mol × [[frac:50.0 mL|250.0 mL]] = 0.005004 mol

Each formula unit of Al2(SO4)3 releases 3 SO4²⁻ ions:
n(SO4²⁻) = 0.005004 mol × 3 = 0.0150 mol

Diluting this 50.0 mL portion to 200.0 mL with more water does not add or remove any SO4²⁻ ions, so the diluted 200.0 mL solution still contains 0.0150 mol of SO4²⁻.

(b) Diluting a solution increases its total volume but does not add or remove any solute particles — the same 0.0150 mol of SO4²⁻ ions is simply now spread through a larger volume of solvent. Electrical conductivity depends on the concentration of ions (ions per unit volume), not the absolute number of ions present. Since the same number of ions now occupies a larger volume, the ion concentration (and therefore the conductivity) decreases, even though the total mole count of SO4²⁻ is unchanged.`
  },
];

// ---------------- 3.8 Representations of Solutions ----------------
const topic3_8 = [
  {
    topic: '3.8', mcq: true,
    title: 'Q6 — Comparing Ion Ratios in Two Particulate Solution Diagrams (Multiple Choice)',
    imageUrl: IMG_BASE + '3.8-vessel-diagram-cacl2-vs-kcl.png',
    content:
`Equal volumes of two aqueous solutions are represented in the particulate diagram above (water molecules are not shown; filled circles = any positive ion, open circles = any negative ion).

If Vessel 1 represents a CaCl2 (aq) solution, then Vessel 2 could represent an aqueous solution of

(A) CaCl2 with the same molarity as the solution in Vessel 1.
(B) CaCl2 with half the molarity of the solution in Vessel 1.
(C) KCl with the same molarity as the solution in Vessel 1.
(D) KCl with half the molarity of the solution in Vessel 1.`,
    answer: `Correct answer: (D) KCl with half the molarity of the solution in Vessel 1.

Vessel 1 shows 8 positive ions and 16 negative ions — a 1:2 ratio of cation to anion, consistent with CaCl2 (each Ca²⁺ is accompanied by 2 Cl⁻).

Vessel 2 shows 4 positive ions and 4 negative ions — a 1:1 ratio, consistent with a salt like KCl (each K+ is accompanied by 1 Cl⁻), not a 1:2 salt like CaCl2.

Since the volumes are equal, the number of formula units present is proportional to molarity. Vessel 1 has 8 positive ions (8 formula units of CaCl2); Vessel 2 has 4 positive ions (4 formula units of KCl) — half as many formula units in the same volume, so Vessel 2's molarity is half that of Vessel 1.

(A) and (B) are wrong because the 1:1 ion ratio shown in Vessel 2 is inconsistent with CaCl2, which must show a 1:2 cation:anion ratio.
(C) is wrong because although the ion ratio is consistent with KCl, the number of ions (4 vs. 8) shows Vessel 2 is at half the molarity, not the same molarity.`
  },
  {
    topic: '3.8', mcq: true,
    title: 'Q7 — Identify the Particulate Diagram Representing a Heterogeneous Mixture (Multiple Choice)',
    imageUrl: IMG_BASE + '3.8-heterogeneous-mixture-diagrams-abcd.png',
    content:
`Which of the following particulate diagrams (A, B, C, or D) represents a heterogeneous mixture?

(A) Two distinct particle types clustered separately in different regions of the container.
(B) The same two distinct particle types freely and randomly mixed throughout the container.
(C) A single type of particle (pure substance) evenly distributed throughout the container.
(D) Two distinct particle types arranged in a uniform, evenly alternating pattern (as in a solid).`,
    answer: `Correct answer: (A)

A heterogeneous mixture is one in which the composition is not uniform throughout — different regions of the sample have different proportions of the components. Diagram A shows two clearly different particle types that are not evenly distributed relative to each other (one type clustered in one region, the other type clustered in a different region), which is the defining feature of a heterogeneous mixture.

(B) is incorrect because it shows two different substances freely and randomly mixed together with uniform composition throughout — this is a homogeneous mixture (solution), not heterogeneous.
(C) is incorrect because it shows only one type of particle — this is a pure substance, not a mixture at all.
(D) is incorrect because it shows a uniform, evenly repeating composition of two different particles throughout (as in an ordered solid) — uniform composition means homogeneous, not heterogeneous.`
  },
];

// ---------------- 3.9 Separation of Solutions and Mixtures / Chromatography ----------------
const topic3_9 = [
  {
    topic: '3.9', mcq: true,
    title: 'Q8 — Explaining Shorter Retention Time for Cyclohexene vs. Cyclohexanol (Multiple Choice)',
    content:
`A sample of cyclohexene contaminated with cyclohexanol is separated by column chromatography. Hexane is used as the mobile phase and silica gel (a polar stationary phase) as the stationary phase.

Which statement correctly explains why cyclohexene has a shorter retention time than cyclohexanol?

(A) Cyclohexene and cyclohexanol have different polarities.
(B) Cyclohexene is polar due to the C=C double bond.
(C) Cyclohexanol is held in the mobile phase for longer.
(D) Cyclohexanol can form hydrogen bonds with the silica gel.`,
    answer: `Correct answer: (D) Cyclohexanol can form hydrogen bonds with the silica gel.

The oxygen atoms in the silica gel's -Si-OH surface groups have lone pairs available to hydrogen bond with the hydroxyl (-OH) hydrogen of cyclohexanol. This gives cyclohexanol a much stronger attraction (affinity) to the polar stationary phase than cyclohexene has, so cyclohexanol travels more slowly through the column and has a longer retention time — meaning cyclohexene, lacking this hydrogen-bonding ability, has the shorter retention time.

(A) is incomplete: cyclohexene and cyclohexanol do have different polarities, but stating this fact alone does not explain which one is retained more or why — the specific interaction (hydrogen bonding with the stationary phase) must be identified.
(B) is incorrect because cyclohexene, with only a nonpolar C=C double bond and no highly electronegative substituent, is essentially nonpolar (alkenes are not significantly polar from the C=C alone).
(C) is directionally backwards in emphasis and still incomplete — cyclohexanol is held in the stationary phase (not the mobile phase) for longer, which is what gives it its longer retention time; no reason is given.`
  },
  {
    topic: '3.9', mcq: true,
    title: 'Q9 — Calculating the Rf Value of a Compound from a Chromatogram (Multiple Choice)',
    imageUrl: IMG_BASE + '3.9-rf-chromatogram-compounds-a-b.png',
    content:
`A chromatogram of two compounds, A and B, is shown above. Compound A traveled 3.5 cm from the origin, and compound B traveled 5.2 cm from the origin. The solvent front traveled 8.0 cm from the origin.

The Rf value of compound B is

(A) 0.21
(B) 0.44
(C) 0.65
(D) 1.54`,
    answer: `Correct answer: (C) 0.65

Rf = [[frac:distance traveled by component|distance traveled by solvent]] = [[frac:5.2 cm|8.0 cm]] = 0.65

(A) 0.21 comes from incorrectly using the difference in distance traveled between compounds A and B (5.2 − 3.5 = 1.7 cm) divided by the solvent front distance, rather than compound B's own distance.
(B) 0.44 comes from mistakenly using compound A's distance (3.5 cm) divided by the solvent front (3.5/8.0 = 0.44) instead of compound B's distance.
(D) 1.54 comes from inverting the ratio (8.0/5.2 = 1.54) — putting the values upside down in the Rf formula. Rf values must always be less than 1, since a component can never travel farther than the solvent front.`
  },
  {
    topic: '3.9', mcq: true,
    title: 'Q10 — What Determines How Far an Amino Acid Travels on a Chromatogram (Multiple Choice)',
    content:
`The distance that an amino acid moves on a chromatogram depends on

(A) the intermolecular forces between the amino acid and the stationary phase.
(B) the intermolecular forces between the amino acid and both the mobile and stationary phases.
(C) the intermolecular forces between the solvent and the stationary phase.
(D) the intermolecular forces between the solvent and both the mobile and stationary phases.`,
    answer: `Correct answer: (B) the intermolecular forces between the amino acid and both the mobile and stationary phases.

How far an amino acid travels depends on the balance between two competing sets of intermolecular attractions: how strongly it is attracted to (and dissolves in) the mobile phase, which carries it along, versus how strongly it is attracted to (adsorbed by) the stationary phase, which holds it back. Only considering one phase gives an incomplete picture — the amino acid's net movement is determined by the relative strength of its interactions with both phases together.

(A) is incomplete — it accounts for only the stationary-phase interaction and ignores how the amino acid interacts with the mobile phase.
(C) and (D) are incorrect because they describe interactions involving the solvent (the mobile phase itself) rather than the amino acid's own interactions with the phases — the solvent is the mobile phase, so "solvent and mobile phase" isn't even a meaningful comparison, and neither option addresses the amino acid at all.`
  },
  {
    topic: '3.9', mcq: true,
    title: 'Q11 — Identifying an Unknown Dye from Rf Values Compared to Reference Dyes (Multiple Choice)',
    content:
`Four pure reference dyes, A through D, are spotted at evenly spaced positions along the origin line of a chromatography paper and developed in a chromatography chamber. After development, dyes A and C are found to have each traveled close to three-quarters of the way from the origin to the solvent front (high Rf, around 0.75), dye D has traveled only a small distance from the origin (low Rf, around 0.1), and dye B has traveled to a position roughly one-quarter of the way from the origin to the solvent front (Rf around 0.25).

An unknown dye, X, is spotted on a separate piece of chromatography paper and developed under the same conditions. After development, dye X is found at a position roughly one-quarter of the way from the origin to the solvent front.

Based on these results, which of the four reference dyes is most likely to be dye X?

(A) Dye A
(B) Dye B
(C) Dye C
(D) Dye D`,
    answer: `Correct answer: (B) Dye B

Dye X traveled to a position roughly one-quarter of the way between the origin and the solvent front, giving it an approximate Rf value of 0.25. Comparing this to the four reference dyes, only dye B also traveled to roughly the same relative position (Rf ≈ 0.25). Dyes A and C traveled much farther (Rf ≈ 0.75, roughly three-quarters of the way to the solvent front), and dye D traveled only a short distance from the origin (Rf ≈ 0.1).

Because different compounds developed on different chromatography papers may have solvent fronts that traveled different absolute distances, it is the Rf value (the ratio of distance traveled by the compound to distance traveled by the solvent, which is constant for a given compound/solvent/stationary-phase system) that should be compared — not the raw/absolute distance traveled. Dye B's Rf most closely matches dye X's, making it the most likely identity.

(A), (C), and (D) are incorrect because their Rf values do not match dye X's — A and C traveled much farther, and D traveled a much shorter distance.`
  },
  {
    topic: '3.9', mcq: true,
    title: 'Q12 — Choosing the Best Separation Technique for Two Miscible Liquids (Multiple Choice)',
    content:
`A student obtains a mixture of the liquids pentane (C5H12, boiling point 36 °C, density 0.63 g/mL) and heptane (C7H16, boiling point 98 °C, density 0.68 g/mL), which are miscible in all proportions.

Which of the following techniques would be best for separating the components of this mixture, and why?

(A) Distillation, because the liquids boil at different temperatures owing to the difference in strength of their intermolecular forces.
(B) Filtration, because the different densities of the liquids would allow one to pass through the filter paper while the other would not.
(C) Column chromatography, because the higher molar mass of one component would cause it to move down the column faster than the other.
(D) Paper chromatography, because the liquids would move along the stationary phase at different rates owing to the difference in polarity of their molecules.`,
    answer: `Correct answer: (A) Distillation, because the liquids boil at different temperatures owing to the difference in strength of their intermolecular forces.

Distillation separates components of a mixture based on differences in boiling point. Pentane and heptane are both nonpolar alkanes that experience only London dispersion forces, but heptane is a larger molecule with more electrons and surface area, so its dispersion forces are stronger — giving it a substantially higher boiling point (98 °C) than pentane (36 °C). Heating the mixture allows pentane to vaporize first and be collected separately, then heptane.

(B) is incorrect: filtration separates based on physical state/particle size (e.g., solid from liquid), not liquid density — miscible liquids do not form separate layers that filter paper could distinguish.
(C) and (D) are both incorrect: pentane and heptane are chemically very similar (both nonpolar alkanes of similar polarity), so they would not separate well by chromatography, which relies on differences in polarity/adsorption behavior between the mobile and stationary phases — they are too alike in that respect.`
  },
  {
    topic: '3.9', mcq: true,
    title: 'Q13 — Effect of Increasing Solvent Polarity on Rf Values in TLC (Multiple Choice)',
    content:
`A thin-layer chromatography (TLC) experiment is conducted using a silica-gel-coated TLC plate (a polar stationary phase) and a solvent mixture of 95% dichloromethane (DCM) and 5% methanol as the mobile phase. The sample mixture contains two polar food additives.

The relative polarities of solvents available for this experiment are:
Chloroform: 0.26
DCM: 0.31
Methanol: 0.76

Based on this information, which change to the solvent mixture would most likely increase the Rf values of the food additives in a subsequent experiment?

(A) Decreasing the percentage of methanol.
(B) Increasing the percentage of methanol.
(C) Replacing DCM with chloroform.
(D) Replacing methanol with chloroform.`,
    answer: `Correct answer: (B) Increasing the percentage of methanol.

Methanol has by far the highest relative polarity of the three solvents listed (0.76 vs. 0.31 for DCM and 0.26 for chloroform). Increasing methanol's percentage in the solvent mixture makes the overall mobile phase more polar. A more polar mobile phase interacts more strongly with the polar food additives, pulling them more effectively away from the polar silica gel (reducing their adsorption to the stationary phase) and allowing them to travel farther up the plate — increasing their Rf values.

(A) is incorrect: decreasing methanol makes the mobile phase less polar, so the polar food additives would interact more strongly with the polar stationary phase (relative to the now-less-polar mobile phase), decreasing their Rf values.
(C) and (D) are both incorrect: replacing DCM (0.31) or methanol (0.76) with chloroform (0.26, the least polar of the three) makes the overall solvent mixture less polar, which would decrease (not increase) the Rf values by the same reasoning as (A).`
  },
  {
    topic: '3.9',
    title: 'Q14 — Identifying the Least Polar Dye and an Unknown Dye from a Paper Chromatography Result',
    imageUrl: IMG_BASE + '3.9-dye-chromatography-abc-unknown.png',
    content:
`A student investigates three pure dyes, labeled A, B, and C, and an unknown sample that contains one of the three dyes, using paper chromatography. A drop of each dye is placed at the origin on a strip of chromatography paper (a polar stationary phase), and the paper is stood in a nonpolar solvent (the mobile phase). After development, dye C has traveled the farthest from the origin (closest to the solvent front), while dyes A and B have traveled a shorter, roughly similar distance. On a separately developed strip, the unknown sample travels to a position about midway between the origin and the solvent front — matching the position reached by dye A on the three-dye strip.

(a) Which dye (A, B, or C) is the least polar? Justify your answer in terms of the interactions between the dyes and the solvent, or between the dyes and the paper.

(b) Which dye is present in the unknown sample? Justify your answer.`,
    answer: `(a) Dye C is the least polar, because it moved the farthest from the origin (closest to the solvent front). The paper (stationary phase) is polar, and the solvent (mobile phase) is nonpolar. A nonpolar dye is more strongly attracted to (more soluble in) the nonpolar solvent and only weakly retained by the polar paper, so it travels the farthest. Conversely, a more polar dye would be more strongly attracted to (retained by) the polar paper and would travel a shorter distance. Since dye C traveled the farthest, it must be the least polar of the three.

(b) Dye A is present in the unknown sample. The unknown sample travels to a position roughly midway between the origin and the solvent front, matching where dye A travels on the three-dye chromatogram — meaning the unknown and dye A have essentially the same Rf value under these conditions. Since a given compound has a characteristic Rf value in a given solvent/stationary-phase system, matching Rf values (not simply matching raw height on the paper, since different developing strips can have solvent fronts that traveled different absolute distances) is what identifies the unknown as dye A.`
  },
  {
    topic: '3.9',
    title: 'Q15 — Why Chromatography Separates Mixtures and the Roles of the Mobile and Stationary Phases',
    content:
`A forensic scientist analyzes a mixture of dyes from an ink sample using paper chromatography, to determine whether a suspect's pen matches ink found at a crime scene.

(a) Explain why chromatography is effective for separating the components of a mixture.

(b) Describe the function of the mobile phase and the stationary phase in paper chromatography.`,
    answer: `(a) Chromatography is effective for separating the components of a mixture because it separates substances based on their different solubilities in the mobile phase and their different strengths of interaction (adsorption) with the stationary phase. Components with a stronger attraction to the mobile phase and weaker attraction to the stationary phase travel farther and faster, while components with the reverse balance of attractions travel more slowly — since different compounds in a mixture generally have somewhat different structures/polarities, they end up separated into distinct spots after enough time (or distance) has passed.

(b) The mobile phase is the solvent that flows through (or up) the stationary phase by capillary action, carrying the dissolved components of the mixture along with it. The stationary phase is the paper (or other solid support) itself, which physically interacts with (adsorbs) the dissolved substances to varying degrees, affecting how far and how fast each substance travels. The distance any given substance travels is determined by the balance between how strongly it is carried along by the mobile phase versus how strongly it is held back by the stationary phase.`
  },
  {
    topic: '3.9',
    title: 'Q16 — Comparing Stationary-Phase Interaction Strength from Two Rf Values and Predicting a Solvent Change',
    content:
`A forensic scientist measures the Rf values of two dyes in an ink sample using paper chromatography, recording 0.35 for one dye and 0.72 for the other.

(a) Which dye has a stronger interaction with the stationary phase? Justify your answer.

(b) Predict how changing the mobile phase to a more polar solvent would affect the Rf values of both dyes.`,
    answer: `(a) The dye with Rf = 0.35 has the stronger interaction with the stationary phase. It moved a smaller fraction of the distance the solvent traveled, meaning it was held back more — indicating stronger intermolecular attraction (e.g., stronger adsorption or hydrogen bonding) to the stationary phase relative to the mobile phase, compared to the dye with Rf = 0.72, which moved much farther and was therefore held back less.

(b) If the mobile phase becomes more polar, the Rf value of the more polar dye (Rf = 0.72) would be expected to increase further, since a more polar mobile phase interacts even more strongly with it, pulling it along even more readily. The Rf value of the less polar (more strongly retained) dye (Rf = 0.35) would likely stay about the same or decrease slightly, since it is not very soluble in a more polar solvent and would continue to be held back by its stronger attraction to the stationary phase (or interact even less with a mobile phase that has become more different in polarity from it).`
  },
  {
    topic: '3.9',
    title: 'Q17 — Labeling a Simple Distillation Setup and Explaining Its Separation Mechanism',
    imageUrl: IMG_BASE + '3.9-simple-distillation-setup.png',
    content:
`The diagram above shows a simple distillation setup used to separate pure water from a sample of seawater containing dissolved salts. The setup consists of a round-bottom flask heated over a flame, connected via a bent tube to a condenser (a jacketed tube), which drains into a collection beaker.

(a) Identify the component where the dissolved salt remains, and the component where the purified water ultimately collects.

(b) Explain why this method successfully separates water from the dissolved salts.`,
    answer: `(a) The dissolved salt remains behind in the round-bottom flask (the original heated seawater sample), since only the water evaporates and leaves the flask. The purified water ultimately collects as a liquid in the beaker at the far end of the condenser, after it has evaporated from the flask, traveled through the condenser, and condensed back into a liquid.

(b) As the seawater is heated, the water evaporates (boils) well before the dissolved ionic salts do, because water has a much lower boiling point than the ionic salts, which are held together by very strong electrostatic (lattice) forces and require far more energy to vaporize. The water vapor travels up and through the tube into the condenser, where it is cooled by the jacket surrounding the inner tube, causing it to condense back into liquid water, which then drips down and is collected in the beaker. The dissolved salts, having far too high a boiling point to vaporize under these conditions, remain behind as a solid/concentrated residue in the original flask — successfully separating the water from the salts.`
  },
  {
    topic: '3.9',
    title: 'Q18 — Predicting TLC Migration and Extraction Layer Behavior for a Polar and a Nonpolar Compound',
    content:
`A student is performing an experiment to separate a mixture of compound A (polar) and compound B (nonpolar) using thin-layer chromatography (TLC) with a polar stationary phase (silica gel) and a nonpolar mobile-phase solvent.

(a) Predict which compound, A or B, will travel farther on the TLC plate. Justify your answer.

The student then adds the same mixture of compound A and compound B to a separating funnel containing two immiscible liquid layers: water and hexane.

(b) Identify which layer, water or hexane, will contain mostly compound A. Justify your answer.

(c) Explain how the size of the difference in intermolecular forces between the two solvents (or between the mobile and stationary phases) affects how efficient a separation technique like liquid-liquid extraction or TLC will be.`,
    answer: `(a) Compound B (the nonpolar compound) will travel farther on the TLC plate. The stationary phase (silica gel) is polar, so it will strongly attract and retain the polar compound A through dipole-dipole interactions and/or hydrogen bonding, holding it back near the origin. Compound B, being nonpolar, interacts only weakly with the polar stationary phase and instead moves along more readily with the nonpolar mobile-phase solvent, carrying it farther up the plate.

(b) The water layer will contain mostly compound A. Water is a polar solvent, and compound A is polar, so compound A dissolves into the water layer through dipole-dipole interactions and/or hydrogen bonding ("like dissolves like"). Compound B, being nonpolar, would instead be found mostly in the nonpolar hexane layer.

(c) The greater the difference in intermolecular force character (e.g., polarity) between the two solvents (in extraction) or between the mobile and stationary phases (in TLC/chromatography), the more efficient the separation will be. This is because each compound in the mixture will then strongly favor one phase/solvent over the other — a compound that is much more compatible with one solvent than the other will partition almost entirely into that one phase, giving a clean separation. If the two solvents (or phases) are too similar in polarity to each other, a compound may distribute significantly into both, reducing how cleanly the mixture's components are separated.`
  },
];

// ---------------- 3.10 Solubility ----------------
const topic3_10 = [
  {
    topic: '3.10', mcq: true,
    title: 'Q6 — Condition Under Which a Solution Is Most Likely to Form (Multiple Choice)',
    content:
`Under which condition is a solution most likely to form?

(A) When solvent-solute interactions are weaker than solvent-solvent interactions.
(B) When solvent-solute interactions are stronger than solvent-solvent interactions.
(C) When solute-solute interactions are stronger than solvent-solvent interactions.
(D) When all interactions (solvent-solvent, solute-solute, and solvent-solute) are equally strong.`,
    answer: `Correct answer: (B) When solvent-solute interactions are stronger than solvent-solvent interactions.

A solution is most likely to form when the attractive forces between solvent and solute particles are strong enough to overcome the attractive forces holding solvent particles to each other. This allows solvent particles to surround and pull apart solute particles, dispersing them throughout the solvent to form a solution.

(A) is incorrect: if solvent-solvent interactions are stronger than solvent-solute interactions, the solvent molecules would "prefer" to stay associated with each other rather than surround the solute, making it harder for the solute to disperse.
(C) is incorrect: if solute-solute interactions are stronger than solvent-solvent interactions, the solute particles would tend to stay strongly bound to each other, resisting being pulled apart and dispersed by the solvent.
(D) is incorrect: if all interactions are equally strong, there is no net driving force favoring the solute dispersing into the solvent over the solute and solvent each simply remaining with their own kind, so a solution is not particularly favored to form.`
  },
  {
    topic: '3.10',
    title: 'Q7 — Predicting the Miscibility of Ethanol and Hexane from Intermolecular Forces',
    content:
`A student is investigating the miscibility of three liquids: ethanol, hexane, and water.

Predict whether ethanol and hexane are miscible with each other, and justify your answer based on intermolecular forces.`,
    answer: `Ethanol and hexane are not miscible (they do not mix to form a single homogeneous solution). Ethanol is a polar molecule that experiences hydrogen bonding (via its -OH group) and dipole-dipole forces with other ethanol molecules, while hexane is a nonpolar molecule that experiences only weak London dispersion forces. Because polar and nonpolar substances generally do not mix well ("like dissolves like"), the strong hydrogen-bonding/dipole-dipole network among ethanol molecules is not effectively replaced by interactions with the nonpolar hexane, so the two liquids remain largely separated rather than forming a single solution.`
  },
  {
    topic: '3.10',
    title: 'Q8 — How Hydrogen Bonding in Water Influences What Dissolves in It',
    content:
`Explain how hydrogen bonding in water influences the solubility of other substances in water.`,
    answer: `Water's dominant intermolecular force is hydrogen bonding, arising from its polar O-H bonds and the lone pairs on its oxygen atom. Because of this, water readily dissolves substances that are themselves polar or capable of hydrogen bonding (such as ionic compounds, via ion-dipole interactions, or molecular substances like ethanol that have -OH or -NH groups), since these substances can form similarly strong dipole-dipole or hydrogen-bonding interactions with water molecules that compensate for breaking apart water's own hydrogen-bonded network. In contrast, nonpolar substances (like hexane) cannot form hydrogen bonds or strong dipole interactions with water, so they do not dissolve well in water — the energy cost of disrupting water's hydrogen-bonding network is not compensated for by any comparably strong attraction to the nonpolar solute.`
  },
  {
    topic: '3.10',
    title: 'Q9 — Predicting Which Solvent Acetone Mixes Better With',
    content:
`A student adds a sample of acetone to two separate test tubes: one containing water and one containing hexane.

Predict which liquid acetone will mix better with, and justify your answer in terms of relative intermolecular force strengths.`,
    answer: `Acetone will mix better with water. Acetone is a polar molecule (it has a polar C=O carbonyl group), so it interacts with water through dipole-dipole forces (and can accept hydrogen bonds from water's O-H groups), which are comparable in strength to the hydrogen-bonding network within water itself — allowing acetone to disperse throughout the water and form a solution.

In contrast, hexane is nonpolar and can only interact with other molecules through weak London dispersion forces. These dispersion forces between acetone and hexane are much weaker than the dipole-dipole/hydrogen-bonding interactions acetone can form with water, so acetone (being polar) does not mix as well with the nonpolar hexane. This follows the general "like dissolves like" principle: polar substances tend to dissolve well in polar solvents.`
  },
  {
    topic: '3.10',
    title: 'Q10 — Explaining Why NH2Cl Is Highly Soluble in Water While NCl3 Is Nearly Insoluble',
    content:
`NH2Cl and NCl3 are both molecular compounds with a central, electronegative nitrogen atom bearing a lone pair of electrons. NH2Cl is highly soluble in water, whereas NCl3 is nearly insoluble in water.

Explain this observation in terms of the types and relative strengths of the intermolecular forces between each solute and water.`,
    answer: `Both NH2Cl and NCl3 are polar molecules and can form dipole-dipole interactions with polar water molecules. However, NH2Cl can additionally form hydrogen bonds with water in a way that NCl3 cannot as effectively: the N-H bonds in NH2Cl allow its hydrogen atoms to act as hydrogen-bond donors to the lone pairs on water's oxygen atom, and its nitrogen's lone pair can act as a hydrogen-bond acceptor from water's O-H hydrogens — giving NH2Cl multiple strong hydrogen-bonding contact points with water. NCl3, by contrast, has no N-H bonds at all (its nitrogen is bonded only to three chlorine atoms), so it can only accept a hydrogen bond via its nitrogen lone pair, not donate one; NCl3's only significant intermolecular forces with water are therefore weaker dipole-dipole interactions plus this single hydrogen-bond-accepting contact.

Because the total intermolecular attraction between NH2Cl and water is considerably stronger (multiple hydrogen bonds plus dipole-dipole) than between NCl3 and water (weaker dipole-dipole forces, more limited hydrogen bonding), NH2Cl dissolves in water much more readily, while NCl3 remains largely insoluble.`
  },
  {
    topic: '3.10',
    title: 'Q11 — Why Ionic Compounds Like NaCl, MgCl2, and CaCl2 Dissolve Readily in Water',
    content:
`Seawater contains dissolved salts such as NaCl, MgCl2, and CaCl2.

Explain, in terms of interactions at the molecular level, why ionic compounds such as these dissolve readily in water.`,
    answer: `Water is a polar molecule, with a partially negative oxygen end and partially positive hydrogen ends. When an ionic compound like NaCl, MgCl2, or CaCl2 is placed in water, the partially negative oxygen atoms of surrounding water molecules are attracted to and orient toward the compound's cations (e.g., Na+, Mg2+, Ca2+), while the partially positive hydrogen atoms of other water molecules are attracted to and orient toward the compound's anions (e.g., Cl⁻). These ion-dipole interactions between water molecules and the individual ions are strong enough to overcome the electrostatic (Coulombic) attractions holding the ions together in the solid ionic lattice, pulling the ions away from the lattice one by one. Once separated, each ion becomes surrounded (hydrated) by a shell of water molecules oriented to maximize this ion-dipole attraction, which stabilizes the now-separated, freely dispersed ions in solution — allowing the ionic compound to dissolve readily.`
  },
];

const questions = [
  ...topic3_7,
  ...topic3_8,
  ...topic3_9,
  ...topic3_10,
];

async function main() {
  const { data: existing, error: exErr } = await sb.from('questions').select('id, topic_id, order_index');
  if (exErr) { console.error('Failed to query existing questions:', exErr); process.exit(1); }
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0, failed = 0;
  const perTopicCount = {};
  for (const q of questions) {
    const topicId = TOPICS[q.topic];
    if (!topicId) { console.error('Unknown topic:', q.topic, q.title); failed++; continue; }
    const orderIndex = (maxOrderByTopic[topicId] ?? -1) + 1;
    maxOrderByTopic[topicId] = orderIndex;

    const content = q.mcq ? q.content + JUSTIFY : q.content;

    const { error } = await sb.from('questions').insert({
      title: q.title,
      content,
      topic_id: topicId,
      order_index: orderIndex,
      image_url: q.imageUrl || null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); failed++; continue; }
    inserted++;
    perTopicCount[q.topic] = (perTopicCount[q.topic] || 0) + 1;
    console.log(`[${inserted}/${questions.length}] (${q.topic}) ${q.title} ... inserted`);
  }
  console.log(`\nDone. ${inserted} inserted, ${failed} failed.`);
  console.log('Per-topic counts:', perTopicCount);
}

main();
