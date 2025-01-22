/*
  Warnings:

  - A unique constraint covering the columns `[attemptId,questionId]` on the table `UserQuizAttemptQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttemptQuestion_attemptId_questionId_key" ON "UserQuizAttemptQuestion"("attemptId", "questionId");
