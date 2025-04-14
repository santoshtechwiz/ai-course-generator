-- AlterTable
ALTER TABLE "OpenEndedQuestion" ADD COLUMN     "userQuizId" INTEGER;

-- AddForeignKey
ALTER TABLE "OpenEndedQuestion" ADD CONSTRAINT "OpenEndedQuestion_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
