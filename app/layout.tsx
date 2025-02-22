import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers/provider"

import { ThemeProvider } from "./providers/theme-provider"
import PageLoader from "@/components/ui/loader"
import Footer from "./components/shared/Footer"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "./analytics"
import { quizSchema } from "./schema/quiz-schema"
import { courseSchema } from "./schema/course-schema"
import {breadcrumbSchema} from "./schema/breadcrumb-schema"
import { Suspense } from "react"

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
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Course AI - AI-Powered Quiz Generation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course AI: Create Professional Quizzes & Assessments with AI",
    description:
      "Generate quizzes, tests, and assessments instantly. Transform any content into professional educational materials.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/twitter-card.png`],
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
        <JsonLdScripts />
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

function JsonLdScripts() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Course AI Quiz Generator",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description: "AI-powered platform for creating quizzes, assessments, and educational content instantly",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "AI Quiz Generation",
              "Multiple Choice Questions",
              "True/False Questions",
              "Open-Ended Questions",
              "Video Quiz Creation",
              "PDF Quiz Generation",
              "Custom Templates",
              "Analytics Dashboard",
              "Automated Grading",
              "Question Bank",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1000",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(quizSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How does the AI quiz generator work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our AI analyzes your content (text, PDF, or video) and automatically generates relevant quiz questions, multiple choice options, and complete assessments in seconds.",
                },
              },
              {
                "@type": "Question",
                name: "What types of quizzes can I create?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can create multiple-choice questions, true/false questions, open-ended questions, and complete assessments. The platform supports various content formats including text, PDF, and video.",
                },
              },
              {
                "@type": "Question",
                name: "Can I customize the generated quizzes?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, you can fully customize all generated quizzes. Edit questions, modify answers, adjust difficulty levels, and apply your own templates to match your specific needs.",
                },
              },
              {
                "@type": "Question",
                name: "How can I use Course AI for my classroom?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Course AI is perfect for classroom use. Create quizzes from your teaching materials, generate homework assignments, develop practice tests, and track student progress through our analytics dashboard.",
                },
              },
              {
                "@type": "Question",
                name: "Can I generate quizzes from videos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Course AI can analyze video content and automatically generate relevant quizzes. Simply upload your video, and our AI will create questions based on the video content.",
                },
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Quiz Generator",
                description: "Create professional quizzes instantly with AI",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Course Creator",
                description: "Build complete courses with integrated assessments",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Question Bank",
                description: "Access thousands of AI-generated questions",
              },
              {
                "@type": "ListItem",
                position: 4,
                name: "Analytics Dashboard",
                description: "Track quiz performance and student progress",
              },
            ],
          }),
        }}
      />
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  )
}
