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
  '3.1': '231d684c-389b-4a5d-ab34-8e6ab03f7298',
  '3.2': 'b30eb473-ac46-4f0f-a187-6607b9915d47',
  '3.3': '15f040cd-9585-437e-b63d-47abb13e2979',
  '3.4': '3caa461f-7678-4754-8c14-25657a8eea30',
  '3.5': 'a4157f22-b9cd-4ac6-b886-040a8e505372',
  '3.6': 'e354fd0b-663d-473a-834b-14038b93dd6d',
  '3.7': 'ba1b5331-20ad-41f6-977e-9b44d41c8874',
  '3.8': '76e96e76-219d-411d-b3fa-2cc8bdcd02d5',
  '3.9': '20aae461-9149-4817-ba40-fcaed2d474a1',
  '3.10': '86646ce4-d71a-4a65-8d75-d3394d274479',
  '3.11': '25cb3403-4eab-4ee1-ae0b-e1f5e89f237a',
  '3.12': '776ad9bf-86ac-438f-8e69-61dc508c1443',
  '3.13': '3221f729-653c-4625-88c9-263ecec18c4e',
};

/* ============================= 3.1 ============================= */
const t31 = [
  {
    title: 'Q50 — Pentane vs. Octane Vapor Pressure',
    content: `Pentane (C5H12) and octane (C8H18) are both nonpolar hydrocarbons.
(a) Identify the intermolecular force(s) present in each.
(b) Predict which substance has the higher vapor pressure, and justify your claim.`,
    answer: `(a) Both molecules are nonpolar hydrocarbons made only of C-H and C-C bonds (negligible electronegativity difference), so both experience only London dispersion forces.

(b) Pentane has the higher vapor pressure. Pentane has fewer electrons and a smaller electron cloud than octane, making it less polarizable and giving it weaker London dispersion forces. Weaker intermolecular forces mean pentane molecules escape into the vapor phase more readily at a given temperature, giving pentane the higher vapor pressure (and correspondingly the lower boiling point) of the two.`,
  },
  {
    title: 'Q51 — HF vs. F2 Boiling Point',
    content: `The boiling point of HF is 20°C (293 K), while the boiling point of F2 is -188°C (85 K).
(a) Determine the type(s) of intermolecular forces present in HF and in F2.
(b) Explain the difference in boiling points based on these intermolecular forces.`,
    answer: `(a) HF: the H is bonded directly to F, a highly electronegative atom, so HF molecules experience hydrogen bonding, in addition to dipole-dipole attractions and London dispersion forces. F2: a nonpolar, symmetric diatomic molecule, so F2 only experiences London dispersion forces.

(b) Hydrogen bonding is a much stronger intermolecular attraction than the London dispersion forces present in F2. Even though F2 has more electrons than HF and therefore somewhat stronger dispersion forces on their own, the hydrogen bonds between HF molecules require considerably more energy to break. This is why HF has a dramatically higher boiling point than F2, despite HF being the smaller, lighter molecule.`,
  },
  {
    title: 'Q52 — He vs. Ne Boiling Point (Multiple Choice)',
    mcq: true,
    content: `Which of the following correctly identifies which noble gas, He or Ne, has the lower boiling point, and why?

(A) He has the lower boiling point because it has fewer electrons and is therefore less polarizable, giving it weaker London dispersion forces.
(B) Ne has the lower boiling point because it has more electrons and is therefore more polarizable, giving it weaker London dispersion forces.
(C) He and Ne have identical boiling points because both are noble gases with only London dispersion forces.
(D) He has the lower boiling point because it is more electronegative than Ne.`,
    answer: `Correct answer: (A)

Both He and Ne are nonpolar monatomic noble gases, so both experience only London dispersion forces. He has only 2 electrons, while Ne has 10; He's much smaller electron cloud is far less polarizable than Ne's. Weaker polarizability means weaker London dispersion forces, so less energy is required to separate He atoms into the gas phase, giving He the lower boiling point (-269°C, compared to Ne's -246°C).

(B) has the reasoning backwards — more electrons and greater polarizability lead to stronger, not weaker, dispersion forces.
(C) is incorrect because more electrons does affect the strength of dispersion forces, so the two gases do not have identical boiling points.
(D) is incorrect; electronegativity is not relevant to nonpolar, monatomic species, and does not explain a difference in dispersion forces.`,
  },
  {
    title: 'Q53 — Ranking Five Substances by Increasing Boiling Point',
    content: `Place the following substances in order of increasing boiling point, and justify the order using intermolecular forces:
C3H8 (propane), He, CH3OH (methanol), HOCH2CH2OH (ethylene glycol), HCl`,
    answer: `Increasing boiling point: He < HCl < C3H8 < CH3OH < HOCH2CH2OH

He (bp -269°C) is a monatomic noble gas with only very weak London dispersion forces (few electrons), giving it the lowest boiling point of the group. HCl (bp -85°C) is polar and has dipole-dipole attractions (in addition to LDF) but cannot hydrogen bond (Cl is not N, O, or F), and it is a small molecule, so its boiling point is still quite low, though higher than He's. C3H8 (bp -42°C) is nonpolar but has more electrons than HCl, giving it somewhat stronger London dispersion forces that outweigh HCl's weak dipole-dipole attraction in this case, placing it above HCl. CH3OH (bp 65°C) can hydrogen bond through its single -OH group, giving it a much higher boiling point than any of the previous three. HOCH2CH2OH (bp 197°C) has two -OH groups instead of one, allowing each molecule to form more hydrogen bonds with its neighbors than methanol can, giving it by far the highest boiling point of the group.`,
  },
  {
    title: 'Q54 — Explaining Why Water\'s Heat of Vaporization Is Much Greater Than Its Heat of Fusion',
    content: `For water, the heat of fusion (energy needed to melt ice at its melting point) is 6.01 kJ/mol, while the heat of vaporization (energy needed to vaporize liquid water at its boiling point) is 40.7 kJ/mol — nearly seven times larger.

Use the relative particle spacing in the solid, liquid, and gas states, together with the concept of intermolecular forces, to explain this large difference in energy requirements.`,
    answer: `In the solid (ice) and liquid states, water molecules remain in close contact with one another; melting only rearranges the molecules from a fixed, ordered lattice into a disordered but still closely-packed liquid, so only some of the hydrogen bonds holding the molecules in place need to be disrupted (many hydrogen bonds re-form immediately as the molecules continue to interact with close neighbors in the liquid). Vaporization, however, requires separating molecules completely from all of their neighbors so that they can fly apart into the gas phase, meaning essentially all of the hydrogen bonds (and other intermolecular attractions) between a given molecule and its surroundings must be overcome, not just rearranged. Because vaporization requires breaking far more of the total intermolecular attraction than melting does, it takes much more energy — consistent with water's heat of vaporization being nearly seven times larger than its heat of fusion.`,
  },
];

/* ============================= 3.2 ============================= */
const t32 = [
  {
    title: 'Q32 — Matching Descriptions to the Four Types of Solids',
    content: `Match each description below to the correct type of solid: metallic, molecular, ionic, or covalent network.

(a) Metal atoms with loosely held valence electrons form a lattice of nuclei held together by a sea of delocalized electrons.
(b) Nonmetal atoms form molecules with covalent bonds; the separate molecules are held together in the solid by intermolecular forces.
(c) Metal and nonmetal atoms form a lattice of alternating positive and negative ions held together by electrostatic attraction.
(d) Nonmetal atoms form a continuous lattice structure held together entirely by covalent bonds.`,
    answer: `(a) Metallic solid
(b) Molecular solid
(c) Ionic solid
(d) Covalent network solid`,
  },
  {
    title: 'Q33 — Bonds Broken and Particles Present Upon Melting for Each Solid Type',
    content: `For each type of solid below, identify (i) the type of bond or force that must be broken/overcome upon melting, and (ii) the type of individual particle present in the resulting liquid.

(a) Ionic solid
(b) Covalent network solid
(c) Molecular solid
(d) Metallic solid`,
    answer: `(a) Ionic solid: ionic bonds (Coulombic/electrostatic attraction between cations and anions) are overcome upon melting; the resulting liquid consists of mobile ions.
(b) Covalent network solid: covalent bonds throughout the network must be broken upon melting; the resulting liquid consists of atoms (since the "molecule" was the entire covalent network).
(c) Molecular solid: intermolecular forces (London dispersion, dipole-dipole, and/or hydrogen bonding, depending on the substance) are overcome upon melting, while the covalent bonds within each molecule remain intact; the resulting liquid consists of intact molecules.
(d) Metallic solid: metallic bonds (the attraction between metal cations and the delocalized sea of valence electrons) are loosened upon melting; the resulting liquid consists of metal atoms/cations still surrounded by mobile electrons.`,
  },
  {
    title: 'Q34 — Relationship Between Attractive Force Strength and Melting Point',
    content: `If a particular solid has very strong attractive forces holding its particles together, would you expect its melting point to be relatively high or relatively low? Explain your reasoning.`,
    answer: `A solid with very strong attractive forces between its particles would be expected to have a relatively high melting point. Melting requires supplying enough thermal energy to overcome the attractive forces holding the particles of the solid together (or, in the case of covalent network and ionic solids, to break/disrupt the bonds holding the lattice together) so that the particles can move more freely past one another as a liquid. The stronger these attractive forces are, the more energy — and therefore the higher the temperature — is required to overcome them, resulting in a higher melting point.`,
  },
  {
    title: 'Q35 — Why Covalent Network Solids Melt at Much Higher Temperatures Than Molecular Solids',
    content: `Explain, in general terms, why covalent network solids melt at much higher temperatures than molecular solids.`,
    answer: `In a molecular solid, melting only requires overcoming the relatively weak intermolecular forces (London dispersion, dipole-dipole, and/or hydrogen bonding) between separate, intact molecules — the strong covalent bonds within each individual molecule are not broken. In a covalent network solid, however, there are no separate molecules to begin with; the entire solid is held together as one giant, continuously covalently-bonded network. Melting a covalent network solid therefore requires breaking many strong covalent bonds throughout the lattice, not just overcoming weak intermolecular attractions. Because covalent bonds require far more energy to break than intermolecular forces, covalent network solids have dramatically higher melting points than molecular solids.`,
  },
  {
    title: 'Q36 — Classifying Eight Substances by Solid Type',
    content: `Identify the type of solid (ionic, molecular, covalent network, or metallic) formed by each of the following substances:
(a) CH4
(b) I2
(c) Graphite
(d) KCl
(e) C6H12O6 (glucose)
(f) CaBr2
(g) SiC
(h) Au`,
    answer: `(a) CH4: molecular solid (nonpolar covalent molecule, held together by London dispersion forces)
(b) I2: molecular solid (nonpolar covalent diatomic molecule, held together by London dispersion forces)
(c) Graphite: covalent network solid (carbon atoms form covalently bonded 2-D layers)
(d) KCl: ionic solid (metal cation K+ and nonmetal anion Cl-)
(e) C6H12O6: molecular solid (a covalently-bonded polar molecule containing several -OH groups, held together in the solid by hydrogen bonding and other intermolecular forces)
(f) CaBr2: ionic solid (metal cation Ca2+ and nonmetal anion Br-)
(g) SiC: covalent network solid (silicon and carbon, both nonmetals, form a continuous covalent lattice)
(h) Au: metallic solid (a pure metal held together by metallic bonding)`,
  },
];

/* ============================= 3.3 ============================= */
const t33 = [
  {
    title: 'Q15 — Why Liquids Cannot Be Easily Compressed (Multiple Choice)',
    mcq: true,
    content: `Of the following, the best explanation for the fact that most liquids cannot be easily compressed is that the molecules in a liquid:
(A) are in constant motion
(B) are relatively close together
(C) have varying densities
(D) have a fixed volume
(E) move slower as temperature decreases`,
    answer: `Correct answer: (B)

The particles in a liquid remain in close contact with one another (similar spacing to a solid), leaving very little empty space between them. Because there is minimal empty space available for the particles to be pushed into, liquids strongly resist compression. Choices (A), (C), (D), and (E) describe true features of liquids in various contexts, but none of them is the direct reason liquids resist compression — that reason is specifically the close spacing of the particles.`,
  },
  {
    title: 'Q16 — Particle-Level Description of an Evaporating Water Puddle',
    content: `Describe, at the particle level, what a diagram of a puddle of liquid water would show as it begins to evaporate into the surrounding air.`,
    answer: `The diagram would show two distinct regions: a liquid region (the puddle itself), where water molecules are packed closely together, in continuous contact with their neighbors, sliding and tumbling past one another but unable to easily separate; and a gas region above the puddle, where a smaller number of water molecules are spaced far apart from one another and from the liquid surface, moving rapidly and randomly through the mostly empty space above the puddle. Only the water molecules at the liquid's surface that happen to gain enough kinetic energy to overcome the intermolecular (hydrogen-bonding) attraction of their neighbors are able to escape into the gas phase, so the gas-phase molecules shown would be relatively few in number compared to the tightly-packed liquid molecules, especially early in the evaporation process.`,
  },
  {
    title: 'Q17 — Particle-Level Description of Sand Mixed with Water',
    content: `Sand is primarily composed of silicon dioxide, SiO2, a covalent network solid.

(a) Describe a particle-level diagram of solid sand alone.
(b) Describe a particle-level diagram of sand mixed with liquid water, making sure to represent the different states of each substance.`,
    answer: `(a) Solid sand would be represented as many SiO2 formula units arranged in a rigid, closely-packed, repeating (or amorphous, depending on the form of silica) three-dimensional network, with no empty space for the particles to move — the particles do not translate, they can only vibrate in place, consistent with a covalent network solid.

(b) Sand mixed with water would show two distinct, separate regions rather than a true solution: a solid region where the SiO2 particles remain locked in their tightly-packed, rigid network (since sand does not dissolve in water — SiO2's covalent network is far too strongly bonded, and water cannot form strong enough interactions to pull individual SiO2 units apart), and a surrounding liquid region where H2O molecules are packed closely together but free to slide past one another. The sand particles would settle as a distinct solid phase, with the mobile liquid water phase surrounding and filling in around the solid grains, rather than the sand becoming evenly distributed at the particle level throughout the water (which is what would happen if sand were soluble).`,
  },
  {
    title: 'Q18 — Why Gases Generally Follow the Ideal Gas Law (Multiple Choice)',
    mcq: true,
    content: `Which of the following is the best explanation for why gases generally follow the ideal gas law reasonably well under typical conditions?

(A) All gases have the same spacing of particles.
(B) All gases have the same volume.
(C) Gas particles are spaced far apart with minimal intermolecular forces between them.
(D) Gas particles do not have intermolecular forces at all, under any conditions.`,
    answer: `Correct answer: (C)

The ideal gas law's core assumptions are that gas particles occupy negligible volume compared to the container and that gas particles do not meaningfully interact with one another. Under typical conditions (moderate pressure and temperature), real gas particles are spaced far enough apart on average that both the particles' actual volume and the (weak, but nonzero) intermolecular forces between them have only a small effect on the gas's overall behavior, so real gases approximate ideal behavior reasonably well.

(A) and (B) are false — different gases and different amounts/conditions of the same gas do not all have identical particle spacing or volume.
(D) is too strong a claim: real gas particles do experience some intermolecular forces (which is exactly what causes deviations from ideal behavior under extreme conditions); the ideal gas law is only an approximation that works well when those forces are negligible, not because they are completely absent.`,
  },
];

/* ============================= 3.4 ============================= */
const t34 = [
  {
    title: 'Q30 — Mass of CaCO3 Decomposed to Produce a Given Pressure of CO2',
    content: `When heated strongly, solid calcium carbonate decomposes to produce solid calcium oxide and carbon dioxide gas:
CaCO3(s) → CaO(s) + CO2(g)

A sample of CaCO3(s) is placed in a rigid 35.0 L reaction vessel from which all the air has been evacuated. The vessel is heated to 437°C, at which point the pressure of CO2(g) in the vessel is constant at 1.00 atm.

Calculate the mass, in grams, of CaCO3(s) that reacted to produce this carbon dioxide gas.`,
    answer: `T = 437°C + 273.15 = 710.15 K

n(CO2) = PV / RT = (1.00 atm)(35.0 L) / [(0.08206 L atm mol^-1 K^-1)(710.15 K)] = 35.0 / 58.28 = 0.6006 mol CO2

Since the mole ratio of CaCO3 to CO2 is 1:1, moles of CaCO3 reacted = 0.6006 mol

Molar mass of CaCO3 = 40.08 + 12.01 + 3(16.00) = 100.09 g/mol

mass = 0.6006 mol x 100.09 g/mol = 60.1 g CaCO3`,
  },
  {
    title: 'Q31 — Partial Pressure of H2 in a Three-Gas Mixture',
    content: `A gas mixture at 20.0°C and 2.0 atm total pressure contains 0.40 mol of H2, 0.15 mol of O2, and 0.50 mol of N2. Assuming ideal behavior, what is the partial pressure of hydrogen gas (H2) in the mixture?`,
    answer: `Total moles = 0.40 + 0.15 + 0.50 = 1.05 mol

Mole fraction of H2 = 0.40 mol / 1.05 mol = 0.381

Partial pressure of H2 = (mole fraction H2)(total pressure) = (0.381)(2.0 atm) = 0.76 atm`,
  },
  {
    title: 'Q32 — Volume of O2 Needed to Produce a Given Volume of NO2 at STP',
    content: `Given the reaction: 2 NO(g) + O2(g) → 2 NO2(g)

How many liters of gaseous O2 (measured at STP) are needed to produce 6.50 L of gaseous NO2, if both gases are measured at STP?`,
    answer: `At STP, 1 mole of any ideal gas occupies 22.4 L, so volume ratios directly reflect mole ratios for gases measured at the same STP conditions.

Using the 1:2 mole ratio of O2 to NO2 from the balanced equation:

V(O2) = 6.50 L NO2 x [[frac:1 mol O2|2 mol NO2]] = 3.25 L O2`,
  },
  {
    title: 'Q33 — Final Pressure After Opening a Valve Between Two Filled Gas Containers',
    content: `A rigid container of N2 gas at 2.00 atm and 2.00 L is connected by a closed valve to a rigid container of O2 gas at 4.00 atm and 3.00 L. The two gases do not react with each other, and temperature remains constant throughout.

What is the final total pressure in the system after the valve is opened and the gases are allowed to mix?`,
    answer: `When the valve opens, each gas expands to fill the combined total volume: V(total) = 2.00 L + 3.00 L = 5.00 L

Using P1V1 = P2V2 for each gas separately (constant temperature):

Final partial pressure of N2: P(N2) = (2.00 atm)(2.00 L) / 5.00 L = 0.800 atm

Final partial pressure of O2: P(O2) = (4.00 atm)(3.00 L) / 5.00 L = 2.40 atm

Total final pressure = P(N2) + P(O2) = 0.800 atm + 2.40 atm = 3.20 atm`,
  },
];

/* ============================= 3.5 ============================= */
const t35 = [
  {
    title: 'Q24 — Predicting Where a Precipitate Ring Forms Between HBr and NH3',
    content: `Two cotton balls are placed at opposite ends of a long glass tube at room temperature: one soaked in concentrated HBr(aq) (releasing HBr gas, molar mass 80.91 g/mol) and the other soaked in concentrated NH3(aq) (releasing NH3 gas, molar mass 17.03 g/mol). The two gases diffuse toward each other through the tube and react to form a white/yellow solid precipitate ring of NH4Br where they meet.

Predict whether the precipitate ring will form closer to the HBr end, closer to the NH3 end, or exactly in the middle of the tube, and justify your answer using kinetic molecular theory.`,
    answer: `The ring will form closer to the HBr end of the tube.

At the same temperature, both gases have the same average kinetic energy, but NH3 (molar mass 17.03 g/mol) is much lighter than HBr (molar mass 80.91 g/mol). Since KE = (1/2)mv^2, the lighter NH3 molecules must travel at a much higher average speed than the heavier HBr molecules to have the same average kinetic energy. Because NH3 diffuses faster and therefore travels farther down the tube in the same amount of time than the slower-moving HBr, the two gases meet closer to the HBr end (the end from which the slower-diffusing gas started), forming the NH4Br precipitate ring there.`,
  },
  {
    title: 'Q25 — Kinetic Molecular Theory Explanation for NO Gas Heated in a Rigid Container',
    content: `A rigid, sealed container holds a sample of NO(g) at 200. K. The container is heated to 400. K.

Using kinetic molecular theory, describe what happens to each of the following as the gas is heated, and briefly explain each: the volume of the gas, the temperature, the pressure, the number of moles of gas, and the average particle speed.`,
    answer: `Volume: stays the same. The container is rigid, so its volume cannot change regardless of temperature.

Temperature: increases (from 200. K to 400. K), as stated — this is the change driving all the other effects.

Pressure: increases. By the combined/ideal gas law, at constant volume and moles, pressure is directly proportional to Kelvin temperature (P/T = constant), so doubling the temperature increases the pressure. At the particle level, the NO molecules move faster and collide with the container walls both more frequently and with greater force as temperature increases, both of which increase the measured pressure.

Moles: stays the same. No gas is added or removed, and no reaction occurs, so the amount of NO gas present does not change.

Average particle speed: increases. Average kinetic energy is directly proportional to Kelvin temperature; since kinetic energy depends on speed (KE = (1/2)mv^2) and the mass of NO molecules does not change, an increase in average kinetic energy must correspond to an increase in the average particle speed.`,
  },
];

/* ============================= 3.6 ============================= */
const t36 = [
  {
    title: 'Q21 — Explaining a Gas Volume That Is Larger or Smaller Than the Ideal Gas Law Predicts',
    content: `(a) If the actual (measured) volume of a real gas sample is found to be larger than the volume predicted by the ideal gas law under the same conditions, propose the best explanation for this observation.
(b) If the actual (measured) volume of a real gas sample is found to be smaller than the volume predicted by the ideal gas law under the same conditions, propose the best explanation for this observation.`,
    answer: `(a) A larger-than-predicted volume suggests that the finite volume actually occupied by the gas particles themselves has become significant (this typically occurs at high pressure, where particles are pushed close together). The ideal gas law assumes the particles themselves take up zero volume, but real particles do occupy some space; accounting for that extra particle volume means the gas effectively needs more total container volume than the ideal gas law (which imagines only empty space) would predict.

(b) A smaller-than-predicted volume suggests that intermolecular attractive forces between the gas particles have become significant (this typically occurs at low temperature, where particles move slowly enough for attractions to matter). These attractions pull the gas particles closer together than the ideal gas law assumes (which assumes zero attraction between particles), causing the gas to occupy less volume than predicted.`,
  },
];

/* ============================= 3.7 ============================= */
const t37 = [
  {
    title: 'Q26 — Volume of LiF Solution from a Given Mass and Molarity',
    content: `What volume of 0.25 M lithium fluoride solution can be made by dissolving 5.0 g of lithium fluoride, LiF?`,
    answer: `Molar mass of LiF = 6.94 + 19.00 = 25.94 g/mol

moles LiF = 5.0 g / 25.94 g/mol = 0.1928 mol

Volume = moles / molarity = 0.1928 mol / 0.25 mol/L = 0.771 L`,
  },
  {
    title: 'Q27 — Mass of NaOH Needed for a Given Volume and Molarity',
    content: `What mass of sodium hydroxide, NaOH, would be required to make 1.0 L of a 0.75 M solution of NaOH?`,
    answer: `moles NaOH = (1.0 L)(0.75 mol/L) = 0.75 mol

Molar mass of NaOH = 22.99 + 16.00 + 1.01 = 40.00 g/mol

mass = 0.75 mol x 40.00 g/mol = 30. g NaOH`,
  },
  {
    title: 'Q28 — Calcium and Chloride Ion Concentration in 1.5 M CaCl2',
    content: `What is the calcium ion concentration, [Ca2+], in a 1.5 M calcium chloride, CaCl2, solution? What is the chloride ion concentration, [Cl-]?`,
    answer: `CaCl2(s) → Ca2+(aq) + 2 Cl-(aq)

Since there is a 1:1 ratio of CaCl2 to Ca2+: [Ca2+] = 1.5 M

Since there is a 1:2 ratio of CaCl2 to Cl-: [Cl-] = 1.5 M x [[frac:2 mol Cl-|1 mol CaCl2]] = 3.0 M`,
  },
];

/* ============================= 3.8 ============================= */
const t38 = [
  {
    title: 'Q10 — Predicting the Better Solvent (Hexane or Water) for Ethanol and for KCl',
    content: `For each of the following solutes, determine whether hexane (C6H14, nonpolar) or water (H2O, polar) would be the more effective solvent. Identify the dominant type of intermolecular force present between the solute and the more effective solvent.

(a) Ethanol, C2H5OH
(b) Potassium chloride, KCl`,
    answer: `(a) Ethanol is part hydrocarbon (nonpolar, the C2H5- portion) and part polar (the -OH hydroxyl group). Since the polar -OH group dominates ethanol's behavior despite the nonpolar hydrocarbon tail, ethanol can form hydrogen bonds with water. Water is therefore the more effective solvent for ethanol, with hydrogen bonding as the dominant intermolecular force between ethanol and water molecules.

(b) KCl is an ionic compound. The strong, full charges on K+ and Cl- attract strongly to the partial charges on polar water molecules, forming ion-dipole interactions strong enough to pull the ions out of the ionic lattice. Water is therefore the more effective solvent for KCl, with ion-dipole attraction as the dominant intermolecular force between the K+/Cl- ions and water molecules. Hexane, being nonpolar, cannot form strong enough interactions with the fully-charged ions to dissolve KCl.`,
  },
  {
    title: 'Q11 — Matching Five Functional Groups to the IMF They Form With Water',
    content: `For each of the following classes of organic molecules, identify whether it would form hydrogen bonds with water, dipole-dipole attractions with water, or only London dispersion forces with water:

(a) Alkane (e.g., propane, H3C-CH2-CH3, no polar functional group)
(b) Alcohol (e.g., contains an -OH group)
(c) Ether (e.g., contains a C-O-C linkage, no O-H bond)
(d) Amine (e.g., contains an -NH2 group)
(e) Ketone (e.g., contains a C=O group with no O-H or N-H bond)`,
    answer: `(a) Alkane: London dispersion forces only. Alkanes are nonpolar hydrocarbons with no polar functional group, so they cannot form dipole-dipole attractions or hydrogen bonds with water; they can only weakly interact with water through dispersion forces (and are correspondingly poorly soluble in water).

(b) Alcohol: Hydrogen bonding. The -OH group has a hydrogen bonded directly to the highly electronegative oxygen, allowing alcohols to hydrogen-bond with water.

(c) Ether: Dipole-dipole attraction. The C-O-C linkage is polar (oxygen is more electronegative than carbon), so ethers can form dipole-dipole attractions with water, but since there is no O-H or N-H bond in the ether itself, an ether cannot donate a hydrogen bond (it can only weakly accept one from water's O-H).

(d) Amine: Hydrogen bonding. The -NH2 group has hydrogens bonded directly to nitrogen, a qualifying atom for hydrogen bonding, allowing amines to hydrogen-bond with water.

(e) Ketone: Dipole-dipole attraction. The C=O group is polar, allowing dipole-dipole attraction with water, but since a ketone has no O-H or N-H bond of its own, it cannot donate a hydrogen bond (it can only accept one from water).`,
  },
];

/* ============================= 3.9 ============================= */
const t39 = [
  {
    title: 'Q22 — When Column Chromatography Is Preferred Over Paper Chromatography (Multiple Choice)',
    mcq: true,
    content: `Which of the following is the most appropriate reason to perform column chromatography rather than paper chromatography on a mixture?

(A) The sample is a mixture of strictly polar particles.
(B) The sample is a mixture of strictly nonpolar particles.
(C) The goal is to separate the mixture into its components and physically recover each one.
(D) The densities of the component parts of the mixture differ significantly.`,
    answer: `Correct answer: (C)

Column chromatography is specifically useful when the goal is preparative — that is, to physically separate a mixture into its individual components and collect (recover) each one separately as it elutes from the column, typically into different collection flasks. Paper chromatography, by contrast, is primarily an analytical technique used to identify or compare components (via Rf values) rather than to isolate usable quantities of each component.

(A) and (B) are incorrect because the polarity of the sample's components does not by itself determine which chromatography method is more appropriate; both paper and column chromatography rely on relative polarity differences to separate polar or nonpolar mixtures. (D) is incorrect because chromatography (paper or column) separates based on relative polarity/intermolecular interactions with the stationary and mobile phases, not density.`,
  },
  {
    title: 'Q23 — Why Rf Values, Not Raw Distances, Are Used to Identify Compounds',
    content: `Two students perform paper chromatography on the same mixture using the same solvent, but let their experiments run for different amounts of time before removing the paper. As a result, the colored spots on the two students' papers moved noticeably different absolute distances. Explain how the two students can still correctly identify the same components using their two different chromatograms.`,
    answer: `Although the absolute distance traveled by each spot differs between the two trials (because the runs were stopped at different times), the Rf value — the ratio of the distance traveled by the spot to the distance traveled by the solvent front — remains constant for a given compound in a given solvent system, regardless of how long the experiment is allowed to run (as long as the solvent front has not run off the paper). Since Rf is a ratio, both students can calculate the Rf value of each spot on their own chromatogram by dividing the spot's distance by their own solvent front's distance, and then compare their calculated Rf values (rather than the raw, uncorrected distances) to correctly and consistently identify the same components.`,
  },
  {
    title: 'Q24 — Predicting a Dye\'s Travel Distance on an Incomplete Chromatography Run (Multiple Choice)',
    mcq: true,
    content: `A complete chromatography run shows a solvent front that traveled 10.0 cm from the origin, with a particular dye traveling 8.0 cm. A second, incomplete run of the same dye and solvent system was stopped early, when the solvent front had only traveled 6.0 cm.

What distance would you predict the dye to have traveled on the incomplete run?

(A) 4.8 cm
(B) 6.0 cm
(C) 8.0 cm
(D) Cannot be determined`,
    answer: `Correct answer: (A) 4.8 cm

From the complete run, the dye's Rf value is: Rf = 8.0 cm / 10.0 cm = 0.80

Since Rf is constant for a given dye and solvent system regardless of run time, the same 0.80 ratio applies to the incomplete run: distance traveled by dye = Rf x (solvent front distance) = 0.80 x 6.0 cm = 4.8 cm

(B) and (C) incorrectly assume the dye travels the same absolute distance regardless of how far the solvent traveled, rather than scaling proportionally. (D) is incorrect because Rf provides exactly enough information to make this prediction.`,
  },
  {
    title: 'Q25 — Calculating an Rf Value from Given Distances',
    content: `On a paper chromatogram, a dye spot traveled 2.8 cm from the origin, while the solvent front traveled 3.3 cm from the origin. Calculate the Rf value of the dye.`,
    answer: `Rf = (distance traveled by the dye) / (distance traveled by the solvent) = 2.8 cm / 3.3 cm = 0.85`,
  },
  {
    title: 'Q26 — Ranking Four Compounds by Distance Traveled in Column Chromatography',
    content: `A mixture containing butanoic acid (CH3CH2CH2COOH), benzene (C6H6), methanol (CH3OH), and octane (C8H18) is separated using column chromatography with a polar stationary phase (silica gel) and a nonpolar mobile solvent.

Which of these four compounds would be expected to travel the farthest through the column, and why?`,
    answer: `Octane (C8H18) would travel the farthest.

In column chromatography with a polar stationary phase and nonpolar mobile phase, the least polar components interact most weakly with the polar stationary phase and most strongly with the nonpolar mobile phase, causing them to travel fastest and farthest through the column; the most polar components are retained most strongly by the stationary phase and travel the least. Octane is a purely nonpolar hydrocarbon, making it the least polar of the four substances (butanoic acid has a polar, hydrogen-bonding -COOH group; methanol has a polar, hydrogen-bonding -OH group; benzene, while less polar than the two hydrogen-bonding compounds, still has a modestly polarizable, planar pi-electron system). Because it is the least polar, octane interacts least with the polar silica stationary phase and is carried along fastest and farthest by the nonpolar mobile solvent.`,
  },
  {
    title: 'Q27 — Physical Property Most Responsible for Separation in Paper Chromatography (Multiple Choice)',
    mcq: true,
    content: `In paper chromatography, what physical property of the sample components is most important in determining how well (or how far) they separate?
(A) Density
(B) Polarity
(C) Size of the particle
(D) Molar mass of the particle`,
    answer: `Correct answer: (B) Polarity

Paper chromatography separates components based on the relative strength of their intermolecular interactions with the polar stationary phase (the paper/cellulose) versus the mobile phase (the solvent). Components that are more similar in polarity to the solvent travel farther, while components that are more similar in polarity to the paper are retained closer to the origin. Density, particle size, and molar mass are not the properties that govern this separation — two components could have very different molar masses or sizes and still show nearly identical Rf values if their polarities were similar, or vice versa.`,
  },
];

/* ============================= 3.10 ============================= */
const t310 = [
  {
    title: 'Q16 — Particle Diagram for the Precipitation of PbCl2',
    content: `The following double-replacement reaction occurs when aqueous lead(II) nitrate is mixed with aqueous sodium chloride:
Pb2+(aq) + 2 NO3-(aq) + 2 Na+(aq) + 2 Cl-(aq) → PbCl2(s) + 2 Na+(aq) + 2 NO3-(aq)

Describe a particle-level diagram showing this solution before and after the reaction takes place, including a key identifying each type of particle shown.`,
    answer: `Before the reaction: the diagram would show individual, separated, mobile Pb2+, NO3-, Na+, and Cl- ions dispersed throughout the solution (with surrounding water molecules, though these are often omitted for clarity), all moving independently and not associated with one another in any fixed arrangement.

After the reaction: the diagram would show a solid clump or lattice labeled PbCl2(s) — representing one Pb2+ ion for every two Cl- ions bound together as an insoluble solid, settled out of solution — while the Na+ and NO3- ions remain dispersed, separated, and mobile throughout the surrounding solution exactly as before, since they are spectator ions that do not participate in forming the precipitate. A key should identify which symbol/color represents Pb2+, Cl-, Na+, NO3-, and the solid PbCl2, making clear that only Pb2+ and Cl- have combined into a new solid phase, while Na+ and NO3- remain unchanged, dissolved ions in solution both before and after the reaction.`,
  },
  {
    title: 'Q17 — Which Solute Is Most Soluble in Methanol (Multiple Choice)',
    mcq: true,
    content: `Methanol (CH3OH) is a polar, hydrogen-bonding solvent. Which of the following would be expected to be most soluble in methanol?
(A) Ethane (C2H6)
(B) Ammonia (NH3)
(C) Carbon tetrachloride (CCl4)
(D) Cyclohexane (C6H12)`,
    answer: `Correct answer: (B) Ammonia

Methanol is polar and capable of hydrogen bonding (through its -OH group). Ammonia is also polar and capable of hydrogen bonding (its N-H bonds qualify, since N is one of the three hydrogen-bonding-eligible atoms), so ammonia and methanol can form strong hydrogen bonds with each other, making ammonia the most soluble of the four choices in methanol ("like dissolves like"). Ethane and cyclohexane are both nonpolar hydrocarbons with only London dispersion forces, and carbon tetrachloride, while it has polar C-Cl bonds, is a symmetric tetrahedral molecule whose bond dipoles cancel, making it nonpolar overall — none of these three can hydrogen-bond or strongly dipole-dipole interact with methanol, making them comparatively poor matches for methanol's polarity and hydrogen-bonding capability.`,
  },
  {
    title: 'Q18 — Identifying Miscible Pairs of Substances',
    content: `For each pair of substances below, determine whether the two substances would be miscible (mix completely without separating) or not, and briefly justify each answer.

(a) C6H14 (hexane) and C5H12 (pentane)
(b) H2O and CH3OH (methanol)
(c) C4H10 (butane) and C4H9OH (butanol)
(d) CHCl3 (chloroform) and CH2Cl2 (dichloromethane)
(e) CH3NH2 (methylamine) and CH3CH3 (ethane)`,
    answer: `(a) Miscible. Both hexane and pentane are nonpolar hydrocarbons with only London dispersion forces; their similar nonpolar character allows them to mix completely.

(b) Miscible. Both water and methanol are polar and capable of hydrogen bonding through their -OH groups, allowing them to interact strongly with each other and mix completely in all proportions.

(c) Not (fully) miscible. Butane is a nonpolar hydrocarbon with only London dispersion forces, while butanol is polar and hydrogen-bonding through its -OH group; their differing intermolecular force profiles (nonpolar vs. hydrogen-bonding) mean they do not mix well, since neither substance's dominant type of intermolecular attraction is well matched by the other.

(d) Miscible. Both chloroform and dichloromethane are polar molecules with generally similar polarity and dispersion-force profiles (similar-sized halogenated methanes), so they mix well with each other.

(e) Not miscible. Methylamine is polar and capable of hydrogen bonding through its N-H bonds, while ethane is a nonpolar hydrocarbon with only London dispersion forces; the mismatch between hydrogen-bonding and purely nonpolar character prevents these two substances from mixing well.`,
  },
];

/* ============================= 3.11 ============================= */
const t311 = [
  {
    title: 'Q17 — Interpreting a Doubled Absorbance in Visible Light Spectroscopy',
    content: `Two samples of copper(II) sulfate solution were analyzed using visible light spectroscopy. Sample 1 absorbed twice as much light as Sample 2 (at the same wavelength, path length, and instrument settings).

(a) What can you deduce about the relative concentrations of the two solutions?
(b) What must be true of a solution in general in order to obtain usable results from visible-light spectroscopy?
(c) Describe, in general terms, what happens within the molecules/ions of a sample during the process of visible-light absorption.`,
    answer: `(a) Since absorbance is directly proportional to concentration (Beer-Lambert law, A = εbc, with ε and b held constant here), Sample 1 absorbing twice as much light as Sample 2 means Sample 1's concentration is twice that of Sample 2.

(b) The solution must be colored — that is, it must absorb light somewhere in the visible portion of the electromagnetic spectrum. A colorless solution does not meaningfully absorb visible light and therefore cannot be usefully analyzed by visible-light spectroscopy (a different technique, such as UV spectroscopy, would be needed instead).

(c) When a photon of visible light is absorbed by the sample, its energy causes an electron within the absorbing molecule or ion to be promoted from its ground (lowest-energy) electronic state to a higher-energy excited electronic state. The specific wavelength(s) of visible light absorbed correspond to the energy gap between these electronic states for that particular substance.`,
  },
];

/* ============================= 3.12 ============================= */
const t312 = [
  {
    title: 'Q20 — Frequency of Red Light from Its Wavelength',
    content: `Calculate the frequency of red light with a wavelength of 715 nm.`,
    answer: `c = fλ, so f = c/λ

f = (3.00 x 10^8 m/s) / (715 x 10^-9 m) = 4.20 x 10^14 Hz`,
  },
];

/* ============================= 3.13 ============================= */
const t313 = [
  {
    title: 'Q20 — Choosing a Wavelength and Predicting Color from an Absorption Spectrum',
    content: `Solution X has an absorption spectrum that shows a single, well-defined absorbance peak centered at 520 nm (green light), with much lower absorbance across the rest of the visible spectrum.

(a) What would be an appropriate wavelength to use when measuring Solution X's absorbance for a calibration curve or concentration determination?
(b) What is the color of the light being absorbed by Solution X at this wavelength?
(c) Predict the observed color of Solution X. Explain your reasoning.
(d) A second sample of Solution X, with a lower (unknown) concentration, is measured and graphed on the same absorption spectrum. How would this second spectrum be similar to, and different from, the first?`,
    answer: `(a) The wavelength at the peak of the absorbance curve, 520 nm, should be used — the optimum wavelength for analysis is the one where the solution absorbs most strongly (where the sample is most sensitive to changes in concentration).

(b) The light being absorbed at 520 nm is green light.

(c) Solution X would appear a shade of the color complementary to green — approximately red/magenta/purple — because the color a solution appears to the eye is the combination of visible wavelengths that are transmitted (not absorbed) by the solution, which is the visible spectrum minus the absorbed green light.

(d) The second (more dilute) spectrum would look similar in overall shape, with the peak absorbance still occurring at the same wavelength, 520 nm (the wavelength of maximum absorbance depends on the identity of the solute, not its concentration). It would differ in that the height (magnitude) of the absorbance peak — and the absorbance at every wavelength — would be lower for the more dilute sample, since absorbance is directly proportional to concentration.`,
  },
  {
    title: 'Q21 — Effect of Fingerprints on a Cuvette on Measured Absorbance',
    content: `A student handles a cuvette carelessly, leaving visible fingerprints on its clear outer surface, before using it to measure the absorbance of a colored solution.

What effect would the fingerprints have on the measured absorbance compared to the true absorbance of the solution? Explain your reasoning.`,
    answer: `The fingerprints would cause the measured absorbance to be too high. Oils and residue from fingerprints on the cuvette's surface absorb and scatter some of the light passing through the cuvette in addition to the light absorbed by the sample itself. The spectrophotometer's detector cannot distinguish between light lost to the sample's true absorbance and light lost due to the fingerprint residue, so it registers the additional light loss as if it were extra absorbance by the sample, resulting in a measured absorbance value higher than the solution's true absorbance.`,
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
    await insertTopic('3.1', t31);
    await insertTopic('3.2', t32);
    await insertTopic('3.3', t33);
    await insertTopic('3.4', t34);
    await insertTopic('3.5', t35);
    await insertTopic('3.6', t36);
    await insertTopic('3.7', t37);
    await insertTopic('3.8', t38);
    await insertTopic('3.9', t39);
    await insertTopic('3.10', t310);
    await insertTopic('3.11', t311);
    await insertTopic('3.12', t312);
    await insertTopic('3.13', t313);
    console.log('Done final round.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
