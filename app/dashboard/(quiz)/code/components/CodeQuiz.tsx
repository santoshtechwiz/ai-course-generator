"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import CodeQuizOptions from "./CodeQuizOptions"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { Code2, Terminal, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
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

// Standardized animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
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
  quizTitle,
  quizSubtitle,
  difficulty = "Medium",
  category,
  timeLimit,
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAnswer || null)
  const [copied, setCopied] = useState(false)
  const [isAnswering, setIsAnswering] = useState(false)

  const options = useMemo(() => {
    return (
      question.options?.map((option) => ({
        id: option,
        text: option,
      })) || []
    )
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

        const selected = options.find((o) => o.id === optionId)
        if (selected) {
          setSelectedAnswer(selected.text)
          dispatch(
            saveAnswer({
              questionId: String(question.id),
              answer: selected.text,
            }),
          )
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

  // Enhanced language detection
  const detectLanguageFromCode = (code: string): string => {
    if (!code) return "text"

    // Common patterns for language detection
    const patterns = {
      javascript: [/function\s+\w+\s*\(/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/, /=>\s*{/, /console\.log/],
      typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*string/, /:\s*number/, /:\s*boolean/],
      python: [/def\s+\w+\s*\(/, /import\s+\w+/, /from\s+\w+\s+import/, /print\s*\(/, /if\s+__name__\s*==\s*['""]__main__['""]:/],
      java: [/public\s+class\s+\w+/, /public\s+static\s+void\s+main/, /System\.out\.println/, /private\s+\w+/, /public\s+\w+/],
      cpp: [/#include\s+</, /std::/, /cout\s*<</, /cin\s*>>/, /int\s+main\s*\(/],
      csharp: [/using\s+System/, /public\s+class\s+\w+/, /Console\.WriteLine/, /public\s+static\s+void\s+Main/],
      php: [/<\?php/, /\$\w+/, /echo\s+/, /function\s+\w+\s*\(/],
      ruby: [/def\s+\w+/, /puts\s+/, /end\s*$/, /class\s+\w+/],
      go: [/package\s+main/, /func\s+main\s*\(/, /fmt\.Println/, /import\s+\(/],
      rust: [/fn\s+main\s*\(/, /println!\s*\(/, /let\s+mut/, /use\s+std::/],
      sql: [/SELECT\s+/, /FROM\s+/, /WHERE\s+/, /INSERT\s+INTO/, /UPDATE\s+/, /DELETE\s+FROM/],
      html: [/<html/, /<head/, /<body/, /<div/, /<p/, /<a\s+href\s*=/],
      css: [/\.\w+\s*{/, /#\w+\s*{/, /\w+\s*:\s*\w+;/, /@media/],

    }

    // Check each language pattern
    for (const [lang, langPatterns] of Object.entries(patterns)) {
      if (langPatterns.some((pattern) => pattern.test(code))) {
        return lang
      }
    }

    return "text"
  }

  const getLanguageDisplay = () => {
    const lang = question.language?.trim() || detectLanguageFromCode(question.codeSnippet || "")
    const languageMap: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
      "c++": "C++",
      csharp: "C#",
      "c#": "C#",
      php: "PHP",
      ruby: "Ruby",
      go: "Go",
      rust: "Rust",
      swift: "Swift",
      kotlin: "Kotlin",
      scala: "Scala",
      html: "HTML",
      css: "CSS",
      sql: "SQL",
      bash: "Bash",
      shell: "Shell",
      powershell: "PowerShell",
      text: "Code",
    }
    return languageMap[lang.toLowerCase()] || lang
  }

  const getSyntaxHighlightLanguage = () => {
    const lang = question.language?.trim() || detectLanguageFromCode(question.codeSnippet || "")
    const syntaxMap: Record<string, string> = {
      "c++": "cpp",
      "c#": "csharp",
      shell: "bash",
      text: "text",
    }
    return syntaxMap[lang.toLowerCase()] || lang.toLowerCase()
  }

  const language = getLanguageDisplay()
  const syntaxLanguage = getSyntaxHighlightLanguage()

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={`code-${question.id}`}
      difficulty={difficulty?.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="text-center space-y-6">
            {/* Quiz Type Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Code Quiz</span>
              </div>
            </motion.div>

            {/* Question Text */}
            <motion.h2
              className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-foreground mx-auto max-w-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {question.text || question.question}
            </motion.h2>

            {/* Progress indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              Question {questionNumber} of {totalQuestions}
            </motion.div>
          </motion.div>

          {/* Code Display Section */}
          {question.codeSnippet && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-xl border border-border shadow-lg max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 bg-slate-800 px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg border border-slate-600">
                    <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                    <span className="text-slate-300 text-xs sm:text-sm font-medium">{language}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-6 sm:h-8 px-2 sm:px-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 text-xs sm:text-sm"
                    title="Copy code"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </Button>

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-md sm:rounded-lg border border-slate-600">
                    <Terminal className="w-3 h-3 text-slate-400" />
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
                  codeTagProps={{
                    style: {
                      fontSize: "0.8rem",
                      lineHeight: "1.6",
                    },
                  }}
                  lineNumberStyle={{
                    color: "#64748b",
                    paddingRight: "1rem",
                    minWidth: "2.5em",
                    userSelect: "none",
                    fontSize: "0.75rem",
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {question.codeSnippet}
                </SyntaxHighlighter>
              </div>
            </motion.div>
          )}

          {/* Options Section */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <CodeQuizOptions
              options={options.map((o) => o.text)}
              selectedOption={selectedAnswer}
              onSelect={handleOptionSelect}
              disabled={isSubmitting || isAnswering}
              correctAnswer={question.correctAnswer}
              showCorrectAnswer={false}
            />
          </motion.div>

          {/* Navigation Section */}
          {showNavigation && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="max-w-4xl mx-auto"
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
        </div>
      </motion.div>
    </QuizContainer>
  )
}

export default memo(CodeQuiz)
