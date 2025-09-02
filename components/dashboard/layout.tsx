"use client"

import * as React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ReduxErrorBoundary } from "@/components/ui/error-boundary"
import Chatbot from "@/components/features/chat/Chatbot"
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
 */
export function DashboardLayout({
  children,
  userId,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Main Navbar - Complete navigation with AI features, search, and user management */}
      <MainNavbar />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-12rem)] pt-16">
        <div className="container mx-auto px-4 py-6">
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
