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
  '5.4': '3813c390-4106-4a98-9b49-1f495ec94d34',
  '5.5': '4e4b1ffd-3772-4033-99f7-4f86fad9a244',
  '5.6': 'b317c742-40eb-41b5-b97b-5f7f024e791c',
  '5.7': '4ff4c4c4-fffa-4632-b2bf-78b1222d62ff',
  '5.8': 'adfbbaf8-e3ad-4103-b367-3e08220c936b',
  '5.9': '01c758e5-5e64-4dd2-b0aa-eb8a47aaeb40',
  '5.10': '1fc49dd0-7878-49d0-81b9-1a83d5bce78a',
  '5.11': '8e321e9b-0821-4a38-9bd7-207a59650295',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit5-topics5.4-5.11-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '5.4',
    title: 'Q1 — Rate Law for the First Elementary Step',
    content: `Step 1: NO(g) + Cl2(g) → NOCl2(g)
Step 2: NOCl2(g) + NO(g) → 2 NOCl(g)
Overall reaction: 2 NO(g) + Cl2(g) → 2 NOCl(g)

A proposed mechanism for a chemical reaction is represented above. Which of the following gives the correct expression for the rate law for Step 1 of this mechanism?

(A) rate = k[NO][Cl2]
(B) rate = k[NOCl2]
(C) rate = k[NOCl2][NO]
(D) rate = k[NO]²[Cl2]${JUSTIFY}`,
    answer: `(A) rate = k[NO][Cl2]. For an elementary step, the rate law can be written directly from its molecularity/stoichiometry (unlike an overall multi-step reaction, where the rate law must be determined experimentally). Step 1, NO(g) + Cl2(g) → NOCl2(g), is a bimolecular elementary step involving one NO and one Cl2 colliding, so its rate law is rate = k[NO][Cl2].`,
  },
  {
    topic: '5.5', image: 'u5q2_collision.png',
    title: 'Q2 — Effective Collision Orientation for NO3 + CO',
    content: `NO3(g) + CO(g) → NO2(g) + CO2(g)

The elementary reaction between NO3(g) and CO(g) is represented by the equation above. Which of the following orientations of collision between NO3(g) and CO(g) is most likely to be effective? (See the collision diagrams above, with legend C = black, N = grey, O = white.)

(A) Orientation A
(B) Orientation B
(C) Orientation C
(D) Orientation D${JUSTIFY}`,
    answer: `(B). For this reaction, an oxygen atom must be transferred from NO3 to CO to form CO2 (check: NO3 has 3 O, CO has 1 O; products NO2 has 2 O and CO2 has 2 O — one O atom moves from NO3 to CO). An effective collision therefore requires the carbon atom of CO (not its oxygen atom) to strike an exposed oxygen atom of NO3 (not the nitrogen atom). Orientation B is the only diagram in which CO's carbon atom (black) leads the collision AND an oxygen atom (white) of NO3 is the exposed atom facing it. In A and C, CO is oriented backwards (its oxygen atom leads instead of carbon); in D, CO's carbon leads correctly, but NO3 is oriented so its nitrogen atom (not an oxygen) faces the incoming CO.`,
  },
  {
    topic: '5.5',
    title: 'Q3 — Why Temperature Increases Reaction Rate',
    content: `Which of the following best helps explain why an increase in temperature increases the rate of a chemical reaction?

(A) At higher temperatures, reactions have a lower activation energy.
(B) At higher temperatures, reactions have a higher activation energy.
(C) At higher temperatures, every collision results in the formation of product.
(D) At higher temperatures, high-energy collisions happen more frequently.${JUSTIFY}`,
    answer: `(D). Activation energy is a property of the reaction pathway itself and does not change with temperature (ruling out A and B). Not every collision leads to product even at high temperature — collisions must still have both sufficient energy and proper orientation (ruling out C). Increasing temperature increases the average kinetic energy of the particles, which shifts the Maxwell-Boltzmann distribution so that a larger fraction of collisions have energy equal to or greater than the activation energy — i.e., high-energy (effective) collisions simply occur more often, increasing the reaction rate.`,
  },
  {
    topic: '5.6', image: 'u5q4_energyprofile.png',
    title: 'Q4 — Correctly Labeled Activation Energy Diagram',
    content: `H2(g) + Cl2(g) → 2 HCl(g)     ΔH = −185 kJ/molrxn

Hydrogen chloride, HCl(g), is formed from the elements hydrogen and chlorine as represented by the equation above. Which of the following diagrams shows the correctly labeled activation energy, Ea, for the reaction between H2(g) and Cl2(g) to form HCl(g)?

(A) Diagram A
(B) Diagram B
(C) Diagram C
(D) Diagram D${JUSTIFY}`,
    answer: `(C). Since ΔH = −185 kJ/mol (exothermic), the products (2 HCl) must be drawn at a LOWER potential energy than the reactants (H2 + Cl2) — this rules out (A), which draws the products higher than the reactants. The activation energy, Ea, must be measured as the full vertical distance from the REACTANTS' energy level up to the peak of the curve (the transition state) — not from the products' level. Diagrams (B) and (D) mislabel Ea as a short arrow between the products' level and a point partway down the curve, which is incorrect. Only diagram (C) correctly shows both the exothermic reactant/product levels and the Ea arrow spanning from the reactants up to the peak.`,
  },
  {
    topic: '5.7', image: 'u5q5_mechtable.png',
    title: 'Q5 — Observation That Distinguishes Two Proposed Mechanisms',
    content: `2 X(g) + Y2(g) → 2 XY(g)

The two mechanisms in the table above have been proposed for the reaction represented above. Which of the following observations would support mechanism 1 but not mechanism 2?

(A) The reaction rate is independent of [X].
(B) The reaction rate is independent of [Y2].
(C) The reaction is exothermic.
(D) The reaction is second order overall.${JUSTIFY}`,
    answer: `(B). In mechanism 1, the slow (rate-determining) step is X(g) + X(g) → X2(g), giving rate = k[X]² — a rate law with NO dependence on [Y2] at all. In mechanism 2, the slow step is X(g) + Y2(g) → XY2(g), giving rate = k[X][Y2] — a rate law that DOES depend on [Y2]. An experimental observation that the rate is independent of [Y2] would be consistent with mechanism 1's rate law but would directly contradict mechanism 2's rate law. (Choice A is wrong because both mechanisms' rate laws depend on [X]. Choices C and D don't distinguish between the mechanisms — both give an overall second-order rate law, and neither mechanism's steps reveal anything about the reaction's thermochemistry.)`,
  },
  {
    topic: '5.8', image: 'u5q6_species_table.png',
    title: 'Q6 — Identifying the Catalyst and Intermediate in a Mechanism',
    content: `H2O2(aq) + I⁻(aq) → H2O(l) + OI⁻(aq)
H2O2(aq) + OI⁻(aq) → H2O(l) + O2(g) + I⁻(aq)
Overall: 2 H2O2(aq) → 2 H2O(l) + O2(g)

The following reaction mechanism is proposed for the decomposition of H2O2 (shown above). Which of the following choices has correctly identified a species that behaves as a catalyst and a species that behaves as an intermediate in the proposed mechanism?

(A) Catalyst: I⁻; Intermediate: H2O
(B) Catalyst: OI⁻; Intermediate: H2O
(C) Catalyst: I⁻; Intermediate: OI⁻
(D) Catalyst: OI⁻; Intermediate: I⁻${JUSTIFY}`,
    answer: `(C). I⁻ is consumed in step 1 and regenerated in step 2, so it is present at the start and end of the overall reaction with no net change — this makes it a catalyst (it speeds up the reaction without being consumed). OI⁻ is produced in step 1 and fully consumed in step 2, so it never appears in the overall equation — this makes it a reaction intermediate (a species formed and then consumed during the mechanism). H2O is simply a product, not a catalyst or intermediate.`,
  },
  {
    topic: '5.8',
    title: 'Q7 — Choosing a Plausible First Elementary Step',
    content: `2 NO2(g) + F2(g) → 2 NO2F(g)

The rate law for the reaction represented by the equation above is rate = k[NO2][F2]. Which of the following could be the first elementary step of a two-step mechanism for the reaction if the first step is slow and the second step is fast?

(A) F2(g) → 2 F(g)
(B) NO2(g) + F2(g) → NO2F(g) + F(g)
(C) NO2(g) + F(g) → NO2F(g)
(D) 2 NO2(g) + F2(g) → 2 NO2F(g)${JUSTIFY}`,
    answer: `(B). Since the first step is slow (rate-determining), its rate law must match the observed overall rate law, rate = k[NO2][F2] — a bimolecular step combining one NO2 and one F2. Step (B), NO2(g) + F2(g) → NO2F(g) + F(g), is exactly this bimolecular step, and produces a reactive F atom that can react further in a fast second step (F + NO2 → NO2F) to give the correct overall stoichiometry. (A) involves only F2 and would give rate = k[F2], missing the [NO2] dependence. (C) requires F atoms as a reactant, which don't exist until after a first step produces them — so (C) must be the SECOND step, not the first. (D) is simply the overall three-body reaction, which is not a plausible single elementary step (termolecular collisions are exceedingly rare) and also leaves no second step.`,
  },
  {
    topic: '5.8', image: 'u5q8_mechtable.png',
    title: 'Q8 — Which Mechanism(s) Match the Given Rate Law',
    content: `X2 + Y2 → X2Y2     rate = k[X2]

A reaction and its experimentally determined rate law are represented above. A chemist proposes two different possible mechanisms for the reaction, given in the table above. Based on the information above, which of the following is true?

(A) Only mechanism 1 is consistent with the rate law.
(B) Only mechanism 2 is consistent with the rate law.
(C) Both mechanism 1 and mechanism 2 are consistent with the rate law.
(D) Neither mechanism 1 nor mechanism 2 is consistent with the rate law.${JUSTIFY}`,
    answer: `(C). Both mechanism 1 and mechanism 2 have the identical first step, X2 → 2X (slow), as their rate-determining step, which gives rate = k[X2] — exactly matching the given rate law in both cases. The remaining fast steps differ between the two mechanisms, but since they occur after the rate-determining step, they do not affect the overall rate law. (Both mechanisms' steps can also be checked to sum correctly to the overall equation X2 + Y2 → X2Y2, confirming both are valid, self-consistent proposals.)`,
  },
  {
    topic: '5.9', image: 'u5q9_mechtable.png',
    title: 'Q9 — Rate Law from a Mechanism with a Fast Pre-Equilibrium Step',
    content: `2 D2(g) + 2 QX(g) → Q2(g) + 2 D2X(g)

The experimental rate law for the reaction represented above is rate = k[D2][QX]². Which of the following proposed mechanisms (shown in the table above) is consistent with the rate law?

(A) Mechanism A
(B) Mechanism B
(C) Mechanism C
(D) Mechanism D${JUSTIFY}`,
    answer: `(D). In mechanism D, Step 1 (2 QX ⇌ Q2X2, fast equilibrium) comes before the slow, rate-determining Step 2 (D2 + Q2X2 → Q2X + D2X). The rate law from the RDS is rate = k[D2][Q2X2], but Q2X2 is a reaction intermediate, so its concentration must be replaced using the fast pre-equilibrium: K1 = [Q2X2]/[QX]², so [Q2X2] = K1[QX]². Substituting gives rate = k[D2](K1[QX]²) = kK1[D2][QX]², which matches the given rate law exactly (with the observed k equal to kK1). None of the other mechanisms combine a pre-equilibrium step with a slow step in a way that reduces to this same [D2][QX]² form — for example, in mechanism A the slow first step by itself would give rate = k[QX]², with no [D2] dependence at all.`,
  },
  {
    topic: '5.10', image: 'u5q10_energyprofiles.png',
    title: 'Q10 — Energy Profile for a Two-Step Mechanism',
    content: `Cl(g) + O3(g) → ClO(g) + O2(g)     slow step
ClO(g) + O3(g) → Cl(g) + 2 O2(g)     fast step
Overall: 2 O3(g) → 3 O2(g)     ΔH = −285 kJ/molrxn

When free Cl(g) atoms encounter O3(g) molecules in the upper atmosphere, the reaction mechanism shown above is proposed to occur. Which of the following reaction energy profiles best corresponds to the proposed mechanism?

(A) Profile A
(B) Profile B
(C) Profile C
(D) Profile D${JUSTIFY}`,
    answer: `(B). The mechanism has two elementary steps, so the energy profile needs two humps (ruling out profile A, which shows only one). Since the overall reaction is exothermic (ΔH = −285 kJ/mol), the profile must end at a lower energy than it starts (ruling out any profile that ends higher than it starts). Because the first step is described as slow, it must have the larger activation energy (taller hump), while the fast second step must have the smaller activation energy (shorter hump). Profile B shows exactly this: a taller first hump followed by a shorter second hump, ending below the starting energy. Profile C reverses this pattern (its second hump is taller than its first), which would incorrectly imply the second step has the larger activation energy and is actually the slower step.`,
  },
  {
    topic: '5.11', image: 'u5q11_full.png',
    title: 'Q11 — Energy Diagram for a Catalyzed Reaction',
    content: `The potential energy diagram for the uncatalyzed decomposition of X2Y2(g) is shown above (solid line: 2 X2Y2(g) → 2 X2Y(g) + Y2(g)). Which of the following best represents the energy diagram for the decomposition of X2Y2(g) in the presence of a suitable catalyst, shown as a dashed line?

(A) Diagram A
(B) Diagram B
(C) Diagram C
(D) Diagram D${JUSTIFY}`,
    answer: `(B). A catalyst provides an alternative reaction pathway with a lower activation energy, but it does NOT change the energy of the reactants or products — so the catalyzed (dashed) curve must start at the exact same energy as the reactants and end at the exact same energy as the products in the original (solid) curve, differing only in the height and shape of the pathway between them. Only diagram B shows the dashed line overlapping the solid line at both the start and the end, with a lower (and here, two-humped) pathway in between representing a genuine lower-energy catalyzed mechanism. Diagrams A and C shift the starting and/or ending energy levels (which a catalyst cannot do), and diagram D shows the dashed peak HIGHER than the original, which would represent a slower, not faster, pathway.`,
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
