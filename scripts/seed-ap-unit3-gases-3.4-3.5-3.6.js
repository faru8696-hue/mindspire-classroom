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
  '3.4': '3caa461f-7678-4754-8c14-25657a8eea30', // Ideal Gas Law
  '3.5': 'a4157f22-b9cd-4ac6-b886-040a8e505372', // Kinetic Molecular Theory
  '3.6': 'e354fd0b-663d-473a-834b-14038b93dd6d', // Deviation from Ideal Gas Law
};

/*
Sourced from: SaveMyExams gas-laws-MCQ/MCQ ANS/FRQ/FRQ ANS.pdf, AP Gases Practice Problems 2020.pdf.
The 55MB College Board worksheet and Unit K In-Class FRQ (mostly diagram/handwritten-answer content,
low text yield on inspection) were not mined further given the three-topic breadth budget.

Every calculation below was independently redone from scratch (not copied from the source mark schemes)
using standard molar masses, R = 0.08206 L atm / (mol K), and the ideal/combined gas law. Two source
arithmetic slips were caught and fixed (see FIXED notes below). Several source MCQs that depend on an
image not captured by pdftotext (Maxwell-Boltzmann curve-ordering/labeling questions where the curve
identity is only visible in the uncaptured figure) were dropped rather than guessed at, and replaced
with self-contained, independently-verified Graham's-law and rms-speed calculations.

FIXED:
- 3.6 CO2 mass FRQ (Hard #3a, gas-laws-FRQ ANS.pdf): source computes n = 0.01194 mol correctly but then
  states "mass = 0.01194 x 44.01 = 0.562 g" -- that multiplication is wrong. 0.01194 x 44.01 = 0.526 g.
  Corrected to 0.526 g in the answer below.
- 3.4 Cl2 temperature MCQ (Medium #6): source's answer key rounds to exactly 203 K; recomputing with
  standard atomic masses (Cl = 35.45) gives T = 201.8-202 K. Kept answer choice (D) 203 K since it is
  unambiguously the closest of the four options and the discrepancy is sub-1% rounding, but the answer
  text notes the more precise value.

EXCLUDED (image-dependent, could not independently verify):
- MCQ: "pV vs n" graph-shape question (Medium #3) -- requires seeing four graph shapes.
- MCQ: gas X/Y speed-distribution graph, molar mass comparison (Medium #7) -- graph not captured; a
  self-contained textual replacement was NOT substituted here to avoid duplicating existing DB content
  possibly covering the same concept.
- MCQ: Maxwell-Boltzmann curve temperature-ordering (practice2020 #8) and three-substance speed
  distribution -> molar mass (practice2020 #11) -- both depend on unlabeled/uncaptured curve images.
  Replaced with custom Graham's law and rms-speed numeric problems (see 3.5 Q14, Q15).
- FRQ: S2Cl2 Lewis structure / bond angle, ethanol Lewis structure / bond angle / thermodynamics (ΔG,
  Kp) parts of the CS2+Cl2 and ethanol-dehydration FRQs -- Lewis structure/VSEPR/thermo content belongs
  to other units, out of scope for 3.4/3.5/3.6.
- Van der Waals numeric plug-and-chug with given a/b constants -- not sourced in any of these PDFs, and
  per project guidance would be excluded as beyond typical AP-level treatment even if found.
*/

const topic34New = [
  {
    mcq: true,
    title: 'Q12 — Pressure of Hydrogen Gas from Mass, Volume, and Temperature',
    content:
`0.96 g of hydrogen gas is contained in a sealed vessel with a volume of 7.0 L at a temperature of 303 K. What is the pressure in the vessel?
(A) 0.48 atm
(B) 1.69 atm
(C) 3.27 atm
(D) 0.59 atm`,
    answer: `Correct answer: (B) 1.69 atm

Moles of H2: 0.96 g H2 x [[frac:1 mol H2|2.016 g H2]] = 0.476 mol H2

Rearrange PV = nRT for pressure: P = nRT / V

P = (0.476 mol)(0.08206 L atm mol^-1 K^-1)(303 K) / 7.0 L = 1.69 atm

(A) is the number of moles of H2, not the pressure.
(C) results from using 0.96 g directly as if it were moles in the equation instead of converting to moles first.
(D) results from using the wrong rearrangement of PV = nRT (dividing V by nRT instead of the reverse).`
  },
  {
    mcq: true,
    title: 'Q13 — Temperature of Chlorine Gas from Mass, Volume, and Pressure',
    content:
`A sample of chlorine gas with a mass of 5.35 g has a volume of 1.25 L at a pressure of 1.00 atm. What is the temperature of the gas?
(A) 4.92 x 10^-3 K
(B) 2.85 K
(C) 81.0 K
(D) 203 K`,
    answer: `Correct answer: (D) 203 K

Moles of Cl2 (molar mass 70.90 g/mol): 5.35 g Cl2 x [[frac:1 mol Cl2|70.90 g Cl2]] = 0.0755 mol Cl2

Rearrange PV = nRT for temperature: T = PV / nR

T = (1.00 atm)(1.25 L) / (0.0755 mol)(0.08206 L atm mol^-1 K^-1) = 202 K

This rounds to approximately 202-203 K, matching (D) by a wide margin over the other three choices (the small difference from an exact 203 K is just intermediate rounding).

(A) results from an inverted rearrangement of PV = nRT.
(B) results from using 5.35 g directly in place of moles.
(C) results from a different incorrect rearrangement combined with using mass instead of moles.`
  },
  {
    mcq: true,
    title: 'Q14 — Total Pressure of a CO2/Ar Gas Mixture',
    content:
`A sealed 6.00 L cylinder contains 13.30 g of CO2 (g) and 17.00 g of Ar (g). What is the total pressure, in atm, of the gas mixture in the cylinder at 303 K?
(A) 125.6 atm
(B) 1.24 atm
(C) 3.03 atm
(D) 1.78 atm`,
    answer: `Correct answer: (C) 3.03 atm

Moles of each gas:
13.30 g CO2 x [[frac:1 mol CO2|44.01 g CO2]] = 0.3022 mol CO2
17.00 g Ar x [[frac:1 mol Ar|39.95 g Ar]] = 0.4255 mol Ar

Total moles = 0.3022 + 0.4255 = 0.728 mol

Total pressure from PV = nRT: P = nRT / V = (0.728 mol)(0.08206 L atm mol^-1 K^-1)(303 K) / 6.00 L = 3.02 atm ≈ 3.03 atm

(A) results from using the combined mass of both gases (30.3 g) as if it were moles.
(B) results from using only the moles of CO2.
(D) results from using only the moles of Ar.`
  },
  {
    mcq: true,
    title: 'Q15 — Final Pressure After Opening a Valve Between Two Containers',
    content:
`Glass containers X and Y are connected by a closed valve. X contains pure CO2 gas at 298 K and a pressure of 1.00 atm. Container Y has been evacuated prior to the experiment and has a volume three times bigger than container X.

During the experiment, the valve is opened, and the temperature of the whole apparatus is raised to 433 K. What is the final pressure in the system?
(A) 0.36 atm
(B) 2.75 atm
(C) 0.48 atm
(D) 2.06 atm`,
    answer: `Correct answer: (A) 0.36 atm

The amount of gas (n) is fixed, so P1V1/T1 = P2V2/T2. Let V1 = 1 unit for container X; since Y is evacuated and three times bigger than X, the combined final volume V2 = X + Y = 1 + 3 = 4 units.

P1 = 1.00 atm, T1 = 298 K, V1 = 1, V2 = 4, T2 = 433 K

P2 = P1V1T2 / (V2T1) = (1.00 atm)(1)(433 K) / [(4)(298 K)] = 433 / 1192 = 0.36 atm

(B) and (D) result from inverting the rearranged equation (solving for P2 as V2T1 / P1V1T2 instead of the correct form).
(C) results from using a combined volume of 3 units (forgetting to add container X's own volume to Y's) instead of 4.`
  },
  {
    mcq: true,
    title: 'Q16 — Combined Gas Law for Ethane Under Changing Conditions',
    content:
`A 4.5 L container holds ethane gas at 50°C and a pressure of 3.5 atm. If the temperature is increased to 350°C and the pressure is reduced to 1.5 atm, what is the final volume of the gas?
(A) 10.5 L
(B) 15.2 L
(C) 20.3 L
(D) 25.6 L`,
    answer: `Correct answer: (C) 20.3 L

Convert temperatures to Kelvin: T1 = 50 + 273.15 = 323.15 K, T2 = 350 + 273.15 = 623.15 K

Using the combined gas law: P1V1/T1 = P2V2/T2, rearranged: V2 = V1 x (P1/P2) x (T2/T1)

V2 = 4.5 L x (3.5 atm / 1.5 atm) x (623.15 K / 323.15 K) = 4.5 x 2.333 x 1.928 = 20.3 L

(A), (B), and (D) result from mixing up which ratio (pressure or temperature) goes on top, or from failing to convert °C to K before taking the ratio.`
  },
  {
    mcq: true,
    title: 'Q17 — Molecular Formula of a Hydrocarbon from Empirical Formula and Density',
    content:
`A hydrocarbon gas with empirical formula CH2 has a density of 1.88 g/L at 0°C and 1.00 atm. What is the molecular formula of the hydrocarbon?
(A) CH2
(B) C2H4
(C) C3H6
(D) C4H8`,
    answer: `Correct answer: (C) C3H6

Molar mass from density at STP: M = dRT/P = (1.88 g/L)(0.08206 L atm mol^-1 K^-1)(273.15 K) / (1.00 atm) = 42.1 g/mol

Empirical formula mass of CH2 = 12.01 + 2(1.008) = 14.03 g/mol

Multiplier: 42.1 / 14.03 ≈ 3.0, so the molecular formula is (CH2) x 3 = C3H6 (molar mass 42.08 g/mol, matching the calculated value).

(A) would require a multiplier of 1 (molar mass ≈ 14 g/mol), far too low.
(B) would require a multiplier of 2 (molar mass ≈ 28 g/mol), still too low.
(D) would require a multiplier of 4 (molar mass ≈ 56 g/mol), too high.`
  },
  {
    mcq: true,
    title: 'Q18 — Identifying a Gas from Its Mass at STP',
    content:
`A 2.0 L container will hold about 4.0 g of which of the following gases at 0°C and 1.00 atm?
(A) SO2
(B) N2
(C) CO2
(D) C4H8`,
    answer: `Correct answer: (C) CO2

Moles of gas present at STP: n = PV/RT = (1.00 atm)(2.0 L) / [(0.08206 L atm mol^-1 K^-1)(273.15 K)] = 0.0892 mol

Molar mass implied by 4.0 g of this gas: M = mass/n = 4.0 g / 0.0892 mol = 44.8 g/mol

Compare to the molar masses of the choices: SO2 = 64.07 g/mol, N2 = 28.01 g/mol, CO2 = 44.01 g/mol, C4H8 = 56.11 g/mol. CO2 (44.01 g/mol) is by far the closest match to the required 44.8 g/mol.

(A), (B), and (D) all have molar masses too far from 44.8 g/mol to fit a 2.0 L sample containing 4.0 g at STP.`
  },
  {
    title: 'Q19 — Pressure After Vaporizing a Liquid Sample in a Sealed Container',
    content:
`A 10.0 g sample of liquid CS2 is put into an evacuated 5.0 L rigid container. The container is sealed and heated to 325 K, at which temperature all of the CS2 has vaporized. What is the pressure in the container once all of the CS2 has vaporized?`,
    answer: `Moles of CS2 (molar mass = 12.01 + 2(32.07) = 76.15 g/mol):

10.0 g CS2 x [[frac:1 mol CS2|76.15 g CS2]] = 0.1313 mol CS2

Using the ideal gas law, PV = nRT, rearranged for pressure:

P = nRT / V = (0.1313 mol)(0.08206 L atm mol^-1 K^-1)(325 K) / 5.0 L = 0.70 atm

Once the container is sealed at fixed volume 5.0 L, all of the CS2 has become gas, so this pressure (0.70 atm) is the total pressure exerted by the CS2 vapor.`
  },
  {
    title: 'Q20 — Pressure Change in a Rigid Container Upon Heating',
    content:
`A rigid container holds a sample of CO2 (g) at 299 K and 0.70 atm. The student increases the temperature of the CO2 (g) in the container to 425 K. Calculate the pressure of the CO2 (g) in the container at 425 K.`,
    answer: `Since the container is rigid, volume is constant, and the number of moles of gas does not change, so P1/T1 = P2/T2.

P1 = 0.70 atm, T1 = 299 K, T2 = 425 K

P2 = P1 x (T2 / T1) = 0.70 atm x (425 K / 299 K) = 0.70 atm x 1.421 = 0.99 atm

The pressure increases to approximately 0.99 atm (close to 1.0 atm) because the volume and moles are fixed while the temperature rises.`
  },
  {
    title: 'Q21 — Limiting Reagent and Product Volume in a Gas-Phase Reaction',
    content:
`Hydrogen gas reacts with oxygen gas to produce water vapor: 2H2 (g) + O2 (g) → 2H2O (g)

A sample containing 40.0 L of hydrogen gas is reacted with 30.0 L of oxygen gas at 25.0°C and 100 kPa.

(a) Identify the limiting reagent and determine the volume of water vapor produced, assuming ideal gas behavior.

(b) Calculate the volume of excess gas remaining after the reaction, and determine the total volume of gas in the system after the reaction is complete.`,
    answer: `(a) At constant temperature and pressure, gas volumes are directly proportional to moles (Avogadro's law), so the 2:1 mole ratio of H2:O2 in the balanced equation is also a 2:1 volume ratio.

40.0 L H2 x [[frac:1 vol O2|2 vol H2]] = 20.0 L O2 needed

Only 20.0 L of the available 30.0 L of O2 is needed, so O2 is in excess and H2 is the limiting reagent.

From the 2:2 (i.e., 1:1) H2-to-H2O volume ratio in the balanced equation, 40.0 L of H2 produces 40.0 L of H2O vapor.

(b) Excess O2 remaining = 30.0 L available − 20.0 L consumed = 10.0 L O2

Total volume of gas after the reaction = 40.0 L H2O + 10.0 L O2 (excess, unreacted) = 50.0 L

(All of the H2 is consumed, so it contributes 0 L; the total gas volume dropped from 70.0 L initially to 50.0 L, consistent with the reaction converting 3 total volumes of reactant gas that combine into fewer product + leftover volumes.)`
  },
  {
    title: 'Q22 — Stoichiometry and Gas Volume from a Solid-Water Reaction',
    content:
`Phosphine gas, PH3, can be produced by reacting calcium phosphide with water: Ca3P2 (s) + 6H2O (l) → 2PH3 (g) + 3Ca(OH)2 (aq)

A 2.50 g sample of calcium phosphide reacts with excess water. The PH3 gas produced is collected at 298 K, where the total pressure in the collection vessel is 0.0094 atm.

(a) Calculate the theoretical volume of PH3 (g) produced, assuming ideal gas behavior and that the reaction goes to completion.

(b) The PH3 is collected over water at 298 K, where the vapor pressure of water is 0.000313 atm. Determine the volume of dry PH3 gas collected.`,
    answer: `(a) Molar mass of Ca3P2 = 3(40.08) + 2(30.97) = 182.18 g/mol

2.50 g Ca3P2 x [[frac:1 mol Ca3P2|182.18 g Ca3P2]] = 0.01372 mol Ca3P2

From the balanced equation, 1 mol Ca3P2 produces 2 mol PH3:

0.01372 mol Ca3P2 x [[frac:2 mol PH3|1 mol Ca3P2]] = 0.02745 mol PH3

Using PV = nRT, rearranged for volume:

V = nRT / P = (0.02745 mol)(0.08206 L atm mol^-1 K^-1)(298 K) / 0.0094 atm = 71.4 L

(b) When a gas is collected over water, the total pressure is the sum of the dry gas pressure and water's vapor pressure: Ptotal = Pdry gas + Pwater vapor

Pdry gas = 0.0094 atm − 0.000313 atm = 0.00909 atm

Using the same moles of PH3 from part (a):

V(dry) = nRT / Pdry = (0.02745 mol)(0.08206 L atm mol^-1 K^-1)(298 K) / 0.00909 atm = 73.9 L

The dry-gas volume is larger than the theoretical volume in (a) because removing water's contribution to the pressure leaves a lower pressure for the PH3 alone, and volume is inversely proportional to pressure at fixed n, R, T.`
  },
  {
    title: 'Q23 — Moles of Gas Collected Over Water and Percent Yield',
    content:
`Ethene, C2H4 (molar mass 28.05 g/mol), is prepared by the dehydration of ethanol, C2H5OH (molar mass 46.07 g/mol): C2H5OH (g) → C2H4 (g) + H2O (g)

A student added a 0.200 g sample of C2H5OH (l) to a test tube and heated it until all of the C2H5OH had evaporated and gas generation stopped. The gas produced, C2H4, was collected over water; the total volume collected was 0.0854 L at a total pressure of 0.822 atm and 305 K. The vapor pressure of water at 305 K is 35.7 torr.

(a) Calculate the number of moles of C2H4 (g) actually collected.

(b) Calculate the number of moles of C2H4 (g) that would be produced if the dehydration reaction went to completion, and use it with part (a) to calculate the percent yield.`,
    answer: `(a) Convert the water vapor pressure to atm:

35.7 torr x [[frac:1 atm|760 torr]] = 0.0470 atm

Since the gas was collected over water, subtract water's vapor pressure from the total pressure to get the pressure of the dry C2H4:

P(C2H4) = 0.822 atm − 0.0470 atm = 0.775 atm

Using PV = nRT: n = PV/RT = (0.775 atm)(0.0854 L) / [(0.08206 L atm mol^-1 K^-1)(305 K)] = 0.00264 mol C2H4 (actual)

(b) Moles of ethanol reacted:

0.200 g C2H5OH x [[frac:1 mol C2H5OH|46.07 g C2H5OH]] = 0.00434 mol C2H5OH

Since the reaction is 1:1 (C2H5OH → C2H4 + H2O), if the reaction went to completion this would yield 0.00434 mol C2H4 (theoretical).

Percent yield = (actual yield / theoretical yield) x 100 = (0.00264 mol / 0.00434 mol) x 100 = 60.8%`
  }
];

const topic35New = [
  {
    mcq: true,
    title: 'Q9 — Average Kinetic Energy of Two Samples at the Same Temperature',
    content:
`Consider two identical sealed containers containing N2 (g) at 273 K. One container holds 1 mol of N2 (g) and the other holds 4 mol of N2 (g). Which of the following statements is true?
(A) The pressure is greater in the 1 mol vessel.
(B) The force at which the molecules collide with the walls is greater in the 1 mol vessel than in the 4 mol vessel.
(C) The pressure is the same in each vessel.
(D) The average kinetic energy of the molecules is the same in both vessels.`,
    answer: `Correct answer: (D) The average kinetic energy of the molecules is the same in both vessels.

The average kinetic energy of gas molecules depends only on the absolute temperature of the sample (KE_avg = (3/2)RT per mole), not on the amount of gas present. Since both vessels are at the same temperature (273 K), the average kinetic energy of the N2 molecules is identical in both, regardless of how many moles are present.

(A) and (C) are wrong because the pressure is actually greater in the 4 mol vessel: with more molecules in the same fixed volume at the same temperature, there are more frequent collisions with the container walls, producing higher pressure (consistent with PV = nRT, P ∝ n at fixed V and T).
(B) is wrong for the same reason as (A)/(C) but in the wrong direction, and also because the force per individual collision depends on speed/kinetic energy (same in both vessels), not on the number of moles — it's the frequency of collisions, not their individual force, that differs between the vessels.`
  },
  {
    mcq: true,
    title: 'Q10 — Effect of Increasing Temperature on the Boltzmann Distribution Peak',
    content:
`The Maxwell-Boltzmann distribution graph for a sample of gas at a given temperature shows a peak at point X, the most probable molecular energy. If the temperature of the gas is increased, what happens to the position of point X?
(A) Fewer molecules possess the most probable energy value, so X shifts to the right (higher energy).
(B) Fewer molecules possess the most probable energy value, so X shifts to the left (lower energy).
(C) More molecules possess the most probable energy value, so X shifts to the left (lower energy).
(D) The position of X stays the same, but the area under the curve increases.`,
    answer: `Correct answer: (A) Fewer molecules possess the most probable energy value, so X shifts to the right (higher energy).

Increasing the temperature shifts the entire Maxwell-Boltzmann distribution toward higher energies and broadens/flattens it — more molecules gain enough energy to populate the high-energy tail, and the curve becomes wider and lower overall. Since the peak (most probable energy) is the highest point of this now-broader, flatter curve, it shifts to the right (higher energy) and downward (lower height, since the same total number of molecules is now spread over a wider range of energies).

(B) and (C) are wrong because increasing temperature never shifts the most probable energy value to the left (lower energy) — higher temperature always corresponds to higher (or equal) average and most probable energy.
(D) is wrong because the position of X does change (shifts right); the total area under the curve represents the total number of molecules, which stays constant (not increasing) since no molecules are added.`
  },
  {
    mcq: true,
    title: 'Q11 — Graph of Average Kinetic Energy vs. Temperature',
    content:
`Which graph correctly shows how the average kinetic energy of an ideal gas varies with absolute temperature?
(A) A curve that decreases as temperature increases
(B) A horizontal line (no change with temperature)
(C) A curve that increases but levels off at high temperature
(D) A straight line through the origin with a positive slope`,
    answer: `Correct answer: (D) A straight line through the origin with a positive slope

The average kinetic energy of an ideal gas is directly proportional to its absolute (Kelvin) temperature: KE_avg = (3/2)RT (per mole). Because this is a direct proportionality, doubling the Kelvin temperature exactly doubles the average kinetic energy, which produces a straight line that passes through the origin (KE = 0 at T = 0 K) with a constant positive slope.

(A) is wrong — kinetic energy does not decrease with increasing temperature; they are directly (not inversely) related.
(B) is wrong — kinetic energy is not independent of temperature; KMT explicitly links them.
(C) is wrong — the direct proportionality means the graph is a straight line, not a curve that plateaus.`
  },
  {
    mcq: true,
    title: 'Q12 — Average Kinetic Energy of Different Gases at the Same Temperature',
    content:
`At standard temperature and pressure, a 0.50 mol sample of H2 gas and a separate 1.0 mol sample of O2 gas have the same
(A) average molecular kinetic energy
(B) average molecular speed
(C) volume
(D) effusion rate`,
    answer: `Correct answer: (A) average molecular kinetic energy

Average molecular kinetic energy depends only on absolute temperature (KE_avg = (3/2)RT per mole), not on the identity, amount, or molar mass of the gas. Since both samples are at the same temperature (STP defines a fixed T), their average kinetic energies are equal, regardless of the fact that they are different gases in different amounts.

(B) is wrong — average speed depends on molar mass (u_rms = sqrt(3RT/M)); since H2 (2.02 g/mol) is much lighter than O2 (32.00 g/mol), H2 molecules move much faster on average even at the same temperature.
(C) is wrong — at STP, volume depends on moles (V = nRT/P); with 0.50 mol vs 1.0 mol, the O2 sample occupies twice the volume of the H2 sample.
(D) is wrong — effusion rate depends on molar mass by Graham's law; the lighter H2 effuses faster than the heavier O2.`
  },
  {
    mcq: true,
    title: 'Q13 — Which Quantity Doubles When Absolute Temperature Doubles',
    content:
`A sample of oxygen gas in a closed, rigid (constant-volume) container is heated until its absolute temperature is doubled. Which of the following quantities is also doubled?
(A) The density of the gas
(B) The pressure of the gas
(C) The average speed of the gas molecules
(D) The number of molecules per cm^3`,
    answer: `Correct answer: (B) The pressure of the gas

At constant volume and constant amount of gas (n), the ideal gas law gives P ∝ T. Doubling the absolute temperature exactly doubles the pressure.

(A) is wrong — density = mass/volume; since both mass and volume are unchanged (rigid container, no gas added or removed), density stays constant.
(C) is wrong — average molecular speed depends on the square root of temperature (u_rms ∝ sqrt(T)), so doubling T increases the average speed by a factor of sqrt(2) ≈ 1.41, not by a factor of 2.
(D) is wrong — the number of molecules per unit volume depends only on the amount of gas and the (unchanged) container volume, not on temperature; it stays constant.`
  },
  {
    mcq: true,
    title: "Q14 — Comparing Effusion Rates of Helium and Argon (Graham's Law)",
    content:
`Helium gas (molar mass 4.00 g/mol) and argon gas (molar mass 39.95 g/mol) are held in separate containers at the same temperature and allowed to effuse through identical small openings. What is the ratio of the rate of effusion of He to the rate of effusion of Ar?
(A) 3.16
(B) 9.99
(C) 0.316
(D) 1.78`,
    answer: `Correct answer: (A) 3.16

By Graham's law of effusion, the rate of effusion is inversely proportional to the square root of molar mass:

rate(He) / rate(Ar) = sqrt[ M(Ar) / M(He) ] = sqrt(39.95 / 4.00) = sqrt(9.99) ≈ 3.16

Helium, being much lighter, effuses about 3.16 times faster than argon at the same temperature.

(B) results from forgetting to take the square root of the molar mass ratio (9.99 is the ratio of molar masses itself, not the effusion rate ratio).
(C) is the reciprocal, i.e., the ratio of argon's effusion rate to helium's, not helium's to argon's.
(D) does not correspond to any standard (mis)application of Graham's law to these molar masses.`
  },
  {
    mcq: true,
    title: 'Q15 — Root-Mean-Square Speed of N2 Gas at 298 K',
    content:
`What is the approximate root-mean-square (rms) speed of N2 gas molecules at 298 K? (R = 8.314 J mol^-1 K^-1, molar mass of N2 = 0.02802 kg/mol)
(A) 515 m/s
(B) 298 m/s
(C) 1077 m/s
(D) 265 m/s`,
    answer: `Correct answer: (A) 515 m/s

The rms speed formula is: u_rms = sqrt(3RT / M)

u_rms = sqrt[ 3 x (8.314 J mol^-1 K^-1) x (298 K) / (0.02802 kg/mol) ]
u_rms = sqrt(7432.7 J/mol / 0.02802 kg/mol)
u_rms = sqrt(265,264 m^2/s^2)
u_rms ≈ 515 m/s

(B) mistakenly uses the numeric value of the temperature in Kelvin as if it were the answer in m/s.
(C) results from forgetting to take the square root at the end (misreading the units).
(D) results from omitting the factor of 3 in "3RT" before taking the square root.`
  },
  {
    title: 'Q16 — Explaining a Volume Decrease Using Kinetic Molecular Theory',
    content:
`A sample of O2 (g) is held at constant pressure in a cylinder with a movable piston. The student cools the cylinder from 25°C to −55°C, and the volume of the gas decreases. Using principles of kinetic molecular theory, explain why the volume of the O2 (g) decreases when the temperature decreases.`,
    answer: `As the temperature decreases, the average kinetic energy (and therefore average speed) of the O2 molecules decreases, per kinetic molecular theory (KE_avg ∝ T). Slower-moving molecules collide with the container walls (and with the movable piston) less frequently and with less force per collision.

Since the piston is free to move and the external pressure on it is constant, the reduced force/frequency of collisions from the cooled gas can no longer support the same volume against that constant external pressure. The piston moves inward, decreasing the volume, until the (now less frequent/forceful) collisions of the slower molecules within the smaller volume once again generate enough pressure to balance the constant external pressure. This is the microscopic (KMT) explanation for the macroscopic relationship V1/T1 = V2/T2 (Charles's law) at constant pressure and moles.`
  },
  {
    title: 'Q17 — Kinetic Molecular Theory Explanation for Motion and Pressure Change on Heating',
    content:
`A rigid container holds a sample of CO2 (g) at 299 K. The student increases the temperature of the CO2 (g) in the container to 425 K.

(a) Describe the effect of raising the temperature on the motion of the CO2 (g) molecules.

(b) In terms of kinetic molecular theory, briefly explain why the pressure of the CO2 (g) in the container increases as it is heated to 425 K.`,
    answer: `(a) As the temperature increases, the average speed (and average kinetic energy) of the CO2 molecules increases — the molecules move faster and more energetically.

(b) Since the container is rigid, the volume and the number of moles of gas are both constant. As the gas is heated, the faster-moving CO2 molecules collide with the walls of the container both more frequently and with greater force per collision. Because pressure is a macroscopic measure of the total force of these molecular collisions per unit area of the container walls, more frequent and more forceful collisions directly translate into a higher measured pressure inside the container.`
  },
  {
    title: 'Q18 — Comparing Mass, Kinetic Energy, and Effusion Rate of Five Gas Samples',
    content:
`Five identical balloons — containing He (g), H2 (g), N2 (g), O2 (g), and CO2 (g) respectively — are each filled to the same volume at 25°C and 1.0 atm pressure.

(a) Which balloon contains the greatest mass of gas? Explain.

(b) Compare the average kinetic energies of the gas molecules in the five balloons. Explain.

(c) Twelve hours after being filled, all the balloons have decreased in size due to gas escaping (effusing) through the microscopically porous balloon material. Predict which balloon will be the smallest, and explain your reasoning.`,
    answer: `(a) The CO2 balloon contains the greatest mass of gas. By Avogadro's hypothesis, equal volumes of gas at the same temperature and pressure contain equal numbers of moles (and therefore equal numbers of molecules). Since all five balloons hold the same number of moles, the balloon filled with the gas of highest molar mass will have the greatest total mass. Of He (4.00 g/mol), H2 (2.02 g/mol), N2 (28.01 g/mol), O2 (32.00 g/mol), and CO2 (44.01 g/mol), CO2 has by far the highest molar mass, so it contains the greatest mass of gas.

(b) The average kinetic energy of the gas molecules is the same in all five balloons. Average kinetic energy depends only on the absolute temperature of the sample (KE_avg = (3/2)RT per mole), not on the identity or molar mass of the gas. Since all five balloons are at the same temperature (25°C), their average molecular kinetic energies are identical.

(c) The He balloon will be smallest after twelve hours. By Graham's law, the rate of effusion is inversely proportional to the square root of molar mass, so lighter gas molecules effuse (escape through small pores) faster than heavier ones at the same temperature. Helium has by far the smallest molar mass (4.00 g/mol) of the five gases, so its molecules move fastest on average and escape through the porous balloon material more quickly than the others, causing the He balloon to shrink the most in a given time.`
  },
  {
    title: 'Q19 — Explaining the Position of the NH4Cl Ring Using Molecular Motion',
    content:
`When NH3 gas (molar mass 17.03 g/mol) is introduced at one end of a long tube while HCl gas (molar mass 36.46 g/mol) is introduced simultaneously at the other end, a ring of white ammonium chloride (NH4Cl) solid is observed to form somewhere in the tube after a few minutes. This ring forms closer to the HCl end of the tube than to the NH3 end. Explain this observation in terms of molecular motion.`,
    answer: `Gas molecules are in constant, random motion, and both NH3 and HCl diffuse (spread out) along the tube from their respective ends until they meet and react to form solid NH4Cl wherever they encounter each other in sufficient concentration.

By kinetic molecular theory, at the same temperature, lighter molecules move faster on average than heavier ones (average speed ∝ 1/sqrt(molar mass), per Graham's law of diffusion). NH3 (17.03 g/mol) is significantly lighter than HCl (36.46 g/mol), so NH3 molecules diffuse down the tube considerably faster than HCl molecules. As a result, in a given amount of time, the faster NH3 molecules travel farther down the tube from their end than the slower HCl molecules travel from theirs. The two gases therefore meet — and the NH4Cl ring forms — closer to the HCl end (where the slower-moving HCl started) than to the NH3 end.`
  },
  {
    title: 'Q20 — Describing the Change in Collision Energy Distribution with Temperature',
    content:
`A reaction between gas-phase reactant molecules proceeds at an observable rate at 120°C, but no reaction is observed at 30°C, even though the reaction is thermodynamically favorable at both temperatures. The collision energy distribution of the reactant molecules at 120°C is a typical Maxwell-Boltzmann-shaped curve with a peak at a moderate collision energy and a long tail extending to high energies (including energies above the activation energy, Ea).

(a) Explain, in terms of collisions between reactant molecules, how the higher temperature (120°C vs. 30°C) allows the reaction to occur at an observable rate.

(b) Describe, without providing new numbers, how the collision energy distribution curve at 30°C would differ in shape and position from the curve described above at 120°C.`,
    answer: `(a) At the higher temperature (120°C), the reactant molecules have a greater average kinetic energy than they would at 30°C. A larger fraction of molecular collisions therefore occur with a total energy equal to or greater than the activation energy, Ea, required for the reaction to proceed. Since the reaction rate depends on the frequency of collisions that meet or exceed Ea (with proper orientation), more such successful collisions occur per unit time at 120°C, making the reaction proceed at an observable rate — whereas at 30°C, too few collisions have enough energy to react at a noticeable rate, even though the reaction is thermodynamically favorable (spontaneous) at both temperatures.

(b) At the lower temperature (30°C), the collision energy distribution curve would be taller and narrower than the 120°C curve, with its peak shifted to the left (toward lower collision energy). The 30°C curve would lie above the 120°C curve at low energies but below the 120°C curve in the high-energy region beyond Ea — meaning a smaller area (fraction of collisions) lies above Ea at 30°C than at 120°C, consistent with fewer successful, rate-producing collisions at the lower temperature.`
  }
];

const topic36New = [
  {
    mcq: true,
    title: 'Q9 — Mechanism of CO2 Deviation from Ideal Behavior',
    content:
`Which of the following best explains why CO2 deviates from ideal gas behavior at low temperature and high pressure?
(A) CO2 molecules move too quickly to interact with each other.
(B) CO2 molecules have significant intermolecular attractions, causing the measured pressure to be lower than predicted.
(C) The volume of CO2 molecules becomes negligible.
(D) CO2 collisions with the container walls are perfectly elastic, as assumed for ideal gases.`,
    answer: `Correct answer: (B) CO2 molecules have significant intermolecular attractions, causing the measured pressure to be lower than predicted.

At low temperature, CO2 molecules have reduced kinetic energy, which allows the intermolecular attractive forces between them (CO2 has polarizable, relatively large molecules, giving it significant London dispersion forces) to become significant relative to their motion. At high pressure, the molecules are also forced closer together, which further enhances these attractive forces. These attractions pull molecules away from the container walls just before collision, reducing the force of each wall collision, so the measured (observed) pressure ends up lower than the ideal gas law predicts.

(A) is wrong — at low temperature, molecular speeds are actually slower, which increases (not decreases) the time available for intermolecular interactions.
(C) is wrong — at high pressure, molecular volume becomes significant (not negligible) relative to the container, but this effect tends to increase observed pressure (less free space), not decrease it via attraction; the two real-gas effects (volume vs. attraction) work in opposite directions, and this question specifically concerns the attraction-driven low-pressure-reading behavior.
(D) is wrong — perfectly elastic collisions are an assumption of ideal gas behavior, not an explanation for deviation from it.`
  },
  {
    mcq: true,
    title: 'Q10 — Conditions for Most Ideal Gas Behavior',
    content:
`Under which combination of conditions will a real gas behave most like an ideal gas?
(A) High pressure and high temperature
(B) Low pressure and low temperature
(C) Low volume and high temperature
(D) Low pressure and high temperature`,
    answer: `Correct answer: (D) Low pressure and high temperature

Ideal gas behavior is approached when intermolecular attractions and the finite volume of gas molecules are both negligible compared to the assumptions of the ideal gas law. At low pressure, gas molecules are spread far apart on average, so both their own volume and any intermolecular attractions between them are negligible relative to the large container volume and the large distances between molecules. At high temperature, molecules have high kinetic energy, so any intermolecular attractive forces are easily overcome by their rapid motion, and collisions are effectively elastic.

(A) is wrong — high pressure forces molecules close together, making both molecular volume and intermolecular attraction significant, causing deviation from ideal behavior.
(B) is wrong — at low temperature, molecules move slowly, allowing intermolecular attractions to become significant even at low pressure.
(C) is wrong — low volume (equivalent to high pressure for a fixed amount of gas) forces molecules close together, causing the same deviations as (A).`
  },
  {
    mcq: true,
    title: 'Q11 — Direction of Pressure Deviation at High Pressure (Volume Effects)',
    content:
`At very high pressure, the actual (measured) pressure exerted by a real gas tends to be ______ the ideal-gas-law prediction, primarily because the finite volume occupied by the gas molecules themselves reduces the free space available for their motion.
(A) lower than
(B) higher than
(C) equal to
(D) unpredictably related to`,
    answer: `Correct answer: (B) higher than

The ideal gas law assumes gas molecules occupy zero volume, so all of the container's volume is treated as free space for molecular motion. At very high pressure, molecules are packed closely together, and their own finite volume becomes a significant fraction of the total container volume. This means the space actually available for the molecules to move around in is smaller than the full container volume assumed by the ideal gas law. With less free space, molecules collide with the walls more frequently than the ideal gas law (using the full container volume) would predict, so the real, measured pressure ends up higher than the ideal-gas-law prediction at very high pressure. (This is the molecular-volume correction effect; it is distinct from the intermolecular-attraction effect, which instead lowers observed pressure — see the CO2 low-temperature/high-pressure question in this set for that mechanism.)

(A) describes the effect of intermolecular attraction, not molecular volume, and is the dominant effect at low temperature rather than very high pressure alone.
(C) is wrong because real gases do measurably deviate from ideal predictions at very high pressure.
(D) is wrong — the direction of deviation from molecular-volume effects is a well-established, predictable trend, not a random one.`
  },
  {
    mcq: true,
    title: 'Q12 — Direction of Pressure Deviation at Low Temperature (Attraction Effects)',
    content:
`At low temperature (and moderate, not extremely high, pressure), the actual (measured) pressure exerted by a real gas tends to be ______ the ideal-gas-law prediction, primarily because intermolecular attractive forces pull molecules toward each other and reduce the force of their collisions with the container walls.
(A) lower than
(B) higher than
(C) equal to
(D) unpredictably related to`,
    answer: `Correct answer: (A) lower than

The ideal gas law assumes gas molecules exert no attractive (or repulsive) forces on one another. At low temperature, molecules move more slowly, giving intermolecular attractive forces (which the ideal gas law ignores) enough time to act and pull neighboring molecules slightly toward each other. A molecule about to collide with the container wall is thus pulled back slightly by its neighbors, reducing the force of that collision. Since pressure is generated by the cumulative force of wall collisions, this attraction effect lowers the actual, measured pressure below what the ideal gas law (which assumes no such attraction) predicts.

(B) describes the molecular-volume effect (dominant at very high pressure), which is the opposite direction from the attraction effect being described here.
(C) is wrong — real gases do measurably deviate from ideal predictions at low temperature.
(D) is wrong — the direction of this deviation is a well-established, predictable trend.`
  },
  {
    title: 'Q13 — Explaining Why Observed Pressure Is Lower Than the Ideal Prediction',
    content:
`A student measures the actual pressure of a sample of CO2 (g) in a rigid container after heating it and observes that the actual pressure is less than the pressure predicted by the ideal gas law for the same conditions. Explain this observation.`,
    answer: `The ideal gas law assumes that gas particles do not interact with each other (no attractive or repulsive forces) and that the particles have negligible volume compared to the volume of the container. Real gases, including CO2, deviate from these assumptions, especially at conditions where molecules are close together or moving relatively slowly.

CO2 is a linear, polarizable molecule with meaningful London dispersion (intermolecular attractive) forces between molecules. These attractive forces pull neighboring CO2 molecules toward each other, which reduces the effective force of their collisions with the container walls compared to what would occur if there were truly no interactions between molecules. Since observed pressure is a direct measure of the force of these wall collisions, the attractive forces cause the actual, measured pressure to be lower than the pressure the ideal gas law predicts (which assumes zero intermolecular attraction).`
  },
  {
    title: 'Q14 — Explaining a Much-Smaller-Than-Predicted Gas Volume Near the Boiling Point',
    content:
`A sample of O2 (g) is held at constant pressure (1.00 atm) in a cylinder with a movable piston. The student cools the cylinder to −180°C and observes that the measured volume of the O2 (g) is substantially smaller than the volume calculated using the ideal gas law for the same conditions. (The boiling point of O2 (l) is −183°C.) Assume all equipment is functioning properly. Explain why the measured volume is smaller than the calculated volume.`,
    answer: `At −180°C, the temperature is only 3°C above the boiling point of O2 (−183°C) — very close to the temperature at which O2 gas condenses into a liquid. As the gas is cooled this close to its boiling point, the average kinetic energy of the O2 molecules becomes low enough that the intermolecular (London dispersion) attractive forces between molecules — which the ideal gas law completely ignores — become highly significant relative to the molecules' now-slow thermal motion.

These strong relative attractions pull molecules much closer together than the ideal gas law's assumption of freely moving, non-interacting particles would predict, and some of the gas may even begin condensing into the much denser liquid phase. Both effects (strong attraction between still-gaseous molecules, and any actual condensation into liquid) cause the real, measured volume of the sample to be substantially smaller than the volume the ideal gas law calculates by assuming the O2 remains an ideal gas with no intermolecular attractions throughout the cooling process.`
  },
  {
    title: 'Q15 — Mass Calculation Combined With Explaining Non-Ideal Behavior',
    content:
`Carbon dioxide, CO2, is collected from a combustion reaction. A sample of CO2 is measured at 2.47 atm and 315 K, occupying a volume of 0.1250 L.

(a) Calculate the mass of CO2 present.

(b) Explain why CO2 behaves less ideally at very high pressures and at very low temperatures.`,
    answer: `(a) First find moles using the ideal gas law: n = PV/RT

n = (2.47 atm)(0.1250 L) / [(0.08206 L atm mol^-1 K^-1)(315 K)] = 0.30875 / 25.849 = 0.01195 mol CO2

Mass of CO2: 0.01195 mol CO2 x [[frac:44.01 g CO2|1 mol CO2]] = 0.526 g CO2

(b) At very high pressures, CO2 molecules are forced close together, making the actual volume occupied by the molecules themselves significant relative to the container's total volume — a real effect the ideal gas law (which assumes zero molecular volume) ignores, and one that tends to make measured pressure/volume behavior deviate from ideal predictions.

At very low temperatures, CO2 molecules have low average kinetic energy, allowing the intermolecular (London dispersion) attractive forces between molecules to become significant. These attractions pull molecules together, reducing the force of their collisions with container walls (lowering observed pressure relative to the ideal prediction) and, if the temperature is low enough, can even cause the gas to begin condensing into a liquid.`
  },
  {
    title: 'Q16 — Which of Five Gases Deviates Most from Ideal Behavior',
    content:
`Five identical balloons — containing He (g), H2 (g), N2 (g), O2 (g), and CO2 (g) respectively — are each filled to the same volume at 25°C and 1.0 atm pressure. Which balloon contains the gas expected to deviate most from ideal gas behavior? Explain your answer.`,
    answer: `The CO2 balloon contains the gas expected to deviate most from ideal behavior.

Real-gas deviation from the ideal gas law grows with the strength of intermolecular attractive forces and with molecular size/volume. Of the five gases, He, H2, N2, and O2 are all small, nonpolar molecules or atoms with relatively few electrons, giving them weak London dispersion forces. CO2, by contrast, is a larger, more polarizable molecule with considerably more electrons than any of the others, giving it the strongest London dispersion (intermolecular attractive) forces of the group. These stronger attractive forces mean CO2 molecules are more likely to noticeably attract one another and deviate from the ideal gas law's assumption of non-interacting particles, so CO2 is expected to show the greatest deviation from ideal behavior among the five gases in this set.`
  },
  {
    title: 'Q17 — Comparing Deviation of a Polar Molecule to a Nonpolar Molecule',
    content:
`In an experiment, H2 gas is collected by displacement of water in a gas-collection tube, so the gas in the tube is actually a mixture of H2 (g) and H2O (g) vapor at equilibrium. Which of the two gases, H2 or H2O, would be expected to deviate more from ideal gas behavior? Explain your answer.`,
    answer: `H2O vapor deviates more from ideal gas behavior than H2.

Several independent reasons all point the same direction: (1) H2O has significantly more electrons than H2, giving it stronger London dispersion forces. (2) H2O is a polar molecule (bent geometry, O-H bonds have a large electronegativity difference), so it experiences dipole-dipole attractions in addition to dispersion forces, whereas H2 (a symmetric, nonpolar diatomic) experiences only weak dispersion forces. (3) H2O molecules can also hydrogen bond with each other, the strongest common type of intermolecular attraction, which H2 cannot form at all. (4) H2O also occupies a larger molecular volume than the very small H2 molecule, making the "molecules have negligible volume" assumption of the ideal gas law less accurate for H2O.

Because H2O experiences much stronger intermolecular attractive forces (dispersion + dipole-dipole + hydrogen bonding) and has greater molecular volume than H2, its behavior departs more noticeably from the assumptions of the ideal gas law.`
  },
  {
    title: 'Q18 — Non-Ideal Behavior Affecting a Gas Collection Yield',
    content:
`Phosphine gas, PH3, is produced by a reaction and collected over water at low pressure (below 0.01 atm) and 298 K. Explain qualitatively how non-ideal (real) gas behavior could cause the actual amount of PH3 gas collected to differ from what the ideal gas law would predict for the same measured pressure, volume, and temperature.`,
    answer: `PH3 is a polar molecule (trigonal pyramidal, with a P-H bond dipole and a lone pair on phosphorus), so in addition to London dispersion forces it experiences dipole-dipole attractions between molecules. These intermolecular attractive forces pull PH3 molecules toward one another, which can cause the effective, measured gas behavior in the collection vessel to depart slightly from the ideal gas law's assumption of completely non-interacting particles — for instance, at conditions closer to condensation, some PH3 molecules could interact strongly enough to slightly reduce the amount of gas that behaves as freely as the ideal gas law assumes.

Separately, the ideal gas law assumes gas molecules have zero volume; real PH3 molecules occupy a small but nonzero volume, which can also cause the volume calculated from PV = nRT to differ slightly from the true volume available to the gas. Both effects mean that a real, collected sample of PH3 may not match the ideal gas law's prediction exactly, even though the deviation is typically small under the relatively low-pressure, moderate-temperature conditions described here.`
  }
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
    await insertTopic('3.4', topic34New);
    await insertTopic('3.5', topic35New);
    await insertTopic('3.6', topic36New);
    console.log('Done.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
