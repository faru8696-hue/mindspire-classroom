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

/* ============================= 3.1 Intermolecular Forces ============================= */
const topic31New = [
  {
    title: 'Q42 — NH3 vs. PH3 Boiling Point',
    content: `Ammonia (NH3) boils at -33°C, while phosphine (PH3) boils at -87°C, even though PH3 has a larger molar mass.

(a) Identify the intermolecular forces present in NH3 and in PH3.
(b) Use these intermolecular forces to explain why NH3 has the higher boiling point.`,
    answer: `(a) NH3: nitrogen is small and highly electronegative, and it is directly bonded to hydrogen, so NH3 molecules experience hydrogen bonding (in addition to dipole-dipole attractions and London dispersion forces). PH3: phosphorus is much larger and less electronegative than nitrogen, so P-H bonds are only weakly polar; PH3 experiences London dispersion forces and only weak dipole-dipole attractions, but not hydrogen bonding.

(b) Hydrogen bonding is a much stronger intermolecular attraction than the ordinary dipole-dipole and dispersion forces present in PH3. Even though PH3 has more electrons and therefore stronger dispersion forces than NH3, the hydrogen bonds between NH3 molecules require significantly more energy to overcome. Since boiling point depends on the strength of intermolecular forces that must be broken for molecules to escape into the gas phase, NH3's hydrogen bonding gives it the higher boiling point despite its smaller size.`,
  },
  {
    title: 'Q43 — CH4 vs. CCl4 Boiling Point',
    content: `Methane (CH4) boils at -161°C, while carbon tetrachloride (CCl4) boils at 77°C. Both molecules are nonpolar and tetrahedral.

Explain, in terms of intermolecular forces, why CCl4 has such a dramatically higher boiling point than CH4.`,
    answer: `Both CH4 and CCl4 are nonpolar (symmetric tetrahedral molecules), so the only intermolecular force present in either is London dispersion forces. CCl4 has far more electrons than CH4 (Cl atoms each contribute 17 electrons vs. H's 1), giving CCl4 a much larger, more polarizable electron cloud. Larger, more polarizable electron clouds allow larger instantaneous and induced dipoles to form, producing stronger London dispersion forces between CCl4 molecules. Since CCl4's dispersion forces are much stronger than CH4's, more energy is required to separate CCl4 molecules into the gas phase, giving CCl4 the much higher boiling point.`,
  },
  {
    title: 'Q44 — CF4 vs. CHF3 Boiling Point (Multiple Choice)',
    mcq: true,
    content: `CF4 boils at -128°C, while CHF3 (fluoroform) boils at -82°C. Both molecules have similar molar mass and similar size.

Which of the following best explains why CHF3 has the higher boiling point?
(A) CHF3 has stronger London dispersion forces because it has more electrons than CF4.
(B) CF4 is a symmetric, nonpolar molecule with only London dispersion forces, while CHF3 is asymmetric and polar, giving it dipole-dipole attractions in addition to dispersion forces.
(C) CHF3 forms hydrogen bonds because it contains a C-H bond.
(D) CF4 has a larger molecular size, which should give it the higher boiling point, so the data must reflect a measurement error.`,
    answer: `Correct answer: (B)

CF4 is tetrahedral with four identical, symmetrically arranged C-F bond dipoles that cancel, making the molecule nonpolar overall; it therefore experiences only London dispersion forces. CHF3 replaces one F with an H, breaking the symmetry — the C-F bond dipoles no longer cancel, so CHF3 has a net molecular dipole. CHF3 therefore experiences dipole-dipole attractions in addition to dispersion forces, giving it stronger overall intermolecular forces and a higher boiling point despite the two molecules having similar size and electron count.

(A) is incorrect because CF4 and CHF3 have essentially the same number of electrons, so their dispersion forces are comparable; the difference in boiling point is due to polarity, not dispersion forces.
(C) is incorrect because hydrogen bonding requires H to be bonded directly to N, O, or F; a C-H bond does not qualify, regardless of the F atoms elsewhere in the molecule.
(D) is incorrect; there is no measurement error, and molecular size is not the deciding factor here since CF4 and CHF3 are comparable in size.`,
  },
  {
    title: 'Q45 — 1-Butanol vs. Diethyl Ether Boiling Point',
    content: `1-Butanol (C4H10O) and diethyl ether (C4H10O) are structural isomers — they have the same molecular formula, but 1-butanol has an -OH group while diethyl ether has an oxygen atom bonded between two carbon chains (C-O-C, no O-H bond). 1-Butanol boils at 117°C, while diethyl ether boils at 34.5°C.

(a) Identify the intermolecular forces present in each isomer.
(b) Justify the difference in their boiling points.`,
    answer: `(a) 1-Butanol has an -OH group, so in addition to London dispersion forces and dipole-dipole attractions, it can form hydrogen bonds (the O-H hydrogen is directly bonded to a highly electronegative O atom). Diethyl ether has a polar C-O-C linkage, so it experiences London dispersion forces and dipole-dipole attractions, but it cannot hydrogen-bond with other diethyl ether molecules because it has no H directly bonded to N, O, or F.

(b) Since 1-butanol and diethyl ether have the same molecular formula, they have essentially the same number of electrons and comparable dispersion forces. The key difference is that 1-butanol molecules can hydrogen-bond to each other, while diethyl ether molecules cannot. Hydrogen bonding is a much stronger attractive force than ordinary dipole-dipole interactions, so significantly more energy is required to separate 1-butanol molecules into the gas phase. This explains why 1-butanol has a much higher boiling point than its structural isomer diethyl ether.`,
  },
  {
    title: 'Q46 — Strongest Ion-Dipole Interaction with Water (Multiple Choice)',
    mcq: true,
    content: `Which of the following ions would be expected to have the strongest ion-dipole interaction with surrounding water molecules?

Ion | Ionic radius | Charge
Tl3+ | 95 pm | +3
Cd2+ | 97 pm | +2
Na+ | 95 pm | +1

(A) Tl3+
(B) Cd2+
(C) Na+
(D) All three ions have equally strong ion-dipole interactions since their radii are similar.`,
    answer: `Correct answer: (A) Tl3+

By Coulomb's law, the strength of an electrostatic (ion-dipole) attraction is proportional to the product of the charges involved and inversely proportional to the distance between them: F ∝ (q1)(q2) / r^2. Tl3+ has the largest charge (+3) of the three ions and one of the smallest radii (95 pm, tied with Na+), so it attracts the partially negative oxygen ends of surrounding water molecules more strongly than either Cd2+ (smaller charge, +2) or Na+ (much smaller charge, +1), even though the radii of all three ions are similar. A larger charge concentrated over a similarly small radius produces a stronger electric field around the ion, so Tl3+ forms the strongest ion-dipole interactions with water.`,
  },
  {
    title: 'Q47 — Identify Molecules Capable of Hydrogen Bonding',
    content: `For each of the following molecules, determine whether it is capable of hydrogen bonding with another molecule of the same kind. Justify each answer based on whether the molecule has a hydrogen atom covalently bonded directly to N, O, or F.

(a) H2S
(b) HCl
(c) C5H12 (pentane)
(d) CH3OH (methanol)
(e) NCl3 (nitrogen trichloride)
(f) CH3NH2 (methylamine)`,
    answer: `(a) H2S: No hydrogen bonding. Sulfur is in the same group as oxygen but is much larger and far less electronegative, so H-S bonds are not polar enough, and S is not one of the three qualifying atoms (N, O, F).

(b) HCl: No hydrogen bonding. Cl is not N, O, or F (despite being electronegative), so H-Cl does not qualify as a hydrogen-bond donor site.

(c) C5H12: No hydrogen bonding. Pentane is a nonpolar hydrocarbon; its only hydrogens are bonded to carbon, not to N, O, or F.

(d) CH3OH: Hydrogen bonding present. The O-H hydrogen is bonded directly to a highly electronegative oxygen atom, so methanol molecules can hydrogen-bond to one another through this O-H group.

(e) NCl3: No hydrogen bonding as a donor (there is no H bonded to the N), although the lone pair on N could theoretically accept a hydrogen bond from a different molecule that has an N-H, O-H, or F-H bond. Since NCl3 has no H atoms at all, it cannot hydrogen-bond with another NCl3 molecule.

(f) CH3NH2: Hydrogen bonding present. The N-H hydrogens are bonded directly to nitrogen, so methylamine molecules can hydrogen-bond to one another through these N-H groups.`,
  },
  {
    title: 'Q48 — Ranking the Boiling Points of Three Pentane Isomers',
    content: `Pentane (C5H12) has three structural isomers: n-pentane (a straight, unbranched chain), isopentane (2-methylbutane, one branch), and neopentane (2,2-dimethylpropane, a compact, highly branched structure). All three are nonpolar and have the same molecular formula.

Rank the three isomers in order of increasing boiling point, and justify your ranking in terms of intermolecular forces.`,
    answer: `Increasing boiling point: neopentane < isopentane < n-pentane.

All three isomers are nonpolar hydrocarbons with the same molecular formula, so they have the same number of electrons and experience only London dispersion forces. The strength of dispersion forces depends on the surface area of contact between molecules, not just the number of electrons. n-Pentane's long, straight chain has the greatest surface area available for contact with neighboring molecules, giving it the strongest net dispersion forces and the highest boiling point (36°C). Neopentane's compact, nearly spherical, highly branched shape has the smallest surface area of contact, so it has the weakest dispersion forces and the lowest boiling point (9.5°C). Isopentane, with one branch, has an intermediate surface area and an intermediate boiling point (28°C), placing it between the other two.`,
  },
  {
    title: 'Q49 — Explaining Why CH4 Has a Higher Vapor Pressure Than NH3',
    content: `At room temperature, methane (CH4) has a much higher vapor pressure than ammonia (NH3), even though the two molecules have similar molar mass (16.04 g/mol vs. 17.03 g/mol).

Use intermolecular forces to explain this difference in vapor pressure.`,
    answer: `Vapor pressure depends on how easily molecules can escape the liquid (or in this case, escape more of the condensed intermolecular attraction) into the gas phase — the weaker the intermolecular forces holding molecules together, the more readily molecules escape into the vapor phase, and the higher the vapor pressure at a given temperature. CH4 is a nonpolar, symmetric tetrahedral molecule, so it experiences only weak London dispersion forces. NH3 is polar and has an N-H bond, so in addition to dispersion forces it experiences dipole-dipole attractions and hydrogen bonding, both of which are considerably stronger than dispersion forces alone. Because NH3 molecules are held together much more strongly than CH4 molecules despite their similar mass, fewer NH3 molecules have enough energy to escape into the gas phase at a given temperature, giving NH3 the lower vapor pressure and CH4 the higher one.`,
  },
];

/* ============================= 3.2 Properties of Solids ============================= */
const topic32New = [
  {
    title: 'Q29 — CO2 vs. SiO2 Melting Point',
    content: `Solid CO2 (dry ice) melts (sublimes) at -78°C, while SiO2 (quartz) melts at 1,650°C, even though both substances are made of only carbon/silicon and oxygen atoms.

(a) Identify the type of solid formed by each substance.
(b) Justify the enormous difference in melting points.`,
    answer: `(a) CO2 is a molecular solid: it is made of discrete CO2 molecules held together in the solid by weak London dispersion forces. SiO2 is a covalent network solid: silicon and oxygen atoms are linked together by a continuous three-dimensional network of covalent Si-O bonds, so the "molecule" is effectively the entire crystal.

(b) In solid CO2, only the weak intermolecular (London dispersion) forces between separate CO2 molecules need to be overcome to melt the solid; because these are the weakest type of intermolecular attraction, only a small amount of energy is required, giving CO2 a very low melting/sublimation point. In SiO2, melting requires breaking strong covalent Si-O bonds throughout the network, since there are no separate "molecules" to begin with — the entire crystal is one covalently bonded network. Because covalent bonds require far more energy to break than intermolecular forces, SiO2 has a dramatically higher melting point than CO2.`,
  },
  {
    title: 'Q30 — Classify and Rank Cl2, Ni, BN, and FeS by Melting Point',
    content: `Classify each of the following as an ionic, molecular, covalent network, or metallic solid, and then arrange them in order of increasing melting point:
Cl2, Ni (nickel metal), BN (boron nitride), FeS (iron(II) sulfide)`,
    answer: `Classification:
- Cl2: molecular solid (discrete nonpolar Cl2 molecules held together by London dispersion forces only)
- Ni: metallic solid (metal atoms held together by delocalized valence electrons)
- BN: covalent network solid (boron and nitrogen, both nonmetals, form a continuous 3-D network of strong covalent bonds, similar to carbon/silicon network solids)
- FeS: ionic solid (metal cation Fe2+ and nonmetal anion S2- held together by electrostatic/ionic attraction)

Order of increasing melting point: Cl2 (molecular, weakest attractions, mp about -101°C) < FeS (ionic, mp about 1,195°C) < Ni (metallic, mp about 1,455°C) < BN (covalent network, mp about 2,973°C).

This follows the general trend that molecular solids have the weakest interparticle attractions (only intermolecular forces need to be broken to melt), while covalent network solids have the strongest (a continuous lattice of covalent bonds must be broken), with ionic and metallic solids generally falling in between.`,
  },
  {
    title: 'Q31 — HBr vs. NaBr Melting Point',
    content: `HBr has a melting point of -87°C, while NaBr has a melting point of 747°C.

(a) Identify the type of solid formed by each substance.
(b) Justify the difference in their melting points.`,
    answer: `(a) HBr is a molecular solid, composed of discrete, covalently-bonded HBr molecules held together by relatively weak intermolecular forces (dipole-dipole attractions and London dispersion forces; HBr cannot hydrogen bond because Br is not N, O, or F). NaBr is an ionic solid, composed of Na+ and Br- ions held together in a lattice by strong electrostatic (ionic) attractions.

(b) Melting HBr only requires overcoming the weak intermolecular forces between separate HBr molecules, which requires relatively little energy, giving it a very low melting point. Melting NaBr requires disrupting the strong ionic bonds holding the Na+ and Br- ions in the lattice; because electrostatic attractions between full ionic charges are much stronger than intermolecular forces between neutral molecules, NaBr requires far more energy (and a much higher temperature) to melt.`,
  },
];

/* ============================= 3.3 Solids, Liquids, and Gases ============================= */
const topic33New = [
  {
    title: 'Q12 — Similar Densities of Solid and Molten Iron',
    content: `Solid iron has a density of 7.874 g/mL, while molten (liquid) iron has a density of 6.98 g/mL — the two densities are much closer to each other than either is to the density of gaseous iron vapor.

Using the particle-level model of solids, liquids, and gases, explain why solid and liquid iron have similar densities, but the gas phase would have a dramatically lower density.`,
    answer: `In both the solid and liquid phases, the iron atoms remain in close contact with each other; intermolecular/interatomic attractions keep the particles packed closely together, whether they are locked into fixed positions (solid, only vibrating) or free to slide past one another (liquid, translating and rotating). Because the particle spacing is similar in the solid and liquid phases, their molar volumes — and therefore their densities — are similar (only slightly lower in the liquid because the particles have gained enough energy to move apart very slightly and pack somewhat less efficiently). In the gas phase, however, the particles have gained enough kinetic energy to almost completely overcome the interatomic attractions; the particles fly apart and occupy a volume far larger than the volume of the particles themselves, with mostly empty space between them. This much larger average spacing between particles in the gas phase is why gases have densities that are orders of magnitude lower than the corresponding solid or liquid.`,
  },
  {
    title: 'Q13 — Particle-Level Description of Water at Its Triple Point',
    content: `The triple point of water is the unique temperature and pressure (273.16 K and 0.6117 kPa) at which solid, liquid, and gaseous water all coexist simultaneously at equilibrium.

Describe, at the particle level, what would be observed in a sealed container of water held at its triple point, including the arrangement and motion of the water molecules in each of the three regions present.`,
    answer: `At the triple point, three distinct regions of H2O would coexist simultaneously in the same sealed container, in dynamic equilibrium with each other: a solid region (ice) where water molecules are arranged in a fixed, ordered crystalline lattice, held closely together by hydrogen bonds, vibrating in place but not translating past one another; a liquid region where water molecules remain in close contact with their neighbors (similar spacing to the solid) but have gained enough kinetic energy to slide, roll, and tumble past one another, giving the liquid a definite volume but no fixed shape; and a gas (vapor) region where water molecules are spaced far apart, moving rapidly and randomly with minimal effect from intermolecular forces, filling the remaining volume in the container. Because the system is at equilibrium, molecules are continuously transitioning between all three phases (melting/freezing at the solid-liquid boundary, evaporating/condensing at the liquid-gas boundary, and subliming/depositing at the solid-gas boundary) at equal rates, so the relative amount of each phase present does not change over time.`,
  },
  {
    title: 'Q14 — Why Gases Behave More Ideally at Low Pressure and High Temperature',
    content: `Gases tend to behave more ideally (more closely follow PV = nRT) when the pressure is low and the temperature is high.

Using a particle-level explanation, describe why low pressure and high temperature conditions cause a real gas to behave more like an ideal gas.`,
    answer: `At low pressure, the gas particles are, on average, spaced far apart from one another because the volume available to the gas is large relative to the number of particles present. At these large separations, both the volume actually occupied by the particles themselves and the intermolecular forces between particles become negligible compared to the volume of the container and the particles' kinetic energy — exactly the two assumptions of the ideal gas law (that particles have no volume and exert no forces on each other). At high temperature, the particles have a large amount of average kinetic energy compared to the (relatively small and roughly constant) strength of the intermolecular attractions between them; this high kinetic energy allows particles to overcome and effectively ignore any weak attractive forces during their fast-moving, frequent collisions with each other and the container walls. Combined, low pressure (large particle spacing) and high temperature (attractions overwhelmed by kinetic energy) together minimize the two main sources of real-gas deviation from ideal behavior — finite particle volume and intermolecular attraction — allowing the gas to behave nearly ideally.`,
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
    await insertTopic('3.1', topic31New);
    await insertTopic('3.2', topic32New);
    await insertTopic('3.3', topic33New);
    console.log('Done batch 1.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
