import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function PracticeHomePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase.from('classes').select('title').eq('id', classId).single()

  const [{ data: recentTests }, { count: flagCount }] = await Promise.all([
    supabase.from('practice_tests')
      .select('id, title, question_ids, created_at')
      .eq('student_id', user.id)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('review_flags').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/student/${classId}`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to {cls?.title ?? 'class'}</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-1">Self Study</h1>
      <p className="text-sm text-gray-500 mb-6">Build your own practice test, or review questions you've flagged — self-checked against the answer key, no teacher grading involved.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/student/${classId}/practice/build`}
          className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">📝</div>
          <h2 className="font-bold text-gray-800">Create a Test</h2>
          <p className="text-sm text-gray-500 mt-1">Pick topics and difficulty, build a custom test, and check your own answers.</p>
        </Link>
        <Link
          href={`/student/${classId}/practice/review`}
          className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">🚩</div>
          <h2 className="font-bold text-gray-800">Review Flagged Questions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {flagCount ? `${flagCount} question${flagCount === 1 ? '' : 's'} waiting for review.` : 'Nothing flagged yet — flag any question to save it here.'}
          </p>
        </Link>
      </div>

      {recentTests && recentTests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent tests</h3>
          <div className="space-y-2">
            {recentTests.map(t => (
              <Link
                key={t.id}
                href={`/student/${classId}/practice/session/${t.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-purple-300 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.title}</span>
                <span className="text-xs text-gray-400">{t.question_ids.length} questions · {new Date(t.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
