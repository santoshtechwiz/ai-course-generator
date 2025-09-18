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
import { AlertTriangle, RefreshCw } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Activity, TrendingUp, GraduationCap } from "lucide-react"

import { useUserData, useUserStats } from "@/hooks/useUserDashboard"
import DashboardHeader from "./components/DashboardHeader"
import DashboardSidebar from "./components/DashboardSidebar"
import dynamic from "next/dynamic"

import type { DashboardUser, UserStats } from "@/app/types/types"
import { useAuth } from "@/hooks"

const OverviewTab = dynamic(() => import("./components/OverviewTab"), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false,
})
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
  
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
    staleTime: 60_000,
  })

  // Fetch dashboard data using real data hooks - moved before conditional returns
  // Removed progress-related data fetching to improve performance

  // Clean data before use
  // Removed progress-related data cleaning to improve performance

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

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

  // Consolidated quick stats moved to OverviewTab for better organization

  useEffect(() => {
    // No-op for now
  }, [isLoading])

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
        {children}
      </DashboardErrorBoundary>
    )
  }

  // Show "User not found" if no user data and not loading
  if (userId && !userData && !isLoadingUserData) {
    return <UserNotFound />
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar: collapses on mobile, visible on md+ */}
      <div className={"w-full md:w-64 md:flex-shrink-0 " + (sidebarOpen ? "block" : "hidden md:block") + " z-20"}>
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userData={safeUserData}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          userData={safeUserData}
          toggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6 bg-muted/60 p-1 w-full md:w-auto overflow-x-auto whitespace-nowrap rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Quizzes</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">For You</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <Suspense fallback={
                <div className="py-10">
                  <UnifiedLoader
                    variant="spinner"
                    size="md"
                    message="Loading overview..."
                  />
                </div>
              }>
                <OverviewTab userData={safeUserData} userStats={safeUserStats} />
              </Suspense>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <Suspense fallback={
                <div className="min-h-[400px] flex items-center justify-center">
                  <UnifiedLoader
                    variant="spinner"
                    size="md"
                    message="Loading courses..."
                  />
                </div>
              }>
                <CoursesTab userData={safeUserData} />
              </Suspense>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-0">
              <Suspense fallback={
                <div className="min-h-[400px] flex items-center justify-center">
                  <UnifiedLoader
                    variant="spinner"
                    size="md"
                    message="Loading quizzes..."
                  />
                </div>
              }>
                <QuizzesTab userData={safeUserData} />
              </Suspense>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-0">
              <Suspense fallback={
                <div className="py-10">
                  <UnifiedLoader
                    variant="spinner"
                    size="md"
                    message="Loading recommendations..."
                  />
                </div>
              }>
                <RecommendationsWidget />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
