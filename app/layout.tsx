import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"


import Footer from "@/components/shared/Footer"
import { Suspense } from "react"
import PageLoader from "@/components/ui/loader"
import { JsonLd } from "@/components/json-ld"

import GlobalLoader from "@/components/GlobalLoader"
import { Providers } from "./providers/provider"
import { Analytics } from "./analytics"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"),
  title: {
    default: "CourseAI: AI-Powered Coding MCQs & Learning Resources",
    template: `%s | CourseAI`,
  },
  description:
    "Master coding with CourseAI's AI-powered MCQs, quizzes, and personalized learning resources. Enhance your programming skills through interactive practice and smart feedback.",
  keywords: [
    "coding MCQs",
    "programming quizzes",
    "AI learning",
    "coding practice",
    "programming resources",
    "interactive coding",
    "learn to code",
    "coding assessment",
    "programming education",
    "AI-powered learning",
  ],
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR_NAME, url: process.env.NEXT_PUBLIC_AUTHOR_URL }],
  creator: process.env.NEXT_PUBLIC_CREATOR,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: "CourseAI: AI-Powered Coding MCQs & Learning Platform",
    description:
      "Accelerate your programming journey with CourseAI. Practice with AI-generated coding questions and receive personalized learning recommendations.",
    siteName: "CourseAI - Coding Education Platform",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "CourseAI - Coding Education Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseAI: Master Coding Through AI-Powered Practice",
    description: "Improve your programming skills with interactive coding MCQs and personalized learning paths.",
    creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    site: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/twitter-image.jpg`],
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
    languages: {
      "en-US": `${process.env.NEXT_PUBLIC_SITE_URL}/en-US`,
    },
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

