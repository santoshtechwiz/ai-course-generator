"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { DocumentQuizDisplay } from "@/components/features/document/DocumentQuizDisplay"
import { DocumentQuizOptions } from "@/components/features/document/DocumentQuizOptions"
import { FileUpload } from "@/components/features/document/FileUpload"


// Import the quiz store
import { quizStore, type Quiz } from "@/lib/quiz-store"
import { SavedQuizList } from "@/components/features/document/SavedQuizList"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizOptionsType {
  numberOfQuestions: number
  difficulty: number
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOptionsType>({
    numberOfQuestions: 5,
    difficulty: 50,
  })
  const [quiz, setQuiz] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([])
  const [quizTitle, setQuizTitle] = useState("New Quiz")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  // Load saved quizzes on component mount
  const loadSavedQuizzes = () => {
    const loadedQuizzes = quizStore.getAllQuizzes()
    setSavedQuizzes(loadedQuizzes)
  }

  useEffect(() => {
    loadSavedQuizzes()
  }, [])

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

  const handleSaveQuiz = async (questions: Question[]) => {
    try {
      // First save to your API
      const response = await fetch("/api/save-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quiz: questions }),
      })

      if (!response.ok) {
        throw new Error("Failed to save quiz")
      }

      // Then save to local storage
      let savedQuiz: Quiz

      if (isEditing && editingQuizId) {
        // Update existing quiz
        const updatedQuiz = quizStore.updateQuiz(editingQuizId, {
          title: quizTitle,
          questions: questions,
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
        savedQuiz = quizStore.saveQuiz(quizTitle, questions)
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">{isEditing ? "Edit Quiz" : "Create Quiz"}</TabsTrigger>
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
                    <Button onClick={handleGenerateQuiz} disabled={!file || isLoading} className="w-full">
                      {isLoading ? "Generating..." : "Generate Quiz"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? "Edit Questions" : "Generated Quiz"}</CardTitle>
              </CardHeader>
              <CardContent>
                {quiz.length > 0 ? (
                  <DocumentQuizDisplay
                    questions={quiz}
                    onSave={handleSaveQuiz}
                    onUpdate={handleUpdateQuiz}
                    title={quizTitle}
                  />
                ) : (
                  <p className="text-center text-muted-foreground">
                    {isEditing ? "Loading quiz questions..." : "No quiz generated yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
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

