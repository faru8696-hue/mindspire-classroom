const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

// Unit 3: Intermolecular Forces and Properties
const TOPICS = {
  '3.11': '25cb3403-4eab-4ee1-ae0b-e1f5e89f237a', // Spectroscopy and the Electromagnetic Spectrum
  '3.12': '776ad9bf-86ac-438f-8e69-61dc508c1443', // Photoelectric Effect
  '3.13': '3221f729-653c-4625-88c9-263ecec18c4e', // Beer-Lambert Law
};

const IMG_BASE = 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/unit3/';

/*
Source: Save My Exams "Spectroscopy" MCQ/FRQ sets (The Electromagnetic Spectrum / Transitions
Associated with Radiation / Properties of Photons / Beer-Lambert Law) — 9 MCQ + 7 FRQ total,
covering all three topics combined. Every numeric answer below was independently recomputed
(h = 6.626e-34 J*s, c = 2.998e8 m/s, NA = 6.022e23/mol, 1 eV = 1.602e-19 J).

REJECTED FROM SOURCE (out of current AP Chem CED scope for this topic group):
- MCQ Hard #3 (H vs He photoelectron spectra, comparing peak position/height) — this is
  photoelectron spectroscopy (PES) peak analysis, which is Unit 1 (atomic structure) content,
  not Unit 3 spectroscopy/photoelectric-effect/Beer-Lambert content. Explicitly excluded per
  scope audit.
- FRQ Hard #1(c) (Doppler-shift explanation for emitted photon wavelength discrepancy) —
  Doppler effect / redshift is astrophysics reasoning outside the AP Chem CED; kept only parts
  (a) and (b) of that FRQ (discrete energy levels + wavelength calc), dropped (c).
- FRQ Hard #4 parts (a)-(c) (CuSO4 + Ba(NO3)2 precipitation stoichiometry, net ionic equation,
  moles of precipitate, molarity via gravimetric analysis) — this is a stoichiometry/gravimetric
  analysis question from a different unit, not Beer-Lambert/spectroscopy content. The
  spectrophotometry portions of that same question, (d)-(g) (calibration curve dilution
  prep, reading concentration off a standard curve, cuvette-contamination direction-of-error),
  were not reused either, to avoid packing in an unrelated stoichiometry stem — the same
  concepts (dilution calc, calibration-curve reading, contamination error direction) are already
  covered by other new 3.13 questions below (MnO4-/permanganate dilution calc, Ni(II) calibration
  curve reading, water-in-cuvette dilution error already existing in the DB as 3.13 Q1).
No NMR, IR-interpretation, or mass-spectrometry content appeared in this source at all — this
source set is exclusively EM-spectrum/photon-energy/photoelectric-effect/Beer-Lambert, all in
scope.

Three calibration-curve/absorption-spectrum diagrams were cleanly recoverable and are used as
real images (rendered via pdftoppm at 150dpi and cropped with Python/Pillow, uploaded to
Supabase Storage `question-images/unit3/`):
- 3.13-mno4-absorbance-vs-wavelength.png (absorbance-vs-wavelength scan for MnO4-, peak ~525nm)
- 3.13-mno4-calibration-curve.png (absorbance-vs-[MnO4-] calibration line with one low outlier)
- 3.13-ni-calibration-curve.png (relative absorbance vs. [Ni(II)] calibration line)

Topic 3.12 (Photoelectric Effect) has almost no directly usable source content (the source's
only genuinely photoelectric-effect-flavored item, MCQ Hard #5, just asks for a threshold
wavelength -> threshold frequency conversion via c=lambda*nu). The bulk of 3.12's new questions
below are original, independently-verified photoelectric-effect problems (work function,
threshold frequency Phi=h*nu0, and KE_max = h*nu - Phi) written to fill out this topic per the
CED's photoelectric-effect learning objectives, since none of that content exists in this
source PDF pair.
*/

const topic311Questions = [
  {
    topic: '3.11', mcq: true, title: 'Q3 — Which type of radiation has more energy: UV or IR?',
    content:
`The wavelength range for ultraviolet (UV) radiation is on the order of 10^-8 m, while that of infrared (IR) radiation is on the order of 10^-5 m. Which type of radiation has more energy, and why?
(A) Infrared has more energy because it has a lower frequency.
(B) Infrared has more energy because it has a shorter wavelength.
(C) Ultraviolet has more energy because it has a higher frequency.
(D) Ultraviolet has more energy because it has a longer wavelength.${JUSTIFY}`,
    answer: `Correct answer: (C) Ultraviolet has more energy because it has a higher frequency.
From c = λν, wavelength and frequency are inversely related: since UV has a much shorter wavelength (~10^-8 m) than IR (~10^-5 m), UV must have a much higher frequency. From E = hν, energy is directly proportional to frequency, so the higher-frequency UV photons carry more energy than the lower-frequency IR photons. This matches the EM spectrum's ordering: UV sits at higher energy than IR.

(A) is wrong — infrared has the lower frequency, not higher, so it has less energy, not more.
(B) is wrong — infrared has the longer wavelength of the two, not the shorter one.
(D) is wrong — ultraviolet has the shorter wavelength, not the longer one.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q4 — Photon energy from frequency (5.0 x 10^14 Hz)',
    content:
`If the frequency of a photon of electromagnetic radiation is 5.0 x 10^14 Hz, determine the energy of the photon. (h = 6.626 x 10^-34 J*s)
(A) 1.33 x 10^-19 J
(B) 2.66 x 10^-19 J
(C) 3.31 x 10^-19 J
(D) 6.63 x 10^-19 J${JUSTIFY}`,
    answer: `Correct answer: (C) 3.31 x 10^-19 J
Using Planck's equation E = hν:
E = (6.626 x 10^-34 J*s)(5.0 x 10^14 Hz) = 3.313 x 10^-19 J ≈ 3.31 x 10^-19 J

(A), (B), and (D) result from arithmetic slips (e.g., dividing instead of multiplying, or misplacing a factor of 2), not from a different formula — E = hν is the only relationship needed here.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q5 — Identifying the radiation type causing bond vibration',
    content:
`A molecule's covalent bonds undergo periodic stretching and bending as the molecule absorbs a certain type of electromagnetic radiation. No electrons are promoted to higher energy levels, and the molecule as a whole does not begin to rotate. Which region of the electromagnetic spectrum is being absorbed?
(A) Microwave radiation
(B) Ultraviolet radiation
(C) Infrared radiation
(D) Visible light radiation${JUSTIFY}`,
    answer: `Correct answer: (C) Infrared radiation
Infrared radiation has just enough energy to excite molecular vibrations — the periodic stretching and bending of covalent bonds — without promoting electrons to higher energy levels or inducing whole-molecule rotation.

(A) is wrong — microwave radiation is associated with molecular rotation, not bond vibration.
(B) and (D) are wrong — ultraviolet and visible radiation are both associated with electronic transitions (promoting electrons to higher energy levels), which the question specifically rules out.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q6 — Energy gained by CO2 absorbing a 7 x 10^-7 m IR photon',
    content:
`Determine the amount of energy, in joules, that a carbon dioxide molecule gains when it absorbs a photon of infrared radiation of wavelength 7 x 10^-7 m. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)
(A) 2.26 x 10^-19 J
(B) 2.47 x 10^-19 J
(C) 2.62 x 10^-19 J
(D) 2.84 x 10^-19 J${JUSTIFY}`,
    answer: `Correct answer: (D) 2.84 x 10^-19 J
Use E = hc/λ:
E = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (7.0 x 10^-7 m) = (1.9865 x 10^-25 J*m) / (7.0 x 10^-7 m) = 2.838 x 10^-19 J ≈ 2.84 x 10^-19 J
The CO2 molecule's energy increases by exactly this much, since the absorbed photon's entire energy is transferred to the molecule.

(A), (B), and (C) come from rounding/arithmetic errors in the same E = hc/λ calculation.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q7 — Why dye molecules absorb visible light',
    content:
`Which of the following provides the best explanation for what occurs when dye molecules absorb photons of visible light?
(A) Certain electrons in the dye molecule transition to a higher energy level, with the energy difference between the two levels matching the energy of the absorbed photons.
(B) Certain chemical bonds in the dye molecules start to bend and stretch, with the energy difference between the lower and higher vibrational states equaling the energy of the absorbed photons.
(C) The dye molecules begin to rotate more rapidly in specific modes, with the energy difference between the lower and higher rotational states matching the energy of the absorbed photons.
(D) Certain covalent bonds in the dye molecules begin to break and re-form, with the bond energies of the bonds being the same as the energy of the absorbed photons.${JUSTIFY}`,
    answer: `Correct answer: (A)
Visible light has enough energy to promote valence electrons in a dye molecule's conjugated pi-electron system to a higher energy level; the electronic transition absorbs only photons whose energy exactly matches the gap between the two electron energy levels — this is exactly why dyes appear colored (they absorb specific visible wavelengths and reflect/transmit the rest).

(B) is wrong — bond bending/stretching (vibrational transitions) is caused by infrared radiation, not visible light.
(C) is wrong — molecular rotation is caused by microwave radiation, not visible light.
(D) is wrong — visible-light photons do not carry enough energy to break covalent bonds; bond-breaking requires much higher-energy radiation (e.g., UV or higher), and even then it's a different (photodissociation) process, not ordinary color absorption.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q8 — Ordering the electromagnetic spectrum by increasing photon energy',
    content:
`Which of the following correctly lists types of electromagnetic radiation in order of INCREASING photon energy?
(A) Radio < microwave < infrared < visible < ultraviolet < gamma
(B) Gamma < ultraviolet < visible < infrared < radio
(C) Visible < ultraviolet < radio < microwave < gamma
(D) Infrared < radio < visible < gamma < ultraviolet${JUSTIFY}`,
    answer: `Correct answer: (A) Radio < microwave < infrared < visible < ultraviolet < gamma
The electromagnetic spectrum is ordered by wavelength from longest to shortest as: radio > microwave > infrared > visible > ultraviolet > X-ray > gamma. Since photon energy (E = hc/λ) is inversely proportional to wavelength, the energy ordering is the exact reverse: radio has the longest wavelength and lowest energy, and gamma rays have the shortest wavelength and highest energy. So radio < microwave < infrared < visible < ultraviolet < gamma is the correct increasing-energy order.

(B) is actually the correct order reversed (decreasing energy, not increasing).
(C) and (D) both place at least one region out of its correct position (radio and microwave are far lower energy than visible/UV, not in between them).`
  },
  {
    topic: '3.11', mcq: true, title: 'Q9 — Frequency of 620 nm visible light',
    content:
`Determine the frequency of visible light with a wavelength of 620 nm. (c = 2.998 x 10^8 m/s)
(A) 4.84 x 10^14 Hz
(B) 2.07 x 10^-15 Hz
(C) 1.86 x 10^17 Hz
(D) 6.20 x 10^-7 Hz${JUSTIFY}`,
    answer: `Correct answer: (A) 4.84 x 10^14 Hz
First convert wavelength to meters: 620 nm x [[frac:1 m|10^9 nm]] = 6.20 x 10^-7 m
Then use c = λν, rearranged to ν = c/λ:
ν = (2.998 x 10^8 m/s) / (6.20 x 10^-7 m) = 4.836 x 10^14 Hz ≈ 4.84 x 10^14 Hz

(B) results from dividing λ by c instead of c by λ. (C) and (D) are off by many orders of magnitude from mishandling the unit conversion.`
  },
  {
    topic: '3.11', mcq: true, title: 'Q10 — Absorption spectrum vs. emission spectrum',
    content:
`Which statement correctly distinguishes an atomic absorption spectrum from an atomic emission spectrum of the same element?
(A) The absorption spectrum shows bright lines on a dark background where electrons fall to lower energy levels; the emission spectrum shows dark lines on a continuous background where electrons are promoted to higher levels.
(B) The absorption spectrum shows dark lines on a continuous background at wavelengths where electrons are promoted to higher energy levels; the emission spectrum shows bright lines at those same wavelengths where electrons fall back to lower levels, releasing photons.
(C) The two spectra are identical, since the same element always absorbs and emits at completely different, unrelated wavelengths.
(D) The absorption spectrum is only produced by molecules, while the emission spectrum is only produced by isolated atoms.${JUSTIFY}`,
    answer: `Correct answer: (B)
In an absorption spectrum, a continuous light source is passed through a sample; wavelengths whose energy exactly matches the gap between two electron energy levels are absorbed, promoting electrons to higher levels, so those specific wavelengths appear as dark (missing) lines against the otherwise continuous, bright spectrum. In an emission spectrum, electrons that have been excited fall back down to lower energy levels, releasing photons of exactly those same characteristic energies/wavelengths, which appear as bright lines against an otherwise dark background. Because the transitions involved are the same (same allowed electron energy-level gaps), the absorption and emission lines for a given element occur at the same set of wavelengths.

(A) has the two definitions swapped.
(C) is wrong — the absorption and emission line positions correspond to the same set of transitions/wavelengths, not unrelated ones.
(D) is wrong — both types of spectra can be produced by isolated atoms (this is the classic case, e.g., hydrogen's line spectrum); it isn't an atom-vs-molecule distinction.`
  },
  {
    topic: '3.11', title: 'Q11 — Molecular motion types and UV photon energy',
    content:
`(a) Identify the type of molecular motion associated with each of the following types of electromagnetic radiation: microwave radiation, infrared radiation, and ultraviolet radiation.

(b) A photon of ultraviolet light has a wavelength of 250 nm. Calculate its energy in joules. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)

(c) Compare the ability of ultraviolet radiation and infrared radiation to cause electronic transitions in a molecule.`,
    answer: `(a) Microwave radiation induces molecular rotation. Infrared radiation causes molecular vibration (bond stretching and bending). Ultraviolet radiation promotes electronic transitions (excites electrons to higher energy levels).

(b) First convert wavelength to meters: 250 nm x [[frac:1 m|10^9 nm]] = 2.50 x 10^-7 m
Then use E = hc/λ:
E = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (2.50 x 10^-7 m) = (1.9865 x 10^-25 J*m) / (2.50 x 10^-7 m) = 7.946 x 10^-19 J ≈ 7.95 x 10^-19 J

(c) Ultraviolet radiation has much higher energy per photon than infrared radiation because it has a much shorter wavelength (E = hc/λ). Electronic transitions require a large, specific amount of energy to excite an electron from one energy level to another — an amount that UV photons typically carry but IR photons do not. Infrared photons only carry enough energy to excite vibrational (bond stretching/bending) transitions, not electronic ones, so infrared radiation is essentially unable to cause electronic transitions, while ultraviolet radiation routinely does.`
  },
  {
    topic: '3.11', title: 'Q12 — Why hydrogen absorbs only specific wavelengths, and finding a photon\'s wavelength from its energy',
    content:
`(a) The hydrogen atom absorbs and emits light as its electron transitions between energy levels. Explain why a hydrogen atom only absorbs specific wavelengths of light rather than a continuous range.

(b) A hydrogen atom absorbs a photon with an energy of 2.55 x 10^-18 J, promoting its electron to a higher energy level.
   (i) Calculate the wavelength of this photon, in nm. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)
   (ii) Describe what happens to the electron after it absorbs this photon.`,
    answer: `(a) Electrons in a hydrogen atom can only occupy discrete (quantized) energy levels, not a continuous range of energies. For an electron to transition to a higher energy level, it must absorb a photon whose energy exactly matches the difference between its current energy level and an allowed higher energy level. Photons whose energy does not match any of these specific level-to-level gaps are not absorbed at all, so only specific wavelengths (corresponding to those specific energy gaps) are absorbed.

(b)(i) Rearranging E = hc/λ for wavelength: λ = hc/E
λ = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (2.55 x 10^-18 J) = (1.9865 x 10^-25 J*m) / (2.55 x 10^-18 J) = 7.79 x 10^-8 m
Converting to nm: 7.79 x 10^-8 m x [[frac:10^9 nm|1 m]] = 77.9 nm

(ii) After absorbing the photon, the electron moves to a higher (excited) energy level. This excited state is unstable, so the electron will spontaneously fall back down to a lower energy level, emitting a photon (of the same energy as the gap it falls across) in the process.`
  },
  {
    topic: '3.11', title: 'Q13 — Energy of an emitted Balmer-series photon, per photon and per mole',
    content:
`An electron in an excited hydrogen atom falls from a higher energy level to a lower one, emitting a photon of wavelength 434 nm (a blue-violet emission line in the hydrogen spectrum, part of the Balmer series).

(a) Explain, in terms of electron energy levels, why hydrogen emits light only at specific, discrete wavelengths like this one rather than a continuous range.

(b) Calculate the energy of this emitted photon, in joules. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)

(c) Calculate the energy released per mole of hydrogen atoms undergoing this same transition, in kJ/mol. (NA = 6.022 x 10^23 mol^-1)`,
    answer: `(a) The electron's energy levels in a hydrogen atom are quantized — only certain discrete energies are allowed. When an excited electron falls from a higher allowed energy level to a lower one, it releases a photon whose energy exactly equals the difference between those two specific levels. Since only a fixed, discrete set of energy-level gaps exists in hydrogen, only a fixed, discrete set of photon energies (and therefore wavelengths) can be emitted — not a continuous range.

(b) First convert wavelength to meters: 434 nm x [[frac:1 m|10^9 nm]] = 4.34 x 10^-7 m
Then use E = hc/λ:
E = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (4.34 x 10^-7 m) = (1.9865 x 10^-25 J*m) / (4.34 x 10^-7 m) = 4.577 x 10^-19 J

(c) Multiply the per-photon energy by Avogadro's number to get the energy per mole of transitions:
E_mol = (4.577 x 10^-19 J) x (6.022 x 10^23 mol^-1) = 2.756 x 10^5 J/mol
Converting to kJ/mol: 2.756 x 10^5 J/mol x [[frac:1 kJ|10^3 J]] = 275.6 kJ/mol`
  }
];

const topic312Questions = [
  {
    topic: '3.12', mcq: true, title: 'Q6 — Threshold frequency for the photoelectric effect in potassium',
    content:
`Electromagnetic radiation with a maximum wavelength of 540 nm is required to just barely eject electrons from potassium metal via the photoelectric effect (i.e., 540 nm is potassium's threshold wavelength). What is the threshold frequency associated with this wavelength? (c = 2.998 x 10^8 m/s)
(A) 1.8 x 10^15 s^-1
(B) 1.6 x 10^2 s^-1
(C) 1.9 x 10^6 s^-1
(D) 5.6 x 10^14 s^-1${JUSTIFY}`,
    answer: `Correct answer: (D) 5.6 x 10^14 s^-1
First convert wavelength to meters: 540 nm x [[frac:1 m|10^9 nm]] = 5.40 x 10^-7 m
Then use c = λν, rearranged to ν = c/λ:
ν = (2.998 x 10^8 m/s) / (5.40 x 10^-7 m) = 5.551 x 10^14 s^-1 ≈ 5.6 x 10^14 s^-1

(A), (B), and (C) are all off by many orders of magnitude or otherwise inconsistent with correctly applying c = λν.`
  },
  {
    topic: '3.12', mcq: true, title: 'Q7 — Work function of sodium from its threshold frequency',
    content:
`The threshold frequency for the photoelectric effect in sodium metal is 5.5 x 10^14 Hz. Calculate the work function of sodium, in joules. (h = 6.626 x 10^-34 J*s)
(A) 1.20 x 10^-19 J
(B) 3.64 x 10^-19 J
(C) 6.63 x 10^-19 J
(D) 9.09 x 10^-19 J${JUSTIFY}`,
    answer: `Correct answer: (B) 3.64 x 10^-19 J
The work function (Φ) is the minimum energy needed to eject an electron, which equals the energy of a photon at exactly the threshold frequency: Φ = hν0
Φ = (6.626 x 10^-34 J*s)(5.5 x 10^14 Hz) = 3.64 x 10^-19 J

(A), (C), and (D) come from arithmetic errors in the same Φ = hν0 calculation (e.g., using the wrong power of 10 or the wrong multiplier).`
  },
  {
    topic: '3.12', mcq: true, title: 'Q8 — Maximum kinetic energy of a photoelectron',
    content:
`A photon with frequency 8.0 x 10^14 Hz strikes a metal whose work function is 3.00 x 10^-19 J. Calculate the maximum kinetic energy of the ejected photoelectron. (h = 6.626 x 10^-34 J*s)
(A) 2.30 x 10^-19 J
(B) 3.00 x 10^-19 J
(C) 5.30 x 10^-19 J
(D) 8.30 x 10^-19 J${JUSTIFY}`,
    answer: `Correct answer: (A) 2.30 x 10^-19 J
First find the photon's energy: E_photon = hν = (6.626 x 10^-34 J*s)(8.0 x 10^14 Hz) = 5.301 x 10^-19 J
The maximum kinetic energy of the ejected electron is the photon energy minus the work function (the energy "used up" freeing the electron from the metal):
KE_max = E_photon - Φ = 5.301 x 10^-19 J - 3.00 x 10^-19 J = 2.30 x 10^-19 J

(B) is just the work function itself, not the kinetic energy. (C) is the photon energy itself (forgetting to subtract Φ). (D) incorrectly adds the photon energy and work function instead of subtracting.`
  },
  {
    topic: '3.12', mcq: true, title: 'Q9 — Evidence for the particle nature of light from the photoelectric effect',
    content:
`Which observation from photoelectric-effect experiments provided key evidence that light behaves as discrete particles (photons) rather than purely as a continuous wave?
(A) Increasing the intensity of light below the threshold frequency eventually ejects electrons, given enough time.
(B) No electrons are ejected from a metal when light below the threshold frequency is used, no matter how intense the light is; but electrons are ejected instantly once the threshold frequency is reached, regardless of intensity.
(C) The maximum kinetic energy of ejected electrons increases with increasing light intensity, at any frequency.
(D) Photoelectrons are ejected at the same rate at every frequency, as long as the intensity is held constant.${JUSTIFY}`,
    answer: `Correct answer: (B)
Classical wave theory predicted that a sufficiently intense beam of light, even below any particular frequency, should eventually supply enough cumulative energy to eject electrons (given enough time to "add up"). Instead, experiments showed that no amount of intensity below the threshold frequency ejects any electrons — not even after long exposure — while at or above the threshold frequency, electrons are ejected essentially instantaneously, even at low intensity. This threshold behavior only makes sense if light energy is delivered in discrete packets (photons) of energy E = hν: a single sub-threshold photon can never eject an electron no matter how many of them arrive, but a single photon at or above the threshold frequency can eject one immediately.

(A) is wrong — this is exactly the (incorrect) wave-theory prediction that the photoelectric effect disproved.
(C) is wrong — maximum kinetic energy depends only on frequency (KE_max = hν - Φ), not on intensity; this frequency-dependence (not an intensity-dependence) is itself part of the evidence for photon behavior.
(D) is wrong — below the threshold frequency, no photoelectrons are ejected at all, regardless of intensity, so ejection rate is not frequency-independent.`
  },
  {
    topic: '3.12', mcq: true, title: 'Q10 — Comparing work functions of two metals via threshold frequency',
    content:
`Metal A has a threshold frequency of 4.5 x 10^14 Hz, and Metal B has a threshold frequency of 6.0 x 10^14 Hz. Which metal has the larger work function, and why?
(A) Metal A, because a lower threshold frequency means less energy is needed to eject an electron.
(B) Metal A, because threshold frequency and work function are inversely proportional.
(C) Metal B, because a higher threshold frequency corresponds to a photon of greater energy being needed to just eject an electron.
(D) The two metals must have identical work functions, since work function depends only on the metal's mass, not its electronic structure.${JUSTIFY}`,
    answer: `Correct answer: (C) Metal B, because a higher threshold frequency corresponds to a photon of greater energy being needed to just eject an electron.
The work function is related to threshold frequency by Φ = hν0 — they are directly proportional. Since Metal B has the higher threshold frequency (6.0 x 10^14 Hz vs. 4.5 x 10^14 Hz for Metal A), Metal B requires a more energetic photon just to begin ejecting electrons, meaning its valence electrons are more strongly bound and it has the larger work function.

(A) has the logic backwards — a lower threshold frequency means a smaller work function (electrons are easier to eject), not a larger one.
(B) is wrong — Φ = hν0 means work function and threshold frequency are directly proportional, not inversely.
(D) is wrong — the work function depends on how tightly a metal's valence electrons are bound (its electronic structure), which varies significantly between different metals; it is not a fixed, mass-dependent quantity.`
  },
  {
    topic: '3.12', mcq: true, title: 'Q11 — Threshold wavelength of cesium from its work function',
    content:
`The work function of cesium metal is 3.43 x 10^-19 J. Calculate the threshold (maximum) wavelength of light that can eject electrons from cesium via the photoelectric effect. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)
(A) 193 nm
(B) 386 nm
(C) 579 nm
(D) 966 nm${JUSTIFY}`,
    answer: `Correct answer: (C) 579 nm
At the threshold wavelength, the photon's energy exactly equals the work function: Φ = hc/λ0, so λ0 = hc/Φ
λ0 = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (3.43 x 10^-19 J) = (1.9865 x 10^-25 J*m) / (3.43 x 10^-19 J) = 5.79 x 10^-7 m
Converting to nm: 5.79 x 10^-7 m x [[frac:10^9 nm|1 m]] = 579 nm
Any wavelength longer than 579 nm carries too little photon energy to overcome cesium's work function and eject an electron; wavelengths shorter than 579 nm can eject electrons (with any energy above Φ becoming the ejected electron's kinetic energy).

(A), (B), and (D) are off by simple factor-of-2/3 or unit-conversion errors from the correct λ0 = hc/Φ calculation.`
  },
  {
    topic: '3.12', mcq: true, title: 'Q12 — Effect of increasing light intensity above the threshold frequency',
    content:
`In a photoelectric-effect experiment, light with a frequency above a metal's threshold frequency is shone on the metal, and the intensity of the light is then increased while the frequency is held constant. What effect does this have on the ejected photoelectrons?
(A) It increases the number of photoelectrons ejected per second, but does not change their maximum kinetic energy.
(B) It increases the maximum kinetic energy of the photoelectrons, but does not change how many are ejected per second.
(C) It increases both the number of photoelectrons ejected per second and their maximum kinetic energy.
(D) It has no effect on the photoelectric effect, since only frequency matters.${JUSTIFY}`,
    answer: `Correct answer: (A) It increases the number of photoelectrons ejected per second, but does not change their maximum kinetic energy.
Increasing intensity at a fixed frequency means more photons (each of energy E = hν) strike the metal per second, ejecting more electrons per second (a larger photocurrent). However, the maximum kinetic energy of each individual ejected electron is set only by KE_max = hν - Φ, which depends solely on the (unchanged) photon frequency and the metal's work function — not on how many photons arrive. So each ejected electron still leaves with the same maximum kinetic energy as before; there are just more of them.

(B) and (C) are wrong because kinetic energy does not depend on intensity at a fixed frequency.
(D) is wrong — intensity does matter for the rate/number of electrons ejected, even though it does not affect their maximum kinetic energy.`
  },
  {
    topic: '3.12', title: 'Q13 — Work function, threshold frequency, and kinetic energy for platinum',
    content:
`(a) Define the work function of a metal.

(b) The work function of platinum is 9.14 x 10^-19 J. Calculate the threshold frequency required to eject an electron from platinum. (h = 6.626 x 10^-34 J*s)

(c) Light of frequency 2.0 x 10^15 Hz strikes a platinum surface. Calculate the maximum kinetic energy of the ejected electron, in both joules and electron-volts. (1 eV = 1.602 x 10^-19 J)`,
    answer: `(a) The work function (Φ) of a metal is the minimum amount of energy required to remove (eject) an electron from the surface of that metal.

(b) At the threshold frequency, the photon energy exactly equals the work function: Φ = hν0, so ν0 = Φ/h
ν0 = (9.14 x 10^-19 J) / (6.626 x 10^-34 J*s) = 1.379 x 10^15 Hz

(c) First find the photon's energy at 2.0 x 10^15 Hz:
E_photon = hν = (6.626 x 10^-34 J*s)(2.0 x 10^15 Hz) = 1.325 x 10^-18 J
Then subtract the work function to get the maximum kinetic energy of the ejected electron:
KE_max = E_photon - Φ = 1.325 x 10^-18 J - 9.14 x 10^-19 J = 4.11 x 10^-19 J
Converting to eV: 4.11 x 10^-19 J x [[frac:1 eV|1.602 x 10^-19 J]] = 2.57 eV`
  },
  {
    topic: '3.12', title: 'Q14 — Comparing two metals\' work functions against a fixed-wavelength photon',
    content:
`Metal X has a work function of 2.30 eV, and Metal Y has a work function of 4.80 eV. (1 eV = 1.602 x 10^-19 J)

(a) Convert each metal's work function to joules.

(b) A photon of wavelength 400 nm strikes each metal separately. Calculate the energy of this photon in joules. (h = 6.626 x 10^-34 J*s, c = 2.998 x 10^8 m/s)

(c) For each metal, determine whether a photoelectron is ejected when struck by this 400 nm photon. For any metal where an electron is ejected, calculate its maximum kinetic energy in joules. Justify your reasoning.`,
    answer: `(a) Metal X: 2.30 eV x [[frac:1.602 x 10^-19 J|1 eV]] = 3.68 x 10^-19 J
Metal Y: 4.80 eV x [[frac:1.602 x 10^-19 J|1 eV]] = 7.69 x 10^-19 J

(b) First convert wavelength to meters: 400 nm x [[frac:1 m|10^9 nm]] = 4.00 x 10^-7 m
Then use E = hc/λ:
E = [(6.626 x 10^-34 J*s)(2.998 x 10^8 m/s)] / (4.00 x 10^-7 m) = (1.9865 x 10^-25 J*m) / (4.00 x 10^-7 m) = 4.966 x 10^-19 J

(c) For Metal X: the photon energy (4.966 x 10^-19 J) is greater than Metal X's work function (3.68 x 10^-19 J), so a photoelectron IS ejected. Its maximum kinetic energy is:
KE_max = 4.966 x 10^-19 J - 3.68 x 10^-19 J = 1.29 x 10^-19 J
For Metal Y: the photon energy (4.966 x 10^-19 J) is LESS than Metal Y's work function (7.69 x 10^-19 J), so no photoelectron is ejected — the photon simply does not carry enough energy to overcome Metal Y's work function, regardless of how many such photons arrive.`
  }
];

const topic313Questions = [
  {
    topic: '3.13', mcq: true, title: 'Q6 — Effect of halving the path length on absorbance',
    content:
`A colored solution is analyzed by spectrophotometer. The solution has a concentration of 0.2 M and a path length of 1.00 cm. When the filter of the spectrophotometer is set to 430 nm, the absorbance is x. If the experiment is repeated using a cuvette with a 0.5 cm path length (same solution, same wavelength), what is the new absorbance?
(A) x/4
(B) x/2
(C) x
(D) 2x${JUSTIFY}`,
    answer: `Correct answer: (B) x/2
The Beer-Lambert law is A = εbc, where A = absorbance, ε = molar absorptivity, b = path length, and c = concentration. Absorbance is directly proportional to path length (b), with ε and c held constant. Halving the path length (from 1.00 cm to 0.5 cm) therefore halves the absorbance: the new absorbance is x/2.

(A) would require the path length to be quartered, not halved. (C) ignores that absorbance depends on path length at all. (D) has the proportionality backwards — halving b should halve A, not double it.`
  },
  {
    topic: '3.13', mcq: true, title: 'Q7 — Choosing the optimum wavelength from an absorbance scan',
    imageUrl: IMG_BASE + '3.13-mno4-absorbance-vs-wavelength.png',
    content:
`A student measures the absorbance of a KMnO4 (aq) solution across a range of wavelengths to determine the best wavelength for colorimetric analysis. The resulting absorbance-vs-wavelength scan is shown below.

[See image: absorbance-vs-wavelength scan for a permanganate (MnO4-) solution, with a broad peak centered around 500-575 nm and a maximum near 525 nm.]

Based on the scan, which wavelength should the student use to monitor the concentration of MnO4- (aq) by spectrophotometry?
(A) 400 nm
(B) 525 nm
(C) 600 nm
(D) 750 nm${JUSTIFY}`,
    answer: `Correct answer: (B) 525 nm
The optimum wavelength for a colorimetric/spectrophotometric concentration measurement is the wavelength of maximum absorbance, since this gives the greatest sensitivity (the largest change in absorbance per unit change in concentration) and the best signal-to-noise ratio. Reading the graph, the curve peaks at approximately 525 nm, with an absorbance close to 0.92 — noticeably higher than at any other wavelength shown.

(A) 400 nm and (D) 750 nm both fall in the flat, near-zero-absorbance tails of the curve, which would give poor sensitivity. (C) 600 nm is past the peak, on the descending part of the curve, where absorbance is already dropping and sensitivity is reduced compared to the true maximum at 525 nm.`
  },
  {
    topic: '3.13', title: 'Q8 — Dilution calculation for a calibration curve, and diagnosing a low outlier point',
    imageUrl: IMG_BASE + '3.13-mno4-calibration-curve.png',
    content:
`A student uses a stock solution of 2.40 x 10^-3 M KMnO4 (aq) to prepare standard solutions of MnO4- (aq) for a calibration curve.

(a) Calculate the volume, in mL, of 2.40 x 10^-3 M KMnO4 (aq) that is required to produce 100.0 mL of a standard 1.68 x 10^-3 M MnO4- (aq) solution.

(b) The student follows this procedure for each standard solution: (1) prepare the diluted standard, (2) rinse the cuvette with distilled water, (3) rinse the cuvette with the standard solution and fill it with the standard solution, (4) measure absorbance. The resulting calibration curve is shown below, where one data point (marked with an arrow) falls noticeably below the line of best fit.

[See image: absorbance-vs-[MnO4-] calibration curve with a straight line of best fit through the origin; one data point near the middle of the concentration range sits below the line, with an arrow pointing to it.]

Assuming all lab equipment functioned properly, identify which procedural step the student could have executed incorrectly to produce this low outlier, and justify your answer.`,
    answer: `(a) Use the dilution equation M1V1 = M2V2, solved for V1 (the volume of concentrated stock solution needed):
V1 = (M2 x V2) / M1 = [(1.68 x 10^-3 M)(100.0 mL)] / (2.40 x 10^-3 M) = 70.0 mL

(b) The step that was most likely executed incorrectly is step 3 — if the cuvette was not properly rinsed with the standard solution before being filled for measurement, residual distilled water left over from step 2 would dilute that particular standard solution inside the cuvette. This lowers its effective MnO4- concentration compared to what it should be, which (by A = εbc) produces a lower-than-expected absorbance reading — exactly matching a data point that falls below the line of best fit while all other points (where the cuvette presumably was rinsed correctly) still follow the trend.`
  },
  {
    topic: '3.13', title: 'Q9 — Determining moles of NiSO4 in a sample from a calibration curve',
    imageUrl: IMG_BASE + '3.13-ni-calibration-curve.png',
    content:
`A student creates a calibration curve of relative absorbance vs. concentration of nickel(II) ions at a fixed wavelength of light, shown below.

[See image: relative-absorbance-vs-concentration calibration line for Ni(II), passing through the origin and rising linearly to about 0.89 at 1.0 mol/L.]

The student then measures the absorbance of a 150. mL sample of NiSO4 (aq) solution of unknown concentration and finds a relative absorbance of 0.6.

(a) Using the calibration curve, estimate the concentration of Ni(II) in the unknown sample, in mol/L.

(b) Calculate the number of moles of NiSO4 present in the 150. mL sample.`,
    answer: `(a) Reading the calibration curve at a relative absorbance of 0.6, the corresponding concentration is approximately 0.66 mol/L (the line passes very close to this point, consistent with its slope of roughly 0.89 per 1.0 mol/L).

(b) Convert the sample volume to liters: 150. mL x [[frac:1 L|1000 mL]] = 0.150 L
Then use n = c x V:
n = (0.66 mol/L)(0.150 L) = 0.099 mol
So the sample contains approximately 0.099 mol of NiSO4. (Note: the question asks for moles present in the sample, not the concentration — a common point of confusion.)`
  },
  {
    topic: '3.13', mcq: true, title: 'Q10 — Solving for concentration using the Beer-Lambert law',
    content:
`A solution's absorbance is measured to be 0.40 using a cuvette with a path length of 1.0 cm. The molar absorptivity of the solution at this wavelength is 250 L mol^-1 cm^-1. Calculate the concentration of the solution.
(A) 6.25 x 10^-5 mol/L
(B) 1.60 x 10^-3 mol/L
(C) 6.25 x 10^-3 mol/L
(D) 1.00 x 10^1 mol/L${JUSTIFY}`,
    answer: `Correct answer: (B) 1.60 x 10^-3 mol/L
The Beer-Lambert law is A = εbc. Solving for concentration:
c = A / (εb) = 0.40 / [(250 L mol^-1 cm^-1)(1.0 cm)] = 0.40 / 250 = 1.60 x 10^-3 mol/L

(A) results from dividing by ε*b twice (or an extra factor of 250). (C) is off by a factor of 10. (D) results from multiplying A by εb instead of dividing.`
  },
  {
    topic: '3.13', mcq: true, title: 'Q11 — Effect of tripling absorbance at constant concentration',
    content:
`The same solution (same concentration, same molar absorptivity) is measured a second time, and its absorbance is found to have tripled compared to the first measurement. What does this imply about the path length of the cuvette used the second time?
(A) The path length is one-third of the original.
(B) The path length is unchanged.
(C) The path length is three times the original.
(D) No conclusion about path length can be drawn without more information.${JUSTIFY}`,
    answer: `Correct answer: (C) The path length is three times the original.
By the Beer-Lambert law, A = εbc, absorbance is directly proportional to path length (b) when ε and c are held constant. Since the concentration and molar absorptivity are unchanged but the absorbance has tripled, the path length must also have tripled to account for that threefold increase.

(A) has the proportionality backwards. (B) is inconsistent with absorbance changing at all if ε and c are constant. (D) is wrong — the direct proportionality in A = εbc is sufficient to draw this conclusion with the given information.`
  },
  {
    topic: '3.13', mcq: true, title: 'Q12 — Reading concentration from a calibration-curve equation',
    content:
`A calibration curve for a spectrophotometric assay has the equation A = 450c + 0.015, where A is absorbance and c is concentration in mol/L. If the absorbance of an unknown sample is measured to be 0.540, determine its concentration.
(A) 1.17 x 10^-3 mol/L
(B) 1.20 x 10^-3 mol/L
(C) 1.75 x 10^-4 mol/L
(D) 3.33 x 10^-4 mol/L${JUSTIFY}`,
    answer: `Correct answer: (A) 1.17 x 10^-3 mol/L
Substitute A = 0.540 into the calibration equation and solve for c:
0.540 = 450c + 0.015
0.540 - 0.015 = 450c
0.525 = 450c
c = 0.525 / 450 = 1.1667 x 10^-3 mol/L ≈ 1.17 x 10^-3 mol/L

(B) results from forgetting to subtract the y-intercept (0.015) before dividing. (C) and (D) come from other arithmetic slips in rearranging the linear equation.`
  },
  {
    topic: '3.13', title: 'Q13 — Effect of using a cuvette with the wrong path length on a calibration curve reading',
    content:
`A calibration curve, A = 450c + 0.015 (constructed using cuvettes with a 1.0 cm path length), is used to determine the concentration of an unknown sample. The student measures an absorbance of 0.540 for the unknown, and — assuming the same 1.0 cm path length used to build the calibration curve — calculates a concentration of 1.17 x 10^-3 mol/L.

(a) Suppose the student's cuvette actually had a path length of 2.0 cm, not 1.0 cm, when the unknown was measured (but the calibration curve was still built using 1.0 cm cuvettes). Explain, using the Beer-Lambert law, whether the true concentration of the unknown is higher than, lower than, or equal to 1.17 x 10^-3 mol/L.

(b) Estimate the true concentration of the unknown sample, given the path-length error described in part (a).`,
    answer: `(a) The true concentration is LOWER than 1.17 x 10^-3 mol/L. By the Beer-Lambert law, A = εbc, absorbance is directly proportional to path length. Using a cuvette with twice the path length (2.0 cm instead of 1.0 cm) produces twice the absorbance for the same actual concentration, compared to what the 1.0 cm calibration curve assumes. Since the calibration curve equation was built assuming a 1.0 cm path length, applying it directly to an absorbance reading taken with a 2.0 cm cuvette overestimates the true concentration — the measured absorbance is inflated by the longer path length, not by a higher concentration.

(b) Since doubling the path length doubles the absorbance for a given concentration, the true concentration is approximately half of the value calculated by (incorrectly) assuming a 1.0 cm path length:
c_true ≈ (1.17 x 10^-3 mol/L) / 2 = 5.83 x 10^-4 mol/L`
  },
  {
    topic: '3.13', title: 'Q14 — Dilution effect on absorbance, and possible causes of a lower-than-expected reading',
    content:
`A student prepares a solution of an organic dye, molecule X, and records an absorbance of 0.85 in a spectrophotometer at its wavelength of maximum absorbance.

(a) The solution is then diluted by a factor of 2 (equal volumes of solution and solvent are combined), and the absorbance is measured again. Predict the new absorbance value, and justify your answer using the Beer-Lambert law.

(b) The student prepares another diluted solution the same way, but the measured absorbance is lower than the value predicted in part (a), even though the spectrophotometer was confirmed to be properly calibrated beforehand. Suggest two distinct possible reasons (other than instrumental miscalibration) for this discrepancy, and justify each one.`,
    answer: `(a) The new absorbance should be 0.85 / 2 = 0.425. The Beer-Lambert law, A = εbc, shows that absorbance is directly proportional to concentration when path length and molar absorptivity are constant. Diluting the solution by a factor of 2 halves its concentration, so the absorbance should also be halved.

(b) Two possible reasons (other than instrumental miscalibration):
1. Incomplete mixing — if the diluted solution was not thoroughly mixed, the sample drawn for measurement may not have reached the intended, uniform concentration, resulting in a lower actual concentration (and lower absorbance) in the cuvette than expected.
2. A fingerprint, smudge, or residue on the outside of the cuvette — this can scatter or block some of the light passing through, which some spectrophotometers may register as reduced light reaching the detector along the sample-signal pathway, artificially lowering the recorded absorbance reading relative to the sample's true absorbance.
(Excess solvent accidentally added during dilution, which would truly lower the concentration below the intended value, is another acceptable answer.)`
  }
];

async function insertTopic(name, id, questions) {
  const { data: existing, error: e1 } = await sb.from('questions').select('order_index').eq('topic_id', id).order('order_index', { ascending: false }).limit(1);
  if (e1) { console.error(name, 'lookup error', e1); return; }
  let nextIndex = (existing && existing.length > 0) ? existing[0].order_index + 1 : 0;
  for (const q of questions) {
    const row = {
      topic_id: id,
      title: q.title,
      content: q.content,
      answer_key: q.answer,
      order_index: nextIndex,
      image_url: q.imageUrl || null,
    };
    const { error } = await sb.from('questions').insert(row);
    if (error) { console.error('INSERT FAIL', name, q.title, error); } else { console.log('inserted', name, nextIndex, q.title); }
    nextIndex++;
  }
}

(async () => {
  await insertTopic('3.11', TOPICS['3.11'], topic311Questions);
  await insertTopic('3.12', TOPICS['3.12'], topic312Questions);
  await insertTopic('3.13', TOPICS['3.13'], topic313Questions);
})();
