// Thin wrapper around the Gemini API for checking a student's handwritten
// board work. Uses the REST generateContent endpoint directly (no SDK
// dependency) so it's just a fetch call — gemini-2.0-flash has a free tier
// generous enough for classroom use.
//
// Requires GEMINI_API_KEY in the environment. Get one at
// https://aistudio.google.com/apikey

const MODEL = 'gemini-2.0-flash'

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

async function callGemini(parts: GeminiPart[], responseSchema?: object): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const body: Record<string, unknown> = {
    contents: [{ parts }],
  }
  if (responseSchema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return text
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

// Gives a student a Socratic hint based on their current work — guides them
// toward the next step without just handing them the answer.
export async function hintForStudentWork(
  questionTitle: string, questionContent: string | null, boardImageDataUrl: string
): Promise<string> {
  const prompt = `You are a supportive chemistry teacher helping a student who is stuck on a problem.

Question: ${questionTitle}
${questionContent ? `Question details: ${questionContent}` : ''}

The image shows the student's current handwritten work on their whiteboard (it may be blank, partial, or contain a mistake). Read it carefully.

Give ONE short, encouraging hint (2-3 sentences max) that nudges them toward the next correct step. Do NOT give the final answer or do the work for them. If they've made a specific mistake, gently point them toward reconsidering that part without stating the fix outright. If the board is blank, suggest a concrete first step (e.g., what formula or concept to start with).`

  return (await callGemini([{ text: prompt }])).trim()
}
