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
  '7.1': 'd017b6b8-d855-49de-bdca-8ddd4252363a',
  '7.2': '1a61223f-56bd-4a5b-909e-352a03247b49',
  '7.3': 'cdbbb615-776f-4e4d-bf8f-471e8995ab7c',
  '7.4': 'ff5b05ae-244c-4c42-bf7d-e278a3708978',
  '7.5': '7d7121ce-6c53-4332-a616-f6ef85cd65a6',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.1-7.5-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '7.1', image: 'u7q1_full.png',
    title: 'Q1 — Comparing Forward and Reverse Rates Before Equilibrium',
    content: `2 Cl2(g) + O2(g) ⇌ 2 Cl2O(g)

Equimolar amounts of Cl2(g) and O2(g) are injected into a previously evacuated rigid reaction vessel, where they react according to the equation above. The partial pressures of the gases in the reaction vessel are monitored at constant temperature and recorded in the table above.

Which of the following correctly compares the rate of the forward reaction with the rate of the reverse reaction between times t2 and t3, and provides the correct justification? (See the pressure-vs-time table and answer-choice table above.)

(A) The rate of the forward reaction is equal to the rate of the reverse reaction; the partial pressure of the product decreases.
(B) The rate of the forward reaction is equal to the rate of the reverse reaction; the partial pressure of the product increases.
(C) The rate of the forward reaction is greater than the rate of the reverse reaction; the partial pressure of the product decreases.
(D) The rate of the forward reaction is greater than the rate of the reverse reaction; the partial pressure of the product increases.${JUSTIFY}`,
    answer: `(D). The table shows the partial pressure of the product, Cl2O, is still increasing between t2 (0.15 atm) and t3 (0.21 atm) — the system has not yet reached equilibrium (which occurs at t4/t5, where all three pressures become constant at 0.25/0.38/0.25). Since the forward reaction is still net "winning" (product concentration still rising), the rate of the forward reaction must be greater than the rate of the reverse reaction during this interval — the two rates only become equal once equilibrium is reached (choices A and B, which claim the rates are already equal, are incorrect because pressures are still changing). The correct justification is that the partial pressure of the product (Cl2O) is increasing, not decreasing, ruling out (C).`,
  },
  {
    topic: '7.4',
    title: 'Q2 — Finding Initial Pressure from Kp and Equilibrium Pressure',
    content: `2 XY(g) ⇌ X2(g) + Y2(g)     Kp = 9.00

A pure sample of XY(g) is pumped into a previously evacuated, rigid container and allowed to attain the equilibrium shown above at a constant temperature. If the partial pressure of XY(g) is equal to 0.500 atm at equilibrium, what was the initial pressure of XY(g) in the container?

(A) 1.00 atm
(B) 1.50 atm
(C) 3.00 atm
(D) 3.50 atm${JUSTIFY}`,
    answer: `(D). Let P0 be the initial pressure of XY, and let 2x be the amount of XY consumed, producing x atm of X2 and x atm of Y2 (equal amounts, from the 1:1 product stoichiometry starting from pure XY). At equilibrium, P_XY = P0 − 2x = 0.500 atm. Using the equilibrium expression: Kp = (P_X2)(P_Y2)/(P_XY)² = x²/(0.500)² = 9.00, so x² = 9.00 × 0.250 = 2.25, giving x = 1.50 atm. The initial pressure is then P0 = 0.500 + 2(1.50) = 0.500 + 3.00 = 3.50 atm.`,
  },
  {
    topic: '7.1', image: 'u7q3_table.png',
    title: 'Q3 — How the Forward Rate Changes While Approaching Equilibrium',
    content: `PCl5(g) ⇌ PCl3(g) + Cl2(g)

PCl5(g) decomposes into PCl3(g) and Cl2(g) according to the equation above. A pure sample of PCl5(g) is placed in a rigid, evacuated container. The initial pressure of the PCl5(g) is 1.00 atm. The temperature is held constant until the system reaches a state of equilibrium. Information about the initial and the equilibrium conditions of the system is listed in the table above.

As the reaction progresses toward equilibrium, the rate of the forward reaction

(A) increases until it becomes the same as the reverse reaction rate at equilibrium
(B) stays constant before and after equilibrium is reached
(C) decreases to become a constant nonzero rate at equilibrium
(D) decreases to become zero at equilibrium${JUSTIFY}`,
    answer: `(C). The rate of the forward (decomposition) reaction depends on the concentration of PCl5, which is highest at the very start (pure PCl5, no products yet) and steadily decreases as PCl5 is consumed — this rules out (A), which incorrectly claims the forward rate increases. At equilibrium, the system reaches a dynamic balance where the forward rate equals the (now also nonzero) reverse rate — both rates are constant and equal, but NOT zero, since equilibrium is dynamic (reactions continue in both directions, just at equal rates). This rules out (D) (rate does not go to zero) and (B) (the rate is not constant throughout — only after equilibrium is reached does it stabilize).`,
  },
  {
    topic: '7.4',
    title: 'Q4 — Calculating Kc from Initial Moles and Equilibrium Amount',
    content: `2 AX2(g) ⇌ A2X4(g)

The synthesis of A2X4(g) is represented by the equation above. A 0.700 mol sample of AX2(g) is placed in a rigid 1.00 L reaction vessel and allowed to reach equilibrium at a certain temperature. What is the value of Kc at this temperature if 0.200 mol of A2X4(g) is present at equilibrium?

(A) 0.450
(B) 0.667
(C) 0.800
(D) 2.22${JUSTIFY}`,
    answer: `(D). If 0.200 mol of A2X4 formed, then 2 × 0.200 = 0.400 mol of AX2 must have been consumed (2:1 stoichiometry). Remaining AX2 at equilibrium = 0.700 − 0.400 = 0.300 mol, so [AX2] = 0.300 M and [A2X4] = 0.200 M (1.00 L vessel). Kc = [A2X4] / [AX2]² = 0.200 / (0.300)² = 0.200 / 0.0900 = 2.22.`,
  },
  {
    topic: '7.3', image: 'u7q5_full.png',
    title: 'Q5 — Comparing Qp to Kp at a Given Time',
    content: `2 F2(g) + O2(g) ⇌ 2 OF2(g)

Equimolar amounts of F2(g) and O2(g) are placed in a previously evacuated rigid reaction vessel, where they react according to the equation above. The partial pressures of the gases in the reaction vessel are monitored at constant temperature and recorded in the table above.

Which of the following provides the correct information about the system at time t4? (See the pressure-vs-time table and answer-choice table above.)

(A) 2.6; Qp is less than Kp
(B) 4.6; Qp is less than Kp
(C) 2.6; Qp is greater than Kp
(D) 4.6; Qp is greater than Kp${JUSTIFY}`,
    answer: `(B). At t4: P_F2 = 0.36, P_O2 = 0.68, P_OF2 = 0.64. Qp = (P_OF2)² / [(P_F2)²(P_O2)] = (0.64)² / [(0.36)² × 0.68] = 0.4096 / 0.08813 ≈ 4.6. The system reaches equilibrium at t5/t6, where P_F2 = 0.30, P_O2 = 0.65, P_OF2 = 0.70: Kp = (0.70)² / [(0.30)² × 0.65] = 0.49 / 0.0585 ≈ 8.4. Since Qp (≈4.6) at t4 is less than Kp (≈8.4), the reaction has not yet reached equilibrium and still must shift further in the forward direction (consistent with the product's partial pressure continuing to rise from t4 to t5).`,
  },
  {
    topic: '7.4',
    title: 'Q6 — Calculating Kp from a Total-Pressure Change',
    content: `COCl2(g) ⇌ CO(g) + Cl2(g)

COCl2(g) decomposes according to the equation above. When pure COCl2(g) is injected into a rigid, previously evacuated flask at 690 K, the pressure in the flask is initially 1.0 atm. After the reaction reaches equilibrium at 690 K, the total pressure in the flask is 1.2 atm. What is the value of Kp for the reaction at 690 K?

(A) 0.040
(B) 0.050
(C) 0.80
(D) 1.0${JUSTIFY}`,
    answer: `(B). Let x be the pressure of COCl2 that decomposes. Initial: P_COCl2 = 1.0 atm, P_CO = P_Cl2 = 0. At equilibrium: P_COCl2 = 1.0 − x, P_CO = x, P_Cl2 = x. Total pressure = (1.0 − x) + x + x = 1.0 + x = 1.2 atm, so x = 0.2 atm. At equilibrium: P_COCl2 = 0.8 atm, P_CO = P_Cl2 = 0.2 atm. Kp = (P_CO)(P_Cl2) / P_COCl2 = (0.2)(0.2) / 0.8 = 0.04 / 0.8 = 0.050.`,
  },
  {
    topic: '7.3', image: 'u7q7_table.png',
    title: 'Q7 — Comparing Qp to Kp After a Disturbance',
    content: `2 AX3(g) ⇌ 2 AX2(g) + X2(g)     Kp = 4.0 at 500 K

A chemist adds a pure sample of AX3(g) to a previously evacuated rigid reaction vessel. A decomposition reaction occurs at 500 K according to the equation above. The partial pressures of AX3(g), AX2(g), and X2(g) in the vessel are monitored over time, as shown in the table above.

At time t1, the system reaches equilibrium. At time t2, additional AX2(g) is injected into the reaction vessel, and the temperature of the reaction mixture is maintained at 500 K.

Which of the following statements concerning the system at time t3 is correct?

(A) Qp is less than Kp.
(B) Qp is equal to Kp.
(C) Qp is greater than Kp.
(D) The values of Qp and Kp cannot be compared without knowing the volume of the reaction vessel.${JUSTIFY}`,
    answer: `(B). At t3: P_AX3 = 2.32, P_AX2 = 5.06, P_X2 = 0.840. Qp = (P_AX2)²(P_X2) / (P_AX3)² = (5.06)²(0.840) / (2.32)² = (25.60 × 0.840) / 5.382 = 21.51 / 5.382 ≈ 4.0 — this matches Kp = 4.0 exactly, meaning the system has returned to a new equilibrium by time t3. This makes physical sense: injecting additional AX2 (a product) at t2 shifted the reaction in the reverse direction (consistent with Le Chatelier's principle), which is exactly what's observed — P_AX3 rose from 2.00 to 2.32, while P_AX2 and P_X2 both fell slightly (from 5.38 to 5.06, and from 1.00 to 0.840) as the system re-equilibrated. Choice (D) is incorrect because Kp and Qp are both expressed in terms of partial pressures directly (no volume needed for a Kp/Qp comparison).`,
  },
  {
    topic: '7.5',
    title: 'Q8 — Ranking Species Concentrations in a Phosphoric Acid Buffer',
    content: `H3PO4 ⇌ H⁺ + H2PO4⁻     Ka1 = 7.2 × 10⁻³
H2PO4⁻ ⇌ H⁺ + HPO4²⁻     Ka2 = 6.3 × 10⁻⁸
HPO4²⁻ ⇌ H⁺ + PO4³⁻     Ka3 = 4.5 × 10⁻¹³

A solution is prepared by mixing 50 mL of 1 M NaH2PO4 with 50 mL of 1 M Na2HPO4. On the basis of the information above, which of the following species is present in the solution at the lowest concentration?

(A) Na⁺
(B) HPO4²⁻
(C) H2PO4⁻
(D) PO4³⁻${JUSTIFY}`,
    answer: `(D). Mixing equal moles of NaH2PO4 and Na2HPO4 creates a buffer with substantial concentrations of both H2PO4⁻ and HPO4²⁻ (~0.5 M each), and an even higher concentration of Na⁺ (~1.5 M total, since Na2HPO4 contributes 2 Na⁺ per formula unit). PO4³⁻ is only produced via the third, extremely small dissociation constant, Ka3 = 4.5 × 10⁻¹³: [PO4³⁻] = Ka3[HPO4²⁻]/[H⁺]. Since the buffer's [H⁺] ≈ Ka2 = 6.3 × 10⁻⁸ M (equal concentrations of the Ka2 conjugate pair), [PO4³⁻] ≈ (4.5×10⁻¹³)(0.5)/(6.3×10⁻⁸) ≈ 3.6 × 10⁻⁶ M — many orders of magnitude smaller than the ~0.5 M to ~1.5 M concentrations of the other three species. The vanishingly small Ka3 is what makes PO4³⁻ the least abundant species by far.`,
  },
  {
    topic: '7.5',
    title: 'Q9 — Predicting Relative Concentrations from a Large Kc',
    content: `CO(g) + H2O(g) ⇌ CO2(g) + H2(g)     Kc = 1.5 × 10³

A 2.0 mol sample of CO(g) and a 2.0 mol sample of H2O(g) are introduced into a previously evacuated 100. L rigid container, and the temperature is held constant as the reaction represented above reaches equilibrium. Which of the following is true at equilibrium?

(A) [H2O] > [CO] and [CO2] > [H2]
(B) [H2O] > [H2]
(C) [CO2] > [CO]
(D) [CO] = [H2O] = [CO2] = [H2]${JUSTIFY}`,
    answer: `(C). Initial [CO] = [H2O] = 2.0 mol / 100. L = 0.020 M each, with no CO2 or H2 initially. Because CO and H2O start in equal amounts and react in a 1:1:1:1 ratio, [CO] = [H2O] and [CO2] = [H2] at every point during the reaction (ruling out choice A, which claims one is strictly greater than the other within each pair — they're actually equal, not unequal). Since Kc = 1.5 × 10³ is large, the equilibrium favors products heavily: solving x²/(0.020−x)² = 1500 gives x ≈ 0.0195 M, so [CO] = [H2O] ≈ 0.0005 M (small) while [CO2] = [H2] ≈ 0.0195 M (large). This means [CO2] is indeed much greater than [CO] (confirming C), while [H2O] (≈0.0005 M) is actually much LESS than [H2] (≈0.0195 M), making (B) false. Choice (D) is false since Kc ≠ 1, so the reactant and product concentrations are not equal at equilibrium.`,
  },
  {
    topic: '7.5', image: 'u7q10_table.png',
    title: 'Q10 — Total Equilibrium Pressure for a Reaction with a Huge Kp',
    content: `Samples of NO(g) and O2(g) are introduced into a previously evacuated rigid container at 300 K. The partial pressures of the gases in the container before any reaction occurs are shown in the table above (P_NO = 6.00 atm, P_O2 = 5.00 atm). The temperature is held constant at 300 K as the reaction represented by the equation shown below reaches equilibrium.

2 NO(g) + O2(g) ⇌ 2 NO2(g)     Kp = 2.4 × 10¹² at 300 K

Considering the value of Kp, the total pressure in the reaction vessel at equilibrium is closest to

(A) 6.00 atm
(B) 8.00 atm
(C) 9.00 atm
(D) 11.0 atm${JUSTIFY}`,
    answer: `(B). Since Kp = 2.4 × 10¹² is enormous, the reaction proceeds essentially to completion in the forward direction, limited only by stoichiometry. The 2:1 mole ratio of NO to O2 means 6.00 atm of NO would require 3.00 atm of O2 to fully react; since 5.00 atm of O2 is available (more than enough), NO is the limiting reactant and is essentially fully consumed. This produces 6.00 atm of NO2 and consumes 3.00 atm of O2, leaving: P_NO ≈ 0, P_O2 = 5.00 − 3.00 = 2.00 atm, P_NO2 = 6.00 atm. Total pressure ≈ 0 + 2.00 + 6.00 = 8.00 atm (equivalently, total moles decrease by 1 for every 2 mol NO reacted, so Δn_total = −6.00/2 = −3.00, giving 11.00 − 3.00 = 8.00 atm).`,
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
