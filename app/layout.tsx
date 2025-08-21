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

// Optimized font configurations with proper fallbacks
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  preload: true,
  adjustFontFallback: false, // Prevents layout shift
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "-apple-system", "sans-serif"],
  preload: true,
  adjustFontFallback: false,
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  preload: false, // Only preload critical fonts
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

// Force dynamic rendering for personalized content
export const dynamic = "force-dynamic"

// Enhanced metadata generation with proper error handling
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
  
  try {
    const session = await getServerAuthSession()
    const userName = session?.user?.name
    
    // Fix: Proper encoding for bullet character
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
      openGraph: {
        title,
        description,
        url: siteUrl,
        siteName: "CourseAI",
        type: "website",
        locale: "en_US",
        images: [
          {
            url: `${siteUrl}/og-image.png`,
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
        images: [`${siteUrl}/og-image.png`],
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
    
    // Comprehensive fallback metadata
    return {
      title: "CourseAI - AI-Powered Educational Content Creator",
      description: "Create professional courses, quizzes, and educational content with AI. Transform learning with intelligent content generation.",
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title: "CourseAI - AI-Powered Educational Content Creator",
        description: "Create professional courses, quizzes, and educational content with AI.",
        url: siteUrl,
        siteName: "CourseAI",
        locale: "en_US",
        type: "website",
        images: [
          {
            url: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: "CourseAI Platform"
          }
        ],
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  return (
    <GlobalLoaderProvider>
      <html 
        lang="en" 
        suppressHydrationWarning 
        className="scroll-smooth"
      >
        <head>
          {/* Critical Meta Tags */}
          <meta charSet="utf-8" />
          <meta 
            name="viewport" 
            content="width=device-width, initial-scale=1, viewport-fit=cover" 
          />
          
          {/* Search Engine Verification - Only if env vars exist */}
          {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
            <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
          )}
          {process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && (
            <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_VERIFICATION} />
          )}
          <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
          
          {/* Theme and App Configuration */}
          <meta name="theme-color" content="#0066cc" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
          <meta name="color-scheme" content="light dark" />
          
          {/* PWA Configuration */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="CourseAI" />
          <meta name="application-name" content="CourseAI" />
          
          {/* Content Security and Optimization */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
          
          {/* Resource Hints for Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />

          
          {/* App Icons and Manifest */}
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
                "name": "CourseAI",
                "description": "AI-powered educational content creation platform",
                "url": siteUrl,
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "Web",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "softwareVersion": "2.0",
                "author": {
                  "@type": "Organization",
                  "name": "CourseAI",
                  "url": siteUrl
                },
                "offers": {
                  "@type": "Offer",
                  "category": "Educational Software",
                  "availability": "https://schema.org/InStock"
                }
              }),
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
          `}
          suppressHydrationWarning
        >
         

          {/* Skip Navigation for Accessibility */}
          <a
            href="#main-content"
            className="
              sr-only 
              focus:not-sr-only 
              focus:absolute 
              focus:top-4 
              focus:left-4 
              focus:z-[9999] 
              focus:px-6 
              focus:py-3 
              focus:bg-primary 
              focus:text-primary-foreground 
              focus:rounded-lg 
              focus:outline-none 
              focus:ring-2 
              focus:ring-primary-foreground 
              focus:ring-offset-2
              focus:font-medium
              transition-all
              duration-200
            "
          >
            Skip to main content
          </a>

          {/* Screen Reader Announcements */}
          <div 
            id="announcements" 
            className="sr-only" 
            aria-live="polite" 
            aria-atomic="true"
          />
          
          <Providers session={session}>
            <div className="min-h-screen flex flex-col relative">
              {/* NoScript Fallback */}
              <noscript>
                <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
                  <div className="text-center max-w-md bg-card p-8 rounded-lg border">
                    <h1 className="text-2xl font-bold mb-4 text-card-foreground">JavaScript Required</h1>
                    <p className="text-muted-foreground mb-4">
                      CourseAI requires JavaScript to function properly. Please enable JavaScript in your browser settings.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you continue to see this message, try refreshing the page or contact support.
                    </p>
                  </div>
                </div>
              </noscript>

              {/* Main Content */}
              <main
                id="main-content"
                className="flex-1 w-full pb-12 sm:pb-16 md:pb-20 lg:pb-24 relative"
                role="main"
                tabIndex={-1}
              >
                <PageTransition>
                  <Suspense fallback={<SuspenseGlobalFallback />}>
                    {children}
                  </Suspense>
                </PageTransition>
              </main>

              <Footer />
            </div>
          </Providers>

          <DefaultSEO enableFAQ={false} />
          
          {/* Performance Monitoring - Production Only */}
          {process.env.NODE_ENV === 'production' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    // Font loading optimization
                    if ('fonts' in document && Promise) {
                      var fontPromises = [
                        document.fonts.load('400 1rem Inter'),
                        document.fonts.load('500 1rem Inter'),
                        document.fonts.load('600 1rem Inter')
                      ];
                      
                      Promise.all(fontPromises).then(function() {
                        document.documentElement.classList.add('fonts-loaded');
                      }).catch(function(err) {
                        console.warn('Font loading failed:', err);
                      });
                    }
                    
                    // Performance monitoring
                    if ('performance' in window && 'getEntriesByType' in performance) {
                      window.addEventListener('load', function() {
                        setTimeout(function() {
                          try {
                            var perfData = performance.getEntriesByType('navigation')[0];
                            if (perfData && perfData.loadEventEnd > 0) {
                              var loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
                              console.info('Page load time: ' + loadTime + 'ms');
                              
                              // Report Core Web Vitals if available
                              if ('PerformanceObserver' in window) {
                                try {
                                  new PerformanceObserver(function(list) {
                                    list.getEntries().forEach(function(entry) {
                                      if (entry.entryType === 'largest-contentful-paint') {
                                        console.info('LCP: ' + Math.round(entry.startTime) + 'ms');
                                      }
                                    });
                                  }).observe({ entryTypes: ['largest-contentful-paint'] });
                                } catch (e) {
                                  // PerformanceObserver not supported
                                }
                              }
                            }
                          } catch (err) {
                            console.warn('Performance monitoring failed:', err);
                          }
                        }, 100);
                      });
                    }
                    
                    // Critical resource prefetching
                    if ('fetch' in window) {
                      var criticalEndpoints = [
                        '/api/auth/session',
                        '/api/user/subscription'
                      ];
                      
                      criticalEndpoints.forEach(function(url) {
                        var link = document.createElement('link');
                        link.rel = 'prefetch';
                        link.href = url;
                        link.crossOrigin = 'anonymous';
                        document.head.appendChild(link);
                      });
                    }
                  })();
                `
              }}
            />
          )}
        </body>
        
        {/* Analytics - Proper conditional rendering */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </html>
    </GlobalLoaderProvider>
  )
}