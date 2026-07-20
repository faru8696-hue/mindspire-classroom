const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

// Unit 1: Atomic Structure and Properties
const TOPICS = {
  '1.5': 'f9052a5f-1a96-4070-89a3-000d05c2bdc4', // Atomic Structure and Electron Configuration
  '1.7': '616020e0-79a3-47fe-baef-f3669e1b3193', // Periodic Trends
  '1.8': 'af121e66-0dae-4143-81ca-312b863a918c', // Valence Electrons and Ionic Compounds
};

/*
Source: "pFRQ Unit J" and "pMCQ Unit J" (teacher-authored "Unit J" = this teacher's internal name
for AP Chem Unit 1) practice sets. Every existing Unit 1 question (192 total across 8 topics) was
queried first and used as the duplicate-avoidance catalog. Per updated guidance, a question that
tests the same skill/concept as an existing one but with a genuinely different specific element,
compound, or numeric dataset is NOT a duplicate and was kept; only questions using the same
specific example as an existing DB question were rejected as duplicates.

REJECTED as true duplicates (same specific example already in DB):
- pMCQ Q15 (Na+ ground-state config) - same specific ion as existing 1.5 Q7/Q14 ion-config content.
- pMCQ Q16 (Na vs Cl electronegativity/IE/radius) - same specific pair as existing 1.5 Q27.
- pMCQ Q28 (O2- ground-state config) - same specific ion as existing 1.5 Q7.
- pMCQ Q59 (generic L-to-R period trend fill-in) - same generic trend statement as existing 1.7 Q8.
- pFRQ Q3(c)/Q9(b) (Be vs B first IE) - same specific pair as existing 1.7 Q38.
- pFRQ Q9(c) (O vs N first IE) - same specific pair as existing 1.5 Q25.
- pFRQ Q6(d)/Q7(d)/Q10(c) (Al vs Mg first IE anomaly, appears 3x in source) - same specific pair
  as existing content; only one instance would have qualified anyway, and it duplicates the
  well-covered Period 3 anomaly examples already present.
- pFRQ Q3(a) (Ca2+ vs Cl- isoelectronic radius) - already covered by existing 1.7 Q7 isoelectronic
  series (which includes both Ca2+ and Cl-).
- pFRQ Q10(b) (Cl vs Cl- radius, repeated a second time within source) - kept once (as new Q59
  below), not twice.

REJECTED as out of current AP Chem CED scope for Unit 1 (Unit 2/3 content mixed into this
teacher's old "Chapter 6/7" packet):
- pFRQ Q2(d)-(f) (XeO3/XeF4 Lewis structures, geometry, hybridization, polarity) - Unit 2 bonding.
- pFRQ Q3(b) (Kr vs He noble-gas compound formation, involving d-orbital bonding) - Unit 2 bonding.
- pFRQ Q4(d) (SeF4 Lewis structure/geometry/polarity) - Unit 2 bonding.
- pFRQ Q5, Q11 (Cl-Cl/F-F bond energy -> photon wavelength, H-atom n-level emission transitions,
  He+ vs H transition energy) - quantized electron transition/light-emission content belongs to
  Unit 3 (spectroscopy), not the current Unit 1 CED (PES binding energy is in scope; Bohr-model
  n-level transitions and photon-energy-of-bond-breaking are not what Unit 1 tests).
- pFRQ Q12(e) (AsCl3/AsF5 bonding, expanded octet) - Unit 2 bonding.
- pMCQ Q40-42 (E vs wavelength graph shape, orbital orientation/spin descriptive items) - light/
  quantum-number descriptive trivia, not calculation- or structure-based Unit 1 CED content, and
  too generic/ungrounded in a specific example to be worth adding.
- pMCQ Q38, Q39, Q61 - generic conceptual fill-ins/definitions with no distinguishing specific
  example (same generic statements as material already well covered).
- pMCQ Q3-6, Q7-10, Q44-49, Q58 (matching-type items referencing shared arrow-based orbital-diagram
  answer choices from the scanned worksheet) - not converted, since faithfully reconstructing the
  original hand-drawn orbital-diagram arrows as clean text/images risked introducing transcription
  errors; skipped per the "skip if not cleanly reproducible" instruction. (Q58's isoelectronic-set
  concept is instead covered fresh via new 1.5 Q43 below, built from verified electron counts.)
- pMCQ Q63-64 (PES spectrum of silicon, generic unlabeled axis with no real quantitative values
  given in the source scan) - not cleanly recoverable as a real data question without fabricating
  numbers.

All included answers below were independently re-derived/verified against real periodic data
(ionization energies, atomic/ionic radii, electron affinities) rather than trusting the source
answer key at face value.
*/

const q15 = [
  {
    topic: '1.5', mcq: true, title: 'Q33 — Identifying the Set of All-Diamagnetic Elements',
    content:
`Which of the following choices contains only atoms that are diamagnetic in their ground state (i.e., contain no unpaired electrons)?
(A) Kr, Ca, and P
(B) Cl, Mg, and Cd
(C) Ar, K, and Ba
(D) He, Sr, and C
(E) Ne, Be, and Zn${JUSTIFY}`,
    answer: `Correct answer: (E) Ne, Be, and Zn
A ground-state atom is diamagnetic only if every one of its electrons is paired.
Ne: 1s²2s²2p⁶ — all subshells completely filled, no unpaired electrons.
Be: 1s²2s² — both subshells completely filled, no unpaired electrons.
Zn: [Ar]3d¹⁰4s² — the d and s subshells are both completely filled (3d¹⁰, 4s²), no unpaired electrons.
All three are diamagnetic, so (E) is correct.

(A) is wrong — P is [Ne]3s²3p³, which has 3 unpaired p electrons (paramagnetic).
(B) is wrong — Cl is [Ne]3s²3p⁵, which has 1 unpaired p electron (paramagnetic).
(C) is wrong — K is [Ar]4s¹, which has 1 unpaired electron (paramagnetic).
(D) is wrong — C is [He]2s²2p², which has 2 unpaired p electrons (paramagnetic).`
  },
  {
    topic: '1.5', mcq: true, title: 'Q34 — Element with Ground-State Configuration [Ar]4s²3d⁷',
    content:
`The element with the ground-state electron configuration [Ar]4s²3d⁷ is
(A) Mg
(B) K
(C) Ar
(D) Co
(E) Ni${JUSTIFY}`,
    answer: `Correct answer: (D) Co
Counting electrons: Ar core (18) + 4s² (2) + 3d⁷ (7) = 27 total electrons, so the atomic number is 27, which is cobalt (Co).
Note: AP-style questions sometimes list the d and s subshells out of filling order like this ([Ar]4s²3d⁷ rather than [Ar]3d⁷4s²) — both represent the same ground-state configuration for Co; don't let the ordering fool you.

(A) Mg has only 12 electrons ([Ne]3s²), far too few.
(B) K has 19 electrons ([Ar]4s¹), too few.
(C) Ar has 18 electrons, the core itself, too few.
(E) Ni has 28 electrons ([Ar]4s²3d⁸), one more than Co.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q35 — Ground-State Electron Configuration of Antimony',
    content:
`The ground-state electron configuration for the element antimony, ₅₁Sb, is
(A) [Ar]4s²3d¹⁰4p³
(B) [Ar]4s²3d¹⁰4p⁵
(C) [Kr]5s²4d¹⁰5p³
(D) [Kr]5s²4d¹⁰5p⁵${JUSTIFY}`,
    answer: `Correct answer: (C) [Kr]5s²4d¹⁰5p³
Antimony has atomic number 51. Building up from the [Kr] core (36 electrons): 5s² (2) → 4d¹⁰ (10) → 5p³ (3) gives 36 + 2 + 10 + 3 = 51 electrons total, matching Sb.

(A) and (B) use the wrong noble-gas core ([Ar] has only 18 electrons, giving far too few total electrons for Sb).
(D) has 5p⁵ instead of 5p³, which would be 53 total electrons (iodine, not antimony).`
  },
  {
    topic: '1.5', mcq: true, title: 'Q36 — Identifying an Element from Its 3+ Ion Configuration',
    content:
`Identify the element whose 3+ ion has the ground-state electron configuration [Xe]4f¹⁴5d³.
(A) W
(B) Lu
(C) Ta
(D) Nb
(E) Y${JUSTIFY}`,
    answer: `Correct answer: (A) W (tungsten)
Neutral tungsten (Z = 74) has the ground-state configuration [Xe]4f¹⁴5d⁴6s². To form the 3+ ion, three electrons are removed. Electrons are always removed from the highest-n subshell first: both 6s electrons come off first, then one 5d electron, leaving [Xe]4f¹⁴5d³ — exactly matching the ion given.

(B), (C), (D), and (E) are all elements in different parts of the d-block (Lu, Ta, Nb, Y have different atomic numbers), so removing 3 electrons from any of their neutral ground states would not land on [Xe]4f¹⁴5d³.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q37 — Number of Electrons with Principal Quantum Number n = 3',
    content:
`How many electrons in an atom can have the principal quantum number n = 3?
(A) 3
(B) 6
(C) 8
(D) 10
(E) 18${JUSTIFY}`,
    answer: `Correct answer: (E) 18
For n = 3, three types of subshells are possible: s, p, and d. The s subshell (1 orbital) holds 2 electrons, the p subshell (3 orbitals) holds 6 electrons, and the d subshell (5 orbitals) holds 10 electrons. Total: 2 + 6 + 10 = 18 electrons.

(A), (B), (C), and (D) each account for only one or two of the three available subshell types at n = 3, undercounting the total.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q38 — Number of Filled p-Orbitals in a Krypton Atom',
    content:
`How many p-orbitals are completely filled in a ground-state krypton atom?
(A) 3
(B) 6
(C) 9
(D) 18
(E) 27${JUSTIFY}`,
    answer: `Correct answer: (C) 9
Krypton's ground-state configuration is [Ar]4s²3d¹⁰4p⁶, or fully written: 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p⁶. Kr has three complete sets of p-orbitals: 2p⁶, 3p⁶, and 4p⁶. Each "p⁶" set consists of 3 individual orbitals (pₓ, p_y, p_z), each holding 2 electrons. So the total number of individual filled p-orbitals is 3 sets x 3 orbitals/set = 9 filled p-orbitals.

(A) and (B) only count the orbitals or electrons within a single p subshell, not all three. (D) and (E) overcount by using electron counts or including non-p electrons.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q39 — Unpaired Electrons in the Iron Atom',
    content:
`How many unpaired electrons are in a ground-state iron atom?
(A) 0
(B) 2
(C) 3
(D) 4
(E) 8${JUSTIFY}`,
    answer: `Correct answer: (D) 4
Iron's ground-state configuration is [Ar]4s²3d⁶. The 4s² electrons are paired. The 6 d-electrons fill the five 3d orbitals following Hund's rule: each of the 5 orbitals gets one electron first (5 unpaired), then the 6th electron pairs up in one of them. That leaves 4 orbitals with a single, unpaired electron and 1 orbital with a paired pair — 4 unpaired electrons total.

(A) would require all electrons paired, which is not the case for a d⁶ configuration. (B), (C), and (E) don't match the actual distribution of 6 electrons across 5 d-orbitals via Hund's rule.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q40 — Unpaired Electrons in the Ni²⁺ Ion',
    content:
`How many unpaired electrons are in the Ni²⁺ ion?
(A) 0
(B) 2
(C) 3
(D) 4
(E) 6${JUSTIFY}`,
    answer: `Correct answer: (B) 2
Neutral nickel is [Ar]4s²3d⁸. Forming the 2+ ion removes the two 4s electrons first (not d electrons), giving Ni²⁺ = [Ar]3d⁸. Distributing 8 electrons among the five 3d orbitals via Hund's rule: each orbital gets one electron first (5 orbitals, 5 electrons), then the remaining 3 electrons pair up in three of those orbitals. That leaves 3 orbitals doubly occupied and 2 orbitals singly occupied — 2 unpaired electrons.

(A) would require d¹⁰ (full), which Ni²⁺ is not. (C), (D), and (E) don't match the correct distribution of 8 d-electrons.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q41 — Correct Equation for the Second Ionization of Phosphorus',
    content:
`Which of the following correctly represents the second ionization of phosphorus?
(A) P + e⁻ → P⁻
(B) P + P⁻ → e⁻
(C) P + P⁺ → e⁻
(D) P⁺ → P²⁺ + e⁻
(E) P⁺ + e⁻ → P${JUSTIFY}`,
    answer: `Correct answer: (D) P⁺ → P²⁺ + e⁻
A "second ionization" always means removing an electron from the singly-charged 1+ cation (the species that already lost its first electron), producing the 2+ cation and a free electron. That's exactly what (D) shows.

(A) is the electron-affinity process (adding an electron), not an ionization. (B) and (C) aren't balanced, sensible chemical processes — they mix a neutral atom with an ion on the same side incorrectly. (E) is the reverse of the first ionization (recombination), not a second ionization.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q42 — Correct Equation for the Electron Affinity of Sulfur',
    content:
`Which equation correctly represents the electron affinity of sulfur?
(A) S + e⁻ → S⁻ + EA
(B) S + EA → S⁺ + e⁻
(C) S → S⁻ + e⁻ + EA
(D) S⁻ + EA → S + e⁻
(E) S⁺ + e⁻ → S + EA${JUSTIFY}`,
    answer: `Correct answer: (A) S + e⁻ → S⁻ + EA
Electron affinity describes a neutral gaseous atom gaining an extra electron to form a 1- anion, with energy (EA) typically released in the process (electron affinity is usually exothermic for nonmetals like sulfur). (A) shows exactly this: a neutral S atom plus an electron produces S⁻, releasing energy EA.

(B) has S losing an electron while somehow requiring energy input and forming a cation, which is an ionization process, not electron affinity, and has the wrong charge. (C) shows S losing an electron and forming S⁻, which is contradictory (losing an electron should form a cation, not an anion). (D) reverses the correct direction (this would describe removing an electron from S⁻, i.e., an ionization of the anion). (E) involves S⁺, which has nothing to do with the neutral-atom electron affinity process.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q43 — Identifying an Isoelectronic Set',
    content:
`Which of the following sets contains species that are all isoelectronic (i.e., have the same total number of electrons)?
(A) Br, Kr, Rb
(B) O²⁻, S²⁻, Se²⁻
(C) Al³⁻, S²⁻, Ar
(D) Cl⁺, Ar, K⁻
(E) F⁻, Ne, Na⁺${JUSTIFY}`,
    answer: `Correct answer: (E) F⁻, Ne, Na⁺
Electron counts: F⁻ has 9 protons + 1 extra electron = 10 electrons. Ne has 10 protons = 10 electrons (neutral). Na⁺ has 11 protons − 1 electron = 10 electrons. All three species have exactly 10 electrons, so they are isoelectronic.

(A) is wrong — Br (35 e⁻), Kr (36 e⁻), and Rb (37 e⁻) are neutral atoms with three different, increasing electron counts, not equal.
(B) is wrong — O²⁻ (10 e⁻), S²⁻ (18 e⁻), and Se²⁻ (36 e⁻) all have different electron counts (they're isoelectronic with different noble gases, not with each other).
(C) is wrong — "Al³⁻" is not a chemically realistic species (aluminum does not form a 3− anion; it forms Al³⁺). Even setting that aside, the electron counts wouldn't match S²⁻ (18 e⁻) or Ar (18 e⁻) consistently as written.
(D) is wrong — Cl⁺ has 16 electrons, Ar has 18 electrons, and "K⁻" is not a realistic species (potassium does not form a 1− anion); the electron counts don't match anyway.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q44 — Identifying the Isotope/Ion with the Most Neutrons',
    content:
`Which of the following species contains the most neutrons?
(A) ⁵⁹₂₆Fe³⁺
(B) ⁵⁶₂₆Fe
(C) ⁶⁰₂₉Cu
(D) ⁶¹₃₀Zn
(E) ⁶⁰₃₀Zn²⁺${JUSTIFY}`,
    answer: `Correct answer: (A) ⁵⁹₂₆Fe³⁺
The number of neutrons in an isotope is (mass number) − (atomic number); the ionic charge has no effect on the neutron count, since it only changes the number of electrons.
(A) ⁵⁹₂₆Fe³⁺: 59 − 26 = 33 neutrons.
(B) ⁵⁶₂₆Fe: 56 − 26 = 30 neutrons.
(C) ⁶⁰₂₉Cu: 60 − 29 = 31 neutrons.
(D) ⁶¹₃₀Zn: 61 − 30 = 31 neutrons.
(E) ⁶⁰₃₀Zn²⁺: 60 − 30 = 30 neutrons.
33 neutrons in (A) is the largest of the five values.`
  },
  {
    topic: '1.5', mcq: true, title: 'Q45 — Protons, Neutrons, and Electrons in a ²³⁵U Atom',
    content:
`Which of the following correctly represents the numbers of protons, neutrons, and electrons in a neutral ²³⁵U atom?
                    Protons   Electrons   Neutrons
(A)                    46         46          143
(B)                    46         46           92
(C)                    92         92          143
(D)                    92         92          146
(E)                    92         92          235${JUSTIFY}`,
    answer: `Correct answer: (C) 92 protons, 92 electrons, 143 neutrons
Uranium's atomic number is 92, so a neutral U atom has 92 protons and 92 electrons. The mass number of this isotope is 235, so the number of neutrons is 235 − 92 = 143.

(A) and (B) use the wrong atomic number entirely (46 is palladium, not uranium). (D) has an incorrect neutron count (146 would require a mass number of 238, i.e., U-238, not U-235 as given). (E) mistakes the mass number itself for the neutron count.`
  },
  {
    topic: '1.5', title: 'Q46 — Selenium: Isotopes, Ground-State Configuration, and Unpaired Electrons',
    content:
`Answer the following questions about the element selenium, Se (atomic number 34).
(a) Natural samples of selenium contain six stable isotopes. In terms of atomic structure, explain what these isotopes have in common, and how they differ.
(b) Write the complete ground-state electron configuration for a selenium atom (e.g., 1s²2s²...). Indicate the number of unpaired electrons in the ground-state atom, and explain your reasoning.`,
    answer: `(a) All six isotopes of selenium have the same number of protons (34) — this is what makes them all "selenium." They differ in their number of neutrons (and therefore in mass number), since isotopes of the same element have different neutron counts. (The number of electrons in a neutral atom is not required for this comparison, since isotopes describes nuclear composition.)

(b) 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p⁴
There are 2 unpaired electrons. The 4p⁴ subshell has 3 orbitals and 4 electrons: following Hund's rule, one electron enters each of the 3 orbitals first (3 unpaired), and the 4th electron pairs up with one of them. This leaves 2 orbitals with a single unpaired electron and 1 orbital with a paired pair, for 2 unpaired electrons total.`
  },
  {
    topic: '1.5', title: 'Q47 — Arsenic: Ground-State Configuration, Isoelectronic Ion, and Magnetism',
    content:
`Answer the following questions concerning arsenic (As, atomic number 33).
(a) Write the ground-state electron configuration for an arsenic atom.
(b) Arsenic commonly forms a 3− ion. What neutral atom is isoelectronic with the As³⁻ ion?
(c) Is an isolated arsenic atom in the ground state paramagnetic or diamagnetic? Justify your answer.
(d) Describe the magnetism of the As³⁻ ion, and explain why it is different from that of the neutral arsenic atom.`,
    answer: `(a) 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰4p³

(b) As³⁻ has 33 + 3 = 36 electrons. A neutral atom of krypton (Kr, atomic number 36) also has 36 electrons, so krypton is isoelectronic with the As³⁻ ion.

(c) The arsenic atom is paramagnetic. Its valence configuration is 4p³, meaning each of the three 4p orbitals holds one unpaired electron (by Hund's rule), giving three unpaired electrons and a net magnetic moment.

(d) The As³⁻ ion is diamagnetic. Gaining three extra electrons fills the 4p subshell completely (4p⁶), so all electrons — including what were the three unpaired electrons in the neutral atom — become paired. With no unpaired electrons remaining, the ion has no net magnetic moment and is not attracted into a magnetic field, unlike the paramagnetic neutral atom.`
  },
];

const q17 = [
  {
    topic: '1.7', mcq: true, title: 'Q41 — Ranking Five Elements by Decreasing First Ionization Energy',
    content:
`Which of the following correctly lists atoms in order of progressively decreasing first ionization energy?
(A) F > O > C > Li > Na
(B) Na > Li > C > O > F
(C) F > O > C > Na > Li
(D) C > O > F > Li > Na
(E) O > F > C > Na > Li${JUSTIFY}`,
    answer: `Correct answer: (A) F > O > C > Li > Na
Real first ionization energies (kJ/mol, approximate): F = 1681, O = 1314, C = 1086, Li = 520, Na = 496. Ranking from highest to lowest: F > O > C > Li > Na, which matches (A). This reflects two combined trends: across Period 2 (F > O > C), ionization energy increases with increasing effective nuclear charge; and down Group 1 (Li > Na), ionization energy decreases because the valence electron is farther from the nucleus in Na.

(B) is the reverse order (increasing, not decreasing). (C), (D), and (E) each swap at least one element out of its correct relative position.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q42 — Identifying the Element That Is Liquid at Room Temperature',
    content:
`Which of the following elements is a liquid at room temperature (298 K)?
(A) Hg
(B) Si
(C) Cu
(D) Zn
(E) Ag${JUSTIFY}`,
    answer: `Correct answer: (A) Hg
Mercury is one of only two elements that are liquid at standard room temperature (the other being bromine, a nonmetal, which isn't among these choices). Mercury's unusually weak metallic bonding — a consequence of its electron configuration and relativistic effects on its 6s electrons — gives it an unusually low melting point (about −39°C) compared to other metals.

(B), (C), (D), and (E) — silicon, copper, zinc, and silver — are all solids at room temperature, with melting points well above 298 K.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q43 — True Statement About the Alkali Metals',
    content:
`Which of the following is true of the alkali metal elements (Group 1)?
(A) They usually take the 2+ oxidation state.
(B) They have oxides that act as acid anhydrides.
(C) They form covalent bonds with oxygen.
(D) They are generally found in nature in compounds, not as pure elements.
(E) They have relatively large first ionization energies.${JUSTIFY}`,
    answer: `Correct answer: (D) They are generally found in nature in compounds, not as pure elements.
Alkali metals have very low first ionization energies and are extremely reactive, readily losing their single valence electron. Because of this high reactivity, they are never found in nature as free (uncombined) elements — they occur only in compounds (e.g., NaCl, KCl).

(A) is wrong — alkali metals form 1+ ions (losing their one valence electron), not 2+.
(B) is wrong — alkali metal oxides (e.g., Na₂O) are strongly basic anhydrides, not acidic ones.
(C) is wrong — alkali metals form ionic bonds with oxygen (transferring their valence electron), not covalent bonds.
(E) is wrong — alkali metals have the lowest first ionization energies of any group, not large ones; this low IE is exactly why they're so reactive.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q44 — Smallest Ion in an Isoelectronic Series',
    content:
`Which of the following ions has the smallest ionic radius?
(A) O²⁻
(B) F⁻
(C) Na⁺
(D) Mg²⁺
(E) Al³⁺${JUSTIFY}`,
    answer: `Correct answer: (E) Al³⁺
O²⁻, F⁻, Na⁺, Mg²⁺, and Al³⁺ are all isoelectronic (each has 10 electrons, matching neon's electron configuration). For an isoelectronic series, the ion with the most protons pulls the same-sized electron cloud in the most tightly, giving the smallest radius. Al³⁺ has the most protons (13) of this group, so it has the smallest ionic radius.

(A) O²⁻ has only 8 protons, the fewest of the group, giving it the weakest pull on the electron cloud and the largest radius of the series.
(B), (C), and (D) have progressively more protons than O²⁻ (9, 11, and 12 respectively) but fewer than Al³⁺, so their radii fall in between.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q45 — Identifying an Element from Ionization Energies Given in eV',
    content:
`The first five ionization energies (in eV) for an unknown element are listed below, in order.
8 eV, 15 eV, 80 eV, 109 eV, 141 eV
These ionization energies would represent which of the following elements?
(A) Sodium
(B) Magnesium
(C) Aluminum
(D) Silicon
(E) Phosphorus${JUSTIFY}`,
    answer: `Correct answer: (B) Magnesium
The key clue is the location of the large jump in ionization energy: it occurs between the 2nd (15 eV) and 3rd (80 eV) ionization, a jump of more than 5x. A large jump like this occurs when the next electron removed must come from a full inner shell (core electrons) rather than the valence shell. Since the jump happens after removing 2 electrons, this element must have exactly 2 valence electrons — consistent with magnesium (Group 2).

(A) Sodium has only 1 valence electron, so the big jump would occur between the 1st and 2nd ionization energies, not the 2nd and 3rd.
(C), (D), and (E) — aluminum, silicon, and phosphorus — have 3, 4, and 5 valence electrons respectively, so their big jumps would occur later (between the 3rd/4th, 4th/5th, and 5th/6th ionizations respectively), not between the 2nd and 3rd.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q46 — Identifying the Correct Set of Successive Ionization Energies for Silicon',
    content:
`A researcher listed the first five ionization energies (in kJ/mol) for a silicon atom, in order from first to fifth. Which of the following lists correctly corresponds to the ionization energies for silicon?
(A) 780, 13,675, 14,110, 15,650, 16,100
(B) 780, 1,575, 14,110, 15,650, 16,100
(C) 780, 1,575, 3,220, 15,650, 16,100
(D) 780, 1,575, 3,220, 4,350, 16,100
(E) 780, 1,575, 3,220, 4,350, 5,340${JUSTIFY}`,
    answer: `Correct answer: (D) 780, 1,575, 3,220, 4,350, 16,100
Silicon has 4 valence electrons (3s²3p²), so the first four ionization energies should increase steadily (each removing a valence electron), with a very large jump appearing at the 5th ionization (which must remove a core electron from the full n = 2 shell). Option (D) matches this pattern: a gradual, steady increase for the first four values (780 → 1,575 → 3,220 → 4,350), followed by a large jump to 16,100 for the fifth.

(A) and (B) place the large jump much too early (between the 1st and 2nd ionization), which would only make sense for an element with just 1 valence electron. (C) places the jump between the 3rd and 4th, appropriate for an element with 3 valence electrons, not 4. (E) shows no large jump at all within the given five values, which is inconsistent with silicon having only 4 valence electrons.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q47 — Comparing Electron Affinity of Phosphorus and Silicon',
    content:
`Phosphorus has an electron affinity of −72 kJ/mol, which is less negative (less exothermic) than silicon's electron affinity of −134 kJ/mol. This is best explained by the fact that an electron added to a phosphorus atom is added to
(A) a filled orbital.
(B) a new subshell.
(C) an empty orbital.
(D) a half-filled orbital.
(E) a new valence shell.${JUSTIFY}`,
    answer: `Correct answer: (D) a half-filled orbital.
Phosphorus's valence configuration is 3p³, with one electron in each of the three 3p orbitals (a half-filled subshell, per Hund's rule). Adding an extra electron forces it to pair up with one of these existing electrons, and the added electron-electron repulsion in that now-doubly-occupied orbital makes the process less energetically favorable (less exothermic) than it would otherwise be.
Silicon's valence configuration is 3p², with only two of the three 3p orbitals occupied. The added electron can go into the remaining empty 3p orbital, avoiding the extra repulsion — making silicon's electron affinity more favorable (more exothermic) than phosphorus's.

(A), (B), (C), and (E) don't correctly describe phosphorus's actual electron configuration or the reason for the repulsion effect.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q48 — Largest Covalent Radius Among Ar, As, P, Se, and S',
    content:
`Which atom has the largest covalent radius?
(A) Argon
(B) Arsenic
(C) Phosphorus
(D) Selenium
(E) Sulfur${JUSTIFY}`,
    answer: `Correct answer: (B) Arsenic
Arsenic and selenium both have valence electrons in the 4th energy level (n = 4), while phosphorus, sulfur, and (for bonding purposes) argon have valence electrons in the 3rd energy level (n = 3) — so As and Se atoms are inherently larger due to having one more occupied shell. Between As and Se, arsenic sits farther to the left on the periodic table, giving it a lower effective nuclear charge on its valence electrons than selenium, so arsenic's electron cloud is held less tightly and its radius is larger.

(A) Argon, as a noble gas, doesn't form covalent bonds in the ordinary sense, and even by other radius measures it is not the largest here since it's in period 3, not 4.
(C) and (E), phosphorus and sulfur, are both period-3 elements with valence electrons closer to the nucleus (n = 3), giving them smaller radii than the period-4 elements As and Se.
(D) Selenium has more protons than arsenic within the same period, giving it a higher effective nuclear charge and thus a smaller radius than arsenic.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q49 — What Period Number and Group Number Represent',
    content:
`Position on the periodic table gives information about an element's electron configuration. Which of the following correctly describes what the period number and the (old-style, main-group) group number each represent?
                Period number is the:                          Group number is the:
(A)             number of p orbitals                            number of elements in the group
(B)             number of occupied energy levels in the atom    number of valence electrons
(C)             total number of electrons in the outer shell    total number of electrons in the atom
(D)             number of subshells in the last energy level    number of metal atoms in the group
(E)             number of electrons in the outer subshell (s, p, d, or f)   charge on the most stable ion${JUSTIFY}`,
    answer: `Correct answer: (B) Period number is the number of occupied energy levels in the atom; group number is the number of valence electrons.
The period number directly corresponds to the highest principal quantum number (n) with occupied electrons — i.e., how many energy levels (shells) the atom's electrons occupy. For main-group elements, the (old-style, 1–8) group number directly corresponds to the number of valence electrons (e.g., Group 2 elements have 2 valence electrons, Group 7 elements have 7).

(A), (C), (D), and (E) each describe something that isn't the actual definition of period number or group number — they mix up unrelated atomic-structure quantities with these periodic-table position labels.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q50 — Ranking Ionic Radius in an Isoelectronic Series (Se²⁻, Kr, Rb⁺)',
    content:
`List the following species in order from smaller to larger size (radii): Se²⁻, Kr, and Rb⁺.
(A) Se²⁻ < Kr < Rb⁺
(B) Kr < Se²⁻ < Rb⁺
(C) Rb⁺ < Kr < Se²⁻
(D) Rb⁺ < Se²⁻ < Kr
(E) They are all the same size.${JUSTIFY}`,
    answer: `Correct answer: (C) Rb⁺ < Kr < Se²⁻
Se²⁻ (34 protons + 2 extra electrons), Kr (36 protons, neutral), and Rb⁺ (37 protons − 1 electron) are all isoelectronic, each having exactly 36 electrons. Since the electron count is identical, the species with the most protons pulls that same-sized electron cloud in the tightest, giving the smallest radius: Rb⁺ (37 protons) is smallest, Kr (36 protons) is in the middle, and Se²⁻ (34 protons, the fewest) has the weakest pull and is largest.

(A), (B), (D), and (E) all misorder or incorrectly equate the three species' sizes.`
  },
  {
    topic: '1.7', mcq: true, title: 'Q51 — Identifying the Element with an Unusually Large 4th Ionization Energy Jump (Gallium)',
    content:
`For which of the following elements would you expect an extraordinarily large increase in ionization energy when removing the 4th electron (i.e., going from the 3rd to the 4th successive ionization)?
(A) Ca
(B) K
(C) Ga
(D) Ge
(E) Se${JUSTIFY}`,
    answer: `Correct answer: (C) Ga
Gallium's ground-state configuration is [Ar]3d¹⁰4s²4p¹, giving it exactly 3 valence electrons (4s²4p¹). Removing the first 3 electrons empties the valence shell; removing a 4th electron requires reaching into the full, lower-energy 3d/3p core, which is held far more tightly by a much higher effective nuclear charge — producing a disproportionately large jump specifically at the 4th ionization.

(A) Ca has 2 valence electrons, so its large jump occurs at the 3rd ionization, not the 4th.
(B) K has 1 valence electron, so its large jump occurs at the 2nd ionization.
(D) Ge has 4 valence electrons, so its large jump would occur at the 5th ionization.
(E) Se has 6 valence electrons, so its large jump would occur at the 7th ionization.`
  },
  {
    topic: '1.7', title: 'Q52 — Comparing First Ionization Energy of Fluorine, Oxygen, and Xenon',
    content:
`Answer the following questions about atomic fluorine, oxygen, and xenon.
(a) Write the equation for the ionization of atomic fluorine, given that it requires 1,681.0 kJ/mol.
(b) Account for the fact that the first ionization energy of atomic fluorine (1,681.0 kJ/mol) is greater than that of atomic oxygen (1,313.9 kJ/mol). Your answer must include specific information about both atoms.
(c) Predict whether the first ionization energy of atomic xenon is greater than, less than, or equal to the first ionization energy of atomic fluorine. Justify your prediction.`,
    answer: `(a) F(g) → F⁺(g) + e⁻

(b) In both fluorine and oxygen, the electron removed comes from the same energy level (n = 2, specifically the 2p subshell). However, fluorine has one more proton than oxygen (9 vs. 8), giving it a greater effective nuclear charge on its valence electrons. This stronger nuclear attraction holds fluorine's valence electrons more tightly, requiring more energy to remove one — so fluorine's first ionization energy is greater than oxygen's.

(c) The first ionization energy of xenon is expected to be less than that of fluorine. Xenon's valence electrons occupy the 5th energy level (n = 5), which is much farther from the nucleus than fluorine's 2nd energy level (n = 2) valence electrons, and xenon's valence electrons are shielded by many more inner core electrons. Even though xenon has far more protons than fluorine, the much greater distance and much greater shielding dominate, so the net attractive force on xenon's outermost electron is weaker than on fluorine's — making xenon's first ionization energy lower than fluorine's, despite xenon having more protons overall.`
  },
  {
    topic: '1.7', title: 'Q53 — Explaining Why Potassium Has a Lower First Ionization Energy Than Lithium',
    content:
`Potassium has a lower first ionization energy than lithium. Use principles of atomic structure and Coulomb's law to explain this observation. Your answer must include specific information about both elements.`,
    answer: `Removing the valence electron from potassium is easier than removing the valence electron from lithium because potassium's valence electron occupies a much higher energy level (n = 4) than lithium's valence electron (n = 2), placing it much farther from the nucleus. Coulomb's law (F = kq₁q₂/d²) tells us that as the distance (d) between two charges increases, the attractive force between them decreases. Since potassium's valence electron is farther from its nucleus than lithium's valence electron is from its own nucleus, the attractive force holding it in place is weaker, and less energy is required to remove it — giving potassium a lower first ionization energy than lithium.`
  },
  {
    topic: '1.7', title: 'Q54 — Ionic Radius: N³⁻ vs. O²⁻',
    content:
`The ionic radius of N³⁻ is larger than that of O²⁻. Explain this observation in terms of atomic structure. Your answer must include specific information about both ions.`,
    answer: `The nitride ion (N³⁻) and the oxide ion (O²⁻) are isoelectronic — both have exactly 10 electrons (matching neon's configuration). However, N³⁻ has only 7 protons while O²⁻ has 8 protons. With one fewer proton, N³⁻ has a lower effective nuclear charge pulling on its 10 electrons than O²⁻ does. This weaker attraction means the electron cloud in N³⁻ is not drawn in as tightly, resulting in a larger ionic radius for N³⁻ compared to O²⁻.`
  },
  {
    topic: '1.7', title: 'Q55 — Atomic Radius: Ca vs. Zn',
    content:
`A calcium atom is larger than a zinc atom. Explain this observation in terms of atomic structure. Your answer must include specific information about both atoms.`,
    answer: `The valence electrons of both the calcium atom and the zinc atom are in the same energy level (n = 4, the 4s subshell). However, zinc has considerably more protons than calcium (30 vs. 20), giving zinc's nucleus a much greater positive charge. Even though the 10 extra electrons in zinc mostly fill the inner 3d subshell (which provides some shielding), the 4s electrons still experience some of that added nuclear attraction ("penetration" effect), and overall zinc's greater effective nuclear charge pulls its valence electrons in more tightly than calcium's. This stronger attraction in zinc results in a smaller atomic radius than calcium.`
  },
  {
    topic: '1.7', title: 'Q56 — Ionic Radius: Ca vs. Ca²⁺',
    content:
`The radius of a Ca atom (0.197 nm) is much larger than the radius of the Ca²⁺ ion (0.099 nm). Account for this difference in terms of atomic structure.`,
    answer: `The Ca atom and the Ca²⁺ ion have the same number of protons (20), but the Ca²⁺ ion has two fewer electrons — specifically, it has lost both of its 4s valence electrons entirely. This means the outermost occupied energy level in the neutral Ca atom is n = 4 (the 4s electrons), while the outermost occupied energy level in Ca²⁺ is n = 3 (matching argon's configuration) — one full energy level closer to the nucleus. Because Ca²⁺'s remaining electrons occupy a shell that is intrinsically closer to the nucleus (and are no longer shielded by the departed 4s electrons), Ca²⁺ has a substantially smaller radius than the neutral Ca atom.`
  },
  {
    topic: '1.7', title: 'Q57 — Second Ionization Energy: Na vs. Mg',
    content:
`The second ionization energy of sodium (about 4,560 kJ/mol) is roughly three times greater than the second ionization energy of magnesium (about 1,450 kJ/mol). Account for this difference in terms of the number, properties, and arrangement of subatomic particles.`,
    answer: `Sodium's ground-state configuration is 1s²2s²2p⁶3s¹, while magnesium's is 1s²2s²2p⁶3s².
After sodium loses its single valence electron (3s¹) to form Na⁺, its next available electron must be removed from the full n = 2 shell (a core electron), which is shielded only by the n = 1 electrons and experiences a much higher effective nuclear charge, and is also much closer to the nucleus. This makes sodium's second ionization extremely difficult.
After magnesium loses one of its two valence electrons (3s²) to form Mg⁺, it still has one valence electron remaining in the n = 3 shell, shielded by both the n = 1 and n = 2 core electrons and experiencing a much lower effective nuclear charge. Removing this second, still-valence electron from Mg⁺ is comparatively easy.
Because sodium's second ionization removes a core electron while magnesium's second ionization removes a second valence electron, sodium's second ionization energy is dramatically higher than magnesium's.`
  },
  {
    topic: '1.7', title: 'Q58 — Atomic Radius: S vs. Na',
    content:
`The atomic radius of a sulfur atom is smaller than the atomic radius of a sodium atom. Explain this observation in terms of atomic structure. Your answer must include specific information about both atoms.`,
    answer: `Sodium and sulfur are both in Period 3, so their valence electrons occupy the same energy level (n = 3). However, sulfur has considerably more protons than sodium (16 vs. 11), giving sulfur's valence electrons a much greater effective nuclear charge (roughly +6 for sulfur vs. roughly +1 for sodium). This stronger nuclear attraction (per Coulomb's law) pulls sulfur's valence electrons in much closer to the nucleus than sodium's, resulting in a smaller atomic radius for sulfur despite both atoms having electrons in the same energy level.`
  },
  {
    topic: '1.7', title: 'Q59 — Ionic vs. Atomic Radius: Cl⁻ vs. Cl',
    content:
`The radius of the chlorine atom (99 pm) is smaller than the radius of the chloride ion, Cl⁻ (181 pm). Explain this observation using details of modern atomic theory.`,
    answer: `The chloride ion (Cl⁻) has the same number of protons as the neutral chlorine atom (17), but has one additional electron (18 electrons vs. 17). This extra electron increases electron-electron repulsion within the electron cloud, causing the cloud to expand outward. In addition, the ratio of protons to electrons is lower in Cl⁻ than in Cl, meaning each electron in Cl⁻ experiences a slightly weaker average pull from the nucleus. Both effects cause the chloride ion's electron cloud to be held less tightly and to occupy more space than the neutral chlorine atom's electron cloud, making Cl⁻ larger than Cl.`
  },
  {
    topic: '1.7', title: 'Q60 — Comparing First Ionization Energy of Na, Li, and Ar',
    content:
`Predict how the first ionization energy of Na compares to those of Li and Ar. Justify your prediction using Coulomb's law.`,
    answer: `Sodium is expected to have a lower first ionization energy than both lithium and argon.
Comparing Na to Li: Na's valence electron is in the 3rd energy level, while Li's valence electron is in the 2nd energy level. Na's valence electron is therefore farther from the nucleus. By Coulomb's law, greater distance between charges means a weaker attractive force, so Na's valence electron is easier to remove than Li's — giving Na a lower first ionization energy than Li.
Comparing Na to Ar: Na's and Ar's valence electrons are both in the 3rd energy level (same distance from the nucleus, roughly), but Ar has far more protons than Na, giving Ar a much greater effective nuclear charge (~+8 for Ar vs. ~+1 for Na). By Coulomb's law, this much stronger nuclear charge in Ar results in a much stronger attractive force on its valence electrons, making them harder to remove — so Ar's first ionization energy is far greater than Na's.
Overall: Na's first ionization energy is lower than both Li's and Ar's.`
  },
  {
    topic: '1.7', title: 'Q61 — Explaining the Ionization Energy Jump Between the 2nd and 3rd Ionizations of Magnesium',
    content:
`For magnesium, the difference between the second and third ionization energies (1,451 kJ/mol to 7,733 kJ/mol) is much larger than the difference between the first and second ionization energies (738 kJ/mol to 1,451 kJ/mol). Explain this observation in terms of atomic structure.`,
    answer: `Magnesium's ground-state configuration is 1s²2s²2p⁶3s². Removing the first two electrons takes both electrons from the 3s valence subshell (n = 3), which are relatively far from the nucleus and experience a relatively low effective nuclear charge (shielded by the full n = 1 and n = 2 core). Once both valence electrons are gone, the 3rd electron removed must come from the full n = 2 shell — a core electron that is much closer to the nucleus and shielded only by the n = 1 electrons, giving it a much higher effective nuclear charge (roughly +10, compared to roughly +2 felt by the first two valence electrons). Because the 3rd electron removed is both closer to the nucleus and experiences a far greater effective nuclear charge than the first two, removing it requires dramatically more energy — producing the disproportionately large jump between the 2nd and 3rd ionization energies.`
  },
];

const q18 = [
  {
    topic: '1.8', mcq: true, title: 'Q10 — Formula of the Ionic Compound Formed Between Calcium and Element X',
    content:
`Calcium reacts with element X to form an ionic compound. If the ground-state electron configuration of element X is 1s²2s²2p⁴, what is the simplest formula for this compound?
(A) CaX
(B) CaX₂
(C) Ca₄X₂
(D) Ca₂X₂
(E) Ca₂X₃${JUSTIFY}`,
    answer: `Correct answer: (A) CaX
The configuration 1s²2s²2p⁴ has 8 electrons, identifying element X as oxygen. Calcium (Group 2) forms a 2+ ion (Ca²⁺) by losing its 2 valence electrons, and oxygen (Group 16) forms a 2− ion (O²⁻) by gaining 2 electrons to complete its octet. Since the charges are equal in magnitude (2+ and 2−), they combine in a 1:1 ratio, giving the simplest formula CaO (i.e., CaX).

(B), (C), (D), and (E) all propose ratios other than 1:1, which would not balance the 2+ and 2− charges of Ca²⁺ and O²⁻.`
  },
  {
    topic: '1.8', mcq: true, title: 'Q11 — Which Configuration Represents an Element Forming a Stable 2− Ion',
    content:
`Use the choices below (each a ground-state electron configuration) to answer this question.
(A) [Kr]5s¹
(B) [Ne]3s²3p¹
(C) [Ar]4s²3d¹⁰4p⁴
(D) [Ne]3s²3p⁶
(E) [Ar]4s¹

Which configuration represents the atom expected to form a stable 2− ion?${JUSTIFY}`,
    answer: `Correct answer: (C) [Ar]4s²3d¹⁰4p⁴
This configuration has 6 valence electrons (4s²4p⁴, i.e., a Group 16 element — selenium). An atom with 6 valence electrons needs to gain 2 more electrons to complete its octet (reaching 4s²3d¹⁰4p⁶), forming a stable 2− ion.

(A) and (E), [Kr]5s¹ and [Ar]4s¹, are Group 1 elements (1 valence electron) — these lose an electron to form 1+ ions, not gain electrons to form anions.
(B), [Ne]3s²3p¹, is a Group 13 element (3 valence electrons) — these typically form 3+ cations, not anions.
(D), [Ne]3s²3p⁶, is already a complete octet (a noble gas configuration) and has no tendency to gain or lose electrons to form an ion at all.`
  },
  {
    topic: '1.8', title: 'Q12 — Magnetic Behavior of NiCl₂ vs. ZnCl₂',
    content:
`A sample of nickel(II) chloride, NiCl2, is attracted into a magnetic field, whereas a sample of solid zinc chloride, ZnCl2, is not. Account for this difference in terms of atomic structure, including the number and arrangement of subatomic particles.`,
    answer: `In NiCl₂, the nickel is present as Ni²⁺. Neutral nickel is [Ar]4s²3d⁸; forming Ni²⁺ removes the two 4s electrons, giving [Ar]3d⁸. Distributing 8 electrons among the five 3d orbitals (Hund's rule: one electron per orbital first) leaves 2 orbitals with unpaired electrons — so Ni²⁺ is paramagnetic (has unpaired electrons), which is why NiCl₂ is attracted into a magnetic field.
In ZnCl₂, the zinc is present as Zn²⁺. Neutral zinc is [Ar]4s²3d¹⁰; forming Zn²⁺ removes the two 4s electrons, giving [Ar]3d¹⁰ — a completely filled d subshell with all electrons paired. With no unpaired electrons, Zn²⁺ is diamagnetic, so ZnCl₂ shows no attraction to a magnetic field.`
  },
];

async function insertBatch(list) {
  let inserted = 0;
  // group by topic so order_index continues correctly per topic
  const byTopic = {};
  for (const q of list) {
    (byTopic[q.topic] = byTopic[q.topic] || []).push(q);
  }
  for (const [topicKey, qs] of Object.entries(byTopic)) {
    const topicId = TOPICS[topicKey];
    const { data: existing, error: e1 } = await sb.from('questions').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1);
    if (e1) { console.error(topicKey, 'lookup error', e1); continue; }
    let nextIndex = (existing && existing.length > 0) ? existing[0].order_index + 1 : 0;
    for (const q of qs) {
      const row = {
        topic_id: topicId,
        title: q.title,
        content: q.content,
        answer_key: q.answer,
        order_index: nextIndex,
        image_url: null,
      };
      const { error } = await sb.from('questions').insert(row);
      if (error) {
        console.error(`FAILED: [${topicKey}] ${q.title}`, error);
      } else {
        inserted++;
        console.log(`Inserted: [${topicKey}] order=${nextIndex} ${q.title}`);
      }
      nextIndex++;
    }
  }
  return inserted;
}

(async () => {
  const n1 = await insertBatch(q15);
  const n2 = await insertBatch(q17);
  const n3 = await insertBatch(q18);
  console.log(`\nTotal inserted: 1.5=${n1}/15, 1.7=${n2}/21, 1.8=${n3}/2`);
})();
