import React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, JetBrains_Mono } from "next/font/google"
import "../globals.css"

import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { Suspense } from "react"

import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import GoogleAnalyticsClient from '@/components/analytics/GoogleAnalyticsClient'

import { RootErrorBoundary } from "@/components/layout/RootErrorBoundary"
import { SuspenseGlobalFallback } from "@/components/loaders"
import BProgressProvider from "./providers"
import { MotionProvider } from "@/components/MotionProvider"
import Footer from "@/components/shared/Footer"

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  try {
    const session = await getServerAuthSession()
    const userName = session?.user?.name

    const title = userName
      ? `${userName}'s Dashboard • CourseAI`
      : "CourseAI - AI-Powered Educational Content Creator"

    const description = session?.user
      ? "Access your personalized dashboard to create courses, quizzes, and educational content with AI-powered tools."
      : "Create professional courses, quizzes, and educational content with AI. Transform learning with intelligent content generation for educators and trainers."

    return generateBaseMetadata({
      title,
      description,
      canonical: siteUrl,
      keywords: [
        "AI education",
        "course creator",
        "quiz maker",
        "educational content",
        "e-learning platform",
      ],
      type: "website",
      url: siteUrl,
    })
  } catch (error) {
    console.error("Metadata generation error:", error)
    return generateBaseMetadata({
      title: "CourseAI - AI-Powered Educational Content Creator",
      description: "Create professional courses, quizzes, and educational content with AI.",
      canonical: siteUrl,
      type: "website",
    })
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0066cc" />

        {/* Search Engine Verification */}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        )}

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />

        {/* App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body className={`font-sans antialiased bg-background text-foreground`}>
        <BProgressProvider>
          <Providers session={session}>
            {/* Skip Navigation for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground 
        focus:rounded focus:outline-none"
            >
              Skip to main content
            </a>

            <RootErrorBoundary>
              {/* Simplified noscript message */}
              <noscript>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        JavaScript is required for CourseAI to work properly. Please enable JavaScript and refresh the page.
                      </p>
                    </div>
                  </div>
                </div>
              </noscript>

              <Suspense fallback={<SuspenseGlobalFallback />}>
                <div className="relative min-h-screen flex flex-col">
                  {/* Main Content */}
                  <main id="main-content" className="flex-1 w-full">
                    <MotionProvider>
                      <Suspense fallback={<SuspenseGlobalFallback />}>
                        {children}
                      </Suspense>
                    </MotionProvider>
                  </main>
                  <Footer/>
                  {/* Footer removed - using page-specific footers instead */}
                </div>
              </Suspense>
            </RootErrorBoundary>

            {/* Analytics */}
            <Suspense>
              <GoogleAnalyticsClient />
            </Suspense>

            <DefaultSEO enableFAQ={false} />
          </Providers>
        </BProgressProvider>
      </body>
    </html>
  )
}