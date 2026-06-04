'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BoardImage {
  id: string
  image_path: string
  order_index: number
  signedUrl: string
}

interface Props {
  questionId: string
  studentId: string
  readOnly?: boolean
}

export default function QuestionBoard({ questionId, studentId, readOnly = false }: Props) {
  const supabase = createClient()
  const [images, setImages] = useState<BoardImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [fullscreen, setFullscreen] = useState<string | null>(null)

  useEffect(() => { loadImages() }, [questionId, studentId])

  async function loadImages() {
    const { data } = await supabase
      .from('board_images')
      .select('*')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .order('order_index')

    if (!data?.length) { setImages([]); return }

    const withUrls = await Promise.all(
      data.map(async img => {
        const { data: url } = await supabase.storage.from('submissions').createSignedUrl(img.image_path, 3600)
        return { ...img, signedUrl: url?.signedUrl ?? '' }
      })
    )
    setImages(withUrls.filter(i => i.signedUrl))
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `${studentId}/board/${questionId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('submissions').upload(path, file)
      if (!error) {
        await supabase.from('board_images').insert({
          question_id: questionId,
          student_id: studentId,
          image_path: path,
          order_index: images.length + i,
        })
      }
    }
    setUploading(false)
    e.target.value = ''
    loadImages()
  }

  async function deleteImage(id: string, path: string) {
    await supabase.storage.from('submissions').remove([path])
    await supabase.from('board_images').delete().eq('id', id)
    loadImages()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">📋 {readOnly ? 'Student\'s Board' : 'Your Board'}</h3>
        {!readOnly && (
          <label className={`px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg cursor-pointer hover:bg-purple-700 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? 'Uploading...' : '+ Add Photos'}
            <input type="file" accept="image/*" multiple capture="environment" onChange={uploadImage} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>

      {images.length === 0 ? (
        <div className={`border-2 border-dashed border-gray-200 rounded-xl p-8 text-center ${readOnly ? '' : 'cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors'}`}>
          {readOnly ? (
            <p className="text-gray-400 text-sm">No photos uploaded yet</p>
          ) : (
            <label className="cursor-pointer block">
              <p className="text-4xl mb-2">📷</p>
              <p className="text-gray-500 text-sm font-medium">Upload photos of your work</p>
              <p className="text-gray-400 text-xs mt-1">You can add multiple photos</p>
              <input type="file" accept="image/*" multiple capture="environment" onChange={uploadImage} className="hidden" />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={img.signedUrl}
                alt="Board photo"
                className="w-full object-contain max-h-56 cursor-zoom-in"
                onClick={() => setFullscreen(img.signedUrl)}
              />
              {!readOnly && (
                <button
                  onClick={() => deleteImage(img.id, img.image_path)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow"
                >✕</button>
              )}
            </div>
          ))}
          {!readOnly && (
            <label className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors min-h-32">
              <span className="text-3xl">📷</span>
              <span className="text-xs text-gray-500 mt-1">Add more</span>
              <input type="file" accept="image/*" multiple capture="environment" onChange={uploadImage} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setFullscreen(null)}>
          <img src={fullscreen} alt="Full size" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-3xl font-bold">✕</button>
        </div>
      )}
    </div>
  )
}
