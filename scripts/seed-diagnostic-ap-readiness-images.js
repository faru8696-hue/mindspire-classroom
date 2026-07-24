const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Second pass over the AP Chem Readiness pool: restores questions that were
// originally skipped because they depended on a diagram/table/graph, now
// that each has been cropped from its source PDF (or, for a few, recovered
// as plain text once it turned out the PDF text layer just failed to
// extract inline bold/formatted characters — no image needed for those).
const IMG_DIR = path.join(__dirname, 'tmp-diagnostic-images');
const TEST_ID = '0523202d-7e96-4008-a35d-feac62614b4f'; // ap-chem-readiness

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `diagnostic-ap-readiness/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

(async () => {
  const { data: topics, error: topicsError } = await sb
    .from('diagnostic_topics')
    .select('id, title')
    .eq('diagnostic_test_id', TEST_ID);
  if (topicsError) throw topicsError;
  const topicId = Object.fromEntries(topics.map(t => [t.title, t.id]));

  const T = {
    measurement: topicId['Measurement, Matter & Significant Figures'],
    atomic: topicId['Atomic Theory, Isotopes & Chemical Nomenclature'],
    gases: topicId['Gases, Phases & Intermolecular Forces'],
    quantum: topicId['Quantum Theory & Electron Configuration'],
    bonding: topicId['Chemical Bonding, Lewis Structures & Molecular Geometry'],
    kinetics: topicId['Chemical Kinetics: Rates, Rate Laws & Mechanisms'],
  };
  for (const [k, v] of Object.entries(T)) if (!v) throw new Error(`Missing topic id for ${k}`);

  console.log('Uploading images...');
  const img = {};
  for (const f of [
    'sigfig_q1_thermometer.png', 'sigfig_q29_target.png',
    'ch9_q12_ozone_lewis.png', 'ch10_q10_pibonds.png',
    'ch12_q10_vaporpressure.png', 'ch12_q11_phase_plain.png', 'ch12_q12_q13_phase_labeled.png',
    'honors2_q13_silicon.png',
    'kin1_q17_graphs.png', 'kin1_q20_graph.png', 'kin1_q22_graph.png', 'kin1_q25_energyprofile.png',
    'jasp_q6_graphs.png', 'jasp_q7_graphs.png', 'jasp_q8_graph.png',
    'jasp_q41_transitionstate.png', 'jasp_q42_energyprofiles.png', 'jasp_q43_energyprofiles.png',
    'jasp_q44_energyprofiles.png', 'jasp_q47_labeleddiagram.png',
  ]) {
    img[f] = await uploadImage(f);
    console.log(' ', f, '->', img[f]);
  }

  const QUESTIONS = [
    // ---- Image-based ----
    { topic: T.measurement, source: 'CH 221 Sig Figs Self Quiz (Chapter 1)', content: 'How many significant digits are present in the temperature read from the thermometer illustrated below?', imageUrl: img['sigfig_q1_thermometer.png'], options: ['1', '2', '3', '4'], correct: 2 },
    { topic: T.measurement, source: 'CH 221 Sig Figs Self Quiz (Chapter 1)', content: 'The marks on the following target represent someone who is:', imageUrl: img['sigfig_q29_target.png'], options: ['accurate, but not precise.', 'precise, but not accurate.', 'both accurate and precise.', 'neither accurate nor precise.'], correct: 1 },
    { topic: T.bonding, source: 'Chapter Nine Practice Test', content: 'Which of these choices is a correct Lewis structure for ozone, O3?', imageUrl: img['ch9_q12_ozone_lewis.png'], options: ['A', 'B', 'C', 'D', 'E'], correct: 3 },
    { topic: T.bonding, source: 'Chapter Ten Practice Test', content: 'The number of pi bonds in the molecule below is', imageUrl: img['ch10_q10_pibonds.png'], options: ['2.', '4.', '6.', '10.', '15.'], correct: 1 },
    { topic: T.gases, source: 'Chapter 12 Practice Test (Intermolecular Forces)', content: 'Use the graph of vapor pressure to determine the normal boiling point of O2.', imageUrl: img['ch12_q10_vaporpressure.png'], options: ['92 K', '90 K', '88 K', '84 K', "O2 doesn't boil because it is always a gas."], correct: 1 },
    { topic: T.gases, source: 'Chapter 12 Practice Test (Intermolecular Forces)', content: 'Using the following phase diagram of a certain substance, in what phase is the substance at 50°C and 1 atm pressure?', imageUrl: img['ch12_q11_phase_plain.png'], options: ['solid', 'liquid', 'gas', 'supercritical fluid'], correct: 1 },
    { topic: T.gases, source: 'Chapter 12 Practice Test (Intermolecular Forces)', content: 'Using the following phase diagram, what phase exists at the point labeled a?', imageUrl: img['ch12_q12_q13_phase_labeled.png'], options: ['solid', 'liquid', 'gas'], correct: 0 },
    { topic: T.gases, source: 'Chapter 12 Practice Test (Intermolecular Forces)', content: 'Using the following phase diagram, what phase exists at the point labeled b?', imageUrl: img['ch12_q12_q13_phase_labeled.png'], options: ['solid', 'liquid', 'gas'], correct: 1 },
    { topic: T.atomic, source: 'Honors Chapter Two Practice Test', content: 'In the periodic table figure below, a neutral atom of silicon contains', imageUrl: img['honors2_q13_silicon.png'], options: ['14 electrons.', '28.09 electrons.', '16 electrons.', '38 electrons.'], correct: 0 },
    { topic: T.kinetics, source: 'A.P. Chemistry Practice Test: Ch. 12, Kinetics', content: 'Which one of the following graphs shows the correct relationship between concentration and time for a reaction that is second order in [A]?', imageUrl: img['kin1_q17_graphs.png'], options: ['A', 'B', 'C', 'D', 'E'], correct: 4 },
    { topic: T.kinetics, source: 'A.P. Chemistry Practice Test: Ch. 12, Kinetics', content: 'The graph shown below depicts the relationship between concentration and time for the reaction 2A → C. The slope of this line is equal to __________.', imageUrl: img['kin1_q20_graph.png'], options: ['-k', '-1/k', 'k', 'ln[A]0', '1/k'], correct: 0 },
    { topic: T.kinetics, source: 'A.P. Chemistry Practice Test: Ch. 12, Kinetics', content: 'At elevated temperatures, methylisonitrile (CH3NC) isomerizes to acetonitrile (CH3CN): CH3NC(g) → CH3CN(g). The reaction is first order in methylisonitrile. The attached graph shows data for the reaction obtained at 198.9°C. The rate constant for the reaction is __________ s-1.', imageUrl: img['kin1_q22_graph.png'], options: ['-5.2 × 10⁻⁵', '+1.9 × 10⁴', '+6.2', '-1.9 × 10⁴', '+5.2 × 10⁻⁵'], correct: 4 },
    { topic: T.kinetics, source: 'A.P. Chemistry Practice Test: Ch. 12, Kinetics', content: 'Which energy difference in the energy profile below corresponds to the activation energy for the forward reaction?', imageUrl: img['kin1_q25_energyprofile.png'], options: ['x', 'y', 'x + y', 'y - x', 'x - y'], correct: 0 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'Which of the following is not a possible graph of concentration versus time for a reactant?', imageUrl: img['jasp_q6_graphs.png'], options: ['a', 'b', 'c', 'd'], correct: 2 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'Assuming that each of the following graphs has the same concentration and time axes, which has the greatest initial rate of disappearance of reactant?', imageUrl: img['jasp_q7_graphs.png'], options: ['a', 'b', 'c', 'd'], correct: 0 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'The following graph shows the kinetics curves for the reaction of oxygen with hydrogen to form water: O2(g) + 2H2(g) → 2H2O(g). Which curve is hydrogen?', imageUrl: img['jasp_q8_graph.png'], options: ['the dashed curve', 'the gray curve', 'the black curve', 'either the gray or the black curve', 'Any of these curves could be hydrogen'], correct: 2 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'Which point as labeled by an asterisk (*) on the following energy profile is the transition state?', imageUrl: img['jasp_q41_transitionstate.png'], options: ['a', 'b', 'c', 'd'], correct: 2 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'The energy profiles for four different reactions are shown. Which reaction requires the most energetic collisions to reach the transition state?', imageUrl: img['jasp_q42_energyprofiles.png'], options: ['a', 'b', 'c', 'd'], correct: 1 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'The following energy profiles for four different reactions are shown. Which reaction is the most endothermic?', imageUrl: img['jasp_q43_energyprofiles.png'], options: ['a', 'b', 'c', 'd'], correct: 1 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'The following energy profiles for four different reactions are shown. Which reaction is the most exothermic?', imageUrl: img['jasp_q44_energyprofiles.png'], options: ['a', 'b', 'c', 'd'], correct: 1 },
    { topic: T.kinetics, source: 'Kinetics Extra Practice Problems (Gen Chem II)', content: 'For the reaction diagram shown, which of the following statements is true?', imageUrl: img['jasp_q47_labeleddiagram.png'], options: ['Line W represents the ∆H for the forward reaction; point B represents the transition state', 'Line W represents the activation energy for the forward reaction; point B represents the transition state', 'Line Y represents the activation energy for the forward reaction; point C represents the transition state', 'Line X represents the ∆H for the forward reaction; point B represents the transition state'], correct: 1 },

    // ---- Text-only (tables/diagrams that render fine as plain text) ----
    { topic: T.bonding, source: 'Chapter Nine Practice Test', content: 'A polar covalent bond would form in which one of these pairs of atoms?', options: ['Cl—Cl', 'Si—Si', 'Ca—Cl', 'Cr—Br', 'P—Cl'], correct: 4 },
    { topic: T.bonding, source: 'Chapter Nine Practice Test', content: 'A nonpolar covalent bond (i.e., pure covalent) would form in which of these pairs of atoms?', options: ['Na—Cl', 'H—Cl', 'Li—Br', 'Se—Br', 'Br—Br'], correct: 4 },
    { topic: T.bonding, source: 'Chapter Nine Practice Test', content: 'Which of these covalent bonds is the most polar (i.e., highest percent ionic character)?', options: ['Al—I', 'Si—I', 'Al—Cl', 'Si—Cl', 'Si—P'], correct: 2 },
    { topic: T.quantum, source: 'Chapter Seven Practice Test', content: 'Which one of the following sets of quantum numbers is not possible?\n\n      n   l   ml   ms\nRow 1 4   3   -2   +1/2\nRow 2 3   2   -3   -1/2\nRow 3 3   0   0    +1/2\nRow 4 4   1   1    -1/2\nRow 5 2   0   0    +1/2', options: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'], correct: 1 },
    { topic: T.quantum, source: 'Chapter Seven Practice Test', content: 'A possible set of quantum numbers for the last electron added to complete an atom of gallium Ga in its ground state is\n\n      n   l   ml   ms\nRow 1 4   0   0    -1/2\nRow 2 3   1   0    -1/2\nRow 3 4   1   0    +1/2\nRow 4 3   1   1    +1/2\nRow 5 4   2   1    +1/2', options: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'], correct: 2 },
    { topic: T.quantum, source: 'Chapter Seven Practice Test', content: 'The orbital diagram for a ground-state oxygen atom is\n\n         1s   2s   2p\nRow 1    ↑↓   ↑↓   ↑  ↑  ↑\nRow 2    ↑↓   ↑↓   ↑↓ ↑↓ __\nRow 3    ↑↓   ↑↓   ↑↓ ↑↓ __\nRow 4    ↑↓   ↑↓   ↑↓ ↑  ↑\nRow 5    ↑↓   ↑↓   ↑↓ ↑↓ ↑', options: ['Row 1.', 'Row 2.', 'Row 3.', 'Row 4.', 'Row 5.'], correct: 3 },
    { topic: T.kinetics, source: 'Honors Chapter 14 Practice Test', content: 'Nitric oxide gas (NO) reacts with chlorine gas according to the equation NO + ½Cl2 → NOCl.\n\nThe following initial rates of reaction have been measured for the given reagent concentrations.\n\nExpt.#  Rate(M/hr)  NO(M)  Cl2(M)\n1       1.19        0.50   0.50\n2       4.79        1.00   0.50\n3       9.59        1.00   1.00\n\nWhich of the following is the rate law (rate equation) for this reaction?', options: ['rate = k[NO]', 'rate = k[NO][Cl2]^1/2', 'rate = k[NO][Cl2]', 'rate = k[NO]^2[Cl2]', 'rate = k[NO]^2[Cl2]^2'], correct: 3 },
    { topic: T.kinetics, source: 'Honors Chapter 14 Practice Test', content: 'Nitric oxide reacts with chlorine to form nitrosyl chloride, NOCl: NO + (1/2)Cl2 → NOCl. Use the following data to determine the rate equation for the reaction.\n\nExpt.#  [NO]   [Cl2]   Initial Rate\n1       0.22   0.065   0.96 M/min\n2       0.66   0.065   8.6 M/min\n3       0.44   0.032   1.9 M/min', options: ['rate = k[NO]', 'rate = k[NO][Cl2]^1/2', 'rate = k[NO][Cl2]', 'rate = k[NO]^2[Cl2]', 'rate = k[NO]^2[Cl2]^2'], correct: 3 },
  ];

  const rows = QUESTIONS.map(q => ({
    diagnostic_test_id: TEST_ID,
    topic_id: q.topic,
    content: q.content,
    mcq_options: q.options,
    mcq_correct_index: q.correct,
    image_url: q.imageUrl || null,
    source: q.source,
  }));

  const { error: insError } = await sb.from('diagnostic_questions').insert(rows);
  if (insError) throw insError;
  console.log('Inserted', rows.length, 'questions');

  const { count } = await sb.from('diagnostic_questions').select('id', { count: 'exact', head: true }).eq('diagnostic_test_id', TEST_ID);
  console.log('Total pool size now:', count);
})();
