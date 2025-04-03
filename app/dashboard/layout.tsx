import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

import { getAuthSession } from "@/lib/authOptions"

import { Chatbot } from "@/components/Chatbot"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import MainNavbar from "@/components/shared/MainNavbar"
import { NavigationEvents } from "./NavigationEvents"


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col container mx-auto">
        <MainNavbar />
        <NavigationEvents />

        <main className="flex-grow flex flex-col transition-all duration-300 ease-in-out">
          <div className="flex-grow section-spacing">
            <Suspense
              fallback={
                <div className="content-container flex items-center justify-center min-h-[50vh]">
                  <div className="flex flex-col items-center space-y-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-primary/40"></div>
                    </div>
                    <div className="h-4 w-48 bg-muted rounded-md"></div>
                    <div className="h-3 w-32 bg-muted/70 rounded-md"></div>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
        <Toaster />
        <Chatbot userId={session?.user?.id || ""} />
      </div>
    </ClientLayoutWrapper>
  )
}

