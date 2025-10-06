'use client'

import CodeQuizForm from "./components/CodeQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { UnifiedLoader } from "@/components/loaders"
import { QuizCreationProtection } from "@/components/auth/RouteProtectionWrapper"

const CodePage = () => {
  // Use our standardized hook for all quiz pages
  const quizPlan = useQuizPlan();

  return (
    <QuizCreationProtection quizType="code">
      <QuizCreateLayout
        title="Code Quiz"
        description="Create programming challenges or learn with our pre-built coding exercises."
        quizType="code"
        helpText="Build exercises where users need to write or fix code. Perfect for programming practice and technical interviews."
        isLoggedIn={quizPlan.isLoggedIn}
      >
        {quizPlan.isLoading ? (
          <UnifiedLoader
            state="loading"
            variant="spinner"
            message="Loading quiz configuration..."
            size="md"
          />
        ) : (
          <CodeQuizForm 
            credits={quizPlan.credits} 
            isLoggedIn={quizPlan.isLoggedIn} 
            maxQuestions={quizPlan.maxQuestions} 
          />
        )}
      </QuizCreateLayout>
    </QuizCreationProtection>
  )
}

export default CodePage
