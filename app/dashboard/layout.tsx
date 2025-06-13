import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { FullPageLoader } from "@/components/ui/loader"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
import CourseAIState from "@/components/development/CourseAIState"
import { NavigationEvents } from "./NavigationEvents"
import RootLayoutProvider from "@/providers/root-layout-provider"
import { getAuthSession } from "@/lib/auth"
import { AuthConsumer } from "@/context/auth-context"

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
  const session = await getAuthSession()

  return (
    <RootLayoutProvider session={session}>
      <AuthConsumer>
        <div className="min-h-screen flex flex-col">
          <DashboardShell>
            <NavigationEvents />

            {/* 🛠️ Fix overlap by padding top equal to fixed MainNavbar height */}
            <main className="flex-1 pt-16 section-spacing">
              <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
            </main>

            <Toaster />
            {process.env.NODE_ENV === "development" && <CourseAIState />}
          </DashboardShell>
        </div>
      </AuthConsumer>
    </RootLayoutProvider>
  )
}
