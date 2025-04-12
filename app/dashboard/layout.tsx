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
       
        <NavigationEvents />

        <main className="flex-grow flex flex-col">
          <div className="flex-grow section-spacing">
            <Suspense fallback={<FullPageLoader />}>
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

function FullPageLoader() {
  return (
    <div className="content-container flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-foreground">Loading content</h3>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  )
}