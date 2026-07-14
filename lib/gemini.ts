// Thin wrapper around the Gemini API for checking a student's handwritten
// board work. Uses the REST generateContent endpoint directly (no SDK
// dependency) so it's just a fetch call.
//
// Requires GEMINI_API_KEY in the environment. Get one at
// https://aistudio.google.com/apikey
//
// Uses the "-latest" alias rather than a pinned version — pinned model names
// (e.g. gemini-2.0-flash) get retired from new API keys/projects over time
// and start returning 404 "no longer available to new users". The alias
// always resolves to whatever current fast model Google has live.
const MODEL = 'gemini-flash-latest'

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

// Google's shared free-tier model occasionally returns 503 "high demand" —
// transient overload, not a real failure. Retry a couple times with a short
// backoff before giving up, so students don't see a failure for something
// that resolves itself a second later.
async function postToGemini(body: Record<string, unknown>, thinkingBudget: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const generationConfig = { ...(body.generationConfig as Record<string, unknown> | undefined), thinkingConfig: { thinkingBudget } }
  body = { ...body, generationConfig }

  const delays = [0, 800, 2000]
  let lastError: Error | null = null
  for (const delay of delays) {
    if (delay) await new Promise(r => setTimeout(r, delay))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) {
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned no content')
      return text
    }
    const errText = await res.text()
    lastError = new Error(`Gemini API error ${res.status}: ${errText}`)
    if (res.status !== 503) throw lastError
  }
  throw lastError
}

async function callGemini(parts: GeminiPart[], responseSchema?: object): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts }],
  }
  if (responseSchema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema }
  }
  // Reading handwriting/diagrams accurately and judging correctness
  // benefits from the model's "thinking" mode (dynamic budget) — worth
  // the extra cost/latency for grading specifically.
  return postToGemini(body, -1)
}

function imagePart(dataUrl: string): GeminiPart {
  // dataUrl looks like "data:image/png;base64,iVBORw0KG..."
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/)
  if (!match) throw new Error('Expected a base64 image data URL')
  return { inline_data: { mime_type: match[1], data: match[2] } }
}

// Question diagrams are stored as public Storage URLs, not data URLs — this
// fetches one and re-encodes it the same way imagePart expects.
async function imagePartFromUrl(url: string): Promise<GeminiPart> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch question image: ${res.status}`)
  const mimeType = res.headers.get('content-type') || 'image/png'
  const buf = await res.arrayBuffer()
  const data = Buffer.from(buf).toString('base64')
  return { inline_data: { mime_type: mimeType, data } }
}

export interface AiGradeResult {
  grade: 'correct' | 'incorrect'
  feedback: string
}

// Grades a student's board against the question, the way a teacher would —
// used as a SUGGESTION only; the teacher still clicks Correct/Wrong
// themselves to actually save and notify the student.
export async function gradeStudentWork(
  questionTitle: string, questionContent: string | null, boardImageDataUrl: string
): Promise<AiGradeResult> {
  const prompt = `You are an experienced chemistry teacher grading a student's handwritten work on a whiteboard.

Question: ${questionTitle}
${questionContent ? `Question details: ${questionContent}` : ''}

The image shows the student's handwritten work and/or diagrams answering this question. Read the handwriting carefully, including any chemical formulas, equations, diagrams, or drawings.

Decide whether the student's answer is fundamentally correct (the right final answer/conclusion, even if minor steps are messy) or incorrect (wrong answer, wrong reasoning, or no real attempt). Then write brief, encouraging, specific feedback (1-3 sentences) as a teacher would write it directly to the student — point out exactly what's right or what went wrong, referencing their actual work.`

  const schema = {
    type: 'object',
    properties: {
      grade: { type: 'string', enum: ['correct', 'incorrect'] },
      feedback: { type: 'string' },
    },
    required: ['grade', 'feedback'],
  }

  const text = await callGemini([{ text: prompt }, imagePart(boardImageDataUrl)], schema)
  const parsed = JSON.parse(text) as AiGradeResult
  if (parsed.grade !== 'correct' && parsed.grade !== 'incorrect') {
    throw new Error(`Unexpected grade value from Gemini: ${parsed.grade}`)
  }
  return parsed
}

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

async function callGeminiChat(systemInstruction: string, contents: { role: string; parts: GeminiPart[] }[]): Promise<string> {
  // Chat replies are short guiding questions, not deep grading judgments —
  // thinking mode roughly doubles token cost here for no real benefit, so
  // it's off for chat specifically (kept on for grading in callGemini).
  return postToGemini({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
  }, 0)
}

// Runs a Socratic tutoring dialogue: the AI only ever asks the student a
// guiding question toward the next step. It affirms correct steps and moves
// to the next question, nudges around wrong ones without stating the fix,
// and only switches to a direct step-by-step explanation once the student
// has clearly signaled they're stuck (e.g. said "I don't know" repeatedly).
export async function chatSocratic(
  questionTitle: string,
  questionContent: string | null,
  boardImageDataUrl: string | null,
  history: ChatTurn[],
): Promise<string> {
  const systemInstruction = `You are AI Faridah, a warm, patient AP/Honors Chemistry tutor holding a one-on-one Socratic dialogue with a student about this question:

Question: ${questionTitle}
${questionContent ? `Question details: ${questionContent}` : ''}

You can see a snapshot of the student's current whiteboard work attached to their latest message — read any handwriting, formulas, equations, or diagrams carefully.

Rules for every reply:
- NEVER state the final answer, and never do a calculation or reasoning step for them.
- Reply with ONE short guiding question (1-2 sentences) that leads them to figure out the next step themselves.
- If their last message/work shows they got a step right, briefly affirm it (just a few words), then ask the question that leads to the NEXT step.
- If they're wrong or off track, don't just say "wrong" — ask a smaller, more specific question that helps them notice the issue on their own.
- If the student explicitly asks you to check/recheck their board or asks if they're on the right track, look carefully at the current snapshot and tell them directly whether what's on the board so far looks correct or has an issue — point at the specific part, but still don't hand them the fix or the final answer; follow it with a guiding question toward the next step.
- ONLY if the student has clearly signaled they're stuck or confused across multiple turns (e.g. they say "I don't know", "I'm lost", or ask you to just explain, more than once) should you switch to a clear, direct step-by-step explanation of the CURRENT step only — still stop short of the final answer beyond that step, and return to asking questions afterward.
- Keep tone encouraging and concise, like a teacher standing beside them at a whiteboard. Plain text only, no markdown.`

  const contents = history.map((turn, i) => {
    const parts: GeminiPart[] = [{ text: turn.text }]
    if (boardImageDataUrl && turn.role === 'user' && i === history.length - 1) {
      parts.push(imagePart(boardImageDataUrl))
    }
    return { role: turn.role, parts }
  })

  return (await callGeminiChat(systemInstruction, contents)).trim()
}

// Generates a teacher-facing answer key/solution for a question — an AI
// DRAFT the teacher compares against while grading, always visible and
// editable so any error can be fixed rather than trusted blindly. Uses full
// thinking mode (same as grading) since accuracy is the entire point here.
export async function generateAnswerKey(
  questionTitle: string,
  questionContent: string | null,
  imageUrl: string | null,
): Promise<string> {
  const prompt = `You are an expert AP/Honors Chemistry teacher writing an internal answer key for another teacher to reference while grading — the student never sees this text.

Question: ${questionTitle}
${questionContent ? `Question details: ${questionContent}` : ''}
${imageUrl ? 'A diagram/graph/data table image is attached — read it carefully, it may contain values needed for the solution.' : ''}

Write the complete, correct solution:
- Show the full step-by-step work a teacher would check against (formulas used, values substituted, unit conversions, dimensional analysis).
- State the final answer clearly at the end, with correct units and significant figures for a numeric answer, or the correct conceptual answer if it's not a calculation.
- Double-check your arithmetic, units, and chemistry (e.g. valences, stoichiometric ratios, sig figs) before finalizing — this is used as the reference for grading, so it must be correct.
- Be concise but complete: enough shown to verify correctness at a glance, not padded with restating the question.
- Plain text only, no markdown formatting (no **, no #, no bullet characters — use line breaks and "Step 1:", "Step 2:" style labels instead).`

  const parts: GeminiPart[] = [{ text: prompt }]
  if (imageUrl) {
    try {
      parts.push(await imagePartFromUrl(imageUrl))
    } catch {
      // If the image can't be fetched, still generate from title/content
      // alone rather than failing the whole request.
    }
  }

  return (await callGemini(parts)).trim()
}

export interface DeepReportStruggleItem {
  questionTitle: string
  questionContent: string | null
  answerKey: string | null
  topicTitle: string
  grade: string | null
  boardImageDataUrl: string | null
  textAnswer: string | null
  teacherComment: string | null
}

export interface DeepReportContext {
  studentFirstName: string
  parentName: string | null
  masterySummary: string
  trendSummary: string
  engagementSummary: string
  classComparisonSummary: string | null
  classBreakdownSummary: string | null
  isFoundationalAdvancedPairing: boolean
}

// Looks at a student's ACTUAL submitted work (not just grade percentages)
// across their recent struggling questions and writes a genuine diagnostic
// narrative — what specific misconception or skill gap shows up, whether it
// repeats across topics, and what to do about it. This is what makes the
// parent report "deep" instead of a bare pass/fail tally.
export async function generateDeepStudentReport(
  ctx: DeepReportContext,
  items: DeepReportStruggleItem[],
): Promise<string> {
  const { studentFirstName, parentName, masterySummary, trendSummary, engagementSummary, classComparisonSummary, classBreakdownSummary, isFoundationalAdvancedPairing } = ctx

  const parts: GeminiPart[] = [{
    text: `You are an experienced AP/Honors Chemistry teacher writing a genuinely useful, specific progress narrative about ${studentFirstName} for ${parentName ? `${parentName}, ${studentFirstName}'s parent/guardian` : "their parent/guardian"}. This is NOT a generic "did X questions, got Y correct" summary — the reader already sees those numbers separately in a table above this report. Your job is to look at the student's ACTUAL submitted work below (images of their handwritten whiteboard work, or typed answers) on the questions they struggled with, and diagnose what is REALLY going on.

CRITICAL STYLE RULE: Refer to the student by their first name, "${studentFirstName}", throughout the report — every time you would otherwise write "the student," "your child," or "they" as the primary subject of a sentence, use "${studentFirstName}" instead. A pronoun is fine occasionally for flow within a sentence that already named them, but never let "the student" appear anywhere in your output.

Topic mastery summary (for context only, don't just restate this as a list):
${masterySummary}

${classBreakdownSummary ? `Per-class breakdown:\n${classBreakdownSummary}\n${isFoundationalAdvancedPairing ? `\nIMPORTANT CONTEXT: ${studentFirstName} is enrolled in BOTH an Honors Chemistry class (foundational chemistry) AND an AP Chemistry class (college-level, advanced) AT THE SAME TIME. This means ${studentFirstName} is learning AP-level material without having already completed a full year of foundational chemistry first — that is a genuinely harder path than a typical AP student takes. Because of this:\n- Compare ${studentFirstName}'s performance in the two classes explicitly (e.g. "doing well in the foundational Honors material, and the AP class is understandably more challenging while that foundation is still being built" or "strong in both, which is impressive given the concurrent course load").\n- DO NOT be harsh or alarming about lower scores in the AP class specifically. Frame AP struggles as an expected, normal part of tackling college-level content concurrently with the foundational course, not as a red flag or a sign ${studentFirstName} is "behind." If AP scores are meaningfully lower than Honors scores, say so plainly but with encouraging, realistic framing (e.g. "this gap is expected and should narrow as the Honors foundation solidifies," not "struggling significantly").\n- If Honors Chem performance is solid, explicitly point out that this is a good sign for how ${studentFirstName} will handle the AP material once the foundational gap closes.\n` : ''}\n` : ''}Progress trend (accuracy over time, oldest to newest — use this to say whether ${studentFirstName} is trending up, down, or flat, don't just repeat the raw numbers):
${trendSummary}

Engagement: ${engagementSummary}

${classComparisonSummary ? `Class comparison (this student vs. the average of their classmates on the same assigned questions) — use this to note specifically where ${studentFirstName} is ahead of or behind peers, AND to distinguish an INDIVIDUAL struggle (${studentFirstName} scores well below the class average on a topic) from a CLASS-WIDE struggle (the whole class, including ${studentFirstName}, is scoring low on a topic — reassuring context, not just a personal weakness):\n${classComparisonSummary}\n` : ''}
Below are up to ${items.length} of ${studentFirstName}'s recent struggling submissions (incorrect, partial, needs-more-work, or ungraded), each with the question, the correct answer key, and their actual work. Study the actual work carefully — read handwriting, look at where their reasoning diverges from the correct answer key, and identify the SPECIFIC error pattern (e.g. "consistently drops a sign when balancing charges," "confuses molarity with molality," "can set up the formula but makes arithmetic errors under time pressure," "understands the concept but skips units/sig figs," etc.) rather than vague statements like "needs to review stoichiometry."

Write a report with these sections, in plain text (no markdown symbols, use line breaks and short section headers in Title Case followed by a colon):

Overall Pattern: 2-4 sentences on the single biggest recurring issue you see across ${studentFirstName}'s work, stated specifically and concretely.

Specific Struggles: for each distinct misconception or error pattern you find (usually 2-4), a short paragraph naming the pattern, citing 1-2 concrete examples from ${studentFirstName}'s actual submitted work (reference the question by name), and explaining what's actually going wrong in their reasoning — not just that they got it wrong.

Progress and Trend: 2-3 sentences using the trend data above — is ${studentFirstName} improving, plateauing, or slipping recently? Be specific about the direction and, if there's a turning point, when it happened.

${isFoundationalAdvancedPairing ? `Foundational vs. Advanced: 2-3 sentences comparing ${studentFirstName}'s Honors Chemistry (foundational) performance to their AP Chemistry (advanced) performance, using the encouraging, non-alarming framing described above — this is a normal, expected gap given the concurrent course load, not a deficiency.\n\n` : ''}${classComparisonSummary ? `How ${studentFirstName} Compares: 2-3 sentences using the class comparison data — name specific topics where ${studentFirstName} is ahead of or behind classmates, and call out clearly if a struggling topic is actually a class-wide difficulty rather than something specific to ${studentFirstName}.\n\n` : ''}What's Going Well: 1-2 sentences on a genuine strength visible in ${studentFirstName}'s work (skip generic praise — cite something specific you actually observed).

Recommended Next Steps: 2-3 concrete, actionable suggestions${parentName ? ` for ${parentName} and ${studentFirstName}` : ''} (e.g. specific topic to re-practice, a specific habit to build like "double-check units before finalizing an answer").

Be honest and specific — this needs to be genuinely useful for ${parentName ?? 'a parent'} to understand where ${studentFirstName} actually struggles, not a diplomatically vague summary. If the work shown doesn't support a strong claim about a pattern, say so rather than inventing one.`,
  }]

  for (const item of items) {
    let detail = `\n---\nTopic: ${item.topicTitle}\nQuestion: ${item.questionTitle}\n${item.questionContent ? `Details: ${item.questionContent}\n` : ''}Correct answer key: ${item.answerKey ?? '(not available)'}\nGrade given: ${item.grade ?? 'not yet graded'}`
    if (item.teacherComment) detail += `\nTeacher's comment: ${item.teacherComment}`
    if (item.textAnswer) detail += `\nStudent's typed answer: ${item.textAnswer}`
    if (item.boardImageDataUrl) detail += `\nStudent's handwritten work is in the attached image.`
    parts.push({ text: detail })
    if (item.boardImageDataUrl) {
      try {
        parts.push(imagePart(item.boardImageDataUrl))
      } catch {
        // skip a malformed image rather than failing the whole report
      }
    }
  }

  return (await callGemini(parts)).trim()
}
