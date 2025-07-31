-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "language" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "UserQuiz" ADD COLUMN     "language" TEXT,
ADD COLUMN     "metadata" JSONB;
