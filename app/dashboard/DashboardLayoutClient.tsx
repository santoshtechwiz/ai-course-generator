"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Suspense } from "react"

import { Chatbot } from "@/components/Chatbot"

import { useAuth } from "@/providers/unified-auth-provider"
import { NavigationEvents } from "./NavigationEvents"
import MainNavbar from "@/components/Navbar/MainNavbar"

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, requireAuth } = useAuth()
  const router = useRouter()
  // Add client-side only rendering to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/auth/signin?callbackUrl=/dashboard")
  //   }
  // }, [isAuthenticated, isLoading, router])

  // Return a simple skeleton during server-side rendering
  // This prevents hydration errors by ensuring server and client render the same content initially
  if (!isMounted) {
    return (
      <div>
        <div className="h-16 border-b"></div>
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

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
