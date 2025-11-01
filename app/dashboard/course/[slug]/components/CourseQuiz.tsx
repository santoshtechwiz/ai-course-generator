"use client"

import { useCallback, useMemo, useEffect, useReducer, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-helper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks"
import { useSession } from "next-auth/react"
import { AccessControl } from "@/components/ui/access-control"
import { AlertCircle, CheckCircle, BookOpen, Lightbulb, XCircle, Award, BarChart3, RotateCcw, Home, Download, ArrowRight, Zap, Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { storageManager } from "@/utils/storage-manager"
import { useProgressEvents } from "@/utils/progress-events"
import { selectQuizProgressFromEvents, selectCurrentQuizAnswers } from "@/store/slices/progress-events-slice"
import { useAppSelector } from "@/store/hooks"
import type { QuizProgress } from "@/utils/storage-manager"

import type { CourseQuestion, FullChapterType, FullCourseType } from "@/app/types/types"
import type { AccessLevels } from "./types"

interface QuizProps {
  chapter: FullChapterType
  course: FullCourseType
  isPublicCourse: boolean
  chapterId?: string
  accessLevels: AccessLevels
  existingQuiz?: CourseQuestion[] | null
}

interface QuizState {
  answers: Record<string, string>
  currentQuestionIndex: number
  quizCompleted: boolean
  score: number
  showResults: boolean
  quizStarted: boolean
  quizProgress: Record<string, any>
  startTime: number
  questionStartTime: number
}

type QuizAction =
  | { type: "SET_ANSWER"; questionId: string; answer: string }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ"; score: number }
  | { type: "SHOW_RESULTS" }
  | { type: "START_QUIZ" }
  | { type: "RESET_QUIZ" }
  | { type: "LOAD_PROGRESS"; progress: Record<string, any> }
  | { type: "START_QUESTION_TIMER" }

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      }
    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        questionStartTime: Date.now(),
      }
    case "COMPLETE_QUIZ":
      return {
        ...state,
        quizCompleted: true,
        score: action.score,
      }
    case "SHOW_RESULTS":
      return { ...state, showResults: true }
    case "START_QUIZ":
      return { 
        ...state, 
        quizStarted: true,
        startTime: Date.now(),
        questionStartTime: Date.now(),
      }
    case "START_QUESTION_TIMER":
      return {
        ...state,
        questionStartTime: Date.now(),
      }
    case "RESET_QUIZ":
      return {
        answers: {},
        currentQuestionIndex: 0,
        quizCompleted: false,
        score: 0,
        showResults: false,
        quizStarted: false,
        quizProgress: {},
        startTime: 0,
        questionStartTime: 0,
      }
    case "LOAD_PROGRESS":
      return {
        ...state,
        quizProgress: action.progress,
        ...(action.progress.completed && {
          quizCompleted: true,
          score: action.progress.score || 0,
          answers: action.progress.answers || {},
        }),
        ...(action.progress.currentIndex !== undefined && {
          currentQuestionIndex: action.progress.currentIndex,
          answers: action.progress.answers || {},
          quizStarted: true,
        }),
      }
    default:
      return state
  }
}

const QuizSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto border-4 border-border shadow-neo">
    <CardContent className="p-8 space-y-6">
      <Skeleton className="h-8 w-64 bg-muted" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full bg-muted border-2 border-border" />
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-12 w-32 bg-muted border-2 border-border" />
      </div>
    </CardContent>
  </Card>
)

export default function CourseDetailsQuiz({ chapter, course, isPublicCourse, chapterId, accessLevels, existingQuiz }: QuizProps) {
  const hasQuizAccess = accessLevels.isSubscribed || chapter?.isFree === true || (chapter as any)?.isFreeQuiz === true
  const { toast } = useToast()
  const { data: session } = useSession()
  const isUserAuthenticated = accessLevels.isAuthenticated || !!session
  const effectiveChapterId = chapterId || chapter?.id?.toString()
  const canFetchQuestions = hasQuizAccess

  const { dispatchQuizStarted, dispatchQuestionAnswered, dispatchQuizCompleted } = useProgressEvents()
  const userId = session?.user?.id || ''

  const quizProgress = useAppSelector((state) => selectQuizProgressFromEvents(state))
  const currentAnswers = useAppSelector((state) => selectCurrentQuizAnswers(state, effectiveChapterId || ''))

  const initialQuizState: QuizState = {
    answers: {},
    currentQuestionIndex: 0,
    quizCompleted: false,
    score: 0,
    showResults: false,
    quizStarted: false,
    quizProgress: {},
    startTime: 0,
    questionStartTime: 0,
  }

  const [quizState, dispatch] = useReducer(quizReducer, initialQuizState)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)

  useEffect(() => {
    dispatch({ type: "RESET_QUIZ" })
    setSelectedOption("")
    setShowFeedback(false)
  }, [effectiveChapterId])

  const demoQuestions = useMemo(
    () => [
      {
        id: "obs-1",
        question: "How would you best describe an Observable in reactive programming?",
        options: ["stream of Click events", "object function", "data storage detail", "sequence of Click events"],
        answer: "stream of Click events",
      },
    ],
    [],
  )

  useEffect(() => {
    if (effectiveChapterId && course?.id) {
      try {
        const progress = storageManager.getQuizProgress(String(course.id), effectiveChapterId)
        if (progress) {
          dispatch({ type: "LOAD_PROGRESS", progress: {
            answers: progress.answers,
            currentQuestionIndex: progress.currentQuestionIndex,
            lastUpdated: new Date(progress.lastUpdated).toISOString()
          } })
        }
      } catch (e) {
        console.error("Failed to load quiz progress", e)
      }
    }
  }, [effectiveChapterId, course?.id])

  const saveProgress = useCallback(
    (data: Record<string, any>) => {
      if (!effectiveChapterId || !course?.id) return
      try {
        const progress: QuizProgress = {
          courseId: String(course.id),
          chapterId: effectiveChapterId,
          progress: data.currentQuestionIndex || quizState.currentQuestionIndex,
          answers: { ...quizState.quizProgress.answers, ...data.answers },
          completed: data.isCompleted || false,
          score: data.score,
          timeSpent: data.timeSpent || 0,
          lastUpdated: Date.now()
        }
        storageManager.saveQuizProgress(progress)
      } catch (e) {
        console.error("Failed to save quiz progress", e)
      }
    },
    [quizState.quizProgress, quizState.currentQuestionIndex, effectiveChapterId, course?.id],
  )

  const {
    data: questions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CourseQuestion[]>({
    queryKey: ["chapter-quiz", effectiveChapterId],
    queryFn: async () => {
      if (!chapter?.videoId || !effectiveChapterId) throw new Error("Missing chapter data")

      const response = await api.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      return response.map((q: any) => ({
        ...q,
        id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
        options: Array.isArray(q.options)
          ? q.options
          : typeof q.options === "string"
            ? (() => {
                try {
                  return JSON.parse(q.options)
                } catch {
                  return []
                }
              })()
            : q.options
              ? [q.options]
              : [],
      }))
    },
    enabled: !!effectiveChapterId && quizState.quizStarted && canFetchQuestions,
    retry: 2,
  })

  // Lazy generation query - triggers quiz generation when tab is accessed but no existing quiz exists
  const { refetch: triggerQuizGeneration, data: generatedQuestions } = useQuery<CourseQuestion[]>({
    queryKey: ["chapter-quiz-generation", effectiveChapterId],
    queryFn: async () => {
      if (!chapter?.videoId || !effectiveChapterId) throw new Error("Missing chapter data")

      const response = await api.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      return response.map((q: any) => ({
        ...q,
        id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
        options: Array.isArray(q.options)
          ? q.options
          : typeof q.options === "string"
            ? (() => {
                try {
                  return JSON.parse(q.options)
                } catch {
                  return []
                }
              })()
            : q.options
              ? [q.options]
              : [],
      }))
    },
    enabled: false, // Manually triggered
    retry: 2,
  })

  // Trigger lazy quiz generation when component mounts and no existing quiz is available
  useEffect(() => {
    if (
      effectiveChapterId &&
      canFetchQuestions &&
      isUserAuthenticated &&
      (!existingQuiz || existingQuiz.length === 0) &&
      !quizState.quizStarted // Don't trigger if quiz is already started
    ) {
      console.log(`[CourseQuiz] Triggering lazy quiz generation for chapter ${effectiveChapterId}`)
      triggerQuizGeneration()
    }
  }, [effectiveChapterId, canFetchQuestions, isUserAuthenticated, existingQuiz, quizState.quizStarted, triggerQuizGeneration])

  const effectiveQuestions: CourseQuestion[] = useMemo(() => {
    if (!isUserAuthenticated) return demoQuestions

    // Prioritize existing pre-generated quiz questions
    if (existingQuiz && Array.isArray(existingQuiz) && existingQuiz.length > 0) {
      return existingQuiz
    }

    // Use questions from lazy generation if available
    if (generatedQuestions && Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
      return generatedQuestions
    }

    // Fall back to fetched questions
    return questions && Array.isArray(questions) && questions.length > 0 ? questions : []
  }, [isUserAuthenticated, questions, demoQuestions, existingQuiz, generatedQuestions])

  const currentQuestion = effectiveQuestions[quizState.currentQuestionIndex] || null

  const startQuiz = useCallback(() => {
    dispatch({ type: "START_QUIZ" })
    saveProgress({ started: true, startedAt: new Date().toISOString() })
    refetch()

    if (userId && effectiveChapterId && course?.id) {
      dispatchQuizStarted(
        userId,
        effectiveChapterId,
        'mcq',
        course.slug || '',
        effectiveQuestions.length
      )
    }
  }, [saveProgress, refetch, dispatchQuizStarted, userId, effectiveChapterId, course?.id, course?.slug, effectiveQuestions.length])

  const handleAnswer = (value: string) => {
    if (!currentQuestion || showFeedback) return
    setSelectedOption(value)
  }

  const handleNextQuestion = () => {
    if (quizState.currentQuestionIndex < effectiveQuestions.length - 1) {
      dispatch({ type: "NEXT_QUESTION" })
      saveProgress({ currentIndex: quizState.currentQuestionIndex + 1 })
      setSelectedOption("")
      setShowFeedback(false)
    }
  }

  const submitAnswer = () => {
    if (!currentQuestion || !selectedOption) return

    const userAnswer = selectedOption
    const correctAnswer = currentQuestion.answer?.trim() || ''
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    
    setIsCorrectAnswer(isCorrect)
    setShowFeedback(true)

    dispatch({ type: "SET_ANSWER", questionId: String(currentQuestion.id), answer: userAnswer })

    const timeSpent = Date.now() - quizState.questionStartTime

    if (userId && effectiveChapterId && currentQuestion) {
      dispatchQuestionAnswered(
        userId,
        String(currentQuestion.id),
        effectiveChapterId,
        quizState.currentQuestionIndex,
        undefined,
        userAnswer,
        isCorrect,
        timeSpent
      )
    }

    const newScore = isCorrect ? quizState.score + 1 : quizState.score

    if (quizState.currentQuestionIndex < effectiveQuestions.length - 1) {
      saveProgress({
        answers: { ...quizState.answers, [currentQuestion.id]: userAnswer },
        currentIndex: quizState.currentQuestionIndex
      })
    } else {
      const totalTimeSpent = Date.now() - quizState.startTime
      dispatch({ type: "COMPLETE_QUIZ", score: newScore })
      saveProgress({
        completed: true,
        score: newScore,
        answers: { ...quizState.answers, [currentQuestion.id]: userAnswer },
        timeSpent: totalTimeSpent
      })

      const accuracy = (newScore / effectiveQuestions.length) * 100
      const answersArray = Object.entries({ ...quizState.answers, [currentQuestion.id]: userAnswer }).map(([questionId, answer]) => ({
        questionId,
        isCorrect: answer?.trim().toLowerCase() === effectiveQuestions.find(q => q.id === questionId)?.answer?.trim().toLowerCase(),
        timeSpent: 0,
      }))
      
      if (userId && effectiveChapterId) {
        dispatchQuizCompleted(
          userId,
          effectiveChapterId,
          newScore,
          effectiveQuestions.length,
          accuracy,
          totalTimeSpent,
          answersArray
        )
      }

      toast({
        title: "Quiz Complete!",
        description: `You scored ${newScore}/${effectiveQuestions.length}`,
        variant: isCorrect ? "default" : "destructive"
      })
    }
  }

  const retakeQuiz = () => {
    dispatch({ type: "RESET_QUIZ" })
    saveProgress({ completed: false, currentIndex: 0, answers: {}, score: 0 })
    setSelectedOption("")
    setShowFeedback(false)
  }

  const getScoreMessage = () => {
    const percentage = (quizState.score / effectiveQuestions.length) * 100
    if (percentage === 100) return { emoji: "🏆", text: "PERFECT SCORE!", color: "text-success" }
    if (percentage >= 80) return { emoji: "🎯", text: "EXCELLENT!", color: "text-success" }
    if (percentage >= 60) return { emoji: "👍", text: "GOOD JOB!", color: "text-warning" }
    return { emoji: "💪", text: "KEEP GOING!", color: "text-destructive" }
  }

  // Start Screen
  const startContent = (
    <Card className="w-full max-w-4xl mx-auto border-4 border-border shadow-neo bg-background">
      <CardContent className="text-center py-16 px-6">
        <div className="mb-8 inline-block p-6 border-4 border-border shadow-neo bg-primary">
          <Zap className="w-16 h-16 text-primary-foreground" />
        </div>
        
        <h2 className="text-4xl font-black uppercase mb-4 text-foreground tracking-tight">
          TEST YOUR KNOWLEDGE
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Challenge yourself with this quiz and prove your mastery of the concepts.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-border bg-muted">
            <Target className="w-5 h-5 text-foreground" />
            <span className="font-bold text-foreground">{effectiveQuestions.length} Questions</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-border bg-muted">
            <BookOpen className="w-5 h-5 text-foreground" />
            <span className="font-bold text-foreground">Multiple Choice</span>
          </div>
        </div>

        <Button 
          onClick={startQuiz} 
          size="lg" 
          className="font-black uppercase tracking-wider text-lg px-12 py-6 border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          START QUIZ
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )

  // Active Quiz
  const activeQuizContent = currentQuestion && (
    <Card className="w-full max-w-4xl mx-auto border-4 border-border shadow-neo bg-background">
      <CardHeader className="p-6 border-b-4 border-border bg-muted">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 border-2 border-border bg-primary shadow-neo">
              <span className="font-black text-primary-foreground">
                {quizState.currentQuestionIndex + 1}/{effectiveQuestions.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-border bg-background">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <span className="font-bold text-foreground">
              {quizState.score}/{quizState.currentQuestionIndex}
            </span>
          </div>
        </div>

        <CardTitle className="text-2xl font-black uppercase text-foreground leading-tight">
          {currentQuestion.question}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <RadioGroup 
          value={selectedOption} 
          onValueChange={handleAnswer}
          disabled={showFeedback}
        >
          {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === opt
            const isCorrectOption = opt.trim().toLowerCase() === currentQuestion.answer?.trim().toLowerCase()
            const showCorrect = showFeedback && isCorrectOption
            const showIncorrect = showFeedback && isSelected && !isCorrectOption

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center space-x-4 p-5 border-4 border-border transition-all duration-200 cursor-pointer group",
                  !showFeedback && "hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-neo",
                  isSelected && !showFeedback && "bg-primary/10",
                  showCorrect && "bg-success/20 border-success",
                  showIncorrect && "bg-destructive/20 border-destructive",
                  !isSelected && !showFeedback && "bg-background hover:bg-muted"
                )}
              >
                <RadioGroupItem 
                  value={opt} 
                  id={`option-${idx}`} 
                  className="border-2 border-foreground"
                  disabled={showFeedback}
                />
                <Label 
                  htmlFor={`option-${idx}`} 
                  className="cursor-pointer text-base font-bold flex-1 text-foreground"
                >
                  {opt}
                </Label>
                
                {showCorrect && (
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                )}
                {showIncorrect && (
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                )}
              </div>
            )
          })}
        </RadioGroup>

        {showFeedback && (
          <div className={cn(
            "p-6 border-4 border-border mt-6",
            isCorrectAnswer ? "bg-success/20" : "bg-destructive/20"
          )}>
            <div className="flex items-start gap-3">
              {isCorrectAnswer ? (
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              )}
              <div>
                <p className="font-black text-lg uppercase mb-2">
                  {isCorrectAnswer ? "CORRECT!" : "INCORRECT"}
                </p>
                {!isCorrectAnswer && (
                  <p className="text-sm text-foreground">
                    The correct answer is: <span className="font-bold">{currentQuestion.answer}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t-4 border-border">
          {!showFeedback ? (
            <Button
              onClick={submitAnswer}
              className="flex-1 font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all py-6"
              disabled={!selectedOption}
            >
              SUBMIT ANSWER
            </Button>
          ) : (
            quizState.currentQuestionIndex < effectiveQuestions.length - 1 && (
              <Button
                onClick={handleNextQuestion}
                className="flex-1 font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all py-6"
              >
                NEXT QUESTION
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Results Screen
  const resultsContent = (
    <Card className="w-full max-w-4xl mx-auto border-4 border-border shadow-neo bg-background">
      <CardHeader className="p-8 border-b-4 border-border bg-muted">
        <div className="text-center">
          <div className="mb-6 inline-block p-6 border-4 border-border shadow-neo bg-primary">
            <Award className="w-16 h-16 text-primary-foreground" />
          </div>

          <CardTitle className="text-4xl font-black uppercase mb-6 text-foreground tracking-tight">
            QUIZ COMPLETE!
          </CardTitle>

          <div className="bg-background border-4 border-border shadow-neo p-8 mb-6">
            <div className={cn("text-6xl font-black mb-2", getScoreMessage().color)}>
              {quizState.score}/{effectiveQuestions.length}
            </div>
            <div className="text-3xl font-black uppercase mb-4">
              {Math.round((quizState.score / effectiveQuestions.length) * 100)}%
            </div>

            <div className="w-full bg-muted border-2 border-border h-6 mb-4">
              <div
                className="bg-primary h-full transition-all duration-1000 ease-out"
                style={{ width: `${(quizState.score / effectiveQuestions.length) * 100}%` }}
              />
            </div>

            <div className="text-2xl font-black uppercase">
              <span className="mr-2">{getScoreMessage().emoji}</span>
              {getScoreMessage().text}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <h3 className="text-2xl font-black uppercase text-foreground mb-6 flex items-center gap-3">
          <BarChart3 className="h-6 w-6" />
          REVIEW ANSWERS
        </h3>

        <div className="space-y-4">
          {effectiveQuestions.map((q: CourseQuestion, index: number) => {
            const userAnswer = quizState.answers[q.id]
            const isCorrect = userAnswer?.trim().toLowerCase() === q.answer?.trim().toLowerCase()
            
            return (
              <div
                key={q.id}
                className={cn(
                  "p-6 border-4 border-border",
                  isCorrect ? "bg-success/20" : "bg-destructive/20"
                )}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 border-2 border-border flex items-center justify-center font-black",
                    isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                  )}>
                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-foreground mb-3">
                      {index + 1}. {q.question}
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="font-bold text-muted-foreground min-w-[120px]">YOUR ANSWER:</span>
                        <span className={cn(
                          "font-bold",
                          isCorrect ? "text-success" : "text-destructive"
                        )}>
                          {userAnswer || "No answer"}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div className="flex gap-2">
                          <span className="font-bold text-muted-foreground min-w-[120px]">CORRECT:</span>
                          <span className="font-bold text-success">
                            {q.answer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <CardContent className="p-8 border-t-4 border-border bg-muted">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-background border-4 border-border shadow-neo p-6 text-center">
            <div className="text-4xl font-black text-foreground mb-2">{effectiveQuestions.length}</div>
            <div className="text-sm font-bold text-muted-foreground uppercase">Questions</div>
          </div>
          <div className="bg-background border-4 border-border shadow-neo p-6 text-center">
            <div className="text-4xl font-black text-success mb-2">{quizState.score}</div>
            <div className="text-sm font-bold text-muted-foreground uppercase">Correct</div>
          </div>
          <div className="bg-background border-4 border-border shadow-neo p-6 text-center">
            <div className="text-4xl font-black text-foreground mb-2">
              {Math.round((quizState.score / effectiveQuestions.length) * 100)}%
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase">Score</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={retakeQuiz}
            size="lg"
            className="flex-1 font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            RETAKE QUIZ
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
            className="flex-1 font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <Home className="h-5 w-5 mr-2" />
            BACK TO COURSE
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="lg"
            className="flex-1 font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <Download className="h-5 w-5 mr-2" />
            PRINT
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Error Screen
  const errorContent = (
    <Card className="w-full max-w-4xl mx-auto border-4 border-destructive shadow-neo bg-background">
      <CardContent className="flex flex-col items-center gap-6 p-12">
        <div className="p-6 border-4 border-destructive bg-destructive/20">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black uppercase text-destructive mb-2">ERROR LOADING QUIZ</h3>
          <p className="text-muted-foreground">{(error as Error)?.message}</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          className="font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          TRY AGAIN
        </Button>
      </CardContent>
    </Card>
  )

  const content = isError ? (
    errorContent
  ) : isLoading ? (
    <QuizSkeleton />
  ) : !quizState.quizStarted ? (
    startContent
  ) : quizState.quizCompleted ? (
    resultsContent
  ) : (
    activeQuizContent
  )

  return (
    <AccessControl hasAccess={hasQuizAccess} featureTitle="Premium Quiz Feature" showPreview={isPublicCourse}>
      {content}
    </AccessControl>
  )
}