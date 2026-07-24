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
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/u71imgs';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.1-7.5/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 7.1 — Introduction to Equilibrium ============================= */
const t71 = [
  {
    title: 'Q1 — Reading a Partial Pressure vs. Time Graph for A2X4 ⇌ 2 AX2',
    imageKey: 'pressuregraph',
    content: `A2X4(g) ⇌ 2 AX2(g)

A sample of A2X4(g) is added to a previously evacuated rigid reaction vessel. The partial pressures of each gas are monitored over time, and the data are shown on the graph (P(A2X4) starts at 8.0 atm and decreases to level off at about 4.6 atm; P(AX2) starts at 0 and increases to level off at about 6.8 atm).

(a) Use the information from the graph to fill in the missing information in the data table below.

Time (s) | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
P(A2X4) (atm) | ? | ? | 5.6 | ? | ? | 4.7 | ? | ? | ? | ? | 4.6
P(AX2) (atm) | ? | 2.8 | ? | ? | 6.4 | ? | ? | ? | 6.8 | ? | ?

(b) At what point in time during the experiment did the reaction reach a state of equilibrium? Justify your answer.
(c) During the first 30 seconds of this experiment:
- The partial pressure of A2X4(g) is (decreasing / increasing).
- The rate of the forward reaction (A2X4(g) → 2 AX2(g)) is (decreasing / increasing).
- The partial pressure of AX2(g) is (decreasing / increasing).
- The rate of the reverse reaction (2 AX2(g) → A2X4(g)) is (decreasing / increasing).`,
    answer: `(a) Completed table (reading from the graph):

Time (s) | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
P(A2X4) (atm) | 8.0 | 6.7 | 5.6 | 5.0 | 4.75 | 4.7 | 4.6 | 4.6 | 4.6 | 4.6 | 4.6
P(AX2) (atm) | 0.0 | 2.8 | 4.8 | 6.0 | 6.4 | 6.6 | 6.8 | 6.8 | 6.8 | 6.8 | 6.8

(b) The reaction reaches equilibrium at approximately t = 60 seconds. This is the point at which both P(A2X4) and P(AX2) stop changing over time and remain constant (level off) for the remainder of the experiment — consistent with the definition of equilibrium, where the concentrations/pressures of all species remain constant because the forward and reverse reaction rates have become equal.

(c) During the first 30 seconds: the partial pressure of A2X4(g) is decreasing (it is being consumed by the forward reaction); the rate of the forward reaction is decreasing (rate depends on reactant concentration/pressure, which is falling); the partial pressure of AX2(g) is increasing (it is being produced by the forward reaction); the rate of the reverse reaction is increasing (rate depends on product concentration/pressure, which is rising).`,
  },
  {
    title: 'Q2 — Sketching the Reverse-Reaction Rate Curve for A2X4 ⇌ 2 AX2',
    imageKey: 'rategraph',
    content: `A2X4(g) ⇌ 2 AX2(g)

A plot of the reaction rate for the forward reaction (A2X4(g) → 2 AX2(g)) versus time is shown on the graph (starting at a high value at t=0, decreasing steadily, and leveling off at a constant value around t=60s).

Describe (or sketch) how the rate of the reverse reaction (2 AX2(g) → A2X4(g)) changes over time on the same axes.`,
    answer: `The reverse reaction rate should start at a low value at t=0 (since very little AX2 is present at the start, there's very little material available to react in reverse) and increase over time as AX2 accumulates, eventually leveling off at the same time (around t=60s) and reaching the SAME final constant value as the forward reaction rate curve — since at equilibrium, the forward and reverse rates must be equal.

The reverse-rate curve is shaped like a mirror image of the given forward-rate curve: starting near zero, rising steeply at first and then leveling off, crossing the forward-rate curve at the point where the two rates become equal (at equilibrium, t≈60s), after which both curves overlap as flat, equal lines for the remainder of the graph.`,
  },
  {
    title: 'Q3 — True or False Statements About the Equilibrium A(g) ⇌ B(g)',
    content: `A(g) ⇌ B(g)

Consider the system involving a reversible chemical reaction as described by the equation above. Decide if each of the following statements regarding equilibrium are true or false.

(a) If the rate of the forward reaction is greater than the rate of the reverse reaction, then equilibrium has not yet been achieved in this system.
(b) When equilibrium has been achieved in this system, the partial pressure of A(g) should be equal to the partial pressure of B(g).
(c) When equilibrium has been achieved in this system, the partial pressures of A(g) and B(g) should not change over time.
(d) When equilibrium has been achieved in this system, the particles of A and B should no longer collide or react with each other.
(e) When equilibrium has been achieved in this system, no observable changes will be detected, giving the appearance that nothing is happening in the reaction vessel.`,
    answer: `(a) True. Equilibrium is defined as the state in which the forward and reverse reaction rates are equal; if the forward rate is greater than the reverse rate, there is a net conversion of A to B still occurring, meaning equilibrium has not yet been reached.

(b) False. Equilibrium requires that the forward and reverse RATES are equal, not that the partial pressures (or concentrations) of A and B are equal. The equilibrium partial pressures of A and B depend on the value of the equilibrium constant K, and are generally not equal to each other unless K happens to equal 1.

(c) True. At equilibrium, since the forward and reverse rates are equal, there is no net change in the amount of A or B over time, so their partial pressures remain constant.

(d) False. Equilibrium is a dynamic state — particles of A and B continue to collide and react in both the forward and reverse directions continuously, even at equilibrium. It's just that the rate of A converting to B equals the rate of B converting back to A, so there is no NET change, even though reactions are still actively occurring at the particle level.

(e) True. Because there is no net change in the concentrations/partial pressures of A and B at equilibrium (part c), no macroscopic/observable properties of the system (color, pressure, etc.) will appear to change, even though the forward and reverse reactions are both still actively occurring (part d) — this gives the appearance that "nothing is happening," even though there is a dynamic balance of ongoing reactions.`,
  },
];

/* ============================= 7.2 — Direction of Reversible Reactions ============================= */
const t72 = [
  {
    title: 'Q3 — Determining Reaction Direction from Concentration Data',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)

Consider the reaction between H2(g) and I2(g) to form HI(g), as represented by the equation above. Different experiments were performed and were carried out at the same initial temperature.

(a) Based on the following data, which of the following is true about this system between Time 1 and Time 2?

Time 1: [H2] = 2.0 M, [I2] = 3.0 M, [HI] = 1.0 M
Time 2: [H2] = 1.0 M, [I2] = 2.0 M, [HI] = 3.0 M

___ The rate of the forward reaction is greater than the rate of the reverse reaction.
___ The rate of the reverse reaction is greater than the rate of the forward reaction.

(b) Based on the following (separate) data, which of the following is true about this system between Time 1 and Time 2?

Time 1: [H2] = 0.10 M, [I2] = 0.20 M, [HI] = 9.5 M
Time 2: [H2] = 1.0 M, [I2] = 1.1 M, [HI] = 7.7 M

___ The rate of the forward reaction is greater than the rate of the reverse reaction.
___ The rate of the reverse reaction is greater than the rate of the forward reaction.`,
    answer: `(a) The rate of the forward reaction is greater than the rate of the reverse reaction. Between Time 1 and Time 2, [H2] and [I2] both decreased (from 2.0 to 1.0 M and 3.0 to 2.0 M, respectively) while [HI] increased (from 1.0 to 3.0 M). This means reactants are being net converted into product, which only happens when the forward reaction rate exceeds the reverse reaction rate.

(b) The rate of the reverse reaction is greater than the rate of the forward reaction. Between Time 1 and Time 2, [H2] and [I2] both increased (from 0.10 to 1.0 M and 0.20 to 1.1 M, respectively) while [HI] decreased (from 9.5 to 7.7 M). This means product is being net converted back into reactants, which only happens when the reverse reaction rate exceeds the forward reaction rate.`,
  },
];

/* ============================= 7.3 — Reaction Quotient and Equilibrium Constant ============================= */
const t73 = [
  {
    title: 'Q4 — Writing Kc and Kp Expressions for Five Equations',
    content: `For each of the following chemical equations, write the equilibrium constant expression for both Kc and Kp. Note that solids and pure liquids are not included in the reaction quotient Q or in the equilibrium constant expression K.

(a) N2(g) + 3 H2(g) ⇌ 2 NH3(g)
(b) 2 SO3(g) ⇌ 2 SO2(g) + O2(g)
(c) CaCO3(s) ⇌ CaO(s) + CO2(g)
(d) PbI2(s) ⇌ Pb2+(aq) + 2 I-(aq)
(e) HF(aq) + H2O(l) ⇌ H3O+(aq) + F-(aq)`,
    answer: `(a) Kc = [NH3]^2 / ([N2][H2]^3)     Kp = (P(NH3))^2 / [(P(N2))(P(H2))^3]

(b) Kc = ([SO2]^2 [O2]) / [SO3]^2     Kp = [(P(SO2))^2 (P(O2))] / (P(SO3))^2

(c) Kc = [CO2]     Kp = P(CO2)    (CaCO3(s) and CaO(s) are both solids, and are excluded from the expression.)

(d) Kc = [Pb2+][I-]^2     Kp = not applicable, because no gases are present (PbI2 is a solid, and Pb2+ and I- are aqueous ions, not gases).

(e) Kc = ([H3O+][F-]) / [HF]     Kp = not applicable, because no gases are present (H2O(l) is a pure liquid and is excluded; HF, H3O+, and F- are all aqueous).`,
  },
];

/* ============================= 7.4 — Calculating the Equilibrium Constant ============================= */
const t74 = [
  {
    title: 'Q5 — Calculating Kc from Six Experiments (N2O4 ⇌ 2 NO2)',
    content: `N2O4(g) ⇌ 2 NO2(g)

A series of experiments was performed in the laboratory based on the reaction represented above. Each reaction was carried out at a temperature of 373 K.

(a) Calculate the change in concentration for each substance in each experiment, using the data below.

Expt. 1: Initial [N2O4]=10.00 M, [NO2]=0.00 M; Equilibrium [N2O4]=9.30 M, [NO2]=1.40 M
Expt. 2: Initial [N2O4]=0.00 M, [NO2]=10.00 M; Equilibrium [N2O4]=4.51 M, [NO2]=0.98 M
Expt. 3: Initial [N2O4]=10.00 M, [NO2]=10.00 M; Equilibrium [N2O4]=14.14 M, [NO2]=1.72 M
Expt. 4: Initial [N2O4]=3.00 M, [NO2]=6.00 M; Equilibrium [N2O4]=5.46 M, [NO2]=1.08 M
Expt. 5: Initial [N2O4]=8.00 M, [NO2]=1.00 M; Equilibrium [N2O4]=7.86 M, [NO2]=1.28 M
Expt. 6: Initial [N2O4]=2.00 M, [NO2]=3.00 M; Equilibrium [N2O4]=3.10 M, [NO2]=0.80 M

(b) The value for |change in [NO2]| / |change in [N2O4]| in all six experiments is equal to ___________, which is consistent with the coefficients from the chemical equation.
(c) Using the equilibrium concentrations from Experiments 1-6, calculate the value of the equilibrium constant Kc = [NO2]^2/[N2O4] for each experiment (at 373 K). Round off your answers to two significant figures.`,
    answer: `(a) Change = Equilibrium - Initial for each substance:

Expt. 1: Δ[N2O4] = 9.30 - 10.00 = -0.70 M; Δ[NO2] = 1.40 - 0.00 = +1.40 M
Expt. 2: Δ[N2O4] = 4.51 - 0.00 = +4.51 M; Δ[NO2] = 0.98 - 10.00 = -9.02 M
Expt. 3: Δ[N2O4] = 14.14 - 10.00 = +4.14 M; Δ[NO2] = 1.72 - 10.00 = -8.28 M
Expt. 4: Δ[N2O4] = 5.46 - 3.00 = +2.46 M; Δ[NO2] = 1.08 - 6.00 = -4.92 M
Expt. 5: Δ[N2O4] = 7.86 - 8.00 = -0.14 M; Δ[NO2] = 1.28 - 1.00 = +0.28 M
Expt. 6: Δ[N2O4] = 3.10 - 2.00 = +1.10 M; Δ[NO2] = 0.80 - 3.00 = -2.20 M

(b) The value is equal to 2 in all six experiments — for example, in Expt. 1: |1.40|/|0.70| = 2.0. This is consistent with the 1:2 mole ratio of N2O4 to NO2 in the balanced equation (N2O4 ⇌ 2 NO2): for every 1 mole of N2O4 that reacts, 2 moles of NO2 are produced (or vice versa), so the magnitude of the change in [NO2] is always twice the magnitude of the change in [N2O4].

(c) Kc = [NO2]^2 / [N2O4] for each experiment:

Expt. 1: (1.40)^2 / 9.30 = 1.96/9.30 = 0.21
Expt. 2: (0.98)^2 / 4.51 = 0.9604/4.51 = 0.21
Expt. 3: (1.72)^2 / 14.14 = 2.9584/14.14 = 0.21
Expt. 4: (1.08)^2 / 5.46 = 1.1664/5.46 = 0.21
Expt. 5: (1.28)^2 / 7.86 = 1.6384/7.86 = 0.21
Expt. 6: (0.80)^2 / 3.10 = 0.64/3.10 = 0.21

(All six experiments give the same Kc ≈ 0.21 at 373 K, which is expected since K is constant at a given temperature regardless of the starting concentrations.)`,
  },
  {
    title: 'Q6 — Calculating Kc and Comparing to a New Initial Concentration',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)

(a) The system represented by the equation above reached equilibrium at 448°C. The concentrations of the substances in the reaction vessel at equilibrium were determined to be the following: [H2] = 0.80 M, [I2] = 0.54 M, [HI] = 4.7 M. Calculate the value of the equilibrium constant (Kc) for this system at 448°C. Round off your answer to two significant figures.
(b) In a separate experiment, samples of H2(g) and I2(g) were added to a previously evacuated reaction vessel, with an initial concentration of 0.25 M for each substance. The reaction was allowed to proceed at 448°C until the system reached equilibrium. Should the concentration of H2(g) in the reaction vessel at equilibrium be less than or greater than 0.25 M? Justify your answer.`,
    answer: `(a) Kc = [HI]^2 / ([H2][I2]) = (4.7)^2 / [(0.80)(0.54)] = 22.09 / 0.432 = 51.

(b) Less than 0.25 M. Since only H2(g) and I2(g) are added initially (with no HI present), the reaction quotient Q at the start is Q = [HI]^2/([H2][I2]) = 0^2/[(0.25)(0.25)] = 0, which is much less than Kc = 51. Since Q < K, the reaction must proceed in the forward direction (net conversion of reactants to products, H2 + I2 → 2 HI) until equilibrium is reached (Q = K). Because H2 is consumed by the forward reaction, its concentration at equilibrium must be less than its initial concentration of 0.25 M.`,
  },
  {
    title: 'Q7 — Using Q vs. K to Predict Reaction Direction (Three Experimental Conditions)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 448°C

For each set of experimental conditions listed in the table below:
- Use the data to calculate the value of the reaction quotient (Qc).
- Compare Kc with Qc and choose one of the following consequences: (i) the system is already at equilibrium, (ii) the system should proceed toward the products (from left to right) until equilibrium is achieved, or (iii) the system should proceed toward the reactants (from right to left) until equilibrium is achieved.

#1: [H2] = 0.35 M, [I2] = 0.45 M, [HI] = 3.0 M
#2: [H2] = 1.6 M, [I2] = 1.4 M, [HI] = 4.2 M
#3: [H2] = 0.90 M, [I2] = 0.81 M, [HI] = 6.1 M`,
    answer: `#1: Qc = (3.0)^2 / [(0.35)(0.45)] = 9.00/0.1575 = 57.1 ≈ 57. Since Qc (57) > Kc (51), there are "too many products," so the system should proceed toward the reactants (from right to left) until equilibrium is achieved.

#2: Qc = (4.2)^2 / [(1.6)(1.4)] = 17.64/2.24 = 7.88 ≈ 7.9. Since Qc (7.9) < Kc (51), there are "not enough products" (too many reactants), so the system should proceed toward the products (from left to right) until equilibrium is achieved.

#3: Qc = (6.1)^2 / [(0.90)(0.81)] = 37.21/0.729 = 51.04 ≈ 51. Since Qc (51) = Kc (51), the system is already at equilibrium.`,
  },
  {
    title: 'Q8 — Using a RICE Table to Find Kp (COCl2 Decomposition)',
    content: `COCl2(g) ⇌ CO(g) + Cl2(g)

Consider the system represented by the equation above. A sample of pure COCl2(g) is added to a previously evacuated rigid reaction vessel at 690 K. The initial pressure in the reaction vessel (before any reaction occurs) is 1.0 atm. After the system has reached equilibrium at 690 K, the total pressure in the reaction vessel is 1.2 atm.

(a) Determine the partial pressure of each substance in the reaction vessel at equilibrium.
(b) Calculate the value of Kp for the reaction at 690 K.

(Hint: Use a R-I-C-E table — Reaction / Initial / Change / Equilibrium — with columns for COCl2(g), CO(g), and Cl2(g). Let x = the change in pressure of COCl2 that reacts.)`,
    answer: `RICE table (all pressures in atm), using -x for COCl2 consumed and +x for each product formed (1:1:1 stoichiometry):

Initial: P(COCl2) = 1.0, P(CO) = 0, P(Cl2) = 0
Change: P(COCl2) = -x, P(CO) = +x, P(Cl2) = +x
Equilibrium: P(COCl2) = 1.0 - x, P(CO) = x, P(Cl2) = x

Total pressure at equilibrium = (1.0 - x) + x + x = 1.0 + x = 1.2 atm, so x = 0.2 atm.

(a) At equilibrium: P(COCl2) = 1.0 - 0.2 = 0.8 atm; P(CO) = 0.2 atm; P(Cl2) = 0.2 atm.

(b) Kp = [P(CO) x P(Cl2)] / P(COCl2) = [(0.2)(0.2)] / 0.8 = 0.04/0.8 = 0.05.`,
  },
  {
    title: 'Q9 — Using a RICE Table to Find Kp (N2 + 3 H2 ⇌ 2 NH3)',
    content: `N2(g) + 3 H2(g) ⇌ 2 NH3(g)

Consider the system represented by the equation above. Samples of all three substances were added to a previously evacuated rigid reaction vessel at 300 K. The initial values for the partial pressures of the substances in the reaction vessel were determined to be the following:

P(N2) = 6.7 atm     P(H2) = 6.0 atm     P(NH3) = 0.2 atm

After the system has reached equilibrium at 300 K, the partial pressure of NH3(g) is 1.4 atm.

(a) Determine the partial pressure of each substance in the reaction vessel at equilibrium.
(b) Calculate the value of Kp for the reaction at 300 K.

(Hint: Create a R-I-C-E table to solve this problem.)`,
    answer: `Since NH3 increased from 0.2 atm to 1.4 atm, the change in P(NH3) is +1.2 atm. Since the coefficient of NH3 is 2, let 2x = 1.2, so x = 0.6 atm. Since N2 has a coefficient of 1, its change is -x = -0.6 atm; since H2 has a coefficient of 3, its change is -3x = -1.8 atm.

RICE table (all pressures in atm):
Initial: P(N2) = 6.7, P(H2) = 6.0, P(NH3) = 0.2
Change: P(N2) = -0.6, P(H2) = -1.8, P(NH3) = +1.2
Equilibrium: P(N2) = 6.1, P(H2) = 4.2, P(NH3) = 1.4

(a) At equilibrium: P(N2) = 6.7 - 0.6 = 6.1 atm; P(H2) = 6.0 - 1.8 = 4.2 atm; P(NH3) = 0.2 + 1.2 = 1.4 atm (given).

(b) Kp = (P(NH3))^2 / [P(N2) x (P(H2))^3] = (1.4)^2 / [(6.1)(4.2)^3] = 1.96 / [(6.1)(74.09)] = 1.96/451.9 = 0.00434 ≈ 4.3 x 10^-3.`,
  },
];

/* ============================= 7.5 — Magnitude of the Equilibrium Constant ============================= */
const t75 = [
  {
    title: 'Q10 — Predicting Which Substance Has Higher Partial Pressure at Equilibrium (Large K)',
    content: `2 NO(g) + O2(g) ⇌ 2 NO2(g)     Kp = 6.4 x 10^9

When the reaction represented by the equation above reaches equilibrium, which of the following substances should have a higher value for partial pressure in the reaction vessel? Circle your choice, and justify your answer.

NO(g)          NO2(g)`,
    answer: `NO2(g) should have the higher partial pressure at equilibrium.

Since Kp is a very large value (6.4 x 10^9), this means that at equilibrium, Kp = [(P(NO2))^2] / [(P(NO))^2 (P(O2))] must be a very large number, which requires the numerator (products) to be much larger than the denominator (reactants). This means the equilibrium mixture is overwhelmingly composed of products (NO2), with only a very small amount of reactants (NO and O2) remaining — the reaction essentially proceeds to completion. Therefore, NO2(g) should have a much higher partial pressure than NO(g) at equilibrium.`,
  },
  {
    title: 'Q11 — Predicting Which Substance Has Higher Concentration at Equilibrium (Small K)',
    content: `HCN(aq) + H2O(l) ⇌ H3O+(aq) + CN-(aq)     Kc = 6.2 x 10^-10

When the reaction represented by the equation above reaches equilibrium, which of the following substances should have a higher concentration? Circle your choice, and justify your answer.

HCN(aq)          CN-(aq)`,
    answer: `HCN(aq) should have the higher concentration at equilibrium.

Since Kc is a very small value (6.2 x 10^-10), this means that at equilibrium, Kc = ([H3O+][CN-])/[HCN] must be a very small number, which requires the numerator (products) to be much smaller than the denominator (reactant). This means the equilibrium mixture is overwhelmingly composed of the reactant (HCN), with only a very small amount of products (H3O+ and CN-) formed — the reaction barely proceeds forward at all. Therefore, HCN(aq) should have a much higher concentration than CN-(aq) at equilibrium.`,
  },
  {
    title: 'Q12 — Relating the Magnitude of K to Which Side Is Favored',
    content: `(a) When the value of K is very small, the (reactants / products) are favored at equilibrium.
(b) When the value of K is very large, the (reactants / products) are favored at equilibrium.`,
    answer: `(a) When the value of K is very small, the reactants are favored at equilibrium (very little product forms; the reaction barely proceeds forward).

(b) When the value of K is very large, the products are favored at equilibrium (the reaction proceeds essentially to completion, with very little reactant remaining).`,
  },
  {
    title: 'Q13 — Calculating Equilibrium Concentrations for a Reaction with a Large K',
    content: `CH4(g) + 2 H2S(g) ⇌ CS2(g) + 4 H2(g)     Kc = 3.3 x 10^4 at 1200 K

Samples of CH4(g) and H2S(g) are introduced into a previously evacuated rigid container. The initial concentrations of these substances are the following: [CH4] = 0.30 M, [H2S] = 1.0 M. The temperature is held constant as the reaction represented by the equation above reaches equilibrium at 1200 K.

(a) Considering the value of Kc, calculate the final concentration of H2S(g), CS2(g), and H2(g) in the reaction vessel after the system reaches equilibrium at 1200 K.
(b) The final concentration of CH4(g) in the reaction vessel at equilibrium is very small, but not exactly zero. Calculate the concentration of CH4(g) at equilibrium.`,
    answer: `(a) Since Kc is very large (3.3 x 10^4), the reaction proceeds essentially to completion (products are heavily favored), meaning nearly all of the limiting reactant is consumed.

Using the 1:2:1:4 mole ratio (CH4:H2S:CS2:H2), and starting with 0.30 M CH4 and 1.0 M H2S: CH4 would require 2(0.30) = 0.60 M H2S to react completely, and since 1.0 M H2S is available (more than enough), CH4 is the limiting reactant. Assuming the reaction proceeds essentially to completion (nearly all CH4 consumed):

Change: CH4 decreases by ~0.30 M, H2S decreases by 2(0.30) = 0.60 M, CS2 increases by 0.30 M, H2 increases by 4(0.30) = 1.20 M.

Final (approximate, assuming ~complete reaction): [H2S] = 1.0 - 0.60 = 0.40 M; [CS2] = 0.30 M; [H2] = 1.20 M.

(b) Using Kc and the approximate equilibrium concentrations found in part (a):

Kc = ([CS2][H2]^4) / ([CH4][H2S]^2)

3.3 x 10^4 = [(0.30)(1.20)^4] / {[CH4](0.40)^2}

3.3 x 10^4 = [(0.30)(2.0736)] / {[CH4](0.16)}

3.3 x 10^4 = 0.6221 / [0.16 x [CH4]]

0.16 x [CH4] = 0.6221 / (3.3 x 10^4) = 1.885 x 10^-5

[CH4] = 1.885 x 10^-5 / 0.16 = 1.18 x 10^-4 M.

(This small but nonzero value confirms that the reaction proceeds essentially, but not perfectly, to completion, consistent with a very large but finite value of Kc.)`,
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
    imgMap['pressuregraph'] = await uploadImage('q1a_71_crop.png', 'a2x4-ax2-pressure-vs-time.png');
    imgMap['rategraph'] = await uploadImage('q1d_71_crop.png', 'a2x4-ax2-forward-rate-vs-time.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t71) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('7.1', t71);
    await insertTopic('7.2', t72);
    await insertTopic('7.3', t73);
    await insertTopic('7.4', t74);
    await insertTopic('7.5', t75);
    console.log('Done — Unit 7 Topics 7.1-7.5 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
