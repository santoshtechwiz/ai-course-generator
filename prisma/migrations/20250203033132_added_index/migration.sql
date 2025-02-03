-- CreateIndex
CREATE INDEX "Course_isPublic_idx" ON "Course"("isPublic");

-- CreateIndex
CREATE INDEX "UserQuiz_quizType_idx" ON "UserQuiz"("quizType");

-- CreateIndex
CREATE INDEX "UserQuiz_isPublic_idx" ON "UserQuiz"("isPublic");
