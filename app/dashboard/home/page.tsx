"use client"

import { useState, useEffect, useCallback, Suspense, memo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, BarChart3, Clock, Award } from "lucide-react"
import UserNotFound from "@/components/common/UserNotFound"

import { useUserData, useUserStats } from "@/hooks/useUserDashboard"
import DashboardHeader from "./components/DashboardHeader"
import DashboardSidebar from "./components/DashboardSidebar"
import type { DashboardUser, UserStats } from "@/app/types/types"

// Import components dynamically to prevent navigation during render
import dynamic from "next/dynamic"
import { GlobalLoader } from "@/components/ui/loader"

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

const StatsTab = dynamic(() => import("./components/StatsTab"), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false,
})

const LoadingState = memo(function LoadingState() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-12 w-[250px]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  )
})

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Use session.user.id directly instead of state to avoid timing issues
  const userId = session?.user?.id || ""

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

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
    staleTime: 60000, // 1 minute
  })

  // Fixed: Added the missing handleTabChange function
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])
  // Create memoized type-safe data
  const safeUserData: DashboardUser = userData as DashboardUser
  const safeUserStats: UserStats = userStats as UserStats

  // Show loading state while session or user data is loading
  if (status === "loading" || (status === "authenticated" && userId && isLoadingUserData)) {
    return <GlobalLoader />
  }

  // Return early without router navigation during render
  if (status === "unauthenticated") {
    return null // We'll redirect in the useEffect above
  }

  // Better error handling with more specific messages
  if (userDataError || userStatsError) {
    console.error("Dashboard data error:", { userDataError, userStatsError, userId, session: session?.user })
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="mb-2">There was a problem loading your dashboard data.</p>
            {userDataError && <p className="text-red-600 text-sm">User data error: {userDataError.message || 'Unknown error'}</p>}
            {userStatsError && <p className="text-red-600 text-sm">Stats error: {userStatsError.message || 'Unknown error'}</p>}
            <p className="text-sm text-gray-600 mt-2">User ID: {userId || 'Not found'}</p>
            <p className="text-sm text-gray-600">Session Status: {status}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only show UserNotFound if we have a userId but no userData and finished loading
  if (userId && !userData && !isLoadingUserData) {
    console.error("User not found despite having userId:", { userId, session: session?.user })
    return <UserNotFound />
  }
  // If no userId (should not happen with proper auth), show error
  if (!userId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p>Unable to determine user identity. Please try logging out and logging back in.</p>
            <p className="text-sm text-gray-600 mt-2">Session Status: {status}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If still loading user data, show loading
  if (isLoadingUserData) {
    return <GlobalLoader />
  }

  // If we have session but no userData, create a minimal fallback
  if (!userData && session?.user) {
    const fallbackUserData: DashboardUser = {
      id: session.user.id,
      name: session.user.name || "User",
      email: session.user.email || "",
      image: session.user.image || "",
      credits: session.user.credits || 0,
      courses: [],
      courseProgress: [],
      userQuizzes: [],
      streakDays: 0,
    }
    
    console.log('Using fallback user data for session user:', session.user.id)
    
    // Use fallback data
    const safeUserData = fallbackUserData
    const safeUserStats: UserStats = userStats || {
      totalQuizzes: 0,
      totalAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      completedCourses: 0,
      totalTimeSpent: 0,
      averageTimePerQuiz: 0,
      topPerformingTopics: [],
      recentImprovement: 0,
      quizzesPerMonth: 0,
      courseCompletionRate: 0,
      consistencyScore: 0,
      learningEfficiency: 0,
      difficultyProgression: 0,
    }

    // Quick stats for the header with fallback data
    const quickStats = [
      {
        icon: <BookOpen className="h-5 w-5" />,
        label: "Courses",
        value: safeUserData.courses?.length || 0,
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        label: "Avg. Score",
        value: `${Math.round(safeUserStats?.averageScore || 0)}%`,
      },
      {
        icon: <Clock className="h-5 w-5" />,
        label: "Learning Time",
        value: `${Math.round((safeUserStats?.totalTimeSpent || 0) / 60)}`,
      },
      {
        icon: <Award className="h-5 w-5" />,
        label: "Streak",
        value: safeUserData?.streakDays || 0,
      },
    ]

    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userData={safeUserData}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col">
          <DashboardHeader
            userData={safeUserData}
            quickStats={quickStats}
            toggleSidebar={handleToggleSidebar}
          />

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Notice:</strong> Using basic profile data. Some features may be limited.
                {userDataError && (
                  <span className="ml-2 text-red-600">
                    Error: {userDataError.message}
                  </span>
                )}
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6 bg-muted/60 p-1 w-full md:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                  {activeTab === "overview" && <OverviewTab userData={safeUserData} userStats={safeUserStats} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="courses" className="mt-0">
                <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                  {activeTab === "courses" && <CoursesTab userData={safeUserData} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="quizzes" className="mt-0">
                <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                  {activeTab === "quizzes" && <QuizzesTab userData={safeUserData} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                  {activeTab === "stats" && <StatsTab userStats={safeUserStats} quizAttempts={safeUserData.quizAttempts || []} />}
                </Suspense>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    )
  }
  // Quick stats for the header with null checks - only calculate if we have userData
  const quickStats = userData ? [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Courses",
      value: safeUserData.courses?.length || 0,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Avg. Score",
      value: `${Math.round(safeUserStats?.averageScore || 0)}%`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Learning Time",
      value: `${Math.round((safeUserStats?.totalTimeSpent || 0) / 60)}`,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Streak",
      value: safeUserData?.streakDays || 0,
    },
  ] : []

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userData={safeUserData}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          userData={safeUserData}
          quickStats={quickStats}
          toggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6 bg-muted/60 p-1 w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            {/* Conditionally render the active tab content only */}
            <TabsContent value="overview" className="mt-0">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                {activeTab === "overview" && <OverviewTab userData={safeUserData} userStats={safeUserStats} />}
              </Suspense>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                {activeTab === "courses" && <CoursesTab userData={safeUserData} />}
              </Suspense>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-0">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                {activeTab === "quizzes" && <QuizzesTab userData={safeUserData} />}
              </Suspense>
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                {activeTab === "stats" && <StatsTab userStats={safeUserStats} quizAttempts={safeUserData.quizAttempts || []} />}
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
