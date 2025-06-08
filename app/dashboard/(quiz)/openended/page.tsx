"use client";

import { useQuizPlan } from "../hooks/useQuizPlan";
import CreateQuizForm from "./components/CreateQuizForm";
import { QuizCreateLayout } from "../components/QuizCreateLayout";
import { QuizLoader } from "@/components/ui/quiz-loader";
import OpenEndedQuizForm from "./components/OpenEndedQuizForm";

const McqPage = () => {
  // Use our custom hook that already handles session, auth, and subscription data
  const quizPlan = useQuizPlan(1); // Require 1 credit to create an MCQ quiz

  return (
    <QuizCreateLayout
      title="Multiple Choice Questions"
      description="Create customized multiple choice questions or practice with our pre-built quizzes."
      quizType="mcq"
      helpText={`You can create quizzes with up to ${quizPlan.maxQuestions} questions based on your ${quizPlan.currentPlan} plan.`}
      isLoggedIn={quizPlan.isLoggedIn}
    >
      {quizPlan.isLoading ? (
        <QuizLoader message="Loading subscription details..." subMessage="Getting your plan information" />
      ) : (
        <OpenEndedQuizForm
          credits={quizPlan.credits}
          isLoggedIn={quizPlan.isLoggedIn}
          maxQuestions={quizPlan.maxQuestions}
         
        />
      )}
    </QuizCreateLayout>
  );
};

export default McqPage;