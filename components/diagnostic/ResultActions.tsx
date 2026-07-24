'use client'

import { useState } from 'react'
import { downloadDiagnosticPdf, type DiagnosticPdfData } from '@/lib/diagnostic-pdf'

export default function ResultActions({ pdfData }: { pdfData: DiagnosticPdfData }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadDiagnosticPdf(pdfData)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50"
    >
      {downloading ? 'Preparing PDF…' : 'Download PDF Report'}
    </button>
  )
}
