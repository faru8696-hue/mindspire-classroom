-- Allow students to read feedback on their own submissions
CREATE POLICY IF NOT EXISTS "students_read_own_feedback"
ON feedback FOR SELECT
USING (
  submission_id IN (
    SELECT id FROM submissions WHERE student_id = auth.uid()
  )
);

-- Enable realtime on feedback table so students receive live grade updates
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;

-- Also ensure submissions realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
