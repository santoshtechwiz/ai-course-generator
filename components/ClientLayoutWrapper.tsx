"use client"
import type React from "react"

import NextTopLoader from "nextjs-toploader"
import { Suspense } from "react"
import { SubscriptionProvider } from "@/providers/SubscriptionProvider"
import { UserProvider } from "@/providers/userContext"
import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { AnimationProvider } from "@/providers/animation-provider"
import MainNavbar from "./shared/MainNavbar"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        <MainNavbar />
        <UserProvider>
          <AnimationProvider initialState={true}>
          <SubscriptionProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <NextTopLoader
                color="red"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={true}
                easing="ease"
                speed={200}
                shadow="0 0 10px #2299DD,0 0 5px #2299DD"
                template='<div class="bar" role="bar"><div class="peg"></div></div> 
  <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
                zIndex={1600}
                showAtBottom={false}
              />
              <Suspense>
                <main className="flex-1 overflow-auto">{children}</main>
              </Suspense>
            </div>
          </SubscriptionProvider>
          </AnimationProvider>
        </UserProvider>
     
    </SessionProvider>
  )
}
