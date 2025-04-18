"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Suspense } from "react"

import { Chatbot } from "@/components/Chatbot"
import MainNavbar from "@/components/shared/MainNavbar"
import { useAuth } from "@/providers/unified-auth-provider"
import { NavigationEvents } from "./NavigationEvents"
import { FullPageLoader, Loader } from "@/components/ui/loader"

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, requireAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/dashboard")
    }
  }, [isAuthenticated, isLoading, router])


  return (
    <div>
      <MainNavbar />
      <main className="flex-1 animate-fade-in">
        <Suspense>
          <NavigationEvents />
        </Suspense>
        <div className="container mx-auto px-4 py-6 max-w-7xl">{children}</div>
      </main>
      <Suspense fallback={null}>
        {/* @ts-expect-error Server Component */}
        <Chatbot userId={"test"} />
      </Suspense>
    </div>
  )
}