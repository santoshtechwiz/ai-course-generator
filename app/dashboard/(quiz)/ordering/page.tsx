'use client';
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription";
import { useAuth } from "@/modules/auth";
import { QuizCreateLayout } from "../components/QuizCreateLayout";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QuizLoader } from "@/components/quiz/QuizLoader";
import { getPlanConfig } from "@/types/subscription-plans";
import type { SubscriptionPlanType } from "@/types/subscription-plans";
import OrderingQuizForm from "./components/OrderingQuizForm";

export const dynamic = 'force-dynamic'

const OrderingQuizPage = () => {
  const { canAccess, requiredPlan } = useFeatureAccess('quiz-ordering');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, plan, hasCredits, isLoading: subLoading } = useUnifiedSubscription();
  
  const isLoading = authLoading || subLoading;
  const currentPlan = (plan || 'FREE') as SubscriptionPlanType;
  const planConfig = getPlanConfig(currentPlan);
  const credits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0));
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<any | null>(null);
  const [suggestedData, setSuggestedData] = useState<any | null>(null);

  useEffect(() => {
    if (searchParams?.get("draft") === "1") {
      try {
        const raw = sessionStorage.getItem("create_draft");
        if (raw) setDraft(JSON.parse(raw));
      } catch {}
    }

    // Handle suggested data from recommendations
    if (searchParams?.get("suggested") === "true") {
      try {
        const suggestedRaw = searchParams.get("data");
        if (suggestedRaw) {
          const parsedData = JSON.parse(decodeURIComponent(suggestedRaw));
          setSuggestedData(parsedData);
        }
      } catch (error) {
        console.error("Failed to parse suggested data:", error);
      }
    }
  }, [searchParams]);

  const initialParams = useMemo(() => {
    if (suggestedData) {
      return {
        topic: suggestedData.topic || "",
        numberOfSteps: suggestedData.numberOfSteps || 5,
        difficulty: suggestedData.difficulty || "medium",
        suggestedPrompt: suggestedData.suggestedPrompt || ""
      };
    }

    if (!draft) return undefined;
    const p: Record<string, string> = {};
    if (draft.topic) p.topic = String(draft.topic);
    if (draft.numberOfSteps) p.numberOfSteps = String(draft.numberOfSteps);
    return p;
  }, [draft, suggestedData]);

  return (
    <QuizCreateLayout
      title="Ordering Quiz"
      description="Create ordering and sequencing challenges or practice with our pre-built quizzes."
      quizType="quiz"
      helpText={`You can create ordering quizzes with up to ${planConfig.maxQuestionsPerQuiz} steps based on your ${currentPlan} plan.`}
      isLoggedIn={isAuthenticated}
    >
      {isLoading ? (
        <QuizLoader
          state="loading"
          context="page"
          variant="skeleton"
          message="Loading quiz configuration..."
          size="lg"
          className="min-h-[60vh]"
        />
      ) : (
        <OrderingQuizForm
          credits={credits}
          isLoggedIn={isAuthenticated}
          maxSteps={typeof planConfig.maxQuestionsPerQuiz === "number" ? planConfig.maxQuestionsPerQuiz : 20}
          quizType="ordering"
          params={initialParams as any}
        />
      )}
    </QuizCreateLayout>
  );
};

export default OrderingQuizPage;
