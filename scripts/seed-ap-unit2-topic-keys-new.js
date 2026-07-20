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
  '2.1': 'cf42852a-b9c6-4ac0-8558-bef8d61b8dbc',
  '2.2': 'f08579e2-2b71-4546-b6c9-fbb234451479',
  '2.4': '7520f5d7-8f8d-431d-91f3-d4b9ce5aa1c3',
  '2.5': 'db2c2fe1-b576-4a0a-9846-b1a278b9baad',
  '2.6': '97146f93-6f64-462c-b20b-cc0f2baadbb3',
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794',
};

// Sourced from the "2.X ... Key.pdf" teacher packets (per-topic "YOU DO" sections) and the
// pFRQ Unit K (Mol Geo) packet. Cross-checked against the full existing Unit 2 catalog
// (~118 questions across 7 topics) fetched live before drafting; every question below uses a
// molecule/compound/example not already present in the DB for its topic. Topic 2.3 (Structure
// of Ionic Solids) is intentionally omitted — its Key packet's "YOU DO" items (particle-diagram
// construction, dissolved-ionic-solid conductivity, NaCl vs Na2O lattice energy via charge) all
// duplicate concepts/compounds already well covered by the existing 17 questions there.

const questions = [
  // ---------------- 2.1 Types of Chemical Bonds ----------------
  {
    topic: '2.1',
    title: 'Q23 — Ionic vs. covalent bonding within a single compound (LiOH)',
    content:
`Lithium hydroxide, LiOH, contains a lithium ion bonded to a hydroxide ion, and within the hydroxide ion an oxygen atom is bonded to a hydrogen atom.

(a) Classify the Li-O interaction and the O-H interaction, each as ionic, polar covalent, or nonpolar covalent.

(b) Justify each classification using electronegativity values (Li ≈ 0.98, O ≈ 3.44, H ≈ 2.20).`,
    answer: `(a) Li-O is ionic. O-H is polar covalent.

(b) The electronegativity difference between Li and O is |3.44 − 0.98| = 2.46, a very large difference — lithium (a metal) transfers its valence electron to oxygen rather than sharing it, so the Li-O interaction is ionic (an electrostatic attraction between Li+ and the negatively charged O of the hydroxide ion). The electronegativity difference between O and H is |3.44 − 2.20| = 1.24, a moderate difference — both atoms are nonmetals that share the bonding electron pair, but unequally, since O is considerably more electronegative than H. This makes O-H a polar covalent bond, with a partial negative charge on O and a partial positive charge on H. LiOH is a good example of a compound containing both an ionic interaction (between the lithium cation and the hydroxide anion as a whole) and a covalent bond (within the hydroxide ion itself).`,
  },
  {
    topic: '2.1',
    title: 'Q24 — Ranking metallic character (Ba, Ca, Ge, Se, Ne, Cu, Ga)',
    content:
`Based only on each element's location on the periodic table, rank the following elements in order of increasing metallic character: Ba, Ca, Ge, Se, Ne, Cu, Ga`,
    answer: `Increasing metallic character: Ne < Se < Ge < Ga < Cu < Ca < Ba

Metallic character increases moving down a group and to the left across a period, tracking with lower electronegativity/ionization energy and a greater tendency to lose valence electrons. Ne is a noble gas (no metallic character at all — it does not form bonds by losing electrons). Se is a nonmetal (Group 16). Ge is a metalloid (Group 14), showing some but limited metallic character. Ga is a post-transition metal (Group 13). Cu is a transition metal, more metallic than Ga since transition metals readily delocalize valence electrons. Ca and Ba are both Group 2 (alkaline earth) metals, which are strongly metallic; Ba sits below Ca in the same group, so Ba's valence electrons are held even less tightly (larger atomic radius, more shielding), making Ba the most metallic element in this set.`,
  },

  // ---------------- 2.2 Intramolecular Force and Potential Energy ----------------
  {
    topic: '2.2',
    title: 'Q10 — Lattice energy comparisons using Coulomb\'s law (charge vs. radius)',
    content:
`For each pair below, identify which compound has the greater (more exothermic) lattice energy, and state whether charge or ionic radius is the deciding factor.

(a) NaCl vs. LiCl
(b) MgO vs. NaCl
(c) MgO vs. BaO
(d) FeCl2 vs. FeCl3`,
    answer: `(a) LiCl has the greater lattice energy. Both compounds have the same ion charges (+1/-1), but Li+ has a smaller ionic radius than Na+, so the cation-anion distance is smaller in LiCl, producing a stronger Coulombic attraction. (Real values: LiCl ≈ 834 kJ/mol vs. NaCl ≈ 787 kJ/mol.)

(b) MgO has the much greater lattice energy. The ion charges dominate here: Mg2+/O2- (product of charges = 4) versus Na+/Cl- (product of charges = 1). A larger product of charges produces a much stronger Coulombic attraction, far outweighing any radius difference. (Real values: MgO ≈ 3795 kJ/mol vs. NaCl ≈ 787 kJ/mol.)

(c) MgO has the greater lattice energy. Both compounds have the same ion charges (+2/-2), but Mg2+ has a smaller ionic radius than Ba2+, so the smaller cation-anion distance in MgO produces a stronger attraction. (Real values: MgO ≈ 3795 kJ/mol vs. BaO ≈ 3054 kJ/mol.)

(d) FeCl3 has the greater lattice energy. Using an ionic (Coulombic) model, the higher cation charge (Fe3+ vs. Fe2+) increases the product of the charges, strengthening the electrostatic attraction between the iron cation and the chloride anions, even though the ionic radius of Fe3+ is somewhat smaller than Fe2+ (which reinforces the same conclusion).`,
  },
  {
    topic: '2.2',
    title: 'Q11 — Ranking bond energy: C-F, C-Cl, C-Br',
    content:
`Without looking up bond energy values, rank the C-F, C-Cl, and C-Br bonds from strongest (highest bond energy) to weakest (lowest bond energy). Justify your ranking using periodic trends in atomic radius.`,
    answer: `From strongest to weakest: C-F > C-Cl > C-Br

Moving down Group 17 from F to Cl to Br, atomic radius increases. A larger halogen atom forms a longer bond to carbon, and longer bonds are weaker (lower bond energy) because the shared electron density is spread over a greater internuclear distance, reducing the Coulombic attraction between the bonding electrons and the two nuclei. Since F is the smallest of the three halogens, C-F is the shortest and strongest bond; Br is the largest, so C-Br is the longest and weakest bond. (Real values: C-F ≈ 485 kJ/mol, C-Cl ≈ 327 kJ/mol, C-Br ≈ 285 kJ/mol — consistent with this trend.)`,
  },
  {
    topic: '2.2',
    title: 'Q12 — Bond order, length, and energy in F2, O2, and N2',
    content:
`The diatomic elements F2, O2, and N2 have different bond orders: F2 has a single bond, O2 has a double bond, and N2 has a triple bond.

(a) Which of these three molecules has the highest bond energy? Which has the longest bond?

(b) Explain your reasoning in terms of bond order.`,
    answer: `(a) N2 has the highest bond energy (triple bond, ≈ 945 kJ/mol, bond length ≈ 110 pm — the shortest of the three). F2 has the longest bond (single bond, ≈ 142 pm) and, correspondingly, the lowest bond energy (≈ 155 kJ/mol). O2's double bond is intermediate on both counts (≈ 121 pm, ≈ 498 kJ/mol).

(b) As bond order increases from single (F2) to double (O2) to triple (N2), more electron pairs are shared between the two nuclei. This pulls the bonded atoms closer together (shorter bond length) and increases the total Coulombic attraction holding the nuclei together (higher bond energy). N2's triple bond therefore has the shortest length and the greatest energy, while F2's single bond has the longest length and the least energy.`,
  },

  // ---------------- 2.4 Structure of Metals and Alloys ----------------
  {
    topic: '2.4',
    title: 'Q16 — Classifying a platinum-gold alloy',
    content:
`In 2018, researchers engineered a wear-resistant alloy that is 90% platinum and 10% gold by composition. The atomic radius of platinum is approximately 139 pm, and the atomic radius of gold is approximately 144 pm.

Classify this alloy as substitutional or interstitial, and justify your answer based on the atomic radii given.`,
    answer: `This is a substitutional alloy. Platinum and gold have very similar atomic radii (139 pm and 144 pm, respectively) — the gold atoms are close enough in size to platinum atoms that they can directly replace (substitute for) platinum atoms within the regular metallic lattice, rather than fitting into the small interstitial spaces between much larger atoms. (Interstitial alloys require one component to be significantly smaller than the other, which is not the case here.)`,
  },
  {
    topic: '2.4',
    title: 'Q17 — Density of a pure metal vs. an interstitial alloy',
    content:
`A pure metal and an interstitial alloy formed from that same metal (with a small amount of a much smaller element occupying the interstitial spaces) are compared.

Predict which sample has the greater density, and justify your answer in terms of mass and volume.`,
    answer: `The interstitial alloy has the greater density. The small interstitial atoms fit into the existing gaps (interstices) between the larger metal atoms without significantly increasing the overall volume of the lattice. Since additional mass (from the interstitial atoms) is packed into essentially the same volume, the mass-to-volume ratio (density) increases compared to the pure metal alone.`,
  },

  // ---------------- 2.5 Lewis Diagrams ----------------
  {
    topic: '2.5',
    title: 'Q14 — Draw Lewis Structures (Set 3)',
    content:
`Draw the correct Lewis electron-dot structure for each of the following. (Ignore molecular geometry for now.)

NCl3   NOCl   CH2Cl2   XeF4   PCl5`,
    answer: `NCl3 (26 valence electrons): N is central, single-bonded to each of the three Cl atoms, with one lone pair on N and three lone pairs on each Cl. All atoms satisfy the octet rule.

NOCl (18 valence electrons): N is central, double-bonded to O (2 lone pairs on O) and single-bonded to Cl (3 lone pairs on Cl), with one lone pair on N. N satisfies the octet rule with the double bond, single bond, and lone pair (3 electron groups, 8 electrons total around N).

CH2Cl2 (20 valence electrons): C is central, single-bonded to two H atoms and two Cl atoms (tetrahedral connectivity), with three lone pairs on each Cl atom. No lone pairs on C or H.

XeF4 (36 valence electrons): Xe is central, single-bonded to each of the four F atoms, with two lone pairs remaining on Xe (an expanded octet of 12 electrons around Xe) and three lone pairs on each F.

PCl5 (40 valence electrons): P is central, single-bonded to each of the five Cl atoms (an expanded octet of 10 electrons around P), with three lone pairs on each Cl and no lone pairs on P.`,
  },
  {
    topic: '2.5',
    title: 'Q15 — Completing the Lewis structure of butyric acid, C4H8O2',
    content:
`Butyric acid, C4H8O2, is partially shown below with its carbon skeleton and connectivity given:

H H H     O
|  |  |    ‖
H-C-C-C-C-O-H
|  |  |
H H H

Complete the Lewis diagram by adding all remaining lone pairs so that every C and O atom obeys the octet rule and the total valence electron count for C4H8O2 is correct.`,
    answer: `Total valence electrons in C4H8O2: C: 4(4) = 16, H: 8(1) = 8, O: 2(6) = 12; total = 36 valence electrons.

The skeleton as drawn already accounts for all the bonding pairs shown: 3 C-C single bonds, 8 C-H (and O-H) single bonds total, one C=O double bond, and one C-O single bond to the hydroxyl oxygen. Counting bonding electrons: (3 C-C + 7 C-H/O-H single bonds + 1 C=O double bond counted as one connection + 1 C-O single bond) — the remaining electrons not already placed in bonds must be added as lone pairs so that both oxygen atoms have a complete octet: the double-bonded (carbonyl) oxygen gets 2 lone pairs, and the single-bonded (hydroxyl) oxygen gets 2 lone pairs. No lone pairs go on any carbon or hydrogen atom, since all four carbons already have four bonds each (a full octet with no unshared electrons) and hydrogen only needs its one bonding pair. With these four lone pairs (2 on each oxygen) added, all atoms satisfy the octet rule and the full 36 valence electrons are accounted for.`,
  },

  // ---------------- 2.6 Resonance and Formal Charge ----------------
  {
    topic: '2.6',
    title: 'Q20 — Resonance structures and formal charge in the chlorate ion, ClO3-',
    content:
`The chlorate ion, ClO3-, has a central chlorine atom bonded to three oxygen atoms.

(a) Draw all of the equivalent resonance structures for ClO3-, in which chlorine forms one Cl=O double bond and two Cl-O single bonds (rotating the position of the double bond among the three oxygens).

(b) Calculate the formal charge on the chlorine atom and on each type of oxygen atom (the doubly-bonded one and the singly-bonded ones) in any one resonance structure.

(c) Based on your formal charge calculations, does the overall formal charge sum to the correct value for this ion? Explain.`,
    answer: `Total valence electrons in ClO3-: Cl (7) + 3 O (3 × 6 = 18) + 1 extra electron for the 1- charge = 26 valence electrons.

(a) There are three equivalent resonance structures. In each, Cl is central with one Cl=O double bond (double-bonded O has 2 lone pairs) and two Cl-O single bonds (each singly-bonded O has 3 lone pairs), plus one lone pair remaining on Cl. The three structures differ only in which of the three oxygens carries the double bond.

(b) Formal charge = (valence electrons) − (nonbonding electrons) − (bonding electrons)/2.
Cl: 7 − 2 − (8/2) = 7 − 2 − 4 = +1 (Cl has 1 lone pair = 2 nonbonding electrons, and is involved in 1 double bond + 2 single bonds = 8 bonding electrons total around it).
Double-bonded O: 6 − 4 − (4/2) = 6 − 4 − 2 = 0.
Each singly-bonded O: 6 − 6 − (2/2) = 6 − 6 − 1 = −1.

(c) Sum: (+1) + (0) + (−1) + (−1) = −1, which correctly matches the overall 1− charge of the chlorate ion. This confirms the structure and formal charge assignments are consistent.`,
  },
  {
    topic: '2.6',
    title: 'Q21 — Formal charge and resonance in benzene, C6H6',
    content:
`Benzene, C6H6, is a six-membered ring of carbon atoms, each bonded to one hydrogen atom. A single Lewis structure for benzene (a "Kekulé structure") shows alternating single and double C-C bonds around the ring.

(a) Calculate the formal charge on a ring carbon that is part of one C-C single bond, one C=C double bond, and one C-H single bond (with no lone pairs).

(b) Real experimental data show that all six C-C bonds in benzene have the same length — an intermediate length between a typical single and double C-C bond. Explain why a single Kekulé structure (with clearly alternating single and double bonds) does not accurately represent the actual bonding in benzene, and what must be done instead.`,
    answer: `(a) Formal charge = (valence electrons) − (nonbonding electrons) − (bonding electrons)/2. Each ring carbon has 4 valence electrons, 0 nonbonding electrons, and is involved in 3 sigma bonds (to 2 ring carbons and 1 H) plus 1 pi bond (part of the C=C double bond) — a total of 8 bonding electrons around it (4 bonds × 2 electrons each, since the double bond region contributes 4 electrons as one bonding connection plus a pi contribution simplifies to the same accounting: 4 total bonds worth of electron pairs = 8 electrons). Formal charge = 4 − 0 − (8/2) = 4 − 0 − 4 = 0. Every carbon atom has a formal charge of 0 in this Kekulé structure.

(b) Since every atom already has a formal charge of 0, formal charge minimization alone does not reveal a problem with a single Kekulé structure — the issue is instead a mismatch with experimental bond length data. A single Kekulé structure implies three distinct short C=C double bonds and three distinct longer C-C single bonds alternating around the ring, but experimentally all six C-C bonds are observed to be equal in length (intermediate between typical single and double bond lengths). This means no single Kekulé structure correctly describes benzene's real bonding. Instead, benzene must be represented as a resonance hybrid of two equivalent Kekulé structures (with the double bonds shifted to the alternate ring positions); the true structure is the delocalized average of both, giving each C-C bond an equal, intermediate bond order of 1.5, consistent with the equal bond lengths actually observed.`,
  },

  // ---------------- 2.7 VSEPR and Bond Hybridization ----------------
  {
    topic: '2.7',
    title: 'Q24 — Geometry, hybridization, and polarity of OF2 and NF3',
    content:
`For each of the following molecules: draw the Lewis structure, identify the molecular geometry and the hybridization of the central atom, and determine whether the molecule is polar or nonpolar.

(a) Oxygen difluoride, OF2
(b) Nitrogen trifluoride, NF3`,
    answer: `(a) OF2: O is the central atom with 2 bonding pairs (to each F) and 2 lone pairs — 4 total electron domains. Molecular geometry is bent (like water), with a bond angle slightly less than 109.5° (compressed by the two lone pairs). The oxygen is sp3 hybridized. OF2 is polar: the two O-F bond dipoles do not cancel in the bent geometry, and the lone pairs also contribute to a net dipole moment.

(b) NF3: N is the central atom with 3 bonding pairs (to each F) and 1 lone pair — 4 total electron domains. Molecular geometry is trigonal pyramidal, with a bond angle slightly less than 109.5°. The nitrogen is sp3 hybridized. NF3 is polar: the three N-F bond dipoles do not cancel in the trigonal pyramidal geometry, though the molecule's overall dipole moment is smaller than NH3's, since in NF3 the highly electronegative F atoms pull electron density away from N in a direction that partially opposes the lone pair's contribution to the dipole.`,
  },
  {
    topic: '2.7',
    title: 'Q25 — Comparing the geometry of PF5 and IF5',
    content:
`Both PF5 and IF5 have the general formula AF5, with a central atom bonded to five fluorine atoms, but they have different molecular geometries.

(a) Determine the number of bonding pairs and lone pairs around the central atom in each molecule.

(b) Identify the molecular geometry and hybridization of the central atom in each molecule.

(c) Explain why PF5 and IF5 have different geometries despite both having the formula AF5.`,
    answer: `(a) In PF5, phosphorus has 5 valence electrons and forms 5 bonds to fluorine, using all 5 valence electrons in bonding — 5 bonding pairs, 0 lone pairs (5 total electron domains). In IF5, iodine has 7 valence electrons; 5 of them form bonds to the 5 fluorine atoms, leaving 2 valence electrons (1 lone pair) on iodine — 5 bonding pairs, 1 lone pair (6 total electron domains).

(b) PF5: 5 electron domains, 0 lone pairs → trigonal bipyramidal geometry, sp3d hybridization on P. IF5: 6 electron domains, 1 lone pair → square pyramidal geometry (an octahedral electron-domain arrangement with one position occupied by a lone pair), sp3d2 hybridization on I.

(c) The two central atoms have different numbers of valence electrons: phosphorus (Group 15) has 5 valence electrons, exactly enough to form 5 bonds with no electrons left over, while iodine (Group 17) has 7 valence electrons, so after forming 5 bonds to fluorine it still has 1 lone pair remaining. This extra lone pair on iodine adds a sixth electron domain, changing the electron-domain geometry from trigonal bipyramidal (5 domains, PF5) to octahedral (6 domains, IF5), and the lone pair's position pushes the five bonding fluorine atoms into a square pyramidal arrangement rather than the symmetric trigonal bipyramidal shape seen in PF5. Consequently, PF5 is nonpolar (fully symmetric with no lone pair) while IF5 is polar (the lone pair breaks the symmetry, leaving a net dipole moment).`,
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
