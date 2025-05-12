"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { SUBSCRIPTION_PLANS } from "../../subscription/components/subscription-plans"
import { DocumentQuizOptions } from "./components/DocumentQuizOptions"
import { FileUpload } from "./components/FileUpload"
import { SavedQuizList } from "./components/SavedQuizList"
import PlanAwareButton from "../components/PlanAwareButton"
import type { Question, Quiz } from "@/lib/quiz-store"
import useSubscription from "@/hooks/use-subscription" // Updated import

interface QuizOptionsType {
  numberOfQuestions: number
  difficulty: number
}

export default function DocumentQuizPage() {
  const [file, setFile] = useState<File | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOptionsType>({
    numberOfQuestions: 5,
    difficulty: 50,
  })
  const [quiz, setQuiz] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([])
  const [quizTitle, setQuizTitle] = useState("New Quiz")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const { subscription, fetchStatus } = useSubscription() // Updated hook usage
  const { data: session, status } = useSession()

  const subscriptionPlan = subscription?.plan || "FREE" // Updated to use subscription hook
  const plan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionPlan)

  // Load saved quizzes on component mount
  const loadSavedQuizzes = () => {
    try {
      const loadedQuizzes = quizStore.getAllQuizzes()
      setSavedQuizzes(loadedQuizzes)
    } catch (error) {
      console.error("Error loading quizzes:", error)
      toast({
        title: "Error",
        description: "Failed to load saved quizzes. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadSavedQuizzes()
  }, [])

  useEffect(() => {
    fetchStatus() // Fetch subscription status on mount
  }, [fetchStatus])

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
  }

  const handleOptionsChange = (options: QuizOptionsType) => {
    setQuizOptions(options)
    // If the title is passed from DocumentQuizOptions, update it
    if ("title" in options) {
      setQuizTitle((options as any).title || "New Quiz")
    }
  }

  const handleGenerateQuiz = async () => {
    if (!file) return

    setIsLoading(true)

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

      const quizData = await response.json()
      setQuiz(quizData.map((q: any, index: number) => ({ ...q, id: `generated-${index}` })))
      toast({
        title: "Quiz Generated",
        description: "Your quiz has been successfully generated. You can now edit the questions.",
      })

      // Switch to the quiz tab after generation
      setActiveTab("quiz")
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (quiz.length === 0) {
      toast({
        title: "No Questions",
        description: "Please generate or add questions before saving the quiz.",
        variant: "destructive",
      })
      return
    }

    // Validate questions
    const invalidQuestions = quiz.filter(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || q.options.length < 2,
    )

    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions",
        description: "All questions must have a question text and at least 2 non-empty options.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Save directly to local storage without API call
      let savedQuiz: Quiz

      if (isEditing && editingQuizId) {
        // Update existing quiz
        const updatedQuiz = quizStore.updateQuiz(editingQuizId, {
          title: quizTitle,
          questions: quiz,
        })

        if (!updatedQuiz) {
          throw new Error("Failed to update quiz")
        }

        savedQuiz = updatedQuiz
        toast({
          title: "Quiz Updated",
          description: "Your quiz has been successfully updated.",
        })
      } else {
        // Create new quiz
        savedQuiz = quizStore.saveQuiz(quizTitle, quiz)
        toast({
          title: "Quiz Saved",
          description: "Your quiz has been successfully saved and can be shared.",
        })
      }

      setSavedQuizId(savedQuiz.id)

      // Refresh the saved quizzes list
      loadSavedQuizzes()

      // Show the share dialog
      setShowShareDialog(true)

      // Reset editing state
      setIsEditing(false)
      setEditingQuizId(null)
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateQuiz = (updatedQuestions: Question[]) => {
    setQuiz(updatedQuestions)
  }

  const handleEditQuiz = (quizToEdit: Quiz) => {
    // Set the quiz data for editing
    setQuiz(quizToEdit.questions)
    setQuizTitle(quizToEdit.title)
    setIsEditing(true)
    setEditingQuizId(quizToEdit.id)

    // Switch to the create tab to edit
    setActiveTab("create")

    toast({
      title: "Editing Quiz",
      description: `You are now editing "${quizToEdit.title}". Save to update the quiz.`,
    })
  }

  const getShareUrl = () => {
    if (!savedQuizId) return ""
    return `${window.location.origin}/dashboard/document/${savedQuizId}`
  }

  const copyShareLink = () => {
    const url = getShareUrl()
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Quiz link has been copied to clipboard",
    })
  }

  const handleCreateNewQuiz = () => {
    // Reset all editing state
    setQuiz([])
    setQuizTitle("New Quiz")
    setFile(null)
    setIsEditing(false)
    setEditingQuizId(null)
    setActiveTab("create")
  }

  return (
    <main className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">{isEditing ? "Edit Quiz" : "Create Quiz"}</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Preview</TabsTrigger>
          <TabsTrigger value="saved">My Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? "Edit Quiz" : "Quiz Configuration"}</CardTitle>
                {isEditing && (
                  <CardDescription>You are editing an existing quiz. Save your changes when done.</CardDescription>
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
                    placeholder="Enter quiz title"
                  />
                </div>
                {!isEditing && (
                  <>
                    <FileUpload onFileSelect={handleFileSelect} />
                    <DocumentQuizOptions onOptionsChange={handleOptionsChange} />
                    <PlanAwareButton
                      onClick={handleGenerateQuiz}
                      disabled={isLoading}
                      hasCredits={(session?.user?.credits ?? 0) > 0}
                      isLoggedIn={!!session?.user}
                      loadingLabel="Processing..."
                      label="Generate Quiz"
                      className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-lg"
                      customStates={{
                        default: {
                          tooltip: "Click to generate your flashcards",
                        },
                        notEnabled: {
                          label: "Enter a topic to generate",
                          tooltip: "Please enter a topic before generating flashcards",
                        },
                        noCredits: {
                          label: "Out of credits",
                          tooltip: "You need credits to generate flashcards. Consider upgrading your plan.",
                        },
                      }}
                    ></PlanAwareButton>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{isEditing ? "Edit Questions" : "Generated Quiz"}</CardTitle>
                {quiz.length > 0 && (
                  <Button onClick={handleSaveQuiz} disabled={isSaving} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Quiz"}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {quiz.length > 0 ? (
                  <div className="space-y-4">
                    {quiz.map((question, index) => (
                      <Card key={question.id} className="border-muted">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium">Question {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2">{question.question}</p>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-md border ${
                                  optionIndex === question.correctAnswer
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 dark:border-gray-700"
                                }`}
                              >
                                {option}
                                {optionIndex === question.correctAnswer && (
                                  <span className="ml-2 text-xs text-green-600">(Correct)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleSaveQuiz} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Quiz"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    {isEditing ? "Loading quiz questions..." : "No quiz generated yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quiz Preview</CardTitle>
                <CardDescription>Review your quiz before saving</CardDescription>
              </div>
              {quiz.length > 0 && (
                <Button onClick={handleSaveQuiz} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Quiz"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {quiz.length > 0 ? (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h2 className="text-xl font-bold mb-2">{quizTitle}</h2>
                    <p className="text-sm text-muted-foreground">
                      {quiz.length} {quiz.length === 1 ? "question" : "questions"}
                    </p>
                  </div>

                  {quiz.map((question, index) => (
                    <Card key={question.id} className="border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Question {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-md border ${
                                optionIndex === question.correctAnswer
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              {option}
                              {optionIndex === question.correctAnswer && (
                                <span className="ml-2 text-xs text-green-600">(Correct)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No quiz generated yet.</p>
                  <Button variant="outline" onClick={() => setActiveTab("create")} className="mt-4">
                    Go to Create Quiz
                  </Button>
                </div>
              )}
            </CardContent>
            {quiz.length > 0 && (
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveQuiz} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Quiz"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          {savedQuizzes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Quizzes Found</CardTitle>
                <CardDescription>
                  You haven't created any quizzes yet. Generate and save a quiz to get started.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleCreateNewQuiz}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Saved Quizzes</h2>
                <Button onClick={handleCreateNewQuiz}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Quiz
                </Button>
              </div>
              <SavedQuizList quizzes={savedQuizzes} onRefresh={loadSavedQuizzes} onEditQuiz={handleEditQuiz} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Quiz</DialogTitle>
            <DialogDescription>Your quiz has been saved. Share the link below or start playing.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <Input value={getShareUrl()} readOnly onClick={(e) => e.currentTarget.select()} />
            <Button onClick={copyShareLink} variant="secondary">
              Copy
            </Button>
          </div>

          <div className="flex justify-between mt-4">
            <Button onClick={() => setShowShareDialog(false)} variant="outline">
              Close
            </Button>
            <Button
              onClick={() => {
                setShowShareDialog(false)
                setActiveTab("saved")
              }}
            >
              View All Quizzes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
