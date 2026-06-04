import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

export default function InfiniteWhiteboardTestPage() {
  return (
    <div className="w-full h-screen">
      <InfiniteWhiteboard
        questionId="test-question"
        studentId="test-student"
        role="student"
      />
    </div>
  )
}
