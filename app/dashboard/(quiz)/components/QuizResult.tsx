"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import type { AppDispatch } from "@/store"
import BlankQuizResults from "../blanks/components/BlankQuizResults"

import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded"
import { NoResults } from "@/components/ui/no-results"
import FlashCardResults from "../flashcard/components/FlashCardQuizResults"
import CodeQuizResult from "../code/components/CodeQuizResult"
import type { QuizType } from "@/types/quiz"
import {McqQuizResult} from "../mcq/components/McqQuizResult"

interface QuizResultProps {
  result: any
  slug: string
  quizType: QuizType
  onRetake?: () => void
}

export default function QuizResult({ result, slug, quizType = "mcq", onRetake }: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const handleRetake = () => {
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Results Not Found"
        description="We couldn't load your quiz results. The quiz may not have been completed."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
        }}
      />
    )
  }  // Ensure we sanitize the result object to prevent null reference errors
  const sanitizedResult = useMemo(() => {
    if (!result) return null;
    
    // Make a defensive copy and sanitize answers if needed
    const cleanResult = {...result};
    
    // Ensure answers is an array and filter out null values
    if (cleanResult.answers) {
      cleanResult.answers = Array.isArray(cleanResult.answers) 
        ? cleanResult.answers.filter((answer: any) => answer !== null && answer !== undefined)
        : [];
    } else {
      cleanResult.answers = [];
    }
    
    // Ensure questionResults is an array
    if (!Array.isArray(cleanResult.questionResults)) {
      cleanResult.questionResults = [];
    }
    
    // Ensure questions is an array
    if (!Array.isArray(cleanResult.questions)) {
      cleanResult.questions = [];
    }
    
    // Ensure each question has at least basic valid properties
    if (cleanResult.questions.length > 0) {
      cleanResult.questions = cleanResult.questions.map((q: any, idx: number) => ({
        id: q?.id || String(idx),
        question: q?.question || q?.text || "Question " + (idx + 1),
        ...q,
      }));
    }
    
    return cleanResult;
  }, [result]);
  
  const isValidResult =
    sanitizedResult &&
    (typeof sanitizedResult.percentage === "number" ||
      typeof sanitizedResult.score === "number" ||
      (Array.isArray(sanitizedResult.questionResults) && sanitizedResult.questionResults.length > 0) ||
      (Array.isArray(sanitizedResult.questions) && sanitizedResult.questions.length > 0) ||
      (Array.isArray(sanitizedResult.answers) && sanitizedResult.answers.length > 0))

  if (!isValidResult) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Quiz Results"
        description="Your quiz results appear to be incomplete or invalid. It's recommended to retake the quiz."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
        }}
      />
    )
  }

  // Enhanced result object with better title resolution
  const enhancedResult = {
    ...result,
    slug: slug,
    // Ensure we have a proper title
    title: getEnhancedTitle(result, slug, quizType),
  }

  const quizContent = renderQuizResultComponent(quizType, enhancedResult, slug, handleRetake)

  return <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">{quizContent}</div>
}

// Enhanced title resolution function
function getEnhancedTitle(result: any, slug: string, quizType: QuizType): string {
  // Priority 1: Use provided title if it's meaningful
  if (result?.title && result.title.trim() && !result.title.match(/^[a-zA-Z0-9]{6,}$/)) {
    return result.title.trim()
  }

  // Priority 2: Generate from quiz metadata
  const quizIdentifier = slug || result?.quizId || result?.id || "quiz"

  // Check if it looks like a slug/ID (alphanumeric, short)
  if (String(quizIdentifier).match(/^[a-zA-Z0-9]{6,}$/)) {
    const typeMap = {
      mcq: "Multiple Choice Quiz",
      code: "Code Challenge Quiz",
      blanks: "Fill in the Blanks Quiz",
      openended: "Open Ended Quiz",
      flashcard: "Flashcard Quiz",
    }
    return typeMap[quizType] || "Quiz"
  }

  // Priority 3: Use identifier if it looks like a proper title
  return String(quizIdentifier)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function renderQuizResultComponent(quizType: QuizType, result: any, slug: string, onRetake: () => void) {
  switch (quizType) {
    case "mcq":
      return <McqQuizResult result={result} onRetake={onRetake} />
    case "blanks":
      return <BlankQuizResults result={result} isAuthenticated={true} slug={slug} onRetake={onRetake} />
    case "openended":
      return <OpenEndedQuizResults result={result} isAuthenticated={true} slug={slug} onRetake={onRetake} />
    case "code":
      return <CodeQuizResult />
    case "flashcard":
      // Pass all result fields as props for consistency
      return (
        <FlashCardResults
          slug={slug}
          title={result?.title}
          score={result?.percentage ?? result?.score ?? 0}
          totalQuestions={result?.totalQuestions ?? result?.maxScore ?? result?.questions?.length ?? 0}
          correctAnswers={result?.correctAnswers ?? result?.userScore ?? 0}
          totalTime={result?.totalTime ?? 0}
          onRestart={onRetake}
        />
      )
    default:
      return <McqQuizResult result={result} onRetake={onRetake} />
  }
}
