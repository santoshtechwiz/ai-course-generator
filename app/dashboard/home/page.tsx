"use client"

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  memo,
} from "react"
import { UnifiedLoader } from "@/components/loaders/UnifiedLoader"
import { DashboardErrorBoundary } from "@/components/ui/dashboard-error-boundary"
import { AlertTriangle, RefreshCw, BookOpen, GraduationCap, TrendingUp, CreditCard } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

import { useUserData, useUserStats } from "@/hooks/useUserDashboard"
import DashboardHeader from "./components/DashboardHeader"
import dynamic from "next/dynamic"

import type { DashboardUser, UserStats } from "@/app/types/types"
import { useAuth } from "@/hooks"
import { Button } from "@/components/ui"
import UserNotFound from "@/components/common/UserNotFound"
import Head from "next/head"

// Import dashboard components
import LearningAnalyticsSimplified from "./components/LearningAnalyticsSimplified"
import QuickActionsCard from "./components/QuickActionsCard"
import UpcomingQuizzesWidget from "./components/UpcomingQuizzesWidget"
import AdaptiveSuggestionsCard from "./components/AdaptiveSuggestionsCard"
import SubscriptionStatus from "./components/SubscriptionStatus"
import QuickNavigation from "./components/QuickNavigation"
import { DashboardSidebar } from "./components/DashboardSidebar"

// Import new flashcard/gamification components
import { BadgeShowcase } from "@/components/flashcard/BadgeShowcase"
import { ReviewCalendar } from "@/components/flashcard/ReviewCalendar"
import { ReviewStats } from "@/components/flashcard/ReviewStats"
import { StreakBanner } from "@/components/flashcard/StreakBanner"
import { UpgradePrompt } from "@/components/flashcard/UpgradePrompt"

// Import notification hooks
import { useBadgeNotifications, useStreakNotifications } from "@/hooks/useBadgeNotifications"

// Dynamic imports for less critical sections
const CoursesTab = dynamic(() => import("./components/CoursesTab"), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false,
})
const QuizzesTab = dynamic(() => import("./components/QuizzesTab"), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false,
})
const RecommendationsWidget = dynamic(() => import("@/components/RecommendationsWidget"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false,
})

const LoadingState = memo(() => (
  <div className="p-6 space-y-6">
    <Skeleton className="h-12 w-[250px]" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-[400px]" />
  </div>
))

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  
  const userId = typeof user?.id === 'string' ? user.id : String(user?.id || "")
  
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useUserData(userId)

  const {
    data: userStats,
    isLoading: isLoadingUserStats,
    error: userStatsError,
  } = useUserStats(userId, {
    enabled: !!userId,
    staleTime: 600_000, // 10 minutes
  })

  // Enable real-time notifications
  useBadgeNotifications(userId, !!userId)
  useStreakNotifications(userId, !!userId)

  // Track initial data loading
  useEffect(() => {
    if (userData && !isLoadingUserData) {
      setHasLoadedInitialData(true)
    }
  }, [userData, isLoadingUserData])

  // Prepare data for components
  const fallbackUserData: DashboardUser = {
    id: typeof user?.id === 'string' ? user.id : String(user?.id || ""),
    name: user?.name || "User",
    email: user?.email || "",
    image: user?.image || "",
    credits: user?.credits || 0,
    courses: [],
    courseProgress: [],
    userQuizzes: [],
    streakDays: 0,
    isAdmin: false,
    favorites: [],
    quizAttempts: [],
  }

  const safeUserData: DashboardUser = userData ? {
    ...userData,
    id: typeof userData.id === 'string' ? userData.id : String(userData.id || "")
  } : fallbackUserData

  const safeUserStats: UserStats = userStats || {
    totalQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
    totalTimeSpent: 0,
    quizzesPerMonth: 0,
    recentImprovement: 0,
    topPerformingTopics: [],
  }

  // Prepare upcoming quizzes data
  const upcomingQuizzes = (userData?.userQuizzes || []).slice(0, 5).map(quiz => ({
    id: Number(quiz.id) || 0,
    slug: quiz.slug || `quiz-${quiz.id}`,
    title: quiz.title || 'Untitled Quiz',
    type: (quiz.quizType || 'mcq') as "mcq" | "blanks" | "openended" | "code" | "flashcard",
    difficulty: 'MEDIUM' as "EASY" | "MEDIUM" | "HARD",
    estimatedTime: 15,
    estimatedMinutes: 15,
    questionsCount: quiz.questions?.length || 10,
    totalQuestions: quiz.questions?.length || 10,
    progress: 0,
    lastScore: null,
    status: 'not-started' as const
  }))

  // Determine continue learning URL
  const continueLearningUrl = (() => {
    const inProgressCourses = userData?.courseProgress?.filter(c => !c.isCompleted) || []
    if (inProgressCourses.length > 0) {
      const mostRecent = inProgressCourses.sort((a, b) =>
        new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime()
      )[0]
      return `/dashboard/course/${mostRecent.course?.slug}`
    }
    return '/dashboard/courses'
  })()

  // Check if user has incorrect answers to review
  const hasIncorrectAnswers = userData?.quizAttempts?.some(attempt => 
    (attempt.score || 0) < 100
  ) || false

  // Get current streak
  const currentStreak = userData?.streakDays || 0

  // Show Sign In if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2">You are not authorized</h2>
        <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
        <Button onClick={() => signIn()} size="lg">
          Sign in
        </Button>
      </div>
    )
  }

  // Show loading state with unified loader
  if (isLoading || isLoadingUserData || isLoadingUserStats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <UnifiedLoader
          variant="spinner"
          size="lg"
          message="Loading your dashboard..."
          className="text-center"
        />
      </div>
    )
  }

  // Handle critical data load error with error boundary
  if (userDataError || userStatsError) {
    const errorMessage = userDataError?.message || userStatsError?.message
    return (
      <DashboardErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <div className="p-4 sm:p-6">
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
                <p className="mb-4 text-muted-foreground">{errorMessage || 'Something went wrong fetching your data.'}</p>
                <Button onClick={resetErrorBoundary}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      >
        {/* No children to render here; the error boundary will display the fallback when used in this return path */}
        <></>
      </DashboardErrorBoundary>
    )
  }

  // Show "User not found" if no user data and not loading
  if (userId && !userData && !isLoadingUserData) {
    return <UserNotFound />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Head>
        <link rel="preload" href="/api/dashboard/user" as="fetch" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Head>

      {/* Left Sidebar - Fixed */}
      <DashboardSidebar 
        userData={safeUserData}
        userStats={{
          coursesCount: safeUserData.courses.length,
          quizzesCount: safeUserData.userQuizzes?.length || 0,
          streakDays: currentStreak,
          badgesEarned: 0, // TODO: Get from UserBadge table
        }}
      />

      {/* Main Content Area - Offset by sidebar width on desktop, full width on mobile */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header Bar */}
        <DashboardHeader userData={safeUserData} toggleSidebar={() => {}} />

        {/* Main Content - Modern Enterprise Layout */}
        <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {safeUserData.name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your learning overview and progress
          </p>
        </div>

        {/* Streak Banner - Conditional */}
        {currentStreak > 0 && (
          <StreakBanner userId={userId} />
        )}

        {/* Quick Stats Overview - Enterprise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{safeUserData.courses.length}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quiz Attempts</p>
                  <p className="text-2xl font-bold">{safeUserData.userQuizzes?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{currentStreak} days</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits</p>
                  <p className="text-2xl font-bold">{safeUserData.credits || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action: Continue Learning */}
        <QuickActionsCard
          continueLearningUrl={continueLearningUrl}
          hasIncorrectAnswers={hasIncorrectAnswers}
        />

        {/* Learning Progress Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Learning Progress</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LearningAnalyticsSimplified
              userId={userId}
              weeklyProgress={[]} // TODO: Get real data
              streak={currentStreak}
              longestStreak={userData?.streakDays || 0}
              badgesEarned={5} // TODO: Get from UserBadge table
              totalBadges={17}
            />
            
            <div className="space-y-6">
              <ReviewStats userId={userId} />
            </div>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Activity Overview</h2>
          <ReviewCalendar userId={userId} />
        </div>

        {/* Upcoming & Suggested Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming & Recommended</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingQuizzesWidget quizzes={upcomingQuizzes} />
            <AdaptiveSuggestionsCard
              userId={userId}
              suggestions={[]} // TODO: Fetch adaptive suggestions
              isLoading={false}
            />
          </div>
        </div>

        {/* Achievements Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Your Achievements</h2>
          <BadgeShowcase />
        </div>

        {/* Quick Navigation */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Explore More</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/courses" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">My Courses</h3>
                      <p className="text-sm text-muted-foreground">
                        {safeUserData.courses.length} course{safeUserData.courses.length !== 1 ? 's' : ''} enrolled
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/my-quizzes" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <GraduationCap className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Quiz History</h3>
                      <p className="text-sm text-muted-foreground">
                        {safeUserData.userQuizzes?.length || 0} attempt{(safeUserData.userQuizzes?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/recommendations" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">For You</h3>
                      <p className="text-sm text-muted-foreground">
                        Personalized recommendations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
