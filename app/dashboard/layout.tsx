"use client"

import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/app/providers/theme-provider"
import { UserProvider } from "@/app/providers/userContext"

import { LoadingProvider } from "@/app/providers/LoadingContext"
import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"
import { GlobalLoading } from "@/app/components/shared/GlobalLoading"
import { DebugUserInfo } from "@/app/components/DebugUserInfo"
import { SubscriptionProvider } from "../providers/SubscriptionProvider"
import Background from "@/components/Background"
//supress hydration warning

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
      <LoadingProvider>
        <UserProvider>
          <SubscriptionProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <GlobalLoading />
              <main className="flex-1">
                <div className="container mx-auto px-4 lg:px-4">
                  <Suspense fallback={<div>Loading...</div>}>
                  {/* <Background /> */}
                  {children}</Suspense>
                </div>
              </main>
              <Footer />
              <Toaster />
              <div className="fixed bottom-4 right-4 z-50">
                <DebugUserInfo />
              </div>
            </div>
          </SubscriptionProvider>
        </UserProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}

