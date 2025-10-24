'use client'

import BlankQuizForm from "./components/BlankQuizForm"
import { QuizCreateLayout } from "../components/QuizCreateLayout"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { ComponentLoader } from "@/components/loaders"
import { UnifiedUpgradeTrigger } from "@/components/shared/UnifiedUpgradeTrigger"
import { useAuth } from "@/modules/auth"
import { useEffect } from "react"
import { getPlanConfig, type SubscriptionPlanType } from "@/types/subscription-plans"

const BlankPage = () => {
  // ✅ Use unified feature access system
  const { canAccess, requiredPlan } = useFeatureAccess('quiz-blanks');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, plan, hasCredits, isLoading: subLoading } = useUnifiedSubscription();
  
  const isLoading = authLoading || subLoading;
  const currentPlan = (plan || 'FREE') as SubscriptionPlanType;
  const planConfig = getPlanConfig(currentPlan);
  const credits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0));

  // Log access attempt for debugging
  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      console.log('[BlankPage] User exploring restricted feature (non-blocking):', {
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
      title="Fill in the Blanks"
      description="Create customized fill-in-the-blank exercises or practice with our pre-built quizzes."
      quizType="blanks"
      helpText="Create exercises where users fill in missing words or phrases. Great for language learning and vocabulary building."
      isLoggedIn={isAuthenticated}
    >
      {isLoading ? (
        <ComponentLoader
          variant="skeleton"
          message="Loading quiz form..."
          size="lg"
          className="min-h-[60vh]"
        />
      ) : (
        <>
          <BlankQuizForm 
            credits={credits} 
            isLoggedIn={isAuthenticated} 
            maxQuestions={typeof planConfig.maxQuestionsPerQuiz === 'number' ? planConfig.maxQuestionsPerQuiz : 50} 
          />
          
          {/* ✅ Non-blocking upgrade trigger - shows contextual prompt if user lacks access */}
          {isAuthenticated && !canAccess && (
            <UnifiedUpgradeTrigger 
              feature="Fill-in-the-Blank Quizzes"
              requiredPlan={requiredPlan || 'BASIC'}
              triggerOnMount={true}
              delay={2000}
            />
          )}
        </>
      )}
    </QuizCreateLayout>
  )
}

export default BlankPage