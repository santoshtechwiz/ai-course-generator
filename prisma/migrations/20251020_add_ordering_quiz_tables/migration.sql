-- CreateTable
CREATE TABLE "OrderingQuiz" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderingQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderingQuizQuestion" (
    "id" SERIAL NOT NULL,
    "orderingQuizId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "correctOrder" JSONB NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderingQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderingQuizAttempt" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "orderingQuizId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderingQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderingQuizAttemptQuestion" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderingQuizAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderingQuiz_slug_key" ON "OrderingQuiz"("slug");

-- CreateIndex
CREATE INDEX "OrderingQuiz_slug_idx" ON "OrderingQuiz"("slug");

-- CreateIndex
CREATE INDEX "OrderingQuiz_difficulty_idx" ON "OrderingQuiz"("difficulty");

-- CreateIndex
CREATE INDEX "OrderingQuiz_createdAt_idx" ON "OrderingQuiz"("createdAt");

-- CreateIndex
CREATE INDEX "OrderingQuiz_isPublic_idx" ON "OrderingQuiz"("isPublic");

-- CreateIndex
CREATE INDEX "OrderingQuizQuestion_orderingQuizId_idx" ON "OrderingQuizQuestion"("orderingQuizId");

-- CreateIndex
CREATE INDEX "OrderingQuizQuestion_orderIndex_idx" ON "OrderingQuizQuestion"("orderIndex");

-- CreateIndex
CREATE INDEX "OrderingQuizAttempt_userId_idx" ON "OrderingQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "OrderingQuizAttempt_orderingQuizId_idx" ON "OrderingQuizAttempt"("orderingQuizId");

-- CreateIndex
CREATE INDEX "OrderingQuizAttempt_completedAt_idx" ON "OrderingQuizAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "OrderingQuizAttempt_score_idx" ON "OrderingQuizAttempt"("score");

-- CreateIndex
CREATE UNIQUE INDEX "OrderingQuizAttemptQuestion_attemptId_questionId_key" ON "OrderingQuizAttemptQuestion"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "OrderingQuizAttemptQuestion_attemptId_idx" ON "OrderingQuizAttemptQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "OrderingQuizAttemptQuestion_questionId_idx" ON "OrderingQuizAttemptQuestion"("questionId");

-- CreateIndex
CREATE INDEX "OrderingQuizAttemptQuestion_isCorrect_idx" ON "OrderingQuizAttemptQuestion"("isCorrect");

-- AddForeignKey
ALTER TABLE "OrderingQuizQuestion" ADD CONSTRAINT "OrderingQuizQuestion_orderingQuizId_fkey" FOREIGN KEY ("orderingQuizId") REFERENCES "OrderingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderingQuizAttempt" ADD CONSTRAINT "OrderingQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderingQuizAttempt" ADD CONSTRAINT "OrderingQuizAttempt_orderingQuizId_fkey" FOREIGN KEY ("orderingQuizId") REFERENCES "OrderingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderingQuizAttemptQuestion" ADD CONSTRAINT "OrderingQuizAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "OrderingQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderingQuizAttemptQuestion" ADD CONSTRAINT "OrderingQuizAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "OrderingQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from UserQuiz metadata to OrderingQuiz tables
-- Only migrate if quiz doesn't already exist (prevent duplicates on re-run)
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

-- Migrate questions from UserQuiz metadata to OrderingQuizQuestion
-- Only migrate questions that don't already exist (prevent duplicates)
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

-- Verification queries (optional - can be run manually to check migration)
-- SELECT COUNT(*) as total_ordering_quizzes FROM "UserQuiz" WHERE "quizType" = 'ordering';
-- SELECT COUNT(*) as migrated_ordering_quizzes FROM "OrderingQuiz";
-- SELECT oq.slug, oq.title, COUNT(oqq.id) as question_count 
-- FROM "OrderingQuiz" oq 
-- LEFT JOIN "OrderingQuizQuestion" oqq ON oqq."orderingQuizId" = oq.id 
-- GROUP BY oq.id, oq.slug, oq.title;
