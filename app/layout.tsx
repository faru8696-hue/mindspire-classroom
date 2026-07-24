import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://classroom.mindspirelab.com'),
  title: 'Mindspire Lab Classroom',
  description: 'Interactive chemistry classroom by Mindspire Lab',
  openGraph: {
    title: 'Mindspire Lab Classroom',
    description: 'Interactive chemistry classroom by Mindspire Lab',
    siteName: 'Mindspire Lab Classroom',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mindspire Lab Classroom',
    description: 'Interactive chemistry classroom by Mindspire Lab',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
