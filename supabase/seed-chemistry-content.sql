-- ============================================================
-- Chemistry Bootcamp Content Seed
-- Creates 3 classes with units, topics, and questions
-- Run AFTER the database already has the schema set up
-- ============================================================

DO $$
DECLARE
  -- Class IDs
  cls_ap_basic   uuid := gen_random_uuid();
  cls_ap_adv     uuid := gen_random_uuid();
  cls_honors     uuid := gen_random_uuid();

  -- AP Basic unit IDs
  u1 uuid := gen_random_uuid(); -- Day 1
  u2 uuid := gen_random_uuid(); -- Day 2
  u3 uuid := gen_random_uuid(); -- Day 3

  -- AP Advanced unit IDs
  u4 uuid := gen_random_uuid(); -- Day 1
  u5 uuid := gen_random_uuid(); -- Day 2
  u6 uuid := gen_random_uuid(); -- Day 3

  -- Honors unit IDs
  u7  uuid := gen_random_uuid(); -- Day 1
  u8  uuid := gen_random_uuid(); -- Day 2
  u9  uuid := gen_random_uuid(); -- Day 3

  -- AP Basic topic IDs
  t1a uuid := gen_random_uuid(); -- Calculating Molar Mass
  t1b uuid := gen_random_uuid(); -- Converting Mass and Moles
  t1c uuid := gen_random_uuid(); -- Converting Moles and Particles
  t1d uuid := gen_random_uuid(); -- Three-Step Conversions
  t2a uuid := gen_random_uuid(); -- Balancing Equations
  t2b uuid := gen_random_uuid(); -- Mole Ratios
  t3a uuid := gen_random_uuid(); -- Mole-to-Mole Stoichiometry
  t3b uuid := gen_random_uuid(); -- Mass-to-Mass Stoichiometry

  -- AP Advanced topic IDs
  t4a uuid := gen_random_uuid(); -- Experimental Stoichiometry
  t5a uuid := gen_random_uuid(); -- Molarity and Precipitation
  t6a uuid := gen_random_uuid(); -- Combustion Analysis
  t6b uuid := gen_random_uuid(); -- Hydrate Stoichiometry

  -- Honors topic IDs
  t7a uuid := gen_random_uuid(); -- Reading Instruments
  t7b uuid := gen_random_uuid(); -- Rules of Significant Figures
  t7c uuid := gen_random_uuid(); -- Rounding
  t8a uuid := gen_random_uuid(); -- Addition and Subtraction
  t8b uuid := gen_random_uuid(); -- Multiplication and Division
  t8c uuid := gen_random_uuid(); -- Mixed Practice (Day 2)
  t9a uuid := gen_random_uuid(); -- Scientific Notation
  t9b uuid := gen_random_uuid(); -- Operations with Scientific Notation
  t9c uuid := gen_random_uuid(); -- Mixed Practice (Day 3)

  teacher_id uuid;
BEGIN

  -- Get an existing teacher ID to use as created_by
  SELECT id INTO teacher_id FROM profiles WHERE role = 'teacher' LIMIT 1;

  -- ============================================================
  -- CLASSES
  -- ============================================================
  INSERT INTO classes (id, title, order_index, created_by) VALUES
    (cls_ap_basic, 'AP Chemistry Bootcamp', 0, teacher_id),
    (cls_ap_adv,   'AP Chemistry Bootcamp (Advanced)', 1, teacher_id),
    (cls_honors,   'Honors Chemistry Bootcamp', 2, teacher_id);

  -- ============================================================
  -- UNITS — AP Basic
  -- ============================================================
  INSERT INTO units (id, title, class_id, order_index, created_by) VALUES
    (u1, 'Day 1 — The Mole, Molar Mass & Dimensional Analysis', cls_ap_basic, 0, teacher_id),
    (u2, 'Day 2 — Balancing Chemical Equations & Mole Ratios',  cls_ap_basic, 1, teacher_id),
    (u3, 'Day 3 — Stoichiometry: Mass to Mass Calculations',    cls_ap_basic, 2, teacher_id);

  -- ============================================================
  -- UNITS — AP Advanced
  -- ============================================================
  INSERT INTO units (id, title, class_id, order_index, created_by) VALUES
    (u4, 'Day 1 — Experimental Stoichiometry',               cls_ap_adv, 0, teacher_id),
    (u5, 'Day 2 — Molarity, Precipitation & Net Ionic Equations', cls_ap_adv, 1, teacher_id),
    (u6, 'Day 3 — Combustion Analysis & Hydrate Stoichiometry',   cls_ap_adv, 2, teacher_id);

  -- ============================================================
  -- UNITS — Honors
  -- ============================================================
  INSERT INTO units (id, title, class_id, order_index, created_by) VALUES
    (u7, 'Day 1 — Instrument Precision, Significant Figures & Rounding', cls_honors, 0, teacher_id),
    (u8, 'Day 2 — Significant Figure Calculations & Mixed Practice',     cls_honors, 1, teacher_id),
    (u9, 'Day 3 — Scientific Notation, Operations & Mixed Practice',     cls_honors, 2, teacher_id);

  -- ============================================================
  -- TOPICS — AP Basic Day 1
  -- ============================================================
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t1a, 'Calculating Molar Mass',                   u1, 0),
    (t1b, 'Converting Between Mass and Moles',        u1, 1),
    (t1c, 'Converting Between Moles and Particles',   u1, 2),
    (t1d, 'Three-Step Conversions',                   u1, 3);

  -- TOPICS — AP Basic Day 2
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t2a, 'Balancing Equations',      u2, 0),
    (t2b, 'Mole Ratios from Balanced Equations', u2, 1);

  -- TOPICS — AP Basic Day 3
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t3a, 'Mole-to-Mole Stoichiometry', u3, 0),
    (t3b, 'Mass-to-Mass Stoichiometry', u3, 1);

  -- TOPICS — AP Advanced
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t4a, 'Experimental Stoichiometry & Empirical Formulas', u4, 0);
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t5a, 'Molarity, Precipitation & Net Ionic Equations',  u5, 0);
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t6a, 'Combustion Analysis',    u6, 0),
    (t6b, 'Hydrate Stoichiometry',  u6, 1);

  -- TOPICS — Honors Day 1
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t7a, 'Reading Instruments Correctly',    u7, 0),
    (t7b, 'Rules of Significant Figures',     u7, 1),
    (t7c, 'Rounding',                         u7, 2);

  -- TOPICS — Honors Day 2
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t8a, 'Addition & Subtraction',     u8, 0),
    (t8b, 'Multiplication & Division',  u8, 1),
    (t8c, 'Mixed Practice',             u8, 2);

  -- TOPICS — Honors Day 3
  INSERT INTO topics (id, title, unit_id, order_index) VALUES
    (t9a, 'Scientific Notation',                    u9, 0),
    (t9b, 'Operations with Scientific Notation',    u9, 1),
    (t9c, 'Mixed Practice',                         u9, 2);

  -- ============================================================
  -- QUESTIONS — AP Basic Day 1: Molar Mass
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Molar Mass of NaCl',             'Calculate the molar mass of NaCl (sodium chloride).',                    t1a, 0),
    (gen_random_uuid(), 'Molar Mass of H₂O',              'Calculate the molar mass of H₂O (water).',                               t1a, 1),
    (gen_random_uuid(), 'Molar Mass of CO₂',              'Calculate the molar mass of CO₂ (carbon dioxide).',                      t1a, 2),
    (gen_random_uuid(), 'Molar Mass of CaCO₃',            'Calculate the molar mass of CaCO₃ (calcium carbonate).',                 t1a, 3),
    (gen_random_uuid(), 'Molar Mass of H₂SO₄',            'Calculate the molar mass of H₂SO₄ (sulfuric acid).',                     t1a, 4),
    (gen_random_uuid(), 'Molar Mass of Al₂O₃',            'Calculate the molar mass of Al₂O₃ (aluminium oxide).',                   t1a, 5),
    (gen_random_uuid(), 'Molar Mass of C₆H₁₂O₆',          'Calculate the molar mass of C₆H₁₂O₆ (glucose).',                        t1a, 6),
    (gen_random_uuid(), 'Molar Mass of Fe₂(SO₄)₃',        'Calculate the molar mass of Fe₂(SO₄)₃ (iron(III) sulfate).',             t1a, 7);

  -- QUESTIONS — AP Basic Day 1: Mass to Moles
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Convert 36.04 g H₂O to moles',   'Convert 36.04 g of H₂O to moles.',           t1b, 0),
    (gen_random_uuid(), 'Convert 117.0 g NaCl to moles',  'Convert 117.0 g of NaCl to moles.',           t1b, 1),
    (gen_random_uuid(), 'Convert 88.0 g CO₂ to moles',    'Convert 88.0 g of CO₂ to moles.',             t1b, 2),
    (gen_random_uuid(), 'Convert 200.0 g CaCO₃ to moles', 'Convert 200.0 g of CaCO₃ to moles.',          t1b, 3),
    (gen_random_uuid(), 'Convert 4.90 g H₂SO₄ to moles',  'Convert 4.90 g of H₂SO₄ to moles.',           t1b, 4),
    (gen_random_uuid(), 'Convert 51.0 g Al₂O₃ to moles',  'Convert 51.0 g of Al₂O₃ to moles.',           t1b, 5),
    (gen_random_uuid(), 'Convert 2.50 mol H₂O to grams',  'Convert 2.50 mol of H₂O to grams.',           t1b, 6),
    (gen_random_uuid(), 'Convert 0.750 mol NaCl to grams','Convert 0.750 mol of NaCl to grams.',          t1b, 7),
    (gen_random_uuid(), 'Convert 3.00 mol CO₂ to grams',  'Convert 3.00 mol of CO₂ to grams.',            t1b, 8),
    (gen_random_uuid(), 'Convert 0.200 mol CaCO₃ to grams','Convert 0.200 mol of CaCO₃ to grams.',        t1b, 9),
    (gen_random_uuid(), 'Convert 1.50 mol H₂SO₄ to grams','Convert 1.50 mol of H₂SO₄ to grams.',          t1b, 10),
    (gen_random_uuid(), 'Convert 0.500 mol Fe₂(SO₄)₃ to grams','Convert 0.500 mol of Fe₂(SO₄)₃ to grams.', t1b, 11);

  -- QUESTIONS — AP Basic Day 1: Moles to Particles
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), '2.00 mol H₂O → molecules',         'Convert 2.00 mol of H₂O to molecules.',                               t1c, 0),
    (gen_random_uuid(), '0.500 mol NaCl → formula units',   'Convert 0.500 mol of NaCl to formula units.',                          t1c, 1),
    (gen_random_uuid(), '3.50 mol CO₂ → molecules',         'Convert 3.50 mol of CO₂ to molecules.',                               t1c, 2),
    (gen_random_uuid(), '1.204×10²⁴ molecules H₂O → moles', 'Convert 1.204 × 10²⁴ molecules of H₂O to moles.',                     t1c, 3),
    (gen_random_uuid(), '3.011×10²³ formula units NaCl → moles','Convert 3.011 × 10²³ formula units of NaCl to moles.',             t1c, 4),
    (gen_random_uuid(), '9.033×10²³ molecules CO₂ → moles', 'Convert 9.033 × 10²³ molecules of CO₂ to moles.',                     t1c, 5);

  -- QUESTIONS — AP Basic Day 1: Three-Step Conversions
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Molecules in 44.0 g CO₂',           'How many molecules are in 44.0 g of CO₂? Show your full dimensional analysis setup.',                                                           t1d, 0),
    (gen_random_uuid(), 'Formula units in 58.44 g NaCl',     'How many formula units are in 58.44 g of NaCl? Show your full dimensional analysis setup.',                                                      t1d, 1),
    (gen_random_uuid(), 'Mass of 3.011×10²⁴ molecules H₂O',  'What is the mass in grams of 3.011 × 10²⁴ molecules of H₂O? Show your full dimensional analysis setup.',                                       t1d, 2),
    (gen_random_uuid(), 'Oxygen atoms in 0.500 mol CO₂',     'How many atoms of oxygen are in 0.500 mol of CO₂? (Hint: each CO₂ molecule contains 2 oxygen atoms.) Show your full dimensional analysis setup.', t1d, 3);

  -- ============================================================
  -- QUESTIONS — AP Basic Day 2: Balancing Equations
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Balance: H₂ + O₂ → H₂O',                  'Balance the equation: ___ H₂ + ___ O₂ → ___ H₂O',                                                t2a, 0),
    (gen_random_uuid(), 'Balance: N₂ + H₂ → NH₃',                  'Balance the equation: ___ N₂ + ___ H₂ → ___ NH₃',                                                t2a, 1),
    (gen_random_uuid(), 'Balance: CH₄ + O₂ → CO₂ + H₂O',           'Balance the equation: ___ CH₄ + ___ O₂ → ___ CO₂ + ___ H₂O',                                    t2a, 2),
    (gen_random_uuid(), 'Balance: Fe + O₂ → Fe₂O₃',                'Balance the equation: ___ Fe + ___ O₂ → ___ Fe₂O₃',                                              t2a, 3),
    (gen_random_uuid(), 'Balance: Al + Cl₂ → AlCl₃',               'Balance the equation: ___ Al + ___ Cl₂ → ___ AlCl₃',                                             t2a, 4),
    (gen_random_uuid(), 'Balance: P₄ + O₂ → P₂O₅',                 'Balance the equation: ___ P₄ + ___ O₂ → ___ P₂O₅',                                              t2a, 5),
    (gen_random_uuid(), 'Balance: C₃H₈ + O₂ → CO₂ + H₂O',          'Balance the equation: ___ C₃H₈ + ___ O₂ → ___ CO₂ + ___ H₂O',                                  t2a, 6),
    (gen_random_uuid(), 'Balance: KClO₃ → KCl + O₂',               'Balance the equation: ___ KClO₃ → ___ KCl + ___ O₂',                                            t2a, 7),
    (gen_random_uuid(), 'Balance: Ca + H₂O → Ca(OH)₂ + H₂',        'Balance the equation: ___ Ca + ___ H₂O → ___ Ca(OH)₂ + ___ H₂',                                 t2a, 8),
    (gen_random_uuid(), 'Balance: C₆H₁₂O₆ + O₂ → CO₂ + H₂O',       'Balance the equation: ___ C₆H₁₂O₆ + ___ O₂ → ___ CO₂ + ___ H₂O',                              t2a, 9);

  -- QUESTIONS — AP Basic Day 2: Mole Ratios
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Mole ratio N₂ to H₂',         'Using N₂ + 3 H₂ → 2 NH₃, state the mole ratio of N₂ to H₂.',                              t2b, 0),
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Mole ratio H₂ to NH₃',        'Using N₂ + 3 H₂ → 2 NH₃, state the mole ratio of H₂ to NH₃.',                             t2b, 1),
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Mole ratio N₂ to NH₃',        'Using N₂ + 3 H₂ → 2 NH₃, state the mole ratio of N₂ to NH₃.',                             t2b, 2),
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Moles NH₃ from 3.0 mol N₂',   'Using N₂ + 3 H₂ → 2 NH₃, how many moles of NH₃ are produced from 3.0 mol N₂?',            t2b, 3),
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Moles H₂ for 6.0 mol NH₃',    'Using N₂ + 3 H₂ → 2 NH₃, how many moles of H₂ are needed to produce 6.0 mol NH₃?',        t2b, 4),
    (gen_random_uuid(), 'N₂ + 3H₂ → 2NH₃: Moles N₂ for 9.0 mol H₂',     'Using N₂ + 3 H₂ → 2 NH₃, how many moles of N₂ are needed to react with 9.0 mol H₂?',     t2b, 5),
    (gen_random_uuid(), 'C₃H₈ combustion: Moles O₂ for 2.0 mol C₃H₈',   'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, how many moles of O₂ are needed for 2.0 mol C₃H₈?',  t2b, 6),
    (gen_random_uuid(), 'C₃H₈ combustion: Moles CO₂ from 4.0 mol C₃H₈', 'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, how many moles of CO₂ are produced from 4.0 mol C₃H₈?', t2b, 7),
    (gen_random_uuid(), 'C₃H₈ combustion: Moles H₂O from 3.0 mol C₃H₈', 'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, how many moles of H₂O are produced from 3.0 mol C₃H₈?', t2b, 8),
    (gen_random_uuid(), 'C₃H₈ combustion: Moles C₃H₈ for 15 mol CO₂',   'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, how many moles of C₃H₈ are needed to produce 15 mol CO₂?', t2b, 9);

  -- ============================================================
  -- QUESTIONS — AP Basic Day 3: Mole-to-Mole Stoichiometry
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Moles NH₃ from 5.00 mol N₂',   'Using N₂ + 3 H₂ → 2 NH₃, how many moles of NH₃ are produced from 5.00 mol of N₂?',        t3a, 0),
    (gen_random_uuid(), 'Moles H₂ for 8.00 mol NH₃',    'Using N₂ + 3 H₂ → 2 NH₃, how many moles of H₂ are needed to produce 8.00 mol of NH₃?',     t3a, 1),
    (gen_random_uuid(), 'Moles N₂ for 12.0 mol H₂',     'Using N₂ + 3 H₂ → 2 NH₃, how many moles of N₂ are needed to react with 12.0 mol of H₂?',  t3a, 2);

  -- QUESTIONS — AP Basic Day 3: Mass-to-Mass Stoichiometry
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Mass of CO₂ from 22.0 g C₃H₈',  'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, calculate the mass of CO₂ produced when 22.0 g of C₃H₈ reacts completely. (Molar masses: C₃H₈ = 44.10, CO₂ = 44.01 g/mol)', t3b, 0),
    (gen_random_uuid(), 'Mass of O₂ for 44.1 g C₃H₈',    'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, calculate the mass of O₂ required to burn 44.1 g of C₃H₈. (Molar mass O₂ = 32.00 g/mol)',                               t3b, 1),
    (gen_random_uuid(), 'Mass of H₂O from 88.2 g C₃H₈',  'Using C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, calculate the mass of H₂O produced when 88.2 g of C₃H₈ is burned. (Molar mass H₂O = 18.02 g/mol)',                      t3b, 2),
    (gen_random_uuid(), 'Mass of Fe₂O₃ from 55.85 g Fe',  'Using 4 Fe + 3 O₂ → 2 Fe₂O₃, how many grams of Fe₂O₃ are produced from 55.85 g of Fe? (Molar masses: Fe = 55.85, Fe₂O₃ = 159.7 g/mol)',                     t3b, 3),
    (gen_random_uuid(), 'Mass of O₂ for 111.7 g Fe',      'Using 4 Fe + 3 O₂ → 2 Fe₂O₃, how many grams of O₂ are needed to react completely with 111.7 g of Fe? (Molar mass O₂ = 32.00 g/mol)',                         t3b, 4),
    (gen_random_uuid(), 'Mass of Fe for 79.85 g Fe₂O₃',   'Using 4 Fe + 3 O₂ → 2 Fe₂O₃, how many grams of Fe are needed to produce 79.85 g of Fe₂O₃?',                                                                   t3b, 5);

  -- ============================================================
  -- QUESTIONS — AP Advanced Day 1: Experimental Stoichiometry
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Metal Oxide Decomposition — Mass of O₂ Released',
      'A crucible (18.432 g) + metal oxide (20.107 g) is heated until constant mass (19.786 g). Calculate the mass of oxygen gas released.',
      t4a, 0),
    (gen_random_uuid(), 'Metal Oxide Decomposition — Moles of O₂ Released',
      'Using the data from the crucible experiment (mass of O₂ already calculated), find the moles of O₂ released. (Molar mass O₂ = 32.00 g/mol)',
      t4a, 1),
    (gen_random_uuid(), 'Metal Oxide Decomposition — Identify the Metal',
      '0.0201 mol of metal remains in the crucible. Calculate the molar mass and identify the metal by its elemental symbol.',
      t4a, 2),
    (gen_random_uuid(), 'Metal Oxide Decomposition — Empirical Formula',
      'Using the mole amounts of metal and O₂ from the experiment, determine the empirical formula of the metal oxide. Show mole ratio calculation.',
      t4a, 3),
    (gen_random_uuid(), 'Metal Oxide Decomposition — Balanced Decomposition Equation',
      'Write a balanced chemical equation for the decomposition of the metal oxide you identified. Include state symbols.',
      t4a, 4),
    (gen_random_uuid(), 'Copper Oxide Reduction — Mass of Oxygen',
      '3.612 g of a copper–oxygen compound is reduced by H₂; 2.889 g of Cu remains. Calculate the mass of oxygen in the original compound.',
      t4a, 5),
    (gen_random_uuid(), 'Copper Oxide Reduction — Moles of Cu and O',
      'From the copper–oxygen experiment, calculate the moles of Cu and moles of O in the original sample. (Molar masses: Cu = 63.55, O = 16.00 g/mol)',
      t4a, 6),
    (gen_random_uuid(), 'Copper Oxide Reduction — Empirical Formula',
      'Using the mole amounts of Cu and O, determine the empirical formula of the copper oxide.',
      t4a, 7),
    (gen_random_uuid(), 'Copper Oxide Reduction — Balanced Equation with State Symbols',
      'Write and balance the complete chemical equation for the reduction of your copper oxide by hydrogen gas. Include state symbols.',
      t4a, 8),
    (gen_random_uuid(), 'Copper Oxide Reduction — Percent Yield',
      'A student uses a 5.000 g sample of the same copper oxide but only collects 3.950 g of copper. Calculate the percent yield.',
      t4a, 9);

  -- ============================================================
  -- QUESTIONS — AP Advanced Day 2: Molarity and Precipitation
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'BeCl₂ Dissolution — Particulate Diagram',
      '2.54 g of BeCl₂ (M = 79.92 g/mol) is dissolved in 50.00 mL of water. Draw a particulate diagram showing at least one Be²⁺ ion, two Cl⁻ ions, and four water molecules with correct relative sizes and charges.',
      t5a, 0),
    (gen_random_uuid(), 'BeCl₂ Dissolution — Concentration of Ions',
      '2.54 g of BeCl₂ (M = 79.92 g/mol) is dissolved in 50.00 mL of water. Calculate the concentration (mol/L) of Be²⁺ ions and Cl⁻ ions.',
      t5a, 1),
    (gen_random_uuid(), 'BeCl₂ + Pb(NO₃)₂ — Net Ionic Equation',
      'When 0.850 M Pb(NO₃)₂ is added to the BeCl₂ solution, PbCl₂ precipitates. Write the molecular equation, complete ionic equation, and net ionic equation.',
      t5a, 2),
    (gen_random_uuid(), 'BeCl₂ + Pb(NO₃)₂ — Volume of Pb(NO₃)₂ Required',
      'Calculate the volume of 0.850 M Pb(NO₃)₂ that must be added to completely consume all Cl⁻ ions from the BeCl₂ solution.',
      t5a, 3),
    (gen_random_uuid(), 'BeCl₂ + Pb(NO₃)₂ — Theoretical Mass of PbCl₂',
      'Calculate the theoretical mass of PbCl₂ precipitate that forms. (Molar mass of PbCl₂ = 278.1 g/mol)',
      t5a, 4),
    (gen_random_uuid(), 'BeCl₂ + Pb(NO₃)₂ — Percent Yield',
      'A student collects 0.587 g of PbCl₂ precipitate. Calculate the percent yield.',
      t5a, 5),
    (gen_random_uuid(), 'NaCl + AgNO₃ — Molarity of NaCl Solution',
      '8.775 g of NaCl (M = 58.44 g/mol) is dissolved to prepare 500.0 mL of solution. Calculate the molarity of the NaCl solution.',
      t5a, 6),
    (gen_random_uuid(), 'NaCl + AgNO₃ — Net Ionic Equation',
      'Write the net ionic equation for the reaction between NaCl and AgNO₃ that produces AgCl precipitate.',
      t5a, 7),
    (gen_random_uuid(), 'NaCl + AgNO₃ — Theoretical Mass of AgCl',
      'From the NaCl solution (0.300 M, 500.0 mL), calculate the theoretical mass of AgCl precipitate. (Molar mass AgCl = 143.32 g/mol)',
      t5a, 8),
    (gen_random_uuid(), 'NaCl + AgNO₃ — Percent Yield and Source of Error',
      'The student collects only 20.15 g of AgCl. Calculate the percent yield and suggest one reason the yield may be less than 100%.',
      t5a, 9);

  -- ============================================================
  -- QUESTIONS — AP Advanced Day 3: Combustion Analysis
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Combustion Analysis — Mass of Carbon',
      '1.2359 g of a C/H/N/O compound is burned: 2.241 g CO₂ and 0.916 g H₂O are collected. Determine the mass of carbon in the sample. (Molar masses: C = 12.011, CO₂ = 44.01 g/mol)',
      t6a, 0),
    (gen_random_uuid(), 'Combustion Analysis — Mass of Hydrogen',
      'From the combustion of 1.2359 g of the compound (0.916 g H₂O collected), determine the mass of hydrogen in the sample.',
      t6a, 1),
    (gen_random_uuid(), 'Combustion Analysis — Mass of Nitrogen',
      'Nitrogen accounts for 28.84% of the 1.2359 g compound by mass. Determine the mass of nitrogen in the sample.',
      t6a, 2),
    (gen_random_uuid(), 'Combustion Analysis — Mass of Oxygen',
      'Using the masses of C, H, and N already found, determine the mass of oxygen in the 1.2359 g sample by difference.',
      t6a, 3),
    (gen_random_uuid(), 'Combustion Analysis — Empirical Formula',
      'Using the masses of C, H, N, and O in the compound, determine the empirical formula. Show all mole calculations and the mole ratio clearly.',
      t6a, 4);

  -- QUESTIONS — AP Advanced Day 3: Hydrate Stoichiometry
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Hydrate Dehydration — Mass of Solid Remaining',
      'A 2.49 g sample of CaSO₄·2H₂O is heated until constant mass. Using CaSO₄·2H₂O → CaSO₄ + 2H₂O, calculate the mass of solid that remains. (Molar masses: CaSO₄·2H₂O = 172.17, CaSO₄ = 136.14, H₂O = 18.015 g/mol)',
      t6b, 0),
    (gen_random_uuid(), 'Hydrate Dehydration — Percent Dehydrated',
      'A 3.60 g sample of CaSO₄·2H₂O is partially heated; mass after = 3.18 g. Calculate the percentage of the original sample that was successfully dehydrated.',
      t6b, 1),
    (gen_random_uuid(), 'Unknown Hydrate — Find x in MgSO₄·xH₂O',
      'A 3.872 g sample of MgSO₄·xH₂O is heated completely; 1.891 g of anhydrous MgSO₄ (M = 120.37 g/mol) remains. Determine the value of x. (Molar mass H₂O = 18.015 g/mol)',
      t6b, 2);

  -- ============================================================
  -- QUESTIONS — Honors Day 1: Reading Instruments
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Graduated Cylinder Reading (10 mL increments)',
      'A graduated cylinder is marked every 10 mL. Record the correct reading and state the number of significant figures.',
      t7a, 0),
    (gen_random_uuid(), 'Graduated Cylinder Reading (1 mL increments)',
      'A graduated cylinder is marked every 1 mL. Record the correct reading and state the number of significant figures.',
      t7a, 1),
    (gen_random_uuid(), 'Thermometer Reading (2°C increments)',
      'A thermometer is marked every 2°C. Record the correct reading and state the number of significant figures.',
      t7a, 2),
    (gen_random_uuid(), 'Pipette Reading (1 mL increments)',
      'A pipette is marked every 1 mL. Record the correct reading and state the number of significant figures.',
      t7a, 3),
    (gen_random_uuid(), 'Ruler — Length of Object',
      'Record the length of the object shown on the ruler to the correct number of significant figures.',
      t7a, 4);

  -- QUESTIONS — Honors Day 1: Rules of Significant Figures
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Sig Figs in 200,073',    'How many significant figures are in 200,073?',    t7b, 0),
    (gen_random_uuid(), 'Sig Figs in 0.00084',    'How many significant figures are in 0.00084?',    t7b, 1),
    (gen_random_uuid(), 'Sig Figs in 5.001',      'How many significant figures are in 5.001?',      t7b, 2),
    (gen_random_uuid(), 'Sig Figs in 0.0620',     'How many significant figures are in 0.0620?',     t7b, 3),
    (gen_random_uuid(), 'Sig Figs in 107.010',    'How many significant figures are in 107.010?',    t7b, 4),
    (gen_random_uuid(), 'Sig Figs in 3400',       'How many significant figures are in 3400?',       t7b, 5),
    (gen_random_uuid(), 'Sig Figs in 0.00300',    'How many significant figures are in 0.00300?',    t7b, 6),
    (gen_random_uuid(), 'Sig Figs in 7,000,000',  'How many significant figures are in 7,000,000?',  t7b, 7),
    (gen_random_uuid(), 'Sig Figs in 2.0050',     'How many significant figures are in 2.0050?',     t7b, 8),
    (gen_random_uuid(), 'Sig Figs in 150.0',      'How many significant figures are in 150.0?',      t7b, 9),
    (gen_random_uuid(), 'Sig Figs in 0.1010',     'How many significant figures are in 0.1010?',     t7b, 10),
    (gen_random_uuid(), 'Sig Figs in 10,300',     'How many significant figures are in 10,300?',     t7b, 11),
    (gen_random_uuid(), 'Sig Figs in 1.00',       'How many significant figures are in 1.00?',       t7b, 12),
    (gen_random_uuid(), 'Sig Figs in 0.010400',   'How many significant figures are in 0.010400?',   t7b, 13);

  -- QUESTIONS — Honors Day 1: Rounding
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Round 673.1482',   'Round 673.1482 to: 5 sig figs, 3 sig figs, 2 sig figs, and 1 sig fig.',      t7c, 0),
    (gen_random_uuid(), 'Round 50.0696',    'Round 50.0696 to: 4 sig figs, 3 sig figs, 2 sig figs, and 1 sig fig.',        t7c, 1),
    (gen_random_uuid(), 'Round 273.84',     'Round 273.84 to: 4 sig figs, 3 sig figs, 2 sig figs, and 1 sig fig.',         t7c, 2),
    (gen_random_uuid(), 'Round 48,372,000', 'Round 48,372,000 to: 4 sig figs, 3 sig figs, 2 sig figs, and 1 sig fig.',     t7c, 3),
    (gen_random_uuid(), 'Round 0.0049182',  'Round 0.0049182 to: 4 sig figs, 3 sig figs, 2 sig figs, and 1 sig fig.',      t7c, 4),
    (gen_random_uuid(), 'Round 1,005,430',  'Round 1,005,430 to: 5 sig figs, 4 sig figs, 3 sig figs, and 2 sig figs.',     t7c, 5);

  -- ============================================================
  -- QUESTIONS — Honors Day 2: Addition & Subtraction
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Add: 28 + 16 + 227',              'Calculate 28 + 16 + 227. Report to the correct number of significant figures.',                    t8a, 0),
    (gen_random_uuid(), 'Add: 2.222 + 2.22 + 2.2',         'Calculate 2.222 + 2.22 + 2.2. Report to the correct number of significant figures.',              t8a, 1),
    (gen_random_uuid(), 'Subtract: 81.42 − 18.4',          'Calculate 81.42 − 18.4. Report to the correct number of significant figures.',                    t8a, 2),
    (gen_random_uuid(), 'Add: 4732.3 + 55 + 0.54',         'Calculate 4732.3 + 55 + 0.54. Report to the correct number of significant figures.',              t8a, 3),
    (gen_random_uuid(), 'Mixed: 999.0 + 1.7 − 43.7',       'Calculate 999.0 + 1.7 − 43.7. Report to the correct number of significant figures.',              t8a, 4),
    (gen_random_uuid(), 'Subtract: 564,321 − 264,321',     'Calculate 564,321 − 264,321. Report to the correct number of significant figures.',               t8a, 5),
    (gen_random_uuid(), 'Subtract: 0.04216 − 0.0004134',   'Calculate 0.04216 − 0.0004134. Report to the correct number of significant figures.',             t8a, 6),
    (gen_random_uuid(), 'Add: 12.50 + 0.125 + 1.2',        'Calculate 12.50 + 0.125 + 1.2. Report to the correct number of significant figures.',             t8a, 7);

  -- QUESTIONS — Honors Day 2: Multiplication & Division
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Multiply: 27.88 × 0.00695',       'Calculate 27.88 × 0.00695. Report to the correct significant figures.',       t8b, 0),
    (gen_random_uuid(), 'Multiply: 3.10 × 5428',           'Calculate 3.10 × 5428. Report to the correct significant figures.',           t8b, 1),
    (gen_random_uuid(), 'Multiply: 3.00 × 0.4000',         'Calculate 3.00 × 0.4000. Report to the correct significant figures.',         t8b, 2),
    (gen_random_uuid(), 'Divide: 4317 ÷ 0.88',             'Calculate 4317 ÷ 0.88. Report to the correct significant figures.',           t8b, 3),
    (gen_random_uuid(), 'Divide: 0.1500 ÷ 0.00300',        'Calculate 0.1500 ÷ 0.00300. Report to the correct significant figures.',      t8b, 4),
    (gen_random_uuid(), 'Multiply: 8.4 × 0.03 × 2.00',     'Calculate 8.4 × 0.03 × 2.00. Report to the correct significant figures.',    t8b, 5),
    (gen_random_uuid(), 'Mixed: (24.5 × 0.0400) ÷ 1.2',    'Calculate (24.5 × 0.0400) ÷ 1.2. Show intermediate steps with sig figs.',    t8b, 6),
    (gen_random_uuid(), 'Mixed: (0.365 × 4.8) ÷ 0.70',     'Calculate (0.365 × 4.8) ÷ 0.70. Show intermediate steps with sig figs.',     t8b, 7);

  -- QUESTIONS — Honors Day 2: Mixed Practice
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), '(183 × 0.017) + 850.',             'Evaluate (183 × 0.017) + 850. Show the correct sig figs on ALL intermediate steps.',             t8c, 0),
    (gen_random_uuid(), '(12.7 − 8.3) ÷ (18.5 − 2.2)',    'Evaluate (12.7 − 8.3) ÷ (18.5 − 2.2). Show sig figs on all steps.',                             t8c, 1),
    (gen_random_uuid(), '(3.0 × 2.2) + (4 × 85)',          'Evaluate (3.0 × 2.2) + (4 × 85). Show sig figs on all steps.',                                  t8c, 2),
    (gen_random_uuid(), '(0.127 − 0.038) ÷ 0.0445',        'Evaluate (0.127 − 0.038) ÷ 0.0445. Show sig figs on all steps.',                                t8c, 3),
    (gen_random_uuid(), '(83.4 − 27.4) ÷ 0.0432',          'Evaluate (83.4 − 27.4) ÷ 0.0432. Show sig figs on all steps.',                                  t8c, 4),
    (gen_random_uuid(), '(4317 ÷ 0.88) + 26.4',            'Evaluate (4317 ÷ 0.88) + 26.4. Show sig figs on all steps.',                                    t8c, 5),
    (gen_random_uuid(), '(3.6 × 0.050) + (12.4 − 0.53)',   'Evaluate (3.6 × 0.050) + (12.4 − 0.53). Show sig figs on all steps.',                           t8c, 6),
    (gen_random_uuid(), '[(14.8 − 12.5) ÷ 12.5] × 100',   'Evaluate [(14.8 − 12.5) ÷ 12.5] × 100. Show sig figs on all steps.',                            t8c, 7),
    (gen_random_uuid(), '(0.01020 × 4.30) ÷ (16 − 12)',    'Evaluate (0.01020 × 4.30) ÷ (16 − 12). Show sig figs on all steps.',                            t8c, 8),
    (gen_random_uuid(), '(2.505 + 1.25) ÷ 0.500',          'Evaluate (2.505 + 1.25) ÷ 0.500. Show sig figs on all steps.',                                  t8c, 9);

  -- ============================================================
  -- QUESTIONS — Honors Day 3: Scientific Notation (Convert to sci notation)
  -- ============================================================
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), 'Convert 0.000006072 to sci notation',       'Convert 0.000006072 to scientific notation and state the number of significant figures.',          t9a, 0),
    (gen_random_uuid(), 'Convert 83,400,000 to sci notation',        'Convert 83,400,000 to scientific notation and state the number of significant figures.',           t9a, 1),
    (gen_random_uuid(), 'Convert 0.001050 to sci notation',          'Convert 0.001050 to scientific notation and state the number of significant figures.',             t9a, 2),
    (gen_random_uuid(), 'Convert 602,000,000,000,000 to sci notation','Convert 602,000,000,000,000 to scientific notation and state the number of significant figures.', t9a, 3),
    (gen_random_uuid(), 'Convert 0.00000300 to sci notation',        'Convert 0.00000300 to scientific notation and state the number of significant figures.',           t9a, 4),
    (gen_random_uuid(), 'Convert 9,870,000 to sci notation',         'Convert 9,870,000 to scientific notation and state the number of significant figures.',            t9a, 5),
    (gen_random_uuid(), 'Convert 0.0204 to sci notation',            'Convert 0.0204 to scientific notation and state the number of significant figures.',               t9a, 6),
    (gen_random_uuid(), 'Convert 11,000,000,000 to sci notation',    'Convert 11,000,000,000 to scientific notation and state the number of significant figures.',       t9a, 7),
    (gen_random_uuid(), 'Convert 3.40 × 10⁻⁵ to standard form',     'Convert 3.40 × 10⁻⁵ to standard (decimal) form.',                                                 t9a, 8),
    (gen_random_uuid(), 'Convert 6.022 × 10²³ to standard form',     'Convert 6.022 × 10²³ to standard form.',                                                          t9a, 9),
    (gen_random_uuid(), 'Convert 1.50 × 10⁻³ to standard form',      'Convert 1.50 × 10⁻³ to standard form.',                                                           t9a, 10),
    (gen_random_uuid(), 'Convert 9.10 × 10⁸ to standard form',       'Convert 9.10 × 10⁸ to standard form.',                                                            t9a, 11),
    (gen_random_uuid(), 'Convert 4.500 × 10⁶ to standard form',      'Convert 4.500 × 10⁶ to standard form.',                                                           t9a, 12),
    (gen_random_uuid(), 'Convert 2.0 × 10⁻¹ to standard form',       'Convert 2.0 × 10⁻¹ to standard form.',                                                            t9a, 13),
    (gen_random_uuid(), 'Sig figs in 4.030 × 10²',                   'How many significant figures are in 4.030 × 10²?',                                                t9a, 14),
    (gen_random_uuid(), 'Sig figs in 1.0 × 10⁻⁴',                   'How many significant figures are in 1.0 × 10⁻⁴?',                                                 t9a, 15),
    (gen_random_uuid(), 'Sig figs in 7.200 × 10⁵',                   'How many significant figures are in 7.200 × 10⁵?',                                                t9a, 16),
    (gen_random_uuid(), 'Sig figs in 3.0 × 10⁻²',                    'How many significant figures are in 3.0 × 10⁻²?',                                                 t9a, 17),
    (gen_random_uuid(), 'Sig figs in 5.06 × 10¹¹',                   'How many significant figures are in 5.06 × 10¹¹?',                                                t9a, 18),
    (gen_random_uuid(), 'Sig figs in 8.900 × 10³',                   'How many significant figures are in 8.900 × 10³?',                                                 t9a, 19);

  -- QUESTIONS — Honors Day 3: Operations with Scientific Notation
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), '(3.2×10⁴) × (2.0×10³)',           'Calculate (3.2 × 10⁴) × (2.0 × 10³). Give your answer in scientific notation to the correct sig figs.',    t9b, 0),
    (gen_random_uuid(), '(8.40×10⁻³) × (4.0×10⁵)',         'Calculate (8.40 × 10⁻³) × (4.0 × 10⁵). Give your answer in scientific notation.',                         t9b, 1),
    (gen_random_uuid(), '(6.022×10²³) × (2.00×10⁻³)',      'Calculate (6.022 × 10²³) × (2.00 × 10⁻³). Give your answer in scientific notation.',                      t9b, 2),
    (gen_random_uuid(), '(9.0×10⁸) ÷ (3.0×10³)',           'Calculate (9.0 × 10⁸) ÷ (3.0 × 10³). Give your answer in scientific notation.',                           t9b, 3),
    (gen_random_uuid(), '(4.50×10⁻²) ÷ (1.5×10³)',         'Calculate (4.50 × 10⁻²) ÷ (1.5 × 10³). Give your answer in scientific notation.',                         t9b, 4),
    (gen_random_uuid(), '(1.008×10⁰) × (6.022×10²³)',      'Calculate (1.008 × 10⁰) × (6.022 × 10²³). Give your answer in scientific notation.',                      t9b, 5),
    (gen_random_uuid(), '(3.40×10³) + (2.1×10²)',          'Calculate (3.40 × 10³) + (2.1 × 10²). Give your answer in scientific notation.',                           t9b, 6),
    (gen_random_uuid(), '(6.50×10⁻⁴) − (3.2×10⁻⁵)',       'Calculate (6.50 × 10⁻⁴) − (3.2 × 10⁻⁵). Give your answer in scientific notation.',                       t9b, 7),
    (gen_random_uuid(), '(1.200×10⁵) + (4.5×10³)',         'Calculate (1.200 × 10⁵) + (4.5 × 10³). Give your answer in scientific notation.',                         t9b, 8),
    (gen_random_uuid(), '(8.00×10²) − (5.0×10¹)',          'Calculate (8.00 × 10²) − (5.0 × 10¹). Give your answer in scientific notation.',                          t9b, 9);

  -- QUESTIONS — Honors Day 3: Mixed Practice
  INSERT INTO questions (id, title, content, topic_id, order_index) VALUES
    (gen_random_uuid(), '(3.24×10⁻⁵) ÷ (187 + 27)',                   'Evaluate (3.24 × 10⁻⁵) ÷ (187 + 27). Show sig figs on all intermediate steps.',                                       t9c, 0),
    (gen_random_uuid(), '(438 + 825) ÷ (1.234×10⁻⁶)',                  'Evaluate (438 + 825) ÷ (1.234 × 10⁻⁶). Show sig figs on all intermediate steps.',                                     t9c, 1),
    (gen_random_uuid(), '(4.02×10⁸) ÷ (1.4×10⁵) + 385',              'Evaluate (4.02 × 10⁸) ÷ (1.4 × 10⁵) + 385. Show sig figs on all intermediate steps.',                                t9c, 2),
    (gen_random_uuid(), '(4.02×10⁸) ÷ (1.4×10⁻³) + 385',             'Evaluate (4.02 × 10⁸) ÷ (1.4 × 10⁻³) + 385. Show sig figs on all intermediate steps.',                               t9c, 3),
    (gen_random_uuid(), '(3.50×10⁴) × (2.0×10⁻²) + 650',             'Evaluate (3.50 × 10⁴) × (2.0 × 10⁻²) + 650. Show sig figs on all intermediate steps.',                               t9c, 4),
    (gen_random_uuid(), '[(6.0×10²³) × 0.500] ÷ (6.02×10²)',          'Evaluate [(6.0 × 10²³) × 0.500] ÷ (6.02 × 10²). Show sig figs on all intermediate steps.',                           t9c, 5),
    (gen_random_uuid(), '(0.01020 × 4.3×10⁴) ÷ (16 − 12)',            'Evaluate (0.01020 × 4.3 × 10⁴) ÷ (16 − 12). Show sig figs on all intermediate steps.',                               t9c, 6),
    (gen_random_uuid(), '(1.50×10⁻³) × (2.00×10⁴) − 0.500',          'Evaluate (1.50 × 10⁻³) × (2.00 × 10⁴) − 0.500. Show sig figs on all intermediate steps.',                           t9c, 7),
    (gen_random_uuid(), '[(8.40×10⁻³) + (3.2×10⁻⁴)] ÷ (2.0×10⁻¹)',  'Evaluate [(8.40 × 10⁻³) + (3.2 × 10⁻⁴)] ÷ (2.0 × 10⁻¹). Show sig figs on all intermediate steps.',                 t9c, 8),
    (gen_random_uuid(), '[(3.24×10⁻²) × (4.1×10³)] ÷ [(1.5×10²) − 85]', 'Evaluate [(3.24 × 10⁻²) × (4.1 × 10³)] ÷ [(1.5 × 10²) − 85]. Show sig figs on all intermediate steps.',         t9c, 9);

END $$;
