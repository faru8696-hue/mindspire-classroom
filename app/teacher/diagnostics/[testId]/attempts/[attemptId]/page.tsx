import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import DiagnosticResultSummary from '@/components/diagnostic/DiagnosticResultSummary'

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
      <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline block mb-4">← Back to test dashboard</Link>

      {lead && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-2">Contact Info</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Student:</span> {lead.student_name} · {lead.student_email}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Parent/Guardian:</span> {lead.parent_name} · {lead.parent_email} · {lead.parent_phone}</p>
        </div>
      )}

      <DiagnosticResultSummary result={lookup.result} />
    </div>
  )
}
