import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

import { FullPageLoader } from "@/components/ui/loader"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
import CourseAIState from "@/components/development/CourseAIState"
import { NavigationEvents } from "./NavigationEvents"
import RootLayoutProvider from "@/providers/root-layout-provider"
import { getAuthSession } from "@/lib/auth" // Import to get session for the provider

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
  // Get session to pass to RootLayoutProvider
  const session = await getAuthSession()

  return (
    <RootLayoutProvider session={session}>
      <div className="min-h-screen flex flex-col">
        {/* Wrap in DashboardShell */}
        <DashboardShell>
          {/* Top-level routing and state sync */}
          <NavigationEvents />

          {/* Main Content (grows to fill space between header & footer) */}
          <main className="flex-1 section-spacing">
            <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
          </main>

          {/* Note: Toaster from @/components/ui/toaster is different from sonner Toaster in RootLayoutProvider */}
          <Toaster />
          {process.env.NODE_ENV === "development" && <CourseAIState />}
        </DashboardShell>
      </div>
    </RootLayoutProvider>
  )
}
