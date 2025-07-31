
// ...removed 'use client' to allow metadata export...
import { generateMetadata } from "@/lib/seo";
export const metadata = generateMetadata({
  title: "Create Code Quiz | CourseAI",
  description: "Create programming challenges or learn with our pre-built coding exercises. Perfect for technical interviews, developer training, and practice.",
  keywords: [
    "code quiz",
    "coding quiz",
    "programming quiz",
    "developer quiz",
    "CourseAI code quiz"
  ],
  type: "website",
});

import CodeQuizForm from "./components/CodeQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { GlobalLoader } from "@/components/loaders";
import { useQuizPlan } from "@/modules/auth";

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
          <GlobalLoader />
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
