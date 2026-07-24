const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '6.1': '6ebde663-712d-4158-89c8-731d042a8c80',
  '6.2': '0b14651f-e7ca-45bc-bf1b-7e2fcd256b2b',
  '6.3': '97462a7b-6db6-4cfa-ba32-2d38ae601364',
  '6.4': '23440ca7-a9cb-4a95-95da-6f922991172a',
  '6.5': 'eb1aa211-d183-4ae5-838d-f670b3908cae',
  '6.6': 'ae92bf0e-7e5b-4874-934b-02f1c6948553',
  '6.7': '13298cef-b1a4-466b-bedc-3ec4cc6bc3ea',
  '6.8': 'c0aa92dc-39f2-4287-96f0-e83b4a92aa6d',
  '6.9': 'c6574754-0095-4733-a17a-9c1fa703dbbe',
};

const IMG_DIR = path.join(__dirname, 'tmp-episode-imgs', 'unit6');

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `unit6-episodes/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 6.1 — Endothermic and Exothermic Processes (Episode #17) ============================= */
const t61 = [
  {
    title: 'Episode Review Q1 — Is Temperature Decrease Evidence of an Exothermic Reaction? (NaHCO3 + Acetic Acid)',
    content: `NaHCO3(s) + HC2H3O2(aq) → NaC2H3O2(aq) + H2O(l) + CO2(g)

A student conducts an experiment in which a sample of NaHCO3(s) is added to a solution of HC2H3O2(aq) in a coffee cup calorimeter. The reaction is represented by the equation above. The student observes bubbles forming and stirs until the solid dissolves completely. Temperature data (°C) at 15-second intervals from t=0 to t=120 s: 25.0, 23.6, 22.4, 21.4, 20.6, 20.0, 19.5, 19.2, 19.2.

The student makes the claim that the reaction is exothermic because the temperature of the solution decreases as the reaction proceeds. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `Disagree. The temperature of the solution (which acts as the surroundings, since the thermometer measures the solution, not the reacting species directly) decreases from 25.0°C to 19.2°C as the reaction proceeds. A decrease in the temperature of the surroundings means that thermal energy is flowing FROM the surroundings INTO the system (the reacting species absorb heat from the solution) — this is the definition of an ENDOTHERMIC process, not exothermic. The student has the relationship backwards: a temperature decrease indicates an endothermic reaction, while a temperature increase would indicate an exothermic reaction.`,
  },
  {
    title: 'Episode Review Q2 — Explaining the Exothermic Dissolution of LiCl',
    content: `A student dissolves a sample of LiCl(s) into a sample of water in a coffee cup calorimeter. The solid dissolves completely, and the student monitors the temperature of the solution, observing that the temperature increases from 21.0°C to 32.0°C. Which of the following best helps to explain the energy change that occurred during the dissolution of LiCl(s)?

(A) When LiCl(s) dissolves in water, ions of Li+(aq) and Cl–(aq) are formed.
(B) When LiCl(s) dissolves in water, attractions between H2O molecules are broken.
(C) Li+ ions have very strong ion-ion interactions with Cl– ions in the crystal lattice.
(D) Li+ ions have very strong ion-dipole interactions with water molecules in the solution.`,
    answer: `(D). Since the temperature of the solution increases, the dissolution process is exothermic overall — meaning more energy is released forming new interactions than is absorbed breaking the original ones. Option (D) describes the formation of strong ion-dipole interactions between Li+ and water molecules (the hydration step), which is the energy-releasing (exothermic) step in the dissolution process — if these interactions are very strong, a large amount of energy is released, explaining the net exothermic result and the observed temperature increase. Options (A), (B), and (C) either just state a fact without explaining the net energy change, or describe endothermic steps (breaking H2O-H2O attractions or the ionic lattice) that alone would not explain why the overall process released energy.`,
  },
];

/* ============================= 6.2 — Energy Diagrams (Episode #17) ============================= */
const t62 = [
  {
    title: 'Episode Review Q3 — Classifying a Reaction from Its Energy Profile Diagram',
    imageKey: 'q3_diagram',
    content: `The diagram shows the reaction energy profile (potential energy vs. reaction coordinate) for the reaction represented by the following equation: X2(g) + 2 Y2(g) → 2 XY2(g). The curve starts at a middle potential-energy plateau (reactants), rises through a hump (activation energy peak), then descends to a final plateau that is LOWER than the initial reactant plateau (products).

Which of the following best describes this chemical reaction and the flow of heat as this reaction occurs?

(A) This reaction is endothermic, and heat is transferred from the system to the surroundings.
(B) This reaction is exothermic, and heat is transferred from the system to the surroundings.
(C) This reaction is endothermic, and heat is transferred from the surroundings to the system.
(D) This reaction is exothermic, and heat is transferred from the surroundings to the system.`,
    answer: `(B). Since the potential energy of the products (final plateau) is LOWER than the potential energy of the reactants (initial plateau), the reaction releases energy overall — this is the defining characteristic of an EXOTHERMIC reaction. In an exothermic reaction, heat is transferred FROM the system (the reacting species, which lose potential energy) TO the surroundings (which gain that released energy).`,
  },
];

/* ============================= 6.3 — Heat Transfer and Thermal Equilibrium (Episode #17) ============================= */
const t63 = [
  {
    title: 'Episode Review Q4 — Identifying the Correct Particle Diagram for Increased Molecular Speed After Heat Transfer',
    imageKey: 'q4_diagrams',
    content: `A student places a metal cube in boiling water so its temperature will be 100.0°C. The student then places the metal cube into a calorimeter that contains water and records the highest temperature of the water. Data: mass of metal cube = 75.0 g, mass of water = 125.0 g, initial temperature of metal cube = 100.0°C, initial temperature of water = 25.0°C, highest temperature of water = 32.6°C.

Three diagrams (#1, #2, #3) show particle-level "Before" and "After" views of water molecules in the calorimeter, with arrow length representing molecular speed.

(a) Which diagram (#1, #2, or #3) best illustrates how the speed of the water molecules is affected after the metal cube is added to the calorimeter? Justify your answer in terms of the change in temperature of the water that occurs during this experiment.
(b) A student makes the claim that, at the moment the metal cube is added to the water, thermal energy is transferred from the metal to the water. Do you agree or disagree with the student's claim? Justify your answer in terms of the initial temperature of the metal and the initial temperature of the water before they are combined.`,
    answer: `(a) Diagram #3. The temperature of the water increases (from 25.0°C to 32.6°C) during this experiment, meaning the average kinetic energy — and therefore the average speed — of the water molecules increases. Diagram #3 is the only one of the three that shows longer (faster) arrows in the "After" panel compared to the "Before" panel, consistent with this increase in speed. (Diagram #1 shows no change in arrow length, and Diagram #2 shows shorter arrows after — neither is consistent with the observed temperature increase.)

(b) Agree. The initial temperature of the metal (100.0°C) is greater than the initial temperature of the water (25.0°C), and thermal energy always flows spontaneously from a warmer object to a cooler object (from higher average kinetic energy to lower average kinetic energy) when they are placed in contact, until thermal equilibrium is reached. This is consistent with the observed result that the water's temperature increased after the metal cube was added.`,
  },
  {
    title: 'Episode Review Q5 — Effect of Mixing Gas Samples at Different Temperatures on Average Kinetic Energy',
    content: `A 1.0 mol sample of He(g) at 20°C is mixed with a 1.0 mol sample of Ne(g) at 80°C. Which of the following correctly predicts how the temperature of the He(g) sample and the average kinetic energy of He(g) atoms will be affected as the mixture approaches thermal equilibrium?

The Temperature of the He(g) Sample | The Average Kinetic Energy of the He(g) Atoms
(A) will decrease | will remain constant
(B) will increase | will remain constant
(C) will decrease | will decrease
(D) will increase | will increase`,
    answer: `(D). Since Ne(g) starts at a higher temperature (80°C) than He(g) (20°C), thermal energy flows from the warmer Ne(g) to the cooler He(g) as they approach thermal equilibrium — so the temperature of the He(g) sample will increase (moving toward some intermediate equilibrium temperature between 20°C and 80°C). Since average kinetic energy is directly proportional to Kelvin temperature (for any gas, regardless of identity or molar mass), an increase in temperature necessarily means an increase in the average kinetic energy of the He(g) atoms as well.`,
  },
];

/* ============================= 6.4 — Heat Capacity and Calorimetry (Episode #17) ============================= */
const t64 = [
  {
    title: 'Episode Review Q6 — Comparing Thermal Energy Absorbed Using Specific Heat Capacity Data',
    content: `Specific Heat Capacity data: Al(s) = 0.90 J/(g·°C), Cu(s) = 0.39 J/(g·°C), Fe(s) = 0.45 J/(g·°C), Pb(s) = 0.13 J/(g·°C).

Based on the information in the table, which of the following experiments absorbs the greatest quantity of thermal energy?

(A) Increasing the temperature of 10.0 g of Al(s) from 20°C to 40°C
(B) Increasing the temperature of 10.0 g of Cu(s) from 20°C to 50°C
(C) Increasing the temperature of 20.0 g of Fe(s) from 20°C to 35°C
(D) Increasing the temperature of 20.0 g of Pb(s) from 20°C to 70°C`,
    answer: `(A). Using q = mcΔT for each option:

(A) q = 10.0 g × 0.90 J/(g·°C) × 20°C = 180 J.
(B) q = 10.0 g × 0.39 J/(g·°C) × 30°C = 117 J.
(C) q = 20.0 g × 0.45 J/(g·°C) × 15°C = 135 J.
(D) q = 20.0 g × 0.13 J/(g·°C) × 50°C = 130 J.

The greatest quantity of thermal energy absorbed (180 J) occurs in option (A).`,
  },
  {
    title: 'Episode Review Q7 — Conservation of Energy and Calculating Specific Heat Capacity of an Unknown Metal',
    content: `A student adds a sample of metal to a sample of water in a calorimeter. Data: mass of metal = 25 g, initial temperature of metal = 90.0°C, mass of water = 75 g, initial temperature of water = 21.0°C, final temperature of water = 23.0°C, specific heat capacity of water = 4.18 J/(g·°C). Assume the calorimeter is perfectly insulated.

(a) The magnitude of ΔT for the metal is 67.0°C, whereas the magnitude of ΔT for the water is 2.0°C. Based on this observation, a student makes the claim that the quantity of thermal energy lost by the metal is greater than the quantity of thermal energy gained by the water. Do you agree or disagree with the student's claim? Justify your answer.
(b) Based on the data in the table, calculate the specific heat capacity of the metal, in units of J/(g·°C).`,
    answer: `(a) Disagree. In a perfectly insulated calorimeter, the law of conservation of energy requires that the quantity of thermal energy lost by the metal must exactly equal the quantity of thermal energy gained by the water (q_lost = q_gained in magnitude) — regardless of how different their respective ΔT values are. The large difference in ΔT magnitudes (67.0°C for the metal vs. 2.0°C for the water) is compensated by differences in mass and specific heat capacity between the two substances (q = mcΔT depends on all three factors, not ΔT alone), not by an inequality in the total energy transferred.

(b) q(water) = m·c·ΔT = 75 g × 4.18 J/(g·°C) × 2.0°C = 627 J. Since q(metal) = q(water) in magnitude (conservation of energy): 627 J = 25 g × c(metal) × 67.0°C. Solving: c(metal) = 627 / (25 × 67.0) = 0.374 J/(g·°C).`,
  },
  {
    title: 'Episode Review Q8 — Identifying and Fixing a Unit-Conversion Error in a Calorimetry Calculation',
    content: `The specific heat capacity of H2O(l) is 4.18 J/(g·°C). A 35.0 g sample of H2O(l) initially at 10.0°C absorbs 12.3 kJ of heat. Calculate the final temperature of the sample of H2O(l).

A student set up the calculation as follows:
q = mcΔT
12.3 = (35.0)(4.18)(ΔT)
ΔT = 12.3 / [(35.0)(4.18)] = 0.0841
Final temperature = 10.0°C + 0.0841 = 10.0841°C = 10.1°C

(a) The student's answer of 10.1°C is incorrect. Identify the error in the set-up for the student's calculation that explains why the calculated value for the final temperature is incorrect.
(b) Calculate the correct value for the final temperature of the sample of H2O(l). Show the correct set-up for the calculation in the space below.`,
    answer: `(a) The student failed to convert the given heat value from kilojoules to joules before using it in the equation q = mcΔT (which requires q in joules, since c is given in J/(g·°C)). The student used "12.3" directly instead of converting 12.3 kJ to 12,300 J, resulting in a ΔT that is 1000 times too small.

(b) q = 12.3 kJ = 12,300 J. ΔT = q / (mc) = 12,300 / [(35.0)(4.18)] = 12,300 / 146.3 = 84.1°C.

Final temperature = 10.0°C + 84.1°C = 94.1°C.`,
  },
  {
    title: 'Episode Review Q9 — Enthalpy of Solution for NH4Cl, Including Significant Figures',
    content: `NH4Cl(s) → NH4+(aq) + Cl–(aq)

A student conducts a calorimetry experiment to determine the enthalpy of solution for NH4Cl, which dissolves in water according to the equation above. Data: mass of water = 105.23 g, mass of NH4Cl(s) = 1.25 g, molar mass of NH4Cl = 53.49 g/mol, initial temperature = 20.00°C, final temperature = 19.21°C, specific heat capacity of the solution = 4.18 J/(g·°C).

(a) Is the dissolution of NH4Cl in water classified as an endothermic process or an exothermic process? Justify your answer using the information in the table.
(b) Calculate the magnitude of thermal energy, q, in kJ, transferred in the dissolution of NH4Cl.
(c) In the set-up for the calculation of q, which value (m, c, or ΔT) has the fewest number of significant figures, and how many significant figures should the calculated value for q be reported with?
(d) Calculate the magnitude of ΔHsolution for NH4Cl in kJ/mol. Include the sign in your answer.`,
    answer: `(a) Endothermic. The temperature of the solution decreases (from 20.00°C to 19.21°C) as the NH4Cl dissolves, meaning thermal energy is absorbed by the dissolution process from the surrounding solution — this is the defining characteristic of an endothermic process.

(b) Mass of solution = 105.23 g + 1.25 g = 106.48 g. ΔT (magnitude) = |19.21 − 20.00| = 0.79°C. q = mcΔT = 106.48 g × 4.18 J/(g·°C) × 0.79°C = 351.5 J = 0.35 kJ.

(c) ΔT = 0.79 has the fewest significant figures (2 sig figs, since 20.00 − 19.21 = 0.79, and subtraction is governed by decimal places, giving a 2-decimal-place, 2-sig-fig result). Therefore q should be reported with 2 significant figures: q ≈ 0.35 kJ.

(d) Moles NH4Cl = 1.25 g / 53.49 g/mol = 0.02337 mol. ΔHsolution = q / moles = 0.35152 kJ (unrounded) / 0.02337 mol = +15.0 kJ/mol (positive, since the process is endothermic).`,
  },
  {
    title: 'Episode Review Q10 — Calculating Thermal Energy Transferred in the Dissolution of KCl',
    content: `A student adds a sample of water to a calorimeter and adds a sample of KCl(s), stirring to dissolve. After the KCl dissolves completely, the minimum temperature reached by the solution is recorded. Data: mass of water = 100.00 g, mass of KCl(s) = 10.00 g, initial temperature = 25.00°C, final temperature = 19.70°C.

The mixture in the calorimeter has a specific heat capacity of 3.95 J/(g·°C). Based on the data from the experiment, the magnitude of thermal energy, q, transferred in the dissolution of KCl is closest to which of the following?

(A) 2.09 kJ
(B) 2.30 kJ
(C) 7.78 kJ
(D) 8.56 kJ`,
    answer: `(B). Mass of solution = 100.00 g + 10.00 g = 110.00 g. ΔT (magnitude) = |19.70 − 25.00| = 5.30°C. q = mcΔT = 110.00 g × 3.95 J/(g·°C) × 5.30°C = 2302.85 J ≈ 2.30 kJ.`,
  },
  {
    title: 'Episode Review Q11 — Predicting ΔT When Less Solute Is Actually Added Than Intended',
    content: `The student weighed out 10.00 g of KCl and 100.00 g of water to perform a second trial (using the same setup as episode review Q10). In the second trial, some of the solid KCl stuck to the weighing paper and was not transferred to the calorimeter. Which of the following correctly predicts how the value of ΔT for the second trial would compare to the value of ΔT in the first trial, and provides the correct justification?

The value of ΔT in trial 2 | Justification
(A) will be less than trial 1 | The mass of KCl is directly proportional to the magnitude of ΔT.
(B) will be less than trial 1 | If less KCl is added to the calorimeter, less thermal energy will be transferred during the dissolution of KCl.
(C) will be the same as trial 1 | The value of ΔT depends only on the identity of the solid and not the mass of solid added to the calorimeter.
(D) will be the same as trial 1 | The mass of water used in trial 2 is the same as the mass of water used in trial 1.`,
    answer: `(B). Since some KCl stuck to the weighing paper, less than 10.00 g of KCl actually dissolved in trial 2. A smaller amount (fewer moles) of solute dissolving means less total thermal energy is transferred during the dissolution process — which, combined with the same mass of water (roughly the same total heat capacity of the mixture), results in a smaller ΔT. Option (A) is not the best justification because it merely restates the observed trend as a "proportionality" without explaining the underlying mechanism (why less KCl leads to less thermal energy transfer).`,
  },
  {
    title: "Episode Review Q12 — Comparing q and ΔHsolution Across Trials with Different Amounts of Solute",
    content: `The student conducts a third trial of the KCl dissolution experiment (same setup as episode review Q10/Q11). Data for trial 3: mass of water = 105.00 g, mass of KCl(s) = 5.00 g, initial temperature = 25.00°C, final temperature = 22.35°C. (Recall trial 1: 100.00 g water, 10.00 g KCl, 25.00°C → 19.70°C, specific heat capacity of the mixture = 3.95 J/(g·°C).)

Which of the following correctly predicts how the calculated values of q and ΔHsolution associated with the data for trial 3 will compare with the values from trial 1?

The calculated value of q in trial 3 | The calculated value of ΔHsolution in trial 3
(A) will be less than trial 1 | will be less than trial 1
(B) will be less than trial 1 | will be the same as trial 1
(C) will be the same as trial 1 | will be less than trial 1
(D) will be the same as trial 1 | will be the same as trial 1`,
    answer: `(B). Trial 3: mass of solution = 105.00 + 5.00 = 110.00 g, ΔT = 25.00 − 22.35 = 2.65°C. q = 110.00 × 3.95 × 2.65 = 1151.4 J = 1.15 kJ — this is LESS than trial 1's q (2.30 kJ, from episode review Q10), since only half as much KCl (5.00 g vs. 10.00 g) was dissolved, transferring roughly half as much total thermal energy.

However, ΔHsolution is an intensive (per-mole) property: moles KCl in trial 1 = 10.00 g / 74.55 g/mol = 0.1341 mol, giving ΔHsolution = 2.30285 kJ / 0.1341 mol = 17.17 kJ/mol. Moles KCl in trial 3 = 5.00 g / 74.55 g/mol = 0.06707 mol, giving ΔHsolution = 1.1514 kJ / 0.06707 mol = 17.17 kJ/mol — the SAME value as trial 1, since ΔHsolution is a per-mole quantity that does not depend on how much solute is used (it is a property of the substance, not of a particular experimental trial's scale).`,
  },
];

/* ============================= 6.5 — Energy of Phase Changes (Episode #18) ============================= */
const t65 = [
  {
    title: 'Episode Review Q1 — Heat to Raise Temperature and Melt a Solid (Decanoic Acid)',
    content: `Properties of Decanoic Acid, C10H20O2(s): Melting Point = 31.6°C, Specific Heat Capacity = 2.76 J/(g·°C), Enthalpy of Fusion = 28.3 kJ/mol.

Calculate the quantity of heat that must be absorbed to increase the temperature of a pure sample of 0.575 g of C10H20O2(s) from 20.0°C to the melting point of 31.6°C and melt the solid completely. Include units in your answer.`,
    answer: `Step 1 (heating the solid to its melting point): q1 = mcΔT = 0.575 g × 2.76 J/(g·°C) × (31.6 − 20.0)°C = 0.575 × 2.76 × 11.6 = 18.4 J.

Step 2 (melting at constant temperature): Molar mass C10H20O2 = 10(12.011) + 20(1.008) + 2(16.00) = 172.27 g/mol. Moles = 0.575 g / 172.27 g/mol = 0.003338 mol. q2 = moles × ΔHfus = 0.003338 mol × 28.3 kJ/mol = 0.0945 kJ = 94.5 J.

Total heat absorbed = q1 + q2 = 18.4 J + 94.5 J = 112.9 J ≈ 113 J (or 0.113 kJ).`,
  },
  {
    title: 'Episode Review Q2 — Heat to Raise Temperature and Vaporize a Liquid (1,4-Dioxane)',
    content: `Properties of 1,4-Dioxane, C4H8O2(l): Boiling Point = 101.1°C, Specific Heat Capacity = 1.71 J/(g·°C), Enthalpy of Vaporization = 34.2 kJ/mol.

Calculate the quantity of heat that must be absorbed to increase the temperature of a pure sample of 1.60 g of C4H8O2(l) from 25.0°C to the boiling point of 101.1°C and evaporate the liquid completely. Include units in your answer.`,
    answer: `Step 1 (heating the liquid to its boiling point): q1 = mcΔT = 1.60 g × 1.71 J/(g·°C) × (101.1 − 25.0)°C = 1.60 × 1.71 × 76.1 = 208.2 J.

Step 2 (vaporizing at constant temperature): Molar mass C4H8O2 = 4(12.011) + 8(1.008) + 2(16.00) = 88.11 g/mol. Moles = 1.60 g / 88.11 g/mol = 0.01816 mol. q2 = moles × ΔHvap = 0.01816 mol × 34.2 kJ/mol = 0.6210 kJ = 621.0 J.

Total heat absorbed = q1 + q2 = 208.2 J + 621.0 J = 829.2 J ≈ 829 J (or 0.829 kJ).`,
  },
  {
    title: 'Episode Review Q3 — Heat Released by Cooling Water, Mass of Ice Melted, and Direction of Heat Flow',
    content: `Data for H2O: Specific heat capacity of liquid phase = 4.18 J/(g·°C), Enthalpy of fusion = 6.01 kJ/mol.

A sample of ice at 0.0°C is added to a beaker that contains 175.0 g of water at 42.0°C. The mixture is stirred gently until the temperature of the water is 0.0°C. All of the remaining (unmelted) ice is quickly removed.

(a) Based on the given information, calculate the magnitude of thermal energy, q, that was transferred when the ice melted in this experiment. Include units in your answer.
(b) Based on the magnitude of thermal energy calculated in part (a) and the information in the table above, calculate the mass of ice, in grams, that melted in this experiment.
(c) While the ice is melting, is the net flow of thermal energy from the ice to the surroundings or from the surroundings to the ice? Justify your answer.`,
    answer: `(a) The heat released by the 175.0 g of water cooling from 42.0°C to 0.0°C equals the heat absorbed by the ice that melted (conservation of energy). q = mcΔT = 175.0 g × 4.18 J/(g·°C) × 42.0°C = 30,723 J ≈ 30.7 kJ.

(b) Moles of ice melted = q / ΔHfus = 30.723 kJ / 6.01 kJ/mol = 5.112 mol. Mass of ice melted = 5.112 mol × 18.02 g/mol = 92.1 g.

(c) The net flow of thermal energy is from the surroundings (the warmer 42.0°C water) to the ice. Melting is an endothermic process — it requires an input of energy to overcome the attractive forces holding the solid lattice together — and that energy is supplied by the warmer water surrounding the ice, which is why the water's own temperature drops as it gives up heat to melt the ice.`,
  },
];

/* ============================= 6.6 — Introduction to Enthalpy of Reaction (Episode #18) ============================= */
const t66 = [
  {
    title: 'Episode Review Q4 — Calculating ΔH° per Mole of Reaction from Experimental Combustion Data (Acetylene)',
    content: `2 C2H2(g) + 5 O2(g) → 4 CO2(g) + 2 H2O(l)     ΔH° = ?

It is observed that 49.9 kJ of energy is released when 1.00 g C2H2(g) reacts completely with excess O2(g) under standard conditions according to the equation above. The value for the standard enthalpy change, ΔH°, for the reaction represented by the equation above is closest to which of the following?

(A) –2.60 × 10³ kJ/molrxn
(B) –1.30 × 10³ kJ/molrxn
(C) +1.30 × 10³ kJ/molrxn
(D) +2.60 × 10³ kJ/molrxn`,
    answer: `(A). Molar mass C2H2 = 2(12.011) + 2(1.008) = 26.04 g/mol. Moles C2H2 in 1.00 g = 1.00 / 26.04 = 0.03840 mol. Energy released per mole of C2H2 = 49.9 kJ / 0.03840 mol = 1299 kJ/mol C2H2.

Since the balanced equation shows 2 mol C2H2 per 1 mol of reaction, ΔH° (per molrxn) = 1299 kJ/mol × 2 = 2598 kJ/molrxn ≈ 2.60 × 10³ kJ/molrxn. Since energy is released, the reaction is exothermic and ΔH° is negative: –2.60 × 10³ kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q5 — Limiting Reactant and Heat Released (P4 + Cl2)',
    content: `P4(s) + 6 Cl2(g) → 4 PCl3(l)     ΔH° = –1280 kJ/molrxn

A mixture of 0.500 mol P4(s) and 2.40 mol Cl2(g) are added to a previously evacuated reaction vessel, and a chemical reaction occurs according to the equation shown above. Which of the following identifies the limiting reactant and the amount of heat (q) released under standard conditions?

Limiting Reactant | q (kJ)
(A) P4(s) | 640
(B) P4(s) | 1280
(C) Cl2(g) | 512
(D) Cl2(g) | 1280`,
    answer: `(C). For 0.500 mol P4 to fully react, 0.500 × 6 = 3.00 mol Cl2 would be required — but only 2.40 mol Cl2 is available (less than needed), so Cl2 is the limiting reactant.

Moles of reaction (based on limiting Cl2) = 2.40 mol / 6 = 0.400 molrxn. Heat released q = 0.400 molrxn × 1280 kJ/molrxn = 512 kJ.`,
  },
  {
    title: 'Episode Review Q6 — Heat Released from a Given Mass of Reactant (SO2 + O2)',
    content: `2 SO2(g) + O2(g) → 2 SO3(g)     ΔH° = –198 kJ/molrxn

When 7.05 g of SO2(g) is combined with an excess amount of O2(g), all of the SO2(g) is converted into SO3(g) as represented by the equation above. Which of the following is true when the 7.05 g of SO2(g) has completely reacted?

(A) 10.9 kJ of energy is absorbed by the reaction.
(B) 21.8 kJ of energy is absorbed by the reaction.
(C) 10.9 kJ of energy is released by the reaction.
(D) 21.8 kJ of energy is released by the reaction.`,
    answer: `(C). Molar mass SO2 = 32.07 + 2(16.00) = 64.07 g/mol. Moles SO2 = 7.05 g / 64.07 g/mol = 0.1100 mol.

Moles of reaction (2 mol SO2 per molrxn) = 0.1100 / 2 = 0.05502 molrxn. Heat = 0.05502 molrxn × 198 kJ/molrxn = 10.9 kJ. Since ΔH° is negative, this energy is released (exothermic).`,
  },
  {
    title: 'Episode Review Q7 — Enthalpy of Dissolution for NH4NO3 from Calorimetry Data',
    content: `NH4NO3(s) → NH4+(aq) + NO3–(aq)     ΔHsoln = ?

A student dissolves 16.00 g of NH4NO3(s) into 100.00 g of water initially at 25.0°C in a coffee-cup calorimeter. The final temperature of the solution is 13.8°C. Assume that the total mass of the mixture is 116.00 g and that the specific heat capacity of the mixture is 3.95 J/(g·°C).

Which of the following is the enthalpy change for the dissolution of NH4NO3(s) as represented above?

(A) –25.7 kJ/molrxn
(B) –5.13 kJ/molrxn
(C) +5.13 kJ/molrxn
(D) +25.7 kJ/molrxn`,
    answer: `(D). ΔT (magnitude) = |13.8 − 25.0| = 11.2°C. q = mcΔT = 116.00 g × 3.95 J/(g·°C) × 11.2°C = 5131.8 J = 5.132 kJ.

Since the temperature decreased, the process is endothermic, so ΔH is positive. Molar mass NH4NO3 = 14.01 + 4(1.008) + 14.01 + 3(16.00) = 80.05 g/mol. Moles = 16.00 g / 80.05 g/mol = 0.1999 mol.

ΔHsoln = q / moles = 5.132 kJ / 0.1999 mol = +25.7 kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q8 — Determining Molar Enthalpy of Combustion of Butane from Calorimetry Data',
    content: `C4H10(g) + 13/2 O2(g) → 4 CO2(g) + 5 H2O(g)     ΔHrxn = ?

A student performs an experiment to determine the enthalpy of combustion of butane, C4H10(g), by heating a sample of water using a butane burner. Data: mass of butane burner before combustion = 235.74 g, mass of butane burner after combustion = 230.67 g, mass of water heated = 975.05 g, initial temperature of water = 22.0°C, final temperature of water = 77.9°C, specific heat of water = 4.18 J/(g·°C).

(a) Calculate the magnitude of the heat energy, in kJ, absorbed by the water. Assume that all of the heat energy released from the combustion of C4H10(g) is transferred to the water.
(b) Calculate the number of moles of C4H10(g) that was consumed in this experiment. Report your answer to the appropriate number of significant figures.
(c) Based on your answers to parts (a) and (b), calculate the molar enthalpy of reaction, ΔHrxn, for the combustion of C4H10(g), in kJ/molrxn. Include the sign in your answer.
(d) The student claims that if heat from the combustion of C4H10(g) is lost to the surrounding air during the experiment, then the experimental value of the molar enthalpy of reaction will be smaller in magnitude than the actual value. Do you agree or disagree with the student's claim? Justify your answer.`,
    answer: `(a) q = mcΔT = 975.05 g × 4.18 J/(g·°C) × (77.9 − 22.0)°C = 975.05 × 4.18 × 55.9 = 227,832 J ≈ 227.8 kJ.

(b) Mass of C4H10 consumed = 235.74 g − 230.67 g = 5.07 g (3 sig figs, from subtraction of two 2-decimal-place measurements). Molar mass C4H10 = 4(12.011) + 10(1.008) = 58.12 g/mol. Moles = 5.07 g / 58.12 g/mol = 0.0872 mol (3 sig figs).

(c) ΔHrxn = −q / moles (negative sign since combustion releases heat, exothermic) = −227.8 kJ / 0.08724 mol (unrounded) = −2.61 × 10³ kJ/molrxn.

(d) Agree. If some heat escapes to the surrounding air instead of being transferred to the water, the measured q (based on the water's temperature change) would underestimate the true total heat released by the combustion reaction. Since the calculated ΔHrxn is based on this measured (too-small) q, the calculated magnitude of ΔHrxn would also be smaller than the actual (true) value.`,
  },
  {
    title: 'Episode Review Q9 — Limiting Reactant, Heat Released, and Experimental ΔHrxn (MgO + HCl)',
    content: `MgO(s) + 2 HCl(aq) → MgCl2(aq) + H2O(l)     ΔHrxn = ?

A student determines the enthalpy change for the reaction between MgO(s) and HCl(aq) using a coffee cup calorimeter. Data:

Trial 1: 0.50 g MgO(s), 100.0 mL of 1.0 M HCl(aq), initial 25.0°C, final 29.6°C.
Trial 2: 1.00 g MgO(s), 100.0 mL of 1.0 M HCl(aq), initial 25.0°C, final 34.2°C.

(a) Based on the student's data, identify the limiting reactant in trial 2. Justify your answer.

For parts (b) and (c), use the data from trial 2. Assume the calorimeter has a negligible heat capacity, the specific heat of the reaction mixture is 4.0 J/(g·°C), and the density of the HCl(aq) is 1.0 g/mL.

(b) Calculate the magnitude of thermal energy, q, that is released in trial 2 when MgO(s) was added to HCl(aq). Include units with your answer.
(c) Determine the experimental value of ΔHrxn for the reaction between MgO(s) and HCl(aq) in units of kJ/molrxn. Include the sign in your answer.

The student conducts a third trial using 1.00 g of MgO(s), but the concentration of HCl(aq) is increased from 1.0 M to 2.0 M (same volume, 100.0 mL; same density, 1.0 g/mL; same specific heat, 4.0 J/(g·°C)).

(d) Would ΔT for trial 3 be less than, greater than, or equal to the value in trial 2? Justify your answer.`,
    answer: `(a) Molar mass MgO = 24.305 + 16.00 = 40.31 g/mol. Moles MgO = 1.00 g / 40.31 g/mol = 0.0248 mol. Moles HCl = 0.1000 L × 1.0 M = 0.100 mol. The reaction requires a 1:2 ratio of MgO:HCl, so 0.0248 mol MgO would need 2 × 0.0248 = 0.0496 mol HCl — but 0.100 mol HCl is available (more than enough, in excess). Therefore MgO is the limiting reactant.

(b) Mass of solution = 1.00 g + 100.0 g (100.0 mL × 1.0 g/mL) = 101.00 g. ΔT = 34.2 − 25.0 = 9.2°C. q = mcΔT = 101.00 g × 4.0 J/(g·°C) × 9.2°C = 3716.8 J ≈ 3.7 kJ.

(c) ΔHrxn = −q / moles MgO (negative, since exothermic) = −3.7 kJ / 0.0248 mol = −150 kJ/molrxn.

(d) Equal to the value in trial 2. The limiting reactant (MgO) is present in the same amount (1.00 g) in both trial 2 and trial 3, so the same quantity of heat (q) is released in both trials regardless of the HCl concentration (since MgO — not HCl — controls how much reaction occurs). Since the mass of the reaction mixture and its specific heat capacity are also unchanged (same volume and density of HCl solution, same specific heat given), and ΔT = q/(mc), all three factors are the same in both trials, so ΔT for trial 3 should be the same as trial 2.`,
  },
];

/* ============================= 6.7 — Bond Enthalpies (Episode #19) ============================= */
const t67 = [
  {
    title: 'Episode Review Q1 — Sign of ΔH° for Breaking a Bond',
    content: `H–H → H• + •H     ΔH° = ?

Which of the following descriptions of the reaction represented above is completely correct?

(A) The sign of ΔH° for the reaction is positive, because breaking a bond requires energy.
(B) The sign of ΔH° for the reaction is negative, because breaking a bond requires energy.
(C) The sign of ΔH° for the reaction is positive, because breaking a bond releases energy.
(D) The sign of ΔH° for the reaction is negative, because breaking a bond releases energy.`,
    answer: `(A). Breaking a bond is always an endothermic process (it requires an input of energy to overcome the attractive force holding the atoms together), so ΔH° is positive. (Options (C) and (D) incorrectly state that breaking a bond releases energy — the opposite is true; forming a bond releases energy.)`,
  },
  {
    title: 'Episode Review Q2 — Estimating a Bond Energy from ΔH° and Other Bond Energies (Haber Process)',
    content: `3 H2(g) + N2(g) → 2 NH3(g)     ΔH° = –92 kJ/molrxn

Bond Type | Bond Energy (kJ/mol)
hydrogen-hydrogen bond in H2 | 436
nitrogen-nitrogen bond in N2 | 940
nitrogen-hydrogen bond in NH3 | ?

Based on the bond energies given in the table and the value of ΔH°, which of the following is the best estimate for the energy of one of the nitrogen-hydrogen bonds in NH3?

(A) 359 kJ/mol
(B) 390 kJ/mol
(C) 780 kJ/mol
(D) 1170 kJ/mol`,
    answer: `(B). Bonds broken (reactants): 3 mol H–H + 1 mol N≡N = 3(436) + 940 = 1308 + 940 = 2248 kJ.

Bonds formed (products): 2 mol NH3, each with 3 N–H bonds = 6 mol N–H bonds = 6x (where x is the unknown N–H bond energy).

ΔH° = (bonds broken) − (bonds formed): −92 = 2248 − 6x. Solving: 6x = 2248 + 92 = 2340, so x = 2340 / 6 = 390 kJ/mol.`,
  },
  {
    title: 'Episode Review Q3 — Estimating ΔH° from Bond Enthalpies (Hydrogenation of Ethylene)',
    content: `Bond | Bond Enthalpy (kJ/mol)
H–H | 436
C–H | 413
C–C | 348
C=C | 614

Based on the bond enthalpies given in the table above, which of the following is the best estimate of ΔH° for the reaction represented below?

H2C=CH2 + H–H → H3C–CH3     (ethylene + hydrogen → ethane)

(A) –124 kJ/molrxn
(B) –42 kJ/molrxn
(C) +42 kJ/molrxn
(D) +124 kJ/molrxn`,
    answer: `(A). Bonds broken (reactants): 1 C=C (614) + 4 C–H (4 × 413 = 1652, in ethylene) + 1 H–H (436) = 614 + 1652 + 436 = 2702 kJ.

Bonds formed (products): 1 C–C (348) + 6 C–H (6 × 413 = 2478, in ethane) = 348 + 2478 = 2826 kJ.

ΔH° = (bonds broken) − (bonds formed) = 2702 − 2826 = −124 kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q4 — Identifying a Sign Error in a Bond-Enthalpy ΔH° Calculation (Cl2 + F2)',
    content: `Cl2(g) + 3 F2(g) → 2 ClF3(g)

Bond | Bond Energy (kJ/mol)
F–F | 159
Cl–Cl | 243
Cl–F | 253

A student was asked to calculate ΔH° for the reaction above and set up the calculation as follows:

ΔH° = (bond enthalpies for the product) − (bond enthalpies for the reactants)
(253)(6) − [243 + (159)(3)] = +798 kJ/molrxn

(a) The student's answer of +798 kJ/molrxn is incorrect. Identify the error in the set-up for the student's calculation that explains why the calculated value for ΔH° is incorrect.
(b) Calculate the value of ΔH° for the reaction Cl2 + 3 F2 → 2 ClF3. Show the correct set-up for the calculation in the space below.`,
    answer: `(a) The student subtracted the two terms in the wrong order. The correct formula is ΔH° = (bond enthalpies of bonds BROKEN, i.e., the reactants) − (bond enthalpies of bonds FORMED, i.e., the products) — not (products) − (reactants) as the student used. This reversal flips the sign of the final answer.

(b) Bonds broken (reactants): 1 Cl–Cl (243) + 3 F–F (3 × 159 = 477) = 720 kJ. Bonds formed (products): 2 ClF3, each with 3 Cl–F bonds = 6 Cl–F bonds (6 × 253 = 1518 kJ).

ΔH° = (bonds broken) − (bonds formed) = 720 − 1518 = −798 kJ/molrxn.`,
  },
];

/* ============================= 6.8 — Enthalpy of Formation (Episode #19) ============================= */
const t68 = [
  {
    title: 'Episode Review Q5 — Calculating ΔH° for Combustion of Propane Using Enthalpies of Formation',
    content: `C3H8(g) + 5 O2(g) → 3 CO2(g) + 4 H2O(g)     ΔH° = ?

Substance | Standard Enthalpy of Formation (kJ/mol)
C3H8(g) | –104
O2(g) | 0
CO2(g) | –394
H2O(g) | –242

Based on the information given, ΔH° for this reaction is closest to which of the following?

(A) –2046 kJ/molrxn
(B) –532 kJ/molrxn
(C) +532 kJ/molrxn
(D) +2046 kJ/molrxn`,
    answer: `(A). ΔH° = ΣΔHf°(products) − ΣΔHf°(reactants) = [3(−394) + 4(−242)] − [(−104) + 5(0)] = [−1182 − 968] − [−104] = −2150 + 104 = −2046 kJ/molrxn.`,
  },
  {
    title: 'Episode Review Q6 — Solving for an Unknown Enthalpy of Formation (N2O4)',
    content: `2 N2H4(g) + N2O4(g) → 3 N2(g) + 4 H2O(g)     ΔH° = –1168 kJ/molrxn

Substance | ΔHf° (kJ/mol)
N2H4(g) | +95
N2O4(g) | ?
N2(g) | 0
H2O(g) | –242

Based on the reaction and data table shown, what is the value of ΔHf° for N2O4(g)?

(A) –2326 kJ/mol
(B) –10 kJ/mol
(C) +10 kJ/mol
(D) +2326 kJ/mol`,
    answer: `(C). ΔH° = ΣΔHf°(products) − ΣΔHf°(reactants):

−1168 = [3(0) + 4(−242)] − [2(95) + ΔHf°(N2O4)]
−1168 = −968 − 190 − ΔHf°(N2O4)
−1168 = −1158 − ΔHf°(N2O4)
−10 = −ΔHf°(N2O4)
ΔHf°(N2O4) = +10 kJ/mol.`,
  },
];

/* ============================= 6.9 — Hess's Law (Episode #19) ============================= */
const t69 = [
  {
    title: "Episode Review Q7 — Applying Hess's Law to Find ΔH° for the Formation of Nitric Acid from N2O5",
    content: `N2(g) + 5/2 O2(g) → N2O5(g)     ΔH° = +11.3 kJ/molrxn
2 H2(g) + O2(g) → 2 H2O(l)     ΔH° = –571.6 kJ/molrxn
1/2 H2(g) + 1/2 N2(g) + 3/2 O2(g) → HNO3(aq)     ΔH° = –206.6 kJ/molrxn

Based on the information above, the value of ΔH° for the following reaction is closest to which of the following?

N2O5(g) + H2O(l) → 2 HNO3(aq)     ΔH° = ?

(A) –768 kJ/molrxn
(B) –689 kJ/molrxn
(C) –139 kJ/molrxn
(D) –117 kJ/molrxn`,
    answer: `(C). Reverse equation 1: N2O5(g) → N2(g) + 5/2 O2(g), ΔH° = −11.3 kJ/molrxn.

Reverse equation 2 and multiply by 1/2: H2O(l) → H2(g) + 1/2 O2(g), ΔH° = −(−571.6)/2 = +285.8 kJ/molrxn.

Multiply equation 3 by 2: H2(g) + N2(g) + 3 O2(g) → 2 HNO3(aq), ΔH° = 2 × (−206.6) = −413.2 kJ/molrxn.

Adding all three manipulated equations, the N2, H2, and O2 terms cancel completely, leaving: N2O5(g) + H2O(l) → 2 HNO3(aq).

ΔH° (total) = −11.3 + 285.8 − 413.2 = −138.7 ≈ −139 kJ/molrxn.`,
  },
  {
    title: "Episode Review Q8 — Applying Hess's Law to Find ΔH° for the Formation of HBr",
    content: `Reaction 1: 1/2 H2(g) + 1/2 Cl2(g) → HCl(g)     ΔH° = –92 kJ/molrxn
Reaction 2: 1/2 H2(g) + 1/2 Br2(g) → HBr(g)     ΔH° = ?
Reaction 3: Cl2(g) + 2 HBr(g) → Br2(g) + 2 HCl(g)     ΔH° = –80. kJ/molrxn

Reactions 1 and 2 shown above can be manipulated to produce reaction 3. What is the value of ΔH° for reaction 2?

(A) –104 kJ/molrxn
(B) –52 kJ/molrxn
(C) +18 kJ/molrxn
(D) +52 kJ/molrxn`,
    answer: `(B). Multiply reaction 1 by 2: H2(g) + Cl2(g) → 2 HCl(g), ΔH° = 2 × (−92) = −184 kJ/molrxn.

Reverse reaction 2 and multiply by 2: 2 HBr(g) → H2(g) + Br2(g), ΔH° = −2x (where x is reaction 2's unknown ΔH°).

Adding these two manipulated equations (the H2 terms cancel): Cl2(g) + 2 HBr(g) → 2 HCl(g) + Br2(g), which matches reaction 3.

ΔH°(total) = −184 + (−2x) = −80. Solving: −2x = −80 + 184 = 104, so x = −52 kJ/molrxn.`,
  },
  {
    title: "Episode Review Q9 — Applying Hess's Law to Find the Enthalpy of Sublimation of Iodine",
    content: `Reaction 1: 1/2 H2(g) + 1/2 I2(s) → HI(g)     ΔH° = –26 kJ/molrxn
Reaction 2: 1/2 H2(g) + 1/2 I2(g) → HI(g)     ΔH° = –57 kJ/molrxn

Based on the information shown above, what is the value of ΔH° for reaction 3 represented below?

Reaction 3: I2(s) → I2(g)     ΔH° = ?

(A) –62 kJ/molrxn
(B) –31 kJ/molrxn
(C) +31 kJ/molrxn
(D) +62 kJ/molrxn`,
    answer: `(D). Reverse reaction 2: HI(g) → 1/2 H2(g) + 1/2 I2(g), ΔH° = +57 kJ/molrxn.

Add reaction 1 and the reversed reaction 2 (the H2 and HI terms cancel): 1/2 I2(s) → 1/2 I2(g), ΔH° = −26 + 57 = +31 kJ/molrxn.

Multiplying by 2 to get the full reaction (I2(s) → I2(g)): ΔH° = 2 × 31 = +62 kJ/molrxn.`,
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
    imgMap['q3_diagram'] = await uploadImage('q3_energy_diagram.png', 'ep17-q3-energy-profile-diagram.png');
    imgMap['q4_diagrams'] = await uploadImage('q4_diagrams_full.png', 'ep17-q4-particle-speed-diagrams.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t62) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t63) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('6.1', t61);
    await insertTopic('6.2', t62);
    await insertTopic('6.3', t63);
    await insertTopic('6.4', t64);
    await insertTopic('6.5', t65);
    await insertTopic('6.6', t66);
    await insertTopic('6.7', t67);
    await insertTopic('6.8', t68);
    await insertTopic('6.9', t69);
    console.log('Done — Unit 6 Episode Review (Episodes #17-19) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
