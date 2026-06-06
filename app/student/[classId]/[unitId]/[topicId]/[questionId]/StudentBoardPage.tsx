'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'
import ZoomableImage from '@/components/ZoomableImage'

interface Props {
  questionId: string
  studentId: string
  classId: string
  studentName: string
  questionTitle: string
  questionContent: string | null
  questionImageUrl: string | null
  submissionId: string | null
  initialStudentData: string | null
  initialTeacherData: string | null
}

const GRADE_LABEL: Record<string, { text: string; cls: string }> = {
  correct:   { text: '✓ Correct!',         cls: 'bg-green-500 text-white' },
  partial:   { text: '~ Partially correct', cls: 'bg-amber-400 text-white' },
  discussed: { text: '💬 Discussed',        cls: 'bg-blue-500 text-white' },
  incorrect: { text: '✗ Incorrect',         cls: 'bg-red-500 text-white' },
  needsmore: { text: '🔄 Needs more work',  cls: 'bg-purple-600 text-white' },
  comment:    { text: '💬 Teacher comment',   cls: 'bg-blue-600 text-white' },
  assignment: { text: '📋 New question!',    cls: 'bg-purple-600 text-white' },
}

export default function StudentBoardPage({
  questionId, studentId, classId, studentName, questionTitle, questionContent, questionImageUrl,
  submissionId: initialSubmissionId, initialStudentData, initialTeacherData,
}: Props) {
  const supabase = createClient()
  const [helpSent, setHelpSent] = useState(false)
  const [doneSent, setDoneSent] = useState(false)
  const [questionCollapsed, setQuestionCollapsed] = useState(false)
  const [gradeToast, setGradeToast] = useState<{ grade: string; feedback: string } | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(initialSubmissionId ?? null)
  const channelRef = useRef(supabase.channel('teacher-alerts'))
  const audioRef = useRef<AudioContext | null>(null)

  function playTone(freq: number, duration = 0.4) {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const play = () => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.start(); osc.stop(ctx.currentTime + duration)
      }
      if (ctx.state === 'suspended') { ctx.resume().then(play) } else { play() }
    } catch {}
  }

  // Subscribe the alert broadcast channel so send() works
  useEffect(() => {
    channelRef.current.subscribe()
    return () => { supabase.removeChannel(channelRef.current) }
  }, [])

  // Listen for grade + comment notifications via student_notifications table
  useEffect(() => {
    const ch = supabase.channel(`student-notifs:${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'student_notifications',
      }, (payload) => {
        const row = payload.new as { student_id: string; question_id: string; grade: string | null; feedback: string | null; type?: string }
        if (row.student_id !== studentId) return
        if (row.type === 'assignment') {
          playTone(520)
          setGradeToast({ grade: 'assignment', feedback: row.feedback ?? 'New question assigned' })
          setTimeout(() => setGradeToast(null), 8000)
        } else if (row.type === 'comment' || !row.grade) {
          playTone(740)
          setGradeToast({ grade: 'comment', feedback: row.feedback ?? 'Teacher left a comment' })
          setTimeout(() => setGradeToast(null), 8000)
        } else {
          setGradeToast({ grade: row.grade, feedback: row.feedback ?? '' })
          playTone(row.grade === 'correct' ? 660 : row.grade === 'partial' ? 520 : 330)
          setTimeout(() => setGradeToast(null), 8000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [studentId])

  async function saveStudent(dataUrl: string) {
    const { data } = await supabase.from('submissions').upsert({
      question_id: questionId,
      student_id: studentId,
      canvas_data: dataUrl,
      text_answer: null,
      image_url: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'question_id,student_id' }).select('id').single()
    if (data?.id && !submissionId) setSubmissionId(data.id)
  }

  async function sendAlert(type: 'help' | 'submitted') {
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase.from('notifications').insert({
      type, student_id: studentId, question_id: questionId, class_id: classId,
    }).select('id').single()
    if (error) console.error('notification insert error:', error)
    await channelRef.current.send({
      type: 'broadcast', event: 'student-alert',
      payload: {
        id: inserted?.id ?? crypto.randomUUID(),
        type, student_id: studentId, question_id: questionId, class_id: classId,
        created_at: now, read: false, student_name: studentName, question_title: questionTitle,
      },
    })
  }

  async function handleHelp() {
    await sendAlert('help')
    setHelpSent(true)
    setTimeout(() => setHelpSent(false), 5000)
  }

  async function handleDone() {
    await sendAlert('submitted')
    setDoneSent(true)
    setTimeout(() => setDoneSent(false), 5000)
  }

  return (
    <div className="flex flex-col h-full gap-2 relative">
      {/* Question — AP exam paper style */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm flex-shrink-0 overflow-hidden flex flex-col max-h-[45%]">
        {/* Paper header strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Question</span>
            <span className="w-px h-3 bg-gray-300" />
            <span className="text-xs text-gray-400 font-medium">Show all work for full credit</span>
          </div>
          <button
            onClick={() => setQuestionCollapsed(c => !c)}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            {questionCollapsed ? '▼ expand' : '▲ collapse'}
          </button>
        </div>

        {!questionCollapsed && (
          <div className="px-5 py-4 overflow-y-auto">
            <p className="text-[15px] font-semibold text-gray-900 leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {questionTitle}
            </p>
            {questionContent && (
              <p className="mt-2 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {questionContent}
              </p>
            )}
            {questionImageUrl && (
              <ZoomableImage src={questionImageUrl} alt="Question diagram" className="mt-3 max-w-full max-h-56 rounded-lg border border-gray-200 object-contain" />
            )}
          </div>
        )}
      </div>

      {/* Grade toast notification */}
      {gradeToast && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce ${GRADE_LABEL[gradeToast.grade]?.cls ?? 'bg-gray-800 text-white'}`}>
          <span>{GRADE_LABEL[gradeToast.grade]?.text ?? gradeToast.grade}</span>
          {gradeToast.feedback && <span className="opacity-90 font-normal">— {gradeToast.feedback}</span>}
          <button onClick={() => setGradeToast(null)} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <InfiniteWhiteboard
          questionId={questionId}
          studentId={studentId}
          role="student"
          initialStudentData={initialStudentData}
          initialTeacherData={initialTeacherData}
          onSaveStudent={saveStudent}
        />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={handleHelp}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
            helpSent ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
          }`}
        >
          {helpSent ? '🙋 Help request sent!' : '🙋 Get Help'}
        </button>
        <button
          onClick={handleDone}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
            doneSent ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {doneSent ? '✅ Teacher notified!' : '✓ Done — Check my work'}
        </button>
      </div>
    </div>
  )
}
