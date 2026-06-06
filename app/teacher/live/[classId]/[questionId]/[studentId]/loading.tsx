export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading board...</p>
      </div>
    </div>
  )
}
