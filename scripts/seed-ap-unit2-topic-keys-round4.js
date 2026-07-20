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
  '2.6': '97146f93-6f64-462c-b20b-cc0f2baadbb3',
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794',
};

// Round 4: final permissive sweep. Rejection now limited to (a) true exact clones — same
// specific molecule/compound/numbers as an existing DB question — or (b) out of current CED
// Unit 2 scope. Every item below is a genuinely new specific compound/scenario/question not
// present anywhere in the existing catalog (checked against all 142 questions from rounds 1-3).

const questions = [
  {
    topic: '2.1',
    title: 'Q29 — Classifying eight substances by bond/attraction type',
    content:
`Classify each of the following as containing (mainly) nonpolar covalent bonds, polar covalent bonds, ionic bonding, or metallic bonding:

H2   NaF   ZnCl2   NO   CuZn (brass)   NCl3   CH4   Al`,
    answer: `Using the cutoffs ΔEN < 0.5 → nonpolar covalent, 0.5 ≤ ΔEN ≤ 1.7 → polar covalent, ΔEN > 1.7 → ionic (and metal + metal → metallic bonding):

H2 — Nonpolar covalent (identical atoms, ΔEN = 0).
NaF — Ionic (metal + nonmetal, ΔEN = |3.98 − 0.93| = 3.05, well above 1.7).
ZnCl2 — Ionic (metal + nonmetal; zinc, like tin in SnCl2/SnCl4, is classified as forming ionic bonds with a nonmetal for AP purposes).
NO — Nonpolar covalent (ΔEN = |3.44 − 3.04| = 0.40, below the 0.5 cutoff, even though both atoms are different nonmetals).
CuZn (brass) — Metallic bonding (an alloy of two metals, sharing a delocalized sea of electrons).
NCl3 — Nonpolar covalent (ΔEN = |3.16 − 3.04| = 0.12, well below 0.5).
CH4 — Nonpolar covalent (ΔEN = |2.55 − 2.20| = 0.35; C-H bonds are treated as effectively nonpolar per the AP CED).
Al — Metallic bonding (a pure metal).`,
  },

  {
    topic: '2.3',
    title: 'Q20 — Why a dissolved ionic solid conducts electricity (Multiple Choice)',
    content:
`An ionic solid does not conduct electricity, but the same substance does conduct electricity once it is dissolved in water. Which of the following best explains why?
(A) Water is polar, so it readily conducts electricity on its own; the ionic solid does not play a role.
(B) The ionic solid has too little space between its particles for electricity to flow; water moves the particles apart enough to conduct electricity.
(C) Ions in the solid are not free to move; once dissolved, the ions are free to move throughout the solution, allowing electricity to flow.
(D) Ionic solids are too large to conduct electricity; once dissolved, the solid becomes smaller and can then conduct electricity.`,
    answer: `Correct answer: (C). In the solid state, the ions are locked into fixed positions in the crystal lattice and cannot move to carry electric charge, so the solid does not conduct electricity. When the ionic solid dissolves in water, the individual ions separate from the lattice and become free to move throughout the solution; this mobility of charged particles is what allows the solution to conduct electricity. (A) is wrong because it ignores the ionic solid's role entirely. (B) and (D) misattribute conductivity to particle spacing/size rather than to ion mobility.`,
  },

  {
    topic: '2.4',
    title: 'Q19 — Why interstitial alloys are less malleable than the pure metal',
    content:
`Interstitial alloys (such as steel, an alloy of iron and carbon) are typically less malleable than the pure metal they are made from (such as pure iron).

Based on the structure of an interstitial alloy, propose a reason for this decreased malleability.`,
    answer: `In a pure metal, the metal atoms are arranged in uniform layers that can slide past one another relatively easily when a force is applied, since the delocalized sea of electrons continues to hold the structure together regardless of how the layers shift — this sliding is what makes pure metals malleable. In an interstitial alloy, small atoms (like carbon) occupy the gaps between the larger metal atoms, disrupting the uniformity of the lattice. These interstitial atoms act as obstacles that interfere with the layers' ability to slide past each other (they block dislocation movement), so more force is needed to deform the alloy, and it is more likely to resist deformation or fracture rather than bend smoothly — making the interstitial alloy harder but less malleable than the pure metal.`,
  },

  {
    topic: '2.6',
    title: 'Q22 — Determining the best Lewis structure for SOCl2 by formal charge',
    content:
`Thionyl chloride, SOCl2, has a central sulfur atom bonded to one oxygen atom and two chlorine atoms.

(a) Calculate the total number of valence electrons in SOCl2.

(b) Draw the Lewis structure in which sulfur forms a double bond to oxygen, single bonds to each chlorine, and retains one lone pair.

(c) Calculate the formal charge on S, O, and each Cl in this structure, and explain why this structure (rather than one using only single bonds to all three surrounding atoms) is preferred.`,
    answer: `(a) Total valence electrons: S (6) + O (6) + 2 Cl (2 × 7 = 14) = 26 valence electrons.

(b) S is central, double-bonded to O (O has 2 lone pairs), singly bonded to each Cl (each Cl has 3 lone pairs), with 1 lone pair remaining on S.

(c) Formal charge = (valence electrons) − (nonbonding electrons) − (bonding electrons)/2.
S: 6 − 2 − (8/2) = 6 − 2 − 4 = 0 (S has 1 lone pair = 2 nonbonding electrons, and bonding electrons from 1 double bond + 2 single bonds = 4 + 2 + 2 = 8).
O: 6 − 4 − (4/2) = 6 − 4 − 2 = 0.
Each Cl: 7 − 6 − (2/2) = 7 − 6 − 1 = 0.
Every atom has a formal charge of 0, and the formal charges sum to 0, matching the neutral overall molecule. This structure is preferred over an all-single-bond alternative (S bonded to O and both Cl atoms using only single bonds, with 2 lone pairs on S) because that alternative would leave nonzero formal charges (a positive formal charge on S and a negative formal charge on O), whereas the structure with the S=O double bond achieves the ideal of formal charge as close to zero as possible on every atom.`,
  },

  {
    topic: '2.7',
    title: 'Q30 — Geometry, bond angle, and polarity of H2S and PH3',
    content:
`For each of the following molecules: determine the number of electron domains around the central atom, identify the molecular geometry, predict whether the bond angle is greater than, equal to, or less than 109.5°, and determine whether the molecule is polar or nonpolar.

(a) Hydrogen sulfide, H2S
(b) Phosphine, PH3`,
    answer: `(a) H2S: sulfur has 2 bonding pairs (to each H) and 2 lone pairs — 4 total electron domains. Molecular geometry is bent, with a bond angle less than 109.5° (the experimental H-S-H angle is about 92°, even more compressed than water's 104.5°, since sulfur's larger size and lower electronegativity give its lone pairs different repulsive character than oxygen's). H2S is polar: the two S-H bond dipoles do not cancel in the bent geometry.

(b) PH3: phosphorus has 3 bonding pairs (to each H) and 1 lone pair — 4 total electron domains. Molecular geometry is trigonal pyramidal, with a bond angle less than 109.5° (the experimental H-P-H angle is about 93.5°). PH3 is polar, though only weakly so: the P-H bond dipoles are small (P and H have very similar electronegativities), so the lone pair contributes most of PH3's modest overall dipole moment.`,
  },
  {
    topic: '2.7',
    title: 'Q31 — Identifying which species require an expanded octet',
    content:
`(a) Of the following species, identify the one for which a valid Lewis structure cannot be drawn without exceeding (expanding) the octet on the central atom: PO4^3-, SiF4, CF4, SeF4, NF3. Explain your reasoning.

(b) Of the following central atoms, identify the one that could never be part of a Lewis structure with an expanded octet, and explain why: P, Xe, N, S, I.`,
    answer: `(a) SeF4 is the one that requires an expanded octet. Selenium has 6 valence electrons; forming 4 single bonds to the 4 fluorine atoms uses 4 of those electrons, leaving 2 valence electrons (1 lone pair) on Se. This gives Se a total of 5 electron domains (4 bonding + 1 lone pair) = 10 electrons around the central atom, which necessarily exceeds an octet — there is no way to draw a valid SeF4 structure using only 8 electrons around Se while still bonding to all 4 F atoms. By contrast, PO4^3- (P can be drawn with 4 single bonds, obeying the octet, even if a formal-charge-minimized structure uses an expanded octet, a valid non-expanded structure exists), SiF4 and CF4 (both central atoms use exactly 4 bonds to reach a full octet with no electrons left over), and NF3 (N uses 3 bonds + 1 lone pair to reach a full octet) can all be drawn without violating the octet rule.

(b) Nitrogen (N) could never be part of an expanded-octet Lewis structure. Expanded octets require the central atom to have accessible d orbitals to hold the extra electron pairs, which are only available starting in the third period (n = 3) and beyond. Nitrogen is a second-period element (n = 2) and has no d orbitals available, so it can never exceed an octet. Phosphorus, sulfur, iodine, and xenon are all in the third period or later and do have accessible d orbitals, allowing them to form expanded octets when needed.`,
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
