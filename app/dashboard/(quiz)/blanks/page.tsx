"use client"

import { useSession } from "next-auth/react"
import { useAuth } from "@/hooks/useAuth"
import BlankQuizForm from "./components/BlankQuizForm"
import useSubscription from "@/hooks/use-subscription"
import { QuizCreateLayout } from "../components/QuizCreateLayout"

const BlankPage = () => {
  const { data: session } = useSession()
  const { user } = useAuth()
  const { data: subscriptionData } = useSubscription()
  
  // Determine if the user is logged in
  const isLoggedIn = !!session || !!user
  
  // Calculate available credits
  const credits = user?.credits || subscriptionData?.credits || 0
  
  // Determine max questions based on subscription
  const maxQuestions = subscriptionData?.planId === "premium" ? 30 : 
                      subscriptionData?.planId === "basic" ? 15 : 10

  return (
    <QuizCreateLayout
      title="Fill in the Blanks"
      description="Create customized fill-in-the-blank exercises or practice with our pre-built quizzes."
      quizType="blanks"
      helpText="Create exercises where users fill in missing words or phrases. Great for language learning and vocabulary building."
      isLoggedIn={isLoggedIn}
    >
      <BlankQuizForm 
        credits={credits} 
        isLoggedIn={isLoggedIn} 
        maxQuestions={maxQuestions} 
      />
    </QuizCreateLayout>
  )
}

export default BlankPage