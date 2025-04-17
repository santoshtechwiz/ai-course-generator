"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, BarChart3, Clock, Award } from "lucide-react"
import UserNotFound from "@/components/UserNotFound"

import { useUserData, useUserStats } from "@/hooks/useUserDashboard"
import DashboardHeader from "./components/DashboardHeader"
import DashboardSidebar from "./components/DashboardSidebar"
import OverviewTab from "./components/OverviewTab"
import CoursesTab from "./components/CoursesTab"
import QuizzesTab from "./components/QuizzesTab"
import StatsTab from "./components/StatsTab"

function LoadingState() {
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
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { data: userData, isLoading: isLoadingUserData, error: userDataError } = useUserData(session?.user?.id ?? "")

  const {
    data: userStats,
    isLoading: isLoadingUserStats,
    error: userStatsError,
  } = useUserStats(session?.user?.id ?? "")

  if (status === "loading" || isLoadingUserData || isLoadingUserStats) {
    return <LoadingState />
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
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
      value: userData?.courses?.length || 0,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Avg. Score",
      value: `${Math.round(userStats?.averageScore || 0)}%`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Learning Time",
      value: `${Math.round((userStats?.totalTimeSpent || 0) / 60)}`,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Streak",
      value: userData?.streakDays || 0,
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userData={userData}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          userData={userData}
          quickStats={quickStats}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-muted/60 p-1 w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <OverviewTab userData={userData} userStats={userStats} />
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <CoursesTab userData={userData} />
            </TabsContent>

            <TabsContent value="quizzes" className="mt-0">
              <QuizzesTab userData={userData} />
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <StatsTab userStats={userStats} quizAttempts={userData.quizAttempts} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
