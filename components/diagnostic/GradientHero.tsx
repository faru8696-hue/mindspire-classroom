// Full-bleed gradient backdrop with a centered white card — the landing/
// intake/results container style used across every public diagnostic page.
export default function GradientHero({ children, maxWidth = 'max-w-lg' }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} p-8`}>
        {children}
      </div>
    </div>
  )
}
