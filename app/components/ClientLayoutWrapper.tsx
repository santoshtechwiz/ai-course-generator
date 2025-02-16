'use client'
import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/app/providers/theme-provider"
import { UserProvider } from "@/app/providers/userContext"
import { SubscriptionProvider } from "@/app/providers/SubscriptionProvider"
import NextTopLoader from "nextjs-toploader"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Course AI - Personalized Learning Experience",
  description:
    "Create custom AI-powered courses, generate quizzes, and transform video content into interactive learning materials.",
  keywords: [
    "AI course creation",
    "personalized learning",
    "quiz generation",
    "video transcript analysis",
    "educational technology",
  ],
  authors: [{ name: "Course AI Team" }],
  openGraph: {
    title: "Course AI - Revolutionize Your Learning",
    description: "AI-powered course creation and personalized education platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Course AI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course AI - AI-Powered Learning",
    description: "Create custom courses and quizzes with AI",
    images: ["/twitter-card.png"],
  },
}

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
      <UserProvider>
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
      </UserProvider>
    </ThemeProvider>
  )
}

