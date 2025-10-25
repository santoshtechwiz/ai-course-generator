"use client"

import { Suspense } from "react"
import { AppLoader, GlobalLoader } from "@/components/ui/loader"
import { useAuth } from "@/hooks"
import { useUserData } from "@/hooks/useUserDashboard"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

const CoursesTab = dynamic(() => import("../home/components/CoursesTab"), {
  ssr: false,
})

export default function CoursesPage() {
  const { isAuthenticated, user } = useAuth()
  const userId = typeof user?.id === 'string' ? user.id : String(user?.id || "")
  
  const { data: userData, isLoading } = useUserData(userId)

  if (!isAuthenticated) {
    redirect('/auth/signin')
  }

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <AppLoader
          size="large"
          message="Loading your courses..."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-2">
            Manage and continue your learning journey
          </p>
        </div>
        <Button asChild className="shadow-sm w-fit">
          <Link href="/dashboard/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <Suspense fallback={
        <GlobalLoader
          message="Loading courses..."
        />
      }>
        <CoursesTab userData={userData} />
      </Suspense>
    </div>
  )
}
