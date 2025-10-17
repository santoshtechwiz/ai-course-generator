-- ============================================
-- Badge System Expansion for All Quiz Types
-- Adds achievements for MCQ, Blanks, Open-ended, and Code quizzes
-- ============================================

-- Add quiz completion badges (all types)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES 
  -- MCQ Badges
  ('mcq-10', 'MCQ Novice', 'Complete 10 MCQ quizzes', 'quiz_completion', '📝', 10, 'bronze'),
  ('mcq-25', 'MCQ Expert', 'Complete 25 MCQ quizzes', 'quiz_completion', '🎯', 25, 'silver'),
  ('mcq-50', 'MCQ Master', 'Complete 50 MCQ quizzes', 'quiz_completion', '🏆', 50, 'gold'),
  
  -- Blanks Badges
  ('blanks-10', 'Blanks Beginner', 'Complete 10 Fill-in-the-Blanks quizzes', 'quiz_completion', '✍️', 10, 'bronze'),
  ('blanks-25', 'Blanks Pro', 'Complete 25 Fill-in-the-Blanks quizzes', 'quiz_completion', '📋', 25, 'silver'),
  ('blanks-50', 'Blanks Champion', 'Complete 50 Fill-in-the-Blanks quizzes', 'quiz_completion', '🎖️', 50, 'gold'),
  
  -- Open-ended Badges
  ('openended-10', 'Critical Thinker', 'Complete 10 Open-ended quizzes', 'quiz_completion', '💭', 10, 'bronze'),
  ('openended-25', 'Deep Analyst', 'Complete 25 Open-ended quizzes', 'quiz_completion', '🧠', 25, 'silver'),
  ('openended-50', 'Master Analyst', 'Complete 50 Open-ended quizzes', 'quiz_completion', '🎓', 50, 'gold'),
  
  -- Code Badges
  ('code-10', 'Code Cadet', 'Complete 10 Coding quizzes', 'quiz_completion', '💻', 10, 'bronze'),
  ('code-25', 'Code Wizard', 'Complete 25 Coding quizzes', 'quiz_completion', '⚡', 25, 'silver'),
  ('code-50', 'Code Architect', 'Complete 50 Coding quizzes', 'quiz_completion', '🚀', 50, 'gold'),
  
  -- Perfect Score Badges (all types)
  ('perfect-mcq', 'Perfect MCQ', 'Score 100% on an MCQ quiz', 'quiz_accuracy', '⭐', 1, 'gold'),
  ('perfect-blanks', 'Perfect Blanks', 'Score 100% on a Fill-in-the-Blanks quiz', 'quiz_accuracy', '⭐', 1, 'gold'),
  ('perfect-openended', 'Perfect Analysis', 'Score 100% on an Open-ended quiz', 'quiz_accuracy', '⭐', 1, 'gold'),
  ('perfect-code', 'Perfect Code', 'Score 100% on a Coding quiz', 'quiz_accuracy', '⭐', 1, 'gold'),
  
  -- Total Quiz Achievement Badges
  ('total-quiz-50', 'Quiz Enthusiast', 'Complete 50 quizzes of any type', 'quiz_completion', '🌟', 50, 'bronze'),
  ('total-quiz-100', 'Quiz Expert', 'Complete 100 quizzes of any type', 'quiz_completion', '💫', 100, 'silver'),
  ('total-quiz-250', 'Quiz Master', 'Complete 250 quizzes of any type', 'quiz_completion', '👑', 250, 'gold'),
  ('total-quiz-500', 'Quiz Legend', 'Complete 500 quizzes of any type', 'quiz_completion', '🏅', 500, 'platinum')
ON CONFLICT (id) DO NOTHING;

-- Update existing badges to fix "Flashcard" only issue
UPDATE "Badge" 
SET category = 'flashcard_reviews'
WHERE category = 'reviews';

UPDATE "Badge" 
SET category = 'flashcard_mastery'
WHERE category = 'mastery';

UPDATE "Badge" 
SET category = 'flashcard_streak'
WHERE category = 'streak';

-- Comment on the new categories
COMMENT ON TABLE "Badge" IS 'Achievement badges for all quiz types and activities';
