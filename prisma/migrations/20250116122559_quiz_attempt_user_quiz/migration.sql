/*
  Warnings:

  - A unique constraint covering the columns `[userId,quizId]` on the table `QuizAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_userId_quizId_key" ON "QuizAttempt"("userId", "quizId");
