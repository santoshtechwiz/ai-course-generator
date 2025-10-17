"use client"

import { Suspense } from "react"
import { UnifiedLoader } from "@/components/loaders/UnifiedLoader"
import { useAuth } from "@/hooks"
import { useUserData } from "@/hooks/useUserDashboard"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"

const QuizzesTab = dynamic(() => import("../home/components/QuizzesTab"), {
  ssr: false,
})

export default function MyQuizzesPage() {
  const { isAuthenticated, user } = useAuth()
  const userId = typeof user?.id === 'string' ? user.id : String(user?.id || "")
  
  const { data: userData, isLoading } = useUserData(userId)

  if (!isAuthenticated) {
    redirect('/auth/signin')
  }

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <UnifiedLoader
          variant="spinner"
          size="lg"
          message="Loading your quiz history..."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 md:px-8">
      <Suspense fallback={
        <UnifiedLoader
          variant="spinner"
          size="md"
          message="Loading quizzes..."
        />
      }>
        <QuizzesTab userData={userData} />
      </Suspense>
    </div>
  )
}
