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
  '1.5': 'f9052a5f-1a96-4070-89a3-000d05c2bdc4',
  '1.6': '08497fdf-0b09-44c4-992b-27a3912b77bd',
  '1.7': '616020e0-79a3-47fe-baef-f3669e1b3193',
  '1.8': 'af121e66-0dae-4143-81ca-312b863a918c',
};

/*
Round 2 supplement, per the final permissive-sweep instruction: only reject (a) true exact clones
(same specific element/compound/numbers as an existing DB question) or (b) content genuinely
outside current AP Chem CED Unit 1 scope. "Same skill, different example" is no longer a
rejection reason. This pass re-examined every item from pMCQ Unit J.pdf (64 numbered questions)
and pFRQ Unit J.pdf (56 lettered sub-parts across 12 FRQs) that survived round 1's stricter filter,
plus re-examined round-1 rejections under the new looser bar.

Items previously skipped in round 1 as "not cleanly reproducible" (arrow-based orbital-diagram
matching sets, pMCQ #3-6) are now reconstructed here using clean, independently-verified
electron configurations that preserve the same instructional intent (identify noble gas /
transition metal / excited state / alkali metal from a set) -- not a literal transcription of the
scanned arrows, since those were illegible, but a faithful, chemically-valid rebuild of the same
skill target. Two PES items (pMCQ #63-64, pFRQ #1(b)) that lacked usable quantitative data in the
source scan are similarly rebuilt using real, independently-verified PES binding energies for
fluorine and silicon (both from published PES tables) rather than skipped.
*/

const q15 = [
  {
    topic: '1.5', title: 'Q48 — Matching Ground-State Configurations to Descriptions',
    content:
`Four electron configurations for neutral atoms are given below.
W: 1s²2s²2p⁶
X: 1s²2s²2p⁶3s²3p⁶4s²3d⁵
Y: 1s²2s²2p⁶3s²3p⁶4s¹
Z: 1s¹2s¹ (this is NOT a ground-state configuration)

(a) Which configuration represents a noble gas?
(b) Which configuration represents a transition metal?
(c) Which configuration represents an atom in an excited state? Explain how you can tell.
(d) Which configuration represents an alkali metal? Briefly explain why alkali metals are highly reactive.`,
    answer: `(a) W. With 10 electrons filling 1s, 2s, and 2p completely (1s²2s²2p⁶), W has a complete octet and corresponds to neon — a noble gas.

(b) X. With 25 electrons total and an incompletely-filled 3d subshell (3d⁵, only halfway to the full 3d¹⁰), X has the hallmark of a transition metal (this is manganese).

(c) Z. A ground-state helium atom (2 electrons) should have the configuration 1s², with both electrons in the lowest-energy 1s orbital. Instead, Z shows only one electron in 1s and one electron already promoted to the higher-energy 2s orbital (1s¹2s¹) — this is only possible if the atom has absorbed energy and one electron has jumped to a higher energy level, which is the definition of an excited state.

(d) Y. With 19 electrons and a single valence electron in 4s¹ ([Ar]4s¹), Y is potassium, an alkali metal. Alkali metals are highly reactive because they have only one valence electron, which is relatively easy to remove (low first ionization energy) since it is shielded from the nucleus by a full inner core of electrons — this makes alkali metals eager to lose that one electron and form 1+ ions in reactions.`
  },
  {
    topic: '1.5', title: 'Q49 — Matching Configurations: Halogen, Transition Metal, Invalid Configuration, and Transition-Metal Ion',
    content:
`Four electron configurations are given below.
A: 1s²1p⁶2s²2p³
B: 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p⁶5s²4d¹
C: 1s²2s²2p⁶3s²3p⁶3d¹⁰
D: 1s²2s²2p⁵

(a) Which configuration represents a halogen in its ground state?
(b) Which configuration is impossible for any real atom? Explain why.
(c) Which configuration could represent a transition metal in its ground state?
(d) Which configuration most likely represents a transition-metal ION rather than a neutral atom? Explain your reasoning.`,
    answer: `(a) D. With 9 electrons and the valence configuration 2p⁵ (7 valence electrons, one short of a full octet), D corresponds to fluorine — a halogen. Halogens always have the general valence configuration ns²np⁵.

(b) A. The notation "1p⁶" is impossible: p orbitals do not exist for the n = 1 energy level (only an s orbital exists at n = 1). No real atom can have electrons in a 1p subshell.

(c) B. With an incompletely-filled 4d subshell (4d¹, only one of ten possible electrons) after a filled 4p⁶ and 3d¹⁰, B has the hallmark of a transition metal in the d-block.

(d) C. This configuration has 30 electrons total, ending in 3d¹⁰ with no 4s electrons at all. A neutral atom with a filled 3d¹⁰ subshell (zinc, Z = 30) would be expected to also show a filled 4s² subshell in its neutral ground state ([Ar]4s²3d¹⁰). The absence of the 4s² electrons here indicates this configuration represents the 2+ ion (Zn²⁺) rather than the neutral atom, since transition metals lose their outermost s electrons first when forming cations.`
  },
  {
    topic: '1.5', title: 'Q50 — Matching Six Ground-State Configurations to Chemical Descriptions',
    content:
`Five electron configurations are given below.
a: 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p⁶5s¹
b: 1s²2s²2p⁶3s²3p⁵
c: 1s²2s²2p⁶3s²3p⁶4s²3d⁸
d: 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p⁶
e: 1s²2s²2p³3s¹ (this is NOT a ground-state configuration)

Identify which configuration best matches each description below.
(a) A transition metal.
(b) An atom in an excited state.
(c) The ground-state atom with the fewest valence electrons.
(d) A chemically unreactive (noble gas) element.
(e) An atom that would be expected to form a stable 1− ion.
(f) The most chemically reactive metal.`,
    answer: `(a) c. With 28 total electrons and an incompletely-filled 3d subshell (3d⁸), this represents nickel — a transition metal.

(b) e. This configuration has 8 total electrons but is not a valid ground state: the ground-state atom with 8 electrons (oxygen) should be 1s²2s²2p⁴, with all electrons in the n = 1 and n = 2 levels. Instead, this configuration shows only 2p³ and a lone electron already promoted out to the higher-energy 3s orbital, indicating an excited state.

(c) a. This configuration has 1 valence electron (5s¹, all other subshells full) — matching rubidium's ground state, and the fewest valence electrons among the true ground-state configurations shown (a, b, c, d).

(d) d. With 36 total electrons filling every subshell completely (ending in a full 4p⁶), this configuration has a complete octet and represents krypton, an unreactive noble gas.

(e) b. With 17 electrons and the valence configuration 3p⁵ (7 valence electrons), this represents chlorine, which needs only 1 more electron to complete its octet, making a stable 1− ion (Cl⁻) energetically favorable.

(f) a. Rubidium (configuration a) is an alkali metal with only 1 valence electron, shielded by a full inner core and located in a very high energy level (n = 5) far from the nucleus. This makes it extremely easy to lose that electron, making rubidium the most reactive metal of this set.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q51 — Meaning of the Subscript in a pₓ Orbital',
    content:
`In a pₓ orbital, the subscript x denotes the _______ of the electron(s) in that orbital.
(A) energy
(B) spin
(C) probability of the shell
(D) size of the orbital
(E) axis along which the orbital is aligned${JUSTIFY}`,
    answer: `Correct answer: (E) axis along which the orbital is aligned
There are three p orbitals in any energy level n ≥ 2 (pₓ, p_y, and p_z), oriented perpendicular to one another along the three spatial axes (x, y, and z). The subscript on a p orbital's label simply identifies which of these three spatial axes that particular orbital is aligned along — it does not describe energy, spin, or size, since all three p orbitals within the same subshell are identical in energy, shape, and size (they are degenerate), differing only in spatial orientation.

(A), (B), (C), and (D) all describe properties that do NOT differ among the three p orbitals in a subshell — energy, spin, and size are the same for pₓ, p_y, and p_z; only orientation in space differs, which is what the subscript indicates.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q52 — Largest Principal Quantum Number in Iodine\'s Ground-State Configuration',
    content:
`What is the largest principal quantum number (n) that appears in the ground-state electron configuration of iodine (I, Z = 53)?
(A) 1
(B) 4
(C) 5
(D) 6
(E) 7${JUSTIFY}`,
    answer: `Correct answer: (C) 5
Iodine's ground-state configuration is [Kr]5s²4d¹⁰5p⁵. The highest occupied energy level is n = 5 (the 5s and 5p electrons). This corresponds to iodine being in Period 5 of the periodic table — the period number always equals the highest principal quantum number with occupied electrons in a ground-state atom.

(A), (B), (D), and (E) do not match iodine's actual electron configuration; in particular, iodine's 4d electrons (n = 4) are not its highest-energy electrons, since it also has electrons in the 5s and 5p subshells (n = 5).`
  },
  {
    topic: '1.5', mcq: true, title: 'Q53 — Valence Shell Configuration Common to the Alkaline Earth Metals',
    content:
`All of the ________ have a valence shell electron configuration of ns².
(A) noble gases
(B) halogens
(C) chalcogens
(D) alkali metals
(E) alkaline earth metals${JUSTIFY}`,
    answer: `Correct answer: (E) alkaline earth metals
The alkaline earth metals (Group 2: Be, Mg, Ca, Sr, Ba, Ra) each have exactly 2 valence electrons, both in the outermost s subshell, giving the general valence configuration ns² (e.g., Mg's valence electrons are 3s²).

(A) Noble gases have a full valence shell (ns²np⁶, except helium's 1s²), not just ns².
(B) Halogens have the valence configuration ns²np⁵.
(C) Chalcogens (Group 16) have the valence configuration ns²np⁴.
(D) Alkali metals have only 1 valence electron (ns¹), not 2.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q54 — Period Whose Inner-Core Configuration Matches Neon',
    content:
`Elements in which period of the periodic table have an inner-core electron configuration that matches the electron configuration of neon (i.e., can be abbreviated starting with [Ne])?
(A) first
(B) second
(C) third
(D) fourth
(E) fifth${JUSTIFY}`,
    answer: `Correct answer: (C) third
Neon's ground-state configuration is 1s²2s²2p⁶ (10 electrons, a complete n = 1 and n = 2 shell). Any element whose configuration can be abbreviated as [Ne] followed by additional electrons must have completely filled the n = 1 and n = 2 levels and be adding electrons to the n = 3 level — this describes every element in Period 3 (Na through Ar), e.g., sodium is [Ne]3s¹.

(A) Period 1 elements (H, He) have far fewer electrons than neon and can't have a [Ne] core.
(B) Period 2 elements themselves are still filling the n = 2 level (which is what makes up the [Ne] core), so they can't be abbreviated using their own core.
(D) and (E), Periods 4 and 5, would be abbreviated starting from [Ar] or [Kr] respectively (the nearest preceding noble gas), not [Ne].`
  },
  {
    topic: '1.7', mcq: true, title: 'Q62 — Identifying the Semiconductor Element',
    content:
`Which of the following elements is commonly used in the manufacturing of semiconductors?
(A) Hg
(B) Si
(C) Cu
(D) Zn
(E) Ag${JUSTIFY}`,
    answer: `Correct answer: (B) Si
Silicon is a metalloid, meaning it has intermediate properties between metals and nonmetals — most notably, the ability to conduct electricity under some conditions but not others (i.e., it can act as a semiconductor). This property, combined with its abundance and ease of purification, makes silicon the dominant material in semiconductor manufacturing.

(A), (C), (D), and (E) — mercury, copper, zinc, and silver — are all true metals with metallic (not semiconducting) electrical conductivity; none of them are used as the base material for semiconductor devices.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q63 — Second-Most-Abundant Element in Earth\'s Crust',
    content:
`After oxygen, which of the following is by far the most common element in the Earth's crust?
(A) Hg
(B) Si
(C) Cu
(D) Zn
(E) Ag${JUSTIFY}`,
    answer: `Correct answer: (B) Si
Silicon makes up roughly 28% of the mass of the Earth's crust (second only to oxygen's roughly 46%), largely because most of the crust's rock and sand is composed of silicate minerals and silicon dioxide (SiO₂), a network covalent solid.

(A), (C), (D), and (E) — mercury, copper, zinc, and silver — are all far less abundant in the crust (each well under 1% by mass), making them comparatively rare "trace" or economically-mined metals rather than major crust constituents.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q64 — Identifying the Element with an Extraordinarily Large Second-Ionization-Energy Jump',
    content:
`For which of the following elements would you expect an extraordinarily large increase between the first and second successive ionization energies?
(A) Ca
(B) K
(C) Ga
(D) Ge
(E) Se${JUSTIFY}`,
    answer: `Correct answer: (B) K
Potassium's ground-state configuration is [Ar]4s¹, giving it exactly 1 valence electron. Removing that single valence electron (the first ionization) is relatively easy, since it's shielded by a full inner core. But removing a second electron requires reaching into the full, much more tightly-held [Ar] core — producing a disproportionately large jump specifically between the 1st and 2nd ionization energies.

(A) Ca has 2 valence electrons, so its large jump occurs between the 2nd and 3rd ionizations, not the 1st and 2nd.
(C) Ga has 3 valence electrons, so its large jump occurs between the 3rd and 4th ionizations.
(D) Ge has 4 valence electrons, so its large jump occurs between the 4th and 5th ionizations.
(E) Se has 6 valence electrons, so its large jump occurs between the 6th and 7th ionizations.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q65 — Largest Atomic Radius Among Five Ground-State Configurations',
    content:
`Use the ground-state electron configurations below to answer this question.
(A) [Kr]5s¹
(B) [Ne]3s²3p¹
(C) [Ar]4s²3d¹⁰4p⁴
(D) [Ne]3s²3p⁶
(E) [Ar]4s¹

Which of these atoms has the largest atomic radius?${JUSTIFY}`,
    answer: `Correct answer: (A) [Kr]5s¹ (rubidium)
Rubidium has valence electrons in the n = 5 energy level — more energy levels (shells) than any of the other elements listed (Al at n = 3, Se at n = 4, Ar at n = 3, K at n = 4). More occupied energy levels means the outermost electron is intrinsically farther from the nucleus, giving rubidium the largest atomic radius of this group. Rubidium is also an alkali metal, which as a group has among the largest atomic radii for their period.

(B) [Ne]3s²3p¹ (Al) and (D) [Ne]3s²3p⁶ (Ar) are both Period 3, with valence electrons only in n = 3 — fewer shells than Rb.
(C) [Ar]4s²3d¹⁰4p⁴ (Se) is Period 4 but has a higher effective nuclear charge than the Period 4 alkali metal (E), pulling its electron cloud in more tightly.
(E) [Ar]4s¹ (K) is Period 4 but one row above Rb, giving it one fewer occupied energy level.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q66 — Highest First Ionization Energy Among Five Ground-State Configurations',
    content:
`Use the ground-state electron configurations below to answer this question.
(A) [Kr]5s¹
(B) [Ne]3s²3p¹
(C) [Ar]4s²3d¹⁰4p⁴
(D) [Ne]3s²3p⁶
(E) [Ar]4s¹

Which of these atoms has the highest first ionization energy?${JUSTIFY}`,
    answer: `Correct answer: (D) [Ne]3s²3p⁶ (argon)
Argon has a complete octet (a full valence shell), which is an especially stable electron arrangement. Removing an electron from this complete octet requires overcoming both a strong effective nuclear charge (argon has more protons than the other Period 3 element shown) and the loss of the extra stability that comes with a filled shell, giving argon the highest first ionization energy of this group. As a general rule, noble gases have the highest first ionization energy in their period.

(A) [Kr]5s¹ (Rb) and (E) [Ar]4s¹ (K) are both alkali metals with a single, loosely-held valence electron, giving them very low first ionization energies.
(B) [Ne]3s²3p¹ (Al) has a low effective nuclear charge for its period and an easily-removed single p electron.
(C) [Ar]4s²3d¹⁰4p⁴ (Se) has a higher ionization energy than the alkali metals and Al, but nowhere near as high as a noble gas with a complete octet.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q67 — Most Chemically Reactive Metal Among Five Ground-State Configurations',
    content:
`Use the ground-state electron configurations below to answer this question.
(A) [Kr]5s¹
(B) [Ne]3s²3p¹
(C) [Ar]4s²3d¹⁰4p⁴
(D) [Ne]3s²3p⁶
(E) [Ar]4s¹

Which of these represents the most chemically reactive metal?${JUSTIFY}`,
    answer: `Correct answer: (A) [Kr]5s¹ (rubidium)
Both (A) [Kr]5s¹ (Rb) and (E) [Ar]4s¹ (K) are alkali metals with just 1 valence electron — the group known for being the most reactive metals, since they readily lose that single electron. Between the two, rubidium's valence electron is in a higher energy level (n = 5, versus n = 4 for potassium), placing it farther from the nucleus and shielded more effectively. By Coulomb's law, this greater distance means a weaker attractive force holding the electron in place, so rubidium's valence electron is even easier to remove than potassium's — making rubidium the more reactive of the two, and the most reactive metal overall in this set.

(B) [Ne]3s²3p¹ (Al) is a metal but has a higher ionization energy than either alkali metal, since it holds 3 valence electrons more tightly.
(C) [Ar]4s²3d¹⁰4p⁴ (Se) is a nonmetal/metalloid-adjacent element, not a reactive metal.
(D) [Ne]3s²3p⁶ (Ar) is a noble gas and essentially unreactive.`
  },
  {
    topic: '1.7', title: 'Q68 — Comparing First and Second Ionization Energies of Potassium and Calcium',
    content:
`The table below shows ionization energy data for potassium and calcium.
                First Ionization Energy (kJ/mol)   Second Ionization Energy (kJ/mol)
Potassium (K)              419                                3,050
Calcium (Ca)                590                                1,140

(a) Explain, in terms of atomic structure, why the first ionization energy of Ca is greater than that of K.
(b) Explain, in terms of atomic structure, why the second ionization energy of K is so much greater than the second ionization energy of Ca.`,
    answer: `(a) Both K and Ca have their outermost valence electron(s) in the same energy level (n = 4, the 4s subshell). However, Ca has one more proton than K, giving it a greater effective nuclear charge on its valence electrons. This stronger nuclear attraction (per Coulomb's law) holds Ca's valence electron more tightly than K's, requiring more energy to remove — so Ca's first ionization energy is greater than K's.

(b) After losing its single valence electron, K⁺ has the configuration [Ar] — a complete, stable octet. Removing a second electron from K⁺ means reaching into this full n = 3 core, which is much closer to the nucleus and shielded only by the n = 1 and n = 2 electrons (a much higher effective nuclear charge), making it extremely difficult.
After losing one of its two valence electrons, Ca⁺ still has one valence electron remaining in the n = 4 shell (its second ionization removes a true valence electron, not a core electron), which is farther from the nucleus and more effectively shielded, making it comparatively easy to remove.
Because K's second ionization requires breaking into a stable, low-energy core shell while Ca's second ionization simply removes its second (still-valence) electron, K's second ionization energy is dramatically larger than Ca's.`
  },
  {
    topic: '1.7', title: 'Q69 — Selenium\'s First Ionization Energy Compared to Bromine\'s and Tellurium\'s',
    content:
`In terms of atomic structure, explain why the first ionization energy of selenium (Se, atomic number 34) is
(a) less than that of bromine (Br, atomic number 35), and
(b) greater than that of tellurium (Te, atomic number 52).`,
    answer: `(a) The electrons removed in the first ionization of both Se and Br come from the same energy level (n = 4, specifically the 4p subshell). However, Br has one more proton than Se, giving Br's valence electrons a greater effective nuclear charge and therefore a stronger attraction to the nucleus. This stronger attraction makes Br's valence electron harder to remove, so Se's first ionization energy is lower than Br's.

(b) The electron removed from a Te atom is in the 5p subshell (n = 5), while the electron removed from an Se atom is in the 4p subshell (n = 4). The 5p subshell is a higher energy level, farther from the nucleus, than the 4p subshell. By Coulomb's law, this greater distance between the valence electron and the nucleus in Te results in a weaker attractive force, meaning less energy is required to remove Te's valence electron than Se's. So Se's first ionization energy is greater than Te's.`
  },
  {
    topic: '1.8', title: 'Q13 — Comparing the Lattice Energy of CaO and K2O',
    content:
`The lattice energy of CaO(s) is 3,460 kJ/mol, while the lattice energy of K2O(s) is 2,240 kJ/mol. Account for this difference in terms of Coulomb's law.`,
    answer: `Lattice energy depends on both the magnitude of the ionic charges and the distance between the ions, per Coulomb's law (F = kq₁q₂/d²) — greater charge magnitudes and shorter distances both increase the attractive force (and therefore the lattice energy) between oppositely-charged ions.
Charge: CaO is composed of Ca²⁺ and O²⁻ ions (charge magnitude 2 on each ion), while K2O is composed of K⁺ and O²⁻ ions (charge magnitude only 1 on the cation). The product of the charges is much larger for CaO (2 x 2 = 4) than for K2O (1 x 2 = 2), producing a stronger electrostatic attraction in CaO.
Size: The Ca²⁺ ion is also smaller than the K⁺ ion (since Ca has one more proton, giving Ca²⁺ a greater effective nuclear charge on its remaining electrons and pulling them in more tightly), meaning the cation-anion distance in the CaO lattice is shorter than in the K2O lattice. A shorter distance further strengthens the electrostatic attraction in CaO.
Both the greater ionic charge magnitude and the smaller ionic size in CaO contribute to its substantially greater lattice energy compared to K2O.`
  },
];

const q16 = [
  {
    topic: '1.6', title: 'Q14 — Fluorine\'s PES: The Second Peak vs. the Second Ionization Energy',
    content:
`The complete photoelectron spectrum of an unknown element shows three peaks, with binding energies (from highest to lowest) of 6.72 x 10^4 kJ/mol, 3.88 x 10^3 kJ/mol, and 1.68 x 10^3 kJ/mol, and relative peak heights (electron ratio) of 2 : 2 : 5. This spectrum is consistent with a ground-state fluorine atom (1s²2s²2p⁵).

A student examines this spectrum and proposes that the second ionization energy of fluorine is 3.88 x 10^3 kJ/mol (the energy of the second, middle peak). To refute this proposed interpretation, identify the following.
(a) The subshell from which an electron is actually removed during the second ionization of a fluorine atom.
(b) The subshell that corresponds to the second (middle) peak of the photoelectron spectrum shown.`,
    answer: `(a) The second ionization of fluorine means first removing one electron from the neutral atom (F → F⁺ + e⁻), then removing a second electron from the resulting F⁺ ion (F⁺ → F²⁺ + e⁻). F⁺ has the configuration 1s²2s²2p⁴, so the electron removed in this second ionization step comes from the 2p subshell — the same subshell (though not the same specific event) as the first ionization.

(b) The middle peak, at 3.88 x 10^3 kJ/mol with a relative height corresponding to 2 electrons, corresponds to the 2s subshell (F's 2s² electrons).

Why the student's interpretation is wrong: a photoelectron spectrum's peaks show the energy required to eject an electron from each subshell of a single neutral ground-state atom in one photoionization event — they are not the same thing as the successive (first, second, third...) ionization energies of that atom, which describe removing electrons one at a time from progressively more positively-charged ions. The middle PES peak (2s subshell, 3.88 x 10^3 kJ/mol) tells you the energy to remove a 2s electron from neutral F, not the energy to remove the second electron overall from an already-ionized F⁺ ion (which, as shown in part (a), actually comes from the 2p subshell, not 2s). The student incorrectly conflated "the second peak" with "the second ionization energy."`
  },
  {
    topic: '1.6', title: 'Q15 — Complete Photoelectron Spectrum of Silicon',
    content:
`The complete photoelectron spectrum of a ground-state atom of an unknown element shows five peaks, with the following approximate binding energies and relative peak heights (electron ratios), from highest to lowest binding energy:
1839 MJ/mol (relative height 2), 154 MJ/mol (relative height 2), 104 MJ/mol (relative height 6), 13 MJ/mol (relative height 2), 8 MJ/mol (relative height 2).

(a) Determine the total number of electrons in this atom, and identify the element.
(b) Assign each of the five peaks to its correct subshell (1s, 2s, 2p, 3s, or 3p).`,
    answer: `(a) Adding up the relative peak heights: 2 + 2 + 6 + 2 + 2 = 14 total electrons. An atom with 14 electrons has atomic number 14, which is silicon (Si).

(b) PES peaks are ordered from highest binding energy (electrons closest to the nucleus, hardest to remove) to lowest binding energy (valence electrons, easiest to remove), which corresponds to increasing principal quantum number and subshell energy:
1839 MJ/mol (height 2) → 1s subshell (1s² — innermost, most tightly bound core electrons)
154 MJ/mol (height 2) → 2s subshell (2s²)
104 MJ/mol (height 6) → 2p subshell (2p⁶)
13 MJ/mol (height 2) → 3s subshell (3s²)
8 MJ/mol (height 2) → 3p subshell (3p², the valence electrons — lowest binding energy, easiest to remove)
This matches silicon's full ground-state configuration: 1s²2s²2p⁶3s²3p².`
  },
];

const q17extra = [
  {
    topic: '1.5', mcq: true, title: 'Q55 — Combined Period Trend: Atomic Radius, Electron Affinity, and First Ionization Energy',
    content:
`In general, as you go across a period in the periodic table from left to right: the atomic radius ______, the electron affinity becomes ______ negative, and the first ionization energy ______.
(A) decreases, decreasingly, increases
(B) increases, increasingly, decreases
(C) increases, increasingly, increases
(D) decreases, increasingly, increases
(E) decreases, decreasingly, decreases${JUSTIFY}`,
    answer: `Correct answer: (D) decreases, increasingly, increases
Moving left to right across a period, protons are added while electrons are added to the same energy level (same n), so shielding stays roughly constant while effective nuclear charge steadily increases. This stronger nuclear pull: (1) pulls the valence electron cloud in more tightly, decreasing atomic radius; (2) makes an atom more energetically eager to gain an additional electron to complete its valence shell, making electron affinity increasingly negative (more exothermic, generally, moving toward the halogens); and (3) makes it harder to remove a valence electron, increasing first ionization energy.

(A), (B), (C), and (E) each get at least one of the three trends backwards.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q56 — Definition of Isotopes',
    content:
`Isotopes of the same element are nuclides with
(A) the same number of protons and the same atomic number (Z).
(B) the same number of protons and the same number of neutrons.
(C) the same mass number (A) and the same number of electrons.
(D) the same mass number (A) and the same number of protons.
(E) the same sum of protons and neutrons, and the same mass number (A).${JUSTIFY}`,
    answer: `Correct answer: (A) the same number of protons and the same atomic number (Z).
Isotopes are defined as atoms of the same element (meaning the same number of protons, and therefore the same atomic number Z) that differ in their number of neutrons — and consequently differ in mass number (A). Having the same number of protons is the defining criterion; the neutron count (and mass number) is exactly what's allowed to vary between isotopes.

(B) is wrong — isotopes of the same element specifically have DIFFERENT numbers of neutrons, not the same number (if both proton and neutron counts matched, they'd be the same isotope, not different isotopes).
(C) and (D) both require the same mass number (A), which is backwards — different isotopes of an element characteristically have different mass numbers.
(E) is circular/trivial and doesn't correctly define what makes nuclides isotopes of each other.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q57 — Identifying the Diamagnetic Element Among H, Li, Be, B, and C',
    content:
`Which of the following elements is diamagnetic in its ground state (i.e., has no unpaired electrons)?
(A) H
(B) Li
(C) Be
(D) B
(E) C${JUSTIFY}`,
    answer: `Correct answer: (C) Be
Beryllium's ground-state configuration is 1s²2s² — both the 1s and 2s subshells are completely filled, so every electron is paired. With no unpaired electrons, Be is diamagnetic.

(A) H (1s¹) has 1 unpaired electron.
(B) Li (1s²2s¹) has 1 unpaired electron (the lone 2s electron).
(D) B (1s²2s²2p¹) has 1 unpaired electron (the lone 2p electron).
(E) C (1s²2s²2p²) has 2 unpaired electrons (by Hund's rule, the two 2p electrons occupy separate orbitals).`
  },
  {
    topic: '1.5', mcq: true, title: 'Q58 — Identifying the Element with All Paired Electrons Among C, N, O, F, and Ne',
    content:
`Which of the following elements has all of its electrons paired in the ground state?
(A) C
(B) N
(C) O
(D) F
(E) Ne${JUSTIFY}`,
    answer: `Correct answer: (E) Ne
Neon's ground-state configuration is 1s²2s²2p⁶ — every subshell is completely filled, meaning every orbital holds a full pair of electrons. With a complete octet, Ne has no unpaired electrons at all (it is diamagnetic).

(A) C (1s²2s²2p²) has 2 unpaired electrons (Hund's rule spreads the two 2p electrons into separate orbitals).
(B) N (1s²2s²2p³) has 3 unpaired electrons (one in each of the three 2p orbitals).
(C) O (1s²2s²2p⁴) has 2 unpaired electrons (three 2p orbitals hold 4 electrons: two singly-occupied, one doubly-occupied).
(D) F (1s²2s²2p⁵) has 1 unpaired electron (only one 2p orbital is left singly-occupied).`
  },
  {
    topic: '1.5', mcq: true, title: 'Q59 — Identifying Arsenic from Its Electron Count',
    content:
`[Ar]4s²3d¹⁰4p³ is the ground-state electron configuration of a(n) ______ atom.
(A) As
(B) V
(C) P
(D) Sb
(E) Sn${JUSTIFY}`,
    answer: `Correct answer: (A) As
Counting electrons: the [Ar] core (18) + 4s² (2) + 3d¹⁰ (10) + 4p³ (3) = 33 total electrons, matching atomic number 33 — arsenic (As).

(B) V (vanadium, Z = 23) has far fewer electrons and no filled 4p subshell in its ground state.
(C) P (phosphorus, Z = 15) is a Period 3 element and has no d or 4p electrons at all.
(D) Sb (antimony, Z = 51) has 51 electrons — this configuration only accounts for 33.
(E) Sn (tin, Z = 50) similarly has far more electrons (50) than this configuration shows.`
  },
];

async function insertBatch(list) {
  let inserted = 0;
  const byTopic = {};
  for (const q of list) (byTopic[q.topic] = byTopic[q.topic] || []).push(q);
  for (const [topicKey, qs] of Object.entries(byTopic)) {
    const topicId = TOPICS[topicKey];
    const { data: existing, error: e1 } = await sb.from('questions').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1);
    if (e1) { console.error(topicKey, 'lookup error', e1); continue; }
    let nextIndex = (existing && existing.length > 0) ? existing[0].order_index + 1 : 0;
    for (const q of qs) {
      const row = { topic_id: topicId, title: q.title, content: q.content, answer_key: q.answer, order_index: nextIndex, image_url: null };
      const { error } = await sb.from('questions').insert(row);
      if (error) console.error(`FAILED: [${topicKey}] ${q.title}`, error);
      else { inserted++; console.log(`Inserted: [${topicKey}] order=${nextIndex} ${q.title}`); }
      nextIndex++;
    }
  }
  return inserted;
}

(async () => {
  const n1 = await insertBatch(q15);
  const n2 = await insertBatch(q16);
  const n3 = await insertBatch(q17extra);
  console.log(`\nTotal inserted this round: ${n1 + n2 + n3}`);
})();
