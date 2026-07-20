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
  '4.5': '4fbf18f9-60f4-46c3-83ff-af67342f3a92',
  '4.6': 'c89c3086-84b5-4172-8d32-5a8e4ad6a6a6',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/b6f07a60-ced5-4dcc-a0d5-4c09cda06403/scratchpad/pages';

/* ============================= 4.5 Stoichiometry ============================= */
const t45 = [
  {
    title: 'Q1 — Ammonia Combustion: Mole and Mass Calculations',
    content: `Ammonia, NH3, reacts with oxygen gas, O2, to produce nitrogen monoxide and water vapor, according to the chemical equation shown below.

4 NH3 + 5 O2 → 4 NO + 6 H2O

(a) Calculate the number of moles of O2 that is required to react completely with 28.3 moles of NH3 in this chemical reaction.

(b) Calculate the mass, in grams, of NH3 that is required to react completely with 175 grams of O2.`,
    answer: `(a) Using the 5:4 mole ratio of O2 to NH3 from the balanced equation:

mol O2 = 28.3 mol NH3 x [[frac:5 mol O2|4 mol NH3]] = 35.4 mol O2

(b) mol O2 = 175 g O2 x [[frac:1 mol O2|32.00 g O2]] = 5.469 mol O2

mol NH3 = 5.469 mol O2 x [[frac:4 mol NH3|5 mol O2]] = 4.375 mol NH3

mass NH3 = 4.375 mol NH3 x [[frac:17.04 g NH3|1 mol NH3]] = 74.6 g NH3`,
  },
  {
    title: 'Q2 — Identifying the Limiting Reactant in an Equimolar Mixture',
    content: `Equimolar amounts of CH3OH(g) and O2(g) are introduced into a rigid, previously evacuated reaction vessel. The mixture is sparked and a chemical reaction occurs according to the equation shown below until one of the reactants is completely consumed.

2 CH3OH(g) + 3 O2(g) → 2 CO2(g) + 4 H2O(g)

Which substance, CH3OH(g) or O2(g), is used up completely in this experiment? Justify your answer.`,
    answer: `O2(g) is used up completely (O2 is the limiting reactant).

The balanced equation requires a 3:2 mole ratio of O2 to CH3OH — that is, [[frac:3 mol O2|2 mol CH3OH]] = 1.5 mol O2 needed for every 1 mol CH3OH. Since the mixture is equimolar (1 mol O2 available for every 1 mol CH3OH), there is not enough O2 present to react with all of the CH3OH — only 1 mol O2 is available where 1.5 mol O2 would be needed. Therefore O2 runs out first (is the limiting reactant), while CH3OH is left over in excess.`,
  },
  {
    title: 'Q3 — Limiting Reactant and Theoretical Yield for Four H2/O2 Experiments',
    content: `Hydrogen gas reacts with oxygen gas to form water vapor according to the equation below. For each of the following experiments, identify the limiting reactant and calculate the theoretical yield of H2O that would be produced, in units of moles or grams as shown in the table.

2 H2(g) + O2(g) → 2 H2O(g)

Experiment 1: 5.4 mol H2 available, 2.5 mol O2 available. Find limiting reactant and theoretical yield of H2O (mol).

Experiment 2: 13.2 mol H2 available, 6.8 mol O2 available. Find limiting reactant and theoretical yield of H2O (mol).

Experiment 3: 24.5 g H2 available, 201 g O2 available. Find limiting reactant and theoretical yield of H2O (g).

Experiment 4: 31.8 g H2 available, 237 g O2 available. Find limiting reactant and theoretical yield of H2O (g).`,
    answer: `Experiment 1: O2 needed to react with all 5.4 mol H2 = 5.4 mol H2 x [[frac:1 mol O2|2 mol H2]] = 2.7 mol O2 needed, but only 2.5 mol O2 is available, so O2 is the limiting reactant.
Theoretical yield: 2.5 mol O2 x [[frac:2 mol H2O|1 mol O2]] = 5.0 mol H2O

Experiment 2: O2 needed to react with all 13.2 mol H2 = 13.2 mol H2 x [[frac:1 mol O2|2 mol H2]] = 6.6 mol O2 needed, and 6.8 mol O2 is available (more than enough), so H2 is the limiting reactant.
Theoretical yield: 13.2 mol H2 x [[frac:2 mol H2O|2 mol H2]] = 13.2 mol H2O

Experiment 3: mol H2 = 24.5 g x [[frac:1 mol H2|2.016 g H2]] = 12.15 mol H2
mol O2 = 201 g x [[frac:1 mol O2|32.00 g O2]] = 6.281 mol O2
O2 needed for 12.15 mol H2 = 12.15 mol H2 x [[frac:1 mol O2|2 mol H2]] = 6.076 mol O2 needed, which is less than the 6.281 mol O2 available, so H2 is the limiting reactant.
Theoretical yield: 12.15 mol H2 x [[frac:2 mol H2O|2 mol H2]] x [[frac:18.02 g H2O|1 mol H2O]] = 219 g H2O

Experiment 4: mol H2 = 31.8 g x [[frac:1 mol H2|2.016 g H2]] = 15.77 mol H2
mol O2 = 237 g x [[frac:1 mol O2|32.00 g O2]] = 7.406 mol O2
O2 needed for 15.77 mol H2 = 15.77 mol H2 x [[frac:1 mol O2|2 mol H2]] = 7.887 mol O2 needed, which is more than the 7.406 mol O2 available, so O2 is the limiting reactant.
Theoretical yield: 7.406 mol O2 x [[frac:2 mol H2O|1 mol O2]] x [[frac:18.02 g H2O|1 mol H2O]] = 267 g H2O`,
  },
  {
    title: 'Q4 — Potassium and Chlorine: Limiting Reactant, Yield, Leftover Mass, and Percent Yield',
    content: `The elements potassium and chlorine react to form potassium chloride according to the equation shown below. In a certain experiment, a reaction occurred between 100.0 g of K(s) and 100.0 g of Cl2(g) until one of the reactants was completely consumed.

2 K(s) + Cl2(g) → 2 KCl(s)

(a) Identify the limiting reactant in this experiment. Justify your choice with both an explanation in words and supporting calculations.

(b) Determine the theoretical yield, in grams, of KCl(s) in this experiment.

(c) Determine the mass, in grams, of the reactant that is leftover (unreacted) at the end of this experiment.

(d) When this experiment was performed in the laboratory, the actual yield of KCl(s) recovered was equal to 162.1 g. Calculate the percent yield of KCl(s).

percent yield = (actual yield / theoretical yield) x 100%`,
    answer: `mol K = 100.0 g x [[frac:1 mol K|39.10 g K]] = 2.558 mol K
mol Cl2 = 100.0 g x [[frac:1 mol Cl2|70.90 g Cl2]] = 1.410 mol Cl2

(a) Cl2 needed to react with all 2.558 mol K = 2.558 mol K x [[frac:1 mol Cl2|2 mol K]] = 1.279 mol Cl2 needed. Since only 1.279 mol Cl2 is needed but 1.410 mol Cl2 is available, Cl2 is in excess, so K is the limiting reactant.

(b) mol KCl = 2.558 mol K x [[frac:2 mol KCl|2 mol K]] = 2.558 mol KCl
mass KCl = 2.558 mol KCl x [[frac:74.55 g KCl|1 mol KCl]] = 190.7 g KCl

(c) mol Cl2 used = 2.558 mol K x [[frac:1 mol Cl2|2 mol K]] = 1.279 mol Cl2 used
mass Cl2 used = 1.279 mol Cl2 x [[frac:70.90 g Cl2|1 mol Cl2]] = 90.68 g Cl2 used
mass Cl2 leftover = 100.0 g - 90.68 g = 9.32 g Cl2 leftover

(d) percent yield = (162.1 g / 190.7 g) x 100% = 85.0%`,
  },
  {
    title: 'Q5 — Precipitation of Cu3(PO4)2: Moles Recovered and Unknown Concentration',
    content: `A student took a 25.0 mL sample of a Cu(NO3)2(aq) solution of unknown concentration and added an excess amount of 1.0 M Na3PO4(aq), causing a precipitate of Cu3(PO4)2(s) to form according to the chemical equation shown below. The solid precipitate was filtered from the solution, dried, and weighed.

3 Cu(NO3)2(aq) + 2 Na3PO4(aq) → 6 NaNO3(aq) + Cu3(PO4)2(s)

(a) The mass of Cu3(PO4)2(s) was recorded as 7.19 g. Calculate the number of moles of Cu3(PO4)2(s) recovered in this experiment.

(b) Calculate the concentration, in mol/L, of the Cu(NO3)2(aq) solution used in this experiment.`,
    answer: `(a) Molar mass of Cu3(PO4)2 = 3(63.55) + 2(30.97 + 4(16.00)) = 190.65 + 189.94 = 380.59 g/mol

mol Cu3(PO4)2 = 7.19 g x [[frac:1 mol Cu3(PO4)2|380.59 g Cu3(PO4)2]] = 0.0189 mol Cu3(PO4)2

(b) mol Cu(NO3)2 = 0.0189 mol Cu3(PO4)2 x [[frac:3 mol Cu(NO3)2|1 mol Cu3(PO4)2]] = 0.0567 mol Cu(NO3)2

concentration = [[frac:0.0567 mol Cu(NO3)2|0.0250 L]] = 2.27 M`,
  },
  {
    title: 'Q6 — Magnesium and Nitric Acid: Molecular, Ionic, Net Ionic Equations and Mass Calculation',
    content: `Magnesium metal, Mg(s), reacts with a solution of nitric acid, HNO3(aq), to produce aqueous magnesium nitrate and hydrogen gas.

(a) Write the balanced molecular equation for the reaction that occurs between magnesium and nitric acid. Include the phases of matter symbols (s), (aq), or (g) for each reactant and product.

Nitric acid, HNO3, is classified as a strong acid, which means that in an aqueous solution of HNO3(aq), the acid is completely ionized to produce the ions H+ and NO3–, as shown below.

HNO3(aq) → H+(aq) + NO3–(aq)

(b) Write the balanced complete ionic equation for the reaction that occurs between magnesium and nitric acid.

(c) Write the balanced net ionic equation for the reaction that occurs between magnesium and nitric acid.

(d) Calculate the mass of magnesium metal that is required to react completely with 50.0 mL of 0.625 M HNO3(aq).`,
    answer: `(a) Mg(s) + 2 HNO3(aq) → Mg(NO3)2(aq) + H2(g)

(b) Mg(s) + 2 H+(aq) + 2 NO3–(aq) → Mg2+(aq) + 2 NO3–(aq) + H2(g)

(c) Mg(s) + 2 H+(aq) → Mg2+(aq) + H2(g)
(NO3– is a spectator ion, present in equal amount on both sides of the complete ionic equation, so it is omitted from the net ionic equation.)

(d) mol HNO3 = 0.0500 L x 0.625 mol/L = 0.03125 mol HNO3

mol Mg = 0.03125 mol HNO3 x [[frac:1 mol Mg|2 mol HNO3]] = 0.01563 mol Mg

mass Mg = 0.01563 mol Mg x [[frac:24.31 g Mg|1 mol Mg]] = 0.380 g Mg`,
  },
  {
    title: 'Q7 — Aluminum and Sulfuric Acid: Volume, Theoretical Yield, and Percent Yield',
    content: `Aluminum metal, Al(s), reacts with a solution of sulfuric acid, H2SO4(aq), to produce aqueous aluminum sulfate and hydrogen gas.

(a) Write the balanced molecular equation for the reaction that occurs between aluminum and sulfuric acid.

(b) In a certain experiment, 15.3 g Al(s) is reacted with a solution of 6.00 M H2SO4(aq).

(i) Calculate the minimum volume, in mL, of 6.00 M H2SO4(aq) that is required to react completely with 15.3 g Al(s) in this experiment.

(ii) Assuming that 15.3 g Al(s) reacts completely with an excess amount of H2SO4(aq), calculate the theoretical yield of H2(g) produced in this experiment.

(iii) When this experiment was performed in the laboratory, the actual yield of H2(g) was recorded as 1.35 g. Calculate the percent yield of H2(g).`,
    answer: `(a) 2 Al(s) + 3 H2SO4(aq) → Al2(SO4)3(aq) + 3 H2(g)

mol Al = 15.3 g x [[frac:1 mol Al|26.98 g Al]] = 0.5671 mol Al

(b)(i) mol H2SO4 needed = 0.5671 mol Al x [[frac:3 mol H2SO4|2 mol Al]] = 0.8507 mol H2SO4

volume = [[frac:0.8507 mol H2SO4|6.00 mol/L]] = 0.1418 L = 141.8 mL

(ii) mol H2 = 0.5671 mol Al x [[frac:3 mol H2|2 mol Al]] = 0.8507 mol H2

mass H2 = 0.8507 mol H2 x [[frac:2.016 g H2|1 mol H2]] = 1.715 g H2

(iii) percent yield = (1.35 g / 1.715 g) x 100% = 78.7%`,
  },
  {
    title: 'Q8 — Predicting the Pressure Change for 2 NO(g) + O2(g) → 2 NO2(g) (Multiple Choice)',
    mcq: true,
    content: `The reaction between NO(g) and O2(g) to produce NO2(g) occurs at constant temperature in a rigid reaction vessel.

Write the balanced molecular equation for the reaction that occurs between NO(g) and O2(g) to produce NO2(g).

Which of the following statements correctly predicts the change in pressure as this reaction goes to completion at constant temperature, and provides the correct explanation?

(A) The pressure will increase because the product molecules have a greater mass than either of the reactant molecules.
(B) The pressure will decrease because there are fewer molecules of product than reactants.
(C) The pressure will decrease because the product molecules have a lower average speed than the reactant molecules.
(D) The pressure will not change because the total mass of the product molecules is the same as the total mass of the reactant molecules.`,
    answer: `Balanced equation: 2 NO(g) + O2(g) → 2 NO2(g)

Correct answer: (B)

The balanced equation shows 3 total moles of gaseous reactants (2 mol NO + 1 mol O2) converting into 2 moles of gaseous product (2 mol NO2). Since PV = nRT, at constant temperature and constant (rigid) volume, pressure is directly proportional to the total number of moles of gas present. As the reaction proceeds to completion, the total number of gas particles decreases from 3 mol to 2 mol, so the pressure decreases.

(A) is incorrect because pressure depends on the number of gas particles present (and their collisions with the container walls), not on the mass of the molecules. (C) is incorrect because at constant temperature, average molecular speed depends only on temperature and molar mass, not on whether a molecule is a "reactant" or "product," and this is not the reason pressure changes here. (D) is incorrect because although total mass is conserved (and irrelevant to pressure at constant V and T), the pressure does change, since the number of moles of gas changes.`,
  },
  {
    title: 'Q9 — Final Pressure After Complete Decomposition of CH3OH(g)',
    content: `The reaction represented below goes essentially to completion.

CH3OH(g) → CO(g) + 2 H2(g)

The reaction takes place in a rigid reaction vessel that is initially at 600 K. A sample of CH3OH(g) is placed in the previously evacuated reaction vessel with an initial pressure of 1.74 atm at 600 K. Calculate the final pressure in the reaction vessel after the reaction is complete and the contents of the vessel are returned to a temperature of 600 K.`,
    answer: `Since the vessel is rigid (constant V) and the final temperature is the same as the initial temperature (600 K), pressure is directly proportional to the total number of moles of gas present (P = nRT/V, with R, T, V constant).

The balanced equation shows that 1 mol of CH3OH(g) (reactant) produces 1 mol CO(g) + 2 mol H2(g) = 3 mol of gaseous product total. So the total moles of gas triples as the reaction goes to completion:

[[frac:n(final)|n(initial)]] = [[frac:3 mol gas|1 mol gas]] = 3

Since pressure is proportional to moles at constant T and V:

P(final) = 1.74 atm x 3 = 5.22 atm`,
  },
];

/* ============================= 4.6 Introduction to Titration ============================= */
const t46 = [
  {
    title: 'Q1 — Equivalence Point Volume and Moles of NaOH from a Titration Curve',
    content: `The pH curve from a titration experiment is shown below.

(a) Determine the volume of 0.24 M NaOH(aq) that is required to reach the equivalence point in this titration.

(b) Calculate the number of moles of NaOH that is required to reach the equivalence point in this titration.`,
    answer: `(a) The equivalence point occurs where the pH curve shows its steepest, most rapid rise (the inflection point of the near-vertical jump), which occurs at 35.0 mL of 0.24 M NaOH(aq) added.

(b) mol NaOH = 0.0350 L x 0.24 mol/L = 8.4 x 10^-3 mol NaOH`,
    imageFile: 'q10_final.png',
  },
  {
    title: 'Q2 — KOH Titrated with Diluted H2SO4: Equation, Dilution, and Concentration',
    content: `A student performs an experiment in which a solution of potassium hydroxide, KOH(aq), is titrated with a solution of sulfuric acid, H2SO4(aq). The purpose of the experiment is to determine the concentration of KOH in the KOH(aq) solution.

(a) Write the balanced molecular equation for the reaction that occurs between solutions of sulfuric acid and potassium hydroxide. The products of the reaction are water and aqueous potassium sulfate.

(b) A student prepares a solution of H2SO4(aq) by adding 25.0 mL of 3.50 M H2SO4(aq) to a volumetric flask and diluting the solution to a final volume of 500.0 mL. Calculate the concentration, in mol/L, of H2SO4 in the diluted solution in the volumetric flask.

In order to determine the concentration of a KOH(aq) solution, a titration experiment is performed. A clean buret is filled with the H2SO4(aq) solution that was prepared in part (b). A 50.0 mL sample of KOH(aq) is added to a clean Erlenmeyer flask. The pH is monitored during the titration experiment, and the experimental results are plotted in the graph shown below.

(c) Determine the volume of H2SO4(aq) that is required to reach the equivalence point in this titration.

(d) Calculate the concentration, in mol/L, of the KOH(aq) solution used in this experiment.`,
    answer: `(a) H2SO4(aq) + 2 KOH(aq) → 2 H2O(l) + K2SO4(aq)

(b) mol H2SO4 (concentrated) = 0.0250 L x 3.50 mol/L = 0.0875 mol H2SO4

concentration (diluted) = [[frac:0.0875 mol H2SO4|0.5000 L]] = 0.175 M

(c) The equivalence point occurs at the steep drop in the pH curve, which occurs at 30.0 mL of H2SO4(aq) added.

(d) mol H2SO4 used = 0.0300 L x 0.175 mol/L = 5.25 x 10^-3 mol H2SO4

mol KOH = 5.25 x 10^-3 mol H2SO4 x [[frac:2 mol KOH|1 mol H2SO4]] = 1.050 x 10^-2 mol KOH

concentration KOH = [[frac:1.050 x 10^-2 mol KOH|0.0500 L]] = 0.210 M`,
    imageFile: 'q11_final.png',
  },
  {
    title: 'Q3 — Vinegar Titration: Buret Readings, Concentration, and Rinsing Error',
    content: `A sample of 25.0 mL of vinegar (containing acetic acid, HC2H3O2) is added to a flask and titrated with 0.665 M NaOH(aq), according to the equation below.

HC2H3O2(aq) + NaOH(aq) → H2O(l) + NaC2H3O2(aq)

The buret readings were: initial buret reading = 5.60 mL; final buret reading at the end point = 37.60 mL.

(a) Record the volume of 0.665 M NaOH(aq) required to reach the end point.

(b) Calculate the concentration, in mol/L, of HC2H3O2 in the 25.0 mL sample of vinegar.

(c) The student performed a second trial of the titration using a fresh 25.0 mL sample of vinegar and the same standard solution of 0.665 M NaOH(aq). The student made the following mistake when they prepared the buret: after rinsing the buret with distilled water, the student did not rinse the buret with the standard NaOH(aq) solution before filling the buret with the 0.665 M NaOH(aq). Based on this mistake, do you predict that the calculated value for the concentration of HC2H3O2 in Trial 2 should be less than, greater than, or the same as the value obtained in Trial 1? Justify your answer.`,
    answer: `(a) volume = 37.60 mL - 5.60 mL = 32.00 mL

(b) mol NaOH = 0.03200 L x 0.665 mol/L = 0.02128 mol NaOH

Since the mole ratio of NaOH to HC2H3O2 is 1:1, mol HC2H3O2 = 0.02128 mol

concentration = [[frac:0.02128 mol HC2H3O2|0.0250 L]] = 0.851 M

(c) The calculated concentration of HC2H3O2 in Trial 2 should be greater than the value obtained in Trial 1.

Because the buret was rinsed with water but not with the standard NaOH(aq) solution, residual water remained on the interior walls of the buret and diluted the NaOH solution as it was loaded, so the true concentration of the titrant actually dispensed in Trial 2 was somewhat less than the labeled 0.665 M. Since the titrant is weaker than assumed, a larger volume of it is required to deliver the same amount (moles) of NaOH needed to reach the equivalence point with the vinegar sample. However, the student still calculates moles of NaOH delivered using the volume dispensed multiplied by the labeled concentration of 0.665 M (not the true, lower concentration), so this calculation overestimates the actual moles of NaOH delivered. Since the calculated moles of HC2H3O2 (and therefore its calculated concentration) is based on this overestimated moles of NaOH, the calculated concentration of HC2H3O2 in Trial 2 would come out greater than the true value obtained correctly in Trial 1.`,
  },
  {
    title: 'Q4 — Redox Titration of Fe2+ with KMnO4: Two Trials',
    content: `A student obtains a solution that contains an unknown concentration of Fe2+(aq). The student performs a titration experiment in order to determine the concentration of Fe2+(aq) in the solution. The titration involves a chemical reaction between MnO4–(aq) and Fe2+(aq) according to the equation below. The buret is filled with a standard solution of 0.0425 M KMnO4(aq).

MnO4–(aq) + 5 Fe2+(aq) + 8 H+(aq) → Mn2+(aq) + 5 Fe3+(aq) + 4 H2O(l)

Data recorded from the experiment:

Trial 1: Volume of solution containing Fe2+(aq) = 10.0 mL; initial buret reading = 2.45 mL; final buret reading at the end point = 19.87 mL.

Trial 2: Volume of solution containing Fe2+(aq) = 15.0 mL; initial buret reading = 19.87 mL; final buret reading at the end point = 46.34 mL.

(a) Use the information in the data table to calculate the volume of 0.0425 M KMnO4(aq) required to reach the end point in each trial.

(b) Use the information in the data table and the balanced chemical equation to calculate the concentration of Fe2+(aq) for both Trial 1 and Trial 2.

(c) During the second trial, the student accidentally added extra titrant past the end point, so that more KMnO4(aq) solution was added to the flask than was needed to reach the end point. Would this error explain the difference in the calculated values of concentration of Fe2+(aq) obtained in part (b)? Justify your answer.`,
    answer: `(a) Trial 1 volume = 19.87 mL - 2.45 mL = 17.42 mL
Trial 2 volume = 46.34 mL - 19.87 mL = 26.47 mL

(b) Trial 1:
mol KMnO4 = 0.01742 L x 0.0425 mol/L = 7.404 x 10^-4 mol KMnO4

mol Fe2+ = 7.404 x 10^-4 mol KMnO4 x [[frac:5 mol Fe2+|1 mol KMnO4]] = 3.702 x 10^-3 mol Fe2+

concentration Fe2+ = [[frac:3.702 x 10^-3 mol Fe2+|0.0100 L]] = 0.370 M

Trial 2:
mol KMnO4 = 0.02647 L x 0.0425 mol/L = 1.125 x 10^-3 mol KMnO4

mol Fe2+ = 1.125 x 10^-3 mol KMnO4 x [[frac:5 mol Fe2+|1 mol KMnO4]] = 5.625 x 10^-3 mol Fe2+

concentration Fe2+ = [[frac:5.625 x 10^-3 mol Fe2+|0.0150 L]] = 0.375 M

(c) Yes, this error is consistent with (and could explain) the difference between the two trials. Adding titrant past the true end point means the recorded final buret reading — and therefore the calculated volume of KMnO4(aq) used — is larger than the true volume needed to reach the actual equivalence point. A larger recorded volume of KMnO4(aq) leads to a larger calculated number of moles of MnO4– (and therefore Fe2+), which produces an artificially high calculated concentration of Fe2+(aq) for that trial. Since Trial 2's calculated concentration (0.375 M) came out higher than Trial 1's (0.370 M), overshooting the end point in Trial 2 is a plausible explanation for why its calculated concentration is higher.`,
  },
  {
    title: 'Q5 — Standardizing KOH with KHP: Moles, Concentration, and Effect of Extra Water',
    content: `Potassium hydrogen phthalate, KC8H5O4 (KHP), reacts with potassium hydroxide according to the equation below. A student performs a titration experiment in which a buret is filled with a solution of KOH(aq) of unknown concentration. A sample of 1.25 g of KC8H5O4(s) is added to a clean Erlenmeyer flask and dissolved in 50.0 mL H2O. A few drops of an acid-base indicator is added to the flask to ensure visual detection of the end point.

KC8H5O4(aq) + KOH(aq) → K2C8H4O4(aq) + H2O(l)

(a) Calculate the number of moles of KC8H5O4 used in this titration experiment.

(b) It is determined that 18.75 mL of KOH(aq) is required to reach the end point. Calculate the concentration of the KOH(aq) solution used in this titration experiment.

(c) The student performed a second trial of the titration. A sample of 1.25 g of KC8H5O4(s) is added to a clean Erlenmeyer flask and dissolved in 30.0 mL H2O instead of 50.0 mL H2O (as in Trial 1). Do you predict that the calculated value for the concentration of KOH(aq) in Trial 2 should be less than, greater than, or the same as the value obtained in Trial 1? Justify your answer.`,
    answer: `(a) Molar mass of KC8H5O4 = 8(12.01) + 5(1.01) + 4(16.00) + 39.10 = 96.08 + 5.05 + 64.00 + 39.10 = 204.23 g/mol

mol KC8H5O4 = 1.25 g x [[frac:1 mol KC8H5O4|204.23 g KC8H5O4]] = 6.12 x 10^-3 mol KC8H5O4

(b) Since the mole ratio of KOH to KC8H5O4 is 1:1, mol KOH = 6.12 x 10^-3 mol

concentration KOH = [[frac:6.12 x 10^-3 mol KOH|0.01875 L]] = 0.327 M

(c) The calculated concentration of KOH(aq) in Trial 2 should be the same as the value obtained in Trial 1.

The amount (mass, and therefore moles) of KC8H5O4 used is identical in both trials (1.25 g), and the moles of KOH required to reach the end point depends only on the moles of KC8H5O4 present, according to the 1:1 stoichiometry of the balanced equation — it does not depend on how much water was used to dissolve the KC8H5O4. Using less water to dissolve the same mass of KC8H5O4 only makes the initial acid solution more concentrated; it does not change the total moles of acid present, so the same volume of KOH(aq) would be required to reach the end point in both trials, and the calculated concentration of KOH would come out the same.`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing, error: fetchErr } = await sb
    .from('questions')
    .select('order_index')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: false })
    .limit(1);
  if (fetchErr) throw fetchErr;
  let nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

  const rows = [];
  for (const q of questions) {
    let imageUrl;
    if (q.imageFile) {
      const filePath = path.join(SCRATCH, q.imageFile);
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `unit4-4.5-4.6/${q.imageFile}`;
      const { error: upErr } = await sb.storage.from('question-images').upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from('question-images').getPublicUrl(storagePath);
      imageUrl = pub.publicUrl;
      console.log(`Uploaded image: ${storagePath} -> ${imageUrl}`);
    }
    rows.push({
      topic_id: topicId,
      title: q.title,
      content: q.mcq ? q.content + JUSTIFY : q.content,
      answer_key: q.answer,
      order_index: nextOrder++,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    });
  }

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    await insertTopic('4.5', t45);
    await insertTopic('4.6', t46);
    console.log('Done.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
