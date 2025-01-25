'use client'

import { useSession } from "next-auth/react"
import FillInTheBlankQuizForm from "@/app/dashboard/components/BlankQuizForm"
import CreateCourseForm from "@/app/dashboard/create/components/CreateCourseForm"
import TopicForm from "@/app/dashboard/openended/components/TopicForm"
import CreateQuizForm from "@/app/dashboard/quiz/components/CreateQuizForm"
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"
import { useSubscription } from "@/hooks/useSubscription"
import Spinner from "./Spinner"


type QuizType = "mcq" | "openended" | "fill-in-the-blanks" | "course"

interface QuizWrapperProps {
  type: QuizType
}

export function QuizWrapper({ type }: QuizWrapperProps) {
  const { subscriptionStatus, isLoading } = useSubscription()
  const { data: session } = useSession()



  const subscriptionPlan = subscriptionStatus ? subscriptionStatus.subscriptionPlan : "FREE"
  const plan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionPlan)
  
  const getMaxQuestions = () => {
    switch (type) {
      case "mcq":
        return plan?.limits.mcq || 0
      case "openended":
        return plan?.limits.openEnded || 0
      case "fill-in-the-blanks":
        return plan?.limits.fillInTheBlanks || 0
      case "course":
        return plan?.limits.courses || 0
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
  }

  switch (type) {
    case "mcq":
      return <CreateQuizForm {...commonProps} />
    case "openended":
      return <TopicForm {...commonProps} />
    case "fill-in-the-blanks":
      return <FillInTheBlankQuizForm {...commonProps} />
    case "course":
      return <CreateCourseForm topic="" {...commonProps} />
    default:
      return null
  }
}
