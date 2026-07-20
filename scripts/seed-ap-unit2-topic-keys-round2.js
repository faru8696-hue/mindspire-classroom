const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '2.1': 'cf42852a-b9c6-4ac0-8558-bef8d61b8dbc',
  '2.3': 'b4207db6-c796-4d5e-9912-d060fdc26b3c',
  '2.4': '7520f5d7-8f8d-431d-91f3-d4b9ce5aa1c3',
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794',
};

// Round 2: recovering candidates initially rejected under an overly strict "no repeated
// skill/concept" reading. Per updated guidance, repeating a skill/topic with genuinely
// different specific compounds/ions/molecules is fine — only true near-duplicates (same
// specific example, reworded) should be excluded. Each item below uses compounds/molecules
// not already present anywhere in the existing Unit 2 catalog (re-checked against the full
// live catalog, now including the 13 questions added in the first pass).

const questions = [
  // ---------------- 2.1 Types of Chemical Bonds ----------------
  {
    topic: '2.1',
    title: 'Q25 — Ranking bond polarity by periodic trend, without an electronegativity table (Si-F/S-F/P-F, F-F/F-Cl/F-Br)',
    content:
`Without looking up electronegativity values, use periodic trends to answer the following.

(a) Rank Si-F, S-F, and P-F in order from least polar to most polar.

(b) Rank F-F, F-Cl, and F-Br in order from least polar to most polar.`,
    answer: `(a) Least to most polar: S-F < P-F < Si-F

Si, P, and S are all in Period 3, with electronegativity increasing left to right across the period (Si < P < S). Since F has a fixed, very high electronegativity, the bond polarity (electronegativity difference) with F is largest for the element with the lowest electronegativity of the three — Si — and smallest for the element with the highest electronegativity of the three — S. So Si-F is the most polar bond and S-F is the least polar. (Consistent with Pauling values: Si-F ≈ 2.08, P-F ≈ 1.79, S-F ≈ 1.40.)

(b) Least to most polar: F-F < F-Cl < F-Br

F-F has an electronegativity difference of zero (identical atoms), making it nonpolar — the least polar of the three. Cl and Br are both in Group 17, with Cl above Br, so Cl has a higher electronegativity than Br. This means F-Cl has a smaller electronegativity difference (and is less polar) than F-Br. (Consistent with Pauling values: F-F = 0, F-Cl ≈ 0.82, F-Br ≈ 1.02.)`,
  },
  {
    topic: '2.1',
    title: 'Q26 — Ranking ionic character in three cation/anion pairs (NaF/AgF, BaCl2/BaS, ZnCl2/SrF2)',
    content:
`For each pair below, identify which compound has more ionic character in its bonding, and justify your choice.

(a) NaF vs. AgF
(b) BaCl2 vs. BaS
(c) ZnCl2 vs. SrF2`,
    answer: `(a) NaF has more ionic character. Sodium is an alkaline metal with a very low electronegativity (≈0.93) and forms a "hard," non-polarizing Na+ cation. Silver, despite also forming a 1+ ion, is a transition metal with a higher electronegativity (≈1.93) and a smaller, more polarizing cation (due to incomplete shielding by its d electrons), which distorts the electron cloud of F- and introduces significant covalent character into the Ag-F interaction. The larger electronegativity difference and the "harder" cation both point to NaF being more ionic.

(b) BaCl2 has more ionic character. Both compounds share the same cation (Ba2+), so the anion determines the difference: Cl has a higher electronegativity (≈3.16) than S (≈2.58), so the electronegativity difference (and therefore the ionic character) is greater for Ba-Cl than for Ba-S.

(c) SrF2 has more ionic character. Sr is an alkaline earth metal with a low electronegativity (≈0.95) and forms a large, non-polarizing Sr2+ cation, while Zn is a transition metal with a higher electronegativity (≈1.65) and a small, polarizing Zn2+ cation. Combined with F being more electronegative than Cl, both the electronegativity difference and the polarizing power of the cation favor SrF2 as the more ionic compound; ZnCl2 is known to have substantial covalent character.`,
  },
  {
    topic: '2.1',
    title: 'Q27 — Selecting and ranking polar and nonpolar bonds from a table of elements',
    content:
`Element    Electronegativity
H              2.1
C              2.5
S              2.5
F              4.0
Cl             3.0
Si             1.8

(a) Select three pairs of these elements that would form nonpolar (or essentially nonpolar) covalent bonds.

(b) Select three pairs of these elements that would form polar covalent bonds, and rank them from least polar to most polar.`,
    answer: `(a) C-H (ΔEN = 0.4), C-S (ΔEN = 0), and Si-H (ΔEN = 0.3) are all essentially nonpolar — the electronegativity differences are all small (≤0.4), so electrons are shared nearly equally in each of these bonds.

(b) Using Cl-F, C-F, and H-F: ΔEN(Cl-F) = |4.0 − 3.0| = 1.0, ΔEN(C-F) = |4.0 − 2.5| = 1.5, ΔEN(H-F) = |4.0 − 2.1| = 1.9. Ranked from least polar to most polar: Cl-F < C-F < H-F.`,
  },

  // ---------------- 2.3 Structure of Ionic Solids ----------------
  {
    topic: '2.3',
    title: 'Q18 — Constructing a particle diagram for NaCl, given a KF diagram',
    content:
`A particle-level diagram represents potassium fluoride, KF, as an alternating 3-D array of K+ and F- ions of roughly similar size (K+ radius ≈ 138 pm, F- radius ≈ 133 pm).

Describe how you would construct an analogous particle diagram for sodium chloride, NaCl, including the correct alternating charge pattern and the correct relative sizes of the two ions (Na+ radius ≈ 102 pm, Cl- radius ≈ 181 pm).`,
    answer: `Like the KF diagram, the NaCl diagram should show a repeating 3-D lattice with Na+ and Cl- ions alternating in a systematic pattern that maximizes attraction between oppositely charged neighbors and minimizes repulsion between like-charged ions. The key difference from KF is the relative ion sizes: in KF, K+ and F- are of comparable size (138 pm vs. 133 pm), so they should be drawn as similarly-sized circles. In NaCl, however, Na+ (102 pm) is considerably smaller than Cl- (181 pm) — roughly half its radius — so the diagram must show noticeably small circles for Na+ and noticeably larger circles for Cl-, unlike the near-equal sizing used for KF.`,
  },
  {
    topic: '2.3',
    title: 'Q19 — Why Na2O has a much higher lattice energy than NaCl',
    content:
`Sodium chloride, NaCl, has a lattice energy of 787 kJ/mol. Sodium oxide, Na2O, has a lattice energy of about 2481 kJ/mol — more than three times as large.

Explain this large difference in lattice energy using Coulomb's law.`,
    answer: `The dominant factor is ionic charge. In NaCl, the ions are Na+ (charge +1) and Cl- (charge -1), giving a charge product of 1 × 1 = 1. In Na2O, the anion is O2- (charge -2) rather than a 1- ion, giving a charge product of 1 × 2 = 2 for each Na-O interaction. Since the Coulombic attraction between ions is directly proportional to the product of their charges, doubling the anion's charge substantially strengthens each individual attraction — and this effect compounds with the fact that O2- is also a smaller ion than Cl-, further shortening the interionic distance and adding to the attraction. Together, the much larger charge product and smaller ionic radius explain why Na2O's lattice energy is so much greater than NaCl's, far outweighing any effect from the different stoichiometry (Na2O has two Na+ ions per formula unit).`,
  },

  // ---------------- 2.4 Structure of Metals and Alloys ----------------
  {
    topic: '2.4',
    title: 'Q18 — Classifying tungsten carbide as an alloy',
    content:
`Tungsten carbide is formed by combining tungsten (atomic radius ≈ 139 pm) with a small amount of carbon (atomic radius ≈ 70 pm).

Classify this alloy as interstitial or substitutional, and justify your answer using the atomic radii given.`,
    answer: `Tungsten carbide is an interstitial alloy. The carbon atoms (≈70 pm) are much smaller than the tungsten atoms (≈139 pm) — roughly half the radius — so instead of replacing tungsten atoms within the lattice, the small carbon atoms fit into the interstitial spaces (gaps) between the larger tungsten atoms. This is the same structural principle seen in steel (carbon fitting into interstices between iron atoms), just with tungsten as the larger metal instead of iron.`,
  },

  // ---------------- 2.7 VSEPR and Bond Hybridization ----------------
  {
    topic: '2.7',
    title: 'Q26 — Hybridization of the three carbon atoms in propene, CH3-CH=CH2',
    content:
`Propene has the structure CH3-CH=CH2, with a methyl carbon (C1), a central alkene carbon (C2), and a terminal alkene carbon (C3).

Identify the hybridization (sp, sp2, or sp3) of each of the three carbon atoms, and explain your reasoning for each.`,
    answer: `C1 (the CH3 carbon) is sp3 hybridized: it forms 4 single (sigma) bonds — three to H atoms and one to C2 — with no multiple bonds and no lone pairs, giving 4 electron domains.

C2 (the central =CH- carbon) is sp2 hybridized: it forms a double bond to C3 (1 sigma + 1 pi), a single bond to C1, and a single bond to H — 3 electron domains (the double bond counts as one domain), so it is sp2 hybridized with trigonal planar geometry around that carbon.

C3 (the terminal =CH2 carbon) is also sp2 hybridized: it forms a double bond to C2 (1 sigma + 1 pi) and single bonds to two H atoms — again 3 electron domains, so sp2 hybridized.

Overall, propene contains carbons with sp2 and sp3 hybridization, but no sp-hybridized carbon (sp hybridization would require a carbon with only 2 electron domains, such as one involved in two double bonds or a triple bond, which does not occur anywhere in propene).`,
  },
];

async function main() {
  const { data: existing, error: existErr } = await sb.from('questions').select('id, topic_id, order_index');
  if (existErr) { console.error(existErr); process.exit(1); }
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0, failed = 0;
  const perTopicCount = {};
  for (const q of questions) {
    const topicId = TOPICS[q.topic];
    if (!topicId) { console.error('Unknown topic:', q.topic, q.title); failed++; continue; }
    const orderIndex = (maxOrderByTopic[topicId] ?? -1) + 1;
    maxOrderByTopic[topicId] = orderIndex;

    const { error } = await sb.from('questions').insert({
      title: q.title,
      content: q.content,
      topic_id: topicId,
      order_index: orderIndex,
      image_url: q.imageUrl || null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); failed++; continue; }
    inserted++;
    perTopicCount[q.topic] = (perTopicCount[q.topic] || 0) + 1;
    console.log(`[${inserted}/${questions.length}] (${q.topic}) ${q.title} ... inserted`);
  }
  console.log(`\nDone. ${inserted} inserted, ${failed} failed.`);
  console.log('Per-topic counts:', perTopicCount);
}

main();
