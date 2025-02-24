import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { Analytics } from "./analytics"
import Footer from "@/components/shared/Footer"
import { Suspense } from "react"
import PageLoader from "@/components/ui/loader"
import { JsonLd } from "@/components/json-ld"
import { Providers } from "./providers/provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"),
  title: {
    default: "Course AI: Smart Quiz Generator & Course Creator | Create Quizzes Instantly",
    template: `%s | Course AI - AI Quiz Generator`,
  },
  description:
    "Create professional quizzes and assessments instantly with AI. Generate multiple-choice questions, course materials, and interactive tests from any content. Perfect for educators and trainers.",
  keywords: [
    "AI quiz generator",
    "quiz maker online",
    "multiple choice question generator",
    "test creator software",
    "quiz creation tool",
    "automatic quiz generator",
    "quiz builder AI",
    "educational quiz generator",
    "student assessment creator",
    "learning assessment platform",
  ],
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR_NAME, url: process.env.NEXT_PUBLIC_AUTHOR_URL }],
  creator: process.env.NEXT_PUBLIC_CREATOR,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: "Course AI: Create Professional Quizzes & Assessments with AI",
    description:
      "Generate quizzes, tests, and assessments instantly. Transform any content into professional educational materials with our AI-powered platform.",
    siteName: "Course AI - Smart Quiz Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Course AI: Create Professional Quizzes & Assessments with AI",
    description:
      "Generate quizzes, tests, and assessments instantly. Transform any content into professional educational materials.",
    creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    site: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
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
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <JsonLd />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}>{children}</Suspense>
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

