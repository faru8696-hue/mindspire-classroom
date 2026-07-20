// Unit 7: Ionic and Metallic Bonding
// Topic A (Ion Formation and the Octet Rule): predicting ion charge, ion electron configs, isoelectronic principle
// Topic B (Naming and Writing Ionic Compound Formulas): binary, transition-metal (Stock/Roman numeral), polyatomic
// Topic C (Metallic Bonding): electron sea model, malleability/ductility/conductivity/luster, alloys, contrast with ionic
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

const TOPIC_OCTET = 'ba1c41b6-c1ce-48d9-bdc1-2764568f7833' // Ion Formation and the Octet Rule
const TOPIC_NAMING = '33ea0824-694f-41d1-8a48-95f258b1bba0' // Naming and Writing Ionic Compound Formulas
const TOPIC_METALLIC = '1315c329-117b-4c22-92a7-1d3970856ce5' // Metallic Bonding

const octetQuestions = [
  {
    title: 'Q1 — Predicting Ion Charge: Sodium',
    content: 'Using the octet rule, predict the charge of the ion that sodium (Na, Group 1) forms, and explain your reasoning.',
    answer_key: `Step 1: Write sodium's electron configuration.
Na: 1s2 2s2 2p6 3s1 — 1 valence electron.

Step 2: Apply the octet rule.
Sodium has only 1 valence electron, so it is much "cheaper" (energetically) to lose that 1 electron than to gain 7 more to fill the shell. Losing it leaves a full, stable octet in the shell beneath (n=2).

Step 3: Determine the resulting charge.
Losing 1 electron (negative charge) while the proton count stays the same leaves a net charge of +1.

Final Answer:
Na forms a 1+ ion (Na+), because it loses its single valence electron to achieve a stable noble-gas configuration.`,
  },
  {
    title: 'Q2 — Ion Electron Configuration: Na+',
    content: 'Write the full electron configuration of the sodium ion (Na+), and name the noble gas it is isoelectronic with.',
    answer_key: `Step 1: Start from neutral sodium.
Na (neutral): 1s2 2s2 2p6 3s1 (11 electrons).

Step 2: Remove one electron to form Na+.
Na+ has 11 - 1 = 10 electrons, so remove the outermost (3s1) electron.

Step 3: Write the ion's configuration.
Na+: 1s2 2s2 2p6.

Step 4: Identify the isoelectronic noble gas.
This is the same electron configuration as neon (Ne), which also has 10 electrons.

Final Answer:
Na+: 1s2 2s2 2p6 — isoelectronic with neon.`,
  },
  {
    title: 'Q3 — Predicting Ion Charge and Configuration: Magnesium',
    content: 'Predict the charge of the ion magnesium (Mg, Group 2) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral magnesium's configuration.
Mg: 1s2 2s2 2p6 3s2 — 2 valence electrons.

Step 2: Apply the octet rule.
Losing both 3s electrons is far more favorable than gaining 6 electrons, so magnesium loses 2 electrons to reach a full octet in the n=2 shell.

Step 3: Determine the charge.
Losing 2 electrons gives a net charge of 2+.

Step 4: Write the ion's configuration.
Mg2+: 1s2 2s2 2p6 (isoelectronic with neon, 10 electrons).

Final Answer:
Mg forms Mg2+, with electron configuration 1s2 2s2 2p6.`,
  },
  {
    title: 'Q4 — Predicting Ion Charge and Configuration: Aluminum',
    content: 'Predict the charge of the ion aluminum (Al, Group 13) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral aluminum's configuration.
Al: 1s2 2s2 2p6 3s2 3p1 — 3 valence electrons.

Step 2: Apply the octet rule.
Losing 3 electrons (to expose the full n=2 octet) is much more favorable than gaining 5 electrons to fill the n=3 shell.

Step 3: Determine the charge.
Losing 3 electrons gives a net charge of 3+.

Step 4: Write the ion's configuration.
Al3+: 1s2 2s2 2p6 (isoelectronic with neon).

Final Answer:
Al forms Al3+, with electron configuration 1s2 2s2 2p6.`,
  },
  {
    title: 'Q5 — Predicting Ion Charge and Configuration: Chlorine',
    content: 'Predict the charge of the ion chlorine (Cl, Group 17) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral chlorine's configuration.
Cl: 1s2 2s2 2p6 3s2 3p5 — 7 valence electrons.

Step 2: Apply the octet rule.
Chlorine needs just 1 more electron to complete its octet (3s2 3p6), which is far more favorable than losing 7 electrons.

Step 3: Determine the charge.
Gaining 1 electron (extra negative charge) gives a net charge of 1-.

Step 4: Write the ion's configuration.
Cl-: 1s2 2s2 2p6 3s2 3p6 (isoelectronic with argon, 18 electrons).

Final Answer:
Cl forms Cl- (chloride ion), with electron configuration 1s2 2s2 2p6 3s2 3p6.`,
  },
  {
    title: 'Q6 — Predicting Ion Charge and Configuration: Oxygen',
    content: 'Predict the charge of the ion oxygen (O, Group 16) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral oxygen's configuration.
O: 1s2 2s2 2p4 — 6 valence electrons.

Step 2: Apply the octet rule.
Oxygen needs 2 more electrons to complete its octet (2s2 2p6), which is much more favorable than losing 6 electrons.

Step 3: Determine the charge.
Gaining 2 electrons gives a net charge of 2-.

Step 4: Write the ion's configuration.
O2-: 1s2 2s2 2p6 (isoelectronic with neon).

Final Answer:
O forms O2- (oxide ion), with electron configuration 1s2 2s2 2p6.`,
  },
  {
    title: 'Q7 — Predicting Ion Charge and Configuration: Nitrogen',
    content: 'Predict the charge of the ion nitrogen (N, Group 15) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral nitrogen's configuration.
N: 1s2 2s2 2p3 — 5 valence electrons.

Step 2: Apply the octet rule.
Nitrogen needs 3 more electrons to complete its octet (2s2 2p6), which is more favorable than losing 5 electrons.

Step 3: Determine the charge.
Gaining 3 electrons gives a net charge of 3-.

Step 4: Write the ion's configuration.
N3-: 1s2 2s2 2p6 (isoelectronic with neon).

Final Answer:
N forms N3- (nitride ion), with electron configuration 1s2 2s2 2p6.`,
  },
  {
    title: 'Q8 — Predicting Ion Charge and Configuration: Potassium',
    content: 'Predict the charge of the ion potassium (K, Group 1) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral potassium's configuration.
K: 1s2 2s2 2p6 3s2 3p6 4s1 — 1 valence electron.

Step 2: Apply the octet rule.
Losing the single 4s electron is far more favorable than gaining 7 electrons.

Step 3: Determine the charge.
Losing 1 electron gives a net charge of 1+.

Step 4: Write the ion's configuration.
K+: 1s2 2s2 2p6 3s2 3p6 (isoelectronic with argon, 18 electrons).

Final Answer:
K forms K+, with electron configuration 1s2 2s2 2p6 3s2 3p6.`,
  },
  {
    title: 'Q9 — Predicting Ion Charge and Configuration: Sulfur',
    content: 'Predict the charge of the ion sulfur (S, Group 16) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral sulfur's configuration.
S: 1s2 2s2 2p6 3s2 3p4 — 6 valence electrons.

Step 2: Apply the octet rule.
Sulfur needs 2 more electrons to complete its octet (3s2 3p6), which is more favorable than losing 6 electrons.

Step 3: Determine the charge.
Gaining 2 electrons gives a net charge of 2-.

Step 4: Write the ion's configuration.
S2-: 1s2 2s2 2p6 3s2 3p6 (isoelectronic with argon).

Final Answer:
S forms S2- (sulfide ion), with electron configuration 1s2 2s2 2p6 3s2 3p6.`,
  },
  {
    title: 'Q10 — Predicting Ion Charge and Configuration: Calcium',
    content: 'Predict the charge of the ion calcium (Ca, Group 2) forms, and write the electron configuration of the resulting ion.',
    answer_key: `Step 1: Write neutral calcium's configuration.
Ca: 1s2 2s2 2p6 3s2 3p6 4s2 — 2 valence electrons.

Step 2: Apply the octet rule.
Losing both 4s electrons is much more favorable than gaining 6 electrons.

Step 3: Determine the charge.
Losing 2 electrons gives a net charge of 2+.

Step 4: Write the ion's configuration.
Ca2+: 1s2 2s2 2p6 3s2 3p6 (isoelectronic with argon).

Final Answer:
Ca forms Ca2+, with electron configuration 1s2 2s2 2p6 3s2 3p6.`,
  },
  {
    title: 'Q11 — Conceptual: Why Alkali Metals Form 1+ Ions, Not 2+',
    content: 'Alkali metals (Group 1) always form 1+ ions, never 2+ ions. Explain why, in terms of energy and electron configuration.',
    answer_key: `Step 1: Consider the first electron removed.
An alkali metal's single valence electron (e.g., Na's 3s1) is in a shell by itself, farther from the nucleus and well-shielded by the inner electrons. It is relatively easy to remove, and removing it exposes a full, stable noble-gas octet underneath.

Step 2: Consider what a second ionization would require.
To form a 2+ ion, a second electron would have to be pulled out of the now-complete, lower-energy octet shell (e.g., a 2p electron in Na+). This shell is much closer to the nucleus and no longer shielded by an outer electron, so removing an electron from it requires a huge jump in energy (the second ionization energy is many times larger than the first for these elements).

Step 3: Conclude.
Because forming a 2+ ion would mean breaking into an already-stable, lower-energy noble-gas core — which costs far more energy than is released when the ion forms a bond — alkali metals stop at 1+.

Final Answer:
Alkali metals form only 1+ ions because losing the single, loosely-held valence electron reaches a stable octet; removing a second electron would require breaking into that newly-completed, tightly-held noble-gas core, which costs a prohibitively large amount of energy.`,
  },
  {
    title: 'Q12 — Conceptual: Why Noble Gases Do Not Typically Form Ions',
    content: 'Explain why noble gases (Group 18) do not typically gain, lose, or share electrons to form ions.',
    answer_key: `Step 1: Consider their valence shell.
Noble gases already have a completely full valence shell (an octet, or 2 electrons for helium). This is the exact configuration that other atoms are trying to achieve by forming ions.

Step 2: Consider the energy cost of change.
Since the valence shell is already full and stable, gaining an electron would force an electron into a new, higher-energy shell (unfavorable), and losing an electron would break apart an already-stable, low-energy filled shell (also unfavorable, requiring a very high ionization energy).

Step 3: Conclude.
Because both directions of change move the atom away from its already-ideal stable state, there is no energetic incentive for noble gases to form ions under normal conditions.

Final Answer:
Noble gases already possess a stable, full-octet valence shell, so neither gaining nor losing electrons improves their stability — both directions cost energy rather than releasing it, which is why they are largely unreactive and do not typically form ions.`,
  },
  {
    title: 'Q13 — Conceptual: The Isoelectronic Principle',
    content: 'Define what it means for two species to be "isoelectronic," and give one example pair (an ion and a noble gas atom) that illustrates the term.',
    answer_key: `Step 1: Define the term.
Isoelectronic species are atoms or ions that have the identical electron configuration (the same number and arrangement of electrons), even though they may have different numbers of protons (and therefore different identities/charges).

Step 2: Give an example.
The fluoride ion, F-, has 10 electrons: 1s2 2s2 2p6. The noble gas neon (Ne) also has 10 electrons with the same configuration: 1s2 2s2 2p6. Even though F- has 9 protons and Ne has 10 protons, their electron arrangements are identical, so they are isoelectronic.

Final Answer:
Isoelectronic species share the same electron configuration despite having different proton counts. Example: F- and Ne are isoelectronic (both 1s2 2s2 2p6, 10 electrons).`,
  },
  {
    title: 'Q14 — Ion Electron Configuration: Iron(II), a Transition Metal Example',
    content: 'Write the electron configuration of the iron(II) ion, Fe2+, given that neutral iron is [Ar] 3d6 4s2. Explain which electrons are removed first.',
    answer_key: `Step 1: Write neutral iron's configuration.
Fe: [Ar] 3d6 4s2 (26 electrons total).

Step 2: Determine which electrons are removed first.
For transition metals, electrons are removed from the outermost occupied shell (the 4s subshell) before any 3d electrons, because once electrons occupy the 3d subshell, it drops below 4s in energy for the ion — so the 4s electrons become the "last in, first out" electrons.

Step 3: Remove 2 electrons from 4s.
Fe2+: [Ar] 3d6 (24 electrons), with both 4s electrons removed and the 3d6 subshell left intact.

Final Answer:
Fe2+: [Ar] 3d6. The two 4s electrons are removed first (before any 3d electrons), which is a key exception to the "fill order" used for neutral-atom configurations.`,
  },
  {
    title: 'Q15 — Predicting Charge from Group Number: Barium and Bromine',
    content: 'Using only their group numbers, predict the ionic charge for barium (Ba, Group 2) and bromine (Br, Group 17), and explain the shortcut you used.',
    answer_key: `Step 1: State the group-number shortcut.
For main-group metals in Groups 1, 2, and 13, ionic charge = the group number (they lose that many electrons). For main-group nonmetals in Groups 15-17, ionic charge = 8 minus the group number (they gain enough electrons to reach 8 total valence electrons).

Step 2: Apply to barium.
Ba is in Group 2, so it loses 2 electrons: charge = 2+.

Step 3: Apply to bromine.
Br is in Group 17, so charge = 8 - 17... using the "8 minus group number" shortcut properly for the A-group numbering (VIIA = 7 valence electrons), Br gains 1 electron: charge = 1-.

Final Answer:
Ba2+ and Br-. The shortcut: metals in Groups 1/2/13 lose electrons equal to the group number; nonmetals gain enough electrons so their valence electron count reaches 8 (Group 17 elements have 7 valence electrons and need just 1 more).`,
  },
  {
    title: 'Q16 — Ion Formation: Comparing Two Group 1 Metals',
    content: 'Both lithium (Li) and cesium (Cs) form 1+ ions. Write the electron configuration of each ion, and explain why cesium loses its valence electron more easily than lithium does, even though both form the same charge.',
    answer_key: `Step 1: Write each ion's configuration.
Li: 1s2 2s1 → Li+: 1s2 (isoelectronic with helium).
Cs: [Xe] 6s1 → Cs+: [Xe] (isoelectronic with xenon).

Step 2: Compare ease of electron removal.
Both lose their single valence electron to reach a noble-gas configuration, giving the same 1+ charge. However, cesium's valence electron sits in the 6s subshell, much farther from the nucleus and shielded by many more inner electron shells than lithium's 2s electron. The weaker attraction to the nucleus over that greater distance means cesium's valence electron is held much more loosely.

Step 3: Conclude.
This is why cesium has a much lower first ionization energy than lithium, even though both form ions with the same charge — ionic charge depends on the octet rule, but the ease of forming the ion depends on atomic size and shielding.

Final Answer:
Li+: 1s2; Cs+: [Xe]. Cesium loses its electron more easily because its valence electron is in a much larger, more shielded shell (6s vs. 2s), farther from the nucleus's pull, even though both elements form the same 1+ charge.`,
  },
  {
    title: 'Q17 — Common Mistake: Identifying an Incorrect Ion Charge',
    content: 'A student claims that oxygen (O) forms an O6+ ion by losing its 6 valence electrons. Explain what is wrong with this reasoning and state the correct ion oxygen actually forms.',
    answer_key: `Step 1: Identify the error.
The student is technically correct that oxygen has 6 valence electrons, but incorrectly assumes atoms always lose electrons to form ions. The octet rule says atoms form whichever ion requires the SMALLER number of electrons to move — losing 6 electrons is far less favorable than gaining just 2.

Step 2: Determine the correct pathway.
Oxygen needs only 2 more electrons to complete its octet (going from 2s2 2p4 to 2s2 2p6), which is a much smaller and more energetically favorable change than losing 6 electrons.

Step 3: State the correct ion.
Oxygen gains 2 electrons to form O2- (isoelectronic with neon), not O6+.

Final Answer:
The student's error is assuming oxygen always loses electrons; nonmetals near the right side of the periodic table gain electrons instead, because it takes far less energy. Oxygen actually forms O2-, not O6+.`,
  },
  {
    title: 'Q18 — Synthesis: Same Electron Count, Three Different Species',
    content: 'The ions Mg2+, Na+, and F- all have 10 electrons. Write the shared electron configuration, name the neutral noble gas they are all isoelectronic with, and explain why these three species have different sizes despite having identical electron configurations.',
    answer_key: `Step 1: Write the shared configuration.
All three species have the configuration 1s2 2s2 2p6 (10 electrons total), identical to neutral neon (Ne).

Step 2: Explain the size difference.
Although all three have the same number of electrons in the same arrangement, they have different numbers of protons: F- has 9 protons, Na+ has 11 protons, and Mg2+ has 13 protons.

Step 3: Connect proton count to size.
More protons means a stronger net positive pull on the same 10 electrons (higher effective nuclear charge per electron), which pulls the electron cloud in more tightly. So among isoelectronic species, the one with the most protons is the smallest.

Final Answer:
All three share the configuration 1s2 2s2 2p6, isoelectronic with neon. Despite identical electron arrangements, Mg2+ < Na+ < F- in size, because increasing proton count (13, 11, 9 respectively) pulls the same 10 electrons in more tightly.`,
  },
]

const namingQuestions = [
  {
    title: 'Q1 — Formula from Name: Binary Compound (Potassium Bromide)',
    content: 'Write the correct chemical formula for potassium bromide.',
    answer_key: `Step 1: Identify the ions.
Potassium: K+ (Group 1). Bromide: Br- (Group 17).

Step 2: Balance the charges (crisscross method).
The charges are already equal in magnitude (1+ and 1-), so one of each ion balances the charge to zero.

Final Answer:
KBr`,
  },
  {
    title: 'Q2 — Formula from Name: Binary Compound (Calcium Oxide)',
    content: 'Write the correct chemical formula for calcium oxide.',
    answer_key: `Step 1: Identify the ions.
Calcium: Ca2+ (Group 2). Oxide: O2- (Group 16).

Step 2: Balance the charges.
The charges are equal in magnitude (2+ and 2-), so a 1:1 ratio balances to zero. Note: the crisscross of the "2"s would give Ca2O2, but this must be reduced to the lowest whole-number ratio.

Final Answer:
CaO`,
  },
  {
    title: 'Q3 — Formula from Name: Binary Compound (Aluminum Oxide)',
    content: 'Write the correct chemical formula for aluminum oxide.',
    answer_key: `Step 1: Identify the ions.
Aluminum: Al3+ (Group 13). Oxide: O2- (Group 16).

Step 2: Balance the charges using the crisscross method.
The charge magnitudes (3 and 2) become the subscripts of the other ion: Al gets a subscript of 2, O gets a subscript of 3.

Step 3: Check the ratio is in lowest terms.
2:3 has no common factor, so it cannot be reduced further.

Step 4: Verify charge balance.
2(3+) + 3(2-) = 6+ + 6- = 0. Balanced.

Final Answer:
Al2O3`,
  },
  {
    title: 'Q4 — Formula from Name: Binary Compound (Magnesium Nitride)',
    content: 'Write the correct chemical formula for magnesium nitride.',
    answer_key: `Step 1: Identify the ions.
Magnesium: Mg2+ (Group 2). Nitride: N3- (Group 15).

Step 2: Crisscross the charge magnitudes.
Mg gets subscript 3, N gets subscript 2.

Step 3: Check for reduction.
3:2 has no common factor.

Step 4: Verify charge balance.
3(2+) + 2(3-) = 6+ + 6- = 0. Balanced.

Final Answer:
Mg3N2`,
  },
  {
    title: 'Q5 — Name from Formula: Binary Compound (Li2S)',
    content: 'Name the ionic compound Li2S.',
    answer_key: `Step 1: Identify the ions present.
Li+ (lithium, Group 1) and S2- (sulfide, Group 16).

Step 2: Confirm the formula makes sense.
Two Li+ ions (total 2+) balance one S2- ion (2-): 2(1+) + 1(2-) = 0. Balanced.

Step 3: Name the compound.
Cation name stays the same (lithium); anion becomes "sulfide" (root + -ide). Binary ionic compounds never use prefixes like "di-" or "tri-" — those are for molecular (covalent) compounds only.

Final Answer:
Lithium sulfide`,
  },
  {
    title: 'Q6 — Name from Formula: Binary Compound (AlCl3)',
    content: 'Name the ionic compound AlCl3.',
    answer_key: `Step 1: Identify the ions present.
Al3+ (aluminum) and Cl- (chloride).

Step 2: Confirm charge balance.
1(3+) + 3(1-) = 0. Balanced.

Step 3: Name the compound.
Cation keeps its element name (aluminum); anion becomes "chloride." No prefixes are used for ionic compounds — the subscript 3 is implied by the fixed charges, not stated in the name.

Final Answer:
Aluminum chloride`,
  },
  {
    title: 'Q7 — Formula from Name: Transition Metal, Stock System (Iron(III) Oxide)',
    content: 'Write the correct chemical formula for iron(III) oxide.',
    answer_key: `Step 1: Interpret the Roman numeral.
"Iron(III)" tells you the charge on the iron ion directly: Fe3+.

Step 2: Identify the anion.
Oxide is O2-.

Step 3: Crisscross the charge magnitudes.
Fe gets subscript 2, O gets subscript 3.

Step 4: Verify charge balance.
2(3+) + 3(2-) = 6+ + 6- = 0. Balanced.

Final Answer:
Fe2O3`,
  },
  {
    title: 'Q8 — Formula from Name: Transition Metal, Stock System (Copper(I) Sulfide)',
    content: 'Write the correct chemical formula for copper(I) sulfide.',
    answer_key: `Step 1: Interpret the Roman numeral.
"Copper(I)" means the copper ion has a charge of 1+: Cu+.

Step 2: Identify the anion.
Sulfide is S2-.

Step 3: Crisscross the charge magnitudes.
Cu gets subscript 2, S gets subscript 1 (omitted).

Step 4: Verify charge balance.
2(1+) + 1(2-) = 2+ + 2- = 0. Balanced.

Final Answer:
Cu2S`,
  },
  {
    title: 'Q9 — Formula from Name: Transition Metal, Stock System (Tin(IV) Chloride)',
    content: 'Write the correct chemical formula for tin(IV) chloride.',
    answer_key: `Step 1: Interpret the Roman numeral.
"Tin(IV)" means the tin ion has a charge of 4+: Sn4+.

Step 2: Identify the anion.
Chloride is Cl-.

Step 3: Crisscross the charge magnitudes.
Sn gets subscript 1 (omitted), Cl gets subscript 4.

Step 4: Verify charge balance.
1(4+) + 4(1-) = 4+ + 4- = 0. Balanced.

Final Answer:
SnCl4`,
  },
  {
    title: 'Q10 — Name from Formula: Transition Metal, Determining the Roman Numeral (CuO)',
    content: 'Name the ionic compound CuO, including the correct Roman numeral.',
    answer_key: `Step 1: Identify the known ion.
Oxide is always O2-.

Step 2: Work backward to find copper's charge.
Since there is one O2- ion contributing 2- total charge, the one Cu ion must contribute 2+ to balance: Cu2+.

Step 3: Assign the Roman numeral.
Copper(II) indicates the 2+ charge.

Final Answer:
Copper(II) oxide`,
  },
  {
    title: 'Q11 — Name from Formula: Transition Metal, Determining the Roman Numeral (Fe2S3)',
    content: 'Name the ionic compound Fe2S3, including the correct Roman numeral.',
    answer_key: `Step 1: Identify the known ion.
Sulfide is always S2-. Three sulfide ions contribute a total charge of 3 x (2-) = 6-.

Step 2: Work backward to find iron's charge.
Two iron ions must together contribute 6+ to balance, so each iron ion is 6+ / 2 = 3+.

Step 3: Assign the Roman numeral.
Iron(III) indicates the 3+ charge.

Final Answer:
Iron(III) sulfide`,
  },
  {
    title: 'Q12 — Name from Formula: Transition Metal, Determining the Roman Numeral (PbO2)',
    content: 'Name the ionic compound PbO2, including the correct Roman numeral.',
    answer_key: `Step 1: Identify the known ion.
Oxide is always O2-. Two oxide ions contribute a total charge of 2 x (2-) = 4-.

Step 2: Work backward to find lead's charge.
One lead ion must contribute 4+ to balance.

Step 3: Assign the Roman numeral.
Lead(IV) indicates the 4+ charge.

Final Answer:
Lead(IV) oxide`,
  },
  {
    title: 'Q13 — Formula from Name: Polyatomic Ion Compound (Sodium Sulfate)',
    content: 'Write the correct chemical formula for sodium sulfate.',
    answer_key: `Step 1: Identify the ions.
Sodium: Na+. Sulfate: SO4 2- (polyatomic ion, must be memorized).

Step 2: Balance the charges.
One Na+ (1+) balances one sulfate ion (2-)... this does not balance on its own, so two Na+ ions are needed: 2(1+) + 1(2-) = 0.

Final Answer:
Na2SO4`,
  },
  {
    title: 'Q14 — Formula from Name: Polyatomic Ion Compound (Calcium Phosphate)',
    content: 'Write the correct chemical formula for calcium phosphate.',
    answer_key: `Step 1: Identify the ions.
Calcium: Ca2+. Phosphate: PO4 3- (polyatomic ion).

Step 2: Crisscross the charge magnitudes.
Ca gets subscript 3, the phosphate group gets subscript 2. Since phosphate is polyatomic, it must be enclosed in parentheses when it has a subscript greater than 1: Ca3(PO4)2.

Step 3: Verify the ratio is in lowest terms.
3:2 has no common factor.

Step 4: Verify charge balance.
3(2+) + 2(3-) = 6+ + 6- = 0. Balanced.

Final Answer:
Ca3(PO4)2`,
  },
  {
    title: 'Q15 — Formula from Name: Polyatomic Ion Compound (Ammonium Carbonate)',
    content: 'Write the correct chemical formula for ammonium carbonate.',
    answer_key: `Step 1: Identify the ions.
Ammonium: NH4+ (a polyatomic cation — one of the few common polyatomic ions that is positively charged). Carbonate: CO3 2-.

Step 2: Balance the charges.
Since ammonium is 1+ and carbonate is 2-, two ammonium ions are needed to balance one carbonate ion: 2(1+) + 1(2-) = 0. Because ammonium has a subscript greater than 1, it must be enclosed in parentheses: (NH4)2CO3.

Final Answer:
(NH4)2CO3`,
  },
  {
    title: 'Q16 — Formula from Name: Polyatomic Ion Compound (Aluminum Hydroxide)',
    content: 'Write the correct chemical formula for aluminum hydroxide.',
    answer_key: `Step 1: Identify the ions.
Aluminum: Al3+. Hydroxide: OH- (polyatomic ion, charge 1-).

Step 2: Crisscross the charge magnitudes.
Al gets subscript 1 (omitted), hydroxide gets subscript 3. Since hydroxide has a subscript greater than 1, it is enclosed in parentheses: Al(OH)3.

Step 3: Verify charge balance.
1(3+) + 3(1-) = 3+ + 3- = 0. Balanced.

Final Answer:
Al(OH)3`,
  },
  {
    title: 'Q17 — Name from Formula: Polyatomic Ion Compound (KNO3)',
    content: 'Name the ionic compound KNO3.',
    answer_key: `Step 1: Identify the ions.
K+ (potassium) and NO3- (nitrate, a polyatomic ion).

Step 2: Confirm charge balance.
1(1+) + 1(1-) = 0. Balanced, so a 1:1 ratio is correct and no Roman numeral is needed (potassium is a Group 1 metal with a fixed charge).

Final Answer:
Potassium nitrate`,
  },
  {
    title: 'Q18 — Name from Formula: Polyatomic Ion Compound (Mg3(PO4)2)',
    content: 'Name the ionic compound Mg3(PO4)2.',
    answer_key: `Step 1: Identify the ions.
Mg2+ (magnesium, fixed charge) and PO4 3- (phosphate, polyatomic ion).

Step 2: Confirm charge balance.
3(2+) + 2(3-) = 6+ + 6- = 0. Balanced.

Step 3: Name the compound.
Magnesium has a fixed charge (Group 2), so no Roman numeral is needed.

Final Answer:
Magnesium phosphate`,
  },
  {
    title: 'Q19 — Name from Formula: Polyatomic Ion Compound with Transition Metal (Fe(NO3)3)',
    content: 'Name the ionic compound Fe(NO3)3, including the correct Roman numeral.',
    answer_key: `Step 1: Identify the known ion.
Nitrate is always NO3-. Three nitrate ions contribute a total charge of 3 x (1-) = 3-.

Step 2: Work backward to find iron's charge.
One iron ion must contribute 3+ to balance.

Step 3: Assign the Roman numeral.
Iron(III) indicates the 3+ charge.

Final Answer:
Iron(III) nitrate`,
  },
  {
    title: 'Q20 — Name from Formula: Polyatomic Ion Compound with Transition Metal (CuSO4)',
    content: 'Name the ionic compound CuSO4, including the correct Roman numeral.',
    answer_key: `Step 1: Identify the known ion.
Sulfate is always SO4 2-.

Step 2: Work backward to find copper's charge.
One sulfate ion contributes 2-, so the one copper ion must contribute 2+ to balance.

Step 3: Assign the Roman numeral.
Copper(II) indicates the 2+ charge.

Final Answer:
Copper(II) sulfate`,
  },
  {
    title: 'Q21 — Common Mistake: Charge Balance Error',
    content: 'A student wrote the formula "CaCl" for calcium chloride. Identify the error and write the correct formula.',
    answer_key: `Step 1: Identify the ions.
Calcium: Ca2+. Chloride: Cl-.

Step 2: Check the student's formula for charge balance.
"CaCl" implies one Ca2+ (2+) and one Cl- (1-): 1(2+) + 1(1-) = 1+, which is NOT zero. The charges do not balance, so this formula is incorrect.

Step 3: Correct the formula.
Since Ca is 2+ and Cl is 1-, two chloride ions are needed to balance one calcium ion's charge: 1(2+) + 2(1-) = 0.

Final Answer:
The student forgot to balance the charges (subscripts must make total positive and negative charge cancel, not just combine one of each element). Correct formula: CaCl2`,
  },
  {
    title: 'Q22 — Common Mistake: Forgetting to Reduce a Ratio',
    content: 'A student used the crisscross method on Mg2+ and O2- and wrote the formula as "Mg2O2." Explain what is wrong and give the correct formula.',
    answer_key: `Step 1: Check the charge balance of the student's formula.
Mg2O2 does balance charge: 2(2+) + 2(2-) = 4+ + 4- = 0. So charge balance isn't the problem.

Step 2: Identify the actual error.
Ionic formulas must always be written in the lowest whole-number ratio. The crisscross of "2" and "2" gives subscripts of 2 and 2, but since both subscripts share a common factor of 2, they must be reduced.

Step 3: Reduce the ratio.
2:2 reduces to 1:1.

Final Answer:
The student forgot to reduce the subscripts to lowest terms. Correct formula: MgO`,
  },
  {
    title: 'Q23 — Common Mistake: Missing Roman Numeral',
    content: 'A student named the compound Cr2O3 simply as "chromium oxide," without a Roman numeral. Explain why this name is incomplete and provide the correct name.',
    answer_key: `Step 1: Identify why a Roman numeral is needed.
Chromium is a transition metal, and transition metals can form more than one possible ionic charge. Without a Roman numeral, "chromium oxide" is ambiguous — it doesn't specify which chromium ion is present, and could be confused with a different chromium oxide compound (e.g., CrO).

Step 2: Determine the correct charge from the formula.
Oxide is O2-; three oxide ions contribute 3 x (2-) = 6-. Two chromium ions must together contribute 6+, so each chromium ion is 3+.

Step 3: Write the complete, correct name.
Chromium(III) oxide.

Final Answer:
The name is incomplete because chromium (a transition metal) has variable charge, and a Roman numeral is required to specify which ion is present. Correct name: Chromium(III) oxide`,
  },
  {
    title: 'Q24 — Common Mistake: Misusing Molecular Prefixes on an Ionic Compound',
    content: 'A student named the ionic compound Al2O3 as "dialuminum trioxide," using prefixes like a covalent compound. Explain why this is incorrect and give the correct ionic name.',
    answer_key: `Step 1: Identify the error.
Prefixes like "di-" and "tri-" (mono-, di-, tri-, tetra-, etc.) are used only for naming molecular/covalent compounds between two nonmetals, where charges cannot be used to predict a fixed ratio. Al2O3 is an ionic compound (metal + nonmetal), and ionic compound names never use numerical prefixes — the ratio is always implied by the charges of the ions.

Step 2: Apply correct ionic naming rules.
Aluminum has a fixed charge (3+, Group 13) so no Roman numeral is needed either. Oxide is the anion name for O2-.

Final Answer:
The student incorrectly applied covalent-compound prefix rules to an ionic compound. Correct name: Aluminum oxide (no prefixes, no Roman numeral needed since aluminum has only one common charge).`,
  },
  {
    title: 'Q25 — Formula from Name: Polyatomic Ion Compound (Ammonium Sulfate)',
    content: 'Write the correct chemical formula for ammonium sulfate.',
    answer_key: `Step 1: Identify the ions.
Ammonium: NH4+. Sulfate: SO4 2-.

Step 2: Balance the charges.
Two ammonium ions (2 x 1+ = 2+) balance one sulfate ion (2-). Since ammonium has a subscript greater than 1, it is enclosed in parentheses: (NH4)2SO4.

Step 3: Verify charge balance.
2(1+) + 1(2-) = 2+ + 2- = 0. Balanced.

Final Answer:
(NH4)2SO4`,
  },
]

const metallicQuestions = [
  {
    title: 'Q1 — Describing the Electron Sea Model',
    content: 'Describe the electron sea model of metallic bonding, including what is meant by "delocalized" electrons.',
    answer_key: `Step 1: Describe the structure.
In the electron sea model, metal atoms are pictured as a regular, closely-packed array of positively charged metal cations (the atoms having given up their valence electrons).

Step 2: Describe the electrons.
The valence electrons that were given up do not stay attached to any single metal atom. Instead, they become "delocalized" — free to move throughout the entire structure — forming a mobile "sea" of electrons that surrounds and flows freely among the fixed cations.

Step 3: Summarize the bond itself.
The metallic bond is the electrostatic attraction between the fixed lattice of positive metal cations and the surrounding, freely-moving sea of negative electrons.

Final Answer:
Metallic bonding consists of a lattice of metal cations held together by the attraction to a surrounding "sea" of delocalized (mobile, not attached to any one atom) valence electrons that belong to the structure as a whole rather than to individual atoms.`,
  },
  {
    title: 'Q2 — Explaining Electrical Conductivity',
    content: 'Use the electron sea model to explain why metals are good conductors of electricity.',
    answer_key: `Step 1: Recall what electrical current requires.
Electrical conductivity requires charged particles that are free to move through the material in response to an applied voltage.

Step 2: Apply the electron sea model.
Because the valence electrons in a metal are delocalized (not bound to any specific atom), they can move freely throughout the metal lattice when a voltage is applied, without needing to break any bonds.

Step 3: Conclude.
This free movement of electrons allows charge to flow easily through the metal, making it a good conductor.

Final Answer:
Metals conduct electricity well because their delocalized "sea" electrons are already free to move throughout the structure; applying a voltage simply causes this existing mobile charge to flow, unlike in materials where electrons are locked into fixed bonds.`,
  },
  {
    title: 'Q3 — Explaining Malleability',
    content: 'Use the electron sea model to explain why metals are malleable (can be hammered into flat sheets without shattering).',
    answer_key: `Step 1: Describe what happens when a metal is struck.
When a metal is hammered, the layers of positive metal cations can slide past one another into new positions.

Step 2: Explain why this does not break the metal apart.
Because the surrounding sea of delocalized electrons is not tied to specific atom-to-atom bonds, it simply flows and readjusts around the cations wherever they end up, continuing to hold the new arrangement together with the same overall attraction.

Step 3: Conclude.
Since the bonding is non-directional (the electron sea attracts cations from all directions equally, not specific bonds between specific atom pairs), shifting the cations' positions doesn't break any fixed bond — the metal deforms smoothly instead of shattering.

Final Answer:
Metals are malleable because their cations can slide into new layers while the non-directional electron sea simply flows and re-forms around them, maintaining the attractive force without any specific bond having to break.`,
  },
  {
    title: 'Q4 — Explaining Ductility',
    content: 'Use the electron sea model to explain why metals are ductile (can be drawn into thin wires).',
    answer_key: `Step 1: Recall the definition of ductility.
Ductility is the ability of a material to be stretched or drawn into a long wire without breaking.

Step 2: Apply the electron sea model.
As a metal is stretched, the cations shift position and rearrange into a new, elongated shape. Because the delocalized electron sea has no fixed attachment to any particular cation, it continuously redistributes itself around the rearranged cations, maintaining the electrostatic attraction that holds the structure together at every point during the stretch.

Step 3: Conclude.
Since the bonding force is maintained continuously through the deformation rather than depending on specific, breakable atom-to-atom bonds, the metal can be drawn out into a wire rather than snapping.

Final Answer:
Metals are ductile because the mobile electron sea continuously readjusts around cations as they shift and elongate, preserving the metallic attraction throughout the deformation instead of relying on fixed bonds that would snap.`,
  },
  {
    title: 'Q5 — Explaining Metallic Luster',
    content: 'Use the electron sea model to explain why most metals have a shiny, reflective luster.',
    answer_key: `Step 1: Recall what causes reflectivity.
A surface appears shiny/reflective when it can absorb and quickly re-emit a wide range of light-wave frequencies striking it.

Step 2: Apply the electron sea model.
Because metals have a sea of freely mobile delocalized electrons at the surface, these electrons can readily absorb the energy from incoming photons across a broad range of visible-light frequencies and then re-emit that energy as light almost immediately.

Step 3: Conclude.
This rapid absorption and re-emission of visible light across many wavelengths by the free surface electrons is what produces the characteristic shiny, reflective appearance of metals.

Final Answer:
Metallic luster arises because the mobile sea of delocalized electrons at a metal's surface can absorb and quickly re-emit photons across a broad range of visible-light frequencies, producing a shiny, reflective appearance.`,
  },
  {
    title: 'Q6 — Comparing Metallic Bond Strength Across a Period',
    content: 'Sodium (Na, Group 1) and magnesium (Mg, Group 2) are both metals in Period 3. Magnesium has a much higher melting point (650 degrees C) than sodium (98 degrees C). Explain this difference using the electron sea model.',
    answer_key: `Step 1: Count valence electrons contributed to the sea.
Na (Group 1) contributes 1 valence electron per atom to the delocalized electron sea. Mg (Group 2) contributes 2 valence electrons per atom.

Step 2: Consider ionic charge and radius.
Magnesium's cations also carry a greater positive charge (Mg2+ vs. Na+) and, due to increasing effective nuclear charge across the period, a smaller ionic radius than Na+.

Step 3: Connect this to bond strength.
More delocalized electrons per atom means a denser, more negatively-charged electron sea, and the higher-charged, smaller Mg2+ cations are attracted to that sea more strongly (stronger electrostatic force, shorter distance) than the lower-charged, larger Na+ cations.

Step 4: Conclude.
This stronger overall metallic bond requires more thermal energy to overcome, giving magnesium a much higher melting point than sodium.

Final Answer:
Magnesium has a higher melting point than sodium because it contributes 2 valence electrons per atom to a denser electron sea, and its smaller, more highly charged Mg2+ cations are held to that sea by a stronger electrostatic attraction than Na+ — this stronger metallic bond takes more energy to break.`,
  },
  {
    title: 'Q7 — Comparing Metallic Bond Strength Down a Group',
    content: 'Lithium (Li) has a higher melting point (181 degrees C) than potassium (K, 64 degrees C), even though both are Group 1 metals that each contribute only 1 valence electron to the electron sea. Explain this difference.',
    answer_key: `Step 1: Note what stays the same.
Both Li and K are Group 1 metals, each contributing exactly 1 valence electron per atom to the delocalized sea, and each forming a 1+ cation. So the "number of electrons contributed" argument does not explain the difference here.

Step 2: Consider what changes down the group.
Down Group 1, atomic (and ionic) radius increases significantly — K+ is much larger than Li+, because K's valence electrons occupy a shell farther from the nucleus.

Step 3: Connect radius to bond strength.
Since electrostatic attraction weakens with increasing distance, the larger K+ cations are held less tightly by the surrounding electron sea than the smaller, more compact Li+ cations.

Step 4: Conclude.
This weaker attraction in potassium's larger structure means less energy is needed to overcome the metallic bonding, giving potassium a much lower melting point than lithium.

Final Answer:
Even with the same number of sea electrons per atom and the same ionic charge, lithium's smaller ionic radius allows its cations to be held more tightly by the electron sea than potassium's larger cations, so lithium has the stronger metallic bond and higher melting point.`,
  },
  {
    title: 'Q8 — Contrasting Metallic and Ionic Bonding: Malleability vs. Brittleness',
    content: 'Explain, using both bonding models, why a metal like copper can be hammered into a new shape without breaking, while an ionic compound like sodium chloride shatters when struck.',
    answer_key: `Step 1: Describe the metallic case.
In copper, the metallic bond is non-directional: the mobile electron sea attracts the cations equally from all directions. When struck, the cation layers slide into new positions, and the electron sea simply flows to re-surround them, maintaining the attraction — the metal bends/deforms.

Step 2: Describe the ionic case.
In sodium chloride, the ionic bond depends on a very specific, alternating arrangement: each Na+ is surrounded by Cl- ions (and vice versa) in a fixed lattice, so that every ion is next to ions of the opposite charge. When struck, the layers shift, and ions of the SAME charge are suddenly forced next to each other.

Step 3: Explain the consequence for the ionic case.
Like-charge ions repel each other strongly, so this sudden repulsion causes the crystal to fracture cleanly along that plane — the ionic solid shatters rather than bending.

Final Answer:
Copper deforms because its non-directional electron sea can flow and re-adjust around shifted cations without any specific bond breaking. NaCl shatters because shifting its rigid, alternating +/- lattice by even one position forces same-charge ions together, and the resulting strong repulsion fractures the crystal instead of letting it bend.`,
  },
  {
    title: 'Q9 — Alloys: Substitutional vs. Interstitial',
    content: 'Define what an alloy is, and describe the difference between a substitutional alloy and an interstitial alloy, giving one example of each.',
    answer_key: `Step 1: Define an alloy.
An alloy is a mixture (often a solid solution) composed mainly of a metal combined with one or more other elements, usually to enhance properties like strength, hardness, or corrosion resistance compared to the pure metal.

Step 2: Define a substitutional alloy.
In a substitutional alloy, atoms of the added element are similar in size to the host metal's atoms, so they directly replace (substitute for) some of the host metal atoms within the regular lattice structure. Example: brass, in which zinc atoms substitute for some copper atoms.

Step 3: Define an interstitial alloy.
In an interstitial alloy, atoms of the added element are much smaller than the host metal's atoms, so instead of replacing lattice atoms, they fit into the small gaps (interstices) between the host atoms. Example: steel, in which small carbon atoms fit into the gaps between iron atoms.

Final Answer:
An alloy is a mixture built around a metal to improve its properties. Substitutional alloys (e.g., brass: Zn substituting for Cu) have similarly-sized atoms replacing host atoms in the lattice. Interstitial alloys (e.g., steel: C fitting between Fe atoms) have small atoms squeezed into the gaps between host atoms.`,
  },
  {
    title: 'Q10 — Explaining Why Alloys Are Often Harder Than Pure Metals',
    content: 'Steel (an iron-carbon alloy) is significantly harder than pure iron. Use the electron sea model to explain why adding a small amount of carbon increases hardness.',
    answer_key: `Step 1: Recall why pure metals are malleable.
In pure iron, the uniform layers of same-sized cations can slide smoothly past one another because the electron sea flows evenly around them.

Step 2: Consider the effect of interstitial carbon atoms.
The small carbon atoms wedged between the iron atoms distort the once-uniform, evenly-spaced lattice, creating irregularities in the structure.

Step 3: Connect this to hardness.
These distortions make it much harder for the layers of iron cations to slide smoothly past each other, since the carbon atoms act as obstacles that catch and resist the sliding motion.

Final Answer:
Carbon atoms wedged into the gaps of the iron lattice disrupt the uniform layers that would otherwise slide smoothly past one another, so steel resists deformation (is harder) compared to pure iron, whose evenly-spaced layers slide freely.`,
  },
  {
    title: 'Q11 — Explaining Thermal Conductivity',
    content: 'Use the electron sea model to explain why metals are good conductors of heat.',
    answer_key: `Step 1: Recall how heat transfers through a material.
Heat conduction requires energy (kinetic energy of particles) to be transferred rapidly from a hotter region to a cooler region.

Step 2: Apply the electron sea model.
When one part of a metal is heated, the delocalized electrons in that region gain kinetic energy and, being free to move throughout the entire structure, rapidly carry that extra energy to cooler regions of the metal through collisions as they travel.

Step 3: Conclude.
Because these mobile electrons can transport thermal energy far more quickly than atoms simply vibrating in place could, metals conduct heat efficiently.

Final Answer:
Metals conduct heat well because their mobile sea electrons absorb thermal energy in a heated region and rapidly carry (and transfer via collisions) that energy throughout the rest of the structure, much faster than heat could spread by atomic vibration alone.`,
  },
  {
    title: 'Q12 — Conceptual: Why Metallic Bonds Have No Fixed "Molecule"',
    content: 'Explain why it does not make sense to talk about a single "molecule" of a metal like copper, in contrast to how we might describe a molecule of a covalent compound.',
    answer_key: `Step 1: Recall what defines a covalent molecule.
A covalent molecule consists of a specific, fixed, countable number of atoms joined together by shared, localized electron pairs in specific directional bonds (e.g., one water molecule is exactly 2 H atoms and 1 O atom, bonded in a fixed way).

Step 2: Contrast with metallic bonding.
In a metal, there are no individual, localized bonds between specific pairs of atoms. Instead, every cation in the entire lattice is simultaneously attracted to the same continuous sea of delocalized electrons, which extends throughout the whole sample.

Step 3: Conclude.
Because the bonding is spread continuously across the entire piece of metal rather than being divided into discrete bonded units, a chunk of metal is best thought of as one enormous, continuous network of bonding rather than a collection of separate "molecules."

Final Answer:
Metallic bonding is non-directional and delocalized across the entire sample — every cation shares the same continuous electron sea — so there is no natural way to divide a piece of metal into discrete, separately-bonded "molecule" units the way a covalent compound can be divided into individual molecules.`,
  },
  {
    title: 'Q13 — Ranking Metallic Bond Strength: Three Period 4 Metals',
    content: 'Rank potassium (K, Group 1), calcium (Ca, Group 2), and gallium (Ga, Group 13) from lowest to highest expected melting point, based on the electron sea model, and justify.',
    answer_key: `Step 1: Count valence electrons contributed by each.
K contributes 1 valence electron, Ca contributes 2, and Ga contributes 3 to their respective electron seas.

Step 2: Consider ionic charge and radius trends.
Moving across Period 4 from K to Ca to Ga, effective nuclear charge increases and ionic radius decreases, while the cation charge increases (1+, 2+, 3+ respectively).

Step 3: Connect to bond strength.
More valence electrons contributed plus higher cation charge plus smaller cation radius all increase the electrostatic attraction between the cations and the electron sea, strengthening the metallic bond.

Final Answer:
Lowest to highest melting point: K < Ca < Ga. Moving across the period, each successive metal contributes more electrons to the sea and forms smaller, more highly-charged cations, both of which strengthen the metallic bond. (Approximate real values: K ≈ 64°C, Ca ≈ 842°C, Ga ≈ 30°C is a notable real-world exception due to Ga's unusual crystal structure — but based purely on the electron sea model's general prediction, the expected trend is K < Ca < Ga in bond strength contribution from charge/electron count.)`,
  },
  {
    title: 'Q14 — Common Mistake: Confusing Metallic and Ionic Conductivity',
    content: 'A student claims that solid sodium chloride (an ionic compound) should conduct electricity just as well as sodium metal, since both contain sodium. Explain what is wrong with this reasoning.',
    answer_key: `Step 1: Identify the difference in electron mobility.
In sodium metal, valence electrons are delocalized throughout the structure and are free to move, allowing them to carry electric current.

Step 2: Consider solid NaCl.
In solid NaCl, the electrons are not delocalized — each ion (Na+ and Cl-) has a fixed, complete electron configuration, and the ions themselves are locked into fixed positions in the rigid ionic lattice. There are no mobile charge carriers free to move through the solid.

Step 3: Conclude.
Because solid NaCl has no mobile electrons or mobile ions, it does not conduct electricity as a solid (though it does conduct when melted or dissolved in water, where the ions become free to move).

Final Answer:
The student's reasoning is flawed because conductivity in metals comes from delocalized, mobile electrons, which sodium metal has but solid NaCl does not — in solid NaCl, both electrons and ions are locked in fixed positions, so it does not conduct electricity as a solid.`,
  },
  {
    title: 'Q15 — Synthesis: Explaining Four Properties from One Model',
    content: 'A single conceptual model — the electron sea model — is used to explain four seemingly unrelated properties of metals: malleability, electrical conductivity, thermal conductivity, and luster. Briefly explain the common thread that connects all four explanations.',
    answer_key: `Step 1: Identify the shared feature of the model.
All four explanations trace back to the same core feature of metallic bonding: the valence electrons are delocalized — not attached to any single atom — and free to move throughout the entire structure.

Step 2: Connect this feature to each property.
Malleability/ductility: the mobile sea reshapes around shifted cations without breaking any fixed bond. Electrical conductivity: the mobile electrons carry charge when a voltage is applied. Thermal conductivity: the mobile electrons carry kinetic energy from hot to cool regions. Luster: the mobile surface electrons absorb and re-emit visible light photons.

Step 3: State the unifying idea.
In every case, it is the freedom of the delocalized electrons to move — whether to reposition around shifted atoms, to carry charge, to carry heat energy, or to interact with light — that produces the observed property.

Final Answer:
All four properties trace back to the same cause: metallic valence electrons are delocalized and free to move throughout the structure. That mobility lets them flow around repositioned cations (malleability/ductility), carry electric charge (conductivity), transport thermal energy (heat conduction), and absorb/re-emit light (luster).`,
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
  await insertBatch(TOPIC_OCTET, octetQuestions)
  await insertBatch(TOPIC_NAMING, namingQuestions)
  await insertBatch(TOPIC_METALLIC, metallicQuestions)
  console.log('Done.')
}

main()
