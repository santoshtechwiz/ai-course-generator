'use client'

import CodeQuizForm from "./components/CodeQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { AppLoader } from "@/components/ui/loader"
import { UnifiedUpgradeTrigger } from "@/components/shared/UnifiedUpgradeTrigger"
import { useAuth } from "@/modules/auth"
import { useEffect } from "react"
import { getPlanConfig, type SubscriptionPlanType } from "@/types/subscription-plans"

const CodePage = () => {
  // ✅ NEW: Use unified feature access system
  const { canAccess, requiredPlan } = useFeatureAccess('quiz-code');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, plan, hasCredits, isLoading: subLoading } = useUnifiedSubscription();
  
  const isLoading = authLoading || subLoading;
  const currentPlan = (plan || 'FREE') as SubscriptionPlanType;
  const planConfig = getPlanConfig(currentPlan);
  const credits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0));

  // Log access attempt for debugging
  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      console.log('[CodePage] User exploring restricted feature (non-blocking):', {
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
      title="Code Quiz"
      description="Create programming challenges or learn with our pre-built coding exercises."
      quizType="code"
      helpText="Build exercises where users need to write or fix code. Perfect for programming practice and technical interviews."
      isLoggedIn={isAuthenticated}
    >
      {isLoading ? (
        <AppLoader
          size="medium"
          message="Loading quiz configuration..."
        />
      ) : (
        <>
          <CodeQuizForm 
            credits={credits} 
            isLoggedIn={isAuthenticated} 
            maxQuestions={typeof planConfig.maxQuestionsPerQuiz === 'number' ? planConfig.maxQuestionsPerQuiz : 50} 
          />
          
          {/* ✅ Non-blocking upgrade trigger - shows contextual prompt if user lacks access */}
          {isAuthenticated && !canAccess && (
            <UnifiedUpgradeTrigger 
              feature="Code Quizzes"
              requiredPlan={requiredPlan || 'PREMIUM'}
              triggerOnMount={true}
              delay={2000}
            />
          )}
        </>
      )}
    </QuizCreateLayout>
  )
}

export default CodePage
