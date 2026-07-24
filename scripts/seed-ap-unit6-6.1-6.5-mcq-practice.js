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

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit6-topics6.1-6.5-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '6.1', image: 'u6q1_full.png',
    title: 'Q1 — Classifying a Reaction from a Calorimetry Temperature Graph',
    content: `A student initiates a chemical reaction by combining two different solutions, initially at 20.0°C, in an insulated calorimeter. The temperature of the reaction mixture is monitored, as shown in the graph above. Which of the following correctly classifies the energy change that occurs in this reaction and describes the flow of thermal energy between the reacting species (system) and the surroundings? (See the graph and table above.)

(A) endothermic; Thermal energy lost by the reacting species (system) is gained by the surroundings.
(B) exothermic; Thermal energy lost by the reacting species (system) is gained by the surroundings.
(C) endothermic; Thermal energy lost by the surroundings is gained by the reacting species (system).
(D) exothermic; Thermal energy lost by the surroundings is gained by the reacting species (system).${JUSTIFY}`,
    answer: `(B). The graph shows the temperature of the reaction mixture rising from 20.0°C to about 32.5°C after the reaction begins. A temperature increase in the system means thermal energy is being released INTO the mixture from the reaction itself — this is an exothermic reaction. In an exothermic process, the reacting species (the system) release/lose thermal energy as chemical potential energy is converted to thermal energy, and that thermal energy is gained by the surroundings (here, the water/solution being monitored, which is what causes the recorded temperature to rise). Choices (A) and (C) incorrectly classify the reaction as endothermic, which would require the temperature to decrease. Choice (D) reverses the direction of energy flow — in an exothermic reaction it is the system that loses energy to the surroundings, not the other way around.`,
  },
  {
    topic: '6.1',
    title: 'Q2 — Explaining the Endothermic Dissolution of KI',
    content: `A student dissolves a sample of KI(s) into a sample of water in a coffee cup calorimeter. The solid dissolves completely, and the student monitors the temperature of the solution, observing that the temperature decreases from 21.0°C to 18.0°C. Which of the following best helps explain the energy change that occurred during the dissolution of KI(s)?

(A) When KI(s) dissolves in water, ions of K⁺(aq) and I⁻(aq) are formed.
(B) When KI(s) dissolves in water, molecules of KI(aq) are formed.
(C) K⁺ ions have very strong ion-ion interactions with I⁻ ions in the crystal lattice.
(D) K⁺ ions have very strong ion-dipole interactions with water molecules in the solution.${JUSTIFY}`,
    answer: `(C). The observed temperature DROP means the dissolution is endothermic overall — energy is absorbed from the surroundings (the water), cooling the solution. KI is an ionic solid, so choice (B) is factually wrong (it dissolves into separate hydrated ions, not molecules); choice (A) merely restates what happens without explaining the energy change, so it doesn't "help explain" the observation. The correct explanation must identify why the process is net energy-absorbing: breaking apart the strong ion-ion (electrostatic lattice) interactions holding K⁺ and I⁻ together in the solid requires an input of energy (this is the lattice energy term), and for KI this energy cost is not fully repaid by the energy released when new ion-dipole interactions form with water — so the overall process absorbs net energy from the surroundings, explaining the temperature decrease. Choice (D) describes only the energy-releasing half of the process (hydration) and does not by itself explain why the net result is endothermic.`,
  },
  {
    topic: '6.2', image: 'u6q3_full.png',
    title: 'Q3 — Reading ΔHrxn from an Energy Profile Diagram',
    content: `X2(g) + Y2(g) → 2 XY(g)     ΔHrxn = ?

The diagram above represents the energy profile for the chemical reaction in which XY(g) is produced according to the equation above. Which of the following correctly classifies the energy change that occurs in this reaction and gives the correct value for ΔHrxn? (See the energy profile diagram above, marked with three 50 kJ/molrxn brackets.)

(A) endothermic; +50
(B) exothermic; −50
(C) endothermic; +100
(D) exothermic; −100${JUSTIFY}`,
    answer: `(B). The diagram shows the products, 2 XY(g), ending at a LOWER potential energy level than the reactants, X2(g) + Y2(g) — this is an exothermic reaction, ruling out (A) and (C). To find the value of ΔHrxn, compare only the starting (reactant) energy level to the ending (product) energy level — the tall hump in the middle (activation energy) is irrelevant to ΔHrxn, which depends only on the reactant and product energy levels, not the pathway between them. The diagram shows the reactant level sits exactly ONE 50 kJ/molrxn bracket above the product level (the bracket between the reactants' dashed line and the products' dashed line spans only one "50 kJ/molrxn" segment — the other two brackets span from the reactants' level up to the peak, which is the activation energy, not ΔH). So the products are 50 kJ/mol lower in energy than the reactants, giving ΔHrxn = −50 kJ/molrxn.`,
  },
  {
    topic: '6.3', image: 'u6q4_table.png',
    title: 'Q4 — Comparing Thermal Energy Absorbed Using q = mcΔT',
    content: `Substance | Specific Heat (J/(g·°C))
Cd(s) | 0.23
Zn(s) | 0.39

Based on the information in the table above, which of the following experiments absorbs the greatest quantity of thermal energy?

(A) Increasing the temperature of 4.0 g of Cd(s) from 20°C to 90°C
(B) Increasing the temperature of 4.0 g of Zn(s) from 20°C to 90°C
(C) Increasing the temperature of 6.0 g of Cd(s) from 20°C to 60°C
(D) Increasing the temperature of 6.0 g of Zn(s) from 20°C to 60°C${JUSTIFY}`,
    answer: `(B). Using q = mcΔT for each option: (A) q = 4.0 g × 0.23 J/(g·°C) × 70°C = 64.4 J. (B) q = 4.0 g × 0.39 J/(g·°C) × 70°C = 109.2 J. (C) q = 6.0 g × 0.23 J/(g·°C) × 40°C = 55.2 J. (D) q = 6.0 g × 0.39 J/(g·°C) × 40°C = 93.6 J. Comparing all four, option (B) absorbs the greatest quantity of thermal energy (109.2 J) — it combines the higher specific heat metal (Zn) with the largest temperature change (70°C) among the two Zn options, and 4.0 g × 70°C ends up outweighing 6.0 g × 40°C even though the mass is smaller (4.0 × 70 = 280 "g·°C" vs. 6.0 × 40 = 240 "g·°C").`,
  },
  {
    topic: '6.3',
    title: 'Q5 — Conservation of Energy in a Metal/Water Calorimetry Experiment',
    content: `A 100 g sample of a metal was heated to 100°C and then quickly transferred to an insulated container holding 100 g of water at 22°C. The temperature of the water rose to reach a final temperature of 35°C. Which of the following can be concluded?

(A) The metal temperature changed more than the water temperature did; therefore the metal lost more thermal energy than the water gained.
(B) The metal temperature changed more than the water temperature did, but the metal lost the same amount of thermal energy as the water gained.
(C) The metal temperature changed more than the water temperature did; therefore the heat capacity of the metal must be greater than the heat capacity of the water.
(D) The final temperature is less than the average starting temperature of the metal and the water; therefore the total energy of the metal and water decreased.${JUSTIFY}`,
    answer: `(B). In an insulated (closed) calorimeter system, conservation of energy requires that all thermal energy lost by the hot metal is gained by the cooler water — qmetal = −qwater, with no net loss from the system regardless of how large each substance's temperature change is. It's true the metal's temperature changed more than the water's (100°C → 35°C is a 65°C drop for the metal, vs. 22°C → 35°C, a 13°C rise for the water), but that is explained by the metal having a smaller mass×specific-heat product than the water, NOT by the metal losing more energy overall — ruling out (A). Choice (C) draws the wrong conclusion from the same observation: a metal needing a LARGER temperature change to transfer the SAME amount of energy actually implies it has a lower heat capacity (mc) than the water, not a greater one. Choice (D) is simply incorrect — total energy of the combined system is conserved (constant), not decreased; the average-temperature comparison it describes has no bearing on total energy in an insulated system.`,
  },
  {
    topic: '6.3', image: 'u6q6_full.png',
    title: 'Q6 — Average Kinetic Energy Change of Two Heated Liquids',
    content: `Substance | Specific Heat Capacity (J/(g·°C)) | Mass of Sample (g) | Initial Temperature (°C) | Final Temperature (°C)
CH3OH(l) | 2.14 | 20.0 | 25.0°C | 55.0°C
H2O(l) | 4.18 | 20.0 | 25.0°C | 55.0°C

A student heated samples of CH3OH(l) and H2O(l). Data from the experiment is shown in the table above. Based on the information in the table, which of the following correctly compares the change in the average kinetic energy of the molecules in the samples and provides the correct justification? (See the answer-comparison table above.)

(A) higher for the sample of CH3OH(l); CH3OH(l) has a lower specific heat capacity and absorbs more energy
(B) higher for the sample of H2O(l); H2O(l) has a higher specific heat capacity and absorbs more energy
(C) the same for both samples; Each sample has the same mass.
(D) the same for both samples; The initial and final temperatures are the same.${JUSTIFY}`,
    answer: `(D). Average kinetic energy of the molecules in a sample is determined ENTIRELY by its temperature (in Kelvin) — not by its mass, specific heat, or the total amount of thermal energy it absorbed. Both CH3OH(l) and H2O(l) start at the same initial temperature (25.0°C) and end at the same final temperature (55.0°C), so both samples undergo the identical change in average kinetic energy, even though H2O(l) (with its higher specific heat) must absorb more total thermal energy (q = mcΔT) to achieve that same temperature change. Choices (A) and (B) incorrectly link average kinetic energy to the amount of heat absorbed (a common misconception) rather than to temperature. Choice (C) reaches the right conclusion (same for both) but for the wrong reason — equal mass is irrelevant to average kinetic energy; it's the equal initial/final temperatures that matter, as stated correctly in (D).`,
  },
  {
    topic: '6.4', image: 'u6q7_table.png',
    title: 'Q7 — Calculating ΔH for MgO + HCl Neutralization',
    content: `MgO(s) + 2 HCl(aq) → MgCl2(aq) + H2O(l)     ΔH = ?

A student performed an experiment to determine the value of the enthalpy change, ΔH, for the reaction between MgO(s) and HCl(aq) as represented by the equation shown above. The student combined a sample of MgO(s) with an excess amount of HCl(aq) in a coffee-cup calorimeter. Data from the experiment are shown in the table above (mass of MgO(s), molar mass = 40.3 g/mol: 4.03 g; total mass of reaction mixture: 100.00 g; initial temperature: 20.0°C; final temperature: 55.7°C; specific heat capacity of the reaction mixture: 4.2 J/(g·°C)).

Which of the following is the enthalpy change of the reaction represented above?

(A) −150 kJ/molrxn
(B) −15 kJ/molrxn
(C) +15 kJ/molrxn
(D) +150 kJ/molrxn${JUSTIFY}`,
    answer: `(A). First find the heat released: q = mcΔT = 100.00 g × 4.2 J/(g·°C) × (55.7°C − 20.0°C) = 100.00 × 4.2 × 35.7 = 14,994 J ≈ 15.0 kJ. Since the reaction mixture's temperature rose, the reaction released this heat, so q_rxn = −15.0 kJ. Next find moles of MgO (the limiting reagent, since HCl is in excess): moles = 4.03 g ÷ 40.3 g/mol = 0.1000 mol. Finally, ΔH per mole of reaction = q_rxn ÷ moles = −15.0 kJ ÷ 0.1000 mol = −150 kJ/molrxn. The negative sign confirms the reaction is exothermic, consistent with the temperature rise observed in the calorimeter.`,
  },
  {
    topic: '6.4', image: 'u6q8_table.png',
    title: 'Q8 — Predicting Final Temperature When Solvent Mass Is Doubled',
    content: `| | Trial 1 | Trial 2
Mass of LiCl(s) | 10.0 g | 10.0 g
Mass of H2O(l) | 90.0 g | 190.0 g
Initial Temperature of H2O(l) | 20.0°C | 20.0°C
Final Temperature of Solution | 40.8°C | ?

A student performs a calorimetry experiment to determine the change in enthalpy for the dissolution of LiCl(s) in water. Data from the experiment is shown in the table above. Which of the following is the most likely value for the final temperature of the solution in Trial 2?

(A) 20.4°C
(B) 30.4°C
(C) 40.8°C
(D) 61.6°C${JUSTIFY}`,
    answer: `(B). The same mass of LiCl(s) (10.0 g) dissolves in both trials, so the same number of moles dissolve and the same total amount of heat, q, is released in both trials (q depends on moles dissolved and ΔHsoln, not on how much water is present). In Trial 1: q = mcΔT = 100.0 g (total solution mass: 10.0 + 90.0) × c × (40.8°C − 20.0°C) = 100.0 × c × 20.8. In Trial 2, the SAME q must be absorbed by a total mass of 200.0 g (10.0 + 190.0 g) — twice the mass of Trial 1. Since q = mcΔT is held constant while mass doubles, ΔT must be halved: ΔT2 = 20.8°C ÷ 2 = 10.4°C. Final temperature = 20.0°C + 10.4°C = 30.4°C.`,
  },
  {
    topic: '6.4',
    title: 'Q9 — Comparing Heat Released Across Two Neutralization Trials',
    content: `NaOH(aq) + HCl(aq) → NaCl(aq) + H2O(l)

Trial | Volume of 0.10 M HCl(aq) | Volume of 0.10 M NaOH(aq) | Amount of Heat Released
1 | 50. mL | 50. mL | X
2 | 100. mL | 50. mL | Y

A student conducted an experiment to determine ΔHrxn for the reaction between HCl(aq) and NaOH(aq). The student ran two trials using the volumes of HCl(aq) and NaOH(aq) indicated in the table above, and determined the amount of heat released. Which of the following best explains the relationship between X and Y?

(A) Y = 2X, because the volume of HCl(aq) used in trial 2 is twice the volume used in trial 1.
(B) Y = X, because the number of moles of acid and base reacting with each other is the same in both trials.
(C) Y = 2X/3, because the heat is distributed over more particles in trial 2 than in trial 1.
(D) The relationship between X and Y cannot be predicted.${JUSTIFY}`,
    answer: `(B). Moles of HCl and NaOH in Trial 1: 0.050 L × 0.10 M = 0.0050 mol each — they react in a 1:1 ratio with nothing left over, so 0.0050 mol of the neutralization reaction occurs. In Trial 2: moles HCl = 0.100 L × 0.10 M = 0.010 mol, moles NaOH = 0.050 L × 0.10 M = 0.0050 mol. NaOH is now the limiting reactant, so again only 0.0050 mol of the reaction actually occurs (the extra HCl is simply left unreacted in excess). Since the amount of heat released is proportional to the moles of reaction that actually occur (not the volumes or concentrations used), and both trials produce exactly 0.0050 mol of reaction, the same amount of heat is released in both trials: Y = X. Choice (A) incorrectly assumes heat scales with the volume of HCl used regardless of the limiting reactant. Choice (C) invents an unsupported "dilution" effect — heat released depends on moles reacted, not on how dilute the final mixture is.`,
  },
  {
    topic: '6.5', image: 'u6q10_table.png',
    title: 'Q10 — Mass of Solid Gallium That Melts in a Calorimetry Experiment',
    content: `Data for Gallium (Ga)
Specific heat capacity of Ga(l) | 0.37 J/(g·°C)
Heat of fusion | 80. J/g
Melting Point | 29.8°C

A sample of Ga(s) at 29.8°C is added to 100. g of Ga(l) at 83.9°C. The mixture is stirred gently until the temperature is 29.8°C. All of the remaining Ga(s) is quickly removed. Based on the information in the table above, the mass of Ga(s) that melted in this experiment is closest to

(A) 0.25 g
(B) 14 g
(C) 25 g
(D) 39 g${JUSTIFY}`,
    answer: `(C). Since the final mixture temperature (29.8°C) equals the melting point of gallium, the system reached a solid/liquid equilibrium — meaning the 100. g of Ga(l) cooled all the way down to 29.8°C while some of the solid Ga(s) melted, absorbing that released heat as heat of fusion (no further temperature change occurs while both phases coexist at the melting point). Heat released by the liquid cooling: q = mcΔT = 100. g × 0.37 J/(g·°C) × (83.9°C − 29.8°C) = 100. × 0.37 × 54.1 = 2001.7 J. This heat is absorbed by the melting solid: q = mass × heat of fusion, so mass melted = 2001.7 J ÷ 80. J/g = 25.02 g ≈ 25 g.`,
  },
  {
    topic: '6.5', image: 'u6q11_graph.png',
    title: 'Q11 — Energy to Vaporize a Sample Using a Heating Curve',
    content: `The heating curve for methane, CH4, is shown above (labeled segments P, Q, R, S, T, with ΔHfus = 0.94 kJ/mol at the melting plateau and ΔHvap = 8.2 kJ/mol at the boiling plateau).

The energy required to vaporize a 120 g sample of CH4(l) at its boiling point is closest to

(A) 1.1 kJ
(B) 7.1 kJ
(C) 62 kJ
(D) 980 kJ${JUSTIFY}`,
    answer: `(C). First convert the given mass to moles using CH4's molar mass (12.01 + 4×1.01 ≈ 16.04 g/mol): moles = 120 g ÷ 16.04 g/mol ≈ 7.48 mol. The heating curve gives ΔHvap = 8.2 kJ/mol for the vaporization plateau (segment S, where temperature stays constant at the boiling point while heat continues to be added as latent heat of vaporization). Energy required = moles × ΔHvap = 7.48 mol × 8.2 kJ/mol ≈ 61.3 kJ, closest to 62 kJ.`,
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
