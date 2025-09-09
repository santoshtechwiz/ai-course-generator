"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism"

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
  const [isDarkMode, setIsDarkMode] = useState(true)

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

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev)
  }, [])

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
      animationKey={`code-${question.id}`}
      fullWidth={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full space-y-5"
      >
        {/* Header - shadcn theme */}
        <motion.div className="text-center space-y-3">

          {/* Question Text */}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed max-w-2xl mx-auto">
            {question.text || question.question}
          </h2>
        </motion.div>

        {/* Code Display Section - shadcn theme */}
        {question.codeSnippet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="overflow-hidden rounded-xl border border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
              {/* Code Header - shadcn theme */}
              <div className="bg-muted/80 px-4 py-3 flex items-center justify-between border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm"></div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-lg border border-border/60 shadow-sm">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-muted-foreground">{language || "Code"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDarkMode}
                    className="h-9 px-4 border border-border/60 text-primary font-semibold rounded-lg shadow-sm transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    title="Toggle theme"
                    aria-label="Toggle code theme"
                  >
                    {isDarkMode ? "Light" : "Dark"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-9 px-4 border border-border/60 text-primary font-semibold rounded-lg shadow-sm transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    title="Copy code"
                    aria-label="Copy code to clipboard"
                    disabled={isSubmitting}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 animate-pulse text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Code Content */}
              <div className="relative max-h-[400px] overflow-y-auto bg-background/95">
                <SyntaxHighlighter
                  language={syntaxLanguage}
                  style={isDarkMode ? vscDarkPlus : vs}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.8rem",
                    lineHeight: "1.6",
                    backgroundColor: "transparent",
                    borderRadius: "0",
                  }}
                  codeTagProps={{
                    style: {
                      fontSize: "0.8rem",
                      lineHeight: "1.6",
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      tabSize: 2,
                    },
                  }}
                  lineNumberStyle={{
                    color: isDarkMode ? "#ccc" : "#666",
                    paddingRight: "1rem",
                    minWidth: "2.5em",
                    userSelect: "none",
                    fontSize: "0.7rem",
                    borderRight: "1px solid hsl(var(--border))",
                    marginRight: "1rem",
                    backgroundColor: "hsl(var(--muted) / 0.3)",
                    textAlign: "right",
                  }}
                  wrapLines
                  wrapLongLines
                  lineProps={(lineNumber) => ({
                    style: {
                      display: "block",
                      width: "100%",
                      paddingLeft: "0.5rem",
                      borderLeft: "2px solid transparent",
                      transition: "all 0.2s ease",
                      position: "relative",
                    },
                  })}
                >
                  {question.codeSnippet}
                </SyntaxHighlighter>

                {/* Add visual wrap indicator overlay */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded-md border border-border/50 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      Code wraps for readability
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Options Section - unified width, accessibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl mx-auto"
        >
          <CodeQuizOptions
            options={options.map((o) => o.text)}
            selectedOption={selectedAnswer}
            onSelect={handleOptionSelect}
            disabled={isSubmitting || isAnswering}
            correctAnswer={question.correctAnswer}
            showCorrectAnswer={false}
            aria-label="Quiz options"
          />
        </motion.div>

        {/* Footer */}
        {showNavigation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
      </motion.div>
    </QuizContainer>
  )
}

export default memo(CodeQuiz)
