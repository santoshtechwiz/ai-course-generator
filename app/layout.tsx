import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Outfit, Manrope } from "next/font/google"
import "../globals.css"

import Footer from "@/components/shared/Footer"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import { Suspense } from "react"

import GlobalLoaderProvider from "@/components/GlobalLoaderProvider"
import PageTransition from "@/components/shared/PageTransition"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { DefaultSEO, generateMetadata as generateBaseMetadata } from "@/lib/seo"
import { GoogleAnalytics } from "@next/third-parties/google"

// Modern font stack for excellent readability and performance
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  preload: true,
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
})



// Force dynamic rendering for personalized content
export const dynamic = "force-dynamic"
export const revalidate = 0

// Enhanced metadata generation with better SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const session = await getServerAuthSession()
    const userName = session?.user?.name
    const userTitle = userName ? `${userName}'s Dashboard` : null
    
    const title = userTitle 
      ? `${userTitle} • CourseAI` 
      : "CourseAI - AI-Powered Educational Content Creator"
    
    const description = session?.user 
      ? "Access your personalized dashboard to create courses, quizzes, and educational content with AI-powered tools."
      : "Create professional courses, quizzes, and educational content with AI. Transform learning with intelligent content generation for educators and trainers."

    return generateBaseMetadata({
      title,
      description,
      canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
      openGraph: {
        title,
        description,
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
        siteName: "CourseAI",
        type: "website",
        locale: "en_US",
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: "CourseAI - AI-Powered Educational Content Creator"
          }
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: "@courseai",
        site: "@courseai",
        images: ["/og-image.png"],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      category: "Education Technology",
      keywords: [
        "AI education",
        "course creator",
        "quiz maker",
        "educational content",
        "e-learning platform",
        "AI tutor",
        "learning management"
      ],
    })
  } catch (error) {
    console.error("Metadata generation error:", error)
    
    // Safe fallback metadata
    return {
      title: "CourseAI - AI-Powered Educational Content Creator",
      description: "Create professional courses, quizzes, and educational content with AI. Transform learning with intelligent content generation.",
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"),
      robots: "index, follow",
      openGraph: {
        title: "CourseAI - AI-Powered Educational Content Creator",
        description: "Create professional courses, quizzes, and educational content with AI.",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
        siteName: "CourseAI",
        locale: "en_US",
        type: "website",
      }
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()

  return (
    <GlobalLoaderProvider>
      <html 
        lang="en" 
        suppressHydrationWarning 
        className="scroll-smooth overflow-x-hidden"
        style={{
          colorScheme: "light dark",
          scrollBehavior: "smooth",
        }}
      >
        <head>
          {/* Enhanced Viewport and Mobile Optimization */}
          <meta 
            name="viewport" 
            content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes" 
          />
          
          {/* Search Engine Verification */}
          <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
          <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_VERIFICATION} />
          
          {/* Enhanced Theme and App Behavior */}
          <meta name="theme-color" content="#0066cc" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
          <meta name="color-scheme" content="light dark" />
          
          {/* Progressive Web App Enhancements */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="CourseAI" />
          <meta name="application-name" content="CourseAI" />
          
          {/* Enhanced Security Headers */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          {/* Removed X-Frame-Options meta tag; should be set via server/middleware */}
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />
          
          {/* Content Security and Optimization */}
          <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          
          {/* Canonical URL */}
          <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"} />
          
          {/* Enhanced Resource Hints */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://api.openai.com" />
          <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
          
          {/* Favicon and App Icons */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          
          {/* Performance Optimization */}
          <link rel="modulepreload" href="/js/main.js" />
          
          {/* Enhanced Schema Markup Preparation */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "CourseAI",
                "description": "AI-powered educational content creation platform",
                "url": process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "All",
                "offers": {
                  "@type": "Offer",
                  "category": "Educational Software"
                },
                "author": {
                  "@type": "Organization",
                  "name": "CourseAI"
                }
              })
            }}
          />
        </head>

        <body
          className={`
            ${inter.variable} 
            ${poppins.variable} 
            ${outfit.variable} 
            ${manrope.variable} 
          
            font-sans
            antialiased 
            bg-background 
            text-foreground 
            selection:bg-primary/20 
            selection:text-primary-foreground
            scroll-smooth
            overflow-x-hidden
          `}
          role="document"
          suppressHydrationWarning
        >
          {/* Enhanced Skip Navigation */}
          <a
            href="#main-content"
            className="
              skip-link 
              sr-only 
              focus:not-sr-only 
              focus:absolute 
              focus:top-4 
              focus:left-4 
              focus:z-[100] 
              focus:px-6 
              focus:py-3 
              focus:bg-primary 
              focus:text-primary-foreground 
              focus:rounded-lg 
              focus:outline-none 
              focus:ring-2 
              focus:ring-primary 
              focus:ring-offset-2
              focus:shadow-lg
              focus:font-medium
              transition-all
              duration-200
            "
          >
            Skip to main content
          </a>

          {/* Accessibility Announcements */}
          <div 
            id="announcements" 
            className="sr-only" 
            aria-live="polite" 
            aria-atomic="true"
          />
          
          <Providers session={session}>
            <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-background via-background to-muted/20">
              {/* Enhanced Loading States */}
              <noscript>
                <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
                  <div className="text-center p-8 max-w-md">
                    <h1 className="text-2xl font-bold mb-4">JavaScript Required</h1>
                    <p className="text-muted-foreground">
                      Please enable JavaScript in your browser to use CourseAI's full features.
                    </p>
                  </div>
                </div>
              </noscript>

              {/* Main Content Area with Enhanced Structure */}
              <main
                id="main-content"
                className="
                  flex-1 
                  w-full 
                  pb-12 
                  sm:pb-16 
                  md:pb-20 
                  lg:pb-24 
                  overflow-x-hidden
                  relative
                  z-10
                "
                role="main"
                tabIndex={-1}
              >
                <PageTransition>
                  <Suspense 
                    fallback={
                      <SuspenseGlobalFallback 
                        message="Loading your personalized experience..." 
                      />
                    }
                  >
                    {children}
                  </Suspense>
                </PageTransition>
              </main>

              {/* Enhanced Footer */}
              <Footer />
            </div>
          </Providers>

          {/* Enhanced SEO Components */}
          <DefaultSEO enableFAQ={false} />
          
          {/* Performance Monitoring */}
          {process.env.NODE_ENV === 'production' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Performance monitoring
                  if ('performance' in window) {
                    window.addEventListener('load', function() {
                      setTimeout(function() {
                        const perfData = performance.getEntriesByType('navigation')[0];
                        if (perfData && perfData.loadEventEnd > 0) {
                          const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                          console.log('Page load time:', loadTime + 'ms');
                        }
                      }, 0);
                    });
                  }
                `
              }}
            />
          )}
        </body>
        
        {/* Enhanced Analytics with Privacy */}
        <GoogleAnalytics 
          gaId={process.env.NEXT_PUBLIC_GA_ID || "G-8E6345HNS4"} 
        />
        
        {/* Additional Performance Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced font loading optimization
              if ('fonts' in document) {
                Promise.all([
                  document.fonts.load('400 1em Inter'),
                  document.fonts.load('600 1em Inter'),
                  document.fonts.load('500 1em Poppins')
                ]).then(function() {
                  document.documentElement.classList.add('fonts-loaded');
                });
              }
              
              // Enhanced scroll behavior
              if ('scrollBehavior' in document.documentElement.style) {
                document.documentElement.style.scrollBehavior = 'smooth';
              }
              
              // Preload critical resources
              const criticalResources = [
                '/api/auth/session',
                '/api/subscription'
              ];
              
              criticalResources.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                document.head.appendChild(link);
              });
            `
          }}
        />
      </html>
    </GlobalLoaderProvider>
  )
}