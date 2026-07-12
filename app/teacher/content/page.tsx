'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AnswerKeyPanel from '@/components/AnswerKeyPanel'

interface Class { id: string; title: string; order_index: number }
interface Unit { id: string; title: string; class_id: string }
interface Topic { id: string; title: string; unit_id: string }
interface Question { id: string; title: string; content: string | null; image_url: string | null; answer_key: string | null; topic_id: string }

export default function ContentPage() {
  const supabase = createClient()
  const [classes, setClasses] = useState<Class[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [newClass, setNewClass] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newQuestion, setNewQuestion] = useState<{ title: string; content: string; image_url: string | null }>({ title: '', content: '', image_url: null })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
    loadClasses()
  }, [])

  async function loadClasses() {
    const { data } = await supabase.from('classes').select('*').order('order_index')
    setClasses(data ?? [])
  }

  async function loadUnits(classId: string) {
    const { data } = await supabase.from('units').select('*').eq('class_id', classId).order('order_index')
    setUnits(data ?? [])
    setSelectedUnit(null); setTopics([]); setQuestions([])
  }

  async function loadTopics(unitId: string) {
    const { data } = await supabase.from('topics').select('*').eq('unit_id', unitId).order('order_index')
    setTopics(data ?? [])
    setSelectedTopic(null); setQuestions([])
  }

  async function loadQuestions(topicId: string) {
    const { data } = await supabase.from('questions').select('*').eq('topic_id', topicId).order('order_index')
    setQuestions(data ?? [])
  }

  async function addClass() {
    if (!newClass.trim() || !userId) return
    await supabase.from('classes').insert({ title: newClass.trim(), order_index: classes.length, created_by: userId })
    setNewClass(''); loadClasses()
  }

  async function addUnit() {
    if (!newUnit.trim() || !selectedClass || !userId) return
    await supabase.from('units').insert({ title: newUnit.trim(), class_id: selectedClass, order_index: units.length, created_by: userId })
    setNewUnit(''); loadUnits(selectedClass)
  }

  async function addTopic() {
    if (!newTopic.trim() || !selectedUnit) return
    await supabase.from('topics').insert({ title: newTopic.trim(), unit_id: selectedUnit, order_index: topics.length })
    setNewTopic(''); loadTopics(selectedUnit)
  }

  async function handleQuestionImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingImage(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('question-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      setNewQuestion(q => ({ ...q, image_url: data.publicUrl }))
    } else {
      alert(`Image upload failed: ${error.message}`)
    }
    setUploadingImage(false)
    e.target.value = ''
  }

  async function addQuestion() {
    if (!newQuestion.title.trim() || !selectedTopic) return
    await supabase.from('questions').insert({ title: newQuestion.title.trim(), content: newQuestion.content || null, image_url: newQuestion.image_url, topic_id: selectedTopic, order_index: questions.length })
    setNewQuestion({ title: '', content: '', image_url: null }); loadQuestions(selectedTopic)
  }

  async function del(table: string, id: string, cb: () => void) {
    await (supabase.from(table as any) as any).delete().eq('id', id)
    cb()
  }

  const col = 'bg-white rounded-xl border border-gray-200 p-4 flex flex-col'
  const input = 'flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400'
  const addBtn = 'bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700'
  const item = (active: boolean) => `flex items-center justify-between p-2 rounded-lg cursor-pointer ${active ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-50'}`

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">Course Content</h1>
      <div className="grid grid-cols-4 gap-3">

        {/* Classes */}
        <div className={col}>
          <h2 className="font-bold text-gray-800 mb-3">Classes</h2>
          <div className="flex gap-2 mb-3">
            <input value={newClass} onChange={e => setNewClass(e.target.value)} onKeyDown={e => e.key === 'Enter' && addClass()} placeholder="Class name..." className={input} />
            <button onClick={addClass} className={addBtn}>+</button>
          </div>
          <div className="space-y-1 overflow-y-auto">
            {classes.map(c => (
              <div key={c.id} className={item(selectedClass === c.id)} onClick={() => { setSelectedClass(c.id); loadUnits(c.id) }}>
                <span className="text-sm font-medium truncate">{c.title}</span>
                <button onClick={e => { e.stopPropagation(); del('classes', c.id, loadClasses) }} className="text-gray-400 hover:text-red-500 ml-2 text-xs flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className={col}>
          <h2 className="font-bold text-gray-800 mb-3">Units {selectedClass && <span className="text-gray-400 font-normal text-xs">— {classes.find(c => c.id === selectedClass)?.title}</span>}</h2>
          {selectedClass ? (
            <>
              <div className="flex gap-2 mb-3">
                <input value={newUnit} onChange={e => setNewUnit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUnit()} placeholder="Unit name..." className={input} />
                <button onClick={addUnit} className={addBtn}>+</button>
              </div>
              <div className="space-y-1 overflow-y-auto">
                {units.map(u => (
                  <div key={u.id} className={item(selectedUnit === u.id)} onClick={() => { setSelectedUnit(u.id); loadTopics(u.id) }}>
                    <span className="text-sm font-medium truncate">{u.title}</span>
                    <button onClick={e => { e.stopPropagation(); del('units', u.id, () => loadUnits(selectedClass!)) }} className="text-gray-400 hover:text-red-500 ml-2 text-xs flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm">Select a class</p>}
        </div>

        {/* Topics */}
        <div className={col}>
          <h2 className="font-bold text-gray-800 mb-3">Topics {selectedUnit && <span className="text-gray-400 font-normal text-xs">— {units.find(u => u.id === selectedUnit)?.title}</span>}</h2>
          {selectedUnit ? (
            <>
              <div className="flex gap-2 mb-3">
                <input value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} placeholder="Topic name..." className={input} />
                <button onClick={addTopic} className={addBtn}>+</button>
              </div>
              <div className="space-y-1 overflow-y-auto">
                {topics.map(t => (
                  <div key={t.id} className={item(selectedTopic === t.id)} onClick={() => { setSelectedTopic(t.id); loadQuestions(t.id) }}>
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <button onClick={e => { e.stopPropagation(); del('topics', t.id, () => loadTopics(selectedUnit!)) }} className="text-gray-400 hover:text-red-500 ml-2 text-xs flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm">Select a unit</p>}
        </div>

        {/* Questions */}
        <div className={col}>
          <h2 className="font-bold text-gray-800 mb-3">Questions {selectedTopic && <span className="text-gray-400 font-normal text-xs">— {topics.find(t => t.id === selectedTopic)?.title}</span>}</h2>
          {selectedTopic ? (
            <>
              <div className="space-y-2 mb-3">
                <input value={newQuestion.title} onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })} placeholder="Question title..." className={`w-full ${input}`} />
                <textarea value={newQuestion.content} onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })} placeholder="Details (optional)..." rows={2} className={`w-full ${input} resize-none`} />
                {newQuestion.image_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newQuestion.image_url} alt="Question" className="w-full rounded-lg border border-gray-200 max-h-40 object-contain bg-gray-50" />
                    <button onClick={() => setNewQuestion(q => ({ ...q, image_url: null }))} className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-gray-600 hover:text-red-500 text-xs shadow flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <label className="block w-full text-center border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer hover:border-purple-400 hover:text-purple-600">
                    {uploadingImage ? 'Uploading…' : '📷 Add image (optional)'}
                    <input type="file" accept="image/*" onChange={handleQuestionImage} className="hidden" />
                  </label>
                )}
                <button onClick={addQuestion} disabled={uploadingImage} className={`w-full ${addBtn} py-2 disabled:opacity-50`}>Add Question</button>
              </div>
              <div className="space-y-1 overflow-y-auto">
                {questions.map(q => (
                  <div key={q.id} className="p-2 rounded-lg hover:bg-purple-50 group space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Link href={`/teacher/questions/${q.id}`} className="text-sm font-medium text-gray-800 hover:text-purple-700 truncate block">{q.title}</Link>
                        {q.content && <p className="text-xs text-gray-400 truncate">{q.content}</p>}
                      </div>
                      <button onClick={() => del('questions', q.id, () => loadQuestions(selectedTopic!))} className="text-gray-400 hover:text-red-500 text-xs ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                    <AnswerKeyPanel questionId={q.id} initialAnswerKey={q.answer_key} />
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm">Select a topic</p>}
        </div>

      </div>
    </div>
  )
}
