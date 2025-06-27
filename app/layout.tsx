import type React from "react"
import type { Metadata } from "next"
import "../globals.css"
import "../fonts.css"  // Import our fallback font configuration
import { JsonLD } from "@/app/schema/components"
import { defaultMetadata } from "@/lib/seo"
 import { fontInterSans, fontRobotoSans } from "./font"

import Footer from "@/components/shared/Footer"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"
import ClientLayoutWrapper from "./client-layout-wrapper"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"),
  title: {
    default: "CourseAI - Interactive Programming Quizzes and Learning",
    template: "%s | CourseAI",
  },
  description:
    "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
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
  ],

  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://courseai.io",
    siteName: "CourseAI",
    title: "CourseAI - Interactive Programming Quizzes and Learning",
    description: "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
    images: [
      {
        url: "/images/og/courseai-og.png",
        width: 1200,
        height: 630,
        alt: "CourseAI - Interactive Programming Learning Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseAI - Interactive Programming Quizzes and Learning",
    description: "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
    creator: "@courseai",
    images: ["/images/og/courseai-og.png"]
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()
  return (    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`scroll-smooth `}
    >
      {/* ${fontInterSans.variable} ${fontRobotoSans.variable} */}
      <head>
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
      </head>

      <body className={`${fontInterSans.variable} ${fontRobotoSans.variable} antialiased min-h-screen flex flex-col`}>
        
        {/* Pass the server session to Providers */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
              <div className="flex justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
          }
        >
          <Providers session={session}>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </Providers>
          <Footer />
        </Suspense>


        <JsonLD
          type="website"
          data={{
            name: "Course AI",
            description: "AI-powered course and quiz generator for personalized learning",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app"}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
      </body>
    </html>
  )
}