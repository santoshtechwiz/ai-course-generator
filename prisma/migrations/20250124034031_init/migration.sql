-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "refresh_token_expires_in" INTEGER,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "userType" TEXT NOT NULL DEFAULT 'Free',
    "totalCoursesWatched" INTEGER NOT NULL DEFAULT 0,
    "totalQuizzesAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "user_id" TEXT NOT NULL,
    "categoryId" INTEGER,
    "isCompleted" BOOLEAN DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "difficulty" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseUnit" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isCompleted" BOOLEAN DEFAULT false,
    "duration" INTEGER,
    "order" INTEGER,

    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "youtubeSearchQuery" TEXT NOT NULL,
    "videoId" TEXT,
    "summary" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "summaryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "videoStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course_Rating" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "currentChapterId" INTEGER NOT NULL,
    "currentUnitId" INTEGER,
    "completedChapters" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completionDate" TIMESTAMP(3),
    "quizProgress" TEXT,
    "notes" TEXT,
    "bookmarks" TEXT,
    "lastInteractionType" TEXT,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicCount" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "TopicCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseQuiz" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseQuizAttempt" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "courseQuizId" INTEGER NOT NULL,
    "score" INTEGER,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "improvement" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,

    CONSTRAINT "CourseQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuiz" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "timeStarted" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "timeEnded" TIMESTAMP(3),
    "quizType" TEXT NOT NULL,
    "isPublic" BOOLEAN DEFAULT false,
    "slug" TEXT NOT NULL,
    "isFavorite" BOOLEAN DEFAULT false,
    "lastAttempted" TIMESTAMP(3),
    "bestScore" INTEGER,
    "difficulty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuizAttempt" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "userQuizId" INTEGER NOT NULL,
    "score" INTEGER,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "improvement" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "deviceInfo" TEXT,
    "browserInfo" TEXT,
    "completionSpeed" DOUBLE PRECISION,
    "difficultyRating" DOUBLE PRECISION,

    CONSTRAINT "UserQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "duration" INTEGER,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRecommendation" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "recommendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ContentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagementMetrics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "totalLoginTime" INTEGER NOT NULL DEFAULT 0,
    "averageSessionLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weeklyActiveMinutes" INTEGER NOT NULL DEFAULT 0,
    "monthlyActiveMinutes" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserEngagementMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuizQuestion" (
    "id" SERIAL NOT NULL,
    "userQuizId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT,
    "questionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenEndedQuestion" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "hints" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenEndedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuizAttemptQuestion" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuizAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToLearningPath" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseToLearningPath_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Favorite_user_id_idx" ON "Favorite"("user_id");

-- CreateIndex
CREATE INDEX "Favorite_courseId_idx" ON "Favorite"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_id_courseId_key" ON "Favorite"("user_id", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_name_idx" ON "Course"("name");

-- CreateIndex
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");

-- CreateIndex
CREATE INDEX "Course_user_id_idx" ON "Course"("user_id");

-- CreateIndex
CREATE INDEX "CourseUnit_courseId_idx" ON "CourseUnit"("courseId");

-- CreateIndex
CREATE INDEX "Chapter_unitId_idx" ON "Chapter"("unitId");

-- CreateIndex
CREATE INDEX "Course_Rating_user_id_idx" ON "Course_Rating"("user_id");

-- CreateIndex
CREATE INDEX "Course_Rating_courseId_idx" ON "Course_Rating"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "CourseProgress_user_id_lastAccessedAt_idx" ON "CourseProgress"("user_id", "lastAccessedAt");

-- CreateIndex
CREATE INDEX "CourseProgress_courseId_idx" ON "CourseProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_user_id_courseId_key" ON "CourseProgress"("user_id", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_stripeSubscriptionId_key" ON "UserSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCount_topic_key" ON "TopicCount"("topic");

-- CreateIndex
CREATE INDEX "CourseQuiz_chapterId_idx" ON "CourseQuiz"("chapterId");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_userId_idx" ON "CourseQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_courseQuizId_idx" ON "CourseQuizAttempt"("courseQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseQuizAttempt_userId_courseQuizId_key" ON "CourseQuizAttempt"("userId", "courseQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuiz_slug_key" ON "UserQuiz"("slug");

-- CreateIndex
CREATE INDEX "UserQuiz_user_id_idx" ON "UserQuiz"("user_id");

-- CreateIndex
CREATE INDEX "UserQuiz_topic_idx" ON "UserQuiz"("topic");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userId_idx" ON "UserQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userQuizId_idx" ON "UserQuizAttempt"("userQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttempt_userId_userQuizId_key" ON "UserQuizAttempt"("userId", "userQuizId");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_interactionType_idx" ON "UserInteraction"("userId", "interactionType");

-- CreateIndex
CREATE INDEX "UserInteraction_entityId_entityType_idx" ON "UserInteraction"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "LearningPath_userId_idx" ON "LearningPath"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_achievementType_idx" ON "UserAchievement"("userId", "achievementType");

-- CreateIndex
CREATE INDEX "ContentRecommendation_userId_contentType_idx" ON "ContentRecommendation"("userId", "contentType");

-- CreateIndex
CREATE INDEX "ContentRecommendation_contentId_idx" ON "ContentRecommendation"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagementMetrics_userId_key" ON "UserEngagementMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserEngagementMetrics_userId_idx" ON "UserEngagementMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserQuizQuestion_userQuizId_idx" ON "UserQuizQuestion"("userQuizId");

-- CreateIndex
CREATE INDEX "UserQuizQuestion_questionType_idx" ON "UserQuizQuestion"("questionType");

-- CreateIndex
CREATE UNIQUE INDEX "OpenEndedQuestion_questionId_key" ON "OpenEndedQuestion"("questionId");

-- CreateIndex
CREATE INDEX "OpenEndedQuestion_difficulty_idx" ON "OpenEndedQuestion"("difficulty");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_attemptId_idx" ON "UserQuizAttemptQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_questionId_idx" ON "UserQuizAttemptQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttemptQuestion_attemptId_questionId_key" ON "UserQuizAttemptQuestion"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "_CourseToLearningPath_B_index" ON "_CourseToLearningPath"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course_Rating" ADD CONSTRAINT "Course_Rating_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course_Rating" ADD CONSTRAINT "Course_Rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuiz" ADD CONSTRAINT "CourseQuiz_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuizAttempt" ADD CONSTRAINT "CourseQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuizAttempt" ADD CONSTRAINT "CourseQuizAttempt_courseQuizId_fkey" FOREIGN KEY ("courseQuizId") REFERENCES "CourseQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuiz" ADD CONSTRAINT "UserQuiz_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRecommendation" ADD CONSTRAINT "ContentRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagementMetrics" ADD CONSTRAINT "UserEngagementMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizQuestion" ADD CONSTRAINT "UserQuizQuestion_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenEndedQuestion" ADD CONSTRAINT "OpenEndedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "UserQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttemptQuestion" ADD CONSTRAINT "UserQuizAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UserQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttemptQuestion" ADD CONSTRAINT "UserQuizAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "UserQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToLearningPath" ADD CONSTRAINT "_CourseToLearningPath_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToLearningPath" ADD CONSTRAINT "_CourseToLearningPath_B_fkey" FOREIGN KEY ("B") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
