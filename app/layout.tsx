import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

import Footer from "@/components/shared/Footer"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"

import { Suspense } from "react"
import { font } from "./font"

import { GlobalLoader } from "@/components/loaders"
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { DefaultSEO, generateMetadata } from "@/lib/seo"

import { GoogleAnalytics } from "@next/third-parties/google"

export const metadata: Metadata = generateMetadata({
  title: "CourseAI - AI-Powered Educational Content Creator",
  description:
    "Create professional courses, quizzes, and educational content with AI. Empower educators, trainers, and learners with intelligent content generation tools for any subject.",
  keywords: [
    "AI course creator",
    "AI quiz generator",
    "educational content creation",
    "e-learning platform",
    "course builder",
    "quiz maker",
    "AI education tools",
    "interactive learning",
    "assessment creation",
    "training materials",
    "online education",
    "educational technology",
    "automated content generation",
    "learning management",
    "course authoring",
    "educational AI",
    "teaching tools",
    "exam creator",
    "knowledge assessment",
    "courseai",
  ],
  canonical: "/",
  type: "website",
})
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()

  return (
    <GlobalLoaderProvider>
      <html lang="en" suppressHydrationWarning className="scroll-smooth overflow-x-hidden">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
          <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
          {/* Enhanced SEO and UX Meta Tags */}
          <meta name="theme-color" content="#0066cc" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="format-detection" content="telephone=no" />
          {/* Performance and Security Enhancements */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="DENY" />
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"} />
          {/* Font and Resource Preloading */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://api.openai.com" />
        </head>

        <body
          className={`${font.roboto.className} ${font.poppins.className ?? ""} ${font.openSans.className ?? ""} antialiased bg-background text-foreground min-h-screen overflow-x-hidden text-base`}
          role="document"
        >
          <a
            href="#main-content"
            className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg focus:text-sm"
          >
            Skip to main content
          </a>
          <Providers session={session}>
            <div className="min-h-screen flex flex-col relative">
              <main
                id="main-content"
                className="flex-1 w-full pb-12 sm:pb-16 md:pb-20 lg:pb-24 overflow-x-hidden"
                role="main"
                tabIndex={-1}
              >
                <Suspense fallback={<SuspenseGlobalFallback />}>{children}</Suspense>
              </main>
              <Footer />
            </div>
          </Providers>

          <DefaultSEO enableFAQ={false} />
          <GlobalLoader />
        </body>
        <GoogleAnalytics gaId="G-8E6345HNS4" />
      </html>
    </GlobalLoaderProvider>
  )
}
