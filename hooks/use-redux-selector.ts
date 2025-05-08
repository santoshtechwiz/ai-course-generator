"use client"

import { useAppSelector } from "@/store"
import { useMemo } from "react"

// Quiz state selectors
export const useQuizSelectors = () => {
  const quizState = useAppSelector(state => state.quiz)
  
  const selectors = useMemo(() => ({
    // General quiz info
    getQuizId: () => quizState.quizId,
    getQuizSlug: () => quizState.slug,
    getQuizTitle: () => quizState.title,
    getQuizType: () => quizState.quizType,
    
    // Questions and answers
    getQuestions: () => quizState.questions,
    getCurrentQuestionIndex: () => quizState.currentQuestionIndex,
    getCurrentQuestion: () => quizState.questions[quizState.currentQuestionIndex],
    getAnswers: () => quizState.answers,
    
    // Quiz progress
    getIsCompleted: () => quizState.isCompleted,
    getScore: () => quizState.score,
    getCompletedAt: () => quizState.completedAt,
    getResultsSaved: () => quizState.resultsSaved,
    
    // Auth-related
    getRequiresAuth: () => quizState.requiresAuth,
    getPendingAuthRequired: () => quizState.pendingAuthRequired,
    getIsProcessingAuth: () => quizState.isProcessingAuth,
    
    // Other states
    getError: () => quizState.error,
    getAnimationState: () => quizState.animationState,
    getNonAuthenticatedUserResults: () => quizState.nonAuthenticatedUserResults,
    getCurrentResult: () => quizState.currentResult,
    
    // Computed values
    getTotalQuestions: () => quizState.questions.length,

\
