import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Outfit, Manrope } from "next/font/google"
import "../globals.css"

import Footer from "@/components/shared/Footer"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { StrictMode, Suspense } from "react"

import GlobalLoaderProvider from "@/components/GlobalLoaderProvider"
import PageTransition from "@/components/shared/PageTransition"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import { GoogleAnalytics } from "@next/third-parties/google"


// Fonts with consistent config
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: false,
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: false,
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: false,
  adjustFontFallback: false,
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: false,
  adjustFontFallback: false,
})

export const dynamic = "force-dynamic"

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

    const keywords = [
      "AI education",
      "course creator",
      "quiz maker",
      "educational content",
      "e-learning platform",
      "AI tutor",
      "learning management",
    ]

    // Call the unified generator with a MetadataConfig-compatible object.
    return generateBaseMetadata({
      title,
      description,
      canonical: siteUrl,
      keywords,
      type: "website",
      url: siteUrl,
    })
  } catch (error) {
    console.error("Metadata generation error:", error)
    return generateBaseMetadata({
      title: "CourseAI - AI-Powered Educational Content Creator",
      description:
        "Create professional courses, quizzes, and educational content with AI. Transform learning with intelligent content generation.",
      canonical: siteUrl,
      type: "website",
    })
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

          {/* Search Engine Verification */}
          {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
            <meta
              name="google-site-verification"
              content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
            />
          )}
          {process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && (
            <meta
              name="yandex-verification"
              content={process.env.NEXT_PUBLIC_YANDEX_VERIFICATION}
            />
          )}
          <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />

          {/* Theme and App Config */}
          <meta name="theme-color" content="#0066cc" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
          <meta name="color-scheme" content="light dark" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="application-name" content="CourseAI" />
          <meta name="apple-mobile-web-app-title" content="CourseAI" />

          {/* Security / Optimization */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

          {/* Resource Hints */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />

          {/* App Icons & Manifest */}
          <link rel="icon" href="/favicon.ico" sizes="32x32" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />

          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "CourseAI",
                description: "AI-powered educational content creation platform",
                url: siteUrl,
                applicationCategory: "EducationalApplication",
                operatingSystem: "Web",
                browserRequirements: "Requires JavaScript. Requires HTML5.",
                softwareVersion: "2.0",
                author: { "@type": "Organization", name: "CourseAI", url: siteUrl },
                offers: {
                  "@type": "Offer",
                  category: "Educational Software",
                  availability: "https://schema.org/InStock",
                },
              }),
            }}
          />
        </head>

        <body
          className={`${inter.variable} ${poppins.variable} ${outfit.variable} ${manrope.variable} 
            font-sans antialiased bg-background text-foreground 
            selection:bg-primary/20 selection:text-primary-foreground`}
          suppressHydrationWarning
        >
          <GlobalLoaderProvider>
          {/* Skip Navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
            focus:z-[9999] focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground 
            focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-foreground 
            focus:ring-offset-2 focus:font-medium transition-all duration-200"
          >
            Skip to main content
          </a>

          {/* Screen Reader Announcements */}
          <div id="announcements" className="sr-only" aria-live="polite" aria-atomic="true" />

          <StrictMode>
            <Providers session={session}>
              <div className="min-h-screen flex flex-col relative">
                <noscript>
                  <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
                    <div className="text-center max-w-md bg-card p-8 rounded-lg border">
                      <h1 className="text-2xl font-bold mb-4 text-card-foreground">JavaScript Required</h1>
                      <p className="text-muted-foreground mb-4">
                        CourseAI requires JavaScript to function properly. Please enable JavaScript in
                        your browser settings.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        If you continue to see this message, try refreshing the page or contact
                        support.
                      </p>
                    </div>
                  </div>
                </noscript>

                <main id="main-content" className="flex-1 w-full pb-16 relative" role="main" tabIndex={-1}>
                  <PageTransition>
                    <Suspense fallback={<SuspenseGlobalFallback />}>{children}</Suspense>
                  </PageTransition>
                </main>

                <Footer />
              </div>
            </Providers>
          </StrictMode>

          <DefaultSEO enableFAQ={false} />

          {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
          </GlobalLoaderProvider>
        </body>
      </html>
  )
}
