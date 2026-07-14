import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PrintButton from './PrintButton'
import DeepReviewPanel from './DeepReviewPanel'
import StudentNotes from '../StudentNotes'
import { computeStudentReport, computeClassComparison } from '@/lib/studentReport'

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

  const report = await computeStudentReport(supabase, studentId)
  if (!report) notFound()

  const {
    student, enrolledClasses, overallPct, correct, partial, incorrect, graded,
    masteryRows, improvements, totalEvents, firstDate, lastDate, struggleItems, trend,
    classBreakdown, isFoundationalAdvancedPairing,
  } = report

  const displayName = student.nickname || student.full_name

  // Best-effort — a student with no classmates or an error here shouldn't
  // break the rest of the report, just fall back to no comparison shown.
  const classComparison = await computeClassComparison(supabase, report).catch(() => null)

  // Parent email + any cached deep report (separate queries — parent_email
  // and student_deep_reports both require a migration that may lag a fresh
  // deploy, so keep these isolated from the main computeStudentReport call).
  const { data: extProfile } = await supabase
    .from('profiles')
    .select('parent_email')
    .eq('id', studentId)
    .maybeSingle()
  const hasParentEmail = !!(extProfile as { parent_email?: string } | null)?.parent_email

  const { data: deepReportRow } = await supabase
    .from('student_deep_reports')
    .select('report_text, generated_at')
    .eq('student_id', studentId)
    .maybeSingle()

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
            Covering {new Date(firstDate).toLocaleDateString()} – {new Date(lastDate).toLocaleDateString()} · {totalEvents} graded checkpoints
          </p>
        )}
      </div>

      {/* Private teacher notes — also fed into the Deep Review AI prompt below
          as context, so anything written here can shape the generated report. */}
      <div className="print:hidden">
        <StudentNotes studentId={studentId} />
      </div>

      {/* Deep AI review of actual struggling work + email-to-parent */}
      <DeepReviewPanel
        studentId={studentId}
        displayName={displayName}
        overallPct={overallPct}
        trend={trend}
        classComparison={classComparison}
        classBreakdown={classBreakdown}
        isFoundationalAdvancedPairing={isFoundationalAdvancedPairing}
        struggleItems={struggleItems.map(s => ({
          questionTitle: s.questionTitle,
          questionContent: s.questionContent,
          answerKey: s.answerKey,
          topicTitle: s.topicTitle,
          grade: s.grade,
          canvasData: s.canvasData,
          teacherCanvasData: s.teacherCanvasData,
          textAnswer: s.textAnswer,
          teacherComment: s.teacherComment,
        }))}
        initialReportText={deepReportRow?.report_text ?? null}
        initialGeneratedAt={deepReportRow?.generated_at ?? null}
        hasParentEmail={hasParentEmail}
      />

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
