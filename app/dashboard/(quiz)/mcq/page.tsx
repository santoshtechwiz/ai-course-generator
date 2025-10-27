'use client';
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription";
import { useAuth } from "@/modules/auth";
import CreateQuizForm from "./components/CreateQuizForm";
import { QuizCreateInterface } from "@/components/dashboard/QuizCreateInterface";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppLoader } from "@/components/ui/loader"
import { getPlanConfig } from "@/types/subscription-plans";

export const dynamic = 'force-dynamic'

const McqPage = () => {
  // ✅ NEW: Use unified feature access system
  const { canAccess, requiredPlan } = useFeatureAccess('quiz-mcq');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, plan, hasCredits, isLoading: subLoading } = useUnifiedSubscription();
  
  const isLoading = authLoading || subLoading;
  const currentPlan = plan || 'FREE';
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
      // Use suggested data for initialization
      return {
        title: suggestedData.title || "",
        amount: suggestedData.questionCount || 5,
        difficulty: suggestedData.difficulty || "medium",
        topic: suggestedData.topic || "",
        suggestedPrompt: suggestedData.suggestedPrompt || ""
      };
    }

    if (!draft) return undefined;
    const p: Record<string, string> = {};
    if (draft.title) p.title = String(draft.title);
    if (draft.items?.length) p.amount = String(Math.max(1, draft.items.length));
    return p;
  }, [draft, suggestedData]);

  return (
    <QuizCreateInterface
      title="Multiple Choice Questions"
      description="Create customized multiple choice questions or practice with our pre-built quizzes."
      quizType="mcq"
      helpText={`You can create quizzes with up to ${planConfig.maxQuestionsPerQuiz} questions based on your ${currentPlan} plan.`}
      isLoggedIn={isAuthenticated}
    >
      {isLoading ? (
        <AppLoader
          size="medium"
          message="Loading quiz configuration..."
        />
      ) : (
        <CreateQuizForm
          credits={credits}
          isLoggedIn={isAuthenticated}
          maxQuestions={typeof planConfig.maxQuestionsPerQuiz === "number" ? planConfig.maxQuestionsPerQuiz : Infinity}
          quizType="mcq"
          params={initialParams as any}
        />
      )}
    </QuizCreateInterface>
  );
};

export default McqPage;