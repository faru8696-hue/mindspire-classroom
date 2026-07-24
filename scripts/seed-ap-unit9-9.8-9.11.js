const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Note: this source PDF's own numbering (9.8-9.11) is one higher than this class's
// actual topic numbering, since this class's Unit 9 doesn't have a separate
// "Free Energy of Dissolution" topic (see 9.1-9.7 seed script for the same shift).
// PDF's 9.8/9.9/9.10/9.11 map to this class's 9.7/9.8/9.9/9.10.
const TOPICS = {
  '9.7': '278fedc7-d2c0-415e-a8ff-0a718d684f61',  // Galvanic (Voltaic) and Electrolytic Cells
  '9.8': '6f1f1464-4e71-425b-8af0-14c86afbcb72',  // Cell Potential and Free Energy
  '9.9': '213d2f22-b72e-49ff-a4a7-5eff7bb99382',  // Cell Potential Under Nonstandard Conditions
  '9.10': '5a9bdcfa-4e63-428f-9110-7bfb6d8ca781', // Electrolysis and Faraday's Laws
};

/* ============================= 9.7 — Galvanic (Voltaic) and Electrolytic Cells ============================= */
const t97 = [
  {
    title: 'Q1 — Identifying the Thermodynamically Favored Reaction (Zn/Cu Displacement)',
    content: `A student places a strip of zinc metal into a solution of 1.0 M copper(II) sulfate. The student also places a strip of copper metal into a solution of 1.0 M zinc sulfate. Observations:

Zn(s) placed in CuSO4(aq): A dark solid appears on the surface of the Zn(s). The color of CuSO4(aq) changes from dark blue to light blue.
Cu(s) placed in ZnSO4(aq): The appearances of both Cu(s) and ZnSO4(aq) remain unchanged.

(a) Based on the results of this experiment, classify each of the following reactions as thermodynamically favored or unfavored.

Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s)
Cu(s) + ZnSO4(aq) → CuSO4(aq) + Zn(s)

(b) Write the net ionic equation for the reaction that you classified as thermodynamically favored in part (a).
(c) In the equation you wrote in part (b), identify the species that is oxidized and the species that is reduced.`,
    answer: `(a) Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s) is thermodynamically FAVORED (a visible reaction occurred: dark Cu solid formed, blue CuSO4 color faded as Cu2+ was consumed).

Cu(s) + ZnSO4(aq) → CuSO4(aq) + Zn(s) is thermodynamically UNFAVORED (no observable change occurred — this reaction does not proceed).

(b) Zn(s) + Cu2+(aq) → Zn2+(aq) + Cu(s)

(c) Zn(s) is oxidized (loses electrons, goes from 0 to +2). Cu2+(aq) is reduced (gains electrons, goes from +2 to 0).`,
  },
  {
    title: 'Q2 — Identifying Half-Reactions in Electrolytic Cells (Water and Molten MgCl2)',
    content: `Experimental setups for two different electrolytic cells: one uses a DC voltage supply connected to electrodes in water and electrolyte; the other uses a power source connected to electrodes in molten MgCl2, producing Mg(l) at one electrode and Cl2(g) at the other.

(a) Identify a specific item that is included in each setup that supports the fact that the reaction that occurs in the electrolytic cell is NOT thermodynamically favored.

2 H2O(l) → 2 H2(g) + O2(g)

(b) Complete each sentence based on the redox equation shown above (electrolysis of water).

At the (anode / cathode), ___ is oxidized from ___ to ___.
At the (anode / cathode), ___ is reduced from ___ to ___.

MgCl2(l) → Mg(l) + Cl2(g)

(c) Complete each sentence based on the redox equation shown above (electrolysis of molten MgCl2).

At the (anode / cathode), ___ is oxidized from ___ to ___.
At the (anode / cathode), ___ is reduced from ___ to ___.`,
    answer: `(a) The DC voltage supply / power source in each setup is the specific item that supports the fact that the reaction is NOT thermodynamically favored — an electrolytic cell always requires an external power source to force an otherwise unfavorable (nonspontaneous) reaction to occur; a thermodynamically favored (galvanic) reaction would not need one.

(b) At the anode, oxygen (in H2O) is oxidized from -2 to 0 (forming O2(g)). At the cathode, hydrogen (in H2O) is reduced from +1 to 0 (forming H2(g)).

(c) At the anode, chloride ion (Cl-) is oxidized from -1 to 0 (forming Cl2(g)). At the cathode, magnesium ion (Mg2+) is reduced from +2 to 0 (forming Mg(l)).`,
  },
  {
    title: 'Q3 — Identifying a Missing Salt Bridge and Writing the Cell Reaction (Cr/Ag)',
    content: `A student sets up a galvanic cell with a Cr(s) electrode immersed in 1.0 M Cr3+(aq) and a Ag(s) electrode immersed in 1.0 M Ag+(aq).

(a) The student measures the voltage in the cell and discovers that it is zero. Identify the missing component of the cell.
(b) What is the main purpose of the missing component that you chose in part (a)?
(c) The student adds the missing component to the cell. A voltmeter measures the standard cell potential (E°) as +1.54 V. As the cell operates, the mass of the Ag(s) electrode increases. Based on this information, write the balanced net ionic equation for the overall chemical reaction that occurs as the galvanic cell operates.`,
    answer: `(a) The missing component is the salt bridge.

(b) The main purpose of the salt bridge is to allow ions to flow between the two half-cells in order to balance the overall charge that would otherwise build up in each container as the cell operates — completing the circuit so that current (and thus a measurable voltage) can flow. Without a salt bridge, charge would build up in each half-cell and stop the reaction almost immediately, resulting in a voltage of zero.

(c) Since the mass of the Ag(s) electrode increases, Ag+(aq) is being reduced to Ag(s) at the cathode: Ag+(aq) + e- → Ag(s). This means Cr(s) is oxidized at the anode: Cr(s) → Cr3+(aq) + 3e-. Balancing electrons (multiply the Ag half-reaction by 3): 3 Ag+(aq) + 3e- → 3 Ag(s).

Overall net ionic equation: Cr(s) + 3 Ag+(aq) → Cr3+(aq) + 3 Ag(s)`,
  },
  {
    title: 'Q4 — Identifying Anode/Cathode, Half-Reactions, and Ion Flow (Cu/Sn Galvanic Cell)',
    content: `A student sets up a standard galvanic cell, with a Cu(s) electrode immersed in 1.0 M Cu(NO3)2(aq) and a Sn(s) electrode immersed in 1.0 M Sn(NO3)2(aq). As current flows through the cell, the mass of the Cu(s) electrode increases and the mass of the Sn(s) electrode decreases.

(a) Identify the electrode that represents the anode and the electrode that represents the cathode.
(b) Write the net ionic equation for the half-reaction that occurs at each electrode.
(c) Describe the direction of electron flow in the wire as the galvanic cell operates.
(d) A solution of sodium sulfate, Na2SO4(aq), is used in the salt bridge. Describe the movement of the Na+ and SO4^2- ions in the salt bridge as the cell begins to operate.`,
    answer: `(a) Since the mass of Sn(s) decreases, Sn is being oxidized — Sn(s) is the anode. Since the mass of Cu(s) increases, Cu2+ is being reduced onto it — Cu(s) is the cathode.

(b) Half-reaction at the anode (Sn): Sn(s) → Sn2+(aq) + 2 e-. Half-reaction at the cathode (Cu): Cu2+(aq) + 2 e- → Cu(s).

(c) Electrons flow through the wire from the anode (Sn) to the cathode (Cu) — electrons are always released at the anode (where oxidation occurs) and travel through the external wire toward the cathode (where reduction occurs).

(d) Na+ (cations) move through the salt bridge toward the cathode (the Cu half-cell), since Cu2+ is being consumed there (reduced to Cu(s)), leaving an excess of negative charge (NO3-) that needs to be balanced by incoming cations. SO4^2- (anions) move through the salt bridge toward the anode (the Sn half-cell), since Sn2+ is being produced there (oxidized from Sn(s)), creating an excess of positive charge that needs to be balanced by incoming anions.`,
  },
  {
    title: 'Q5 — Analyzing an Electrolytic Cell (Cu Deposition and O2 Production)',
    content: `An external direct-current power supply is connected to two platinum electrodes immersed in a beaker containing 1.0 M CuSO4(aq) at 25°C. As the cell operates, copper metal is deposited onto one electrode, and O2(g) is produced at the other electrode.

Half-Reaction | E° (V)
O2(g) + 4 H+(aq) + 4 e- → 2 H2O(l) | +1.23
Cu2+(aq) + 2 e- → Cu(s) | +0.34

(a) Is the overall chemical reaction that occurs in this electrochemical cell classified as thermodynamically favored or unfavored? Justify your answer.
(b) The cell potential (E°) for the overall chemical reaction that occurs in this electrochemical cell should be (positive / negative) because an external power source is required in order for the reaction to occur.
(c) Write the net ionic equation for the half-reaction that occurs at each electrode.
(d) Write a balanced net ionic equation for the chemical reaction that occurs in this electrochemical cell (the total electrons gained must equal the total electrons lost).
(e) Calculate the value of the standard cell potential (E°), in volts, for the chemical reaction that occurs in this electrolytic cell.
(f) Describe the direction of electron flow in the wire as the electrolytic cell operates.`,
    answer: `(a) Thermodynamically unfavored. This is confirmed by the fact that an external power supply is required for the reaction to occur — this is the defining characteristic of an electrolytic cell (as opposed to a galvanic cell, which occurs spontaneously without an external power source).

(b) Negative.

(c) At the electrode where O2(g) is produced (the anode, oxidation): 2 H2O(l) → O2(g) + 4 H+(aq) + 4 e- (the reverse of the given reduction half-reaction). At the electrode where Cu(s) is deposited (the cathode, reduction): Cu2+(aq) + 2 e- → Cu(s).

(d) Balancing electrons: the cathode half-reaction (2 e-) must be multiplied by 2 to match the anode's 4 e-: 2 Cu2+(aq) + 4 e- → 2 Cu(s). Adding to the anode half-reaction: 2 H2O(l) + 2 Cu2+(aq) → O2(g) + 4 H+(aq) + 2 Cu(s).

(e) E°cell = E°(cathode, reduction) - E°(anode, reduction reference) = E°(Cu2+/Cu) - E°(O2/H2O) = 0.34 - 1.23 = -0.89 V. (The negative value confirms this is an electrolytic, not galvanic, cell — consistent with part (a).)

(f) Electrons flow through the wire from the anode (the O2-producing electrode, where oxidation occurs) through the external circuit and power supply to the cathode (the Cu-depositing electrode, where reduction occurs) — the same anode-to-cathode direction as in a galvanic cell, except here the power supply forces this electron flow against the natural (unfavorable) direction.`,
  },
];

/* ============================= 9.8 — Cell Potential and Free Energy ============================= */
const t98 = [
  {
    title: 'Q6 — Full Analysis of a Galvanic Cell (Al/Zn): Equation, E°, ΔG°, Electrode Roles',
    content: `A student sets up a standard galvanic cell, with an Al(s) electrode immersed in 1.0 M Al(NO3)3(aq) and a Zn(s) electrode immersed in 1.0 M Zn(NO3)2(aq).

Half-Reaction | E° (V)
Al3+(aq) + 3 e- → Al(s) | -1.66
Zn2+(aq) + 2 e- → Zn(s) | -0.76

(a) Write the balanced net ionic equation for the reaction that occurs as this galvanic cell operates.
(b) Calculate the value of the standard cell potential (E°), in volts, for the chemical reaction that occurs in this galvanic cell.
(c) Calculate the value of the standard free energy change, ΔG°, in units of kJ/molrxn, for the chemical reaction that occurs in this galvanic cell.
(d) In this voltaic cell, Al(s) represents the (anode / cathode). The mass of the Al(s) electrode will (decrease / increase) as the cell operates. Zn(s) represents the (anode / cathode). The mass of the Zn(s) electrode will (decrease / increase) as the cell operates.
(e) Describe the direction of electron flow in the wire as the galvanic cell operates.
(f) A solution of potassium nitrate, KNO3(aq), is used in the salt bridge. Describe the movement of the K+ and NO3- ions in the salt bridge as the cell begins to operate.`,
    answer: `(a) Since Zn2+/Zn has a higher (less negative) E° than Al3+/Al, Zn2+ is reduced (cathode) and Al is oxidized (anode). Balancing electrons (LCM of 3 and 2 is 6): 2 Al(s) → 2 Al3+(aq) + 6 e-, and 3 Zn2+(aq) + 6 e- → 3 Zn(s).

Overall: 2 Al(s) + 3 Zn2+(aq) → 2 Al3+(aq) + 3 Zn(s)

(b) E°cell = E°(cathode) - E°(anode) = E°(Zn2+/Zn) - E°(Al3+/Al) = -0.76 - (-1.66) = +0.90 V.

(c) ΔG° = -nFE° = -(6 mol e-)(96,485 C/mol)(0.90 V) = -521,019 J/molrxn ≈ -521.0 kJ/molrxn.

(d) Al(s) represents the anode. The mass of the Al(s) electrode will decrease (Al atoms are oxidized and dissolve into solution as Al3+). Zn(s) represents the cathode. The mass of the Zn(s) electrode will increase (Zn2+ ions are reduced and deposited as Zn(s)).

(e) Electrons flow through the wire from the anode (Al) to the cathode (Zn).

(f) K+ (cations) move through the salt bridge toward the cathode (the Zn half-cell), since Zn2+ is being consumed there. NO3- (anions) move through the salt bridge toward the anode (the Al half-cell), since Al3+ is being produced there.`,
  },
  {
    title: 'Q7 — Choosing a Thermodynamically Favorable Titrant for H2O2 (Cr2O7^2- vs. Co2+)',
    content: `A student wants to determine the concentration of H2O2 in a solution of H2O2(aq). The student can use one of two titrants, either dichromate ion, Cr2O7^2-(aq), or cobalt(II) ion, Co2+(aq).

Dichromate as titrant: Cr2O7^2-(aq) + 3 H2O2(aq) + 8 H+(aq) → 2 Cr3+(aq) + 3 O2(g) + 7 H2O(l)     (H2O2 is oxidized to O2; n = 6 electrons transferred)
Cobalt(II) as titrant: 2 Co2+(aq) + H2O2(aq) + 2 H+(aq) → 2 Co3+(aq) + 2 H2O(l)     (H2O2 is reduced to H2O; n = 2 electrons transferred)

Half-Reaction | E° (V)
Co3+(aq) + e- → Co2+(aq) | +1.84
H2O2(aq) + 2 H+(aq) + 2 e- → 2 H2O(l) | +1.77
Cr2O7^2-(aq) + 14 H+(aq) + 6 e- → 2 Cr3+(aq) + 7 H2O(l) | +1.33
O2(g) + 2 H+(aq) + 2 e- → H2O2(aq) | +0.70

(a) Use the information in the table to calculate:
(i) E° for the reaction between Cr2O7^2-(aq) and H2O2(aq). (In this reaction, H2O2 is oxidized to O2, so use the O2/H2O2 half-reaction, reversed, as the anode.)
(ii) E° for the reaction between Co2+(aq) and H2O2(aq). (In this reaction, H2O2 is reduced to H2O, so it is the cathode; Co2+ is oxidized to Co3+, so the Co3+/Co2+ half-reaction is the anode.)

(b) Based on the calculated values of E°, the student must choose the titrant for which the titration reaction is thermodynamically favorable at standard conditions.
(i) Which titrant, Cr2O7^2-(aq) or Co2+(aq), should the student choose? Explain your reasoning.
(ii) Calculate the value of the standard free energy change, ΔG°, in units of kJ/molrxn, for the reaction between the chosen titrant and H2O2(aq).`,
    answer: `(a) (i) In the Cr2O7^2- reaction, Cr2O7^2- is reduced (cathode, E° = +1.33 V) and H2O2 is oxidized to O2 (anode, using the O2/H2O2 reduction potential as the reference, E° = +0.70 V).

E°cell = E°cathode - E°anode = 1.33 - 0.70 = +0.63 V.

(ii) In the Co2+ reaction, H2O2 is reduced to H2O (cathode, E° = +1.77 V) and Co2+ is oxidized to Co3+ (anode, using the Co3+/Co2+ reduction potential as the reference, E° = +1.84 V).

E°cell = E°cathode - E°anode = 1.77 - 1.84 = -0.07 V.

(b) (i) The student should choose Cr2O7^2-(aq) as the titrant. The Cr2O7^2-/H2O2 reaction has a POSITIVE E° (+0.63 V), meaning it is thermodynamically favorable at standard conditions. The Co2+/H2O2 reaction has a NEGATIVE E° (-0.07 V), meaning it is NOT thermodynamically favorable and would not proceed to a useful extent for titration purposes.

(ii) ΔG° = -nFE° = -(6 mol e-)(96,485 C/mol)(0.63 V) = -364,713 J/molrxn ≈ -364.7 kJ/molrxn.`,
  },
];

/* ============================= 9.9 — Cell Potential Under Nonstandard Conditions ============================= */
const t99 = [
  {
    title: 'Q8 — Standard Zn/Cu Cell: Q, E, ΔG°, and K as the Cell Approaches Equilibrium',
    content: `A student sets up a standard galvanic cell at 298 K, with a Zn(s) electrode immersed in 1.0 M Zn(NO3)2(aq) and a Cu(s) electrode immersed in 1.0 M Cu(NO3)2(aq).

Half-Reaction | E° (V)
Zn2+(aq) + 2 e- → Zn(s) | -0.76
Cu2+(aq) + 2 e- → Cu(s) | +0.34

(a) Write the balanced net ionic equation for the reaction that occurs when this galvanic cell operates.
(b) The value of the standard cell potential (E°) for this chemical reaction is ___ V.

The reaction quotient is Q = [Zn2+]/[Cu2+].

(c) When this galvanic cell is set up at standard conditions, [Zn2+] = [Cu2+] = 1.0 M, and the initial value of Q is equal to ___. As the cell operates over time, [Cu2+] (decreases / increases), and [Zn2+] (decreases / increases). As the cell runs, the value of Q gradually (decreases / increases), and the value of the cell potential (E) gradually (decreases / increases). If this galvanic cell is run for a very long time, the value of E will eventually reach a value of ___. At this point, the cell has reached equilibrium ("dead"), and the value of ΔG for the cell is equal to ___.
(d) Calculate the value of the standard free energy change, ΔG°, in units of kJ/molrxn, for the overall reaction.
(e) The answer to part (d) makes sense: since the reaction is thermodynamically favored, the sign of ΔG° should be (positive / negative).
(f) Calculate the value of the equilibrium constant, K, for the overall reaction.
(g) The answer to part (f) makes sense: since the reaction is thermodynamically favored, the value of K should be (less than / greater than) 1.`,
    answer: `(a) Zn(s) + Cu2+(aq) → Zn2+(aq) + Cu(s)

(b) E° = E°(cathode) - E°(anode) = E°(Cu2+/Cu) - E°(Zn2+/Zn) = 0.34 - (-0.76) = +1.10 V.

(c) Initial Q = [Zn2+]/[Cu2+] = 1.0/1.0 = 1.0. As the cell operates: [Cu2+] decreases (consumed by reduction); [Zn2+] increases (produced by oxidation). As the cell runs, Q gradually increases (since [Zn2+] rises while [Cu2+] falls); E gradually decreases (as the system moves further from standard conditions, toward equilibrium). If run for a very long time, E eventually reaches a value of zero (equilibrium — the cell is "dead"). At equilibrium, ΔG for the cell is equal to zero (no more driving force for the reaction).

(d) ΔG° = -nFE° = -(2 mol e-)(96,485 C/mol)(1.10 V) = -212,267 J/molrxn ≈ -212 kJ/molrxn.

(e) Negative. Since the reaction is thermodynamically favored, ΔG° should be negative — consistent with the calculated value.

(f) K = e^(-ΔG°/RT) = e^(-(-212,267 J/mol)/[(8.314 J/(mol·K))(298 K)]) = e^(212,267/2477.6) = e^85.7 ≈ 1.5 x 10^37.

(g) Greater than. Since the reaction is thermodynamically favored, K should be greater than 1 — consistent with the calculated (extremely large) value.`,
  },
  {
    title: 'Q9 — Standard and Nonstandard Cu/Sn Cells: Predicting E from Q, and the Effect of Electrode Size',
    content: `A student sets up a standard galvanic cell using copper (Cu) and tin (Sn).

Half-Reaction | E° (V)
Cu2+(aq) + 2 e- → Cu(s) | +0.34
Sn2+(aq) + 2 e- → Sn(s) | -0.14

(a) Write the balanced net ionic equation for the reaction that occurs when this galvanic cell operates.
(b) Calculate the value of the standard cell potential (E°), in volts, for the chemical reaction that occurs in this galvanic cell.

The student also sets up three nonstandard galvanic cells (same volumes in each half-cell). Q = [Sn2+]/[Cu2+].

Cell #1: [Cu2+] = 1.0 M, [Sn2+] = 1.0 M, Q = 1.0, E = equal to 0.48 V (given)
Cell #2: [Cu2+] = 0.50 M, [Sn2+] = 0.50 M
Cell #3: [Cu2+] = 2.0 M, [Sn2+] = 1.0 M
Cell #4: [Cu2+] = 1.0 M, [Sn2+] = 2.0 M

(c) For cells #2, #3, and #4: calculate Q, and predict whether E is less than, equal to, or greater than 0.48 V (use the qualitative form of the Nernst equation).
(d) Galvanic cell #1 and galvanic cell #2 can each be used to power an electronic device. Would galvanic cell #2 power the device for the same time, a longer time, or a shorter time as compared with galvanic cell #1? Justify your answer.
(e) The student observes that increasing the size of the Sn(s) electrode used in cell #1 has no effect on the value of the cell potential (E). Explain this observation.`,
    answer: `(a) Since Cu2+/Cu has a higher E° than Sn2+/Sn, Cu2+ is reduced (cathode) and Sn is oxidized (anode): Sn(s) + Cu2+(aq) → Sn2+(aq) + Cu(s)

(b) E° = E°(Cu2+/Cu) - E°(Sn2+/Sn) = 0.34 - (-0.14) = +0.48 V.

(c) Cell #2: Q = 0.50/0.50 = 1.0 (same ratio as standard conditions) → E is EQUAL TO 0.48 V (the absolute concentrations don't matter, only the ratio, when Q = 1).

Cell #3: Q = 1.0/2.0 = 0.50 (less than 1, farther from equilibrium in the "less product-like" direction) → E is GREATER THAN 0.48 V (a smaller Q than standard increases the magnitude of E above E°).

Cell #4: Q = 2.0/1.0 = 2.0 (greater than 1, closer to equilibrium) → E is LESS THAN 0.48 V (a larger Q than standard decreases E below E°).

(d) Shorter time. Even though cell #2 starts at the same cell potential (0.48 V, since Q = 1 in both), it contains only half as much total Cu2+ and Sn2+ (0.50 M vs. 1.0 M, same volume) — meaning there is only half as much total reactant available to sustain the reaction. The cell will reach equilibrium (run "dead") sooner, powering the device for a shorter time than cell #1.

(e) Sn(s) is a pure solid and does not appear in the expression for Q (solids are not included in equilibrium or reaction-quotient expressions, since their "concentration"/activity is treated as constant regardless of amount). Since the cell potential depends only on the concentrations of the aqueous ions (via Q), and not on the amount of solid electrode present, increasing the size of the Sn(s) electrode has no effect on E.`,
  },
  {
    title: 'Q10 — Effect of a Precipitation Reaction on Cell Potential (Cu(OH)2 Formation)',
    content: `A student sets up a standard galvanic cell using copper (Cu) and tin (Sn), and the cell potential is recorded as 0.48 V. Then a small amount of NaOH(aq) is added to the beaker that contains 1.0 M Cu(NO3)2(aq). A solid precipitate of Cu(OH)2(s) forms in the solution and settles at the bottom of the beaker.

(a) How does the formation of the Cu(OH)2(s) precipitate in this beaker affect the value of [Cu2+] in the solution? Justify your answer.
(b) As a result of the formation of the Cu(OH)2(s) precipitate, the value of Q for this galvanic cell should become (less than / greater than) 1. The value of the cell potential (E) for this galvanic cell should become (less than / greater than) 0.48 V.`,
    answer: `(a) [Cu2+] decreases. The reaction Cu2+(aq) + 2 OH-(aq) → Cu(OH)2(s) removes dissolved Cu2+ ions from solution as they combine with the added OH- to form the insoluble precipitate — this directly lowers the concentration of Cu2+ remaining in the beaker.

(b) Since Q = [Sn2+]/[Cu2+], and [Cu2+] (the denominator) decreases while [Sn2+] is unaffected, Q becomes GREATER than 1 (it was originally 1.0 at standard conditions, and a smaller denominator makes the overall fraction larger). Since Q increases (moving the system closer to equilibrium relative to standard conditions), the cell potential (E) should become LESS THAN 0.48 V.`,
  },
];

/* ============================= 9.10 — Electrolysis and Faraday's Laws ============================= */
const t910 = [
  {
    title: "Q11 — Using Faraday's Law to Calculate Mass Deposited and Time Elapsed (AlCl3 Electrolysis)",
    content: `Electric current is passed through a solution of molten aluminum chloride, AlCl3(l). A steady electric current of 10.0 A passes through the cell. The products of the reaction are Al(l) and Cl2(g) according to the equation below.

2 Al3+(l) + 6 Cl-(l) → 2 Al(l) + 3 Cl2(g)

(a) Calculate the mass, in grams, of Al(l) that is deposited on the electrode in this cell after a period of 585 seconds.
(b) Calculate the time, in seconds, that is required for 0.175 g of Al(l) to be deposited on the electrode in this cell.`,
    answer: `(a) Moles of electrons = It/F = (10.0 A)(585 s) / (96,485 C/mol) = 5850/96,485 = 0.06064 mol e-.

Using the half-reaction Al3+ + 3 e- → Al (3 mol e- per 1 mol Al): moles Al = 0.06064 mol e- / 3 = 0.02021 mol Al.

Mass of Al = (0.02021 mol)(26.98 g/mol) = 0.5455 g ≈ 0.546 g.

(b) Moles Al = 0.175 g / 26.98 g/mol = 0.006486 mol Al.

Moles e- needed = 3 x 0.006486 = 0.019457 mol e-.

Charge q = (moles e-)(F) = (0.019457 mol)(96,485 C/mol) = 1877.6 C.

Time = q/I = 1877.6 C / 10.0 A = 187.8 s.`,
  },
  {
    title: 'Q12 — Electrolysis of Molten MgCl2: Products, Half-Reactions, Minimum Voltage, and Time',
    content: `Molten MgCl2 can be decomposed into its elements if a sufficient voltage is applied using inert electrodes. Mg(l) is formed at one electrode and Cl2(g) is formed at the other electrode.

Half-Reaction | E° (V)
Mg2+ + 2 e- → Mg | -2.37
Cl2 + 2 e- → 2 Cl- | +1.36

(a) Write the products of the reaction that occurs when this electrolytic cell operates: Mg2+(l) + 2 Cl-(l) → ___
(b) Identify which electrode is the anode and which is the cathode.
(c) Write the net ionic equation for the half-reaction that occurs at each electrode.
(d) Describe the direction of electron flow in the wire as the electrolytic cell operates.
(e) Would an applied voltage of 2.0 V be sufficient for the reaction to occur? Support your claim with a calculation.
(f) If the current in the cell is kept at a constant 5.00 amps, calculate the amount of time, in seconds, that is required to produce 2.00 g of Mg(l).`,
    answer: `(a) Mg2+(l) + 2 Cl-(l) → Mg(l) + Cl2(g)

(b) The electrode where Cl2(g) forms is the anode (oxidation of Cl-). The electrode where Mg(l) forms is the cathode (reduction of Mg2+).

(c) Anode: 2 Cl-(l) → Cl2(g) + 2 e-. Cathode: Mg2+(l) + 2 e- → Mg(l).

(d) Electrons flow through the wire from the anode (Cl2-producing electrode) through the power source to the cathode (Mg-producing electrode).

(e) No, 2.0 V would NOT be sufficient. E°cell = E°(cathode) - E°(anode) = E°(Mg2+/Mg) - E°(Cl2/Cl-) = -2.37 - 1.36 = -3.73 V. Since this is an electrolytic cell, the applied voltage must be at least as large in magnitude as |E°cell| = 3.73 V to force the reaction to occur. Since 2.0 V < 3.73 V, the applied voltage would NOT be sufficient.

(f) Moles Mg = 2.00 g / 24.31 g/mol = 0.08227 mol.

Moles e- needed (2 mol e- per mol Mg) = 2 x 0.08227 = 0.16454 mol e-.

Charge q = (0.16454 mol)(96,485 C/mol) = 15,877 C.

Time = q/I = 15,877 C / 5.00 A = 3175 s ≈ 3.18 x 10^3 s.`,
  },
  {
    title: 'Q13 — Analyzing a Hydrogen Fuel Cell: Overall Equation, E°, and Average Current',
    content: `A fuel cell is an electrochemical cell that converts the chemical energy stored in a fuel into electrical energy. A cell that uses H2(g) as the fuel can be constructed based on the half-reactions listed below.

Half-Reaction | E° (V)
2 H2O(l) + O2(g) + 4 e- → 4 OH-(aq) | +0.40
2 H2O(l) + 2 e- → H2(g) + 2 OH-(aq) | -0.83

(a) Write the balanced equation for the overall reaction that occurs when this fuel cell operates.
(b) Calculate the value of the standard cell potential (E°), in volts, for the chemical reaction that occurs in this fuel cell.
(c) As the fuel cell operates for a period of 652 seconds, 1.83 g of H2(g) is consumed. Calculate the average current, in amperes, that passes through the cell during this time period.`,
    answer: `(a) The cathode is O2 reduction (+0.40 V, higher E°); the anode is H2 oxidation, which is the reverse of the given H2/H2O half-reaction: H2(g) + 2 OH-(aq) → 2 H2O(l) + 2 e-. Balancing electrons (multiply the anode by 2 to match the cathode's 4 e-): 2 H2(g) + 4 OH-(aq) → 4 H2O(l) + 4 e-.

Adding to the cathode: 2 H2O(l) + O2(g) + 2 H2(g) + 4 OH-(aq) → 4 OH-(aq) + 4 H2O(l). Canceling the 4 OH- (both sides) and 2 H2O (common to both sides, leaving 2 H2O net on the product side):

Overall: 2 H2(g) + O2(g) → 2 H2O(l)

(b) E°cell = E°(cathode) - E°(anode, reduction reference) = 0.40 - (-0.83) = +1.23 V.

(c) Moles H2 = 1.83 g / 2.02 g/mol = 0.9059 mol.

Moles e- (2 mol e- per mol H2, from the anode half-reaction) = 2 x 0.9059 = 1.8118 mol e-.

Charge q = (1.8118 mol)(96,485 C/mol) = 174,847 C.

Average current = q/t = 174,847 C / 652 s = 268.2 A.`,
  },
  {
    title: 'Q14 — Sterling Silver Tarnish: Oxidation States and Explaining Atomic Radius (Ag vs. Cu)',
    content: `Sterling silver is an alloy that is commonly used to make jewelry and consists of 92.5% silver and 7.5% other metals, such as copper, by mass. Over time, the alloy can form a tarnish of Ag2S(s) when it reacts with hydrogen sulfide, as represented by the following equation.

2 Ag(s) + H2S(g) → Ag2S(s) + H2(g)

(a) What are the oxidation numbers of silver in Ag(s) and in Ag2S(s)?

Element | Atomic radius (pm)
Silver (Ag) | 165
Copper (Cu) | 145

(b) (i) Explain why sterling silver is better classified as a substitutional alloy than as an interstitial alloy.
(ii) Using principles of atomic structure and Coulomb's law, explain why silver has a larger atomic radius than copper does.`,
    answer: `(a) Ag(s): 0 (an element in its elemental/uncombined state always has an oxidation number of 0). Ag2S(s): +1 for each Ag. (Sulfur in a metal sulfide is typically -2; since the compound is neutral, 2(Ag) + (-2) = 0, so 2(Ag) = +2, and each Ag = +1.)

(b) (i) Sterling silver is better classified as a substitutional alloy because silver (165 pm) and copper (145 pm) have comparable atomic radii (similar in size, differing by only about 12%) — this allows copper atoms to directly replace (substitute for) silver atoms at regular lattice positions within the crystal structure. An interstitial alloy, by contrast, requires a much smaller atom (like carbon in steel) that is small enough to fit into the empty interstitial spaces between much larger metal atoms, rather than similarly-sized atoms that substitute for one another — since Cu and Ag are comparably sized (not a large-atom/small-atom pairing), the interstitial description does not apply here.

(ii) Both Ag and Cu are in the same group (Group 11) of the periodic table, but Ag is in Period 5 while Cu is in Period 4 — meaning the valence electrons of Ag occupy a higher (n = 5) principal energy level than those of Cu (n = 4). Although Ag also has more protons (a greater nuclear charge, which by Coulomb's law would tend to pull the valence electrons in more strongly, favoring a SMALLER radius), the effect of having an entire additional occupied electron shell dominates over this increased nuclear charge — the valence electrons in Ag are simply farther from the nucleus on average (in a higher energy level) than those in Cu, regardless of the stronger nuclear pull. This greater average distance between the nucleus and the valence electrons results in a net larger atomic radius for Ag compared to Cu.`,
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
    await insertTopic('9.7', t97);
    await insertTopic('9.8', t98);
    await insertTopic('9.9', t99);
    await insertTopic('9.10', t910);
    console.log("Done — Unit 9 Topics 9.8-9.11 (PDF numbering) seeded into this class's 9.7-9.10.");
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
