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

      {/* Dashboard Footer */}
      <DashboardFooter />

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

/**
 * Dashboard Footer Component (Integrated)
 */
function DashboardFooter({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn("border-t bg-background/95 backdrop-blur", className)}>
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>© {currentYear} CourseAI. All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <a
            href="/support"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </a>
          <a
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}

export default DashboardLayout
