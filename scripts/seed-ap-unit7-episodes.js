const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '7.1': 'd017b6b8-d855-49de-bdca-8ddd4252363a',
  '7.2': '1a61223f-56bd-4a5b-909e-352a03247b49',
  '7.3': 'cdbbb615-776f-4e4d-bf8f-471e8995ab7c',
  '7.4': 'ff5b05ae-244c-4c42-bf7d-e278a3708978',
  '7.5': '7d7121ce-6c53-4332-a616-f6ef85cd65a6',
  '7.6': '70b2eaac-9329-4935-b362-413662a251c2',
  '7.7': 'a2853644-972c-401b-b56b-07f1f3c66436',
  '7.8': 'd654adce-63df-431a-b088-3ec9830b92e2',
  '7.9': 'b7fa140c-a5ed-4693-8666-44d94d4485a7',
  '7.10': 'f7f32d41-adc1-4800-93c7-9b01d19b74ff',
  '7.11': '67b58ec6-c8c9-4fdd-8bb8-b00f0c102fa4',
  '7.12': '058942dc-79fe-44ce-ad41-bc029ca5893e',
};

const IMG_DIR = path.join(__dirname, 'tmp-episode-imgs', 'unit7');

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(IMG_DIR, localFile));
  const storagePath = `unit7-episodes/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 7.1 — Introduction to Equilibrium (Episode #20) ============================= */
const t71 = [
  {
    title: 'Episode Review Q1 — Identifying When Equilibrium Is Reached from Concentration Data',
    content: `X2(g) ⇌ 2 X(g)

A sample of X2(g) is placed into an evacuated container at 400 K and allowed to undergo the reversible reaction represented above. The concentration of X2(g) and X(g) is measured over time:

Time (min): 0, 5, 10, 15, 20, 25, 30, 35, 40, 45
[X2] (mol/L): 6.8, 5.8, 4.9, 4.1, 3.4, 2.8, 2.3, 2.3, 2.3, 2.3
[X] (mol/L): 0.0, 2.0, 3.8, 5.4, 6.8, 8.0, 9.0, 9.0, 9.0, 9.0

Based on the data, which of the following claims regarding equilibrium is most likely to be correct?

(A) The system first reached equilibrium at a point between 10 minutes and 15 minutes, because that is the time period during which the concentrations of X2(g) and X(g) were equal.
(B) The system first reached equilibrium at 20 minutes, because [X] is twice as much as [X2], matching the stoichiometry of the balanced equation.
(C) The system first reached equilibrium at approximately 30 minutes, because the concentrations of X2(g) and X(g) remained constant beyond 30 minutes.
(D) The system did not reach equilibrium during this experiment because only 66% of the reactant X2(g) was consumed.`,
    answer: `(C). Equilibrium is defined by concentrations that stop changing over time (remain constant), not by concentrations being equal to each other (ruling out (A)) or matching the stoichiometric ratio at some particular moment (ruling out (B), which is a coincidental snapshot at t=20 min where the reaction is still actively proceeding, since concentrations continue to change afterward). Beginning at t=30 minutes, both [X2] (2.3 M) and [X] (9.0 M) remain unchanged through t=35, 40, and 45 minutes — this constancy is the correct indicator that equilibrium was first established at approximately 30 minutes. Option (D) is incorrect because the data clearly shows the system does stabilize by the end of the experiment.`,
  },
  {
    title: 'Episode Review Q2 — Identifying the Time at Which Equilibrium Is Established from a Partial-Pressure Graph',
    imageKey: 'q2_graph',
    content: `Q2(g) + 2 X2(g) ⇌ 2 QX2(g)

The substances Q2(g) and X2(g) were placed in a rigid vessel and allowed to reach equilibrium according to the equation shown above. The graph shows how the partial pressures of Q2(g), X2(g), and QX2(g) changed over time: Q2 and X2 both decrease then level off, QX2 increases then levels off. At time t1, the Q2 and X2 curves are still crossing/changing; at time t2, all three curves have become flat (horizontal).

Based on the graph, which of the following identifies the approximate time at which equilibrium was established and provides the correct justification?

Approximate Time | Justification
(A) t1 | The rates of the forward and reverse reactions were equal.
(B) t1 | The partial pressures of X2(g) and QX2(g) were equal.
(C) t2 | The rates of the forward and reverse reactions were equal.
(D) t2 | The rate of formation of QX2 molecules was equal to the rate of disappearance of Q2 molecules.`,
    answer: `(C). At t1, the partial pressures of all three gases are still actively changing (the curves are still sloped, not yet flat) — this is NOT equilibrium, even though the curves happen to cross at that point (ruling out (A) and (B), since equal partial pressures at a crossing point is a coincidence, not the definition of equilibrium). At t2, all three curves become flat (constant), which is the correct visual indicator that equilibrium has been established — and the correct definition/justification for equilibrium is that the rates of the forward and reverse reactions have become equal (not merely that formation/disappearance rates of two specific species match a stoichiometric ratio, which — per the equation's 1:1 coefficient relationship between Q2 and QX2 — would actually be true at every moment of the reaction, not just at equilibrium, making (D) a true but non-distinguishing statement).`,
  },
];

/* ============================= 7.2 — Direction of Reversible Reactions (Episode #20) ============================= */
const t72 = [
  {
    title: 'Episode Review Q3 — Comparing Forward and Reverse Reaction Rates from Partial-Pressure Data',
    content: `AX(g) ⇌ A(g) + X(g)

A chemical reaction occurs in a rigid vessel according to the equation shown above. The progress of the reaction is monitored by measuring partial pressures:

Time | P(AX) (atm) | P(A) (atm) | P(X) (atm)
t0 | 2.0 | 1.0 | 1.0
t1 | 2.6 | 0.40 | 0.40
t2 | 2.7 | 0.30 | 0.30
t3 | 2.8 | 0.20 | 0.20
t4 | 2.8 | 0.20 | 0.20

Which of the following correctly compares the rate of the forward reaction with the rate of the reverse reaction between times t1 and t2 and provides the correct justification?

Comparison | Justification
(A) forward < reverse | The partial pressure of AX(g) at time t2 is greater than the partial pressure of A(g).
(B) forward < reverse | Between times t1 and t2, the partial pressure of AX(g) increases.
(C) forward > reverse | The partial pressure of AX(g) at time t2 is greater than the partial pressure of A(g).
(D) forward > reverse | Between times t1 and t2, the partial pressure of AX(g) increases.`,
    answer: `(B). Between t1 and t2, P(AX) increases (2.6 → 2.7 atm) while P(A) and P(X) both decrease (0.40 → 0.30 atm). Since AX is being net PRODUCED during this interval, the reverse reaction (A + X → AX) must be occurring faster than the forward reaction (AX → A + X) — so the rate of the forward reaction is LESS than the rate of the reverse reaction. The correct justification is that the partial pressure of AX(g) increases over this interval (a valid trend-based justification), not a comparison of absolute pressure values between two different species at a single time point (which is what options (A) and (C) incorrectly offer as justification).`,
  },
];

/* ============================= 7.3 — Reaction Quotient and Equilibrium Constant (Episode #20) ============================= */
const t73 = [
  {
    title: 'Episode Review Q4 — Writing the Kp Expression for N2O4 Formation',
    content: `2 NO2(g) ⇌ N2O4(g)

Which of the following is the correct expression for the equilibrium constant, Kp, for the reaction represented by the balanced chemical equation shown above?

(A) Kp = [NO2]² / [N2O4]
(B) Kp = [N2O4] / [NO2]²
(C) Kp = (P(NO2))² / P(N2O4)
(D) Kp = P(N2O4) / (P(NO2))²`,
    answer: `(D). A Kp expression must use partial pressures (P), not concentration brackets — ruling out (A) and (B). The correct ratio is products over reactants, each raised to its coefficient: Kp = P(N2O4) / [P(NO2)]², since N2O4 is the product (coefficient 1) and NO2 is the reactant (coefficient 2). Option (C) has the ratio inverted (reactant over product), which would correspond to the reverse reaction.`,
  },
  {
    title: 'Episode Review Q5 — Identifying Two Mistakes in a Ksp Expression',
    content: `CaF2(s) ⇌ Ca2+(aq) + 2 F–(aq)     Ksp = 5.3 × 10⁻⁹ at 25°C

A student wrote the following expression for the solubility product constant, Ksp:

Ksp = [Ca][F]² / [CaF2]

Identify two different mistakes present in the student's Ksp expression.`,
    answer: `Mistake #1: The expression incorrectly includes [CaF2] in the denominator. CaF2(s) is a solid, and solids (along with pure liquids) are never included in an equilibrium constant expression.

Mistake #2: The expression omits the charges on the ions — it should be written as [Ca2+] and [F–]², not [Ca] and [F]² (which would represent the neutral elements, not the aqueous ions actually present in solution).

Correct expression: Ksp = [Ca2+][F–]²`,
  },
  {
    title: 'Episode Review Q6 — Writing the Qc Expression for a Hydrolysis Reaction',
    content: `OBr–(aq) + H2O(l) ⇌ HOBr(aq) + OH–(aq)

Write the expression for the reaction quotient, Qc, for the reaction represented by the balanced chemical equation shown above.`,
    answer: `Qc = [HOBr][OH–] / [OBr–]

(H2O(l) is a pure liquid and is excluded from the expression.)`,
  },
];

/* ============================= 7.4 — Calculating the Equilibrium Constant (Episode #20) ============================= */
const t74 = [
  {
    title: 'Episode Review Q7 — Calculating Kc from Initial and Equilibrium Amounts (XY2 + Y2 ⇌ XY3)',
    content: `2 XY2(g) + Y2(g) ⇌ 2 XY3(g)

XY2(g) reacts with Y2(g) to produce XY3(g) according to the equation above. Initial amounts in a rigid 1.00 L vessel at 500 K: 5.00 mol XY2, 5.00 mol Y2, 0.00 mol XY3.

After the system reaches equilibrium at 500 K, 3.60 mol of XY3(g) is present. The value of Kc at 500 K is closest to which of the following?

(A) 0.804
(B) 1.84
(C) 2.07
(D) 4.72`,
    answer: `(C). Since XY3 increased by 3.60 mol (from 0), and the stoichiometry is 2 XY2 : 1 Y2 : 2 XY3, the change in XY2 = −3.60 mol (1:1 with XY3) and the change in Y2 = −3.60/2 = −1.80 mol (half of XY3's change).

Equilibrium (in a 1.00 L vessel, so mol = M): [XY2] = 5.00 − 3.60 = 1.40 M, [Y2] = 5.00 − 1.80 = 3.20 M, [XY3] = 3.60 M.

Kc = [XY3]² / ([XY2]²[Y2]) = (3.60)² / [(1.40)²(3.20)] = 12.96 / 6.272 = 2.07.`,
  },
  {
    title: 'Episode Review Q8 — Calculating Kp from Total Pressure Change (Decomposition of D2X2)',
    content: `D2X2(g) ⇌ D2(g) + X2(g)

D2X2(g) decomposes according to the equation above. When pure D2X2(g) is injected into a rigid, previously evacuated flask at 350 K, the pressure in the flask is initially 3.00 atm. After the reaction reaches equilibrium at 350 K, the total pressure in the flask is 3.75 atm. The value of Kp for the reaction at 350 K is closest to

(A) 0.188
(B) 0.250
(C) 2.25
(D) 3.00`,
    answer: `(B). Let x = the change in partial pressure. Since 1 mol D2X2 produces 1 mol D2 + 1 mol X2 (net +1 mol gas per mol reacted), total pressure = (3.00 − x) + x + x = 3.00 + x. Setting this equal to 3.75: x = 0.75.

P(D2X2) = 3.00 − 0.75 = 2.25 atm, P(D2) = 0.75 atm, P(X2) = 0.75 atm.

Kp = P(D2)·P(X2) / P(D2X2) = (0.75)(0.75) / 2.25 = 0.5625 / 2.25 = 0.250.`,
  },
  {
    title: 'Episode Review Q9 — Calculating Qp and Kp from Time-Course Partial Pressure Data (2 NO + O2 ⇌ 2 NO2)',
    content: `2 NO(g) + O2(g) ⇌ 2 NO2(g)

Equimolar amounts of NO(g) and O2(g) are placed in a previously evacuated rigid reaction vessel, where they react according to the equation above. Partial pressures are monitored at constant temperature:

Time | P(NO) (atm) | P(O2) (atm) | P(NO2) (atm)
t0 | 1.00 | 1.00 | 0.00
t1 | 0.800 | 0.900 | 0.200
t2 | 0.660 | 0.830 | 0.340
t3 | 0.560 | 0.780 | 0.440
t4 | 0.480 | 0.740 | 0.520
t5 | 0.420 | 0.710 | 0.580
t6 | 0.420 | 0.710 | 0.580

(a) Write the expression for the equilibrium constant, Kp, for this reaction.
(b) (i) Determine the value of the reaction quotient, Qp, at time t4.
(ii) Determine the value of the equilibrium constant, Kp, when the reaction system has reached equilibrium.`,
    answer: `(a) Kp = [P(NO2)]² / {[P(NO)]²·P(O2)}

(b)(i) At t4: Qp = (0.520)² / [(0.480)²(0.740)] = 0.2704 / [0.2304 × 0.740] = 0.2704 / 0.170496 = 1.59.

(ii) Equilibrium is reached by t5 (values repeat unchanged at t6: P(NO) = 0.420, P(O2) = 0.710, P(NO2) = 0.580). Kp = (0.580)² / [(0.420)²(0.710)] = 0.3364 / [0.1764 × 0.710] = 0.3364 / 0.125244 = 2.69.`,
  },
  {
    title: 'Episode Review Q10 — Calculating Kp and Verifying Re-Established Equilibrium After a Disturbance (A2 + Q2 ⇌ 2 AQ)',
    content: `A2(g) + Q2(g) ⇌ 2 AQ(g)

A chemist adds pure samples of A2(g) and Q2(g) to a previously evacuated rigid reaction vessel. A reaction occurs at 800 K according to the equation shown above. Partial pressures are monitored over time:

Time | P(A2) (atm) | P(Q2) (atm) | P(AQ) (atm)
t0 | 5.20 | 4.00 | 0.00
t1 | 3.20 | 2.00 | 4.00
t2 | 3.20 | 5.00 | 4.00
t3 | 2.56 | 4.36 | 5.28

(a) At time t1, the system reaches equilibrium. Determine the value of the equilibrium constant, Kp, for the reaction at 800 K.
(b) At time t2, additional Q2(g) is injected into the reaction vessel, and the temperature of the reaction mixture is maintained at 800 K. A student makes the claim that equilibrium has been re-established for the system at time t3. Do you agree or disagree with the student's claim? Justify your answer by comparing the value of the reaction quotient, Qp, with the value of the equilibrium constant determined in part (a).`,
    answer: `(a) Kp = [P(AQ)]² / [P(A2)·P(Q2)] = (4.00)² / [(3.20)(2.00)] = 16.00 / 6.40 = 2.50.

(b) Agree. At t3: Qp = (5.28)² / [(2.56)(4.36)] = 27.8784 / 11.1616 = 2.50 ≈ Kp (2.50) from part (a). Since Qp = Kp, equilibrium has indeed been re-established.`,
  },
  {
    title: 'Episode Review Q11 — Finding Initial Moles from Kc and Equilibrium Moles (Decomposition of DG)',
    content: `2 DG(g) ⇌ D2(g) + G2(g)     Kc = 4.0 at 600 K

A pure sample of DG(g) is pumped into a previously evacuated, rigid 1.00 L container and allowed to attain the equilibrium shown above at 600 K. If 0.80 mol of D2(g) is present at equilibrium, how many moles of DG(g) were initially added to the container?

(A) 0.40 mol
(B) 0.80 mol
(C) 1.6 mol
(D) 2.0 mol`,
    answer: `(D). Since D2 and G2 form in a 1:1 ratio, [G2] = 0.80 M at equilibrium as well (same as D2). Since 2 mol DG is consumed per 1 mol D2 formed, the change in DG = −2(0.80) = −1.60 mol.

Let y = initial moles (= initial concentration, since V = 1.00 L) of DG. At equilibrium, [DG] = y − 1.60.

Kc = [D2][G2] / [DG]² = 4.0: (0.80)(0.80) / (y − 1.60)² = 4.0 → 0.64 / (y − 1.60)² = 4.0 → (y − 1.60)² = 0.16 → y − 1.60 = 0.40 → y = 2.00 mol.`,
  },
];

/* ============================= 7.5 — Magnitude of the Equilibrium Constant (Episode #21) ============================= */
const t75 = [
  {
    title: 'Episode Review Q1 — Ordering Equilibrium Concentrations When K Is Very Large',
    content: `CH3OH(g) + HCl(g) ⇌ CH3Cl(g) + H2O(g)     Kc = 4.7 × 10³ at 400 K

A 0.25 mol sample of CH3OH(g) and a 0.75 mol sample of HCl(g) are introduced into a rigid, previously evacuated reaction vessel and allowed to reach equilibrium at 400 K. Which of the following is true at equilibrium?

(A) [CH3OH] < [HCl] < [CH3Cl]
(B) [CH3OH] < [CH3Cl] < [HCl]
(C) [HCl] < [CH3OH] < [CH3Cl]
(D) [HCl] < [CH3Cl] < [CH3OH]`,
    answer: `(B). Since Kc is very large (4.7 × 10³), the forward reaction proceeds essentially to completion. CH3OH (0.25 mol) is the limiting reactant in this 1:1 reaction, so it is nearly entirely consumed at equilibrium (very small, the smallest value). HCl started with an excess of 0.75 mol; after ~0.25 mol reacts, ~0.50 mol remains (the largest value). CH3Cl forms in an amount matching CH3OH consumed, ~0.25 mol (a middle value). Order: [CH3OH] < [CH3Cl] < [HCl].`,
  },
  {
    title: 'Episode Review Q2 — Comparing Ion Concentrations When Ka Is Very Small',
    content: `HF(aq) + H2O(l) ⇌ F–(aq) + H3O+(aq)     Ka = 6.8 × 10⁻⁴

The ionization of HF(aq) in water is represented by the equation above. In a solution of 0.10 M HF(aq) at equilibrium, is the concentration of F–(aq) less than, greater than, or equal to the concentration of HF(aq)? Justify your answer.`,
    answer: `[F–] is less than [HF]. Since Ka is very small (6.8 × 10⁻⁴, much less than 1), only a small fraction of the original HF ionizes at equilibrium — most of the HF remains un-ionized. This means the concentration of the un-ionized HF remaining is much greater than the concentration of F– produced by the (limited) ionization.`,
  },
  {
    title: 'Episode Review Q3 — Filling In a RICE Table and Finding a Very Small Equilibrium Concentration',
    content: `Q2(g) + 3 X2(g) ⇌ 2 QX3(g)     Kc = 8.0 × 10¹¹ at 700 K

Samples of Q2(g) and X2(g) are introduced into a previously evacuated rigid container. A chemical reaction occurs according to the equation shown above until equilibrium is reached at 700 K. Initial concentrations: [Q2] = 1.2 M, [X2] = 2.4 M, [QX3] = 0.0 M.

(a) Considering the value of Kc, fill in the missing information in the RICE table to determine the concentrations of all three substances present when the system reaches equilibrium at 700 K.
(b) At equilibrium, the concentration of X2(g) in the reaction vessel is a very small value, but not exactly equal to zero. Calculate the concentration of X2(g) in the reaction vessel at equilibrium.`,
    answer: `(a) Since Kc is enormous (8.0 × 10¹¹), the reaction proceeds essentially to completion. Comparing available amounts to the required 1:3 ratio (Q2:X2): 1.2 M Q2 would require 3.6 M X2, but only 2.4 M X2 is available — so X2 is the limiting reactant (nearly fully consumed).

Change: Q2 = −0.8 (= −2.4/3), X2 = −2.4, QX3 = +1.6 (= 2 × 2.4/3).

Equilibrium (near-completion): [Q2] = 1.2 − 0.8 = 0.4 M, [X2] ≈ very small (see part b), [QX3] = 1.6 M.

(b) Kc = [QX3]² / ([Q2][X2]³): 8.0 × 10¹¹ = (1.6)² / [(0.4)(X2)³] = 2.56 / (0.4 · X2³).

0.4 · X2³ = 2.56 / (8.0 × 10¹¹) = 3.2 × 10⁻¹². X2³ = 8.0 × 10⁻¹². [X2] = (8.0 × 10⁻¹²)^(1/3) = 2.0 × 10⁻⁴ M.`,
  },
];

/* ============================= 7.6 — Properties of the Equilibrium Constant (Episode #21) ============================= */
const t76 = [
  {
    title: 'Episode Review Q4 — Finding K for a Reversed and Doubled Equation',
    content: `½ H2(g) + ½ Br2(g) ⇌ HBr(g)     Keq = 1.0 × 10²

Based on the information above, what is the value of Keq for the reaction represented below?

2 HBr(g) ⇌ H2(g) + Br2(g)

(A) 1.0 × 10⁻⁴
(B) 5.0 × 10⁻³
(C) 1.0 × 10⁻¹
(D) 1.0 × 10⁴`,
    answer: `(A). The target equation is the reverse of the given equation, multiplied by 2. Reversing gives K_reversed = 1/Keq = 1/100 = 0.01. Multiplying the (reversed) equation by 2 raises K to the power 2: K_new = (0.01)² = 1.0 × 10⁻⁴.`,
  },
  {
    title: "Episode Review Q5 — Applying Hess's Law-Style Rules to Combine and Modify Equilibrium Constants",
    content: `Chemical Equation | Kp at 300 K
2 DX(g) → 2 D(g) + X2(g) | 5.0 × 10⁻²
DX(g) + AX(g) → AX2(g) + D(g) | 4.0 × 10⁻³

The chemical equations above have been modified and added together to produce a third equation. Determine the value of Kp at 300 K for each equation listed below.

Chemical Equation | Kp
2 D(g) + X2(g) → 2 DX(g) | Kp = ?
2 DX(g) + 2 AX(g) → 2 AX2(g) + 2 D(g) | Kp = ?
2 AX(g) + X2(g) → 2 AX2(g) | Kp = ?`,
    answer: `Row 1 (reverse of the first given equation): Kp = 1 / (5.0 × 10⁻²) = 20.

Row 2 (second given equation multiplied by 2): Kp = (4.0 × 10⁻³)² = 1.6 × 10⁻⁵.

Row 3 (sum of row 1 + row 2 — the 2 D(g) terms cancel with the 2 D(g) produced, and 2 DX(g) cancels with 2 DX(g) consumed, leaving 2 AX(g) + X2(g) → 2 AX2(g)): Kp = (row 1 Kp) × (row 2 Kp) = 20 × 1.6 × 10⁻⁵ = 3.2 × 10⁻⁴.`,
  },
];

/* ============================= 7.7 — Calculating Equilibrium Concentrations (Episode #21) ============================= */
const t77 = [
  {
    title: 'Episode Review Q6 — Finding Initial Moles from Kc and an Equilibrium Concentration (H2 + I2 ⇌ 2 HI)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 49.7 at 458°C

Equimolar amounts of hydrogen gas and iodine gas are placed in a previously evacuated 4.00 L rigid reaction vessel, where they react at 458°C. After the system reaches equilibrium, [HI] = 1.40 M.

(a) Calculate the concentration of H2(g) present in the reaction vessel when the system had reached equilibrium.
(b) Calculate the number of moles of H2(g) that was initially added to the 4.00 L reaction vessel.`,
    answer: `(a) Since H2 and I2 started equimolar and are consumed in a 1:1 ratio, [H2] = [I2] = y at equilibrium. Change in [HI] = 2x = 1.40, so x = 0.70 (amount of H2 and I2 each consumed).

Kc = [HI]² / ([H2][I2]) = (1.40)² / y² = 49.7 → y² = 1.96/49.7 = 0.03944 → y = 0.199 M.

(b) Initial [H2] = y + 0.70 = 0.199 + 0.70 = 0.899 M. Moles H2 initially = 0.899 M × 4.00 L = 3.59 mol.`,
  },
  {
    title: 'Episode Review Q7 — Solving for Equilibrium Partial Pressures Using a Square Root (2 AX ⇌ A2 + X2)',
    content: `2 AX(g) ⇌ A2(g) + X2(g)     Kp = 81 at 500 K

A sample of AX(g) was added to a previously evacuated reaction vessel. The initial partial pressure of AX(g) was equal to 4.18 atm. The reaction was allowed to proceed at 500 K until the system reached equilibrium. Calculate the partial pressures of all three gases in the reaction vessel at equilibrium.`,
    answer: `Let 2x = change in P(AX) (so x = change in P(A2) and P(X2), each formed 1:1 from every 2 units of AX consumed). ICE: AX = 4.18 − 2x, A2 = x, X2 = x.

Kp = P(A2)·P(X2) / [P(AX)]² = x² / (4.18 − 2x)² = 81. Taking the square root of both sides: x / (4.18 − 2x) = 9 (positive root, since pressures must be positive).

x = 9(4.18 − 2x) = 37.62 − 18x → 19x = 37.62 → x = 1.98.

P(AX) = 4.18 − 2(1.98) = 0.22 atm. P(A2) = 1.98 atm. P(X2) = 1.98 atm.

(Check: Kp = (1.98)(1.98)/(0.22)² = 3.9204/0.0484 = 81.0 ✓)`,
  },
  {
    title: 'Episode Review Q8 — Predicting Which Initial Concentrations Favor Net Product Formation',
    content: `2 R(g) + 3 Z(g) ⇌ R2Z3(g)     Kc = 4.0 × 10⁻²

A mixture of R(g), Z(g), and R2Z3(g) is placed in a previously evacuated, rigid container and allowed to reach equilibrium at a constant temperature. Which of the following sets of initial concentrations would lead to the formation of additional R2Z3(g) as the system moves toward equilibrium?

[R]initial | [Z]initial | [R2Z3]initial
(A) 0.50 M | 2.5 M | 1.5 M
(B) 0.50 M | 3.5 M | 3.0 M
(C) 1.5 M | 2.5 M | 3.0 M
(D) 1.5 M | 3.5 M | 1.5 M`,
    answer: `(D). Additional R2Z3(g) forms only if Q < Kc (forward/product-forming direction favored). Computing Q = [R2Z3]/([R]²[Z]³) for each option:

(A) Q = 1.5/(0.50² × 2.5³) = 1.5/3.906 = 0.384 (> Kc, reverse favored — not this one)
(B) Q = 3.0/(0.50² × 3.5³) = 3.0/10.72 = 0.280 (> Kc, reverse favored)
(C) Q = 3.0/(1.5² × 2.5³) = 3.0/35.16 = 0.0853 (> Kc, reverse favored)
(D) Q = 1.5/(1.5² × 3.5³) = 1.5/96.47 = 0.0155 (< Kc = 0.040, forward favored — this is the only one where Q < Kc)

Since Q < Kc only for option (D), only (D) results in a net conversion of reactants to products, increasing R2Z3(g).`,
  },
  {
    title: 'Episode Review Q9 — Predicting the Direction of Shift by Comparing Q and Kp',
    content: `2 NO2(g) ⇌ N2O4(g)     Kp = 58 at 273 K

A vessel initially contains NO2(g) at a partial pressure of 0.10 atm, and N2O4(g) at a partial pressure of 2.0 atm at 273 K. Which of the following occurs as the system approaches equilibrium at 273 K?

(A) The partial pressure of N2O4(g) decreases because Q < Kp.
(B) The partial pressure of N2O4(g) decreases because Q > Kp.
(C) The partial pressure of N2O4(g) increases because Q < Kp.
(D) The partial pressure of N2O4(g) increases because Q > Kp.`,
    answer: `(B). Q = P(N2O4) / [P(NO2)]² = 2.0 / (0.10)² = 2.0/0.01 = 200. Since Q (200) > Kp (58), the reverse reaction is favored (net conversion of products back to reactants), so N2O4 (a product) will decrease as the system approaches equilibrium.`,
  },
];

/* ============================= 7.8 — Representations of Equilibrium (Episode #21) ============================= */
const t78 = [
  {
    title: 'Episode Review Q10 — Identifying the Correct Equilibrium Particle Diagram from Kp',
    imageKey: 'q10_diagram',
    content: `2 DG2(g) ⇌ D2(g) + 2 G2(g)     Kp = 4.5 at 600 K

The substance DG2(g) undergoes a decomposition reaction to produce D2(g) and G2(g) at 600 K according to the equation above. Which of the following particulate diagrams (A, B, C, or D) is the best representation of the reaction mixture after equilibrium has been achieved at 600 K? (Each molecule represents a partial pressure of 1.0 atm; filled circle = D, open circle = G.)`,
    answer: `(D). Counting each panel's molecules and computing Kp = P(D2)·[P(G2)]² / [P(DG2)]²:

(A): DG2 = 3, G2 = 2, D2 = 2 → Kp = (2)(2)²/(3)² = 8/9 = 0.89 (doesn't match)
(B): DG2 = 3, G2 = 2, D2 = 3 → Kp = (3)(2)²/(3)² = 12/9 = 1.33 (doesn't match)
(C): DG2 = 3, G2 = 3, D2 = 2 → Kp = (2)(3)²/(3)² = 18/9 = 2.0 (doesn't match)
(D): DG2 = 2, G2 = 3, D2 = 2 → Kp = (2)(3)²/(2)² = 18/4 = 4.5 (exact match!)

Only panel (D) gives Kp = 4.5, matching the given equilibrium constant.`,
  },
  {
    title: 'Episode Review Q11 — Predicting Reaction Direction from a Particle Diagram (3 X2 ⇌ 2 X3)',
    imageKey: 'q11_diagram',
    content: `3 X2(g) ⇌ 2 X3(g)     Kp = 16 at 400 K

Samples of X2(g) and X3(g) are added to a previously evacuated container and allowed to react at 400 K. The particle diagram shows the reaction mixture at a certain time: 3 molecules of X2(g) (2-circle clusters) and 3 molecules of X3(g) (3-circle clusters). (Each molecule represents a partial pressure of 1.0 atm.)

Which of the following best predicts what will occur as the system approaches equilibrium at 400 K?

(A) The amount of X3(g) will decrease, because Q < Kp.
(B) The amount of X3(g) will increase, because Q < Kp.
(C) The amount of X3(g) will decrease, because Q > Kp.
(D) The amount of X3(g) will increase, because Q > Kp.`,
    answer: `(B). From the diagram: P(X2) = 3 atm, P(X3) = 3 atm. Q = [P(X3)]² / [P(X2)]³ = (3)² / (3)³ = 9/27 = 0.33. Since Q (0.33) < Kp (16), the forward reaction is favored (net conversion of reactants to products), so the amount of X3(g) will increase.`,
  },
];

/* ============================= 7.9 — Introduction to Le Châtelier's Principle (Episode #22) ============================= */
const t79 = [
  {
    title: 'Episode Review Q4 — Effect of Decreasing Temperature on an Endothermic Solid Decomposition',
    content: `CaCO3(s) ⇌ CaO(s) + CO2(g)     ΔH° = +178 kJ/molrxn

The reaction system represented above is at equilibrium at 298 K. In a separate experiment, the temperature of the system is decreased. Which of the following correctly predicts how the number of moles of CaCO3(s) and the value of the equilibrium constant, Kc, will be affected by this change?

The Number of Moles of CaCO3(s) will… | The Value of Kc will…
(A) decrease | decrease
(B) decrease | increase
(C) increase | decrease
(D) increase | increase`,
    answer: `(C). The forward reaction (decomposition) is endothermic (ΔH° = +178 kJ/molrxn). Decreasing the temperature removes heat, which shifts the equilibrium AWAY from the endothermic (forward) direction and toward the reactant — so the moles of CaCO3(s) INCREASE (less decomposition, some CaO + CO2 converts back to CaCO3). Since Kc favors products more as temperature increases for an endothermic reaction, lowering the temperature causes Kc to DECREASE.`,
  },
  {
    title: 'Episode Review Q7 — Determining Whether Temperature Increased or Decreased from a Moles-vs-Time Graph',
    imageKey: 'q7_graph',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     ΔHrxn = –12.2 kJ/molrxn

Samples of H2(g) and I2(g) are added to a previously evacuated reaction vessel and allowed to react. A chemist monitors the number of moles of HI(g) over time. At time t, the temperature of the system is changed (no H2, I2, or HI was added at time t). The graph shows moles of HI(g) rising and leveling off before time t, then — right after t — rising again to a new, higher, level plateau.

At time t, did the temperature of the system decrease or increase? Justify your answer in terms of the information in the graph and in terms of ΔHrxn.`,
    answer: `The temperature decreased. The graph shows that the number of moles of HI(g) (a product) increased after time t. Since the forward reaction is exothermic (ΔHrxn = –12.2 kJ/molrxn), decreasing the temperature favors the exothermic (forward, heat-releasing) direction — shifting the equilibrium toward more product formation. This is consistent with the observed increase in moles of HI(g) after time t.`,
  },
  {
    title: 'Episode Review Q8 — Predicting the Effect of Four Different Stresses on an Endothermic Equilibrium',
    content: `Cl2O(g) + H2O(g) ⇌ 2 HOCl(g)     ΔH° = +13 kJ/molrxn

A chemical system at equilibrium is represented above. For each stress listed below, predict how the number of moles of HOCl(g) and the value of the equilibrium constant, K, will be affected.

Stress: (1) Adding a catalyst at constant temperature. (2) Removing a small amount of Cl2O(g) at constant temperature. (3) Decreasing the volume of the reaction vessel at constant temperature. (4) Increasing the temperature of the system.`,
    answer: `(1) Adding a catalyst: moles of HOCl(g) remain the same (a catalyst speeds up the rate of reaching equilibrium but does not shift its position); K remains the same (a catalyst never changes the value of K).

(2) Removing Cl2O(g): moles of HOCl(g) decrease (removing a reactant causes a net shift toward the reactants to partially replace what was removed, converting some HOCl back into Cl2O and H2O); K remains the same (temperature is unchanged).

(3) Decreasing volume: moles of HOCl(g) remain the same. Both sides of the equation have exactly 2 moles of gas (Cl2O + H2O = 2 mol reactant-side gas; 2 HOCl = 2 mol product-side gas), so a volume change does not favor either side — there is no shift. K remains the same (temperature unchanged).

(4) Increasing temperature: moles of HOCl(g) increase, since the forward reaction is endothermic (+13 kJ/molrxn) and adding heat favors the heat-absorbing (forward) direction; K increases as well, since raising the temperature favors products more strongly for an endothermic reaction.`,
  },
  {
    title: 'Episode Review Q9 — Identifying Which Equilibrium Shifts Toward Products When Volume Increases',
    content: `For which of the equilibrium systems represented below will the amount of product(s) at equilibrium increase if the volume of the reaction vessel is increased at a constant temperature?

(A) 2 NO2(g) ⇌ 2 NO(g) + O2(g)
(B) H2(g) + Br2(g) ⇌ 2 HBr(g)
(C) PCl3(g) + Cl2(g) ⇌ PCl5(g)
(D) N2(g) + 3 H2(g) ⇌ 2 NH3(g)`,
    answer: `(A). Increasing the volume of a gas-phase equilibrium favors the side with MORE moles of gas (since that side benefits more from the resulting decrease in concentration/pressure). Comparing moles of gas on each side:

(A) 2 mol reactant → 3 mol product (2 NO + 1 O2): product side has more moles — favored by increasing volume. ✓
(B) 2 mol reactant → 2 mol product: equal moles, no shift with volume change.
(C) 2 mol reactant → 1 mol product: reactant side has more moles — increasing volume would favor reactants (decrease product), not increase it.
(D) 4 mol reactant → 2 mol product: reactant side has more moles — increasing volume would favor reactants, not products.

Only (A) has more moles of gas on the product side, so it is the only reaction whose product amount increases when volume is increased.`,
  },
];

/* ============================= 7.10 — Reaction Quotient and Le Châtelier's Principle (Episode #22) ============================= */
const t710 = [
  {
    title: 'Episode Review Q1 — Calculating Qc After a Disturbance and Verifying Qc = Kc at New Equilibrium (D2 + X2 ⇌ 2 DX)',
    content: `D2(g) + X2(g) ⇌ 2 DX(g)     Kc = 64.0 at 500 K

An equimolar mixture of D2(g) and X2(g) reaches equilibrium at 500 K: [D2] = 0.600 M, [X2] = 0.600 M, [DX] = 4.80 M.

(a) Additional D2(g) is added until [D2] becomes 1.40 M (with [X2] and [DX] unchanged at that instant). Calculate Qc at the moment additional D2(g) is added.
(b) When equilibrium is re-established at 500 K, [DX] = 5.26 M. Calculate the concentrations of D2(g) and X2(g) when equilibrium is re-established.
(c) Show the set-up for the calculation of Qc that verifies Qc = Kc when equilibrium has been re-established.`,
    answer: `(a) Qc = [DX]²/([D2][X2]) = (4.80)²/(1.40 × 0.600) = 23.04/0.84 = 27.4.

(b) Change in [DX] = 5.26 − 4.80 = +0.46. Since 2 DX forms per (D2 + X2) consumed, change in D2 = change in X2 = −0.46/2 = −0.23.

[D2] = 1.40 − 0.23 = 1.17 M. [X2] = 0.600 − 0.23 = 0.370 M.

(c) Qc = (5.26)² / (1.17 × 0.370) = 27.6676 / 0.4329 = 63.9 ≈ 64.0 = Kc. ✓`,
  },
  {
    title: 'Episode Review Q2 — Effect of Removing a Solid Reactant on Qc (CaCO3 Decomposition)',
    content: `CaCO3(s) ⇌ CaO(s) + CO2(g)     ΔH° = 178 kJ/molrxn

This system is at equilibrium at 298 K. A student claims that, at the moment a small amount of CaCO3(s) is removed from the vessel at constant temperature, Qc will become greater than Kc. Do you agree or disagree? Justify your answer.`,
    answer: `Disagree. The equilibrium constant expression for this reaction is Kc = [CO2], since CaCO3(s) and CaO(s) are solids and are excluded from the expression entirely. Because CaCO3(s) never appears in the Qc (or Kc) expression, removing some of it has no effect on the value of Qc — Qc remains equal to Kc immediately after the removal (as long as some CaCO3(s) remains present so the system can still reach equilibrium).`,
  },
  {
    title: 'Episode Review Q3 — Effect of Doubling the Volume on Moles of Solid Product (CaCO3 Decomposition)',
    content: `CaCO3(s) ⇌ CaO(s) + CO2(g)     ΔH° = 178 kJ/molrxn

This system is at equilibrium at 298 K. In a separate experiment, the volume of the reaction vessel is rapidly doubled with no change in temperature. Which of the following correctly predicts and explains how the number of moles of CaO(s) will be affected?

(A) The number of moles of CaO(s) will decrease, because Qc becomes less than Kc.
(B) The number of moles of CaO(s) will decrease, because Qc becomes greater than Kc.
(C) The number of moles of CaO(s) will increase, because Qc becomes less than Kc.
(D) The number of moles of CaO(s) will increase, because Qc becomes greater than Kc.`,
    answer: `(C). Since Kc = [CO2], doubling the volume immediately halves [CO2] (concentration), making Qc (the new, smaller [CO2] value) LESS than Kc. Since Qc < Kc, the forward reaction is favored (net decomposition of more CaCO3(s) into CaO(s) and CO2(g) to bring [CO2] back up), so the number of moles of CaO(s) increases.`,
  },
  {
    title: 'Episode Review Q5 — Effect of Adding an Inert Gas on Qp',
    content: `N2O4(g) ⇌ 2 NO2(g)     Kp = 3.00 at 70°C

A mixture of NO2(g) and N2O4(g) reaches equilibrium at 70°C: P(N2O4) = 1.33 atm, P(NO2) = 2.00 atm. A small amount of He(g) is added to the container, increasing the total pressure to 4.00 atm. Assume temperature and volume remain constant. At the moment He(g) is added, does Qp decrease, increase, or remain the same? Justify your answer.`,
    answer: `Qp remains the same. Adding an inert gas like He(g) increases the TOTAL pressure of the mixture, but since the volume, temperature, and moles of NO2(g) and N2O4(g) are all unchanged, the PARTIAL pressures of NO2(g) and N2O4(g) themselves do not change. Since Qp = [P(NO2)]²/P(N2O4) depends only on the partial pressures of the reacting species (which are unaffected by the inert gas), Qp remains unchanged.`,
  },
  {
    title: 'Episode Review Q6 — Calculating Qp After a Volume Decrease and Verifying Qp = Kp at New Equilibrium (2 AQ2 + Q2 ⇌ 2 AQ3)',
    content: `2 AQ2(g) + Q2(g) ⇌ 2 AQ3(g)     Kp = 125 at 400 K

A mixture reaches equilibrium at 400 K in a 2.00 L vessel: P(AQ2) = 0.400 atm, P(Q2) = 0.200 atm, P(AQ3) = 2.000 atm.

(a) The volume is decreased from 2.00 L to 1.00 L at constant temperature. Calculate the partial pressure of each gas at the moment the volume changes.
(b) Calculate Qp at that moment.
(c) When equilibrium is re-established, P(AQ3) = 4.150 atm. Calculate the partial pressures of AQ2(g) and Q2(g) at the new equilibrium.
(d) Show the set-up verifying Qp = Kp at the new equilibrium.`,
    answer: `(a) Halving the volume doubles each partial pressure (Boyle's Law, constant moles and T): P(AQ2) = 0.800 atm, P(Q2) = 0.400 atm, P(AQ3) = 4.000 atm.

(b) Qp = [P(AQ3)]² / {[P(AQ2)]²·P(Q2)} = (4.000)²/[(0.800)²(0.400)] = 16.00/0.256 = 62.5. (Since Qp < Kp, the forward reaction is favored, consistent with decreasing volume favoring the side with fewer moles of gas — 2 mol product vs. 3 mol reactant.)

(c) Change in P(AQ3) = 4.150 − 4.000 = +0.150. Since AQ3 has coefficient 2, the "reaction extent" = 0.150/2 = 0.075. Change in P(AQ2) = −2(0.075) = −0.150; change in P(Q2) = −1(0.075) = −0.075.

P(AQ2) = 0.800 − 0.150 = 0.650 atm. P(Q2) = 0.400 − 0.075 = 0.325 atm.

(d) Qp = (4.150)² / [(0.650)²(0.325)] = 17.2225/0.1373 = 125 = Kp. ✓`,
  },
];

/* ============================= 7.11 — Introduction to Solubility Equilibria (Episode #23) ============================= */
const t711 = [
  {
    title: 'Episode Review Q1 — Ksp Expression and Calculation from Molar Solubility (PbBr2)',
    content: `PbBr2(s) ⇌ Pb2+(aq) + 2 Br–(aq)

A chemist prepares a saturated solution by adding excess PbBr2(s) to distilled water and stirring until no more solid dissolves.

(a) Write the expression for the equilibrium constant, Ksp, for PbBr2.
(b) The chemist determines that the solubility of PbBr2 is 4.34 g/L at 25°C.
(i) Calculate the molarity of [Pb2+] and [Br–] in the saturated solution.
(ii) Calculate the value of Ksp for PbBr2 at 25°C.`,
    answer: `(a) Ksp = [Pb2+][Br–]²

(b) Molar mass PbBr2 = 207.2 + 2(79.90) = 367.0 g/mol. Molar solubility = 4.34/367.0 = 0.01183 M.

(i) [Pb2+] = 0.01183 M (1:1 with dissolved PbBr2). [Br–] = 2 × 0.01183 = 0.02365 M.

(ii) Ksp = (0.01183)(0.02365)² = (0.01183)(0.0005595) = 6.62 × 10⁻⁶.`,
  },
  {
    title: 'Episode Review Q2 — Comparing [Ag+] Across Compounds with Different Ksp Expressions',
    content: `Compound | Ksp
AgCl | 1.8 × 10⁻¹⁰
AgBr | 5.4 × 10⁻¹³
Ag2CO3 | 8.5 × 10⁻¹²
Ag2CrO4 | 1.1 × 10⁻¹²

Based on the Ksp values in the table above, a saturated solution of which of the following compounds has the highest [Ag+]?

(A) AgCl
(B) AgBr
(C) Ag2CO3
(D) Ag2CrO4`,
    answer: `(C). Since these compounds have different cation:anion ratios, each must be solved individually (comparing Ksp values directly is not valid here).

AgCl: Ksp = x² → x = [Ag+] = 1.3 × 10⁻⁵.
AgBr: Ksp = x² → x = [Ag+] = 7.3 × 10⁻⁷.
Ag2CO3: Ksp = (2x)²(x) = 4x³ → x³ = 8.5×10⁻¹²/4 = 2.125×10⁻¹² → x = 1.29×10⁻⁴, [Ag+] = 2x = 2.57 × 10⁻⁴.
Ag2CrO4: Ksp = 4x³ → x³ = 1.1×10⁻¹²/4 = 2.75×10⁻¹³ → x = 6.51×10⁻⁵, [Ag+] = 2x = 1.30 × 10⁻⁴.

The highest [Ag+] (2.57 × 10⁻⁴) occurs for Ag2CO3.`,
  },
  {
    title: 'Episode Review Q3 — Correcting a Stoichiometry Error in a Ksp Calculation (CaF2)',
    content: `The molar solubility of CaF2 in distilled water at 25°C is 2.1 × 10⁻⁴ M. A student performs the following (incorrect) calculation:

Ksp = [Ca2+][F–]² = (2.1 × 10⁻⁴)(2.1 × 10⁻⁴)² = 9.3 × 10⁻¹²

(a) The student's calculated Ksp is incorrect because their value for [F–] is incorrect. What is the correct value of [F–] in a saturated solution of CaF2(aq) at 25°C?
(b) Determine the correct value of Ksp for CaF2 at 25°C.`,
    answer: `(a) Since CaF2 dissociates as CaF2(s) → Ca2+(aq) + 2 F–(aq), [F–] = 2 × molar solubility = 2 × (2.1 × 10⁻⁴) = 4.2 × 10⁻⁴ M (the student incorrectly used the molar solubility value itself for [F–], instead of doubling it).

(b) Ksp = [Ca2+][F–]² = (2.1 × 10⁻⁴)(4.2 × 10⁻⁴)² = (2.1 × 10⁻⁴)(1.764 × 10⁻⁷) = 3.7 × 10⁻¹¹.`,
  },
  {
    title: 'Episode Review Q4 — Predicting Precipitation by Comparing Q to Ksp After Mixing Two Dilute Solutions (Ni(OH)2)',
    content: `A student combines 25.00 mL of 9.25 × 10⁻⁶ M Ni(NO3)2(aq) with 45.00 mL of 3.20 × 10⁻⁶ M NaOH(aq).

Ni(OH)2(s) ⇌ Ni2+(aq) + 2 OH–(aq)     Ksp = 5.48 × 10⁻¹⁶

(a) Calculate [Ni2+] after the two solutions are combined but before any reaction takes place. (Assume volumes are additive.)
(b) Write the expression for Ksp.
(c) After combining, [OH–] = 2.06 × 10⁻⁶ M. Using your answer to part (a), calculate the value of Q.
(d) Using Q, predict whether a precipitate should form as the mixture approaches equilibrium. Justify your answer.`,
    answer: `(a) Total volume = 25.00 + 45.00 = 70.00 mL. [Ni2+] = 9.25 × 10⁻⁶ M × (25.00/70.00) = 3.30 × 10⁻⁶ M.

(b) Ksp = [Ni2+][OH–]²

(c) Q = (3.30 × 10⁻⁶)(2.06 × 10⁻⁶)² = (3.30 × 10⁻⁶)(4.244 × 10⁻¹²) = 1.40 × 10⁻¹⁷.

(d) No precipitate will form. Since Q (1.40 × 10⁻¹⁷) is less than Ksp (5.48 × 10⁻¹⁶), the solution is undersaturated with respect to Ni(OH)2 — the equilibrium favors the dissolved ions, so no solid forms.`,
  },
  {
    title: 'Episode Review Q5 — Predicting Precipitation by Comparing Q to Ksp (BaSO4)',
    content: `A 1.0 L solution of Ba(NO3)2(aq) has [Ba2+] = 1.0 × 10⁻⁶ M. A 0.0010 mol sample of K2SO4(s) is added and the solution is stirred thoroughly. Ksp for BaSO4 is 1.08 × 10⁻¹⁰. Which of the following will occur and why? (Assume negligible volume change.)

(A) BaSO4(s) will precipitate because Q > Ksp.
(B) BaSO4(s) will precipitate because Q < Ksp.
(C) BaSO4(s) will not precipitate because Q > Ksp.
(D) BaSO4(s) will not precipitate because Q < Ksp.`,
    answer: `(A). [SO4²–] = 0.0010 mol / 1.0 L = 1.0 × 10⁻³ M. Q = [Ba2+][SO4²–] = (1.0 × 10⁻⁶)(1.0 × 10⁻³) = 1.0 × 10⁻⁹. Since Q (1.0 × 10⁻⁹) is greater than Ksp (1.08 × 10⁻¹⁰), a precipitate will form.`,
  },
  {
    title: 'Episode Review Q6 — Effect of Dilution on Concentration and Moles in a Saturated Solution (CaCO3)',
    content: `CaCO3(s) ⇌ Ca2+(aq) + CO3²–(aq)     Ksp = 3.36 × 10⁻⁹

A student prepares a 50 mL saturated solution of CaCO3 at 25°C (excess CaCO3(s) present). Additional distilled water is added and the mixture is stirred until no more solid dissolves; a small amount of undissolved CaCO3(s) remains. The volume increases to 100 mL at constant temperature (25°C).

Which of the following provides correct comparisons of both [Ca2+] and the number of moles of Ca2+(aq) for these two samples?

[Ca2+] in 100 mL sample | Moles of Ca2+(aq) in 100 mL sample
(A) less than 50 mL sample | greater than 50 mL sample
(B) less than 50 mL sample | same as 50 mL sample
(C) same as 50 mL sample | greater than 50 mL sample
(D) same as 50 mL sample | same as 50 mL sample`,
    answer: `(C). Since excess solid CaCO3(s) remains present in both cases, the solution is saturated in both cases — and since Ksp (and temperature) is unchanged, the equilibrium [Ca2+] must be the SAME fixed value in both the 50 mL and 100 mL samples (concentration in a saturated solution depends only on Ksp and temperature, not on total volume, as long as excess solid is present to buffer the equilibrium). However, since the volume doubled while the concentration stayed the same, the total moles of Ca2+(aq) present (moles = concentration × volume) must be GREATER in the 100 mL sample.`,
  },
];

/* ============================= 7.12 — Common-Ion Effect (Episode #23) ============================= */
const t712 = [
  {
    title: 'Episode Review Q7 — Common-Ion Effect on Solubility and Ksp (PbI2 in KI Solution)',
    content: `PbI2(s) ⇌ Pb2+(aq) + 2 I–(aq)     Ksp = 9.8 × 10⁻⁹ at 25°C

A student prepares a saturated solution of PbI2 in distilled water (beaker X) and determines [Pb2+] = 0.0013 M. The student prepares a second saturated solution of PbI2 in 0.10 M KI(aq) instead of distilled water (beaker Y). Which of the following provides the correct predictions for both [Pb2+] and Ksp in beaker Y? (Temperature constant at 25°C.)

[Pb2+] in Beaker Y | Ksp in Beaker Y
(A) less than 0.0013 M | less than 9.8 × 10⁻⁹
(B) less than 0.0013 M | equal to 9.8 × 10⁻⁹
(C) equal to 0.0013 M | less than 9.8 × 10⁻⁹
(D) equal to 0.0013 M | equal to 9.8 × 10⁻⁹`,
    answer: `(B). The KI(aq) solution provides I– as a common ion. By Le Châtelier's principle (the common-ion effect), the presence of this extra I– suppresses the dissolution of PbI2(s), so LESS PbI2 dissolves and [Pb2+] is LESS than in pure water (0.0013 M). However, Ksp is an equilibrium constant that depends only on temperature (not on what else is dissolved in the solution) — so Ksp remains EQUAL to 9.8 × 10⁻⁹ in beaker Y as well.`,
  },
  {
    title: 'Episode Review Q8 — Identifying Which Change Decreases [Ca2+] via the Common-Ion Effect',
    content: `Ca3(PO4)2(s) ⇌ 3 Ca2+(aq) + 2 PO4³–(aq)

Which of the following changes will decrease [Ca2+] in a saturated solution of Ca3(PO4)2, and why? (Assume some Ca3(PO4)2(s) remains in contact with the solution after each change.)

(A) Adding Ca3(PO4)2(s), because the value of Q will become greater than Ksp
(B) Adding K3PO4(s), because the reaction will proceed toward the reactants
(C) Allowing some of the water to evaporate from the solution, because more Ca3(PO4)2(s) will precipitate
(D) Adding 0.1 M KNO3(aq), because additional liquid will dilute the solution`,
    answer: `(B). Adding K3PO4(s) introduces PO4³– as a common ion. By the common-ion effect (Le Châtelier's principle), this extra PO4³– shifts the equilibrium toward the reactant (solid) side, causing some dissolved Ca2+ and PO4³– to re-precipitate as Ca3(PO4)2(s) — decreasing [Ca2+]. (Option (A) is incorrect because adding more of the solid itself does not change Q at all, since solids are excluded from the expression. Option (C) is incorrect because evaporating water does not change the equilibrium [Ca2+] — it remains fixed by Ksp as long as excess solid is present; any temporary increase in concentration would just cause more solid to precipitate, restoring the same saturation concentration. Option (D) is incorrect for the same reason — dilution does not permanently lower the equilibrium concentration when excess solid is present to re-dissolve and restore it.)`,
  },
  {
    title: 'Episode Review Q9 — Determining the Concentration of a Common-Ion Source from Ksp and Equilibrium [Mg2+] (MgF2)',
    content: `MgF2(s) ⇌ Mg2+(aq) + 2 F–(aq)     Ksp = 5.16 × 10⁻¹¹ at 25°C

A chemist prepares a saturated solution at 25°C by adding excess MgF2(s) to a solution of NaF(aq) of unknown concentration. The mixture is stirred until no more solid dissolves. [Mg2+] in the saturated solution = 3.23 × 10⁻¹⁰ M.

The concentration of NaF in the solution that was used by the chemist is closest to

(A) 0.080 M
(B) 0.16 M
(C) 0.20 M
(D) 0.40 M`,
    answer: `(D). Ksp = [Mg2+][F–]²: 5.16 × 10⁻¹¹ = (3.23 × 10⁻¹⁰)[F–]². [F–]² = 5.16×10⁻¹¹/3.23×10⁻¹⁰ = 0.1597. [F–] = 0.40 M.

Since the F– contributed by the (heavily suppressed) dissolution of MgF2 itself is only 2 × 3.23×10⁻¹⁰ = 6.46×10⁻¹⁰ M — utterly negligible compared to 0.40 M — essentially all of the F– in solution comes from the original NaF. So the NaF concentration used was approximately 0.40 M.`,
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
    source: 'Episode Review',
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
    imgMap['q2_graph'] = await uploadImage('q2_graph.png', 'ep20-q2-partial-pressure-vs-time.png');
    imgMap['q10_diagram'] = await uploadImage('q10_full.png', 'ep21-q10-dg2-decomposition-diagrams.png');
    imgMap['q11_diagram'] = await uploadImage('q11_full.png', 'ep21-q11-x2-x3-particle-diagram.png');
    imgMap['q7_graph'] = await uploadImage('q7_graph.png', 'ep22-q7-moles-hi-vs-time.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t71) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t78) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];
    for (const q of t79) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('7.1', t71);
    await insertTopic('7.2', t72);
    await insertTopic('7.3', t73);
    await insertTopic('7.4', t74);
    await insertTopic('7.5', t75);
    await insertTopic('7.6', t76);
    await insertTopic('7.7', t77);
    await insertTopic('7.8', t78);
    await insertTopic('7.9', t79);
    await insertTopic('7.10', t710);
    await insertTopic('7.11', t711);
    await insertTopic('7.12', t712);
    console.log('Done — Unit 7 Episode Review (Episodes #20-23) seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
