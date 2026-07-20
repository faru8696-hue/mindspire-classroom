// Unit 7 addendum: Naming Acids topic
// Unit 8: Naming Covalent Compounds topic
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const vars = {}
env.split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
})

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

const TOPIC_ACIDS = '9d53acde-4a51-43bf-8b84-4d2feab058fb' // Naming Acids
const TOPIC_COVALENT = '56c78789-3031-404d-95fd-6bcad0589323' // Naming Covalent Compounds

const acidsQuestions = [
  {
    title: 'Q1 — Naming a Binary Acid: HCl(aq)',
    content: 'Name the acid HCl when dissolved in water (aqueous solution).',
    answer_key: `Step 1: Identify the acid type.
HCl contains hydrogen bonded to a single nonmetal (chlorine) with no oxygen present, making it a binary acid.

Step 2: Apply the binary acid naming pattern.
Binary acids are named: hydro- + [nonmetal root] + -ic acid.

Step 3: Apply to chlorine.
The root of "chlorine" is "chlor-," so: hydro + chlor + ic acid.

Final Answer:
Hydrochloric acid`,
  },
  {
    title: 'Q2 — Naming a Binary Acid: HBr(aq)',
    content: 'Name the acid HBr(aq).',
    answer_key: `Step 1: Identify the acid type.
HBr has hydrogen bonded to bromine only, no oxygen — a binary acid.

Step 2: Apply the pattern.
hydro- + brom- + -ic acid.

Final Answer:
Hydrobromic acid`,
  },
  {
    title: 'Q3 — Naming a Binary Acid: H2S(aq)',
    content: 'Name the acid H2S(aq).',
    answer_key: `Step 1: Identify the acid type.
H2S has hydrogen bonded to sulfur only, no oxygen — a binary acid.

Step 2: Apply the pattern.
hydro- + sulfur's root "sulfur-" + -ic acid. (Sulfur keeps its "-ur-" before adding "-ic," giving "sulfuric" as the root form used in acid names.)

Final Answer:
Hydrosulfuric acid`,
  },
  {
    title: 'Q4 — Formula from Name: Hydrofluoric Acid',
    content: 'Write the chemical formula for hydrofluoric acid.',
    answer_key: `Step 1: Recognize the acid type from the name.
The "hydro-...-ic acid" pattern signals a binary acid (hydrogen + one nonmetal, no oxygen).

Step 2: Identify the nonmetal.
"Fluor-" corresponds to fluorine, which forms F- (charge 1-) as an anion.

Step 3: Balance charges to write the formula.
One H+ balances one F- (1+ and 1- cancel).

Final Answer:
HF`,
  },
  {
    title: 'Q5 — Naming an Oxyacid: H2SO4(aq)',
    content: 'Name the acid H2SO4(aq), given that it is derived from the sulfate ion (SO4 2-).',
    answer_key: `Step 1: Identify the acid type.
H2SO4 contains hydrogen bonded to a polyatomic ion that includes oxygen (sulfate) — this makes it an oxyacid.

Step 2: Apply the oxyacid naming rule.
Polyatomic ions ending in "-ate" become acids ending in "-ic acid" (no "hydro-" prefix is used for oxyacids).

Step 3: Apply to sulfate.
Sulfate (-ate) becomes sulfuric (-ic acid).

Final Answer:
Sulfuric acid`,
  },
  {
    title: 'Q6 — Naming an Oxyacid: H2SO3(aq)',
    content: 'Name the acid H2SO3(aq), given that it is derived from the sulfite ion (SO3 2-).',
    answer_key: `Step 1: Identify the acid type.
H2SO3 contains hydrogen bonded to sulfite, a polyatomic ion containing oxygen — an oxyacid.

Step 2: Apply the oxyacid naming rule.
Polyatomic ions ending in "-ite" become acids ending in "-ous acid."

Step 3: Apply to sulfite.
Sulfite (-ite) becomes sulfurous (-ous acid).

Final Answer:
Sulfurous acid`,
  },
  {
    title: 'Q7 — Naming an Oxyacid: HNO3(aq)',
    content: 'Name the acid HNO3(aq), given that it is derived from the nitrate ion (NO3-).',
    answer_key: `Step 1: Identify the acid type.
HNO3 contains hydrogen bonded to nitrate, an oxygen-containing polyatomic ion — an oxyacid.

Step 2: Apply the oxyacid naming rule.
"-ate" ions become "-ic acid" names.

Step 3: Apply to nitrate.
Nitrate becomes nitric acid.

Final Answer:
Nitric acid`,
  },
  {
    title: 'Q8 — Naming an Oxyacid: HNO2(aq)',
    content: 'Name the acid HNO2(aq), given that it is derived from the nitrite ion (NO2-).',
    answer_key: `Step 1: Identify the acid type.
HNO2 contains hydrogen bonded to nitrite, an oxygen-containing polyatomic ion — an oxyacid.

Step 2: Apply the oxyacid naming rule.
"-ite" ions become "-ous acid" names.

Step 3: Apply to nitrite.
Nitrite becomes nitrous acid.

Final Answer:
Nitrous acid`,
  },
  {
    title: 'Q9 — Naming an Oxyacid: H3PO4(aq)',
    content: 'Name the acid H3PO4(aq), given that it is derived from the phosphate ion (PO4 3-).',
    answer_key: `Step 1: Identify the acid type.
H3PO4 contains hydrogen bonded to phosphate, an oxygen-containing polyatomic ion — an oxyacid.

Step 2: Apply the oxyacid naming rule.
"-ate" ions become "-ic acid" names.

Step 3: Apply to phosphate.
Phosphate becomes phosphoric acid.

Final Answer:
Phosphoric acid`,
  },
  {
    title: 'Q10 — Formula from Name: Carbonic Acid',
    content: 'Write the chemical formula for carbonic acid, given that it is derived from the carbonate ion (CO3 2-).',
    answer_key: `Step 1: Recognize the acid type.
"-ic acid" ending derived from an "-ate" polyatomic ion signals an oxyacid built directly from that ion, keeping the same polyatomic ion charge.

Step 2: Identify the ion.
Carbonic acid comes from carbonate, CO3 2-.

Step 3: Balance charges.
Two H+ ions are needed to balance the 2- charge on carbonate.

Final Answer:
H2CO3`,
  },
  {
    title: 'Q11 — Formula from Name: Chlorous Acid',
    content: 'Write the chemical formula for chlorous acid, given that it is derived from the chlorite ion (ClO2-).',
    answer_key: `Step 1: Recognize the acid type.
The "-ous acid" ending signals an oxyacid derived from an "-ite" polyatomic ion.

Step 2: Identify the ion.
Chlorous acid comes from chlorite, ClO2-.

Step 3: Balance charges.
One H+ balances the 1- charge on chlorite.

Final Answer:
HClO2`,
  },
  {
    title: 'Q12 — Distinguishing Acid Names from Molecular/Ionic Names: HCl(g) vs. HCl(aq)',
    content: 'Explain why the same formula, HCl, is named differently depending on its physical state: "hydrogen chloride" as a pure gas versus "hydrochloric acid" when dissolved in water.',
    answer_key: `Step 1: Consider HCl as a gas.
As a pure gas (not dissolved in water), HCl is a covalent molecular compound made of a hydrogen atom and a chlorine atom sharing electrons. It is named using standard molecular naming conventions: "hydrogen chloride."

Step 2: Consider HCl dissolved in water.
When HCl gas dissolves in water, it ionizes completely, releasing H+ (aq) and Cl- (aq) ions into solution. This aqueous H+ ion is what defines an "acid" chemically, so the compound is now named using acid nomenclature rules: "hydrochloric acid."

Step 3: Conclude.
The chemical formula HCl does not change, but the naming system used depends on whether the substance is behaving as a molecular compound (gas phase) or as an acid (aqueous, ionized, producing H+).

Final Answer:
HCl(g) is a covalent molecule named "hydrogen chloride." HCl(aq) is the same formula dissolved in water, producing free H+ ions, so it is named as an acid: "hydrochloric acid." The (aq) label signals that acid-naming rules apply.`,
  },
  {
    title: 'Q13 — Common Mistake: Using "Hydro-" on an Oxyacid',
    content: 'A student named H2SO4 as "hydrosulfuric acid." Explain the error and give the correct name.',
    answer_key: `Step 1: Identify the error.
The "hydro-" prefix is reserved exclusively for binary acids (hydrogen + a single nonmetal, no oxygen). H2SO4 contains the polyatomic ion sulfate (SO4 2-), which includes oxygen, making it an oxyacid — "hydro-" should never appear in an oxyacid name.

Step 2: Determine the correct oxyacid name.
Sulfate ends in "-ate," so the acid name ends in "-ic acid": sulfuric acid.

Step 3: Note the contrast for clarity.
"Hydrosulfuric acid" actually refers to a completely different compound — H2S, the binary acid with no oxygen at all.

Final Answer:
The student incorrectly used the "hydro-" prefix, which only applies to binary (oxygen-free) acids. H2SO4 is an oxyacid derived from sulfate; the correct name is sulfuric acid. (Hydrosulfuric acid is actually the name for H2S.)`,
  },
  {
    title: 'Q14 — Naming an Oxyacid: HClO4(aq) (Per- Prefix Retained)',
    content: 'Name the acid HClO4(aq), given that it is derived from the perchlorate ion (ClO4-).',
    answer_key: `Step 1: Identify the acid type.
HClO4 is derived from perchlorate, an oxygen-containing polyatomic ion — an oxyacid.

Step 2: Apply the oxyacid naming rule, including retained prefixes.
Any "per-" or "hypo-" prefix already present on the polyatomic ion's name carries over unchanged into the acid name; only the suffix changes ("-ate" to "-ic acid").

Step 3: Apply to perchlorate.
Perchlorate (per- + -ate) becomes perchloric acid (per- + -ic acid).

Final Answer:
Perchloric acid`,
  },
  {
    title: 'Q15 — Common Mistake: Forgetting to Balance Charge in an Oxyacid Formula',
    content: 'A student wrote the formula for phosphoric acid (derived from phosphate, PO4 3-) as "HPO4." Identify the error and give the correct formula.',
    answer_key: `Step 1: Check the student's formula for charge balance.
"HPO4" implies one H+ (1+ charge) paired with one phosphate ion (3- charge): 1(1+) + 1(3-) = 2-, which is not neutral. This is incorrect.

Step 2: Determine the correct number of H+ ions needed.
To balance a 3- charge on phosphate, 3 hydrogen ions (each 1+) are required: 3(1+) + 1(3-) = 0.

Final Answer:
The student used only one H+ instead of enough H+ ions to balance phosphate's 3- charge. Correct formula: H3PO4 (phosphoric acid).`,
  },
]

const covalentQuestions = [
  {
    title: 'Q1 — Naming a Covalent Compound: CO2',
    content: 'Name the covalent compound CO2.',
    answer_key: `Step 1: Identify the compound type.
CO2 is composed of two nonmetals (carbon and oxygen), so it is named using the covalent (molecular) prefix system rather than the ionic crisscross system.

Step 2: Name the first element.
Carbon has a subscript of 1 (implied). The "mono-" prefix is omitted on the first element in the name, so it is simply "carbon."

Step 3: Name the second element.
Oxygen has a subscript of 2, so the prefix "di-" is used, and the ending changes to "-ide": "dioxide."

Final Answer:
Carbon dioxide`,
  },
  {
    title: 'Q2 — Naming a Covalent Compound: CO',
    content: 'Name the covalent compound CO.',
    answer_key: `Step 1: Identify the compound type.
CO is two nonmetals (carbon and oxygen) — a molecular compound.

Step 2: Name the first element.
Carbon has a subscript of 1; "mono-" is omitted on the first element: "carbon."

Step 3: Name the second element.
Oxygen has a subscript of 1, so it does use "mono-" here (mono- is only skipped on the FIRST element, never the second): "mono" + "oxide." Since "mono-" ends in a vowel and "oxide" begins with a vowel, the final vowel of the prefix is dropped: "monoxide."

Final Answer:
Carbon monoxide`,
  },
  {
    title: 'Q3 — Naming a Covalent Compound: N2O4',
    content: 'Name the covalent compound N2O4.',
    answer_key: `Step 1: Identify the compound type.
N2O4 is two nonmetals (nitrogen and oxygen) — a molecular compound.

Step 2: Name the first element.
Nitrogen has a subscript of 2, giving the prefix "di-": "dinitrogen."

Step 3: Name the second element.
Oxygen has a subscript of 4, giving the prefix "tetra-": "tetra" + "oxide." Since "tetra-" ends in a vowel and "oxide" begins with a vowel, the final "a" is dropped: "tetroxide."

Final Answer:
Dinitrogen tetroxide`,
  },
  {
    title: 'Q4 — Naming a Covalent Compound: P2O5',
    content: 'Name the covalent compound P2O5.',
    answer_key: `Step 1: Identify the compound type.
P2O5 is two nonmetals (phosphorus and oxygen) — a molecular compound.

Step 2: Name the first element.
Phosphorus has a subscript of 2: "diphosphorus."

Step 3: Name the second element.
Oxygen has a subscript of 5, giving the prefix "penta-": "penta" + "oxide." Since "penta-" ends in a vowel and "oxide" begins with a vowel, the final "a" is dropped: "pentoxide."

Final Answer:
Diphosphorus pentoxide`,
  },
  {
    title: 'Q5 — Naming a Covalent Compound: SF6',
    content: 'Name the covalent compound SF6.',
    answer_key: `Step 1: Identify the compound type.
SF6 is two nonmetals (sulfur and fluorine) — a molecular compound.

Step 2: Name the first element.
Sulfur has a subscript of 1; "mono-" is omitted on the first element: "sulfur."

Step 3: Name the second element.
Fluorine has a subscript of 6, giving the prefix "hexa-": "hexafluoride." (No vowel-dropping needed since "fluoride" begins with a consonant sound "f".)

Final Answer:
Sulfur hexafluoride`,
  },
  {
    title: 'Q6 — Formula from Name: Carbon Tetrachloride',
    content: 'Write the chemical formula for carbon tetrachloride.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Carbon" has no prefix stated, meaning its subscript is 1 (mono- is simply omitted on the first element by convention). "Tetrachloride" has the prefix "tetra-," meaning chlorine's subscript is 4.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
CCl4`,
  },
  {
    title: 'Q7 — Formula from Name: Dinitrogen Trioxide',
    content: 'Write the chemical formula for dinitrogen trioxide.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Dinitrogen" has the prefix "di-," meaning nitrogen's subscript is 2. "Trioxide" has the prefix "tri-," meaning oxygen's subscript is 3.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
N2O3`,
  },
  {
    title: 'Q8 — Formula from Name: Sulfur Trioxide',
    content: 'Write the chemical formula for sulfur trioxide.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Sulfur" has no stated prefix, so its subscript is 1. "Trioxide" has the prefix "tri-," so oxygen's subscript is 3.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
SO3`,
  },
  {
    title: 'Q9 — Formula from Name: Diphosphorus Pentasulfide',
    content: 'Write the chemical formula for diphosphorus pentasulfide.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Diphosphorus" has the prefix "di-," giving phosphorus subscript 2. "Pentasulfide" has the prefix "penta-," giving sulfur subscript 5.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
P2S5`,
  },
  {
    title: 'Q10 — Naming a Covalent Compound: Cl2O7',
    content: 'Name the covalent compound Cl2O7.',
    answer_key: `Step 1: Identify the compound type.
Cl2O7 is two nonmetals (chlorine and oxygen) — a molecular compound.

Step 2: Name the first element.
Chlorine has a subscript of 2: "dichlorine."

Step 3: Name the second element.
Oxygen has a subscript of 7, giving the prefix "hepta-": "hepta" + "oxide," with the final "a" dropped before the vowel in "oxide": "heptoxide."

Final Answer:
Dichlorine heptoxide`,
  },
  {
    title: 'Q11 — Common Mistake: Using "Mono-" on the First Element',
    content: 'A student named CO2 as "monocarbon dioxide." Explain the error and give the correct name.',
    answer_key: `Step 1: Identify the error.
The prefix "mono-" is only used when needed on the SECOND element of a molecular compound's name (to distinguish, e.g., CO from CO2). By convention, "mono-" is always omitted on the first element in the name, even when that element's subscript is 1.

Step 2: Apply the correct rule.
Carbon (subscript 1, first element) needs no prefix at all: simply "carbon." Oxygen (subscript 2, second element) gets "di-": "dioxide."

Final Answer:
The student incorrectly added "mono-" to the first element. Correct name: Carbon dioxide.`,
  },
  {
    title: 'Q12 — Common Mistake: Failing to Drop a Vowel Before "Oxide"',
    content: 'A student named CO as "carbon monooxide." Explain the error and give the correct name.',
    answer_key: `Step 1: Identify the error.
When a prefix ending in a vowel (like "mono-" or "tetra-" or "penta-") is placed directly before a word starting with a vowel (like "oxide"), the final vowel of the prefix is dropped for smoother pronunciation. "Monooxide" keeps both vowels, which is incorrect.

Step 2: Apply the correct rule.
"Mono-" + "oxide" drops the final "o" of "mono-," giving "monoxide."

Final Answer:
The student failed to drop the final vowel of the prefix before a vowel-starting root. Correct name: Carbon monoxide.`,
  },
  {
    title: 'Q13 — Distinguishing Ionic vs. Covalent Naming: MgO vs. NO2',
    content: 'Explain why MgO is named "magnesium oxide" (no prefixes) while NO2 is named "nitrogen dioxide" (using a prefix), even though both compounds involve oxygen.',
    answer_key: `Step 1: Classify each compound.
MgO consists of a metal (magnesium) and a nonmetal (oxygen) — this is an ionic compound. NO2 consists of two nonmetals (nitrogen and oxygen) — this is a covalent (molecular) compound.

Step 2: Explain why the naming systems differ.
Ionic compounds form in a ratio dictated entirely by charge balance (crisscrossing fixed ion charges), so that ratio is never ambiguous and prefixes are unnecessary — "magnesium oxide" can only mean MgO (from Mg2+ and O2-). Covalent compounds between two nonmetals don't have simple, predictable fixed charges, so the same two elements can combine in several different ratios (e.g., NO, NO2, N2O, N2O3, N2O4, N2O5 are all real, distinct compounds) — prefixes are required to specify exactly which ratio is meant.

Final Answer:
MgO is ionic (metal + nonmetal), where charge balance fixes the ratio uniquely, so no prefixes are needed. NO2 is covalent (nonmetal + nonmetal), where multiple different N-O ratios exist, so prefixes are required to specify which compound is meant.`,
  },
  {
    title: 'Q14 — Distinguishing Ionic vs. Covalent Naming: Classify Four Compounds',
    content: 'For each of the following compounds, state whether it should be named using the ionic (Stock/crisscross) system or the covalent (prefix) system, and explain your reasoning: (a) K2O, (b) SO2, (c) FeCl3, (d) PCl5.',
    answer_key: `Step 1: Classify each compound by its elements.
(a) K2O: metal (K) + nonmetal (O) → ionic.
(b) SO2: nonmetal (S) + nonmetal (O) → covalent.
(c) FeCl3: metal (Fe) + nonmetal (Cl) → ionic (and since Fe is a transition metal with variable charge, a Roman numeral is also needed).
(d) PCl5: nonmetal (P) + nonmetal (Cl) → covalent.

Step 2: State the general rule used.
Metal + nonmetal combinations are named ionically (charge-balanced, no prefixes, Roman numerals only for variable-charge metals). Nonmetal + nonmetal combinations are named covalently (Greek prefixes specify the exact ratio, since no simple charge-balance rule applies).

Final Answer:
(a) K2O — ionic: potassium oxide. (b) SO2 — covalent: sulfur dioxide. (c) FeCl3 — ionic: iron(III) chloride. (d) PCl5 — covalent: phosphorus pentachloride.`,
  },
  {
    title: 'Q15 — Naming a Covalent Compound: N2O',
    content: 'Name the covalent compound N2O.',
    answer_key: `Step 1: Identify the compound type.
N2O is two nonmetals (nitrogen and oxygen) — a molecular compound.

Step 2: Name the first element.
Nitrogen has a subscript of 2: "dinitrogen."

Step 3: Name the second element.
Oxygen has a subscript of 1, so "mono-" IS used here (mono- is only omitted on the first element, never the second): "mono" + "oxide," with the vowel dropped: "monoxide."

Final Answer:
Dinitrogen monoxide`,
  },
  {
    title: 'Q16 — Formula from Name: Silicon Dioxide',
    content: 'Write the chemical formula for silicon dioxide.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Silicon" has no stated prefix, so its subscript is 1. "Dioxide" has the prefix "di-," so oxygen's subscript is 2.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
SiO2`,
  },
  {
    title: 'Q17 — Formula from Name: Iodine Pentafluoride',
    content: 'Write the chemical formula for iodine pentafluoride.',
    answer_key: `Step 1: Identify the elements and their prefixes.
"Iodine" has no stated prefix, so its subscript is 1. "Pentafluoride" has the prefix "penta-," so fluorine's subscript is 5.

Step 2: Write the formula.
Combine the elements with their respective subscripts.

Final Answer:
IF5`,
  },
]

async function insertBatch(topicId, questionList) {
  const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1)
  let idx = (existing[0]?.order_index ?? -1) + 1
  const rows = questionList.map(q => ({ ...q, topic_id: topicId, order_index: idx++ }))
  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) {
    console.error(`Insert failed for topic ${topicId}:`, error)
    process.exit(1)
  }
  console.log(`Inserted ${data.length} questions into topic ${topicId}.`)
}

async function main() {
  await insertBatch(TOPIC_ACIDS, acidsQuestions)
  await insertBatch(TOPIC_COVALENT, covalentQuestions)
  console.log('Done.')
}

main()
