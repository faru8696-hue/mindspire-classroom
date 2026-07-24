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
  '7.11': '67b58ec6-c8c9-4fdd-8bb8-b00f0c102fa4',
  '7.12': '058942dc-79fe-44ce-ad41-bc029ca5893e',
  '7.13': 'd9895411-191b-48e3-9a4c-6028cabdb046',
  '7.14': '24ba5bc7-b7ec-4f3e-bdac-55b57e6f0fbc',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.11-7.14-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '7.11',
    title: 'Q1 — Finding [F⁻] from Ksp for BaF2',
    content: `The value of Ksp for the salt BaF2 is 1.84 × 10⁻⁷. The [F⁻] in a saturated solution of BaF2 is closest to

(A) 4.29 × 10⁻⁴ M
(B) 3.58 × 10⁻³ M
(C) 4.51 × 10⁻³ M
(D) 7.17 × 10⁻³ M${JUSTIFY}`,
    answer: `(D). BaF2(s) ⇌ Ba²⁺(aq) + 2 F⁻(aq). Let s = molar solubility of BaF2, so [Ba²⁺] = s and [F⁻] = 2s. Ksp = [Ba²⁺][F⁻]² = (s)(2s)² = 4s³ = 1.84 × 10⁻⁷, so s³ = 4.6 × 10⁻⁸, giving s = (4.6 × 10⁻⁸)^(1/3) ≈ 3.58 × 10⁻³ M. Since [F⁻] = 2s, [F⁻] ≈ 2(3.58 × 10⁻³) ≈ 7.17 × 10⁻³ M.`,
  },
  {
    topic: '7.11', image: 'u7c_q2_table.png',
    title: 'Q2 — Ranking Hydroxide Compounds by Solubility from Ksp',
    content: `Compound | Ksp
Cd(OH)2 | 7.2 × 10⁻¹⁵
Mg(OH)2 | 5.6 × 10⁻¹²
Ni(OH)2 | 5.5 × 10⁻¹⁶

Which of the following ranks the compounds listed in the table above in order of increasing solubility?

(A) Ni(OH)2 < Cd(OH)2 < Mg(OH)2
(B) Ni(OH)2 < Mg(OH)2 < Cd(OH)2
(C) Cd(OH)2 < Ni(OH)2 < Mg(OH)2
(D) Mg(OH)2 < Cd(OH)2 < Ni(OH)2${JUSTIFY}`,
    answer: `(A). All three compounds share the identical dissolution stoichiometry, M(OH)2 ⇌ M²⁺ + 2 OH⁻, so molar solubility s = (Ksp/4)^(1/3) for all of them — meaning a larger Ksp directly corresponds to greater solubility (no need to compute s individually, just rank the Ksp values). Ranking the given Ksp values from smallest to largest: Ni(OH)2 (5.5×10⁻¹⁶) < Cd(OH)2 (7.2×10⁻¹⁵) < Mg(OH)2 (5.6×10⁻¹²). Since solubility increases in the same order as Ksp for compounds with matching stoichiometry, this is also the order of increasing solubility.`,
  },
  {
    topic: '7.11', image: 'u7c_q3_table.png',
    title: 'Q3 — Predicting Which Salt(s) Precipitate from a Mixed Solution',
    content: `Compound | Ksp at 298 K
Ag2SO4 | 1 × 10⁻⁵
PbSO4 | 1 × 10⁻⁸

A 1.0 L solution of AgNO3(aq) and Pb(NO3)2(aq) has a Ag⁺ concentration of 0.020 M and a Pb²⁺ concentration of 0.0010 M. A 0.0010 mol sample of K2SO4(s) is added to the solution. Based on the information in the table above, which of the following will occur? (Assume that the volume change of the solution is negligible.)

(A) No precipitate will form.
(B) Only Ag2SO4(s) will precipitate.
(C) Only PbSO4(s) will precipitate.
(D) Both Ag2SO4(s) and PbSO4(s) will precipitate.${JUSTIFY}`,
    answer: `(C). Adding 0.0010 mol K2SO4 to 1.0 L gives [SO4²⁻] = 0.0010 M. For Ag2SO4: Q = [Ag⁺]²[SO4²⁻] = (0.020)²(0.0010) = 4.0 × 10⁻⁷, which is LESS than Ksp = 1 × 10⁻⁵, so no Ag2SO4 precipitates. For PbSO4: Q = [Pb²⁺][SO4²⁻] = (0.0010)(0.0010) = 1.0 × 10⁻⁶, which is GREATER than Ksp = 1 × 10⁻⁸, so PbSO4 does precipitate. Only PbSO4(s) will precipitate.`,
  },
  {
    topic: '7.11', image: 'u7c_q4_full.png',
    title: 'Q4 — What Happens to [Ca²⁺] as a Saturated Solution Evaporates',
    content: `The saturated CaF2 solution shown above (with excess solid CaF2(s) on the bottom of the beaker) is left uncovered on a lab counter at a constant temperature. Evaporation occurs slowly over a period of one week, and the total volume of the solution decreases. Which of the following choices correctly identifies what happens to the value of [Ca²⁺] in the solution during this time period and provides the correct justification? (See the answer-choice table above.)

(A) [Ca²⁺] increases; As water evaporates, some of the CaF2(s) on the bottom of the beaker dissolves in the solution.
(B) [Ca²⁺] increases; As water evaporates, more CaF2(s) precipitates out of the solution in the beaker.
(C) [Ca²⁺] remains the same; As water evaporates, some of the CaF2(s) on the bottom of the beaker dissolves in the solution.
(D) [Ca²⁺] remains the same; As water evaporates, more CaF2(s) precipitates out of the solution in the beaker.${JUSTIFY}`,
    answer: `(D). Since the temperature stays constant, Ksp does not change, and since excess solid CaF2(s) is present throughout, the solution remains saturated at every point during evaporation — meaning [Ca²⁺] must stay fixed at the same equilibrium value the whole time (ruling out both "increases" choices, A and B). As water evaporates and the solution's volume shrinks, if nothing else happened the ion concentrations would rise above the saturation point (Q > Ksp) — so instead, some of the dissolved Ca²⁺ and F⁻ ions must precipitate back out as additional solid CaF2(s), keeping the solution exactly at saturation. This matches (D): [Ca²⁺] remains the same because more CaF2(s) precipitates as water evaporates (not because more solid dissolves, which is the wrong direction — ruling out C).`,
  },
  {
    topic: '7.11', image: 'u7c_q5_diagram.png',
    title: 'Q5 — Using Q vs. Ksp to Predict Precipitation of PbCl2',
    content: `A student combines 50.0 mL of 0.040 M Pb(NO3)2(aq) with 50.0 mL of 0.040 M NaCl(aq). The mixture is stirred to ensure that it is thoroughly mixed and has a final volume of 100.0 mL (see the diagram above). The value of Ksp for PbCl2 is 1.7 × 10⁻⁵. Which of the following will occur in this experiment and why?

(A) PbCl2(s) will precipitate because Q > Ksp.
(B) PbCl2(s) will precipitate because Q < Ksp.
(C) PbCl2(s) will not precipitate because Q > Ksp.
(D) PbCl2(s) will not precipitate because Q < Ksp.${JUSTIFY}`,
    answer: `(D). After mixing, each original concentration is diluted by half (50.0 mL into a 100.0 mL total volume): [Pb²⁺] = 0.040 M × (50.0/100.0) = 0.020 M, and [Cl⁻] = 0.040 M × (50.0/100.0) = 0.020 M. Q = [Pb²⁺][Cl⁻]² = (0.020)(0.020)² = (0.020)(4.0 × 10⁻⁴) = 8.0 × 10⁻⁶. Since Q (8.0 × 10⁻⁶) is LESS than Ksp (1.7 × 10⁻⁵), the solution is unsaturated with respect to PbCl2, and no precipitate will form.`,
  },
  {
    topic: '7.12', image: 'u7c_q6_full.png',
    title: 'Q6 — The Common-Ion Effect on Ag2SO4 Solubility',
    content: `A student prepared two saturated solutions by adding an excess amount of Ag2SO4(s) to two different beakers, as shown in the diagram above. Beaker #1 contained distilled water, and beaker #2 contained 0.10 M Na2SO4(aq). The contents of each beaker were stirred thoroughly after the addition of Ag2SO4(s). At the end of the experiment, a small amount of undissolved Ag2SO4(s) was present in each beaker. Which of the following choices correctly compares the value of [Ag⁺] in each beaker at the end of the experiment and provides the correct justification? (See the answer-choice table above.)

(A) [Ag⁺] in beaker #2 is less than [Ag⁺] in beaker #1; The solubility of Ag2SO4 is reduced in beaker #2 because of the presence of a common ion, SO4²⁻.
(B) [Ag⁺] in beaker #2 is less than [Ag⁺] in beaker #1; The solubility of Ag2SO4 is increased in beaker #2 because of the presence of a common ion, SO4²⁻.
(C) [Ag⁺] in beaker #2 is greater than [Ag⁺] in beaker #1; The solubility of Ag2SO4 is reduced in beaker #2 because of the presence of a common ion, SO4²⁻.
(D) [Ag⁺] in beaker #2 is greater than [Ag⁺] in beaker #1; The solubility of Ag2SO4 is increased in beaker #2 because of the presence of a common ion, SO4²⁻.${JUSTIFY}`,
    answer: `(A). Beaker #2 already contains 0.10 M SO4²⁻ from the Na2SO4 before any Ag2SO4 dissolves. By Le Chatelier's principle, this extra "common ion" (SO4²⁻, a species also produced by Ag2SO4's own dissolution equilibrium: Ag2SO4(s) ⇌ 2 Ag⁺(aq) + SO4²⁻(aq)) shifts the equilibrium in reverse, suppressing how much Ag2SO4(s) dissolves compared to beaker #1's plain distilled water. This reduced solubility means less Ag⁺ enters solution in beaker #2, so [Ag⁺] in beaker #2 is LESS than in beaker #1 — matching (A), not (C) or (D) (both of which incorrectly claim beaker #2 has a higher [Ag⁺]). Choice (B) correctly identifies which beaker has the lower [Ag⁺] but gives the wrong justification (claiming solubility is increased, when the common-ion effect actually decreases it).`,
  },
  {
    topic: '7.12',
    title: 'Q7 — Which Change Decreases [Ba²⁺] in Saturated BaCO3',
    content: `BaCO3(s) ⇌ Ba²⁺(aq) + CO3²⁻(aq)

The dissolution of the slightly soluble salt BaCO3 is represented by the equation above. Which of the following changes will decrease [Ba²⁺] in a saturated solution of BaCO3, and why? (Assume that after each change some BaCO3(s) remains in contact with the solution.)

(A) Allowing some of the water to evaporate from the solution, because more BaCO3(s) will precipitate
(B) Adding a strong acid, because some CO3²⁻(aq) ions will be converted into CO2(aq) molecules
(C) Adding BaCO3(s), because the value of Q will become greater than Ksp
(D) Adding K2CO3(s), because the reaction will proceed toward reactants${JUSTIFY}`,
    answer: `(D). Adding K2CO3(s) introduces additional CO3²⁻, a common ion shared with the BaCO3 dissolution equilibrium. This shifts the equilibrium in reverse (toward the solid reactant, BaCO3(s)), consuming some of the dissolved Ba²⁺ as it recombines with the extra CO3²⁻ — genuinely decreasing [Ba²⁺]. Choice (A) is a trap: like the CaF2 evaporation scenario, evaporation at constant temperature just causes more BaCO3(s) to precipitate to KEEP [Ba²⁺] the same (fixed by Ksp), not to decrease it. Choice (B) is also a trap: adding acid consumes CO3²⁻ (converting it to CO2), which shifts the equilibrium FORWARD (dissolving MORE BaCO3(s) to replace the lost carbonate), thereby INCREASING [Ba²⁺] rather than decreasing it. Choice (C) is factually wrong: since BaCO3 is a pure solid, adding more of it does not change Q at all (solids don't appear in the equilibrium expression), so no shift occurs.`,
  },
  {
    topic: '7.13', image: 'u7c_q8_table.png',
    title: 'Q8 — Identifying Which Solution Increased the Solubility of Mg(OH)2',
    content: `Mg(OH)2(s) ⇌ Mg²⁺(aq) + 2 OH⁻(aq)

The dissolution of the slightly soluble salt Mg(OH)2 is represented by the equation above. A student has access to solutions of concentrated HNO3(aq) and concentrated KOH(aq) in the laboratory. The student added a small amount of one of these solutions to a beaker containing a saturated solution of Mg(OH)2. The student stirred the contents of the beaker and observed that all of the solid Mg(OH)2 dissolved completely. Which of the following identifies the solution that was added to the beaker and shows the chemical equation for a reaction that can be used to explain why the solubility of Mg(OH)2 increased in this experiment? (See the answer-choice table above.)

(A) HNO3; H⁺(aq) + OH⁻(aq) → H2O(l)
(B) HNO3; Mg²⁺(aq) + 2 NO3⁻(aq) → Mg(NO3)2(s)
(C) KOH; H⁺(aq) + OH⁻(aq) → H2O(l)
(D) KOH; Mg²⁺(aq) + 2 OH⁻(aq) → Mg(OH)2(s)${JUSTIFY}`,
    answer: `(A). Since solubility INCREASED (all the solid dissolved), the added solution must have consumed one of the ions that Mg(OH)2 produces — pulling the equilibrium forward. Adding acid (HNO3) supplies H⁺, which reacts with the dissolved OH⁻ (H⁺(aq) + OH⁻(aq) → H2O(l)), removing OH⁻ from solution and shifting the dissolution equilibrium forward to replace it, dissolving more Mg(OH)2 — matching (A). Choice (B) proposes a reaction (Mg²⁺ combining with NO3⁻ to form a solid) that doesn't actually occur — Mg(NO3)2 is a soluble salt, not a precipitate, so this reaction is fictitious and doesn't explain anything. Choices (C) and (D) both involve adding KOH, which supplies MORE of the common ion OH⁻ already present in the Mg(OH)2 equilibrium — this would suppress solubility via the common-ion effect (causing MORE solid to form, not less), the opposite of what was observed.`,
  },
  {
    topic: '7.13',
    title: 'Q9 — Effect of a Strong Acid on the Solubility of PbF2',
    content: `PbF2(s) ⇌ Pb²⁺(aq) + 2 F⁻(aq)

The dissolution of the slightly soluble salt PbF2 is represented by the equation above. Which of the following best explains how the solubility of PbF2 is affected when a small amount of a strong acid is added to a saturated solution of PbF2?

(A) The H⁺(aq) ions react with the Pb²⁺(aq) ions; the formation of solid PbF2 is favored, decreasing the solubility of PbF2.
(B) The H⁺(aq) ions react with the Pb²⁺(aq) ions; the formation of aqueous ions is favored, increasing the solubility of PbF2.
(C) The H⁺(aq) ions react with the F⁻(aq) ions; the formation of solid PbF2 is favored, decreasing the solubility of PbF2.
(D) The H⁺(aq) ions react with the F⁻(aq) ions; the formation of aqueous ions is favored, increasing the solubility of PbF2.${JUSTIFY}`,
    answer: `(D). F⁻ is the conjugate base of the weak acid HF, so added H⁺ ions react with F⁻(aq) to form HF (not with Pb²⁺, which has no acid-base relationship with H⁺ — ruling out A and B). Removing F⁻ from solution this way shifts the PbF2 dissolution equilibrium FORWARD (favoring the formation of more dissolved/aqueous ions) to replace the consumed F⁻, which increases the solubility of PbF2 — matching (D), not (C) (which incorrectly claims solid formation is favored, decreasing solubility — the opposite of what actually happens when a common ion is removed from an equilibrium).`,
  },
  {
    topic: '7.14', image: 'u7c_q10_table.png',
    title: 'Q10 — Signs of ΔH° and ΔS° for an Endothermic, Spontaneous Dissolution',
    content: `NH4NO3(s) ⇌ NH4⁺(aq) + NO3⁻(aq)

The dissolution of solid ammonium nitrate, NH4NO3(s), in water is represented by the equation above. A sample of NH4NO3(s) is added to water at a temperature of 25°C. The mixture is stirred and the solid dissolves completely. The temperature of the solution decreases during the dissolving process. Which of the following indicates the correct signs of the change in enthalpy and the change in entropy for the dissolution of NH4NO3(s) in water? (See the answer-choice table above.)

(A) ΔH° negative; ΔS° negative
(B) ΔH° negative; ΔS° positive
(C) ΔH° positive; ΔS° negative
(D) ΔH° positive; ΔS° positive${JUSTIFY}`,
    answer: `(D). The solution's temperature DECREASES during dissolution, meaning the process absorbs thermal energy from its surroundings (the solution itself) — this makes the dissolution endothermic, so ΔH° is POSITIVE (ruling out A and B, both of which claim ΔH° is negative). Dissolving a solid crystal lattice into freely moving, independently hydrated ions in solution increases the disorder/number of accessible microstates of the system, so ΔS° is POSITIVE for this process (ruling out C). Despite being endothermic, the dissolution still occurs spontaneously (the solid "dissolves completely" as stated) because the positive ΔS° term, multiplied by temperature, is large enough to make ΔG° = ΔH° − TΔS° negative overall — this is a classic example of an entropy-driven, endothermic-yet-spontaneous process.`,
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
