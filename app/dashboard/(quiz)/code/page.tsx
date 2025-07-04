"use client"

import CodeQuizForm from "./components/CodeQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { GlobalLoader } from "@/components/ui/loader"
import { CourseAILoader } from "@/components/ui/loader/courseai-loader"



const CodePage = () => {
  // Use our standardized hook for all quiz pages
  const quizPlan = useQuizPlan();
  
  return (
    <QuizCreateLayout
      title="Code Quiz"
      description="Create programming challenges or learn with our pre-built coding exercises."
      quizType="code"
      helpText="Build exercises where users need to write or fix code. Perfect for programming practice and technical interviews."
      isLoggedIn={quizPlan.isLoggedIn}
    >
      {quizPlan.isLoading ? (
        <CourseAILoader context="loading" />
      ) : (
        <CodeQuizForm 
          credits={quizPlan.credits} 
          isLoggedIn={quizPlan.isLoggedIn} 
          maxQuestions={quizPlan.maxQuestions} 
        />
      )}
    </QuizCreateLayout>
  )
}

export default CodePage
