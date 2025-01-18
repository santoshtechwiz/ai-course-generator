/*
  Warnings:

  - You are about to drop the column `quizScores` on the `CourseProgress` table. All the data in the column will be lost.
  - You are about to drop the `UserBehavior` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserBehavior" DROP CONSTRAINT "UserBehavior_userId_fkey";

-- DropIndex
DROP INDEX "QuizAttempt_userId_quizId_key";

-- AlterTable
ALTER TABLE "CourseProgress" DROP COLUMN "quizScores",
ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "quizProgress" TEXT;

-- AlterTable
ALTER TABLE "Course_Rating" ADD COLUMN     "reviewText" TEXT;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "improvement" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserQuiz" ADD COLUMN     "bestScore" INTEGER,
ADD COLUMN     "lastAttempted" TIMESTAMP(3);

-- DropTable
DROP TABLE "UserBehavior";

-- CreateTable
CREATE TABLE "QuizAttemptQuestion" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeSpent" INTEGER NOT NULL,

    CONSTRAINT "QuizAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizAttemptQuestion_attemptId_idx" ON "QuizAttemptQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "QuizAttemptQuestion_questionId_idx" ON "QuizAttemptQuestion"("questionId");

-- AddForeignKey
ALTER TABLE "QuizAttemptQuestion" ADD CONSTRAINT "QuizAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptQuestion" ADD CONSTRAINT "QuizAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CourseQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
