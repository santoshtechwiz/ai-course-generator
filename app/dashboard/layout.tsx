import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { getAuthSession } from "@/lib/auth"
import { Chatbot } from "@/components/features/chat/Chatbot"
import { NavigationEvents } from "./NavigationEvents"
import { FullPageLoader } from "@/components/ui/loader"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the session here at the layout level
  const session = await getAuthSession()

  return (
    <DashboardShell>
      {/* Only render SubscriptionRefresher if user is authenticated */}
      <NavigationEvents />

      <main className="flex-grow flex flex-col">
        <div className="flex-grow section-spacing">
          <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
        </div>
      </main>
      <Toaster />
      <Chatbot userId={session?.user?.id || ""} />
    </DashboardShell>
  )
}
