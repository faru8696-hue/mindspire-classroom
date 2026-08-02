-- Points-based teacher grading for FRQ answers in the Tests system. Total
-- possible points live on the question (diagnostic_questions.points); the
-- teacher enters how many points the student earned per answer
-- (diagnostic_attempt_answers.points_earned). Read live (not frozen), so
-- grading can happen any time after the attempt completes.
alter table diagnostic_questions add column if not exists points integer;
alter table diagnostic_attempt_answers add column if not exists points_earned numeric;

-- Superseded by points_earned above — drop if an earlier version of this
-- migration (grade text: correct/partial/incorrect) was already applied.
alter table diagnostic_attempt_answers drop column if exists grade;
