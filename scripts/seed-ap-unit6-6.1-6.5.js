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
  '6.1': '6ebde663-712d-4158-89c8-731d042a8c80',
  '6.2': '0b14651f-e7ca-45bc-bf1b-7e2fcd256b2b',
  '6.3': '97462a7b-6db6-4cfa-ba32-2d38ae601364',
  '6.4': '23440ca7-a9cb-4a95-95da-6f922991172a',
  '6.5': 'eb1aa211-d183-4ae5-838d-f670b3908cae',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/u61imgs';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit6-topics6.1-6.5/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 6.1 — Endothermic and Exothermic Processes ============================= */
const t61 = [
  {
    title: 'Q1 — Heating Water on a Hot Plate: Endothermic or Exothermic?',
    imageKey: 'hotplate',
    content: `A sample of water at room temperature is added to a beaker and placed on a hot plate. The initial temperature of the water is recorded. The hot plate is turned on, and the temperature of the water is monitored over time, as shown in the diagram.

Would you describe the change that occurred in this experiment as an endothermic process or an exothermic process? Justify your answer by indicating the direction of heat flow. Use the terms system and surroundings in your answer.`,
    answer: `This is an endothermic process. The temperature of the water (the system) increases over time after the hot plate is turned on, which indicates that the water is gaining energy. The direction of heat flow is from the surroundings (the hot plate) into the system (the water) — heat flows from the hotter hot plate to the cooler water. Since the system gains energy from the surroundings, this is classified as endothermic.`,
  },
  {
    title: 'Q2 — Combining HCl and NaOH: Endothermic or Exothermic?',
    imageKey: 'styrofoam',
    content: `Two different solutions, HCl(aq) and NaOH(aq), occupy separate beakers at room temperature. The initial temperature of each solution is recorded, and the solutions are combined in a Styrofoam cup. The temperature of the solution is monitored over time, as shown in the diagram.

Would you describe the change that occurred in this experiment as an endothermic process or an exothermic process? Justify your answer by indicating the direction of heat flow. Use the terms system and surroundings in your answer.`,
    answer: `This is an exothermic process. The diagram shows the temperature of the solution (the system) increasing after the two solutions are combined, which indicates that the system is releasing energy. The direction of heat flow is from the system (the reacting HCl/NaOH mixture) into the surroundings (the Styrofoam cup, the thermometer, and the surrounding air) — heat flows out of the system into the surroundings, raising the surroundings' temperature (as measured by the thermometer). Since the system loses energy to the surroundings, this is classified as exothermic. (This is consistent with the fact that HCl + NaOH is an acid-base neutralization reaction, which releases energy as new attractive forces — the ion-dipole interactions in the resulting NaCl(aq) solution — are formed.)`,
  },
  {
    title: 'Q3 — Three-Step Dissolution of an Ionic Solid',
    imageKey: 'dissolution3step',
    content: `Consider the process of dissolving an ionic solid such as KOH(s) or CaCl2(s) in water, as represented by the equations below:

KOH(s) → K+(aq) + OH-(aq)     or     CaCl2(s) → Ca2+(aq) + 2 Cl-(aq)

The particle diagram shows the dissolution of an ionic solute in a polar solvent such as water, occurring in three steps: Step 1 separates the ions of the solid ionic lattice into a gas-like state of individual ions; Step 2 separates the water molecules from each other to make room for the ions; Step 3 combines the separated ions and separated water molecules into a solution, with water molecules surrounding (hydrating) each ion.

Fill in the missing information in the table below, regarding the particle diagram.

Step | Endothermic or Exothermic? | Are Attractive Forces Between Particles Broken or Formed?
1 (separating the ions of the solid lattice) | ? | ?
2 (separating the water molecules from each other) | ? | ?
3 (combining the separated ions and water molecules into solution) | ? | ?`,
    answer: `Step 1 (separating the ions of the solid ionic lattice): Endothermic. This step breaks the ionic bonds (attractive forces) holding the Na+/K+ and Cl-/OH- ions together in the rigid crystal lattice, which requires an input of energy.

Step 2 (separating the water molecules from each other): Endothermic. This step breaks the hydrogen bonds (attractive forces) between neighboring water molecules to make room for the incoming ions, which also requires an input of energy.

Step 3 (combining the separated ions and separated water molecules into solution): Exothermic. This step forms new ion-dipole attractive forces between each ion and the surrounding polar water molecules (hydration), which releases energy.

(Whether the overall dissolution process is endothermic or exothermic overall depends on the relative magnitudes of the energy absorbed in Steps 1 and 2 versus the energy released in Step 3.)`,
  },
];

/* ============================= 6.2 — Energy Diagrams ============================= */
const t62 = [
  {
    title: 'Q4 — Reading and Sketching a Reaction Energy Profile',
    imageKey: 'energyprofile',
    content: `The diagram shows the energy profile for a chemical reaction. The reactants begin at a potential energy of 150 kJ, the curve rises to a peak (transition state) at 300 kJ, and then falls to a final potential energy of 250 kJ for the products.

(a) Based on the diagram, determine:
- The activation energy for the forward reaction, in kJ.
- The energy difference between reactants and products, in kJ.
- Is the chemical reaction classified as endothermic or exothermic?

(b) Describe (or sketch) an energy profile for a different chemical reaction with the following features:
- The potential energy of the reactants should be the same (150 kJ).
- The activation energy for the forward reaction should be the same (150 kJ).
- The absolute value of the energy difference between reactants and products should be the same (100 kJ).
- The reaction should show the opposite change in energy (i.e., if the original reaction is endothermic, this new one should be exothermic).`,
    answer: `(a) Activation energy for the forward reaction = 300 kJ - 150 kJ = 150 kJ (the difference between the reactants' potential energy and the peak/transition-state potential energy).

Energy difference between reactants and products = 250 kJ - 150 kJ = 100 kJ.

The reaction is endothermic, because the potential energy of the products (250 kJ) is higher than the potential energy of the reactants (150 kJ) — the system's energy increased overall.

(b) Since the original reaction is endothermic (products higher than reactants by 100 kJ, with a 150 kJ activation energy for the forward reaction), the new diagram should show an exothermic reaction: reactants still starting at 150 kJ, rising to the same peak of 300 kJ (maintaining the 150 kJ activation energy for the forward reaction), but this time falling to a final product potential energy of 50 kJ (150 kJ - 100 kJ), so that the products end up 100 kJ lower than the reactants instead of 100 kJ higher.`,
  },
];

/* ============================= 6.3 — Heat Transfer and Thermal Equilibrium ============================= */
const t63 = [
  {
    title: 'Q5 — Heat Flow Between a Hot Metal and Cooler Water',
    imageKey: 'metalwater',
    content: `In a certain experiment, a piece of metal is heated to a temperature of 100°C in a boiling water bath. Then the hot metal is quickly transferred to a sample of water at 20°C in an insulated container, as shown in the diagram.

(a) Describe the direction of heat flow at the moment that the sample of metal is added to the sample of water at 20°C.
(b) At what point during the experiment will the transfer of heat between the metal and the water be complete?`,
    answer: `(a) At the moment the hot metal (100°C) is added to the cooler water (20°C), heat flows from the metal to the water. This is because the particles in the warmer metal have a greater average kinetic energy than the particles in the cooler water; when the two are placed in contact, collisions between the particles transfer energy from the higher-kinetic-energy (metal) particles to the lower-kinetic-energy (water) particles.

(b) The transfer of heat will be complete when the metal and the water reach thermal equilibrium — that is, when the metal and the water reach the same final temperature. At that point, the average kinetic energy of the particles in both the metal and the water is equal, so there is no longer a net transfer of energy between them (collisions still occur, but they transfer, on average, equal amounts of energy in both directions).`,
  },
];

/* ============================= 6.4 — Heat Capacity and Calorimetry ============================= */
const t64 = [
  {
    title: 'Q6 — Specific Heat Capacity Calculations for Fe(s) and H2O(l)',
    content: `The specific heat capacity of Fe(s) is 0.46 J/(g·°C), and the specific heat capacity of H2O(l) is 4.18 J/(g·°C).

(a) Calculate the amount of heat that is required to raise the temperature of a pure sample of 25.0 g H2O(l) from 20.0°C to 75.0°C. Include units in your answer.
(b) A pure sample of 125 g Fe(s) absorbs 5.32 kJ of heat. The initial temperature of the Fe(s) sample is 21.0°C. Calculate the final temperature of the Fe(s). Include units in your answer.
(c) Calculate the molar heat capacity of H2O(l) in units of J/(mol·°C).
(d) In a certain experiment, a 100.0-g sample of Fe(s) and a 100.0-g sample of H2O(l), each starting at 25.0°C, absorb the same quantity of heat (1.00 kJ). A student makes the claim that the final temperature of the H2O(l) will be the same as the final temperature of the Fe(s), because each sample has the same mass and absorbed the same quantity of heat. Do you agree or disagree with the student's claim? Justify your answer with a calculation to support your choice.`,
    answer: `(a) q = mcΔT = (25.0 g)(4.18 J/(g·°C))(75.0°C - 20.0°C) = (25.0)(4.18)(55.0) = 5,747.5 J ≈ 5.75 x 10^3 J (or 5.75 kJ).

(b) q = mcΔT → ΔT = q/(mc) = (5320 J)/[(125 g)(0.46 J/(g·°C))] = 5320/57.5 = 92.5°C. Final temperature = 21.0°C + 92.5°C = 113.5°C.

(c) Molar heat capacity = specific heat capacity x molar mass = (4.18 J/(g·°C)) x (18.02 g/mol) = 75.3 J/(mol·°C).

(d) Disagree. Using q = mcΔT, ΔT = q/(mc). For Fe(s): ΔT = (1000 J)/[(100.0 g)(0.46 J/(g·°C))] = 21.7°C, giving a final temperature of 25.0 + 21.7 = 46.7°C. For H2O(l): ΔT = (1000 J)/[(100.0 g)(4.18 J/(g·°C))] = 2.39°C, giving a final temperature of 25.0 + 2.4 = 27.4°C. Because Fe(s) has a much smaller specific heat capacity than H2O(l), the same amount of heat (and the same mass) produces a much larger temperature change in the Fe(s) than in the H2O(l) — so the two final temperatures are very different, not the same. The student's claim is incorrect because specific heat capacity, not just mass and heat absorbed, determines the resulting temperature change.`,
  },
  {
    title: 'Q7 — Coffee-Cup Calorimetry: Determining the Specific Heat Capacity of Cu(s)',
    content: `A pure sample of Cu(s) with a mass of 100.0 g is placed in a boiling water bath at 100.0°C for several minutes. Then the hot Cu(s) sample is quickly transferred to a sample of 100.0 g of H2O(l) at room temperature in a coffee-cup calorimeter. The initial temperature of the H2O(l) in the calorimeter is 22.0°C. Eventually, thermal equilibrium is reached when the temperature of the mixture of Cu(s) and H2O(l) reaches a maximum value. The final temperature of the mixture is 28.7°C. Assume that no heat is lost to the container or the surroundings outside the container. The specific heat capacity of H2O(l) is 4.18 J/(g·°C).

(a) The magnitude of ΔT for the H2O(l) in this experiment is equal to 28.7°C - 22.0°C = 6.7°C. Calculate the magnitude of ΔT for the Cu(s).
(b) A student makes the claim that the amount of heat energy lost by Cu(s) is greater than the amount of heat energy gained by H2O(l) in this experiment. Do you agree or disagree with the student's claim? Justify your answer.
(c) Use the information from this experiment to calculate the value of the specific heat capacity of Cu(s). Include units in your answer.`,
    answer: `(a) The Cu(s) started at 100.0°C and ended at the same final temperature as the water, 28.7°C. Magnitude of ΔT for Cu(s) = 100.0°C - 28.7°C = 71.3°C.

(b) Disagree. By the law of conservation of energy (assuming no heat is lost to the container or surroundings), the heat energy lost by the Cu(s) as it cools must be exactly equal in magnitude to the heat energy gained by the H2O(l) as it warms — energy lost by the system (Cu) equals energy gained elsewhere in the isolated system (H2O), not greater than it.

(c) Since heat lost by Cu = heat gained by H2O: q(Cu) = q(H2O) = m(H2O) x c(H2O) x ΔT(H2O) = (100.0 g)(4.18 J/(g·°C))(6.7°C) = 2800.6 J. Then c(Cu) = q / [m(Cu) x ΔT(Cu)] = 2800.6 J / [(100.0 g)(71.3°C)] = 0.393 J/(g·°C) ≈ 0.39 J/(g·°C).`,
  },
  {
    title: 'Q8 — Predicting the Final Temperature for Al(s) and H2O(l)',
    content: `The specific heat capacity of Al(s) is 0.91 J/(g·°C), and the specific heat capacity of H2O(l) is 4.18 J/(g·°C). A pure sample of Al(s) with a mass of 100.0 g is placed in a boiling water bath at 100.0°C for several minutes. Then the hot Al(s) sample is quickly transferred to a sample of 100.0 g of H2O(l) in a coffee-cup calorimeter. The initial temperature of the H2O(l) in the calorimeter is 22.0°C. Eventually, thermal equilibrium is reached when the temperature of the mixture of Al(s) and H2O(l) reaches a maximum value. Assume that no heat is lost to the container or the surroundings outside the container.

Calculate the final temperature of the mixture when thermal equilibrium is reached.`,
    answer: `Heat lost by Al(s) = heat gained by H2O(l): m(Al) x c(Al) x [100.0 - Tf] = m(H2O) x c(H2O) x [Tf - 22.0]

(100.0)(0.91)(100.0 - Tf) = (100.0)(4.18)(Tf - 22.0)
91(100.0 - Tf) = 418(Tf - 22.0)
9100 - 91 Tf = 418 Tf - 9196
9100 + 9196 = 418 Tf + 91 Tf
18296 = 509 Tf
Tf = 35.9°C

The final temperature of the mixture is approximately 35.9°C.`,
  },
];

/* ============================= 6.5 — Energy of Phase Changes ============================= */
const t65 = [
  {
    title: 'Q9 — Identifying the Segments of a Heating Curve',
    imageKey: 'heatingcurve',
    content: `The diagram shows a heating curve for a pure substance. The experiment begins with a sample of a pure solid. Heat is added at a constant rate, and the temperature of the substance is monitored over time (labeled points A through F, where AB and CD and EF are sloped segments, and BC and DE are flat/plateau segments).

Fill in the missing information in the table below.

Curve Segment | Change that Occurs During this Part of the Experiment
AB | ?
BC | ?
CD | ?
DE | ?
EF | ?`,
    answer: `AB: The solid is heating up (increasing in temperature) — the temperature of the solid substance increases as heat is added, prior to reaching its melting point.

BC: The solid is melting (solid → liquid) — the temperature remains constant (a plateau) as the added heat is used entirely to break attractive forces between particles in the solid lattice, converting solid to liquid at the melting point, rather than raising the temperature.

CD: The liquid is heating up (increasing in temperature) — once melting is complete, the added heat again raises the temperature, this time of the liquid, as it approaches its boiling point.

DE: The liquid is boiling/vaporizing (liquid → gas) — the temperature remains constant (a plateau) as the added heat is used entirely to break the remaining attractive forces between particles, converting liquid to gas at the boiling point, rather than raising the temperature.

EF: The gas is heating up (increasing in temperature) — once vaporization is complete, the added heat raises the temperature of the gas.`,
  },
  {
    title: 'Q10 — Classifying Phase Changes as Endothermic or Exothermic',
    content: `Fill in the missing information in the table below.

Phase Change | Endothermic or Exothermic? | Are Attractive Forces Between Particles Broken or Formed?
melting (solid → liquid) | ? | ?
evaporation (liquid → gas) | ? | ?
sublimation (solid → gas) | ? | ?
freezing (liquid → solid) | ? | ?
condensation (gas → liquid) | ? | ?
deposition (gas → solid) | ? | ?`,
    answer: `melting (solid → liquid): Endothermic; attractive forces between particles are broken (energy is absorbed to overcome part of the lattice's attractive forces).

evaporation (liquid → gas): Endothermic; attractive forces between particles are broken (energy is absorbed to fully overcome the remaining attractive forces between particles).

sublimation (solid → gas): Endothermic; attractive forces between particles are broken (energy is absorbed to go directly from the fully-ordered solid to the fully-separated gas state).

freezing (liquid → solid): Exothermic; attractive forces between particles are formed (energy is released as particles come together into the more ordered solid lattice).

condensation (gas → liquid): Exothermic; attractive forces between particles are formed (energy is released as separated gas particles come together into the liquid state).

deposition (gas → solid): Exothermic; attractive forces between particles are formed (energy is released as particles go directly from the fully-separated gas state to the fully-ordered solid lattice).`,
  },
  {
    title: 'Q11 — Net Heat Flow When CH4 Condenses (Multiple Choice)',
    mcq: true,
    content: `The boiling point of CH4 is 112 K, and the molar heat of vaporization for CH4 is 8.17 kJ/mol. Which of the following statements accurately describes the net flow of thermal energy when 32.08 g CH4 is converted from a gas to a liquid at 112 K?

(A) 8.17 kJ of thermal energy flows from the sample of CH4 to the surroundings.
(B) 8.17 kJ of thermal energy flows from the surroundings to the sample of CH4.
(C) 16.34 kJ of thermal energy flows from the sample of CH4 to the surroundings.
(D) 16.34 kJ of thermal energy flows from the surroundings to the sample of CH4.`,
    answer: `Correct answer: (C)

32.08 g CH4 x (1 mol / 16.04 g) = 2.00 mol CH4.

Condensation (gas → liquid) releases energy equal in magnitude to the molar heat of vaporization, per mole condensed: 2.00 mol x 8.17 kJ/mol = 16.34 kJ.

Since condensation is exothermic (attractive forces between particles are being formed), this energy flows from the sample of CH4 (the system) to the surroundings — not the reverse.

(A) has the correct direction but uses the heat for only 1 mole, not 2.00 mol.
(B) and (D) have the wrong direction of heat flow — condensation releases heat, it does not absorb it.`,
  },
  {
    title: 'Q12 — Heat Required to Warm and Melt/Vaporize Two Substances',
    content: `Substance C7H6O3(s) (benzoic acid) has a specific heat capacity of 1.17 J/(g·°C), a melting point of 159°C, and a molar heat of fusion of 27.1 kJ/mol.

Substance C2H6O(l) (ethanol) has a specific heat capacity of 2.46 J/(g·°C), a boiling point of 78°C, and a molar heat of vaporization of 42.3 kJ/mol.

(a) Calculate the quantity of heat that must be absorbed to increase the temperature of a pure sample of 0.375 g of C7H6O3(s) from 25°C to the melting point of 159°C and melt the solid completely. Include units in your answer.
(b) Calculate the quantity of heat that must be absorbed to increase the temperature of a pure sample of 0.375 g of C2H6O(l) from 25°C to the boiling point of 78°C and evaporate the liquid completely. Include units in your answer.`,
    answer: `(a) Step 1 (heating the solid from 25°C to 159°C): q1 = mcΔT = (0.375 g)(1.17 J/(g·°C))(159 - 25)°C = (0.375)(1.17)(134) = 58.8 J.

Step 2 (melting at 159°C): moles of C7H6O3 = 0.375 g / (122.12 g/mol) = 0.00307 mol. q2 = moles x molar heat of fusion = 0.00307 mol x 27.1 kJ/mol = 0.0832 kJ = 83.2 J.

Total heat = q1 + q2 = 58.8 J + 83.2 J = 142.0 J ≈ 0.142 kJ.

(b) Step 1 (heating the liquid from 25°C to 78°C): q1 = mcΔT = (0.375 g)(2.46 J/(g·°C))(78 - 25)°C = (0.375)(2.46)(53) = 48.9 J.

Step 2 (vaporizing at 78°C): moles of C2H6O = 0.375 g / (46.07 g/mol) = 0.00814 mol. q2 = moles x molar heat of vaporization = 0.00814 mol x 42.3 kJ/mol = 0.344 kJ = 344 J.

Total heat = q1 + q2 = 48.9 J + 344 J = 392.9 J ≈ 0.393 kJ.`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId);
  const startIdx = existing && existing.length > 0 ? Math.max(...existing.map(q => q.order_index)) + 1 : 0;

  const rows = questions.map((q, idx) => ({
    topic_id: topicId,
    title: q.title,
    content: q.mcq ? q.content + JUSTIFY : q.content,
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
    imgMap['hotplate'] = await uploadImage('q1_61_crop.png', 'hotplate-heating-water.png');
    imgMap['styrofoam'] = await uploadImage('q2_61_crop.png', 'hcl-naoh-styrofoam-cup.png');
    imgMap['dissolution3step'] = await uploadImage('q3_61_crop.png', 'ionic-dissolution-3-step.png');
    imgMap['energyprofile'] = await uploadImage('q4_61_crop.png', 'energy-profile-left.png');
    imgMap['metalwater'] = await uploadImage('q5_61_crop.png', 'hot-metal-cool-water.png');
    imgMap['heatingcurve'] = await uploadImage('q9_61_crop.png', 'heating-curve-ABCDEF.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t61) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t62) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t63) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t65) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('6.1', t61);
    await insertTopic('6.2', t62);
    await insertTopic('6.3', t63);
    await insertTopic('6.4', t64);
    await insertTopic('6.5', t65);
    console.log('Done — Unit 6 Topics 6.1-6.5 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
