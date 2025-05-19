"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, HelpCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RootState, useAppDispatch, useAppSelector } from "@/store"
import { submitAnswer } from "@/app/store/slices/textQuizSlice"


interface BlanksQuizProps {
  question: {
    id: string;
    question: string;
    answer?: string;
    hints?: string[];
  };
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  onQuestionComplete?: () => void;
  [key: string]: any;
}

function BlanksQuizComponent({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onQuestionComplete,
  ...props
}: BlanksQuizProps) {
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState<number>(Date.now())
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state: RootState) => state.textQuiz)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  // Update time elapsed every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  // Format time as mm:ss
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeElapsed / 60)
    const seconds = timeElapsed % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [timeElapsed])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [question.id])

  // Extract the blank part from the question
  const formattedQuestion = useMemo(() => {
    return question.question.replace(/\[\[(.*?)\]\]/g, "________")
  }, [question.question])

  // Extract the correct answer from the question
  const correctAnswer = useMemo(() => {
    const match = question.question.match(/\[\[(.*?)\]\]/)
    return match ? match[1] : question.answer || ""
  }, [question.question, question.answer])

  // Get hint from question or generate a simple one
  const hint = useMemo(() => {
    if (question.hints && question.hints.length > 0) {
      return question.hints[0]
    }

    // Generate a simple hint based on the correct answer
    if (correctAnswer) {
      const firstLetter = correctAnswer.charAt(0)
      const lastLetter = correctAnswer.charAt(correctAnswer.length - 1)
      return `The answer starts with "${firstLetter}" and ends with "${lastLetter}". It has ${correctAnswer.length} characters.`
    }

    return "No hint available for this question."
  }, [question.hints, correctAnswer])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value)
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || !userAnswer.trim()) return;

      setIsSubmitting(true);

      try {
        const answer = {
          questionId: question.id,
          question: question.question,
          answer: userAnswer.trim(),
          correctAnswer,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          hintsUsed,
          index: questionNumber - 1,
          isCorrect: userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
        };

        await dispatch(submitAnswer(answer)).unwrap();
        onQuestionComplete?.();
        setUserAnswer("");
        setShowHint(false);
      } catch (error) {
        console.error("Error submitting answer:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [userAnswer, dispatch, question, startTime, hintsUsed, correctAnswer, questionNumber, onQuestionComplete]
  )

  // Handle hint display
  const handleShowHint = useCallback(() => {
    setShowHint(true)
    setHintsUsed(true)
  }, [])

  // If no question is provided, show a loading state
  if (!question) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      data-testid="blanks-quiz-component"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      {...props}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Question {questionNumber} of {totalQuestions}
            </CardTitle>
            <div className="text-sm text-muted-foreground">Time: {formattedTime}</div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-medium mb-4" data-testid="question-text">
              {formattedQuestion}
            </h3>
            <form 
              onSubmit={handleSubmit} 
              id="blanks-form" 
              className="space-y-4"
              data-testid="blanks-form"  // Add this test ID
            >
              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium">
                  Your answer:
                </label>
                <Input
                  id="answer"
                  ref={inputRef}
                  value={userAnswer}
                  onChange={handleInputChange}
                  placeholder="Type your answer here..."
                  className="w-full"
                  data-testid="answer-input"
                  disabled={isSubmitting}
                />
              </div>

              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-md"
                >
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Hint</p>
                      <p className="text-sm text-amber-700">{hint}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShowHint}
                  disabled={showHint || isSubmitting}
                  data-testid="hint-button"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Need a hint?
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Using a hint may affect your score</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            type="submit"
            form="blanks-form"
            disabled={!userAnswer.trim() || isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : isLastQuestion ? (
              "Finish Quiz"
            ) : (
              "Next Question"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Custom comparison function for memoization
function arePropsEqual(prevProps: BlanksQuizProps, nextProps: BlanksQuizProps) {
  // Only re-render if the question ID changes or if the question number changes
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.questionNumber === nextProps.questionNumber &&
    prevProps.isLastQuestion === nextProps.isLastQuestion
  )
}

// Export memoized component with custom comparison
export default memo(BlanksQuizComponent, arePropsEqual)
