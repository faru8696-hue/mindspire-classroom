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
  '9.1': 'd5cf1364-e871-44d5-81ac-bae2aea2c5b3',
  '9.2': '0b665475-c52e-40c9-aff3-709e07936a6a',
  '9.3': 'd6c38ef0-e004-47d2-beda-2da22f798927',
  '9.4': 'a8ba0aa1-a7c0-4cfe-8943-42b1a8c41c7e',
  '9.5': '1ac86406-d22d-4c4d-b801-577d177fb246',
  '9.6': '1dec5262-ca62-4038-bdfb-2e10a1747930',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit9-topics9.1-9.7-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '9.1',
    title: 'Q1 — Identifying a Reaction with a Negative Entropy Change',
    content: `Which of the following equations represents a reaction for which the standard entropy change is negative (ΔS° < 0)?

(A) 2 H2(g) + O2(g) → 2 H2O(g)
(B) 2 C2H6(g) + 7 O2(g) → 4 CO2(g) + 6 H2O(g)
(C) Mg(s) + 2 HCl(aq) → MgCl2(aq) + H2(g)
(D) (NH4)2CO3(s) → 2 NH3(g) + H2O(g) + CO2(g)${JUSTIFY}`,
    answer: `(A). Entropy change for a reaction is dominated by the change in the number of moles of gas. In (A), 3 mol of gas (2 H2 + 1 O2) become 2 mol of gas (2 H2O) — a decrease in moles of gas, giving ΔS° < 0. In (B), 9 mol of gas become 10 mol of gas — an increase (ΔS° > 0). In (C), the reactants have 0 mol of gas but the products include 1 mol of H2(g) — an increase (ΔS° > 0), on top of the general disorder increase from solid + aqueous → aqueous + gas. In (D), a solid decomposes into 4 total moles of gas — an enormous increase in moles of gas, strongly positive ΔS°. Only (A) decreases the moles of gas, giving the sole negative entropy change among the four.`,
  },
  {
    topic: '9.1', image: 'u9q2_diagrams.png',
    title: 'Q2 — Identifying the Greatest Positive ΔS° from Particulate Diagrams',
    content: `Which of the following particulate representations represents the change with the greatest positive value of ΔS°? (See the four labeled before/after diagrams above.)

(A) Diagram A
(B) Diagram B
(C) Diagram C
(D) Diagram D${JUSTIFY}`,
    answer: `(B). In diagram B, a fully ordered solid (16 tightly packed, arranged particles) completely converts into gas-phase diatomic molecules, freely dispersed throughout the container, with NO solid remaining — a complete solid-to-gas phase change, which produces by far the largest entropy increase of any of the four diagrams (gas has vastly greater entropy than a solid, and here the ENTIRE substance undergoes this transition). In diagram A, the substance is already gas-phase both before and after (just a different pairing/mixing of molecule types) — minimal entropy change. In diagram D, only PART of the original solid becomes gas while a solid block remains — a smaller entropy increase than the complete transition in B. In diagram C, some gas-phase molecules actually cluster together into an ordered solid-like block in the "after" diagram — this represents a DECREASE in entropy for at least part of the system, not the greatest increase.`,
  },
  {
    topic: '9.2', image: 'u9q3_table.png',
    title: 'Q3 — Calculating ΔS° from Standard Molar Entropies',
    content: `Substance | Standard Molar Entropy (J/(K·mol))
Cl2(g) | 223
NO(g) | 211
NOCl(g) | 262

The values of the standard molar entropies of three different substances are listed in the table above. Based on this information, which of the following is closest to the value of ΔS° for the reaction represented by the following equation?

Cl2(g) + 2 NO(g) → 2 NOCl(g)     ΔS° = ?

(A) −172 J/(K·molrxn)
(B) −121 J/(K·molrxn)
(C) +121 J/(K·molrxn)
(D) +172 J/(K·molrxn)${JUSTIFY}`,
    answer: `(B). ΔS° = ΣS°(products) − ΣS°(reactants) = 2(262) − [223 + 2(211)] = 524 − [223 + 422] = 524 − 645 = −121 J/(K·molrxn).`,
  },
  {
    topic: '9.2', image: 'u9q4_table.png',
    title: 'Q4 — Calculating a Standard Molar Entropy from ΔS° and Other Entropies',
    content: `H2(g) + Br2(g) → 2 HBr(g)     ΔS° = 20 J/(K·molrxn)

The formation of gaseous hydrogen bromide from hydrogen gas and bromine vapor is represented by the equation above. The values of the standard molar entropies of the reactants are listed in the table above (H2(g): 130 J/(K·mol); Br2(g): 250 J/(K·mol)). Based on this information, which of the following is closest to the value of the standard molar entropy of HBr(g)?

(A) 180 J/(K·mol)
(B) 200 J/(K·mol)
(C) 380 J/(K·mol)
(D) 400 J/(K·mol)${JUSTIFY}`,
    answer: `(B). ΔS° = 2 S°(HBr) − [S°(H2) + S°(Br2)] = 2 S°(HBr) − [130 + 250] = 2 S°(HBr) − 380 = 20. Solving: 2 S°(HBr) = 400, so S°(HBr) = 200 J/(K·mol).`,
  },
  {
    topic: '9.3',
    title: 'Q5 — Comparing the Magnitudes of TΔS° and ΔH°',
    content: `CO(g) + O3(g) → CO2(g) + O2(g)     ΔH° = −426 kJ/molrxn; ΔS° = −18 J/(K·molrxn)

The reaction between CO(g) and O3(g) is represented by the equation shown above. Which of the following is most likely to be true about this reaction at 298 K?

(A) ΔG° < 0 and TΔS° is smaller in magnitude than ΔH°.
(B) ΔG° < 0 and TΔS° is larger in magnitude than ΔH°.
(C) ΔG° > 0 and TΔS° is smaller in magnitude than ΔH°.
(D) ΔG° > 0 and TΔS° is larger in magnitude than ΔH°.${JUSTIFY}`,
    answer: `(A). TΔS° = 298 K × (−18 J/(K·mol)) = −5364 J/mol ≈ −5.4 kJ/mol. ΔG° = ΔH° − TΔS° = −426 − (−5.4) = −420.6 kJ/mol, which is negative — the reaction is thermodynamically favorable, ruling out (C) and (D). Comparing magnitudes: |TΔS°| ≈ 5.4 kJ/mol is much SMALLER than |ΔH°| = 426 kJ/mol, matching (A) — the favorability here is driven almost entirely by the large negative enthalpy, with the small entropy term barely affecting the result.`,
  },
  {
    topic: '9.3', image: 'u9q6_table.png',
    title: 'Q6 — Identifying a Reaction Favored Only at High Temperature',
    content: `Which of the following reactions is not thermodynamically favored at low temperatures but becomes favored as the temperature increases? (See the table of ΔH° and ΔS° values above.)

(A) 2 CO(g) + O2(g) → 2 CO2(g); ΔH° = −566 kJ/molrxn, ΔS° = −173 J/(K·molrxn)
(B) 2 H2O(g) → 2 H2(g) + O2(g); ΔH° = 484 kJ/molrxn, ΔS° = 90.0 J/(K·molrxn)
(C) 2 N2O(g) → 2 N2(g) + O2(g); ΔH° = −164 kJ/molrxn, ΔS° = 149 J/(K·molrxn)
(D) PbCl2(s) → Pb²⁺(aq) + 2 Cl⁻(aq); ΔH° = 23.4 kJ/molrxn, ΔS° = −12.5 J/(K·molrxn)${JUSTIFY}`,
    answer: `(B). A reaction that is unfavorable at low T but becomes favorable as T increases requires ΔH° > 0 (unfavorable enthalpy term dominating at low T, where ΔG° ≈ ΔH° > 0) combined with ΔS° > 0 (so that as T grows, the increasingly negative −TΔS° term eventually overtakes the positive ΔH°, flipping ΔG° negative at high T). Only (B) has this exact combination (ΔH° = +484, ΔS° = +90.0). Choice (A) has both terms negative — favorable at all temperatures, actually becoming LESS favorable (not more) as T increases. Choice (C) has ΔH° negative and ΔS° positive — favorable at all temperatures (both terms push ΔG° negative). Choice (D) has ΔH° positive and ΔS° negative — unfavorable at all temperatures (both terms push ΔG° positive), never becoming favored.`,
  },
  {
    topic: '9.3',
    title: 'Q7 — Determining Whether ΔH° or ΔS° Drives a Reaction\'s Favorability',
    content: `2 Na2O2(s) + S(s) + 2 H2O(l) → 4 NaOH(aq) + SO2(aq)     ΔH° = −610 kJ/molrxn; ΔS° = −7.3 J/(K·molrxn)

When water is added to a mixture of Na2O2(s) and S(s), a redox reaction occurs, as represented by the equation above. Which of the following statements about the thermodynamic favorability of the reaction at 298 K is correct?

(A) It is thermodynamically unfavorable.
(B) It is thermodynamically favorable and is driven by ΔS° only.
(C) It is thermodynamically favorable and is driven by ΔH° only.
(D) It is thermodynamically favorable and is driven by both ΔH° and ΔS°.${JUSTIFY}`,
    answer: `(C). TΔS° = 298 × (−7.3) = −2175 J/mol ≈ −2.2 kJ/mol. ΔG° = ΔH° − TΔS° = −610 − (−2.2) = −607.8 kJ/mol, which is negative — the reaction is thermodynamically favorable, ruling out (A). Since ΔS° is negative, the entropy term (−TΔS°) is actually POSITIVE (unfavorable) here — it works against favorability, not for it, ruling out both (B) and (D) (which credit ΔS° with contributing favorably). The overwhelmingly large, negative ΔH° (−610 kJ/mol) is entirely responsible for the reaction's favorability, easily overcoming the small unfavorable entropy contribution — matching (C).`,
  },
  {
    topic: '9.4',
    title: 'Q8 — Why a Thermodynamically Favorable Reaction Doesn\'t Occur',
    content: `CO(g) + 2 H2(g) → CH3OH(g)     ΔH° < 0 and ΔG° < 0 at 298 K

A 1.0 mol sample of CO(g) and a 1.0 mol sample of H2(g) are placed in a previously evacuated 10.0 L vessel at 298 K. Even though the reaction represented by the equation above is thermodynamically favorable, the formation of CH3OH(g) is not observed. Which of the following best explains why CH3OH(g) is not produced at 298 K?

(A) At 298 K, the energy of most molecular collisions is lower than the activation energy for the reaction.
(B) At 298 K, some CH3OH(g) must first be present in the vessel in order for the reaction to occur.
(C) The CO(g) and the H2(g) must be mixed in a 1-to-2 mole ratio in order for the reaction to occur.
(D) The rate of the reaction is extremely slow because the value of ΔH° is negative.${JUSTIFY}`,
    answer: `(A). Thermodynamic favorability (a negative ΔG°) only indicates that a reaction is spontaneous — it says nothing about how FAST the reaction proceeds. This reaction has a large activation energy, and at 298 K, most molecular collisions simply don't carry enough kinetic energy to overcome that barrier, so the reaction proceeds too slowly to observe any product formation. Choice (B) is false — CH3OH is a product, not a required catalyst or reactant. Choice (C) is a red herring: the 1.0 mol : 1.0 mol ratio given doesn't actually match the reaction's 1:2 stoichiometry, but that's irrelevant to why the reaction doesn't proceed noticeably — even a perfectly stoichiometric mixture would react at the same (very slow) rate at this temperature. Choice (D) reflects a common misconception: the sign of ΔH° determines whether a reaction is exothermic, not how fast it proceeds — reaction rate depends on activation energy, not on ΔH°.`,
  },
  {
    topic: '9.4',
    title: 'Q9 — Why a Spark Is Needed Despite Thermodynamic Favorability',
    content: `2 H2(g) + O2(g) → 2 H2O(g)     ΔH° = −484 kJ/molrxn; ΔS° = −89 J/(K·molrxn)

When H2(g) and O2(g) are mixed together in a rigid reaction vessel at 298 K, no reaction occurs. When the mixture is sparked, however, the gases react vigorously according to the equation above. Which of the following statements correctly explains why the spark is needed for the reaction to occur when the gases are originally at 298 K?

(A) The reaction is not thermodynamically favorable at 298 K.
(B) The reaction rate is very slow at 298 K because ΔH° < 0.
(C) The reaction rate is very slow at 298 K because ΔS° < 0.
(D) The reaction has a large activation energy at 298 K.${JUSTIFY}`,
    answer: `(D). Checking thermodynamic favorability: TΔS° = 298 × (−89) = −26,522 J/mol ≈ −26.5 kJ/mol, so ΔG° = ΔH° − TΔS° = −484 − (−26.5) = −457.5 kJ/mol, which is very negative — the reaction IS thermodynamically favorable at 298 K, ruling out (A). Despite being spontaneous, the reaction doesn't proceed on its own because it has a large activation energy — at 298 K, essentially no molecules have enough energy to react, and a spark provides the initial burst of energy needed to get some molecules over that barrier (after which the reaction's own exothermicity sustains it). Choices (B) and (C) both incorrectly attribute the slow rate to the signs of ΔH° or ΔS° — reaction rate is governed by activation energy, not by these thermodynamic quantities.`,
  },
  {
    topic: '9.5',
    title: 'Q10 — Determining Thermodynamic Favorability by Combining Equilibrium Constants',
    content: `FeF2(s) ⇌ Fe²⁺(aq) + 2 F⁻(aq)     K1 = 2 × 10⁻⁶
F⁻(aq) + H⁺(aq) ⇌ HF(aq)     K2 = 1 × 10³
FeF2(s) + 2 H⁺(aq) ⇌ Fe²⁺(aq) + 2 HF(aq)     K3 = ?

On the basis of the information above, the dissolution of FeF2(s) in acidic solution is

(A) thermodynamically favorable, because K2 > 1
(B) thermodynamically favorable, because K3 > 1
(C) not thermodynamically favorable, because K1 < 1
(D) not thermodynamically favorable, because K3 < 1${JUSTIFY}`,
    answer: `(B). The target reaction (dissolution of FeF2 in ACIDIC solution) is represented by the third equation, so K3 — not K1 or K2 individually — is what determines its favorability. K3 is obtained by adding the first equation to TWICE the second equation: K3 = K1 × (K2)² = (2×10⁻⁶) × (1×10³)² = (2×10⁻⁶) × (1×10⁶) = 2.0. Since K3 = 2.0 > 1, the dissolution of FeF2 in acidic solution is thermodynamically favorable — matching (B). Choices (A) and (C) cite the wrong equilibrium constants for the actual reaction in question (K2 alone describes only the HF-formation step, and K1 alone describes dissolution in pure water, not acid). Choice (D) is simply factually incorrect: K3 = 2.0, which is greater than 1, not less than 1.`,
  },
  {
    topic: '9.5',
    title: 'Q11 — How Keq Depends on Temperature for a Reaction with ΔH° < 0 and ΔS° < 0',
    content: `A reaction is known to have a negative value of ΔH° and a negative value of ΔS°. Which of the following statements correctly describes the equilibrium constant, Keq, for this reaction?

(A) Keq will be less than 1 at all temperatures.
(B) Keq will be greater than 1 at all temperatures.
(C) Keq will be greater than 1 only at low temperatures.
(D) Keq will be greater than 1 only at high temperatures.${JUSTIFY}`,
    answer: `(C). ΔG° = ΔH° − TΔS°, and Keq > 1 exactly when ΔG° < 0. With ΔH° < 0 and ΔS° < 0, the term −TΔS° is always POSITIVE and grows in magnitude as T increases. At LOW temperatures, this positive −TΔS° term is small, so ΔG° ≈ ΔH° < 0 (favorable, Keq > 1). At sufficiently HIGH temperatures, the growing positive −TΔS° term eventually overtakes the negative ΔH°, making ΔG° > 0 (unfavorable, Keq < 1). This means Keq > 1 only at low temperatures, and Keq < 1 at high temperatures — matching (C), not (A), (B), or (D).`,
  },
  {
    topic: '9.2', image: 'u9q12_full.png',
    title: 'Q12 — Signs of ΔH° and ΔS° for Each Step of Dissolving NaCl in Water',
    content: `The process of dissolution of NaCl(s) in H2O(l) is represented in the diagram above (water molecules approaching an NaCl ionic lattice, then forming hydrated Na⁺ and Cl⁻ ions surrounded by oriented water molecules). Which of the following summarizes the signs of ΔH° and ΔS° for each part of the dissolution process? (See the answer-choice table above.)

(A) Breaking solvent-solvent: ΔH°(+), ΔS°(+); Breaking solute-solute: ΔH°(+), ΔS°(+); Forming solute-solvent: ΔH°(−), ΔS°(−)
(B) Breaking solvent-solvent: ΔH°(+), ΔS°(+); Breaking solute-solute: ΔH°(+), ΔS°(+); Forming solute-solvent: ΔH°(−), ΔS°(+)
(C) Breaking solvent-solvent: ΔH°(−), ΔS°(−); Breaking solute-solute: ΔH°(−), ΔS°(−); Forming solute-solvent: ΔH°(+), ΔS°(+)
(D) Breaking solvent-solvent: ΔH°(−), ΔS°(+); Breaking solute-solute: ΔH°(−), ΔS°(+); Forming solute-solvent: ΔH°(+), ΔS°(−)${JUSTIFY}`,
    answer: `(A). Breaking any intermolecular or ionic interaction always requires an input of energy (endothermic, ΔH° positive) and increases disorder as the organized structure is disrupted (ΔS° positive) — this applies to both breaking the water-water hydrogen-bonding network (solvent-solvent) and breaking apart the rigid NaCl ionic lattice (solute-solute), ruling out (C) and (D), which incorrectly assign negative signs to these breaking steps. Forming the new solute-solvent interactions (water molecules orienting around and hydrating the separated Na⁺ and Cl⁻ ions) releases energy (exothermic, ΔH° negative) as new attractive interactions form, but also DECREASES entropy (ΔS° negative), since the water molecules become more ordered/restricted as they arrange into organized hydration shells around each ion — matching (A), not (B) (which incorrectly gives this step a positive ΔS°).`,
  },
  {
    topic: '9.6',
    title: 'Q13 — Combining ΔG° Values Using Hess\'s Law',
    content: `Reaction 1: 4 NH3(g) + 5 O2(g) → 4 NO(g) + 6 H2O(l)     ΔG° = −1011 kJ/molrxn
Reaction 2: 2 NO2(g) → 2 NO(g) + O2(g)     ΔG° = 71 kJ/molrxn
Reaction 3: 4 NO2(g) + O2(g) + 2 H2O(l) → 4 HNO3(aq)     ΔG° = −166 kJ/molrxn

Based on the values of ΔG° for the three reactions represented above, what is the value of ΔG° for the reaction represented below?

4 NH3(g) + 8 O2(g) → 4 HNO3(aq) + 4 H2O(l)

(A) −1035 kJ/molrxn
(B) −1106 kJ/molrxn
(C) −1248 kJ/molrxn
(D) −1319 kJ/molrxn${JUSTIFY}`,
    answer: `(D). Combine Reaction 1 (as given), twice the REVERSE of Reaction 2 (to convert the 4 mol NO produced by Reaction 1 into 4 mol NO2, needed as a reactant for Reaction 3), and Reaction 3 (as given). Reversing Reaction 2 and doubling it: 4 NO(g) + 2 O2(g) → 4 NO2(g), ΔG° = 2 × (−71) = −142 kJ/molrxn. Adding all three: [4NH3 + 5O2 → 4NO + 6H2O] + [4NO + 2O2 → 4NO2] + [4NO2 + O2 + 2H2O → 4HNO3]. The 4 mol NO and 4 mol NO2 cancel, and 2 mol H2O(l) on the reactant side cancels against 6 mol H2O(l) on the product side, leaving a net 4 mol H2O(l) as product; total O2 = 5 + 2 + 1 = 8 mol — exactly matching the target equation (4 NH3 + 8 O2 → 4 HNO3(aq) + 4 H2O(l)). Total ΔG° = −1011 + (−142) + (−166) = −1319 kJ/molrxn.`,
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
