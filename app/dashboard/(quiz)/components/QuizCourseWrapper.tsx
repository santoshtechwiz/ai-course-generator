"use client"

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import type { QueryParams } from "@/app/types/types"
import CreateQuizForm from "../mcq/components/CreateQuizForm"

import { Loader2 } from "lucide-react"
import ConsistentCard from "../../../../components/common/ConsistentCard"
import SUBSCRIPTION_PLANS from "@/types/subscription-plans"
import FlashCardCreate from "@/app/dashboard/(quiz)/flashcard/components/FlashCardCreate"
import FillInTheBlankQuizForm from "@/app/dashboard/(quiz)/blanks/components/BlankQuizForm"
import CodeQuizForm from "@/app/dashboard/(quiz)/code/components/CodeQuizForm"
import OpenEndedQuizForm from "@/app/dashboard/(quiz)/openended/components/OpenEndedQuizForm"
import OrderingQuizForm from "@/app/dashboard/(quiz)/ordering/components/OrderingQuizForm"

import { useAuth } from "@/modules/auth"
import CreateCourseForm from "../../create/components/CreateCourseForm"

type QuizType = "mcq" | "openended" | "fill-in-the-blanks" | "course" | "code" | "flashcard" | "ordering"

interface QuizCourseWrapperProps {
  type: QuizType
  queryParams?: QueryParams
}

// Named React component export for Fast Refresh compatibility
function QuizCourseWrapper({ type, queryParams }: QuizCourseWrapperProps) {
  const { user, isAuthenticated } = useAuth()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()

  // Merge URL search params with provided queryParams
  const urlParams = Object.fromEntries(searchParams?.entries() ?? [])
  const params: QueryParams = {
    title: urlParams.title as string || queryParams?.title || "",
    amount: urlParams.amount as string || queryParams?.amount || "",
    topic: urlParams.topic as string || queryParams?.topic || "", 
    difficulty: (queryParams?.difficulty || ["easy"]) as ["easy" | "medium" | "hard"],
    type: (urlParams.type || queryParams?.type || "mcq") as "mcq" | "open_ended" | "fill_in_the_blanks"
  }

  const subscriptionPlan = (user?.subscriptionPlan || "FREE") as keyof typeof SUBSCRIPTION_PLANS
  const plan = SUBSCRIPTION_PLANS[subscriptionPlan]

  const getMaxQuestions = () => {
    const maxQuestions = plan?.maxQuestionsPerQuiz
    return maxQuestions === 'unlimited' ? 999 : (maxQuestions || 5)
  }
  
  // Use unified auth state - no need to pass isLoggedIn since PlanAwareButton auto-detects
  const maxQuestions = getMaxQuestions()
  const credits = user?.credits || 0

  const commonProps = {
    maxQuestions,
    subscriptionPlan,
    // Remove isLoggedIn since PlanAwareButton now auto-detects authentication
    credits,
    params,
  }

  const renderQuizForm = () => {
    switch (type) {
      case "mcq":
        return <CreateQuizForm isLoggedIn={false} {...commonProps} />
      case "openended":
        return <OpenEndedQuizForm isLoggedIn={false} {...commonProps} />
      case "fill-in-the-blanks":
        return <FillInTheBlankQuizForm isLoggedIn={false} {...commonProps} />
      case "course":
        return <CreateCourseForm {...commonProps} />
      case "code":
        return <CodeQuizForm isLoggedIn={false} {...commonProps} />
      case "flashcard":
        return <FlashCardCreate isLoggedIn={false} maxCards={0} {...commonProps} />
      case "ordering":
        return <OrderingQuizForm isLoggedIn={false} maxSteps={maxQuestions} credits={credits} quizType="ordering" />
      default:
        return null
    }
  }

  if (status === "loading") {
    return (
      <ConsistentCard>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ConsistentCard>
    )
  }

  return <>{renderQuizForm()}</>
}

// Default export for Fast Refresh compatibility
export default QuizCourseWrapper
