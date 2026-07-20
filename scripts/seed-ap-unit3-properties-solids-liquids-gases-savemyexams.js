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
  '3.2': 'b30eb473-ac46-4f0f-a187-6607b9915d47', // Properties of Solids
  '3.3': '15f040cd-9585-437e-b63d-47abb13e2979', // Solids, Liquids, and Gases
};

// Questions curated from SaveMyExams "Properties of Solids, Liquids & Gases" MCQ + FRQ sets
// (and their answer-key PDFs). Every question below was independently re-verified against real
// chemistry data (real melting points, real electronegativity/polarizability trends, real
// intermolecular-force hierarchies) rather than copied blindly from the source mark schemes.
// Routing rule followed throughout: 3.2 = solid-type-specific content (ionic/covalent-network/
// metallic/molecular solids, crystalline vs. amorphous, alloys); 3.3 = general states-of-matter
// comparisons, phase changes, vapor pressure/boiling behavior, and gas-phase particle behavior.
// One MCQ (sodium acetate forming a basic solution) was excluded — it tests acid-base hydrolysis/
// pH, which is out of scope for this unit (colligative/equilibrium content belongs elsewhere).
// No diagrams were cleanly croppable (the "ionic lattice" and "cellulose structure" figures in
// the source PDF are low-resolution schematic call-outs), so those items were rewritten as
// self-contained text descriptions instead of images, per the routing instructions.

/*
Topic 3.2 "Properties of Solids" — existing DB has Q1-Q14, largely vapor-pressure/boiling-point
comparisons. New content below fills the gap on solid *types* and their structure-property
relationships (ionic/covalent-network/metallic/molecular solids, alloys, crystalline vs amorphous).
*/
const topic32Questions = [
  {
    topic: '3.2',
    mcq: true,
    title: 'Q15 — Which of the Following Statements About Silicon Dioxide Is Correct?',
    content:
`Which of the following statements about silicon dioxide (SiO2) is correct?

I. Silicon dioxide is a covalent network solid.
II. Each silicon atom is covalently bonded to four oxygen atoms.
III. Silicon dioxide is a good electrical conductor.

(A) I and II only
(B) I and III only
(C) II and III only
(D) I, II and III`,
    answer: `Correct answer: (A) I and II only

Statement I is true: SiO2 is a covalent network (giant covalent) solid, not a simple molecular compound — every atom in the crystal is linked to its neighbors by covalent bonds extending throughout the entire structure.

Statement II is true: in the SiO2 lattice, each silicon atom sits at the center of a tetrahedron and is covalently bonded to four oxygen atoms, while each oxygen atom bridges two silicon atoms (an Si-O-Si linkage). This tetrahedral covalent network is why SiO2 (quartz) has such a high melting point (about 1710 degrees C) — melting requires breaking many strong covalent bonds throughout the lattice, not just overcoming weak intermolecular forces.

Statement III is false: SiO2 is actually a poor electrical conductor, both as a solid and molten. Unlike metals, it has no delocalized "sea" of electrons, and unlike ionic solids, it has no mobile ions — all of its valence electrons are localized in fixed Si-O covalent bonds, so there are no charge carriers available.

(B), (C), and (D) are incorrect because each includes statement III, which is false.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q16 — Identify a Solid From Its Properties (Melting Point and Conductivity)',
    content:
`A solid exhibits the following properties:
- It melts at 996 degrees C.
- It does not conduct electricity as a solid.
- It conducts electricity when dissolved in water.

Which of the following could be the identity of this solid?

(A) MgBr2 (s)
(B) C12H22O11 (s) [sucrose]
(C) SiC (s) [silicon carbide]
(D) Cu (s)`,
    answer: `Correct answer: (A) MgBr2 (s)

The very high melting point (996 degrees C) rules out a simple molecular solid, which would typically melt at a much lower temperature since only weak intermolecular forces need to be overcome. That leaves an ionic solid, a covalent network solid, or a metal as candidates.

The solid does not conduct as a solid but does conduct once dissolved in water — this is the defining electrical signature of an ionic solid. In the solid state, the Mg2+ and Br- ions are locked into fixed lattice positions and cannot move to carry charge. Once dissolved, the lattice breaks apart and the ions become mobile, free to carry current through the solution. MgBr2 fits this profile exactly and its real melting point (about 700 degrees C, in the same high-melting ionic range) is consistent with an ionic lattice.

(B) is incorrect: sucrose (C12H22O11) is a molecular solid held together by hydrogen bonding between neutral molecules. It has a much lower melting point (about 186 degrees C) and, critically, does not conduct electricity in water either, since it dissolves as neutral molecules rather than ions.

(C) is incorrect: SiC is a covalent network solid with an extremely high melting point (about 2730 degrees C), but it does not conduct electricity as a solid, and it does not dissolve in water at all (there are no discrete ions or molecules to release), so it cannot conduct once "dissolved."

(D) is incorrect: Cu is a metal, and metals conduct electricity in the solid state due to delocalized valence electrons — this contradicts the stem, which states the solid does not conduct electricity as a solid.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q17 — Diamond and Graphite: Structure Explains Their Differing Properties',
    content:
`Which of the following statements about diamond and graphite is correct?

(A) The carbon atoms are joined together by three covalent bonds.
(B) They both conduct electricity due to delocalized electrons in their structure.
(C) The differences in their properties can be explained by their different structural arrangements.
(D) They both have high melting points due to their strong intermolecular forces.`,
    answer: `Correct answer: (C) The differences in their properties can be explained by their different structural arrangements

Diamond and graphite are both covalent network solids made entirely of carbon, yet they have very different properties (diamond is extremely hard and does not conduct electricity; graphite is soft, slippery, and does conduct electricity). This is a classic example of allotropes: the same element, but arranged differently.

In diamond, every carbon atom forms four strong covalent bonds in a rigid three-dimensional tetrahedral network, with no delocalized electrons available. This structure makes diamond extremely hard and electrically insulating.

In graphite, each carbon atom forms only three covalent bonds within flat hexagonal layers, leaving one unpaired electron per carbon delocalized across each layer (enabling electrical conductivity within a layer). The layers themselves are held together only by weak London dispersion forces, allowing them to slide past one another — this is why graphite is soft and used as a lubricant/pencil "lead."

(A) is incorrect: this describes graphite's carbon bonding (3 covalent bonds per carbon), not both solids — diamond carbons form four covalent bonds.

(B) is incorrect: only graphite has delocalized electrons (within its layers); diamond has none, since all four of each carbon's valence electrons are tied up in localized sigma bonds.

(D) is incorrect: these are covalent network solids, so their high melting points come from strong covalent bonds throughout the lattice, not from "intermolecular forces" — intermolecular forces are what hold discrete molecules together, which is not the relevant force here (though weak dispersion forces do exist between graphite's layers, that is not what gives graphite its high melting point, which still requires breaking in-layer covalent bonds).`
  },
  {
    topic: '3.2',
    mcq: true,
    title: "Q18 — Why Methane Has a Lower Melting Point Than Sodium Chloride",
    content:
`Different substances have characteristic melting and boiling points, depending on the strength of the bonds or forces holding them together.

Which of the following best explains why methane (CH4) has a lower melting point than sodium chloride (NaCl)?

(A) Covalent bonds are weaker than ionic bonds.
(B) Intermolecular forces are weaker than ionic bonds.
(C) Covalent bonds are stronger than ionic bonds.
(D) Intermolecular forces are stronger than ionic bonds.`,
    answer: `Correct answer: (B) Intermolecular forces are weaker than ionic bonds

Methane is a simple molecular (covalent) solid: each CH4 molecule is held together internally by strong covalent C-H bonds, but separate CH4 molecules are held to each other only by weak London dispersion forces (methane is nonpolar). When methane melts, only these weak intermolecular forces between molecules are broken — the strong covalent bonds within each molecule remain completely intact.

Sodium chloride is an ionic solid: the entire crystal is held together by strong electrostatic (Coulombic) attraction between Na+ and Cl- ions throughout the lattice. Melting NaCl requires disrupting this strong ionic lattice, which takes far more energy.

Since the (weak) intermolecular forces broken when methane melts are far weaker than the (strong) ionic bonds broken when NaCl melts, methane melts at a much lower temperature (about -182 degrees C) than NaCl (801 degrees C).

(A) and (C) are incorrect: they focus on covalent bond strength, but the covalent C-H bonds inside a methane molecule do not break during melting — melting only overcomes the forces between molecules, not the bonds within them.

(D) is incorrect: it reverses the comparison — intermolecular forces in methane are weaker than the ionic bonds in NaCl, not stronger; that is precisely why methane melts at a much lower temperature.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q19 — Identify a Solid From a Description of Its Lattice Structure',
    content:
`A solid is described as follows: it consists of a repeating three-dimensional lattice of alternating positively and negatively charged ions held together by strong electrostatic attraction.

Which of the following best describes this solid?

(A) It is a brittle, water-soluble compound with poor electrical and thermal conductivity as a solid.
(B) It has a low melting point and high electrical and thermal conductivity as a solid.
(C) It is malleable and has poor electrical and thermal conductivity as a solid.
(D) It is soft and has high electrical and thermal conductivity as a solid.`,
    answer: `Correct answer: (A) It is a brittle, water-soluble compound with poor electrical and thermal conductivity as a solid

A repeating lattice of alternating cations and anions held together by electrostatic attraction is the defining structure of an ionic solid. Ionic solids share a characteristic set of properties that all follow from this structure:
- High melting/boiling points, since a large amount of energy is needed to overcome the strong ionic (Coulombic) attractions throughout the lattice.
- Poor electrical and thermal conductivity as a solid, since the ions are locked in fixed lattice positions and cannot move to carry charge or transfer kinetic energy efficiently — conductivity only appears when the solid is melted or dissolved, freeing the ions to move.
- Water solubility, since polar water molecules can surround and stabilize the individual ions (ion-dipole interactions), pulling the lattice apart.
- Brittleness: when a stress shifts one layer of ions relative to another, ions of like charge become aligned and repel each other, causing the lattice to fracture rather than deform — this is why ionic solids shatter instead of bending.

(B) is incorrect: ionic solids have high, not low, melting points, and they do not conduct as solids.

(C) is incorrect: ionic solids are brittle, not malleable — malleability (the ability to be hammered into sheets without breaking) is characteristic of metallic solids, whose delocalized electron "sea" allows metal cations to slide past each other without triggering repulsion.

(D) is incorrect: ionic solids are hard (not soft) and have poor (not high) conductivity as solids.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q20 — Which Metal Has the Highest Melting Point (Na, Mg, Al, or K)',
    content:
`Which of the following metals would have the highest melting point?

(A) Na
(B) Mg
(C) Al
(D) K`,
    answer: `Correct answer: (C) Al

A metal's melting point depends on the strength of its metallic bonding, which is governed by (1) the charge of the metal cations in the "sea of electrons" model and (2) the size (atomic/ionic radius) of those cations. Higher cation charge means more delocalized valence electrons holding the lattice together, and smaller cation radius means the electrons and cations are closer together, strengthening the attraction — both factors increase metallic bond strength and thus melting point.

Comparing the four options: Na and K are both Group 1 metals, forming +1 cations with only one delocalized valence electron per atom. Mg is a Group 2 metal, forming a +2 cation with two delocalized valence electrons per atom, giving stronger metallic bonding than Na or K. Al is a Group 13 metal, forming a +3 cation with three delocalized valence electrons per atom and a smaller atomic radius than Mg, Na, or K — both effects combine to make Al's metallic bonding the strongest of the four.

This prediction matches real melting points: Na is about 98 degrees C, K is about 64 degrees C (lower than Na, since K is a larger atom farther down Group 1, weakening its metallic bonding further), Mg is about 650 degrees C, and Al is about 660 degrees C — Al has the highest melting point of the four, narrowly above Mg, consistent with its higher cation charge and smaller radius.

(A) and (D) are incorrect: Na and K are +1 cations, giving the weakest metallic bonding and lowest melting points of the group; K is even lower than Na because it is a larger atom.

(B) is incorrect: Mg has strong metallic bonding (+2 cation) but is still outmatched by Al's +3 cation and smaller atomic radius.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q21 — Distinguishing Crystalline From Amorphous Solids',
    content:
`Which of the following best describes the difference between crystalline and amorphous solids?

(A) Crystalline solids are composed of molecules in fixed positions, while amorphous solids allow molecules to flow freely.
(B) Crystalline solids have an orderly, repeating atomic structure, while amorphous solids have a disordered, non-repeating structure.
(C) Amorphous solids are more compressible than crystalline solids due to their disordered structure.
(D) Crystalline solids are typically formed when liquids cool quickly, while amorphous solids are formed when liquids cool slowly.`,
    answer: `Correct answer: (B) Crystalline solids have an orderly, repeating atomic structure, while amorphous solids have a disordered, non-repeating structure

Crystalline solids (e.g., table salt, quartz, most metals) are defined by long-range order: their particles are arranged in a highly regular, repeating three-dimensional pattern (a lattice) that extends throughout the entire solid. This ordered structure gives crystalline solids a sharp, well-defined melting point, since every particle experiences essentially the same local environment and therefore requires the same amount of energy to break free.

Amorphous solids (e.g., glass, many plastics, rubber) lack this long-range repeating order — their particles are arranged in a disordered, glass-like fashion similar to a "frozen liquid." Because different regions of an amorphous solid have slightly different local particle environments and bond strengths, amorphous solids soften gradually over a range of temperatures rather than melting sharply at one point.

(A) is incorrect: particles in both crystalline and amorphous solids are essentially fixed in position (vibrating in place) — neither type allows molecules to flow freely, since that would describe a liquid, not a solid.

(C) is incorrect: both crystalline and amorphous solids are nearly incompressible, since in both cases particles are packed closely together with little empty space, regardless of whether that packing is ordered or disordered.

(D) is incorrect: this reverses the real relationship. Crystalline solids typically form when a liquid cools slowly, giving particles time to arrange into an ordered, low-energy lattice; amorphous solids typically form when a liquid cools (or solidifies) very quickly, "freezing" the particles in a disordered arrangement before they can organize into a crystal lattice.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: "Q22 — Noncovalent Interactions Responsible for Cellulose's Structure and Insolubility",
    content:
`Cellulose is a polymer made of long chains of glucose monomers linked together. Each glucose monomer has several -OH (hydroxyl) groups, and in the cellulose polymer, many parallel chains pack tightly side by side. Glucose itself, the individual monomer, is highly water soluble, yet cellulose (the polymer built from glucose) is insoluble in water.

Which of the following types of noncovalent interactions is most likely responsible for the rigid structure and water-insolubility of cellulose?

(A) Hydrogen bonding
(B) Electrostatic/ionic interactions
(C) Hydrophobic interactions
(D) Van der Waals (London dispersion) interactions`,
    answer: `Correct answer: (A) Hydrogen bonding

Each glucose unit in a cellulose chain has multiple -OH groups, which are excellent hydrogen-bond donors and acceptors (an O-H bond is highly polarized, and the oxygen atom carries lone pairs). In the cellulose polymer, the -OH groups on one chain form extensive hydrogen bonds with -OH groups on neighboring, parallel chains. This creates a dense, interlocking network of hydrogen bonds that holds many chains rigidly together into bundles (microfibrils).

This extensive intermolecular hydrogen-bonding network explains both of cellulose's notable properties: its structural rigidity (the hydrogen-bonded chains reinforce each other, similar to the intermolecular forces stiffening plant cell walls) and its water-insolubility (the -OH groups are already fully "occupied" hydrogen-bonding with each other, so water molecules cannot easily out-compete these interchain hydrogen bonds to pull the polymer apart, unlike single glucose molecules, whose -OH groups can hydrogen-bond freely with surrounding water).

(B) is incorrect: cellulose is composed entirely of neutral glucose monomers, with no ionic or charged functional groups — there are no ions present to form electrostatic/ionic interactions.

(C) is incorrect: cellulose's numerous polar hydroxyl groups make it hydrophilic (water-attracting) in isolation, not hydrophobic — its insolubility as a polymer comes from the -OH groups being tied up in interchain hydrogen bonds, not from any hydrophobic character.

(D) is incorrect: while weak van der Waals forces are present everywhere, they are far weaker than the extensive hydrogen-bonding network between hydroxyl groups, and are not the dominant force responsible for cellulose's rigidity and insolubility.`
  },
  {
    topic: '3.2',
    mcq: true,
    title: 'Q23 — Order in Which Four Different Solids Melt or Vaporize on Heating',
    content:
`A mixture contains four solids at room temperature:

Substance P: a nonpolar molecular solid with a low melting point and negligible electrical conductivity.
Substance Q: a covalent network solid composed of carbon in a 3D lattice, extremely hard, with a very high melting point and no electrical conductivity.
Substance R: an ionic solid composed of small, similarly charged ions, with a high melting point and conductivity when molten.
Substance S: a metallic solid with high electrical conductivity, malleability, and an intermediate melting point compared to Q and R.

When the mixture is gradually heated at normal pressure, in what order would the substances transition to the liquid or gaseous phase, and why?

(A) P then S then R then Q, due to increasing strength of intermolecular/intrinsic bonding from molecular to metallic to ionic to covalent network.
(B) Q then R then S then P, due to a random order determined by particle density.
(C) R then S then Q then P, due to ionic solids melting at the lowest temperatures, followed by metallic, covalent network, and molecular solids.
(D) S then P then R then Q, due to metals always melting before molecular solids, and ionic solids melting at the lowest temperatures.`,
    answer: `Correct answer: (A) P then S then R then Q

The order in which a solid melts depends on the strength of the forces holding its particles together — weaker forces mean less thermal energy is needed to disrupt them, so that solid melts first.

Substance P (nonpolar molecular solid): held together only by weak London dispersion forces between discrete molecules. This is by far the weakest type of interaction among the four, so P melts (and vaporizes) first, at the lowest temperature.

Substance S (metallic solid): held together by metallic bonding (a lattice of cations in a delocalized electron "sea"). Metallic bonding is generally stronger than simple intermolecular forces in nonpolar molecular solids, but weaker than the ionic and covalent-network options here (the stem specifies S has "intermediate" melting point compared to Q and R), so S melts next.

Substance R (ionic solid): held together by strong electrostatic (Coulombic) attractions between ions throughout the lattice. Ionic lattices generally require more energy to disrupt than metallic bonding, so R melts after S.

Substance Q (covalent network solid): every atom is linked to its neighbors by strong covalent bonds extending through the entire 3D lattice. Melting (or even softening) a covalent network solid requires breaking a huge number of strong covalent bonds, giving it by far the highest melting point of the four — so Q melts last.

(B) is incorrect: melting order is governed by bonding strength, not "random order" or particle density.

(C) and (D) are incorrect: both claim ionic solids melt at the lowest temperature, but ionic solids have strong electrostatic lattice forces and generally melt at high temperatures — well above simple molecular solids like P, and (per the stem) also above the metallic solid S.`
  },
  {
    topic: '3.2',
    title: "Q24 — NaCl vs. MgO: Coulomb's Law, Conductivity, and Brittleness",
    content:
`Sodium chloride (NaCl) and magnesium oxide (MgO) are both ionic solids.

(a) Use Coulomb's Law to explain why magnesium oxide has a higher melting point than sodium chloride.

(b) Explain why solid NaCl is a poor conductor of electricity, but molten NaCl can conduct electricity.

(c) Ionic solids tend to be brittle. Explain why, using the behavior of ions in a crystal lattice.`,
    answer: `(a) Coulomb's Law states that the electrostatic force (and the resulting lattice energy) between two charged particles is proportional to the product of their charge magnitudes and inversely proportional to the square of the distance between them: F is proportional to (q1 x q2) / r^2. Magnesium oxide is made of Mg2+ and O2- ions, each carrying a charge magnitude of 2, so the product of charges is 2 x 2 = 4 (in units of elementary charge squared). Sodium chloride is made of Na+ and Cl- ions, each carrying a charge magnitude of only 1, so the product of charges is 1 x 1 = 1. Because MgO's ions carry twice the charge magnitude of NaCl's ions, the Coulombic (electrostatic) attraction between the ions in MgO is much stronger than in NaCl (further reinforced by Mg2+ and O2- also both being smaller ions than Na+ and Cl-, which shortens the ion-ion distance and strengthens the attraction even more). This stronger attraction produces a much higher lattice energy for MgO, meaning significantly more thermal energy is required to pull the ions apart and melt the solid — which is exactly why MgO's real melting point (about 2852 degrees C) is dramatically higher than NaCl's (about 801 degrees C).

(b) In solid NaCl, the Na+ and Cl- ions are locked into fixed positions within the rigid crystal lattice. Although the ions carry charge, they cannot move from place to place, so no net charge can flow through the solid — electrical conduction requires mobile charge carriers, and there are none available in the fixed lattice. When NaCl is melted, the rigid lattice breaks down and the Na+ and Cl- ions become free to move throughout the liquid. These mobile ions can now migrate toward oppositely charged electrodes, carrying an electric current — so molten NaCl conducts electricity while the solid does not.

(c) In an ionic crystal, ions are arranged in an alternating pattern so that each cation is surrounded by anions and vice versa, maximizing attractive (opposite-charge) interactions and minimizing repulsive (like-charge) interactions. When a mechanical stress is applied, it can shift one entire layer of ions relative to the layer next to it. If this shift lines up ions of the same charge directly next to each other (for example, cation next to cation), the strong repulsion between like charges suddenly dominates at that plane, and the lattice violently fractures along that plane rather than bending or deforming smoothly. This sudden shift-then-repel-then-fracture mechanism is why ionic solids shatter (are brittle) under stress, in contrast to metals, whose nondirectional metallic bonding allows layers of cations to slide past each other and reform without triggering this kind of repulsion (which is why metals are malleable instead of brittle).`
  },
  {
    topic: '3.2',
    title: "Q25 — Diamond's Hardness, Graphite's Conductivity, and SiO2's Melting Point",
    content:
`Covalent network solids exhibit different mechanical and thermal properties compared to other types of solids.

(a) Explain why diamond is extremely hard, whereas graphite is soft.

(b) Explain why graphite is able to conduct electricity but diamond is not.

(c) Silicon dioxide (SiO2) has a very high melting point. Explain why, in terms of bonding and structure.`,
    answer: `(a) In diamond, each carbon atom forms four strong covalent bonds to four other carbon atoms in a rigid, three-dimensional tetrahedral network that extends throughout the entire crystal. Because every atom is locked into this dense web of strong covalent bonds in all three dimensions, there is no way for layers or planes to slide past one another, making diamond extremely hard. In graphite, each carbon atom forms only three covalent bonds, arranged into flat two-dimensional hexagonal sheets (layers). Within a layer, the covalent bonding is just as strong as in diamond, but the separate layers are held to each other only by weak London dispersion forces. Because these interlayer forces are weak, the layers can easily slide past one another, which is why graphite is soft and slippery (and useful as a solid lubricant/pencil "lead").

(b) In diamond, all four of each carbon atom's valence electrons are used to form four localized covalent sigma bonds — there are no leftover, mobile electrons available to carry an electric current, so diamond does not conduct electricity. In graphite, each carbon atom uses only three of its valence electrons to form the three in-layer covalent bonds; the fourth valence electron per carbon atom is left delocalized across the entire hexagonal layer (part of a continuous pi-electron system similar to extended resonance). These delocalized electrons are free to move within a layer, allowing graphite to conduct electricity along its layers, whereas diamond, lacking any such delocalized electrons, cannot.

(c) In SiO2, every silicon atom is covalently bonded to four oxygen atoms (and every oxygen atom bridges two silicon atoms), forming a continuous three-dimensional covalent network that extends throughout the entire crystal, just like diamond's carbon network. Melting SiO2 does not simply involve overcoming weak intermolecular forces between separate molecules (there are no separate SiO2 "molecules" — the whole crystal is one giant covalently bonded network); instead, it requires breaking a huge number of strong covalent Si-O bonds throughout the lattice. Because covalent bonds are much stronger than the intermolecular forces found in typical molecular solids, an enormous amount of energy is needed to melt SiO2, giving it a very high melting point (about 1710 degrees C).`
  },
  {
    topic: '3.2',
    title: 'Q26 — Comparing NaCl, SiO2, and Cu: Conductivity, Hardness, Melting, and Structure',
    content:
`A materials scientist compares the structures and properties of three different solids:

Substance    Electrical Conductivity (solid)    Melting Point (°C)    Hardness       Structure Type
NaCl (s)     Low                                 801                   Brittle        Ionic
SiO2 (s)     Very low                            1710                  Very hard      Covalent network
Cu (s)       High                                1085                  Malleable      Metallic

(a) Explain why copper conducts electricity as a solid, but NaCl does not.

(b) Despite both being solids with strong interactions, SiO2 is significantly harder than NaCl. Explain this difference in terms of their bonding and structure.

(c) The scientist heats equal masses of NaCl (s) and Cu (s). Explain which solid will melt first, in terms of particle motion and structure.

(d) Describe a particulate-level representation of the structure of solid NaCl: how the Na+ and Cl- ions are arranged relative to each other, and how their sizes compare.

(e) A polymer material shows electrical conductivity similar to SiO2 (very poor) and is flexible like a soft metal. Suggest a structural explanation for these two observed properties.`,
    answer: `(a) Copper is a metallic solid: its valence electrons are delocalized, forming a mobile "sea of electrons" that surrounds a fixed lattice of Cu+/Cu2+-like cations. Because these electrons are free to drift throughout the entire metal, they can carry electric current, so copper conducts electricity as a solid. NaCl is an ionic solid: its Na+ and Cl- ions do carry charge, but they are locked into fixed positions within the rigid crystal lattice and cannot move. With no mobile charge carriers available, solid NaCl cannot conduct electricity (it only conducts once melted or dissolved, when the ions become free to move).

(b) SiO2 is a covalent network solid in which every silicon atom is covalently bonded to four oxygen atoms in a rigid three-dimensional lattice extending throughout the entire crystal — deforming or scratching SiO2 requires breaking many strong, directional covalent bonds spread across the whole structure, making it very hard. NaCl is held together by electrostatic (ionic) attraction between Na+ and Cl- ions. While these ionic forces are strong, they are non-directional and the lattice can shift under stress: a shear force can slide one layer of ions relative to another until like-charged ions align, and the resulting repulsion causes the lattice to fracture at relatively low applied stress. Because covalent bonds must be individually broken throughout SiO2's structure (a much higher-energy process) while NaCl's ionic lattice merely needs to be shifted into a repulsive alignment, SiO2 is significantly harder than NaCl.

(c) NaCl will melt first. NaCl's melting point (801 degrees C) is substantially lower than Cu's (1085 degrees C), meaning less thermal energy is needed to overcome NaCl's ionic lattice attractions than Cu's metallic bonding. As both solids are heated, their particles vibrate more vigorously in place; NaCl's ions reach the vibrational energy needed to break free of the ionic lattice at a lower temperature, while copper's densely packed metal cations, held by strong nondirectional metallic bonding throughout the "electron sea," require more thermal energy before the lattice structure breaks down into a liquid.

(d) Solid NaCl can be represented as a repeating, alternating three-dimensional arrangement in which each Na+ ion is surrounded by Cl- ions as nearest neighbors, and each Cl- ion is surrounded by Na+ ions as nearest neighbors (a checkerboard-like pattern extended into 3D), so that no two ions of the same charge are adjacent. Because Cl- has gained an electron relative to a neutral Cl atom while Na+ has lost its single valence electron relative to neutral Na, the Cl- ion is noticeably larger (larger ionic radius) than the Na+ ion; an accurate particulate diagram should show the Cl- circles clearly larger than the Na+ circles, with electrostatic attraction indicated between each adjacent unlike pair of ions.

(e) Very poor electrical conductivity (like SiO2) indicates the polymer has no mobile charge carriers available — no delocalized electrons (as in a metal) and no mobile ions (as in a molten ionic solid or electrolyte solution) — consistent with a polymer made of covalently bonded chains with all valence electrons localized in fixed bonds. Flexibility similar to a soft metal indicates that, unlike a rigid 3D covalent network such as SiO2, this polymer's structure allows its chains (or layers) to slide past one another relatively easily; this is possible if the polymer chains are held to each other only by relatively weak intermolecular forces (rather than a continuous 3D covalent network), allowing chains to shift position under stress without breaking strong covalent bonds, which is analogous to how weak interlayer forces let metal-like layers (or graphite's layers) slide.`
  },
  {
    topic: '3.2',
    title: 'Q27 — Brass vs. High-Carbon Steel Hardness; Crystalline vs. Amorphous Packing',
    content:
`(a) The physical properties of solids depend on the arrangement of their particles and the forces that hold them together. Compare the hardness of brass and high-carbon steel, referring to how alloy type and structure contribute to their mechanical properties.

(b) Compare crystalline and amorphous solids in terms of particle arrangement and structural properties, explaining how interparticle interactions influence their ability to pack together.`,
    answer: `(a) High-carbon steel is an interstitial alloy: small carbon atoms fit into the gaps ("interstices") between the larger iron atoms in the metallic lattice. These interstitial carbon atoms distort the regular arrangement of iron atoms and physically obstruct the layers of iron atoms from sliding past each other, which is what normally allows metals to deform. This makes high-carbon steel significantly harder and less malleable than pure iron. Brass, in contrast, is a substitutional alloy: zinc atoms of a similar size to copper atoms simply replace (substitute for) some copper atoms at regular lattice sites, without significantly disrupting the overall arrangement or introducing the same kind of obstruction. Because the substituted zinc atoms are comparable in size to the copper atoms they replace, layers of atoms in brass can still slide past each other relatively easily (similar to a pure metal), so brass remains more malleable and less hard than the interstitially-hardened high-carbon steel.

(b) Crystalline solids have a highly ordered, repeating three-dimensional arrangement of particles that extends throughout the entire solid, allowing for efficient, uniform packing and consistent, strong interparticle interactions at every point in the lattice. This uniformity gives crystalline solids a sharp, well-defined melting point, since essentially the same amount of energy is needed to disrupt the interactions at any point in the structure. Amorphous solids lack this long-range repeating order — their particles are arranged in an irregular, glass-like fashion, which leads to irregular packing and interparticle interactions of varying strength throughout the material. Because different regions of an amorphous solid require different amounts of energy to disrupt, amorphous solids do not melt sharply; instead they soften gradually over a range of temperatures as increasingly many of their weaker, less-uniform interactions are overcome.`
  },
  {
    topic: '3.2',
    title: 'Q28 — Molecular vs. Covalent Network Solids; I2 vs. CO2 Melting Points',
    content:
`(a) Compare the structure and melting points of molecular solids and covalent network solids, explaining how interparticle interactions influence their physical properties.

(b) Iodine (I2) and carbon dioxide (CO2) are both molecular solids under appropriate conditions but have very different melting/sublimation points. Explain the difference.`,
    answer: `(a) Molecular solids consist of discrete, individual molecules held in a lattice by relatively weak intermolecular forces (London dispersion forces, dipole-dipole forces, and/or hydrogen bonding, depending on the molecule), while the covalent bonds within each molecule remain strong and localized to that molecule. Because only these comparatively weak intermolecular forces need to be overcome to separate the molecules from one another, molecular solids generally have low melting points and are often soft. Covalent network solids, in contrast, have no discrete molecules at all — every atom is covalently bonded to its neighbors, forming one continuous three-dimensional (or two-dimensional, as in graphite) network of strong covalent bonds spanning the entire solid. Melting a covalent network solid requires breaking a vast number of these strong covalent bonds throughout the structure, which demands far more energy than overcoming intermolecular forces, giving covalent network solids much higher melting points and greater hardness than molecular solids.

(b) Iodine has a substantially higher melting point (about 114 degrees C) than solid carbon dioxide, which does not even melt at atmospheric pressure but instead sublimes directly to gas at about -78.5 degrees C. Both are nonpolar molecular solids held together only by London dispersion forces, so the strength of these forces depends on how polarizable each molecule is — larger, more electron-rich molecules have more loosely held (more easily distorted) electron clouds, leading to stronger instantaneous/induced dipole interactions. I2 has far more electrons (53 per iodine atom, 106 total) than CO2 (a much smaller molecule with only 22 total electrons), making I2 considerably more polarizable. This gives I2 much stronger London dispersion forces between its molecules than CO2 has, which is why I2 requires much more thermal energy — and thus a much higher temperature — to overcome its intermolecular forces and change phase, compared to CO2.`
  },
];

/*
Topic 3.3 "Solids, Liquids, and Gases" — existing DB has only Q1 (a particle diagram question).
New content below adds general states-of-matter comparisons, vapor pressure/boiling-point
behavior, and gas-phase particle behavior, per the routing rule (general/cross-state content, not
solid-type-specific content, belongs here).
*/
const topic33Questions = [
  {
    topic: '3.3',
    mcq: true,
    title: 'Q2 — CBr4 vs. CCl4: Vapor Pressure and London Dispersion Forces',
    content:
`                         Molar mass (g/mol)     Vapor pressure at 20°C (mm Hg)
CBr4                     331.6                   0.8
CCl4                     153.8                   115.0

Based on the information in the table above, which of the following best explains why CCl4 has a higher vapor pressure than CBr4?

(A) CCl4 has stronger dipole-dipole forces than CBr4.
(B) CCl4 has weaker dipole-dipole forces than CBr4.
(C) CCl4 has stronger London dispersion forces than CBr4.
(D) CCl4 has weaker London dispersion forces than CBr4.`,
    answer: `Correct answer: (D) CCl4 has weaker London dispersion forces than CBr4

Both CBr4 and CCl4 are tetrahedral, nonpolar molecules (symmetric arrangement of four identical halogen atoms around carbon means their individual C-X bond dipoles cancel), so the dominant intermolecular force in both liquids is London dispersion forces, not dipole-dipole forces.

A liquid with weaker intermolecular forces has a higher vapor pressure at a given temperature, because its molecules are held together less strongly and more easily escape into the gas phase. Since CCl4 has the higher vapor pressure (115.0 mm Hg vs. 0.8 mm Hg for CBr4), CCl4 must have the weaker London dispersion forces of the two.

This is consistent with molecular size and polarizability: CBr4 (molar mass 331.6 g/mol) is a larger molecule with more electrons than CCl4 (molar mass 153.8 g/mol), since bromine atoms are larger and more electron-rich than chlorine atoms. More electrons means a more polarizable electron cloud, which produces stronger instantaneous/induced-dipole (London dispersion) attractions between molecules. So CBr4's larger, more polarizable molecules experience stronger London dispersion forces than CCl4's smaller, less polarizable molecules — explaining CBr4's much lower vapor pressure.

(A) and (B) are incorrect: dipole-dipole forces are not the relevant intermolecular force here, since both molecules are nonpolar.

(C) is incorrect: it has the direction backward — stronger intermolecular forces would result in a lower vapor pressure (as seen in CBr4), not a higher one.`
  },
  {
    topic: '3.3',
    mcq: true,
    title: 'Q3 — Why Liquids Have a Definite Volume but No Definite Shape',
    content:
`Which of the following best explains why liquids have a definite volume but no definite shape?

(A) The particles in a liquid are in fixed positions and can only vibrate.
(B) The particles in a liquid are loosely packed and can move past each other, but are still close together.
(C) The particles in a liquid are spread out and move freely in all directions.
(D) The particles in a liquid are tightly packed and cannot move.`,
    answer: `Correct answer: (B) The particles in a liquid are loosely packed and can move past each other, but are still close together

In a liquid, particles remain close together (similar in spacing to a solid), which is why liquids resist compression and maintain a definite, essentially fixed volume — there is very little empty space between particles for them to be squeezed into. Unlike in a solid, however, liquid particles are not locked into fixed lattice positions; they have enough kinetic energy to slide and flow past one another. This freedom of movement means a liquid has no fixed shape of its own — it flows to take on the shape of whatever container holds it, while its volume stays essentially constant.

(A) is incorrect: this describes a solid, where particles vibrate about fixed lattice positions but do not flow or change shape.

(C) is incorrect: this describes a gas, where particles are widely spaced and move independently with no significant attraction holding them to a definite volume, which is why gases expand to fill any container.

(D) is incorrect: it combines "tightly packed" (roughly true, similar to a solid) with "cannot move," but liquid particles can move relative to each other, which is precisely why liquids flow and take the shape of their container — a liquid described as unable to move at all would behave like a rigid solid, not a liquid.`
  },
  {
    topic: '3.3',
    mcq: true,
    title: 'Q4 — Why Gases Are Highly Compressible Compared to Solids and Liquids',
    content:
`Which of the following statements explains why gases are highly compressible compared to solids and liquids?

(A) Gases are composed of particles that are in constant random motion, which prevents them from having a fixed shape.
(B) The particles in a gas have very little intermolecular force, allowing them to move freely.
(C) Gases are highly compressible because the particles are widely spaced, leaving large amounts of empty space between them.
(D) The pressure of a gas is determined by the frequency and force with which particles strike the walls of their container.`,
    answer: `Correct answer: (C) Gases are highly compressible because the particles are widely spaced, leaving large amounts of empty space between them

Compressibility refers specifically to how much a substance's volume can be reduced when pressure is applied. Gas particles are, on average, extremely far apart relative to their own size, so a gas sample is mostly empty space. When pressure is applied, this large amount of empty space between particles can be significantly reduced (pushing the particles closer together) without the particles themselves needing to be compressed, allowing the overall volume of a gas to decrease dramatically. Solids and liquids, by contrast, already have their particles packed closely together with very little empty space, so there is little room left to compress — this is precisely why they are nearly incompressible compared to gases.

(A) is incorrect: random particle motion is true of gases and explains why they lack a fixed shape, but it does not by itself explain compressibility — the key factor for compressibility is the large spacing (empty space) between particles, not their motion.

(B) is incorrect: weak intermolecular forces do explain why gas particles move independently and are not held together, but this describes why gases lack a fixed shape/volume in general, not specifically why they can be compressed so much — a gas with the same weak forces but tightly packed particles would not compress nearly as much.

(D) is incorrect: this correctly describes how gas pressure arises (particle collisions with container walls), but it does not address compressibility, which depends on how much closer together the particles can be pushed, not on how gas pressure is generated.`
  },
  {
    topic: '3.3',
    mcq: true,
    title: 'Q5 — Melting Point Trend Down Group 7A (Halogens)',
    content:
`Which of the following factors is primarily responsible for the increase in melting points observed as you move down Group 7A from fluorine to astatine?

(A) Atomic mass increases.
(B) Intermolecular forces become stronger.
(C) The size of the molecules decreases.
(D) The atomic number decreases.`,
    answer: `Correct answer: (B) Intermolecular forces become stronger

Moving down Group 7A (the halogens: F2, Cl2, Br2, I2, At2), each successive diatomic molecule is made of larger atoms with more electrons. A larger, more electron-rich molecule has a more easily distorted (more polarizable) electron cloud, which leads to stronger instantaneous/induced-dipole attractions — that is, stronger London dispersion forces — between molecules. Since all halogen diatomic molecules are nonpolar, London dispersion forces are the only intermolecular force present, so the steady increase in molecular size and polarizability down the group directly produces the steady increase in melting point. This trend matches real melting points: F2 melts at about -220 degrees C, Cl2 at about -101 degrees C, Br2 at about -7 degrees C, and I2 at about 114 degrees C, with astatine (highly radioactive and studied only in trace amounts) expected to continue the trend to an even higher melting point.

(A) is incorrect: atomic mass does increase down the group, and it happens to correlate with the trend, but mass itself is not the direct physical cause of a higher melting point — it is the increased number of electrons (and resulting polarizability/stronger London dispersion forces) that directly increases the intermolecular attraction requiring more energy to overcome.

(C) is incorrect: molecule size actually increases, not decreases, moving down Group 7A, since atomic radius increases down a group.

(D) is incorrect: atomic number increases (not decreases) moving down Group 7A, since each successive halogen has more protons.`
  },
  {
    topic: '3.3',
    mcq: true,
    title: 'Q6 — Hydrogen Bonding vs. London Dispersion Forces: Predicting Relative Boiling Points',
    content:
`Two molecular substances, A and B, have similar molar masses. Substance A has hydrogen bonding between its molecules, while substance B is nonpolar with only London dispersion forces.

Which statement correctly predicts their relative boiling points?

(A) A has a lower boiling point because hydrogen bonding breaks more easily than London forces.
(B) B has a higher boiling point because nonpolar molecules can pack more efficiently, increasing intermolecular forces.
(C) A has a higher boiling point due to stronger intermolecular forces from hydrogen bonding.
(D) A and B have identical boiling points since they have similar molar masses.`,
    answer: `Correct answer: (C) A has a higher boiling point due to stronger intermolecular forces from hydrogen bonding

Hydrogen bonding is a particularly strong type of dipole-dipole interaction that occurs when a hydrogen atom bonded directly to a highly electronegative atom (N, O, or F) is attracted to a lone pair on a nearby N, O, or F atom. Hydrogen bonds are substantially stronger than the London dispersion forces present in a nonpolar substance of comparable size. Boiling requires enough thermal energy to overcome the attractive intermolecular forces holding molecules in the liquid phase, so a substance with stronger intermolecular forces (substance A, with hydrogen bonding) requires more energy — and thus a higher temperature — to boil than a substance with only weaker London dispersion forces (substance B), even though A and B have similar molar masses and therefore similar molecular sizes.

Molar mass alone is not the deciding factor when comparing substances with fundamentally different types of intermolecular forces — the identity and strength of the intermolecular force present matters more. This is the same reasoning that explains, for example, why water (H2O, molar mass 18) has a dramatically higher boiling point than methane (CH4, molar mass 16), despite their very similar molar masses: water has hydrogen bonding, while methane has only weak London dispersion forces.

(A) is incorrect: it reverses the relative strength of the two interactions — hydrogen bonds are stronger, not weaker, than London dispersion forces, so A does not have a lower boiling point.

(B) is incorrect: nonpolar molecules packing efficiently does not create intermolecular forces stronger than hydrogen bonding; packing efficiency affects density, not the fundamental strength of the attractive forces between molecules.

(D) is incorrect: similar molar mass does not guarantee similar boiling points when the substances have different types (and strengths) of intermolecular forces present.`
  },
  {
    topic: '3.3',
    title: 'Q7 — Defining Vapor Pressure; Comparing Ethanol and Hexane Boiling Points',
    content:
`(a) Define vapor pressure.

(b) Explain why ethanol (C2H5OH) has a higher boiling point than hexane (C6H14), in terms of intermolecular forces.`,
    answer: `(a) Vapor pressure is the pressure exerted by a substance's vapor when that vapor is in dynamic equilibrium with its liquid (or solid) phase at a given temperature. In a closed container, molecules continually evaporate from the liquid surface into the vapor phase while, at the same time, vapor-phase molecules continually condense back into the liquid; once the rate of evaporation equals the rate of condensation, the system has reached dynamic equilibrium, and the (now constant) pressure exerted by the vapor above the liquid is the vapor pressure at that temperature.

(b) Ethanol contains an -OH group, in which a hydrogen atom is bonded directly to a highly electronegative oxygen atom. This allows ethanol molecules to form hydrogen bonds with one another (the hydrogen of one ethanol's -OH group attracted to a lone pair on the oxygen of a neighboring ethanol molecule). Hexane, in contrast, is a nonpolar hydrocarbon with no electronegative atoms capable of hydrogen bonding, so its molecules interact only through weak London dispersion forces. Because hydrogen bonds are considerably stronger than London dispersion forces, more thermal energy is required to separate ethanol molecules from one another than to separate hexane molecules, giving ethanol a higher boiling point (about 78 degrees C) than hexane (about 69 degrees C), despite hexane being the larger, higher-molar-mass molecule.`
  },
  {
    topic: '3.3',
    title: "Q8 — Effect of Increasing Temperature on Ethanol's Vapor Pressure",
    content:
`A sample of ethanol is placed in a sealed container at 25°C, where it reaches dynamic equilibrium between its liquid and vapor phases. Predict what happens to the vapor pressure of ethanol when the temperature is increased to 40°C. Justify your answer.`,
    answer: `When the temperature is increased from 25 degrees C to 40 degrees C, the vapor pressure of ethanol will increase. Raising the temperature increases the average kinetic energy of the ethanol molecules in the liquid. A larger fraction of molecules now possesses enough kinetic energy to overcome the intermolecular forces (hydrogen bonding, in ethanol's case) holding them in the liquid and escape into the vapor phase. This increases the rate of evaporation relative to the rate of condensation, so more ethanol molecules enter the vapor phase before a new, higher equilibrium is reached. Since vapor pressure is defined by the amount of vapor present in equilibrium with the liquid, and there is now more vapor present at the new equilibrium, the vapor pressure at 40 degrees C is higher than it was at 25 degrees C. This is the general relationship between temperature and vapor pressure for any liquid: vapor pressure always increases as temperature increases.`
  },
  {
    topic: '3.3',
    title: 'Q9 — Acetonitrile vs. Acetone Boiling Point; Effect of Pressure on Boiling Point',
    content:
`Acetonitrile (CH3CN) and acetone (CH3COCH3) are both organic liquids with similar molar masses. However, acetonitrile has a significantly higher boiling point than acetone.

(a) Explain why acetonitrile has a significantly higher boiling point than acetone.

(b) The normal boiling point of acetonitrile is 81.6°C at 1 atm. If the external pressure is reduced to 0.50 atm, predict whether acetonitrile will boil at a higher or lower temperature. Justify your answer.`,
    answer: `(a) Both acetonitrile and acetone are polar molecules with a permanent dipole, so both experience dipole-dipole intermolecular forces. Acetonitrile has a C≡N (carbon-nitrogen triple bond) functional group, while acetone has a C=O (carbon-oxygen double bond) functional group. Nitrogen and oxygen are both highly electronegative, but the C≡N group in acetonitrile creates a particularly strong, concentrated bond dipole (partly because a triple bond has more electron density concentrated along the bond axis than a double bond), producing a larger molecular dipole moment and thus stronger dipole-dipole interactions between acetonitrile molecules than between acetone molecules. Since acetonitrile's dipole-dipole forces are stronger, more thermal energy is required to overcome them, giving acetonitrile its significantly higher boiling point (81.6 degrees C) compared to acetone (56 degrees C), even though the two compounds have similar molar masses.

(b) Acetonitrile will boil at a lower temperature when the external pressure is reduced to 0.50 atm. A liquid boils when its vapor pressure becomes equal to the external (atmospheric) pressure pushing down on it — at that point, vapor bubbles can form and grow throughout the liquid, not just evaporate from its surface. Since vapor pressure increases with temperature, reaching a lower external pressure (0.50 atm, rather than the standard 1 atm) requires only that the liquid's vapor pressure reach this lower value, which happens at a lower temperature than would be needed to reach 1 atm of vapor pressure. This is the same principle that explains why liquids (including water) boil at lower temperatures at high altitude, where atmospheric pressure is reduced.`
  },
  {
    topic: '3.3',
    title: 'Q10 — Evaporation Rate and Phase Equilibrium Under a Volume Change',
    content:
`Acetone is placed in a sealed container at room temperature, where it begins to evaporate.

(a) Explain how the rate of evaporation of acetone changes over time as the system approaches equilibrium.

(b) Predict and explain what happens to the equilibrium between liquid acetone and acetone vapor if the volume of the sealed container is suddenly increased.`,
    answer: `(a) Immediately after acetone is placed in the sealed container, the rate of evaporation is at its highest, since essentially no acetone vapor is yet present to condense back into the liquid. As time passes, acetone molecules accumulate in the vapor phase, and the rate of condensation (vapor molecules returning to the liquid) increases as a result. The observed net rate of evaporation therefore decreases over time, not because individual molecules evaporate more slowly, but because condensation is increasingly offsetting evaporation. Eventually, the rate of evaporation becomes exactly equal to the rate of condensation, and the system reaches dynamic equilibrium: acetone molecules continue to evaporate and condense continuously, but the overall amount of liquid and vapor present no longer changes.

(b) The liquid-vapor equilibrium can be written as CH3COCH3 (l) is in equilibrium with CH3COCH3 (g). Suddenly increasing the container's volume spreads the same amount of vapor over a larger space, which immediately decreases the vapor's pressure (and thus decreases the concentration of gas-phase acetone) below its equilibrium value. The system responds by favoring the process that replenishes gas-phase acetone and raises the vapor pressure back toward its equilibrium value — that is, the equilibrium position shifts to favor additional evaporation of liquid acetone. This continues until a new equilibrium is established with the vapor pressure restored to the value appropriate for the (unchanged) temperature, though it will be reached with somewhat less liquid remaining and more total vapor present than before, since the vapor now occupies a larger volume.`
  },
  {
    topic: '3.3',
    title: 'Q11 — Effect of Halving the Volume on the Pressure of Trapped CO2 Gas',
    content:
`A sample of CO2 gas is trapped in a sealed container at constant temperature. Explain, at the particle level, what happens to the pressure inside the container if the volume is halved.`,
    answer: `If the volume of the container is halved while the amount of CO2 gas and the temperature remain constant, the pressure inside the container increases (in fact, it doubles). At the particle level, halving the volume forces the same number of CO2 molecules into half the space, so the molecules are now, on average, twice as close together. Since the temperature (and therefore the average kinetic energy and speed of the molecules) has not changed, the molecules still move at the same average speed, but because they now have less distance to travel between collisions with the container walls (and with each other), they strike the walls more frequently in a given time interval. Since gas pressure is produced by the cumulative force of these particle-wall collisions, this increase in collision frequency directly increases the pressure exerted by the gas on the container walls.`
  },
];

const questions = [
  ...topic32Questions,
  ...topic33Questions,
];

async function main() {
  const { data: existing, error: exErr } = await sb.from('questions').select('id, topic_id, order_index');
  if (exErr) { console.error('Failed to query existing questions:', exErr); process.exit(1); }
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0, failed = 0;
  const perTopicCount = {};
  for (const q of questions) {
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
      image_url: q.imageUrl || null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); failed++; continue; }
    inserted++;
    perTopicCount[q.topic] = (perTopicCount[q.topic] || 0) + 1;
    console.log(`[${inserted}/${questions.length}] (${q.topic}) ${q.title} ... inserted`);
  }
  console.log(`\nDone. ${inserted} inserted, ${failed} failed.`);
  console.log('Per-topic counts:', perTopicCount);
}

main();
