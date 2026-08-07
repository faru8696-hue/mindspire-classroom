import { notFound, redirect } from 'next/navigation'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import DiagnosticResultSummary from '@/components/diagnostic/DiagnosticResultSummary'
import CompleteLeadProfileForm from '@/components/diagnostic/CompleteLeadProfileForm'

export const dynamic = 'force-dynamic'

export default async function DiagnosticResultsPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>
}) {
  const { slug, attemptId } = await params
  const lookup = await getDiagnosticResult(attemptId)

  if (lookup.status === 'not_found') notFound()
  if (lookup.status === 'in_progress') redirect(`/diagnostic/${slug}/take/${attemptId}`)

  // Score/breakdown stay hidden from the student until their teacher
  // reviews and releases them — see lib/diagnosticResult.ts.
  if (!lookup.result.resultsReleased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 py-10 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Test submitted!</h2>
          <p className="text-sm text-gray-600">
            Your answers have been recorded. Your teacher will share your results with you once they&rsquo;ve had a chance to review them.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 py-10">
      {!lookup.result.studentName && <CompleteLeadProfileForm attemptId={attemptId} />}
      <DiagnosticResultSummary result={lookup.result} />
    </div>
  )
}
