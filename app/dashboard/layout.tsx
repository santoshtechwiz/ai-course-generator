"use client"

import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/app/providers/theme-provider"
import { UserProvider } from "@/app/providers/userContext"

import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"

import { SubscriptionProvider } from "@/app/providers/SubscriptionProvider"


import { AnimatedLoader } from "../components/AnimatedLoader"
import { LoadingProvider } from "../providers/LoadingContext"
import { NavigationEvents } from "./NavigationEvents"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
      <LoadingProvider>
        <AnimatedLoader />
        <NavigationEvents />
        <UserProvider>
          <SubscriptionProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <div className="container mx-auto px-4 lg:px-4">
                  <Suspense>{children}</Suspense>
                </div>
              </main>
              <Footer />
              <Toaster />
            </div>
          </SubscriptionProvider>
        </UserProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}

