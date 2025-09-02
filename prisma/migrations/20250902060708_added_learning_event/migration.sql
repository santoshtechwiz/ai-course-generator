-- AlterTable
ALTER TABLE "LearningEvent" ADD COLUMN     "chapterId" INTEGER,
ADD COLUMN     "courseId" INTEGER,
ADD COLUMN     "progress" DOUBLE PRECISION,
ADD COLUMN     "timeSpent" INTEGER;

-- CreateIndex
CREATE INDEX "LearningEvent_courseId_idx" ON "LearningEvent"("courseId");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_courseId_type_idx" ON "LearningEvent"("userId", "courseId", "type");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_courseId_createdAt_idx" ON "LearningEvent"("userId", "courseId", "createdAt");

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
