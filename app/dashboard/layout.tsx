import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { getAuthSession } from "@/lib/auth"
import { Chatbot } from "@/components/features/chat/Chatbot"
import { NavigationEvents } from "./NavigationEvents"
import { FullPageLoader } from "@/components/ui/loader"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <DashboardShell>
      {/* Only render NavigationEvents for all users */}
      <NavigationEvents />

      <main className="flex-grow flex flex-col">
        <div className="flex-grow section-spacing">
          <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
        </div>
      </main>
      <Toaster />
     
    </DashboardShell>
  )
}
