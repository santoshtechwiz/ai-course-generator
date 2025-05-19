import React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import QuizCreationPage from "../components/QuizCreationPage"
import useSubscription from "@/hooks/use-subscription"

export const metadata: Metadata = generatePageMetadata({
  title: "Create Open-Ended Quiz | CourseAI",
  description:
    "Generate custom open-ended coding quizzes on any programming topic. Test your problem-solving skills with free-form questions.",
  path: "/dashboard/openended",
})

export default async function OpenEndedQuizPage() {
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!session?.user

  // Get user credits - default to 5 for non-authenticated users
  let credits = 5
  let tier = "free"

  if (isAuthenticated) {
    const { data:subscription } = useSubscription();

    tier = subscription?.plan?.name || "free"
    const maxCredits = subscription?.plan?.features?.credits || 5
    const usedCredits = subscription?.tokensUsed || 0
    credits = Math.max(0, maxCredits - usedCredits)
  }

  // Define redirect behavior for post-auth
  const urlSearchParams = new URLSearchParams()
  urlSearchParams.set("callbackUrl", "/dashboard/openended")

  const authRedirect = `/auth/signin?${urlSearchParams.toString()}`

  return (
    <QuizCreationPage
      type="openended"
      title="Open-Ended Quiz"
      metadata={{
        heading: "Create Open-Ended Programming Quiz",
        description:
          "Generate custom quizzes with open-ended questions on any programming topic. These free-form questions help develop critical thinking and problem-solving skills.",
        features: [
          "Free-form answer format",
          "Detailed explanations",
          "Critical thinking focus",
          "Multiple difficulty levels",
        ],
      }}
      renderQuizForm={() => (
        <div className="max-w-3xl mx-auto w-full">
          {/* Dynamically import the form component client-side */}
          {/* @ts-ignore - Dynamic component import */}
          <OpenEndedQuizForm
            credits={credits}
            maxQuestions={tier === "free" ? 5 : tier === "pro" ? 10 : 15}
            isLoggedIn={isAuthenticated}
            authRedirect={authRedirect}
          />
        </div>
      )}
    />
  )
}
