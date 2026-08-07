import ScoreCard from './ScoreCard'
import MasteryBar from './MasteryBar'
import ResultActions from './ResultActions'
import QuestionReviewList from './QuestionReviewList'
import { computeTotalScore, applyIntegrityDeduction, type TopicScore } from '@/lib/diagnosticGrading'

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
  teacherAnnotation: string | null
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
  // Neutral "left the test tab" counter — rendered on the teacher attempt
  // page only (see app/teacher/diagnostics/[testId]/attempts/[attemptId]),
  // never here, so it's never shown to the student.
  tabSwitchCount: number
  tabSwitchSeconds: number
  // Frozen at submit time (see assessTestIntegrity in diagnosticGrading.ts)
  // — unlike tabSwitchCount/Seconds above, THIS is shown to the student and
  // parent: the raw score minus this percentage is the grade that counts.
  integrityDeductionPct: number
  integrityLikelyCheating: boolean
  // How many questions were left blank — used to note when a low score is
  // more likely explained by running out of time than by wrong answers.
  unansweredCount: number
  totalQuestionCount: number
  // Only ever true when the test's allow_overtime was on (see
  // DiagnosticTestSession) — otherwise the timer auto-submits at 0:00 and a
  // late submission can't happen at all. overtimeAccepted is null until the
  // teacher explicitly decides; release-results/email-result both refuse to
  // release a late+unaccepted attempt (see OvertimeReviewPanel).
  submittedLate: boolean
  overtimeSeconds: number
  overtimeAccepted: boolean | null
  // Gates the public results page only — see lib/diagnosticResult.ts.
  resultsReleased: boolean
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
  const rawTotal = computeTotalScore(result.correctCount, result.totalCount, frq)
  const total = applyIntegrityDeduction(rawTotal, result.integrityDeductionPct)
  const hasDeduction = result.integrityDeductionPct > 0

  // A low score is worth explaining when it's plausibly about running out
  // of time rather than not knowing the material — only surfaced once a
  // meaningful share of the test was actually left blank, so a student who
  // answered everything and simply got questions wrong doesn't get a
  // misleading excuse.
  const unansweredPct = result.totalQuestionCount > 0 ? result.unansweredCount / result.totalQuestionCount : 0
  const showTimeReason = total.pct < 70 && unansweredPct >= 0.15

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Results</h2>
        {/* One combined total (MCQ + graded FRQ points) is the headline
            number — the separate MCQ/FRQ cards below are a breakdown, not
            two competing "totals". Provisional until every FRQ is graded.
            The headline is the score AFTER any integrity deduction — that's
            the grade that counts; the raw pre-deduction number is shown
            just below it whenever a deduction actually applied. */}
        <div className="mb-2 flex justify-center">
          <ScoreCard
            correctCount={total.earned}
            totalCount={total.possible}
            scorePct={total.pct}
            timeSpentSeconds={result.timeSpentSeconds}
          />
        </div>
        {!total.fullyGraded && (
          <p className="text-xs text-amber-600 mb-4">
            ⏳ Provisional{teacherView ? ' — grade the remaining free-response answers below for a final score.' : " — your teacher hasn't finished reviewing all the free-response answers yet."}
          </p>
        )}

        {/* Test Integrity — the raw/adjusted breakdown plus the reason for
            the deduction. Shown to both the student and the teacher (unlike
            the plain tabSwitchCount/Seconds fact above, which stays
            teacher-only) since the deduction directly changed their grade
            and they're entitled to see why. Worded as a pattern worth
            reviewing, not a verdict, even at the severe tier. */}
        {hasDeduction && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <p className="text-sm font-bold text-amber-800 mb-2">⚠️ Test Integrity: Score Adjusted</p>
            <div className="flex items-center justify-center gap-4 mb-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Before deduction</p>
                <p className="text-lg font-bold text-gray-700">{rawTotal.pct}%</p>
              </div>
              <div className="text-amber-600 font-bold">&minus;{result.integrityDeductionPct}%</div>
              <div>
                <p className="text-xs text-gray-500">After deduction (final)</p>
                <p className="text-lg font-bold text-amber-800">{total.pct}%</p>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              {result.tabSwitchCount} time{result.tabSwitchCount === 1 ? '' : 's'} away from the test window, {result.tabSwitchSeconds}s total, led to this deduction.
              {result.integrityLikelyCheating
                ? ' This pattern is hard to explain as innocent (a long time away, or leaving very frequently) and is flagged for teacher review.'
                : ' This can happen for innocent reasons (a notification, a quick look at a reference), but repeated or lengthy time away is still reflected in the grade.'}
            </p>
          </div>
        )}

        {showTimeReason && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-left">
            ℹ️ {result.unansweredCount} of {result.totalQuestionCount} questions were left unanswered, which may reflect the test time running out rather than the material not being understood.
          </p>
        )}

        {frq && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              Multiple Choice: {result.correctCount}/{result.totalCount} ({result.scorePct}%)
            </span>
            <span className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
              Free Response: {frq.gradedCount === 0 ? `${frq.totalPoints} pts` : `${frq.earnedPoints}/${frq.gradedCount === frq.totalCount ? frq.totalPoints : frq.gradedPoints} pts`}
              {frq.gradedCount < frq.totalCount ? ` (${frq.gradedCount}/${frq.totalCount} graded)` : ''}
            </span>
          </div>
        )}
        <ResultActions
          pdfData={{
            testTitle: result.testTitle,
            studentName: result.studentName,
            dateTaken: result.dateTaken,
            correctCount: result.correctCount,
            totalCount: result.totalCount,
            scorePct: result.scorePct,
            frqScore: result.frqScore,
            topicScores: result.topicScores,
            advice: result.advice,
            integrityDeductionPct: result.integrityDeductionPct,
            integrityLikelyCheating: result.integrityLikelyCheating,
            tabSwitchCount: result.tabSwitchCount,
            tabSwitchSeconds: result.tabSwitchSeconds,
            unansweredCount: result.unansweredCount,
            totalQuestionCount: result.totalQuestionCount,
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">What You Need to Work On</h3>
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
