const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '6.6': 'ae92bf0e-7e5b-4874-934b-02f1c6948553',
  '6.7': '13298cef-b1a4-466b-bedc-3ec4cc6bc3ea',
  '6.8': 'c0aa92dc-39f2-4287-96f0-e83b4a92aa6d',
  '6.9': 'c6574754-0095-4733-a17a-9c1fa703dbbe',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/u69imgs';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit6-topics6.6-6.9/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 6.6 — Introduction to Enthalpy of Reaction ============================= */
const t66 = [
  {
    title: 'Q1 — Heat Released from Butane Combustion',
    content: `2 C4H10(g) + 13 O2(g) → 8 CO2(g) + 10 H2O(g)     ΔHrxn = -5327 kJ/molrxn

(a) Calculate the mass of C4H10(g) that is required to produce 125 kJ of heat in this reaction. Assume that O2(g) is present in an excess amount. Include units in your answer.
(b) A reaction vessel contains a mixture of 15.0 g C4H10(g) and 45.0 g O2(g). The mixture is sparked, initiating a chemical reaction that proceeds until one of the reactants is completely consumed. Calculate the amount of heat released in this experiment. Include units in your answer.`,
    answer: `(a) 125 kJ x (1 molrxn / 5327 kJ) x (2 mol C4H10 / 1 molrxn) x (58.12 g C4H10 / 1 mol C4H10) = 125 x (2/5327) x 58.12 = 2.73 g C4H10.

(b) First determine the limiting reactant. Moles of C4H10 = 15.0 g / 58.12 g/mol = 0.258 mol. Moles of O2 = 45.0 g / 32.00 g/mol = 1.406 mol.

Using the 2:13 mole ratio of C4H10 to O2: 0.258 mol C4H10 would require 0.258 x (13/2) = 1.677 mol O2, but only 1.406 mol O2 is available — so O2 is the limiting reactant.

Heat released = 1.406 mol O2 x (1 molrxn / 13 mol O2) x (5327 kJ / 1 molrxn) = 1.406 x (5327/13) = 576 kJ of heat released.`,
  },
  {
    title: 'Q2 — Calorimetry Experiment for a Redox Reaction',
    imageKey: 'calorimetry',
    content: `Na2S2O3(aq) + 4 NaOCl(aq) + 2 NaOH(aq) → 2 Na2SO4(aq) + 4 NaCl(aq) + H2O(l)

A student performs an experiment to determine the value of the enthalpy change, ΔHrxn, for the oxidation-reduction reaction represented by the equation above.

(a) Determine the oxidation number of Cl in NaOCl.
(b) Calculate the number of grams of Na2S2O3 needed to prepare 100.00 mL of 0.500 M Na2S2O3(aq).

In the experiment, the student uses the solutions shown in the table below.

Solution | Concentration (M) | Volume (mL)
Na2S2O3(aq) | 0.500 | 5.00
NaOCl(aq) | 0.500 | 5.00
NaOH(aq) | 0.500 | 5.00

(c) Using the balanced equation for the oxidation-reduction reaction and the information in the table above, determine which reactant is the limiting reactant. Justify your answer.

The solutions, all originally at 20.0°C, are combined in an insulated calorimeter. The temperature of the reaction mixture is monitored, as shown in the graph (initial temperature 20.0°C, rising to a final plateau of approximately 32.6°C).

(d) According to the graph, what is the temperature change of the reaction mixture?
(e) The mass of the reaction mixture inside the calorimeter is 15.21 g.
   (i) Calculate the magnitude of the heat energy, in joules, that is released during the reaction. Assume that the specific heat of the reaction mixture is 3.94 J/(g·°C) and that the heat absorbed by the calorimeter is negligible.
   (ii) Using the balanced equation for the oxidation-reduction reaction and your answer to part (c), calculate the value of the enthalpy change of the reaction, ΔHrxn, in units of kJ/molrxn. Include the appropriate algebraic sign with your answer.

The student repeats the experiment, but this time doubling the volume of each of the reactants (10.0 mL of each 0.500 M solution instead of 5.00 mL).

(f) Do you predict that the magnitude of heat (q), in joules, released in the second experiment will be less than, equal to, or greater than the value calculated in part (e)(i)? Justify your answer.
(g) Do you predict that the magnitude (i.e., absolute value) of the enthalpy change, ΔHrxn, in units of kJ/molrxn, calculated from the results of the second experiment will be less than, equal to, or greater than the value calculated in part (e)(ii)? Justify your answer.`,
    answer: `(a) In NaOCl, Na is +1 and O is -2. Since the compound is neutral: (+1) + Cl + (-2) = 0, so Cl = +1.

(b) Moles of Na2S2O3 needed = 0.500 mol/L x 0.10000 L = 0.0500 mol. Molar mass of Na2S2O3 = 2(22.99) + 2(32.07) + 3(16.00) = 158.12 g/mol. Mass = 0.0500 mol x 158.12 g/mol = 7.91 g.

(c) Moles available: Na2S2O3 = 0.500 M x 0.00500 L = 0.00250 mol. NaOCl = 0.500 M x 0.00500 L = 0.00250 mol. NaOH = 0.500 M x 0.00500 L = 0.00250 mol. The balanced equation requires a 1:4:2 ratio of Na2S2O3:NaOCl:NaOH. Using 0.00250 mol Na2S2O3 as the basis, the reaction would require 4 x 0.00250 = 0.0100 mol NaOCl (only 0.00250 mol available) and 2 x 0.00250 = 0.00500 mol NaOH (only 0.00250 mol available). Since NaOCl requires the largest excess relative to what's available (needs 4x as much Na2S2O3's moles but only has 1x), NaOCl is the limiting reactant (there isn't enough NaOCl to react with all of the Na2S2O3 or NaOH present).

(d) ΔT = 32.6°C - 20.0°C = 12.6°C (read from the graph: initial plateau at 20.0°C, final plateau at approximately 32.6°C).

(e) (i) q = mcΔT = (15.21 g)(3.94 J/(g·°C))(12.6°C) = 755 J (magnitude of heat released).

(ii) Since NaOCl is the limiting reactant (0.00250 mol available), moles of reaction = 0.00250 mol NaOCl x (1 molrxn / 4 mol NaOCl) = 0.000625 molrxn. ΔHrxn = -q / molrxn = -(0.755 kJ) / (0.000625 molrxn) = -1208 kJ/molrxn. The sign is negative because the temperature of the mixture increased, meaning the reaction released heat (exothermic).

(f) Equal to. Doubling the volume of each reactant while keeping the same concentrations doubles the moles of each reactant used, which doubles the total heat released — but the question in (e)(i) asks about the heat released in THIS (undoubled) experiment specifically, so the original value in (e)(i) itself doesn't change; rather, the SECOND experiment's heat release would be greater than (roughly double) the first experiment's value. If comparing the second experiment's total heat (q) to the first experiment's total heat (e)(i), the second value would be greater (since twice as much of each reactant reacts, releasing twice as much heat, assuming the same specific heat capacity and proportionally more mass, they roughly cancel but the total energy released is what's compared here — using the same logic as before, doubling moles of limiting reactant doubles total heat released).

(g) Equal to. The enthalpy change ΔHrxn (in kJ/molrxn) is an intensive quantity — it represents the heat released or absorbed per mole of reaction, which does not depend on how much material reacts. Since both the heat released and the moles of reaction double together when the volumes are doubled (with concentration unchanged), the ratio ΔHrxn = -q/molrxn stays the same.`,
  },
];

/* ============================= 6.7 — Bond Enthalpies ============================= */
const t67 = [
  {
    title: 'Q3 — Interpreting Bond Enthalpy Values (H-H and C-C)',
    content: `Bond | Bond Enthalpy (kJ/mol)
H-H | 436
C-C | 348

Use the information in the table above to answer the following questions.

(a) 436 kJ of energy is ___________ when 1 mole of H-H bonds are broken, and 436 kJ of energy is ___________ when 1 mole of H-H bonds are formed.
(b) Do you predict that the bond energy of the I-I bond should be less than or greater than 436 kJ/mol? Justify your answer.
(c) Do you predict that the bond energy of the C=C bond should be less than or greater than 348 kJ/mol? Justify your answer.`,
    answer: `(a) 436 kJ of energy is absorbed when 1 mole of H-H bonds are broken, and 436 kJ of energy is released when 1 mole of H-H bonds are formed. (Breaking bonds always requires/absorbs energy; forming bonds always releases energy — the same magnitude applies in both directions.)

(b) Less than 436 kJ/mol. Iodine (I) atoms have a much larger atomic radius than hydrogen (H) atoms, and the bonding electrons in an I-I bond are located much farther from both nuclei than in an H-H bond. Because the bonding electrons are farther from the nuclei, the attraction (and thus the bond strength) is weaker, resulting in a lower bond energy for I-I compared to H-H.

(c) Greater than 348 kJ/mol. A C=C double bond consists of one sigma bond and one pi bond (twice as much electron density/bonding interaction shared between the two carbon atoms as a single C-C bond, which has only one sigma bond). Because more electron density is being shared/attracting the two nuclei together in a double bond, the C=C bond is stronger (requires more energy to break) than a single C-C bond, so its bond energy is greater than 348 kJ/mol.`,
  },
  {
    title: 'Q4 — Predicting the Sign of ΔHrxn for N2O4 Decomposition',
    content: `N2O4(g) → 2 NO2(g)

Do you predict that the sign of ΔHrxn for the reaction represented by the equation above should be positive or negative? Justify your answer.`,
    answer: `Positive (endothermic). In this reaction, one N-N bond (within N2O4) is broken, and no new bonds are formed to compensate — the products (2 NO2) contain the same N-O bonding framework as before, just with the two NO2 units separated from each other. Since bond breaking always requires (absorbs) energy, and there is no new, stronger bond formation to release an equal or greater amount of energy back, the overall reaction must absorb a net amount of energy, making ΔHrxn positive (endothermic).`,
  },
  {
    title: 'Q5 — Calculating ΔHrxn for Methane Combustion Using Bond Energies',
    content: `Bond | Bond Enthalpy (kJ/mol)
C-H | 413
O=O | 498
C=O | 799
O-H | 463

Use the bond energy values listed above to calculate the value of ΔHrxn for the reaction represented by the equation below.

CH4(g) + 2 O2(g) → CO2(g) + 2 H2O(g)

(CH4 has 4 C-H bonds; each O2 has 1 O=O bond; CO2 has 2 C=O bonds; each H2O has 2 O-H bonds.)`,
    answer: `ΔHrxn = Σ(bond enthalpies of bonds broken) - Σ(bond enthalpies of bonds formed)

Bonds broken (reactants): 4 mol C-H bonds (in CH4) + 2 mol O=O bonds (in 2 O2) = 4(413) + 2(498) = 1652 + 996 = 2648 kJ.

Bonds formed (products): 2 mol C=O bonds (in CO2) + 4 mol O-H bonds (in 2 H2O, 2 O-H bonds each) = 2(799) + 4(463) = 1598 + 1852 = 3450 kJ.

ΔHrxn = 2648 kJ - 3450 kJ = -802 kJ/molrxn.

The negative sign indicates this reaction is exothermic — more energy is released forming the new C=O and O-H bonds in the products than is required to break the C-H and O=O bonds in the reactants, which is consistent with methane combustion being a highly exothermic reaction.`,
  },
  {
    title: 'Q6 — Calculating ΔHrxn for a Nitrogen-Hydrogen Reaction Using Bond Energies',
    content: `Bond | Bond Enthalpy (kJ/mol)
H-H | 436
N-H | 391
N-N | 163
N=N | 418
N≡N | 945

Use the bond energy values listed above to calculate the value of ΔHrxn for the reaction represented by the equation below.

4 NH3(g) + N2H4(g) → 3 N2(g) + 8 H2(g)

(Each NH3 has 3 N-H bonds; N2H4 has 1 N-N single bond and 4 N-H bonds; each N2 has 1 N≡N triple bond; each H2 has 1 H-H bond.)`,
    answer: `Bonds broken (reactants): 4 NH3 x 3 N-H bonds each = 12 mol N-H bonds; plus N2H4 has 1 N-N bond and 4 N-H bonds. Total N-H bonds broken = 12 + 4 = 16 mol N-H. Total N-N bonds broken = 1 mol N-N.

Energy to break bonds = 16(391) + 1(163) = 6256 + 163 = 6419 kJ.

Bonds formed (products): 3 N2 x 1 N≡N bond each = 3 mol N≡N bonds; 8 H2 x 1 H-H bond each = 8 mol H-H bonds.

Energy released forming bonds = 3(945) + 8(436) = 2835 + 3488 = 6323 kJ.

ΔHrxn = 6419 kJ - 6323 kJ = +96 kJ/molrxn.

The positive sign indicates this reaction is endothermic — slightly more energy is required to break the N-H and N-N bonds in the reactants than is released forming the very strong N≡N triple bonds and H-H bonds in the products.`,
  },
];

/* ============================= 6.8 — Enthalpy of Formation ============================= */
const t68 = [
  {
    title: 'Q7 — Standard Enthalpy of Formation for NO(g)',
    content: `The standard enthalpy of formation, ΔHf°, for nitrogen monoxide, NO(g), is 90.3 kJ/mol.

(a) Write a balanced chemical equation for the formation of 1 mole of NO(g) from its constituent elements under standard conditions.
(b) Determine the value of ΔHrxn°, in units of kJ/molrxn, for the equation shown below. Include the appropriate algebraic sign of ΔH° with your answer.

2 NO(g) → N2(g) + O2(g)     ΔH° = ___________ kJ/molrxn`,
    answer: `(a) ½ N2(g) + ½ O2(g) → NO(g)     ΔHf° = 90.3 kJ/mol

(This equation forms exactly 1 mole of NO(g) from its constituent elements, N2 and O2, each in their standard states as diatomic gases, using fractional coefficients as needed.)

(b) The given reaction, 2 NO(g) → N2(g) + O2(g), is the reverse of forming 2 moles of NO from its elements. Since forming 1 mole of NO releases/absorbs 90.3 kJ/mol (ΔHf° = +90.3 kJ/mol, meaning NO is higher in energy than its elements), forming 2 moles of NO would have ΔHrxn = 2(90.3) = 180.6 kJ/molrxn. Reversing the equation (decomposing 2 NO back into N2 and O2) reverses the sign: ΔH° = -180.6 kJ/molrxn.`,
  },
  {
    title: 'Q8 — Enthalpy of Condensation for Water',
    content: `Substance | Standard Enthalpy of Formation (kJ/mol)
H2O(l) | -285.8
H2O(g) | -241.8

(a) How much energy is associated with the process of 36.032 g H2O changing from gas to a liquid under standard conditions?
(b) Does the answer in part (a) represent heat that flows from the surroundings to the sample of H2O, or heat that flows from the sample of H2O to the surroundings?`,
    answer: `(a) The process is H2O(g) → H2O(l). ΔHrxn = ΔHf°(products) - ΔHf°(reactants) = (-285.8) - (-241.8) = -44.0 kJ/mol.

Moles of H2O = 36.032 g / 18.02 g/mol = 2.000 mol.

Total energy = 2.000 mol x (-44.0 kJ/mol) = -88.0 kJ. The magnitude of energy associated with this process is 88.0 kJ.

(b) Since ΔH is negative, this process is exothermic, so this represents heat that flows from the sample of H2O (the system) to the surroundings. (This makes sense: condensation, gas → liquid, forms new attractive forces between water molecules, which releases energy.)`,
  },
  {
    title: 'Q9 — Standard Enthalpy of Formation for an Element in Its Standard State',
    content: `The standard enthalpy of formation (ΔHf°) for an element in its standard state is equal to ___________.`,
    answer: `Zero (0 kJ/mol). By definition, the standard enthalpy of formation represents the enthalpy change for forming 1 mole of a substance from its constituent elements in their standard states. Since an element in its own standard state is already in its "starting" form, there is no chemical change (and thus no enthalpy change) associated with "forming" it from itself — so ΔHf° = 0 for any element in its standard state (e.g., ΔHf° for O2(g), N2(g), or graphite C(s) is 0).`,
  },
  {
    title: 'Q10 — Calculating ΔHrxn° from Standard Enthalpies of Formation',
    content: `Substance | Standard Enthalpy of Formation (kJ/mol)
N2H4(g) | 95.4
N2O4(g) | 9.2
H2O(g) | -241.8

Using the table of standard enthalpies of formation above, calculate the value of ΔHrxn° for the equation shown below. Include the appropriate algebraic sign of ΔHrxn° and the correct units with your answer.

2 N2H4(g) + N2O4(g) → 3 N2(g) + 4 H2O(g)`,
    answer: `ΔHrxn° = Σ ΔHf°(products) - Σ ΔHf°(reactants)

Products: 3 N2(g) [ΔHf° = 0, since N2 is an element in its standard state] + 4 H2O(g) [ΔHf° = -241.8 kJ/mol each] = 3(0) + 4(-241.8) = -967.2 kJ.

Reactants: 2 N2H4(g) [ΔHf° = 95.4 kJ/mol each] + 1 N2O4(g) [ΔHf° = 9.2 kJ/mol] = 2(95.4) + 9.2 = 190.8 + 9.2 = 200.0 kJ.

ΔHrxn° = -967.2 kJ - 200.0 kJ = -1167.2 kJ/molrxn.`,
  },
  {
    title: 'Q11 — Determining the Standard Enthalpy of Formation of Octane',
    content: `Substance | Standard Enthalpy of Formation, ΔHf° (kJ/mol)
C8H18(l) | ?
CO2(g) | -393.5
H2O(g) | -241.8

2 C8H18(l) + 25 O2(g) → 16 CO2(g) + 18 H2O(g)     ΔHrxn° = -10,150 kJ/molrxn

Use the information above to calculate standard enthalpy of formation, ΔHf°, for C8H18(l). Include the appropriate algebraic sign of ΔHf° and the correct units with your answer.`,
    answer: `ΔHrxn° = Σ ΔHf°(products) - Σ ΔHf°(reactants)

-10,150 = [16(-393.5) + 18(-241.8)] - [2(ΔHf° of C8H18) + 25(0)]

-10,150 = [-6296 + (-4352.4)] - 2(ΔHf° of C8H18)

-10,150 = -10,648.4 - 2(ΔHf° of C8H18)

2(ΔHf° of C8H18) = -10,648.4 - (-10,150) = -498.4

ΔHf° of C8H18 = -249.2 kJ/mol.`,
  },
];

/* ============================= 6.9 — Hess's Law ============================= */
const t69 = [
  {
    title: "Q12 — Applying Hess's Law to Form Methanol from CO and H2",
    content: `Equation #1: C(s) + ½ O2(g) → CO(g)     ΔHrxn = -110.5 kJ/molrxn
Equation #2: 2 C(s) + 4 H2(g) + O2(g) → 2 CH3OH(g)     ΔHrxn = -401.4 kJ/molrxn

Equations #1 and #2 shown above can be modified in a certain way so that, when the modified versions of each equation are added together, the following equation will be formed as a result.

CO(g) + 2 H2(g) → CH3OH(g)     ΔHrxn = ?

(a) How should equation #1 be modified?
(b) How should equation #2 be modified?
(c) Based on your answers to parts (a) and (b), write the modified versions of Equations #1 and #2. Show the modified values of ΔHrxn next to each equation, and show how the equations can be added together to produce the equation shown above.
(d) Based on your answer to part (c), determine the value of ΔHrxn for the overall reaction.`,
    answer: `(a) Equation #1 should be reversed, so that CO(g) appears as a reactant (as it does in the target equation) instead of a product: CO(g) → C(s) + ½ O2(g), with ΔHrxn = +110.5 kJ/molrxn (the sign is reversed because the equation is reversed).

(b) Equation #2 should be divided by 2 (multiplied by ½), so that it produces only 1 mole of CH3OH(g) (matching the target equation) instead of 2 moles: C(s) + 2 H2(g) + ½ O2(g) → CH3OH(g), with ΔHrxn = -401.4/2 = -200.7 kJ/molrxn (dividing the equation by 2 also divides ΔHrxn by 2).

(c) Modified Equation #1 (reversed): CO(g) → C(s) + ½ O2(g)     ΔHrxn = +110.5 kJ/molrxn
Modified Equation #2 (divided by 2): C(s) + 2 H2(g) + ½ O2(g) → CH3OH(g)     ΔHrxn = -200.7 kJ/molrxn

Adding these two modified equations together: CO(g) + C(s) + 2 H2(g) + ½ O2(g) → C(s) + ½ O2(g) + CH3OH(g). The C(s) and ½ O2(g) terms cancel from both sides (they appear as a product in the first and a reactant in the second, in equal amounts), leaving: CO(g) + 2 H2(g) → CH3OH(g), which matches the target equation.

(d) ΔHrxn (overall) = (+110.5 kJ/molrxn) + (-200.7 kJ/molrxn) = -90.2 kJ/molrxn.`,
  },
  {
    title: 'Q13 — Endothermic or Exothermic Electron Transfer Between Al and Mg+ (Using Ionization Energy Data)',
    imageKey: 'ionization',
    content: `The first ionization energy of an element is the energy required to remove an electron from a gaseous atom of the element, as shown in the general equation below.

X(g) → X+(g) + e-

The values of the first ionization energies for the elements located in Period 3 are plotted on the graph: Na ≈ 500 kJ/mol, Mg ≈ 740 kJ/mol, Al ≈ 580 kJ/mol, Si ≈ 790 kJ/mol, P ≈ 1010 kJ/mol, S ≈ 1000 kJ/mol, Cl ≈ 1250 kJ/mol, Ar ≈ 1520 kJ/mol.

On the basis of this information, do you predict that the equation shown below should be classified as endothermic or exothermic? Justify your answer.

Al(g) + Mg+(g) → Al+(g) + Mg(g)`,
    answer: `This reaction is exothermic.

This reaction can be thought of as the sum of two processes: (1) removing an electron from Al (Al → Al+ + e-), which requires energy equal to Al's first ionization energy (+580 kJ/mol), and (2) Mg+ gaining that electron back to form Mg (Mg+ + e- → Mg), which releases energy equal in magnitude to Mg's first ionization energy (-740 kJ/mol, the reverse of ionizing Mg).

Overall: ΔH ≈ (+580 kJ/mol) + (-740 kJ/mol) = -160 kJ/mol.

Since Mg has a higher first ionization energy (≈740 kJ/mol) than Al (≈580 kJ/mol), this means Mg+ holds onto (attracts) an electron more strongly than Al does — so more energy is released when Mg+ gains the electron than is required to remove the electron from Al in the first place. This makes the overall electron-transfer process exothermic (net release of energy), consistent with a negative ΔH.`,
  },
  {
    title: "Q14 — Applying Hess's Law with Three Equations",
    content: `Equation #1: H2(g) + F2(g) → 2 HF(g)     ΔHrxn = -546.6 kJ/molrxn
Equation #2: C(s) + 2 F2(g) → CF4(g)     ΔHrxn = -930.0 kJ/molrxn
Equation #3: 2 C(s) + 2 H2(g) → C2H4(g)     ΔHrxn = +52.4 kJ/molrxn

Equations #1, #2, and #3 shown above can be modified in a certain way so that, when the modified versions of each equation are added together, the following equation will be formed as a result.

C2H4(g) + 6 F2(g) → 2 CF4(g) + 4 HF(g)     ΔHrxn = ?

(a) How should equation #1 be modified?
(b) How should equation #2 be modified?
(c) How should equation #3 be modified?
(d) Based on your answers to parts (a), (b), and (c), write the modified versions of Equations #1-#3 in the space below. Show the modified values of ΔHrxn next to each equation, and show how the equations can be added together to produce the equation shown above.
(e) Based on your answer to part (d), determine the value of ΔHrxn for the overall reaction.`,
    answer: `(a) Equation #1 should be multiplied by 2, so that it produces 4 HF(g) (matching the target equation) instead of 2 HF(g): 2 H2(g) + 2 F2(g) → 4 HF(g), with ΔHrxn = 2(-546.6) = -1093.2 kJ/molrxn.

(b) Equation #2 should be multiplied by 2, so that it produces 2 CF4(g) (matching the target equation) instead of 1 CF4(g): 2 C(s) + 4 F2(g) → 2 CF4(g), with ΔHrxn = 2(-930.0) = -1860.0 kJ/molrxn.

(c) Equation #3 should be reversed, so that C2H4(g) appears as a reactant (as it does in the target equation) instead of a product: C2H4(g) → 2 C(s) + 2 H2(g), with ΔHrxn = -52.4 kJ/molrxn (the sign is reversed because the equation is reversed).

(d) Modified Equation #1 (x2): 2 H2(g) + 2 F2(g) → 4 HF(g)     ΔHrxn = -1093.2 kJ/molrxn
Modified Equation #2 (x2): 2 C(s) + 4 F2(g) → 2 CF4(g)     ΔHrxn = -1860.0 kJ/molrxn
Modified Equation #3 (reversed): C2H4(g) → 2 C(s) + 2 H2(g)     ΔHrxn = -52.4 kJ/molrxn

Adding these three modified equations together: 2 H2(g) + 2 F2(g) + 2 C(s) + 4 F2(g) + C2H4(g) → 4 HF(g) + 2 CF4(g) + 2 C(s) + 2 H2(g). The 2 H2(g) and 2 C(s) terms cancel (appearing as both reactant and product in equal amounts), and 2 F2(g) + 4 F2(g) = 6 F2(g), leaving: C2H4(g) + 6 F2(g) → 2 CF4(g) + 4 HF(g), which matches the target equation.

(e) ΔHrxn (overall) = (-1093.2) + (-1860.0) + (-52.4) = -3005.6 kJ/molrxn.`,
  },
];

async function insertTopic(topicKey, questions) {
  const topicId = TOPICS[topicKey];
  const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId);
  const startIdx = existing && existing.length > 0 ? Math.max(...existing.map(q => q.order_index)) + 1 : 0;

  const rows = questions.map((q, idx) => ({
    topic_id: topicId,
    title: q.title,
    content: q.content,
    answer_key: q.answer,
    order_index: startIdx + idx,
    source: 'Topic Worksheet',
    ...(q.resolvedImageUrl ? { image_url: q.resolvedImageUrl } : {}),
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    console.log('Uploading images...');
    const imgMap = {};
    imgMap['calorimetry'] = await uploadImage('q2_69_crop.png', 'redox-calorimetry-temp-graph.png');
    imgMap['ionization'] = await uploadImage('q13_69_crop.png', 'period3-ionization-energy-graph.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t66) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t69) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('6.6', t66);
    await insertTopic('6.7', t67);
    await insertTopic('6.8', t68);
    await insertTopic('6.9', t69);
    console.log('Done — Unit 6 Topics 6.6-6.9 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
