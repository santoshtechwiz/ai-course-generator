"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import {
  Clock,
  FileText,
  Play,
  Share2,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  LayoutDashboard,
  Filter,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Quiz } from "@/hooks/useRandomQuizzes"

interface SavedQuizListProps {
  quizzes: Quiz[]
  onRefresh: () => void
  onEditQuiz: (quiz: Quiz) => void
}

type SortOption = "newest" | "oldest" | "a-z" | "z-a" | "questions"

export function SavedQuizList({ quizzes, onRefresh, onEditQuiz }: SavedQuizListProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>(quizzes)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()

  // Filter and sort quizzes when dependencies change
  useEffect(() => {
    let result = [...quizzes]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery?.toLowerCase()
      result = result.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(query) ||
          quiz.questions.some((q) => q.question?.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case "oldest":
        result.sort((a, b) => a.createdAt - b.createdAt)
        break
      case "a-z":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "z-a":
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "questions":
        result.sort((a, b) => b.questions.length - a.questions.length)
        break
    }

    setFilteredQuizzes(result)
  }, [quizzes, searchQuery, sortOption])

  const handlePlayQuiz = (quizId: string) => {
    router.push(`/dashboard/document/${quizId}`)
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
    return `${window.location.origin}/dashboard/document/${selectedQuizId}`
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

  const navigateToDashboard = () => {
    router.push("/dashboard/document")
  }

  const getSelectedQuiz = () => {
    return quizzes.find((quiz) => quiz.id === selectedQuizId)
  }

  if (quizzes.length === 0) {
    return null
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigateToDashboard} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Badge variant="outline" className="ml-2">
              {filteredQuizzes.length} {filteredQuizzes.length === 1 ? "quiz" : "quizzes"}
            </Badge>
          </div>

          <div className="flex flex-1 sm:max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-[130px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="z-a">Z-A</SelectItem>
                <SelectItem value="questions">Most Questions</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
              <TabsList className="grid w-[80px] grid-cols-2">
                <TabsTrigger value="grid" className="px-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </TabsTrigger>
                <TabsTrigger value="list" className="px-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No matching quizzes</h3>
            <p className="text-muted-foreground text-center mt-1">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setSortOption("newest")
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="group overflow-hidden transition-all hover:shadow-md">
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
                      <DropdownMenuItem onClick={() => handlePlayQuiz(quiz.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        Play Quiz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditQuiz(quiz)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareQuiz(quiz.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
                    {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    Created {formatDate(quiz.createdAt)}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {quiz.questions[0]?.question || "No questions available"}
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button onClick={() => handlePlayQuiz(quiz.id)} className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Play Quiz
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{quiz.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-1 h-4 w-4" />
                      {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
                    </span>
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {formatDate(quiz.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    {quiz.questions[0]?.question || "No questions available"}
                  </p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)}>
                    <Pencil className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShareQuiz(quiz.id)}>
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button size="sm" onClick={() => handlePlayQuiz(quiz.id)}>
                    <Play className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Play</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Quiz</DialogTitle>
            <DialogDescription>
              Share this link with others so they can take your quiz "{getSelectedQuiz()?.title}".
            </DialogDescription>
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
              This action cannot be undone. This will permanently delete the quiz "{getSelectedQuiz()?.title}" and all
              associated data.
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
