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
async function postToGemini(body: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  // Reading a student's handwriting/diagrams accurately and reasoning about
  // whether their chemistry is actually correct benefits from the model's
  // "thinking" mode (dynamic budget) — worth the extra latency here.
  const generationConfig = { ...(body.generationConfig as Record<string, unknown> | undefined), thinkingConfig: { thinkingBudget: -1 } }
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
  return postToGemini(body)
}

function imagePart(dataUrl: string): GeminiPart {
  // dataUrl looks like "data:image/png;base64,iVBORw0KG..."
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/)
  if (!match) throw new Error('Expected a base64 image data URL')
  return { inline_data: { mime_type: match[1], data: match[2] } }
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
  return postToGemini({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
  })
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
