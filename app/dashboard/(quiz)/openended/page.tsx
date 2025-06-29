"use client";

import { useQuizPlan } from "../../../../hooks/useQuizPlan";
import { QuizCreateLayout } from "../components/QuizCreateLayout";
import { EnhancedLoader } from "@/components/ui/loader/index";
import OpenEndedQuizForm from "./components/OpenEndedQuizForm";
import { useAuth } from "@/hooks/use-auth"; // Updated import

const OpenEndedPage = () => {
  const { isAuthenticated } = useAuth(); // Use consolidated hook
  // Fix: Changed hook name from useQuizPlan to avoid duplicating the same hook
  // Fix: Update credit requirement to correct value for open-ended questions
  const quizPlan = useQuizPlan(2); // Require 2 credits for open-ended quiz (corrected from MCQ)

  return (
    <QuizCreateLayout
      title="Open Ended Questions"
      description="Create customized open-ended questions or practice with our pre-built exercises."
      quizType="openended"
      helpText={`You can create quizzes with up to ${quizPlan.maxQuestions} questions based on your ${quizPlan.currentPlan} plan.`}
      isLoggedIn={isAuthenticated} // Use isAuthenticated from useAuth
    >      {quizPlan.isLoading ? (
        <EnhancedLoader isLoading={true} message="Loading subscription details..." subMessage="Getting your plan information" />
      ) : (
        <OpenEndedQuizForm
          credits={quizPlan.credits}
          isLoggedIn={isAuthenticated} // Use isAuthenticated from useAuth
          maxQuestions={quizPlan.maxQuestions}
        />
      )}
    </QuizCreateLayout>
  );
};

export default OpenEndedPage;