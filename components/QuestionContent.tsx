// A lot of older questions have multiple-choice options typed straight into
// the content field as one run-on line ("... (A) opt1 (B) opt2 (C) opt3"),
// which renders as an unreadable wall of text. This splits on the "(A)"/
// "(B)"/etc markers and lays each option on its own line — purely a display
// fix, doesn't touch the stored content.
export default function QuestionContent({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(?=\([A-F]\)\s)/g).map(p => p.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return <p className={className}>{text}</p>
  }
  const [intro, ...options] = parts
  return (
    <div className={className}>
      {intro && <p>{intro}</p>}
      <ul className="mt-1.5 space-y-1 list-none pl-0">
        {options.map((opt, i) => (
          <li key={i} className="pl-1">{opt}</li>
        ))}
      </ul>
    </div>
  )
}
