"use client"

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  memo,
  useMemo,
} from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, BarChart3, Clock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserNotFound from "@/components/common/UserNotFound"

import { useUserData, useUserStats } from "@/hooks/useUserDashboard"
import DashboardHeader from "./components/DashboardHeader"
import DashboardSidebar from "./components/DashboardSidebar"
import { useGlobalLoader } from "@/store/global-loader"
import dynamic from "next/dynamic"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"


import type { DashboardUser, UserStats } from "@/app/types/types"
import { useAuth } from "@/hooks"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"

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

const LoadingState = memo(() => (
  <div className="p-6 space-y-6">
    <Skeleton className="h-12 w-[250px]" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-[200px] rounded-lg" />
      <Skeleton className="h-[200px] rounded-lg" />
      <Skeleton className="h-[200px] rounded-lg" />
    </div>
    <Skeleton className="h-[400px] rounded-lg" />
  </div>
))

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter()
  const { startLoading, stopLoading } = useGlobalLoader()

  const userId = user?.id || ""
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

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (isLoading ) {
      startLoading({ message: "Verifying session..." })
    } else {
      stopLoading()
    }
  }, [isLoading, startLoading, stopLoading])

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

  // Handle critical data load error
  if (userDataError || userStatsError) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="mb-2">Something went wrong fetching your data.</p>
            {userDataError && <p className="text-red-600 text-sm">User error: {userDataError.message}</p>}
            {userStatsError && <p className="text-red-600 text-sm">Stats error: {userStatsError.message}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show "User not found" if no user data and not loading
  if (userId && !userData && !isLoadingUserData) {
    return <UserNotFound />
  }

  const fallbackUserData: DashboardUser = {
    id: user?.id!,
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

  const safeUserData: DashboardUser = userData || fallbackUserData
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

  const quickStats = useMemo(() => [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Courses",
      value: safeUserData.courses?.length || 0,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Avg. Score",
      value: `${Math.round(safeUserStats.averageScore)}%`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Learning Time",
      value: `${Math.round((safeUserStats.totalTimeSpent || 0) / 60)} min`,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Streak",
      value: safeUserData.streakDays || 0,
    },
  ], [safeUserData, safeUserStats])

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
          quickStats={quickStats}
          toggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6 bg-muted/60 p-1 w-full md:w-auto overflow-x-auto whitespace-nowrap rounded-lg">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <Suspense fallback={<SuspenseGlobalFallback message="Loading Overview..." />}>
                <OverviewTab userData={safeUserData} userStats={safeUserStats} />
              </Suspense>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <Suspense fallback={<SuspenseGlobalFallback message="Loading Courses..." />}>
                <CoursesTab userData={safeUserData} />
              </Suspense>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-0">
              <Suspense fallback={<SuspenseGlobalFallback message="Loading Quizzes..." />}>
                <QuizzesTab userData={safeUserData} />
              </Suspense>
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <Suspense fallback={<SuspenseGlobalFallback message="Loading Statistics..." />}>
                <StatsTab userStats={safeUserStats} quizAttempts={safeUserData.quizAttempts} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
