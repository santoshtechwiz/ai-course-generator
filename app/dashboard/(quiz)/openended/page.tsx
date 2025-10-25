"use client";

import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription";
import { useAuth } from "@/modules/auth";
import { QuizCreateLayout } from "../components/QuizCreateLayout";
import OpenEndedQuizForm from "./components/OpenEndedQuizForm";
import { AppLoader } from "@/components/ui/loader"
import { UnifiedUpgradeTrigger } from "@/components/shared/UnifiedUpgradeTrigger";
import { useEffect } from "react";
import { getPlanConfig } from "@/types/subscription-plans";

const OpenEndedPage = () => {
  // ✅ Use unified feature access system
  const { canAccess, requiredPlan } = useFeatureAccess('quiz-openended');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, plan, hasCredits, isLoading: subLoading } = useUnifiedSubscription();
  
  const isLoading = authLoading || subLoading;
  const currentPlan = (plan || 'FREE') as import('@/types/subscription-plans').SubscriptionPlanType;
  const planConfig = getPlanConfig(currentPlan);
  const credits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0));

  // Log access status for debugging
  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      console.log('[OpenEndedPage] User exploring restricted feature (non-blocking):', {
        currentPlan,
        requiredPlan,
        canAccess
      });
    }
  }, [isLoading, isAuthenticated, canAccess, currentPlan, requiredPlan]);

  // ✅ NEW: Non-blocking exploration - always show the form
  // UnifiedUpgradeTrigger will handle contextual upgrade prompts

  return (
    <QuizCreateLayout
      title="Open Ended Questions"
      description="Create customized open-ended questions or practice with our pre-built exercises."
      quizType="openended"
      helpText={`You can create quizzes with up to ${planConfig.maxQuestionsPerQuiz} questions based on your ${currentPlan} plan.`}
      isLoggedIn={isAuthenticated}
    >
      {isLoading ? (
        <AppLoader
          size="medium"
          message="Loading quiz configuration..."
        />
      ) : (
        <>
          <OpenEndedQuizForm
            credits={credits}
            isLoggedIn={isAuthenticated}
            maxQuestions={typeof planConfig.maxQuestionsPerQuiz === 'number' ? planConfig.maxQuestionsPerQuiz : 50}
          />
          
          {/* ✅ Non-blocking upgrade trigger - shows contextual prompt if user lacks access */}
          {isAuthenticated && !canAccess && (
            <UnifiedUpgradeTrigger 
              feature="Open-Ended Questions"
              requiredPlan={requiredPlan || 'PREMIUM'}
              triggerOnMount={true}
              delay={2000}
            />
          )}
        </>
      )}
    </QuizCreateLayout>
  );
};

export default OpenEndedPage;