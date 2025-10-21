"use client"

import * as React from "react"
import { useEffect, Suspense } from "react"
import { Provider } from "react-redux"
import { ThemeProvider } from "next-themes"
import store from "@/store"
import { Toaster } from "@/components/ui/toaster"
import { ReduxErrorBoundary } from "@/components/ui/error-boundary"
import Chatbot from "@/components/Chatbot"
import CourseAIState from "@/components/development/CourseAIState"
import { MainNavbar } from "@/components/layout/navigation/MainNavbar"
import { CreditGuidanceBanner } from "@/components/shared/CreditGuidanceBanner"
import { cn } from "@/lib/utils"
import { SuspenseGlobalFallback } from "@/components/loaders"

interface DashboardLayoutProps {
  children: React.ReactNode
  userId?: string
  className?: string
}

/**
 * Consolidated Dashboard Layout Component
 * 
 * Complete dashboard layout with integrated providers and navbar.
 * Following Next.js best practices - consolidates all client-side features:
 * - Redux store provider
 * - Theme provider (dark/light mode)
 * - Accessibility enhancements (prefers-reduced-motion)
 * - Dashboard navbar with search, notifications, and user menu
 * - Main content area with error boundaries
 * - Global components (Toaster, Chatbot, Dev Tools)
 * - Mobile responsive design
 * 
 * Previously split between ClientLayoutWrapper and DashboardLayout,
 * now consolidated to follow Next.js App Router pattern of minimal nesting.
 */
export function DashboardLayout({
  children,
  userId,
  className
}: DashboardLayoutProps) {
  // Add accessibility and UX enhancements
  useEffect(() => {
    const root = document.documentElement

    // Mark page loaded to help CSS avoid initial animations if desired
    root.classList.add("page-loaded")

    // Respect prefers-reduced-motion for accessibility
    let mql: MediaQueryList | null = null
    try {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)")

      const applyReducedMotion = (matches: boolean) => {
        root.classList.toggle("reduce-motion", matches)
      }

      applyReducedMotion(mql.matches)

      // Support both modern and legacy listeners
      const listener = (e: MediaQueryListEvent | MediaQueryList) =>
        applyReducedMotion("matches" in e ? e.matches : (e as MediaQueryList).matches)

      if ("addEventListener" in mql) {
        mql.addEventListener("change", listener as EventListener)
      } else if ("addListener" in mql) {
        // @ts-expect-error - older Safari
        mql.addListener(listener)
      }
    } catch {
      // no-op
    }

    return () => {
      root.classList.remove("page-loaded")
      if (mql) {
        if ("removeEventListener" in mql) {
          mql.removeEventListener("change", () => {})
        } else if ("removeListener" in mql) {
          // @ts-expect-error - older Safari
          mql.removeListener(() => {})
        }
      }
    }
  }, [])

  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={true}
      >
        <div className={cn("min-h-screen bg-background", className)}>
          {/* Main Navbar - Complete navigation with AI features, search, and user management */}
          <MainNavbar />

          {/* Main Content Area - No padding, children control their own layout */}
          <main className="min-h-[calc(100vh-4rem)] pt-20">
            {/* Credit Guidance Banner - Shows for 0-credit users */}
            <CreditGuidanceBanner />
            
            <ReduxErrorBoundary>
              <Suspense fallback={<SuspenseGlobalFallback text="Loading page..." />}>
                {children}
              </Suspense>
            </ReduxErrorBoundary>
          </main>

          {/* Global Dashboard Components */}
          <Toaster />
          {userId && <Chatbot userId={userId} />}

          {/* Development Tools */}
          {/* {process.env.NODE_ENV !== "production" && (
            <CourseAIState />
          )} */}
        </div>
      </ThemeProvider>
    </Provider>
  )
}




