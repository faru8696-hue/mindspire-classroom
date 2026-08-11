import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import { resolveLeadContact } from '@/lib/diagnosticContact'
import DiagnosticResultSummary from '@/components/diagnostic/DiagnosticResultSummary'
import EmailResultButton from '@/components/diagnostic/EmailResultButton'
import ReleaseResultsToggle from '@/components/diagnostic/ReleaseResultsToggle'
import OvertimeReviewPanel from '@/components/diagnostic/OvertimeReviewPanel'
import IntegrityWaiverPanel from '@/components/diagnostic/IntegrityWaiverPanel'

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

  const [lead, lookup] = await Promise.all([
    resolveLeadContact(admin, attempt.lead_id),
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

      {lookup.result.submittedLate && (
        <OvertimeReviewPanel
          attemptId={attemptId}
          overtimeSeconds={lookup.result.overtimeSeconds}
          overtimeAccepted={lookup.result.overtimeAccepted}
        />
      )}

      <IntegrityWaiverPanel
        attemptId={attemptId}
        tabSwitchCount={lookup.result.tabSwitchCount}
        tabSwitchSeconds={lookup.result.tabSwitchSeconds}
        rawDeductionPct={lookup.result.integrityRawDeductionPct}
        likelyCheating={lookup.result.integrityLikelyCheating}
        waived={lookup.result.integrityDeductionWaived}
      />

      {lead && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-2">Contact Info</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Student:</span> {lead.studentName} · {lead.studentEmail}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Parent/Guardian:</span> {lead.parentName} · {lead.parentEmail} · {lead.parentPhone}</p>
          <div className="mt-3">
            <EmailResultButton
              attemptId={attemptId}
              studentEmail={lead.studentEmail}
              parentEmail={lead.parentEmail}
              studentName={lead.studentName}
              weakTopics={lookup.result.advice.map(a => a.topicTitle)}
              hasFrq={!!lookup.result.frqScore}
              tabSwitchCount={lookup.result.tabSwitchCount}
            />
          </div>
        </div>
      )}

      <DiagnosticResultSummary result={lookup.result} teacherView attemptId={attemptId} />
    </div>
  )
}
