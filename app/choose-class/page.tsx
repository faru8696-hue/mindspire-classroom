'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Class { id: string; title: string; order_index: number }

const CLASS_INFO: Record<string, { icon: string; subtitle: string; who: string; color: string }> = {
  'honors chem': {
    icon: '🧪',
    subtitle: 'Honors Chemistry',
    who: 'For students currently taking regular chemistry or honors chemistry.',
    color: 'border-blue-400 bg-blue-50',
  },
  'ap chem': {
    icon: '⚗️',
    subtitle: 'AP Chemistry',
    who: 'For students taking AP Chemistry with no prior chemistry background.',
    color: 'border-purple-400 bg-purple-50',
  },
  'ap chem advanced': {
    icon: '🔬',
    subtitle: 'AP Chemistry — Advanced',
    who: 'For students who have previously completed regular or honors chemistry.',
    color: 'border-green-400 bg-green-50',
  },
}

function getInfo(title: string) {
  const key = title.toLowerCase().trim()
  for (const [k, v] of Object.entries(CLASS_INFO)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return { icon: '📚', subtitle: title, who: '', color: 'border-gray-300 bg-gray-50' }
}

export default function ChooseClassPage() {
  const supabase = createClient()
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('classes').select('id, title, order_index').order('order_index').then(({ data }) => {
      setClasses(data ?? [])
    })
  }, [])

  async function apply() {
    if (!selected) return
    setLoading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({ pending_class_id: selected })
      .eq('id', session.user.id)

    if (err) {
      setError('Failed to apply. Please try again.')
      setLoading(false)
      return
    }
    router.push('/pending')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚛️</div>
          <h1 className="text-2xl font-bold text-purple-900">Choose Your Class</h1>
          <p className="text-gray-500 mt-1">Select the class that matches your chemistry level</p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Loading classes...</div>
        ) : (
          <div className="space-y-4 mb-6">
            {classes.map(cls => {
              const info = getInfo(cls.title)
              const isSelected = selected === cls.id
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelected(cls.id)}
                  className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-300'
                      : `${info.color} hover:border-purple-300 hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl flex-shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{cls.title}</h3>
                        {isSelected && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">Selected</span>}
                      </div>
                      <p className="text-sm font-medium text-purple-700 mt-0.5">{info.subtitle}</p>
                      {info.who && <p className="text-sm text-gray-600 mt-1">{info.who}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

        <button
          onClick={apply}
          disabled={!selected || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 text-base"
        >
          {loading ? 'Applying...' : 'Apply to Class →'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your teacher will review your application and approve your access.
        </p>
      </div>
    </div>
  )
}
