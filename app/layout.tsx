import type { Metadata } from "next";
import "../globals.css";

import { DefaultSEO, defaultMetadata } from "@/lib/seo-manager-new";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/store/provider";
import { getServerAuthSession } from "@/lib/server-auth";
import ClientLayoutWrapper from "./client-layout-wrapper";
import { Suspense } from "react";
import { font } from "./font";
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider";
import { GlobalLoader } from "@/components/loaders";

export const metadata: Metadata = {
  ...defaultMetadata,  metadataBase: new URL("https://courseai.io"),
  title: {
    default: "CourseAI - #1 Interactive Programming Learning Platform | Master Coding Skills",
    template: "%s | CourseAI - Professional Programming Education",
  },
  description:
    "Transform your programming career with CourseAI's AI-powered interactive quizzes, coding challenges, and expert-curated learning paths. Join 50,000+ developers advancing their skills daily.",
  keywords: [
    "programming quizzes",
    "coding challenges",
    "developer learning",
    "interactive coding",
    "tech education",
    "programming practice",
    "AI learning platform",
    "programming education",
    "learn to code",
    "coding quiz app",
    "professional development",
    "software engineering",
    "coding bootcamp",
    "technical interview prep",
    "programming certification",
    "developer skills assessment",
    "coding practice platform",
    "programming tutorial",
    "software development training",
    "tech career advancement"
  ],
  authors: [{ name: "CourseAI Team", url: "https://courseai.io/about" }],
  creator: "CourseAI",
  publisher: "CourseAI Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },  verification: {
    google: "your_google_verification_code_here",
    yandex: "your_yandex_verification_code_here",
    yahoo: "your_yahoo_verification_code_here",
  },
  alternates: {
    canonical: "/",
    languages: {
      'en-US': '/en-US',
      'es-ES': '/es-ES',
      'fr-FR': '/fr-FR',
      'de-DE': '/de-DE',
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://courseai.io",
    siteName: "CourseAI - Interactive Programming Learning Platform",
    title: "CourseAI - #1 Interactive Programming Learning Platform | Master Coding Skills",
    description:
      "Transform your programming career with CourseAI's AI-powered interactive quizzes, coding challenges, and expert-curated learning paths. Join 50,000+ developers advancing their skills daily.",
    images: [
      {
        url: "/images/og/courseai-og.png",
        width: 1200,
        height: 630,
        alt: "CourseAI - Interactive Programming Learning Platform with AI-powered quizzes and coding challenges",
      },
      {
        url: "/images/og/courseai-logo.png",
        width: 800,
        height: 600,
        alt: "CourseAI Logo - Professional Programming Education",
      },
    ],
    videos: [
      {
        url: "/videos/courseai-demo.mp4",
        width: 1920,
        height: 1080,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@courseai",
    creator: "@courseai",
    title: "CourseAI - #1 Interactive Programming Learning Platform",
    description:
      "Transform your programming career with AI-powered interactive quizzes, coding challenges, and expert-curated learning paths. Join 50,000+ developers!",
    images: ["/images/og/courseai-og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "CourseAI",
    statusBarStyle: "default",
  },
  applicationName: "CourseAI",
  referrer: "origin-when-cross-origin",
  category: "education",
  classification: "Programming Education Platform",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "theme-color": "#2563eb",
    "color-scheme": "light dark",
    "format-detection": "telephone=no",
    "business-name": "CourseAI Inc.",
    "business-type": "Educational Technology",
    "target-audience": "Software Developers, Programming Students, Tech Professionals",
    "content-language": "en-US",
    "geo-region": "US",
    "geo-placename": "United States",
    "rating": "General",
    "distribution": "Global",
    "revisit-after": "3 days",
    "expires": "never",
    "cache-control": "public, max-age=31536000",
    "pragma": "cache",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth overflow-x-hidden"
    >      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        
        {/* Advanced SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        <meta name="revisit-after" content="3 days" />
        <meta name="author" content="CourseAI Team" />
        <meta name="copyright" content="CourseAI Inc." />
        <meta name="reply-to" content="hello@courseai.io" />
        <meta name="owner" content="CourseAI Inc." />
        <meta name="url" content="https://courseai.io" />
        <meta name="identifier-URL" content="https://courseai.io" />
        <meta name="directory" content="submission" />
        <meta name="category" content="Education, Programming, Technology" />
        <meta name="coverage" content="Worldwide" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Business & Local SEO */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="geo.position" content="39.50;-98.35" />
        <meta name="ICBM" content="39.50, -98.35" />
        
        {/* Schema.org Business Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "CourseAI",
              "alternateName": "CourseAI Interactive Programming Learning Platform",
              "url": "https://courseai.io",
              "logo": "https://courseai.io/images/logo.png",
              "description": "Transform your programming career with CourseAI's AI-powered interactive quizzes, coding challenges, and expert-curated learning paths.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              },              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-COURSEAI",
                "contactType": "customer service",
                "email": "hello@courseai.io",
                "availableLanguage": ["English", "Spanish", "French", "German"],
                "hoursAvailable": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                  "opens": "00:00",
                  "closes": "23:59"
                }
              },
              "sameAs": [
                "https://twitter.com/courseai",
                "https://linkedin.com/company/courseai",
                "https://github.com/courseai",
                "https://facebook.com/courseai"
              ],
              "foundingDate": "2023",
              "areaServed": "Worldwide",
              "serviceType": "Online Programming Education",
              "hasCredential": "Accredited Programming Courses",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "15000",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
        
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CourseAI",
              "url": "https://courseai.io",
              "description": "Interactive programming learning platform with AI-powered quizzes and coding challenges",
              "publisher": {
                "@type": "Organization",
                "name": "CourseAI Inc."
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://courseai.io/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "mainEntity": {
                "@type": "Course",
                "name": "Interactive Programming Courses",
                "description": "Comprehensive programming education with interactive quizzes and real-world projects",
                "provider": {
                  "@type": "Organization",
                  "name": "CourseAI"
                }
              }
            })
          }}
        />
        
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://courseai.io"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Courses",
                  "item": "https://courseai.io/courses"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Quizzes",
                  "item": "https://courseai.io/quizzes"
                }
              ]
            })
          }}
        />
        
        {/* Product/Service Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "CourseAI Programming Education Platform",
              "description": "AI-powered interactive programming learning platform with quizzes, coding challenges, and personalized learning paths",
              "brand": {
                "@type": "Brand",
                "name": "CourseAI"
              },
              "manufacturer": {
                "@type": "Organization",
                "name": "CourseAI Inc."
              },
              "category": "Educational Software",
              "audience": {
                "@type": "Audience",
                "audienceType": "Software Developers, Programming Students, Tech Professionals"
              },
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Free Plan",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2025-12-31",
                  "description": "Basic access to programming quizzes and challenges"
                },
                {
                  "@type": "Offer",
                  "name": "Pro Plan",
                  "price": "29.99",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2025-12-31",
                  "description": "Advanced features, personalized learning paths, and certification"
                },
                {
                  "@type": "Offer",
                  "name": "Enterprise Plan",
                  "price": "99.99",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2025-12-31",
                  "description": "Team management, advanced analytics, and custom integrations"
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "15000",
                "bestRating": "5",
                "worstRating": "1"
              },
              "review": [
                {
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Sarah Johnson"
                  },
                  "reviewBody": "CourseAI transformed my programming skills. The interactive quizzes and AI-powered feedback helped me land my dream job as a software developer."
                },
                {
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Michael Chen"
                  },
                  "reviewBody": "Best programming learning platform I've used. The personalized learning paths and real-world coding challenges are exceptional."
                }
              ]
            })
          }}
        />
        
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What makes CourseAI different from other programming learning platforms?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CourseAI uses AI-powered adaptive learning, interactive coding challenges, and real-time feedback to provide personalized programming education that adapts to your learning style and pace."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How much does CourseAI cost?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CourseAI offers flexible pricing plans starting from free basic access to premium subscriptions with advanced features, personalized learning paths, and certification programs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What programming languages can I learn on CourseAI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CourseAI supports learning for JavaScript, Python, Java, C++, React, Node.js, and many other popular programming languages and frameworks through interactive quizzes and coding challenges."
                  }
                }
              ]
            })
          }}
        />        {/* Verification Tags */}
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
        <meta name="google-site-verification" content="your_google_verification_code_here" />
        <meta name="yandex-verification" content="your_yandex_verification_code_here" />
        <meta name="p:domain_verify" content="your_pinterest_verification_code_here" />
        <meta name="facebook-domain-verification" content="your_facebook_verification_code_here" />
        <meta name="linkedin-site-verification" content="your_linkedin_verification_code_here" />
        
        {/* Performance & Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="skype_toolbar" content="skype_toolbar_parser_compatible" />
        
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to External Domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* Additional Business SEO */}
        <meta name="business-name" content="CourseAI Inc." />
        <meta name="business-type" content="Educational Technology Platform" />
        <meta name="business-email" content="hello@courseai.io" />
        <meta name="business-phone" content="+1-555-COURSEAI" />
        <meta name="business-address" content="United States" />
        <meta name="business-hours" content="24/7 Online Platform" />
        <meta name="price-range" content="$0-$99/month" />
        <meta name="payment-methods" content="Credit Card, PayPal, Stripe" />
        <meta name="customer-service" content="24/7 Support Available" />
        <meta name="target-market" content="Software Developers, Programming Students, Tech Professionals" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//connect.facebook.net" />
        <link rel="dns-prefetch" href="//platform.twitter.com" />
      </head>

        <body
          className={`${font.roboto.className} ${font.poppins.className ?? ""} ${font.openSans.className ?? ""} antialiased bg-background text-foreground min-h-screen flex flex-col`}
        >
          <Providers session={session}>
            <ClientLayoutWrapper>
              <main className="flex-1 w-full">
                <Suspense
                  fallback={<GlobalLoader />}
                >
                  {children}
                </Suspense>
              </main>
              <Footer />
            </ClientLayoutWrapper>
          </Providers>

          <DefaultSEO currentPath="/" includeFAQ={true} />
        </body>
      </html>
      <GlobalLoader />
    </GlobalLoaderProvider>
  );
}
