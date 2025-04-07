import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { Analytics } from "@/app/analytics"
import { defaultSEO } from "@/lib/seo-utils"
import { JsonLd } from "@/app/schema/components/json-ld"
import Footer from "@/components/shared/Footer"
import { Providers } from "@/providers/provider"
import { getAuthSession } from "@/lib/authOptions"

import TrialModal from "@/components/TrialModal"
import { SubscriptionService } from "@/services/subscription-service"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: defaultSEO.title,
    template: `%s - ${defaultSEO.siteName}`,
  },
  description: defaultSEO.description,
  keywords: [
    ...defaultSEO.keywords,
    "programming education",
    "coding courses",
    "learn to code",
    "developer skills",
    "programming quizzes",
    "coding exercises",
    "AI learning platform",
    "tech education",
    "software development learning",
    "web development courses",
    "JavaScript tutorials",
    "Python learning",
    "programming practice",
    "coding flashcards",
    "developer training",
  ],
  authors: [
    {
      name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "CourseAI Team",
      url: process.env.NEXT_PUBLIC_AUTHOR_URL,
    },
  ],
  creator: process.env.NEXT_PUBLIC_CREATOR || "CourseAI",
  openGraph: {
    type: "website",
    locale: defaultSEO.locale,
    url: defaultSEO.baseUrl,
    title: defaultSEO.title,
    description: defaultSEO.description,
    siteName: defaultSEO.siteName,
    images: [
      {
        url: `${defaultSEO.baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: defaultSEO.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSEO.title,
    description: defaultSEO.description,
    creator: defaultSEO.twitterHandle,
    images: [`${defaultSEO.baseUrl}/twitter-image.jpg`],
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
  icons: {
    icon: "/favicon.ico",
    shortcut: ["/favicon-16x16.png"],
    apple: ["/favicon-32x32.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: defaultSEO.baseUrl,
    languages: {
      "en-US": defaultSEO.baseUrl,
    },
  },
  metadataBase: new URL(defaultSEO.baseUrl),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null

  // Get subscription status for the modal
  let isSubscribed = false
  let currentPlan = null

  if (userId) {
    try {
      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)
      const plan = subscriptionStatus?.subscriptionPlan
      const status = subscriptionStatus?.isActive ? "ACTIVE" : "INACTIVE"
      isSubscribed = status === "ACTIVE"
      currentPlan = plan
    } catch (error) {
      console.error("Error fetching subscription status:", error)
    }
  }

  // FAQ items for the site
  const faqItems = [
    {
      question: "What is CourseAI?",
      answer:
        "CourseAI is an AI-powered platform that helps you create and consume programming courses, quizzes, and learning materials. Our tools use advanced AI to generate customized educational content for developers.",
    },
    {
      question: "How can I get started with CourseAI?",
      answer:
        "You can sign up for a free account and immediately start exploring our courses, creating quizzes, or generating learning materials. No credit card required to get started.",
    },
    {
      question: "What programming languages do you support?",
      answer:
        "We support all major programming languages including JavaScript, Python, Java, C++, Ruby, PHP, Go, and many more. Our AI can generate content for virtually any programming language or framework.",
    },
    {
      question: "Is CourseAI suitable for beginners?",
      answer:
        "CourseAI offers content for all skill levels from complete beginners to advanced developers. Our courses and quizzes are designed to meet you at your current skill level.",
    },
  ]

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          {/* Place the TrialModal here, inside the Providers */}
          <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />

          <JsonLd type="default" />
          <JsonLd type="faq" data={faqItems} />

          <main className="flex-1 flex flex-col">{children}</main>
          <Analytics />
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

