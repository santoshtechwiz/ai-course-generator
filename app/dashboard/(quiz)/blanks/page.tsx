"use client"

import BlankQuizForm from "./components/BlankQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"

import { Loader } from "@/components/ui/loader/index"

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
        <Loader context="quiz" />
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