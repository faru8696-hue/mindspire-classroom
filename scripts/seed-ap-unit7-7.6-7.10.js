const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  '7.6': '70b2eaac-9329-4935-b362-413662a251c2',
  '7.7': 'a2853644-972c-401b-b56b-07f1f3c66436',
  '7.8': 'd654adce-63df-431a-b088-3ec9830b92e2',
  '7.9': 'b7fa140c-a5ed-4693-8666-44d94d4485a7',
  '7.10': 'f7f32d41-adc1-4800-93c7-9b01d19b74ff',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/u710imgs';

async function uploadImage(localFile, storageName) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit7-topics7.6-7.10/${storageName}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ============================= 7.6 — Properties of the Equilibrium Constant ============================= */
const t76 = [
  {
    title: 'Q1 — Modifying an Equation and Its Kc Value (H2 + I2 ⇌ 2 HI)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 448°C

Fill in the missing information in the table below. Write the modification that was made to the original equation shown above, and calculate the new value of Kc.

Equation | Modification | Kc
2 HI(g) ⇌ H2(g) + I2(g) | ? | ?
½ H2(g) + ½ I2(g) ⇌ HI(g) | ? | ?
2 H2(g) + 2 I2(g) ⇌ 4 HI(g) | ? | ?
HI(g) ⇌ ½ H2(g) + ½ I2(g) | ? | ?`,
    answer: `2 HI(g) ⇌ H2(g) + I2(g): Modification = the equation is reversed. Kc(new) = 1/Kc(original) = 1/51 = 0.0196 ≈ 0.020.

½ H2(g) + ½ I2(g) ⇌ HI(g): Modification = the equation is multiplied by ½ (divided by 2). Kc(new) = Kc(original)^(1/2) = 51^0.5 = 7.14 ≈ 7.1.

2 H2(g) + 2 I2(g) ⇌ 4 HI(g): Modification = the equation is multiplied by 2. Kc(new) = Kc(original)^2 = 51^2 = 2601 ≈ 2.6 x 10^3.

HI(g) ⇌ ½ H2(g) + ½ I2(g): Modification = the equation is reversed AND multiplied by ½ (i.e., reverse then take the square root). Kc(new) = (1/Kc(original))^(1/2) = (1/51)^0.5 = 0.140 ≈ 0.14.`,
  },
  {
    title: 'Q2 — Combining Two Equations to Find a New Kc (FeF2 and HF)',
    content: `# | Equation | Kc
1 | FeF2(s) ⇌ Fe2+(aq) + 2 F-(aq) | 2.4 x 10^-6
2 | HF(aq) ⇌ H+(aq) + F-(aq) | 6.8 x 10^-4
3 | FeF2(s) + 2 H+(aq) ⇌ Fe2+(aq) + 2 HF(aq) | ?

Three chemical equations are listed in the table above. Show how equations #1 and #2 can be combined in a certain way in order to produce equation #3. Calculate the equilibrium constant (Kc) for equation #3.`,
    answer: `Equation #1 is kept as written: FeF2(s) ⇌ Fe2+(aq) + 2 F-(aq)     Kc1 = 2.4 x 10^-6

Equation #2 must be reversed and multiplied by 2 (to cancel 2 F- and produce 2 HF): 2 F-(aq) + 2 H+(aq) ⇌ 2 HF(aq)     Kc2(modified) = (1/6.8 x 10^-4)^2 = (1470.6)^2 = 2.163 x 10^6

Adding equation #1 and the modified equation #2: FeF2(s) + 2 F-(aq) + 2 H+(aq) ⇌ Fe2+(aq) + 2 F-(aq) + 2 HF(aq). The 2 F-(aq) terms cancel, leaving: FeF2(s) + 2 H+(aq) ⇌ Fe2+(aq) + 2 HF(aq), which matches equation #3.

Kc(equation #3) = Kc1 x Kc2(modified) = (2.4 x 10^-6) x (2.163 x 10^6) = 5.19 ≈ 5.2.`,
  },
];

/* ============================= 7.7 — Calculating Equilibrium Concentrations ============================= */
const t77 = [
  {
    title: 'Q3 — ICE Table Starting from Pure Reactants (H2 + I2 ⇌ 2 HI)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 448°C

Samples of H2(g) and I2(g) were added to a previously evacuated reaction vessel. The initial values for the concentrations of H2(g) and I2(g) were each equal to 2.00 M. The reaction was allowed to proceed at 448°C until the system reached equilibrium. Calculate the concentrations of all three gases in the reaction vessel at equilibrium.`,
    answer: `ICE table (all concentrations in M):
Initial: [H2] = 2.00, [I2] = 2.00, [HI] = 0
Change: [H2] = -x, [I2] = -x, [HI] = +2x
Equilibrium: [H2] = 2.00-x, [I2] = 2.00-x, [HI] = 2x

Kc = [HI]^2 / ([H2][I2]) = (2x)^2 / [(2.00-x)(2.00-x)] = 51

Since [H2] and [I2] are equal throughout, this simplifies to: (2x)^2 / (2.00-x)^2 = 51, which means [2x/(2.00-x)]^2 = 51, so 2x/(2.00-x) = √51 = 7.14.

2x = 7.14(2.00-x) = 14.28 - 7.14x
2x + 7.14x = 14.28
9.14x = 14.28
x = 1.562

Equilibrium concentrations: [H2] = 2.00 - 1.562 = 0.44 M; [I2] = 2.00 - 1.562 = 0.44 M; [HI] = 2(1.562) = 3.12 M ≈ 3.1 M.`,
  },
  {
    title: 'Q4 — ICE Table Starting from Pure Product (HI Decomposition)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 448°C

A sample of HI(g) was added to a previously evacuated reaction vessel, with an initial concentration of 6.00 M for HI(g). The reaction was allowed to proceed at 448°C until the system reached equilibrium. Calculate the concentrations of all three gases in the reaction vessel at equilibrium.`,
    answer: `Since only HI is present initially, the reaction proceeds in the reverse direction (2 HI → H2 + I2) to establish equilibrium.

ICE table (all concentrations in M):
Initial: [H2] = 0, [I2] = 0, [HI] = 6.00
Change: [H2] = +x, [I2] = +x, [HI] = -2x
Equilibrium: [H2] = x, [I2] = x, [HI] = 6.00-2x

Kc = [HI]^2 / ([H2][I2]) = (6.00-2x)^2 / (x)(x) = 51

(6.00-2x)^2 = 51x^2

Taking the square root of both sides: 6.00 - 2x = √51 · x = 7.14x

6.00 = 7.14x + 2x = 9.14x

x = 0.6565

Equilibrium concentrations: [H2] = 0.66 M; [I2] = 0.66 M; [HI] = 6.00 - 2(0.6565) = 6.00 - 1.313 = 4.69 M ≈ 4.7 M.`,
  },
  {
    title: 'Q5 — ICE Table Starting from a Non-Equilibrium Mixture of All Three Gases',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kc = 51 at 448°C

Samples of H2(g), I2(g), and HI(g) were added to a previously evacuated rigid reaction vessel at 448°C, with initial concentrations of the following: [H2] = 2.00 M, [I2] = 2.00 M, [HI] = 6.00 M.

(a) In which direction, toward the left (reactants) or toward the right (products), should the reaction proceed in order to achieve equilibrium? Justify your answer by comparing the value of the reaction quotient (Qc) with the value of the equilibrium constant (Kc) at 448°C.
(b) The reaction was allowed to proceed at 448°C until the system reached equilibrium. Calculate the concentrations of all three gases in the reaction vessel at equilibrium.`,
    answer: `(a) Qc = [HI]^2/([H2][I2]) = (6.00)^2/[(2.00)(2.00)] = 36/4 = 9.0. Since Qc (9.0) < Kc (51), there are "not enough products," so the reaction should proceed toward the right (products) to reach equilibrium.

(b) ICE table (all concentrations in M):
Initial: [H2] = 2.00, [I2] = 2.00, [HI] = 6.00
Change: [H2] = -x, [I2] = -x, [HI] = +2x
Equilibrium: [H2] = 2.00-x, [I2] = 2.00-x, [HI] = 6.00+2x

Kc = (6.00+2x)^2 / (2.00-x)^2 = 51

Taking the square root: (6.00+2x)/(2.00-x) = √51 = 7.14

6.00 + 2x = 7.14(2.00-x) = 14.28 - 7.14x

2x + 7.14x = 14.28 - 6.00

9.14x = 8.28

x = 0.9058

Equilibrium concentrations: [H2] = 2.00 - 0.906 = 1.09 M; [I2] = 2.00 - 0.906 = 1.09 M; [HI] = 6.00 + 2(0.906) = 7.81 M.`,
  },
  {
    title: 'Q6 — Equilibrium of a Solid-Gas System (C(s) + CO2(g) ⇌ 2 CO(g))',
    content: `C(s) + CO2(g) ⇌ 2 CO(g)

Solid carbon and carbon dioxide gas at 1160 K were placed in a rigid previously evacuated 2.00 L container, and a chemical reaction occurred, producing carbon monoxide gas as represented by the equation above. Solid carbon remained in the container at all times. As the reaction proceeded, the total pressure in the container was monitored. Results are recorded in the table below.

Time (hours) | Total Pressure of Gases in Container at 1160 K (atm)
0 | 5.00
2.0 | 6.26
4.0 | 7.09
6.0 | 7.75
8.0 | 8.37
10.0 | 8.37

(a) At what time during this experiment was equilibrium achieved? Justify your answer.
(b) Calculate the number of moles of CO2(g) initially placed in the container. Assume that the volume of solid carbon in the container is negligible.
(c) For the reaction mixture at equilibrium at 1160 K, the partial pressure of CO2(g) is equal to 1.63 atm. Calculate the partial pressure of CO(g) in the container at equilibrium.
(d) Write the expression for the equilibrium constant, Kp, for this reaction, and calculate the value of Kp at 1160 K.
(e) A second trial of this experiment is carried out at 1160 K, with the same initial amount of C(s) and CO2(g). A solid catalyst is placed in the reaction vessel. Do you predict that the total pressure of the gas mixture at equilibrium will be less than, greater than, or equal to the total pressure at equilibrium in Trial 1 in the absence of a catalyst? Justify your prediction. Assume that the volume of the solid catalyst is negligible.
(f) In another experiment involving the same reaction, a rigid 2.00 L container initially contained 10.0 g C(s) and a mixture of CO(g) and CO2(g). The initial values for the partial pressures of CO2(g) and CO(g) were each equal to 3.00 atm. The system is allowed to reach equilibrium at 1160 K. Solid carbon remained in the container at all times. Do you predict that the partial pressure of CO2(g) at equilibrium is less than or greater than 3.00 atm? Justify your answer by comparing the value of the reaction quotient (Qp) with the value of the equilibrium constant (Kp) at 1160 K.
(g) When the system described in part (f) has reached equilibrium at 1160 K, the total pressure of gases in the container is equal to 7.61 atm. Calculate the partial pressure of CO2(g) and CO(g) in the container at equilibrium.`,
    answer: `(a) Equilibrium was achieved at t = 8.0 hours. This is the point at which the total pressure stops changing over time (it is 8.37 atm at both t=8.0 and t=10.0 hours), indicating that the forward and reverse reaction rates have become equal and no further net reaction is occurring.

(b) Initially (before any reaction), only CO2(g) is present, with total pressure = 5.00 atm (since no CO exists yet and C(s) doesn't contribute to gas pressure). Using PV = nRT: n = PV/(RT) = (5.00 atm)(2.00 L) / [(0.08206 L·atm/(mol·K))(1160 K)] = 10.00 / 95.19 = 0.1051 mol ≈ 0.105 mol CO2.

(c) Using the ICE relationship: for every 1 mol CO2 consumed, 2 mol CO is produced, so the total pressure increases by +x for each x consumed (since -x CO2 + 2x CO = net +x pressure change). Total pressure increased from 5.00 to 8.37 atm, a change of +3.37 atm, so x = 3.37 atm (the amount of CO2 consumed in pressure terms). Partial pressure of CO2 at equilibrium = 5.00 - 3.37 = 1.63 atm (matches the given value). Partial pressure of CO = 2x = 2(3.37) = 6.74 atm.

(d) Kp = (P(CO))^2 / P(CO2) (C(s) is a solid and excluded). Kp = (6.74)^2 / 1.63 = 45.4/1.63 = 27.9 ≈ 28.

(e) Equal to. A catalyst speeds up the rate at which equilibrium is reached, but it does not change the value of the equilibrium constant K or shift the position of equilibrium — the same equilibrium partial pressures (and thus the same total pressure) will be reached either way, just faster with the catalyst present.

(f) Less than 3.00 atm. Qp = (P(CO))^2/P(CO2) = (3.00)^2/(3.00) = 9.00/3.00 = 3.00. Since Qp (3.00) < Kp (28), there are "not enough products" (too much CO2 relative to CO), so the reaction should proceed toward the products (consuming CO2, producing more CO) to reach equilibrium — meaning P(CO2) must decrease below 3.00 atm.

(g) Using the same relationship: initial total pressure = 3.00 + 3.00 = 6.00 atm. Since the reaction proceeds forward (CO2 decreasing by x, CO increasing by 2x, net change = +x per mol reacted), and total pressure increases from 6.00 to 7.61 atm (a change of +1.61 atm), x = 1.61 atm. P(CO2) at equilibrium = 3.00 - 1.61 = 1.39 atm. P(CO) at equilibrium = 3.00 + 2(1.61) = 3.00 + 3.22 = 6.22 atm. (Check: 1.39 + 6.22 = 7.61 atm, matches the given total pressure.)`,
  },
];

/* ============================= 7.8 — Representations of Equilibrium ============================= */
const t78 = [
  {
    title: 'Q7 — Calculating Kc from Particle Diagrams (X2 + 2 Y ⇌ X2Y2)',
    imageKey: 'equilibriumdiagram',
    content: `X2(g) + 2 Y(g) ⇌ X2Y2(g)

Substance X2(g) reacts with Y(g) according to the equation above.

(a) Write the equilibrium constant expression (Kc) for the reaction represented by the equation above.
(b) The particulate diagram shown represents the reaction mixture after equilibrium has been achieved at 500 K (8 X2 molecules shown as black-black pairs, 2 free Y atoms shown as single white circles, and 2 X2Y2 molecules shown as white-black-black-white clusters). Assume that each particle in the diagram represents 1 mole, and that the volume of the reaction vessel is 1.00 L. Use the information from this diagram to calculate the value of the equilibrium constant (Kc) for this reaction at 500 K.`,
    answer: `(a) Kc = [X2Y2] / ([X2][Y]^2)

(b) From the diagram: 8 mol X2, 2 mol Y, 2 mol X2Y2, in a 1.00 L vessel, so [X2] = 8 M, [Y] = 2 M, [X2Y2] = 2 M.

Kc = [X2Y2] / ([X2][Y]^2) = 2 / [(8)(2)^2] = 2 / (8)(4) = 2/32 = 0.0625 ≈ 6.3 x 10^-2.`,
  },
  {
    title: 'Q8 — Using Qc to Evaluate Three Particle Diagrams (X2 + 2 Y ⇌ X2Y2)',
    imageKey: 'threediagrams',
    content: `X2(g) + 2 Y(g) ⇌ X2Y2(g)     Kc = 0.0625 (from the previous question)

The three diagrams shown are particulate representations of the reaction mixture at various points in time (each particle = 1 mole, volume = 1.00 L for each). Diagram 1 contains 3 X2 molecules, 2 free Y atoms, and 5 X2Y2 molecules. Diagram 2 contains 5 X2 molecules, 6 free Y atoms, and 3 X2Y2 molecules. Diagram 3 contains 4 X2 molecules, 4 free Y atoms, and 4 X2Y2 molecules.

For each diagram:
- Calculate the value of the reaction quotient (Qc).
- Based on the comparison of Qc and Kc, determine if the reaction mixture represented in the diagram is at equilibrium.
- If the system is not at equilibrium, determine the direction, toward the right (products) or toward the left (reactants), that the reaction should proceed in order to reach equilibrium.`,
    answer: `Diagram 1: [X2] = 3 M, [Y] = 2 M, [X2Y2] = 5 M. Qc = 5/[(3)(2)^2] = 5/12 = 0.417. Since Qc (0.417) > Kc (0.0625), the system is NOT at equilibrium; there are too many products, so the reaction should proceed toward the left (reactants).

Diagram 2: [X2] = 5 M, [Y] = 6 M, [X2Y2] = 3 M. Qc = 3/[(5)(6)^2] = 3/180 = 0.0167. Since Qc (0.0167) < Kc (0.0625), the system is NOT at equilibrium; there are not enough products (too many reactants), so the reaction should proceed toward the right (products).

Diagram 3: [X2] = 4 M, [Y] = 4 M, [X2Y2] = 4 M. Qc = 4/[(4)(4)^2] = 4/64 = 0.0625. Since Qc (0.0625) = Kc (0.0625), this system IS at equilibrium.`,
  },
];

/* ============================= 7.10 — Reaction Quotient and Le Chatelier's Principle ============================= */
const t710 = [
  {
    title: 'Q9 — Effect of Adding SO3 on an Equilibrium System (2 SO3 ⇌ 2 SO2 + O2)',
    content: `2 SO3(g) ⇌ 2 SO2(g) + O2(g)

Sulfur trioxide gas decomposes at high temperature to produce sulfur dioxide gas and oxygen gas according to the equation above. A sample of SO3(g) was added to a previously evacuated rigid reaction vessel. The reaction represented by the equation above was allowed to proceed until it reached equilibrium at 1000 K. The partial pressures were determined to be the following:

P(SO3) = 3.43 atm     P(SO2) = 2.00 atm     P(O2) = 1.00 atm

(a) Write the equilibrium constant expression (Kp) for the reaction and calculate the value of Kp at 1000 K.
(b) Additional SO3(g) is added to the reaction vessel at 1000 K until the partial pressure of SO3(g) is 6.00 atm. Calculate the value of Qp at the moment that additional SO3(g) is added.
(c) The addition of SO3(g) to the reaction vessel caused a disturbance in the equilibrium system that had already been established. As the system re-establishes equilibrium at 1000 K, which of the following statements should be true: the partial pressure of SO2(g) will decrease until Qp = Kp, or the partial pressure of SO2(g) will increase until Qp = Kp?
(d) When equilibrium is re-established at 1000 K, the partial pressure of O2(g) in the reaction vessel is 1.34 atm. Calculate the partial pressures of SO3(g) and SO2(g) when equilibrium is re-established.`,
    answer: `(a) Kp = [(P(SO2))^2 (P(O2))] / (P(SO3))^2 = [(2.00)^2(1.00)] / (3.43)^2 = 4.00/11.76 = 0.340.

(b) Immediately after adding SO3 (before any shift occurs), P(SO3) = 6.00 atm, while P(SO2) and P(O2) remain at their prior equilibrium values (2.00 atm and 1.00 atm) since only SO3 was added. Qp = [(2.00)^2(1.00)]/(6.00)^2 = 4.00/36.0 = 0.111.

(c) The partial pressure of SO2(g) will increase until Qp = Kp. Since Qp (0.111) < Kp (0.340) after the disturbance, there are "not enough products," so the reaction shifts toward the products (right), consuming SO3 and producing more SO2 and O2 — so P(SO2) increases.

(d) Since the reaction produces 2 mol SO2 and 1 mol O2 for every 2 mol SO3 consumed, and P(O2) increased from 1.00 to 1.34 atm (a change of +0.34 atm = x), the change in P(SO2) = +2x = +0.68 atm, and the change in P(SO3) = -2x = -0.68 atm.

P(SO3) at new equilibrium = 6.00 - 0.68 = 5.32 atm. P(SO2) at new equilibrium = 2.00 + 0.68 = 2.68 atm.

(Check: Kp = [(2.68)^2(1.34)]/(5.32)^2 = [7.182 x 1.34]/28.30 = 9.63/28.30 = 0.340, matches Kp — confirms the calculation.)`,
  },
  {
    title: 'Q10 — Effect of Removing SO2 on an Equilibrium System (2 SO3 ⇌ 2 SO2 + O2)',
    content: `2 SO3(g) ⇌ 2 SO2(g) + O2(g)     Kp = 0.340 at 1000 K

A reaction vessel contains a mixture of SO3(g), SO2(g), and O2(g) at 1000 K with the following values of partial pressure:

P(SO3) = 10.29 atm     P(SO2) = 3.00 atm     P(O2) = 4.00 atm

(a) Is this system at equilibrium? Justify your answer with a calculation.
(b) Some of the SO2(g) is removed from the reaction vessel at 1000 K, reducing the partial pressure of SO2(g) to a value of 1.00 atm. Calculate the value of Qp at the moment that the SO2(g) is removed.
(c) The removal of SO2(g) from the reaction vessel caused a disturbance in the equilibrium system that had already been established. As the system re-establishes equilibrium at 1000 K, which of the following statements should be true: the partial pressure of O2(g) will decrease until Qp = Kp, or the partial pressure of O2(g) will increase until Qp = Kp?
(d) When equilibrium is re-established at 1000 K, the partial pressure of O2(g) in the reaction vessel is 4.70 atm. Calculate the partial pressures of SO3(g) and SO2(g) when equilibrium is re-established.`,
    answer: `(a) Qp = [(3.00)^2(4.00)]/(10.29)^2 = 36.0/105.9 = 0.340. Since Qp = Kp = 0.340, this system IS at equilibrium.

(b) Immediately after removing SO2 (before any shift occurs), P(SO2) = 1.00 atm, while P(SO3) and P(O2) remain at their prior values (10.29 atm and 4.00 atm). Qp = [(1.00)^2(4.00)]/(10.29)^2 = 4.00/105.9 = 0.0378.

(c) The partial pressure of O2(g) will increase until Qp = Kp. Since Qp (0.0378) < Kp (0.340), there are "not enough products," so the reaction shifts toward the products (right), consuming SO3 and producing more SO2 and O2 — so P(O2) increases.

(d) Since P(O2) increased from 4.00 to 4.70 atm (a change of +0.70 atm = x), the change in P(SO2) = +2x = +1.40 atm, and the change in P(SO3) = -2x = -1.40 atm.

P(SO3) at new equilibrium = 10.29 - 1.40 = 8.89 atm. P(SO2) at new equilibrium = 1.00 + 1.40 = 2.40 atm.

(Check: Kp = [(2.40)^2(4.70)]/(8.89)^2 = [5.76 x 4.70]/79.0 = 27.07/79.0 = 0.343 ≈ 0.34, matches Kp within rounding.)`,
  },
  {
    title: 'Q11 — Effect of Decreasing Volume on an Equilibrium System (N2O4 ⇌ 2 NO2)',
    content: `N2O4(g) ⇌ 2 NO2(g)     Kp = 0.21 at 373 K

A reaction vessel with a volume of 2.00 L contains a mixture of N2O4(g) and NO2(g) at 373 K with the following values of partial pressure:

P(N2O4) = 4.77 atm     P(NO2) = 1.00 atm

(a) Is this system at equilibrium? Justify your answer with a calculation.
(b) The volume of the reaction vessel is decreased from 2.00 L to 1.00 L while the temperature is held constant at 373 K. At the moment the volume is decreased to 1.00 L, what is the partial pressure of each gas?
(c) Based on your answer to part (b), calculate the value of Qp for this system.
(d) The change in the volume of the reaction vessel caused a disturbance in the equilibrium system that had already been established. As the system re-establishes equilibrium at 373 K, which of the following statements should be true: the partial pressure of NO2(g) will decrease until Qp = Kp, or the partial pressure of NO2(g) will increase until Qp = Kp?
(e) When equilibrium is re-established at 373 K, the partial pressure of N2O4(g) in the reaction vessel is 9.82 atm. Calculate the partial pressure of NO2(g) when equilibrium is re-established.`,
    answer: `(a) Qp = (P(NO2))^2/P(N2O4) = (1.00)^2/4.77 = 0.210. Since Qp = Kp = 0.21, this system IS at equilibrium.

(b) When the volume is halved (2.00 L → 1.00 L) at constant temperature and moles, the pressure of each gas doubles (Boyle's Law, P inversely proportional to V): P(N2O4) = 2 x 4.77 = 9.54 atm; P(NO2) = 2 x 1.00 = 2.00 atm.

(c) Qp = (P(NO2))^2/P(N2O4) = (2.00)^2/9.54 = 4.00/9.54 = 0.419.

(d) The partial pressure of NO2(g) will decrease until Qp = Kp. Since Qp (0.419) > Kp (0.21) after the volume decrease, there are "too many products" (relatively), so the system shifts toward the reactants (left) — toward the side with fewer moles of gas, consistent with decreasing volume favoring the side with fewer gas particles (1 mol N2O4 vs 2 mol NO2) — consuming NO2 and producing more N2O4, so P(NO2) decreases.

(e) Since P(N2O4) increased from 9.54 to 9.82 atm (a change of +0.28 atm = x), and the stoichiometry is 1 N2O4 : 2 NO2, the change in P(NO2) = -2x = -0.56 atm.

P(NO2) at new equilibrium = 2.00 - 0.56 = 1.44 atm.

(Check: Kp = (1.44)^2/9.82 = 2.074/9.82 = 0.211 ≈ 0.21, matches Kp.)`,
  },
  {
    title: 'Q12 — Effect of Increasing Volume on an Equilibrium System (N2O4 ⇌ 2 NO2)',
    content: `N2O4(g) ⇌ 2 NO2(g)     Kp = 0.21 at 373 K

A reaction vessel with a volume of 1.00 L contains a mixture of N2O4(g) and NO2(g) at 373 K with the following values of partial pressure:

P(N2O4) = 19.02 atm     P(NO2) = 2.00 atm

(a) Is this system at equilibrium? Justify your answer with a calculation.
(b) The volume of the reaction vessel is increased from 1.00 L to 2.00 L while the temperature is held constant at 373 K. At the moment the volume is increased to 2.00 L, what is the partial pressure of each gas?
(c) Based on your answer to part (b), calculate the value of Qp for this system.
(d) The change in the volume of the reaction vessel caused a disturbance in the equilibrium system that had already been established. As the system re-establishes equilibrium at 373 K, which of the following statements should be true: the partial pressure of NO2(g) will decrease until Qp = Kp, or the partial pressure of NO2(g) will increase until Qp = Kp?
(e) When equilibrium is re-established at 373 K, the partial pressure of N2O4(g) in the reaction vessel is 9.31 atm. Calculate the partial pressure of NO2(g) when equilibrium is re-established.`,
    answer: `(a) Qp = (P(NO2))^2/P(N2O4) = (2.00)^2/19.02 = 4.00/19.02 = 0.210. Since Qp = Kp = 0.21, this system IS at equilibrium.

(b) When the volume is doubled (1.00 L → 2.00 L) at constant temperature and moles, the pressure of each gas is halved (Boyle's Law): P(N2O4) = 19.02/2 = 9.51 atm; P(NO2) = 2.00/2 = 1.00 atm.

(c) Qp = (P(NO2))^2/P(N2O4) = (1.00)^2/9.51 = 1.00/9.51 = 0.105.

(d) The partial pressure of NO2(g) will increase until Qp = Kp. Since Qp (0.105) < Kp (0.21) after the volume increase, there are "not enough products" (relatively), so the system shifts toward the products (right) — toward the side with more moles of gas, consistent with increasing volume favoring the side with more gas particles (2 mol NO2 vs 1 mol N2O4) — consuming N2O4 and producing more NO2, so P(NO2) increases.

(e) Since P(N2O4) decreased from 9.51 to 9.31 atm (a change of -0.20 atm, so x = 0.20 atm consumed), and the stoichiometry is 1 N2O4 : 2 NO2, the change in P(NO2) = +2x = +0.40 atm.

P(NO2) at new equilibrium = 1.00 + 0.40 = 1.40 atm.

(Check: Kp = (1.40)^2/9.31 = 1.96/9.31 = 0.211 ≈ 0.21, matches Kp.)`,
  },
  {
    title: 'Q13 — No Shift When Moles of Gas Are Equal on Both Sides (H2 + I2 ⇌ 2 HI)',
    content: `H2(g) + I2(g) ⇌ 2 HI(g)     Kp = 51 at 448°C

A reaction vessel with a volume of 2.00 L contains a mixture of H2(g), I2(g), and HI(g) at 448°C with the following values of partial pressure:

P(H2) = 1.20 atm     P(I2) = 1.20 atm     P(HI) = 8.57 atm

(a) Is this system at equilibrium? Justify your answer with a calculation.
(b) The volume of the reaction vessel is decreased from 2.00 L to 1.00 L while the temperature is held constant at 448°C. At the moment the volume is decreased to 1.00 L, what is the partial pressure of each gas?
(c) Based on your answer to part (b), calculate the value of Qp for this system.

Even though the volume of the reaction vessel was decreased from 2.00 L to 1.00 L, no shift in the equilibrium system will occur. This can be explained because there is an equal number of moles of gas on each side of this chemical equation.`,
    answer: `(a) Qp = (P(HI))^2/[(P(H2))(P(I2))] = (8.57)^2/[(1.20)(1.20)] = 73.4/1.44 = 51.0. Since Qp = Kp = 51, this system IS at equilibrium.

(b) When the volume is halved (2.00 L → 1.00 L), the pressure of each gas doubles (Boyle's Law): P(H2) = 2 x 1.20 = 2.40 atm; P(I2) = 2 x 1.20 = 2.40 atm; P(HI) = 2 x 8.57 = 17.14 atm.

(c) Qp = (P(HI))^2/[(P(H2))(P(I2))] = (17.14)^2/[(2.40)(2.40)] = 293.8/5.76 = 51.0. Since Qp still equals Kp (51) after the volume change, the system remains at equilibrium — no shift occurs, consistent with the fact that there are equal moles of gas (2 mol total) on both sides of the equation (1 H2 + 1 I2 = 2 mol reactant-side gas; 2 HI = 2 mol product-side gas), so changing the volume affects both sides proportionally and does not disturb the equilibrium.`,
  },
  {
    title: 'Q14 — Why an Inert Gas Does Not Shift Equilibrium',
    content: `If an inert, unreactive gas such as helium (He) or neon (Ne) is added to a gaseous system at equilibrium, the total pressure of the gas mixture increases. However, no shift in the equilibrium system will occur. Explain this result in terms of the reaction quotient (Qp).`,
    answer: `Adding an inert gas like He or Ne increases the TOTAL pressure of the gas mixture, but it does not change the PARTIAL pressure of any of the reacting species (H2, I2, HI, N2O4, NO2, etc.) already present in the container, since the inert gas does not participate in the reaction and does not react with or displace any of the existing gases.

Since the equilibrium constant expression Kp (and the reaction quotient Qp) is written using only the partial pressures of the reacting species (not the total pressure, and not any inert gases present), and none of those partial pressures change when an inert gas is added, the value of Qp remains unchanged and still equal to Kp. Since Q is still equal to K, the system remains at equilibrium, and no shift occurs.`,
  },
  {
    title: 'Q15 — Kc Expression and the Effect of Dilution (Cobalt Complex Equilibrium)',
    content: `Co(H2O)6^2+(aq) + 4 Cl-(aq) ⇌ CoCl4^2-(aq) + 6 H2O(l)
pink                                              blue

Two different forms of the cobalt(II) ion are in equilibrium according to the equation above. A purple solution contains an equilibrium mixture of pink Co(H2O)6^2+(aq), colorless Cl-(aq), and blue CoCl4^2-(aq).

(a) Write the equilibrium-constant expression (Kc) for the reaction shown above.

The concentration of the aqueous ions in the purple solution is unknown. The concentration of each ion can be represented by the variables a, b, and c as shown below: [Co(H2O)6^2+] = a, [Cl-] = b, [CoCl4^2-] = c.

(b) Write the equilibrium-constant expression (Kc) for the reaction shown above in terms of the variables a, b, and c.

A 10.0 mL sample of distilled water was added to 10.0 mL of the purple solution described above. As a result of this dilution experiment, the color of the solution changed from purple to pink.

(c) In which direction, toward the left (reactants) or toward the right (products), did the equilibrium system shift as a result of the dilution with water?
(d) Dilution of the purple solution with water caused the concentration of all aqueous species to decrease to half of their original values. Use this information to write the expression for the reaction quotient (Qc) in terms of a, b, and c at the moment that water was added to the purple solution.`,
    answer: `(a) Kc = [CoCl4^2-] / {[Co(H2O)6^2+][Cl-]^4}     (H2O(l) is a pure liquid and is excluded from the expression.)

(b) Kc = c / (a · b^4)

(c) Toward the left (reactants). Since the color changed from purple to pink, and pink is the color of Co(H2O)6^2+(aq), this indicates that the concentration of Co(H2O)6^2+ increased relative to CoCl4^2- — meaning the equilibrium shifted toward the reactants (left), consistent with the general rule that diluting an aqueous equilibrium system with water shifts it toward the side with the higher number of moles of aqueous particles (5 total aqueous particles on the left: 1 Co(H2O)6^2+ + 4 Cl-, vs. only 1 aqueous particle, CoCl4^2-, on the right — water itself is a pure liquid, not counted).

(d) Immediately after dilution (before any shift occurs), each concentration is exactly half of its original value: [Co(H2O)6^2+] = a/2, [Cl-] = b/2, [CoCl4^2-] = c/2.

Qc = (c/2) / [(a/2)(b/2)^4] = (c/2) / [(a/2)(b^4/16)] = (c/2) / (a·b^4/32) = (c/2) x (32/(a·b^4)) = 16c / (a·b^4).`,
  },
  {
    title: 'Q16 — Effect of Temperature on the Cobalt Complex Equilibrium',
    content: `Co(H2O)6^2+(aq) + 4 Cl-(aq) ⇌ CoCl4^2-(aq) + 6 H2O(l)
pink                                              blue

A purple solution contains an equilibrium mixture of pink Co(H2O)6^2+(aq), colorless Cl-(aq), and blue CoCl4^2-(aq). The purple solution is added to three separate test tubes.
- One test tube is placed in a hot water bath, and the color changes from purple to blue.
- One test tube is kept at room temperature, and the color remains purple.
- One test tube is placed in an ice water bath, and the color changes from purple to pink.

(a) In which direction, toward the left (reactants) or toward the right (products), did the equilibrium system shift as a result of placing the test tube in the hot water bath?
(b) In which direction, toward the left (reactants) or toward the right (products), did the equilibrium system shift as a result of placing the test tube in the ice water bath?
(c) Is the reaction represented by the equation shown above classified as endothermic or exothermic?`,
    answer: `(a) Toward the right (products). The color changed from purple to blue, and blue is the color of CoCl4^2-(aq), indicating that the concentration of CoCl4^2- increased — meaning the equilibrium shifted toward the products (right) when heated.

(b) Toward the left (reactants). The color changed from purple to pink, and pink is the color of Co(H2O)6^2+(aq), indicating that the concentration of Co(H2O)6^2+ increased — meaning the equilibrium shifted toward the reactants (left) when cooled.

(c) Endothermic. Since increasing the temperature (hot water bath) caused the equilibrium to shift toward the products (right), this means the forward reaction absorbs heat (heat acts like a "reactant" that, when added via heating, shifts the equilibrium toward the products) — which is the defining behavior of an endothermic reaction. (This is confirmed by the reverse: decreasing the temperature shifted the equilibrium toward the reactants, consistent with removing heat favoring the direction that doesn't require it.)`,
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
    imgMap['equilibriumdiagram'] = await uploadImage('q7b_final.png', 'x2-y-x2y2-equilibrium-diagram.png');
    imgMap['threediagrams'] = await uploadImage('q7c_all3.png', 'x2-y-x2y2-three-time-diagrams.png');
    console.log('Images uploaded:', imgMap);

    for (const q of t78) if (q.imageKey) q.resolvedImageUrl = imgMap[q.imageKey];

    await insertTopic('7.6', t76);
    await insertTopic('7.7', t77);
    await insertTopic('7.8', t78);
    await insertTopic('7.10', t710);
    console.log('Done — Unit 7 Topics 7.6-7.10 seeded.');
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
