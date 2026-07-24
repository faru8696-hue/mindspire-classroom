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
  '6.6': 'ae92bf0e-7e5b-4874-934b-02f1c6948553',
  '6.7': '13298cef-b1a4-466b-bedc-3ec4cc6bc3ea',
  '6.8': 'c0aa92dc-39f2-4287-96f0-e83b4a92aa6d',
  '6.9': 'c6574754-0095-4733-a17a-9c1fa703dbbe',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit6-topics6.6-6.9-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '6.6',
    title: 'Q1 — Scaling Enthalpy Change from Per-Gram Data',
    content: `4 NH3(g) + 5 O2(g) → 4 CO2(g) + 6 H2O(l)     ΔH° = ?

It is observed that 13.0 kJ of energy is released when 1.00 g NH3(g) reacts completely with excess O2(g) under standard conditions according to the equation above. The value for the standard enthalpy change, ΔH°, for the reaction represented by the equation above is closest to

(A) −884 kJ/molrxn
(B) −221 kJ/molrxn
(C) +221 kJ/molrxn
(D) +884 kJ/molrxn${JUSTIFY}`,
    answer: `(A). First convert the per-gram heat to a per-mole (of NH3) value using NH3's molar mass (17.0 g/mol): 13.0 kJ/g × 17.0 g/mol = 221 kJ per mole of NH3 reacted. The balanced equation shows 4 mol of NH3 reacting per "mol rxn" as written, so scale up: ΔH per mol rxn = 221 kJ/mol NH3 × 4 mol NH3/mol rxn = 884 kJ/molrxn. Since the problem states energy is released (exothermic), the sign of ΔH° must be negative: ΔH° = −884 kJ/molrxn.`,
  },
  {
    topic: '6.6', image: 'u6b_q2_table.png',
    title: 'Q2 — Identifying the Limiting Reactant and Heat Released',
    content: `2 C2H2(g) + 5 O2(g) → 4 CO2(g) + 2 H2O(l)     ΔH° = −2600 kJ/molrxn

A mixture of 3.0 mol C2H2(g) and 6.0 mol O2(g) are added to a previously evacuated reaction vessel. The mixture is sparked, initiating a chemical reaction according to the equation above. Which of the following identifies the limiting reactant and the amount of heat (q) released under standard conditions? (See the answer-choice table above.)

(A) C2H2(g); 2600 kJ
(B) C2H2(g); 3900 kJ
(C) O2(g); 2600 kJ
(D) O2(g); 3100 kJ${JUSTIFY}`,
    answer: `(D). The balanced equation requires a 2:5 mole ratio of C2H2 to O2. For the available 3.0 mol C2H2, the amount of O2 needed would be 3.0 × (5/2) = 7.5 mol — but only 6.0 mol O2 is actually available, so O2 is the limiting reactant (this rules out both C2H2 answer choices). The reaction proceeds based on the O2 available: moles of "reaction" (as balanced, 1 mol rxn consumes 5 mol O2) = 6.0 mol O2 ÷ 5 = 1.2 mol rxn. Heat released: q = 1.2 mol rxn × 2600 kJ/molrxn = 3120 kJ ≈ 3100 kJ.`,
  },
  {
    topic: '6.6',
    title: 'Q3 — Calculating Heat Released Using Molar ΔH°',
    content: `2 Na(s) + 2 H2O(l) → 2 NaOH(aq) + H2(g)     ΔH° = −368 kJ/molrxn

When 2.30 g of Na(s) is added to 200. mL of water at 25°C in a calorimeter, all of the Na(s) reacts with water as represented by the equation above.

Which of the following is true when the 2.30 g of Na(s) has completely reacted?

(A) 18.4 kJ of energy is absorbed by the reaction.
(B) 36.8 kJ of energy is absorbed by the reaction.
(C) 18.4 kJ of energy is released by the reaction.
(D) 36.8 kJ of energy is released by the reaction.${JUSTIFY}`,
    answer: `(C). Moles of Na = 2.30 g ÷ 22.99 g/mol = 0.1000 mol. The balanced equation shows 2 mol Na reacting per "mol rxn," so moles of reaction = 0.1000 mol Na ÷ 2 = 0.0500 mol rxn. Heat released: q = 0.0500 mol rxn × 368 kJ/molrxn = 18.4 kJ. Since ΔH° is negative, the reaction is exothermic, meaning this 18.4 kJ is released (not absorbed) by the reaction — ruling out (A) and (B). Choice (D) doubles the correct value by forgetting to divide by the stoichiometric coefficient of 2.`,
  },
  {
    topic: '6.6',
    title: 'Q4 — Calculating ΔH°rxn from Calorimetry Data',
    content: `HNO3(aq) + KOH(aq) → H2O(l) + KNO3(aq)     ΔH° = ?

In an experiment a student mixes a 50.0 mL sample of 1.0 M HNO3(aq) with a 50.0 mL sample of 1.0 M KOH(aq) at 20.0°C in a coffee-cup calorimeter. Which of the following is the enthalpy change of the reaction represented above if the final temperature of the mixture is 27.0°C? (Assume that the total mass of the mixture is 100. g and that the specific heat capacity of the mixture is 4.0 J/(g·°C).)

(A) −56 kJ/molrxn
(B) −2.8 kJ/molrxn
(C) 2.8 kJ/molrxn
(D) 56 kJ/molrxn${JUSTIFY}`,
    answer: `(A). Moles of HNO3 = moles of KOH = 0.0500 L × 1.0 M = 0.050 mol, and since the equation shows a 1:1 ratio with no reactant in excess, 0.050 mol of "reaction" occurs. Heat released: q = mcΔT = 100. g × 4.0 J/(g·°C) × (27.0°C − 20.0°C) = 100. × 4.0 × 7.0 = 2800 J = 2.8 kJ. Since the mixture's temperature rose, the reaction is exothermic and released this heat, so q_rxn = −2.8 kJ for the 0.050 mol of reaction that occurred. Scaling to a full "mol rxn" (1 mol HNO3 + 1 mol KOH, matching the equation's coefficients of 1): ΔH° = −2.8 kJ ÷ 0.050 mol = −56 kJ/molrxn.`,
  },
  {
    topic: '6.6', image: 'u6b_q5_full.png',
    title: 'Q5 — Equal-Heat Mass Comparison Between Two Combustion Reactions',
    content: `Substance | Chemical Equation for the Combustion Reaction
Butane, C4H10(g) | C4H10(g) + 13/2 O2(g) → 4 CO2(g) + 5 H2O(l)     ΔH° = −2880 kJ/molrxn
Ethanol, C2H5OH(l) | C2H5OH(l) + 3 O2(g) → 2 CO2(g) + 3 H2O(l)     ΔH° = −1370 kJ/molrxn

A student sets up two experiments in which samples of C4H10(g) and C2H5OH(l) are combusted in separate calorimeters. Each combustion reaction occurs in the presence of excess O2(g) and goes to completion according to the chemical equations shown above. Information about the experiments is shown in the table above (Experiment 1: C4H10(g), molar mass 58.12 g/mol, mass combusted 25.0 g; Experiment 2: C2H5OH(l), molar mass 46.07 g/mol, mass combusted ?).

What mass of C2H5OH(l) should be used in experiment 2 in order to release the same quantity of heat (q) that is released in the combustion of 25.0 g C4H10(g) in experiment 1?

(A) 19.8 g
(B) 25.0 g
(C) 41.7 g
(D) 52.6 g${JUSTIFY}`,
    answer: `(C). First find the heat released in Experiment 1: moles C4H10 = 25.0 g ÷ 58.12 g/mol = 0.4301 mol; q1 = 0.4301 mol × 2880 kJ/mol = 1238.7 kJ. To release this same amount of heat by combusting ethanol: moles C2H5OH needed = 1238.7 kJ ÷ 1370 kJ/mol = 0.9042 mol. Mass = 0.9042 mol × 46.07 g/mol = 41.7 g.`,
  },
  {
    topic: '6.7', image: 'u6b_q6_full.png',
    title: 'Q6 — Calculating ΔH° from Bond Energies',
    content: `The structural formula of acetylene, C2H2, is shown above (H—C≡C—H). Acetylene gas reacts with H2(g) to form ethane gas, C2H6(g), as represented by the following equation:

C2H2(g) + 2 H2(g) → C2H6(g)     ΔH° = ?

Based on the table of bond energies shown above, the value of ΔH° for the reaction C2H2 + 2 H2 → C2H6 is closest to which of the following?

(A) −728 kJ/molrxn
(B) −296 kJ/molrxn
(C) +296 kJ/molrxn
(D) +728 kJ/molrxn${JUSTIFY}`,
    answer: `(B). ΔH° = Σ(bond energies of bonds broken in reactants) − Σ(bond energies of bonds formed in products). Reactant bonds broken: C2H2 (H—C≡C—H) has one C≡C bond and two C-H bonds; 2 H2 has two H-H bonds. Total = 839 + (2 × 413) + (2 × 432) = 839 + 826 + 864 = 2529 kJ. Product bonds formed: C2H6 (ethane, CH3-CH3) has one C-C bond and six C-H bonds. Total = 347 + (6 × 413) = 347 + 2478 = 2825 kJ. ΔH° = 2529 − 2825 = −296 kJ/molrxn.`,
  },
  {
    topic: '6.7',
    title: 'Q7 — Explaining a Positive ΔH° in Terms of Bond Energies',
    content: `CH3OH(g) → CO(g) + 2 H2(g)     ΔH° > 0

Which of the following best explains why the sign of ΔH° for the reaction represented above is positive?

(A) The energy absorbed as the bonds in the reactant are broken is greater than the energy released as the bonds in the products are formed.
(B) The energy released as the bonds in the reactant are broken is greater than the energy absorbed as the bonds in the products are formed.
(C) The energy absorbed as the bonds in the reactant are broken is less than the energy released as the bonds in the products are formed.
(D) The energy released as the bonds in the reactant are broken is less than the energy absorbed as the bonds in the products are formed.${JUSTIFY}`,
    answer: `(A). Breaking bonds ALWAYS requires an input of energy (absorbs energy), and forming bonds ALWAYS releases energy — this rules out (B) and (D), which incorrectly claim that breaking bonds releases energy. ΔH° = (energy absorbed breaking reactant bonds) − (energy released forming product bonds). For ΔH° to be positive, the energy absorbed to break the reactant's bonds must exceed the energy released when the products' bonds form — i.e., breaking bonds "costs" more than forming the new bonds "pays back." This matches (A) exactly; (C) describes the opposite relationship, which would give a negative (exothermic) ΔH° instead.`,
  },
  {
    topic: '6.7', image: 'u6b_q8_full.png',
    title: 'Q8 — Identifying the Error in a Bond-Enthalpy Calculation',
    content: `Ethylene, C2H4, reacts with chlorine, Cl2, to produce 1,2-dichloroethane, C2H4Cl2, as represented by the equation shown above (see the structural diagrams, bond enthalpy table, and the student's calculation above).

A student performed the following calculation, using the bond enthalpy values in the table above, to estimate the value of ΔH° for the formation of 1,2-dichloroethane:

ΔH° = [347 + (4 × 413) + (2 × 339)] − [614 + (4 × 413) + 243] = +168 kJ/molrxn

What error did the student make in the set-up for this calculation?

(A) The student counted the number of C–H bonds incorrectly.
(B) The bond energy of the chlorine-chlorine bond in Cl2 should be equal to (243 × 2) = 486.
(C) The bond energy for the carbon-carbon bond in C2H4 should be equal to (347 × 2) = 694.
(D) The student assumed that energy is released when bonds are broken.${JUSTIFY}`,
    answer: `(D). The correct setup is ΔH° = Σ(bonds broken in reactants) − Σ(bonds formed in products). The reactants (C2H4 + Cl2) contain one C=C bond, four C-H bonds, and one Cl-Cl bond — these bonds are BROKEN and should appear in the first (positive) bracket. The products (1,2-dichloroethane) contain one C-C bond, four C-H bonds, and two C-Cl bonds — these bonds are FORMED and should appear in the second (subtracted) bracket. The student instead placed the product bond energies [347 + 4(413) + 2(339)] in the first bracket and the reactant bond energies [614 + 4(413) + 243] in the second bracket — the exact reverse of the correct setup. This swap is only consistent with having assumed that forming bonds requires energy input (absorbed, like breaking bonds should be) and that breaking bonds releases energy (like forming bonds should) — i.e., the student assumed energy is released when bonds are broken, the opposite of what is actually true. Choices (A), (B), and (C) are all factually false claims about the molecules involved (C2H4 has one C=C double bond, not two C-C bonds; Cl2 has exactly one Cl-Cl bond, not two) and do not describe the actual, more fundamental conceptual error the student made.`,
  },
  {
    topic: '6.8', image: 'u6b_q9_table.png',
    title: 'Q9 — Calculating ΔH° from Standard Enthalpies of Formation',
    content: `Substance | Standard Enthalpy of Formation (kJ/mol)
O2(g) | 0
SO2(g) | −296.8
SO3(g) | −395.7

Based on the information in the table above, which of the following choices is closest to the value of ΔH° for the reaction represented by the following equation?

2 SO2(g) + O2(g) → 2 SO3(g)     ΔH° = ?

(A) −197.8 kJ/molrxn
(B) −98.9 kJ/molrxn
(C) +98.9 kJ/molrxn
(D) +197.8 kJ/molrxn${JUSTIFY}`,
    answer: `(A). ΔH°rxn = ΣΔHf°(products) − ΣΔHf°(reactants) = [2 × (−395.7)] − [2 × (−296.8) + 0] = −791.4 − (−593.6) = −791.4 + 593.6 = −197.8 kJ/molrxn.`,
  },
  {
    topic: '6.8', image: 'u6b_q10_table.png',
    title: 'Q10 — Solving for an Unknown Standard Enthalpy of Formation',
    content: `2 CH3CHO(g) + 5 O2(g) → 4 CO2(g) + 4 H2O(l)     ΔH° = −2390 kJ/molrxn

The combustion of acetaldehyde, CH3CHO(g), occurs according to the equation above. Based on the information in the table above and the value of the standard enthalpy change for the combustion of CH3CHO(g), which of the following is closest to the value of the standard enthalpy of formation for CH3CHO(g)?

(A) −330 kJ/mol
(B) −165 kJ/mol
(C) +165 kJ/mol
(D) +330 kJ/mol${JUSTIFY}`,
    answer: `(B). Using ΔH°rxn = ΣΔHf°(products) − ΣΔHf°(reactants): −2390 = [4 × (−394) + 4 × (−286)] − [2 × ΔHf°(CH3CHO) + 5 × 0]. Compute the products sum: 4(−394) + 4(−286) = −1576 − 1144 = −2720. So −2390 = −2720 − 2·ΔHf°(CH3CHO), which gives 2·ΔHf°(CH3CHO) = −2720 − (−2390) = −330, so ΔHf°(CH3CHO) = −330 ÷ 2 = −165 kJ/mol.`,
  },
  {
    topic: '6.9', image: 'u6b_q11_table.png',
    title: "Q11 — Combining Reactions Using Hess's Law",
    content: `Chemical Equation | ΔH° (kJ/molrxn)
N2(g) + 2 H2(g) → N2H4(l) | +51
H2(g) + ½ O2(g) → H2O(l) | −286
2 H2O2(l) → 2 H2O(l) + O2(g) | −196

Based on the information in the table above, what is the value of ΔH° for the following reaction?

2 H2O2(l) + N2H4(l) → 4 H2O(l) + N2(g)     ΔH° = ?

(A) −819 kJ/molrxn
(B) −717 kJ/molrxn
(C) −533 kJ/molrxn
(D) −431 kJ/molrxn${JUSTIFY}`,
    answer: `(A). Reverse the first equation (since N2H4 is a reactant in the target, not a product): N2H4(l) → N2(g) + 2 H2(g), ΔH = −51 kJ. Use the third equation as given: 2 H2O2(l) → 2 H2O(l) + O2(g), ΔH = −196 kJ. Double the second equation (to produce 4 H2O total, and to supply the 2 H2 + O2 needed to cancel with the other two steps): 2 H2(g) + O2(g) → 2 H2O(l), ΔH = 2 × (−286) = −572 kJ. Adding all three: N2H4 + 2 H2O2 + 2 H2 + O2 → N2 + 2 H2 + O2 + 2 H2O + 2 H2O. The 2 H2 and O2 cancel from both sides, leaving: N2H4(l) + 2 H2O2(l) → N2(g) + 4 H2O(l) — exactly the target reaction. Total ΔH° = −51 + (−196) + (−572) = −819 kJ/molrxn.`,
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
