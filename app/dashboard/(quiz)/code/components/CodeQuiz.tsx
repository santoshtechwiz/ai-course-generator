"use client"

import React, { useCallback, useMemo } from "react"
import { HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import QuizOptions from "./CodeQuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import type { CodeChallenge } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"

import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { QuizBase } from "../../components/QuizBase"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { useQuizState, formatQuizTime } from "@/hooks/use-quiz-state"
import { QuizFeedback } from "../../components/QuizFeedback"
import { QuizProgress } from "../../components/QuizProgress"


interface CodeQuizProps {
  quizId: string
  slug: string
  isFavorite: boolean
  isPublic: boolean
  userId: string
  ownerId: string
  quizData: {
    title: string
    questions: CodeChallenge[]
  }
  onSubmitAnswer?: (answer: any) => void
  onComplete?: () => void
}

const CodingQuiz: React.FC<CodeQuizProps> = ({ quizId, slug, quizData, onComplete }) => {
  const { animationsEnabled } = useAnimation()

  const calculateScore = useCallback((selectedOptions: (string | null)[], questions: CodeChallenge[]) => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.correctAnswer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [])

  const {
    currentQuestionIndex,
    currentQuestion,
    selectedOptions,
    timeSpent,
    quizCompleted,
    quizResults,
    showFeedbackModal,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    isAuthenticated,
    session,
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
  } = useQuizState({
    quizId,
    slug,
    questions: quizData.questions,
    quizType: "code",
    calculateScore,
    onComplete,
  })

  const options = useMemo(() => {
    return Array.isArray(currentQuestion?.options) ? currentQuestion.options : []
  }, [currentQuestion?.options])

  const renderCode = useCallback((code: string, language = "javascript") => {
    if (!code) return null

    const cleanCode = code.replace(/^```[\w]*\n?|\n?```$/g, "")

    return (
      <div className="rounded-md overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.9rem",
            backgroundColor: "#1E1E1E",
          }}
          showLineNumbers={true}
        >
          {cleanCode}
        </SyntaxHighlighter>
      </div>
    )
  }, [])

  const renderQuestionText = useCallback((text: string) => {
    if (!text) return null

    const [questionText, ...codeBlocks] = text.split("```")

    return (
      <div className="space-y-4">
        <div>
          {questionText.split(/`([^`]+)`/).map((part, index) =>
            index % 2 === 0 ? (
              <span key={index}>{part}</span>
            ) : (
              <code key={index} className="bg-muted/50 text-primary font-mono px-1.5 py-0.5 rounded-md">
                {part}
              </code>
            ),
          )}
        </div>
        {codeBlocks.map((code, index) => (
          <pre key={index} className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
            <code className="text-primary font-mono whitespace-pre">{code.trim()}</code>
          </pre>
        ))}
      </div>
    )
  }, [])

  const renderOptionContent = useCallback(
    (option: string) => {
      if (!option) return null

      const codeRegex = /```[\s\S]*?```/g
      const parts = option.split(codeRegex)
      const codes = option.match(codeRegex) || []

      return (
        <div className="w-full">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part && <span className="block mb-2">{part.trim()}</span>}
              {codes[index] && <div className="my-2">{renderCode(codes[index], currentQuestion?.language)}</div>}
            </React.Fragment>
          ))}
        </div>
      )
    },
    [currentQuestion?.language, renderCode],
  )

  const renderQuizContent = () => {
    if (quizCompleted) {
      const correctCount = calculateScore(selectedOptions, quizData.questions)
      const totalQuestions = quizData.questions.length
      const percentage = (correctCount / totalQuestions) * 100
      const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

      if (isAuthenticated) {
        return (
          <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.6}>
            <QuizResultDisplay
              quizId={quizId}
              title={quizData.title}
              score={percentage}
              totalQuestions={totalQuestions}
              totalTime={totalTime}
              correctAnswers={correctCount}
              type="code"
              slug={slug}
            />
          </MotionWrapper>
        )
      }

      return (
        <MotionWrapper animate={true} variant="fade" duration={0.6}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
              {!session ? <SignInPrompt callbackUrl={`/dashboard/code/${slug}`} /> : null}
            </CardContent>
          </Card>
        </MotionWrapper>
      )
    }

    return (
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <QuizProgress
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={quizData.questions.length}
            timeSpent={timeSpent}
            title={quizData.title}
            quizType="Code Quiz"
            animate={animationsEnabled}
          />
        </CardHeader>
        <CardContent>
          <MotionTransition key={currentQuestionIndex}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {renderQuestionText(currentQuestion?.question || "")}
                  </h2>
                </div>
                {currentQuestion?.codeSnippet && (
                  <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                    <div className="my-4 overflow-x-auto">
                      {renderCode(currentQuestion.codeSnippet, currentQuestion.language)}
                    </div>
                  </MotionWrapper>
                )}
                <QuizOptions
                  options={options}
                  selectedOption={selectedOptions[currentQuestionIndex]}
                  onSelect={handleSelectOption}
                  disabled={isSubmitting}
                  renderOptionContent={renderOptionContent}
                />
              </div>
            </div>
          </MotionTransition>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
          <p className="text-sm text-muted-foreground">
            Question time: {formatQuizTime(timeSpent[currentQuestionIndex] || 0)}
          </p>
          <Button
            onClick={() => handleNextQuestion()}
            disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentQuestionIndex === quizData.questions.length - 1 ? (
              "Finish Quiz"
            ) : (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <QuizBase quizId={quizId} slug={slug} title={quizData.title} type="code" totalQuestions={quizData.questions.length}>
      {renderQuizContent()}

      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={isError}
          score={calculateScore(selectedOptions, quizData.questions)}
          totalQuestions={quizData.questions.length}
          onContinue={handleFeedbackContinue}
          errorMessage={errorMessage}
          quizType="code"
        />
      )}
    </QuizBase>
  )
}

export default CodingQuiz
