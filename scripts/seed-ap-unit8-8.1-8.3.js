const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '4.8': '8fd35cca-19cf-4a1e-b0de-a69f805a109c',
  '8.1': 'e69ef38f-a102-4bc0-be5f-4a3f4e64da3f',
  '8.2': 'c8449c6b-38e6-4277-a48a-473afffd5c08',
  '8.3': 'ef536392-f05c-409a-937a-dafbfe95e39f',
};

/* ============================= 4.8 (review) — extra conjugate acid-base pair practice ============================= */
const t48extra = [
  {
    title: 'Q12 — Conjugate Acid-Base Pairs in the HCN / Water Reaction',
    content: `HCN(aq) + H2O(l) ⇌ CN-(aq) + H3O+(aq)

Identify both sets of conjugate acid-base pairs in the reaction above.`,
    answer: `Acid (reactant) / Conjugate base (product): HCN / CN-. (HCN donates a proton to become CN-.)

Base (reactant) / Conjugate acid (product): H2O / H3O+. (H2O accepts a proton to become H3O+.)`,
  },
  {
    title: 'Q13 — Conjugate Acid-Base Pairs in the Methylamine / Water Reaction',
    content: `CH3NH2(aq) + H2O(l) ⇌ CH3NH3+(aq) + OH-(aq)

Identify both sets of conjugate acid-base pairs in the reaction above.`,
    answer: `Base (reactant) / Conjugate acid (product): CH3NH2 / CH3NH3+. (CH3NH2 accepts a proton to become CH3NH3+.)

Acid (reactant) / Conjugate base (product): H2O / OH-. (H2O donates a proton to become OH-.)

(This example shows H2O acting as an acid — a proton donor — which contrasts with the HCN example, where H2O acted as a base — a proton acceptor. Water can behave as either, depending on what it reacts with.)`,
  },
];

/* ============================= 8.1 — Introduction to Acids and Bases ============================= */
const t81 = [
  {
    title: 'Q1 — Filling in pH, pOH, and [H3O+]/[OH-] Tables',
    content: `Fill in the missing information in the tables below.

Table 1: [H3O+] | pH
? | 11.65
? | 6.14
4.3 x 10^-5 M | ?
0.015 M | ?

Table 2: [OH-] | pOH | pH
? | 10.39 | ?
? | 8.04 | ?
6.8 x 10^-6 M | ? | ?
2.8 x 10^-4 M | ? | ?`,
    answer: `Table 1 (using [H3O+] = 10^-pH and pH = -log[H3O+]):
pH = 11.65 → [H3O+] = 10^-11.65 = 2.2 x 10^-12 M
pH = 6.14 → [H3O+] = 10^-6.14 = 7.2 x 10^-7 M
[H3O+] = 4.3 x 10^-5 M → pH = -log(4.3 x 10^-5) = 4.37
[H3O+] = 0.015 M → pH = -log(0.015) = 1.82

Table 2 (using [OH-] = 10^-pOH, pOH = -log[OH-], and pH = 14 - pOH):
pOH = 10.39 → [OH-] = 10^-10.39 = 4.1 x 10^-11 M; pH = 14 - 10.39 = 3.61
pOH = 8.04 → [OH-] = 10^-8.04 = 9.1 x 10^-9 M; pH = 14 - 8.04 = 5.96
[OH-] = 6.8 x 10^-6 M → pOH = -log(6.8 x 10^-6) = 5.17; pH = 14 - 5.17 = 8.83
[OH-] = 2.8 x 10^-4 M → pOH = -log(2.8 x 10^-4) = 3.55; pH = 14 - 3.55 = 10.45`,
  },
  {
    title: 'Q2 — How pH Changes as [H3O+] or [OH-] Changes',
    content: `As the value of [H3O+] increases, the value of pH (decreases / increases).
As the value of [OH-] increases, the value of pH (decreases / increases).`,
    answer: `As the value of [H3O+] increases, the value of pH decreases. (pH = -log[H3O+]; since the log function increases as its input increases, and pH is the NEGATIVE of that log, a larger [H3O+] produces a smaller — more negative before the sign flip — pH value.)

As the value of [OH-] increases, the value of pH increases. (A larger [OH-] means a smaller [H3O+], since [H3O+][OH-] = Kw is constant; a smaller [H3O+] corresponds to a larger pH, as explained above.)`,
  },
  {
    title: 'Q3 — Filling in a Full pH/pOH/Acidic-or-Basic Table',
    content: `Fill in the missing information in the table below. Assume that all solutions are at 25°C.

[H+] | pH | [OH-] | pOH | Acidic or Basic?
0.075 M | ? | ? | ? | ?
? | 5.63 | ? | ? | ?
? | ? | 3.8 x 10^-7 M | ? | ?
? | ? | ? | 4.54 | ?`,
    answer: `Row 1: [H+] = 0.075 M → pH = -log(0.075) = 1.12. [OH-] = Kw/[H+] = (1.0x10^-14)/0.075 = 1.3x10^-13 M → pOH = -log(1.3x10^-13) = 12.88. Since pH < 7, this solution is Acidic.

Row 2: pH = 5.63 → [H+] = 10^-5.63 = 2.3x10^-6 M. pOH = 14 - 5.63 = 8.37 → [OH-] = 10^-8.37 = 4.3x10^-9 M. Since pH < 7, this solution is Acidic.

Row 3: [OH-] = 3.8x10^-7 M → pOH = -log(3.8x10^-7) = 6.42. pH = 14 - 6.42 = 7.58 → [H+] = 10^-7.58 = 2.6x10^-8 M. Since pH > 7, this solution is Basic.

Row 4: pOH = 4.54 → pH = 14 - 4.54 = 9.46 → [H+] = 10^-9.46 = 3.5x10^-10 M. [OH-] = 10^-4.54 = 2.9x10^-5 M. Since pH > 7, this solution is Basic.`,
  },
  {
    title: 'Q4 — pH and pOH of Pure Water at Various Temperatures',
    content: `The autoionization of water is an endothermic reaction. The value of the equilibrium constant Kw is affected by changes in temperature, as shown in the table below.

Temperature (°C) | Kw | pKw
0 | 1.14 x 10^-15 | 14.943
10 | 2.93 x 10^-15 | 14.533
20 | 6.81 x 10^-15 | 14.167
25 | 1.01 x 10^-14 | 13.996
30 | 1.47 x 10^-14 | 13.833
40 | 2.92 x 10^-14 | 13.535
50 | 5.48 x 10^-14 | 13.261

Calculate the values of pH and pOH for pure water at each of the temperatures listed above.`,
    answer: `For pure water, [H3O+] = [OH-] (neutral), so pH = pOH = pKw/2 at every temperature.

0°C: pH = pOH = 14.943/2 = 7.47
10°C: pH = pOH = 14.533/2 = 7.27
20°C: pH = pOH = 14.167/2 = 7.08
25°C: pH = pOH = 13.996/2 = 7.00
30°C: pH = pOH = 13.833/2 = 6.92
40°C: pH = pOH = 13.535/2 = 6.77
50°C: pH = pOH = 13.261/2 = 6.63

(Notice that the pH of pure, neutral water is only exactly 7.00 at 25°C; it decreases at higher temperatures and increases at lower temperatures, even though the water is still neutral — pH = pOH — at every temperature.)`,
  },
  {
    title: 'Q5 — True or False Statements About the pH of Pure Water',
    content: `Decide if each of the following statements is true or false.

(a) A sample of pure H2O has a pH of 7.0 at any temperature.
(b) [H+] = [OH-] in a sample of pure H2O at any temperature.
(c) A sample of pure H2O is neutral, in which pH = pOH.
(d) If the pH of a sample of pure H2O is less than 7, then the temperature of the sample must be less than 25°C.
(e) H2O ionizes to a greater extent at 50°C than it does at 25°C.
(f) As the temperature increases, the pH of pure H2O decreases.
(g) If a sample of pure H2O has a pH of 6.8, then the pOH of pure water must be 7.2.`,
    answer: `(a) False. The pH of pure water is only exactly 7.0 at 25°C; at other temperatures, Kw changes, so the neutral pH (where pH = pOH) shifts away from 7.0 (e.g., pH = 6.63 at 50°C).

(b) True. Pure water is always neutral by definition — regardless of temperature, the autoionization 2 H2O ⇌ H3O+ + OH- always produces H3O+ and OH- in a 1:1 ratio, so [H+] = [OH-] at any temperature (even though the actual value of Kw, and thus the actual concentrations, changes with temperature).

(c) True. Since [H+] = [OH-] always in pure water (part b), taking -log of both sides gives pH = pOH always, which is the definition of neutral.

(d) False. As shown in the table, pure water's pH DECREASES as temperature increases above 25°C (e.g., pH = 6.63 at 50°C, which is less than 7), so a pH less than 7 for pure water indicates a temperature GREATER than 25°C, not less than 25°C.

(e) True. Kw increases as temperature increases (autoionization is endothermic, so heating shifts the equilibrium toward more ionization, per Le Chatelier's principle), meaning more H2O molecules ionize into H3O+ and OH- at higher temperatures.

(f) True. As shown in the table, pH decreases from 7.47 (at 0°C) down to 6.63 (at 50°C) as temperature increases, since more autoionization at higher temperatures produces higher [H3O+] (and correspondingly lower pH).

(g) False. Pure water is always neutral, meaning pH = pOH at any temperature (part c). If pH = 6.8, then pOH must also equal 6.8, not 7.2 (7.2 would only be correct if pKw were exactly 14, i.e., at 25°C, and even then pH=6.8 would not be the neutral pH at that temperature — the two must always be equal for pure water regardless of the specific pKw value).`,
  },
];

/* ============================= 8.2 — pH and pOH of Strong Acids and Bases ============================= */
const t82 = [
  {
    title: 'Q1 — Calculating pH and Concentration for Strong Acids',
    content: `The following questions are related to strong acids. Assume that all solutions are at 25°C.

(a) What is the pH of 0.050 M HCl(aq)?
(b) What is the pH of 2.5 x 10^-4 M HBr(aq)?
(c) What is the concentration of a solution of HClO4(aq) if the pH is 4.25?
(d) What is the concentration of a solution of HNO3(aq) if the pH is 6.33?`,
    answer: `Since HCl, HBr, HClO4, and HNO3 are all strong acids, they ionize completely, so [H3O+] = the initial concentration of the acid.

(a) [H3O+] = 0.050 M → pH = -log(0.050) = 1.30.

(b) [H3O+] = 2.5 x 10^-4 M → pH = -log(2.5 x 10^-4) = 3.60.

(c) pH = 4.25 → [H3O+] = 10^-4.25 = 5.6 x 10^-5 M. Since HClO4 ionizes completely, [HClO4]initial = [H3O+] = 5.6 x 10^-5 M.

(d) pH = 6.33 → [H3O+] = 10^-6.33 = 4.7 x 10^-7 M. Since HNO3 ionizes completely, [HNO3]initial = [H3O+] = 4.7 x 10^-7 M.`,
  },
  {
    title: 'Q2 — Calculating pH, pOH, and Concentration for Strong Bases',
    content: `Fill in the missing information in the table below (strong bases, which dissociate completely).

Base | Concentration of Base | [OH-] | pOH | pH
NaOH | 0.15 M | ? | ? | ?
KOH | ? | ? | ? | 11.51
Ca(OH)2 | 4.7 x 10^-5 M | ? | ? | ?
Ba(OH)2 | ? | ? | ? | 8.68`,
    answer: `NaOH: [OH-] = 0.15 M (1:1 dissociation) → pOH = -log(0.15) = 0.82 → pH = 14 - 0.82 = 13.18.

KOH: pH = 11.51 → pOH = 14 - 11.51 = 2.49 → [OH-] = 10^-2.49 = 3.2 x 10^-3 M. Since KOH is 1:1, concentration of KOH = [OH-] = 3.2 x 10^-3 M.

Ca(OH)2: Since Ca(OH)2 produces 2 OH- per formula unit, [OH-] = 2 x 4.7 x 10^-5 = 9.4 x 10^-5 M → pOH = -log(9.4 x 10^-5) = 4.03 → pH = 14 - 4.03 = 9.97.

Ba(OH)2: pH = 8.68 → pOH = 14 - 8.68 = 5.32 → [OH-] = 10^-5.32 = 4.8 x 10^-6 M. Since Ba(OH)2 produces 2 OH- per formula unit, concentration of Ba(OH)2 = [OH-]/2 = (4.8 x 10^-6)/2 = 2.4 x 10^-6 M.`,
  },
  {
    title: 'Q3 — Calculating the Dilution Volume Needed to Change pH',
    content: `A student measures the pH of a 100.0 mL sample of NaOH(aq) and records the pH as 12.00. Calculate the volume of distilled water that should be added to this solution so that the pH of the diluted solution is equal to 11.00.`,
    answer: `Initial pH = 12.00 → pOH = 14 - 12.00 = 2.00 → [OH-]initial = 10^-2.00 = 0.0100 M.

Final (target) pH = 11.00 → pOH = 14 - 11.00 = 3.00 → [OH-]final = 10^-3.00 = 0.00100 M.

Using the dilution equation M1V1 = M2V2 (moles of OH- are conserved upon dilution with water):

(0.0100 M)(100.0 mL) = (0.00100 M)(V2)

1.00 = 0.00100 x V2

V2 = 1000 mL (the total volume after dilution).

Volume of water added = V2 - V1 = 1000 mL - 100.0 mL = 900 mL.`,
  },
  {
    title: 'Q4 — Neutralization of a Strong Acid and Strong Base',
    content: `A student combined 500.0 mL of 0.050 M HCl(aq) with 500.0 mL of 0.10 M NaOH(aq) and mixed the final solution thoroughly.

(a) Write the net ionic equation for the reaction that occurs when aqueous solutions of a strong acid and a strong base are combined.
(b) Calculate the number of moles of HCl and the number of moles of NaOH present at the beginning of the experiment before the two solutions are combined.
(c) Calculate the number of moles of the excess reactant that remain left over in the combined solution. Assume that the acid-base reaction goes to completion.
(d) Calculate the pH of the combined solution at the end of the experiment.`,
    answer: `(a) H3O+(aq) + OH-(aq) → 2 H2O(l)     (or equivalently, H+(aq) + OH-(aq) → H2O(l))

(b) Moles HCl = (0.050 mol/L)(0.5000 L) = 0.0250 mol. Moles NaOH = (0.10 mol/L)(0.5000 L) = 0.0500 mol.

(c) Since HCl and NaOH react in a 1:1 ratio, and there is less HCl (0.0250 mol) than NaOH (0.0500 mol), HCl is the limiting reactant and is completely consumed. Moles of NaOH remaining (excess) = 0.0500 - 0.0250 = 0.0250 mol.

(d) Since NaOH is in excess, the resulting solution is basic. Total volume = 500.0 + 500.0 = 1000.0 mL = 1.000 L. [OH-] = (0.0250 mol)/(1.000 L) = 0.0250 M.

pOH = -log(0.0250) = 1.60. pH = 14 - 1.60 = 12.40.`,
  },
  {
    title: 'Q5 — Comparing Percent Ionization of a Strong Acid and a Weak Acid',
    content: `The table below contains information about two solutions with the same initial concentration of acid.

Acid | Initial Concentration of Acid, HA | [H3O+] at Equilibrium | pH
HNO3 | 0.036 M | 0.036 M | 1.44
HNO2 | 0.036 M | 0.0036 M | 2.44

percent ionization = ([H3O+]equilibrium / [HA]initial) x 100%

(a) Use the formula above and the data in the table to calculate the percent ionization of the acid in a solution of 0.036 M HNO3(aq).
(b) Use the formula above and the data in the table to calculate the percent ionization of the acid in a solution of 0.036 M HNO2(aq).
(c) Based on your answer to part (b), explain why HNO2 is classified as a weak acid.`,
    answer: `(a) Percent ionization of HNO3 = (0.036/0.036) x 100% = 100%.

(b) Percent ionization of HNO2 = (0.0036/0.036) x 100% = 10%.

(c) HNO2 is classified as a weak acid because only 10% of the HNO2 molecules initially present actually ionize to produce H3O+ and NO2- ions — the vast majority (90%) of the HNO2 molecules remain un-ionized in solution at equilibrium. This is in sharp contrast to the strong acid HNO3, which is 100% ionized (part a) — every single HNO3 molecule donates its proton to water. A weak acid, by definition, only partially ionizes in aqueous solution, which is exactly what the much lower percent ionization value for HNO2 demonstrates.`,
  },
  {
    title: 'Q6 — Comparing Initial Concentration for Two Acids with the Same pH',
    content: `The table below contains information about two solutions with the same pH. Fill in the missing information in the table below.

Acid | Initial Concentration of Acid, HA | pH | [H3O+] at Equilibrium | % Ionization of the Acid
HNO3 | ? | 1.86 | ? | ?
HNO2 | 0.50 M | 1.86 | ? | ?`,
    answer: `For both acids, pH = 1.86 → [H3O+] at equilibrium = 10^-1.86 = 0.0138 M ≈ 0.014 M (this is the same for both, since they share the same pH).

HNO3 (strong acid, ionizes completely): Since [H3O+]equilibrium = [HNO3]initial for a strong acid, [HNO3]initial = 0.014 M. Percent ionization = (0.014/0.014) x 100% = 100%.

HNO2 (weak acid, partially ionizes): [HNO2]initial = 0.50 M (given). Percent ionization = (0.0138/0.50) x 100% = 2.8%.

(This illustrates an important point: a weak acid can reach the same pH — the same [H3O+] — as a strong acid, but only by starting at a MUCH higher initial concentration, since only a small percentage of the weak acid's molecules actually ionize.)`,
  },
];

/* ============================= 8.3 — Weak Acid and Base Equilibria ============================= */
const t83 = [
  {
    title: 'Q1 — Ka Expression and Percent Ionization for Hydrofluoric Acid',
    content: `Hydrofluoric acid, HF, is a weak acid that ionizes in aqueous solution according to the equation shown below.

HF(aq) + H2O(l) ⇌ F-(aq) + H3O+(aq)     Ka = 6.8 x 10^-4

(a) Write the expression for the equilibrium constant, Ka, for this reaction.
(b) The pH of 0.50 M HF(aq) is 1.74.
   (i) Calculate the value of [H+] in 0.50 M HF(aq).
   (ii) Calculate the percent ionization in 0.50 M HF(aq).`,
    answer: `(a) Ka = ([H3O+][F-]) / [HF]

(b) (i) [H+] = [H3O+] = 10^-pH = 10^-1.74 = 0.0182 M ≈ 0.018 M.

(ii) Percent ionization = ([H3O+]equilibrium / [HF]initial) x 100% = (0.0182/0.50) x 100% = 3.6%.`,
  },
  {
    title: 'Q2 — Using a RICE Table to Find the pH of Acetic Acid',
    content: `Acetic acid, HC2H3O2, is a weak acid found in household vinegar. Acetic acid ionizes in aqueous solution according to the equation shown below.

HC2H3O2(aq) + H2O(l) ⇌ C2H3O2-(aq) + H3O+(aq)     Ka = 1.8 x 10^-5

(a) Do you predict that the pH of 0.50 M HC2H3O2(aq) should be less than, greater than, or equal to the pH of 0.50 M HF(aq)? Your justification should include a comparison of the Ka values for HF and HC2H3O2 and a comparison of the relative strength of these two acids.
(b) Fill in the missing information in the R-I-C-E table below. Let the variable "x" represent the concentration of the hydronium ion at equilibrium.
(c) Plug in all three values (in terms of x) from the bottom row of your R-I-C-E table into the Ka expression, Ka = ([H3O+][C2H3O2-])/[HC2H3O2] = 1.8 x 10^-5. Then solve for x. (You may assume that x is much smaller than 0.50 M, so that 0.50 - x ≈ 0.50.)
(d) In part (c), you solved for x, which represents [H3O+]equilibrium in 0.50 M HC2H3O2(aq). Calculate the pH of 0.50 M HC2H3O2(aq).`,
    answer: `(a) Greater than. HC2H3O2 has a smaller Ka (1.8 x 10^-5) than HF (6.8 x 10^-4), meaning HC2H3O2 is a WEAKER acid than HF (it ionizes to a lesser extent). Since HC2H3O2 ionizes less, it produces a smaller [H3O+] at equilibrium than HF does at the same initial concentration, which corresponds to a HIGHER pH (less acidic) for the acetic acid solution compared to the HF solution.

(b) RICE table (all concentrations in M):
Initial: [HC2H3O2] = 0.50, [C2H3O2-] = 0, [H3O+] ≈ 0
Change: [HC2H3O2] = -x, [C2H3O2-] = +x, [H3O+] = +x
Equilibrium: [HC2H3O2] = 0.50-x, [C2H3O2-] = x, [H3O+] = x

(c) Ka = (x)(x)/(0.50-x) ≈ x^2/0.50 = 1.8 x 10^-5 (using the approximation 0.50-x ≈ 0.50)

x^2 = (1.8 x 10^-5)(0.50) = 9.0 x 10^-6

x = √(9.0 x 10^-6) = 3.0 x 10^-3 M.

(d) pH = -log[H3O+] = -log(3.0 x 10^-3) = 2.52. (This confirms part (a): pH = 2.52 for acetic acid is indeed greater than the pH of 1.74 for HF at the same 0.50 M concentration.)`,
  },
  {
    title: 'Q3 — Determining Ka for Hypochlorous Acid from pH',
    content: `Hypochlorous acid, HOCl, is a weak acid that forms when chlorine dissolves in water. HOCl molecules react with water molecules to form hypochlorite ions, OCl-, and hydronium ions.

(a) Write the balanced chemical equation for the ionization of HOCl in aqueous solution.
(b) Write the Ka expression for hypochlorous acid.
(c) The pH of 0.50 M HOCl(aq) is 3.92. Make a R-I-C-E table to help you calculate the concentrations of HOCl, H3O+, and OCl- at equilibrium in 0.50 M HOCl(aq).
(d) Use the information from part (c) to calculate the value of Ka for HOCl.`,
    answer: `(a) HOCl(aq) + H2O(l) ⇌ OCl-(aq) + H3O+(aq)

(b) Ka = ([H3O+][OCl-]) / [HOCl]

(c) [H3O+] at equilibrium = 10^-pH = 10^-3.92 = 1.20 x 10^-4 M.

RICE table (all concentrations in M):
Initial: [HOCl] = 0.50, [OCl-] = 0, [H3O+] ≈ 0
Change: [HOCl] = -1.20x10^-4, [OCl-] = +1.20x10^-4, [H3O+] = +1.20x10^-4
Equilibrium: [HOCl] = 0.50 - 1.20x10^-4 ≈ 0.50 M, [OCl-] = 1.20x10^-4 M, [H3O+] = 1.20x10^-4 M.

(d) Ka = ([H3O+][OCl-])/[HOCl] = [(1.20x10^-4)(1.20x10^-4)] / 0.50 = (1.44 x 10^-8)/0.50 = 2.9 x 10^-8.`,
  },
  {
    title: 'Q4 — Relating Ka, pH, and Acid Strength (True/False Style Comparisons)',
    content: `Acid | HF | HC2H3O2 | HOCl
Ka | 6.8 x 10^-4 | 1.8 x 10^-5 | 2.9 x 10^-8
[HA]initial | 0.50 M | 0.50 M | 0.50 M
pH | 1.74 | 2.52 | 3.92
[H3O+]equilibrium | 0.018 M | 0.0030 M | 0.00012 M
% ionization | 3.6% | 0.6% | 0.024%

Use the information in the table above to answer the following questions.

(a) When comparing two different acids, the stronger acid is the acid that has the (lower / higher) Ka value.
(b) When comparing two different acids that have the same [HA]initial, the stronger acid will have the (lower / higher) pH.`,
    answer: `(a) The stronger acid is the acid that has the HIGHER Ka value. A higher Ka means the acid ionizes to a greater extent (a larger equilibrium concentration of ions relative to the un-ionized acid), which is the definition of a stronger acid. (Comparing the table: HF, with the highest Ka of 6.8x10^-4, is indeed the strongest of the three acids, having the highest percent ionization, 3.6%.)

(b) The stronger acid will have the LOWER pH. A stronger acid ionizes more, producing a higher [H3O+] at equilibrium (for the same initial concentration), and a higher [H3O+] corresponds to a lower pH. (Comparing the table: HF, the strongest acid, has the lowest pH, 1.74, while HOCl, the weakest acid, has the highest pH, 3.92.)`,
  },
  {
    title: 'Q5 — Explaining the Effect of Dilution on Percent Ionization Using Le Chatelier\'s Principle',
    content: `There is an interesting relationship between [HA]initial and the percent ionization of the acid.

hydrofluoric acid (HF): [HA]initial = 1.0 M → % ionization = 2.6%; [HA]initial = 0.50 M → % ionization = 3.6%; [HA]initial = 0.10 M → % ionization = 7.9%; [HA]initial = 0.050 M → % ionization = 11%; [HA]initial = 0.010 M → % ionization = 23%.

acetic acid (HC2H3O2): [HA]initial = 1.0 M → % ionization = 0.42%; [HA]initial = 0.50 M → % ionization = 0.60%; [HA]initial = 0.10 M → % ionization = 1.3%; [HA]initial = 0.050 M → % ionization = 1.9%; [HA]initial = 0.010 M → % ionization = 4.2%.

As the value of [HA]initial decreases:
- the value of [H3O+]equilibrium (decreases / increases)?
- the pH of the solution (decreases / increases)?
- the percent ionization of the acid (decreases / increases)?

The inverse relationship between [HA]initial and the percent ionization of the acid can be explained in terms of Le Chatelier's principle. Suppose that 500 mL of H2O is added to 500 mL of a weak acid, HA. Explain, using the reaction quotient Qa, why dilution with water causes the percent ionization of a weak acid to increase.`,
    answer: `As [HA]initial decreases: [H3O+]equilibrium decreases (less total acid means less total H3O+ produced, even though a higher fraction ionizes); the pH of the solution increases (lower [H3O+] means higher pH); the percent ionization of the acid increases (as shown clearly in both tables — the percent ionization values get larger as [HA]initial gets smaller).

Explanation using Qa and Le Chatelier's principle: For the equilibrium HA(aq) ⇌ H+(aq) + A-(aq), Ka = [H+][A-]/[HA]. When 500 mL of water is added to 500 mL of the weak acid solution, every concentration ([HA], [H+], [A-]) is instantly cut in half. Substituting these halved values into the reaction quotient expression:

Qa = (½[H+])(½[A-]) / (½[HA]) = ¼([H+][A-]) / (½[HA]) = ½ x ([H+][A-]/[HA]) = ½ Ka

Since Qa (= ½ Ka) is now LESS than Ka, the system is no longer at equilibrium — there are "not enough products" relative to the new, more dilute conditions. By Le Chatelier's principle, the equilibrium shifts to the RIGHT (a net conversion of reactants, HA, into products, H+ and A-) until Qa once again equals Ka. This net forward shift means that a LARGER fraction (percentage) of the original HA molecules end up ionized after dilution than before — explaining why percent ionization increases as the acid is diluted (as [HA]initial decreases).`,
  },
  {
    title: 'Q6 — Kb Expression and Percent Ionization for Ammonia',
    content: `Ammonia, NH3, is a weak base that ionizes in aqueous solution according to the equation shown below.

NH3(aq) + H2O(l) ⇌ NH4+(aq) + OH-(aq)     Kb = 1.8 x 10^-5

(a) Write the expression for the equilibrium constant, Kb, for this reaction.
(b) The pH of 0.50 M NH3(aq) is 11.48. Calculate the value of [OH-] in 0.50 M NH3(aq).
(c) Use the formula below and your answer to part (b) to calculate the percent ionization of the base in a solution of 0.50 M NH3(aq).

percent ionization = ([OH-]equilibrium / [B]initial) x 100%`,
    answer: `(a) Kb = ([NH4+][OH-]) / [NH3]

(b) pH = 11.48 → pOH = 14 - 11.48 = 2.52 → [OH-] = 10^-2.52 = 3.0 x 10^-3 M.

(c) Percent ionization = (3.0 x 10^-3 / 0.50) x 100% = 0.60%.`,
  },
  {
    title: 'Q7 — Using the Ka x Kb = Kw Relationship for a Conjugate Acid-Base Pair',
    content: `Propanoic acid, HC3H5O2, ionizes in aqueous solution according to the equation shown below.

HC3H5O2(aq) + H2O(l) ⇌ C3H5O2-(aq) + H3O+(aq)

(a) Write the expression for the equilibrium constant, Ka, for this reaction.
(b) The pKa for HC3H5O2 is 4.88. Calculate the value of Ka for HC3H5O2.
(c) Calculate the pH of 0.50 M HC3H5O2(aq).

The propanoate ion, C3H5O2-, ionizes in aqueous solution according to the equation shown below.

C3H5O2-(aq) + H2O(l) ⇌ HC3H5O2(aq) + OH-(aq)

(d) Calculate the value of Kb for the propanoate ion, C3H5O2-.
(e) Calculate the pH of 0.50 M NaC3H5O2(aq).`,
    answer: `(a) Ka = ([H3O+][C3H5O2-]) / [HC3H5O2]

(b) Ka = 10^-pKa = 10^-4.88 = 1.32 x 10^-5.

(c) RICE table with x = [H3O+] at equilibrium: Ka = x^2/(0.50-x) ≈ x^2/0.50 = 1.32 x 10^-5.

x^2 = (1.32 x 10^-5)(0.50) = 6.60 x 10^-6

x = √(6.60 x 10^-6) = 2.57 x 10^-3 M.

pH = -log(2.57 x 10^-3) = 2.59.

(d) Since HC3H5O2 and C3H5O2- are a conjugate acid-base pair, Ka x Kb = Kw = 1.0 x 10^-14.

Kb = Kw/Ka = (1.0 x 10^-14)/(1.32 x 10^-5) = 7.58 x 10^-10.

(e) For 0.50 M NaC3H5O2 (a solution of the conjugate base, which raises the pH above 7 since it's a weak base): RICE table with x = [OH-] at equilibrium: Kb = x^2/(0.50-x) ≈ x^2/0.50 = 7.58 x 10^-10.

x^2 = (7.58 x 10^-10)(0.50) = 3.79 x 10^-10

x = √(3.79 x 10^-10) = 1.95 x 10^-5 M = [OH-].

pOH = -log(1.95 x 10^-5) = 4.71. pH = 14 - 4.71 = 9.29.`,
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
  }));

  const { error: insertErr } = await sb.from('questions').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`Inserted ${rows.length} questions into topic ${topicKey}`);
}

(async () => {
  try {
    await insertTopic('4.8', t48extra);
    await insertTopic('8.1', t81);
    await insertTopic('8.2', t82);
    await insertTopic('8.3', t83);
    console.log('Done — Unit 8 Topics 8.1-8.3 (+ 4.8 extras) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
