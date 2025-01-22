/*
  Warnings:

  - A unique constraint covering the columns `[userId,userQuizId]` on the table `UserQuizAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserQuizAttempt_userId_userQuizId_createdAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttempt_userId_userQuizId_key" ON "UserQuizAttempt"("userId", "userQuizId");
