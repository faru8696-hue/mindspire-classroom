import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import DiagnosticResultSummary from '@/components/diagnostic/DiagnosticResultSummary'
import EmailResultButton from '@/components/diagnostic/EmailResultButton'
import ReleaseResultsToggle from '@/components/diagnostic/ReleaseResultsToggle'

export default async function DiagnosticAttemptDetailPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>
}) {
  const { testId, attemptId } = await params
  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id')
    .eq('id', attemptId)
    .eq('diagnostic_test_id', testId)
    .maybeSingle()
  if (!attempt) notFound()

  const [{ data: lead }, lookup] = await Promise.all([
    admin.from('diagnostic_leads').select('student_name, student_email, parent_name, parent_email, parent_phone').eq('id', attempt.lead_id).maybeSingle(),
    getDiagnosticResult(attemptId),
  ])

  if (lookup.status !== 'completed') {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline block mb-4">← Back to test dashboard</Link>
        <p className="text-gray-500">This attempt hasn&rsquo;t been completed yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline">← Back to test dashboard</Link>
        <ReleaseResultsToggle attemptId={attemptId} released={lookup.result.resultsReleased} />
      </div>

      {lead && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-2">Contact Info</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Student:</span> {lead.student_name} · {lead.student_email}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Parent/Guardian:</span> {lead.parent_name} · {lead.parent_email} · {lead.parent_phone}</p>
          <div className="mt-3">
            <EmailResultButton
              attemptId={attemptId}
              studentEmail={lead.student_email}
              parentEmail={lead.parent_email}
              studentName={lead.student_name}
              weakTopics={lookup.result.advice.map(a => a.topicTitle)}
            />
          </div>
        </div>
      )}

      {/* A plain fact, not an accusation — tab/window focus loss is a weak,
          high-false-positive signal (checking a calculator, a notification,
          accidental alt-tab all trigger it too), so it's shown here as a
          neutral count, on the teacher page only, never labeled "cheating"
          and never shown to the student. */}
      {(lookup.result.tabSwitchCount > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
          <span className="text-lg">🔀</span>
          <p className="text-sm text-gray-600">
            Left the test tab <span className="font-semibold text-gray-800">{lookup.result.tabSwitchCount}</span> time{lookup.result.tabSwitchCount === 1 ? '' : 's'}
            {lookup.result.tabSwitchSeconds > 0 && <> · <span className="font-semibold text-gray-800">{lookup.result.tabSwitchSeconds}s</span> total away</>}
          </p>
        </div>
      )}

      <DiagnosticResultSummary result={lookup.result} teacherView attemptId={attemptId} />
    </div>
  )
}
