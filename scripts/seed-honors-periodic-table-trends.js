// Unit 6: Periodic Table and Periodic Trends
// Topic A (Organization): groups/periods/families, metal/nonmetal/metalloid classification, valence electrons, ionic charge
// Topic B (Trends): atomic/ionic radius, ionization energy, electron affinity, electronegativity, metallic character
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

const TOPIC_ORG = '94792082-5d15-4a1c-9aa7-e920084fc778' // Organization of the Periodic Table
const TOPIC_TRENDS = '4f15894b-8a80-4877-b962-9207a05f79ec' // Periodic Trends

const orgQuestions = [
  {
    title: 'Q1 — Groups vs. Periods',
    content: 'Explain the difference between a group and a period on the periodic table. Which one contains elements that tend to share similar chemical properties, and why?',
    answer_key: `Step 1: Define each term.
A group (also called a family) is a vertical column on the periodic table. A period is a horizontal row.

Step 2: Identify which one shares similar chemical properties.
Elements within the same group share similar chemical properties, because elements in the same group have the same number of valence electrons. Since chemical bonding behavior is governed mainly by valence electrons, elements in a group tend to form similar types of ions and compounds and react in similar ways.

Step 3: Contrast with periods.
Elements across a period do NOT share similar chemical properties — the number of valence electrons changes by one with each step across a period (e.g., Na has 1 valence electron, Mg has 2, Al has 3), so properties change steadily from metallic on the left to nonmetallic on the right.

Final Answer:
A group is a column (same number of valence electrons, similar chemical properties); a period is a row (valence electrons increase left to right, properties change steadily rather than repeating).`,
  },
  {
    title: 'Q2 — Identifying the Alkali Metals',
    content: 'Name the family of elements found in Group 1 (excluding hydrogen), list two of its members, and describe one characteristic property of this family.',
    answer_key: `Step 1: Identify the family name.
Group 1 elements (excluding hydrogen, which is a nonmetal) are called the alkali metals.

Step 2: List members.
Examples include lithium (Li), sodium (Na), potassium (K), rubidium (Rb), cesium (Cs), and francium (Fr). Any two of these are acceptable.

Step 3: Describe a characteristic property.
Alkali metals are soft, shiny, low-density metals with exactly one valence electron. They are extremely reactive, especially with water (producing hydrogen gas and a metal hydroxide), and reactivity increases going down the group because the single valence electron is held less tightly (farther from the nucleus, more shielded).

Final Answer:
Group 1 (excluding H) = alkali metals (e.g., Na, K). They are soft, highly reactive metals with one valence electron, and are never found in nature as free elements because they react so readily.`,
  },
  {
    title: 'Q3 — Identifying the Alkaline Earth Metals',
    content: 'Name the family of elements found in Group 2, and state how many valence electrons each member has and the typical ionic charge these elements form.',
    answer_key: `Step 1: Identify the family name.
Group 2 elements are called the alkaline earth metals (examples: Be, Mg, Ca, Sr, Ba, Ra).

Step 2: Determine valence electrons.
Group number 2 corresponds to 2 valence electrons for each member.

Step 3: Determine typical ionic charge.
To achieve a stable noble-gas electron configuration, these elements lose both valence electrons, forming 2+ cations (e.g., Mg2+, Ca2+).

Final Answer:
Group 2 = alkaline earth metals. Each has 2 valence electrons and typically forms a 2+ ion.`,
  },
  {
    title: 'Q4 — Identifying the Halogens',
    content: 'Name the family of elements found in Group 17, list two members, and state the typical ionic charge these elements form and why.',
    answer_key: `Step 1: Identify the family name.
Group 17 elements are called the halogens (examples: fluorine, chlorine, bromine, iodine, astatine).

Step 2: Determine typical ionic charge.
Halogens have 7 valence electrons. Gaining just 1 more electron gives them a full octet (a stable noble-gas configuration), so they typically form 1- anions (e.g., Cl-, Br-).

Final Answer:
Group 17 = halogens (e.g., Cl, Br). They typically form 1- ions because gaining one electron completes their octet.`,
  },
  {
    title: 'Q5 — Identifying the Noble Gases',
    content: 'Name the family of elements found in Group 18, and explain why these elements are generally unreactive.',
    answer_key: `Step 1: Identify the family name.
Group 18 elements are called the noble gases (examples: He, Ne, Ar, Kr, Xe, Rn).

Step 2: Explain their lack of reactivity.
Noble gases already have a full valence shell (8 valence electrons, or 2 for helium), giving them a complete octet and a very stable, low-energy electron configuration. Because they have no strong tendency to gain, lose, or share electrons, they rarely form chemical bonds under normal conditions.

Final Answer:
Group 18 = noble gases. They are unreactive because their valence shells are already complete (full octet), so there is little energetic incentive to form bonds.`,
  },
  {
    title: 'Q6 — Locating the Transition Metals',
    content: 'Where are the transition metals located on the periodic table, and why do many of them commonly form more than one possible ionic charge (unlike main-group metals)?',
    answer_key: `Step 1: Identify their location.
The transition metals occupy the d-block, Groups 3–12 (the middle block of the periodic table), spanning Periods 4–7.

Step 2: Explain variable ionic charges.
Main-group metals (like Group 1 or 2) typically lose electrons only from their outermost s subshell to reach a noble-gas configuration, giving one predictable charge. Transition metals, however, have both an outer s subshell and an inner, similar-energy d subshell. Electrons can be removed from either or both, and because the d subshell doesn't need to be completely empty or completely full to be reasonably stable, transition metals can lose different numbers of electrons under different conditions — giving them multiple possible oxidation states (e.g., iron commonly forms both Fe2+ and Fe3+).

Final Answer:
Transition metals are the d-block elements, Groups 3–12. They often show multiple ionic charges because electrons can be removed from both the outer s and the close-in-energy d subshell, and partially filled d subshells don't have one single "most stable" electron count the way main-group octets do.`,
  },
  {
    title: 'Q7 — Metal, Nonmetal, or Metalloid: Physical Properties',
    content: 'List three physical properties commonly used to classify an element as a metal, and three physical properties commonly used to classify an element as a nonmetal.',
    answer_key: `Step 1: List metal properties.
Metals are typically shiny (lustrous), malleable (can be hammered into sheets), ductile (can be drawn into wires), and good conductors of heat and electricity. They are also generally solid at room temperature (except mercury) with relatively high densities.

Step 2: List nonmetal properties.
Nonmetals are typically dull (non-lustrous), brittle when solid (shatter rather than bend), and poor conductors of heat and electricity (they are insulators). They exist in all three states at room temperature and generally have lower densities than metals.

Final Answer:
Metals: lustrous, malleable/ductile, good conductors. Nonmetals: dull, brittle (if solid), poor conductors.`,
  },
  {
    title: 'Q8 — Classifying Metalloids',
    content: 'What is a metalloid, where are metalloids generally located on the periodic table, and name three examples.',
    answer_key: `Step 1: Define a metalloid.
A metalloid is an element with properties intermediate between metals and nonmetals — for example, they may look shiny like a metal but be brittle like a nonmetal, and they conduct electricity moderately well (better than a typical insulator, worse than a typical metal), which is why they are often called semiconductors.

Step 2: Identify their location.
Metalloids form a staircase-shaped diagonal band on the periodic table, roughly running from boron (B) down to astatine (At), separating the metals (to the left) from the nonmetals (to the right).

Step 3: Give examples.
Common metalloids include boron (B), silicon (Si), germanium (Ge), arsenic (As), antimony (Sb), and tellurium (Te). Any three are acceptable.

Final Answer:
A metalloid has intermediate metal/nonmetal properties (e.g., semiconducting behavior) and sits along the staircase boundary between metals and nonmetals. Examples: silicon, germanium, arsenic.`,
  },
  {
    title: 'Q9 — Classify: Silicon',
    content: 'Classify silicon (Si) as a metal, nonmetal, or metalloid, and justify your answer using its physical properties and position on the periodic table.',
    answer_key: `Step 1: Locate silicon.
Silicon sits directly on the metalloid staircase in Group 14, Period 3.

Step 2: Consider its properties.
Silicon has a shiny, grayish appearance like a metal but is brittle rather than malleable. Electrically, it conducts moderately — far better than a true insulator like sulfur, but far worse than a true conductor like copper — which is why silicon is the classic semiconductor used in computer chips.

Final Answer:
Silicon is a metalloid: it lies on the staircase boundary and shows intermediate (semiconducting) electrical behavior along with brittleness, rather than clearly metallic or clearly nonmetallic behavior.`,
  },
  {
    title: 'Q10 — Classify: Sulfur',
    content: 'Classify sulfur (S) as a metal, nonmetal, or metalloid, and justify your answer.',
    answer_key: `Step 1: Locate sulfur.
Sulfur is in Group 16, Period 3, well to the right of the metalloid staircase.

Step 2: Consider its properties.
Sulfur is a dull yellow solid that is brittle (shatters when struck) and is a poor conductor of heat and electricity (an electrical insulator).

Final Answer:
Sulfur is a nonmetal: it is dull, brittle, and a poor conductor, and its position (Group 16, well right of the staircase) is consistent with nonmetal character.`,
  },
  {
    title: 'Q11 — Classify: Chromium',
    content: 'Classify chromium (Cr) as a metal, nonmetal, or metalloid, and justify your answer.',
    answer_key: `Step 1: Locate chromium.
Chromium is a d-block transition metal, Group 6, Period 4.

Step 2: Consider its properties.
Chromium is shiny (lustrous), hard, malleable/ductile, and an excellent conductor of heat and electricity — all classic metallic properties. It is also used as a protective, corrosion-resistant plating on other metals because of its durability.

Final Answer:
Chromium is a metal: it is lustrous, conductive, and malleable, consistent with its location in the d-block (transition metals).`,
  },
  {
    title: 'Q12 — Valence Electrons from Group Number (Main Group)',
    content: 'Using only its group number, state the number of valence electrons in each of the following main-group elements: (a) potassium (Group 1), (b) aluminum (Group 13), (c) oxygen (Group 16), (d) chlorine (Group 17).',
    answer_key: `Step 1: Recall the rule for main-group elements.
For main-group elements (Groups 1, 2, and 13–18), the number of valence electrons equals the group number for Groups 1–2, and equals the group number minus 10 for Groups 13–18 (using the 1–18 numbering system).

Step 2: Apply the rule to each element.
(a) Potassium, Group 1: 1 valence electron.
(b) Aluminum, Group 13: 13 - 10 = 3 valence electrons.
(c) Oxygen, Group 16: 16 - 10 = 6 valence electrons.
(d) Chlorine, Group 17: 17 - 10 = 7 valence electrons.

Final Answer:
(a) K: 1 valence electron. (b) Al: 3 valence electrons. (c) O: 6 valence electrons. (d) Cl: 7 valence electrons.`,
  },
  {
    title: 'Q13 — Predicting Ionic Charge from Group Number',
    content: 'Predict the most common ionic charge formed by each of the following elements, based on their group number: (a) magnesium (Group 2), (b) nitrogen (Group 15), (c) bromine (Group 17), (d) aluminum (Group 13).',
    answer_key: `Step 1: Recall the guiding principle.
Main-group elements gain or lose valence electrons to reach the nearest stable noble-gas configuration (a full octet), whichever requires fewer electrons to be gained or lost.

Step 2: Apply this to each element.
(a) Magnesium (2 valence electrons): loses both to reach the configuration of neon → Mg2+.
(b) Nitrogen (5 valence electrons): gains 3 electrons to complete its octet (reaching neon's configuration) rather than losing 5 → N3-.
(c) Bromine (7 valence electrons): gains 1 electron to complete its octet → Br-.
(d) Aluminum (3 valence electrons): loses all 3 to reach the configuration of neon → Al3+.

Final Answer:
(a) Mg2+ (b) N3- (c) Br- (d) Al3+`,
  },
  {
    title: 'Q14 — Family Identification from a Description',
    content: 'An element is a soft, silvery solid. It has 2 valence electrons, forms a 2+ ion, and is more reactive than magnesium but less reactive than radium. Identify its family and give one specific example of a plausible element.',
    answer_key: `Step 1: Determine the family from the valence electron count and ionic charge.
2 valence electrons and a 2+ ion is characteristic of Group 2, the alkaline earth metals.

Step 2: Narrow down the specific element.
"More reactive than magnesium but less reactive than radium" places the element between Mg and Ra in Group 2's reactivity order (which increases down the group: Be < Mg < Ca < Sr < Ba < Ra). Calcium, strontium, or barium would all fit; strontium (Sr) is a reasonable single answer since it falls roughly in the middle of that range.

Final Answer:
Family: alkaline earth metals (Group 2). A plausible specific element: strontium (Sr) — though calcium or barium are also acceptable, since all fall between magnesium and radium in reactivity.`,
  },
  {
    title: 'Q15 — Distinguishing Representative Elements from Transition Metals',
    content: 'What is meant by the term "representative element" (also called a main-group element), and how does the pattern of filling valence electrons differ between representative elements and transition metals?',
    answer_key: `Step 1: Define representative elements.
Representative (main-group) elements are those in Groups 1, 2, and 13–18 — the s-block and p-block elements. Their valence electrons are found in the outermost s and p subshells.

Step 2: Contrast the electron-filling pattern with transition metals.
For representative elements, each step across a period adds one electron to the outermost s or p subshell, directly changing the number of valence electrons and causing clear, predictable trends in chemical behavior across the row.
For transition metals (the d-block), each step across a period generally adds an electron to an inner d subshell rather than the outermost shell. Because the outermost s electrons stay largely the same (typically 2), the number of "valence-like" electrons available for bonding changes much less dramatically from element to element, so transition metals within the same period tend to be more similar to each other in reactivity and properties than representative elements are.

Final Answer:
Representative elements (s- and p-block) fill their outermost shell directly, giving strong, predictable property changes across a period. Transition metals (d-block) mostly fill an inner d subshell, so their outer electron count changes little across a period, making their properties more similar row to row.`,
  },
]

const trendsQuestions = [
  {
    title: 'Q1 — Defining Atomic Radius and Effective Nuclear Charge',
    content: 'Define atomic radius and effective nuclear charge (Zeff), and explain in one sentence how increasing Zeff affects atomic radius.',
    answer_key: `Step 1: Define atomic radius.
Atomic radius is a measure of the size of an atom, typically defined as half the distance between the nuclei of two identical atoms that are bonded together or touching.

Step 2: Define effective nuclear charge.
Effective nuclear charge (Zeff) is the net positive charge experienced by an outer (valence) electron, after accounting for the "shielding" or "screening" effect of inner-shell electrons that repel and partially cancel out the pull of the nucleus. It is approximated as Zeff = Z - S, where Z is the atomic number (actual proton count) and S is the number of shielding (inner) electrons.

Step 3: Relate Zeff to radius.
As Zeff increases, the nucleus pulls the valence electrons inward more strongly, so the atomic radius decreases.

Final Answer:
Atomic radius = size of an atom (roughly half the internuclear distance between bonded/touching identical atoms). Zeff = net nuclear pull felt by valence electrons after shielding. Higher Zeff pulls valence electrons in tighter, shrinking atomic radius.`,
  },
  {
    title: 'Q2 — Atomic Radius Trend Across a Period',
    content: 'Explain why atomic radius decreases from left to right across a period, even though more electrons are being added to the atom.',
    answer_key: `Step 1: Note what stays the same and what changes across a period.
Moving across a period, electrons are added to the same principal energy level (same shell, same n), while protons are also added to the nucleus one at a time.

Step 2: Explain why this decreases radius rather than increasing it.
Because the new electrons enter the same outer shell (not an inner one), they do not shield each other very effectively from the increasing nuclear charge. Each added proton increases the nuclear pull on all the valence electrons, so the effective nuclear charge (Zeff) increases steadily across the period.

Step 3: Connect Zeff to radius.
A higher Zeff pulls the valence electron cloud in more tightly toward the nucleus, so the atomic radius shrinks, despite the larger number of electrons.

Final Answer:
Across a period, electrons are added to the same outer shell and shield each other poorly, so Zeff rises steadily with each added proton. The stronger nuclear pull draws the valence shell inward, making atoms progressively smaller left to right — even though total electron count increases.`,
  },
  {
    title: 'Q3 — Atomic Radius Trend Down a Group',
    content: 'Explain why atomic radius increases going down a group, even though Zeff increases only slightly (or stays roughly constant) down the group.',
    answer_key: `Step 1: Identify what changes down a group.
Moving down a group, each successive element adds an entirely new principal energy level (a new outer shell with a higher n value).

Step 2: Explain the dominant effect.
Although the nuclear charge (Z) increases down a group, the number of inner, shielding electrons also increases by a full shell's worth each time, so Zeff on the valence electrons increases only slightly. Meanwhile, the valence electrons themselves are now in a shell with a much higher principal quantum number, farther from the nucleus.

Step 3: State the conclusion.
The dominant effect is the addition of new occupied shells farther from the nucleus, which increases atomic radius, and this outweighs the small increase in Zeff.

Final Answer:
Down a group, valence electrons occupy a new, higher-numbered shell each time (farther from the nucleus), while increased inner shielding keeps Zeff nearly constant. Since the electrons are simply farther out, atomic radius increases going down a group.`,
  },
  {
    title: 'Q4 — Rank Three Elements by Atomic Radius',
    content: 'Rank the following three elements from smallest to largest atomic radius, and justify your ranking using periodic trends: sodium (Na), magnesium (Mg), potassium (K).',
    answer_key: `Step 1: Locate each element.
Na: Group 1, Period 3. Mg: Group 2, Period 3. K: Group 1, Period 4.

Step 2: Compare Na and Mg (same period).
Na and Mg are in the same period. Across a period, radius decreases left to right, so Na (Group 1) is larger than Mg (Group 2).

Step 3: Compare Na and K (same group).
Na and K are in the same group (Group 1). Radius increases down a group, so K (Period 4) is larger than Na (Period 3).

Step 4: Combine the comparisons.
Mg < Na (period trend) and Na < K (group trend), so overall: Mg < Na < K.

Final Answer:
Smallest to largest: Mg < Na < K. (Approximate real values: Mg ≈ 145 pm, Na ≈ 186 pm, K ≈ 227 pm.)`,
  },
  {
    title: 'Q5 — Rank Three Elements by Atomic Radius (Halogens vs. Alkali Metal)',
    content: 'Rank the following three elements from largest to smallest atomic radius, and justify: fluorine (F), chlorine (Cl), sodium (Na).',
    answer_key: `Step 1: Locate each element.
F: Group 17, Period 2. Cl: Group 17, Period 3. Na: Group 1, Period 3.

Step 2: Compare F and Cl (same group).
Radius increases down a group, so Cl (Period 3) is larger than F (Period 2).

Step 3: Compare Cl and Na (same period).
Radius decreases across a period left to right, so Na (Group 1, far left) is larger than Cl (Group 17, far right) in Period 3.

Step 4: Combine.
Na is larger than Cl, and Cl is larger than F, so: Na > Cl > F.

Final Answer:
Largest to smallest: Na > Cl > F. (Approximate real values: Na ≈ 186 pm, Cl ≈ 99 pm, F ≈ 64 pm.)`,
  },
  {
    title: 'Q6 — Cation vs. Parent Atom Radius',
    content: 'Compare the radius of a sodium atom (Na) to the radius of a sodium cation (Na+). Which is larger, and why?',
    answer_key: `Step 1: Determine what changes when Na loses an electron.
Neutral Na has the configuration [Ne] 3s1, with 3 occupied shells (n = 1, 2, 3). Losing its single valence electron to form Na+ leaves the configuration [Ne] (only 2 occupied shells, n = 1, 2).

Step 2: Explain the size change.
Na+ has lost its entire outermost (n=3) shell, so the remaining electrons are held in a shell closer to the nucleus. In addition, the same nuclear charge (11 protons) now pulls on fewer electrons (10 instead of 11), increasing the effective pull per remaining electron.

Final Answer:
The neutral Na atom is larger than the Na+ cation. Removing the valence electron eliminates the outermost shell entirely and increases the nuclear pull per remaining electron, causing significant shrinkage — cations are always smaller than their parent atoms.`,
  },
  {
    title: 'Q7 — Anion vs. Parent Atom Radius',
    content: 'Compare the radius of a chlorine atom (Cl) to the radius of a chloride ion (Cl-). Which is larger, and why?',
    answer_key: `Step 1: Determine what changes when Cl gains an electron.
Neutral Cl has 17 protons and 17 electrons. Cl- has 17 protons but 18 electrons.

Step 2: Explain the size change.
The nuclear charge is unchanged, but it must now attract one additional electron. This means the same nuclear pull is now spread over more electrons, reducing the effective pull on each individual electron. In addition, adding an extra electron increases electron-electron repulsion within the existing valence shell, causing the electron cloud to spread out further.

Final Answer:
The chloride ion (Cl-) is larger than the neutral chlorine atom. Adding an electron without adding a proton reduces the effective nuclear pull per electron and increases electron-electron repulsion, causing the ion to expand — anions are always larger than their parent atoms.`,
  },
  {
    title: 'Q8 — Isoelectronic Series Ranking',
    content: 'The following five species all have the same number of electrons (10 electrons each, isoelectronic with neon): O2-, F-, Na+, Mg2+, Al3+. Rank them from largest to smallest radius, and explain the reasoning.',
    answer_key: `Step 1: Note what is the same and what differs among isoelectronic species.
All five species have exactly 10 electrons, so electron-electron repulsion and shielding are essentially identical across the series. The only thing that differs is the nuclear charge (number of protons): O (Z=8), F (Z=9), Na (Z=11), Mg (Z=12), Al (Z=13).

Step 2: Apply the rule for isoelectronic series.
For a fixed number of electrons, more protons means a stronger net pull on that same fixed electron cloud, pulling it in tighter. So radius decreases as nuclear charge (Z) increases.

Step 3: Order by increasing Z (which gives decreasing radius).
Z: O (8) < F (9) < Na (11) < Mg (12) < Al (13)
Radius order (largest to smallest) is therefore the reverse: O2- > F- > Na+ > Mg2+ > Al3+.

Final Answer:
Largest to smallest radius: O2- > F- > Na+ > Mg2+ > Al3+. Since all five have the same 10 electrons, the species with the fewest protons (O, Z=8) has the weakest pull on its electron cloud and is largest, while the species with the most protons (Al, Z=13) pulls its electrons in tightest and is smallest.`,
  },
  {
    title: 'Q9 — Defining Ionization Energy',
    content: 'Define first ionization energy, and explain why ionization energy generally increases across a period from left to right.',
    answer_key: `Step 1: Define first ionization energy.
First ionization energy is the minimum energy required to remove one electron from a neutral, gaseous atom in its ground state, forming a 1+ cation.

Step 2: Explain the trend across a period.
Across a period, Zeff increases steadily (as in the atomic radius trend) because added electrons occupy the same outer shell and shield each other poorly from the growing nuclear charge. A higher Zeff means the valence electrons are held more tightly by the nucleus, so more energy is required to remove one.

Final Answer:
First ionization energy = energy needed to remove the most loosely held electron from a neutral gaseous atom. It increases across a period because Zeff rises steadily, holding valence electrons more tightly and making them harder to remove.`,
  },
  {
    title: 'Q10 — Ionization Energy Trend Down a Group',
    content: 'Explain why first ionization energy generally decreases going down a group.',
    answer_key: `Step 1: Recall what changes down a group.
Going down a group, the valence electron occupies a shell with a progressively higher principal quantum number, farther from the nucleus, while Zeff stays nearly constant (extra protons are largely offset by extra shielding electrons).

Step 2: Connect distance to ionization energy.
The valence electron farther from the nucleus experiences a weaker electrostatic attraction (attraction falls off with the square of distance) and is also shielded by more inner-shell electrons. A more weakly held electron requires less energy to remove.

Final Answer:
Going down a group, the valence electron sits in a shell farther from the nucleus with more shielding, so it is held less tightly. This means less energy is required to remove it, so first ionization energy decreases down a group.`,
  },
  {
    title: 'Q11 — Rank by First Ionization Energy',
    content: 'Rank the following elements from lowest to highest first ionization energy, and justify: sodium (Na), chlorine (Cl), rubidium (Rb).',
    answer_key: `Step 1: Locate each element.
Na: Group 1, Period 3. Rb: Group 1, Period 5. Cl: Group 17, Period 3.

Step 2: Compare Na and Rb (same group).
Ionization energy decreases down a group, so Rb (Period 5, farther down) has a lower ionization energy than Na (Period 3).

Step 3: Compare Na and Cl (same period).
Ionization energy increases across a period, so Cl (far right, Group 17) has a higher ionization energy than Na (far left, Group 1).

Step 4: Combine.
Rb < Na (group trend), and Na < Cl (period trend), so: Rb < Na < Cl.

Final Answer:
Lowest to highest: Rb < Na < Cl. (Approximate real values: Rb ≈ 403 kJ/mol, Na ≈ 496 kJ/mol, Cl ≈ 1251 kJ/mol.)`,
  },
  {
    title: 'Q12 — Explaining the Jump Between IE2 and IE3 for Magnesium',
    content: "Magnesium's successive ionization energies (in kJ/mol) are approximately: IE1 = 738, IE2 = 1451, IE3 = 7733. Explain why there is a huge jump between IE2 and IE3, but only a moderate jump between IE1 and IE2.",
    answer_key: `Step 1: Write magnesium's electron configuration.
Mg: [Ne] 3s2. Magnesium has 2 valence electrons (in the 3s subshell) and 10 core electrons (the neon configuration).

Step 2: Explain the IE1-to-IE2 jump.
Removing the first electron (IE1) takes an electron from the 3s subshell, leaving Mg+ with one remaining 3s electron. Removing this second electron (IE2) still takes an electron from the same valence (3s) shell, though it now leaves behind a 2+ ion with less electron-electron repulsion, so IE2 is moderately higher than IE1.

Step 3: Explain the huge IE2-to-IE3 jump.
After removing both valence electrons, Mg2+ has the stable, complete-octet configuration [Ne] — all 10 remaining electrons are core electrons held in a compact, complete inner shell that is very close to and tightly bound to the nucleus, with no more electrons available in the outer (n=3) shell. Removing a third electron (IE3) requires breaking into this complete, stable noble-gas core, which is dramatically harder and requires far more energy than removing a valence electron.

Final Answer:
IE1 to IE2 is a moderate increase because both electrons come from the same 3s valence subshell. IE2 to IE3 jumps dramatically because after removing both valence electrons, magnesium reaches the extremely stable, complete [Ne] core — removing a third electron means breaking into a full inner shell held very close to the nucleus, which requires vastly more energy.`,
  },
  {
    title: 'Q13 — Predicting Where a Large IE Jump Occurs',
    content: 'For aluminum (Al, [Ne] 3s2 3p1), predict between which two successive ionization energies (e.g., IE1/IE2, IE2/IE3, etc.) the first very large jump will occur, and explain your reasoning.',
    answer_key: `Step 1: Identify aluminum's valence electrons.
Aluminum has 3 valence electrons ([Ne] 3s2 3p1) and a stable [Ne] core underneath.

Step 2: Predict the ionization sequence.
IE1, IE2, and IE3 will remove the three valence electrons (3p1, then the two 3s2 electrons) one at a time, each requiring progressively more energy but no dramatic jump, since all three come from the outer (n=3) shell.

Step 3: Predict where the big jump occurs.
Once all 3 valence electrons are removed, Al3+ reaches the stable [Ne] configuration. Removing a fourth electron (IE4) would require breaking into this complete, tightly-held core shell.

Final Answer:
The first large jump occurs between IE3 and IE4, because IE1 through IE3 remove aluminum's three valence electrons (all from the n=3 shell), while IE4 would have to remove a core electron from the very stable, complete [Ne] configuration — requiring much more energy.`,
  },
  {
    title: 'Q14 — Defining Electron Affinity',
    content: 'Define electron affinity, and explain why halogens (Group 17) have the most negative (most exothermic) electron affinities of any group.',
    answer_key: `Step 1: Define electron affinity.
Electron affinity is the energy change that occurs when a neutral, gaseous atom gains an electron to form a 1- anion. A more negative electron affinity means more energy is released, indicating the atom "wants" the extra electron more strongly.

Step 2: Explain why halogens have the most negative electron affinities.
Halogens have 7 valence electrons — just one electron short of a complete, stable octet. Adding one electron completes the octet, forming a very stable noble-gas-like configuration, and halogens also have a high Zeff (they are far to the right of their period), so the added electron is pulled in strongly and a large amount of energy is released in the process.

Final Answer:
Electron affinity = energy released (or required) when a neutral gaseous atom gains an electron. Halogens have the most negative electron affinities because gaining one electron completes their octet (very stable result) and their high Zeff strongly attracts the incoming electron, releasing a large amount of energy.`,
  },
  {
    title: 'Q15 — Why Noble Gases Have Near-Zero or Positive Electron Affinity',
    content: 'Explain why noble gases (Group 18) have electron affinities that are essentially zero or slightly positive (energy-absorbing), unlike most other elements.',
    answer_key: `Step 1: Recall the electron configuration of noble gases.
Noble gases already have a complete valence shell (a full octet, or 2 electrons for helium).

Step 2: Explain what happens if an electron is added anyway.
Since there is no room left in the current valence shell, an additional electron would have to enter the next, higher-energy principal shell (a new n level), which is much farther from the nucleus and poorly attracted by the already-shielded nuclear charge. This is energetically unfavorable rather than favorable.

Final Answer:
Noble gases already have a completely full valence shell, so an extra electron cannot be added to that shell — it would have to start a new, higher-energy shell farther from the nucleus. This is energetically unfavorable, giving noble gases electron affinities near zero or even positive (energy must be put in, rather than released).`,
  },
  {
    title: 'Q16 — Defining Electronegativity and the Pauling Scale',
    content: 'Define electronegativity, name the scale most commonly used to quantify it, and identify the single most electronegative element on the periodic table.',
    answer_key: `Step 1: Define electronegativity.
Electronegativity is a measure of how strongly an atom attracts shared electrons toward itself within a chemical bond.

Step 2: Name the scale.
Electronegativity is most commonly quantified using the Pauling scale, a relative (unitless) scale developed by Linus Pauling.

Step 3: Identify the most electronegative element.
Fluorine has the highest electronegativity of any element, with a Pauling value of about 3.98 (often rounded to 4.0). This is because fluorine combines a very small atomic radius with a very high effective nuclear charge, giving it an extremely strong pull on bonding electrons.

Final Answer:
Electronegativity = an atom's tendency to attract shared bonding electrons; measured on the Pauling scale. Fluorine is the most electronegative element (Pauling value ≈ 3.98).`,
  },
  {
    title: 'Q17 — Why Noble Gases Have No Meaningful Electronegativity',
    content: 'Explain why noble gases are typically not assigned an electronegativity value at all (or are assigned essentially zero).',
    answer_key: `Step 1: Recall what electronegativity measures.
Electronegativity describes how strongly an atom attracts electrons within a chemical bond that it is participating in.

Step 2: Apply this to noble gases.
Noble gases already have a complete, stable octet and essentially do not form ordinary chemical bonds under normal conditions (with only rare exceptions, like certain xenon and krypton compounds under special conditions). Since electronegativity only has meaning in the context of a shared bond, and noble gases generally do not participate in bonding, the concept does not meaningfully apply to them.

Final Answer:
Electronegativity measures electron-attracting power within a bond, but noble gases have complete octets and essentially do not form bonds, so there is no bonding context in which to measure the value — hence they are left undefined or listed as zero.`,
  },
  {
    title: 'Q18 — Rank Elements by Electronegativity',
    content: 'Rank the following elements from lowest to highest electronegativity, and justify: cesium (Cs), oxygen (O), sulfur (S).',
    answer_key: `Step 1: Locate each element.
Cs: Group 1, Period 6 (far left, far down — a very large, low-Zeff metal). O: Group 16, Period 2. S: Group 16, Period 3.

Step 2: Compare O and S (same group).
Electronegativity decreases down a group (larger radius, more shielding, weaker pull on shared electrons), so O (Period 2) has a higher electronegativity than S (Period 3).

Step 3: Compare Cs to O and S.
Cesium is a Group 1 alkali metal, far to the left of the periodic table and very far down — it has one of the lowest electronegativities of any element, far lower than either nonmetal.

Step 4: Combine.
Cs has the lowest electronegativity, S is in the middle, and O has the highest.

Final Answer:
Lowest to highest: Cs < S < O. (Approximate real Pauling values: Cs ≈ 0.79, S ≈ 2.58, O ≈ 3.44.)`,
  },
  {
    title: 'Q19 — Metallic Character Trend',
    content: 'Define "metallic character" and describe how it trends across a period and down a group. Which single element on the periodic table has the greatest metallic character?',
    answer_key: `Step 1: Define metallic character.
Metallic character describes how strongly an element exhibits typical metal behaviors: a tendency to lose electrons easily (low ionization energy), form cations, and show properties like luster, malleability, and conductivity.

Step 2: Describe the trend across a period.
Metallic character decreases from left to right across a period, because ionization energy and electronegativity both increase across a period (atoms hold their electrons more tightly and are less willing to lose them).

Step 3: Describe the trend down a group.
Metallic character increases going down a group, because ionization energy decreases (valence electrons are farther from the nucleus and more shielded, so they are lost more easily).

Step 4: Identify the most metallic element.
Combining both trends (most metallic = farthest down and farthest left), francium (Fr), in Group 1 and Period 7, has the greatest metallic character of any element (it is also extremely rare and radioactive, so cesium is often cited in practice as the most metallic naturally abundant example).

Final Answer:
Metallic character = tendency to lose electrons easily and show typical metal properties. It decreases across a period and increases down a group. Francium (bottom-left of the periodic table) has the greatest metallic character.`,
  },
  {
    title: 'Q20 — Compare Two Elements: Metallic Character',
    content: 'Between potassium (K) and calcium (Ca), which has greater metallic character? Explain using ionization energy reasoning.',
    answer_key: `Step 1: Locate each element.
K: Group 1, Period 4. Ca: Group 2, Period 4 — same period, with Ca just one position to the right of K.

Step 2: Compare ionization energies.
Since K is farther left in the same period, it has a lower Zeff and a lower first ionization energy than Ca, meaning K loses its single valence electron more easily than Ca loses one of its two valence electrons.

Step 3: Connect to metallic character.
Because metallic character correlates with how easily an element loses electrons, and K loses its valence electron more readily than Ca, K has greater metallic character.

Final Answer:
Potassium (K) has greater metallic character than calcium (Ca), because K sits farther left in Period 4 with lower Zeff and a lower first ionization energy, making it more willing to lose its valence electron and behave in a "more metallic" way.`,
  },
  {
    title: 'Q21 — Combined Trend Reasoning: Comparing Radius and Ionization Energy',
    content: 'Between phosphorus (P) and arsenic (As), which has the larger atomic radius, and which has the higher first ionization energy? Explain both using a single periodic trend argument.',
    answer_key: `Step 1: Locate each element.
P: Group 15, Period 3. As: Group 15, Period 5 — same group, different periods.

Step 2: Determine relative radius.
Since both are in Group 15, and atomic radius increases down a group (new occupied shells farther from the nucleus, similar Zeff), arsenic (Period 5) has a larger atomic radius than phosphorus (Period 3).

Step 3: Determine relative ionization energy.
The same group-based reasoning that explains the larger radius also explains the lower ionization energy: because arsenic's valence electrons are farther from the nucleus and more shielded, they are held less tightly, so arsenic has a lower first ionization energy — meaning phosphorus has the higher first ionization energy of the two.

Final Answer:
Arsenic (As) has the larger atomic radius; phosphorus (P) has the higher first ionization energy. Both follow directly from the group trend: moving down a group, valence electrons occupy a shell farther from the nucleus, which increases radius but decreases ionization energy (weaker hold on the more distant electron).`,
  },
  {
    title: 'Q22 — Ranking Ionic Radii (Different Elements, Different Charges)',
    content: 'Rank the following ions from smallest to largest radius, and explain: K+, Ca2+, Cl-. (All three are isoelectronic, with 18 electrons each.)',
    answer_key: `Step 1: Confirm the isoelectronic relationship.
K+ (Z=19, 18 electrons), Ca2+ (Z=20, 18 electrons), and Cl- (Z=17, 18 electrons) are all isoelectronic with argon, each having exactly 18 electrons.

Step 2: Apply the isoelectronic-series rule.
For a fixed electron count, radius decreases as nuclear charge (Z) increases, since more protons pull the same electron cloud in more tightly.

Step 3: Order by increasing Z (Cl: 17, K: 19, Ca: 20) to get decreasing radius.
Cl- has the fewest protons (17) for the same 18 electrons, so it is largest. Ca2+ has the most protons (20), so it is smallest.

Final Answer:
Smallest to largest: Ca2+ < K+ < Cl-. (Approximate real values: Ca2+ ≈ 100 pm, K+ ≈ 138 pm, Cl- ≈ 181 pm.)`,
  },
  {
    title: 'Q23 — Explaining Why Ionic Radius Differs from Atomic Radius (Summary)',
    content: 'Summarize, in general terms, why cations are always smaller than their parent neutral atoms, while anions are always larger than their parent neutral atoms.',
    answer_key: `Step 1: Explain the cation case.
When a neutral atom loses one or more electrons to form a cation, it often loses its entire outermost occupied shell (or at least reduces electron-electron repulsion in that shell), and the same nuclear charge now pulls on fewer electrons, increasing the effective pull per remaining electron. Both effects shrink the ion relative to the neutral atom.

Step 2: Explain the anion case.
When a neutral atom gains one or more electrons to form an anion, the same nuclear charge must now be shared among more electrons, decreasing the effective pull per electron, and the added electron(s) increase electron-electron repulsion within the valence shell, causing it to expand. Both effects enlarge the ion relative to the neutral atom.

Final Answer:
Cations are smaller because they have fewer electrons (often losing an entire outer shell) sharing the same nuclear charge, increasing the pull per electron. Anions are larger because they have more electrons sharing the same nuclear charge, decreasing the pull per electron and increasing electron-electron repulsion.`,
  },
  {
    title: 'Q24 — Using Given Radius Values for Direct Comparison',
    content: 'Given the following atomic radii — silicon (Si): 111 pm, phosphorus (P): 107 pm, sulfur (S): 105 pm, chlorine (Cl): 102 pm — confirm that these values are consistent with the expected periodic trend, and state what trend they demonstrate.',
    answer_key: `Step 1: Identify the relationship between these elements.
Si, P, S, and Cl are all in Period 3, appearing in that order moving left to right (Groups 14, 15, 16, 17).

Step 2: Compare the given radii to the expected trend.
The expected trend across a period (left to right) is decreasing atomic radius, due to increasing Zeff with each added proton (electrons added to the same outer shell shield each other poorly).

Step 3: Check the numbers against this expectation.
111 pm (Si) > 107 pm (P) > 105 pm (S) > 102 pm (Cl) — the radii do decrease steadily from left to right, consistent with the expected trend.

Final Answer:
Yes, the values are consistent with the expected trend: atomic radius decreases across Period 3 from Si to Cl, because Zeff increases steadily as protons are added while electrons fill the same outer shell with little added shielding.`,
  },
  {
    title: 'Q25 — Using Given Ionization Energy Values for Direct Comparison',
    content: 'Given the first ionization energies of the Group 1 elements — Li: 520 kJ/mol, Na: 496 kJ/mol, K: 419 kJ/mol, Rb: 403 kJ/mol — state the trend these values demonstrate and explain it.',
    answer_key: `Step 1: Identify the relationship between these elements.
Li, Na, K, and Rb are all Group 1 (alkali metals), listed in order of increasing period (top to bottom of the group).

Step 2: Compare the values.
520 > 496 > 419 > 403 kJ/mol — ionization energy decreases steadily going down the group.

Step 3: Explain the trend.
Going down Group 1, each element's single valence electron occupies a shell with a progressively higher principal quantum number, placing it farther from the nucleus and behind more layers of inner-shell shielding. Since Zeff stays roughly constant while the electron's distance from the nucleus increases, the attraction weakens, so less energy is required to remove that electron.

Final Answer:
The values confirm that first ionization energy decreases down Group 1 (Li > Na > K > Rb), because the valence electron sits progressively farther from the nucleus (higher n) with roughly constant Zeff, weakening the hold on that electron.`,
  },
  {
    title: 'Q26 — Ranking Four Elements Combining Group and Period Trends',
    content: 'Rank the following four elements from smallest to largest atomic radius, and justify: chlorine (Cl), bromine (Br), selenium (Se), sulfur (S).',
    answer_key: `Step 1: Locate each element.
S: Group 16, Period 3. Cl: Group 17, Period 3. Se: Group 16, Period 4. Br: Group 17, Period 4.

Step 2: Compare within Period 3 (S vs. Cl).
Across Period 3, radius decreases left to right, so S (Group 16) is larger than Cl (Group 17).

Step 3: Compare within Period 4 (Se vs. Br).
By the same reasoning, Se (Group 16) is larger than Br (Group 17).

Step 4: Compare across periods within each group.
Down Group 16, Se (Period 4) is larger than S (Period 3). Down Group 17, Br (Period 4) is larger than Cl (Period 3).

Step 5: Combine all four using both trends.
Since Period 4 elements are larger than their Period 3 counterparts in the same group, and Group 16 elements are larger than Group 17 elements in the same period, the overall order (smallest to largest) is: Cl < S < Br < Se.

Final Answer:
Smallest to largest: Cl < S < Br < Se. (Approximate real values: Cl ≈ 99 pm, S ≈ 105 pm, Br ≈ 114 pm, Se ≈ 120 pm.)`,
  },
  {
    title: 'Q27 — Conceptual: Why Is Fluorine Both Very Small and Very Electronegative?',
    content: 'Explain why fluorine has both an unusually small atomic radius and the highest electronegativity of any element, using a single unifying argument.',
    answer_key: `Step 1: Locate fluorine.
Fluorine sits in Period 2, Group 17 — near the top-right corner of the periodic table (excluding the noble gases).

Step 2: Apply the unifying reasoning.
Both trends (radius and electronegativity) are governed by effective nuclear charge and distance from the nucleus. Fluorine is far to the right of its period, so it has a high Zeff (9 protons with only 2 inner shielding electrons). It is also in Period 2, so its valence electrons sit in a shell very close to the nucleus (small n).

Step 3: Connect this to both properties.
This combination of high Zeff and a very close valence shell means fluorine's nucleus exerts an unusually strong pull on both its own electrons (shrinking its atomic radius) and on any electrons it shares in a bond (raising its electronegativity).

Final Answer:
Fluorine's high Zeff combined with its very close (n=2) valence shell gives its nucleus an unusually strong grip on nearby electrons — this same strong pull is responsible for both its small atomic radius and its position as the most electronegative element.`,
  },
  {
    title: 'Q28 — Predicting a Missing Trend Value',
    content: 'The first ionization energies of the Period 3 elements generally increase from Na to Ar, but aluminum (Al, IE1 ≈ 578 kJ/mol) actually has a LOWER first ionization energy than magnesium (Mg, IE1 ≈ 738 kJ/mol), even though Al comes after Mg in the period. Explain this exception.',
    answer_key: `Step 1: Write the relevant electron configurations.
Mg: [Ne] 3s2 (valence electrons in a filled 3s subshell).
Al: [Ne] 3s2 3p1 (valence electrons in a filled 3s subshell plus one electron in the higher-energy 3p subshell).

Step 2: Explain why Al's IE1 is lower despite having one more proton.
The electron removed from magnesium comes from a completely filled, relatively stable 3s subshell. The electron removed from aluminum, however, comes from the singly-occupied 3p subshell, which is at a slightly higher energy level than 3s and is also partially shielded by the filled 3s2 electrons beneath it. This makes aluminum's outermost (3p) electron easier to remove than one of magnesium's paired, lower-energy 3s electrons, despite aluminum's higher nuclear charge.

Final Answer:
Aluminum's first ionization energy is lower than magnesium's because the electron removed from Al comes from the higher-energy, more shielded 3p subshell, while the electron removed from Mg comes from the lower-energy, unshielded-by-p-electrons, filled 3s subshell — subshell energy and shielding outweigh the small increase in nuclear charge in this one exception.`,
  },
  {
    title: 'Q29 — Predicting a Second Missing Trend Value (Phosphorus vs. Sulfur)',
    content: 'Phosphorus (P, IE1 ≈ 1012 kJ/mol) has a slightly HIGHER first ionization energy than sulfur (S, IE1 ≈ 1000 kJ/mol), even though S comes after P in Period 3 (where IE is generally expected to increase). Explain this exception using electron configuration and Hund\'s Rule.',
    answer_key: `Step 1: Write the relevant electron configurations.
P: [Ne] 3s2 3p3 — three 3p electrons, one in each of the three 3p orbitals (all unpaired, per Hund's Rule).
S: [Ne] 3s2 3p4 — four 3p electrons, meaning one 3p orbital now holds a pair.

Step 2: Explain why S's IE1 is slightly lower than expected.
Phosphorus's three 3p electrons are all unpaired and spread across separate orbitals, so there is no extra electron-electron repulsion from sharing an orbital — this half-filled 3p3 arrangement is an especially stable configuration. Sulfur's fourth 3p electron must pair up in an already-occupied orbital, and the resulting electron-electron repulsion between the two paired electrons makes that particular electron easier to remove than expected, slightly lowering sulfur's ionization energy relative to the general period trend.

Final Answer:
Sulfur's first ionization energy dips slightly below phosphorus's because phosphorus has an extra-stable, half-filled 3p3 subshell (three unpaired electrons, no orbital pairing), while sulfur's fourth 3p electron must pair up, and the added electron-electron repulsion from that pairing makes it easier to remove — a small exception to the general left-to-right increase in ionization energy.`,
  },
  {
    title: 'Q30 — Synthesis Question: Ranking by Multiple Trends at Once',
    content: 'For the elements sodium (Na), magnesium (Mg), and aluminum (Al): (a) rank them by atomic radius (largest to smallest), (b) rank them by first ionization energy (lowest to highest), and (c) rank them by metallic character (most to least). Briefly justify each ranking.',
    answer_key: `Step 1: Locate the elements.
Na (Group 1), Mg (Group 2), Al (Group 13) — all in Period 3, in that left-to-right order.

Step 2: Rank by atomic radius.
Since radius decreases across a period (increasing Zeff, same outer shell), and Na is farthest left: Na > Mg > Al.

Step 3: Rank by first ionization energy.
Since ionization energy increases across a period (increasing Zeff makes valence electrons harder to remove), and Na is farthest left: Na < Mg < Al.

Step 4: Rank by metallic character.
Metallic character correlates with how easily electrons are lost, i.e., with low ionization energy. Since Na has the lowest ionization energy of the three, Na has the greatest metallic character, followed by Mg, followed by Al: Na > Mg > Al.

Final Answer:
(a) Atomic radius: Na > Mg > Al. (b) First ionization energy: Na < Mg < Al. (c) Metallic character: Na > Mg > Al. All three rankings follow directly from the same underlying cause: Zeff increases steadily from Na to Al across Period 3.`,
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
  await insertBatch(TOPIC_ORG, orgQuestions)
  await insertBatch(TOPIC_TRENDS, trendsQuestions)
  console.log('Done.')
}

main()
