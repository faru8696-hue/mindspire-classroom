import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PrintButton from './PrintButton'

// Numeric rank so we can detect improvement (higher = better). 'discussed' is a
// conversation marker, not a performance level, so it's excluded from scoring.
const RANK: Record<string, number> = { incorrect: 0, needsmore: 1, partial: 2, correct: 3 }
// Mastery weight per latest grade: correct = full, partial = half, rest = 0.
const WEIGHT: Record<string, number> = { correct: 1, partial: 0.5, incorrect: 0, needsmore: 0 }

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  correct:   { label: '✓ Correct',   cls: 'bg-green-100 text-green-700' },
  partial:   { label: '~ Partial',   cls: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Incorrect', cls: 'bg-red-100 text-red-600' },
  needsmore: { label: '🔄 Needs work', cls: 'bg-purple-100 text-purple-700' },
  discussed: { label: '💬 Discussed', cls: 'bg-blue-100 text-blue-700' },
}

function masteryLabel(pct: number): { text: string; cls: string; bar: string } {
  if (pct >= 80) return { text: 'Strong', cls: 'text-green-700', bar: 'bg-green-500' }
  if (pct >= 50) return { text: 'Developing', cls: 'text-amber-600', bar: 'bg-amber-400' }
  return { text: 'Needs work', cls: 'text-red-600', bar: 'bg-red-400' }
}

export default async function StudentReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const supabase = await createAdminClient()

  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, grade_level')
    .eq('id', studentId)
    .single()
  if (!student) notFound()

  // Enrolled classes → content tree
  const { data: studentEnrollments } = await supabase
    .from('class_enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', studentId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrolledClasses = (studentEnrollments ?? []).map((e: any) => {
    const c = e.classes; return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]
  const enrolledClassIds = enrolledClasses.map(c => c.id)

  const { data: units } = enrolledClassIds.length > 0
    ? await supabase.from('units').select('id, title, order_index, class_id').in('class_id', enrolledClassIds).order('order_index')
    : { data: [] }
  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }
  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, topic_id').in('topic_id', topicIds)
    : { data: [] }
  const questionIds = questions?.map(q => q.id) ?? []

  // Assigned filter (fall back to all questions if nothing explicitly assigned)
  const { data: assignments } = enrolledClassIds.length > 0 && questionIds.length > 0
    ? await supabase.from('assignments').select('question_id').in('class_id', enrolledClassIds)
    : { data: [] }
  const assignedSet = assignments && assignments.length > 0
    ? new Set(assignments.map((a: { question_id: string }) => a.question_id))
    : null

  // Latest grade per question (from feedback)
  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }
  const submissionIds = submissions?.map((s: { id: string }) => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] }
  const gradeBySubmission = new Map(feedbacks?.map((f: { submission_id: string; grade: string | null }) => [f.submission_id, f.grade]))
  const latestGradeByQuestion = new Map<string, string | null>()
  for (const s of submissions ?? []) latestGradeByQuestion.set(s.question_id, gradeBySubmission.get(s.id) ?? null)

  // Full grade history (chronological)
  const { data: history } = await supabase
    .from('grade_history')
    .select('question_id, grade, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  const qMeta = new Map((questions ?? []).map(q => [q.id, q]))
  const topicMeta = new Map((topics ?? []).map(t => [t.id, t]))

  // ── Topic mastery rollup ────────────────────────────────────────
  const assignedQs = assignedSet ? (questions ?? []).filter(q => assignedSet.has(q.id)) : (questions ?? [])
  type TopicStat = { id: string; title: string; graded: number; score: number; total: number }
  const topicStats = new Map<string, TopicStat>()
  for (const q of assignedQs) {
    const t = topicMeta.get(q.topic_id)
    if (!t) continue
    if (!topicStats.has(t.id)) topicStats.set(t.id, { id: t.id, title: t.title, graded: 0, score: 0, total: 0 })
    const ts = topicStats.get(t.id)!
    ts.total++
    const g = latestGradeByQuestion.get(q.id)
    if (g && g in WEIGHT) { ts.graded++; ts.score += WEIGHT[g] }
  }
  const masteryRows = [...topicStats.values()]
    .filter(t => t.graded > 0)
    .map(t => ({ ...t, pct: Math.round((t.score / t.graded) * 100) }))
    .sort((a, b) => b.pct - a.pct)

  // ── Overall stats ───────────────────────────────────────────────
  let correct = 0, partial = 0, incorrect = 0, graded = 0
  for (const q of assignedQs) {
    const g = latestGradeByQuestion.get(q.id)
    if (!g) continue
    if (g === 'correct') { correct++; graded++ }
    else if (g === 'partial') { partial++; graded++ }
    else if (g === 'incorrect' || g === 'needsmore') { incorrect++; graded++ }
  }
  const overallPct = graded > 0 ? Math.round(((correct + partial * 0.5) / graded) * 100) : 0

  // ── Improvement over time (from history) ────────────────────────
  // Group history by question; an "improvement" is a question whose grade rank
  // rose from its first graded state to its latest.
  const byQuestion = new Map<string, { grade: string; created_at: string }[]>()
  for (const h of history ?? []) {
    if (!byQuestion.has(h.question_id)) byQuestion.set(h.question_id, [])
    byQuestion.get(h.question_id)!.push({ grade: h.grade, created_at: h.created_at })
  }
  type Improvement = { questionId: string; title: string; from: string; to: string; date: string }
  const improvements: Improvement[] = []
  for (const [qid, evs] of byQuestion) {
    if (evs.length < 2) continue
    const first = evs[0], last = evs[evs.length - 1]
    const fr = RANK[first.grade], lr = RANK[last.grade]
    if (fr === undefined || lr === undefined) continue
    if (lr > fr) {
      improvements.push({
        questionId: qid,
        title: qMeta.get(qid)?.title ?? 'Question',
        from: first.grade, to: last.grade, date: last.created_at,
      })
    }
  }
  improvements.sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const totalEvents = (history ?? []).length
  const firstDate = history && history.length > 0 ? new Date(history[0].created_at) : null
  const lastDate = history && history.length > 0 ? new Date(history[history.length - 1].created_at) : null

  const displayName = student.nickname || student.full_name

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:max-w-none">
      {/* Toolbar (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/teacher/students/${studentId}`} className="text-purple-600 text-sm hover:underline">← Back to student</Link>
        <PrintButton />
      </div>

      {/* Report header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-500 font-semibold">Progress Report</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{student.full_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {[enrolledClasses.map(c => c.title).join(' · '), student.grade_level].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-700">{overallPct}%</div>
            <p className="text-xs text-gray-400">overall mastery</p>
          </div>
        </div>
        <div className="flex gap-3 text-sm mt-4">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">✓ {correct} correct</span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">~ {partial} partial</span>
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">✗ {incorrect} needs work</span>
          <span className="text-gray-400 px-1 py-1">{graded} questions graded</span>
        </div>
        {firstDate && lastDate && (
          <p className="text-xs text-gray-400 mt-3">
            Covering {firstDate.toLocaleDateString()} – {lastDate.toLocaleDateString()} · {totalEvents} graded checkpoints
          </p>
        )}
      </div>

      {/* Topic mastery */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-1">Strengths & areas to work on</h2>
        <p className="text-xs text-gray-400 mb-4">Mastery per topic, based on the most recent grade for each question.</p>
        {masteryRows.length === 0 ? (
          <p className="text-sm text-gray-400">No graded work yet.</p>
        ) : (
          <div className="space-y-3">
            {masteryRows.map(t => {
              const m = masteryLabel(t.pct)
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-44 flex-shrink-0 text-sm text-gray-700 truncate" title={t.title}>{t.title}</div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${t.pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold text-gray-600">{t.pct}%</div>
                  <div className={`w-24 text-right text-xs font-semibold ${m.cls}`}>{m.text}</div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Improvement over time */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-1">Progress over time</h2>
        <p className="text-xs text-gray-400 mb-4">Questions where {displayName}&apos;s grade improved after revisiting.</p>
        {improvements.length === 0 ? (
          <p className="text-sm text-gray-400">
            No improvement checkpoints yet — these appear once a question is re-graded after more practice.
          </p>
        ) : (
          <div className="space-y-2.5">
            {improvements.map(im => {
              const from = GRADE_BADGE[im.from], to = GRADE_BADGE[im.to]
              return (
                <div key={im.questionId} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{new Date(im.date).toLocaleDateString()}</span>
                  <span className="flex-1 text-gray-700 truncate" title={im.title}>{im.title}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${from?.cls ?? 'bg-gray-100 text-gray-500'}`}>{from?.label ?? im.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${to?.cls ?? 'bg-gray-100 text-gray-500'}`}>{to?.label ?? im.to}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-gray-300 print:text-gray-400">Generated {new Date().toLocaleDateString()} · Mindspire Lab</p>
    </div>
  )
}
