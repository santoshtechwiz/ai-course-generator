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
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
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
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 1000,
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
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN DEFAULT false,
    "duration" INTEGER,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeSearchQuery" TEXT NOT NULL,
    "videoId" TEXT,
    "summary" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "summaryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "videoStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRating" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completionDate" TIMESTAMP(3),
    "quizProgress" JSONB,
    "notes" TEXT,
    "bookmarks" TEXT,
    "lastInteractionType" TEXT,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicCount" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "improvement" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuiz" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quizType" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastAttempted" TIMESTAMP(3),
    "bestScore" INTEGER,
    "difficulty" TEXT,
    "timeStarted" TIMESTAMP(3) NOT NULL,
    "timeEnded" TIMESTAMP(3),
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
    "improvement" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "deviceInfo" TEXT,
    "browserInfo" TEXT,
    "completionSpeed" DOUBLE PRECISION,
    "difficultyRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagementMetrics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "totalLoginTime" INTEGER NOT NULL DEFAULT 0,
    "averageSessionLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyActiveMinutes" INTEGER NOT NULL DEFAULT 0,
    "monthlyActiveMinutes" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "codeSnippet" TEXT,
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
CREATE TABLE "UserQuizRating" (
    "id" SERIAL NOT NULL,
    "userQuizId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuizRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashCard" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT DEFAULT 'default-slug',
    "userQuizId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "difficulty" TEXT,
    "saved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FlashCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseToTag" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseToTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseTagToCourseToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseTagToCourseToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_userType_idx" ON "User"("userType");

-- CreateIndex
CREATE INDEX "User_engagementScore_idx" ON "User"("engagementScore");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE INDEX "Account_provider_idx" ON "Account"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");

-- CreateIndex
CREATE INDEX "Course_user_id_idx" ON "Course"("user_id");

-- CreateIndex
CREATE INDEX "Course_isPublic_idx" ON "Course"("isPublic");

-- CreateIndex
CREATE INDEX "Course_difficulty_idx" ON "Course"("difficulty");

-- CreateIndex
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");

-- CreateIndex
CREATE INDEX "Course_viewCount_idx" ON "Course"("viewCount");

-- CreateIndex
CREATE INDEX "Course_slug_idx" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "CourseUnit_courseId_idx" ON "CourseUnit"("courseId");

-- CreateIndex
CREATE INDEX "CourseUnit_order_idx" ON "CourseUnit"("order");

-- CreateIndex
CREATE INDEX "CourseUnit_isCompleted_idx" ON "CourseUnit"("isCompleted");

-- CreateIndex
CREATE INDEX "Chapter_unitId_idx" ON "Chapter"("unitId");

-- CreateIndex
CREATE INDEX "Chapter_isCompleted_idx" ON "Chapter"("isCompleted");

-- CreateIndex
CREATE INDEX "Chapter_order_idx" ON "Chapter"("order");

-- CreateIndex
CREATE INDEX "Chapter_videoStatus_summaryStatus_idx" ON "Chapter"("videoStatus", "summaryStatus");

-- CreateIndex
CREATE INDEX "CourseRating_courseId_idx" ON "CourseRating"("courseId");

-- CreateIndex
CREATE INDEX "CourseRating_rating_idx" ON "CourseRating"("rating");

-- CreateIndex
CREATE INDEX "CourseRating_createdAt_idx" ON "CourseRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRating_user_id_courseId_key" ON "CourseRating"("user_id", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "CourseProgress_user_id_lastAccessedAt_idx" ON "CourseProgress"("user_id", "lastAccessedAt");

-- CreateIndex
CREATE INDEX "CourseProgress_courseId_idx" ON "CourseProgress"("courseId");

-- CreateIndex
CREATE INDEX "CourseProgress_progress_idx" ON "CourseProgress"("progress");

-- CreateIndex
CREATE INDEX "CourseProgress_isCompleted_idx" ON "CourseProgress"("isCompleted");

-- CreateIndex
CREATE INDEX "CourseProgress_engagementScore_idx" ON "CourseProgress"("engagementScore");

-- CreateIndex
CREATE INDEX "CourseProgress_timeSpent_idx" ON "CourseProgress"("timeSpent");

-- CreateIndex
CREATE INDEX "CourseProgress_currentChapterId_idx" ON "CourseProgress"("currentChapterId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_user_id_courseId_key" ON "CourseProgress"("user_id", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_stripeSubscriptionId_key" ON "UserSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");

-- CreateIndex
CREATE INDEX "UserSubscription_currentPeriodEnd_idx" ON "UserSubscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "UserSubscription_planId_idx" ON "UserSubscription"("planId");

-- CreateIndex
CREATE INDEX "UserSubscription_stripeCustomerId_idx" ON "UserSubscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Favorite_user_id_idx" ON "Favorite"("user_id");

-- CreateIndex
CREATE INDEX "Favorite_courseId_idx" ON "Favorite"("courseId");

-- CreateIndex
CREATE INDEX "Favorite_createdAt_idx" ON "Favorite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_id_courseId_key" ON "Favorite"("user_id", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCount_topic_key" ON "TopicCount"("topic");

-- CreateIndex
CREATE INDEX "TopicCount_topic_idx" ON "TopicCount"("topic");

-- CreateIndex
CREATE INDEX "TopicCount_count_idx" ON "TopicCount"("count");

-- CreateIndex
CREATE INDEX "CourseQuiz_chapterId_idx" ON "CourseQuiz"("chapterId");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_userId_idx" ON "CourseQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_courseQuizId_idx" ON "CourseQuizAttempt"("courseQuizId");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_score_idx" ON "CourseQuizAttempt"("score");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_accuracy_idx" ON "CourseQuizAttempt"("accuracy");

-- CreateIndex
CREATE INDEX "CourseQuizAttempt_createdAt_idx" ON "CourseQuizAttempt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseQuizAttempt_userId_courseQuizId_key" ON "CourseQuizAttempt"("userId", "courseQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuiz_slug_key" ON "UserQuiz"("slug");

-- CreateIndex
CREATE INDEX "UserQuiz_user_id_idx" ON "UserQuiz"("user_id");

-- CreateIndex
CREATE INDEX "UserQuiz_title_idx" ON "UserQuiz"("title");

-- CreateIndex
CREATE INDEX "UserQuiz_quizType_idx" ON "UserQuiz"("quizType");

-- CreateIndex
CREATE INDEX "UserQuiz_isPublic_idx" ON "UserQuiz"("isPublic");

-- CreateIndex
CREATE INDEX "UserQuiz_difficulty_idx" ON "UserQuiz"("difficulty");

-- CreateIndex
CREATE INDEX "UserQuiz_createdAt_idx" ON "UserQuiz"("createdAt");

-- CreateIndex
CREATE INDEX "UserQuiz_bestScore_idx" ON "UserQuiz"("bestScore");

-- CreateIndex
CREATE INDEX "UserQuiz_lastAttempted_idx" ON "UserQuiz"("lastAttempted");

-- CreateIndex
CREATE INDEX "UserQuiz_slug_idx" ON "UserQuiz"("slug");

-- CreateIndex
CREATE INDEX "UserQuiz_isFavorite_idx" ON "UserQuiz"("isFavorite");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userId_idx" ON "UserQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userQuizId_idx" ON "UserQuizAttempt"("userQuizId");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_score_idx" ON "UserQuizAttempt"("score");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_accuracy_idx" ON "UserQuizAttempt"("accuracy");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_createdAt_idx" ON "UserQuizAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_completionSpeed_idx" ON "UserQuizAttempt"("completionSpeed");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttempt_userId_userQuizId_key" ON "UserQuizAttempt"("userId", "userQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagementMetrics_userId_key" ON "UserEngagementMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserEngagementMetrics_userId_idx" ON "UserEngagementMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserEngagementMetrics_completionRate_idx" ON "UserEngagementMetrics"("completionRate");

-- CreateIndex
CREATE INDEX "UserEngagementMetrics_weeklyActiveMinutes_monthlyActiveMinu_idx" ON "UserEngagementMetrics"("weeklyActiveMinutes", "monthlyActiveMinutes");

-- CreateIndex
CREATE INDEX "UserEngagementMetrics_lastCalculated_idx" ON "UserEngagementMetrics"("lastCalculated");

-- CreateIndex
CREATE INDEX "UserQuizQuestion_userQuizId_idx" ON "UserQuizQuestion"("userQuizId");

-- CreateIndex
CREATE INDEX "UserQuizQuestion_questionType_idx" ON "UserQuizQuestion"("questionType");

-- CreateIndex
CREATE UNIQUE INDEX "OpenEndedQuestion_questionId_key" ON "OpenEndedQuestion"("questionId");

-- CreateIndex
CREATE INDEX "OpenEndedQuestion_difficulty_idx" ON "OpenEndedQuestion"("difficulty");

-- CreateIndex
CREATE INDEX "OpenEndedQuestion_tags_idx" ON "OpenEndedQuestion"("tags");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_attemptId_idx" ON "UserQuizAttemptQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_questionId_idx" ON "UserQuizAttemptQuestion"("questionId");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_isCorrect_idx" ON "UserQuizAttemptQuestion"("isCorrect");

-- CreateIndex
CREATE INDEX "UserQuizAttemptQuestion_timeSpent_idx" ON "UserQuizAttemptQuestion"("timeSpent");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizAttemptQuestion_attemptId_questionId_key" ON "UserQuizAttemptQuestion"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "UserQuizRating_userQuizId_idx" ON "UserQuizRating"("userQuizId");

-- CreateIndex
CREATE INDEX "UserQuizRating_rating_idx" ON "UserQuizRating"("rating");

-- CreateIndex
CREATE INDEX "UserQuizRating_createdAt_idx" ON "UserQuizRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuizRating_userId_userQuizId_key" ON "UserQuizRating"("userId", "userQuizId");

-- CreateIndex
CREATE INDEX "FlashCard_question_idx" ON "FlashCard"("question");

-- CreateIndex
CREATE INDEX "FlashCard_userId_idx" ON "FlashCard"("userId");

-- CreateIndex
CREATE INDEX "FlashCard_userQuizId_idx" ON "FlashCard"("userQuizId");

-- CreateIndex
CREATE INDEX "FlashCard_difficulty_idx" ON "FlashCard"("difficulty");

-- CreateIndex
CREATE INDEX "FlashCard_saved_idx" ON "FlashCard"("saved");

-- CreateIndex
CREATE INDEX "FlashCard_createdAt_idx" ON "FlashCard"("createdAt");

-- CreateIndex
CREATE INDEX "FlashCard_slug_idx" ON "FlashCard"("slug");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementType_idx" ON "UserAchievement"("achievementType");

-- CreateIndex
CREATE INDEX "UserAchievement_earnedAt_idx" ON "UserAchievement"("earnedAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_idx" ON "UserNotification"("userId");

-- CreateIndex
CREATE INDEX "UserNotification_isRead_idx" ON "UserNotification"("isRead");

-- CreateIndex
CREATE INDEX "UserNotification_type_idx" ON "UserNotification"("type");

-- CreateIndex
CREATE INDEX "UserNotification_createdAt_idx" ON "UserNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTag_name_key" ON "CourseTag"("name");

-- CreateIndex
CREATE INDEX "CourseTag_name_idx" ON "CourseTag"("name");

-- CreateIndex
CREATE INDEX "CourseToTag_courseId_idx" ON "CourseToTag"("courseId");

-- CreateIndex
CREATE INDEX "CourseToTag_tagId_idx" ON "CourseToTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseToTag_courseId_tagId_key" ON "CourseToTag"("courseId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "_CourseTagToCourseToTag_B_index" ON "_CourseTagToCourseToTag"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRating" ADD CONSTRAINT "CourseRating_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRating" ADD CONSTRAINT "CourseRating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuiz" ADD CONSTRAINT "CourseQuiz_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuizAttempt" ADD CONSTRAINT "CourseQuizAttempt_courseQuizId_fkey" FOREIGN KEY ("courseQuizId") REFERENCES "CourseQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuizAttempt" ADD CONSTRAINT "CourseQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuiz" ADD CONSTRAINT "UserQuiz_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "UserQuizRating" ADD CONSTRAINT "UserQuizRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizRating" ADD CONSTRAINT "UserQuizRating_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashCard" ADD CONSTRAINT "FlashCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashCard" ADD CONSTRAINT "FlashCard_userQuizId_fkey" FOREIGN KEY ("userQuizId") REFERENCES "UserQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseTagToCourseToTag" ADD CONSTRAINT "_CourseTagToCourseToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "CourseTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseTagToCourseToTag" ADD CONSTRAINT "_CourseTagToCourseToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "CourseToTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
