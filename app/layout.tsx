import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

import { Analytics } from "./analytics"
import Footer from "@/components/shared/Footer"
import { Suspense } from "react"
import PageLoader from "@/components/ui/loader"
import { JsonLd } from "@/components/json-ld"
import { Providers } from "./providers/provider"
import GlobalLoader from "@/components/GlobalLoader"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"),
  title: {
    default: "Course AI: Smart Learning Platform | Create & Take Quizzes",
    template: `%s | Course AI`,
  },
  description:
    "Course AI: An intelligent learning platform for creating and taking quizzes, generating courses, and enhancing educational experiences. Perfect for students, educators, and lifelong learners.",
  keywords: [
    "online learning",
    "quiz generator",
    "course creation",
    "educational platform",
    "adaptive learning",
    "personalized education",
    "interactive quizzes",
    "skill assessment",
    "e-learning tools",
    "knowledge testing",
  ],
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR_NAME, url: process.env.NEXT_PUBLIC_AUTHOR_URL }],
  creator: process.env.NEXT_PUBLIC_CREATOR,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: "Course AI: Intelligent Learning Platform for Quizzes and Courses",
    description:
      "Elevate your learning experience with Course AI. Create, take, and share quizzes and courses tailored to your educational needs.",
    siteName: "Course AI - Smart Learning Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Course AI: Revolutionize Your Learning Journey",
    description: "Discover a smarter way to learn and teach with Course AI's interactive quizzes and adaptive courses.",
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
    <html lang="en" className={`${plusJakartaSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <JsonLd />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <GlobalLoader />
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

