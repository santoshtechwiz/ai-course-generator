"use client"

import { Suspense } from "react"
import { MainNavbar } from "@/components/layout/navigation/MainNavbar"
import { GlobalLoader } from "@/components/ui/loader"

interface QuizLayoutProps {
  children: React.ReactNode
}

/**
 * Quiz Layout
 *
 * Layout specifically for quiz pages.
 * Features:
 * - Main navigation bar (sticky)
 * - Quiz-focused content area
 * - Clean, distraction-free design
 */
export function QuizLayout({ children }: QuizLayoutProps) {
  return (
    <>
      {/* Main navigation bar */}
      <MainNavbar />

      {/* Quiz content area with proper navbar offset */}
      <main className="min-h-screen pt-16 bg-[var(--color-bg)]">
        <Suspense fallback={<GlobalLoader message="Loading quiz..." />}>
          {children}
        </Suspense>
      </main>
    </>
  )
}