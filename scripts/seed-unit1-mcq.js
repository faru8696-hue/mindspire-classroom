const fs = require('fs');
for (const line of fs.readFileSync(require('path').join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

const TOPICS = {
  '1.1': 'ec60f130-1cd7-4ca0-b86b-41b3ee5ca1bd',
  '1.2': 'ba0fae17-c9f6-4831-9df6-e22853ca073d',
  '1.3': '0bd727cf-8dd4-4e6a-90e3-ff35f0e4cc11',
  '1.4': '12b9dc45-8184-4302-8244-7234e28e05a5',
  '1.5': 'f9052a5f-1a96-4070-89a3-000d05c2bdc4',
  '1.6': '08497fdf-0b09-44c4-992b-27a3912b77bd',
  '1.7': '616020e0-79a3-47fe-baef-f3669e1b3193',
  '1.8': 'af121e66-0dae-4143-81ca-312b863a918c',
};

const BASE = 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/unit1-mcq/';

const questions = [
  // ---- Topics 1.1-1.3 ----
  { topic: '1.1', title: 'MCQ — Greatest Mass of Oxygen', content:
`Which of the following contains the greatest mass of oxygen?
(A) 1.00 g Na2O
(B) 1.00 g MgO
(C) 1.00 g K2O
(D) 1.00 g CaO`,
    answer: `Correct answer: (B) 1.00 g MgO

Compare the mass fraction of O in each 1.00 g sample using molar masses:
Na2O: M = 2(22.99) + 16.00 = 61.98 g/mol -> %O = 16.00/61.98 = 25.8%
MgO: M = 24.31 + 16.00 = 40.31 g/mol -> %O = 16.00/40.31 = 39.7%
K2O: M = 2(39.10) + 16.00 = 94.20 g/mol -> %O = 16.00/94.20 = 17.0%
CaO: M = 40.08 + 16.00 = 56.08 g/mol -> %O = 16.00/56.08 = 28.5%

MgO has the highest mass percent of oxygen, so 1.00 g of MgO contains the most oxygen by mass.` },

  { topic: '1.2', title: 'MCQ — Mass Spectrum of Element X', image: 'q2_chart.png', content:
`The mass spectrum of element X is presented in the diagram above. Based on the spectrum, which of the following can be concluded about element X?
(A) X is a transition metal, and each peak represents an oxidation state of the metal.
(B) X contains five electron sublevels.
(C) The atomic mass of X is 90.
(D) The atomic mass of X is between 90 and 92.`,
    answer: `Correct answer: (D) The atomic mass of X is between 90 and 92.

The peaks in a mass spectrum represent different isotopes of the SAME element, not oxidation states (eliminates A) — number of sublevels has nothing to do with a mass spectrum's peak pattern (eliminates B).

The atomic mass reported on the periodic table is the weighted average of all isotope masses, weighted by relative abundance — not just the mass of the tallest peak (eliminates C, since the average is pulled higher by the significant peaks at 92, 94, and 96).

Since the dominant peak is at 90 (~51%) but there are meaningful peaks at 91, 92, 94, and 96, the weighted average must be somewhat higher than 90 but still closer to 90 than to 96 — consistent with a value between 90 and 92 (this matches zirconium, atomic mass 91.22).` },

  { topic: '1.3', title: 'MCQ — Empirical Formula from Mass Composition', content:
`A 23.0 g sample of a compound contains 12.0 g of C, 3.0 g of H, and 8.0 g of O. Which of the following is the empirical formula of the compound?
(A) CH3O
(B) C2H3O
(C) C2H6O
(D) C4H6O`,
    answer: `Correct answer: (C) C2H6O

Convert each mass to moles:
mol C = 12.0 g / 12.01 g/mol = 1.00 mol
mol H = 3.0 g / 1.008 g/mol = 3.0 mol
mol O = 8.0 g / 16.00 g/mol = 0.50 mol

Divide each by the smallest value (0.50 mol):
C: 1.00 / 0.50 = 2
H: 3.0 / 0.50 = 6
O: 0.50 / 0.50 = 1

Empirical formula: C2H6O` },

  { topic: '1.2', title: 'MCQ — Confirming a Pure Te Sample from Mass Spectrometer Data', image: 'q4_chart.png', content:
`The elements I and Te have similar average atomic masses. A sample that was believed to be a mixture of I and Te was run through a mass spectrometer, resulting in the data above. All of the following statements are true. Which one would be the best basis for concluding that the sample was pure Te?
(A) Te forms ions with a –2 charge, whereas I forms ions with a –1 charge.
(B) Te is more abundant than I in the universe.
(C) I consists of only one naturally occurring isotope with 74 neutrons, whereas Te has more than one isotope.
(D) I has a higher first ionization energy than Te does.`,
    answer: `Correct answer: (C) I consists of only one naturally occurring isotope with 74 neutrons, whereas Te has more than one isotope.

A mass spectrum directly shows how many different isotopes (peaks) are present and their relative abundances. Iodine is monoisotopic (only one naturally occurring isotope), so a pure sample of I would produce a SINGLE peak in the mass spectrum. The spectrum shown has multiple peaks (122–130), which is only possible if Te — which has several naturally occurring isotopes — is present.

Options (A), (B), and (D) are true statements about I and Te, but none of them can be determined from or explain the pattern of peaks in a mass spectrum, so they are not valid evidence from this particular data.` },

  { topic: '1.3', title: 'MCQ — Empirical Formula from Combustion Products', content:
`A sample of a compound that contains only the elements C, H, and N is completely burned in O2 to produce 44.0 g of CO2, 45.0 g of H2O, and some NO2. A possible empirical formula of the compound is
(A) CH2N
(B) CH5N
(C) C2H5N
(D) C3H3N2`,
    answer: `Correct answer: (B) CH5N

mol CO2 = 44.0 g / 44.01 g/mol = 1.00 mol -> mol C = 1.00 mol (each CO2 contains 1 C)
mol H2O = 45.0 g / 18.02 g/mol = 2.50 mol -> mol H = 2 x 2.50 = 5.00 mol (each H2O contains 2 H)

Mole ratio C : H = 1.00 : 5.00 = 1 : 5

The nitrogen amount can't be determined from the CO2/H2O data alone (it went into NO2, whose amount isn't given), but the compound must have a C:H ratio of 1:5. Only CH5N satisfies this ratio.` },

  { topic: '1.1', title: 'MCQ — Identifying an Unknown Metal Chloride from Gravimetric Data', content:
`M+ is an unknown metal cation with a +1 charge. A student dissolves the chloride of the unknown metal, MCl, in enough water to make 100.0 mL of solution. The student then mixes the solution with excess AgNO3 solution, causing AgCl to precipitate. The student collects the precipitate by filtration, dries it, and records the data shown below. (The molar mass of AgCl is 143 g/mol.)

Mass of unknown chloride, MCl: 0.74 g
Mass of filter paper: 0.80 g
Mass of filter paper plus AgCl precipitate: 2.23 g

What is the identity of the metal chloride?
(A) NaCl
(B) KCl
(C) CuCl
(D) LiCl`,
    answer: `Correct answer: (B) KCl

Mass of AgCl precipitate = 2.23 g - 0.80 g = 1.43 g

mol AgCl = 1.43 g / 143 g/mol = 0.0100 mol

Every mole of AgCl formed corresponds to one mole of Cl- that came from the original MCl sample, so:
mol MCl = mol Cl- = mol AgCl = 0.0100 mol

Molar mass of MCl = 0.74 g / 0.0100 mol = 74 g/mol

Molar mass of M = 74 - 35.45 (Cl) = 38.6 g/mol, closest to potassium (39.10 g/mol).

The metal chloride is KCl.` },

  { topic: '1.3', title: 'MCQ — Molecular Formula from Equimolar Combustion Products', content:
`Complete combustion of a sample of a hydrocarbon in excess oxygen produces equimolar quantities of carbon dioxide and water. Which of the following could be the molecular formula of the compound?
(A) C2H2
(B) C2H6
(C) C4H8
(D) C6H6`,
    answer: `Correct answer: (C) C4H8

For a hydrocarbon CxHy, complete combustion produces x mol CO2 and (y/2) mol H2O per mole of compound. "Equimolar" CO2 and H2O means:
x = y/2, i.e. y = 2x (the number of H atoms must be exactly twice the number of C atoms).

Check each option:
C2H2: y = 2, 2x = 4 -> not equal
C2H6: y = 6, 2x = 4 -> not equal
C4H8: y = 8, 2x = 8 -> equal! This works.
C6H6: y = 6, 2x = 12 -> not equal

Only C4H8 satisfies y = 2x.` },

  { topic: '1.3', title: 'MCQ — Error Analysis for a Hydrate Percent-Water Experiment', content:
`After completing an experiment to determine gravimetrically the percentage of water in a hydrate, a student reported a value of 38 percent. The correct value for the percentage of water in the hydrate is 51 percent. Which of the following is the most likely explanation for this difference?
(A) The anhydrous salt had absorbed moisture from the air before its mass was recorded.
(B) Strong initial heating of the solid hydrate caused some of the sample to spatter out of the crucible.
(C) The crucible had not been heated to constant mass before it was used in the experiment.
(D) Excessive heating caused the anhydrous salt to undergo a decomposition reaction.`,
    answer: `Correct answer: (A) The anhydrous salt had absorbed moisture from the air before its mass was recorded.

%water = (mass of water driven off) / (mass of hydrate) = (mass hydrate - mass anhydrous salt) / (mass hydrate)

The student's measured value (38%) is LOWER than the true value (51%), meaning the calculated mass of water lost was too small — i.e., the "anhydrous" salt appeared heavier than it truly was. If the dried salt reabsorbed some moisture from the air before it was weighed, its recorded mass would be artificially high, making the calculated mass loss (and thus %water) come out too low. This matches the observed error.

(B) and (D) would cause the anhydrous salt's final mass to be too LOW (extra mass lost to spattering or decomposition), which would make the calculated %water too HIGH, not too low — the wrong direction.
(C) affects the crucible's tare mass but does not systematically produce this specific under-measurement of %water.` },

  // ---- Topics 1.4-1.6 ----
  { topic: '1.4', title: 'MCQ — Percent Silver in an Ag/Cu Alloy', content:
`A student performed a gravimetric analysis experiment to determine the percentage of Ag by mass in an alloy containing a mixture of Ag and Cu. A sample of the alloy is dissolved completely in a solution of HNO3(aq), forming the aqueous ions Ag+(aq) and Cu2+(aq). An excess amount of NaCl(aq) is added to this solution, causing the formation of a precipitate, AgCl(s). The student collects the precipitate by filtration, dries it, and records its mass. Data from the experiment is shown below.

Mass of Ag/Cu alloy: 2.00 g
Mass of AgCl(s) precipitate: 0.72 g

Based on the information in the data table, which of the following best represents the percent of Ag by mass in the alloy?
(A) 27%
(B) 36%
(C) 54%
(D) 75%`,
    answer: `Correct answer: (A) 27%

mol AgCl = 0.72 g / 143.32 g/mol = 0.00502 mol = mol Ag (1:1 ratio, since each AgCl contains one Ag)

mass Ag = 0.00502 mol x 107.87 g/mol = 0.542 g

%Ag = 0.542 g / 2.00 g x 100 = 27.1%` },

  { topic: '1.4', title: 'MCQ — Identifying an Impurity that Raises Measured %K', content:
`The mass percent of potassium in pure K2SO4 is 45 percent. A chemist analyzes an impure sample of K2SO4 and determines that the mass percent of potassium is 50 percent. Which of the following impurities could account for the high mass percent of potassium in the sample?
(A) KBr
(B) KI
(C) KCN
(D) KMnO4`,
    answer: `Correct answer: (C) KCN

For an impurity to raise the overall %K above 45% (the value for pure K2SO4), the impurity itself must have a %K higher than 45%.

Calculate %K for each option:
KBr: M = 39.10 + 79.90 = 119.00 -> %K = 39.10/119.00 = 32.9%
KI: M = 39.10 + 126.90 = 166.00 -> %K = 39.10/166.00 = 23.6%
KCN: M = 39.10 + 12.01 + 14.01 = 65.12 -> %K = 39.10/65.12 = 60.0%
KMnO4: M = 39.10 + 54.94 + 64.00 = 158.04 -> %K = 39.10/158.04 = 24.7%

Only KCN has a %K (60.0%) greater than 45%, so mixing it into the sample would raise the overall measured %K.` },

  { topic: '1.4', title: 'MCQ — Mass Percent of LiCl in a LiCl/NaCl Mixture', content:
`A mixture of LiCl and NaCl is analyzed and found to contain 5.00 percent Li by mass. Which of the following best represents the mass percent of LiCl in this mixture?
(A) 11.8%
(B) 30.5%
(C) 72.0%
(D) 81.9%`,
    answer: `Correct answer: (B) 30.5%

%Li in pure LiCl = 6.94 / (6.94 + 35.45) = 6.94/42.39 = 16.37%

Let x = mass fraction of LiCl in the mixture. All the Li in the mixture comes from the LiCl portion, so:
x (0.1637) = 0.0500
x = 0.0500 / 0.1637 = 0.3054 = 30.5%` },

  { topic: '1.5', title: 'MCQ — Ground State Electron Configuration of Tin', content:
`Which of the following represents the ground state electron configuration for an atom of tin (Sn)?
(A) [Kr] 5s2 5p2
(B) [Kr] 4d10 5s2 5p2
(C) [Kr] 5d10 5s2 5p2
(D) [Kr] 4d10 5p2`,
    answer: `Correct answer: (B) [Kr] 4d10 5s2 5p2

Tin (Sn) has atomic number 50. Starting from [Kr] (Z = 36), fill in order: 5s2 (Z=38), 4d10 (Z=48), 5p2 (Z=50).

Ground state configuration: [Kr] 4d10 5s2 5p2

(A) omits the filled 4d subshell entirely. (C) incorrectly uses 5d instead of 4d. (D) omits the 5s2 electrons.` },

  { topic: '1.5', title: 'MCQ — Number of Unpaired Electrons', content:
`Which of the following choices correctly identifies the number of unpaired electrons in the ground state electron configuration for an atom of that element?

Element | Number of Unpaired Electrons
(A) S | 1
(B) Mg | 2
(C) Co | 3
(D) Ti | 4`,
    answer: `Correct answer: (C) Co, 3 unpaired electrons

Check each element's ground state configuration and apply Hund's rule:
S ([Ne] 3s2 3p4): the 3p4 electrons fill as up, up, up, then one pairs -> 2 unpaired (not 1, so A is wrong)
Mg ([Ne] 3s2): the 3s subshell is completely filled/paired -> 0 unpaired (not 2, so B is wrong)
Co ([Ar] 3d7 4s2): the 3d7 electrons fill all 5 d-orbitals singly first (5 unpaired), then 2 more electrons pair up in 2 of those orbitals, leaving 5 - 2 = 3 unpaired -> matches!
Ti ([Ar] 3d2 4s2): the 3d2 electrons occupy 2 different orbitals singly -> 2 unpaired (not 4, so D is wrong)

Only Co with 3 unpaired electrons is correctly matched.` },

  { topic: '1.5', title: 'MCQ — Ground State Configuration of Mn3+', content:
`Which of the following represents the ground state electron configuration for the Mn3+ ion?
(A) 1s2 2s2 2p6 3s2 3p6 3d5 4s2
(B) 1s2 2s2 2p6 3s2 3p6 3d2 4s2
(C) 1s2 2s2 2p6 3s2 3p6 3d3 4s1
(D) 1s2 2s2 2p6 3s2 3p6 3d4`,
    answer: `Correct answer: (D) 1s2 2s2 2p6 3s2 3p6 3d4

Neutral Mn (Z = 25): [Ar] 3d5 4s2

For transition metal cations, electrons are removed from the highest-n subshell (4s) BEFORE the 3d subshell, even though 4s filled first.

Remove 3 electrons for Mn3+: first remove both 4s electrons (2 electrons removed, 1 to go), then remove 1 electron from 3d5 -> 3d4.

Mn3+ = [Ar] 3d4 = 1s2 2s2 2p6 3s2 3p6 3d4 (note: no 4s electrons remain).` },

  { topic: '1.6', title: 'MCQ — Comparing 1s Binding Energies of He, Li, and Be', content:
`The binding energy is 2.37 MJ/mol for the 1s electrons in a helium atom. Which of the following correctly identifies the binding energy values for the 1s electrons of lithium (Li) and beryllium (Be) and provides the correct justification?

Binding Energy of 1s Electrons in Li (MJ/mol) | Binding Energy of 1s Electrons in Be (MJ/mol) | Justification
(A) 6.26 | 11.5 | Li atoms have a smaller nuclear charge than Be atoms.
(B) 6.26 | 11.5 | Be atoms experience greater electron-electron repulsions than Li atoms do.
(C) 11.5 | 6.26 | Li atoms have a smaller nuclear charge than Be atoms.
(D) 11.5 | 6.26 | Be atoms experience greater electron-electron repulsions than Li atoms do.`,
    answer: `Correct answer: (A) Li = 6.26 MJ/mol, Be = 11.5 MJ/mol; because Li atoms have a smaller nuclear charge than Be atoms.

1s binding energy increases with increasing nuclear charge (more protons pull the core electrons in more tightly), since the 1s electrons in He, Li, and Be all experience essentially the same shielding (they're the innermost electrons).

Nuclear charge order: He (Z=2) < Li (Z=3) < Be (Z=4), so binding energy must increase in that same order: 2.37 (He) < Li < Be.

This means Li's 1s BE must be less than Be's — matching 6.26 (Li) and 11.5 (Be), not the reverse (eliminates C and D).

The correct justification is the increasing nuclear charge pulling the 1s electrons in more tightly, not electron-electron repulsion (which is a much smaller effect for filled, symmetric 1s orbitals) — eliminates B.` },

  { topic: '1.6', title: 'MCQ — Identifying Peak X in the PES of Ca2+ and Ar', image: 'q8_chart.png', content:
`The photoelectron spectra of the 1s electrons of two isoelectronic species, Ca2+ and Ar, are shown above. Which of the following correctly identifies the species associated with peak X and provides a valid justification?
(A) Ar, because it has completely filled energy levels
(B) Ar, because its radius is smaller than the radius of Ca2+
(C) Ca2+, because its nuclear mass is greater than that of Ar
(D) Ca2+, because its nucleus has two more protons than the nucleus of Ar has`,
    answer: `Correct answer: (D) Ca2+, because its nucleus has two more protons than the nucleus of Ar has

Ca2+ and Ar are isoelectronic (both have 18 electrons), but Ca2+ has 20 protons while Ar has only 18. The extra nuclear charge in Ca2+ pulls all its electrons — including the 1s core electrons — in more tightly, giving Ca2+ higher binding energies for every corresponding subshell compared to Ar.

Peak X is at the higher binding energy (further left on the axis, since the axis decreases left to right), so peak X corresponds to the species with the greater nuclear charge: Ca2+.

(A) and (B) incorrectly assign peak X to Ar. (C) references nuclear MASS, which is not what determines electron binding energy — it's nuclear CHARGE (proton count) that matters, making (D) the correct justification even though (C) also names Ca2+.` },

  { topic: '1.6', title: 'MCQ — Identifying an Element from Its Complete PES', image: 'q9_chart.png', content:
`The complete photoelectron spectrum of a pure element is shown in the diagram above.
According to the complete photoelectron spectrum, which of the following is the identity of the element?
(A) lithium (Li)
(B) boron (B)
(C) carbon (C)
(D) nitrogen (N)`,
    answer: `Correct answer: (B) boron (B)

The spectrum shows three distinct peaks: one at higher binding energy (the 1s core electrons) and two peaks close together near very low binding energy (the 2s and 2p valence electrons), with the peak closest to zero binding energy shorter than the one next to it.

Peak height is proportional to the number of electrons in that subshell. The pattern here — a 1s peak, a taller 2s peak, and a shorter 2p peak — corresponds to an element with a full 1s2, full 2s2, and a partially filled 2p1: that's boron (electron configuration 1s2 2s2 2p1, 5 total electrons).

Li (1s2 2s1) would show only 2 peaks (no 2p peak at all). C (1s2 2s2 2p2) and N (1s2 2s2 2p3) would show a 2p peak taller than or equal to the 2s peak, not shorter.` },

  // ---- Topics 1.7-1.8 ----
  { topic: '1.7', title: 'MCQ — Predicting Atomic Radius and First IE of Potassium', content:
`Element | Atomic Radius | First Ionization Energy
Calcium | 194 pm | 590 kJ/mol
Potassium | – | –

Based on periodic trends and the data in the table above, which of the following are the most probable values of the atomic radius and the first ionization energy for potassium, respectively?
(A) 242 pm, 633 kJ/mol
(B) 242 pm, 419 kJ/mol
(C) 120 pm, 633 kJ/mol
(D) 120 pm, 419 kJ/mol`,
    answer: `Correct answer: (B) 242 pm, 419 kJ/mol

K is directly to the LEFT of Ca in the same period (period 4). Moving left across a period, atomic radius increases and first ionization energy decreases (less effective nuclear charge pulling on the valence electron, easier to remove).

So compared to Ca (194 pm, 590 kJ/mol), K should have:
- a LARGER atomic radius than 194 pm -> eliminates (C) and (D), which show radii smaller than Ca's
- a LOWER first ionization energy than 590 kJ/mol -> eliminates (A), which shows a higher IE than Ca's

Only (B), 242 pm and 419 kJ/mol, has both a larger radius and a lower IE than calcium.` },

  { topic: '1.7', title: 'MCQ — Higher First Ionization Energy: Cl or Ar', content:
`Which of the following correctly identifies which has the higher first-ionization energy, Cl or Ar, and supplies the best justification?
(A) Cl, because of its higher electronegativity
(B) Cl, because of its higher electron affinity
(C) Ar, because of its completely filled valence shell
(D) Ar, because of its higher effective nuclear charge`,
    answer: `Correct answer: (C) Ar, because of its completely filled valence shell

Ar has the higher first ionization energy (Ar ≈ 1521 kJ/mol vs. Cl ≈ 1251 kJ/mol) — noble gases have unusually high ionization energies because their completely filled valence shell (here, 3s2 3p6) is an especially stable, low-energy configuration that strongly resists having an electron removed.

(A) and (B) incorrectly assign the higher IE to Cl. (D) names Ar correctly but the justification is wrong — Cl actually has a slightly higher effective nuclear charge than Ar for its own valence electrons; the deciding factor here is shell stability, not effective nuclear charge.` },

  { topic: '1.7', title: 'MCQ — Comparing Periodic Properties with Correct Justification', content:
`Which of the following correctly compares periodic properties of two elements and provides an accurate explanation for that difference?
(A) The first ionization energy of Si is greater than that of C because Si has a greater number of protons in its nucleus than C has.
(B) The first ionization energy of Cl is greater than that of S because S has a higher electronegativity than Cl has.
(C) The atomic radius of Br is larger than that of Cl because Br has one more occupied electron shell, which increases the distance between the valence electrons and the nucleus.
(D) The atomic radius of Ca is smaller than that of Mg because Ca has a larger nuclear charge than Mg does.`,
    answer: `Correct answer: (C) The atomic radius of Br is larger than that of Cl because Br has one more occupied electron shell, which increases the distance between the valence electrons and the nucleus.

This statement is both factually correct (Br's radius, 114 pm, is larger than Cl's, 99 pm) and correctly explained (Br is one period below Cl, adding an entire electron shell).

(A) is false — C actually has the HIGHER first ionization energy (C is above Si in the same group; IE decreases going down a group), and more protons alone doesn't explain periodic trends without considering shielding/distance.
(B) is false — Cl has a higher electronegativity than S, not the other way around, so the justification is factually wrong.
(D) is false — Ca is below Mg in the same group, so Ca has an additional electron shell and a LARGER radius than Mg, not smaller.` },

  { topic: '1.7', title: 'MCQ — Explaining the Ionization Energy Deviation of Oxygen', content:
`Element | First Ionization Energy (kJ/mol) | Atomic Radius (pm)
B | 801 | 85
C | 1086 | 77
N | 1400 | 75
O | 1314 | 73
F | 1680 | 72
Ne | 2080 | 70

The table above shows the first ionization energy and atomic radius of several elements. Which of the following best helps to explain the deviation of the first ionization energy of oxygen from the overall trend?
(A) The atomic radius of oxygen is greater than the atomic radius of fluorine.
(B) The atomic radius of oxygen is less than the atomic radius of nitrogen.
(C) There is repulsion between paired electrons in oxygen's 2p orbitals.
(D) There is attraction between paired electrons in oxygen's 2p orbitals.`,
    answer: `Correct answer: (C) There is repulsion between paired electrons in oxygen's 2p orbitals.

The overall trend across period 2 is increasing first IE, but oxygen's IE (1314) is actually LOWER than nitrogen's (1400) — a dip in the trend.

Nitrogen's configuration is 2p3 (each of the 3 p-orbitals holds one electron, no pairing — a stable, half-filled arrangement). Oxygen's configuration is 2p4, which forces two electrons to pair up in the same p-orbital. The repulsion between these two paired electrons in the same orbital makes it easier to remove one of them, lowering oxygen's first ionization energy relative to what the trend alone would predict.

(A) and (B) are both false statements about atomic radius (radius decreases fairly steadily across the period in this data, not in the pattern described), and neither is the actual cause of the IE dip. (D) is not physically correct — paired electrons in the same orbital repel each other, they don't attract.` },

  { topic: '1.7', title: 'MCQ — Identifying an Element from Successive Ionization Energies', content:
`Ionization Energy (kJ/mol)
First: 801
Second: 2,430
Third: 3,660
Fourth: 25,000
Fifth: 32,820

The first five ionization energies of a second-period element are listed in the table above. Which of the following correctly identifies the element and best explains the data in the table?
(A) B, because it has five core electrons
(B) B, because it has three valence electrons
(C) N, because it has five valence electrons
(D) N, because it has three electrons in the p sublevel`,
    answer: `Correct answer: (B) B, because it has three valence electrons

There is a huge jump in ionization energy between the 3rd (3,660 kJ/mol) and 4th (25,000 kJ/mol) ionization — nearly a 7-fold increase, far larger than the jumps between the other successive ionizations. This kind of large jump occurs when an electron must be removed from a full inner (core) shell after all the valence electrons have already been removed.

A jump after removing the 3rd electron means the element has exactly 3 valence electrons — this matches boron (B), configuration [He] 2s2 2p1, which has 3 valence electrons (2s2 2p1) and 2 core electrons (1s2).

(A) is the correct element but the wrong reasoning (B actually has only 2 core electrons, not 5). (C) and (D) misidentify the element — nitrogen has 5 valence electrons and would show a large jump after the 5th ionization, not the 3rd.` },

  { topic: '1.7', title: 'MCQ — Comparing Reactivity of K and Ca with Water', content:
`2 K(s) + 2 H2O(l) -> 2 KOH(aq) + H2(g)
Ca(s) + 2 H2O(l) -> Ca(OH)2(aq) + H2(g)

Both K(s) and Ca(s) react with water according to the equations shown above. Which of the following identifies the element that reacts more vigorously with water and provides the correct justification?

Element that reacts more vigorously with water | Justification
(A) K | The first ionization energy of K is less than that of Ca.
(B) K | In aqueous solution, the attraction between K+(aq) and H2O molecules is stronger than the attraction between Ca2+(aq) and H2O molecules.
(C) Ca | The first ionization energy of K is less than that of Ca.
(D) Ca | In aqueous solution, the attraction between Ca2+(aq) and H2O molecules is stronger than the attraction between K+(aq) and H2O molecules.`,
    answer: `Correct answer: (A) K; the first ionization energy of K is less than that of Ca.

K reacts more vigorously with water than Ca does. Both reactions involve the metal losing electrons (being oxidized) to water; the more easily a metal gives up its valence electron(s), the more vigorously/readily the reaction proceeds.

K's first ionization energy (~419 kJ/mol) is lower than Ca's (~590 kJ/mol), meaning K loses its valence electron more easily. This directly explains why K reacts more vigorously.

(B) describes an ion-water attraction (relevant to solubility/hydration energy), not to how readily the metal is oxidized in the first place, so it isn't the best justification for reaction vigor. (C) and (D) incorrectly identify Ca as more reactive.` },

  { topic: '1.8', title: 'MCQ — Predicting a Compound with Similar Properties to CaCl2', content:
`Appearance: white powder
Solubility: 75 g CaCl2 per 100 mL H2O
Melting point: 772°C

Properties of the compound CaCl2 are listed in the table above. On the basis of periodic properties, which of the following compounds should have properties that are most similar to those of CaCl2?
(A) SCl2
(B) BaCl2
(C) BCl3
(D) CCl4`,
    answer: `Correct answer: (B) BaCl2

CaCl2 is an ionic compound (Ca2+ and Cl- ions), which explains its properties: white solid, water-soluble, and a very high melting point (strong ionic lattice).

Ba is directly below Ca in Group 2, so it forms an analogous ionic compound with the same 2:1 chloride stoichiometry and similar ionic character: BaCl2. Same group, same charge, same bonding type -> most similar properties.

S, B, and C are all much closer to (or in) the nonmetal region of the periodic table, forming covalent (molecular) chlorides (SCl2, BCl3, CCl4) rather than ionic ones — these would have very different properties (low melting points, often liquids/gases or low-melting solids, not necessarily water-soluble in the same way).` },

  { topic: '1.8', title: 'MCQ — Identifying Compounds with Similar Chemical Properties', content:
`Based on the positions of elements in the periodic table, which of the following pairs contains compounds that are most likely to have similar chemical properties?
(A) SeO2 and TiO2
(B) CaC2 and CaF2
(C) MgCl2 and MgBr2
(D) ScCl3 and PCl3`,
    answer: `Correct answer: (C) MgCl2 and MgBr2

For two compounds to have genuinely similar chemical properties, it helps most when they share the same cation AND their anions come from the same group (so the anions themselves behave similarly).

MgCl2 and MgBr2 share the same cation (Mg2+) and their anions, Cl- and Br-, are both halides from the same group (Group 17) — both are simple ionic compounds with a 2:1 (cation:anion) formula and very similar bonding/solubility behavior.

(A) Se (group 16) and Ti (group 4) are in completely different groups/types (nonmetal vs. transition metal), so SeO2 and TiO2 have quite different bonding character.
(B) CaC2 (calcium carbide, containing the C2^2- carbide ion) and CaF2 (an ionic halide) have very different anion types despite sharing Ca2+ — carbide chemistry is very different from simple halide chemistry.
(D) Sc (a metal, group 3) and P (a nonmetal, group 15) form chlorides with very different bonding character (ScCl3 is largely ionic, PCl3 is covalent/molecular) — not analogous.` },
];

async function main() {
  const { data: existing } = await sb.from('questions').select('id, topic_id, order_index');
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0;
  for (const q of questions) {
    const topicId = TOPICS[q.topic];
    const orderIndex = (maxOrderByTopic[topicId] ?? -1) + 1;
    maxOrderByTopic[topicId] = orderIndex;

    const { error } = await sb.from('questions').insert({
      title: q.title,
      content: q.content + JUSTIFY,
      topic_id: topicId,
      order_index: orderIndex,
      image_url: q.image ? BASE + q.image : null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); continue; }
    inserted++;
    console.log(`[${inserted}/${questions.length}] ${q.title} (topic ${q.topic}) ... inserted`);
  }
  console.log(`\nDone. ${inserted}/${questions.length} inserted.`);
}

main();
