-- DropForeignKey
ALTER TABLE "OpenEndedQuestion" DROP CONSTRAINT "OpenEndedQuestion_questionId_fkey";

-- DropIndex
DROP INDEX "OpenEndedQuestion_questionId_idx";

-- DropIndex
DROP INDEX "OpenEndedQuestion_userQuizId_idx";

-- CreateTable
CREATE TABLE "UserQuizFavorite" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "userQuizId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuizFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserQuizFavorite_userId_idx" ON "UserQuizFavorite"("userId");

-- CreateIndex
CREATE INDEX "UserQuizFavorite_userQuizId_idx" ON "UserQuizFavorite"("userQuizId");

-- CreateIndex
CREATE INDEX "UserQuizFavorite_createdAt_idx" ON "UserQuizFavorite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizFavorite_userId_userQuizId_key" ON "UserQuizFavorite"("userId", "userQuizId");

-- AddForeignKey
ALTER TABLE "OpenEndedQuestion" ADD CONSTRAINT "OpenEndedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "UserQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizFavorite" ADD CONSTRAINT "UserQuizFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizFavorite" ADD CONSTRAINT "UserQuizFavorite_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
