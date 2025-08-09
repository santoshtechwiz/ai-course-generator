"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import CodeQuizOptions from "./CodeQuizOptions"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { Code2, Terminal, Copy, Check, Play, Sparkles, Zap, Brain, Target } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/styling"
import { toast } from "sonner"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  showNavigation?: boolean
  showRetake?: boolean
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const CodeQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  onNext,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  showNavigation = true,
  showRetake = false,
  difficulty = "Medium",
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAnswer || null)
  const [copied, setCopied] = useState(false)
  const [isAnswering, setIsAnswering] = useState(false)

  const options = useMemo(() => {
    return question.options?.map((option) => ({
      id: option,
      text: option
    })) || []
  }, [question.options])

  const handleOptionSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)
      try {
        // Add haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        const selected = options.find(o => o.id === optionId)
        if (selected) {
          setSelectedAnswer(selected.text)
          dispatch(saveAnswer({
            questionId: String(question.id),
            answer: selected.text
          }))
          onAnswer(selected.text)
          
          toast.success("Answer selected!", {
            duration: 1000,
            position: "top-center",
          })
        }
      } finally {
        setIsAnswering(false)
      }
    },
    [isAnswering, isSubmitting, options, onAnswer, dispatch, question.id],
  )

  const handleCopyCode = useCallback(async () => {
    if (question.codeSnippet) {
      try {
        await navigator.clipboard.writeText(question.codeSnippet)
        setCopied(true)
        toast.success("Code copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy code:", err)
        toast.error("Failed to copy code")
      }
    }
  }, [question.codeSnippet])

  const hasAnswer = !!selectedAnswer

  // Enhanced language handling with better fallbacks
  const getLanguageDisplay = () => {
    const lang = question.language?.trim() || 'Code'

    const languageMap: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c++': 'C++',
      'csharp': 'C#',
      'c#': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'bash': 'Bash',
      'shell': 'Shell',
      'powershell': 'PowerShell'
    }

    return languageMap[lang.toLowerCase()] || lang
  }

  const getSyntaxHighlightLanguage = () => {
    const lang = question.language?.trim() || 'text'

    const syntaxMap: Record<string, string> = {
      'c++': 'cpp',
      'c#': 'csharp',
      'shell': 'bash'
    }

    return syntaxMap[lang.toLowerCase()] || lang.toLowerCase()
  }

  const getLanguageColor = () => {
    const lang = question.language?.toLowerCase() || ''
    
    const colorMap: Record<string, string> = {
      'javascript': 'from-yellow-400 to-yellow-600',
      'typescript': 'from-blue-400 to-blue-600',
      'python': 'from-green-400 to-green-600',
      'java': 'from-red-400 to-red-600',
      'cpp': 'from-purple-400 to-purple-600',
      'c++': 'from-purple-400 to-purple-600',
      'csharp': 'from-purple-400 to-purple-600',
      'c#': 'from-purple-400 to-purple-600',
      'go': 'from-cyan-400 to-cyan-600',
      'rust': 'from-orange-400 to-orange-600',
      'php': 'from-indigo-400 to-indigo-600',
      'ruby': 'from-red-400 to-red-600',
    }

    return colorMap[lang] || 'from-gray-400 to-gray-600'
  }

  const language = getLanguageDisplay()
  const syntaxLanguage = getSyntaxHighlightLanguage()
  const languageGradient = getLanguageColor()

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={`code-${question.id}`}
      difficulty={difficulty?.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-4 sm:space-y-6 px-2 sm:px-4"
        >
        

          {/* Question Text */}
          <motion.h2 
            className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {question.text || question.question}
          </motion.h2>

          {/* Animated underline */}
          <motion.div
            className={`h-1 w-32 rounded-full mx-auto bg-gradient-to-r ${languageGradient}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-muted-foreground"
          >
            Question {questionNumber} of {totalQuestions}
          </motion.div>
        </motion.div>

        {/* Enhanced Code Display Section */}
        {question.codeSnippet && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="mx-2 sm:mx-4 overflow-hidden rounded-xl sm:rounded-2xl border border-border shadow-lg sm:shadow-2xl"
          >
            <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shadow-sm"></div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 bg-slate-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-slate-600">
                  <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                  <span className="text-slate-300 text-xs sm:text-sm font-medium">{language} Code</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                  title="Copy code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-slate-700 rounded-md">
                  <Terminal className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 font-mono">{syntaxLanguage}</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              <SyntaxHighlighter
                language={syntaxLanguage}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "0.8rem",
                  background: "#0f172a",
                  lineHeight: "1.6",
                }}
                lineNumberStyle={{
                  color: "#64748b",
                  paddingRight: "1rem",
                  minWidth: "2.5em",
                  userSelect: "none"
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {question.codeSnippet}
              </SyntaxHighlighter>
              
              {/* Gradient overlay for better readability */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>
        )}

        {/* Fallback for questions without code snippets */}
        {!question.codeSnippet && language !== 'Code' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="mx-2 sm:mx-4"
          >
            <Card className="border-2 border-border bg-gradient-to-br from-muted/30 to-muted/10 shadow-lg sm:shadow-xl">
              <CardContent className="p-4 sm:p-8 text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${languageGradient} shadow-lg`}>
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{language}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Test your programming knowledge</p>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  This question tests your understanding of {language} concepts, best practices, and problem-solving skills.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Options Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mx-2 sm:mx-4"
        >
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-gradient-to-br from-card to-card/80 overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${languageGradient}`}></div>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r ${languageGradient}`}>
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Choose Your Answer</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Select the most appropriate option</p>
                </div>
              </div>

              <CodeQuizOptions
                options={options.map(o => o.text)}
                selectedOption={selectedAnswer}
                onSelect={handleOptionSelect}
                disabled={isSubmitting || isAnswering}
                correctAnswer={question.correctAnswer}
                showCorrectAnswer={false}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Navigation Section */}
        {showNavigation && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <QuizFooter
              onNext={onNext}
              onSubmit={onSubmit}
              onRetake={onRetake}
              canGoNext={canGoNext && hasAnswer}
              canGoPrevious={canGoPrevious}
              isLastQuestion={isLastQuestion}
              showRetake={showRetake}
              isSubmitting={isSubmitting}
              hasAnswer={hasAnswer}
            />
          </motion.div>
        )}

        {/* Progress indicator at bottom for mobile */}
        <motion.div
          className="block sm:hidden text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${languageGradient}`}></div>
            <span>{questionNumber} of {totalQuestions}</span>
          </div>
        </motion.div>
      </div>
    </QuizContainer>
  )
}

export default memo(CodeQuiz)
