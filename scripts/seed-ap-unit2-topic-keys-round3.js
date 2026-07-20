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
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794',
};

// Round 3: full re-mining of the pMCQ/pFRQ "Unit K (Mol Geo)" packets (previously only
// partially read) under the loose duplication standard — different specific molecule/bond
// examples are fine even if the general skill was tested before. Re-checked each candidate
// against the full live catalog (138 questions after rounds 1+2) before including.

const questions = [
  {
    topic: '2.1',
    title: 'Q28 — Partial charge labeling in H-F and P-Cl (in PCl5)',
    content:
`For each bond below, label which atom carries the partial negative charge (δ-) and which carries the partial positive charge (δ+). Justify using electronegativity values (H = 2.20, F = 3.98, P = 2.19, Cl = 3.16).

(a) The H-F bond
(b) A P-Cl bond in PCl5`,
    answer: `(a) In H-F, fluorine carries the partial negative charge (δ-) and hydrogen carries the partial positive charge (δ+). Fluorine's electronegativity (3.98) is much greater than hydrogen's (2.20), so the shared electron pair spends more time near the fluorine nucleus, giving F a partial negative charge and H a partial positive charge.

(b) In each P-Cl bond, chlorine carries the partial negative charge (δ-) and phosphorus carries the partial positive charge (δ+). Chlorine's electronegativity (3.16) is greater than phosphorus's (2.19), so the bonding electrons are pulled closer to Cl, giving it a partial negative charge and leaving P with a partial positive charge.`,
  },
  {
    topic: '2.7',
    title: 'Q27 — Hybridization and bond angles in formamide (methanamide), HCONH2',
    content:
`Formamide, HCONH2, has a central carbon (Cx) double-bonded to an oxygen atom, single-bonded to a hydrogen atom, and single-bonded to a nitrogen atom (Ny), which is in turn bonded to two additional hydrogen atoms.

(a) Determine the number of electron domains around Cx, and predict the H-Cx-N bond angle and the hybridization of Cx.

(b) Determine the number of electron domains around Ny, and predict the H-Ny-H bond angle and the hybridization of Ny.`,
    answer: `(a) Cx has 3 electron domains: the C=O double bond (counted as one domain), the C-H single bond, and the C-N single bond. Three electron domains with no lone pairs gives a trigonal planar arrangement, so the H-Cx-N bond angle is approximately 120°, and Cx is sp2 hybridized.

(b) Ny has 4 electron domains: single bonds to Cx and to each of the two H atoms (3 bonding domains), plus 1 lone pair. Four electron domains give a tetrahedral electron-domain geometry; with one lone pair, the molecular geometry around N is trigonal pyramidal and the H-Ny-H bond angle is approximately 109.5° (somewhat compressed by the lone pair), with Ny being sp3 hybridized. (Note: in reality, resonance donation of the nitrogen lone pair into the C=O pi system makes the amide nitrogen closer to planar than this simple domain-counting model predicts — but the sp3/tetrahedral-domain prediction is the expected answer using basic VSEPR reasoning.)`,
  },
  {
    topic: '2.7',
    title: 'Q28 — Electron-domain geometry and molecular geometry of iodine trichloride, ICl3',
    content:
`Iodine trichloride, ICl3, has a central iodine atom bonded to three chlorine atoms.

(a) Determine the total number of electron domains around the central iodine atom, including lone pairs.

(b) Identify the electron-domain geometry and the molecular geometry of ICl3.`,
    answer: `Total valence electrons: I (7) + 3 Cl (3 × 7 = 21) = 28 valence electrons.

(a) Iodine forms 3 single bonds to the chlorine atoms, using 3 of its 7 valence electrons; the remaining 4 valence electrons form 2 lone pairs on iodine. This gives 5 total electron domains (3 bonding + 2 lone pairs).

(b) With 5 electron domains, the electron-domain geometry is trigonal bipyramidal. The 2 lone pairs occupy equatorial positions (to minimize lone-pair/lone-pair and lone-pair/bonding-pair repulsions), leaving the 3 chlorine atoms arranged in a T-shaped molecular geometry.`,
  },
  {
    topic: '2.7',
    title: 'Q29 — Molecular geometry of the hydronium ion, H3O+',
    content:
`The hydronium ion, H3O+, forms when a water molecule accepts a proton (H+).

(a) Determine the total number of electron domains around the central oxygen atom in H3O+.

(b) Identify the molecular geometry of H3O+, and compare it to the molecular geometry of NH3.`,
    answer: `Total valence electrons: O (6) + 3 H (3 × 1 = 3) − 1 (for the 1+ charge) = 8 valence electrons.

(a) Oxygen forms 3 single bonds to the hydrogen atoms (using 3 bonding pairs) and retains 1 lone pair — a total of 4 electron domains.

(b) With 4 electron domains (3 bonding, 1 lone pair), H3O+ has a tetrahedral electron-domain geometry but a trigonal pyramidal molecular geometry — the same molecular geometry as NH3, since both have exactly 3 bonding pairs and 1 lone pair around the central atom. The H-O-H bond angle in H3O+ is expected to be close to (though slightly different from) the 107° H-N-H angle in NH3, since both are compressed somewhat from the ideal 109.5° by their single lone pair.`,
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
