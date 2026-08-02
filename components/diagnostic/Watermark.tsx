// Doesn't stop a screenshot (nothing can — see ScratchBoard/DiagnosticTestSession
// comments), but makes any screenshot that DOES get shared traceable back to
// whoever took it. Tiled, low-opacity, rotated text baked into an SVG
// background-image rather than many DOM nodes.
function watermarkSvgUrl(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="140">` +
    `<text x="0" y="90" font-size="14" fill="rgba(15,23,42,0.055)" font-family="sans-serif" ` +
    `transform="rotate(-28 140 70)">${escaped}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none select-none z-10"
      style={{ backgroundImage: `url("${watermarkSvgUrl(text)}")`, backgroundRepeat: 'repeat' }}
    />
  )
}
