import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
import CourseAIState from "@/components/development/CourseAIState"

import RootLayoutProvider from "@/providers/root-layout-provider"
import { getAuthSession } from "@/lib/auth"
import Chatbot from "@/components/features/chat/Chatbot"
import { LoaderProvider } from "@/components/ui/loader/loader-context"




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
      <div className="min-h-screen flex flex-col font-body">
        <DashboardShell>


          <main className="flex-1 pt-16 ">
            {children}
          </main>

          <Toaster />
          <Chatbot userId={session?.user?.id} />
          {process.env.NODE_ENV !== "production" && <CourseAIState />}
        </DashboardShell>
      </div>
    </RootLayoutProvider>
  )
}
