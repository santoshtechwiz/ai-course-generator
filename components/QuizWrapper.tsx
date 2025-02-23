'use client'

import { useSession } from "next-auth/react"


import useSubscriptionStore from "@/store/useSubscriptionStore"
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"
import { useSearchParams } from "next/navigation"
import { QueryParams } from "@/app/types/types"
import CreateQuizForm from "./features/quiz/CreateQuizForm"
import CodeQuizForm from "./features/code/CodeQuizForm"
import TopicForm from "./features/openended/TopicForm"
import CreateCourseForm from "./features/create/CreateCourseForm"
import FillInTheBlankQuizForm from "./features/blanks/BlankQuizForm"


type QuizType = "mcq" | "openended" | "fill-in-the-blanks" | "course"|'code';

interface QuizWrapperProps {
  type: QuizType;
  topic?: string;
  queryParams?: QueryParams
}

export function QuizWrapper({ type, queryParams }: QuizWrapperProps) {
  const { subscriptionStatus } = useSubscriptionStore()
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  // Merge URL search params with provided queryParams
  const params: QueryParams = {
    ...Object.fromEntries(searchParams?.entries() ?? []),
    ...queryParams,
  }



  const subscriptionPlan = subscriptionStatus ? subscriptionStatus.subscriptionPlan : "FREE"
  const plan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionPlan)
  
  const getMaxQuestions = () => {
    switch (type) {
      case "mcq":
        return plan?.limits.maxQuestionsPerQuiz || 0
      case "openended":
        return plan?.limits.maxQuestionsPerQuiz || 0
      case "fill-in-the-blanks":
        return plan?.limits.maxQuestionsPerQuiz || 0
      case "course":
        return plan?.limits.maxQuestionsPerQuiz || 0
      default:
        return 0
    }
  }

  const isLoggedIn = !!session?.user
  const maxQuestions = getMaxQuestions()
  const credits = subscriptionStatus?.credits || 0
  
  const commonProps = {
    maxQuestions,
    subscriptionPlan,
    isLoggedIn,
    credits,
    params,
    
  }

  switch (type) {
    case "mcq":
      return <CreateQuizForm {...commonProps} />
    case "openended":
      return <TopicForm {...commonProps} />
    case "fill-in-the-blanks":
      return <FillInTheBlankQuizForm {...commonProps} />
    case "course":
      return <CreateCourseForm  {...commonProps} />
    case 'code':
      return <CodeQuizForm {...commonProps}  />
    default:
      return null
  }
}
