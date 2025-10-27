"use client"

import { Suspense } from "react"
import { GlobalLoader } from "@/components/ui/loader"
import { useAuth } from "@/hooks"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"

const RecommendationsWidget = dynamic(() => import("@/components/RecommendationsWidget"), {
  ssr: false,
})

export default function RecommendationsPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    redirect('/auth/signin')
  }

  return (
    <div className="w-full px-0 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">For You</h1>
        <p className="text-muted-foreground mt-2">
          Personalized learning recommendations based on your progress
        </p>
      </div>

      <Suspense fallback={
        <GlobalLoader
          message="Loading recommendations..."
        />
      }>
        <RecommendationsWidget />
      </Suspense>
    </div>
  )
}
