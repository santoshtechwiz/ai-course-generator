
// ...removed 'use client' to allow metadata export...
import { generateMetadata } from "@/lib/seo";
export const metadata = generateMetadata({
  title: "Create Fill in the Blanks Quiz | CourseAI",
  description: "Create customized fill-in-the-blank exercises or practice with our pre-built quizzes. Ideal for language learning, vocabulary, and coding practice.",
  keywords: [
    "fill in the blanks quiz",
    "cloze quiz",
    "vocabulary quiz",
    "language learning quiz",
    "CourseAI blanks quiz"
  ],
  type: "website",
});

import BlankQuizForm from "./components/BlankQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useQuizPlan } from "../../../../hooks/useQuizPlan"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"




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
        <LoadingSpinner />
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