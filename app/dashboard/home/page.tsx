"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, BarChart3, Clock, Award, RefreshCw, Download, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
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
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-[250px]" />
        <div className="hidden md:flex space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>

      <div className="mt-8">
        <Skeleton className="h-8 w-[200px] mb-4" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userId, setUserId] = useState<string>("")

  // Only set userId when session is available to prevent unnecessary API calls
  useEffect(() => {
    if (session?.user?.id && session.user.id !== userId) {
      setUserId(session.user.id)
    }
  }, [session?.user?.id, userId])

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useUserData(userId, {
    enabled: !!userId,
    staleTime: 120000, // 2 minutes
    cacheTime: 300000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const {
    data: userStats,
    isLoading: isLoadingUserStats,
    error: userStatsError,
  } = useUserStats(userId, {
    enabled: !!userId,
    staleTime: 120000, // 2 minutes
    cacheTime: 300000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })

  if (status === "loading" || (userId && (isLoadingUserData || isLoadingUserStats))) {
    return <LoadingState />
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  if (userDataError || userStatsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                There was a problem loading your dashboard data. Please try refreshing the page or try again later.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
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
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/60 p-1 w-full md:w-auto">
                <TabsTrigger value="overview" className="relative">
                  <span>Overview</span>
                  {activeTab === "overview" && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger value="courses" className="relative">
                  <span>Courses</span>
                  {activeTab === "courses" && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="relative">
                  <span>Quizzes</span>
                  {activeTab === "quizzes" && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger value="stats" className="relative">
                  <span>Statistics</span>
                  {activeTab === "stats" && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="hidden md:flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
