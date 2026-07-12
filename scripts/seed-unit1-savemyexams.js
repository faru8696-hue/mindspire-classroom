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
  '1.1': 'ec60f130-1cd7-4ca0-b86b-41b3ee5ca1bd',
  '1.2': 'ba0fae17-c9f6-4831-9df6-e22853ca073d',
  '1.3': '0bd727cf-8dd4-4e6a-90e3-ff35f0e4cc11',
  '1.4': '12b9dc45-8184-4302-8244-7234e28e05a5',
  '1.5': 'f9052a5f-1a96-4070-89a3-000d05c2bdc4',
  '1.6': '08497fdf-0b09-44c4-992b-27a3912b77bd',
  '1.7': '616020e0-79a3-47fe-baef-f3669e1b3193',
  '1.8': 'af121e66-0dae-4143-81ca-312b863a918c',
};

// mcq: true adds the justify-in-writing instruction. Every question below was
// independently re-verified (not copied blindly from the SaveMyExams answer
// keys) — several source errors were caught and fixed here: a mislabeled
// Law-of-Definite-Proportions question (H2S vs "oxygen"), an internally
// inconsistent ionization-energy identity question (X/Y data didn't match
// the stated answer — replaced with real Si/C data), a maltose mass
// conversion off by 10x with no correct option (replaced with correct
// options), an FRQ needing a molar mass never given in its own stem (added
// it), and a sample-mass inconsistency (1.00 g vs an undeclared 1.20 g —
// unified to 1.00 g). A handful of sub-questions requiring reaction
// stoichiometry, limiting reactants, or molarity were dropped entirely —
// those are later-unit topics, not Unit 1.
const questions = [

// ============================================================
// 1.1 Moles and Molar Mass
// ============================================================
{ topic: '1.1', mcq: true, title: 'MCQ — Moles of Ethane in a Sample', content:
`How many moles of ethane (C2H6) are there in 5.3 g of ethane?
(A) 1.8 x 10^-1 mol
(B) 5.7 mol
(C) 18 mol
(D) 57 mol`,
  answer: `Correct answer: (A) 1.8 x 10^-1 mol
Molar mass C2H6 = 2(12.01) + 6(1.008) = 30.07 g/mol
mol = 5.3 g / 30.07 g/mol = 0.176 mol = 1.8 x 10^-1 mol` },

{ topic: '1.1', mcq: true, title: 'MCQ — Molar Mass of Ammonium Sulfate', content:
`To two decimal places, what is the molar mass of (NH4)2SO4?
(A) 114.10 g/mol
(B) 132.14 g/mol
(C) 118.13 g/mol
(D) 160.16 g/mol`,
  answer: `Correct answer: (B) 132.14 g/mol
2N = 2(14.01) = 28.02
8H = 8(1.008) = 8.064
S = 32.06
4O = 4(16.00) = 64.00
Total = 28.02 + 8.064 + 32.06 + 64.00 = 132.14 g/mol` },

{ topic: '1.1', mcq: true, title: 'MCQ — Mass of One Calcium Atom', content:
`The mass of one atom of calcium is
(A) 3.32 x 10^23 g
(B) 6.66 x 10^-23 g
(C) 2.41 x 10^25 g
(D) 1.20 x 10^25 g`,
  answer: `Correct answer: (B) 6.66 x 10^-23 g
mass of 1 atom = molar mass / Avogadro's number = 40.08 g/mol / 6.022 x 10^23 /mol = 6.656 x 10^-23 g` },

{ topic: '1.1', mcq: true, title: 'MCQ — Molecules of Propane in a Sample', content:
`How many molecules of propane (C3H8) does a 23.0 g sample of propane contain?
(A) 8.66 x 10^-25
(B) 1.15 x 10^24
(C) 3.74 x 10^23
(D) 3.14 x 10^23`,
  answer: `Correct answer: (D) 3.14 x 10^23
Molar mass C3H8 = 3(12.01) + 8(1.008) = 44.09 g/mol
mol = 23.0 / 44.09 = 0.5217 mol
molecules = 0.5217 x 6.022 x 10^23 = 3.14 x 10^23` },

{ topic: '1.1', mcq: true, title: 'MCQ — Iron Atoms in a Mole of Fe2O3', content:
`How many atoms of iron are in 1 mole of Fe2O3?
(A) 6.022 x 10^23
(B) 1.807 x 10^23
(C) 1.204 x 10^24
(D) 3.011 x 10^24`,
  answer: `Correct answer: (C) 1.204 x 10^24
Each formula unit of Fe2O3 contains 2 Fe atoms, so 1 mole of Fe2O3 contains 2 moles of Fe atoms.
2 x 6.022 x 10^23 = 1.204 x 10^24 Fe atoms` },

{ topic: '1.1', mcq: true, title: 'MCQ — Sample with the Greatest Number of Moles', content:
`Which sample contains the greatest number of moles?
(A) 1 g of methanal, CH2O
(B) 2 g of carbon dioxide, CO2
(C) 3 g of sulfur, S6
(D) 4 g of bromine, Br2`,
  answer: `Correct answer: (B) 2 g of CO2

CH2O: 1 / 30.03 = 0.0333 mol
CO2: 2 / 44.01 = 0.0454 mol
S6: 3 / 192.36 = 0.0156 mol
Br2: 4 / 159.80 = 0.0250 mol

CO2 gives the greatest number of moles.` },

{ topic: '1.1', mcq: true, title: 'MCQ — Moles in a Small Number of Gold Atoms', content:
`How many moles are in 860 atoms of gold?
(A) 5.18 x 10^26 mol
(B) 1.43 x 10^-21 mol
(C) 4.37 mol
(D) 0.23 mol`,
  answer: `Correct answer: (B) 1.43 x 10^-21 mol
mol = 860 / 6.022 x 10^23 = 1.43 x 10^-21 mol` },

{ topic: '1.1', mcq: true, title: 'MCQ — Mass from a Given Number of Cl2 Particles', content:
`What is the mass of 8.54 x 10^20 particles of Cl2?
(A) 0.05 g
(B) 2.00 x 10^-5 g
(C) 1.42 x 10^-3 g
(D) 0.10 g`,
  answer: `Correct answer: (D) 0.10 g
mol = 8.54 x 10^20 / 6.022 x 10^23 = 1.418 x 10^-3 mol
mass = 1.418 x 10^-3 mol x 70.90 g/mol = 0.10 g` },

{ topic: '1.1', mcq: true, title: 'MCQ — Greatest Mass at Equal Molecule Count', content:
`Each sample below contains the same number of molecules (1.204 x 10^23), at the same temperature and pressure. Which sample has the greatest mass?
(A) CO
(B) NH3
(C) CH4
(D) H2O`,
  answer: `Correct answer: (A) CO
1.204 x 10^23 molecules = 0.20 mol for every sample.
CO: 0.20 x 28.01 = 5.60 g
H2O: 0.20 x 18.02 = 3.60 g
CH4: 0.20 x 16.04 = 3.21 g
NH3: 0.20 x 17.03 = 3.41 g
CO has the greatest molar mass of the four, so it has the greatest mass at equal moles.` },

{ topic: '1.1', mcq: true, title: 'MCQ — Sample with the Greatest Number of Atoms', content:
`Which sample contains the greatest number of atoms?
(A) 0.30 mol of P2O5
(B) 0.40 mol of CuSO4 . 5H2O
(C) 0.50 mol of CH3COOH
(D) 0.90 mol of H2O`,
  answer: `Correct answer: (B) 0.40 mol of CuSO4 . 5H2O
Atoms per formula unit: P2O5 = 7, CuSO4.5H2O = 1+1+4+10+5 = 21, CH3COOH = 8, H2O = 3.
Total atoms = moles x atoms/unit:
P2O5: 0.30 x 7 = 2.1
CuSO4.5H2O: 0.40 x 21 = 8.4
CH3COOH: 0.50 x 8 = 4.0
H2O: 0.90 x 3 = 2.7
CuSO4.5H2O gives the most atoms.` },

{ topic: '1.1', mcq: true, title: 'MCQ — Number of Ions in Ammonium Phosphate', content:
`The number of ions present in 0.02 mol of (NH4)3PO4 is
(A) 8.0 x 10^-2
(B) 1.2 x 10^22
(C) 4.8 x 10^22
(D) 2.4 x 10^23`,
  answer: `Correct answer: (C) 4.8 x 10^22
(NH4)3PO4 dissociates into 3 NH4+ ions and 1 PO4^3- ion = 4 ions per formula unit.
mol ions = 0.02 x 4 = 0.08 mol
number of ions = 0.08 x 6.022 x 10^23 = 4.8 x 10^22` },

{ topic: '1.1', mcq: true, title: 'MCQ — Oxygen Atoms in a Mass of CO2', content:
`The number of oxygen atoms in 88.0 g of CO2 is
(A) 3.01 x 10^23
(B) 1.20 x 10^24
(C) 2.41 x 10^24
(D) 4.82 x 10^24`,
  answer: `Correct answer: (C) 2.41 x 10^24
mol CO2 = 88.0 / 44.01 = 2.00 mol
mol O = 2.00 x 2 = 4.00 mol
atoms O = 4.00 x 6.022 x 10^23 = 2.41 x 10^24` },

{ topic: '1.1', mcq: true, title: 'MCQ — Atoms and Mass in a Maltose Granule', content:
`A granule contains 1.5 x 10^18 molecules of maltose, C12H22O11. How many atoms are in the granule, and what is the mass of the granule in milligrams?
(A) 6.75 x 10^19 atoms and 0.85 mg
(B) 1.5 x 10^18 atoms and 0.85 mg
(C) 6.75 x 10^19 atoms and 8.5 mg
(D) 1.5 x 10^18 atoms and 8.5 x 10^-4 mg`,
  answer: `Correct answer: (A) 6.75 x 10^19 atoms and 0.85 mg

Atoms: C12H22O11 has 12+22+11 = 45 atoms per molecule.
45 x 1.5 x 10^18 = 6.75 x 10^19 atoms

Mass: mol = 1.5 x 10^18 / 6.022 x 10^23 = 2.49 x 10^-6 mol
molar mass C12H22O11 = 342.30 g/mol
mass = 2.49 x 10^-6 mol x 342.30 g/mol = 8.53 x 10^-4 g = 0.85 mg (converting g to mg multiplies by 1000, not 10,000)` },

{ topic: '1.1', mcq: true, title: 'MCQ — Molecules of Butane in a Gas Cylinder', content:
`A gas cylinder for a portable heater contains 13 kg of butane. How many butane molecules are in the gas cylinder?
(A) 1.35 x 10^26
(B) 2.69 x 10^24
(C) 1.40 x 10^26
(D) 3.72 x 10^-22`,
  answer: `Correct answer: (A) 1.35 x 10^26
Molar mass C4H10 = 58.12 g/mol
mol = 13000 g / 58.12 g/mol = 223.7 mol
molecules = 223.7 x 6.022 x 10^23 = 1.35 x 10^26` },

{ topic: '1.1', mcq: true, title: 'MCQ — Substance with the Greatest Number of Moles', content:
`Which substance contains the greatest number of moles?
(A) 3.00 g of ammonia, NH3
(B) 3.00 g of chloromethane, CH3Cl
(C) 4.00 g of hydrogen sulfide, H2S
(D) 3.50 g of hydrogen chloride, HCl`,
  answer: `Correct answer: (A) 3.00 g of NH3
NH3: 3.00/17.03 = 0.176 mol
CH3Cl: 3.00/50.48 = 0.059 mol
H2S: 4.00/34.08 = 0.117 mol
HCl: 3.50/36.46 = 0.096 mol
NH3 has the greatest number of moles.` },

{ topic: '1.1', title: 'FRQ — Moles, Molecules, and Atoms in a Water Sample', content:
`A container holds 4.5 g of water (H2O).
(a) Calculate the number of moles of water in the container.
(b) Calculate the total number of water molecules in the sample.
(c) Determine the total number of hydrogen atoms in the sample.
(d) Determine the ratio of oxygen atoms to hydrogen atoms in the sample.`,
  answer: `(a) mol H2O = 4.5 g / 18.02 g/mol = 0.250 mol

(b) molecules = 0.250 mol x 6.022 x 10^23 = 1.51 x 10^23 molecules

(c) Each H2O molecule has 2 H atoms: H atoms = 2 x 1.51 x 10^23 = 3.01 x 10^23

(d) Every H2O molecule has exactly 1 O atom and 2 H atoms, so the ratio of O:H atoms is 1:2 regardless of sample size.` },

{ topic: '1.1', title: 'FRQ — Finding the Formula of a Hydrated Salt', content:
`A sample of a hydrated salt, MgSO4 . xH2O, is heated to remove all the water of crystallization, leaving an anhydrous salt.
Mass of hydrated salt: 4.93 g
Mass of anhydrous MgSO4: 2.41 g

(a) Calculate the mass of water lost during heating.
(b) Calculate the number of moles of water lost.
(c) Determine the number of water molecules (x) in the formula of the hydrated salt.`,
  answer: `(a) mass H2O lost = 4.93 g - 2.41 g = 2.52 g

(b) mol H2O = 2.52 g / 18.02 g/mol = 0.140 mol

(c) mol MgSO4 = 2.41 g / 120.37 g/mol = 0.0200 mol
x = mol H2O / mol MgSO4 = 0.140 / 0.0200 = 7

The hydrate is MgSO4 . 7H2O (Epsom salt).` },

{ topic: '1.1', title: 'FRQ — Estimating the Size of a Copper Atom', content:
`A student investigates a rectangular sheet of copper to estimate the size of a copper atom. The sheet has a mass of 2.54 g, dimensions 10.0 cm x 5.00 cm, and a thickness of 5.0 x 10^-3 cm. The density of copper is 8.96 g/cm3.

(a) Calculate the number of copper atoms in the sheet.
(b) i) Calculate the volume of the copper sheet, in cm3.
    ii) Use your answers from (a) and (b)(i) to determine the number of copper atoms per cubic centimeter.
(c) The student models copper atoms as identical cubes stacked with no gaps between them (a simple cubic packing model), each occupying an equal volume.
    i) Calculate the volume, in cm3, occupied by a single atom under this model.
    ii) Use your answer from (c)(i) to estimate the edge length of the cube occupied by one copper atom, in picometers (1 cm = 10^10 pm).
(d) The accepted atomic radius of copper is 128 pm. Does the estimate from (c)(ii) support the accepted atomic radius? Use a claim-evidence-reasoning structure in your answer.
(e) In reality, atoms in a metal are packed as touching spheres, not cubes with no gaps — real close-packed metal structures fill about 74% of space, versus 100% for the simple-cube model used here. Explain how this modeling assumption affects the accuracy of the estimated atomic size compared to the actual atomic radius.`,
  answer: `(a) mol = 2.54 g / 63.55 g/mol = 0.03998 mol
atoms = 0.03998 x 6.022 x 10^23 = 2.41 x 10^22 atoms

(b) i) volume = 10.0 cm x 5.00 cm x 5.0 x 10^-3 cm = 0.250 cm3
   ii) atoms/cm3 = 2.41 x 10^22 / 0.250 cm3 = 9.64 x 10^22 atoms/cm3

(c) i) volume/atom = 1 / 9.64 x 10^22 = 1.037 x 10^-23 cm3
   ii) edge length = (1.037 x 10^-23)^(1/3) = 2.18 x 10^-8 cm = 218 pm

(d) Claim: The estimate (218 pm) does not match the accepted atomic radius (128 pm) — it's substantially larger.
Reasoning: A simple-cube packing model with no gaps between atoms overestimates the volume each atom effectively occupies, because real atoms are spherical and pack together less efficiently than solid cubes filling 100% of space, so the model's implied atomic size comes out too large.

(e) Because real metals pack atoms as touching spheres (about 74% space-filling) rather than gapless cubes (100% space-filling), the simple-cube model assigns each atom more "personal" volume than it really has. This inflates the calculated edge length/radius, which is exactly why the model's 218 pm estimate overshoots copper's true 128 pm atomic radius — accounting for the actual (less efficient) packing would shrink the estimated volume per atom and bring the estimate closer to 128 pm.` },

{ topic: '1.1', title: 'FRQ — Empirical Formula from Percent Composition', content:
`A 50.0 g sample of a compound contains 40.0% carbon, 6.7% hydrogen, and 53.3% oxygen by mass.

(a) Calculate the number of moles of each element in the sample.
(b) Determine the simplest whole-number ratio of the elements and state the empirical formula of the compound.`,
  answer: `(a) mass C = 0.400 x 50.0 = 20.0 g -> mol C = 20.0/12.01 = 1.665 mol
mass H = 0.067 x 50.0 = 3.35 g -> mol H = 3.35/1.008 = 3.324 mol
mass O = 0.533 x 50.0 = 26.65 g -> mol O = 26.65/16.00 = 1.666 mol

(b) Divide each by the smallest (1.665):
C: 1.665/1.665 = 1
H: 3.324/1.665 = 2
O: 1.666/1.665 = 1

Empirical formula: CH2O` },

// ============================================================
// 1.2 Mass Spectroscopy of Elements
// ============================================================
{ topic: '1.2', mcq: true, title: 'MCQ — Identifying Element X from a Mass Spectrum', content:
`The mass spectrum of element X shows three peaks:
m/z = 70, relative abundance ~ medium height
m/z = 71, relative abundance ~ tallest peak
m/z = 72, relative abundance ~ shortest peak

Which of the following is true?
(A) Element X is germanium.
(B) X has a relative atomic mass between 71 and 72.
(C) The most abundant isotope of X contains a total of 71 protons and neutrons.
(D) The abundance of 72X is greater than the abundance of 70X.`,
  answer: `Correct answer: (C) The most abundant isotope of X contains a total of 71 protons and neutrons.

The tallest peak (most abundant isotope) is at m/z = 71, and mass number = protons + neutrons, so this isotope has 71 total protons and neutrons.

(A) is wrong — germanium's real atomic mass (72.6) can't come from isotopes topping out at 72. (B) is wrong — since the dominant peak (71) is flanked by a taller-than-72 peak at 70, the weighted average is pulled below 71, not above it. (D) is wrong — the 70 peak is described as taller than the 72 peak.` },

{ topic: '1.2', mcq: true, title: 'MCQ — Average Atomic Mass from Three Isotopes', content:
`Element Z has three isotopes: 70Z, 72Z and 74Z, with natural abundances of 24.4%, 32.4%, and 43.2% respectively. What is the average atomic mass of element Z?
(A) 72.38 amu
(B) 72.00 amu
(C) 72.22 amu
(D) 72.16 amu`,
  answer: `Correct answer: (A) 72.38 amu
(70 x 0.244) + (72 x 0.324) + (74 x 0.432)
= 17.08 + 23.328 + 31.968
= 72.376 amu, which rounds to 72.38 amu.` },

{ topic: '1.2', mcq: true, title: 'MCQ — Solving for Isotope Percentage in Neon', content:
`A sample of neon contains the isotopes 20Ne and 21Ne. The average atomic mass of the sample is 20.2. What is the percentage of 21Ne atoms in the sample?
(A) 8.0%
(B) 20%
(C) 80%
(D) 92%`,
  answer: `Correct answer: (B) 20%
Let x = fraction of 21Ne. Then (1-x) = fraction of 20Ne.
21x + 20(1-x) = 20.2
20 + x = 20.2
x = 0.20 = 20%

Check: (21 x 0.20) + (20 x 0.80) = 4.2 + 16.0 = 20.2 amu. Matches.` },

{ topic: '1.2', mcq: true, title: 'MCQ — Relative Atomic Mass from Two Isotopes', content:
`An element consists of two isotopes, 69X and 71X, with abundances of 60% and 40% respectively. What is the relative atomic mass of element X?
(A) 69.2
(B) 69.8
(C) 70.0
(D) 70.2`,
  answer: `Correct answer: (B) 69.8
(69 x 0.60) + (71 x 0.40) = 41.4 + 28.4 = 69.8 amu` },

{ topic: '1.2', mcq: true, title: 'MCQ — Average Atomic Mass of Iron from Four Isotopes', content:
`Iron has several naturally occurring isotopes:
54Fe: 5.845%, mass 53.9396 amu
56Fe: 91.754%, mass 55.9349 amu
57Fe: 2.119%, mass 56.9354 amu
58Fe: 0.282%, mass 57.9333 amu

What is the average atomic mass of iron?
(A) 56.1858 amu
(B) 54.200 amu
(C) 59.270 amu
(D) 55.845 amu`,
  answer: `Correct answer: (D) 55.845 amu
(53.9396 x 0.05845) + (55.9349 x 0.91754) + (56.9354 x 0.02119) + (57.9333 x 0.00282)
= 3.153 + 51.324 + 1.207 + 0.163
= 55.847 amu, which rounds to 55.845 amu (the accepted value for iron).` },

{ topic: '1.2', mcq: true, title: 'MCQ — Solving for Two Unknown Isotope Abundances of Strontium', content:
`A sample of strontium is analyzed by mass spectrometry:
m/z = 84, abundance 0.56%
m/z = 86, abundance unknown
m/z = 87, abundance unknown
m/z = 88, abundance 82.58%

Strontium has a relative atomic mass of 87.71. Which percentage abundance values are correct for strontium-86 and strontium-87, respectively?
(A) 6.86% and 9.86%
(B) 9.90% and 6.96%
(C) 7.00% and 9.54%
(D) 8.67% and 8.19%`,
  answer: `Correct answer: (B) 9.90% and 6.96%
Check: (84 x 0.56) + (86 x 9.90) + (87 x 6.96) + (88 x 82.58), all divided by 100:
= (47.04 + 851.4 + 605.52 + 7267.04) / 100
= 8771.00 / 100
= 87.71 amu, matching the given relative atomic mass exactly.` },

{ topic: '1.2', mcq: true, title: 'MCQ — Reasoning About Charge, Mass, and m/z', content:
`The mass spectrum of element X shows four peaks at m/z = 12, 24, 25, and 26. Which of the following statements is/are correct?
1. The peak at m/z = 12 is due to a 24X2+ ion.
2. The peak at m/z = 12 is due to an ion with a total of 12 neutrons and protons.
3. The relative atomic mass of element X will be between 12 and 24.
(A) 1, 2 and 3
(B) Only 1 and 2
(C) Only 2 and 3
(D) Only 1`,
  answer: `Correct answer: (D) Only 1

Statement 1 is TRUE: a 24X2+ ion has m/z = 24/2 = 12, which explains the m/z=12 peak without needing a separate isotope of mass 12.
Statement 2 is FALSE: the ion producing that peak actually has a mass of 24 (not 12) — the m/z value is halved by the 2+ charge, it doesn't mean the ion itself has 12 total protons and neutrons.
Statement 3 is FALSE: since 24 is the (implied) most abundant/base isotope and heavier isotopes (25, 26) also exist, the weighted average atomic mass must be at or above 24, not between 12 and 24.` },

{ topic: '1.2', title: 'FRQ — Carbon-14, Relative Atomic Mass, and Radiocarbon Dating', content:
`Carbon-14 is a radioactive isotope used in carbon dating. The mass spectrum of a carbon sample shows two peaks: m/z = 12 with abundance 98.93%, and m/z = 14 with abundance 1.07%.

(a) Explain the significance of the relative heights of the peaks in the mass spectrum.
(b) Calculate the relative atomic mass of carbon in this sample.
(c) Carbon-14 is present in very small amounts in nature compared to Carbon-12. Explain why this low abundance does not prevent it from being used to date ancient artifacts.`,
  answer: `(a) The height (or area) of each peak represents the relative abundance of that isotope. The tall peak at m/z=12 shows that 12C is by far the most abundant isotope (98.93%), while the very short peak at m/z=14 shows 14C is naturally very rare (1.07%).

(b) Ar = (12.00 x 98.93 + 14.00 x 1.07) / 100 = (1187.16 + 14.98)/100 = 12.02

(c) Because 14C is radioactive, it can be detected and measured with great precision (down to extremely small quantities, on the order of parts per trillion) using techniques like mass spectrometry — its radioactivity itself is the detection signal, so even a tiny natural abundance is still usable for dating.` },

{ topic: '1.2', title: 'FRQ — Relative Atomic Mass of Copper', content:
`The mass spectrum of copper shows two peaks at m/z = 63 and m/z = 65, with relative abundances of 69.15% and 30.85% respectively.

(a) Define the term "relative atomic mass."
(b) Use the given data to calculate the relative atomic mass of copper.
(c) Describe what the expected mass spectrum for copper would look like — state the two m/z values and describe the relative heights of the two peaks.`,
  answer: `(a) Relative atomic mass is the weighted average of the masses of all naturally occurring isotopes of an element, measured relative to 1/12 the mass of a carbon-12 atom.

(b) Ar Cu = (63 x 69.15 + 65 x 30.85) / 100 = (4356.45 + 2005.25)/100 = 63.62

(c) Two peaks, at m/z = 63 and m/z = 65. The peak at m/z = 63 would be noticeably taller (roughly twice the height) of the peak at m/z = 65, since 63Cu (69.15%) is more than twice as abundant as 65Cu (30.85%).` },

{ topic: '1.2', title: 'FRQ — Isotopes of Neon and Sample Enrichment', content:
`The mass spectrum of neon shows three peaks:
20Ne: 90.48%
21Ne: 0.27%
22Ne: 9.25%

(a) What does the presence of three peaks in the mass spectrum indicate about neon?
(b) Calculate the relative atomic mass of neon using the given data.
(c) A scientist claims a certain sample of neon has been artificially enriched in 22Ne. Explain how the mass spectrum of such an enriched sample would differ from that of natural neon.`,
  answer: `(a) It indicates that neon has three naturally occurring isotopes (20Ne, 21Ne, and 22Ne).

(b) Ar Ne = (20 x 90.48 + 21 x 0.27 + 22 x 9.25) / 100
= (1809.6 + 5.67 + 203.5) / 100 = 2018.77/100 = 20.19

(c) In an enriched sample, the relative abundance (and thus peak height) of 22Ne would be significantly greater than 9.25%, meaning the peak at m/z = 22 would appear noticeably taller than it does in the natural sample, likely at the expense of the 20Ne peak's relative height.` },

{ topic: '1.2', title: 'FRQ — Identifying, Enriching, and Authenticating a Metal Sample by Mass Spectrometry', content:
`A sample of a metallic element M is analyzed by mass spectrometry, showing two peaks: m/z = 63 (69.1% abundance) and m/z = 65 (30.9% abundance).

(a) Identify which isotope of element M has more neutrons. Justify your answer.
(b) Calculate the average atomic mass of element M based on the spectrum data.
(c) Use your result from (b) to determine the identity of element M. Justify your answer.
(d) Compare the number of protons, neutrons, and electrons in isotopes M-63 and M-65.
(e) Explain why the average atomic mass of an element can vary slightly between samples from different sources.
(f) A student suggests this spectrum might come from a mixture of two different elements rather than one element's isotopes. Explain whether the spectrum supports this claim.
(g) The sample is artificially enriched so that M-65 makes up 90% of the abundance (with M-63 the remaining 10%). Calculate the new average atomic mass.
(h) A coin claimed to be ancient is made from element M. Its mass spectrum shows m/z=63 at 60.0% abundance and m/z=65 at 40.0% abundance. Is the coin likely to be genuine? Justify your reasoning.
(i) A chemist compares two samples of an unknown transition metal J: one made entirely of isotope J-50, the other entirely of isotope J-52. Both are used to make the oxide J2O3.
    i) Calculate the molar mass of J2O3 for each sample, and determine the difference between them.
    ii) Explain why this difference could matter in analytical chemistry.`,
  answer: `(a) M-65, because both isotopes of the same element have the same number of protons, and M-65's greater mass number means it must have more neutrons than M-63.

(b) (0.691 x 63) + (0.309 x 65) = 43.53 + 20.09 = 63.62 amu

(c) Copper (Cu) — copper's accepted average atomic mass is approximately 63.55 amu, closely matching the calculated 63.62 amu.

(d) Both isotopes have the same number of protons (29) and electrons (29, in the neutral atom); M-65 has 2 more neutrons than M-63 (36 vs. 34).

(e) Very slight natural variation in isotope ratios can occur between samples due to different environmental, geological, or industrial processes the material has been through, which can shift the local isotope abundance slightly.

(f) The spectrum supports a single element with two isotopes, not a mixture of two elements: the two peaks are spaced by exactly 2 amu (consistent with two isotopes differing by 2 neutrons), and there is no evidence (no unexpected extra peaks) of a second, different element being present.

(g) New average = (0.10 x 63) + (0.90 x 65) = 6.3 + 58.5 = 64.8 amu

(h) The coin is likely NOT genuine (or not made from natural copper) — its isotope ratio (60% M-63 : 40% M-65) deviates significantly from copper's natural ratio (about 69% : 31%), which strongly suggests the metal was processed, enriched, or synthesized rather than being naturally occurring ancient copper.

(i) i) Molar mass of J2O3 = 2(mass of J) + 3(16.00)
   With J-50: 2(50) + 48 = 148.0 g/mol
   With J-52: 2(52) + 48 = 152.0 g/mol
   Difference = 152.0 - 148.0 = 4.0 g/mol
   ii) Even a small difference in molar mass (4.0 g/mol here) can meaningfully affect precise quantitative work — calculating percent yield, identifying the limiting reagent, or assessing purity all depend on accurate molar mass, so using the wrong isotope's mass could introduce systematic error into those calculations.` },

{ topic: '1.2', title: 'FRQ — Analyzing a Simulated 5-Isotope Spectrum', content:
`A student analyzes a metallic sample believed to contain only one element, Q. The mass spectrum shows five peaks:
m/z = 62, 43.5%
m/z = 64, 26.0%
m/z = 66, 17.5%
m/z = 67, 7.5%
m/z = 68, 5.5%

The student suspects the metal is zinc or germanium.

(a) Based on the spectrum, how many isotopes of the element are present?
(b) Explain how the student can tell the sample contains only one element (not a mixture of elements).
(c) i) Use the mass spectral data to calculate the average atomic mass of element Q.
    ii) The 62.0 amu isotope has the highest relative abundance. Explain how this affects the calculated average atomic mass.
(d) A sample of Q has a mass of 1.91 g.
    i) Calculate the number of moles in the sample.
    ii) Calculate the total number of atoms in the sample.
(e) Q forms a Q2+ ion and reacts with chlorine gas.
    i) Write a balanced equation for the reaction between the metal and chlorine gas.
    ii) Determine the empirical formula of the compound formed.
    iii) Predict the type of bonding in this compound and justify your answer.`,
  answer: `(a) 5 isotopes are present (5 distinct peaks).

(b) The peaks are evenly/closely spaced by whole-number mass differences, consistent with isotopes of a single element rather than several unrelated elements; there's no indication of a second, unrelated set of peaks that would suggest a different element is present.

(c) i) (62.0 x 0.435) + (64.0 x 0.260) + (66.0 x 0.175) + (67.0 x 0.075) + (68.0 x 0.055)
     = 26.97 + 16.64 + 11.55 + 5.025 + 3.74 = 63.93 amu
   ii) Because the lightest isotope (62.0 amu) is also the most abundant, it pulls the weighted average down, making the calculated average atomic mass closer to 62.0 amu than a simple (unweighted) average of all 5 masses would be.

(d) i) mol = 1.91 g / 63.93 g/mol = 0.0299 mol
   ii) atoms = 0.0299 mol x 6.022 x 10^23 = 1.80 x 10^22 atoms

(e) i) Q(s) + Cl2(g) -> QCl2(s)
   ii) QCl2
   iii) Ionic bonding — Q is a metal (forms a cation, Q2+) and chlorine is a nonmetal (forms the anion, Cl-), and metal-nonmetal combinations characteristically form ionic compounds.` },

{ topic: '1.2', title: 'FRQ — Solving for an Unknown Isotope of Cerium', content:
`A sample of cerium (Ce) shows four isotopes in its mass spectrum. Data for three of them:
136Ce: isotopic mass 136 amu, relative abundance 0.19%
138Ce: isotopic mass 138 amu, relative abundance 0.25%
140Ce: isotopic mass 140 amu, relative abundance 88.45%

The sample's average atomic mass is 140.12 amu. The isotopic mass and relative abundance of the fourth isotope are unknown.

(a) Explain how a mass spectrum can provide information about the isotopes of an element and their relative abundances.
(b) Using the data provided, calculate the isotopic mass and the relative abundance of the fourth isotope.`,
  answer: `(a) The number of peaks in the spectrum shows how many isotopes are present, and the height (or area) of each peak shows the relative abundance of that isotope — taller peaks correspond to more abundant isotopes.

(b) The abundance of the fourth isotope = 100% - (0.19% + 0.25% + 88.45%) = 11.11%

Set up the weighted average equation, with m = the unknown isotopic mass:
140.12 = [(136 x 0.19) + (138 x 0.25) + (140 x 88.45) + (m x 11.11)] / 100

(136 x 0.19) + (138 x 0.25) + (140 x 88.45) = 25.84 + 34.5 + 12383.0 = 12443.34

14012 - 12443.34 = 1568.66
m = 1568.66 / 11.11 = 141.19 amu

The fourth isotope has an isotopic mass of approximately 141.19 amu and a relative abundance of 11.11% (this closely matches cerium's real fourth isotope, 142Ce, at about 11.11% natural abundance).` },

{ topic: '1.2', title: 'FRQ — Boron Isotope Abundances from a Non-Whole-Number Atomic Mass', content:
`Boron has two naturally occurring isotopes: 10B (mass = 10.0 amu) and 11B (mass = 11.0 amu). A natural sample of boron has a relative atomic mass of 10.8 amu.

(a) Explain why the relative atomic mass of boron (10.8 amu) is not a whole number, and why it is closer to 11.0 than to 10.0.
(b) Calculate the relative abundances of 10B and 11B in the sample.`,
  answer: `(a) The relative atomic mass is a weighted average of the masses of all naturally occurring isotopes, so unless one isotope makes up 100% of the sample, the average will generally fall between the isotope masses and won't be a whole number. Because the average (10.8) is closer to 11.0 than to 10.0, 11B must be the more abundant isotope of the two.

(b) Let x = fraction of 10B, so (1-x) = fraction of 11B.
10.8 = 10x + 11(1-x) = 11 - x
x = 11 - 10.8 = 0.20

So 10B = 20% and 11B = 80%.
Check: (10 x 0.20) + (11 x 0.80) = 2.0 + 8.8 = 10.8 amu. Matches.` },

{ topic: '1.2', title: 'FRQ — Isotope Peaks and the Molecular Ion Peak of Chlorine Gas', content:
`The mass spectrum of chlorine gas, Cl2, shows peaks near m/z = 35 and m/z = 37 (each relatively short), and a cluster of peaks near m/z = 70, 72, and 74 (with the m/z=70 peak the tallest, m/z=72 medium, and m/z=74 the shortest of the cluster).

(a) Explain the origin of the peaks at m/z = 35 and m/z = 37.
(b) Explain the presence and relative abundance of the peak at m/z = 74.`,
  answer: `(a) These peaks come from the two naturally occurring isotopes of chlorine, 35Cl and 37Cl, produced when a Cl2 molecule fragments into individual Cl+ ions in the mass spectrometer. Each isotope has a distinct mass, producing two separate peaks.

(b) The peak at m/z = 74 comes from a Cl2 molecular ion made of two 37Cl atoms (37+37=74). Chlorine's natural abundance is roughly 3:1 in favor of 35Cl over 37Cl, so a Cl2 molecule is much more likely to be 35Cl-35Cl (giving the tall peak at m/z=70) or a mixed 35Cl-37Cl (giving the medium peak at m/z=72) than 37Cl-37Cl — making the m/z=74 peak the shortest of the three, consistent with the low probability of randomly pairing two of the rarer isotope together.` },

// ============================================================
// 1.3 Elemental Composition of Pure Substances
// ============================================================
{ topic: '1.3', mcq: true, title: 'MCQ — Empirical Formula from Percent Composition (S, O, H)', content:
`A compound contains 39% sulfur, 58.6% oxygen, and the remainder hydrogen. What is the empirical formula of the compound?
(A) SOH
(B) SO3H
(C) SO3H2
(D) S6O2H6`,
  answer: `Correct answer: (C) SO3H2
%H = 100 - 39 - 58.6 = 2.4%

mol S = 39/32.06 = 1.216
mol O = 58.6/16.00 = 3.663
mol H = 2.4/1.008 = 2.381

Divide by smallest (1.216):
S: 1.00
O: 3.01
H: 1.96 (rounds to 2)

Empirical formula: SO3H2` },

{ topic: '1.3', mcq: true, title: 'MCQ — Mass of Nitrogen in Ammonium Nitrate', content:
`Ammonium nitrate has the formula NH4NO3. What is the mass of nitrogen in a 23.15 g sample of ammonium nitrate?
(A) 17.49 g
(B) 34.99 g
(C) 8.10 g
(D) 4.05 g`,
  answer: `Correct answer: (C) 8.10 g
Molar mass NH4NO3 = 14.01 + 4(1.008) + 14.01 + 3(16.00) = 80.05 g/mol
%N = 2(14.01) / 80.05 = 35.0%
mass N = 23.15 g x 0.350 = 8.10 g` },

{ topic: '1.3', mcq: true, title: 'MCQ — Masses of C and H Equal to Those in a Butene Sample', content:
`Which masses of carbon and hydrogen, respectively, would be the same as the mass of carbon and hydrogen in a pure sample of butene, C4H8?
(A) 48 g, 10 g
(B) 60 g, 12 g
(C) 84 g, 12 g
(D) 72 g, 12 g`,
  answer: `Correct answer: (D) 72 g, 12 g
Butene's empirical formula is CH2, so the moles of C and H in any sample are always in a 1:2 ratio.
72 g C: 72/12.01 = 6.00 mol
12 g H: 12/1.008 = 11.9 mol
6.00 : 11.9 is approximately 1:2, matching butene's C:H mole ratio.` },

{ topic: '1.3', mcq: true, title: 'MCQ — Applying the Law of Definite Proportions to H2S', content:
`Consider the compound H2S. According to the Law of Definite Proportions, which of the following statements is true?
(A) The mass ratio of H:S in H2S can vary depending on the sample's source.
(B) The mass ratio of H:S in H2S is always the same, regardless of the sample.
(C) The mass ratio of H:S in H2S is determined by the reaction conditions used to make it.
(D) The Law of Definite Proportions does not apply to H2S.`,
  answer: `Correct answer: (B) The mass ratio of H:S in H2S is always the same, regardless of the sample.

The Law of Definite Proportions states that a pure compound always contains its constituent elements in the same fixed mass ratio, no matter the sample's size or source. For H2S, the H:S mass ratio is fixed by the formula itself (2 x 1.008 : 32.06), and this doesn't change based on how or where the sample was obtained — eliminating (A) and (C). (D) is false; the law applies to all pure compounds, including H2S.` },

{ topic: '1.3', mcq: true, title: 'MCQ — Identifying a Compound from Percent Composition', content:
`A compound has the following composition by mass: H, 5.00%; N, 35.00%; O, 60.00%. Which compound has this composition?
(A) HNO3
(B) NH4NO3
(C) HNO2
(D) NH2OH`,
  answer: `Correct answer: (B) NH4NO3
Check NH4NO3 (molar mass 80.05 g/mol):
%H = 4(1.008)/80.05 = 5.04%
%N = 2(14.01)/80.05 = 35.0%
%O = 3(16.00)/80.05 = 59.96%
These closely match the given 5.00% / 35.00% / 60.00%, confirming NH4NO3.` },

{ topic: '1.3', mcq: true, title: 'MCQ — Sample Mass from Metal Mass and Mass Percent', content:
`A 6.2 g sample of a mixture containing magnesium chloride and sodium bromide is found to contain 0.45 g of magnesium. Assuming this is the only source of magnesium, what is the mass percent of MgCl2 in the mixture?
(A) 10.3%
(B) 28.5%
(C) 17.6%
(D) 34.5%`,
  answer: `Correct answer: (B) 28.5%
mol Mg = 0.45/24.31 = 0.0185 mol = mol MgCl2 (1 Mg per MgCl2)
mass MgCl2 = 0.0185 x 95.21 g/mol = 1.77 g
%MgCl2 = 1.77/6.2 x 100 = 28.5%` },

{ topic: '1.3', mcq: true, title: 'MCQ — Total Mixture Mass from Purity and Metal Mass', content:
`A mixture of calcium carbonate and barium sulfate contains 30.0% calcium carbonate by mass. If the mixture contains 1.20 g of calcium, what is the total mass of the mixture?
(A) 4.00 g
(B) 6.00 g
(C) 9.99 g
(D) 12.00 g`,
  answer: `Correct answer: (C) 9.99 g
mol Ca = 1.20/40.08 = 0.02994 mol = mol CaCO3
mass CaCO3 = 0.02994 x 100.09 g/mol = 3.00 g
total mass = 3.00 / 0.300 = 9.99 g` },

{ topic: '1.3', title: 'FRQ — Determining an Unknown Element Ratio from a Two-Element Sample', content:
`A student is given a solid sample consisting of two elements, X and Y. The total mass of the sample is 1.50 g: 0.90 g is element X and 0.60 g is element Y.

(a) Identify one physical property that could help determine whether the sample is a pure element or a mixture. Justify your choice.
(b) Calculate the mass percentage of element X in the sample.
(c) The atomic masses of X and Y are 24.3 g/mol and 32.1 g/mol respectively. Determine the simplest whole-number ratio of atoms of X to Y in the sample.`,
  answer: `(a) Melting point — a pure substance melts sharply at one specific temperature, while a mixture typically melts gradually over a range of temperatures. (Alternatively: chromatography — a pure substance produces a single spot/band, while a mixture separates into multiple spots.)

(b) %X = 0.90/1.50 x 100 = 60%

(c) mol X = 0.90/24.3 = 0.0370 mol
mol Y = 0.60/32.1 = 0.0187 mol
ratio X:Y = 0.0370/0.0187 = 1.98, which rounds to a simplest whole-number ratio of 2:1.` },

{ topic: '1.3', title: 'FRQ — Empirical and Molecular Formula of a Metal Oxide', content:
`A student analyzes a sample of an unknown metal oxide, composed of metal X and oxygen, and knows the molar mass of metal X is 40.1 g/mol.

Empty crucible: 22.15 g
Crucible + metal X (before heating): 24.67 g
Crucible + metal oxide (after heating): 25.35 g

The experimentally determined molar mass of the compound is 305.2 g/mol.

(a) Determine the mass of metal X and the mass of oxygen in the sample.
(b) Determine the empirical formula of the metal oxide.
(c) Using the experimentally determined molar mass, determine the molecular formula of the compound.`,
  answer: `(a) mass X = 24.67 - 22.15 = 2.52 g
mass metal oxide = 25.35 - 22.15 = 3.20 g
mass O = 3.20 - 2.52 = 0.68 g

(b) mol X = 2.52/40.1 = 0.0629 mol
mol O = 0.68/16.00 = 0.0425 mol
ratio X:O = 0.0629/0.0425 = 1.48, which is close to 3:2 when both are scaled up.
Empirical formula: X3O2

(c) Empirical formula mass = 3(40.1) + 2(16.00) = 152.3 g/mol
305.2 / 152.3 = 2.00
Molecular formula: X6O4` },

{ topic: '1.3', title: 'FRQ — Mass Conservation in a Metal-to-Nitrate Conversion', content:
`A chemist analyzes a mixture of two metals, Fe and Cu, in which the iron-to-copper mass ratio is 3:2. The metals are reacted with excess nitric acid, forming soluble nitrate salts (Fe(NO3)3 and Cu(NO3)2). The chemist evaporates the solution, leaving the dry metal nitrates behind.

Empty evaporating dish: 50.25 g
Dish + original metal sample: 57.89 g
Dish + metal nitrate residue: 75.33 g

(a) Suggest an experimental method to confirm whether the original sample contained a mixture of metals rather than a pure metal. Justify your answer.
(b) Determine the total mass of metals (Fe and Cu) in the sample, and explain why this mass stays the same before and after the reaction.
(c) Using the given Fe:Cu mass ratio, calculate the mass of Fe in the sample.
(d) Calculate the percent by mass of Fe in the original sample.`,
  answer: `(a) Measure the melting point of the sample — a pure metal has a sharp, well-defined melting point, while a mixture of two metals typically melts gradually over a broader range.

(b) mass of metals = 57.89 - 50.25 = 7.64 g
This mass is unchanged before and after the reaction because the metal atoms themselves are conserved — they are converted into nitrate compounds (gaining NO3- groups), but no metal atoms are created or destroyed in the process.

(c) Using the 3:2 ratio, Fe is 3 parts of 5 total parts:
mass Fe = 7.64 x (3/5) = 4.58 g

(d) %Fe = 4.58/7.64 x 100 = 59.9%` },

{ topic: '1.3', title: 'FRQ — Distinguishing a Pure Substance from a Mixture (Sample Z)', content:
`A student analyzes Sample Z, which may be pure copper (Cu), pure zinc (Zn), or a mixture of both metals. The student makes these observations:
- Melting range: 890-950 degrees C
- Reaction with HCl: gas bubbles are produced
- Electrical conductivity: conducts electricity as a solid

(a) Determine whether Sample Z is a pure substance or a mixture. Justify your answer.`,
  answer: `(a) Sample Z is a mixture. A pure substance (whether pure Cu or pure Zn) would melt sharply at a single, specific temperature, but this sample melts gradually over a range (890-950 degrees C) — a hallmark of a mixture, since different components/regions of the mixed solid melt at slightly different temperatures depending on local composition.` },

{ topic: '1.3', title: 'FRQ — Finding a Molecular Formula from Mass Composition', content:
`A student analyzes a 1.00 g sample of compound X, known to contain only carbon and hydrogen. The sample contains 0.857 g of carbon and 0.143 g of hydrogen. The molar mass of compound X is 56.1 g/mol.

(a) Calculate the number of moles of each element present in the sample.
(b) Determine the molecular formula of compound X.
(c) Calculate the number of carbon atoms present in the original 1.00 g sample of compound X.
(d) Another student proposes that the molecular formula of compound X is C2H4. Explain why this formula is inconsistent with the data given.
(e) State the molecular formula of a compound with the same empirical formula as compound X, but a molar mass of 70.1 g/mol.
(f) Explain one limitation of using only elemental mass data (percent composition) when analyzing a compound that might also contain oxygen.`,
  answer: `(a) mol C = 0.857/12.01 = 0.0714 mol
mol H = 0.143/1.008 = 0.1419 mol

(b) Ratio C:H = 0.0714 : 0.1419, approximately 1:2 -> empirical formula CH2 (mass 14.03 g/mol)
56.1 / 14.03 = 4.0 -> molecular formula C4H8

(c) mol C4H8 in 1.00 g sample = 1.00/56.1 = 0.01783 mol
mol C atoms = 4 x 0.01783 = 0.0713 mol
carbon atoms = 0.0713 x 6.022 x 10^23 = 4.30 x 10^22 atoms

(d) C2H4 has a molar mass of 28.05 g/mol (2 x 12.01 + 4 x 1.008), which is exactly half of the compound's actual molar mass (56.1 g/mol) — C2H4 shares the same empirical formula (CH2) but is not the correct molecular formula, since it doesn't match the given molar mass.

(e) 70.1 / 14.03 = 5.0 -> molecular formula C5H10

(f) Elemental mass/percent composition data alone cannot distinguish between different structural arrangements of the same atoms (isomers), nor can it reveal how oxygen (if present) is actually bonded within the molecule (e.g., as an -OH group vs. a C=O group) — two compounds with identical percent composition can have very different structures and properties.` },

{ topic: '1.3', title: 'FRQ — Identifying a Metal from Oxide Reduction Data', content:
`A student analyzes a 1.68 g sample of a metal oxide containing only an unknown metal (M) and oxygen. The oxide is reduced by heating in a stream of hydrogen gas, which removes the oxygen as water vapor. After complete reduction, 0.89 g of pure metal remains.

A separate sample of the same oxide is analyzed and found to contain 0.0100 mol of metal ions and 0.0150 mol of oxide ions.

(a) Determine the empirical formula of the compound using the molar quantities given.
(b) Would the empirical formula change if the student used a larger or smaller sample size? Justify your answer.
(c) Calculate the percent by mass of oxygen in the compound.
(d) Use your answers from (a) and (c) to determine the molar mass of the metal, and suggest its identity.
(e) Explain why identifying the metal based on its molar mass provides evidence that the sample is pure.
(f) The student repeats the experiment but accidentally spills some of the solid before weighing the metal remaining after heating, recovering only 0.83 g of metal from a 1.76 g sample of the oxide. Explain what this result suggests about the purity of this second sample.
(g) Explain how a particle-level model of the metal oxide (a pure compound) differs from that of a mixture.`,
  answer: `(a) mole ratio metal:oxide = 0.0100 : 0.0150 = 2:3
Empirical formula: M2O3

(b) No — the empirical formula would not change. The RATIO of atoms in a pure compound is fixed (Law of Definite Proportions); a larger or smaller sample simply has proportionally more or less material, not a different ratio.

(c) %O = (1.68 - 0.89)/1.68 x 100 = 0.79/1.68 x 100 = 47.0%

(d) In M2O3, let x = molar mass of M. The total molar mass is 2x + 3(16.00) = 2x + 48.
Percent metal = 100% - 47.0% = 53.0%, so:
2x / (2x + 48) = 0.530
Solving: 2x = 0.530(2x+48) -> 2x = 1.06x + 25.44 -> 0.94x = 25.44 -> x = 27.06 g/mol
This is very close to aluminum (26.98 g/mol) — the metal is likely aluminum, and the compound is Al2O3.

(e) Getting a molar mass that closely matches a real element's known atomic mass provides strong evidence that only ONE metal is present (not a mix of different metals with an "averaged" apparent molar mass), supporting the sample's purity.

(f) %metal recovered = 0.83/1.76 x 100 = 47.2%, notably less than the expected 53.0% for pure M2O3. This suggests the second sample was not pure — some additional mass (an impurity that doesn't reduce to free metal, or contamination) is likely present, diluting the true metal content below what pure M2O3 would give.

(g) In a pure compound like the metal oxide, there is only ONE type of particle throughout, with metal and oxygen atoms combined in a fixed, unchanging ratio everywhere in the sample. In a mixture, there are multiple distinct types of particles (e.g., different compounds or elements) physically combined, and their relative proportions can vary from sample to sample.` },

{ topic: '1.3', title: 'FRQ — Separating and Analyzing an Fe/SiO2 Mixture', content:
`A laboratory receives a powdered sample believed to be a mixture of iron (Fe) and silicon dioxide (SiO2). To analyze it:
1. A magnet is used to separate iron from the mixture.
2. The remaining material is treated with hydrofluoric acid (HF), which reacts with silicon dioxide: SiO2(s) + 4HF(aq) -> SiF4(g) + 2H2O(l)

The total mass of the original sample is 15.00 g. After magnetic separation, 6.25 g of non-magnetic material remains.

(a) Explain why the original sample is classified as a mixture rather than a pure substance.
(b) Calculate the percent by mass of iron in the original sample, and explain what this value indicates about the sample's composition.
(c) Describe how physical properties are used to separate the components of this mixture.
(d) Explain how the expected observations of the reaction between the remaining material and hydrofluoric acid would provide evidence that the other substance is silicon dioxide.`,
  answer: `(a) The sample contains two distinct substances (iron and silicon dioxide) that can be physically separated from one another (e.g., with a magnet) without any chemical change — this is the defining feature of a mixture, unlike a pure substance which cannot be separated into different components by physical means.

(b) mass Fe = 15.00 - 6.25 = 8.75 g
%Fe = 8.75/15.00 x 100 = 58.3%
This indicates that a majority of the sample's mass is iron, but a substantial portion (41.7%) is a separate, non-magnetic substance, confirming the sample is indeed a mixture of at least two components.

(c) Iron is magnetic and is attracted to and removed by a magnet, while silicon dioxide is non-magnetic and is left behind — this physical property difference (magnetism) allows the two components to be separated without any chemical reaction.

(d) If the remaining material is silicon dioxide, treating it with HF should produce visible bubbling/gas evolution (from SiF4 gas escaping) and eventually leave a clear liquid (water) behind as the solid dissolves/reacts away — observing these expected signs would be consistent with (though not fully conclusive proof of) the remaining material being silicon dioxide.` },

{ topic: '1.3', title: 'FRQ — Checking the Purity of Hydrated Copper Sulfate', content:
`A laboratory receives a 10.00 g solid sample suspected to be either pure copper(II) sulfate pentahydrate (CuSO4 . 5H2O) or a mixture of CuSO4 . 5H2O with an inert impurity.
1. The sample is heated strongly in a crucible to remove its water of hydration; the final mass is 7.85 g.
2. The residue is stirred into distilled water, producing a blue solution.

The theoretical percent by mass of water in pure CuSO4 . 5H2O is 36.1%.

(a) Explain why the sample is heated until a constant mass is achieved before analysis.
(b) Calculate the percent by mass of water lost during heating.
(c) Use your calculation from (b) and the theoretical value given to determine whether the sample is a mixture or pure copper(II) sulfate pentahydrate.
(d) Explain how this experiment demonstrates that mixtures can have variable composition, based on the mass data.`,
  answer: `(a) Heating to constant mass ensures that ALL of the water of hydration has been fully driven off — if the mass were still decreasing between heatings, some water would still remain, leading to an inaccurate (too-high) final mass and an underestimated percent water lost.

(b) %water lost = (10.00 - 7.85)/10.00 x 100 = 21.5%

(c) The measured percent water lost (21.5%) is far below the theoretical value for pure CuSO4 . 5H2O (36.1%). This strongly suggests the sample is a MIXTURE — the presence of a non-hydrated impurity would dilute the overall percentage of water, since that impurity's mass is included in the total but contributes no water of its own.

(d) Unlike a pure compound (which always has the same fixed percent composition, like the 36.1% water in pure CuSO4 . 5H2O), this sample's percent water (21.5%) doesn't match the fixed theoretical value — showing that when an inert impurity is mixed in at some variable amount, the overall composition of the resulting mixture depends on how much impurity is present, and isn't fixed the way a pure compound's composition is.` },

{ topic: '1.3', title: 'FRQ — Analyzing River Water for Suspended and Dissolved Solids', content:
`A municipal water treatment facility analyzes a 500.0 g sample of river water suspected of containing both suspended solids (like sand and organic matter) and dissolved ionic compounds.
1. The sample is filtered, leaving 7.3 g of solid residue on the filter paper.
2. The filtered water is evaporated to dryness, leaving 3.8 g of solid residue.
3. A portion of the evaporated residue is tested with silver nitrate (AgNO3) solution, producing a white precipitate.

(a) Explain why filtration is an appropriate first step in separating the components of this river water sample.
(b) Calculate the percent by mass of suspended solids in the original river water sample.
(c) What does the result of the silver nitrate test suggest about the composition of the dissolved solids? Justify your answer.
(d) Explain why the procedures used in this experiment do not allow full identification of every substance present in the river water sample.`,
  answer: `(a) Filtration separates insoluble suspended solids (like sand and organic matter, which don't pass through the filter paper) from the liquid and any dissolved substances (which do pass through) — it works because the particle-size difference between the undissolved solids and the liquid/dissolved material is large enough for the filter paper to physically separate them.

(b) %suspended solids = 7.3/500.0 x 100 = 1.46%

(c) A white precipitate forming with AgNO3 is consistent with the presence of chloride ions (forming insoluble AgCl), a classic qualitative test for halide ions in solution.

(d) The AgNO3 test only detects the presence of certain ions (like halides) that form an insoluble silver salt — it doesn't identify or rule out other dissolved substances that might also be present (such as carbonates, sulfates, or various dissolved cations), so this limited set of procedures can't fully characterize everything dissolved in the water.` },

// ============================================================
// 1.4 Composition of Mixtures
// ============================================================
{ topic: '1.4', mcq: true, title: 'MCQ — Identifying a Homogeneous Mixture', content:
`A scientist examines a liquid mixture containing water, ethanol, and dissolved sodium chloride. Which statement best describes this sample?
(A) It is a homogeneous mixture, with components uniformly distributed at the molecular level.
(B) It is a heterogeneous mixture, because the NaCl forms distinct visible phases.
(C) It is a pure substance, formed by a chemical combination of its components.
(D) It has distinct microscopic regions of non-uniform composition.`,
  answer: `Correct answer: (A) It is a homogeneous mixture, with components uniformly distributed at the molecular level.

Water and ethanol are fully miscible, and NaCl dissolves completely, dissociating into Na+ and Cl- ions that distribute uniformly throughout the solution — there are no distinct phases or regions of differing composition, which rules out (B) and (D). It's a mixture (not a pure substance) because its components aren't chemically bonded together and can vary in proportion, ruling out (C).` },

{ topic: '1.4', mcq: true, title: 'MCQ — Particle Arrangement in a Heterogeneous Mixture', content:
`Which of the following correctly identifies the molecular/particle arrangement in a heterogeneous mixture?
(A) All particles are identical and evenly spaced.
(B) Different particles are evenly mixed together at the molecular level.
(C) Different particles are grouped into distinct, visibly separate regions.
(D) Particles are chemically bonded together into a single, uniform structure.`,
  answer: `Correct answer: (C) Different particles are grouped into distinct, visibly separate regions.

This is the defining feature of a heterogeneous mixture — its composition is not uniform throughout, and different substances remain in visibly (or at least distinguishably) separate regions rather than being evenly distributed at the molecular level (which would describe a homogeneous mixture, (B)) or chemically combined (which would describe a compound, (D)).` },

{ topic: '1.4', mcq: true, title: 'MCQ — Identifying a High-Potassium Impurity in K2SO4', content:
`The mass percent of potassium in pure K2SO4 is 45%. A chemist analyzes an impure sample of K2SO4 and finds the mass percent of potassium is 50%. Which of the following impurities could account for this higher mass percent of potassium?
(A) KBr
(B) KI
(C) KCN
(D) KMnO4`,
  answer: `Correct answer: (C) KCN

For an impurity to raise the overall %K above 45%, the impurity itself must have a %K greater than 45%.
KBr: 39.10/119.00 = 32.9%
KI: 39.10/166.00 = 23.6%
KCN: 39.10/65.12 = 60.0%
KMnO4: 39.10/158.04 = 24.7%

Only KCN (60.0%) has a higher %K than pure K2SO4 (45%), so mixing it in raises the overall measured %K.` },

{ topic: '1.4', mcq: true, title: 'MCQ — Mass Percent of LiCl in a LiCl/NaCl Mixture', content:
`A mixture of LiCl and NaCl is analyzed and found to contain 5.00% Li by mass. Which best represents the mass percent of LiCl in this mixture?
(A) 11.8%
(B) 30.5%
(C) 72.0%
(D) 81.9%`,
  answer: `Correct answer: (B) 30.5%
%Li in pure LiCl = 6.94/(6.94+35.45) = 16.37%

Let x = mass fraction of LiCl in the mixture. All the Li comes from the LiCl portion:
x(0.1637) = 0.0500
x = 0.0500/0.1637 = 0.3054 = 30.5%` },

{ topic: '1.4', title: "FRQ — Determining a Compound's Purity from Recovered Metal Mass", content:
`Sample of the same aluminum-oxide-forming reaction from before is repeated. In one trial, an 8.00 g sample of Al2O3-based compound is analyzed and 4.24 g of pure aluminum metal is recovered after full reduction.

(a) Calculate the percent by mass of aluminum recovered from the sample.
(b) The theoretical percent by mass of aluminum in pure Al2O3 is 52.9%. Use your answer from (a) to determine whether the original sample was pure Al2O3 or a mixture containing an impurity.`,
  answer: `(a) %Al recovered = 4.24/8.00 x 100 = 53.0%

(b) The measured value (53.0%) matches the theoretical value for pure Al2O3 (52.9%) very closely (well within reasonable experimental error), so this result is consistent with the sample being pure Al2O3, not a mixture diluted by an impurity.` },

// ============================================================
// 1.5 Atomic Structure and Electron Configuration
// ============================================================
{ topic: '1.5', mcq: true, title: 'MCQ — Species with the Configuration 1s2 2s2 2p6', content:
`Which of the following species has the electron configuration 1s2 2s2 2p6?
(A) F+
(B) Na+
(C) Mg
(D) Ar`,
  answer: `Correct answer: (B) Na+
1s2 2s2 2p6 has 10 electrons. Na+ (Na loses 1 electron: 11-1=10) matches. F only ever forms F- (not F+), so F+ isn't a real, commonly-formed species; neutral Mg has 12 electrons; neutral Ar has 18.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Counting Electrons in Different Elements', content:
`Which statement is correct?
(A) Oxygen has 6 electrons.
(B) Chlorine has 17 valence electrons.
(C) Calcium has 12 p electrons.
(D) Copper has 9 d electrons.`,
  answer: `Correct answer: (C) Calcium has 12 p electrons.
Ca: 1s2 2s2 2p6 3s2 3p6 4s2 -> p electrons = 2p6 + 3p6 = 12.

(A) is wrong — O has 8 total electrons (though 6 valence electrons). (B) is wrong — Cl has 7 valence electrons (17 total). (D) is wrong — Cu = [Ar]4s1 3d10, so it has 10 d electrons, not 9.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Subatomic Particles in Chromium-53', content:
`Chromium-53 is an isotope of chromium. How many protons, neutrons, and electrons does a neutral atom of this isotope have?
(A) 53 protons, 24 neutrons, 53 electrons
(B) 24 protons, 53 neutrons, 24 electrons
(C) 26 protons, 24 neutrons, 24 electrons
(D) 24 protons, 29 neutrons, 24 electrons`,
  answer: `Correct answer: (D) 24 protons, 29 neutrons, 24 electrons
Chromium's atomic number Z = 24, so a neutral atom has 24 protons and 24 electrons.
neutrons = mass number - Z = 53 - 24 = 29` },

{ topic: '1.5', mcq: true, title: "MCQ — Coulomb's Law Equation", content:
`What is the correct equation for Coulomb's Law?
(A) F = kq1q2/r^2
(B) F = kr^2/q1q2
(C) F = r^2(q1q2)/k
(D) F = kq1q2(r^2)`,
  answer: `Correct answer: (A) F = kq1q2/r^2
The force between two charges is proportional to the product of the charges and inversely proportional to the square of the distance between them.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Meaning of the Principal Quantum Number', content:
`The principal quantum number, n, represents
(A) the average distance of the electron from the nucleus.
(B) the shape of the orbital.
(C) the orientation of the orbital in space.
(D) the spin of the electron.`,
  answer: `Correct answer: (A) the average distance of the electron from the nucleus.
n determines the energy level/shell an electron occupies, which corresponds to its average distance from the nucleus — larger n means, on average, farther from the nucleus and higher energy. (Orbital shape is described by the angular momentum quantum number l; orientation by ml; spin by ms.)` },

{ topic: '1.5', mcq: true, title: 'MCQ — Correct Equation for First Ionization Energy of Magnesium', content:
`Which is the correct equation representing the first ionization energy of magnesium?
(A) Mg(g) -> Mg2+(g) + 2e-
(B) Mg+(g) -> Mg2+(g) + e-
(C) Mg(g) -> Mg+(g) + e-
(D) Mg+ -> Mg2+ + e-`,
  answer: `Correct answer: (C) Mg(g) -> Mg+(g) + e-
The FIRST ionization energy is the energy to remove ONE electron from a neutral gaseous atom, producing a singly-charged cation. (A) removes two electrons at once (that's not how ionization energy is defined step-by-step). (B) and (D) represent the SECOND ionization energy (removing an electron from an already-1+ ion); (D) is additionally missing the required state symbols (g).` },

{ topic: '1.5', mcq: true, title: 'MCQ — Subatomic Particles in the Phosphide Ion', content:
`What is the correct number of subatomic particles in a phosphide ion, P3-?
(A) 15 protons, 16 neutrons, 18 electrons
(B) 15 protons, 16 neutrons, 15 electrons
(C) 16 protons, 15 neutrons, 18 electrons
(D) 15 protons, 16 neutrons, 12 electrons`,
  answer: `Correct answer: (A) 15 protons, 16 neutrons, 18 electrons
Based on 31P: protons = 15, neutrons = 31-15 = 16. Forming P3- means the neutral atom (15 electrons) gains 3 electrons, giving 15 + 3 = 18 electrons.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Definition of Ionization Energy', content:
`Which statement about ionization energy is true?
(A) It's the energy to add an electron to a gaseous atom, and it's always endothermic.
(B) It's the energy to add an electron to a gaseous atom, and it's always exothermic.
(C) It's the energy to remove an electron from a gaseous atom, and it's always endothermic.
(D) It's the energy to remove an electron from a gaseous atom, and it's always exothermic.`,
  answer: `Correct answer: (C) It's the energy to remove an electron from a gaseous atom, and it's always endothermic.
Removing a negatively charged electron from an atom always requires energy input (to overcome the attraction between the electron and the positively charged nucleus), so ionization energy is always positive (endothermic).` },

{ topic: '1.5', mcq: true, title: 'MCQ — Identifying a Particle from [Ar]3d3', content:
`A charged particle has the electron configuration [Ar]3d3. What is the identity of the particle?
(A) Cr+
(B) V3+
(C) Ti2+
(D) V2+`,
  answer: `Correct answer: (D) V2+
Neutral vanadium (V): [Ar]4s2 3d3. Removing 2 electrons for V2+ removes the 4s electrons first (transition metal cations lose s-electrons before d-electrons): [Ar]3d3.
Cr+ = [Ar]3d5; V3+ = [Ar]3d2; Ti2+ = [Ar]3d2. Only V2+ matches [Ar]3d3.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Comparing Three Isoelectronic-Sized Ions', content:
`Three ions are shown: 37Cl- (17 protons, 20 neutrons), 31P3- (15 protons, 16 neutrons), 37K+ (19 protons, 18 neutrons). Which of the following statements is/are correct?
I. All three ions have the same number of electrons.
II. None of the ions have the same number of neutrons as each other.
III. Cl- and K+ have the same total number of subatomic particles.
(A) I, II and III
(B) I and II only
(C) II and III only
(D) I only`,
  answer: `Correct answer: (A) I, II and III

Electrons: Cl- = 17+1=18; P3- = 15+3=18; K+ = 19-1=18. All three have 18 electrons — statement I is true.

Neutrons: Cl-=20, P3-=16, K+=18. All different — statement II is true.

Total particles: Cl- = 17p+20n+18e = 55; K+ = 19p+18n+18e = 55. Equal — statement III is true.

All three statements are correct.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Identifying an Element from a 3-Peak Photoelectron Spectrum', content:
`The photoelectron spectrum of an unknown element shows three peaks with a relative electron ratio of 1 : 1 : 1.5 (from highest to lowest binding energy). Based on the binding energies and the number of peaks, which element does the spectrum represent?
(A) B
(B) Ne
(C) Li
(D) N`,
  answer: `Correct answer: (D) N
Three peaks means three distinct subshells (1s, 2s, 2p). A height ratio of 1:1:1.5 corresponds to electron counts in a 2:2:3 ratio (since the smallest whole-number ratio matching 1:1:1.5 is 2:2:3), giving the configuration 1s2 2s2 2p3 — nitrogen.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Why Scandium Forms a 3+ Ion', content:
`The photoelectron spectrum of scandium shows its two lowest-binding-energy peaks are very close together, at binding energies of 0.63 and 0.77 MJ/mol. Based on this, what is the most accurate reason scandium typically forms a 3+ ion rather than a 2+ ion?
(A) Removing two electrons reduces spin-pairing repulsion in the 4s sublevel, but completely emptying the 4s sublevel is more energetically favorable.
(B) The energy required to remove an electron from the 3d sublevel is comparable to that of the 4s sublevel, whereas significantly more energy is needed to remove electrons from the 3p sublevel.
(C) Scandium belongs to Group 3, and atoms will only lose electrons until they achieve a noble gas electron configuration.
(D) The energy released by removing three electrons is greater than that released by removing two electrons.`,
  answer: `Correct answer: (B) The energy required to remove an electron from the 3d sublevel is comparable to that of the 4s sublevel, whereas significantly more energy is needed to remove electrons from the 3p sublevel.

Scandium's configuration is [Ar]4s2 3d1. The close binding energies given (0.63 and 0.77 MJ/mol) show that the 4s and 3d electrons are similarly easy to remove, so all three (2 from 4s, 1 from 3d) come off relatively easily, leaving the stable [Ar] noble-gas core. Removing a 4th electron would require pulling from the much more tightly bound 3p sublevel (a core level), which takes drastically more energy — this large energy jump is why Sc3+ (not Sc4+ or Sc2+) is the typical, stable ion.` },

{ topic: '1.5', mcq: true, title: 'MCQ — Comparing First Ionization Energies of O and N', content:
`Which pair correctly identifies the relative first ionization energies of two elements, and gives the correct justification?
(A) F has a lower first IE than Cl.
(B) N has a lower first IE than C.
(C) O has a lower first IE than N.
(D) Ne has a lower first IE than Na.`,
  answer: `Correct answer: (C) O has a lower first IE than N.

This is a well-known exception to the general periodic trend. Although O has a higher nuclear charge than N (which would normally suggest a higher IE), oxygen's outermost electron configuration is 2p4 — meaning one of its 2p orbitals contains a PAIR of electrons. The repulsion between these two paired electrons in the same orbital makes it easier to remove one of them than the general trend would predict, so O's first IE is actually slightly LOWER than N's (which has a stable, unpaired 2p3 configuration).

(A), (B), and (D) all describe the normal (non-anomalous) trend backwards — within a period, first IE increases left to right, and within a group it decreases going down, so F > Cl, C > N (this is also anomalous but in the opposite, expected direction for this pairing — actually N's half-filled 2p3 makes it unusually stable and HIGHER than O, not lower than C), and Na < Ne is correct in direction but not what's being asked as "lower."` },

{ topic: '1.5', mcq: true, title: "MCQ — Identifying a Compound from an Ionic Lattice and Coulomb's Law", content:
`An ionic crystal lattice has a cubic unit cell with edge length 0.412 nm. The force of attraction between adjacent ions is calculated to be -8.46 x 10^29 N. Use this information to determine the identity of the substance.
(A) NaCl
(B) CaO
(C) AlN
(D) MgCl2`,
  answer: `Correct answer: (B) CaO

Using Coulomb's Law, F = kq1q2/r^2, with r = half the edge length = 0.206 nm (the ion-to-ion distance), and testing each compound's ion charges:

For CaO (Ca2+ and O2-, so q1q2 = (+2)(-2) = -4, in appropriate charge units): solving gives F = -8.46 x 10^29 N, matching the given value exactly.

Checking the others with the same distance: NaCl (1+/1- charges) gives a force of about -2.11 x 10^29 N (too small); AlN (3+/3- charges) gives about -1.90 x 10^28 N (too large); MgCl2 doesn't have a simple 1:1 ion pairing consistent with this type of lattice calculation. Only CaO's charge combination reproduces the given force.` },

{ topic: '1.5', title: 'FRQ — Identifying an Element and Its Ion from Particle Counts', content:
`A neutral atom of an unknown element contains 35 protons, 45 neutrons, and 35 electrons.

(a) Identify the element and justify your answer.
(b) Determine the mass number of this atom.
(c) If the atom forms a -1 ion, describe what happens to its electron count.
(d) Explain why the nucleus remains unaffected when an atom gains or loses electrons to form an ion.`,
  answer: `(a) Bromine (Br) — the number of protons (35) is the atomic number, which uniquely identifies the element.

(b) Mass number = protons + neutrons = 35 + 45 = 80

(c) Forming a -1 ion means the atom GAINS one electron, increasing its electron count from 35 to 36.

(d) The nucleus consists of protons and neutrons, while ions form purely by atoms gaining or losing ELECTRONS (which orbit outside the nucleus). Since no protons or neutrons are added or removed in this process, the nucleus itself — and therefore the element's identity and mass number — is completely unaffected by ion formation.` },

{ topic: '1.5', title: 'FRQ — Comparing Ionization Energies of Na, Cl, and Mg', content:
`A scientist is comparing the first ionization energy of sodium (Na) and chlorine (Cl).

(a) Define ionization energy and explain what it measures.
(b) Use Coulomb's Law to explain why chlorine has a higher first ionization energy than sodium.
(c) Predict whether magnesium (Mg) has a higher or lower first ionization energy than sodium (Na), and justify your answer.
(d) Explain why the second ionization energy of sodium is significantly higher than its first ionization energy.`,
  answer: `(a) Ionization energy is the energy required to remove one electron from a neutral gaseous atom (or gaseous ion). It measures how strongly the nucleus attracts and holds onto its outermost electron.

(b) Cl has a greater effective nuclear charge than Na (Cl has more protons, with similar shielding within the same period), which — per Coulomb's Law (F proportional to q1q2/r^2) — means a stronger electrostatic attraction between Cl's nucleus and its outer electrons, making that electron harder (requiring more energy) to remove than Na's.

(c) Mg has a higher first ionization energy than Na. Both are in the same period; Mg has one more proton (greater nuclear charge) than Na with essentially the same amount of shielding, so Mg's outer electron is held more tightly.

(d) The first electron removed from Na comes from its single 3s valence electron. The SECOND electron would have to come from Na+'s remaining configuration, which is now a stable, filled noble-gas-like core ([Ne]) — removing a core electron requires vastly more energy because it's held much more tightly (closer to the nucleus, with much less shielding) than the loosely-held single valence electron was.` },

{ topic: '1.5', title: 'FRQ — Electron Configurations Across Period 3', content:
`A student is analyzing the electron configurations of elements in Period 3.

(a) Write the electron configuration for phosphorus (P).
(b) Explain why argon (Ar) has lower chemical reactivity than phosphorus.
(c) Predict whether sodium (Na) or sulfur (S) has a larger atomic radius, and justify your answer.
(d) Explain why transition metals do not always follow the standard Aufbau filling order when forming ions.`,
  answer: `(a) 1s2 2s2 2p6 3s2 3p3

(b) Argon has a completely filled valence shell (3s2 3p6), which is an especially stable, low-energy configuration that strongly resists gaining, losing, or sharing electrons. Phosphorus, with 3 unpaired electrons in its 3p subshell (3p3), is far more reactive since it can more readily gain, lose, or share electrons to reach a more stable configuration.

(c) Sodium has the larger atomic radius. Na and S are in the same period, but Na has fewer protons (less nuclear charge) with essentially the same electron shielding, so Na's outer electron is held less tightly and sits farther from the nucleus than S's.

(d) When forming ions, transition metals lose electrons from the higher-energy s-subshell (e.g., 4s) BEFORE losing electrons from the d-subshell, even though the s-subshell filled first during the neutral atom's Aufbau construction. This is because once electrons occupy the d subshell, a filled or half-filled d configuration becomes especially stable, and the effective energy ordering shifts so that the s-electrons become easier to remove than d-electrons. For example, iron loses its 4s electrons first to form Fe2+ = [Ar]3d6, not [Ar]4s2 3d4.` },

{ topic: '1.5', title: 'FRQ — Element Y: Electron Configuration, PES, Isotopes, and Ionization Energy', content:
`A sample of element Y has atomic number 12, with two common isotopes, Y-24 and Y-25.

(a) Write the complete ground-state electron configuration for a neutral atom of element Y.
(b) The complete photoelectron spectrum of element Y shows four peaks, labeled A, B, C, and D, in order from highest to lowest binding energy, with relative peak heights (electron counts) of 2 : 2 : 6 : 2. Identify the electron subshell corresponding to each peak, and justify your answer.
(c) The sample also contains isotope Y-25.
    i) Define the term "isotope."
    ii) Explain how the mass spectrum of element Y would reflect the presence of both isotopes.
(d) The first three ionization energies of element Y are: 1st = 738 kJ/mol, 2nd = 1450 kJ/mol, 3rd = 7730 kJ/mol. Using this data, determine the number of valence electrons in element Y. Justify your answer.
(e) Explain why the third ionization energy of element Y is significantly higher than the first and second.
(f) Element Z has atomic number 13. Predict which element, Y or Z, has the greater atomic radius, and justify your answer.`,
  answer: `(a) Element Y (Z=12) is magnesium: 1s2 2s2 2p6 3s2

(b) Peak A (highest binding energy, 2 electrons) = 1s
Peak B (2 electrons) = 2s
Peak C (6 electrons) = 2p
Peak D (lowest binding energy, 2 electrons) = 3s

This matches Mg's full configuration (1s2 2s2 2p6 3s2 = 2+2+6+2 = 12 electrons total), with binding energy decreasing as you move to subshells farther from the nucleus (1s tightest/highest BE, 3s valence/lowest BE).

(c) i) Isotopes are atoms of the same element (same number of protons) that have different numbers of neutrons (and therefore different mass numbers).
   ii) The mass spectrum would show two separate peaks, at m/z = 24 and m/z = 25, with relative peak heights corresponding to each isotope's natural abundance in the sample.

(d) There is a very large jump in ionization energy between the 2nd (1450 kJ/mol) and 3rd (7730 kJ/mol) ionization — roughly 5x — indicating that the 3rd electron removed comes from a full inner (core) shell rather than the valence shell. This means element Y has exactly 2 valence electrons.

(e) The 3rd ionization energy is much higher because, after removing the first 2 (valence) electrons, the third electron must be pulled from a full, stable inner shell — these core electrons are held much more tightly (closer to the nucleus, much less shielding) than valence electrons, requiring far more energy to remove.

(f) Element Y (Mg) has the greater atomic radius. Y and Z are in the same period (Z=13 is aluminum), but Z has one more proton (greater nuclear charge) with essentially the same shielding — pulling Z's outer electrons in more tightly and giving it a smaller radius than Y.` },

{ topic: '1.5', title: 'FRQ — Identifying an Element from a Complete Photoelectron Spectrum', content:
`The complete photoelectron spectrum of an element in its ground state shows six peaks, at the following binding energies (from highest to lowest): 647 x 10^-18 J, 70.2 x 10^-18 J, 55.7 x 10^-18 J, 7.10 x 10^-18 J, 4.07 x 10^-18 J, and 0.980 x 10^-18 J. The relative peak heights (electron counts) are 2, 2, 6, 2, 6, 2, respectively.

(a) i) Write the ground-state electron configuration of the element.
    ii) Identify the element.
(b) Calculate the wavelength, in meters, of electromagnetic radiation needed to remove an electron from the valence shell of an atom of this element.`,
  answer: `(a) i) Six peaks with electron counts 2, 2, 6, 2, 6, 2 correspond to the subshells 1s, 2s, 2p, 3s, 3p, 4s respectively: 1s2 2s2 2p6 3s2 3p6 4s2 (or [Ar]4s2).
   ii) Total electrons = 2+2+6+2+6+2 = 20 -> calcium (Ca)

(b) The lowest binding energy peak (0.980 x 10^-18 J) corresponds to the valence 4s electron — this is the minimum energy needed to remove it.
Using E = hc/lambda, solve for lambda = hc/E:
lambda = (6.626 x 10^-34 J.s)(2.998 x 10^8 m/s) / (0.980 x 10^-18 J)
= (1.987 x 10^-25) / (0.980 x 10^-18)
= 2.03 x 10^-7 m` },

{ topic: '1.5', title: 'FRQ — Identifying an Element from a 4-Peak PES and Comparing Ionization Energies', content:
`A scientist uses photoelectron spectroscopy (PES) to analyze an unknown element. The spectrum shows four peaks at relative binding energies of 500 MJ/mol, 50 MJ/mol, 10 MJ/mol, and 0.9 MJ/mol, with relative electron counts (heights) of 2, 8, 2, in the ratio corresponding to shell 1, shell 2, and shell 3 respectively (2 electrons in the first/innermost shell, 8 in the second, 2 in the third/outermost).

(a) Explain what information photoelectron spectroscopy (PES) provides about atomic structure.
(b) Identify the most likely element corresponding to this PES spectrum, and justify your choice.
(c) Compare the ionization energy of Mg to Al, and explain which is higher.
(d) Explain how effective nuclear charge (Zeff) influences PES peak positions.`,
  answer: `(a) PES measures the binding energy needed to remove electrons from different subshells of an atom, and the relative height of each peak shows how many electrons occupy that subshell. Together, this reveals an atom's full electron configuration (number of subshells/shells and how many electrons are in each).

(b) Magnesium. The spectrum implies 2 electrons in the innermost shell (n=1, i.e. 1s2), 8 electrons in the second shell (n=2, i.e. 2s2 2p6), and 2 electrons in the outermost shell (n=3, i.e. 3s2) — total 12 electrons, matching Mg's electron configuration 1s2 2s2 2p6 3s2.

(c) Mg has a HIGHER first ionization energy than Al. This is an exception to the general left-to-right increasing trend: Mg's valence configuration (3s2) is a stable, completely filled subshell, while Al's extra electron (3s2 3p1) sits in a higher-energy 3p orbital that is comparatively easier to remove — making Al's first IE lower than Mg's despite Al having one more proton.

(d) A higher effective nuclear charge pulls electrons in a given subshell closer to the nucleus and holds them more tightly, increasing their binding energy — which shifts that subshell's PES peak toward a HIGHER binding energy position on the spectrum. Conversely, more shielding (lower Zeff) results in weaker attraction and a lower binding energy (peak shifted toward lower binding energy).` },

{ topic: '1.5', title: 'FRQ — Identifying a Third-Period Element from Successive Ionization Energies', content:
`The successive ionization energies (in MJ/mol) for an unknown third-period element are: 1st = 0.58, 2nd = 1.82, 3rd = 2.75, 4th = 11.58, 5th = 14.84.

(a) Identify the unknown element and justify your answer.
(b) Explain why there is a large increase in ionization energy between the third and fourth electrons removed.
(c) Compare the first ionization energies of Al and Si, and predict which element has the higher value.
(d) Explain how the electron configuration of an element can be inferred from its ionization energy data.`,
  answer: `(a) Aluminum (Al). There is a large jump in ionization energy between the 3rd (2.75 MJ/mol) and 4th (11.58 MJ/mol) electron removed — about a 4x increase — indicating that the first 3 electrons removed are valence electrons, and the 4th comes from a core shell. This matches Al's configuration, [Ne]3s2 3p1, which has exactly 3 valence electrons.

(b) The first three electrons removed are Al's valence electrons (from n=3). The fourth electron must come from the filled, more tightly bound core shell (n=2), which is much closer to the nucleus and far less shielded — requiring significantly more energy to remove.

(c) Silicon has a higher first ionization energy than aluminum. Si has one more proton than Al (greater nuclear charge) with essentially the same shielding within the same period, so Si's outer electron is held more tightly and is harder to remove — this is the normal, expected periodic trend (no anomaly here, unlike the Mg/Al pair).

(d) A large jump between successive ionization energies marks the point where electron removal transitions from the valence shell to an inner, core shell. The position of that jump (i.e., after how many electrons are removed) directly reveals the number of valence electrons the element has, which in turn indicates its group number and can help confirm its electron configuration.` },

// ============================================================
// 1.6 Photoelectron Spectroscopy
// ============================================================
{ topic: '1.6', mcq: true, title: 'MCQ — Comparing 1s Binding Energies of He, Li, and Be', content:
`The binding energy of the 1s electrons in a helium atom is 2.37 MJ/mol. Which choice correctly identifies the binding energy values for the 1s electrons of lithium (Li) and beryllium (Be), with the correct justification?

Li (MJ/mol) | Be (MJ/mol) | Justification
(A) 6.26 | 11.5 | Li atoms have a smaller nuclear charge than Be atoms.
(B) 6.26 | 11.5 | Be atoms experience greater electron-electron repulsion than Li atoms do.
(C) 11.5 | 6.26 | Li atoms have a smaller nuclear charge than Be atoms.
(D) 11.5 | 6.26 | Be atoms experience greater electron-electron repulsion than Li atoms do.`,
  answer: `Correct answer: (A) Li = 6.26 MJ/mol, Be = 11.5 MJ/mol; Li atoms have a smaller nuclear charge than Be atoms.

1s binding energy increases with increasing nuclear charge, since the 1s electrons in He, Li, and Be all experience essentially the same (minimal) shielding as the innermost electrons. Nuclear charge order: He (Z=2) < Li (Z=3) < Be (Z=4), so binding energy must increase in the same order: 2.37 (He) < 6.26 (Li) < 11.5 (Be). The correct justification is the increasing nuclear charge pulling the 1s electrons in more tightly — not electron-electron repulsion, which is a much smaller effect for a filled, symmetric 1s orbital.` },

{ topic: '1.6', mcq: true, title: 'MCQ — Identifying the Higher-Binding-Energy Species Between Isoelectronic Ca2+ and Ar', content:
`The photoelectron spectra of the 1s electrons of two isoelectronic species, Ca2+ and Ar, show one peak, labeled X, at a distinctly higher binding energy than the other peak. Which correctly identifies the species associated with peak X, with valid justification?
(A) Ar, because it has completely filled energy levels
(B) Ar, because its radius is smaller than the radius of Ca2+
(C) Ca2+, because its nuclear mass is greater than that of Ar
(D) Ca2+, because its nucleus has two more protons than the nucleus of Ar has`,
  answer: `Correct answer: (D) Ca2+, because its nucleus has two more protons than the nucleus of Ar has

Ca2+ and Ar are isoelectronic (both have 18 electrons), but Ca2+ has 20 protons while Ar has only 18. The extra nuclear charge in Ca2+ pulls all its electrons — including the 1s core electrons — in more tightly, giving Ca2+ a HIGHER binding energy than Ar for every corresponding subshell. Peak X, at the higher binding energy, therefore belongs to Ca2+.

(C) correctly names Ca2+ but gives the wrong reason — it's nuclear CHARGE (proton count), not nuclear MASS, that determines electron binding energy.` },

{ topic: '1.6', title: 'FRQ — Wavelength for Removing a Valence Electron (Calcium)', content:
`See the previous question describing calcium's complete photoelectron spectrum (six peaks: 1s, 2s, 2p, 3s, 3p, 4s, with the valence 4s peak at the lowest binding energy, 0.980 x 10^-18 J per electron).

Calculate the wavelength, in meters, of electromagnetic radiation needed to remove an electron from a calcium atom's valence (4s) shell.`,
  answer: `Using E = hc/lambda, solve for lambda:
lambda = hc/E = (6.626 x 10^-34 J.s)(2.998 x 10^8 m/s) / (0.980 x 10^-18 J)
= 1.987 x 10^-25 / 0.980 x 10^-18
= 2.03 x 10^-7 m` },

// ============================================================
// 1.7 Periodic Trends
// ============================================================
{ topic: '1.7', mcq: true, title: 'MCQ — Most Exothermic Electron Affinity', content:
`Which element has the most exothermic electron affinity?
(A) Mg
(B) Br
(C) Na
(D) K`,
  answer: `Correct answer: (B) Br
Halogens (Group 17) have the most exothermic (most negative) electron affinities of any group, because they readily gain one electron to complete a stable octet. Br is the only halogen among the four choices; Mg, Na, and K don't readily accept electrons (they tend to lose electrons instead).` },

{ topic: '1.7', mcq: true, title: 'MCQ — Smallest Atomic Radius', content:
`Which element has the smallest atomic radius?
(A) Na
(B) S
(C) Mg
(D) Cl`,
  answer: `Correct answer: (D) Cl
Atomic radius decreases left to right across a period, due to increasing effective nuclear charge with the same shielding. Of Na, Mg, S, and Cl (all Period 3), Cl is furthest to the right, giving it the highest effective nuclear charge and thus the smallest radius.` },

{ topic: '1.7', mcq: true, title: 'MCQ — Identifying a True Statement About Periodic Trends', content:
`Which statement about periodic trends is true?
(A) Ionization energy increases going down a group.
(B) Atomic radius generally decreases across a period.
(C) Electronegativity decreases across a period.
(D) Electron affinity generally increases (becomes more exothermic) down a group.`,
  answer: `Correct answer: (B) Atomic radius generally decreases across a period.
This is true due to increasing effective nuclear charge across a period (with roughly constant shielding), pulling electrons closer to the nucleus. The other three statements all describe their respective trends backwards: ionization energy DECREASES down a group, electronegativity INCREASES across a period, and electron affinity generally becomes LESS exothermic (weaker) down a group.` },

{ topic: '1.7', mcq: true, title: 'MCQ — Determining Ion Charge from Successive Ionization Energies', content:
`Successive ionization energies for element X (in kJ/mol): 1st=736, 2nd=1450, 3rd=7740, 4th=10500, 5th=13600. What is the most likely formula for the ion of element X?
(A) X+
(B) X2+
(C) X3+
(D) X4+`,
  answer: `Correct answer: (B) X2+
The largest jump in ionization energy occurs between the 2nd (1450) and 3rd (7740) electron removed — over a 5-fold increase — indicating that element X has 2 valence electrons. Once both valence electrons are removed, X commonly forms a stable X2+ ion (a pattern typical of Group 2/alkaline earth elements).` },

{ topic: '1.7', mcq: true, title: 'MCQ — Comparing Electron Affinity of Carbon and Nitrogen', content:
`C(g) + e- -> C-(g), electron affinity = -121 kJ/mol
N(g) + e- -> N-(g), electron affinity > 0 kJ/mol

Why is the electron affinity of carbon more favorable (more negative/exothermic) than that of nitrogen?
(A) The electron added to carbon experiences less repulsion than the electron added to nitrogen.
(B) The electron added to carbon experiences a lesser effective nuclear charge than the electron added to nitrogen.
(C) The electron added to carbon goes into a lower electron shell than the electron added to nitrogen.
(D) The electron added to carbon goes into a lower-energy orbital than the electron added to nitrogen.`,
  answer: `Correct answer: (A) The electron added to carbon experiences less repulsion than the electron added to nitrogen.

Carbon (1s2 2s2 2p2) has an EMPTY 2p orbital available, so an added electron can occupy it without pairing up with an existing electron. Nitrogen (1s2 2s2 2p3) has all three 2p orbitals singly occupied (a stable, half-filled arrangement), so an added electron MUST pair up with an existing electron in the same orbital — the extra electron-electron repulsion from this forced pairing (plus the loss of nitrogen's extra half-filled-subshell stability) makes adding an electron to N much less favorable than adding one to C.` },

{ topic: '1.7', mcq: true, title: "MCQ — Fourth Ionization Energy of Boron", content:
`Boron's successive ionization energies are: 1st=801, 2nd=2427, 3rd=3660, 4th=?, 5th=32827 kJ/mol. Which identifies the most probable value for boron's 4th ionization energy, with the best justification?
(A) 4860 kJ/mol, because it removes a core electron
(B) 4860 kJ/mol, because it removes a valence electron
(C) 25026 kJ/mol, because it removes a core electron
(D) 25026 kJ/mol, because it removes a valence electron`,
  answer: `Correct answer: (C) 25026 kJ/mol, because it removes a core electron

Boron's configuration is 1s2 2s2 2p1, giving it exactly 3 valence electrons. The 4th ionization must remove a core (1s) electron, which is held much more tightly (closer to the nucleus, minimal shielding) than the three valence electrons — producing a dramatic jump in ionization energy, consistent with 25026 kJ/mol rather than a more modest valence-level value like 4860 kJ/mol.` },

{ topic: '1.7', mcq: true, title: 'MCQ — Identifying the Most Electronegative Element from Configuration', content:
`Which electron configuration represents the element with the highest electronegativity?
(A) 1s2 2s2 2p3
(B) 1s2 2s2 2p4
(C) 1s2 2s2 2p6 3s2
(D) 1s2 2s2 2p6 3s2 3p1`,
  answer: `Correct answer: (B) 1s2 2s2 2p4
These configurations correspond to N (A), O (B), Na (C), and Al (D) respectively. Electronegativity increases left to right across a period and decreases going down a group, so the most electronegative of these four is the one closest to the top-right of the periodic table: oxygen.` },

{ topic: '1.7', mcq: true, title: 'MCQ — Ranking Ionic Radii of an Isoelectronic Series', content:
`Consider the ions S2-, Cl-, K+, and Ca2+. Which correctly arranges them in order of increasing ionic radius?
(A) Ca2+ < K+ < Cl- < S2-
(B) S2- < Cl- < K+ < Ca2+
(C) K+ < Ca2+ < Cl- < S2-
(D) Cl- < S2- < Ca2+ < K+`,
  answer: `Correct answer: (A) Ca2+ < K+ < Cl- < S2-

These four ions are isoelectronic — all have 18 electrons. Since electron count is the same, the ion with MORE protons pulls its electron cloud in tighter (smaller radius), and fewer protons means a larger radius.
Protons: Ca2+ = 20, K+ = 19, Cl- = 17, S2- = 16.
More protons -> smaller ion, so: Ca2+ (20p, smallest) < K+ (19p) < Cl- (17p) < S2- (16p, largest).` },

{ topic: '1.7', mcq: true, title: 'MCQ — Identifying Two Elements from Successive Ionization Energy Data', content:
`Table 1 — Element X: IE1=1313, IE2=3373, IE3=6050, IE4=8400, IE5=22800, IE6=32600 (kJ/mol)
Table 2 — Element Y: IE1=1086, IE2=2353, IE3=4620, IE4=6223, IE5=37831, IE6=47277 (kJ/mol)

Based on this data, which correctly identifies X and Y, respectively?
(A) Be and Mg
(B) Mg and Be
(C) Si and C
(D) C and Si`,
  answer: `Correct answer: (C) Si and C

Both elements show their largest ionization energy jump between the 4th and 5th electron removed, indicating 4 valence electrons each — consistent with Group 14 (carbon's group).

Element Y's values (1086, 2353, 4620, 6223, 37831, 47277 kJ/mol) match real carbon data almost exactly, confirming Y = carbon.

Since carbon (period 2) has a smaller atomic radius and less electron shielding than silicon (period 3, directly below carbon in the same group), carbon holds its electrons more tightly and has HIGHER ionization energies than silicon at every corresponding step. Element X's values are consistently lower than Y's would need to be for X to be carbon, and are instead consistent with the larger, more easily ionized silicon atom — so X = silicon.` },

{ topic: '1.7', title: 'FRQ — Explaining the Decrease in Atomic Radius Across a Period', content:
`(a) Explain why atomic radius decreases across a period.
(b) Predict which element has the smaller atomic radius: Mg or Al. Justify your answer based on periodic trends.
(c) Sodium and chlorine are in the same period. Compare their atomic radii and explain the difference.`,
  answer: `(a) Atomic radius decreases across a period because effective nuclear charge increases (more protons are added while the number of shielding inner-shell electrons stays roughly constant), pulling the valence electrons closer to the nucleus.

(b) Al has the smaller atomic radius. Al has one more proton than Mg (both in Period 3, same shielding), so its increased nuclear charge pulls its outer electrons in more tightly.

(c) Na has a larger atomic radius than Cl. Both are in Period 3, so they have the same electron shielding, but Cl has significantly more protons (higher effective nuclear charge), pulling its valence electrons in much more tightly than Na's single, loosely-held valence electron.` },

{ topic: '1.7', title: 'FRQ — First Ionization Energy Comparisons', content:
`(a) Define first ionization energy.
(b) Compare the first ionization energies of Li and Na. Justify your answer using effective nuclear charge and electron shielding.
(c) Explain why the first ionization energy of oxygen is slightly lower than that of nitrogen, despite the general periodic trend.`,
  answer: `(a) First ionization energy is the energy required to remove one electron from a neutral gaseous atom in its ground state.

(b) Na has a lower first ionization energy than Li. Although Na has more protons than Li, it also has significantly more shielding (more inner electron shells) and a much larger atomic radius, so its valence electron is held less tightly overall — making it easier (requiring less energy) to remove than Li's valence electron.

(c) Oxygen's configuration is 2p4, meaning one of its 2p orbitals holds a pair of electrons. The electron-electron repulsion between this paired set makes one of them easier to remove than the general trend predicts, giving O a slightly LOWER first ionization energy than nitrogen (2p3, all orbitals singly occupied — a stable, half-filled configuration).` },

{ topic: '1.7', title: 'FRQ — Ionic Radius Comparisons', content:
`(a) Define ionic radius.
(b) Predict whether a Mg2+ ion or a Na+ ion will have the smaller ionic radius, and justify your answer.
(c) Explain how the ionic radius changes when sulfur forms an anion (S2-).`,
  answer: `(a) Ionic radius is the distance from the nucleus of an ion to its outermost electron(s).

(b) Mg2+ has the smaller ionic radius. Mg2+ and Na+ are isoelectronic (both have the configuration 1s2 2s2 2p6, 10 electrons), but Mg has one more proton (12 vs. 11) than Na — the greater nuclear charge in Mg2+ pulls its electron cloud in more tightly, giving it a smaller radius.

(c) When sulfur gains 2 electrons to form S2-, the added electron-electron repulsion (more electrons competing for the same nuclear attraction, without any change in nuclear charge) causes the electron cloud to expand — so S2- has a noticeably LARGER radius than the neutral sulfur atom.` },

{ topic: '1.7', title: 'FRQ — Period 3 Periodic Property Applications', content:
`A materials scientist is studying elements across Period 3 (Na to Cl) for potential use in flame-retardant compounds.

(a) The atomic radii of Na, Mg, and Al decrease across Period 3. Explain this trend using nuclear charge and electron shielding.
(b) Chlorine and iodine are both Group 17 elements. Predict which has a greater first ionization energy, and justify your answer using Coulomb's Law and periodic position.
(c) The electron affinity of chlorine is more negative (more exothermic) than that of fluorine, even though fluorine is more electronegative. Explain this anomaly using atomic structure and electron repulsion.
(d) A student proposes the isoelectronic series O2-, F-, Na+, Mg2+. Rank these in order of increasing ionic radius, and justify your answer using effective nuclear charge.
(e) Magnesium and nitrogen form the compound Mg3N2. Compare the relative ionic radii of Mg2+ and N3-, and justify your answer using effective nuclear charge and electron configuration.
(f) Predict whether sodium or phosphorus is more likely to form a basic metal oxide. Justify your answer.`,
  answer: `(a) Across Period 3, nuclear charge (proton count) increases while the number of shielding inner-shell electrons stays roughly constant, so effective nuclear charge increases from Na to Al. This pulls the valence electrons progressively closer to the nucleus, decreasing atomic radius.

(b) Chlorine has the greater first ionization energy. Cl has fewer electron shells and a much smaller atomic radius than iodine (directly below it, same group), so its valence electrons are held closer to (and more strongly attracted by) the nucleus — per Coulomb's Law, this stronger attraction means more energy is needed to remove an electron. Iodine's valence electrons are much farther out and more heavily shielded, making them easier to remove.

(c) Fluorine's atomic radius is very small, so its 2p orbitals are tightly packed together — adding another electron to fluorine causes significant electron-electron repulsion among its already-crowded outer electrons. Chlorine, being larger with a 3p subshell that has more room, experiences much less of this repulsion when it gains an electron, making chlorine's electron affinity more exothermic (more negative) than fluorine's despite fluorine being the more electronegative element overall.

(d) Order (smallest to largest): Mg2+ < Na+ < F- < O2-
All four species are isoelectronic (10 electrons each), so the ion with the greatest nuclear charge (most protons) has the strongest pull on that fixed number of electrons, giving it the smallest radius. Proton counts: Mg2+=12, Na+=11, F-=9, O2-=8 — more protons means smaller radius, so this order goes from most protons (smallest) to fewest protons (largest).

(e) N3- has a larger ionic radius than Mg2+. Both have 10 electrons, but Mg2+ has 12 protons (strong pull on a relatively small electron cloud, giving a small radius), while N3- has only 7 protons pulling on the same number of electrons (much weaker attraction per electron, plus more electron-electron repulsion from the extra 3 electrons added), resulting in a considerably larger electron cloud/radius.

(f) Sodium is more likely to form a basic oxide. Sodium is a metal, and metal oxides are generally basic (e.g., Na2O + H2O -> 2NaOH). Phosphorus is a nonmetal, and nonmetal oxides are generally acidic (e.g., P4O10 reacts with water to form H3PO4, a strong acid).` },

{ topic: '1.7', title: "FRQ — Ionization Energy, Coulomb's Law, and the 2s-2p Anomaly", content:
`(a) Explain the relationship between ionization energy and Coulomb's Law.
(b) Rank the elements Be, B, and Li in order of increasing first ionization energy, and justify your answer.`,
  answer: `(a) Ionization energy is closely tied to the electrostatic (Coulombic) attraction between the nucleus and the electron being removed. Per Coulomb's Law, stronger attraction (from higher nuclear charge and/or smaller atomic radius, i.e., shorter distance between nucleus and electron) means it takes more energy to overcome that attraction and remove the electron — so higher effective nuclear charge and smaller radius both correspond to higher ionization energy.

(b) Correct order: Li < B < Be

Nuclear charge increases in the order Li < B < Be would normally predict IE increasing in that same order straightforwardly (Li lowest, Be highest) — and indeed Be does have the highest IE of the three. However, boron's outermost electron sits in a higher-energy 2p orbital (rather than 2s, like Be's outermost electron), and 2p electrons are slightly farther from the nucleus / more shielded by the 2s2 electrons than a 2s electron would be — making B's electron somewhat easier to remove than Be's, despite B having one more proton than Be were it not for this sublevel effect. Result: Li (lowest, only 1 proton beyond the core) < B (2p electron, slightly "de-stabilized" relative to nuclear charge alone) < Be (highest, filled stable 2s2 configuration with no such de-stabilizing effect).` },

{ topic: '1.7', title: 'FRQ — Consistency of Ionic Radius Trends for Anions and Cations', content:
`(a) Compare the sizes of a Cl- ion and a K+ ion, and explain the factors that contribute to the difference.
(b) Predict whether the trend in ionic radii is consistent across a period for both anions and cations. Justify your answer.`,
  answer: `(a) K+ is smaller than Cl-. Both ions are isoelectronic (18 electrons each, configuration 1s2 2s2 2p6 3s2 3p6), but K has 19 protons compared to Cl's 17 — the greater nuclear charge in K+ pulls its (same-sized) electron cloud in more tightly, making it smaller than Cl-.

(b) Yes, the general trend (ionic radius decreasing with increasing nuclear charge, for a fixed electron count/isoelectronic series) holds consistently for both anions and cations across a period. Moving across a period, cations become smaller as their positive charge increases (more electrons are removed relative to the fixed proton count, strengthening the pull on the remaining electrons), and even though anions carry a negative charge, the increasing nuclear charge across the period still dominates over the extra electron-electron repulsion from any additional electrons gained, so anion radii also trend smaller moving across a period.` },

{ topic: '1.7', title: 'FRQ — Predicting Properties of a Hypothetical Group 2 Element', content:
`A new element X is found in Group 2, Period 5.

(a) i) Predict the ion charge of element X and the typical compound type formed when X reacts with fluorine.
    ii) Determine, with a reason, whether the percentage of ionic character in the compound formed in (i) is higher or lower compared to that of magnesium fluoride (MgF2).
(b) Compare the expected first ionization energy of element X with that of magnesium. Justify your answer based on periodic trends.`,
  answer: `(a) i) As a Group 2 element, X will form a 2+ ion, and will react with fluorine (a highly electronegative nonmetal) to form an ionic compound, XF2.
   ii) The compound XF2 will have a HIGHER percentage of ionic character than MgF2. Electronegativity decreases going down a group, so element X (Period 5) has a lower electronegativity than magnesium (Period 3). This creates a LARGER electronegativity difference between X and F than between Mg and F, and a larger electronegativity difference corresponds to greater ionic character in the bond.

(b) Element X has a LOWER first ionization energy than magnesium. Moving down Group 2, atomic radius increases and electron shielding increases with each additional shell, so X's valence electrons are farther from the nucleus and more shielded than Mg's, making them easier to remove.` },

// ============================================================
// 1.8 Valence Electrons and Ionic Compounds
// ============================================================
{ topic: '1.8', mcq: true, title: 'MCQ — Empirical Formula of an Oxide of an Unknown Element X', content:
`Ionization energies of element X (kJ/mol): 1st=738, 2nd=1451, 3rd=7733, 4th=10543, 5th=13630. Based on this data, which is most likely to be the empirical formula of an oxide of element X?
(A) XO
(B) XO2
(C) X2O
(D) X2O3`,
  answer: `Correct answer: (A) XO
The largest jump in ionization energy occurs between the 2nd (1451) and 3rd (7733) electron removed — over a 5x increase — indicating element X has 2 valence electrons and forms a 2+ cation.
Oxygen forms a 2- anion (O2-). A 2+ cation paired with a 2- anion combines in a 1:1 ratio: XO.` },

{ topic: '1.8', title: 'FRQ — Formal charge is not tested in this unit; placeholder removed', content: '', answer: '', skip: true },

];

async function main() {
  const toInsert = questions.filter(q => !q.skip);
  const { data: existing } = await sb.from('questions').select('id, topic_id, order_index');
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0, failed = 0;
  for (const q of toInsert) {
    const topicId = TOPICS[q.topic];
    if (!topicId) { console.error('Unknown topic:', q.topic, q.title); failed++; continue; }
    const orderIndex = (maxOrderByTopic[topicId] ?? -1) + 1;
    maxOrderByTopic[topicId] = orderIndex;

    const content = q.mcq ? q.content + JUSTIFY : q.content;

    const { error } = await sb.from('questions').insert({
      title: q.title,
      content,
      topic_id: topicId,
      order_index: orderIndex,
      image_url: null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); failed++; continue; }
    inserted++;
    console.log(`[${inserted}/${toInsert.length}] (${q.topic}) ${q.title} ... inserted`);
  }
  console.log(`\nDone. ${inserted} inserted, ${failed} failed.`);
}

main();
