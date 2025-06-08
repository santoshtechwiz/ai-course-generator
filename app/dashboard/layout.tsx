import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

import { FullPageLoader } from "@/components/ui/loader"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
import CourseAIState from "@/components/development/CourseAIState"
import ReduxBootstrap from "@/components/development/ReduxBootstrap"
import { NavigationEvents } from "./NavigationEvents"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Wrap in DashboardShell */}
      <DashboardShell>
        {/* Top-level routing and state sync */}
        <NavigationEvents />
        <ReduxBootstrap />

        {/* Main Content (grows to fill space between header & footer) */}
        <main className="flex-1 section-spacing">
          <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
        </main>

        {/* Toasts and Dev Tools */}
        <Toaster />
        {process.env.NODE_ENV === "development" && <CourseAIState />}
      </DashboardShell>
    </div>
  )
}
