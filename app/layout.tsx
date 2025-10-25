import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { Suspense } from "react"

import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import GoogleAnalyticsClient from "@/components/analytics/GoogleAnalyticsClient"

import { RootErrorBoundary } from "@/components/layout/RootErrorBoundary"
import { SuspenseGlobalFallback } from "@/components/loaders"

import { MotionProvider } from "@/components/MotionProvider"
import { ConditionalFooter } from "@/components/layout/ConditionalFooter"
import { Toaster } from "@/components/ui/toaster"
import { BreadcrumbWelcome } from "@/components/auth/BreadcrumbWelcome"
import { ClientGuestProvider } from "@/components/guest/ClientGuestProvider"

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

      <body className="font-sans antialiased min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
       
          <Providers session={session}>
            {/* Skip Navigation for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground 
        focus:rounded focus:outline-none"
            >
              Skip to main content
            </a>

            <RootErrorBoundary>
              {/* Neobrutalist header - sticky with bold styling */}
              <header className="neuro-header sticky top-0 z-[60] bg-[var(--color-bg)] text-[var(--color-text)] border-b-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] transition-all duration-200">
                <BreadcrumbWelcome />
              </header>

              {/* Guest experience provider - client-only to prevent SSR issues */}
              <ClientGuestProvider>
                {/* Simplified noscript message */}
                <noscript>
                  <div className="bg-warning/10 border-l-4 border-warning p-4 m-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-warning">
                          JavaScript is required for CourseAI to work properly. Please enable JavaScript and refresh the
                          page.
                        </p>
                      </div>
                    </div>
                  </div>
                </noscript>

                <Suspense fallback={<SuspenseGlobalFallback />}>
                  <div className="relative min-h-screen flex flex-col border-l-0 border-r-0 sm:border-l-8 sm:border-r-8 border-[var(--color-border)]">
                    {/* Main Content */}
                    <main id="main-content" className="flex-1 w-full p-4 sm:p-6 lg:p-8 bg-[var(--color-bg)]">
                      <MotionProvider>
                        <Suspense fallback={<SuspenseGlobalFallback />}>{children}</Suspense>
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
            <Toaster />
          </Providers>

      </body>
    </html>
  )
}
