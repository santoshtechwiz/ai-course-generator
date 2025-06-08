"use client";

import { useQuizPlan } from "../hooks/useQuizPlan";
import CreateQuizForm from "../components/CreateQuizForm";
import { QuizCreateLayout } from "../components/QuizCreateLayout";

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
      <CreateQuizForm
        credits={quizPlan.credits}
        isLoggedIn={quizPlan.isLoggedIn}
        maxQuestions={quizPlan.maxQuestions}
        currentPlan={quizPlan.currentPlan}
        isLoading={quizPlan.isLoading}
      />
    </QuizCreateLayout>
  );
};

export default McqPage;