import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { getAuthSession } from "@/lib/authOptions"
import { Chatbot } from "@/components/Chatbot"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import { NavigationEvents } from "./NavigationEvents"
import { FullPageLoader } from "@/components/ui/loader"

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
            <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
          </div>
        </main>
        <Toaster />
        <Chatbot userId={session?.user?.id || ""} />
      </div>
    </ClientLayoutWrapper>
  )
}
