import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers/provider"
import { Suspense } from "react"
import { ThemeProvider } from "./providers/theme-provider"
import PageLoader from "@/components/ui/loader"
import Footer from "./components/shared/Footer"

import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "./analytics"


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"),
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME || "Course AI: AI-Powered Course Creation & Quiz Generation",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || "Course AI"}`,
  },
  description:
    "Create custom courses, generate quizzes, and transform video content into interactive learning materials with our AI-powered education platform. Revolutionize your learning experience with personalized course creation.",
  keywords: [
    "AI course creation",
    "personalized learning",
    "online courses",
    "adaptive learning",
    "quiz generation",
    "e-learning platform",
    "artificial intelligence in education",
    "smart tutoring",
    "interactive lessons",
    "skill development",
    "video transcript analysis",
    "PDF quiz download",
    "multiple choice questions",
    "open-ended questions",
    "coding quizzes",
    "educational technology",
  ],
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR_NAME, url: process.env.NEXT_PUBLIC_AUTHOR_URL }],
  creator: process.env.NEXT_PUBLIC_CREATOR,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: process.env.NEXT_PUBLIC_SITE_NAME || "Course AI: AI-Powered Course Creation & Quiz Generation",
    description:
      "Create custom courses, generate quizzes, and transform video content into interactive learning materials. Our AI-powered platform revolutionizes course creation and personalized education.",
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${process.env.NEXT_PUBLIC_SITE_NAME} - AI-Powered Course Creation Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: process.env.NEXT_PUBLIC_SITE_NAME || "Course AI: AI-Powered Course Creation & Quiz Generation",
    description:
      "Create custom courses, generate quizzes, and transform video content into interactive learning materials. Our AI-powered platform revolutionizes course creation and personalized education.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/twitter-card.png`],
    creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />
        <meta name="msvalidate.01" content="DF1C94243684F320757FDFABA3480C17" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
             
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>{children}</Suspense>
              </main>
              <Footer />
            </div>
            <Toaster />
          </Providers>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

