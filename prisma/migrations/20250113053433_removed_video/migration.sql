/*
  Warnings:

  - You are about to drop the column `videoProgress` on the `CourseProgress` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CourseProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "currentChapterId" INTEGER NOT NULL,
    "currentUnitId" INTEGER,
    "completedChapters" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "quizScores" TEXT,
    "notes" TEXT,
    "bookmarks" TEXT,
    CONSTRAINT "CourseProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourseProgress" ("bookmarks", "completedChapters", "courseId", "currentChapterId", "currentUnitId", "id", "isCompleted", "lastAccessedAt", "notes", "progress", "quizScores", "timeSpent", "user_id") SELECT "bookmarks", "completedChapters", "courseId", "currentChapterId", "currentUnitId", "id", "isCompleted", "lastAccessedAt", "notes", "progress", "quizScores", "timeSpent", "user_id" FROM "CourseProgress";
DROP TABLE "CourseProgress";
ALTER TABLE "new_CourseProgress" RENAME TO "CourseProgress";
CREATE INDEX "CourseProgress_user_id_lastAccessedAt_idx" ON "CourseProgress"("user_id", "lastAccessedAt");
CREATE INDEX "CourseProgress_courseId_idx" ON "CourseProgress"("courseId");
CREATE UNIQUE INDEX "CourseProgress_user_id_courseId_key" ON "CourseProgress"("user_id", "courseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
