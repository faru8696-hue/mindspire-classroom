'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
    >
      🖨 Print / Save as PDF
    </button>
  )
}
