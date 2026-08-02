import ScoreCard from './ScoreCard'
import MasteryBar from './MasteryBar'
import ResultActions from './ResultActions'
import QuestionReviewList from './QuestionReviewList'
import type { TopicScore } from '@/lib/diagnosticGrading'

export interface QuestionReviewItem {
  questionId: string
  content: string
  imageUrl: string | null
  questionType: 'mcq' | 'frq'
  options: string[] | null
  selectedIndex: number | null
  correctIndex: number | null
  isCorrect: boolean | null
  explanation: string | null
  answerKey: string | null
  canvasData: string | null
  points: number | null
  pointsEarned: number | null
}

export interface FrqScore {
  totalCount: number
  gradedCount: number
  totalPoints: number
  gradedPoints: number
  earnedPoints: number
}

export interface DiagnosticResultData {
  testTitle: string
  studentName: string
  dateTaken: string
  correctCount: number
  totalCount: number
  scorePct: number
  frqScore: FrqScore | null
  timeSpentSeconds: number | null
  topicScores: TopicScore[]
  advice: { topicTitle: string; prepAdvice: string }[]
  questionReview: QuestionReviewItem[]
}

// Shared by the public results page (app/diagnostic/[slug]/results/[attemptId])
// and the teacher's per-attempt detail page — same breakdown, same PDF button,
// rendered from the same shape of data either way. `teacherView` + `attemptId`
// turn on FRQ grading controls in QuestionReviewList — students only ever see
// grades read-only, never the buttons to set them.
export default function DiagnosticResultSummary({
  result, teacherView = false, attemptId,
}: {
  result: DiagnosticResultData
  teacherView?: boolean
  attemptId?: string
}) {
  const frq = result.frqScore
  const frqPct = frq && frq.gradedPoints > 0 ? Math.round((frq.earnedPoints / frq.gradedPoints) * 100) : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Results</h2>
        <div className="mb-6 flex flex-wrap items-start justify-center gap-4">
          <ScoreCard
            correctCount={result.correctCount}
            totalCount={result.totalCount}
            scorePct={result.scorePct}
            timeSpentSeconds={result.timeSpentSeconds}
          />
          {frq && (
            <div className="inline-block bg-purple-50 rounded-2xl px-8 py-6">
              {frq.gradedCount === 0 ? (
                <>
                  <div className="text-3xl font-black text-purple-400">{frq.totalPoints} pts</div>
                  <div className="text-sm font-bold text-purple-600 mt-1">Free Response</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {teacherView ? 'not graded yet — enter scores below' : 'awaiting teacher review'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-black text-purple-600">{frq.earnedPoints}/{frq.gradedCount === frq.totalCount ? frq.totalPoints : `${frq.gradedPoints}`} pts</div>
                  <div className="text-sm font-bold text-purple-600 mt-1">Free Response{frqPct !== null ? ` — ${frqPct}%` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {frq.gradedCount < frq.totalCount ? `${frq.gradedCount}/${frq.totalCount} graded so far` : 'fully graded'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <ResultActions
          pdfData={{
            testTitle: result.testTitle,
            studentName: result.studentName,
            dateTaken: result.dateTaken,
            correctCount: result.correctCount,
            totalCount: result.totalCount,
            scorePct: result.scorePct,
            topicScores: result.topicScores,
            advice: result.advice,
          }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Performance by Topic</h3>
        <div className="space-y-3">
          {result.topicScores.map(t => (
            <MasteryBar key={t.topicId} topicTitle={t.topicTitle} correct={t.correct} total={t.total} pct={t.pct} tier={t.tier} />
          ))}
        </div>
      </div>

      <QuestionReviewList questions={result.questionReview} canGrade={teacherView} attemptId={attemptId} />

      {/* Only shown when there's real authored prep_advice to give — a
          topic with no advice text just isn't rendered rather than
          falling back to a generic "you're ready!" that would contradict
          a low score whenever advice hasn't been written for this test's
          topics yet. */}
      {result.advice.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Before You Start AP Chemistry</h3>
          <div className="space-y-3">
            {result.advice.map((a, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="font-bold text-amber-800 text-sm">{a.topicTitle}</p>
                <p className="text-sm text-gray-700 mt-1">{a.prepAdvice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
