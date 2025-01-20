'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QuizActionsProps {
  quizId: string;
  quizSlug: string;
  initialIsPublic: boolean;
  initialIsFavorite: boolean;
}

export function QuizActions({ quizId, quizSlug, initialIsPublic, initialIsFavorite }: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const router = useRouter()

  const updateQuiz = async (data: { isPublic?: boolean; isFavorite?: boolean }) => {
    try {
      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const updatedQuiz = await response.json()
        setIsPublic(updatedQuiz.isPublic)
        setIsFavorite(updatedQuiz.isFavorite)
        toast({
          title: "Quiz updated",
          variant: "success",
          description: "Your quiz has been successfully updated.",
        })
      } else {
        throw new Error('Failed to update quiz')
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
      toast({
        title: "Error",
        description: "Failed to update quiz. Please try again.",
        variant: "danger",
      })
    }
  }

  const togglePublic = () => updateQuiz({ isPublic: !isPublic })
  const toggleFavorite = () => updateQuiz({ isFavorite: !isFavorite })

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        toast({
          title: "Quiz deleted",
          description: "Your quiz has been successfully deleted.",
        })
        router.push('/dashboard/quizzes')
      } else {
        throw new Error('Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-3 p-4 rounded-lg shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPublic ? "secondary" : "outline"}
              size="sm"
              onClick={togglePublic}
              className="transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-primary"
            >
              {isPublic ? (
                <Eye className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
              )}
              <span className="font-medium">{isPublic ? "Public" : "Private"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPublic ? "Make quiz private" : "Make quiz public"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFavorite ? "secondary" : "outline"}
              size="sm"
              onClick={toggleFavorite}
              className="transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-primary"
            >
              <Star className={`mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110 ${isFavorite ? "fill-current text-primary" : ""}`} />
              <span className="font-medium">{isFavorite ? "Favorited" : "Favorite"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            className="transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <span className="font-medium">Delete</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your quiz and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="transition-all duration-300 ease-in-out hover:bg-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="hover:bg-destructive/90 transition-all duration-300 ease-in-out"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

