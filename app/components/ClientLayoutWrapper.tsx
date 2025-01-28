"use client"

import { ThemeProvider } from "@/app/providers/theme-provider"
import { UserProvider } from "@/app/providers/userContext"
import { SubscriptionProvider } from "@/app/providers/SubscriptionProvider"
import { LoadingProvider } from "../providers/LoadingContext"
import { AnimatedLoader } from "../components/AnimatedLoader"
import { NavigationEvents } from "../dashboard/NavigationEvents"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
      <LoadingProvider>
        <AnimatedLoader />
        <NavigationEvents />
        <UserProvider>
          <SubscriptionProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              
              <main className="flex-1 p-4 overflow-auto">{children}</main>
             
            </div>
          </SubscriptionProvider>
        </UserProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}
