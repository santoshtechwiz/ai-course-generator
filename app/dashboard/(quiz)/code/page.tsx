"use client"

import CodeQuizForm from "./components/CodeQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { ClipLoader } from "react-spinners"



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
        <div className="flex flex-col items-center justify-center py-12">
          <ClipLoader color="#3B82F6" size={40} />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
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
