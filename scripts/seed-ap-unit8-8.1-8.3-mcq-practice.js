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
  '8.1': 'e69ef38f-a102-4bc0-be5f-4a3f4e64da3f',
  '8.2': 'c8449c6b-38e6-4277-a48a-473afffd5c08',
  '8.3': 'ef536392-f05c-409a-937a-dafbfe95e39f',
};

const SCRATCH = '/private/tmp/claude-501/-Users-faridahmohammed/a3f8627e-aa7d-41d1-bef4-c518d6d06eb5/scratchpad/mcq';

async function uploadImage(localFile) {
  const buf = fs.readFileSync(path.join(SCRATCH, localFile));
  const storagePath = `unit8-topics8.1-8.3-mcq-practice/${localFile}`;
  const { error } = await sb.storage.from('question-images').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('question-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

const QUESTIONS = [
  {
    topic: '8.1', image: 'u8q1_table.png',
    title: 'Q1 — pOH and Kw of Pure Water at 37°C',
    content: `It is observed that the pH of pure water at a temperature of 37°C is equal to 6.81. Which of the following correctly identifies the pOH of pure water at 37°C and the value of Kw at 37°C? (See the answer-choice table above.)

(A) pOH = 6.81; Kw = 1.0 × 10⁻¹⁴
(B) pOH = 6.81; Kw = 2.4 × 10⁻¹⁴
(C) pOH = 7.19; Kw = 1.0 × 10⁻¹⁴
(D) pOH = 7.19; Kw = 2.4 × 10⁻¹⁴${JUSTIFY}`,
    answer: `(B). In pure water, [H⁺] = [OH⁻] always (autoionization produces them in a 1:1 ratio), so pH = pOH — meaning pOH = 6.81 at 37°C as well (ruling out C and D, which incorrectly compute pOH as 14.00 − 6.81, a relationship that only holds at 25°C where Kw = 1.0 × 10⁻¹⁴). To find Kw at this temperature: Kw = [H⁺][OH⁻] = (10⁻⁶·⁸¹)(10⁻⁶·⁸¹) = 10⁻¹³·⁶². Computing this: 10⁻¹³·⁶² = 10⁻¹⁴ × 10⁰·³⁸ ≈ 10⁻¹⁴ × 2.4 = 2.4 × 10⁻¹⁴. This confirms that Kw is NOT 1.0 × 10⁻¹⁴ at 37°C — that value only applies at 25°C; Kw genuinely changes with temperature (since autoionization of water is an equilibrium process).`,
  },
  {
    topic: '8.2',
    title: 'Q2 — Finding the Volume of Water Added to Dilute a Strong Acid',
    content: `At 25°C, enough distilled water is added to a 100.0 mL sample of HNO3(aq) with a pH of 4.50 so that the final pH of the diluted solution is 5.20. The volume of distilled water added to the original solution is closest to

(A) 16.0 mL
(B) 116.0 mL
(C) 400.0 mL
(D) 500.0 mL${JUSTIFY}`,
    answer: `(C). HNO3 is a strong acid, so it fully dissociates and moles of H⁺ are conserved upon dilution: M1V1 = M2V2. Initial [H⁺] = 10⁻⁴·⁵⁰ = 3.16 × 10⁻⁵ M; final [H⁺] = 10⁻⁵·²⁰ = 6.31 × 10⁻⁶ M. Solving for the final total volume: V2 = V1 × (M1/M2) = 100.0 mL × (3.16×10⁻⁵ / 6.31×10⁻⁶) ≈ 100.0 mL × 5.01 ≈ 501 mL. The volume of water ADDED is the final volume minus the original volume: 501 mL − 100.0 mL ≈ 400 mL.`,
  },
  {
    topic: '8.2',
    title: 'Q3 — pH of a Strong Base Solution from Mass and Volume',
    content: `A student dissolves 2.0 grams of NaOH(s) in distilled water so that the total volume of the solution is 2.0 × 10³ milliliters. The pH of the final solution at 25°C is closest to

(A) 9.4
(B) 12.4
(C) 12.7
(D) 14.0${JUSTIFY}`,
    answer: `(B). Moles of NaOH = 2.0 g ÷ 40.0 g/mol = 0.050 mol. NaOH is a strong base that fully dissociates, so [OH⁻] = 0.050 mol ÷ 2.0 L = 0.025 M. pOH = −log(0.025) ≈ 1.60. pH = 14.00 − 1.60 = 12.40.`,
  },
  {
    topic: '8.3', image: 'u8q4_table.png',
    title: 'Q4 — Comparing Acid Strength Using pH at Two Concentrations',
    content: `Concentration (M) | pH of Acid 1 | pH of Acid 2
5.0 × 10⁻³ | 3.52 | 2.30
4.0 × 10⁻⁴ | 4.07 | 3.40

The pH of solutions of two different monoprotic acids prepared at two different concentrations were measured and recorded in the table above. Which of the following statements correctly compares the relative strength of these acids and provides a valid justification?

(A) Acid 1 is the stronger acid because it has a larger Ka value.
(B) Acid 1 is the stronger acid because it has a smaller percent ionization value.
(C) Acid 2 is the stronger acid because it has a smaller Ka value.
(D) Acid 2 is the stronger acid because it has a larger percent ionization value.${JUSTIFY}`,
    answer: `(D). Notice that Acid 2's pH values exactly match −log(C) at both concentrations (−log(5.0×10⁻³) = 2.30; −log(4.0×10⁻⁴) = 3.40) — meaning Acid 2 dissociates essentially completely, behaving like a strong acid. Acid 1's pH values are much higher than −log(C) would predict, meaning it is only partially dissociated (a weak acid). Computing percent ionization directly confirms this: at 5.0×10⁻³ M, Acid 2 is about 100% ionized ([H⁺] = 10⁻²·³⁰ = 5.0×10⁻³ M) while Acid 1 is only about 6% ionized ([H⁺] = 10⁻³·⁵² = 3.0×10⁻⁴ M). Since Acid 2 ionizes to a much greater extent (larger percent ionization) at both concentrations, it is the stronger acid — matching (D). Choices (A) and (C) reference Ka values that were never given or calculated, and (C)'s logic is backwards (a smaller Ka indicates a WEAKER acid, not a stronger one).`,
  },
  {
    topic: '8.3', image: 'u8q5_table.png',
    title: 'Q5 — Effect of Dilution on Ka and Percent Ionization',
    content: `[HC2H3O2] (M) | [H3O⁺] (M)
1.0 × 10⁻² | 4.2 × 10⁻⁴
1.0 × 10⁻³ | 1.3 × 10⁻⁴
1.0 × 10⁻⁴ | 3.4 × 10⁻⁵

The table above shows data for three different solutions of HC2H3O2(aq) at 25°C. Based on this data, which of the following is most likely to occur when a sample of HC2H3O2(aq) is diluted with water?

(A) The value of Ka for HC2H3O2(aq) decreases.
(B) The value of Ka for HC2H3O2(aq) increases.
(C) The percent ionization of HC2H3O2(aq) decreases.
(D) The percent ionization of HC2H3O2(aq) increases.${JUSTIFY}`,
    answer: `(D). Computing Ka = [H3O⁺]²/(C − [H3O⁺]) at each concentration gives approximately 1.8 × 10⁻⁵ in all three cases — confirming Ka is a genuine constant that does NOT change with concentration/dilution (ruling out A and B; Ka depends only on temperature). Computing percent ionization ([H3O⁺]/C × 100%) at each concentration: at 1.0×10⁻² M, 4.2%; at 1.0×10⁻³ M, 13%; at 1.0×10⁻⁴ M, 34%. As the acid is diluted (concentration decreases), percent ionization clearly INCREASES — a general trend for weak acids/bases, since Le Chatelier's principle favors more dissociation (more particles in solution) as the solution becomes more dilute.`,
  },
  {
    topic: '8.3', image: 'u8q6_structure.png',
    title: 'Q6 — Ranking Species Concentrations for a Diprotic Acid',
    content: `The structural formula of maleic acid (H2C4H2O4) is shown above. Maleic acid is a diprotic acid, and the two acid ionization processes that occur are represented by the following equations:

H2C4H2O4(aq) + H2O(l) ⇌ HC4H2O4⁻(aq) + H3O⁺(aq)     Ka1 = 1.5 × 10⁻²
HC4H2O4⁻(aq) + H2O(l) ⇌ C4H2O4²⁻(aq) + H3O⁺(aq)     Ka2 = 8.5 × 10⁻⁷

Which of the following identifies the four species that are present in an aqueous solution of H2C4H2O4 from the highest to the lowest concentration at equilibrium?

(A) H2C4H2O4 > HC4H2O4⁻ > C4H2O4²⁻ > H3O⁺
(B) H2C4H2O4 > H3O⁺ > HC4H2O4⁻ > C4H2O4²⁻
(C) H3O⁺ > HC4H2O4⁻ > C4H2O4²⁻ > H2C4H2O4
(D) H3O⁺ > C4H2O4²⁻ > HC4H2O4⁻ > H2C4H2O4${JUSTIFY}`,
    answer: `(B). Since Ka1 (1.5×10⁻²) >> Ka2 (8.5×10⁻⁷), essentially all of the H3O⁺ in solution comes from the FIRST ionization step, while the second ionization step contributes only a negligible additional amount. This means H2C4H2O4 (the largely-undissociated starting acid) remains the most abundant species — ruling out (C) and (D), which incorrectly place H3O⁺ as the highest. The first ionization step produces H3O⁺ and HC4H2O4⁻ in a strict 1:1 ratio, but the second (much smaller) ionization step consumes a small amount of HC4H2O4⁻ to produce additional H3O⁺ and C4H2O4²⁻ — meaning the total [H3O⁺] ends up very slightly GREATER than [HC4H2O4⁻] (since some HC4H2O4⁻ was further converted away while contributing extra H3O⁺). This gives the order H2C4H2O4 > H3O⁺ > HC4H2O4⁻ > C4H2O4²⁻, with C4H2O4²⁻ the least abundant since it only forms via the very small Ka2 step.`,
  },
  {
    topic: '8.3', image: 'u8q7_table.png',
    title: 'Q7 — Identifying the Solution with the Highest pH from pKa/pKb Values',
    content: `HF(aq) | pKa = 3.17
HCN(aq) | pKa = 9.21
(CH3)3N(aq) | pKb = 4.19
C6H5NH2(aq) | pKb = 9.42

The pKa or pKb values of some weak acids and bases are listed in the table above. Which of the following solutions has the highest pH?

(A) 0.1 M HF(aq)
(B) 0.1 M HCN(aq)
(C) 0.1 M (CH3)3N(aq)
(D) 0.1 M C6H5NH2(aq)${JUSTIFY}`,
    answer: `(C). HF and HCN are both acids, so their solutions will have pH below 7 — this immediately rules out (A) and (B), since the highest pH overall must come from one of the two bases. Between the two bases, (CH3)3N has the SMALLER pKb (4.19, meaning a LARGER Kb = 10⁻⁴·¹⁹ ≈ 6.5×10⁻⁵) compared to C6H5NH2 (pKb = 9.42, Kb ≈ 3.8×10⁻¹⁰) — a smaller pKb means a stronger base. Solving each with the same 0.1 M concentration: (CH3)3N gives pOH ≈ 2.6 (pH ≈ 11.4), while C6H5NH2 gives pOH ≈ 5.2 (pH ≈ 8.8). Since (CH3)3N is the much stronger base, its solution has a much higher pH — making (C) the correct choice.`,
  },
  {
    topic: '8.3',
    title: 'Q8 — Back-Calculating [HOBr] from Ka and pH',
    content: `HOBr(aq) + H2O(l) ⇌ H3O⁺(aq) + OBr⁻(aq)     Ka = 2.2 × 10⁻⁹

The ionization of hypobromous acid, HOBr, is represented above. A certain solution of HOBr has a pH of 4.50. What is the approximate concentration of unionized HOBr(aq) in the solution?

(A) 2.2 × 10⁻⁹ M
(B) 3.2 × 10⁻⁵ M
(C) 0.45 M
(D) 4.5 M${JUSTIFY}`,
    answer: `(C). At pH 4.50, [H3O⁺] = 10⁻⁴·⁵⁰ ≈ 3.16 × 10⁻⁵ M. Since HOBr ionizes 1:1 to form H3O⁺ and OBr⁻, [OBr⁻] ≈ [H3O⁺] ≈ 3.16 × 10⁻⁵ M as well (ignoring water's own tiny autoionization contribution). Using Ka = [H3O⁺][OBr⁻]/[HOBr]: [HOBr] = [H3O⁺][OBr⁻] / Ka = (3.16×10⁻⁵)² / (2.2×10⁻⁹) = (1.0×10⁻⁹) / (2.2×10⁻⁹) ≈ 0.45 M. This large concentration of unionized HOBr makes sense given how extremely small Ka is (2.2×10⁻⁹) — a very weak acid needs a substantial concentration of undissociated HOBr to produce even this modest amount of H3O⁺.`,
  },
  {
    topic: '8.3',
    title: 'Q9 — Identifying Which Salt Hydrolysis Produces a Basic Solution',
    content: `Samples of KNO2(s) and NH4NO3(s) are dissolved in separate beakers that each contain 100 mL of water. One of the salts produces a slightly basic solution. Which of the following equations best represents the formation of the slightly basic solution?

(A) K⁺(aq) + 2 H2O(l) ⇌ KOH(aq) + H3O⁺(aq)
(B) NH4⁺(aq) + H2O(l) ⇌ NH3(aq) + H3O⁺(aq)
(C) NO2⁻(aq) + H2O(l) ⇌ HNO2(aq) + OH⁻(aq)
(D) NO3⁻(aq) + H2O(l) ⇌ HNO3(aq) + OH⁻(aq)${JUSTIFY}`,
    answer: `(C). KNO2 dissociates into K⁺ (the conjugate acid of the strong base KOH — a spectator ion that does NOT hydrolyze, ruling out A, which describes a reaction that doesn't actually occur) and NO2⁻ (the conjugate base of the weak acid HNO2). NO2⁻ IS a weak base and hydrolyzes water to form HNO2 and OH⁻, producing a basic solution — this matches (C). NH4NO3 dissociates into NH4⁺ (the conjugate acid of the weak base NH3, which DOES hydrolyze to form H3O⁺, making a solution acidic — choice B correctly describes a real reaction, but it produces an ACIDIC solution, not the basic one asked about) and NO3⁻ (the conjugate base of the strong acid HNO3 — a spectator ion that does not hydrolyze, ruling out D, another fictitious reaction). Since KNO2 is the salt that produces the basic solution, (C) is correct.`,
  },
  {
    topic: '8.3',
    title: 'Q10 — pH of a Weak Base Solution (Caffeine)',
    content: `Caffeine (C8H10N4O2) is a weak base with a Kb value of 4.3 × 10⁻¹⁰. The pH of a 0.01 M solution of caffeine is closest to

(A) 5.7
(B) 8.3
(C) 9.4
(D) 12.0${JUSTIFY}`,
    answer: `(B). Using the approximation x² ≈ Kb × C (valid since Kb is tiny): x² = (4.3×10⁻¹⁰)(0.01) = 4.3×10⁻¹², so x = [OH⁻] ≈ 2.07×10⁻⁶ M. pOH = −log(2.07×10⁻⁶) ≈ 5.68. pH = 14.00 − 5.68 ≈ 8.3.`,
  },
  {
    topic: '8.3', image: 'u8q11_table.png',
    title: 'Q11 — pH and Dominant Species for Propanoic Acid',
    content: `HC3H5O2(aq) + H2O(l) ⇌ H3O⁺(aq) + C3H5O2⁻(aq)     Ka = 1.3 × 10⁻⁵

Propanoic acid, HC3H5O2(aq), is a weak acid that ionizes in water according to the equation above. Which of the following provides the best estimate of the pH of 5 × 10⁻³ M HC3H5O2(aq) and identifies the species at the highest concentration (excluding H2O) in the solution? (See the answer-choice table above.)

(A) pH = 2.3; H3O⁺(aq)
(B) pH = 2.3; HC3H5O2(aq)
(C) pH = 3.6; H3O⁺(aq)
(D) pH = 3.6; HC3H5O2(aq)${JUSTIFY}`,
    answer: `(D). Setting up the equilibrium: x²/(5×10⁻³ − x) = 1.3×10⁻⁵. Solving the quadratic gives x = [H3O⁺] ≈ 2.5×10⁻⁴ M, so pH = −log(2.5×10⁻⁴) ≈ 3.6 (ruling out the pH = 2.3 choices, which would require far more ionization than this small Ka allows). Since only about 2.5×10⁻⁴ M of the original 5×10⁻³ M acid actually ionizes (about 5%), the vast majority remains as undissociated HC3H5O2 — roughly 4.75×10⁻³ M, far exceeding the H3O⁺ concentration of 2.5×10⁻⁴ M. So the species at the highest concentration (excluding water) is the undissociated acid, HC3H5O2(aq), not H3O⁺.`,
  },
  {
    topic: '8.3',
    title: 'Q12 — Determining Kb from pH for the Hydrolysis of OCl⁻',
    content: `OCl⁻(aq) + H2O(l) ⇌ HOCl(aq) + OH⁻(aq)     Kb = ?

The hypochlorite ion, OCl⁻, reacts with water according to the equation above. A solution of 0.025 M NaOCl(aq) has a pH of 9.96. Which of the following is the best estimate of the value of the equilibrium constant, Kb, for the reaction shown above at 25°C?

(A) 4.8 × 10⁻¹⁹
(B) 3.3 × 10⁻⁷
(C) 9.1 × 10⁻⁵
(D) 3.6 × 10⁻³${JUSTIFY}`,
    answer: `(B). pOH = 14.00 − 9.96 = 4.04, so [OH⁻] = 10⁻⁴·⁰⁴ ≈ 9.12×10⁻⁵ M. Since OCl⁻ hydrolyzes 1:1, [HOCl] ≈ [OH⁻] ≈ 9.12×10⁻⁵ M as well. Kb = [HOCl][OH⁻] / [OCl⁻] = (9.12×10⁻⁵)² / (0.025 − 9.12×10⁻⁵) ≈ (8.32×10⁻⁹) / (0.0249) ≈ 3.3×10⁻⁷.`,
  },
];

(async () => {
  const topicOrderCounter = {};
  for (const [k, v] of Object.entries(TOPICS)) {
    const { count } = await sb.from('questions').select('id', { count: 'exact', head: true }).eq('topic_id', v);
    topicOrderCounter[k] = count ?? 0;
  }

  for (const q of QUESTIONS) {
    const imageUrl = q.image ? await uploadImage(q.image) : null;
    const { error } = await sb.from('questions').insert({
      topic_id: TOPICS[q.topic],
      title: q.title,
      content: q.content,
      answer_key: q.answer,
      image_url: imageUrl,
      difficulty: 'medium',
      points: 2,
      question_type: 'frq',
      source: 'MCQ Practice',
      order_index: topicOrderCounter[q.topic]++,
    });
    if (error) throw error;
    console.log('Inserted:', q.title);
  }
  console.log('Done —', QUESTIONS.length, 'questions inserted.');
})();
