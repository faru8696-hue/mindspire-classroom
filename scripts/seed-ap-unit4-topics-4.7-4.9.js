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
  '4.7': '88c6a12c-88d5-42b0-b183-db0b4e06e0d8',
  '4.8': '8fd35cca-19cf-4a1e-b0de-a69f805a109c',
  '4.9': '8d27639b-b74a-442e-b317-ef2f699ef511',
};

async function uploadImage(localPath, storageName) {
  const buffer = fs.readFileSync(localPath);
  const { error } = await sb.storage.from('question-images').upload(storageName, buffer, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storageName);
  return data.publicUrl;
}

/* ============================= 4.7 Types of Chemical Reactions ============================= */
const t47 = [
  {
    title: 'Q1 — Molecular and Net Ionic Equations for Three Precipitation Reactions',
    content: `For each of the following pairs of aqueous solutions, write the balanced molecular equation and the balanced net ionic equation for the precipitation reaction that occurs.

(a) Solutions of KOH(aq) and Mg(NO3)2(aq) are combined.
(b) Solutions of AgNO3(aq) and Na2CO3(aq) are combined.
(c) Solutions of K3PO4(aq) and Ca(NO3)2(aq) are combined.

(Recall: all sodium, potassium, ammonium, and nitrate salts are soluble in water.)`,
    answer: `(a) Molecular: 2 KOH(aq) + Mg(NO3)2(aq) → Mg(OH)2(s) + 2 KNO3(aq)
Net ionic: Mg2+(aq) + 2 OH-(aq) → Mg(OH)2(s)
(K+ and NO3- are spectator ions, since all potassium and nitrate salts are soluble.)

(b) Molecular: 2 AgNO3(aq) + Na2CO3(aq) → Ag2CO3(s) + 2 NaNO3(aq)
Net ionic: 2 Ag+(aq) + CO3^2-(aq) → Ag2CO3(s)
(Na+ and NO3- are spectator ions.)

(c) Molecular: 2 K3PO4(aq) + 3 Ca(NO3)2(aq) → Ca3(PO4)2(s) + 6 KNO3(aq)
Net ionic: 3 Ca2+(aq) + 2 PO4^3-(aq) → Ca3(PO4)2(s)
(K+ and NO3- are spectator ions.)`,
  },
  {
    title: 'Q2 — Classifying Six Reactions by Type',
    content: `Classify each of the following balanced equations as a precipitation (double-replacement) reaction, an acid-base reaction, or a redox (oxidation-reduction) reaction.

(a) Zn(s) + 2 HCl(aq) → ZnCl2(aq) + H2(g)
(b) Ca(OH)2(aq) + 2 HCl(aq) → CaCl2(aq) + 2 H2O(l)
(c) AgNO3(aq) + HCl(aq) → AgCl(s) + HNO3(aq)
(d) 2 KOH(aq) + H2SO4(aq) → 2 H2O(l) + K2SO4(aq)
(e) Pb(NO3)2(aq) + K2SO4(aq) → 2 KNO3(aq) + PbSO4(s)
(f) PbS(s) + 4 H2O2(aq) → 4 H2O(l) + PbSO4(s)`,
    answer: `(a) Redox reaction. Zn (oxidation number 0) is oxidized to Zn2+ (+2), while H+ (+1, from HCl) is reduced to H2 (0). This is also a single-replacement reaction, a subtype of redox.

(b) Acid-base reaction. Ca(OH)2 (a base, OH- is the proton acceptor) reacts with HCl (an acid, proton donor) to form water and a salt — a neutralization reaction. No oxidation numbers change.

(c) Precipitation reaction. Ag+ and Cl- combine to form the insoluble solid AgCl(s); no oxidation numbers change and no protons are transferred between the two reactants themselves.

(d) Acid-base reaction. KOH (base) reacts with H2SO4 (acid) to form water and a salt — a neutralization reaction.

(e) Precipitation reaction. Pb2+ and SO4^2- combine to form the insoluble solid PbSO4(s); no oxidation numbers change.

(f) Redox reaction. Sulfur goes from -2 in PbS to +6 in PbSO4 (oxidized), while oxygen goes from -1 in H2O2 to -2 in both H2O and PbSO4 (reduced, since some of the peroxide oxygen is reduced while sulfur is oxidized). This reaction is not a simple precipitation reaction because the sulfide ion is not simply swapping partners — its oxidation state changes.`,
  },
  {
    title: 'Q3 — Reaction Type from a Given Precipitate (Multiple Choice)',
    mcq: true,
    content: `Solutions of Pb(NO3)2(aq) and K2SO4(aq) are combined, and a white solid, PbSO4(s), forms. Which of the following best classifies this reaction, and why?

(A) Acid-base reaction, because ions are exchanged between the two reactants.
(B) Redox reaction, because a new solid is formed.
(C) Precipitation (double-replacement) reaction, because the cations and anions of the two soluble reactants exchange partners to form an insoluble product, with no change in oxidation numbers.
(D) Combustion reaction, because a solid product is released.`,
    answer: `Correct answer: (C)

The reaction is Pb(NO3)2(aq) + K2SO4(aq) → PbSO4(s) + 2 KNO3(aq). The Pb2+ and K+ cations exchange anion partners (NO3- and SO4^2-); this is the defining feature of a double-replacement/precipitation reaction. Checking oxidation numbers confirms no atom is oxidized or reduced (Pb stays +2, S stays +6, O stays -2, K stays +1, N stays +5), ruling out a redox classification.

(A) is incorrect because no protons (H+) are transferred between the two reactants — this criterion for a double-replacement/precipitation reaction is being confused with the defining feature of an acid-base reaction. (B) is incorrect because forming a solid does not by itself indicate a redox reaction; a redox reaction requires a change in oxidation numbers, which does not occur here. (D) is incorrect because combustion specifically requires a species reacting with O2 gas, which does not occur in this reaction.`,
  },
  {
    title: 'Q4 — Identifying the Reaction Type Most Likely to Occur for Given Reactant Pairs',
    content: `For each pair of reactants below, identify which type of reaction (precipitation, acid-base, or redox) is most likely to occur, and briefly justify your choice.

(a) A strong acid, HNO3(aq), is added to a solution of NaOH(aq).
(b) A solution of BaCl2(aq) is added to a solution of Na2SO4(aq).
(c) A strip of solid zinc metal, Zn(s), is placed into a solution of CuSO4(aq).`,
    answer: `(a) Acid-base (neutralization) reaction. HNO3 is a strong acid (H+ donor) and NaOH is a strong base (OH- proton acceptor); they react to form water and a soluble salt: HNO3(aq) + NaOH(aq) → H2O(l) + NaNO3(aq).

(b) Precipitation reaction. Ba2+ and SO4^2- combine to form insoluble BaSO4(s), while Na+ and Cl- remain spectator ions (all sodium and chloride salts other than a few exceptions are soluble): BaCl2(aq) + Na2SO4(aq) → BaSO4(s) + 2 NaCl(aq).

(c) Redox (single-replacement) reaction. Solid Zn (oxidation number 0) is oxidized to Zn2+ as it displaces Cu2+ from solution, while Cu2+ is reduced to solid Cu (0): Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s).`,
  },
];

/* ============================= 4.8 Introduction to Acid-Base Reactions ============================= */
const t48 = [
  {
    title: 'Q1 — Identifying the Acid and Base in Three Neutralization Reactions',
    content: `Each of the following reactions is an acid-base reaction because it involves proton (H+) transfer. For each reaction, identify which reactant is the acid (H+ donor) and which reactant is the base (H+ acceptor).

(a) HBr + NaOH → H2O + NaBr
(b) H2SO4 + Ca(OH)2 → 2 H2O + CaSO4
(c) HNO3 + KOH → H2O + KNO3`,
    answer: `(a) HBr is the acid (it donates H+ to form H2O); NaOH is the base (the OH- ion accepts the H+).

(b) H2SO4 is the acid (it donates H+ ions to form H2O); Ca(OH)2 is the base (the OH- ions accept the H+ ions).

(c) HNO3 is the acid (it donates H+ to form H2O); KOH is the base (the OH- ion accepts the H+).

In all three reactions, the acid's formula begins with H (a partnership between H+ and a negative ion), and the base is a metal hydroxide, whose OH- ion acts as the proton acceptor.`,
  },
  {
    title: 'Q2 — Particle Diagram for HCl Dissolving in Water',
    imageKey: 'hcl',
    content: `Hydrochloric acid (HCl) is classified as a Brønsted-Lowry acid. When HCl dissolves in water, it reacts with water molecules as shown in the particle diagram and equation below.

(a) Identify which species acts as the Brønsted-Lowry acid and which acts as the Brønsted-Lowry base in this reaction.
(b) Explain, in terms of proton transfer, why H2O is acting as a base in this reaction.`,
    answer: `(a) HCl acts as the Brønsted-Lowry acid (proton donor); H2O acts as the Brønsted-Lowry base (proton acceptor).

(b) In this reaction, a proton (H+) is transferred from the HCl molecule to the H2O molecule, forming Cl- and H3O+. Because H2O accepts the H+ ion donated by HCl, it is fulfilling the definition of a Brønsted-Lowry base (a proton acceptor) in this particular reaction.`,
    // image credit: diagram cropped from source PDF, page 3
  },
  {
    title: 'Q3 — Particle Diagram for NH3 Dissolving in Water',
    imageKey: 'nh3',
    content: `Ammonia (NH3) is classified as a Brønsted-Lowry base. When NH3 dissolves in water, it reacts with water molecules as shown in the particle diagram and equation below.

(a) Identify which species acts as the Brønsted-Lowry acid and which acts as the Brønsted-Lowry base in this reaction.
(b) Explain, in terms of proton transfer, why H2O is acting as an acid in this reaction.
(c) Water can act as either an acid or a base, depending on what it reacts with. Referring to this question and Question 2, explain why water is described as amphoteric (or amphiprotic).`,
    answer: `(a) H2O acts as the Brønsted-Lowry acid (proton donor); NH3 acts as the Brønsted-Lowry base (proton acceptor).

(b) In this reaction, a proton (H+) is transferred from the H2O molecule to the NH3 molecule, forming OH- and NH4+. Because H2O donates the H+ ion to NH3, it is fulfilling the definition of a Brønsted-Lowry acid (a proton donor) in this particular reaction.

(c) Water is described as amphoteric (amphiprotic) because it can behave as either an acid or a base, depending on the other species present. In Question 2, water reacted with HCl (a stronger acid than water) and acted as a base, accepting a proton to form H3O+. In this question, water reacted with NH3 (a stronger base than water) and acted as an acid, donating a proton to form OH-. This shows that water's role as an acid or base is not fixed — it depends on whether the substance it is reacting with is a better proton donor or a better proton acceptor than water itself.`,
  },
  {
    title: 'Q4 — Conjugate Bases of Eight Acids',
    content: `For each of the following acids, write the formula and charge of its conjugate base. If the acid has more than one H atom, remove only one H+ ion to form the conjugate base.

HF, HNO3, H2CO3, H2SO4, H3O+, NH4+, HCO3–, HPO4^2–`,
    answer: `HF → F-
HNO3 → NO3-
H2CO3 → HCO3-
H2SO4 → HSO4-
H3O+ → H2O
NH4+ → NH3
HCO3- → CO3^2-
HPO4^2- → PO4^3-

(In each case, the conjugate base is formed by removing a single H+ ion from the acid and adjusting the overall charge by -1.)`,
  },
  {
    title: 'Q5 — Conjugate Acids of Eight Bases',
    content: `For each of the following bases, write the formula and charge of its conjugate acid. Add only one H+ ion to form the conjugate acid.

NH3, ClO–, NO2–, OH–, HCO3–, S2–, SO3^2–, PO4^3–`,
    answer: `NH3 → NH4+
ClO- → HClO
NO2- → HNO2
OH- → H2O
HCO3- → H2CO3
S2- → HS-
SO3^2- → HSO3-
PO4^3- → HPO4^2-

(In each case, the conjugate acid is formed by adding a single H+ ion to the base and adjusting the overall charge by +1.)`,
  },
  {
    title: 'Q6 — Identifying Conjugate Acid-Base Pairs in the Propanoic Acid / Water Reaction',
    content: `Identify both conjugate acid-base pairs in the reaction below.

CH3CH2COOH(aq) + H2O(l) ⇌ CH3CH2COO–(aq) + H3O+(aq)`,
    answer: `Conjugate acid-base pair 1: CH3CH2COOH (acid) and CH3CH2COO- (its conjugate base) — these differ by exactly one H+.

Conjugate acid-base pair 2: H3O+ (acid) and H2O (its conjugate base) — these differ by exactly one H+.

(CH3CH2COOH donates a proton to H2O, forming CH3CH2COO- and H3O+.)`,
  },
  {
    title: 'Q7 — Identifying Conjugate Acid-Base Pairs in the Ethylamine / Water Reaction',
    content: `Identify both conjugate acid-base pairs in the reaction below.

CH3CH2NH2(aq) + H2O(l) ⇌ CH3CH2NH3+(aq) + OH–(aq)`,
    answer: `Conjugate acid-base pair 1: CH3CH2NH3+ (acid) and CH3CH2NH2 (its conjugate base) — these differ by exactly one H+.

Conjugate acid-base pair 2: H2O (acid) and OH- (its conjugate base) — these differ by exactly one H+.

(H2O donates a proton to CH3CH2NH2, forming CH3CH2NH3+ and OH-; here water acts as an acid, consistent with the fact that it is reacting with a base.)`,
  },
];

/* ============================= 4.9 Oxidation-Reduction (Redox) Reactions ============================= */
const t49 = [
  {
    title: 'Q1 — Splitting an Unbalanced Redox Equation into Balanced Half-Reactions',
    content: `The equation below represents a redox reaction, but it is not balanced.

Al(s) + Cu2+(aq) → Al3+(aq) + Cu(s)

(a) Explain why this equation is not completely balanced, even though the atoms already balance on both sides.
(b) Write the oxidation half-reaction and the reduction half-reaction separately, each balanced for both atoms and charge.
(c) Combine the two half-reactions to produce the overall balanced redox equation, with electrons cancelled out on both sides.`,
    answer: `(a) Although the atoms are balanced (1 Al and 1 Cu on each side), the overall charge is not balanced: the left side has a charge of +2 (from Cu2+), while the right side has a charge of +3 (from Al3+). A properly balanced redox equation must be balanced for both atoms and charge, and it must also reflect that the number of electrons lost in oxidation equals the number gained in reduction; as written, aluminum would need to lose 3 electrons per atom while copper only gains 2, so the electrons do not yet cancel.

(b) Oxidation half-reaction: Al → Al3+ + 3 e-
Reduction half-reaction: 2 e- + Cu2+ → Cu

(c) To cancel electrons, multiply the oxidation half-reaction by 2 and the reduction half-reaction by 3, so that both involve 6 electrons:
2 Al → 2 Al3+ + 6 e-
6 e- + 3 Cu2+ → 3 Cu
Adding and cancelling the electrons: 2 Al(s) + 3 Cu2+(aq) → 2 Al3+(aq) + 3 Cu(s)`,
  },
  {
    title: 'Q2 — Combining Half-Reactions to Form Balanced Redox Equations',
    content: `For each pair of half-reactions below, add them together (multiplying as needed) to produce a balanced overall redox equation in which the electrons cancel out on both sides.

(a) Oxidation half-reaction: Fe2+ → Fe3+ + e–
    Reduction half-reaction: 5 e– + MnO4– + 8 H+ → Mn2+ + 4 H2O

(b) Oxidation half-reaction: 2 Cl– → Cl2 + 2 e–
    Reduction half-reaction: 6 e– + 14 H+ + Cr2O7^2– → 2 Cr3+ + 7 H2O

(c) Oxidation half-reaction: Ni → Ni2+ + 2 e–
    Reduction half-reaction: 3 e– + 4 H+ + NO3– → NO + 2 H2O`,
    answer: `(a) Multiply the oxidation half-reaction by 5 so that both half-reactions involve 5 electrons:
5 Fe2+ → 5 Fe3+ + 5 e-
5 e- + MnO4- + 8 H+ → Mn2+ + 4 H2O
Overall: 5 Fe2+ + MnO4- + 8 H+ → 5 Fe3+ + Mn2+ + 4 H2O

(b) Multiply the oxidation half-reaction by 3 so that both half-reactions involve 6 electrons:
6 Cl- → 3 Cl2 + 6 e-
6 e- + 14 H+ + Cr2O7^2- → 2 Cr3+ + 7 H2O
Overall: 6 Cl- + 14 H+ + Cr2O7^2- → 3 Cl2 + 2 Cr3+ + 7 H2O

(c) Multiply the oxidation half-reaction by 3 and the reduction half-reaction by 2 so that both involve 6 electrons:
3 Ni → 3 Ni2+ + 6 e-
6 e- + 8 H+ + 2 NO3- → 2 NO + 4 H2O
Overall: 3 Ni + 8 H+ + 2 NO3- → 3 Ni2+ + 2 NO + 4 H2O`,
  },
  {
    title: 'Q3 — Assigning Oxidation Numbers to a Table of Substances',
    content: `Assign an oxidation number to each atom in the following substances:

Fe, Cl2, NaBr, Fe2O3, MgS, CH3F, CO, KH, HBr, Na2CO3, NH4+, NO3–, SO3^2–, H3O+`,
    answer: `Fe: Fe = 0 (elemental form)
Cl2: Cl = 0 (elemental form)
NaBr: Na = +1, Br = -1
Fe2O3: Fe = +3, O = -2 (sum: 2(+3) + 3(-2) = 0)
MgS: Mg = +2, S = -2
CH3F: C = -2, H = +1 (x3), F = -1 (sum: -2 + 3(+1) + (-1) = 0)
CO: C = +2, O = -2
KH: K = +1, H = -1 (H bonded to a metal)
HBr: H = +1, Br = -1
Na2CO3: Na = +1 (x2), C = +4, O = -2 (x3) (sum: 2(+1) + 4 + 3(-2) = 0)
NH4+: N = -3, H = +1 (x4) (sum: -3 + 4(+1) = +1, matches overall charge)
NO3-: N = +5, O = -2 (x3) (sum: +5 + 3(-2) = -1, matches overall charge)
SO3^2-: S = +4, O = -2 (x3) (sum: +4 + 3(-2) = -2, matches overall charge)
H3O+: H = +1 (x3), O = -2 (sum: 3(+1) + (-2) = +1, matches overall charge)`,
  },
  {
    title: 'Q4 — Identifying the Elements Oxidized and Reduced in Five Balanced Equations',
    content: `For each balanced equation below, assign oxidation numbers to determine which element is oxidized and which element is reduced.

(a) 3 Fe(NO3)2 + 2 Al → 3 Fe + 2 Al(NO3)3
(b) 2 BrO3– + 3 N2H4 → 2 Br– + 6 H2O + 3 N2
(c) P4 + 10 HClO + 6 H2O → 4 H3PO4 + 10 HCl
(d) 2 C2H6 + 7 O2 → 4 CO2 + 6 H2O
(e) Mn + H2SO4 → MnSO4 + H2`,
    answer: `(a) Fe goes from +2 (in Fe(NO3)2) to 0 (in Fe): reduced. Al goes from 0 (in Al) to +3 (in Al(NO3)3): oxidized. (N stays +5, O stays -2 throughout, as spectator elements within the nitrate ion.)

(b) Br goes from +5 (in BrO3-) to -1 (in Br-): reduced. N goes from -2 (in N2H4) to 0 (in N2): oxidized. (H stays +1, O stays -2.)

(c) P goes from 0 (in P4) to +5 (in H3PO4): oxidized. Cl goes from +1 (in HClO) to -1 (in HCl): reduced. (H stays +1, O stays -2.)

(d) C goes from -3 (in C2H6) to +4 (in CO2): oxidized. O goes from 0 (in O2) to -2 (in CO2 and H2O): reduced. (H stays +1.)

(e) Mn goes from 0 (in Mn) to +2 (in MnSO4): oxidized. H goes from +1 (in H2SO4) to 0 (in H2): reduced. (S stays +6, O stays -2.)`,
  },
  {
    title: 'Q5 — Balanced Net Ionic Equations for Six Single-Replacement Redox Reactions',
    content: `Each of the following equations represents a single-replacement redox reaction. For each, write the balanced net ionic equation, omitting any spectator ions.

(a) Ca(s) + 2 HCl(aq) → CaCl2(aq) + H2(g)
(b) 2 Fe(s) + 6 HBr(aq) → 2 FeBr3(aq) + 3 H2(g)
(c) Zn(s) + Ni(NO3)2(aq) → Zn(NO3)2(aq) + Ni(s)
(d) Al(s) + 3 AgNO3(aq) → Al(NO3)3(aq) + 3 Ag(s)`,
    answer: `(a) Ca(s) + 2 H+(aq) → Ca2+(aq) + H2(g)
(Cl- is a spectator ion.)

(b) 2 Fe(s) + 6 H+(aq) → 2 Fe3+(aq) + 3 H2(g)
(Br- is a spectator ion.)

(c) Zn(s) + Ni2+(aq) → Zn2+(aq) + Ni(s)
(NO3- is a spectator ion.)

(d) Al(s) + 3 Ag+(aq) → Al3+(aq) + 3 Ag(s)
(NO3- is a spectator ion.)`,
  },
  {
    title: 'Q6 — Balanced Net Ionic Equations for Two Additional Redox Reactions',
    content: `Write the balanced net ionic equation for each of the following redox reactions, omitting any spectator ions.

(a) Cu(s) + 4 HNO3(aq) → Cu(NO3)2(aq) + 2 H2O(l) + 2 NO2(g)
(b) Br2(aq) + 2 KI(aq) → 2 KBr(aq) + I2(aq)`,
    answer: `(a) Cu(s) + 4 H+(aq) + 2 NO3–(aq) → Cu2+(aq) + 2 H2O(l) + 2 NO2(g)
Only 2 of the 4 NO3- ions are spectators; the other 2 remain in the net ionic equation because they are consumed in forming NO2 gas (N is reduced from +5 in NO3- to +4 in NO2, while Cu is oxidized from 0 to +2).

(b) Br2(aq) + 2 I–(aq) → 2 Br–(aq) + I2(aq)
(K+ is a spectator ion. Br goes from 0 in Br2 to -1 in Br- (reduced); I goes from -1 in I- to 0 in I2 (oxidized).)`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing, error: fetchErr } = await sb
    .from('questions')
    .select('order_index')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: false })
    .limit(1);
  if (fetchErr) throw fetchErr;
  let nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

  const rows = questions.map((q) => ({
    topic_id: topicId,
    title: q.title,
    content: q.mcq ? q.content + JUSTIFY : q.content,
    answer_key: q.answer,
    order_index: nextOrder++,
    ...(q.imageUrl ? { image_url: q.imageUrl } : {}),
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    const scratch = '/private/tmp/claude-501/-Users-faridahmohammed/b6f07a60-ced5-4dcc-a0d5-4c09cda06403/scratchpad';
    const hclUrl = await uploadImage(path.join(scratch, 'hcl2.png'), 'unit4-topic4.8-hcl-water-diagram.png');
    const nh3Url = await uploadImage(path.join(scratch, 'nh3_2.png'), 'unit4-topic4.8-nh3-water-diagram.png');
    console.log('Uploaded images:', hclUrl, nh3Url);

    for (const q of t48) {
      if (q.imageKey === 'hcl') q.imageUrl = hclUrl;
      if (q.imageKey === 'nh3') q.imageUrl = nh3Url;
    }

    await insertTopic('4.7', t47);
    await insertTopic('4.8', t48);
    await insertTopic('4.9', t49);
    console.log('Done.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
