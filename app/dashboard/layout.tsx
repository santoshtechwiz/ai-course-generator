import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider"

import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
import CourseAIState from "@/components/development/CourseAIState"

import { getAuthSession } from "@/lib/auth"
import Chatbot from "@/components/features/chat/Chatbot"
import { GlobalLoader } from "@/components/ui/loader"




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
    <GlobalLoaderProvider>
      <div className="min-h-screen flex flex-col font-body">
        <DashboardShell>
          <GlobalLoader />
          <main className="flex-1 pt-16 ">
            {children}
          </main>          <Toaster />
          <Chatbot userId={session?.user?.id} />
          {process.env.NODE_ENV !== "production" && <CourseAIState />}
        </DashboardShell>
      </div>
    </GlobalLoaderProvider>
  )
}