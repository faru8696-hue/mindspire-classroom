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
  '3.8': '76e96e76-219d-411d-b3fa-2cc8bdcd02d5',
  '3.9': '20aae461-9149-4817-ba40-fcaed2d474a1',
  '3.10': '86646ce4-d71a-4a65-8d75-d3394d274479',
  '3.11': '25cb3403-4eab-4ee1-ae0b-e1f5e89f237a',
  '3.12': '776ad9bf-86ac-438f-8e69-61dc508c1443',
  '3.13': '3221f729-653c-4625-88c9-263ecec18c4e',
};

/* ============================= 3.8 Representations of Solutions ============================= */
const topic38New = [
  {
    title: 'Q8 — Particle Diagram for Diluting 0.10 M MgCl2 to 0.05 M',
    content: `A particulate diagram of 0.10 M MgCl2(aq) shows 2 Mg2+ ions and 4 Cl- ions in a fixed magnified volume (water molecules not shown).

Describe (in words, or by sketching) a particulate diagram of 0.05 M MgCl2(aq), using the same magnified volume, and explain how you determined the number and ratio of ions to draw.`,
    answer: `Since 0.05 M is exactly half of 0.10 M, halving the concentration means halving the number of each ion shown while keeping the same magnified volume: the 0.05 M diagram should show 1 Mg2+ ion and 2 Cl- ions (half of 2 Mg2+ and half of 4 Cl-). The 2:1 ratio of Cl- to Mg2+ must be preserved in both diagrams because that ratio reflects the fixed 1:2 formula ratio of MgCl2 (each formula unit releases one Mg2+ and two Cl- ions upon dissolving) — only the total number of ions shown changes with concentration, not the ratio between the two types of ions.`,
  },
  {
    title: 'Q9 — Orientation of Water Molecules Around a Central Cation',
    content: `Describe how four water molecules would be oriented around a central Mg2+ ion dissolved in water, and explain the reasoning behind this orientation in terms of intermolecular forces.`,
    answer: `Each water molecule would orient with its partially negative oxygen atom pointed toward the Mg2+ ion, and its two partially positive hydrogen atoms pointed away from the ion. This is because Mg2+ is a cation (positively charged), and the ion-dipole attraction between the cation and the water molecules' dipoles is strongest when the negative end of each water molecule's dipole (the oxygen, which carries a partial negative charge due to oxygen's high electronegativity) faces the positive ion, maximizing the Coulombic attraction between the ion and the water molecule's negative pole. With four water molecules arranged this way around the ion, their oxygen atoms would be roughly evenly spaced around the Mg2+ ion, each pointing an oxygen lone pair/negative end directly at the ion.`,
  },
];

/* ============================= 3.9 Separation of Solutions and Mixtures/Chromatography ============================= */
const topic39New = [
  {
    title: 'Q19 — Effect of an Over-Run Solvent Front on a Calculated Rf Value',
    content: `A student performing paper chromatography allows the separation to continue overnight, well past the point where the solvent front reaches the top edge of the paper (the solvent continues to evaporate and run off the top of the paper after reaching the edge).

The student wants to determine whether the mixture contains a particular substance with a known Rf value of 0.343.

(a) What experimental measurement is directly affected by allowing the solvent to run off the top of the paper?
(b) Explain the effect this error would have on the student's calculated Rf value for a spot compared to its true Rf value.`,
    answer: `(a) The measured distance traveled by the solvent front is affected: once the solvent front reaches and then runs off the top edge of the paper, its true final position can no longer be measured directly, since the leading edge of the solvent is no longer confined to the visible area of the paper.

(b) Rf = (distance traveled by the component) / (distance traveled by the solvent). If the solvent is allowed to run off the edge of the paper, a student who mistakenly uses the full length of the paper (rather than the solvent's true travel distance, which is now unknown and effectively larger than the paper) as the "distance traveled by solvent" will use a distance in the denominator that is too large. Since the actual, effective distance traveled by the solvent grew larger than what is being measured, this causes the calculated Rf value to come out artificially small (smaller than the true Rf), because the same numerator (distance traveled by the component, which is fixed once the component's spot dries/stops moving) is now being divided by an overestimated denominator. The experiment should be repeated with a shorter run time, stopping as soon as the solvent front nears the top of the paper, to obtain an accurate Rf value.`,
  },
  {
    title: 'Q20 — Distillation Order for Acetone, Diethyl Ether, and Ethanol',
    content: `A mixture containing acetone (CH3COCH3, boiling point 56°C), diethyl ether (C2H5OC2H5, boiling point 34.6°C), and ethanol (C2H5OH, boiling point 78.4°C) is separated by simple distillation.

In what order would the three substances be collected, and why?`,
    answer: `Order collected: diethyl ether first, then acetone, then ethanol.

In simple distillation, the mixture is heated and the component with the lowest boiling point vaporizes first (since it requires the least energy to overcome its intermolecular forces and escape into the gas phase), and is therefore collected (after condensing) first. Diethyl ether has the lowest boiling point (34.6°C) of the three, so it distills over first. Acetone has the next-lowest boiling point (56°C), so it distills over second. Ethanol has the highest boiling point (78.4°C), due to its ability to hydrogen-bond (unlike diethyl ether or acetone, which lack an O-H or N-H group), so it requires the highest temperature to vaporize and is collected last.`,
  },
  {
    title: 'Q21 — Choosing Between Thin-Layer and Paper Chromatography for Two Amino Acids',
    content: `Serine (polar) and glycine (nonpolar side chain) are two unlabeled amino acids that need to be identified and distinguished from each other.

(a) Explain why thin-layer chromatography (TLC) might be a more appropriate choice than paper chromatography for distinguishing these two amino acids.
(b) Describe how the resulting chromatogram would differ for the two amino acids, and explain why.`,
    answer: `(a) TLC uses a stationary phase (commonly silica gel or alumina coated onto a plate) that can be selected to interact more strongly and more consistently with a wider range of polarities than paper's cellulose stationary phase, and TLC plates generally give sharper, more reproducible spots with better resolution between compounds of similar (but not identical) polarity. Since serine and glycine differ specifically in polarity, TLC's ability to more finely separate substances by their differing affinities for the stationary vs. mobile phase makes it more appropriate for reliably distinguishing two closely related amino acids.

(b) Glycine, being much less polar (its side chain is just a hydrogen atom), would interact more weakly with the polar stationary phase and more strongly with a moderately polar mobile phase, so it would travel farther up the plate, giving glycine a larger Rf value. Serine, being more polar (it has a hydroxyl-containing side chain), would interact more strongly with the polar stationary phase, causing it to be retained closer to the origin and travel a shorter distance, giving serine a smaller Rf value.`,
  },
];

/* ============================= 3.10 Solubility ============================= */
const topic310New = [
  {
    title: 'Q12 — Predicting Hexane vs. Water Solubility for NaCl, Propane, CO2, and Formaldehyde',
    content: `For each substance below, identify the type(s) of intermolecular forces it can form with a solvent, and predict whether it would dissolve better in hexane (C6H14, nonpolar) or in water (H2O, polar).

(a) NaCl
(b) Propane, C3H8
(c) CO2
(d) Formaldehyde, CH2O`,
    answer: `(a) NaCl: NaCl is ionic. In water, Na+ and Cl- ions are stabilized by strong ion-dipole attractions to water's polar molecules, which is enough to overcome the strong ionic lattice energy. Hexane is nonpolar and cannot form ion-dipole attractions, so NaCl would dissolve far better in water.

(b) Propane: Propane is a small, nonpolar hydrocarbon that only experiences London dispersion forces. Like dissolves like, so propane dissolves much better in nonpolar hexane (dispersion forces between propane and hexane) than in polar water, where it would disrupt water's hydrogen-bonding network without forming comparably strong attractions in return.

(c) CO2: CO2 is linear and nonpolar overall (its two C=O bond dipoles point in opposite directions and cancel), so it experiences only London dispersion forces. Like propane, CO2 dissolves better in nonpolar hexane than in polar water (though CO2 does have some limited solubility in water due to induced-dipole interactions and reaction to form carbonic acid, its solubility based on IMF matching alone favors hexane).

(d) Formaldehyde: CH2O is polar (bent/trigonal planar around a C=O with asymmetric H atoms), so it experiences dipole-dipole attractions in addition to dispersion forces, and can also accept hydrogen bonds from water through its oxygen lone pairs (though it has no O-H or N-H bond of its own to donate). Because formaldehyde is polar and can hydrogen-bond with water, it dissolves better in water than in nonpolar hexane.`,
  },
  {
    title: 'Q13 — Ranking Three Alcohols/Alkane by Water Solubility (Multiple Choice)',
    mcq: true,
    content: `Rank the following three substances from most soluble to least soluble in water:
1-Propanol (CH3CH2CH2OH), ethylene glycol (HOCH2CH2OH), and butane (CH3CH2CH2CH3)

(A) Butane > 1-propanol > ethylene glycol
(B) Ethylene glycol > 1-propanol > butane
(C) 1-propanol > ethylene glycol > butane
(D) Ethylene glycol > butane > 1-propanol`,
    answer: `Correct answer: (B) Ethylene glycol > 1-propanol > butane

Ethylene glycol has two -OH groups, giving it more hydrogen-bond donor/acceptor sites per molecule to interact with water than 1-propanol, which has only one -OH group; both are similar in carbon count, but ethylene glycol's extra polar -OH group makes it even more water-soluble than 1-propanol. Butane has no polar functional groups at all — it is a purely nonpolar hydrocarbon that can only form weak London dispersion forces with water, and cannot hydrogen-bond with it, making it the least soluble of the three (butane's solubility in water is very low). Since more hydrogen-bonding capability with water corresponds to greater water solubility (all else being similar), the ranking from most to least soluble is ethylene glycol > 1-propanol > butane.`,
  },
  {
    title: 'Q14 — Ranking CO2, CH4, PH3, and N2 by Water Solubility (Multiple Choice)',
    mcq: true,
    content: `Which of the following gases would be expected to be most soluble in water?
(A) N2
(B) CH4
(C) PH3
(D) CO2`,
    answer: `Correct answer: (D) CO2

Of the four gases, CO2 is the only one that reacts with water (forming small amounts of carbonic acid, H2CO3) in addition to having a small dipole-induced-dipole interaction, both of which increase its solubility above what dispersion forces alone would predict. N2 and CH4 are both essentially nonpolar and experience only weak London dispersion forces with water, giving them very low solubility. PH3 is weakly polar (P-H bonds have a small dipole due to phosphorus's low electronegativity, and phosphorus is too large/not electronegative enough for hydrogen bonding), so it is somewhat more soluble than N2 or CH4 but still much less soluble than CO2. Because CO2 both reacts with water and forms slightly stronger induced-dipole interactions than the purely nonpolar gases, it is the most soluble of the four.`,
  },
  {
    title: 'Q15 — Comparing Hydration Strength of Ion Pairs Using Coulomb\'s Law',
    content: `For each pair of ions below, determine which ion would be more strongly hydrated (attracted to surrounding water molecules), and explain your reasoning using Coulomb's law.

(a) Na+ (ionic radius 102 pm) or Li+ (ionic radius 76 pm)
(b) Na+ (charge +1) or Mg2+ (charge +2, similar ionic radius)
(c) ClO4- (larger anion) or ClO2- (smaller anion, both charge -1)`,
    answer: `By Coulomb's law, the electrostatic (ion-dipole) attraction between an ion and a water molecule is proportional to the ion's charge and inversely proportional to the square of the distance between the ion and the water molecule's dipole (which scales with the ion's radius): F ∝ (charge) / r^2.

(a) Li+ is more strongly hydrated than Na+. Both ions have the same +1 charge, but Li+ has a smaller ionic radius (76 pm vs. 102 pm for Na+), which allows water molecules to approach closer to the center of charge, producing a stronger ion-dipole attraction.

(b) Mg2+ is more strongly hydrated than Na+. Despite having a similar ionic radius, Mg2+ has twice the charge of Na+ (+2 vs. +1), producing a much stronger Coulombic attraction to the partially negative oxygen atoms of surrounding water molecules.

(c) ClO2- is more strongly hydrated than ClO4-. Both anions carry the same -1 charge, but ClO2- is the smaller ion (fewer oxygen atoms spreading out the negative charge over a smaller region), allowing water molecules' partially positive hydrogen atoms to approach more closely and interact more strongly than they can with the larger, more diffuse ClO4- ion.`,
  },
];

/* ============================= 3.11 Spectroscopy and the Electromagnetic Spectrum ============================= */
const topic311New = [
  {
    title: 'Q14 — Identifying an Unknown Gas as NO2 or N2O4 Using Visible Spectroscopy',
    content: `NO2 gas is reddish-brown in color, while N2O4 gas (which NO2 exists in equilibrium with) is colorless. A student has an unknown sample that is known to contain either NO2 or N2O4 (or an equilibrium mixture of both).

Which type of spectroscopy would be the most appropriate choice to help determine the relative amount of NO2 present in the sample, and why?`,
    answer: `Ultraviolet-visible (UV-Vis) spectroscopy would be the most appropriate choice. Because NO2 absorbs light in the visible region of the electromagnetic spectrum (giving it its reddish-brown color) while N2O4 does not absorb visible light (it is colorless), the amount of visible light absorbed by the sample at NO2's characteristic absorption wavelength directly indicates how much NO2 (as opposed to colorless N2O4) is present. Since UV-Vis spectroscopy is specifically suited to detect and quantify electronic transitions caused by the absorption of visible (and near-UV) light in colored substances, it is well matched to distinguishing NO2 from N2O4 based on this color difference; other types of spectroscopy that probe rotational or vibrational transitions (e.g., microwave or infrared) would not exploit this particular color-based difference between the two gases.`,
  },
  {
    title: 'Q15 — Identifying the Type of Radiation Responsible for an Electronic Transition',
    content: `A gaseous sample undergoes a transition described by the electron configuration change 1s2 2s2 2p5 → 1s2 2s2 2p4 3s1.

What type (region) of electromagnetic radiation would be responsible for causing this transition, and why?`,
    answer: `This transition involves an electron moving from the 2p subshell to a higher-energy 3s subshell — an electronic transition between different principal energy levels/subshells within the atom. Electronic transitions of this kind are associated with ultraviolet or visible (UV-Vis) radiation, since the energy required to promote an electron between electronic energy levels is generally on the order of several electron-volts, matching the photon energies found in the UV-visible portion of the electromagnetic spectrum. (This is in contrast to rotational transitions, associated with lower-energy microwave radiation, and vibrational transitions, associated with intermediate-energy infrared radiation.)`,
  },
  {
    title: 'Q16 — Identifying the Type of Radiation Responsible for Bond Bending in Water',
    content: `What type (region) of electromagnetic radiation would be responsible for causing the bending motion of the O-H bonds in a water molecule, and why?`,
    answer: `Infrared (IR) radiation would be responsible for this transition. The bending (and stretching) of covalent bonds within a molecule are vibrational motions, and the energy required to excite a molecule from one vibrational energy level to the next is smaller than the energy needed for electronic transitions but larger than the energy needed for rotational transitions. This intermediate amount of energy corresponds to photons in the infrared region of the electromagnetic spectrum, which is why infrared radiation is specifically associated with vibrational motions such as bond bending and bond stretching.`,
  },
];

/* ============================= 3.12 Photoelectric Effect ============================= */
const topic312New = [
  {
    title: 'Q15 — Frequency, Wavelength, and Color of Light from a Given Photon Energy',
    content: `When a particular metal surface is exposed to light of increasing frequency, electrons first begin to be ejected from the metal when the energy of the incident photons reaches 3.3 x 10^-19 J.

(a) Calculate the frequency of light with this photon energy.
(b) Calculate the wavelength of this light.
(c) Using the approximate visible-light color ranges (violet 380-450 nm, blue 450-495 nm, green 495-570 nm, yellow 570-590 nm, orange 590-620 nm, red 620-750 nm), identify the color of this light.`,
    answer: `(a) E = hf, so f = E/h = (3.3 x 10^-19 J) / (6.626 x 10^-34 J s) = 4.98 x 10^14 Hz

(b) c = fλ, so λ = c/f = (3.00 x 10^8 m/s) / (4.98 x 10^14 Hz) = 6.02 x 10^-7 m = 602 nm

(c) A wavelength of about 602 nm falls at the boundary between yellow (570-590 nm) and orange (590-620 nm), and is most consistent with orange light.`,
  },
  {
    title: 'Q16 — Photon Energy of Light Absorbed by CuSO4 Solution',
    content: `A CuSO4 solution is found to absorb light most strongly at a wavelength of 635 nm.

Calculate the energy of one photon of this light.`,
    answer: `E = hc/λ = (6.626 x 10^-34 J s)(3.00 x 10^8 m/s) / (635 x 10^-9 m) = (1.988 x 10^-25 J m) / (6.35 x 10^-7 m) = 3.13 x 10^-19 J`,
  },
  {
    title: 'Q17 — Frequency and Wavelength Needed to Remove a Valence Electron from Potassium',
    content: `The first ionization energy of potassium is 418.8 kJ/mol, corresponding to removal of its single valence (4s1) electron.

(a) Write the ground-state electron configuration of potassium and identify its valence electron(s).
(b) Calculate the minimum frequency of light needed to remove potassium's valence electron via the photoelectric effect.
(c) Calculate the corresponding wavelength, and identify the region of the electromagnetic spectrum this falls in.`,
    answer: `(a) Potassium's ground-state electron configuration is 1s2 2s2 2p6 3s2 3p6 4s1. Its valence electron is the single 4s1 electron (the electrons in the 3p6 and lower subshells are core, not valence, electrons).

(b) First, convert the ionization energy to energy per atom/electron:
E = (418.8 x 10^3 J/mol) / (6.022 x 10^23 electrons/mol) = 6.955 x 10^-19 J per electron

f = E/h = (6.955 x 10^-19 J) / (6.626 x 10^-34 J s) = 1.05 x 10^15 Hz

(c) λ = c/f = (3.00 x 10^8 m/s) / (1.05 x 10^15 Hz) = 2.86 x 10^-7 m = 286 nm

A wavelength of 286 nm falls in the ultraviolet region of the electromagnetic spectrum.`,
  },
  {
    title: 'Q18 — Maximum Wavelength Needed to Eject an Electron from Sodium',
    content: `The energy required to eject an electron from sodium metal via the photoelectric effect is 275 kJ/mol.

What is the maximum wavelength (in nm) of light that can still supply enough energy per photon to eject an electron from sodium?`,
    answer: `First, convert the energy to energy per atom:
E = (275 x 10^3 J/mol) / (6.022 x 10^23 atoms/mol) = 4.567 x 10^-19 J per atom

Using E = hc/λ, solve for λ:
λ = hc/E = (6.626 x 10^-34 J s)(3.00 x 10^8 m/s) / (4.567 x 10^-19 J) = (1.988 x 10^-25 J m) / (4.567 x 10^-19 J) = 4.35 x 10^-7 m = 435 nm

This is the maximum (longest) wavelength that supplies just enough energy per photon to eject an electron; any wavelength longer than 435 nm would correspond to lower-energy photons that are insufficient to remove an electron from sodium, regardless of light intensity.`,
  },
  {
    title: 'Q19 — Determining Whether 415 nm Light Can Ionize Gaseous Silver',
    content: `The (first) ionization energy of silver is 731 kJ/mol.

Is light with a wavelength of 415 nm sufficient to remove an electron from a gaseous silver atom via the photoelectric effect? Support your answer with a calculation.`,
    answer: `Energy required per atom:
E(required) = (731 x 10^3 J/mol) / (6.022 x 10^23 atoms/mol) = 1.214 x 10^-18 J per atom

Energy supplied by a 415 nm photon:
E(photon) = hc/λ = (6.626 x 10^-34 J s)(3.00 x 10^8 m/s) / (415 x 10^-9 m) = (1.988 x 10^-25 J m) / (4.15 x 10^-7 m) = 4.79 x 10^-19 J

Since the energy supplied by a single 415 nm photon (4.79 x 10^-19 J) is less than the energy required to remove an electron from silver (1.214 x 10^-18 J), 415 nm light is NOT sufficient to ionize gaseous silver, regardless of the light's intensity — increasing intensity only increases the number of photons per second, not the energy carried by each individual photon.`,
  },
];

/* ============================= 3.13 Beer-Lambert Law ============================= */
const topic313New = [
  {
    title: 'Q15 — Reading Concentration from a Calibration Curve Equation',
    content: `A calibration curve for solution Y follows the equation A = 2500 c (where c is concentration in mol/L, using a 1.00 cm path length cuvette and a properly zeroed blank).

If a sample of solution Y is measured to have an absorbance of 0.34, what is its molar concentration?`,
    answer: `Solving A = 2500c for c:

c = A / 2500 = 0.34 / 2500 = 1.4 x 10^-4 M`,
  },
  {
    title: 'Q16 — Absorbance Trend During Serial Dilution of a Dye Solution',
    content: `A student prepares a serial dilution of an 8 M solution of a red dye, producing solutions of 8 M, 4 M, 2 M, 1 M, and 0.5 M, each measured in the same cuvette at the same wavelength.

(a) What happens to the concentration of the dye at each step of this dilution?
(b) Explain, at the particle level, why the absorbance of light decreases as the dye solution becomes more dilute.`,
    answer: `(a) At each step, the concentration of the dye is cut in half (halved) as more solvent is added, going from 8 M down to 4 M, 2 M, 1 M, and finally 0.5 M — a 16-fold total decrease in concentration from the original solution to the final one.

(b) As the solution becomes more dilute, there are fewer dye particles per unit volume available to absorb photons of light as they pass through the sample. Since each dye particle can only absorb a certain amount of light, having fewer particles in the light's path means a smaller fraction of the incident light is absorbed and a larger fraction is transmitted through the sample. Because absorbance is directly proportional to concentration (per the Beer-Lambert law, A = εbc), this decrease in the number of light-absorbing particles per unit volume causes the measured absorbance to decrease proportionally as the solution is diluted.`,
  },
  {
    title: 'Q17 — Effect of Doubling Cuvette Width on Absorbance',
    content: `A colored solution with a fixed concentration is measured first in a standard 1.00 cm cuvette, then in a cuvette that is twice as wide (2.00 cm path length), with all other conditions (concentration, wavelength, molar absorptivity) held constant.

Predict and explain how the absorbance reading would change between the two measurements.`,
    answer: `The absorbance would double when measured using the 2.00 cm cuvette compared to the 1.00 cm cuvette.

By the Beer-Lambert law, A = εbc, where b is the path length (cuvette width) that light travels through the sample. Since concentration (c) and molar absorptivity (ε) are both held constant, absorbance is directly proportional to path length (b). Doubling the path length from 1.00 cm to 2.00 cm means light travels through twice as much of the absorbing solution, giving each photon twice the opportunity to be absorbed by a dye particle along its path, which doubles the measured absorbance.`,
  },
  {
    title: 'Q18 — Diagnosing the Effect of Five Cuvette-Handling Errors on Measured Absorbance',
    content: `A student is measuring the absorbance of a blue-colored 0.40 M solution of CuSO4(aq) using a spectrophotometer. For each scenario below, state whether the measured absorbance would be higher than, lower than, or the same as the true absorbance of a correctly-prepared 0.40 M CuSO4 solution, and briefly explain why.

(a) The student rinses the cuvette with distilled water, then fills it with the 0.40 M CuSO4 sample without drying it first (leaving a small residual amount of water in the cuvette).
(b) The student uses a cuvette that still had a small residual amount of a more concentrated (0.80 M) CuSO4 solution left in it from a previous measurement.
(c) The solution was prepared incorrectly and its true concentration is actually only 0.040 M (but the student believes it is 0.40 M).
(d) The spectrophotometer was calibrated (zeroed) using a dilute 0.040 M CuSO4 solution as the "blank" instead of using pure water.
(e) The student uses a cuvette that has visible scratches on its outer surface.`,
    answer: `(a) Lower than true absorbance. The residual water slightly dilutes the CuSO4 sample as it is added to the cuvette, reducing the effective concentration of the measured solution below 0.40 M, which lowers the measured absorbance.

(b) Higher than true absorbance. The leftover, more concentrated (0.80 M) CuSO4 solution contaminates and increases the effective concentration of copper(II) ions in the cuvette above the intended 0.40 M, which raises the measured absorbance above what a correctly prepared 0.40 M solution would give.

(c) Lower than true absorbance (relative to what a correctly prepared 0.40 M solution would give). Since the actual concentration in the cuvette (0.040 M) is much lower than intended (0.40 M), and absorbance is directly proportional to concentration, the true absorbance of this 0.040 M sample is much lower than it would be for an accurately prepared 0.40 M solution.

(d) Lower than true absorbance. Zeroing (calibrating) the spectrophotometer with a colored 0.040 M CuSO4 "blank" instead of a colorless water blank causes the instrument to subtract out some of the absorbance due to the CuSO4 itself before the actual sample is even measured, so every subsequent absorbance reading (including for the 0.40 M sample) will be reported lower than the true value by an amount equal to the (nonzero) absorbance of the improperly-chosen blank.

(e) Higher than true absorbance. Scratches on the cuvette scatter incoming and outgoing light in random directions rather than allowing it to pass straight through the sample, and the spectrophotometer's detector interprets this lost, scattered light as if it had been "absorbed" by the sample, artificially inflating the measured absorbance above the sample's true value.`,
  },
  {
    title: 'Q19 — Multi-Step Calculation from a Calibration Curve: Concentration, Mass, and Predicted Absorbance',
    content: `A calibration curve for a colored dye X follows the equation A = 18,500 c (c in mol/L, 1.00 cm path length, properly zeroed blank).

(a) If a solution of dye X is measured to have an absorbance of 0.525, calculate its molar concentration.
(b) If the molar mass of dye X is 791.41 g/mol, how many grams of dye X were present in 10.0 mL of the solution from part (a)?
(c) What absorbance would you predict for a solution of dye X with a concentration of 1.5 x 10^-6 M?`,
    answer: `(a) c = A / 18,500 = 0.525 / 18,500 = 2.84 x 10^-5 M

(b) moles of dye X = (2.84 x 10^-5 mol/L)(0.0100 L) = 2.84 x 10^-7 mol

mass = 2.84 x 10^-7 mol x 791.41 g/mol = 2.25 x 10^-4 g

(c) A = 18,500 c = 18,500 x (1.5 x 10^-6) = 0.0278`,
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
    await insertTopic('3.8', topic38New);
    await insertTopic('3.9', topic39New);
    await insertTopic('3.10', topic310New);
    await insertTopic('3.11', topic311New);
    await insertTopic('3.12', topic312New);
    await insertTopic('3.13', topic313New);
    console.log('Done batch 3.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
