import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

import { getAuthSession } from "@/lib/authOptions"

import { Chatbot } from "@/components/Chatbot"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import MainNavbar from "@/components/shared/MainNavbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <MainNavbar />

        <main className="flex-grow flex flex-col">
          <div className="flex-grow section-spacing">
            <Suspense
              fallback={
                <div className="content-container flex items-center justify-center min-h-[50vh]">
                  <div className="animate-pulse text-center">
                    <div className="h-8 w-32 bg-muted rounded-md mx-auto mb-4"></div>
                    <div className="h-4 w-48 bg-muted rounded-md mx-auto"></div>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
        <Toaster />
        <Chatbot userId={session?.user?.id || ""} isSubscribed={!!session?.user?.subscriptionStatus} />
      </div>
    </ClientLayoutWrapper>
  )
}

