"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Suspense } from "react"

import { Chatbot } from "@/components/Chatbot"
import MainNavbar from "@/components/shared/MainNavbar"
import { useAuth } from "@/providers/unified-auth-provider"
import { NavigationEvents } from "./NavigationEvents"

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, requireAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div> // Or your loading component
  }

  if (!isAuthenticated) {
    return null // Don't render anything while redirecting
  }

  // Continue with your existing layout
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <MainNavbar></MainNavbar>
        <Suspense>
          <NavigationEvents />
        </Suspense>
        {children}
      </main>
      <Suspense fallback={null}>
        {/* @ts-expect-error Server Component */}
        <Chatbot userId={"test"} />
      </Suspense>
    </div>
  )
}
