"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, FileText, Sparkles, Download, Share2, Play } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Quiz, quizStore } from "@/lib/quiz-store"
import { useQuizPlan } from "@/modules/auth"
import { ConfirmDialog } from "../components/ConfirmDialog"
import PlanAwareButton from "../components/PlanAwareButton"

import { DocumentQuizOptions } from "./components/DocumentQuizOptions"
import { FileUpload } from "./components/FileUpload"
import { SavedQuizList } from "./components/SavedQuizList"
import DocumentQuizDisplay from "./components/DocumentQuizDisplay"
import { PDFDownloadButton } from "./components/DocumentQuizPdf"

interface QuizOptionsType {
  numberOfQuestions: number
  difficulty: number
}

interface LocalQuestion {
  id: string
  question: string
  options: string[]
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

  const { data: session } = useSession()
  const quizPlan = useQuizPlan()

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
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a document first.",
        variant: "destructive",
      })
      return
    }
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

    try {
      const response = await fetch("/api/document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const quizData: LocalQuestion[] = (await response.json()).map((q: any, index: number) => ({
        id: q.id ?? `generated-${index}`,
        question: String(q.question ?? ""),
        options: Array.isArray(q.options) ? q.options.map((o: string) => String(o)) : [],
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      }))

      setQuiz(quizData)

      // Close the confirm dialog first
      setIsConfirmDialogOpen(false)

      toast({
        title: "Quiz Generated Successfully! ✨",
        description: `Generated ${quizData.length} questions from your document. You can now edit and save the quiz.`,
      })

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
                          hasCredits={(session?.user?.credits ?? 0) > 0}
                          isLoggedIn={!!session?.user}
                          loadingLabel="Generating Quiz..."
                          label="Generate Quiz with AI"
                          className="w-full h-14 text-base font-medium transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-primary to-primary/80"
                          customStates={{
                            default: {
                              tooltip: "Generate quiz questions from your document",
                            },
                            notEnabled: {
                              label: "Upload a document first",
                              tooltip: "Please upload a document before generating quiz questions",
                            },
                            noCredits: {
                              label: "Out of credits - Upgrade needed",
                              tooltip: "You need credits to generate quiz questions. Consider upgrading your plan.",
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
                          <PDFDownloadButton questions={quiz} title={quizTitle} variant="ghost" size="sm" />
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
                                        className={`p-4 rounded-lg border-2 transition-all ${
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
        <DialogContent className="sm:max-w-lg">
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
                className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
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
                className="space-y-2"
              >
                <label className="text-sm font-medium text-muted-foreground">Share Link</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                    className="font-mono text-sm bg-muted/50"
                    aria-label="Quiz share link"
                  />
                  <Button onClick={copyShareLink} variant="secondary" size="sm" className="shrink-0">
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
                className="flex flex-col sm:flex-row gap-3"
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
        }}
        title="Generate Document Quiz"
        description="You are about to use AI to generate a quiz from your document. This will use credits from your account."
        confirmText="Generate Quiz Now"
        cancelText="Cancel"
        showTokenUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : null}
        errorMessage={submitError || undefined}
        tokenUsage={{
          used: Math.max(0, quizPlan.maxQuestions - quizPlan.credits),
          available: quizPlan.maxQuestions,
          remaining: quizPlan.credits,
          percentage: (Math.max(0, quizPlan.maxQuestions - quizPlan.credits) / quizPlan.maxQuestions) * 100,
        }}
        quizInfo={{
          type: "Document Quiz",
          count: quizOptions.numberOfQuestions,
          topic: file?.name || "Uploaded document",
          difficulty: quizOptions.difficulty <= 33 ? "easy" : quizOptions.difficulty <= 66 ? "medium" : "hard",
          estimatedTokens: Math.min(quizOptions.numberOfQuestions || 1, 5) * 100 + (file?.size || 0) / 100,
        }}
      >
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
    </main>
  )
}
