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
import { CourseAILoader } from "@/components/ui/loader/courseai-loader"

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
  const [userId, setUserId] = useState<string>("")

  // Only set userId when session is available to prevent unnecessary API calls
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id)
    }
  }, [session])

  useEffect(() => {
    if (status === "unauthenticated" && !session) {
      router.push("/auth/signin")
    }
  }, [status, session, router])

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useUserData(userId)

  // Fixed: Corrected the useUserStats hook call
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
  if (status === "loading") {
    return <CourseAILoader context="processing" />
  }

  // Return early without router navigation during render
  if (status === "unauthenticated") {
    return null // We'll redirect in the useEffect above
  }

  if (userDataError || userStatsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p>There was a problem loading your dashboard data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return <UserNotFound />
  }

  // Quick stats for the header with null checks
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
