"use client"

import { Suspense } from "react"
import { BreadcrumbWelcome } from "@/components/auth/BreadcrumbWelcome"
import { GlobalLoader } from "@/components/ui/loader"

interface LandingLayoutProps {
  children: React.ReactNode
}

/**
 * Landing Layout
 *
 * Minimal layout for marketing pages, contact, privacy, terms, etc.
 * Features:
 * - Simple sticky header with welcome breadcrumb
 * - No complex navigation
 * - Clean, minimal design
 */
export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <>
      {/* Minimal header for landing pages */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg)] border-b-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
        <BreadcrumbWelcome />
      </header>

      {/* Main content with proper spacing */}
      <main className="min-h-screen pt-16">
        <Suspense fallback={<GlobalLoader message="Loading page..." />}>
          {children}
        </Suspense>
      </main>
    </>
  )
}