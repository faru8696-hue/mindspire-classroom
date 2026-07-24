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
  '8.4': '4593c0bc-e9ff-453d-8e77-67fe57fdf12b',
  '8.5': '5246c332-452e-4883-b81d-61fa7b837084',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit8-topics8.4-8.5-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '8.4', image: 'u8b_q1_diagram.png',
    title: 'Q1 — pH After Mixing a Strong Acid and Strong Base',
    content: `A student combined 300.0 mL of 0.050 M HNO3(aq) with 500.0 mL of 0.032 M KOH(aq) and mixed the final solution thoroughly, forming 800.0 mL of combined solution (see the diagram above). The pH of the resulting solution should be closest to

(A) 2.90
(B) 7.00
(C) 8.30
(D) 11.10${JUSTIFY}`,
    answer: `(D). Moles HNO3 = 0.3000 L × 0.050 M = 0.0150 mol. Moles KOH = 0.5000 L × 0.032 M = 0.0160 mol. Since HNO3 and KOH react 1:1, HNO3 is completely consumed and KOH is in excess: excess OH⁻ = 0.0160 − 0.0150 = 0.0010 mol. This excess is now diluted into the total 800.0 mL: [OH⁻] = 0.0010 mol ÷ 0.800 L = 0.00125 M. pOH = −log(0.00125) ≈ 2.90. pH = 14.00 − 2.90 = 11.10.`,
  },
  {
    topic: '8.4', image: 'u8b_q2_table.png',
    title: 'Q2 — Relative Acid/Base Strength from an Equilibrium Constant',
    content: `OCl⁻(aq) + HF(aq) ⇌ HOCl(aq) + F⁻(aq)     Keq > 1

What are the relative strengths of the acids and bases in the reaction represented by the equation above? (See the answer-choice table above.)

(A) HF < HOCl; F⁻ < OCl⁻
(B) HF < HOCl; F⁻ > OCl⁻
(C) HF > HOCl; F⁻ < OCl⁻
(D) HF > HOCl; F⁻ > OCl⁻${JUSTIFY}`,
    answer: `(C). Since Keq > 1, the forward reaction (toward HOCl and F⁻) is favored at equilibrium. In any acid-base equilibrium, the reaction favors formation of the WEAKER acid and WEAKER base — so HOCl (product acid) and F⁻ (product base) must be the weaker species, while HF (reactant acid) and OCl⁻ (reactant base) must be the STRONGER species. This gives HF > HOCl (acid strength) and OCl⁻ > F⁻, equivalently F⁻ < OCl⁻ (base strength) — matching (C).`,
  },
  {
    topic: '8.5',
    title: 'Q3 — pH at the Equivalence Point for a Weak Acid Titration',
    content: `A solution of 0.10 M HNO2 (pKa = 3.40) is titrated with 0.20 M NaOH(aq). Which of the following identifies the pH at the equivalence point of the titration and provides the correct justification?

(A) pH = 7, because the concentration of NaOH is equal to that of HNO2.
(B) pH = 7, because the NO2⁻ ion is classified as a neutral ion.
(C) pH > 7, because the NO2⁻ ion behaves as a weak base in the solution.
(D) pH > 7, because the concentration of NaOH is greater than that of HNO2.${JUSTIFY}`,
    answer: `(C). At the equivalence point, all of the weak acid HNO2 has been converted into its conjugate base, NO2⁻. NO2⁻ is a weak base (the conjugate base of a weak acid always has some base character) and hydrolyzes water — NO2⁻(aq) + H2O(l) ⇌ HNO2(aq) + OH⁻(aq) — producing excess OH⁻ and making the solution basic (pH > 7). This rules out (A) and (B), which both incorrectly claim a neutral pH (only true for a strong acid/strong base titration, or if the resulting ion were truly neutral, which NO2⁻ is not). Choice (D) draws the wrong conclusion from an irrelevant comparison — the concentrations of the two reagents don't need to be equal for a titration to reach its equivalence point (equal moles is what matters, achieved automatically at the volume where stoichiometric neutralization is complete); it's the identity/hydrolysis behavior of NO2⁻, not any concentration mismatch, that makes the pH basic.`,
  },
  {
    topic: '8.5', image: 'u8b_q4_graph.png',
    title: 'Q4 — Determining Titrant Concentration from a Titration Curve',
    content: `A 50.0 mL sample of a 0.20 M monoprotic acid solution is titrated with a NaOH(aq) solution of unknown concentration. Based on the titration curve above (which shows the equivalence point reached at 25 mL of NaOH added), what is the molar concentration of the NaOH(aq) solution?

(A) 0.10 M
(B) 0.20 M
(C) 0.40 M
(D) 0.80 M${JUSTIFY}`,
    answer: `(C). Moles of acid = 0.0500 L × 0.20 M = 0.0100 mol. At the equivalence point, moles of NaOH added equal moles of acid (1:1 stoichiometry for a monoprotic acid): moles NaOH = 0.0100 mol, delivered in a volume of 25 mL = 0.0250 L (read from the graph's inflection point). [NaOH] = 0.0100 mol ÷ 0.0250 L = 0.40 M.`,
  },
  {
    topic: '8.5', image: 'u8b_q56_graph.png',
    title: 'Q5 — Effect of Indicator Overshoot on Calculated Acid Concentration',
    content: `A 50.0 mL sample of a monoprotic acid, HA, of unknown molarity is titrated. The pH of the resulting solution is measured with a pH meter and graphed as a function of the volume of 0.100 M NaOH added. The experimental data are shown in the graph above (equivalence point at 40.0 mL NaOH added).

A student carries out the same titration, but uses an indicator instead of a pH meter. If the indicator changes color slightly past the equivalence point, what will the student obtain for the calculated concentration of the acid?

(A) Slightly less than 0.0800 M
(B) Slightly more than 0.0800 M
(C) Slightly less than 0.125 M
(D) Slightly more than 0.125 M${JUSTIFY}`,
    answer: `(B). The true concentration, based on the graph's actual equivalence point (40.0 mL): moles NaOH at equivalence = 0.0400 L × 0.100 M = 0.00400 mol = moles HA, so [HA] = 0.00400 mol ÷ 0.0500 L = 0.0800 M. If the indicator changes color slightly PAST the true equivalence point, the student records a volume slightly GREATER than 40.0 mL as their endpoint, and calculates moles NaOH (and therefore moles HA) as slightly too high — leading them to calculate [HA] as slightly MORE than the true value of 0.0800 M.`,
  },
  {
    topic: '8.5', image: 'u8b_q56_graph.png',
    title: 'Q6 — Identifying a Weak Acid from Its Titration Curve',
    content: `Based on the titration curve above (equivalence point at 40.0 mL of 0.100 M NaOH added to 50.0 mL of a weak monoprotic acid), which of the following could be the identity of the weak acid?

(A) HOI with a Ka value of 2.3 × 10⁻¹¹
(B) HOCl with a Ka value of 2.9 × 10⁻⁸
(C) HC3H5O3 with a Ka value of 1.4 × 10⁻⁴
(D) HClO2 with a Ka value of 1.1 × 10⁻²${JUSTIFY}`,
    answer: `(C). At the half-equivalence point (half of 40.0 mL = 20.0 mL of NaOH added), pH = pKa for the weak acid being titrated. Reading the graph at V = 20.0 mL, the curve sits in its buffer plateau at approximately pH ≈ 4.3–4.5. Converting each answer choice's Ka to pKa: HOI (Ka = 2.3×10⁻¹¹) → pKa ≈ 10.6; HOCl (Ka = 2.9×10⁻⁸) → pKa ≈ 7.5; HC3H5O3, lactic acid (Ka = 1.4×10⁻⁴) → pKa ≈ 3.85; HClO2 (Ka = 1.1×10⁻²) → pKa ≈ 1.96. Only HC3H5O3's pKa (≈3.85) is reasonably close to the graph's observed half-equivalence pH (≈4.3–4.5); all the others are far too high or too low to match the curve shown.`,
  },
  {
    topic: '8.5', image: 'u8b_q7_full.png',
    title: 'Q7 — Classifying the Titration from Its Curve Shape',
    content: `A student performs an acid-base titration of a monoprotic acid HX and plots the experimental results in the graph above (points A, B, C along a gradual buffer-region rise, and point D sitting on the steep jump near the equivalence point at V ≈ 36 mL, where the pH reaches about 8.5 and continues rising toward ~12–13). Which of the following provides the correct information about this titration experiment? (See the answer-choice table above.)

(A) A strong acid was titrated with a strong base; pH = 7 at equivalence.
(B) A strong acid was titrated with a strong base; pH > 7 at equivalence.
(C) A weak acid was titrated with a strong base; pH = 7 at equivalence.
(D) A weak acid was titrated with a strong base; pH > 7 at equivalence.${JUSTIFY}`,
    answer: `(D). The curve shows a gradual, sloped buffer region (points A, B, C) before the equivalence jump — this buffering behavior only occurs when a WEAK acid is titrated (a strong acid's curve rises steeply from the very start, with no flat buffer region), ruling out (A) and (B). The equivalence point (near point D and just after) sits well above pH 7 (around 8–9, rising further afterward) — consistent with a weak acid's conjugate base hydrolyzing to make the equivalence-point solution basic. This rules out (C), which incorrectly claims pH = 7 (only true for a strong acid/strong base titration).`,
  },
  {
    topic: '8.5', image: 'u8b_q8_diagram.png',
    title: 'Q8 — Matching a Particle Diagram to a Point on a Titration Curve',
    content: `A student performs an acid-base titration of a monoprotic acid HX and plots the experimental results in the graph above (points A, B, C, D). The particle diagram shown above represents the relative amounts of major species (Na⁺, HX, and X⁻) in a sample of the solution in the flask at one point during the titration (water molecules omitted). Which of the points labeled on the titration curve is most likely to represent the point in the titration where the reaction mixture would be represented by this particle diagram?

(A) Point A
(B) Point B
(C) Point C
(D) Point D${JUSTIFY}`,
    answer: `(C). Counting the particle diagram: 4 Na⁺, 4 X⁻, and 2 HX (charge-balanced, since Na⁺ = X⁻ = 4). Since X⁻ was produced by neutralizing HX with NaOH while HX remaining reflects what hasn't yet reacted, the fraction of the acid already neutralized is X⁻ ÷ (X⁻ + HX) = 4 ÷ 6 ≈ 67%. If the equivalence point is at V = 36 mL (where D sits, right at the steep jump, representing ~100% neutralized with HX ≈ 0), then 67% neutralized corresponds to a volume of about 0.67 × 36 ≈ 24 mL — closer to point C (≈27 mL) than to point B (≈18 mL, the roughly 50%-neutralized half-equivalence point) or point A (≈9 mL, mostly un-neutralized). Since the diagram shows HX still present (ruling out point D, where the acid would be essentially fully consumed) but with X⁻ clearly outnumbering HX (ruling out points A and B, which would show HX as dominant or roughly equal to X⁻), point C is the best match.`,
  },
  {
    topic: '8.5', image: 'u8b_q9_full.png',
    title: 'Q9 — Reading pKa and Titrant Concentration from a Titration Curve',
    content: `Data collected during the titration of a 20.0 mL sample of a 0.10 M solution of a monoprotic acid with a solution of NaOH of unknown concentration are plotted in the graph above. Based on the data, which of the following are the approximate pKa of the acid and the molar concentration of the NaOH? (See the answer-choice table above.)

(A) pKa = 4.7; [NaOH] = 0.050 M
(B) pKa = 4.7; [NaOH] = 0.10 M
(C) pKa = 9.3; [NaOH] = 0.050 M
(D) pKa = 9.3; [NaOH] = 0.10 M${JUSTIFY}`,
    answer: `(B). The graph's equivalence point occurs at V = 20 mL (the steep jump's midpoint). At the half-equivalence point (V = 10 mL, half of 20 mL), pH = pKa; reading the graph at V = 10 mL gives pH ≈ 4.7, so pKa ≈ 4.7. Moles of acid = 0.0200 L × 0.10 M = 0.00200 mol. At equivalence, moles NaOH = moles acid = 0.00200 mol, delivered in 20 mL = 0.0200 L, so [NaOH] = 0.00200 mol ÷ 0.0200 L = 0.10 M.`,
  },
  {
    topic: '8.5', image: 'u8b_q10_table.png',
    title: 'Q10 — Comparing Equivalence-Point pH for Two Acids of Different Strength',
    content: `Solution | Acid | Ka
1 | CH3CO2H | 1.75 × 10⁻⁵
2 | CF3CO2H | 1.0 × 10⁰

Acid-dissociation constants of two acids are listed in the table above. A 20. mL sample of a 0.10 M solution of each acid is titrated to the equivalence point with 20. mL of 0.10 M NaOH. Which of the following is a true statement about the pH of the solutions at the equivalence point?

(A) Solution 1 has a higher pH at the equivalence point because CH3CO2H is the stronger acid.
(B) Solution 1 has a higher pH at the equivalence point because CH3CO2H has the stronger conjugate base.
(C) Solution 1 has a lower pH at the equivalence point because CH3CO2H is the stronger acid.
(D) Solution 1 has a lower pH at the equivalence point because CH3CO2H has the stronger conjugate base.${JUSTIFY}`,
    answer: `(B). CH3CO2H (Ka = 1.75×10⁻⁵) is a typical weak acid, while CF3CO2H (Ka = 1.0, an enormous Ka) is essentially fully dissociated — practically a strong acid. At the equivalence point, Solution 1 forms CH3CO2⁻, a genuinely weak base that hydrolyzes water and raises the pH above 7. Solution 2 forms CF3CO2⁻, the conjugate base of an extremely strong acid — such an extremely weak conjugate base barely hydrolyzes at all, so Solution 2's equivalence-point pH stays close to 7 (much like a strong acid/strong base titration). This makes Solution 1's pH higher — ruling out (C) and (D). Choice (A)'s justification is factually backwards: CH3CO2H is actually the WEAKER of the two acids (smaller Ka than CF3CO2H), not the stronger one. The correct reasoning is that CH3CO2H, being the weaker acid, has the STRONGER conjugate base (weaker acid ⟺ stronger conjugate base) — matching (B).`,
  },
  {
    topic: '8.5', image: 'u8b_q11_table.png',
    title: 'Q11 — Comparing Equivalence Volumes for a Strong vs. Weak Acid',
    content: `Acid | Concentration of Acid Solution (M) | Volume of Acid Solution (mL) | pH of Acid Solution
HClO4(aq) | 0.10 | 50.0 | 1.00
HClO(aq) | 0.10 | 50.0 | 4.27

Two different titration experiments are performed, in which a 50.0 mL sample of each acid, at a concentration of 0.10 M, is titrated with 0.10 M NaOH(aq). Which of the following statements correctly compares the volume of NaOH(aq) required to reach the equivalence point in each titration?

(A) HClO4 will require a greater volume of NaOH(aq) to reach the equivalence point.
(B) HClO will require a greater volume of NaOH(aq) to reach the equivalence point.
(C) Each acid will require the same volume of NaOH(aq) to reach the equivalence point.
(D) The volume of NaOH(aq) required to reach the equivalence point cannot be determined without knowing the values of Ka for HClO4(aq) and HClO(aq).${JUSTIFY}`,
    answer: `(C). The volume of NaOH needed to reach the equivalence point depends ONLY on the moles of acid present (matched 1:1 by moles of NaOH for these monoprotic acids) — not on whether the acid is strong or weak. Both HClO4 (a strong acid, hence its very low pH of 1.00) and HClO (a weak acid, hence its much higher pH of 4.27 despite the same concentration) start with the exact same concentration (0.10 M) and volume (50.0 mL), so both contain exactly 0.0050 mol of acid. Since both require the same moles of NaOH to neutralize, and the NaOH concentration is identical (0.10 M) in both titrations, both will require the same volume of NaOH to reach equivalence — the acid's strength (reflected in its Ka and initial pH) has no bearing on this stoichiometric calculation, ruling out (D) as well.`,
  },
  {
    topic: '8.4',
    title: 'Q12 — Which Species Increases as a Mixed Acid Solution Is Neutralized',
    content: `A solution containing HBr and the weak acid HC2H3O2 has a pH of 3.0. Enough NaOH(aq) is added to the solution to increase the pH to 11.0. The amount of which of the following species increases as the NaOH(aq) is added?

(A) Br⁻(aq)
(B) H⁺(aq)
(C) C2H3O2⁻(aq)
(D) HC2H3O2(aq)${JUSTIFY}`,
    answer: `(C). Br⁻ is a fully spectator ion from the strong acid HBr — its total amount never changes throughout the titration (it doesn't react with anything), ruling out (A). H⁺ decreases dramatically as NaOH is added (that's precisely what raises the pH from 3.0 to 11.0), ruling out (B). As NaOH neutralizes the weak acid HC2H3O2, it deprotonates it into its conjugate base, C2H3O2⁻ — this means the amount of undissociated HC2H3O2 DECREASES over the course of the titration (ruling out D), while the amount of C2H3O2⁻ correspondingly INCREASES as more and more of the weak acid gets converted into its conjugate base.`,
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
