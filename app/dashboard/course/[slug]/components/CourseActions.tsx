"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Heart,
  Share2,
  Star,
  Trash2,
  Loader2,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { useCourseActions } from "@/hooks/useCourseActions"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CourseActionsProps {
  slug: string
}

export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)

  const handleShare = async (type: "copy" | "twitter" | "facebook" | "linkedin") => {
    const url = `${window.location.origin}/course/${slug}`
    switch (type) {
      case "copy":
        await navigator.clipboard.writeText(url)
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank")
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
        break
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 flex-wrap p-3 border rounded-lg shadow-sm bg-background">
        {/* Privacy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleAction("privacy")}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={loading === "privacy"}
            >
              {loading === "privacy" ? <Loader2 className="h-5 w-5 animate-spin" /> : status.isPublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.isPublic ? "Make Private" : "Make Public"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Favorite */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleAction("favorite")}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-pink-500 text-white hover:bg-pink-600"
              disabled={loading === "favorite"}
            >
              {loading === "favorite" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className={cn("h-5 w-5", status.isFavorite && "fill-current")} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.isFavorite ? "Unfavorite" : "Favorite"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Share */}
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 flex items-center justify-center rounded-md bg-blue-500 text-white hover:bg-blue-600">
                  <Share2 className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleShare("copy")}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleShare("twitter")}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("facebook")}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>

        {/* Rate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowRating(!showRating)}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600"
            >
              <Star className={cn("h-5 w-5", status.rating && "fill-current")} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rate Course</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <AlertDialog>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <button className="w-10 h-10 flex items-center justify-center rounded-md bg-destructive text-white hover:bg-destructive/90">
                  <Trash2 className="h-5 w-5" />
                </button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your course and all its content.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction("delete")}
                  disabled={loading === "delete"}
                  className="bg-destructive text-white"
                >
                  {loading === "delete" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <TooltipContent>
            <p>Delete Course</p>
          </TooltipContent>
        </Tooltip>

        {/* Rating Stars Inline */}
        {showRating && (
          <div className="flex items-center gap-1 ml-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} onClick={() => handleRating(value)} className="p-1">
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors duration-150",
                    value <= (status.rating || 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground hover:text-amber-400"
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
