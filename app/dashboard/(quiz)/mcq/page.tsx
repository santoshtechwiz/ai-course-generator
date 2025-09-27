'use client';
import { useQuizPlan } from "../../../../hooks/useQuizPlan";
import CreateQuizForm from "./components/CreateQuizForm";
import { QuizCreateLayout } from "../components/QuizCreateLayout";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UnifiedLoader } from "@/components/loaders";

export const dynamic = 'force-dynamic'

const McqPage = () => {
  const quizPlan = useQuizPlan(1);
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
    <QuizCreateLayout
      title="Multiple Choice Questions"
      description="Create customized multiple choice questions or practice with our pre-built quizzes."
      quizType="mcq"
      helpText={`You can create quizzes with up to ${quizPlan.maxQuestions} questions based on your ${quizPlan.currentPlan} plan.`}
      isLoggedIn={quizPlan.isLoggedIn}
    >
      {quizPlan.isLoading ? (
        <UnifiedLoader
          state="loading"
          variant="spinner"
          message="Loading quiz configuration..."
          size="md"
        />
      ) : (
        <CreateQuizForm
          credits={quizPlan.credits}
          isLoggedIn={quizPlan.isLoggedIn}
          maxQuestions={quizPlan.maxQuestions}
          quizType="mcq"
          params={initialParams as any}
        />
      )}
    </QuizCreateLayout>
  );
};

export default McqPage;