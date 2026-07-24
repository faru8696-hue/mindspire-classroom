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
  '5.1': '8ea3ceda-7395-48bc-bdde-3a58093dc111',
  '5.2': 'fe05166f-4309-4dde-b21d-58e87f2630fb',
  '5.3': 'eb2817bb-f85b-45e0-ac52-39007347fe8d',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit5-topics5.1-5.3-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '5.1', image: 'u5q1_figures.png',
    title: 'Q1 — Surface Area and Reaction Rate (Particle Diagrams)',
    content: `Two samples of Mg(s) of equal mass were placed in equal amounts of HCl(aq) contained in two separate reaction vessels. Particle representations of the mixing of Mg(s) and HCl(aq) in the two reaction vessels are shown in Figure 1 and Figure 2 above. Water molecules are not included in the particle representations. Which of the reactions will initially proceed faster, and why?

(A) The reaction in Figure 1, because the atoms of Mg are more concentrated than those in Figure 2
(B) The reaction in Figure 1, because the Mg(s) in Figure 1 has a larger mass than the Mg(s) in Figure 2
(C) The reaction in Figure 2, because more Mg atoms are exposed to HCl(aq) in Figure 2 than in Figure 1
(D) The reaction in Figure 2, because the Mg(s) in Figure 2 has less surface area than the Mg(s) in Figure 1${JUSTIFY}`,
    answer: `(C). Both samples of Mg have equal mass, but in Figure 2 the Mg is broken into many smaller pieces rather than one large chunk. Breaking a solid into smaller pieces increases its total surface area without changing its mass, which exposes more Mg atoms directly to the surrounding HCl(aq) at any given moment. Since reaction rate depends on the frequency of effective collisions between reactant particles, the greater number of exposed Mg atoms in Figure 2 means collisions with H3O+ can occur more often, so the reaction in Figure 2 proceeds faster initially. (Choice D has the correct conclusion but the wrong reasoning — Figure 2 has MORE surface area, not less.)`,
  },
  {
    topic: '5.1', image: 'u5q2_table.png',
    title: 'Q2 — Fastest Trial from Particle Size and Concentration Data',
    content: `Na2CO3(s) + 2 HCl(aq) → 2 NaCl(aq) + H2O(l) + CO2(g)

A student performs an investigation to study factors that affect the rate of the reaction represented by the equation above. Data from four different experiments are shown in the table above. In each experiment, the student measures the time required for the reaction to go to completion. Based on the information in the data table, which trial should have the smallest value for time of reaction?

(A) Trial 1
(B) Trial 2
(C) Trial 3
(D) Trial 4${JUSTIFY}`,
    answer: `(B) Trial 2. Reaction rate increases with both smaller particle size (greater surface area) and higher reactant concentration. Trial 2 uses fine powder (largest surface area) AND the higher HCl concentration (2.00 M), so it combines both rate-increasing factors and should react fastest, giving it the smallest (shortest) time of reaction. Trial 3 has the same high concentration but a large chunk (less surface area, slower), and Trial 4 has fine powder but only the lower concentration (1.00 M, slower) — so neither combines both favorable factors the way Trial 2 does.`,
  },
  {
    topic: '5.1',
    title: 'Q3 — Relative Rates of Disappearance from Stoichiometry',
    content: `5 H2C2O4(aq) + 2 MnO4-(aq) + 6 H+(aq) → 2 Mn2+(aq) + 8 H2O(l) + 10 CO2(g)

In a titration experiment, H2C2O4(aq) reacts with MnO4-(aq) as represented by the equation above. At a certain time during the titration, the rate of disappearance of H2C2O4(aq) was 2.0 × 10⁻³ mol/(L·s). What was the rate of disappearance of MnO4-(aq) at the same time?

(A) 8.0 × 10⁻⁴ mol/(L·s)
(B) 2.0 × 10⁻³ mol/(L·s)
(C) 5.0 × 10⁻³ mol/(L·s)
(D) 8.0 × 10⁻³ mol/(L·s)${JUSTIFY}`,
    answer: `(A) 8.0 × 10⁻⁴ mol/(L·s). The balanced equation shows a 5:2 mole ratio between H2C2O4 and MnO4-. The rate of disappearance of MnO4- is therefore (2/5) times the rate of disappearance of H2C2O4: (2/5) × (2.0 × 10⁻³ mol/(L·s)) = 8.0 × 10⁻⁴ mol/(L·s). MnO4- disappears more slowly than H2C2O4 because fewer moles of it react for every mole of H2C2O4 consumed.`,
  },
  {
    topic: '5.2', image: 'u5q4_table.png',
    title: 'Q4 — Rate vs. Rate Constant When Concentrations Double',
    content: `H2(g) + I2(g) → 2 HI(g)

The rate law for the reaction represented by the equation above is rate = k[H2][I2]. Data from a kinetics experiment is shown in the table above. Which of the following statements is a correct comparison of trial 2 and trial 1?

(A) In trial 2, both the initial reaction rate and the value of the rate constant, k, are the same as those of trial 1.
(B) In trial 2, both the initial reaction rate and the value of the rate constant, k, are greater than those of trial 1.
(C) In trial 2, the initial reaction rate is greater than that of trial 1, and the value of the rate constant, k, is the same as that of trial 1.
(D) In trial 2, the initial reaction rate is the same as that of trial 1, and the value of the rate constant, k, is greater than that of trial 1.${JUSTIFY}`,
    answer: `(C). Doubling both [H2] and [I2] (from 1.0 M to 2.0 M each) increases the rate by a factor of 2 × 2 = 4 (rate = k[H2][I2]), so the initial reaction rate in trial 2 is greater than in trial 1. However, the rate constant k depends only on temperature, not on concentration — since both trials are run at the same temperature (500 K), k is unchanged between the two trials.`,
  },
  {
    topic: '5.3', image: 'u5q5_table.png',
    title: 'Q5 — Determining k for a First-Order Decomposition from Concentration Data',
    content: `The decomposition of substance X is studied by monitoring the concentration of X over time. The data from the experiment is shown in the table above. Which of the following is the rate constant, k, of the decomposition reaction?

(A) 0.173 min⁻¹
(B) 0.347 min⁻¹
(C) 2.77 min⁻¹
(D) 4.00 min⁻¹${JUSTIFY}`,
    answer: `(A) 0.173 min⁻¹. The ratio of [X] at each time point to [X] two minutes later is constant (5.76/4.07 ≈ 4.07/2.88 ≈ 2.88/2.04 ≈ ... ≈ 1.41 for every 2-minute interval), which is the signature of first-order kinetics (a constant multiplicative decrease over equal time intervals). For a first-order reaction, ln([X]₀/[X]) = kt. Using the first and last data points: ln(5.76/0.720) = ln(8.00) = 2.079 = k(12.0 min), so k = 2.079/12.0 = 0.173 min⁻¹.`,
  },
  {
    topic: '5.2', image: 'u5q6_table.png',
    title: 'Q6 — Which Reactant Is Consumed Faster (Stoichiometry vs. Rate Law)',
    content: `X(g) + 2 Y(g) → XY2(g)

In order to determine the order of the reaction represented above, the initial rate of formation of XY2 is measured using different initial values of [X] and [Y]. The results of the experiment are shown in the table above. Which of the following identifies the reactant that would be consumed more rapidly in Trial 2 and provides the correct justification?

(A) X, because it has a higher molar concentration.
(B) X, because the reaction is second order with respect to X.
(C) Y, because the reaction is second order with respect to Y.
(D) Y, because the rate of disappearance will be double that of X.${JUSTIFY}`,
    answer: `(D). Comparing Trial 1 to Trial 2 ([X] doubles, [Y] constant, rate quadruples: 8.0×10⁻³ → 3.2×10⁻²) shows the reaction is second order in X. Comparing Trial 2 to Trial 3 ([Y] doubles, [X] constant, rate doubles: 3.2×10⁻² → 6.4×10⁻²) shows the reaction is first order in Y. However, which reactant is consumed FASTER in any single trial is a question of stoichiometry, not rate law/order: the balanced equation shows 2 mol of Y are consumed for every 1 mol of X, so Y is always consumed at exactly twice the rate of X, regardless of the rate law. This makes (D) correct and (B)/(C) incorrect — the reaction orders determine how the OVERALL rate changes with concentration, not the relative consumption rates of X versus Y within a trial.`,
  },
  {
    topic: '5.2', image: 'u5q7_table.png',
    title: 'Q7 — Rate Law from Three-Trial Initial Rates Data',
    content: `2 XY(g) + 2 A2(g) → X2(g) + 2 A2Y(g)

The equation for the reaction between XY(g) and A2(g) is shown above. The initial rate of formation of X2 at 400 K is measured in different trials with various initial concentrations of the reactants, as shown in the table above. What is the experimental rate law for the reaction?

(A) rate = k[XY][A2]
(B) rate = k[XY]²[A2]
(C) rate = k[XY][A2]²
(D) rate = k[XY]²[A2]²${JUSTIFY}`,
    answer: `(C) rate = k[XY][A2]². Comparing Experiment 1 to Experiment 2 ([XY] doubles from 0.10 to 0.20 M, [A2] constant, rate doubles from 2.5×10⁻⁴ to 5.0×10⁻⁴) shows the reaction is first order in XY. Comparing Experiment 2 to Experiment 3 ([A2] quadruples from 0.10 to 0.40 M, [XY] constant, rate increases 16-fold from 5.0×10⁻⁴ to 8.0×10⁻³) shows the reaction is second order in A2 (since 4² = 16). Combining these gives rate = k[XY]¹[A2]².`,
  },
  {
    topic: '5.3', image: 'u5q8_table.png',
    title: 'Q8 — Identifying Rate Law Order from a Linear Data Column',
    content: `An experiment is performed to study the decomposition of the compound XY(g), which takes place in the presence of a solid catalyst. The concentration of XY(g) is monitored over time as it decomposes at 900 K. The data from the experiment are shown in the table above. Which of the following rate laws is consistent with the data?

(A) Rate = k
(B) Rate = k[XY]
(C) Rate = k[XY]²
(D) Rate = k / [XY]${JUSTIFY}`,
    answer: `(A) Rate = k. The [XY] column itself decreases by a constant amount every 100 s (0.20 → 0.16 → 0.12 → 0.08, a constant decrement of 0.04 mol/L each interval), meaning [XY] vs. time is linear. A linear [XY]-vs-time plot is the defining signature of a ZERO-order reaction, where rate = k (constant, independent of concentration). By contrast, neither ln[XY] nor 1/[XY] changes by a constant amount per interval in this data, which rules out first order (which would require ln[XY] to be linear in time) and second order (which would require 1/[XY] to be linear in time).`,
  },
  {
    topic: '5.3', image: 'u5q9_graphs.png',
    title: 'Q9 — Matching a Linear Graph Type to the Correct Rate Law',
    content: `The data from a kinetics experiment can be used to determine the rate law. Which of the following choices has correctly identified the rate law associated with the graph of experimental data for the decomposition of substance X?

(A) [X] vs. t is linear; rate = k[X]
(B) [X] vs. t is linear; rate = k[X]²
(C) ln[X] vs. t is linear; rate = k[X]
(D) ln[X] vs. t is linear; rate = k[X]²${JUSTIFY}`,
    answer: `(C). A linear plot of ln[X] versus time is the defining graphical signature of a first-order reaction, since the integrated first-order rate law ln[X] = ln[X]₀ − kt is itself a linear equation in ln[X] and t. The corresponding first-order rate law is rate = k[X]. A linear [X]-vs-t plot (as in choices A and B) would instead indicate zero order, and a rate law of k[X]² (second order) would require a linear 1/[X]-vs-t plot, not a linear ln[X]-vs-t plot — so (D) pairs a first-order graph with a second-order rate law incorrectly.`,
  },
  {
    topic: '5.3', image: 'u5q10_table.png',
    title: 'Q10 — Determining Both Order and Rate Constant from Data',
    content: `A sample of substance Q was placed in an evacuated container, and a decomposition reaction occurred. The concentration of Q was measured during the reaction and recorded in the table above. Based on the experimental data, which of the following represents the order of the reaction and the value of the rate constant, k?

(A) first order; k = 0.012 s⁻¹
(B) second order; k = 0.012 s⁻¹
(C) first order; k = 0.30 s⁻¹
(D) second order; k = 0.30 s⁻¹${JUSTIFY}`,
    answer: `(A) first order, k = 0.012 s⁻¹. The ln[Q] column decreases by a constant amount (0.3) every 25 s (2.0 → 1.7 → 1.4 → 1.1), meaning ln[Q] vs. time is linear — the signature of a first-order reaction. For a first-order reaction, the slope of the ln[Q]-vs-t line equals −k: slope = −0.3/25 s = −0.012 s⁻¹, so k = 0.012 s⁻¹.`,
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
