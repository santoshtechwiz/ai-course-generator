-- DropForeignKey
ALTER TABLE "OpenEndedQuestion" DROP CONSTRAINT "OpenEndedQuestion_questionId_fkey";

-- CreateIndex
CREATE INDEX "OpenEndedQuestion_questionId_idx" ON "OpenEndedQuestion"("questionId");

-- CreateIndex
CREATE INDEX "OpenEndedQuestion_userQuizId_idx" ON "OpenEndedQuestion"("userQuizId");

-- AddForeignKey
ALTER TABLE "OpenEndedQuestion" ADD CONSTRAINT "OpenEndedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "UserQuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
