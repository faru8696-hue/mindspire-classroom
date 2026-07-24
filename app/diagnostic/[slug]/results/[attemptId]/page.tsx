import { notFound, redirect } from 'next/navigation'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import DiagnosticResultSummary from '@/components/diagnostic/DiagnosticResultSummary'

export default async function DiagnosticResultsPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>
}) {
  const { slug, attemptId } = await params
  const lookup = await getDiagnosticResult(attemptId)

  if (lookup.status === 'not_found') notFound()
  if (lookup.status === 'in_progress') redirect(`/diagnostic/${slug}/take/${attemptId}`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 py-10">
      <DiagnosticResultSummary result={lookup.result} />
    </div>
  )
}
