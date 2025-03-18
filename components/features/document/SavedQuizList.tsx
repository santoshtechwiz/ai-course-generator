"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Clock, FileText, Play, Share2, Pencil, Trash2 } from "lucide-react"
import { type Quiz, quizStore } from "@/lib/quiz-store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SavedQuizListProps {
  quizzes: Quiz[]
  onRefresh: () => void
  onEditQuiz: (quiz: Quiz) => void
}

export function SavedQuizList({ quizzes, onRefresh, onEditQuiz }: SavedQuizListProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const handlePlayQuiz = (quizId: string) => {
    router.push(`/play/${quizId}`)
  }

  const handleEditQuiz = (quiz: Quiz) => {
    onEditQuiz(quiz)
  }

  const handleShareQuiz = (quizId: string) => {
    setSelectedQuizId(quizId)
    setShowShareDialog(true)
  }

  const handleDeleteQuiz = (quizId: string) => {
    setSelectedQuizId(quizId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteQuiz = () => {
    if (selectedQuizId) {
      quizStore.deleteQuiz(selectedQuizId)
      onRefresh()
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been permanently deleted.",
      })
      setShowDeleteDialog(false)
    }
  }

  const getShareUrl = () => {
    if (!selectedQuizId) return ""
    return `${window.location.origin}/play/${selectedQuizId}`
  }

  const copyShareLink = () => {
    const url = getShareUrl()
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Quiz link has been copied to clipboard",
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (quizzes.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="truncate">{quiz.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditQuiz(quiz)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareQuiz(quiz.id)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteQuiz(quiz.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="mr-1 h-4 w-4" />
                  {quiz.questions.length} questions
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  Created {formatDate(quiz.createdAt)}
                </div>
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button onClick={() => handlePlayQuiz(quiz.id)} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Play Quiz
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Quiz</DialogTitle>
            <DialogDescription>Share this link with others so they can take your quiz.</DialogDescription>
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
            <Button onClick={() => selectedQuizId && handlePlayQuiz(selectedQuizId)}>Play Quiz</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuiz} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

