-- Data Migration: Preserve important data transformations from legacy migrations
-- This migration contains essential data seeding and transformations that must be preserved

-- From: 20251017_add_quiz_type_badges
-- Insert quiz type badges (essential for gamification features)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES
  ('quiz-type-multiple-choice', 'Multiple Choice Master', 'Complete 10 multiple choice quizzes', 'quiz_type', '🎯', 10, 'bronze'),
  ('quiz-type-open-ended', 'Open Mind', 'Complete 10 open-ended quizzes', 'quiz_type', '🧠', 10, 'bronze'),
  ('quiz-type-blanks', 'Fill Master', 'Complete 10 blanks quizzes', 'quiz_type', '📝', 10, 'bronze'),
  ('quiz-type-ordering', 'Order Expert', 'Complete 10 ordering quizzes', 'quiz_type', '🔢', 10, 'bronze'),
  ('quiz-type-flashcard', 'Memory Champion', 'Complete 10 flashcard reviews', 'quiz_type', '🃏', 10, 'bronze')
ON CONFLICT (id) DO NOTHING;

-- Update existing badges to fix category issues (from 20251017_add_quiz_type_badges)
UPDATE "Badge"
SET category = 'quiz_type'
WHERE id LIKE 'quiz-type-%' AND category != 'quiz_type';

-- From: 20251020_add_ordering_quiz_tables
-- Migrate existing ordering quiz data from UserQuiz to OrderingQuiz tables
-- Only run if UserQuiz table exists and has the required structure
DO $$
BEGIN
    -- Check if UserQuiz table exists and has required columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'UserQuiz' AND column_name = 'userId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'UserQuiz' AND column_name = 'metadata'
    ) THEN
        -- Migrate ordering quizzes
        INSERT INTO "OrderingQuiz" (slug, title, description, topic, difficulty, "isPublic", "createdBy", "createdAt", "updatedAt")
        SELECT
          uq.slug,
          uq.title,
          uq.description,
          COALESCE((uq.metadata->>'topic')::text, 'General'),
          COALESCE((uq.metadata->>'difficulty')::text, 'medium'),
          uq."isPublic",
          uq."userId",
          uq."createdAt",
          uq."updatedAt"
        FROM "UserQuiz" uq
        WHERE uq."quizType" = 'ordering'
          AND uq.metadata IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "OrderingQuiz" oq WHERE oq.slug = uq.slug
          );

        -- Migrate ordering quiz questions
        INSERT INTO "OrderingQuizQuestion" ("orderingQuizId", title, description, steps, "correctOrder", "orderIndex", "createdAt", "updatedAt")
        SELECT
          oq.id,
          COALESCE((question->>'title')::text, 'Question'),
          (question->>'description')::text,
          (question->'steps')::jsonb,
          (question->'correctOrder')::jsonb,
          ROW_NUMBER() OVER (PARTITION BY oq.id ORDER BY question_index) as "orderIndex",
          uq."createdAt",
          uq."updatedAt"
        FROM "UserQuiz" uq
        CROSS JOIN LATERAL jsonb_array_elements(uq.metadata::jsonb) WITH ORDINALITY AS t(question, question_index)
        INNER JOIN "OrderingQuiz" oq ON oq.slug = uq.slug
        WHERE uq."quizType" = 'ordering'
          AND uq.metadata IS NOT NULL
          AND (question->>'type')::text = 'ordering'
          AND question->'steps' IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM "OrderingQuizQuestion" oqq
            WHERE oqq."orderingQuizId" = oq.id
              AND oqq.title = COALESCE((question->>'title')::text, 'Question')
          );
    END IF;
END $$;