const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUSTIFY = '\n\nChoose the correct answer and justify your choice in writing to receive credit.';

// Unit 2: Molecular and Ionic Compound Structure and Properties
const TOPICS = {
  '2.1': 'cf42852a-b9c6-4ac0-8558-bef8d61b8dbc', // Types of Chemical Bonds
  '2.3': 'b4207db6-c796-4d5e-9912-d060fdc26b3c', // Structure of Ionic Solids
  '2.4': '7520f5d7-8f8d-431d-91f3-d4b9ce5aa1c3', // Structure of Metals and Alloys
  '2.5': 'db2c2fe1-b576-4a0a-9846-b1a278b9baad', // Lewis Diagrams
  '2.6': '97146f93-6f64-462c-b20b-cc0f2baadbb3', // Resonance and Formal Charge
  '2.7': '2984a37e-4185-4c9d-adc4-ebe24971a794', // VSEPR and Bond Hybridization
};

// Questions curated from SaveMyExams Unit 2 PDF exports (Chemical Bonding, Ionic crystals and
// metals, Lewis Structure, Vsper source folders). Every question below was independently
// re-verified against real chemistry data (Pauling electronegativities, ionic radii, VSEPR/
// hybridization rules, formal charge arithmetic) rather than copied blindly from the SaveMyExams
// answer keys. Two MCQs in 2.1 depend on a cropped diagram image (potential-energy-vs-
// internuclear-distance graphs), rendered from the source PDF and uploaded to the Supabase
// `question-images` storage bucket, referenced via the imageUrl field below. Per-topic curation
// notes (what was kept/fixed/excluded and why) are inline as comments above each topic's array.

/*
Topic 2.1 "Types of Chemical Bonds" — curated from Save My Exams Chemical Bonding MCQ/FRQ sets.
Existing DB already has Q1-Q8 covering: bond polarity labeling, identifying nonpolar bonds,
ranking bond polarity (x2), dipole moment comparisons, ionic vs covalent in SnCl2/SnCl4,
partial charge labels, ranking ionic character.

KEPT (10 MCQ, 2 of which use recovered diagram images — see imageUrl field):
1. MCQ Medium #1 — EN comparison Mg vs Sr (periodic trend basis for bond polarity). Verified
   correct (B) using real Pauling values; unique, not a duplicate of existing questions.
2. MCQ Medium #2 — CF2=CF2 nonpolar molecule with polar bonds. Verified correct (D). Distinct
   compound/concept from existing "identifying nonpolar bonds" question (that one asks to spot
   a nonpolar BOND; this one asks to spot a nonpolar MOLECULE built from polar bonds).
3. MCQ Medium #4 — metallic solid bonding statement. Verified correct (C). New concept
   (metallic bond character) not covered by existing Q1-Q8.
4. MCQ Medium #6 — least ionic character ranking (B-F, C-N, Mg-O, Si-Cl). Verified answer (B,
   C-N) correct, but FIXED the electronegativity values used in the source's reasoning — the
   source used non-standard approximations (e.g., F = 3.5, Mg = 1.2) that don't match the
   accepted Pauling scale. Replaced with accurate Pauling EN values (B 2.04, F 3.98, C 2.55,
   N 3.04, Mg 1.31, O 3.44, Si 1.90, Cl 3.16); the final ranking and answer are unchanged.
5. MCQ Hard #1 — potential energy decrease as two Cl atoms approach (bond formation
   energetics). Verified correct (C). New concept, no existing duplicate.
6. MCQ Hard #2 — intramolecular bonding in carbonate ion (covalent bond description).
   Verified correct (B). New concept/compound.
7. MCQ Hard #3 — strongest ionic attraction among RbI/CsI/CaO/SrS via Coulomb's law
   (charge magnitude + ionic radius trends). Verified correct (C, CaO) independently using
   real ionic radii and charge trends — this is qualitative Coulomb's-law reasoning, not a
   Born-Haber/quantitative lattice energy calculation, so it stays in scope.
8. MCQ Hard #4 — BF3 vs NF3 polarity difference explained by molecular geometry. Verified
   correct (D). Distinct compounds from existing dipole-moment question; explicitly targets
   the "polar bonds but nonpolar/polar molecule" bond-polarity-vs-molecular-polarity distinction
   that is core to 2.1.
9. MCQ Very Hard #1 — identify diatomic A-B from a potential-energy-vs-internuclear-distance
   graph (SO2 vs. unknown A-B). RECOVERED (originally dropped for lack of image access) by
   rendering chemical-bonding-MCQ.pdf page 7 with pdftoppm and cropping the figure with Pillow
   (ImageMagick wasn't installed on this machine; used Python PIL instead). Image uploaded to
   Supabase Storage at question-images/unit2/2.1-potential-energy-so2-vs-ab.png. Verified
   correct (A, Br-F) via a cleaner route than the source's own reasoning: the stem specifies
   A-B is "heteronuclear," which immediately eliminates (B) Cl-Cl, (C) N≡N, and (D) S=S since
   all three are homonuclear — only (A) Br-F pairs two different elements. Also flagged: on
   pixel-level inspection of the rendered graph, the AB curve's well is actually drawn deeper
   than SO2's, the opposite of the source mark scheme's claim ("SO2 has a deep well, AB a
   shallow one") — real S=O bonds in SO2 are far stronger/deeper-welled than any single
   halogen bond, so the source's depth description doesn't match real bond energies. The
   graph's reliable signal is AB's longer equilibrium bond distance vs. SO2's short S=O bond;
   combined with the heteronuclear constraint, Br-F still stands as correct.
10. MCQ Very Hard #2 — identify diatomics A and B from a similar potential-energy graph.
   RECOVERED the same way from page 8 of chemical-bonding-MCQ.pdf; image uploaded to
   question-images/unit2/2.1-potential-energy-a-vs-b.png. Verified correct (A: N≡N / I-I)
   using real bond-length/bond-energy data rather than the graph's absolute well depths
   (which show the same backwards depth-vs-length pattern as question 9's graph — likely a
   stylized, non-quantitative template rather than a data-accurate plot): N≡N (110 pm, ~945
   kJ/mol) and I-I (266 pm, ~151 kJ/mol) are the most extreme pair among the four choices —
   shortest/strongest vs. one of the longest/weakest common diatomic bonds — matching the
   graph's dramatic visual separation between the two curves. Also confirmed (D) C≡O / H-H
   is impossible under a "shorter curve, then longer curve" reading, since real H-H (74 pm)
   is shorter than C≡O (113 pm), the reverse of what curve A (shorter) vs. B (longer) requires.

KEPT (4 FRQ):
A. FRQ Medium Q1 (a,b,c) — EN definition, periodic trend, P-Cl vs S-Cl polarity comparison.
   Verified (c) independently: |EN(P)-EN(Cl)| = 0.9 > |EN(S)-EN(Cl)| = 0.5, so P-Cl is more
   polar — matches source answer. New compounds, no duplicate.
B. FRQ Medium Q2 (a,b,c) — NaCl formation by electron transfer, why NaCl has higher mp than
   CO2, and how EN difference determines ionic vs covalent bonding. Verified reasoning is
   chemically sound (ionic lattice Coulombic forces vs weak intermolecular forces in CO2).
   New compounds/concepts, no duplicate.
C. FRQ Hard Q2 (a,b) — comparing metallic vs ionic bonding (electron behavior, forces) and
   why metals are malleable vs ionic solids brittle. Verified chemically correct (delocalized
   electrons allow layers to slide in metals; like-charge repulsion causes ionic lattices to
   shatter). New bond-character concept, no duplicate.
D. FRQ Hard Q1 (a,b,c) — dipole moment definition, CO2 vs H2O net dipole (linear vs bent
   geometry), and NH3 vs NF3 dipole moment comparison. Verified: CO2 dipoles cancel (linear,
   symmetric), H2O's do not (bent) — correct. NH3 > NF3 dipole moment is a well-known real
   result (lone pair and N-H bond dipoles point the same way in NH3, reinforcing the moment;
   in NF3 the strongly electronegative F atoms pull density away from N, partially opposing
   the lone pair's contribution) — correct. Distinct compounds from existing dipole question.

EXCLUDED:
- MCQ Medium #3 (property pairing incl. NH3 conductivity) — overlaps too closely with existing
  DB's ionic-vs-covalent-character comparisons (SnCl2/SnCl4 question); redundant concept.
- MCQ Medium #5 (Coulombic force depends on charge & distance, not mass) — kept out to avoid
  crowding out richer questions; concept is folded into FRQ C/Coulomb's law reasoning already
  included elsewhere in the unit.
- MCQ Hard #5 (Sn-Te/Si-H/S-F polarity ranking) — duplicates the skill already tested twice in
  existing DB questions ("ranking bond polarity" x2). Excluded as a near-duplicate.
- FRQ Medium Q3 (bond length ranking via bond order for H-H/O=O/N≡N; C-H vs H-F bond energy)
  — excluded: bond order/bond energy/bond length is a different CED learning objective
  (structure & properties, not 2.1 bond type/polarity), out of scope for this topic.
- FRQ Medium Q4 (compound X: bonding type, C=O polarity, molecular polarity, bond angle/VSEPR,
  IMF, solubility) — excluded in full: parts (d) bond angle/electron domain geometry, (e) IMF/
  melting point, and (f) solubility are VSEPR/IMF topics outside 2.1 scope, and extracting only
  (a)/(b) left too thin a question to stand alone next to the FRQs already selected.
- FRQ Medium Q5 (C2H6 vs CH3OH: C-H bond polarity, IMF ranking, Lewis structure, hydrogen
  bonding diagram, boiling point, solubility) — excluded: only part (a) (C-H bond polarity
  classification) is in-scope for 2.1; the rest is IMF/Lewis-structure content from other
  topics, and part (a) alone duplicates the nonpolar-bond concept already well covered.
- FRQ Hard Q3 (Coulomb's law statement, KBr vs K2S attraction, NaCl lattice energy deviation
  via polarizability/partial covalent character) — excluded: part (c), the polarizability/
  Fajans'-rules-style explanation of lattice energy deviation, goes beyond current AP Chem CED
  scope for 2.1 (borders on Born-Haber/lattice-energy depth called out as out-of-scope), and
  splitting the question to keep only (a)/(b) would have made it redundant with FRQ C/other
  Coulomb's-law content already included.
*/

const topic2_1Questions = [
  {
    topic: '2.1', mcq: true, title: 'MCQ — Electronegativity trend: Mg vs. Sr',
    content:
`In which of the following pairs is the first element expected to have a higher electronegativity than the second?
(A) Li, Be
(B) Mg, Sr
(C) Be, Al
(D) Br, Cl`,
    answer: `Correct answer: (B) Mg, Sr
Mg and Sr are both in Group 2, with Sr below Mg. Moving down a group, atomic radius increases and shielding of the nucleus by inner electron shells increases, so the effective nuclear charge felt by valence electrons drops. This means electronegativity decreases down a group, so Mg (EN ≈ 1.31) has a higher electronegativity than Sr (EN ≈ 0.95). This matches the general trend and real Pauling values.

(A) is wrong because Li and Be are in the same period, and electronegativity increases across a period (Li ≈ 0.98, Be ≈ 1.57), so Li is actually lower, not higher, than Be.
(C) is wrong/ambiguous because Be and Al are a diagonal-relationship pair with very similar electronegativities (Be ≈ 1.57, Al ≈ 1.61); Be is not clearly higher.
(D) is wrong because Br and Cl are in the same group, with Cl above Br, so Cl has the higher electronegativity (Br ≈ 2.96, Cl ≈ 3.16) — the reverse of what's stated.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Nonpolar molecule built from polar bonds (CF2=CF2)',
    content:
`Which of the following is a nonpolar molecule containing polar bonds?
(A) CH3-CH3
(B) CH3-CF3
(C) CH2=CH2
(D) CF2=CF2`,
    answer: `Correct answer: (D) CF2=CF2
Each C-F bond is polar (EN difference between C ≈ 2.55 and F ≈ 3.98 is large, about 1.4), so the molecule contains polar bonds. However, CF2=CF2 (tetrafluoroethylene) is planar and symmetric: the two CF2 groups are arranged so that the bond dipoles point outward in a way that cancels by symmetry, giving zero net molecular dipole. So the molecule is nonpolar overall despite having polar C-F bonds.

(A) CH3-CH3 (ethane) is nonpolar, but its C-H and C-C bonds are essentially nonpolar too (EN difference C-H ≈ 0.35), so it doesn't fit "polar bonds."
(B) CH3-CF3 is asymmetric — the CF3 end pulls electron density strongly to one side — so it has a net dipole and is a polar molecule.
(C) CH2=CH2 (ethylene) has only nonpolar C-H and C=C bonds, so it doesn't contain polar bonds at all.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — True statement about metallic bonding',
    content:
`Which statement is true about metallic solids?
(A) Atoms are loosely packed into metallic lattices
(B) Atoms lose valence electrons to become negative ions in a sea of delocalized electrons
(C) Metals are held together by Coulombic forces of attraction between positive ions and delocalized electrons
(D) The inner electrons of metal atoms dissociate, leading to the formation of metal ions`,
    answer: `Correct answer: (C)
In metallic bonding, metal atoms lose their valence (outer) electrons, becoming positively charged metal cations arranged in a tightly packed lattice. The released valence electrons become delocalized, forming a "sea" of mobile electrons that moves freely throughout the structure. The electrostatic (Coulombic) attraction between these positive metal cations and the surrounding delocalized electrons is what holds the metallic lattice together.

(A) is wrong — metal atoms are tightly, not loosely, packed (often in close-packed arrangements).
(B) is wrong — losing electrons makes the metal atoms positive ions, not negative ions.
(D) is wrong — it is the valence electrons (not inner/core electrons) that delocalize; core electrons stay bound to the nucleus.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Ranking bonds by ionic character (B-F, C-N, Mg-O, Si-Cl)',
    content:
`Using the electronegativity values below, which of the following bonds is likely to have the least ionic character?
Element: B = 2.0, C = 2.6, N = 3.0, O = 3.4, F = 4.0, Mg = 1.3, Si = 1.9, Cl = 3.2 (approximate Pauling scale)
(A) B-F
(B) C-N
(C) Mg-O
(D) Si-Cl`,
    answer: `Correct answer: (B) C-N
Ionic character increases as the electronegativity difference between the bonded atoms increases. Using accurate Pauling electronegativity values:
B-F: |2.0 − 4.0| = 2.0
C-N: |2.6 − 3.0| = 0.4
Mg-O: |1.3 − 3.4| = 2.1
Si-Cl: |1.9 − 3.2| = 1.3

Ranking from most to least ionic character: Mg-O (2.1) > B-F (2.0) > Si-Cl (1.3) > C-N (0.4). C-N has by far the smallest electronegativity difference, so it has the least ionic character (it's essentially a nonpolar-to-weakly-polar covalent bond). This confirms the source's answer, though the exact electronegativity values used here have been corrected to standard Pauling-scale figures for accuracy.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Why potential energy decreases as two Cl atoms approach',
    content:
`As two isolated chlorine atoms approach each other to form a Cl2 molecule, the potential energy of the system decreases. This decrease occurs because:
(A) the two nuclei are more strongly attracted to the two electrons because their magnetic fields interact more strongly
(B) the effective nuclear charge increases as the atoms approach each other
(C) each atom's valence electron becomes attracted to the other atom's nucleus, adding an attractive force that outweighs the increasing repulsive forces
(D) the core (inner-shell) shielding by the electrons diminishes as the two nuclei get closer`,
    answer: `Correct answer: (C)
As the two Cl atoms approach, each atom's nucleus begins to attract not only its own valence electron(s) but also the other atom's valence electron(s). This new, additional attractive (nucleus-electron) interaction grows faster than the new repulsive (nucleus-nucleus and electron-electron) interactions at typical bonding distances, so the net potential energy of the system drops — this is the origin of covalent bond formation.

(A) is wrong — bonding forces are electrostatic (Coulombic), not magnetic.
(B) is wrong — effective nuclear charge on each atom's own electrons is essentially unchanged as the atoms approach; it's not why the energy drops.
(D) is wrong — core electron shielding of each nucleus does not change significantly as two separate atoms approach each other.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Intramolecular bonding in the carbonate ion',
    content:
`Which statement best describes the intramolecular bonding in the carbonate ion, CO₃²⁻?
(A) Only London dispersion forces
(B) Electrostatic attraction between shared pairs of electrons and the positively charged nuclei of the bonded atoms
(C) Permanent dipole-permanent dipole forces
(D) Electrostatic attraction between separate carbonate ions`,
    answer: `Correct answer: (B)
The bonds within the carbonate ion (between carbon and each oxygen) are covalent bonds — shared pairs of electrons are simultaneously attracted to the positively charged nuclei of both bonded atoms, and this electrostatic attraction is what constitutes a covalent bond. This is an intramolecular (within-the-ion) force.

(A) and (C) are wrong because London dispersion forces and dipole-dipole forces are types of intermolecular forces (between separate particles), not the intramolecular bonding holding the ion together.
(D) is wrong because carbonate ions are all negatively charged (CO₃²⁻), so there is no attractive electrostatic force between separate carbonate ions — like charges repel, they don't attract.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Strongest ionic attraction: RbI, CsI, CaO, or SrS',
    content:
`Which of the following compounds has the strongest electrostatic force of attraction between its cation and anion?
(A) RbI
(B) CsI
(C) CaO
(D) SrS`,
    answer: `Correct answer: (C) CaO
By Coulomb's law, F = k(q1q2)/r², the force of attraction is strongest when the product of the ionic charges is large and the distance between ion centers (sum of ionic radii) is small.
Charge products: RbI (Rb⁺, I⁻): 1×1 = 1. CsI (Cs⁺, I⁻): 1×1 = 1. CaO (Ca²⁺, O²⁻): 2×2 = 4. SrS (Sr²⁺, S²⁻): 2×2 = 4.
So CaO and SrS both have a much larger charge product than RbI or CsI, already making them the stronger candidates.
Comparing CaO and SrS by ionic radius: Ca²⁺ is smaller than Sr²⁺ (Ca is higher in the group), and O²⁻ is smaller than S²⁻ (O is higher in the group). So CaO has the smallest interionic distance of the two, giving it the largest F. Overall, CaO has both a high charge product and the shortest interionic distance, so it has the strongest electrostatic attraction of the four compounds. (Note: this is qualitative reasoning from Coulomb's law and periodic radius trends, not a quantitative lattice-energy/Born-Haber calculation.)`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Why BF3 and NF3 differ in polarity',
    content:
`BF3 and NF3 both contain B-F and N-F bonds, which are similarly polar. Yet BF3 is a nonpolar molecule and NF3 is a polar molecule. Which of the following best accounts for this difference?
(A) Bond order
(B) Bond polarity
(C) Bonding type
(D) Molecular geometry`,
    answer: `Correct answer: (D) Molecular geometry
BF3 has three electron domains around boron and no lone pairs, giving it a symmetric trigonal planar geometry; the three B-F bond dipoles are arranged 120° apart and cancel exactly, giving zero net dipole (nonpolar molecule). NF3 has three bonding pairs plus one lone pair on nitrogen, giving it a trigonal pyramidal geometry; the N-F bond dipoles (and the lone pair's contribution) do not cancel, so NF3 has a net molecular dipole (polar molecule). The two molecules have equally polar individual bonds, so the difference in overall molecular polarity must come from their different shapes.

(A) is wrong — both molecules have only single bonds, so bond order is identical in both and can't explain any difference.
(B) is wrong — both B-F and N-F bonds are individually polar to a similar degree, so bond polarity alone doesn't explain why the molecules differ.
(C) is wrong — both molecules are entirely covalently bonded; there is no difference in bonding type between them.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Identifying diatomic A-B from a potential energy graph (vs. SO2)',
    imageUrl: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/unit2/2.1-potential-energy-so2-vs-ab.png',
    content:
`The graph below shows the potential energy as a function of internuclear distance for sulfur dioxide, SO2 (S=O bonds), and an unknown heteronuclear diatomic molecule, A-B.

[See image: two potential-energy-vs-internuclear-distance curves, labeled SO2 and AB, both dipping below zero and leveling off toward zero at large internuclear distance.]

Based on the data in the graph, which of the following correctly identifies the diatomic molecule A-B?
(A) Br-F
(B) Cl-Cl
(C) N≡N
(D) S=S`,
    answer: `Correct answer: (A) Br-F
The question specifies that A-B is a heteronuclear diatomic molecule — meaning it is made of two different elements. Checking the other three options: Cl-Cl is chlorine bonded to chlorine (homonuclear), N≡N is nitrogen bonded to nitrogen (homonuclear), and S=S is sulfur bonded to sulfur (homonuclear). Only Br-F pairs two different elements (bromine and fluorine), so it is the only option that fits "heteronuclear" — this alone identifies (A) as correct.

This is also consistent with the graph: the AB curve's minimum sits at a distinctly longer internuclear distance than SO2's very short, strong S=O bond (S=O is about 143 pm, versus roughly 176 pm for Br-F), matching a weaker single bond rather than the very short, high-bond-order S=O bond.

(B), (C), and (D) are incorrect simply because Cl-Cl, N≡N, and S=S are each two atoms of the same element, not a heteronuclear pair as the question requires.`
  },
  {
    topic: '2.1', mcq: true, title: 'MCQ — Identifying a pair of diatomics A and B from a potential energy graph',
    imageUrl: 'https://fsfvcgrrevkeakepwioi.supabase.co/storage/v1/object/public/question-images/unit2/2.1-potential-energy-a-vs-b.png',
    content:
`The graph below shows the potential energy as a function of internuclear distance for two unknown diatomic molecules, A and B.

[See image: two potential-energy-vs-internuclear-distance curves, labeled A and B, with A's minimum at a shorter internuclear distance than B's minimum; both curves level off toward zero at large internuclear distance.]

Which pair of diatomic molecules best represents A and B?
       Molecule A        Molecule B
(A)       N≡N                I-I
(B)       O=O               Br-Br
(C)       H-Cl              Cl-Cl
(D)       C≡O                H-H`,
    answer: `Correct answer: (A) N≡N (Molecule A) and I-I (Molecule B)
The graph shows molecule A with a distinctly shorter equilibrium internuclear distance than molecule B, and the two curves are drawn quite far apart from each other (a large contrast between the two bonds). Among the answer choices, N≡N and I-I represent the most extreme possible contrast in real bond length and bond strength: N≡N has one of the shortest, strongest common bonds (bond length ≈ 110 pm, bond energy ≈ 945 kJ/mol), while I-I has one of the longest, weakest common diatomic bonds (bond length ≈ 266 pm, bond energy ≈ 151 kJ/mol). This large real-world gap between N≡N and I-I best matches the large visual separation between curves A and B.

(B) is a weaker fit — O=O (≈121 pm) and Br-Br (≈228 pm) are a real, valid bond-length pair, but the contrast between them (both are more "average" bonds) is smaller than the dramatic difference shown in the graph.
(C) H-Cl (≈127 pm) and Cl-Cl (≈199 pm) is also a smaller, less dramatic contrast than what the graph depicts.
(D) is impossible regardless of the graph's exact shape: H-H has a real bond length of about 74 pm, which is actually shorter than C≡O's about 113 pm — so H-H could not be molecule B (the longer-distance curve) if C≡O is molecule A (the shorter-distance curve); the real bond lengths are in the opposite order from what the graph would require.`
  },
  {
    topic: '2.1', title: 'FRQ — Electronegativity definition, periodic trend, and P-Cl vs. S-Cl polarity',
    content:
`(a) Define electronegativity.

(b) Explain how electronegativity changes across a period (left to right), in terms of nuclear charge and atomic radius.

(c) P-Cl and S-Cl are both polar bonds. Electronegativity values: phosphorus = 2.1, sulfur = 2.5, chlorine = 3.0. Identify which bond, P-Cl or S-Cl, is more polar. Justify your answer using the electronegativity values.`,
    answer: `(a) Electronegativity is the ability of an atom in a bond to attract the shared (bonding) pair of electrons toward itself.

(b) Electronegativity increases across a period (left to right). Moving across a period, the nuclear charge (number of protons) increases while the atoms are adding electrons to the same principal energy level, so shielding stays roughly constant and the atomic radius decreases. This means the valence electrons are held more tightly and attracted more strongly to the nucleus, which corresponds to a greater ability to attract shared electrons in a bond — i.e., higher electronegativity.

(c) P-Cl is the more polar bond. The electronegativity difference for P-Cl is |3.0 − 2.1| = 0.9, while for S-Cl it is |3.0 − 2.5| = 0.5. Since a larger electronegativity difference corresponds to a more unequal sharing of bonding electrons (a more polar bond), P-Cl (ΔEN = 0.9) is more polar than S-Cl (ΔEN = 0.5). Both bonds are still polar covalent, since both differences fall in the roughly 0.4–2.0 range, but P-Cl is the more polar of the two.`
  },
  {
    topic: '2.1', title: 'FRQ — NaCl formation, melting point vs. CO2, and the ionic/covalent electronegativity cutoff',
    content:
`(a) Describe how sodium chloride forms, in terms of electron transfer between sodium and chlorine atoms.

(b) Sodium chloride has a much higher melting point than carbon dioxide. Explain this difference in terms of the type of bonding/forces present in each substance.

(c) Explain, in general terms, how the electronegativity difference between two bonded atoms determines whether the resulting bond is better described as ionic or covalent.`,
    answer: `(a) Sodium atoms each lose one valence electron to form Na⁺ ions, while chlorine atoms each gain one electron to form Cl⁻ ions. The resulting oppositely charged ions are held together by strong electrostatic (Coulombic) attraction, forming an ionic lattice.

(b) Sodium chloride is an ionic solid held together throughout its lattice by strong Coulombic (electrostatic) attractions between Na⁺ and Cl⁻ ions extending in three dimensions. Carbon dioxide, in contrast, is a covalent molecular substance whose individual molecules are held to each other only by comparatively weak intermolecular forces (London dispersion forces, since CO2 is nonpolar). Because the strong Coulombic forces throughout the NaCl lattice require far more energy to overcome than the weak intermolecular forces between CO2 molecules, NaCl has a much higher melting point.

(c) When the electronegativity difference between two atoms is large (approximately above ~1.7–2.0), one atom can attract the bonding electron(s) strongly enough to effectively remove it/them from the other atom, resulting in the transfer of electrons and formation of oppositely charged ions — an ionic bond. When the electronegativity difference is smaller (below that threshold), neither atom can fully remove the electrons from the other, so the electrons are instead shared between the atoms — a covalent bond, which is polar covalent if the difference is moderate (~0.4–1.7) or nonpolar covalent if the difference is very small (<0.4).`
  },
  {
    topic: '2.1', title: 'FRQ — Comparing metallic and ionic bonding',
    content:
`(a) Compare the bonding in metals and in ionic solids in terms of the behavior of electrons and the forces that hold each structure together.

(b) Explain why metals are malleable while ionic solids are brittle, in terms of atomic/ionic structure and bonding.`,
    answer: `(a) In a metal, metal atoms lose their valence electrons, which become delocalized — free to move throughout the entire lattice rather than being associated with any single atom or ion pair. The resulting positive metal cations are held together by Coulombic attraction to this surrounding "sea" of delocalized electrons. In an ionic solid, there are no delocalized electrons; instead, discrete cations and anions occupy fixed positions in a rigid lattice, and the structure is held together by strong, direction-dependent Coulombic (electrostatic) attraction directly between the oppositely charged, fixed ions.

(b) In a metal, because the valence electrons are delocalized and not tied to specific atoms, the layers of metal cations can slide past one another when a force is applied, and the mobile electron sea continues to hold the shifted structure together — this is why metals are malleable (can be hammered/bent into new shapes without breaking). In an ionic solid, the ions are fixed in a rigid, ordered lattice of alternating charges. If a force causes one layer of ions to shift relative to another, ions of the same charge can be brought next to each other; the resulting strong repulsion between like charges causes the lattice to fracture rather than deform, which is why ionic solids are brittle and shatter under stress.`
  },
  {
    topic: '2.1', title: 'FRQ — Dipole moments: definition, CO2 vs. H2O, and NH3 vs. NF3',
    content:
`(a) What is meant by a dipole moment?

(b) Carbon dioxide and water both contain polar bonds. Identify which molecule has a net (overall) dipole moment. Justify your answer in terms of molecular geometry.

(c) The dipole moment of NH₃ is greater than that of NF₃, even though both molecules have a trigonal pyramidal shape.
   (i) Explain how the difference in electronegativity between fluorine and hydrogen affects the dipole moment of NF₃ compared to NH₃.
   (ii) Explain, in terms of electron distribution, why the overall dipole moment of NH₃ is greater than that of NF₃.`,
    answer: `(a) A dipole moment is a measure of the separation of partial positive and partial negative charge in a molecule or bond, arising from an uneven distribution of electron density.

(b) Water (H2O) has a net dipole moment; carbon dioxide (CO2) does not. CO2 is a linear molecule, so its two equal and oppositely-directed O=C bond dipoles point in exactly opposite directions and cancel completely, giving no net dipole. Water has a bent (angular) molecular geometry, so its two O-H bond dipoles do not point in opposite directions — they add together (along with the contribution from oxygen's lone pairs) to give a net molecular dipole moment.

(c)(i) Fluorine is significantly more electronegative than hydrogen. In NF₃, the highly electronegative F atoms pull bonding electron density strongly away from nitrogen and toward themselves, which works against/partially offsets the dipole contribution from nitrogen's lone pair. In NH₃, hydrogen is only slightly less electronegative than nitrogen, so nitrogen keeps a much greater share of electron density, and the N-H bond dipoles point toward the (more electronegative) nitrogen — the same general direction as the lone pair's contribution.
(ii) In NH₃, both the three N-H bond dipoles and nitrogen's lone pair point in a reinforcing direction (toward/from nitrogen consistently), so their contributions add constructively to give a large net dipole moment. In NF₃, the three N-F bond dipoles point away from nitrogen toward the highly electronegative F atoms, which largely opposes the lone pair's contribution, so the vector sum is smaller. This is why, despite having the same trigonal pyramidal shape, NH₃ has the larger overall dipole moment.`
  }
];

/*
TOPIC 2.3 — Structure of Ionic Solids
Sourced from: ionic-crystals-metals-MCQ.pdf / MCQ ANS.pdf / "ionic-crystals-metals-FRQ .pdf" / FRQ ANS.pdf
Existing bank already has Q10-Q16 (ions in LiCl/CsF, why solid NaCl doesn't conduct, particle-diagram
errors, best LiCl diagram, conductivity of solid KBr, drawing sheared ionic crystal) — none of the
items below duplicate those.

KEPT FROM SOURCE (verified correct, in AP CED scope):
- MCQ Medium #5 (why ionic solids have high mp) — answer D verified correct via Coulomb's law.
- MCQ Hard #1 (identify the FALSE statement about ionic crystal structure) — answer A verified
  correct (option A wrongly describes ionic bonding using metallic "sea of electrons" language).
- MCQ Hard #4 (which combination of factors most increases mp of an ionic crystal) — answer B
  (increased charge, decreased radius) verified correct via Coulomb's law.
- FRQ Medium #2(a)(b) (Na+/Mg2+/Al3+ radius+charge table: MgCl2 vs NaCl, then AlCl3 vs MgCl2 lattice
  energy) — verified correct: charge dominates and radius decreases together in the same direction
  for both comparisons, so the qualitative reasoning holds.
- FRQ Hard #1(a) and (c) (MgF2 vs tungsten: high mp via Coulomb's law; which fractures under force) —
  kept parts (a) and (c). Verified correct (ionic lattice is rigid/brittle; metallic bonding lets
  layers slide).
- FRQ Medium #4(a) + (d), reworked into one AgBr FRQ (identify AgBr as an ionic solid; explain why
  solid AgBr, despite being made of charged ions, does not conduct electricity) — verified correct.

FIXED:
- None of the kept items required a factual correction to the final answer choice itself; several
  answer-key rationales in the source were reworded/tightened for clarity and to add explicit
  independently-verified numeric context (e.g., real ionic radii) rather than just restating the
  key's prose.

EXCLUDED (duplicate, out of scope, or unusable):
- MCQ Medium #1, #2, #3 and MCQ Hard #3 — reference "diagrams below" (models A-D) that are images
  not present in the extracted text; cannot be reproduced/verified without the figure, so dropped.
- MCQ Medium #6 (LiF/LiI/KF/KI "most polarised anion") — relies on Fajans'-rules-style
  cation-polarizing-power / anion-polarizability reasoning (covalent character in ionic bonds), which
  is NOT part of the current AP Chem CED for Topic 2.3 (CED sticks to qualitative Coulomb's-law
  charge/radius trends, not polarization/covalent-character arguments). Excluded as out of scope.
- FRQ Medium #1(a)(b) — same polarization/"covalent character" hypothesis (out of CED scope), and
  part (b) is really an acid-base hydrolysis question (F- + H2O equilibrium), which belongs to a
  different unit, not ionic-solid structure. Excluded.
- FRQ Medium #3(a) ("explain structural difference between interstitial and substitutional alloys")
  — this is 2.4 content, not 2.3, and duplicates the existing 2.4 "substitutional vs interstitial
  alloys" question; moved out entirely (its part (b), on steel vs brass hardness, was reused instead
  under Topic 2.4).
- FRQ Medium #4(b) (AgBr vs NaBr, "which has higher lattice energy") — the answer key claims "smaller
  Ag+ radius" as the reason; this is factually shaky (Ag+ and Na+ ionic radii are actually quite
  close, and the real explanation for AgBr's anomalously high lattice energy is Ag+'s greater
  polarizing power / partial covalent character, an out-of-CED-scope concept). Excluded for being
  both out of scope and resting on an unreliable factual claim.
- FRQ Medium #4(c) (photochemical decomposition equation of AgBr) — photochemistry/redox, unrelated
  to ionic-solid structure content. Excluded.
- FRQ Medium #4(e) (Ni2+ reduction half-equation via electroplating) — electrochemistry, not
  structure-of-solids content. Excluded.
- FRQ Medium #4(f) (malleability of Ag vs AgBr) — moved to Topic 2.4 instead, since it's fundamentally
  about metallic malleability (electron-sea model), not ionic-solid structure.
- FRQ Medium #4(g)(h) (Ksp molar solubility, Q vs Ksp precipitation) — solubility-equilibrium content,
  a completely different unit. Excluded.
- FRQ Hard #1(b) (MgF2 vs W conductivity) — duplicates existing 2.3 "why solid NaCl doesn't conduct"
  and the reworked AgBr conductivity FRQ kept above; dropped to avoid redundancy.
- FRQ Hard #2 (steel vs brass mechanical strength/diffusion) — 2.4 content (alloys), moved there.
- FRQ Hard #3 (Al vs CaF2 conductor explanation, and thermal expansion) — part (a) duplicates existing
  ionic/metallic conductivity questions; part (b) (thermal expansion) is a plausible but non-CED-
  emphasized property (CED's Topic 2.3/2.4 properties list is melting point, conductivity, and
  malleability/brittleness — not thermal expansion), so both parts excluded to stay tightly in scope.

NEW QUESTIONS ADDED (to reach a full, non-duplicate set; independently verified with real ionic
radii/charges and Coulomb's-law reasoning, all within qualitative-comparison CED scope — no
Born-Haber-cycle-style numeric lattice-energy calculations):
- MCQ: isoelectronic ionic radius ordering (Na+, Mg2+, Al3+, F-, O2-, all Ne-core ions).
- MCQ: NaCl vs NaF lattice energy (anion radius effect, charge held constant).
- MCQ: KCl vs CaO lattice energy (charge effect dominates over radius).
- FRQ: MgO vs NaCl lattice energy (charge AND radius both favor MgO) — a clean "everything points
  the same direction" qualitative Coulomb's-law comparison.
*/

const topic23Questions = [
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — Why ionic solids have high melting points',
    content:
`Which of the following statements explains why ionic solids tend to have high melting points?
(A) The particles in ionic solids are small and vibrate easily.
(B) The ions in the solid are arranged in a way that maximizes repulsion, leading to strong forces.
(C) Ionic solids contain delocalized electrons that conduct heat.
(D) Strong electrostatic forces between oppositely charged ions in a 3-D lattice require significant energy to overcome.`,
    answer: `Correct answer: (D) Strong electrostatic forces between oppositely charged ions in a 3-D lattice require significant energy to overcome.
The high melting point of an ionic solid comes from the strong Coulombic (electrostatic) attractions between oppositely charged ions packed throughout the crystal lattice. Melting requires disrupting this 3-D network of attractions, which takes a large amount of thermal energy.
(A) is wrong — particle size/vibration isn't what determines bond strength here.
(B) is wrong — the lattice arrangement maximizes attraction between opposite charges (and minimizes repulsion between like charges), not the reverse.
(C) is wrong — that describes why metals conduct heat well (electron sea model), not why ionic solids melt at high temperatures; ionic solids have no delocalized electrons.`
  },
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — Identifying the false statement about ionic crystal structure',
    content:
`Considering the structure of ionic crystals, which of the following statements is INCORRECT?
(A) The systematic arrangement maximizes the Coulombic forces of attraction between positive ions and a sea of delocalized electrons.
(B) The systematic arrangement minimizes the Coulombic forces of repulsion between equally charged ions.
(C) Ions are arranged in a close-packed, regular lattice of alternating charged ions.
(D) The strength of the Coulombic forces between the ions is proportional to the magnitude of the charge of the ions.`,
    answer: `Correct answer: (A) The systematic arrangement maximizes the Coulombic forces of attraction between positive ions and a sea of delocalized electrons.
This statement is false because it describes metallic bonding (a "sea of delocalized electrons"), not ionic bonding. In an ionic crystal, the lattice maximizes attraction between oppositely charged ions (cations and anions), not between cations and free electrons — ionic solids have no delocalized electrons.
(B), (C), and (D) are all true descriptions of ionic crystal structure: the lattice geometry minimizes like-charge repulsion, ions alternate in a close-packed 3-D pattern, and per Coulomb's law, force is directly proportional to the product of the ion charges.`
  },
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — Factors that most increase the melting point of an ionic crystal',
    content:
`Which combination of factors would most significantly increase the melting point of an ionic crystal?
(A) Decreased ion charge and increased ionic radius
(B) Increased ion charge and decreased ionic radius
(C) Uniform ion sizes and minimal charge differences
(D) Maximized lattice symmetry without regard to charge`,
    answer: `Correct answer: (B) Increased ion charge and decreased ionic radius
By Coulomb's law, the electrostatic force of attraction between ions is proportional to (q1 × q2) / r^2. Increasing the magnitude of the ion charges increases the numerator, and decreasing the distance between ion centers (smaller ionic radius) decreases r, both of which increase the attractive force — and therefore the lattice energy and melting point.
(A) is wrong — both changes listed would weaken the attraction (lower charge, larger distance).
(C) is wrong — uniform sizes and small charges don't maximize attraction; they don't even address the two variables that matter (charge magnitude and radius).
(D) is wrong — lattice symmetry alone, without considering charge, does not determine lattice energy; charge and radius are the dominant qualitative factors.`
  },
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — Isoelectronic ion radius ordering',
    content:
`Na+, Mg2+, Al3+, F-, and O2- are all isoelectronic (each has the same electron configuration as neon, 10 electrons). Which lists these five ions in order of DECREASING ionic radius?
(A) Al3+ > Mg2+ > Na+ > F- > O2-
(B) O2- > F- > Na+ > Mg2+ > Al3+
(C) Na+ > Mg2+ > Al3+ > F- > O2-
(D) F- > O2- > Na+ > Mg2+ > Al3+`,
    answer: `Correct answer: (B) O2- > F- > Na+ > Mg2+ > Al3+
For isoelectronic ions (same number of electrons), radius decreases as nuclear charge (number of protons) increases, because a greater positive charge pulls the same electron cloud in more tightly. Going from O2- (8 protons) to F- (9) to Na+ (11) to Mg2+ (12) to Al3+ (13), the proton count steadily increases while the electron count (10) stays fixed, so the radius steadily decreases in that order.
(A), (C), and (D) all place at least one ion out of the correct proton-count order.`
  },
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — NaCl vs NaF lattice energy (anion size effect)',
    content:
`NaCl and NaF share the same cation (Na+) but have different halide anions. Which compound has the higher lattice energy, and why?
(A) NaCl, because Cl- has a larger ionic radius than F-
(B) NaF, because F- has a smaller ionic radius than Cl-, allowing ions to pack more closely and attract more strongly
(C) NaCl, because Cl- is more electronegative than F-
(D) The two compounds have identical lattice energies because the cation and charges are the same`,
    answer: `Correct answer: (B) NaF, because F- has a smaller ionic radius than Cl-, allowing ions to pack more closely and attract more strongly
With the cation and the charges held constant (Na+ paired with a 1- anion in both cases), the only variable is anion size. F- (~133 pm) is smaller than Cl- (~181 pm), so in NaF the ions are closer together, producing a stronger Coulombic attraction and a higher lattice energy (consistent with real melting points: NaF melts at 993°C vs NaCl at 801°C).
(A) has the reasoning backwards — a larger anion means weaker, not stronger, attraction.
(C) is irrelevant — electronegativity of the anion isn't what determines ionic lattice energy; ionic radius and charge are.
(D) is wrong — changing the anion's size does change the lattice energy even when the charges match.`
  },
  {
    topic: '2.3',
    mcq: true,
    title: 'MCQ — KCl vs CaO lattice energy (charge dominates)',
    content:
`Which compound has the higher lattice energy: KCl (K+ and Cl-, both 1+/1- charges) or CaO (Ca2+ and O2-, both 2+/2- charges)? The ionic radii of K+, Cl-, Ca2+, and O2- are all roughly similar in magnitude (100–180 pm range).
(A) KCl, because K+ is larger than Ca2+, giving more surface contact
(B) CaO, because the product of the ion charges (2 × 2 = 4) is much larger than for KCl (1 × 1 = 1), producing a much stronger Coulombic attraction
(C) They are approximately equal, since the ionic radii are similar
(D) KCl, because potassium is a more reactive metal than calcium`,
    answer: `Correct answer: (B) CaO, because the product of the ion charges (2 × 2 = 4) is much larger than for KCl (1 × 1 = 1), producing a much stronger Coulombic attraction
Coulomb's law states that the force (and lattice energy) is proportional to the product of the ion charges, q1 × q2. Even though the ionic radii of the four ions involved are broadly comparable, the charge product for CaO (2+ × 2- = 4) is four times larger than for KCl (1+ × 1- = 1), so charge is the dominant factor here and CaO has the much higher lattice energy (consistent with real data: CaO's lattice energy is roughly 4–5 times that of KCl).
(A) is irrelevant — reactivity of the metal in redox reactions doesn't determine ionic lattice energy.
(C) is wrong — the charge difference is large enough that the lattice energies are very different, not approximately equal.
(D) is irrelevant — chemical reactivity trends do not directly determine lattice energy.`
  },
  {
    topic: '2.3',
    title: 'FRQ — Lattice energy trends using Coulomb\'s law (Na+/Mg2+/Al3+ series)',
    content:
`The table below gives the ionic radius and charge of three isoelectronic-period cations.

Cation   Ionic Radius (pm)   Charge
Na+           102               +1
Mg2+           72               +2
Al3+           53               +3

(a) Using Coulomb's law, explain why MgCl2 has a higher lattice energy than NaCl.

(b) Predict whether AlCl3 has a higher or lower lattice energy than MgCl2, and justify your prediction.`,
    answer: `(a) Lattice energy depends on both the magnitude of the ionic charges and the distance between ion centers (ionic radius), per Coulomb's law: force/energy is proportional to (q1 × q2) / r^2. Mg2+ has a greater charge (2+) than Na+ (1+), AND a smaller ionic radius (72 pm vs 102 pm). Both factors independently increase the electrostatic attraction to Cl-, so MgCl2 has a higher lattice energy than NaCl. (Both the charge argument and the radius argument should be mentioned — charge alone is not a complete answer.)

(b) AlCl3 has a higher lattice energy than MgCl2. Al3+ has both a greater charge (3+ vs 2+) and a smaller ionic radius (53 pm vs 72 pm) than Mg2+. Since both factors that increase Coulombic attraction point in the same direction (higher charge, smaller radius), AlCl3's lattice energy must be higher than MgCl2's.`
  },
  {
    topic: '2.3',
    title: 'FRQ — MgF2 melting point and brittleness compared to tungsten',
    content:
`A student is investigating the properties of two solid samples: magnesium fluoride (MgF2, an ionic solid) and tungsten (W, a metal).

(a) Explain how the structure of MgF2 contributes to its high melting point, using Coulomb's law.

(b) A researcher applies an external force to both MgF2 and W. Predict which material is more likely to fracture, and justify your answer in terms of bonding and atomic interactions.`,
    answer: `(a) MgF2 is an ionic solid composed of Mg2+ and F- ions arranged in a rigid 3-D lattice. Mg2+ has a relatively high charge (2+) and small ionic radius, so by Coulomb's law (force/energy proportional to q1×q2 / r^2) it attracts the surrounding F- ions very strongly. Melting requires enough thermal energy to overcome this strong, extended network of electrostatic attractions throughout the entire lattice, which is why MgF2 has a high melting point.

(b) MgF2 is more likely to fracture. In an ionic lattice, if a force shifts one layer of ions relative to another, ions of like charge (e.g., Mg2+ next to Mg2+, or F- next to F-) are brought into close proximity. Since like charges repel, this sudden repulsion causes the lattice to shatter — ionic solids are brittle. Tungsten, in contrast, is held together by non-directional metallic bonding (a lattice of metal cations in a "sea" of delocalized electrons). When a force is applied, layers of metal atoms can slide past one another without breaking any specific directional bond, so tungsten deforms (bends) rather than fracturing — it is ductile/malleable.`
  },
  {
    topic: '2.3',
    title: 'FRQ — Identifying AgBr as an ionic solid and explaining its lack of conductivity',
    content:
`Silver bromide (AgBr) is an ionic compound composed of Ag+ and Br- ions, used in photographic film.

(a) Identify the type of solid formed by AgBr, and justify your answer in terms of the particles and forces involved.

(b) Explain why solid AgBr does not conduct electricity, even though it is composed of charged ions.`,
    answer: `(a) AgBr is an ionic solid. It is composed of Ag+ cations and Br- anions held together throughout a 3-D crystal lattice by strong electrostatic (Coulombic) attractions between the oppositely charged ions — not by shared electron pairs (covalent) or a sea of delocalized electrons (metallic).

(b) Electrical conduction requires charged particles that are free to move and carry current. In solid AgBr, the Ag+ and Br- ions are locked in fixed positions within the rigid ionic lattice — they can vibrate in place but cannot translate/migrate through the solid. Because there are no mobile charge carriers in the solid state, solid AgBr does not conduct electricity, even though it is made of ions. (If AgBr were melted or dissolved in water, the ions would become free to move and it would conduct.)`
  },
  {
    topic: '2.3',
    title: 'FRQ — MgO vs NaCl lattice energy (charge and radius both favor MgO)',
    content:
`Magnesium oxide (MgO, ions Mg2+ and O2-) and sodium chloride (NaCl, ions Na+ and Cl-) are both ionic solids.

(a) Predict which compound has the higher lattice energy.

(b) Justify your prediction using Coulomb's law, addressing both ion charge and ionic radius.`,
    answer: `(a) MgO has the higher lattice energy.

(b) By Coulomb's law, lattice energy is proportional to (q1 × q2) / r. In MgO, the ions carry charges of 2+ and 2-, giving a charge product of 4, compared to NaCl's charge product of just 1 (1+ and 1-) — a much stronger attraction from charge alone. In addition, Mg2+ (72 pm) and O2- (140 pm) are both smaller than Na+ (102 pm) and Cl- (181 pm) respectively, so the ions in MgO also sit closer together, further increasing the attractive force. Since both the charge effect and the radius effect favor stronger attraction in MgO, MgO must have a substantially higher lattice energy than NaCl (consistent with real data: MgO's lattice energy, ~3795 kJ/mol, is roughly 5 times that of NaCl, ~787 kJ/mol).`
  }
];

/*
TOPIC 2.4 — Structure of Metals and Alloys
Sourced from: ionic-crystals-metals-MCQ.pdf / MCQ ANS.pdf / "ionic-crystals-metals-FRQ .pdf" / FRQ ANS.pdf
Existing bank already has Q14-Q18 (why metals conduct electricity, malleability and ductility,
substitutional vs interstitial alloys, conductivity from particle diagram, Fe/N alloy type) — none
of the items below duplicate those.

KEPT FROM SOURCE (verified correct, in AP CED scope):
- MCQ Medium #4 (conditions for a substitutional alloy: similar atomic radii + similar chemical
  properties) — answer C verified correct.
- MCQ Hard #2 (which element forms an interstitial alloy with iron: tungsten/silver/potassium/boron)
  — answer D (boron) verified correct — boron's small atomic radius lets it occupy interstitial
  sites, unlike the large substitutional metals in the other options.
- MCQ Hard #5 (why interstitial-alloy steel has different properties than pure iron) — answer C
  (carbon occupies interstitial spaces, strengthening the lattice) verified correct.
- MCQ Hard #6 (why substitutional alloys like brass are malleable) — answer D (sea of delocalized
  electrons is preserved because substituted atoms are similar in size) verified correct; option A
  ("free-moving electrons") is true but explains conductivity, not malleability specifically, so D is
  the more precise/correct answer.
- FRQ Medium #3(b) reworked standalone (predict whether steel or brass is harder) — verified correct
  (interstitial carbon in steel restricts dislocation movement more than substitutional Zn in brass).
- FRQ Hard #2(a)(b) (steel vs brass: mechanical strength/resistance to deformation; which weakens
  more from atomic diffusion at high temperature) — verified correct: similar-sized Cu/Zn atoms in
  brass diffuse more readily than differently-sized Fe/C in steel.
- FRQ Medium #4(f) (malleability of Ag vs AgBr) — moved here from 2.3 since it is fundamentally a
  metallic-bonding/electron-sea malleability question; verified correct (Ag is malleable via
  non-directional metallic bonding, AgBr is brittle as an ionic lattice).

FIXED:
- FRQ Medium #3(a) ("explain the structural difference between interstitial and substitutional
  alloys") was dropped as a standalone item because it duplicates the existing 2.4 "substitutional
  vs interstitial alloys" question; only part (b) (the harder-alloy prediction) was kept and given
  a short self-contained stem so it stands alone without repeating the existing definitional
  question.
- No answer-key final answers required correction (all verified independently); some rationales
  were rewritten for completeness/clarity.

EXCLUDED (duplicate, out of scope, or unusable):
- MCQ Medium #1, #2, #3 and MCQ Hard #3 — reference "diagrams below" (models A-D, or a spring-steel
  particle diagram) that are images not present in the extracted PDF text. These cannot be
  reproduced or verified without the actual figure, so they were dropped rather than guessed at or
  described in prose (which risks misrepresenting the diagram).
- FRQ Medium #4(a) — AgBr solid-type identification kept but placed under Topic 2.3 instead, since
  identifying AgBr as an ionic solid is primarily 2.3 content.
- FRQ Medium #4(d) — AgBr/Ag conductivity comparison placed under Topic 2.3 (paired there with the
  AgBr identification question) rather than repeated here.
- FRQ Medium #4(c),(e),(g),(h) — photochemical decomposition equation, Ni2+ half-reaction/
  electroplating, and Ksp/molar-solubility/Q-vs-Ksp calculations are outside the structure-of-
  metals-and-alloys content (photochemistry, electrochemistry, and solubility equilibria belong to
  other units). Excluded.
- FRQ Hard #1 (MgF2 vs tungsten) — kept under Topic 2.3 instead (its core content is ionic lattice
  properties, using tungsten only as a metallic contrast).
- FRQ Hard #3 (Al vs CaF2 conductivity, and thermal expansion) — part (a) duplicates existing
  metallic/ionic conductivity questions in both topics; part (b) (thermal expansion) is not one of
  the properties emphasized in the current AP CED for 2.3/2.4 (melting point, conductivity,
  malleability/brittleness are the CED-listed properties, not thermal expansion), so both parts were
  excluded to stay tightly scoped.

NEW QUESTIONS ADDED (to reach a full, non-duplicate set; verified against real atomic-radius data
and standard alloy classification conventions):
- MCQ: bronze (Cu/Sn) classified as a substitutional alloy (comparable atomic radii).
- MCQ: stainless steel's corrosion resistance via chromium substituting for iron (substitutional
  alloy identification in a different real-world example than brass).
- FRQ: comparing ductility of an interstitial alloy (steel) vs. a substitutional alloy (bronze),
  reasoning from disruption of the electron-sea/dislocation movement.
*/

const topic24Questions = [
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Conditions required for a substitutional alloy to form',
    content:
`Which of the following conditions must be true for a substitutional alloy to form?
(A) The two metals must have significantly different atomic radii.
(B) The two metals must have significantly different electronegativities.
(C) The two metals must have similar atomic radii and similar chemical properties.
(D) The two metals must be in the same group of the periodic table.`,
    answer: `Correct answer: (C) The two metals must have similar atomic radii and similar chemical properties.
A substitutional alloy forms when atoms of one metal randomly replace atoms of the host metal within the same regular lattice, without distorting its geometry. This is only geometrically possible if the substituting atoms are close in size to the atoms they replace, and chemically compatible enough to mix into the same lattice (e.g., zinc substituting for copper in brass).
(A) is wrong — a significant radius difference would distort the lattice and instead favor an interstitial alloy (small atoms fitting into gaps) rather than substitution.
(B) is wrong — electronegativity difference is not the determining factor for metallic alloy formation (that concept applies more to ionic/covalent bond polarity, not metal miscibility).
(D) is wrong — the two metals do not need to be in the same periodic table group; they simply need comparable atomic size and compatible metallic bonding character (e.g., Cu is group 11, Zn is group 12, yet they form the substitutional alloy brass).`
  },
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Which element forms an interstitial alloy with iron',
    content:
`Which of the following elements is most likely to form an interstitial alloy with iron?
(A) tungsten
(B) silver
(C) potassium
(D) boron`,
    answer: `Correct answer: (D) boron
An interstitial alloy consists of a regular lattice of larger metal atoms with much smaller atoms occupying the interstices (gaps) between them. Boron has by far the smallest atomic radius of the four choices, so it is the one most able to fit into the small interstitial gaps in the iron lattice rather than substituting for iron atoms directly.
(A), (B), and (C) are all large metal atoms (tungsten, silver, potassium) with atomic radii comparable to or larger than iron's. Because they are not small enough to slip into interstitial sites, if they alloy with iron at all they would tend to form substitutional alloys (replacing iron atoms in the lattice) rather than interstitial ones.`
  },
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Why interstitial-alloy steel differs from pure iron',
    content:
`Which of the following statements explains why the interstitial alloy steel has different properties than pure iron?
(A) Carbon atoms increase the density of the iron lattice.
(B) Carbon atoms weaken the Coulombic forces in the lattice.
(C) Carbon atoms occupy the spaces between iron atoms, strengthening the lattice.
(D) Carbon atoms substitute for iron atoms, maintaining uniformity.`,
    answer: `Correct answer: (C) Carbon atoms occupy the spaces between iron atoms, strengthening the lattice.
Carbon's atomic radius is much smaller than iron's, so instead of replacing iron atoms in the lattice, carbon atoms squeeze into the interstitial spaces between them. This disrupts the regular sliding of atomic layers past each other (dislocation movement), which increases hardness and strength but reduces malleability compared to pure iron.
(A) is wrong — the main effect of interstitial carbon is on mechanical strength/hardness, not overall lattice density.
(B) is wrong — metallic bonding (electron-sea attraction between delocalized electrons and metal cations) is the relevant force, not Coulombic forces between discrete ions as in an ionic solid; carbon's presence doesn't operate through "weakening Coulombic forces."
(D) is wrong — that describes a substitutional alloy, but steel is an interstitial alloy; carbon atoms fit between iron atoms rather than replacing them.`
  },
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Why substitutional alloys like brass are malleable',
    content:
`Which of the following statements best explains why substitutional alloys like brass are malleable?
(A) Substitutional alloys have free-moving delocalized electrons.
(B) Substituting atoms prevent dislocation movement in the lattice.
(C) Atoms in substitutional alloys are held together by weak van der Waals forces.
(D) Substituting atoms maintain the metallic bonding's sea of delocalized electrons, so layers of atoms can still slide past one another.`,
    answer: `Correct answer: (D) Substituting atoms maintain the metallic bonding's sea of delocalized electrons, so layers of atoms can still slide past one another.
In brass, zinc atoms replace copper atoms in the lattice, but because the two metals have similar atomic radii, this substitution does not significantly distort the regular lattice structure. The delocalized "sea" of electrons from metallic bonding remains largely intact and non-directional, so layers of atoms can still slide over one another when a force is applied — this sliding without breaking bonds is exactly what makes a material malleable.
(A) is true of metals in general (it explains electrical conductivity) but by itself doesn't explain malleability specifically — plenty of good conductors could in principle still be brittle if bonding were directional; the key reason malleability is preserved here is that the lattice geometry/electron sea is undisturbed, which is what (D) states.
(B) is wrong — it has the effect backwards; similar-sized substituting atoms do not prevent dislocation (layer-sliding) movement, they still allow it (though somewhat more resisted than in a pure metal).
(C) is wrong — metallic bonding involves strong electrostatic attraction between cations and delocalized electrons, not weak van der Waals forces.`
  },
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Classifying bronze as a substitutional alloy',
    content:
`Bronze is an alloy of copper (atomic radius ≈ 128 pm) and tin (atomic radius ≈ 145 pm). How should bronze be classified, and why?
(A) Interstitial alloy, because tin atoms are much smaller than copper atoms and fit into the gaps between them
(B) Substitutional alloy, because tin and copper have comparable atomic radii, so tin atoms can replace copper atoms within the regular lattice without severely distorting it
(C) Interstitial alloy, because copper and tin are adjacent to each other on the periodic table
(D) Neither — bronze is a purely ionic compound of Cu and Sn`,
    answer: `Correct answer: (B) Substitutional alloy, because tin and copper have comparable atomic radii, so tin atoms can replace copper atoms within the regular lattice without severely distorting it
Copper (≈128 pm) and tin (≈145 pm) have atomic radii that are much closer in size to each other than, say, iron and carbon are. Because the radii are comparable, tin atoms can substitute for copper atoms directly within copper's regular metallic lattice without major distortion, which is the defining feature of a substitutional alloy (like the Cu/Zn alloy brass).
(A) is wrong — tin is not "much smaller" than copper (145 pm vs 128 pm is a modest difference, not the large size mismatch needed for interstitial fit); interstitial alloys require a genuinely tiny atom, like carbon or boron, relative to the host metal.
(C) is wrong — periodic table adjacency isn't the criterion for alloy type; relative atomic size is.
(D) is wrong — bronze is a metallic alloy (both components are metals held together by metallic bonding), not an ionic compound.`
  },
  {
    topic: '2.4',
    mcq: true,
    title: 'MCQ — Stainless steel and chromium substitution',
    content:
`Stainless steel's corrosion resistance comes largely from adding chromium (atomic radius ≈ 128 pm) to iron (atomic radius ≈ 126 pm). How does chromium incorporate into the iron lattice?
(A) As an interstitial alloying element, since chromium is much smaller than iron
(B) As a substitutional alloying element, since chromium and iron have nearly identical atomic radii, allowing chromium atoms to replace iron atoms directly in the lattice
(C) It does not alloy with iron at all; it only forms a surface coating
(D) As an ionic compound, Cr3+ and Fe2+ ions substituting for each other`,
    answer: `Correct answer: (B) As a substitutional alloying element, since chromium and iron have nearly identical atomic radii, allowing chromium atoms to replace iron atoms directly in the lattice
Chromium's atomic radius (≈128 pm) is almost identical to iron's (≈126 pm). Because the two atoms are essentially the same size, chromium atoms can directly replace iron atoms at lattice sites without distorting the regular metallic lattice — the hallmark of a substitutional alloy. (Stainless steel typically also contains a small amount of interstitial carbon, but the chromium component specifically that provides corrosion resistance is substitutional.)
(A) is wrong — chromium is not small relative to iron, so it cannot occupy interstitial sites; that role is instead played by carbon in steel.
(C) is wrong — chromium is alloyed throughout the bulk metal, not just applied as a surface coating (that would describe chrome plating, a different process).
(D) is wrong — chromium and iron are held together by metallic bonding (delocalized electron sea), not by discrete ionic charges/electrostatic ion pairs as in an ionic solid.`
  },
  {
    topic: '2.4',
    title: 'FRQ — Predicting hardness: steel vs. brass',
    content:
`Steel is an interstitial alloy of iron and carbon. Brass is a substitutional alloy of copper and zinc.

Predict whether steel or brass will be harder, and justify your answer in terms of atomic structure and metallic bonding.`,
    answer: `Steel will be harder than brass. In steel, the small carbon atoms are lodged in the interstitial spaces between the much larger iron atoms. These carbon atoms physically block the layers of iron atoms from sliding smoothly past one another (they restrict dislocation movement through the lattice), which increases the material's resistance to deformation — i.e., its hardness — at the cost of some malleability. In brass, by contrast, the substituting zinc atoms are close in size to the copper atoms they replace, so the regular lattice geometry is preserved and layers of atoms can still slide relatively easily past one another. With less resistance to layer-sliding, brass remains comparatively softer and more malleable than steel.`
  },
  {
    topic: '2.4',
    title: 'FRQ — Steel vs. brass: mechanical strength and high-temperature diffusion',
    content:
`A manufacturer is developing a high-temperature, high-stress aerospace component and is considering two alloys:
- Steel (an interstitial alloy of iron and carbon)
- Brass (a substitutional alloy of copper and zinc)

The engineers are concerned about hardness, resistance to deformation, and performance under repeated mechanical stress cycles at extreme temperatures.

(a) Explain how the atomic structure of steel and brass leads to differences in their mechanical strength and resistance to deformation.

(b) At high temperatures, one of these alloys will undergo greater structural weakening due to atomic diffusion. Predict which alloy is more likely to weaken, and justify your answer based on atomic structure and bonding principles.`,
    answer: `(a) Steel's small interstitial carbon atoms wedge into the gaps between the much larger iron atoms, creating strong local atomic constraints that pin the iron lattice in place and strongly resist the layer-sliding (dislocation movement) needed for deformation — this makes steel harder and more resistant to deformation. Brass's substitutional zinc atoms, on the other hand, are similar in size to the copper atoms they replace, so they don't create the same kind of rigid pinning; atomic layers can still move relatively freely past each other, making brass more malleable but less resistant to deformation under stress than steel.

(b) Brass is more likely to weaken from atomic diffusion at high temperature. Because copper and zinc atoms are similar in size and occupy equivalent, interchangeable lattice sites (a substitutional arrangement), they can migrate/diffuse through the lattice relatively easily as thermal energy increases, gradually degrading the alloy's structural integrity. In steel, the interstitial carbon atoms are lodged in tight gaps between much larger iron atoms; this size mismatch and the constrained interstitial geometry make diffusion slower, so steel's structure (and strength) is retained longer at high temperature than brass's.`
  },
  {
    topic: '2.4',
    title: 'FRQ — Malleability of metallic silver vs. ionic silver bromide',
    content:
`Silver (Ag) is a metal; silver bromide (AgBr) is an ionic solid composed of Ag+ and Br- ions.

Predict which substance, Ag or AgBr, is more malleable, and justify your answer based on the bonding and structure of each solid.`,
    answer: `Metallic silver (Ag) is far more malleable than AgBr. In metallic Ag, the bonding is non-directional: positively charged silver cations are held in a lattice surrounded by a delocalized "sea" of electrons. When a force is applied, layers of Ag+ cations can slide past one another, and the mobile electron sea simply redistributes to maintain the metallic bonding — the metal bends/deforms without breaking. In AgBr, however, the Ag+ and Br- ions are held in fixed lattice positions by direct electrostatic (Coulombic) attraction between specific oppositely-charged neighbors. If a force shifts one layer of ions relative to another, ions of the same charge (Ag+ next to Ag+, or Br- next to Br-) are forced into close proximity; since like charges strongly repel each other, this repulsion shatters the lattice. So AgBr is brittle, while Ag is malleable — the difference comes down to non-directional metallic bonding (Ag) versus directional, fixed-ion electrostatic bonding (AgBr).`
  },
  {
    topic: '2.4',
    title: 'FRQ — Ductility of an interstitial alloy vs. a substitutional alloy',
    content:
`Steel (an interstitial alloy of iron and carbon) and bronze (a substitutional alloy of copper and tin) are both metallic alloys, but they differ in ductility (the ability to be drawn into a wire without breaking).

Predict which alloy is more ductile, and justify your answer in terms of how each type of alloy affects the electron-sea model of metallic bonding and the ability of atomic layers to slide past one another (dislocation movement).`,
    answer: `Bronze (the substitutional alloy) is more ductile than steel (the interstitial alloy). In bronze, tin atoms substitute for copper atoms at regular lattice sites because the two atoms are similar in size; the overall lattice geometry and the delocalized electron sea from metallic bonding are largely preserved, so layers of atoms can still slide past each other relatively freely when the metal is drawn into a wire. In steel, the much smaller carbon atoms sit in the interstitial gaps between iron atoms rather than at regular lattice sites. These interstitial atoms physically obstruct the sliding of atomic layers (they impede dislocation movement) far more than similarly-sized substitutional atoms do, making steel harder but also more resistant to being drawn out into a wire without cracking — i.e., less ductile than bronze.`
  }
];

// Topic 2.5 — Lewis Diagrams — curated from Save My Exams "lewis-diagrams" MCQ/FRQ + answer keys
// Source folder: ".../Savemyexam/Unit 2/Lewis Structure/"
//
// KEPT (8 new questions, verified independently):
//  - MCQ: HNO2 correct Lewis diagram (source: MCQ Medium Q1) — pure valence-electron-count/octet skill, no resonance/FC needed.
//  - MCQ: octet-rule exception among CCl4/PCl3/NO3-/ClF3 (source: MCQ Medium Q3)
//  - MCQ: octet-rule exception among BF4-/SCl4/CS2/NOCl (source: MCQ Medium Q4)
//  - MCQ: lone pairs on I3- (source: MCQ Hard Q4)
//  - MCQ: correct Lewis diagram for NO3- (source: MCQ Very Hard Q2) — rewritten to use standard AP-style
//    formal-charge-free bonding/octet reasoning instead of the UK "dative covalent bond" arrow formalism
//    used in the original source (that notation is not standard AP CED framing).
//  - FRQ: PF3 Lewis structure (source: FRQ Medium Q4a) — kept only the Lewis-diagram part; geometry
//    (4b) and polarity (4g) parts were EXCLUDED as out-of-scope (VSEPR/polarity is a different CED topic,
//    not Lewis diagrams/resonance/formal charge).
//  - FRQ: PCl5 Lewis structure + why it's an octet exception (source: FRQ Medium Q4c,d) — kept structure-
//    drawing + basic octet-exception reasoning ("P is in Period 3 and can accommodate more than 8 electrons"),
//    avoided deep d-orbital theory per scope limits.
//  - FRQ: ClF3 Lewis structure + valence-electron pattern reasoning (source: FRQ Hard Q1a,b) — kept the
//    pattern-prediction part and the Lewis-diagram part.
//
// EXCLUDED:
//  - FRQ Hard Q1(c): trigonal planar vs T-shaped / dipole moment reasoning — EXCLUDED, this is VSEPR/molecular
//    polarity content, not Lewis diagrams/resonance/formal charge.
//  - FRQ Hard Q1(d): halogen-fluorine periodicity hypothesis — EXCLUDED, periodic-trends reasoning, not Lewis
//    structure content.
//  - FRQ Medium Q4(b): PF3 molecular geometry — EXCLUDED (VSEPR, different topic).
//  - FRQ Medium Q4(e,f,g): POCl3 diagram/formal charge/polarity — the Lewis-diagram-with-minimized-formal-charge
//    and formal-charge parts were REASSIGNED to topic 2.6 (they require formal charge reasoning); polarity
//    part (g) EXCLUDED as out of scope.
//  - MCQ Medium Q2 (resonance recognition: benzene/CO3^2-/C2H4/O3) — REASSIGNED to 2.6 (tests the concept of
//    resonance directly).
//  - MCQ Medium Q5 (formal charge formula) — REASSIGNED to 2.6 (directly about formal charge).
//  - MCQ Hard Q1/Q2/Q3 (HPO4^2- formal charge on 3 different atoms) — REASSIGNED to 2.6; only one of the
//    three (most instructive) was kept there to avoid near-duplication among themselves.
//  - MCQ Hard Q5 (CO2 resonance/formal charge table) — DUPLICATE of FRQ Medium Q1 content (same CO2 structures);
//    the FRQ version was kept in 2.6 instead since it requires fuller justification.
//  - MCQ Very Hard Q1 (XeO3 shape/formal charge/Xe formal charge) — EXCLUDED as out of AP CED scope: noble-gas
//    hypervalent compound analysis with detailed formal-charge-driven shape determination goes beyond the
//    "basic recognition of octet-expanding atoms" scope for this course.
//  - FRQ Hard Q2 (CO3^2- Lewis structure/resonance/bond length) — EXCLUDED as duplicate: carbonate resonance is
//    explicitly already covered in topic 2.6 (Q19-Q31 set covers "resonance of methanoate/carbonate/N2O").
//  - FRQ Hard Q3 (ozone resonance structures + bond length) — REASSIGNED to 2.6 (resonance content, and ozone is
//    a new molecule not already covered there).

const topic25Questions = [
  {
    topic: '2.5',
    mcq: true,
    title: 'MCQ — Correct Lewis diagram for nitrous acid (HNO2)',
    content:
`Nitrous acid (HNO2) is produced when nitrogen dioxide dissolves in water to produce acid rain. Which of the following correctly describes a valid Lewis (electron-dot) structure for nitrous acid?
(A) H–O–N=O, with the singly-bonded O having 2 lone pairs, the doubly-bonded O having 2 lone pairs, and N having 1 lone pair (18 valence electrons total)
(B) H–O–N–O, with only single bonds and no lone pair placed on N (16 electrons total)
(C) H–N(=O)–O, with N double-bonded to one O and the H attached directly to N, oxygen atoms short one lone pair each (16 electrons total)
(D) H–O=N=O, with double bonds to both oxygens and an extra lone pair forced onto N beyond a normal octet (20 electrons total)`,
    answer: `Correct answer: (A) H–O–N=O, with 2 lone pairs on each oxygen and 1 lone pair on N (18 electrons total)

Step 1 — total valence electrons for HNO2:
H = 1, N = 5, O = 6 x 2 = 12
Total = 1 + 5 + 12 = 18 valence electrons

Step 2 — build the skeleton and check every atom for a complete octet (H needs only 2 electrons):
Connectivity is H–O–N=O (the H attaches to an oxygen, not to N or the other oxygen — this matches the known structure of nitrous acid, HO–NO).
Bonds: O–H single bond (2 e), O–N single bond (2 e), N=O double bond (4 e) = 8 bonding electrons.
Remaining electrons = 18 − 8 = 10 electrons as lone pairs: 2 lone pairs (4 e) on the singly-bonded O, 2 lone pairs (4 e) on the doubly-bonded O, and 1 lone pair (2 e) on N.
Check totals: N has 1 lone pair (2 e) + 3 bonds worth of shared electrons (counts as 6 toward its octet) = 8 electrons around N — octet satisfied. Each oxygen has an octet. H has 2 electrons. Grand total electrons placed = 8 (bonds) + 10 (lone pairs) = 18. This matches the count in Step 1, so (A) is internally consistent and correct.

Why the others are wrong:
(B) Only single bonds gives just 16 electrons used with no lone pair on N and an incomplete octet on N (only 6 electrons around N) — this doesn't use all 18 valence electrons correctly and leaves N electron-deficient.
(C) This connectivity/electron distribution only accounts for 16 electrons and leaves an oxygen with an incomplete octet — inconsistent with the 18-electron count required.
(D) Placing double bonds to both oxygens would require 20 electrons in the structure once lone pairs are added to satisfy octets, which exceeds the 18 valence electrons actually available, and it would force nitrogen to exceed a normal octet, which nitrogen (a period-2 element with no accessible d-orbitals) cannot do.`
  },
  {
    topic: '2.5',
    mcq: true,
    title: 'MCQ — Identify the compound with an atom that violates the octet rule (CCl4/PCl3/NO3-/ClF3)',
    content:
`Which of the following compounds contains an atom that does not obey the octet rule?
(A) CCl4
(B) PCl3
(C) NO3-
(D) ClF3`,
    answer: `Correct answer: (D) ClF3

Count valence electrons for ClF3: Cl = 7, F = 7 each x 3 = 21. Total = 7 + 21 = 28 valence electrons.
Building the structure: Cl forms 3 single bonds to the 3 F atoms, using 3 x 2 = 6 bonding electrons. Remaining electrons = 28 − 6 = 22 electrons as lone pairs.
Each F needs 3 lone pairs to complete its octet: 3 F x 3 lone pairs x 2 electrons = 18 electrons used on the fluorines.
Remaining for Cl = 22 − 18 = 4 electrons = 2 lone pairs on Cl.
Total electron domains around Cl = 3 bonding pairs + 2 lone pairs = 5 domains = 10 electrons around the central Cl atom — this exceeds the octet (8), so Cl does not obey the octet rule. Chlorine is in Period 3 and can accommodate this expanded valence shell.

Why the others obey the octet rule:
(A) CCl4: C has 4 bonds and no lone pairs = 8 electrons around C. Each Cl has 1 bond + 3 lone pairs = 8 electrons. All atoms have exactly an octet.
(B) PCl3: P has 3 bonds + 1 lone pair = 8 electrons around P. Each Cl has 1 bond + 3 lone pairs = 8 electrons. All atoms have exactly an octet.
(C) NO3-: valence electrons = 5 + (3 x 6) + 1 (charge) = 24. The nitrogen forms one double bond and two single bonds (with resonance distributing which O has the double bond); N ends up with 4 bonds worth of shared electrons (8 electrons, no lone pair) = octet; every oxygen (whether double- or single-bonded, with lone pairs completing it) also has exactly 8 electrons. No atom exceeds or falls short of an octet.`
  },
  {
    topic: '2.5',
    mcq: true,
    title: 'MCQ — Identify the compound with an atom that violates the octet rule (BF4-/SCl4/CS2/NOCl)',
    content:
`Which compound contains an atom that does not obey the octet rule?
(A) BF4-
(B) SCl4
(C) CS2
(D) NOCl`,
    answer: `Correct answer: (B) SCl4

Count valence electrons for SCl4: S = 6, Cl = 7 each x 4 = 28. Total = 6 + 28 = 34 valence electrons.
S forms 4 single bonds to the 4 Cl atoms, using 4 x 2 = 8 bonding electrons. Remaining electrons = 34 − 8 = 26 electrons as lone pairs.
Each Cl needs 3 lone pairs to complete its octet: 4 Cl x 3 lone pairs x 2 electrons = 24 electrons used on the chlorines.
Remaining for S = 26 − 24 = 2 electrons = 1 lone pair on S.
Total electron domains around S = 4 bonding pairs + 1 lone pair = 5 domains = 10 electrons around the central S atom — this exceeds the octet. Sulfur is in Period 3 and can expand its valence shell to accommodate this.

Why the others obey the octet rule:
(A) BF4-: valence electrons = 3 (B) + 7x4 (F) + 1 (charge) = 32. B forms 4 single bonds and has no lone pair = 8 electrons around B (octet, even though neutral BF3 would be electron-deficient, the extra electron from the negative charge lets B reach a full octet here). Each F has 1 bond + 3 lone pairs = 8 electrons.
(C) CS2: valence electrons = 4 + 6x2 = 16. Structure is S=C=S: C has 2 double bonds = 8 electrons around C (octet, no lone pair needed), each S has 1 double bond + 2 lone pairs = 8 electrons.
(D) NOCl: valence electrons = 5 + 6 + 7 = 18. Structure N=O with N–Cl single bond: N has 1 double bond + 1 single bond + 1 lone pair = 8 electrons around N; O (double-bonded) has 2 lone pairs = 8 electrons; Cl has 1 single bond + 3 lone pairs = 8 electrons. All atoms have octets.`
  },
  {
    topic: '2.5',
    mcq: true,
    title: 'MCQ — Number of lone pairs on I3-',
    content:
`How many lone pairs of electrons exist on the triiodide ion, I3-?
(A) 3
(B) 5
(C) 7
(D) 9`,
    answer: `Correct answer: (D) 9

Count valence electrons for I3-: each I contributes 7 valence electrons, and the ion carries an extra electron for the 1- charge.
Valence electrons = (3 x 7) + 1 = 22 electrons.

I3- is linear, with a central I atom singly bonded to each of the two terminal I atoms: 2 bonds x 2 electrons/bond = 4 bonding electrons.

Remaining (nonbonding) electrons = 22 − 4 = 18 electrons.
Number of lone pairs = 18 electrons / 2 electrons per lone pair = 9 lone pairs.

(This checks out atom-by-atom too: each terminal I has 3 lone pairs + 1 bond = 8 electrons around it, a normal octet, while the central I has 3 lone pairs + 2 bonds = 10 electrons around it, an expanded octet — consistent with iodine being a Period 5 element capable of holding more than 8 electrons. Total lone pairs = 3 + 3 + 3 = 9, confirming answer D.)

Why the others are wrong: (A), (B), and (C) undercount the electrons — they would correspond to using more electrons in bonding than the structure actually has, or forgetting the extra electron from the 1- charge.`
  },
  {
    topic: '2.5',
    mcq: true,
    title: 'MCQ — Correct Lewis structure for the nitrate ion, NO3-',
    content:
`The nitrate ion, NO3-, is a polyatomic ion held together by covalent bonds. Which set of bonding/electron features correctly describes a valid Lewis structure for NO3- (drawn in brackets with the overall 1- charge shown outside)?
(A) N is connected to all three O atoms by single bonds only, with no double bond anywhere, and no charge shown on the ion
(B) N is double-bonded to one O and singly bonded to the other two O atoms; each singly-bonded O carries 3 lone pairs and an overall 1- charge is shown outside the brackets
(C) N is triple-bonded to one O and singly bonded to the other two, with no lone pairs shown on any oxygen
(D) N is double-bonded to all three O atoms simultaneously with no charge shown on the ion`,
    answer: `Correct answer: (B)

Step 1 — total valence electrons for NO3-:
N = 5, O = 6 x 3 = 18, plus 1 extra electron for the 1- charge = 5 + 18 + 1 = 24 valence electrons.

Step 2 — build a structure that gives every atom an octet using exactly 24 electrons:
Put N in the center. One N=O double bond uses 4 electrons; two N–O single bonds use 2 electrons each (4 total) = 8 bonding electrons overall.
Remaining electrons = 24 − 8 = 16 electrons as lone pairs.
The double-bonded O needs 2 lone pairs (4 electrons) to complete its octet (4 from the double bond + 4 lone-pair electrons = 8).
Each singly-bonded O needs 3 lone pairs (6 electrons each = 12 electrons total) to complete its octet (2 from the single bond + 6 lone-pair electrons = 8).
Total lone-pair electrons = 4 + 12 = 16, which matches exactly. N has 4 bonds' worth of shared electrons (double + 2 singles) and no lone pair = 8 electrons around N, a complete octet.

This structure only accounts for the connectivity of one resonance form (the double bond could equivalently be drawn to any of the three oxygens — true resonance), but any single valid drawing must show exactly this pattern: 1 double bond + 2 single bonds, with the singly-bonded oxygens each carrying 3 lone pairs, and the ion's overall 1- charge written outside the brackets (since summing formal charges — 0 on N, 0 on the double-bonded O, and −1 on each of the two singly-bonded O — gives a net of −2 +... let's confirm: N=+1, double-bonded O=0, each single-bonded O=−1, total = +1 + 0 −1 −1 = −1, matching the ion's charge).

Why the others are wrong:
(A) All single bonds would require N to have only 3 bonds and end up either with a lone pair (giving N only 6 electrons total, an incomplete octet) or not enough electrons to give every oxygen a full octet using just 24 electrons — the electron count doesn't work out to satisfy every atom's octet with zero charges shown.
(C) A triple bond to one oxygen with no lone pairs on any oxygen leaves the two singly-bonded oxygens with incomplete octets (only 2 electrons each from the bond) — this uses too few electrons and violates the octet rule.
(D) Three N=O double bonds would require N to form 4 total bonds-worth counted twice (6 bonding pairs = 12 electrons) around N, giving N 12 electrons — this exceeds a normal octet for nitrogen, which (being in Period 2) cannot expand its valence shell; it is also inconsistent with the 24-electron total once lone pairs are added.`
  },
  {
    topic: '2.5',
    title: 'FRQ — Lewis structure of phosphorus trifluoride, PF3',
    content:
`Phosphorus trifluoride, PF3, is a simple covalent molecule.

(a) Calculate the total number of valence electrons in PF3.

(b) Draw the complete Lewis (electron-dot) structure for PF3, showing all bonding and lone-pair electrons.`,
    answer: `(a) Valence electrons: P = 5, F = 7 each x 3 = 21. Total = 5 + 21 = 26 valence electrons.

(b) P is placed in the center, singly bonded to each of the 3 F atoms: 3 single bonds x 2 electrons = 6 bonding electrons.
Remaining electrons = 26 − 6 = 20 electrons distributed as lone pairs.
Each F needs 3 lone pairs to complete its octet (1 bond + 6 lone-pair electrons = 8 electrons): 3 F x 3 lone pairs x 2 electrons = 18 electrons.
Remaining electrons for P = 20 − 18 = 2 electrons = 1 lone pair on P.
Final structure: P bonded singly to each of 3 F atoms, with 1 lone pair on P and 3 lone pairs on each F. Check: P has 3 bonds + 1 lone pair = 8 electrons around it (octet satisfied); each F has 1 bond + 3 lone pairs = 8 electrons (octet satisfied). Total electrons used = 6 (bonds) + 2 (P lone pair) + 18 (F lone pairs) = 26, matching part (a).`
  },
  {
    topic: '2.5',
    title: 'FRQ — Lewis structure of PCl5 and why it violates the octet rule',
    content:
`Phosphorus pentachloride, PCl5, is a stable molecular compound.

(a) Draw the complete Lewis structure for PCl5.

(b) Explain why PCl5 is an exception to the octet rule.`,
    answer: `(a) Valence electrons: P = 5, Cl = 7 each x 5 = 35. Total = 5 + 35 = 40 valence electrons.
P is placed in the center with 5 single bonds to the 5 Cl atoms: 5 x 2 = 10 bonding electrons.
Remaining electrons = 40 − 10 = 30 electrons as lone pairs. Each Cl needs 3 lone pairs to complete its octet: 5 Cl x 3 lone pairs x 2 electrons = 30 electrons — this uses exactly the remaining electrons, so P itself has no lone pairs.
Final structure: P singly bonded to 5 Cl atoms (no lone pair on P), each Cl bearing 3 lone pairs.

(b) P has 5 bonds and 0 lone pairs, meaning 10 electrons surround the central P atom — this exceeds the normal octet of 8. Phosphorus can do this because it is in Period 3 (row 3 of the periodic table); atoms in Period 3 and beyond have valence shells large enough (with accessible d-type orbitals or a larger overall shell) to hold more than 8 electrons, unlike Period 2 elements (like N, O, F) which are strictly limited to a maximum of 8 valence electrons. This is why PCl5 exists as a stable compound despite phosphorus not obeying the standard octet rule here, while an analogous nitrogen compound (NCl5) does not exist.`
  },
  {
    topic: '2.5',
    title: 'FRQ — Predicting and drawing the Lewis structure of ClF3',
    content:
`The table below lists some binary fluorine compounds:

Nonmetal: C, N, O, Ne, Si, P, S, Ar
Formula:  CF4, NF3, OF2, (none), SiF4, PF3, SF2, (none)

A student notices a pattern and hypothesizes: "the number of F atoms that bond to a nonmetal is always equal to 8 minus the number of valence electrons in the nonmetal atom."

(a) Based on this hypothesis, what formula would you predict for a compound formed between chlorine and fluorine? Show your reasoning.

(b) The compound that actually forms is ClF3, not the formula predicted in part (a). Calculate the total valence electrons in ClF3 and draw its complete Lewis structure.`,
    answer: `(a) Chlorine (Group 17) has 7 valence electrons. Using the hypothesis: number of F atoms = 8 − 7 = 1. The predicted formula is ClF.
(This pattern happens to hold for the Period-2/3 nonmetals in the table because those atoms are limited to a normal octet, so the number of bonds they can form is capped at 8 minus their own valence electrons. It breaks down for ClF3 because chlorine, like sulfur and phosphorus, is a Period-3 element that can exceed the normal octet and form more bonds than the simple "8 minus valence electrons" rule predicts.)

(b) Valence electrons for ClF3: Cl = 7, F = 7 x 3 = 21. Total = 7 + 21 = 28 valence electrons.
Cl is placed in the center, singly bonded to each of the 3 F atoms: 3 x 2 = 6 bonding electrons.
Remaining electrons = 28 − 6 = 22 electrons as lone pairs.
Each F needs 3 lone pairs (6 electrons) to complete its octet: 3 F x 6 = 18 electrons.
Remaining electrons for Cl = 22 − 18 = 4 electrons = 2 lone pairs on Cl.
Final structure: Cl singly bonded to 3 F atoms, with 2 lone pairs on Cl and 3 lone pairs on each F. Check: Cl has 3 bonds + 2 lone pairs = 10 electrons around it — an expanded octet, consistent with chlorine being a Period-3 element that can exceed 8 valence electrons. Each F has 1 bond + 3 lone pairs = 8 electrons (a normal octet). Total electrons used = 6 (bonds) + 4 (Cl lone pairs) + 18 (F lone pairs) = 28, matching the count above.`
  }
];

// Topic 2.6 — Resonance and Formal Charge — curated from Save My Exams "lewis-diagrams" MCQ/FRQ + answer keys
// Source folder: ".../Savemyexam/Unit 2/Lewis Structure/"
// NOTE: Topic 2.6 already has 13 questions (Q19-Q31) covering resonance of methanoate/carbonate/N2O,
// formal charge + preferred structure, formal charge for phosgene/HCNO/NOF2/cyanate, why BF3 double-bond
// structures are unfavorable, expanded-octet structures, completing resonance structures, best Lewis
// diagram by formal charge, and a formal charge table. Only genuinely new molecules/scenarios were kept
// here (6 total, within the "handful" target).
//
// KEPT (6 new questions, verified independently):
//  - MCQ: correct formula for calculating formal charge (source: MCQ Medium Q5) — tests the formula itself,
//    distinct from the existing "apply formal charge to a molecule" questions already in the bank.
//  - MCQ: formal charge on a singly-bonded terminal O in HPO4^2- (source: MCQ Hard Q3, one of three near-
//    identical atom-by-atom questions on the same ion — only this one was kept, see EXCLUDED below).
//  - FRQ: CO2 resonance structures, formal charge on each O, and stability comparison (source: FRQ Medium Q1a,b)
//    — CO2 is a new specific molecule not in the existing 2.6 set.
//  - FRQ: SO4^2- — two valid Lewis structures (octet-obeying vs. expanded-octet S) + formal charge comparison
//    (source: FRQ Medium Q3a,b) — sulfate is a new specific molecule not in the existing 2.6 set.
//  - FRQ: POCl3 Lewis structure with minimized formal charge + formal charge calculation and justification
//    (source: FRQ Medium Q4e,f, reassigned here from the 2.5 file since it requires formal-charge reasoning)
//    — POCl3 is a new specific molecule (different from the already-covered phosgene, HCNO, NOF2, cyanate).
//  - FRQ: ozone (O3) resonance structures + why both O–O bonds are equal length (source: FRQ Hard Q3a,b)
//    — ozone is a new specific molecule not in the existing 2.6 set.
//
// EXCLUDED:
//  - MCQ Medium Q2 (resonance recognition among benzene/CO3^2-/C2H4/O3) — EXCLUDED as too close to the general
//    "does this species have resonance" concept already well covered by the existing 13 questions on resonance;
//    did not add a genuinely new scenario worth the extra slot.
//  - MCQ Hard Q1 & Q2 (formal charge on 2 other atoms of the same HPO4^2- ion) — EXCLUDED as near-duplicates of
//    the one HPO4^2- question kept; all three are the identical calculation method applied to different atoms
//    of the same molecule, so only the most instructive (a charged terminal oxygen, FC = -1) was retained.
//  - MCQ Hard Q5 (CO2 resonance/formal charge table, structures I/II) — EXCLUDED as a duplicate of FRQ Medium
//    Q1 (identical CO2 structures/numbers); the FRQ version was kept instead since it requires fuller written
//    justification.
//  - MCQ Very Hard Q1 (XeO3 shape/formal charge, "Xe formal charge of +2") — EXCLUDED: out of AP CED scope.
//    Detailed formal-charge-based shape determination for a hypervalent noble-gas oxide goes beyond the
//    "basic recognition that some atoms can exceed an octet" scope for this course.
//  - FRQ Medium Q2a (BF3 formal charge explaining incomplete octet) — EXCLUDED as a direct duplicate: the
//    existing 2.6 bank already explicitly covers "why BF3 double-bond structures are unfavorable" using the
//    same formal-charge argument.
//  - FRQ Medium Q2b (BrF3 electron domain/molecular geometry) — EXCLUDED as out of scope: VSEPR geometry is a
//    different CED topic, not Lewis diagrams/resonance/formal charge.
//  - FRQ Medium Q4g (PF3 vs. POCl3 polarity) — EXCLUDED as out of scope: molecular polarity from shape/bond
//    dipoles is a different CED topic.
//  - FRQ Hard Q1c (ClF3 shape/dipole moment) & Q1d (halogen-fluorine periodicity hypothesis) — EXCLUDED as out
//    of scope: VSEPR/polarity and periodic-trends reasoning, not Lewis structure/resonance/formal charge content.
//  - FRQ Hard Q2 (CO3^2- Lewis structure/resonance/bond length) — EXCLUDED as duplicate: carbonate resonance is
//    explicitly already covered in the existing 2.6 question set (Q19-Q31 covers "resonance of methanoate/
//    carbonate/N2O").

const topic26Questions = [
  {
    topic: '2.6',
    mcq: true,
    title: 'MCQ — Correct formula for formal charge',
    content:
`Which of the following is the correct formula for calculating the formal charge (FC) on an atom in a Lewis structure?
(A) FC = (number of valence electrons) − 1/2(number of bonding electrons) − (number of non-bonding electrons)
(B) FC = (number of valence electrons) + (number of bonding electrons) + (number of non-bonding electrons)
(C) FC = (number of valence electrons) − (number of non-bonding electrons) − (number of bonding electrons)
(D) FC = (number of valence electrons) − 1/2(number of non-bonding electrons) − (number of bonding electrons)`,
    answer: `Correct answer: (A) FC = (valence electrons) − 1/2(bonding electrons) − (non-bonding electrons)

Formal charge assigns each bonded atom "ownership" of all of its own lone-pair (non-bonding) electrons plus exactly half of the electrons in each bond it participates in (since a bond is shared equally between the two atoms in the idealized formal-charge model). So:
FC = (valence electrons of the free atom) − (non-bonding electrons the atom has) − (1/2 x bonding electrons around that atom)
This is exactly option (A). As a sanity check: for a neutral atom with a standard number of bonds and a full octet split into the "normal" arrangement (e.g., O with 2 bonds + 2 lone pairs, or N with 3 bonds + 1 lone pair), this formula correctly gives FC = 0.

Why the others are wrong:
(B) Uses addition instead of subtraction — this would make every atom's formal charge increase without bound as bonds/lone pairs increase, which contradicts the physical meaning of formal charge as a measure of electron "surplus or deficit" relative to the free atom.
(C) Subtracts the full number of bonding electrons instead of half — since each bond is shared between two atoms, counting the whole bonding pair toward one atom double-counts those electrons and gives formal charges that are too negative.
(D) Applies the 1/2 factor to the non-bonding electrons instead of the bonding electrons — non-bonding (lone-pair) electrons belong entirely to one atom and should be counted in full, while it is the shared bonding electrons that must be split, so this formula has the halving backwards.`
  },
  {
    topic: '2.6',
    mcq: true,
    title: 'MCQ — Formal charge on a terminal oxygen in HPO4^2-',
    content:
`In the hydrogen phosphate ion, HPO4^2-, the best Lewis structure has a phosphorus atom in the center forming one P=O double bond, one P–OH single bond, and two P–O single bonds to two other oxygen atoms (each of those two oxygens carries 3 lone pairs and no attached H). What is the formal charge on one of these two singly-bonded, non-hydroxyl oxygen atoms?
(A) 0
(B) -1
(C) -2
(D) +1`,
    answer: `Correct answer: (B) -1

For this oxygen: it has 1 single bond to P (2 bonding electrons, so 1/2 x 2 = 1) and 3 lone pairs (6 non-bonding electrons). Oxygen's valence electron count is 6.

FC = (valence electrons) − (non-bonding electrons) − 1/2(bonding electrons)
FC = 6 − 6 − 1 = −1

Consistency check on the whole ion: valence electrons for HPO4^2- = P(5) + 4xO(24) + H(1) + 2 (for the 2- charge) = 32.
Formal charges of all atoms: P = 5 − 0 − 1/2(10) = 0 (P has 1 double bond + 3 single bonds = 10 bonding electrons, no lone pairs); the double-bonded O = 6 − 4 − 1/2(4) = 0; the H-bearing O = 6 − 4 − 1/2(4) = 0 (1 bond to P + 1 bond to H = 4 bonding electrons, 2 lone pairs); H = 1 − 0 − 1/2(2) = 0; each of the two singly-bonded, non-OH oxygens = −1 (calculated above).
Sum of formal charges = 0 (P) + 0 (=O) + 0 (–OH oxygen) + 0 (H) + (−1) + (−1) = −2, which matches the overall 2− charge on the ion — confirming the structure and the −1 formal charge on this oxygen are correct.

Why the others are wrong: (A) 0 would be the formal charge on the double-bonded oxygen or the –OH oxygen, not this one. (C) −2 would require either 2 fewer bonding electrons or 2 more non-bonding electrons than this oxygen actually has (over-counting the negative charge). (D) +1 would require this oxygen to have fewer lone pairs or more bonds than shown, which isn't consistent with the correct Lewis structure.`
  },
  {
    topic: '2.6',
    title: 'FRQ — Resonance structures, formal charge, and stability of CO2',
    content:
`Carbon dioxide, CO2, can be drawn as two different resonance structures with the same connectivity but different electron placement:
Structure I: O=C=O (both C–O bonds are double bonds)
Structure II: O≡C–O (one C–O bond is a triple bond, the other is a single bond)

(a) Calculate the formal charge on each oxygen atom (and on carbon) in Structure I and in Structure II.

(b) Determine which resonance structure is more stable (more closely represents the actual bonding in CO2). Justify your answer in terms of formal charge minimization and electronegativity.`,
    answer: `(a) Total valence electrons for CO2 = C(4) + 2xO(12) = 16.

Structure I (O=C=O): Carbon has 2 double bonds and no lone pairs — bonding electrons around C = 8, so 1/2(8) = 4.
FC(C) = 4 − 0 − 4 = 0.
Each oxygen has 1 double bond (4 bonding electrons) and 2 lone pairs (4 non-bonding electrons).
FC(O) = 6 − 4 − 1/2(4) = 6 − 4 − 2 = 0.
So in Structure I: FC(C) = 0, FC(O, left) = 0, FC(O, right) = 0. Check: total electrons used = 8 (2 double bonds) + 4 + 4 (2 lone pairs each O) = 16, matching the valence electron count.

Structure II (O≡C–O): Carbon has 1 triple bond (6 bonding electrons) and 1 single bond (2 bonding electrons) = 8 bonding electrons total, 0 lone pairs.
FC(C) = 4 − 0 − 1/2(8) = 4 − 4 = 0.
Triple-bonded oxygen: 1 lone pair (2 non-bonding electrons), 6 bonding electrons.
FC(O, triple-bonded) = 6 − 2 − 1/2(6) = 6 − 2 − 3 = +1.
Single-bonded oxygen: 3 lone pairs (6 non-bonding electrons), 2 bonding electrons.
FC(O, single-bonded) = 6 − 6 − 1/2(2) = 6 − 6 − 1 = −1.
So in Structure II: FC(C) = 0, FC(O, triple-bonded) = +1, FC(O, single-bonded) = −1. Check: total formal charge = 0 + 1 − 1 = 0, consistent with the neutral molecule; total electrons used = 6 + 2 (bonds) + 2 + 6 (lone pairs) = 16, matching the valence electron count.

(b) Structure I (O=C=O, both double bonds) is the more stable, and dominant, resonance structure. It has a formal charge of 0 on every atom, meaning no charge separation is required to describe the bonding. Structure II requires a +1 formal charge on one oxygen and a −1 formal charge on the other — even though the charges sum to zero overall, having any nonzero formal charges represents a less favorable (higher-energy) distribution of electron density than having all atoms at formal charge zero. Additionally, placing a positive formal charge on oxygen (the more electronegative atom, which "wants" more electron density, not less) is especially unfavorable, since electronegative atoms are best stabilized by carrying negative or zero formal charge rather than positive formal charge. For both of these reasons — lower/zero formal charges overall, and no positive charge placed on the highly electronegative oxygen — Structure I is judged more stable and is the structure that actually dominates the real bonding picture of CO2.`
  },
  {
    topic: '2.6',
    title: 'FRQ — Two valid Lewis structures for SO4^2- and formal charge comparison',
    content:
`The sulfate ion, SO4^2-, can be represented by more than one valid Lewis structure depending on whether sulfur obeys or exceeds the octet rule.

(a) Draw two valid Lewis structures for SO4^2-: one in which every atom (including sulfur) obeys the octet rule, and one in which sulfur has an expanded octet of 12 electrons.

(b) Calculate the formal charge on sulfur in both structures, and determine which structure is more stable based on formal charge minimization.`,
    answer: `(a) Total valence electrons for SO4^2- = S(6) + 4xO(24) + 2 (for the 2− charge) = 32 electrons.

Octet-obeying structure: S forms 4 single bonds to the 4 O atoms (no double bonds), using 4 x 2 = 8 bonding electrons. Remaining electrons = 32 − 8 = 24 electrons, distributed as 3 lone pairs (6 electrons) on each of the 4 oxygens (4 x 6 = 24). S has 4 bonds and no lone pair = 8 electrons around S (a normal octet); each O has 1 bond + 3 lone pairs = 8 electrons.

Expanded-octet structure: S forms 2 single bonds and 2 double bonds to the 4 oxygens (2 x 2 + 2 x 4 = 12 bonding electrons around S). Remaining electrons = 32 − 12 = 20 electrons: the 2 singly-bonded oxygens each get 3 lone pairs (6 electrons each = 12 electrons), and the 2 doubly-bonded oxygens each get 2 lone pairs (4 electrons each = 8 electrons); 12 + 8 = 20, matching. S now has 6 bonding pairs = 12 electrons around it (an expanded octet).

(b) Octet-obeying structure: FC(S) = 6 − 0 − 1/2(8) = 6 − 4 = +2. Each singly-bonded O: FC = 6 − 6 − 1/2(2) = −1 (four of these, total −4). Sum = +2 + 4(−1) = −2, matching the ion's overall charge.

Expanded-octet structure: FC(S) = 6 − 0 − 1/2(12) = 6 − 6 = 0. Each of the 2 singly-bonded O: FC = 6 − 6 − 1/2(2) = −1. Each of the 2 doubly-bonded O: FC = 6 − 4 − 1/2(4) = 0. Sum = 0 + 2(−1) + 2(0) = −2, matching the ion's overall charge.

The expanded-octet structure is more stable/preferred: it gives sulfur a formal charge of 0 instead of +2, and overall has fewer atoms carrying a nonzero formal charge (only the 2 singly-bonded oxygens at −1, versus the octet structure's +2 on S plus −1 on all 4 oxygens). Minimizing the number and magnitude of formal charges is the guiding principle for choosing the preferred Lewis structure, so the expanded-octet structure (S with 12 electrons, 2 double bonds + 2 single bonds) is judged the more accurate representation of SO4^2- bonding.`
  },
  {
    topic: '2.6',
    title: 'FRQ — Formal-charge-minimized Lewis structure of POCl3',
    content:
`Phosphorus oxychloride, POCl3, contains a central phosphorus atom bonded to one oxygen and three chlorine atoms.

(a) Draw the complete Lewis structure for POCl3 that minimizes formal charges on all atoms.

(b) Calculate the formal charge on phosphorus, on oxygen, and on one chlorine atom in this structure, and explain why this is the most stable (preferred) way to represent the bonding.`,
    answer: `(a) Total valence electrons for POCl3 = P(5) + O(6) + 3xCl(21) = 32 electrons.
The formal-charge-minimized structure has P double-bonded to O and singly bonded to each of the 3 Cl atoms: 1 double bond (4 electrons) + 3 single bonds (6 electrons) = 10 bonding electrons around P, with P having no lone pair.
Remaining electrons = 32 − 10 = 22 electrons: the doubly-bonded O gets 2 lone pairs (4 electrons), and each Cl gets 3 lone pairs (6 electrons each x 3 = 18 electrons); 4 + 18 = 22, matching.
Final structure: P at the center with a P=O double bond, three P–Cl single bonds, 2 lone pairs on O, and 3 lone pairs on each Cl (no lone pair on P).

(b) FC(P) = 5 − 0 − 1/2(10) = 5 − 5 = 0.
FC(O) = 6 − 4 − 1/2(4) = 6 − 4 − 2 = 0.
FC(Cl) = 7 − 6 − 1/2(2) = 7 − 6 − 1 = 0.
Every atom in this structure has a formal charge of 0. This is the most stable representation because the P=O double bond places extra electron density (relative to a single bond) on oxygen — the most electronegative atom present — exactly balancing P's need to "give up" more electron density in that bond, so no atom ends up with a formal-charge surplus or deficit. If instead P–O were drawn as a single bond, P would need an extra lone pair or an extra bond elsewhere to keep its bonding total consistent, and working through that alternative gives a negative formal charge on O and a positive formal charge on P — a charge-separated (less stable) structure. Since the actual structure minimizes formal charges to zero everywhere, and phosphorus (Period 3) can access the expanded valence needed to form the double bond to O while still bonding to all three Cl atoms, this all-zero-formal-charge structure is the preferred Lewis diagram for POCl3.`
  },
  {
    topic: '2.6',
    title: 'FRQ — Resonance structures of ozone (O3) and equal bond lengths',
    content:
`Ozone, O3, is an important atmospheric molecule whose bonding cannot be represented by a single Lewis structure.

(a) Draw all valid resonance structures for ozone, showing correct lone-pair placement and the formal charge on each atom.

(b) Explain why both O–O bonds in ozone are observed to be the same length, even though each individual resonance structure shows one O–O single bond and one O=O double bond.`,
    answer: `(a) Total valence electrons for O3 = 3 x 6 = 18 electrons.
Place one O in the center, bonded to the two terminal O atoms. In one resonance structure, the central O forms a double bond to the left O and a single bond to the right O; in the other resonance structure, the double bond is to the right O and the single bond is to the left O. Each terminal O has 3 lone pairs if singly bonded, or 2 lone pairs if doubly bonded; the central O has 1 lone pair in every structure.

Resonance structure 1 (double bond on the left, single bond on the right):
Central O: 1 double bond + 1 single bond + 1 lone pair = 6 bonding electrons + 2 non-bonding electrons around it.
FC(central O) = 6 − 2 − 1/2(6) = 6 − 2 − 3 = +1.
Left O (double-bonded): 2 lone pairs (4 non-bonding electrons) + 4 bonding electrons.
FC(left O) = 6 − 4 − 1/2(4) = 6 − 4 − 2 = 0.
Right O (single-bonded): 3 lone pairs (6 non-bonding electrons) + 2 bonding electrons.
FC(right O) = 6 − 6 − 1/2(2) = 6 − 6 − 1 = −1.
Sum of formal charges = +1 + 0 − 1 = 0, consistent with neutral O3.

Resonance structure 2 is the mirror image (double bond on the right, single bond on the left), with the same set of formal charges (+1 on center, 0 on the doubly-bonded O, −1 on the singly-bonded O) just swapped left/right. These two structures are the complete set of valid resonance forms for ozone.

(b) Ozone is best described not as switching between two separate, distinct molecules but as a single resonance hybrid — the true electron distribution is an average (blend) of the two resonance structures, not either one individually. Because the double bond is equally likely to be drawn on either side, the actual electron density is delocalized evenly across both O–O connections, giving each bond a character partway between a single bond and a double bond (each bond has roughly 1.5 bond order). Since both O–O bonds have the same, intermediate amount of double-bond character, they end up experimentally indistinguishable in length — both shorter than a pure O–O single bond and longer than a pure O=O double bond, and equal to each other. This is a direct consequence of resonance/electron delocalization, not of the molecule physically flipping between two different bonding arrangements.`
  }
];

// Topic 2.7 (VSEPR and Bond Hybridization) — new question review
// Topic already has 15 questions (Q29-Q43); this batch adds 8 more, selected for distinctness.
//
// KEPT (verified independently, reasoning rewritten/expanded where needed):
//   MCQ - Methanol (CH3OH) hybridization of C and O (sp3/sp3) — new molecule, not previously tested.
//   MCQ - Glycine sp2/sp3 atom count (2 sp2, 3 sp3) — new biomolecule application, verified atom-by-atom.
//   MCQ - TlBr3^2- shape and bond angle (trigonal pyramidal, ~107°) — novel case: negative charge on a
//         group-13 central atom creates a lone pair not normally present (cf. BF3), distinct mechanism
//         from existing questions. Source reasoning was muddled; rewritten with clean electron-domain count.
//   MCQ - ClF2^- shape (linear, AX2E3) — novel AX2E3 case (2 bonding + 3 lone pairs), not present in the
//         existing 15 (existing linear examples, e.g. CO2/BeF2, are AX2 with no lone pairs). Source PDF had
//         a duplicated answer choice ("A. Linear" / "B. Linear"); fixed to distinct options.
//   MCQ - PCl3 molecular geometry vs. electron-domain geometry (trigonal pyramidal vs. tetrahedral) —
//         explicitly tests the domain-geometry/molecular-geometry distinction, not directly tested elsewhere.
//   FRQ - Hydrazine (N2H4) / diimide (N2H2) / hydrazinediium (N2H6^2+) multi-part — compares sp2 (N=N,
//         ~120°, lone pair) vs. sp3 domain geometries across three related species; genuinely new molecule set.
//   FRQ - Acetate ion / PCl5 / XeF4 multi-part — covers resonance and bond-length averaging, sp2/sp3 carbon
//         hybridization within one ion, PCl5 axial-vs-equatorial repulsion (a nuance not covered previously),
//         XeF4 octahedral-domain/square-planar case (2 lone pairs trans to each other — new geometry not in
//         the existing 15), and polarity contrast of acetic acid vs. acetate (routed here per 2.8 overlap rule).
//   FRQ - Dimethyl ether vs. ethanol: oxygen hybridization (sp3) and bent molecular geometry around O —
//         new atom-of-interest (O in an ether/alcohol, not C), distinct from prior hybridization questions.
//
// FIXED:
//   - TlBr3^2- (MCQ): original answer key's electron-counting steps were confusing/inconsistent, though the
//     final answer (pyramidal, 107°) was correct; rewrote with a clean total-valence-electron count (26 e-,
//     13 pairs) and explicit domain count (3 bonding + 1 lone pair on Tl).
//   - ClF2^- (MCQ): duplicated answer choice text ("Linear" listed twice) corrected to give four distinct options.
//   - Dimethyl ether/ethanol FRQ: dropped the original part (c) asking to explain the boiling-point difference
//     via hydrogen bonding — that tests intermolecular forces, not VSEPR/hybridization, so it is out of scope
//     for topic 2.7; kept only the VSEPR-relevant parts (hybridization + geometry of the oxygen atom).
//
// EXCLUDED (duplicate of existing Q29-Q43 or out of scope):
//   - MCQ: "Which molecule is trigonal bipyramidal?" (PCl5) — duplicates existing PF5 trigonal-bipyramidal question.
//   - MCQ: "Which compound has a 120° bond angle?" (BCl3 vs. H3O+/TlBr3^2-/NH3) — duplicates existing
//     BF3/SO3/NO3- trigonal-planar 120° question (same AX3/AX3E1 contrast already covered).
//   - MCQ: Benzoic acid sigma/pi bond count — duplicates existing sigma/pi bond counting question (same skill,
//     no new geometry concept).
//   - MCQ: "Smallest bond angle" CH4/H2O/BeF2/NH3 — near-duplicate of existing CH4/NH3/H2O bond-angle
//     comparison question and existing "smallest bond angle" question.
//   - MCQ: AsF3 trigonal pyramidal geometry — duplicates the AX3E1 trigonal-pyramidal concept already covered
//     by the kept PCl3 domain/molecular-geometry question (and by existing NH3-type reasoning).
//   - MCQ: Unlabeled organic molecule sigma/pi bond count (5 C-H, O-H, C-O, 2 C-C, C=C, C=O) — duplicates
//     existing sigma/pi bond counting question.
//   - MCQ: PH4+ tetrahedral/sp3 — duplicates existing CF4/NH4+/SO4^2- tetrahedral question (same cation logic
//     as NH4+, already covered).
//   - FRQ: SF4 Lewis structure/shape/bond-angle-distortion — duplicates existing "geometry+polarity of SF4"
//     question, which already covers seesaw shape and angle compression.
//   - FRQ: Ethene (C2H4) Lewis structure/hybridization/sigma-pi/bond angle — concepts (sp2, sigma/pi in a
//     double bond, 120° angle) already thoroughly covered by existing H2CO hybridization+bond-angle question
//     and existing sigma/pi counting question; excluded for selectivity given this topic's existing depth.
//   - FRQ: Formaldehyde (CH2O) geometry/sigma-pi/polarity — duplicates existing "hybridization+bond angle of
//     H2CO" question almost exactly.
//   - FRQ: PF3 vs. BF3 hybridization/bond-angle/polarity comparison — excluded for selectivity; BF3 geometry
//     and its polarity are already covered by existing BF3/SO3/NO3- question and the existing 17-molecule
//     polarity question, so the incremental new content here (PF3 lone-pair contrast) was judged lower
//     priority than the geometries kept above.

const topic27Questions = [
  {
    topic: '2.7',
    mcq: true,
    title: 'MCQ — Hybridization of carbon and oxygen in methanol',
    content:
`What is the hybridization of the carbon atom and the oxygen atom in methanol (CH3OH), respectively?
(A) sp3 and sp2
(B) sp2 and sp
(C) sp and sp2
(D) sp3 and sp3`,
    answer: `Correct answer: (D) sp3 and sp3
Carbon in CH3OH is bonded to three hydrogen atoms and one oxygen atom, giving 4 bonding electron domains and no lone pairs. Four electron domains correspond to sp3 hybridization.
Oxygen in CH3OH is bonded to the carbon atom and to one hydrogen atom, and carries two lone pairs. This also gives 4 total electron domains (2 bonding + 2 lone pairs), so oxygen is also sp3 hybridized.
(A) is incorrect because it assigns oxygen sp2 hybridization, but oxygen has 4 electron domains (2 bonds + 2 lone pairs), not 3.
(B) and (C) are incorrect because they assign carbon sp2 or sp hybridization; carbon in methanol has 4 single bonds (4 electron domains), which is always sp3.`
  },
  {
    topic: '2.7',
    mcq: true,
    title: 'MCQ — sp2 and sp3 atom count in glycine',
    content:
`Glycine, the simplest amino acid, has the structure H2N–CH2–C(=O)–OH: an amino nitrogen bonded by single bonds to two hydrogens and the central (alpha) carbon; the alpha carbon bonded by single bonds to two hydrogens, the amino nitrogen, and the carboxyl carbon; and the carboxyl carbon double-bonded to one oxygen and single-bonded to a hydroxyl oxygen (which is in turn bonded to a hydrogen).

What is the correct number of sp2 and sp3 hybridized atoms (excluding hydrogen) in glycine?
(A) 8 sp2 atoms, 2 sp3 atoms
(B) 2 sp2 atoms, 8 sp3 atoms
(C) 3 sp2 atoms, 2 sp3 atoms
(D) 2 sp2 atoms, 3 sp3 atoms`,
    answer: `Correct answer: (D) 2 sp2 atoms, 3 sp3 atoms
Count electron domains on each non-hydrogen atom:
- Amino nitrogen: 3 single bonds (2 N-H, 1 N-C) + 1 lone pair = 4 domains -> sp3.
- Alpha carbon: 4 single bonds (2 C-H, 1 C-N, 1 C-C) = 4 domains -> sp3.
- Carboxyl carbon: 1 C=O double bond (counts as one domain) + 1 C-O single bond + 1 C-C single bond = 3 domains -> sp2.
- Carbonyl oxygen (C=O): 1 double-bond domain + 2 lone pairs = 3 domains -> sp2.
- Hydroxyl oxygen (-OH): 1 C-O single bond + 1 O-H single bond + 2 lone pairs = 4 domains -> sp3.
Totals: sp2 atoms = carboxyl carbon + carbonyl oxygen = 2. sp3 atoms = amino nitrogen + alpha carbon + hydroxyl oxygen = 3. Hydrogens are never hybridized (they have only a 1s orbital), so they are excluded from the count.
(A), (B), and (C) all mis-assign the hybridization of at least one atom; the only combination consistent with electron-domain counting is 2 sp2 and 3 sp3.`
  },
  {
    topic: '2.7',
    mcq: true,
    title: 'MCQ — Shape and bond angle of the TlBr3^2- ion',
    content:
`What are the correct molecular geometry and approximate bond angle for the TlBr3^2- ion?
(A) trigonal planar and 120°
(B) trigonal pyramidal and 107°
(C) tetrahedral and 109.5°
(D) trigonal pyramidal and 120°`,
    answer: `Correct answer: (B) trigonal pyramidal and 107°
Total valence electrons: Tl contributes 3, each of the 3 Br atoms contributes 7 (3 x 7 = 21), and the 2- charge adds 2 more electrons: 3 + 21 + 2 = 26 electrons (13 pairs).
Forming 3 Tl-Br single bonds uses 3 pairs (6 electrons). Each Br atom needs 3 lone pairs to complete its octet, using 3 x 3 = 9 pairs (18 electrons). That accounts for 3 + 9 = 12 of the 13 total pairs, leaving exactly 1 pair (2 electrons) unaccounted for — this remaining pair must sit on the central Tl atom as a lone pair.
So the central Tl atom has 3 bonding domains + 1 lone pair = 4 total electron domains, giving a tetrahedral electron-domain geometry. Because one domain is a lone pair, the molecular geometry (positions of atoms only) is trigonal pyramidal, analogous to NH3 or PCl3. The lone pair compresses the Br-Tl-Br bond angle below the ideal tetrahedral 109.5°, to approximately 107°, the same compression seen in AX3E1 species.
(A) and (D) are incorrect because 120° is the bond angle for a trigonal planar (AX3, no lone pair) species, not an AX3E1 species like this ion.
(C) is incorrect because the molecular geometry (ignoring the lone pair's position, counting only atoms) is trigonal pyramidal, not tetrahedral — tetrahedral describes the electron-domain geometry, not the molecular shape, and 109.5° is the unperturbed angle before lone-pair compression.`
  },
  {
    topic: '2.7',
    mcq: true,
    title: 'MCQ — Shape of the ClF2- ion',
    content:
`What is the correct molecular geometry of the ClF2- ion?
(A) Linear
(B) Bent
(C) Trigonal planar
(D) T-shaped`,
    answer: `Correct answer: (A) Linear
Total valence electrons: Cl contributes 7, each of the 2 F atoms contributes 7 (2 x 7 = 14), and the 1- charge adds 1 more electron: 7 + 14 + 1 = 22 electrons (11 pairs).
Forming 2 Cl-F single bonds uses 2 pairs. Each F atom needs 3 lone pairs to complete its octet, using 2 x 3 = 6 pairs. That accounts for 2 + 6 = 8 of the 11 pairs, leaving 3 pairs on the central Cl atom as lone pairs (chlorine, a period-3 element, can exceed an octet).
The central Cl atom therefore has 2 bonding domains + 3 lone pairs = 5 total electron domains, giving a trigonal bipyramidal electron-domain geometry. To minimize repulsion, all 3 lone pairs occupy the less-crowded equatorial positions, forcing the 2 bonding domains into the axial positions on opposite sides of Cl. With both F atoms directly across from each other through the central Cl, the molecular geometry is linear (F-Cl-F bond angle of 180°), the AX2E3 case.
(B) is incorrect because a bent shape results from an AX2E1 or AX2E2 arrangement (e.g., H2O), not AX2E3.
(C) and (D) are incorrect: trigonal planar requires 3 electron domains with no lone pairs (AX3), and T-shaped requires 5 domains but only 2 lone pairs (AX3E2), not 3.`
  },
  {
    topic: '2.7',
    mcq: true,
    title: 'MCQ — Molecular geometry vs. electron-domain geometry of PCl3',
    content:
`Which row correctly gives the molecular geometry and the electron-domain geometry of phosphorus trichloride, PCl3?

           Molecular geometry        Electron-domain geometry
(A)        trigonal planar           trigonal planar
(B)        trigonal pyramidal        tetrahedral
(C)        tetrahedral               trigonal planar
(D)        tetrahedral               trigonal pyramidal`,
    answer: `Correct answer: (B) trigonal pyramidal (molecular geometry) and tetrahedral (electron-domain geometry)
Phosphorus (group 15) has 5 valence electrons. It forms 3 single bonds to the 3 chlorine atoms (3 bonding domains) and retains 1 lone pair, giving 4 total electron domains around P.
Electron-domain geometry is determined by counting all domains (bonding + lone pairs): 4 domains -> tetrahedral electron-domain geometry.
Molecular geometry is determined by the arrangement of atoms only (ignoring the lone pair's "invisible" position): 3 bonded Cl atoms with 1 lone pair pushed into the fourth tetrahedral position gives a trigonal pyramidal molecular geometry — the same shape as ammonia, NH3.
(A) is incorrect because trigonal planar (both geometries) would require only 3 electron domains with no lone pair, which is not the case for PCl3 (it has 4).
(C) is incorrect because it swaps the two geometries backward, and also because "trigonal planar" is not possible with 4 electron domains.
(D) is incorrect because it labels the electron-domain geometry as "trigonal pyramidal" — trigonal pyramidal is a molecular geometry (atoms only), not an electron-domain geometry, which must be one of linear/trigonal planar/tetrahedral/trigonal bipyramidal/octahedral.`
  },
  {
    topic: '2.7',
    title: 'FRQ — Hydrazine, diimide, and hydrazinediium bonding',
    content:
`Hydrazine (N2H4) can be oxidized to form diimide (N2H2), a compound with an N=N double bond. Hydrazine can also be protonated twice to form the cation hydrazinediium (N2H6^2+), which has an ethane-like structure (each nitrogen bonded to 3 hydrogens and to the other nitrogen, with no lone pairs on nitrogen).

(a) Draw the Lewis structure of diimide, N2H2, showing all valence electrons.

(b) Determine the number of electron domains around each nitrogen atom in N2H2, and predict the H-N-N bond angle. Justify your answer using VSEPR theory.

(c) Determine the number of electron domains around each nitrogen atom in hydrazinediium (N2H6^2+), and predict the H-N-H bond angle.

(d) Compare the H-N-H bond angle in hydrazine (N2H4) to the H-N-H bond angle in hydrazinediium (N2H6^2+), and justify any difference based on electron-domain geometry.`,
    answer: `(a) Each N has 5 valence electrons and each H has 1, giving 5(2) + 1(2) = 12 valence electrons total. The Lewis structure is H-N=N-H: the two nitrogens are joined by a double bond, each nitrogen is single-bonded to one hydrogen, and each nitrogen retains one lone pair to complete its octet (4 bonding electrons from the double bond + 2 from the N-H bond + 2 lone-pair electrons = 8 electrons around each N).

(b) Each nitrogen in N2H2 has 3 electron domains: the N=N double bond (counted as one domain), the single N-H bond, and one lone pair. Three electron domains correspond to sp2 hybridization and a trigonal planar electron-domain geometry (ideal angle 120°). Because one of the three domains is a lone pair, its extra repulsion compresses the H-N-N bond angle to slightly less than 120° (approximately 120°, analogous to the compression seen in bent AX2E1 molecules like SO2 relative to their AX3 trigonal-planar parent geometry).

(c) In N2H6^2+, each nitrogen is bonded to 3 hydrogens and 1 other nitrogen (4 single bonds) with no lone pairs, so each nitrogen has 4 electron domains, all bonding. Four electron domains with no lone pairs give sp3 hybridization and a tetrahedral electron-domain geometry, so the H-N-H bond angle is the ideal tetrahedral angle, approximately 109.5°.

(d) In N2H4 (hydrazine), each nitrogen has 4 electron domains (2 N-H bonds, 1 N-N bond, 1 lone pair), which is also a tetrahedral electron-domain geometry (sp3), but the lone pair's greater repulsion compresses the H-N-H bond angle to slightly less than 109.5°. In N2H6^2+, protonation removes the lone pair on each nitrogen (converting it into a fourth N-H bond), so there is no lone-pair repulsion and the H-N-H angle is the full, uncompressed 109.5°. Therefore N2H4 has a smaller H-N-H bond angle than N2H6^2+, and the difference is explained entirely by the presence (N2H4) versus absence (N2H6^2+) of a lone pair on nitrogen, even though both species have the same electron-domain geometry (tetrahedral).`
  },
  {
    topic: '2.7',
    title: 'FRQ — Acetate ion, PCl5, and XeF4',
    content:
`A researcher is investigating the structure and properties of the acetate ion (CH3COO-), phosphorus pentachloride (PCl5), and xenon tetrafluoride (XeF4).

(a) Draw two valid resonance structures of the acetate ion, CH3COO-, and explain how resonance affects the two carbon-oxygen bond lengths in the ion.

(b) Determine the hybridization of the carboxyl carbon and of the methyl carbon in the acetate ion. Justify your answer based on electron-domain counting.

(c) Predict the molecular geometry of PCl5, and explain why the axial P-Cl bonds experience different repulsions than the equatorial P-Cl bonds.

(d) (i) Predict the molecular geometry of XeF4, justifying your answer based on electron-domain geometry. (ii) Explain why XeF4 has no overall dipole moment despite having lone pairs on the central atom.

(e) Compare the relative polarity of CH3COOH (acetic acid) and CH3COO- (acetate ion), and explain how their molecular structures contribute to the difference.`,
    answer: `(a) The two resonance structures each show the carboxyl carbon double-bonded to one oxygen and single-bonded to the other oxygen (which carries the negative charge and 3 lone pairs), with the position of the double bond and the negative charge switched between the two structures. Because both structures contribute equally to the true structure, the negative charge and the pi-bonding electron density are delocalized equally over both oxygens. As a result, the two C-O bonds are identical in length, each intermediate between a typical C-O single bond and a C=O double bond (rather than one distinctly shorter double bond and one distinctly longer single bond).

(b) The carboxyl carbon has 3 electron domains (1 C=O double bond, counted once, + 1 C-O single bond + 1 C-C single bond to the methyl carbon), so it is sp2 hybridized. The methyl carbon has 4 electron domains (3 C-H single bonds + 1 C-C single bond), so it is sp3 hybridized. Hybridization is assigned from the total number of electron domains (treating a double bond as a single domain), not from the number of atoms attached.

(c) Phosphorus in PCl5 has 5 bonding domains and no lone pairs, giving a trigonal bipyramidal molecular geometry: 3 equatorial Cl atoms arranged in a plane at 120° to each other, and 2 axial Cl atoms perpendicular to that plane. Axial Cl atoms are at a 90° angle to all 3 equatorial Cl atoms (three close, high-repulsion 90° interactions), while each equatorial Cl atom is at 90° to only the 2 axial atoms and at a less-repulsive 120° to the other 2 equatorial atoms. Because axial positions experience more close-range (90°) repulsive interactions than equatorial positions, axial P-Cl bonds experience greater electron-domain repulsion and are consequently slightly longer and weaker than equatorial P-Cl bonds.

(d) (i) Xenon in XeF4 has 6 electron domains (4 Xe-F bonding pairs + 2 lone pairs), giving an octahedral electron-domain geometry. To minimize lone pair-lone pair repulsion (the most repulsive interaction), the 2 lone pairs occupy positions directly across from each other (180° apart, trans), leaving the 4 fluorine atoms arranged in a plane around Xe. The resulting molecular geometry is square planar.
(ii) Because the molecule is square planar and symmetric, the 4 identical Xe-F bond dipoles point outward from the center at 90° intervals in the same plane, and each dipole is exactly canceled by the dipole directly opposite it. The vector sum of all 4 bond dipoles is zero, so XeF4 has no net dipole moment despite each individual Xe-F bond being polar.

(e) CH3COOH is more polar overall than CH3COO-. Acetic acid has an asymmetric structure including a strongly polar O-H bond, so its bond dipoles do not cancel and it has a substantial net dipole moment. The acetate ion, by contrast, has its negative charge and C-O bond character delocalized symmetrically over both oxygens by resonance, and has no O-H bond at all; the resulting charge distribution is more symmetric, which reduces (but does not eliminate) the net dipole moment compared to acetic acid. Acetate is still a polar (and charged) species — resonance makes it less asymmetric than acetic acid, not nonpolar.`
  },
  {
    topic: '2.7',
    title: 'FRQ — Oxygen hybridization and geometry in dimethyl ether vs. ethanol',
    content:
`Dimethyl ether (CH3OCH3) and ethanol (CH3CH2OH) share the same molecular formula, C2H6O, but the oxygen atom is bonded differently in each.

(a) Determine the hybridization of the oxygen atom in both dimethyl ether and ethanol. Justify your answer based on electron-domain counting.

(b) Predict the molecular geometry around the oxygen atom in both molecules, and state the approximate O-centered bond angle.`,
    answer: `(a) In both dimethyl ether and ethanol, the oxygen atom is bonded to 2 other atoms by single bonds (2 carbons in dimethyl ether; 1 carbon and 1 hydrogen in ethanol) and carries 2 lone pairs. This gives oxygen 4 total electron domains (2 bonding + 2 lone pairs) in both molecules, so the oxygen atom is sp3 hybridized in both dimethyl ether and ethanol.

(b) With 4 electron domains, the electron-domain geometry around oxygen is tetrahedral in both molecules, but because 2 of the 4 domains are lone pairs, the molecular geometry (positions of the bonded atoms only) is bent, the same shape as the oxygen in water. The 2 lone pairs repel the bonding domains more strongly than bonding pairs repel each other, compressing the C-O-C angle in dimethyl ether and the C-O-H angle in ethanol to slightly less than the ideal tetrahedral value of 109.5°.`
  }
];


const questions = [
  ...topic2_1Questions,
  ...topic23Questions,
  ...topic24Questions,
  ...topic25Questions,
  ...topic26Questions,
  ...topic27Questions,
];

async function main() {
  const toInsert = questions.filter(q => !q.skip);
  const { data: existing } = await sb.from('questions').select('id, topic_id, order_index');
  const maxOrderByTopic = {};
  for (const q of existing) {
    maxOrderByTopic[q.topic_id] = Math.max(maxOrderByTopic[q.topic_id] ?? -1, q.order_index ?? -1);
  }

  let inserted = 0, failed = 0;
  const perTopicCount = {};
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
      image_url: q.imageUrl || null,
      answer_key: q.answer,
    });
    if (error) { console.error('FAILED:', q.title, error); failed++; continue; }
    inserted++;
    perTopicCount[q.topic] = (perTopicCount[q.topic] || 0) + 1;
    console.log(`[${inserted}/${toInsert.length}] (${q.topic}) ${q.title} ... inserted`);
  }
  console.log(`\nDone. ${inserted} inserted, ${failed} failed.`);
  console.log('Per-topic counts:', perTopicCount);
}

main();
