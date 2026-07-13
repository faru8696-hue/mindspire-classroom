// Unit 5: Electron Configuration — brings all four subtopics to >= 15 questions each.
// 5.1 Writing Electron Configurations: 13 -> 15 (+2)
// 5.2 Identifying Elements and Spotting Errors: 9 -> 15 (+6)
// Quantum Numbers and Orbital Diagrams: 0 -> 15 (+15)
// Photoelectron Spectroscopy (PES): 0 -> 15 (+15)
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

const TOPIC_51 = 'a2cdbb9f-f2cf-4970-b596-784597239e05' // Writing Electron Configurations
const TOPIC_52 = '9434b967-7589-43aa-84a1-5126cde184b2' // Identifying Elements and Spotting Errors
const TOPIC_QN = '53cc6bb7-37d5-4821-b565-bed491b1fc93' // Quantum Numbers and Orbital Diagrams
const TOPIC_PES = 'c631ba4f-59a9-4b40-9b6d-95f41bbd9f02' // Photoelectron Spectroscopy (PES)

const topic51Questions = [
  {
    title: 'Q14 — Unabbreviated Configuration of Calcium',
    content: 'Write the unabbreviated (full) electron configuration of calcium.',
    answer_key: `Step 1: Identify the atomic number of calcium. Calcium (Ca) is in Group 2, Period 4, with an atomic number of 20. A neutral calcium atom has 20 electrons.

Step 2: Use the Aufbau principle to determine the filling order: 1s, 2s, 2p, 3s, 3p, 4s.

Step 3: Distribute the 20 electrons:
1s2 (2 used, 18 remaining)
2s2 (4 used, 16 remaining)
2p6 (10 used, 10 remaining)
3s2 (12 used, 8 remaining)
3p6 (18 used, 2 remaining)
4s2 (20 used, 0 remaining)

Step 4: Verify: 2 + 2 + 6 + 2 + 6 + 2 = 20 electrons.

Final Answer:
1s2 2s2 2p6 3s2 3p6 4s2`,
  },
  {
    title: 'Q15 — Abbreviated Configuration of Tin',
    content: 'Write the abbreviated (noble gas core) electron configuration of tin.',
    answer_key: `Step 1: Identify the atomic number of tin. Tin (Sn) is in Group 14, Period 5, with an atomic number of 50. A neutral tin atom has 50 electrons.

Step 2: Identify the noble gas preceding tin. This is krypton (Kr), atomic number 36. Write the core as [Kr].

Step 3: Calculate the remaining electrons: 50 - 36 = 14 electrons.

Step 4: Distribute the 14 remaining electrons following Kr:
5s2 (2 used, 12 remaining)
4d10 (12 used, 2 remaining)
5p2 (14 used, 0 remaining)

Final Answer:
[Kr] 5s2 4d10 5p2 (or [Kr] 4d10 5s2 5p2)`,
  },
]

const topic52Questions = [
  {
    title: 'Q10 — Identify the Element ([Ar] 4s2 3d10 4p3)',
    content: 'Which element has the electron configuration [Ar] 4s² 3d¹⁰ 4p³?',
    answer_key: `Step 1: Identify the electrons in the noble gas core. Argon (Ar) represents 18 electrons.

Step 2: Sum the electrons outside the core.
4s2 + 3d10 + 4p3 = 2 + 10 + 3 = 15 electrons.

Step 3: Calculate the total electrons.
Total = 18 + 15 = 33 electrons.

Step 4: Match the atomic number (Z = 33) to the periodic table. Element 33 is arsenic, consistent with the configuration ending in 4p3 (Period 4, Group 15).

Final Answer:
Arsenic (As)`,
  },
  {
    title: 'Q11 — Identify the Element (1s2 2s2 2p6 3s2 3p6 4s1)',
    content: 'Which element has the electron configuration 1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹?',
    answer_key: `Step 1: Sum the superscripts to find the total number of electrons.
Total = 2 + 2 + 6 + 2 + 6 + 1 = 19 electrons.

Step 2: For a neutral atom, the number of electrons equals the atomic number. Z = 19.

Step 3: Locate element 19 on the periodic table. This is potassium, consistent with the configuration ending in 4s1 (Period 4, Group 1, alkali metal).

Final Answer:
Potassium (K)`,
  },
  {
    title: 'Q12 — Find the Error ([Ne] 3s2 3p7)',
    content: 'The electron configuration [Ne] 3s² 3p⁷ is NOT valid. Determine what is wrong with it.',
    answer_key: `Step 1: Recall the maximum electron capacity of a p subshell.
A p subshell has 3 orbitals, each holding a maximum of 2 electrons, for a total capacity of 6 electrons. Therefore "3p7" is not physically possible — it exceeds the maximum capacity of the 3p subshell.

Step 2: Determine what the student likely intended.
If the total intended electron count is 10 (Ne core) + 2 (3s) + 7 = 19 electrons, this corresponds to potassium (Z = 19). Once the 3p subshell is filled to its maximum of 6 electrons, the 19th electron must go into the next available subshell, which is 4s (not a 7th electron crammed into 3p).

Step 3: Write the correct configuration.
[Ne] 3s2 3p6 4s1

Final Answer:
The error is that the 3p subshell was given 7 electrons, exceeding its maximum capacity of 6. The correct configuration for 19 electrons is [Ne] 3s2 3p6 4s1 (or equivalently [Ar] 4s1), which represents potassium.`,
  },
  {
    title: 'Q13 — Find the Error ([Kr] 4d12)',
    content: 'The electron configuration [Kr] 4d¹² is NOT valid. Determine what is wrong with it.',
    answer_key: `Step 1: Recall the maximum electron capacity of a d subshell.
A d subshell has 5 orbitals, each holding a maximum of 2 electrons, for a total capacity of 10 electrons. Therefore "4d12" is not possible — it exceeds the maximum capacity of the 4d subshell.

Step 2: Determine what the student likely intended.
If the total intended electron count is 36 (Kr core) + 12 = 48 electrons, this corresponds to cadmium (Z = 48). After filling 5s2 and 4d10 (12 electrons total, following Kr), all 48 electrons are accounted for — the electrons should be split between the 5s and 4d subshells, not placed entirely in 4d.

Step 3: Write the correct configuration.
[Kr] 5s2 4d10

Final Answer:
The error is that the 4d subshell was given 12 electrons, exceeding its maximum capacity of 10. The correct configuration for 48 electrons is [Kr] 5s2 4d10, which represents cadmium.`,
  },
  {
    title: 'Q14 — Identify the Element ([Xe] 6s2 4f7)',
    content: 'Which element has the electron configuration [Xe] 6s² 4f⁷?',
    answer_key: `Step 1: Identify the electrons in the noble gas core. Xenon (Xe) represents 54 electrons.

Step 2: Sum the electrons outside the core.
6s2 + 4f7 = 2 + 7 = 9 electrons.

Step 3: Calculate the total electrons.
Total = 54 + 9 = 63 electrons.

Step 4: Match the atomic number (Z = 63) to the periodic table. Element 63 is europium, a lanthanide, consistent with a half-filled 4f7 subshell (a particularly stable configuration).

Final Answer:
Europium (Eu)`,
  },
  {
    title: 'Q15 — Find the Error (1s2 2s2 2p6 3s3 3p5)',
    content: 'The electron configuration 1s² 2s² 2p⁶ 3s³ 3p⁵ is NOT valid. Determine what is wrong with it.',
    answer_key: `Step 1: Recall the maximum electron capacity of an s subshell.
An s subshell has only 1 orbital, holding a maximum of 2 electrons. Therefore "3s3" is not possible — it exceeds the maximum capacity of the 3s subshell.

Step 2: Determine the total number of electrons intended.
Sum the superscripts: 2 + 2 + 6 + 3 + 5 = 18 electrons.

Step 3: Redistribute the 18 electrons correctly.
The 3s subshell can hold at most 2 electrons, so the extra electron from "3s3" belongs in the 3p subshell instead, which can hold up to 6 electrons (it was written as only 3p5).
Correct distribution: 3s2, 3p6 (2 + 6 = 8 electrons in the n = 3 shell's s and p subshells, matching the 8 electrons originally spread across 3s3 and 3p5).

Step 4: Write the correct configuration.
1s2 2s2 2p6 3s2 3p6

Final Answer:
The error is that the 3s subshell was given 3 electrons, exceeding its maximum capacity of 2. Moving the extra electron into the 3p subshell (which was under-filled at 3p5) gives the correct configuration 1s2 2s2 2p6 3s2 3p6, which represents argon.`,
  },
]

const topicQNQuestions = [
  {
    title: 'Q1 — Possible Values of l for n = 3',
    content: 'List the possible values of the angular momentum quantum number (l) for n = 3, and identify the subshell letter associated with each value.',
    answer_key: `Step 1: Recall the rule relating l to n.
The angular momentum quantum number l can take any integer value from 0 to (n - 1).

Step 2: Apply this rule for n = 3.
Possible values of l: 0, 1, 2

Step 3: Match each value of l to its subshell letter.
l = 0 -> s subshell
l = 1 -> p subshell
l = 2 -> d subshell

Final Answer:
For n = 3, l can be 0 (3s), 1 (3p), or 2 (3d).`,
  },
  {
    title: 'Q2 — A Valid Quantum Number Set for a 4p Electron',
    content: 'Give one complete, valid set of the four quantum numbers (n, l, ml, ms) for an electron in a 4p orbital.',
    answer_key: `Step 1: Determine n. The electron is in the 4p orbital, so n = 4.

Step 2: Determine l. The letter "p" corresponds to l = 1.

Step 3: Determine ml. For l = 1, ml can be -1, 0, or +1. Any one of these values is valid; choose ml = 0.

Step 4: Determine ms. Every electron has ms = +1/2 or -1/2. Choose ms = +1/2.

Final Answer:
(n, l, ml, ms) = (4, 1, 0, +1/2)
(Other valid answers are acceptable as long as n = 4, l = 1, ml is one of {-1, 0, +1}, and ms is +1/2 or -1/2.)`,
  },
  {
    title: 'Q3 — Number of Orbitals in the 3d Subshell',
    content: 'How many individual orbitals make up the 3d subshell, and what are the possible values of ml for this subshell?',
    answer_key: `Step 1: Identify l for a d subshell. l = 2.

Step 2: Determine the possible values of ml. ml ranges from -l to +l in integer steps.
For l = 2: ml = -2, -1, 0, +1, +2

Step 3: Count the number of ml values, since each unique ml corresponds to one orbital.
There are 5 possible values of ml, so there are 5 orbitals in the 3d subshell.

Final Answer:
The 3d subshell has 5 orbitals, with ml values of -2, -1, 0, +1, and +2.`,
  },
  {
    title: 'Q4 — Orbital Diagram and Unpaired Electrons of Nitrogen',
    content: 'Describe the orbital diagram (box notation) for a ground-state nitrogen atom (Z = 7), and state how many unpaired electrons it has.',
    answer_key: `Step 1: Write the electron configuration of nitrogen. 1s2 2s2 2p3

Step 2: Fill the 1s orbital. Both electrons occupy the single 1s orbital with opposite spins (paired).

Step 3: Fill the 2s orbital. Both electrons occupy the single 2s orbital with opposite spins (paired).

Step 4: Fill the three 2p orbitals using Hund's Rule.
Hund's Rule requires each of the three degenerate 2p orbitals to receive one electron (with parallel spin) before any orbital is doubly occupied.
Each of the three 2p orbitals therefore contains exactly one electron, all with the same spin direction.

Step 5: Count the unpaired electrons.
The 1s and 2s electrons are all paired. The three 2p electrons are each alone in their own orbital, so all three are unpaired.

Final Answer:
Nitrogen's orbital diagram has 1s (paired), 2s (paired), and 2p with one electron in each of the three orbitals (all parallel spin). Total unpaired electrons = 3.`,
  },
  {
    title: 'Q5 — Orbital Diagram and Unpaired Electrons of Oxygen',
    content: 'Describe the orbital diagram for a ground-state oxygen atom (Z = 8), and state how many unpaired electrons it has.',
    answer_key: `Step 1: Write the electron configuration of oxygen. 1s2 2s2 2p4

Step 2: Fill the 1s and 2s orbitals. Both are completely filled with paired electrons.

Step 3: Fill the three 2p orbitals using Hund's Rule.
The first three of the four 2p electrons each occupy a separate 2p orbital (parallel spin), following the same pattern as nitrogen. The fourth 2p electron must then pair up in one of the already singly-occupied orbitals (with opposite spin), since all three orbitals already have one electron each.

Step 4: Count the unpaired electrons.
Two of the three 2p orbitals remain singly occupied (unpaired); one orbital now holds a pair.

Final Answer:
Oxygen's 2p subshell has one orbital with a pair of electrons (opposite spins) and two orbitals with a single unpaired electron each. Total unpaired electrons = 2.`,
  },
  {
    title: 'Q6 — Pauli Exclusion Principle Applied to a Single Orbital',
    content: "According to the Pauli Exclusion Principle, can two electrons in the same orbital have the same spin? Explain, and give a valid set of quantum numbers for the two electrons occupying a single 2s orbital.",
    answer_key: `Step 1: State the Pauli Exclusion Principle.
No two electrons in the same atom can have an identical set of all four quantum numbers (n, l, ml, ms).

Step 2: Apply this to two electrons in the same orbital.
Electrons in the same orbital share the same n, l, and ml values (that is what defines "the same orbital"). For the two electrons to remain distinguishable, they must differ in the one remaining quantum number, ms. Therefore they cannot have the same spin — one must be ms = +1/2 and the other ms = -1/2.

Step 3: Give an example set of quantum numbers for the two 2s electrons.
Electron 1: (n=2, l=0, ml=0, ms=+1/2)
Electron 2: (n=2, l=0, ml=0, ms=-1/2)

Final Answer:
No — two electrons in the same orbital must have opposite spins, per the Pauli Exclusion Principle. Example: (2, 0, 0, +1/2) and (2, 0, 0, -1/2).`,
  },
  {
    title: "Q7 — Hund's Rule Applied to Nitrogen's 2p Electrons",
    content: "State Hund's Rule and use it to describe how three electrons fill the three 2p orbitals of nitrogen.",
    answer_key: `Step 1: State Hund's Rule.
When filling degenerate (equal-energy) orbitals, electrons occupy separate orbitals singly, with parallel (same-direction) spins, before any orbital receives a second electron.

Step 2: Apply Hund's Rule to nitrogen's three 2p electrons.
Nitrogen has three electrons to place in the three 2p orbitals (2px, 2py, 2pz), which are degenerate (equal energy).
Rather than pairing two electrons in one 2p orbital and leaving another empty, each of the three 2p orbitals receives exactly one electron.
All three unpaired electrons have the same (parallel) spin direction, which minimizes electron-electron repulsion and results in the lowest-energy, most stable ground-state configuration.

Final Answer:
Hund's Rule states that degenerate orbitals are filled singly before pairing. Nitrogen's three 2p electrons therefore occupy the three separate 2p orbitals individually, each with parallel spin, rather than pairing up in fewer orbitals.`,
  },
  {
    title: 'Q8 — Maximum Electron Capacity of the n = 4 Shell',
    content: 'What is the maximum number of electrons that the n = 4 shell can hold in total? Show the subshells that make up this shell and their individual capacities.',
    answer_key: `Step 1: Determine the possible values of l for n = 4.
l can range from 0 to (n - 1), so l = 0, 1, 2, 3, corresponding to subshells 4s, 4p, 4d, 4f.

Step 2: Recall the maximum capacity of each subshell type.
s subshell: 2 electrons
p subshell: 6 electrons
d subshell: 10 electrons
f subshell: 14 electrons

Step 3: Sum the capacities of all subshells in the n = 4 shell.
4s (2) + 4p (6) + 4d (10) + 4f (14) = 32 electrons

Final Answer:
The n = 4 shell (subshells 4s, 4p, 4d, 4f) can hold a maximum of 32 electrons.`,
  },
  {
    title: 'Q9 — Identifying an Invalid Quantum Number Set',
    content: 'Explain why the quantum number set (n = 2, l = 2, ml = 0, ms = +1/2) is invalid.',
    answer_key: `Step 1: Recall the rule relating l to n.
The angular momentum quantum number l must be an integer ranging from 0 to (n - 1).

Step 2: Apply this rule to the given set.
For n = 2, the allowed values of l are only 0 and 1 (corresponding to the 2s and 2p subshells). A d subshell (l = 2) does not exist until n = 3 or higher — there is no 2d subshell.

Step 3: State the conclusion.
Because l = 2 is not an allowed value when n = 2, this quantum number set violates the rules governing allowed quantum numbers and is therefore invalid.

Final Answer:
The set (2, 2, 0, +1/2) is invalid because l cannot equal or exceed n. For n = 2, l can only be 0 or 1 — there is no 2d subshell.`,
  },
  {
    title: "Q10 — Orbital Diagram and Aufbau Exception for Chromium",
    content: 'Describe the orbital diagram for chromium (Z = 24), noting its exception to the expected Aufbau filling order.',
    answer_key: `Step 1: Predict the configuration using strict Aufbau filling.
Following the standard filling order, chromium (24 electrons) would be predicted to have the configuration [Ar] 4s2 3d4.

Step 2: Recall the actual, experimentally observed configuration.
Chromium's true ground-state configuration is [Ar] 4s1 3d5, not [Ar] 4s2 3d4.

Step 3: Explain the reason for the exception.
A half-filled 3d subshell (one electron in each of the five 3d orbitals, all with parallel spin) is an especially stable, lower-energy arrangement due to favorable exchange energy and minimized electron-electron repulsion. This extra stability makes it energetically favorable for one electron to move from the 4s orbital into the 3d subshell, creating two half-filled subshells (4s1 and 3d5) instead of one filled (4s2) and one nearly-filled (3d4) subshell.

Step 4: Describe the orbital diagram.
4s: one unpaired electron.
3d: five orbitals, each containing exactly one unpaired electron, all with parallel spin.

Final Answer:
Chromium's actual configuration is [Ar] 4s1 3d5 (not the Aufbau-predicted [Ar] 4s2 3d4), because a half-filled 3d subshell paired with a half-filled 4s subshell is more stable. The orbital diagram shows 6 total unpaired electrons (1 in 4s, 5 in 3d).`,
  },
  {
    title: 'Q11 — Orbital Diagram and Unpaired Electrons of Phosphorus',
    content: 'Describe the orbital diagram for a ground-state phosphorus atom (Z = 15) and identify the number of unpaired electrons.',
    answer_key: `Step 1: Write the electron configuration of phosphorus. 1s2 2s2 2p6 3s2 3p3

Step 2: Note that 1s, 2s, 2p, and 3s are all completely filled subshells, so all of their electrons are paired.

Step 3: Apply Hund's Rule to the three 3p electrons.
The three 3p electrons occupy the three separate 3p orbitals individually (one electron each), with parallel spin, following the same pattern seen for nitrogen's 2p electrons.

Step 4: Count the unpaired electrons.
All three 3p electrons are unpaired (each alone in its own orbital).

Final Answer:
Phosphorus's orbital diagram has 1s, 2s, 2p, and 3s completely paired, with 3p holding one electron in each of its three orbitals. Total unpaired electrons = 3.`,
  },
  {
    title: "Q12 — Quantum Numbers for Sulfur's Last Electron",
    content: 'Give the four quantum numbers for the last electron added, using the Aufbau principle, to a ground-state sulfur atom (Z = 16).',
    answer_key: `Step 1: Write the electron configuration of sulfur. 1s2 2s2 2p6 3s2 3p4

Step 2: Determine which orbital receives the 16th (last) electron.
Following Hund's Rule, the first three of sulfur's four 3p electrons each occupy a separate 3p orbital (ml = -1, 0, +1) with parallel (+1/2) spin. The fourth electron must then pair up in one of these already-occupied orbitals, entering with the opposite spin.

Step 3: Assign the quantum numbers to this 16th electron.
n = 3 (third principal shell)
l = 1 (p subshell)
ml = -1 (the orbital chosen to become doubly occupied; by convention, the first orbital filled is often labeled ml = -1)
ms = -1/2 (opposite spin from the electron already in that orbital, which has ms = +1/2)

Final Answer:
(n, l, ml, ms) = (3, 1, -1, -1/2)
(The specific ml value used for the doubly-occupied orbital may vary by convention, but ms must be -1/2 since it is pairing with an existing +1/2 electron.)`,
  },
  {
    title: "Q13 — Identifying a Violation of Hund's Rule",
    content: 'An orbital diagram for the 2p subshell is drawn showing 2 electrons paired together in one 2p orbital, with the other two 2p orbitals left empty (as in a carbon atom, which has 2 electrons in 2p). Explain what rule this violates and correct the diagram.',
    answer_key: `Step 1: Identify the rule being violated.
This diagram violates Hund's Rule, which requires electrons to occupy separate degenerate orbitals singly, with parallel spins, before any orbital is doubly occupied.

Step 2: Explain why the drawn diagram is incorrect.
Pairing both 2p electrons into a single orbital while leaving two orbitals completely empty ignores the lower-energy arrangement available when electrons spread out to minimize electron-electron repulsion.

Step 3: Draw the corrected diagram.
The two 2p electrons for carbon should instead occupy two separate 2p orbitals, each with one electron, both having the same (parallel) spin direction. The third 2p orbital remains empty.

Final Answer:
The diagram violates Hund's Rule. For carbon's 2 electrons in the 2p subshell, the correct orbital diagram places one electron in each of two separate 2p orbitals (parallel spins), not both paired in a single orbital.`,
  },
  {
    title: 'Q14 — Maximum Electron Capacity of the n = 3 Shell',
    content: 'How many total electrons can the n = 3 shell hold, and which subshells make it up?',
    answer_key: `Step 1: Determine the possible values of l for n = 3.
l can range from 0 to (n - 1), so l = 0, 1, 2, corresponding to subshells 3s, 3p, 3d.

Step 2: Recall the maximum capacity of each subshell type.
s subshell: 2 electrons
p subshell: 6 electrons
d subshell: 10 electrons

Step 3: Sum the capacities of all subshells in the n = 3 shell.
3s (2) + 3p (6) + 3d (10) = 18 electrons

Final Answer:
The n = 3 shell (subshells 3s, 3p, 3d) can hold a maximum of 18 electrons.`,
  },
  {
    title: 'Q15 — Orbital Diagram and Unpaired Electrons of Iron',
    content: 'Describe the orbital diagram for a ground-state iron atom (Z = 26), [Ar] 4s2 3d6, and determine the number of unpaired electrons.',
    answer_key: `Step 1: Confirm the configuration outside the argon core.
Iron's configuration beyond [Ar] is 4s2 3d6.

Step 2: Describe the 4s subshell.
The 4s orbital is completely filled with 2 paired electrons.

Step 3: Distribute the 6 electrons among the five 3d orbitals using Hund's Rule.
The first 5 electrons each occupy a separate 3d orbital (one per orbital, parallel spin). The 6th electron must then pair up in one of these orbitals (opposite spin), since all five are already singly occupied.

Step 4: Count the unpaired electrons.
4 of the 5 3d orbitals remain singly occupied (unpaired); 1 orbital holds a pair.

Final Answer:
Iron's orbital diagram shows 4s completely paired, and 3d with 4 singly-occupied (unpaired) orbitals and 1 doubly-occupied (paired) orbital. Total unpaired electrons = 4.`,
  },
]

const topicPESQuestions = [
  {
    title: 'Q1 — Identify the Element from a Single-Peak PES Spectrum',
    content: 'A photoelectron spectroscopy (PES) spectrum for an unknown element shows a single peak at a binding energy of 2.37 MJ/mol with a relative peak height of 2. Identify the element and write its electron configuration.',
    answer_key: `Step 1: Recall that in PES, each peak corresponds to one subshell, its position (binding energy) indicates how tightly the electrons are held, and its relative height indicates the number of electrons in that subshell.

Step 2: Interpret the single peak.
Only one peak is present, meaning the element has only one occupied subshell: 1s.
The relative height of 2 means there are 2 electrons in this subshell.

Step 3: Determine the total number of electrons and identify the element.
Total electrons = 2, so the element has atomic number Z = 2.

Final Answer:
The element is Helium (He), with electron configuration 1s2.`,
  },
  {
    title: 'Q2 — Identify the Element from a Two-Peak PES Spectrum (Lithium)',
    content: 'A PES spectrum shows two peaks: one at 6.26 MJ/mol with relative height 2, and one at 0.52 MJ/mol with relative height 1. Identify the element and write its electron configuration.',
    answer_key: `Step 1: Interpret the higher-binding-energy peak.
The peak at 6.26 MJ/mol (higher binding energy, meaning it is held more tightly, closer to the nucleus) corresponds to the 1s subshell. Its height of 2 means 2 electrons occupy 1s.

Step 2: Interpret the lower-binding-energy peak.
The peak at 0.52 MJ/mol (lower binding energy, held less tightly, farther from the nucleus) corresponds to the 2s subshell. Its height of 1 means 1 electron occupies 2s.

Step 3: Sum the electrons to find the total and identify the element.
Total electrons = 2 + 1 = 3, so Z = 3.

Final Answer:
The element is Lithium (Li), with electron configuration 1s2 2s1.`,
  },
  {
    title: 'Q3 — Identify the Element from a Two-Peak PES Spectrum (Beryllium)',
    content: 'A PES spectrum shows two peaks: one at 11.5 MJ/mol with relative height 2, and one at 0.90 MJ/mol with relative height 2. Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by binding energy.
The higher-energy peak (11.5 MJ/mol, height 2) corresponds to 1s2.
The lower-energy peak (0.90 MJ/mol, height 2) corresponds to 2s2.

Step 2: Sum the electrons.
Total electrons = 2 + 2 = 4, so Z = 4.

Final Answer:
The element is Beryllium (Be), with electron configuration 1s2 2s2.`,
  },
  {
    title: 'Q4 — Identify the Element from a Three-Peak PES Spectrum (Boron)',
    content: 'A PES spectrum shows three peaks with binding energies and relative heights: 19.3 MJ/mol (height 2), 1.36 MJ/mol (height 2), and 0.80 MJ/mol (height 1). Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks in order of decreasing binding energy (highest binding energy = closest to the nucleus = lowest principal quantum number/subshell).
19.3 MJ/mol (height 2) -> 1s2
1.36 MJ/mol (height 2) -> 2s2
0.80 MJ/mol (height 1) -> 2p1

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 1 = 5, so Z = 5.

Final Answer:
The element is Boron (B), with electron configuration 1s2 2s2 2p1.`,
  },
  {
    title: 'Q5 — Identify the Element from a Three-Peak PES Spectrum (Carbon)',
    content: 'A PES spectrum shows three peaks with relative heights 2, 2, and 2, at binding energies 28.6 MJ/mol, 1.72 MJ/mol, and 1.09 MJ/mol respectively. Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
28.6 MJ/mol (height 2) -> 1s2
1.72 MJ/mol (height 2) -> 2s2
1.09 MJ/mol (height 2) -> 2p2

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 2 = 6, so Z = 6.

Final Answer:
The element is Carbon (C), with electron configuration 1s2 2s2 2p2.`,
  },
  {
    title: 'Q6 — Identify the Element from a Three-Peak PES Spectrum (Nitrogen)',
    content: 'A PES spectrum shows three peaks with binding energies 39.6 MJ/mol (height 2), 2.45 MJ/mol (height 2), and 1.40 MJ/mol (height 3). Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
39.6 MJ/mol (height 2) -> 1s2
2.45 MJ/mol (height 2) -> 2s2
1.40 MJ/mol (height 3) -> 2p3

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 3 = 7, so Z = 7.

Final Answer:
The element is Nitrogen (N), with electron configuration 1s2 2s2 2p3.`,
  },
  {
    title: 'Q7 — Identify the Element and Explain a Binding Energy Dip (Oxygen)',
    content: "A PES spectrum shows three peaks with binding energies 41.6 MJ/mol (height 2), 2.03 MJ/mol (height 2), and 0.87 MJ/mol (height 4). Identify the element, write its electron configuration, and explain why its 2p binding energy is LOWER than nitrogen's 2p binding energy (1.40 MJ/mol), even though oxygen has a greater nuclear charge.",
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
41.6 MJ/mol (height 2) -> 1s2
2.03 MJ/mol (height 2) -> 2s2
0.87 MJ/mol (height 4) -> 2p4

Step 2: Sum the electrons and identify the element.
Total electrons = 2 + 2 + 4 = 8, so Z = 8. This is Oxygen (O), configuration 1s2 2s2 2p4.

Step 3: Explain the binding energy dip compared to nitrogen.
Nitrogen's 2p subshell has 3 electrons, one in each of the three 2p orbitals (all unpaired, per Hund's Rule) — there is no extra electron-electron repulsion from orbital pairing.
Oxygen's 2p subshell has 4 electrons, which means one 2p orbital must now hold a pair of electrons. The two paired electrons repel each other strongly (since they occupy the same small region of space), which pushes electron density outward and makes the paired electrons easier to remove. This extra repulsion lowers oxygen's 2p binding energy below nitrogen's, even though oxygen's nucleus has one more proton (greater nuclear charge would normally be expected to increase binding energy).

Final Answer:
The element is Oxygen (O), 1s2 2s2 2p4. Its 2p binding energy is lower than nitrogen's because oxygen's 2p subshell contains one paired orbital, and the extra electron-electron repulsion from that pairing outweighs the effect of oxygen's slightly greater nuclear charge.`,
  },
  {
    title: 'Q8 — Identify the Element from a Three-Peak PES Spectrum (Fluorine)',
    content: 'A PES spectrum shows three peaks with binding energies 67.2 MJ/mol (height 2), 2.4 MJ/mol (height 2), and 1.36 MJ/mol (height 5). Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
67.2 MJ/mol (height 2) -> 1s2
2.4 MJ/mol (height 2) -> 2s2
1.36 MJ/mol (height 5) -> 2p5

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 5 = 9, so Z = 9.

Final Answer:
The element is Fluorine (F), with electron configuration 1s2 2s2 2p5.`,
  },
  {
    title: 'Q9 — Identify the Element from a Three-Peak PES Spectrum (Neon)',
    content: 'A PES spectrum shows three peaks with binding energies 84.0 MJ/mol (height 2), 4.68 MJ/mol (height 2), and 2.08 MJ/mol (height 6). Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
84.0 MJ/mol (height 2) -> 1s2
4.68 MJ/mol (height 2) -> 2s2
2.08 MJ/mol (height 6) -> 2p6

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 6 = 10, so Z = 10.

Final Answer:
The element is Neon (Ne), with electron configuration 1s2 2s2 2p6.`,
  },
  {
    title: 'Q10 — Identify the Element from a Four-Peak PES Spectrum (Sodium)',
    content: 'A PES spectrum shows four peaks with binding energies 104.0 MJ/mol (height 2), 6.84 MJ/mol (height 2), 3.67 MJ/mol (height 6), and 0.50 MJ/mol (height 1). Identify the element and write its electron configuration.',
    answer_key: `Step 1: Assign the peaks by decreasing binding energy.
104.0 MJ/mol (height 2) -> 1s2
6.84 MJ/mol (height 2) -> 2s2
3.67 MJ/mol (height 6) -> 2p6
0.50 MJ/mol (height 1) -> 3s1

Step 2: Sum the electrons.
Total electrons = 2 + 2 + 6 + 1 = 11, so Z = 11.

Final Answer:
The element is Sodium (Na), with electron configuration 1s2 2s2 2p6 3s1.`,
  },
  {
    title: 'Q11 — Identify the Element and the Least-Populated Subshell (Aluminum)',
    content: 'A PES spectrum for an unknown element shows five peaks, corresponding to subshells 1s, 2s, 2p, 3s, and 3p, with relative peak heights of 2, 2, 6, 2, and 1 respectively. Identify the total number of electrons, the element, and which subshell has the fewest electrons.',
    answer_key: `Step 1: Sum all the relative peak heights to find the total number of electrons.
Total electrons = 2 + 2 + 6 + 2 + 1 = 13

Step 2: Identify the element.
Z = 13 corresponds to Aluminum (Al).

Step 3: Identify the subshell with the fewest electrons.
Comparing all five peak heights (2, 2, 6, 2, 1), the smallest value is 1, which belongs to the 3p subshell.

Final Answer:
Total electrons = 13; the element is Aluminum (Al), configuration 1s2 2s2 2p6 3s2 3p1. The 3p subshell has the fewest electrons (only 1).`,
  },
  {
    title: 'Q12 — Predict the PES Spectrum of Silicon',
    content: 'The electron configuration of silicon is 1s2 2s2 2p6 3s2 3p2. Predict the number of peaks and the relative peak heights expected in silicon\'s PES spectrum, listed from highest to lowest binding energy.',
    answer_key: `Step 1: Recall that each distinct subshell in the electron configuration produces one separate PES peak.

Step 2: List the subshells present in silicon's configuration.
1s, 2s, 2p, 3s, 3p — five distinct subshells, so five peaks are expected.

Step 3: Determine the relative height of each peak (equal to the number of electrons in that subshell).
1s: 2 electrons -> height 2
2s: 2 electrons -> height 2
2p: 6 electrons -> height 6
3s: 2 electrons -> height 2
3p: 2 electrons -> height 2

Step 4: Order the peaks from highest to lowest binding energy.
Binding energy generally decreases as the subshells get farther from the nucleus (lower n) and within the same shell, s subshells bind more tightly than p subshells. Order: 1s > 2s > 2p > 3s > 3p.

Final Answer:
Silicon's PES spectrum should show 5 peaks, in order of decreasing binding energy: 1s (height 2), 2s (height 2), 2p (height 6), 3s (height 2), 3p (height 2).`,
  },
  {
    title: "Q13 — Explaining the O 2p / N 2p Binding Energy Comparison",
    content: "Explain why oxygen's 2p peak appears at a LOWER binding energy than nitrogen's 2p peak in their respective PES spectra, even though oxygen has one more proton (greater nuclear charge) than nitrogen.",
    answer_key: `Step 1: Compare the 2p electron arrangements of nitrogen and oxygen.
Nitrogen has 3 electrons in 2p, one in each of the three 2p orbitals (all unpaired, following Hund's Rule) — no orbital contains more than one electron.
Oxygen has 4 electrons in 2p, which means one of the three 2p orbitals must now contain a pair of electrons.

Step 2: Explain the effect of electron pairing on binding energy.
Two electrons occupying the same orbital repel each other strongly, since they occupy the same small region of space. This added electron-electron repulsion pushes electron density outward and makes it easier to remove one of the paired electrons (lower binding energy) than it would be without that repulsion.

Step 3: Compare this effect to the increase in nuclear charge.
Although oxygen's nucleus has one additional proton (which would normally increase binding energy by pulling electrons in more tightly), the extra repulsion from pairing up electrons in the same 2p orbital outweighs this increase in nuclear attraction.

Final Answer:
Oxygen's 2p binding energy is lower than nitrogen's because oxygen must pair two electrons into one 2p orbital, and the resulting electron-electron repulsion outweighs the effect of oxygen's greater nuclear charge, making the paired electrons easier to remove.`,
  },
  {
    title: 'Q14 — Identify the Element from a Four-Peak PES Spectrum (Magnesium)',
    content: 'A PES spectrum shows four peaks with relative heights in the ratio 2:2:6:2 (from highest to lowest binding energy), with no peaks appearing beyond these four. Identify the total number of electrons and the element.',
    answer_key: `Step 1: Assign each peak to a subshell, in order of decreasing binding energy.
Peak 1 (highest binding energy, height 2) -> 1s2
Peak 2 (height 2) -> 2s2
Peak 3 (height 6) -> 2p6
Peak 4 (lowest binding energy, height 2) -> 3s2

Step 2: Note that no peak appears for 3p, meaning the 3p subshell is empty (unoccupied).

Step 3: Sum the electrons.
Total electrons = 2 + 2 + 6 + 2 = 12, so Z = 12.

Final Answer:
Total electrons = 12; the element is Magnesium (Mg), with electron configuration 1s2 2s2 2p6 3s2.`,
  },
  {
    title: "Q15 — Predicting Phosphorus's Full PES Profile",
    content: "Phosphorus has the electron configuration 1s2 2s2 2p6 3s2 3p3. Predict the number of peaks in its PES spectrum, the order of the peaks from highest to lowest binding energy, and the total number of electrons represented.",
    answer_key: `Step 1: Identify the distinct subshells in phosphorus's configuration.
1s, 2s, 2p, 3s, 3p — five distinct subshells, so five peaks are expected.

Step 2: Order the peaks from highest to lowest binding energy.
Binding energy decreases as principal quantum number n increases, and within the same shell, s binds more tightly than p.
Order: 1s > 2s > 2p > 3s > 3p

Step 3: List the relative height of each peak.
1s: 2, 2s: 2, 2p: 6, 3s: 2, 3p: 3

Step 4: Sum all the electrons to find the total.
Total electrons = 2 + 2 + 6 + 2 + 3 = 15

Final Answer:
Phosphorus's PES spectrum has 5 peaks, ordered 1s > 2s > 2p > 3s > 3p, with relative heights 2, 2, 6, 2, and 3. Total electrons = 15, consistent with phosphorus's atomic number (Z = 15).`,
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
  await insertBatch(TOPIC_51, topic51Questions)
  await insertBatch(TOPIC_52, topic52Questions)
  await insertBatch(TOPIC_QN, topicQNQuestions)
  await insertBatch(TOPIC_PES, topicPESQuestions)
  console.log('Done.')
}

main()
