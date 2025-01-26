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
          <SubscriptionProvider>{children}</SubscriptionProvider>
        </UserProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}

