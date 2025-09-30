"use client"

import * as React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ReduxErrorBoundary } from "@/components/ui/error-boundary"
import { Chatbot } from "@/components/Chatbot"
import CourseAIState from "@/components/development/CourseAIState"
import { MainNavbar } from "@/components/layout/navigation/MainNavbar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  userId?: string
  className?: string
}

/**
 * Consolidated Dashboard Layout Component
 *
 * Complete dashboard layout with integrated navbar and footer:
 * - Clean dashboard navbar with search, notifications, and user menu
 * - Main content area with error boundaries
 * - Footer with copyright and links
 * - Global components (Toaster, Chatbot, Dev Tools)
 * - Mobile responsive design
 * - Professional n8n-inspired design
 */
export function DashboardLayout({
  children,
  userId,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900", className)}>
      {/* Main Navbar - Complete navigation with AI features, search, and user management */}
      <MainNavbar />

      {/* Main Content Area - More spacious like n8n */}
      <main className="min-h-[calc(100vh-12rem)] pt-20">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <ReduxErrorBoundary>
            {children}
          </ReduxErrorBoundary>
        </div>
      </main>


      {/* Global Dashboard Components */}
      <Toaster />
      {userId && <Chatbot userId={userId} />}

      {/* Development Tools */}
      {process.env.NODE_ENV !== "production" && (
        <CourseAIState />
      )}
    </div>
  )
}



export default DashboardLayout
