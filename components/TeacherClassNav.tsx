'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ClassItem { id: string; title: string }

export default function TeacherClassNav({ classes }: { classes: ClassItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-purple-200 hover:text-white text-sm transition-colors flex items-center gap-1"
      >
        Classes <span className="text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-64 max-h-[70vh] overflow-y-auto bg-white text-gray-800 rounded-xl shadow-2xl z-50 py-1 border border-gray-200">
            {classes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No classes yet</p>
            ) : (
              classes.map(c => (
                <Link
                  key={c.id}
                  href={`/teacher/class/${c.id}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors truncate"
                >
                  {c.title}
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
