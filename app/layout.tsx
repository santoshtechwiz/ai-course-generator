import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"

import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import GoogleAnalyticsClient from "@/components/analytics/GoogleAnalyticsClient"
import { RootErrorBoundary } from "@/components/layout/RootErrorBoundary"
import { GlobalLoader } from "@/components/ui/loader"
import { MotionProvider } from "@/components/MotionProvider"
import { ConditionalFooter } from "@/components/layout/ConditionalFooter"
import { ClientGuestProvider } from "@/components/guest/ClientGuestProvider"

import "../globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  try {
    const session = await getServerAuthSession()
    const userName = session?.user?.name

    const title = userName ? `${userName}'s Dashboard • CourseAI` : "CourseAI - Create Courses and Quizzes with AI"

    const description = session?.user
      ? "Access your personalized dashboard to create courses, quizzes, and educational content with AI-powered tools."
      : "Build video-based courses and generate intelligent quizzes with AI assistance. Create engaging learning experiences with automated quiz generation."

    return generateBaseMetadata({
      title,
      description,
      canonical: siteUrl,
      keywords: ["AI education", "course creator", "quiz maker", "educational content", "e-learning platform"],
      type: "website",
      url: siteUrl,
    })
  } catch (error) {
    console.error("Metadata generation error:", error)
    return generateBaseMetadata({
      title: "CourseAI - Create Courses and Quizzes with AI",
      description: "Build video-based courses and generate intelligent quizzes with AI assistance.",
      canonical: siteUrl,
      type: "website",
    })
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()

  return (
    <html lang="en" suppressHydrationWarning={true} className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0066cc" />

        {/* Search Engine Verification */}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />

        {/* App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body className="font-sans font-bold antialiased min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] neo-typography-body">
       
          <Providers session={session}>
            {/* Skip Navigation for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        focus:z-[60] focus:px-6 focus:py-3 focus:bg-primary focus:text-background 
        focus:border-4 focus:border-border focus:shadow-neo focus:neo-hover-lift focus:rounded-none
        focus:font-black focus:uppercase focus:tracking-wider focus:outline-none"
            >
              Skip to main content
            </a>

            <RootErrorBoundary>
              {/* Guest experience provider - client-only to prevent SSR issues */}
              <ClientGuestProvider>
                {/* Simplified noscript message */}
                <noscript>
                  <div className="bg-warning/10 border-4 border-warning neo-shadow p-6 m-6 neo-typography-body">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-warning font-bold">
                          JavaScript is required for CourseAI to work properly. Please enable JavaScript and refresh the
                          page.
                        </p>
                      </div>
                    </div>
                  </div>
                </noscript>

                <Suspense fallback={<GlobalLoader message="Loading CourseAI..." />}>
                  <div className="relative min-h-screen flex flex-col">
                    {/* Main Content - No padding here, let individual layouts handle it */}
                    <main id="main-content" className="flex-1 w-full bg-[var(--color-bg)]">
                      <MotionProvider>
                        {children}
                      </MotionProvider>
                    </main>
                    {/* Conditional Footer - Hidden on sidebar-enabled dashboard pages */}
                    <ConditionalFooter />
                  </div>
                </Suspense>
              </ClientGuestProvider>
            </RootErrorBoundary>

            {/* Analytics */}
            <Suspense>
              <GoogleAnalyticsClient />
            </Suspense>
            <DefaultSEO enableFAQ={false} />
          </Providers>

      </body>
    </html>
  )
}
