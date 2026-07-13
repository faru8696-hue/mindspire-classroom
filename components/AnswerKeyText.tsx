import { Fragment } from 'react'

// Answer keys store dimensional-analysis conversion factors using a lightweight
// marker syntax — [[frac:numerator|denominator]] — instead of raw HTML, so the
// text stays plain/portable (safe to store, safe to drop into a PDF later) while
// still rendering as a real stacked fraction (line over line, horizontal bar)
// wherever it's displayed in the app.
const FRACTION_RE = /\[\[frac:([^|]+)\|([^\]]+)\]\]/g

export default function AnswerKeyText({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  FRACTION_RE.lastIndex = 0

  while ((match = FRACTION_RE.exec(text))) {
    if (match.index > lastIndex) parts.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>)
    const [, num, den] = match
    parts.push(
      <span
        key={key++}
        className="inline-flex flex-col items-center align-middle text-center mx-0.5"
        style={{ fontSize: '0.85em', lineHeight: 1.15, verticalAlign: 'middle' }}
      >
        <span className="px-0.5">{num.trim()}</span>
        <span className="border-t border-current w-full" />
        <span className="px-0.5">{den.trim()}</span>
      </span>
    )
    lastIndex = FRACTION_RE.lastIndex
  }
  if (lastIndex < text.length) parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>)

  return <p className={className}>{parts}</p>
}
