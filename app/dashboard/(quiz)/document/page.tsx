"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, FileText, Sparkles, Download, Share2, Play } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Quiz, quizStore } from "@/lib/quiz-store"
import { ConfirmDialog } from "../components/ConfirmDialog"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"
import { ContextualAuthPrompt, useContextualAuth } from "@/components/auth/ContextualAuthPrompt"
import { ContextualUpgradePrompt } from "@/components/shared/ContextualUpgradePrompt"
import { useContextualUpgrade } from "@/hooks/useContextualUpgrade"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"

import { DocumentQuizOptions } from "./components/DocumentQuizOptions"
import { FileUpload } from "./components/FileUpload"
import { SavedQuizList } from "./components/SavedQuizList"
import DocumentQuizDisplay from "./components/DocumentQuizDisplay"
import { PDFDownloadButton } from "./components/DocumentQuizPdf"
import EnhancedPDFDownloadButton from "./components/EnhancedPDFDownloadButton"

// Simple fallback generator: produce N naive questions by splitting the document into sentences
// (removed) fallback generator helper

interface QuizOptionsType {
  numberOfQuestions: number
  difficulty: number
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string | number
  codeSnippet?: string
  type?: string
}

interface LocalQuestion extends Omit<Question, 'correctAnswer'> {
  correctAnswer: number
}

export default function DocumentQuizPage() {
  const [file, setFile] = useState<File | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOptionsType>({
    numberOfQuestions: 5,
    difficulty: 50,
  })
  const [quiz, setQuiz] = useState<LocalQuestion[]>([
    {
      id: `q-${Date.now()}`,
      question: "",
      options: ["", ""],
      correctAnswer: 0,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([])
  const [quizTitle, setQuizTitle] = useState("New Quiz")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmCreditUsage, setConfirmCreditUsage] = useState<{
    used: number
    available: number
    remaining: number
    percentage: number
  } | null>(null)
  const currentRequestControllerRef = useRef<AbortController | null>(null)

  const { data: session } = useSession()
  
  // ✅ Unified auth and upgrade hooks
  const { requireAuth, authPrompt, closeAuthPrompt } = useContextualAuth()
  const { promptState, triggerDiscoveryUpgrade, triggerCreditExhaustionUpgrade, closePrompt } = useContextualUpgrade()
  const { canAccess, reason, requiredPlan } = useFeatureAccess('pdf-generation')

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showShareDialog) {
        setShowShareDialog(false)
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            if (quiz.length > 0) {
              handleSaveQuiz()
            }
            break
          case "n":
            e.preventDefault()
            handleCreateNewQuiz()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [quiz, showShareDialog])

  useEffect(() => {
    ;(async () => {
      const loaded = await quizStore.getAllQuizzes()
      setSavedQuizzes(Array.isArray(loaded) ? loaded : [])
    })()
  }, [])

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} is ready for quiz generation.`,
    })
  }, [])

  const loadSavedQuizzes = useCallback(async () => {
    const loadedQuizzes = await quizStore.getAllQuizzes()
    setSavedQuizzes(Array.isArray(loadedQuizzes) ? loadedQuizzes : [])
  }, [])

  const handleOptionsChange = useCallback((options: QuizOptionsType) => {
    setQuizOptions(options)
    if ("title" in options) {
      setQuizTitle((options as any).title || "New Quiz")
    }
  }, [])

  const handleGenerateQuiz = async () => {
    // 1. Validate file selection
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a document first.",
        variant: "destructive",
      })
      return
    }

    // 2. Check authentication with contextual message
    if (!requireAuth('generate_pdf', file.name)) {
      return // Auth modal shown, user stays on page
    }

    // 3. Check feature access (plan + subscription)
    if (!canAccess) {
      if (reason === 'subscription') {
        triggerDiscoveryUpgrade('PDF Quiz Generation', requiredPlan || 'BASIC')
        return // Upgrade modal shown
      }
      if (reason === 'credits') {
        triggerCreditExhaustionUpgrade()
        return // Credit upgrade modal shown
      }
      // Other access denial reasons
      toast({
        title: "Access Denied",
        description: `You don't have access to this feature. ${reason || 'Unknown reason'}`,
        variant: "destructive",
      })
      return
    }

    // 4. Fetch client credit details to show accurate usage in the confirm dialog
    try {
      const clientCredits = await (await import('@/services/client-credit-service')).ClientCreditService.getCreditDetails()
      // ClientCreditService returns ClientCreditInfo with simple fields
      setConfirmCreditUsage({
        used: (clientCredits as any).usedCredits ?? 0,
        available: (clientCredits as any).totalCredits ?? 0,
        remaining: (clientCredits as any).remainingCredits ?? 0,
        percentage: Math.round(((clientCredits as any).usedCredits ?? 0) / Math.max(1, (clientCredits as any).totalCredits ?? 1) * 100),
      })
    } catch (err) {
      console.warn('[DocumentPage] Failed to load client credit details for confirm dialog', err)
    }

    // 5. Show confirmation dialog
    setIsConfirmDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!file) return

    setIsLoading(true)
    setSubmitError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("numberOfQuestions", quizOptions.numberOfQuestions.toString())
    formData.append("difficulty", quizOptions.difficulty.toString())

  // Use AbortController so the request can be canceled if the dialog is closed
  const controller = new AbortController()
  const signal = controller.signal

  // Keep reference for possible cancellation on unmount or dialog cancel
  currentRequestControllerRef.current = controller

    try {
      const response = await fetch("/api/document", {
        method: "POST",
        body: formData,
        signal,
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

  const payload = await response.json()
  // (previously stored payload for verification) - removed to revert temporary debugging additions

      // Support two response shapes:
      // 1) { questions: [...] , creditsRemaining: number }
      // 2) [...] (legacy/raw array)
      let rawQuestions: any[] = []
      if (Array.isArray(payload)) {
        rawQuestions = payload
      } else if (payload && Array.isArray((payload as any).questions)) {
        rawQuestions = (payload as any).questions
      } else {
        console.error('[Document API] Unexpected response payload:', payload)
        throw new Error('Invalid response from server')
      }

      // Validate AI response shape and contents before applying (inlined)
      function validateQuizArray(items: any[], expectedCount: number) {
        const errors: string[] = []
        const warnings: string[] = []

        if (!Array.isArray(items)) {
          errors.push('Response is not an array.')
          return { valid: false, errors, warnings }
        }

        if (items.length === 0) {
          errors.push('No questions were returned by the AI.')
        }

        if (expectedCount && items.length !== expectedCount) {
          warnings.push(`Requested ${expectedCount} questions but received ${items.length}.`)
        }

        items.forEach((q: any, i: number) => {
          if (!q || typeof q !== 'object') {
            errors.push(`Item at index ${i} is not an object.`)
            return
          }
          if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
            errors.push(`Question at index ${i} is missing text.`)
          }
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Question at index ${i} must have at least 2 options.`)
          } else {
            q.options.forEach((opt: any, oi: number) => {
              if (typeof opt !== 'string') errors.push(`Option ${oi} for question ${i} is not a string.`)
            })
          }
          if (q.correctAnswer == null) {
            warnings.push(`Question at index ${i} has no explicit correctAnswer. Defaulting to 0.`)
          } else if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || (Array.isArray(q.options) && q.correctAnswer >= q.options.length)) {
            errors.push(`correctAnswer for question ${i} is invalid.`)
          }
        })

        return { valid: errors.length === 0, errors, warnings }
      }

      const validation = validateQuizArray(rawQuestions, quizOptions.numberOfQuestions)
      if (!validation.valid) {
        const details = validation.errors.concat(validation.warnings).join(' | ')
        const attempted = `${file?.name || 'uploaded file'} — ${quizOptions.numberOfQuestions} questions • ${quizOptions.difficulty <= 33 ? 'Easy' : quizOptions.difficulty <= 66 ? 'Medium' : 'Hard'} difficulty`
        const message = `Invalid response from document API. ${details}. Attempted: ${attempted}`
        console.error('[Document API] Validation failed:', { payload, validation })
        setSubmitError(message)
        // keep dialog open so user can read error and adjust options
        return
      }

      const quizData: LocalQuestion[] = rawQuestions.map((q: any, index: number) => {
        // Normalize options: support strings or objects with `.text` or `.label`
        const options = Array.isArray(q.options)
          ? q.options.map((o: any) => (typeof o === 'string' ? o : (o?.text ?? o?.label ?? String(o))))
          : []

        const correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0

        return {
          id: q.id ?? `generated-${index}`,
          question: String(q.question ?? ""),
          options,
          correctAnswer,
        }
      })

      setQuiz(quizData)

      // Close the confirm dialog first
      setIsConfirmDialogOpen(false)

      // Include creditsRemaining in the success toast when present
      const creditsRemaining = payload && typeof (payload as any).creditsRemaining === 'number' ? (payload as any).creditsRemaining : null

      toast({
        title: "Quiz Generated Successfully! ✨",
        description: `Generated ${quizData.length} questions from your document.${creditsRemaining !== null ? ` Credits remaining: ${creditsRemaining}.` : ''}`,
      })

      // remove temporary verification helper

      // Switch to quiz tab and scroll to it
      setActiveTab("quiz")

      // Auto-scroll to quiz section after tab switch
      setTimeout(() => {
        const quizElement = document.getElementById("quiz-preview-section")
        if (quizElement) {
          quizElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 300)
    } catch (error) {
      console.error("Error generating quiz:", error)
      setSubmitError(error instanceof Error ? error.message : "Failed to generate quiz")
      toast({
        title: "Generation Failed",
        description: "Failed to generate quiz. Please try again with a different document.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // clear controller ref
      if (currentRequestControllerRef.current) {
        currentRequestControllerRef.current = null
      }
    }
  }

  const handleSaveQuiz = async (quizToSave?: LocalQuestion[]) => {
    const questions = quizToSave ?? quiz
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please generate or add questions before saving the quiz.",
        variant: "destructive",
      })
      return
    }

    // Enhanced validation
    const invalidQuestions = questions.filter(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || q.options.length < 2,
    )

    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions Found",
        description: `${invalidQuestions.length} question(s) need attention. All questions must have text and at least 2 non-empty options.`,
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      let savedQuiz: Quiz

      if (isEditing && editingQuizId) {
        const updatedQuiz = await quizStore.updateQuiz(editingQuizId, {
          title: quizTitle,
          questions,
        })

        if (!updatedQuiz) {
          throw new Error("Failed to update quiz")
        }

        savedQuiz = updatedQuiz
        toast({
          title: "Quiz Updated Successfully! 🎉",
          description: `"${quizTitle}" has been updated with ${questions.length} questions.`,
        })
      } else {
        savedQuiz = await quizStore.saveQuiz(quizTitle, questions)
        toast({
          title: "Quiz Saved Successfully! 🎉",
          description: `"${quizTitle}" is now saved with ${questions.length} questions and ready to share.`,
        })
      }

      // Set quiz data for sharing
      setSavedQuizId(savedQuiz.id)
      const generatedShareUrl = `${window.location.origin}/dashboard/document/${savedQuiz.id}`
      setShareUrl(generatedShareUrl)

      await loadSavedQuizzes()

      // Show share dialog with animation
      setShowShareDialog(true)
      setIsEditing(false)
      setEditingQuizId(null)

      // Auto-scroll to quiz area after a brief delay
      setTimeout(() => {
        const quizElement = document.getElementById("quiz-preview-section")
        if (quizElement) {
          quizElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 500)
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateQuiz = useCallback((updatedQuestions: LocalQuestion[]) => {
    setQuiz(updatedQuestions)
  }, [])

  const handleEditQuiz = useCallback((quizToEdit: Quiz) => {
    setQuiz(quizToEdit.questions)
    setQuizTitle(quizToEdit.title)
    setIsEditing(true)
    setEditingQuizId(quizToEdit.id)
    setActiveTab("create")
    toast({
      title: "Editing Mode Activated",
      description: `You are now editing "${quizToEdit.title}". Save your changes when ready.`,
    })
  }, [])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied! 📋",
        description: "Quiz sharing link has been copied to your clipboard.",
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      toast({
        title: "Link Copied! 📋",
        description: "Quiz sharing link has been copied to your clipboard.",
      })
    }
  }

  const handleCreateNewQuiz = useCallback(() => {
    setQuiz([
      {
        id: `q-${Date.now()}`,
        question: "",
        options: ["", ""],
        correctAnswer: 0,
      },
    ])
    setQuizTitle("New Quiz")
    setFile(null)
    setIsEditing(false)
    setEditingQuizId(null)
    setActiveTab("create")
    toast({
      title: "New Quiz Started",
      description: "Ready to create a new quiz from scratch.",
    })
  }, [])

  const canSave = quiz.length > 0 && quiz.some((q) => q.question.trim())

  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <motion.div
        key="main-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 h-12">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isEditing ? "Edit Quiz" : "Create Quiz"}
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                My Quizzes ({savedQuizzes.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-2 py-1 bg-muted rounded">Ctrl+S</kbd>
              <span>Save</span>
              <kbd className="px-2 py-1 bg-muted rounded">Ctrl+N</kbd>
              <span>New</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent key="create-tab" value="create" className="space-y-8">
              <motion.div
                key="create-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid gap-8 lg:grid-cols-2"
              >
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {isEditing ? "Edit Quiz Settings" : "Quiz Configuration"}
                    </CardTitle>
                    {isEditing && (
                      <CardDescription className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        You are editing an existing quiz. Save your changes when done.
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="quizTitle" className="text-sm font-medium">
                        Quiz Title
                      </label>
                      <Input
                        id="quizTitle"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Enter a descriptive quiz title..."
                        className="h-12"
                      />
                    </div>

                    {!isEditing && (
                      <>
                        <FileUpload onFileSelect={handleFileSelect} />
                        <DocumentQuizOptions onOptionsChange={handleOptionsChange} />
                        <PlanAwareButton
                          onClick={handleGenerateQuiz}
                          disabled={isLoading || !file}
                          creditsRequired={1}
                          isLoggedIn={!!session?.user}
                          loadingLabel="Generating Quiz..."
                          label="Generate Quiz with AI"
                          className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
                          customStates={{
                            default: {
                              tooltip: "Click to generate your quiz",
                            },
                            notEnabled: {
                              label: "Complete form to generate",
                              tooltip: "Please upload a document before generating quiz questions",
                            },
                            noCredits: {
                              label: "Out of credits",
                              tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
                            },
                          }}
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                        </PlanAwareButton>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="h-fit">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {isEditing ? "Edit Questions" : "Generated Questions"}
                      </CardTitle>
                      <CardDescription>
                        {quiz.length} question{quiz.length !== 1 ? "s" : ""} ready
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {canSave && (
                        <>
                          <PDFDownloadButton questions={quiz} title={quizTitle} variant="secondary" size="sm" />
                          <Button onClick={() => handleSaveQuiz()} disabled={isSaving} size="sm" className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Quiz"}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[600px] overflow-y-auto">
                    {quiz.length > 0 && quiz[0].question ? (
                      <DocumentQuizDisplay questions={quiz} onSave={handleSaveQuiz} onUpdate={handleUpdateQuiz} />
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-2">
                            {isEditing ? "Loading quiz questions..." : "No quiz generated yet."}
                          </p>
                          {!isEditing && (
                            <p className="text-sm text-muted-foreground">
                              Upload a document and click "Generate Quiz" to get started.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="quiz-tab" value="quiz">
              <motion.div
                key="quiz-content"
                id="quiz-preview-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Quiz Preview
                      </CardTitle>
                      <CardDescription>Review your quiz before saving or sharing</CardDescription>
                    </div>
                    {canSave && (
                      <div className="flex gap-2">
                        <EnhancedPDFDownloadButton
                          questions={quiz}
                          title={quizTitle}
                          variant="outline"
                          size="default"
                        />
                        <Button onClick={() => handleSaveQuiz()} disabled={isSaving}>
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving ? "Saving..." : "Save Quiz"}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {canSave ? (
                      <div className="space-y-8">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
                        >
                          <h2 className="text-2xl font-bold mb-2">{quizTitle}</h2>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {quiz.length} {quiz.length === 1 ? "question" : "questions"}
                            </span>
                            {file && (
                              <span className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                From: {file.name}
                              </span>
                            )}
                          </div>
                        </motion.div>

                        <div className="space-y-6">
                          {quiz.map((question, index) => (
                            <motion.div
                              key={`preview-${question.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="border-2 hover:border-primary/30 transition-colors">
                                <CardHeader className="pb-4">
                                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
                                      {index + 1}
                                    </span>
                                    Question {index + 1}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-base mb-6 leading-relaxed">{question.question}</p>
                                  <div className="grid gap-3">
                                    {question.options.map((option, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className={`p-4 rounded-none border-2 transition-all ${
                                          optionIndex === question.correctAnswer
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                            : "border-gray-200 dark:border-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-sm font-medium">
                                            {String.fromCharCode(65 + optionIndex)}
                                          </span>
                                          <span className="flex-1">{option}</span>
                                          {optionIndex === question.correctAnswer && (
                                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                              Correct Answer
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Quiz to Preview</h3>
                        <p className="text-muted-foreground mb-6">Generate or create questions to see the preview.</p>
                        <Button variant="outline" onClick={() => setActiveTab("create")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Quiz
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {canSave && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setActiveTab("create")}>
                        Edit Questions
                      </Button>
                      <EnhancedPDFDownloadButton questions={quiz} title={quizTitle} variant="outline" size="default" />
                      <Button onClick={() => handleSaveQuiz()} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Quiz"}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="saved-tab" value="saved">
              <motion.div
                key="saved-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SavedQuizList
                  quizzes={Array.isArray(savedQuizzes) ? savedQuizzes : []}
                  onRefresh={loadSavedQuizzes}
                  onEditQuiz={handleEditQuiz}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Enhanced Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        {/* Increase max width and allow the content to take full width to avoid overflow issues on medium screens */}
        <DialogContent className="sm:max-w-xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  <Share2 className="h-5 w-5 text-green-600" />
                </motion.div>
                Quiz Saved Successfully!
              </DialogTitle>
              <DialogDescription>
                Your quiz "{quizTitle}" is now ready to share. Copy the link below or start playing immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Quiz Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                /* Force this row to span the available width so the right-side icon doesn't overflow */
                className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-none border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">{quizTitle}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {quiz.length} question{quiz.length !== 1 ? "s" : ""} ready
                    </p>
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-2xl"
                >
                  ✅
                </motion.div>
              </motion.div>

              {/* Share Link */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2 w-full"
              >
                <label className="text-sm font-medium text-muted-foreground">Share Link</label>
                <div className="flex items-center space-x-2 w-full">
                  {/* Make input flexible inside the flex row and allow it to truncate instead of pushing the button out */}
                  <Input
                    value={shareUrl}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 font-mono text-sm bg-muted/50"
                    aria-label="Quiz share link"
                  />
                  <Button onClick={copyShareLink} variant="secondary" size="sm">
                    <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-1">
                      📋 Copy
                    </motion.div>
                  </Button>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                /* Ensure buttons take the available width and wrap gracefully */
                className="w-full flex flex-col sm:flex-row gap-3"
              >
                <Button onClick={() => setShowShareDialog(false)} variant="outline" className="flex-1">
                  Close
                </Button>
                <PDFDownloadButton
                  questions={quiz}
                  title={quizTitle}
                  variant="outline"
                  size="default"
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    setShowShareDialog(false)
                    setActiveTab("saved")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Quizzes
                </Button>
                <Button
                  onClick={() => {
                    if (savedQuizId) {
                      window.open(`/dashboard/document/${savedQuizId}`, "_blank")
                    }
                  }}
                  className="flex-1"
                  disabled={!savedQuizId}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play Quiz
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
          // abort any in-flight generation request
          if (currentRequestControllerRef.current) {
            try {
              currentRequestControllerRef.current.abort('User cancelled request')
            } catch (err) {
              /* ignore */
            }
            currentRequestControllerRef.current = null
          }
        }}
        title="Generate Document Quiz"
        description="You are about to use AI to generate a quiz from your document. This will use credits from your account."
        confirmText="Generate Quiz Now"
        cancelText="Cancel"
        showCreditUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : undefined}
        errorMessage={submitError || undefined}
        creditUsage={confirmCreditUsage ?? {
          used: 0, // Not relevant for single credit deduction
          available: 1,
          remaining: 1,
          percentage: 100, // Always 100% for single credit
        }}
        quizInfo={{
          type: "Document Quiz",
          count: quizOptions.numberOfQuestions,
          topic: file?.name || "Uploaded document",
          difficulty: quizOptions.difficulty <= 33 ? "easy" : quizOptions.difficulty <= 66 ? "medium" : "hard",
          estimatedCredits: 1,
        }}
      >
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-none">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{file?.name}</p>
              <p className="text-sm text-muted-foreground">
                {quizOptions.numberOfQuestions} questions •{" "}
                {quizOptions.difficulty <= 33 ? "Easy" : quizOptions.difficulty <= 66 ? "Medium" : "Hard"} difficulty
              </p>
            </div>
          </div>
        </div>
      </ConfirmDialog>

      {/* ✅ Contextual Auth Prompt Modal */}
      <ContextualAuthPrompt
        {...authPrompt}
        onOpenChange={closeAuthPrompt}
      />

      {/* ✅ Contextual Upgrade Prompt Modal */}
      <ContextualUpgradePrompt
        {...promptState}
        onOpenChange={closePrompt}
      />
    </main>
  )
}
