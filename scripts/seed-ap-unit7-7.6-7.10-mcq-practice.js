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
  '7.6': '70b2eaac-9329-4935-b362-413662a251c2',
  '7.7': 'a2853644-972c-401b-b56b-07f1f3c66436',
  '7.8': 'd654adce-63df-431a-b088-3ec9830b92e2',
  '7.9': 'b7fa140c-a5ed-4693-8666-44d94d4485a7',
  '7.10': 'f7f32d41-adc1-4800-93c7-9b01d19b74ff',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.6-7.10-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '7.6', image: 'u7b_q1_table.png',
    title: 'Q1 — Finding Kp for a Reversed, Halved Reaction',
    content: `#1: 2 XY(g) ⇌ X2(g) + Y2(g)     Kp = 0.16
#2: ½ X2(g) + ½ Y2(g) ⇌ XY(g)     Kp = ?

Based on the information above, the value of Kp for Equation #2 is closest to

(A) 0.40
(B) 2.5
(C) 3.1
(D) 6.3${JUSTIFY}`,
    answer: `(B). Equation #2 is the REVERSE of Equation #1, with all coefficients also HALVED. First reverse Equation #1: X2(g) + Y2(g) ⇌ 2 XY(g), which has Kp = 1/0.16 = 6.25. Then halve all the coefficients of this reversed equation to get Equation #2 (½X2 + ½Y2 ⇌ XY) — halving coefficients means taking the square root of K: Kp(#2) = √6.25 = 2.5.`,
  },
  {
    topic: '7.6', image: 'u7b_q2_table.png',
    title: 'Q2 — Combining Equilibria to Find an Unknown Kc',
    content: `#1: PbF2(s) ⇌ Pb²⁺(aq) + 2 F⁻(aq)     Kc = 3.6 × 10⁻⁸
#2: HF(aq) ⇌ H⁺(aq) + F⁻(aq)     Kc = 6.8 × 10⁻⁴
#3: PbF2(s) + 2 H⁺(aq) ⇌ Pb²⁺(aq) + 2 HF(aq)     Kc = ?

Based on the information above, the value of Kc for Equation #3 is closest to

(A) 2.4 × 10⁻¹¹
(B) 5.3 × 10⁻⁵
(C) 1.1 × 10⁻⁴
(D) 7.8 × 10⁻²${JUSTIFY}`,
    answer: `(D). Equation #3 can be obtained by adding Equation #1 to TWICE the REVERSE of Equation #2. Reversing #2 gives: H⁺(aq) + F⁻(aq) ⇌ HF(aq), with K = 1/(6.8×10⁻⁴). Doubling this (for the coefficient of 2 in Equation #3): 2H⁺(aq) + 2F⁻(aq) ⇌ 2HF(aq), with K = (1/(6.8×10⁻⁴))² = (1470.6)² ≈ 2.163 × 10⁶. Adding this to Equation #1 (PbF2(s) ⇌ Pb²⁺(aq) + 2F⁻(aq)) and canceling the 2F⁻ that appears on both sides gives exactly Equation #3. When equations are added, their K values are multiplied: Kc(#3) = Kc(#1) × [1/Kc(#2)]² = (3.6×10⁻⁸)(2.163×10⁶) ≈ 7.8 × 10⁻².`,
  },
  {
    topic: '7.10',
    title: 'Q3 — Predicting Which Species Has the Highest Equilibrium Concentration',
    content: `2 H2S(g) + CH4(g) ⇌ CS2(g) + 4 H2(g)     Kc = 3.4 × 10⁻⁴

A 0.10 mol sample of each of the four species in the reaction represented above is injected into a rigid, previously evacuated 1.0 L container. Which of the following species will have the highest concentration when the system reaches equilibrium?

(A) H2S(g)
(B) CH4(g)
(C) CS2(g)
(D) H2(g)${JUSTIFY}`,
    answer: `(A). With all four species starting at 0.10 M, Qc = [CS2][H2]⁴ / ([H2S]²[CH4]) = (0.10)(0.10)⁴ / [(0.10)²(0.10)] = 0.10 × 0.0001 / 0.001 = 0.01. Since Qc (0.01) is greater than Kc (3.4 × 10⁻⁴), the reaction must shift in reverse to reach equilibrium — consuming CS2 and H2 while producing more H2S and CH4. Because the reverse reaction produces 2 mol of H2S for every 1 mol of CH4 formed (matching the 2:1 coefficients), H2S gains concentration twice as fast as CH4 does, and both gain concentration while CS2 and H2 (especially H2, consumed 4 mol at a time) lose concentration. This makes H2S the species with the highest concentration at the new equilibrium.`,
  },
  {
    topic: '7.10',
    title: 'Q4 — Using Qc vs. Kc to Predict the Direction of Reaction',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 450°C

At 450°C, 2.0 moles each of H2(g), I2(g), and HI(g) are combined in a 1.0 L rigid container. Which of the following will occur as the system moves toward equilibrium as represented by the equation above?

(A) More H2(g) and I2(g) will be produced because Qc > Kc.
(B) More HI(g) will be produced because Qc < Kc.
(C) The total pressure in the container will decrease because Qc < Kc.
(D) No net reaction will occur, because the number of molecules is the same on both sides of the equation.${JUSTIFY}`,
    answer: `(B). With 2.0 mol of each species in a 1.0 L container, all concentrations equal 2.0 M. Qc = [HI]² / ([H2][I2]) = (2.0)² / (2.0 × 2.0) = 4.0/4.0 = 1.0. Since Qc (1.0) is less than Kc (51), the reaction must shift forward to reach equilibrium, producing more HI and consuming H2 and I2 — matching (B), not (A) (which has the direction backwards). Because the forward reaction converts 1 mol H2 + 1 mol I2 (2 mol total) into 2 mol HI (also 2 mol total), the total number of moles of gas — and therefore the total pressure — does NOT change as the reaction proceeds, ruling out (C). Choice (D) is a common misconception: having equal moles of gas on both sides means pressure won't change, but it does NOT mean no net reaction occurs — the system is not yet at equilibrium (since Qc ≠ Kc), so a net reaction must still occur even though the total pressure stays constant.`,
  },
  {
    topic: '7.10', image: 'u7b_q5_table.png',
    title: 'Q5 — Choosing Initial Concentrations That Favor More Product Formation',
    content: `X2(g) + 3 Y2(g) ⇌ 2 XY3(g)     Kc = 0.40

A mixture of X2(g), Y2(g), and XY3(g) is placed in a previously evacuated, rigid container and allowed to reach equilibrium at a constant temperature, as shown above. Which of the following sets of initial concentrations would lead to the formation of more XY3(g) as the system moves toward equilibrium? (See the table of initial concentrations above.)

(A) [X2] = 0.50 M, [Y2] = 1.5 M, [XY3] = 2.0 M
(B) [X2] = 0.50 M, [Y2] = 1.5 M, [XY3] = 4.0 M
(C) [X2] = 1.0 M, [Y2] = 3.0 M, [XY3] = 2.0 M
(D) [X2] = 1.0 M, [Y2] = 3.0 M, [XY3] = 4.0 M${JUSTIFY}`,
    answer: `(C). More XY3 will form only if the reaction shifts forward, which requires Qc < Kc (0.40). Computing Qc = [XY3]² / ([X2][Y2]³) for each option: (A) (2.0)²/(0.50 × 1.5³) = 4.0/1.6875 ≈ 2.37 (greater than Kc — shifts reverse). (B) (4.0)²/(0.50 × 1.5³) = 16/1.6875 ≈ 9.48 (much greater than Kc — shifts reverse). (C) (2.0)²/(1.0 × 3.0³) = 4.0/27 ≈ 0.148 (less than Kc — shifts FORWARD, producing more XY3). (D) (4.0)²/(1.0 × 3.0³) = 16/27 ≈ 0.593 (greater than Kc — shifts reverse). Only option (C) has Qc < Kc, so it is the only set of initial concentrations that leads to net forward reaction and more XY3 formation.`,
  },
  {
    topic: '7.8', image: 'u7q6_full.png',
    title: 'Q6 — Identifying the Particulate Diagram Consistent with Kp',
    content: `A2(g) + 2 Q2(g) ⇌ 2 AQ2(g)     Kp = 0.125 at 500 K

Substance A2(g) reacts with substance Q2(g) to produce substance AQ2(g) according to the equation above. Which of the following particulate diagrams is the best representation of the reaction mixture after equilibrium has been achieved at 500 K? Assume that each molecule in the diagram represents 1 atm of gas pressure. (See the four labeled diagrams above; ∞ = A2, ●● = Q2, and the three-circle cluster = AQ2.)

(A) Diagram A
(B) Diagram B
(C) Diagram C
(D) Diagram D${JUSTIFY}`,
    answer: `(C). Counting each type of molecule in every diagram and computing Kp = (P_AQ2)² / [(P_A2)(P_Q2)²] (each molecule counted = 1 atm): Diagram A has 2 A2, 4 Q2, 4 AQ2 → Kp = 4²/(2×4²) = 16/32 = 0.50. Diagram B has 4 A2, 4 Q2, 4 AQ2 → Kp = 4²/(4×4²) = 16/64 = 0.25. Diagram C has 2 A2, 4 Q2, 2 AQ2 → Kp = 2²/(2×4²) = 4/32 = 0.125 — this exactly matches the given Kp. Diagram D has 3 A2, 4 Q2, 2 AQ2 → Kp = 2²/(3×4²) = 4/48 ≈ 0.083. Only Diagram C's molecule counts are consistent with Kp = 0.125.`,
  },
  {
    topic: '7.9',
    title: 'Q7 — Which Change Increases CO2 at Equilibrium',
    content: `CO(g) + H2O(g) ⇌ CO2(g) + H2(g)

Which of the following changes will increase the amount of CO2(g) in the equilibrium system represented by the equation above?

(A) Removing H2(g) from the system
(B) Removing H2O(g) from the system
(C) Increasing the volume of the reaction vessel
(D) Decreasing the volume of the reaction vessel${JUSTIFY}`,
    answer: `(A). Removing H2(g), a product, causes the equilibrium to shift forward (toward products) to partially replace the removed H2 — this also produces more CO2, making (A) correct. Removing H2O(g), a reactant, would shift the equilibrium in reverse, decreasing CO2 — ruling out (B). Both sides of this equation have exactly 2 moles of gas (CO + H2O → CO2 + H2), so changing the volume of the container (choices C and D) has NO effect on the position of this particular equilibrium, since neither direction is favored by a change in pressure/volume when the number of gas moles is equal on both sides.`,
  },
  {
    topic: '7.9', image: 'u7b_q8_table.png',
    title: 'Q8 — Which Reaction\'s Products Increase Upon Compression',
    content: `Reaction | Chemical Equation
A | H2(g) + Br2(g) ⇌ 2 HBr(g)
B | N2(g) + 3 H2(g) ⇌ 2 NH3(g)
C | 2 H2O2(g) ⇌ 2 H2O(g) + O2(g)
D | N2O4(g) ⇌ 2 NO2(g)

The reactions represented above are carried out in sealed, rigid containers and allowed to reach equilibrium. If the volume of each container is reduced from 1.0 L to 0.5 L at constant temperature, for which of the reactions will the amount of product(s) be increased?

(A) Reaction A
(B) Reaction B
(C) Reaction C
(D) Reaction D${JUSTIFY}`,
    answer: `(B). Reducing the volume (compressing the container) shifts each equilibrium toward the side with FEWER moles of gas. Reaction A: 2 mol gas ⇌ 2 mol gas — equal moles, so compression causes no shift and no change in product amount. Reaction B: 4 mol gas (1 N2 + 3 H2) ⇌ 2 mol gas (2 NH3) — fewer moles on the PRODUCT side, so compression shifts the equilibrium toward products, increasing the amount of NH3. Reaction C: 2 mol gas ⇌ 3 mol gas (2 H2O + 1 O2) — fewer moles on the REACTANT side, so compression shifts equilibrium toward reactants, decreasing product amount. Reaction D: 1 mol gas ⇌ 2 mol gas — again fewer moles on the reactant side, so compression shifts equilibrium toward N2O4, decreasing the amount of NO2 product. Only Reaction B has its product amount increased by compression.`,
  },
  {
    topic: '7.7',
    title: 'Q9 — Predicting Total Pressure After Compression and Re-Equilibration',
    content: `PCl5(g) ⇌ PCl3(g) + Cl2(g)

A pure sample of PCl5(g) is placed in a previously evacuated 2.0 L reaction vessel. When the system has reached equilibrium at 500 K according to the equation represented above, the total pressure of the reaction mixture is equal to 1.5 atm. Then the volume of the reaction vessel is reduced from 2.0 L to 1.0 L, and equilibrium is reestablished for the reaction system at 500 K. At this point, the total pressure in the reaction vessel should be

(A) Less than 1.5 atm
(B) Greater than 1.5 atm but less than 3.0 atm
(C) Equal to 3.0 atm
(D) Greater than 3.0 atm${JUSTIFY}`,
    answer: `(B). If the gas mixture were simply compressed with no shift in equilibrium, Boyle's Law would predict the pressure doubles exactly (halving the volume at constant moles and temperature): 1.5 atm → 3.0 atm. However, the product side of this reaction (PCl3 + Cl2, 2 mol gas) has MORE moles of gas than the reactant side (PCl5, 1 mol gas), so compression shifts the equilibrium in REVERSE, back toward PCl5, reducing the total number of gas particles compared to the "no shift" scenario. This means the true new pressure is somewhat LESS than the naive doubled value of 3.0 atm — but compression still increases the concentration of everything present, so the pressure must still end up somewhat HIGHER than the original 1.5 atm. Thus the new total pressure is greater than 1.5 atm but less than 3.0 atm.`,
  },
  {
    topic: '7.6', image: 'u7b_q10_table.png',
    title: "Q10 — How Kc Changes with Temperature for an Exothermic Reaction",
    content: `CO(g) + 2 H2(g) ⇌ CH3OH(g)     ΔH < 0

The synthesis of CH3OH(g) from CO(g) and H2(g) is represented by the equation above. The value of the equilibrium constant, Kc, for the reaction at 483 K is 14.5.

When the temperature of the system is increased to 650 K, which of the following identifies what happens to the value of Kc and provides the correct justification? (See the answer-choice table above.)

(A) Kc will decrease; The reaction is exothermic.
(B) Kc will decrease; The activation energy of the reverse reaction is decreased.
(C) Kc will increase; The reaction is exothermic.
(D) Kc will increase; The activation energy of the forward reaction is decreased.${JUSTIFY}`,
    answer: `(A). Since the reaction is exothermic (ΔH < 0), heat can be treated as a "product" of the forward reaction. Increasing the temperature is like adding more of a product, which shifts the equilibrium in reverse (toward reactants) — this means Kc must DECREASE as temperature increases for an exothermic reaction. Choices (B) and (D) are incorrect because activation energies (for either the forward or reverse reaction) do not change with temperature and are not what determines how K responds to a temperature change — only the sign of ΔH (whether the reaction is exothermic or endothermic) determines that.`,
  },
  {
    topic: '7.9',
    title: 'Q11 — Combining Temperature and Volume Changes to Maximize NO2',
    content: `N2O4(g) ⇌ 2 NO2(g)     ΔH > 0

A mixture of N2O4(g) and NO2(g) is placed in a container and allowed to reach equilibrium according to the equation shown above. The amount of NO2(g) present in the reaction mixture at equilibrium can be maximized by

(A) increasing the temperature and decreasing the volume of the container
(B) increasing the temperature and increasing the volume of the container
(C) decreasing the temperature and decreasing the volume of the container
(D) decreasing the temperature and increasing the volume of the container${JUSTIFY}`,
    answer: `(B). Since ΔH > 0 (endothermic in the forward direction, toward NO2), increasing the temperature shifts the equilibrium forward, favoring more NO2 — this rules out (C) and (D), which decrease the temperature (favoring N2O4 instead). The reaction converts 1 mol of gas (N2O4) into 2 mol of gas (2 NO2), so the product side has MORE moles of gas; increasing the container's volume (decreasing pressure) favors the side with more gas moles — the NO2 side — which further increases NO2. This rules out (A), which decreases the volume (favoring the fewer-moles N2O4 side instead). Combining both changes that favor NO2 — increasing temperature AND increasing volume — maximizes the amount of NO2 at equilibrium.`,
  },
  {
    topic: '7.9',
    title: 'Q12 — Which Change Increases CO2 in a Heterogeneous Equilibrium',
    content: `2 CO(g) ⇌ C(s) + CO2(g)

Which of the following changes will increase the amount of CO2(g) in the reaction system at equilibrium represented above?

(A) Adding a suitable catalyst to the reaction mixture
(B) Removing a small amount of C(s) from the reaction vessel
(C) Increasing the pressure by adding Ne(g) to the system at constant temperature
(D) Decreasing the volume of the reaction vessel at constant temperature${JUSTIFY}`,
    answer: `(D). A catalyst speeds up the rate of reaching equilibrium but does not change the equilibrium position, so it has no effect on the amount of CO2 present — ruling out (A). Since C(s) is a pure solid, its "concentration" (activity) does not appear in the equilibrium expression and stays effectively constant regardless of how much solid is present (as long as some remains); removing some C(s) therefore does not shift the equilibrium at all — ruling out (B). Adding an inert gas like Ne(g) to a container without changing its volume increases the TOTAL pressure but does not change the partial pressures (or concentrations) of CO(g) or CO2(g), so it has no effect on the equilibrium position — ruling out (C). Decreasing the volume of the vessel, however, is true compression: it increases the concentrations of the gaseous species. Since the reactant side has 2 mol of gas (CO) while the product side has only 1 mol of gas (CO2; the solid carbon doesn't count), compression shifts the equilibrium toward the side with fewer gas moles — the product side — increasing the amount of CO2.`,
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
