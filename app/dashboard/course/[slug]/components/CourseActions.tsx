"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Heart,
  Share2,
  MoreVertical,
  Globe,
  Lock,
  Trash2,
  Star,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"
import { useAuth } from "@/modules/auth"
import { toast } from "sonner"

interface CourseActionsProps {
  slug: string
  title: string
  isOwner: boolean
  className?: string
  variant?: "default" | "compact"
}

export default function CourseActions({
  slug,
  title,
  isOwner,
  className = "",
  variant = "default"
}: CourseActionsProps) {
  const { isAuthenticated } = useAuth()
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/dashboard/course/${slug}`
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this course: ${title}`,
          url: shareUrl,
        })
        toast.success("Course shared successfully!")
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Course link copied to clipboard!")
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error)
        toast.error("Failed to share course")
      }
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to favorite courses")
      return
    }
    handleAction("favorite")
  }

  const handlePrivacyToggle = () => {
    if (!isOwner) {
      toast.error("You don't have permission to change course privacy")
      return
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to manage course settings")
      return
    }
    handleAction("privacy")
  }

  const handleDelete = () => {
    if (!isOwner) {
      toast.error("You don't have permission to delete this course")
      return
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to delete courses")
      return
    }
    // Confirmation dialog is handled in the AlertDialog component
    handleAction("delete")
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-1"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Favorite Button (for authenticated users) */}
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            disabled={loading === "favorite"}
            className={cn(
              "flex items-center gap-1",
              status.isFavorite && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            )}
          >
            {loading === "favorite" ? (
              <Loader2 className="h-4 w-4" />
            ) : (
              <Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />
            )}
            <span className="hidden sm:inline">
              {status.isFavorite ? "Favorited" : "Favorite"}
            </span>
          </Button>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrivacyToggle} disabled={loading === "privacy"}>
                {loading === "privacy" ? (
                  <Loader2 className="h-4 w-4 mr-2" />
                ) : status.isPublic ? (
                  <Lock className="h-4 w-4 mr-2" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Make {status.isPublic ? "Private" : "Public"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    disabled={loading === "delete"}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    {loading === "delete" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Course
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{title}"? This action cannot be undone and will permanently remove all course content, chapters, and progress data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={loading === "delete"}
                      className="bg-destructive hover:bg-destructive/80"
                    >
                      {loading === "delete" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Course"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Course Status Badge */}
            <Badge variant={status.isPublic ? "default" : "secondary"}>
              {status.isPublic ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>

            {/* Rating Display */}
            {status.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span className="text-sm font-medium">{status.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share Button */}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            {/* Favorite Button (for authenticated users) */}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoriteToggle}
                disabled={loading === "favorite"}
                className={cn(
                  status.isFavorite && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                )}
              >
                {loading === "favorite" ? (
                  <Loader2 className="h-4 w-4 mr-2" />
                ) : (
                  <Heart className={cn("h-4 w-4 mr-2", status.isFavorite && "fill-current")} />
                )}
                {status.isFavorite ? "Favorited" : "Favorite"}
              </Button>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrivacyToggle} disabled={loading === "privacy"}>
                    {loading === "privacy" ? (
                      <Loader2 className="h-4 w-4 mr-2" />
                    ) : status.isPublic ? (
                      <Lock className="h-4 w-4 mr-2" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Make {status.isPublic ? "Private" : "Public"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        disabled={loading === "delete"}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        {loading === "delete" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Course
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{title}"? This action cannot be undone and will permanently remove all course content, chapters, and progress data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={loading === "delete"}
                          className="bg-destructive hover:bg-destructive/80"
                        >
                          {loading === "delete" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Course"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
