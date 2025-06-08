"use client"

import BlankQuizForm from "./components/BlankQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { QuizLoader } from "@/components/ui/quiz-loader"

const BlankPage = () => {
  // Use our standardized hook for all quiz pages
  const quizPlan = useQuizPlan();
  
  return (
    <QuizCreateLayout
      title="Fill in the Blanks"
      description="Create customized fill-in-the-blank exercises or practice with our pre-built quizzes."
      quizType="blanks"
      helpText="Create exercises where users fill in missing words or phrases. Great for language learning and vocabulary building."
      isLoggedIn={quizPlan.isLoggedIn}
    >
      {quizPlan.isLoading ? (
        <QuizLoader message="Loading subscription details..." subMessage="Getting your plan information" />
      ) : (
        <BlankQuizForm 
          credits={quizPlan.credits} 
          isLoggedIn={quizPlan.isLoggedIn} 
          maxQuestions={quizPlan.maxQuestions} 
        />
      )}
    </QuizCreateLayout>
  )
}

export default BlankPage