import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GradientHero from '@/components/diagnostic/GradientHero'
import DiagnosticIntakeForm from '@/components/diagnostic/DiagnosticIntakeForm'

// Public, no auth check — mirrors app/register/page.tsx as the only other
// no-session route in this app. Fully open, no enrollment required.
export default async function DiagnosticLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('title, description, question_count_per_attempt, duration_minutes')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!test) notFound()

  return (
    <GradientHero>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
          <span className="text-3xl">🧪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
        <p className="text-gray-500 text-sm mt-1">Mindspire Lab</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-5 mb-6 text-left space-y-2">
        {test.description && <p className="text-sm text-blue-800 mb-2">{test.description}</p>}
        <p className="text-sm text-blue-800"><span className="mr-2">✓</span>{test.question_count_per_attempt} multiple-choice questions</p>
        <p className="text-sm text-blue-800"><span className="mr-2">✓</span>Instant results with a topic-by-topic breakdown</p>
        <p className="text-sm text-blue-800"><span className="mr-2">✓</span>Downloadable PDF report with personalized prep advice</p>
        <p className="text-sm text-blue-800"><span className="mr-2">⏱</span>~{test.duration_minutes} minutes recommended</p>
        <p className="text-sm text-blue-800"><span className="mr-2">🆓</span>Completely free — open to everyone</p>
      </div>

      <DiagnosticIntakeForm slug={slug} />
    </GradientHero>
  )
}
