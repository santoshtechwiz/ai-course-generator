'use client'

import BlankQuizForm from "./components/BlankQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { UnifiedLoader } from "@/components/loaders"
import { QuizCreationProtection } from "@/components/auth/RouteProtectionWrapper"

const BlankPage = () => {
  // Use our standardized hook for all quiz pages
  const quizPlan = useQuizPlan();
  
  return (
    <QuizCreationProtection quizType="blanks">
      <QuizCreateLayout
        title="Fill in the Blanks"
        description="Create customized fill-in-the-blank exercises or practice with our pre-built quizzes."
        quizType="blanks"
        helpText="Create exercises where users fill in missing words or phrases. Great for language learning and vocabulary building."
        isLoggedIn={quizPlan.isLoggedIn}
      >
        {quizPlan.isLoading ? (
          <UnifiedLoader
            state="loading"
            variant="spinner"
            message="Loading quiz form..."
            size="md"
          />
        ) : (
          <BlankQuizForm 
            credits={quizPlan.credits} 
            isLoggedIn={quizPlan.isLoggedIn} 
            maxQuestions={quizPlan.maxQuestions} 
          />
        )}
      </QuizCreateLayout>
    </QuizCreationProtection>
  )
}

export default BlankPage