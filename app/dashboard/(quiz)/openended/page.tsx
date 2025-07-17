"use client";

import { useGlobalLoader } from "@/store/global-loader";
import { useQuizPlan } from "../../../../hooks/useQuizPlan";
import { QuizCreateLayout } from "../components/QuizCreateLayout";

import OpenEndedQuizForm from "./components/OpenEndedQuizForm";
import { useAuth } from "@/modules/auth";
import { useEffect } from "react";

const OpenEndedPage = () => {
  const { isAuthenticated } = useAuth(); // Use consolidated hook
  // Fix: Changed hook name from useQuizPlan to avoid duplicating the same hook
  // Fix: Update credit requirement to correct value for open-ended questions
  const quizPlan = useQuizPlan(2); // Require 2 credits for open-ended quiz (corrected from MCQ)
  const { startQuizLoading, stopLoading } = useGlobalLoader();

  useEffect(() => {
    if (quizPlan.isLoading) {
      startQuizLoading("Open-Ended");
    } else {
      stopLoading();
    }
  }, [quizPlan.isLoading, startQuizLoading, stopLoading]);

  return (
    <QuizCreateLayout
      title="Open Ended Questions"
      description="Create customized open-ended questions or practice with our pre-built exercises."
      quizType="openended"
      helpText={`You can create quizzes with up to ${quizPlan.maxQuestions} questions based on your ${quizPlan.currentPlan} plan.`}
      isLoggedIn={isAuthenticated} // Use isAuthenticated from useAuth
    >
      {!quizPlan.isLoading && (
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