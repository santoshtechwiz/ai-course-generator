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
import MainNavbar from "@/components/shared/MainNavbar"

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
        "CourseAI is an AI-powered platform that helps you instantly create professional programming courses, quizzes, flashcards, and learning materials. Our tools use advanced AI to generate customized content tailored to your learning or teaching goals.",
    },
    {
      question: "Is CourseAI free to use?",
      answer:
        "Yes, CourseAI offers a free tier with access to essential features. We also provide premium plans with advanced capabilities for educators, trainers, and institutions who need more powerful tools.",
    },
    {
      question: "What types of content can I create with CourseAI?",
      answer:
        "You can create complete programming courses, multiple-choice questions (MCQs), open-ended questions, coding quizzes, interactive exercises, flashcards, and various educational materials focused on coding and software development.",
    },
    {
      question: "How does CourseAI generate programming content?",
      answer:
        "CourseAI uses a combination of advanced AI technologies, including large language models, code analysis engines, and adaptive learning algorithms. This allows us to generate accurate, engaging, and relevant content across different programming languages and topics.",
    },
    {
      question: "Can I create private courses or content?",
      answer:
        "Yes, you can create private courses and materials that are only accessible to you or your selected audience.",
    },
    {
      question: "Can I share my content with others?",
      answer:
        "Absolutely! You can easily share your courses, quizzes, or flashcards with students, peers, or the public using shareable links or through your dashboard.",
    },
    {
      question: "Can I track learner progress?",
      answer:
        "Yes, CourseAI includes tools to monitor progress, view completion rates, quiz scores, and other engagement metrics to help you understand how your learners are performing.",
    },
    {
      question: "Can learners see correct answers and explanations?",
      answer:
        "Yes, learners can view the correct answers and detailed explanations for questions, helping them understand concepts better and improve their skills.",
    },
  ]

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <MainNavbar />
          {/* Place the TrialModal here, inside the Providers */}
          <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />

          <JsonLd type="default" />
          {/* <JsonLd type="faq" data={faqItems} /> */}

          <main className="flex-1 flex flex-col">{children}</main>
          <Analytics />
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
