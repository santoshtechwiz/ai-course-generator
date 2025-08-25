import React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "../globals.css"
import "../styles/nprogress.css"

import Footer from "@/components/shared/Footer"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { Suspense } from "react"

import PageTransition from "@/components/shared/PageTransition"
import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import GoogleAnalyticsClient from '@/components/analytics/GoogleAnalyticsClient'
import NavigationProgress from '@/components/NavigationProgress'

// Simplified fonts - only keep what's necessary
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins", 
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

// Remove force-dynamic to allow ISR
// export const dynamic = "force-dynamic"

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />

        {/* App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Styles */}
        <link rel="stylesheet" href="/nprogress.css" />
      </head>

  <body className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-background text-foreground`}>
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

            <div className="min-h-screen flex flex-col">
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

              <NavigationProgress />
              
              <main id="main-content" className="flex-1 w-full" role="main">
                <PageTransition>
                  <Suspense fallback={<div className="flex items-center justify-center py-10"><span className="text-xs text-muted-foreground">Loading...</span></div>}>
                    {children}
                  </Suspense>
                </PageTransition>
              </main>

              <Footer />
              
              {/* Google Analytics - only if GA_ID exists (client only) */}
              {process.env.NEXT_PUBLIC_GA_ID && (
                // Client wrapper will dynamically load the GA component
                <React.Suspense>
                  <React.Fragment>
                    {/* @ts-ignore */}
                    <GoogleAnalyticsClient gaId={process.env.NEXT_PUBLIC_GA_ID} />
                  </React.Fragment>
                </React.Suspense>
              )}

              <DefaultSEO enableFAQ={false} />
            </div>
  </Providers>
      </body>
    </html>
  )
}