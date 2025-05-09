import type React from "react"
import type { Metadata } from "next"

import { RootProvider } from "@/providers/root-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import "./globals.css"

import { Analytics } from "@/app/analytics"
import { defaultSEO } from "@/lib/seo-utils"
import { JsonLd } from "@/app/schema/components/json-ld"
import Footer from "@/components/shared/Footer"
import { Providers } from "@/providers/provider"
import { getAuthSession } from "@/lib/authOptions"

import TrialModal from "@/components/TrialModal"
import { ThemeProvider } from "next-themes"
import { SubscriptionService } from "./dashboard/subscription/services/subscription-service"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
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
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  alternates: {
    canonical: "/",
  },
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
      isSubscribed = subscriptionStatus.isSubscribed
      currentPlan = subscriptionStatus.subscriptionPlan
    } catch (error) {
      console.error("Error fetching subscription status:", error)
      // Default to free plan if there's an error
      isSubscribed = false
      currentPlan = "FREE"
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
        "You can easily share your courses, quizzes, or flashcards with students, peers, or the public using shareable links or through your dashboard.",
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            {/* Place the TrialModal here, inside the Providers */}
            <Suspense fallback={<div>Loading...</div>}>
              <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />
            </Suspense>

            <JsonLd type="default" />
            {/* <JsonLd type="faq" data={faqItems} /> */}

            <main className="flex-1 flex flex-col pt-16">{children}</main>
            <Analytics />
            <Footer />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
