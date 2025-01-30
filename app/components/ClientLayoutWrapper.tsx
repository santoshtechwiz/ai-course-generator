"use client"

import { ThemeProvider } from "@/app/providers/theme-provider"
import { UserProvider } from "@/app/providers/userContext"
import { SubscriptionProvider } from "@/app/providers/SubscriptionProvider"
import { NavigationEvents } from "../dashboard/NavigationEvents"
import { LoadingProvider } from "../providers/laderContext"
import { LoadingBar } from "./Loadingbar"
import { Suspense } from "react"



export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>

      <UserProvider>
        <SubscriptionProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <LoadingProvider>
              <LoadingBar />
              <NavigationEvents />
             <Suspense fallback={<LoadingBar />}>
             <main className="flex-1 p-4 overflow-auto">{children}</main>
             </Suspense>
            </LoadingProvider>
          </div>
        </SubscriptionProvider>
      </UserProvider>

    </ThemeProvider>
  )
}
