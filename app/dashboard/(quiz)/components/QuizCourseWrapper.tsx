"use client"

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import type { QueryParams } from "@/app/types/types"
import CreateQuizForm from "../mcq/components/CreateQuizForm"

import { Loader2 } from "lucide-react"
import ConsistentCard from "../../../../components/ConsistentCard"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"
import FlashCardCreate from "@/app/dashboard/(quiz)/flashcard/components/FlashCardCreate"
import FillInTheBlankQuizForm from "@/app/dashboard/(quiz)/blanks/components/BlankQuizForm"
import CodeQuizForm from "@/app/dashboard/(quiz)/code/components/CodeQuizForm"
import OpenEndedQuizForm from "@/app/dashboard/(quiz)/openended/components/OpenEndedQuizForm"
import CreateCourseForm from "@/app/dashboard/course/create/components/CreateCourseForm"
import { useAuth } from "@/modules/auth"

type QuizType = "mcq" | "openended" | "fill-in-the-blanks" | "course" | "code" | "flashcard"

interface QuizCourseWrapperProps {
  type: QuizType
  queryParams?: QueryParams
}

export function QuizCourseWrapper({ type, queryParams }: QuizCourseWrapperProps) {
  const { user, isAuthenticated } = useAuth()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()

  // Merge URL search params with provided queryParams
  const params: QueryParams = {
    ...Object.fromEntries(searchParams?.entries() ?? []),
    ...queryParams,
  }

  const subscriptionPlan = user?.subscriptionPlan || "FREE"
  const plan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionPlan)

  const getMaxQuestions = () => {
    return plan?.limits.maxQuestionsPerQuiz || 5 // Default to 5 for FREE plan
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
